// Vehicle Animation System - Hyper-accurate transit simulation
// Based on real-world Lahore Metro Bus and Orange Line specifications

export interface TrackPoint {
  lat: number;
  lng: number;
  cumulativeDistance: number; // meters from start
}

export interface StationInfo {
  name: string;
  lat: number;
  lng: number;
  distanceFromStart: number; // meters
  isTerminal: boolean;
}

export interface Vehicle {
  id: string;
  type: 'metro-bus' | 'orange-line';
  direction: 'outbound' | 'inbound';
  departureTime: number; // timestamp when left terminal
  currentPosition: { lat: number; lng: number };
  currentSpeed: number; // km/h
  distanceTraveled: number; // meters
  isAtStation: boolean;
  currentStationIndex: number;
  stationArrivalTime: number | null;
  bearing: number; // direction in degrees
}

export interface TransitConfig {
  routeLength: number; // km
  maxSpeed: number; // km/h
  avgSpeed: number; // km/h
  accelerationDistance: number; // meters to reach max speed
  decelerationDistance: number; // meters to slow down for station
  dwellTime: number; // seconds at each station
  terminalDwellTime: number; // seconds at terminal stations
  peakFrequency: number; // seconds between departures
  offPeakFrequency: number; // seconds between departures
}

// Real-world specifications
export const METRO_BUS_CONFIG: TransitConfig = {
  routeLength: 27, // km
  maxSpeed: 40, // km/h (speed limit, not max design speed)
  avgSpeed: 26, // km/h
  accelerationDistance: 150, // meters
  decelerationDistance: 200, // meters
  dwellTime: 25, // seconds
  terminalDwellTime: 120, // 2 minutes at terminals
  peakFrequency: 120, // 2 minutes
  offPeakFrequency: 420, // 7 minutes
};

export const ORANGE_LINE_CONFIG: TransitConfig = {
  routeLength: 27.1, // km
  maxSpeed: 80, // km/h
  avgSpeed: 36, // km/h (27.1km in 45 min)
  accelerationDistance: 300, // meters (trains accelerate faster)
  decelerationDistance: 400, // meters
  dwellTime: 35, // seconds
  terminalDwellTime: 180, // 3 minutes at terminals
  peakFrequency: 300, // 5 minutes
  offPeakFrequency: 600, // 10 minutes
};

// Calculate cumulative distances along a track
export function calculateTrackDistances(
  coordinates: [number, number][]
): TrackPoint[] {
  const points: TrackPoint[] = [];
  let cumulative = 0;

  coordinates.forEach((coord, i) => {
    if (i > 0) {
      cumulative += getDistanceMeters(
        coordinates[i - 1][0],
        coordinates[i - 1][1],
        coord[0],
        coord[1]
      );
    }
    points.push({
      lat: coord[0],
      lng: coord[1],
      cumulativeDistance: cumulative,
    });
  });

  return points;
}

// Calculate station distances along track
export function calculateStationDistances(
  stations: { name: string; lat: number; lng: number; isTerminal?: boolean }[],
  trackPoints: TrackPoint[]
): StationInfo[] {
  return stations.map((station) => {
    // Find nearest track point
    let minDist = Infinity;
    let nearestDist = 0;

    trackPoints.forEach((tp) => {
      const dist = getDistanceMeters(station.lat, station.lng, tp.lat, tp.lng);
      if (dist < minDist) {
        minDist = dist;
        nearestDist = tp.cumulativeDistance;
      }
    });

    return {
      name: station.name,
      lat: station.lat,
      lng: station.lng,
      distanceFromStart: nearestDist,
      isTerminal: station.isTerminal || false,
    };
  });
}

// Get position along track at a given distance
export function getPositionAtDistance(
  distance: number,
  trackPoints: TrackPoint[]
): { lat: number; lng: number; bearing: number } {
  if (distance <= 0) {
    return {
      lat: trackPoints[0].lat,
      lng: trackPoints[0].lng,
      bearing: calculateBearing(
        trackPoints[0].lat,
        trackPoints[0].lng,
        trackPoints[1]?.lat || trackPoints[0].lat,
        trackPoints[1]?.lng || trackPoints[0].lng
      ),
    };
  }

  const totalLength = trackPoints[trackPoints.length - 1].cumulativeDistance;
  if (distance >= totalLength) {
    const last = trackPoints[trackPoints.length - 1];
    const secondLast = trackPoints[trackPoints.length - 2] || last;
    return {
      lat: last.lat,
      lng: last.lng,
      bearing: calculateBearing(secondLast.lat, secondLast.lng, last.lat, last.lng),
    };
  }

  // Find segment containing this distance
  for (let i = 1; i < trackPoints.length; i++) {
    if (trackPoints[i].cumulativeDistance >= distance) {
      const prev = trackPoints[i - 1];
      const curr = trackPoints[i];
      const segmentLength = curr.cumulativeDistance - prev.cumulativeDistance;
      const t = (distance - prev.cumulativeDistance) / segmentLength;

      return {
        lat: prev.lat + t * (curr.lat - prev.lat),
        lng: prev.lng + t * (curr.lng - prev.lng),
        bearing: calculateBearing(prev.lat, prev.lng, curr.lat, curr.lng),
      };
    }
  }

  const last = trackPoints[trackPoints.length - 1];
  return { lat: last.lat, lng: last.lng, bearing: 0 };
}

// Calculate speed at a given distance (accounting for stations)
export function calculateSpeedAtDistance(
  distance: number,
  stations: StationInfo[],
  config: TransitConfig,
  direction: 'outbound' | 'inbound',
  totalLength: number
): number {
  const actualDistance = direction === 'outbound' ? distance : totalLength - distance;

  // Find nearby stations
  for (const station of stations) {
    const stationDist = direction === 'outbound'
      ? station.distanceFromStart
      : totalLength - station.distanceFromStart;

    const distToStation = Math.abs(actualDistance - stationDist);

    // Approaching station - decelerate
    if (actualDistance < stationDist && distToStation < config.decelerationDistance) {
      const t = distToStation / config.decelerationDistance;
      return config.maxSpeed * (0.2 + 0.8 * t); // Slow to 20% of max
    }

    // Leaving station - accelerate
    if (actualDistance > stationDist && distToStation < config.accelerationDistance) {
      const t = distToStation / config.accelerationDistance;
      return config.maxSpeed * (0.2 + 0.8 * t); // Speed up from 20%
    }

    // At station
    if (distToStation < 30) {
      return 0;
    }
  }

  return config.maxSpeed;
}

// Main simulation: update vehicle position based on elapsed time
export function updateVehiclePosition(
  vehicle: Vehicle,
  stations: StationInfo[],
  trackPoints: TrackPoint[],
  config: TransitConfig,
  currentTime: number
): Vehicle {
  const totalLength = trackPoints[trackPoints.length - 1].cumulativeDistance;
  const elapsedSeconds = (currentTime - vehicle.departureTime) / 1000;

  // Check if at station
  if (vehicle.isAtStation && vehicle.stationArrivalTime) {
    const dwellElapsed = (currentTime - vehicle.stationArrivalTime) / 1000;
    const currentStation = stations[vehicle.currentStationIndex];
    const requiredDwell = currentStation?.isTerminal
      ? config.terminalDwellTime
      : config.dwellTime;

    if (dwellElapsed < requiredDwell) {
      // Still dwelling at station
      return vehicle;
    } else {
      // Done dwelling, resume travel
      vehicle.isAtStation = false;
      vehicle.stationArrivalTime = null;
      vehicle.currentStationIndex++;
    }
  }

  // Calculate distance traveled
  // Use average speed for simplicity, adjusted by time
  const avgSpeedMps = (config.avgSpeed * 1000) / 3600; // m/s

  // Account for station stops already made
  const stationsVisited = vehicle.currentStationIndex;
  const dwellTimeTotal = stationsVisited * config.dwellTime;
  const actualTravelTime = elapsedSeconds - dwellTimeTotal;

  if (actualTravelTime < 0) {
    return vehicle;
  }

  const newDistance = actualTravelTime * avgSpeedMps;
  const actualDistance = vehicle.direction === 'outbound'
    ? newDistance
    : totalLength - newDistance;

  // Check if reached end
  if (vehicle.direction === 'outbound' && newDistance >= totalLength) {
    vehicle.distanceTraveled = totalLength;
    const pos = getPositionAtDistance(totalLength, trackPoints);
    vehicle.currentPosition = { lat: pos.lat, lng: pos.lng };
    vehicle.bearing = pos.bearing;
    vehicle.currentSpeed = 0;
    return vehicle;
  }

  if (vehicle.direction === 'inbound' && newDistance >= totalLength) {
    vehicle.distanceTraveled = totalLength;
    const pos = getPositionAtDistance(0, trackPoints);
    vehicle.currentPosition = { lat: pos.lat, lng: pos.lng };
    vehicle.bearing = pos.bearing + 180;
    vehicle.currentSpeed = 0;
    return vehicle;
  }

  // Check if arriving at next station
  const nextStationIndex = vehicle.currentStationIndex;
  if (nextStationIndex < stations.length) {
    const nextStation = stations[
      vehicle.direction === 'outbound'
        ? nextStationIndex
        : stations.length - 1 - nextStationIndex
    ];

    const stationDist = vehicle.direction === 'outbound'
      ? nextStation.distanceFromStart
      : totalLength - nextStation.distanceFromStart;

    if (Math.abs(newDistance - stationDist) < 30) {
      // Arrived at station
      vehicle.isAtStation = true;
      vehicle.stationArrivalTime = currentTime;
      vehicle.distanceTraveled = stationDist;
      vehicle.currentPosition = { lat: nextStation.lat, lng: nextStation.lng };
      vehicle.currentSpeed = 0;
      return vehicle;
    }
  }

  // Normal travel - get position
  const posDistance = vehicle.direction === 'outbound' ? newDistance : totalLength - newDistance;
  const pos = getPositionAtDistance(
    Math.max(0, Math.min(posDistance, totalLength)),
    trackPoints
  );

  vehicle.distanceTraveled = newDistance;
  vehicle.currentPosition = { lat: pos.lat, lng: pos.lng };
  vehicle.bearing = vehicle.direction === 'inbound' ? (pos.bearing + 180) % 360 : pos.bearing;
  vehicle.currentSpeed = calculateSpeedAtDistance(
    newDistance,
    stations,
    config,
    vehicle.direction,
    totalLength
  );

  return vehicle;
}

// Spawn vehicles based on frequency
export function shouldSpawnVehicle(
  lastSpawnTime: number,
  currentTime: number,
  config: TransitConfig
): boolean {
  const hour = new Date(currentTime).getHours();
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  const frequency = isPeakHour ? config.peakFrequency : config.offPeakFrequency;

  return (currentTime - lastSpawnTime) >= frequency * 1000;
}

// Create a new vehicle
export function createVehicle(
  type: 'metro-bus' | 'orange-line',
  direction: 'outbound' | 'inbound',
  trackPoints: TrackPoint[],
  currentTime: number
): Vehicle {
  const totalLength = trackPoints[trackPoints.length - 1].cumulativeDistance;
  const startPos = direction === 'outbound'
    ? getPositionAtDistance(0, trackPoints)
    : getPositionAtDistance(totalLength, trackPoints);

  return {
    id: `${type}-${direction}-${currentTime}`,
    type,
    direction,
    departureTime: currentTime,
    currentPosition: { lat: startPos.lat, lng: startPos.lng },
    currentSpeed: 0,
    distanceTraveled: 0,
    isAtStation: true, // Start at terminal
    currentStationIndex: 0,
    stationArrivalTime: currentTime - 60000, // Pretend arrived 1 min ago
    bearing: direction === 'outbound' ? startPos.bearing : (startPos.bearing + 180) % 360,
  };
}

// Utility: Haversine distance in meters
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Utility: Calculate bearing between two points
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
