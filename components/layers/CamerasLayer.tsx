'use client';

import { useMemo } from 'react';
import { CircleMarker, Popup, useMap } from 'react-leaflet';
import { cameras } from '@/lib/data';
import { useMapStore } from '@/lib/store/map-store';
import { Camera, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';

const STATUS_CONFIG = {
  online: {
    color: '#00ff88',
    icon: ShieldCheck,
    label: 'ONLINE',
  },
  offline: {
    color: '#ef4444',
    icon: ShieldOff,
    label: 'OFFLINE',
  },
  maintenance: {
    color: '#ffb800',
    icon: ShieldAlert,
    label: 'MAINTENANCE',
  },
};

export default function CamerasLayer() {
  const map = useMap();
  const { setSelectedItem } = useMapStore();

  const handleCameraClick = (camera: (typeof cameras)[0]) => {
    setSelectedItem('camera', camera.id, camera);
    map.flyTo([camera.lat, camera.lng], 16, { duration: 0.5 });
  };

  const currentZoom = map.getZoom();

  // Filter cameras based on zoom level for performance
  const visibleCameras = useMemo(() => {
    if (currentZoom < 12) return []; // Too zoomed out
    if (currentZoom >= 15) return cameras; // Show all at high zoom

    // At medium zoom (12-14), only show junction cameras (at traffic signals)
    if (currentZoom >= 12 && currentZoom < 15) {
      return cameras.filter(c => c.zone === 'Junction');
    }

    return cameras;
  }, [currentZoom]);

  if (visibleCameras.length === 0) return null;

  return (
    <>
      {visibleCameras.map((camera) => {
        const config = STATUS_CONFIG[camera.status];

        return (
          <CircleMarker
            key={camera.id}
            center={[camera.lat, camera.lng]}
            radius={currentZoom > 14 ? 5 : 3}
            pathOptions={{
              color: config.color,
              weight: 1,
              fillColor: config.color,
              fillOpacity: camera.status === 'online' ? 0.6 : 0.3,
            }}
            eventHandlers={{
              click: () => handleCameraClick(camera),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-4 h-4" style={{ color: config.color }} />
                  <span
                    className="font-display text-sm"
                    style={{ color: config.color }}
                  >
                    {camera.type === 'anpr' ? 'ANPR CAMERA' : 'CCTV'}
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-1">
                  {camera.name}
                </h3>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#8b9cb3]">Status</span>
                    <span
                      className="font-mono flex items-center gap-1"
                      style={{ color: config.color }}
                    >
                      <config.icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Zone</span>
                    <span className="text-white">{camera.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">Type</span>
                    <span className={camera.type === 'anpr' ? 'text-[#00f0ff]' : 'text-white'}>
                      {camera.type === 'anpr' ? 'AI-Enabled ANPR' : 'Standard CCTV'}
                    </span>
                  </div>
                  {camera.type === 'anpr' && (
                    <div className="mt-2 p-2 bg-[#00f0ff]/10 rounded border border-[#00f0ff]/20">
                      <div className="text-[10px] text-[#00f0ff] font-mono">
                        ANPR ACTIVE - Monitoring vehicle plates
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
