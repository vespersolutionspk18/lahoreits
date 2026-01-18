'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Vehicle,
  TrackPoint,
  StationInfo,
  METRO_BUS_CONFIG,
  ORANGE_LINE_CONFIG,
  calculateTrackDistances,
  calculateStationDistances,
  updateVehiclePosition,
  shouldSpawnVehicle,
  createVehicle,
} from '@/lib/utils/vehicle-animation';
import { metroBusStations, metroBusTrack } from '@/lib/data/metro-bus';
import { orangeLineStations, orangeLineTrack } from '@/lib/data/orange-line';

interface AnimatedVehiclesLayerProps {
  showMetroBus: boolean;
  showOrangeLine: boolean;
}

// Vehicle icons
const createVehicleIcon = (type: 'metro-bus' | 'orange-line', bearing: number) => {
  const color = type === 'metro-bus' ? '#dc2626' : '#ff6b00';
  const size = type === 'metro-bus' ? 20 : 24;

  // SVG icon that rotates based on bearing
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
         style="transform: rotate(${bearing}deg);">
      <defs>
        <filter id="glow-${type}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      ${type === 'metro-bus' ? `
        <!-- Bus icon -->
        <rect x="6" y="4" width="12" height="16" rx="2" fill="${color}" filter="url(#glow-${type})"/>
        <rect x="7" y="6" width="10" height="5" rx="1" fill="#fff" opacity="0.9"/>
        <rect x="7" y="13" width="4" height="3" rx="0.5" fill="#fff" opacity="0.7"/>
        <rect x="13" y="13" width="4" height="3" rx="0.5" fill="#fff" opacity="0.7"/>
        <circle cx="8.5" cy="18" r="1.5" fill="#333"/>
        <circle cx="15.5" cy="18" r="1.5" fill="#333"/>
      ` : `
        <!-- Train icon -->
        <rect x="5" y="3" width="14" height="18" rx="3" fill="${color}" filter="url(#glow-${type})"/>
        <rect x="7" y="5" width="10" height="4" rx="1" fill="#fff" opacity="0.9"/>
        <rect x="7" y="11" width="4" height="3" rx="0.5" fill="#fff" opacity="0.7"/>
        <rect x="13" y="11" width="4" height="3" rx="0.5" fill="#fff" opacity="0.7"/>
        <circle cx="8" cy="17" r="1.5" fill="#333"/>
        <circle cx="16" cy="17" r="1.5" fill="#333"/>
        <rect x="10" y="3" width="4" height="2" fill="#333"/>
      `}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'vehicle-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

interface VehicleState {
  metroBusVehicles: Vehicle[];
  orangeLineVehicles: Vehicle[];
  lastMetroBusSpawnOutbound: number;
  lastMetroBusSpawnInbound: number;
  lastOrangeLineSpawnOutbound: number;
  lastOrangeLineSpawnInbound: number;
}

export default function AnimatedVehiclesLayer({ showMetroBus, showOrangeLine }: AnimatedVehiclesLayerProps) {
  const map = useMap();
  const animationRef = useRef<number | undefined>(undefined);
  const [vehicles, setVehicles] = useState<VehicleState>({
    metroBusVehicles: [],
    orangeLineVehicles: [],
    lastMetroBusSpawnOutbound: 0,
    lastMetroBusSpawnInbound: 0,
    lastOrangeLineSpawnOutbound: 0,
    lastOrangeLineSpawnInbound: 0,
  });

  // Pre-calculate track data
  const metroBusTrackData = useMemo(() => {
    // Combine all segments into one track
    const allCoords: [number, number][] = [];
    metroBusTrack.forEach((segment) => {
      segment.coordinates.forEach((coord) => {
        allCoords.push(coord);
      });
    });
    return calculateTrackDistances(allCoords);
  }, []);

  const orangeLineTrackData = useMemo(() => {
    const allCoords: [number, number][] = [];
    orangeLineTrack.forEach((segment) => {
      segment.coordinates.forEach((coord) => {
        allCoords.push(coord);
      });
    });
    return calculateTrackDistances(allCoords);
  }, []);

  const metroBusStationData = useMemo(() => {
    return calculateStationDistances(
      metroBusStations.map((s) => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        isTerminal: s.isTerminal,
      })),
      metroBusTrackData
    );
  }, [metroBusTrackData]);

  const orangeLineStationData = useMemo(() => {
    return calculateStationDistances(
      orangeLineStations.map((s) => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        isTerminal: s.isTerminal,
      })),
      orangeLineTrackData
    );
  }, [orangeLineTrackData]);

  // Animation loop
  const animate = useCallback(() => {
    const now = Date.now();

    setVehicles((prev) => {
      const newState = { ...prev };

      // Update Metro Bus vehicles
      newState.metroBusVehicles = prev.metroBusVehicles
        .map((v) =>
          updateVehiclePosition(v, metroBusStationData, metroBusTrackData, METRO_BUS_CONFIG, now)
        )
        .filter((v) => {
          // Remove vehicles that completed their route
          const totalLength = metroBusTrackData[metroBusTrackData.length - 1]?.cumulativeDistance || 0;
          return v.distanceTraveled < totalLength * 0.99;
        });

      // Update Orange Line vehicles
      newState.orangeLineVehicles = prev.orangeLineVehicles
        .map((v) =>
          updateVehiclePosition(v, orangeLineStationData, orangeLineTrackData, ORANGE_LINE_CONFIG, now)
        )
        .filter((v) => {
          const totalLength = orangeLineTrackData[orangeLineTrackData.length - 1]?.cumulativeDistance || 0;
          return v.distanceTraveled < totalLength * 0.99;
        });

      // Spawn new Metro Bus vehicles
      if (shouldSpawnVehicle(prev.lastMetroBusSpawnOutbound, now, METRO_BUS_CONFIG)) {
        const newVehicle = createVehicle('metro-bus', 'outbound', metroBusTrackData, now);
        newState.metroBusVehicles.push(newVehicle);
        newState.lastMetroBusSpawnOutbound = now;
      }

      if (shouldSpawnVehicle(prev.lastMetroBusSpawnInbound, now, METRO_BUS_CONFIG)) {
        const newVehicle = createVehicle('metro-bus', 'inbound', metroBusTrackData, now);
        newState.metroBusVehicles.push(newVehicle);
        newState.lastMetroBusSpawnInbound = now;
      }

      // Spawn new Orange Line vehicles
      if (shouldSpawnVehicle(prev.lastOrangeLineSpawnOutbound, now, ORANGE_LINE_CONFIG)) {
        const newVehicle = createVehicle('orange-line', 'outbound', orangeLineTrackData, now);
        newState.orangeLineVehicles.push(newVehicle);
        newState.lastOrangeLineSpawnOutbound = now;
      }

      if (shouldSpawnVehicle(prev.lastOrangeLineSpawnInbound, now, ORANGE_LINE_CONFIG)) {
        const newVehicle = createVehicle('orange-line', 'inbound', orangeLineTrackData, now);
        newState.orangeLineVehicles.push(newVehicle);
        newState.lastOrangeLineSpawnInbound = now;
      }

      return newState;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [metroBusTrackData, metroBusStationData, orangeLineTrackData, orangeLineStationData]);

  // Initialize with some vehicles already on route
  useEffect(() => {
    const now = Date.now();

    // Pre-populate with vehicles already in transit
    const initialMetroBus: Vehicle[] = [];
    const initialOrangeLine: Vehicle[] = [];

    // Add 5-6 metro buses already on route (spaced out)
    for (let i = 0; i < 6; i++) {
      const outboundVehicle = createVehicle('metro-bus', 'outbound', metroBusTrackData, now - i * 300000);
      const inboundVehicle = createVehicle('metro-bus', 'inbound', metroBusTrackData, now - i * 300000 - 150000);
      initialMetroBus.push(outboundVehicle, inboundVehicle);
    }

    // Add 4-5 orange line trains already on route
    for (let i = 0; i < 5; i++) {
      const outboundVehicle = createVehicle('orange-line', 'outbound', orangeLineTrackData, now - i * 400000);
      const inboundVehicle = createVehicle('orange-line', 'inbound', orangeLineTrackData, now - i * 400000 - 200000);
      initialOrangeLine.push(outboundVehicle, inboundVehicle);
    }

    setVehicles({
      metroBusVehicles: initialMetroBus,
      orangeLineVehicles: initialOrangeLine,
      lastMetroBusSpawnOutbound: now,
      lastMetroBusSpawnInbound: now,
      lastOrangeLineSpawnOutbound: now,
      lastOrangeLineSpawnInbound: now,
    });
  }, [metroBusTrackData, orangeLineTrackData]);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Render vehicles based on visibility props
  const visibleVehicles = [
    ...(showMetroBus ? vehicles.metroBusVehicles : []),
    ...(showOrangeLine ? vehicles.orangeLineVehicles : []),
  ];

  return (
    <>
      {visibleVehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.currentPosition.lat, vehicle.currentPosition.lng]}
          icon={createVehicleIcon(vehicle.type, vehicle.bearing)}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: vehicle.type === 'metro-bus' ? '#dc2626' : '#ff6b00',
                  }}
                />
                <span className="font-display text-xs uppercase tracking-wider">
                  {vehicle.type === 'metro-bus' ? 'Metro Bus' : 'Orange Line'}
                </span>
              </div>

              <h3 className="font-heading text-sm font-bold text-white mb-2">
                {vehicle.direction === 'outbound' ? '→' : '←'}{' '}
                {vehicle.type === 'metro-bus'
                  ? vehicle.direction === 'outbound'
                    ? 'Gajjumata → Shahadra'
                    : 'Shahadra → Gajjumata'
                  : vehicle.direction === 'outbound'
                  ? 'Ali Town → Dera Gujjran'
                  : 'Dera Gujjran → Ali Town'}
              </h3>

              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Speed</span>
                  <span className="text-white font-mono">
                    {Math.round(vehicle.currentSpeed)} km/h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Status</span>
                  <span
                    className="font-mono"
                    style={{
                      color: vehicle.isAtStation ? '#eab308' : '#22c55e',
                    }}
                  >
                    {vehicle.isAtStation ? 'AT STATION' : 'IN TRANSIT'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Distance</span>
                  <span className="text-white font-mono">
                    {(vehicle.distanceTraveled / 1000).toFixed(1)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Next Stop</span>
                  <span className="text-[#00f0ff] font-mono text-[10px]">
                    {vehicle.type === 'metro-bus'
                      ? metroBusStations[
                          Math.min(vehicle.currentStationIndex, metroBusStations.length - 1)
                        ]?.name || 'Terminal'
                      : orangeLineStations[
                          Math.min(vehicle.currentStationIndex, orangeLineStations.length - 1)
                        ]?.name || 'Terminal'}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
