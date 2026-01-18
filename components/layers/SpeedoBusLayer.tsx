'use client';

import { memo } from 'react';
import { Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { speedoRoutes, speedoBusInfo } from '@/lib/data';
import { useMapStore } from '@/lib/store/map-store';

// Memoized route component for performance
const SpeedoRoute = memo(function SpeedoRoute({
  route,
  onStopClick,
}: {
  route: typeof speedoRoutes[0];
  onStopClick: (route: typeof speedoRoutes[0], stop: typeof speedoRoutes[0]['stopPositions'][0], index: number) => void;
}) {
  return (
    <>
      {/* Route line following actual road geometry */}
      {route.segments.map((segment, segIdx) => (
        <Polyline
          key={`${route.id}-seg-${segIdx}`}
          positions={segment}
          pathOptions={{
            color: route.color,
            weight: 3,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ))}

      {/* Glow effect */}
      {route.segments.map((segment, segIdx) => (
        <Polyline
          key={`${route.id}-glow-${segIdx}`}
          positions={segment}
          pathOptions={{
            color: route.color,
            weight: 8,
            opacity: 0.12,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ))}

      {/* Stop markers */}
      {route.stopPositions.map((stop, index) => (
        <CircleMarker
          key={`${route.id}-stop-${index}`}
          center={stop.position}
          radius={stop.isTerminal ? 6 : 4}
          pathOptions={{
            color: stop.isTerminal ? route.color : '#ffffff',
            weight: stop.isTerminal ? 2 : 1.5,
            fillColor: stop.isTerminal ? '#0a0a0f' : route.color,
            fillOpacity: 1,
          }}
          eventHandlers={{
            click: () => onStopClick(route, stop, index),
          }}
        >
          <Popup>
            <div className="min-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: route.color }}
                />
                <span className="font-display text-xs text-[#3b82f6]">
                  SPEEDO BUS
                </span>
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-1">
                {stop.name}
              </h3>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Route</span>
                  <span className="text-white font-mono text-[10px]">{route.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Stop #</span>
                  <span className="text-white font-mono">{index + 1} of {route.stops.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Type</span>
                  <span className="text-[#00f0ff] font-mono capitalize">{route.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Frequency</span>
                  <span className="text-[#00ff88] font-mono">{speedoBusInfo.peakFrequency}</span>
                </div>
                {stop.isTerminal && (
                  <div className="mt-2 p-2 bg-[#3b82f6]/10 rounded border border-[#3b82f6]/20">
                    <div className="text-[10px] text-[#3b82f6] font-mono">
                      TERMINAL STATION
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
});

export default function SpeedoBusLayer() {
  const map = useMap();
  const { setSelectedItem } = useMapStore();

  const handleStopClick = (
    route: typeof speedoRoutes[0],
    stop: typeof speedoRoutes[0]['stopPositions'][0],
    index: number
  ) => {
    setSelectedItem('station', route.id * 100 + index, {
      route: route.name,
      stop: stop.name,
      type: route.type,
      line: 'speedo-bus'
    });
    map.flyTo(stop.position, 15, { duration: 0.5 });
  };

  return (
    <>
      {speedoRoutes.map((route) => (
        <SpeedoRoute
          key={route.id}
          route={route}
          onStopClick={handleStopClick}
        />
      ))}
    </>
  );
}
