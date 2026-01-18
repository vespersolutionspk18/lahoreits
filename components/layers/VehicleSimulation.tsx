'use client';

import { useEffect, useState, useRef } from 'react';
import { CircleMarker, Popup, useMap } from 'react-leaflet';
import { orangeLineStations, metroBusStations, orangeLineInfo, metroBusInfo } from '@/lib/data';
import { useMapStore } from '@/lib/store/map-store';

interface Vehicle {
  id: string;
  type: 'orange-line' | 'metro-bus';
  position: [number, number];
  currentStationIndex: number;
  direction: 1 | -1;
  progress: number;
  speed: number;
}

function interpolatePosition(
  start: [number, number],
  end: [number, number],
  progress: number
): [number, number] {
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress,
  ];
}

function getDistance(p1: [number, number], p2: [number, number]): number {
  const R = 6371;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function VehicleSimulation() {
  const map = useMap();
  const { updateStats } = useMapStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Initialize vehicles
  useEffect(() => {
    const initialVehicles: Vehicle[] = [];

    // Orange Line trains (12 trains)
    const orangeStations = orangeLineStations;
    for (let i = 0; i < 12; i++) {
      const stationIndex = Math.floor((i / 12) * (orangeStations.length - 1));
      const direction = i % 2 === 0 ? 1 : -1;
      const progress = Math.random();

      const currentStation = orangeStations[stationIndex];
      const nextStationIndex = Math.min(stationIndex + 1, orangeStations.length - 1);
      const nextStation = orangeStations[nextStationIndex];

      initialVehicles.push({
        id: `OL-${String(i + 1).padStart(2, '0')}`,
        type: 'orange-line',
        position: interpolatePosition(
          [currentStation.lat, currentStation.lng],
          [nextStation.lat, nextStation.lng],
          progress
        ),
        currentStationIndex: stationIndex,
        direction: direction as 1 | -1,
        progress,
        speed: 45 + Math.random() * 25,
      });
    }

    // Metro buses (64 buses)
    const metroStations = metroBusStations;
    for (let i = 0; i < 64; i++) {
      const stationIndex = Math.floor((i / 64) * (metroStations.length - 1));
      const direction = i % 2 === 0 ? 1 : -1;
      const progress = Math.random();

      const currentStation = metroStations[stationIndex];
      const nextStationIndex = Math.min(stationIndex + 1, metroStations.length - 1);
      const nextStation = metroStations[nextStationIndex];

      initialVehicles.push({
        id: `MB-${String(i + 1).padStart(2, '0')}`,
        type: 'metro-bus',
        position: interpolatePosition(
          [currentStation.lat, currentStation.lng],
          [nextStation.lat, nextStation.lng],
          progress
        ),
        currentStationIndex: stationIndex,
        direction: direction as 1 | -1,
        progress,
        speed: 25 + Math.random() * 20,
      });
    }

    setVehicles(initialVehicles);

    updateStats({
      activeOrangeLineTrains: 12,
      activeMetroBuses: 64,
    });
  }, [updateStats]);

  // Always-on animation loop
  useEffect(() => {
    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      setVehicles((prev) =>
        prev.map((vehicle) => {
          const stations =
            vehicle.type === 'orange-line' ? orangeLineStations : metroBusStations;
          const currentStation = stations[vehicle.currentStationIndex];
          let nextStationIndex = vehicle.currentStationIndex + vehicle.direction;

          if (nextStationIndex < 0) {
            nextStationIndex = 1;
            vehicle.direction = 1;
          } else if (nextStationIndex >= stations.length) {
            nextStationIndex = stations.length - 2;
            vehicle.direction = -1;
          }

          const nextStation = stations[nextStationIndex];
          const distance = getDistance(
            [currentStation.lat, currentStation.lng],
            [nextStation.lat, nextStation.lng]
          );

          const progressIncrement =
            ((vehicle.speed * deltaTime) / 3600 / distance);

          let newProgress = vehicle.progress + progressIncrement;
          let newStationIndex = vehicle.currentStationIndex;
          let newDirection = vehicle.direction;

          if (newProgress >= 1) {
            newProgress = 0;
            newStationIndex = nextStationIndex;

            if (newStationIndex === 0 || newStationIndex === stations.length - 1) {
              newDirection = (newDirection * -1) as 1 | -1;
            }
          }

          const updatedStation = stations[newStationIndex];
          const updatedNextIndex = Math.min(
            Math.max(newStationIndex + newDirection, 0),
            stations.length - 1
          );
          const updatedNextStation = stations[updatedNextIndex];

          return {
            ...vehicle,
            currentStationIndex: newStationIndex,
            direction: newDirection,
            progress: newProgress,
            position: interpolatePosition(
              [updatedStation.lat, updatedStation.lng],
              [updatedNextStation.lat, updatedNextStation.lng],
              newProgress
            ),
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const currentZoom = map.getZoom();

  return (
    <>
      {vehicles.map((vehicle) => {
        const isOrangeLine = vehicle.type === 'orange-line';
        const color = isOrangeLine ? orangeLineInfo.color : metroBusInfo.color;
        const size = isOrangeLine
          ? currentZoom > 13 ? 8 : 5
          : currentZoom > 13 ? 6 : 4;

        return (
          <CircleMarker
            key={vehicle.id}
            center={vehicle.position}
            radius={size}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: color,
              fillOpacity: 1,
              className: 'vehicle-marker',
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className="font-display text-xs tracking-wider"
                    style={{ color }}
                  >
                    {isOrangeLine ? 'ORANGE LINE' : 'METRO BUS'}
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2">
                  {vehicle.id}
                </h3>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Speed</span>
                    <span className="text-[#00f0ff] font-mono">
                      {Math.round(vehicle.speed)} km/h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Heading</span>
                    <span className="text-white font-mono">
                      {vehicle.direction === 1 ? 'Northbound' : 'Southbound'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Status</span>
                    <span className="text-[#00ff88] font-mono">IN SERVICE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Passengers</span>
                    <span className="text-white font-mono">
                      {isOrangeLine ? Math.floor(Math.random() * 200 + 100) : Math.floor(Math.random() * 60 + 20)}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
