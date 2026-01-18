'use client';

import { Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { metroBusStations, metroBusTrack, metroBusInfo } from '@/lib/data/metro-bus';
import { useMapStore } from '@/lib/store/map-store';

export default function MetroBusLayer() {
  const map = useMap();
  const { setSelectedItem } = useMapStore();

  const handleStationClick = (station: typeof metroBusStations[0]) => {
    setSelectedItem('station', station.id, { ...station, line: 'metro-bus' });
    map.flyTo([station.lat, station.lng], 15, { duration: 0.5 });
  };

  return (
    <>
      {/* Render all track segments from OSM data */}
      {metroBusTrack.map((segment) => (
        <div key={segment.id}>
          {/* Main busway line */}
          <Polyline
            positions={segment.coordinates}
            pathOptions={{
              color: metroBusInfo.color,
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Glow effect */}
          <Polyline
            positions={segment.coordinates}
            pathOptions={{
              color: metroBusInfo.color,
              weight: 12,
              opacity: 0.2,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </div>
      ))}

      {/* Station markers */}
      {metroBusStations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.lat, station.lng]}
          radius={station.isTerminal ? 8 : 6}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: metroBusInfo.color,
            fillOpacity: 1,
          }}
          eventHandlers={{
            click: () => handleStationClick(station),
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: metroBusInfo.color }}
                />
                <span className="font-display text-sm text-[#dc2626]">METRO BUS</span>
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-1">
                {station.name}
              </h3>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Station #</span>
                  <span className="text-white font-mono">{station.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Type</span>
                  <span className="text-[#00f0ff] font-mono">
                    {station.isTerminal ? 'TERMINAL' : 'STATION'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Est. Wait</span>
                  <span className="text-[#00ff88] font-mono">2-3 min</span>
                </div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Pulsing ring effect for terminals */}
      {metroBusStations.filter(s => s.isTerminal).map((terminal) => (
        <CircleMarker
          key={`pulse-${terminal.id}`}
          center={[terminal.lat, terminal.lng]}
          radius={14}
          pathOptions={{
            color: metroBusInfo.color,
            weight: 1,
            fillColor: 'transparent',
            fillOpacity: 0,
            opacity: 0.5,
            className: 'animate-pulse-ring',
          }}
        />
      ))}
    </>
  );
}
