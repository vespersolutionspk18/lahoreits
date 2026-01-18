'use client';

import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { roadNetwork, Road } from '@/lib/data/road-network';

// Traffic level colors - smooth gradient from green through blue to red
const TRAFFIC_COLORS = {
  0: '#00ff88',   // Free flow - bright green
  1: '#22c55e',   // Very light - green
  2: '#10b981',   // Light - teal green
  3: '#14b8a6',   // Light-moderate - teal
  4: '#06b6d4',   // Moderate-light - cyan
  5: '#0ea5e9',   // Moderate - sky blue
  6: '#eab308',   // Moderate-heavy - yellow
  7: '#f59e0b',   // Heavy - amber
  8: '#f97316',   // Very heavy - orange
  9: '#ef4444',   // Congested - red
};

// Known congested roads/areas with base congestion multiplier
const CONGESTION_HOTSPOTS: { [key: string]: number } = {
  // Major arterials - high base traffic
  'ferozepur road': 1.4,
  'firozpur road': 1.4,
  'mall road': 1.3,
  'canal road': 1.1,
  'ring road': 0.8,
  'grand trunk road': 1.2,
  'gt road': 1.2,
  'multan road': 1.3,
  'jail road': 1.2,
  'main boulevard': 1.4,
  'mm alam road': 1.5,
  'gulberg': 1.3,
  'liberty': 1.4,
  'defence road': 1.0,
  'airport road': 0.7,
  'raiwind road': 1.1,
  'wahdat road': 1.2,
  'allama iqbal road': 1.1,
  'mcleod road': 1.3,
  'davis road': 1.2,
  'empress road': 1.2,
  'queens road': 1.1,
  'ravi road': 1.0,
  'circular road': 1.2,
  'abbot road': 1.1,
  'egerton road': 1.2,
  'temple road': 1.1,
  // Walled City area
  'shahi guzargah': 1.5,
  'bhati gate': 1.4,
  'lohari gate': 1.4,
  'delhi gate': 1.4,
  'kashmiri gate': 1.3,
  'lahori gate': 1.3,
  // Markets
  'anarkali': 1.6,
  'shah alam': 1.5,
  'ichhra': 1.4,
  'liberty market': 1.5,
  'model town': 1.2,
};

// Road type base congestion
const ROAD_TYPE_CONGESTION: { [key: string]: number } = {
  trunk: 1.2,      // Major highways - more traffic
  primary: 1.15,   // Main roads
  secondary: 1.0,  // Secondary roads
  tertiary: 0.85,  // Local roads - less traffic
};

// Calculate traffic level for a road
function calculateTrafficLevel(road: Road, timeOfDay: number, seed: number): number {
  const roadNameLower = road.name.toLowerCase();

  // Base congestion from road type
  let congestion = ROAD_TYPE_CONGESTION[road.type] || 1.0;

  // Check for known hotspots
  for (const [hotspot, multiplier] of Object.entries(CONGESTION_HOTSPOTS)) {
    if (roadNameLower.includes(hotspot)) {
      congestion *= multiplier;
      break;
    }
  }

  // Time of day factor (peak hours: 7-10am, 5-8pm)
  let timeFactor = 1.0;
  if ((timeOfDay >= 7 && timeOfDay <= 10) || (timeOfDay >= 17 && timeOfDay <= 20)) {
    timeFactor = 1.5; // Peak hours
  } else if ((timeOfDay >= 11 && timeOfDay <= 14) || (timeOfDay >= 21 && timeOfDay <= 23)) {
    timeFactor = 1.1; // Moderate hours
  } else if (timeOfDay >= 0 && timeOfDay <= 5) {
    timeFactor = 0.4; // Late night - very low traffic
  } else {
    timeFactor = 0.8; // Normal hours
  }

  // Location-based factor (central = more congested)
  // Lahore center is approximately 31.55, 74.34
  const avgLat = road.coordinates.reduce((sum, c) => sum + c[0], 0) / road.coordinates.length;
  const avgLng = road.coordinates.reduce((sum, c) => sum + c[1], 0) / road.coordinates.length;
  const distFromCenter = Math.sqrt(Math.pow(avgLat - 31.55, 2) + Math.pow(avgLng - 74.34, 2));
  const locationFactor = Math.max(0.6, 1.3 - distFromCenter * 3);

  // Pseudo-random variation per road (deterministic based on road id)
  const hashCode = road.id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const randomFactor = 0.7 + (Math.abs(hashCode + seed) % 60) / 100; // 0.7 to 1.3

  // Calculate final congestion (0-10 scale)
  const finalCongestion = congestion * timeFactor * locationFactor * randomFactor;

  // Normalize to 0-9 range for color index (balanced multiplier for good color distribution)
  return Math.min(9, Math.max(0, Math.floor(finalCongestion * 3.47)));
}

// Get traffic status text
function getTrafficStatus(level: number): string {
  if (level <= 1) return 'FREE FLOW';
  if (level <= 3) return 'LIGHT';
  if (level <= 5) return 'MODERATE';
  if (level <= 7) return 'HEAVY';
  return 'CONGESTED';
}

// Get estimated speed based on traffic level and road type
function getEstimatedSpeed(level: number, roadType: string): number {
  const baseSpeed = {
    trunk: 60,
    primary: 50,
    secondary: 40,
    tertiary: 30,
  }[roadType] || 40;

  // Reduce speed based on traffic level
  const speedReduction = level * 0.1; // 10% reduction per level
  return Math.max(5, Math.round(baseSpeed * (1 - speedReduction)));
}

// Memoized road component with traffic coloring
const TrafficRoad = memo(function TrafficRoad({
  road,
  trafficLevel
}: {
  road: Road;
  trafficLevel: number;
}) {
  const color = TRAFFIC_COLORS[trafficLevel as keyof typeof TRAFFIC_COLORS] || TRAFFIC_COLORS[5];
  const status = getTrafficStatus(trafficLevel);
  const speed = getEstimatedSpeed(trafficLevel, road.type);

  // Weight based on road type
  const baseWeight = {
    trunk: 5,
    primary: 4,
    secondary: 3,
    tertiary: 2,
  }[road.type] || 3;

  return (
    <>
      {/* Glow effect for congested roads */}
      {trafficLevel >= 6 && (
        <Polyline
          positions={road.coordinates}
          pathOptions={{
            color: color,
            weight: baseWeight * 3,
            opacity: 0.3,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
      {/* Main road line */}
      <Polyline
        positions={road.coordinates}
        pathOptions={{
          color: color,
          weight: baseWeight,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      >
        <Tooltip sticky>
          <div className="font-mono text-xs min-w-[160px]">
            <div className="font-bold text-sm mb-1">{road.name || 'Unnamed Road'}</div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 uppercase text-[10px]">{road.type}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{
                  backgroundColor: color + '30',
                  color: color
                }}
              >
                {status}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Speed:</span>
              <span className="font-bold" style={{ color }}>{speed} km/h</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Congestion:</span>
              <span className="font-bold" style={{ color }}>{trafficLevel * 10}%</span>
            </div>
          </div>
        </Tooltip>
      </Polyline>
    </>
  );
});

export default function TrafficFlowLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [seed, setSeed] = useState(0);
  const [simulatedHour, setSimulatedHour] = useState(() => new Date().getHours());

  // Listen for zoom changes
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  // Update traffic periodically (every 10 seconds with slight variation)
  useEffect(() => {
    const interval = setInterval(() => {
      setSeed(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Simulate time progression (1 real second = 1 simulated minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedHour(prev => (prev + 1) % 24);
    }, 60000); // Change hour every minute for demo

    return () => clearInterval(interval);
  }, []);

  // Calculate traffic levels for all roads
  const roadsWithTraffic = useMemo(() => {
    return roadNetwork.map(road => ({
      road,
      trafficLevel: calculateTrafficLevel(road, simulatedHour, seed),
    }));
  }, [simulatedHour, seed]);

  // Filter roads based on zoom level for performance
  const visibleRoads = useMemo(() => {
    if (zoom >= 14) {
      return roadsWithTraffic;
    } else if (zoom >= 12) {
      return roadsWithTraffic.filter(r => r.road.type !== 'tertiary');
    } else {
      return roadsWithTraffic.filter(r => r.road.type === 'trunk' || r.road.type === 'primary');
    }
  }, [roadsWithTraffic, zoom]);

  return (
    <>
      {visibleRoads.map(({ road, trafficLevel }) => (
        <TrafficRoad
          key={road.id}
          road={road}
          trafficLevel={trafficLevel}
        />
      ))}
    </>
  );
}
