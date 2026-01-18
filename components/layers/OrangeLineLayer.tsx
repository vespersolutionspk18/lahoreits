'use client';

import { Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { orangeLineStations, orangeLineTrack, orangeLineInfo } from '@/lib/data/orange-line';
import { useMapStore } from '@/lib/store/map-store';

export default function OrangeLineLayer() {
  const map = useMap();
  const { setSelectedItem } = useMapStore();

  const handleStationClick = (station: typeof orangeLineStations[0]) => {
    setSelectedItem('station', station.id, { ...station, line: 'orange' });
    map.flyTo([station.lat, station.lng], 15, { duration: 0.5 });
  };

  return (
    <>
      {/* Render all track segments from OSM data */}
      {orangeLineTrack.map((segment) => (
        <div key={segment.id}>
          {/* Main track line */}
          <Polyline
            positions={segment.coordinates}
            pathOptions={{
              color: orangeLineInfo.color,
              weight: 6,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Glow effect */}
          <Polyline
            positions={segment.coordinates}
            pathOptions={{
              color: orangeLineInfo.color,
              weight: 14,
              opacity: 0.2,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </div>
      ))}

      {/* Station markers */}
      {orangeLineStations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.lat, station.lng]}
          radius={station.isTerminal ? 10 : 7}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: orangeLineInfo.color,
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
                  style={{ backgroundColor: orangeLineInfo.color }}
                />
                <span className="font-display text-sm text-[#ff6b00]">ORANGE LINE</span>
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
                  <span className="text-[#00ff88] font-mono">
                    {station.isTerminal ? 'TERMINAL' : 'ELEVATED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Coordinates</span>
                  <span className="text-[#00f0ff] font-mono text-[10px]">
                    {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Pulsing ring effect for terminals */}
      {orangeLineStations.filter(s => s.isTerminal).map((terminal) => (
        <CircleMarker
          key={`pulse-${terminal.id}`}
          center={[terminal.lat, terminal.lng]}
          radius={16}
          pathOptions={{
            color: orangeLineInfo.color,
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
