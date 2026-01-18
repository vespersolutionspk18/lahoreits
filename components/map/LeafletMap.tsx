'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { useMapStore } from '@/lib/store/map-store';
import { mapConfig } from '@/lib/data';
import OrangeLineLayer from '../layers/OrangeLineLayer';
import MetroBusLayer from '../layers/MetroBusLayer';
import SpeedoBusLayer from '../layers/SpeedoBusLayer';
import TrafficSignalsLayer from '../layers/TrafficSignalsLayer';
import CamerasLayer from '../layers/CamerasLayer';
import TrafficFlowLayer from '../layers/TrafficFlowLayer';
import RoadNetworkLayer from '../layers/RoadNetworkLayer';
import AnimatedVehiclesLayer from '../layers/AnimatedVehiclesLayer';
import 'leaflet/dist/leaflet.css';

export default function LeafletMap() {
  const { center, zoom, layers } = useMapStore();
  const [mapKey, setMapKey] = useState(0);
  const uniqueId = useId();

  // Force remount on hot reload by incrementing key
  useEffect(() => {
    return () => {
      // Cleanup: increment key to force fresh instance
      setMapKey(k => k + 1);
    };
  }, []);

  return (
    <MapContainer
      key={`map-${uniqueId}-${mapKey}`}
      center={center}
      zoom={zoom}
      minZoom={mapConfig.minZoom}
      maxZoom={mapConfig.maxZoom}
      zoomControl={false}
      attributionControl={false}
      className="w-full h-full"
      style={{ background: '#0a0a0f' }}
    >
      {/* Dark tile layer - no attribution */}
      <TileLayer
        url={mapConfig.tileProviders.cartoDark.url}
        attribution=""
      />

      {/* Custom zoom control position */}
      <ZoomControl position="bottomright" />

      {/* Road Network (base layer for verification) */}
      {layers.roads && <RoadNetworkLayer />}

      {/* Traffic Flow - Colored road segments based on simulated traffic */}
      {layers.heatmap && <TrafficFlowLayer />}

      {/* Orange Line Metro */}
      {layers.orangeLine && <OrangeLineLayer />}

      {/* Metro Bus BRT */}
      {layers.metroBus && <MetroBusLayer />}

      {/* Speedo Bus Feeder */}
      {layers.speedoBus && <SpeedoBusLayer />}

      {/* Traffic Signals */}
      {layers.trafficSignals && <TrafficSignalsLayer />}

      {/* PSCA Cameras */}
      {layers.cameras && <CamerasLayer />}

      {/* Animated Vehicles - Transit simulation */}
      {(layers.orangeLine || layers.metroBus) && (
        <AnimatedVehiclesLayer
          showMetroBus={layers.metroBus}
          showOrangeLine={layers.orangeLine}
        />
      )}
    </MapContainer>
  );
}
