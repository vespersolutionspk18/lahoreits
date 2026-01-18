'use client';

import { memo, useMemo, useState } from 'react';
import { Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { roadNetwork, roadStyles, Road } from '@/lib/data/road-network';

// Memoized road component for performance
const RoadLine = memo(function RoadLine({ road }: { road: Road }) {
  const style = roadStyles[road.type];

  return (
    <>
      <Polyline
        positions={road.coordinates}
        pathOptions={{
          color: style.color,
          weight: style.weight,
          opacity: style.opacity,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      >
        <Tooltip sticky>
          <div className="font-mono text-xs">
            <div className="font-bold">{road.name}</div>
            <div className="text-gray-500 uppercase text-[10px]">{road.type}</div>
          </div>
        </Tooltip>
      </Polyline>
      {road.type === 'trunk' && (
        <Polyline
          positions={road.coordinates}
          pathOptions={{
            color: style.color,
            weight: style.weight * 3,
            opacity: 0.2,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
    </>
  );
});

export default function RoadNetworkLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  // Listen for zoom changes
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  // Filter roads based on zoom level for performance
  // Zoom 14+: ALL roads (4599)
  // Zoom 12-13: trunk/primary/secondary (3039)
  // Zoom <12: trunk/primary only (1217)
  const visibleRoads = useMemo(() => {
    if (zoom >= 14) {
      return roadNetwork;
    } else if (zoom >= 12) {
      return roadNetwork.filter(r => r.type !== 'tertiary');
    } else {
      return roadNetwork.filter(r => r.type === 'trunk' || r.type === 'primary');
    }
  }, [zoom]);

  return (
    <>
      {visibleRoads.map((road) => (
        <RoadLine key={road.id} road={road} />
      ))}
    </>
  );
}
