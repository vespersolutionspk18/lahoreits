'use client';

import { motion } from 'framer-motion';
import {
  Layers,
  Train,
  Bus,
  TrafficCone,
  Camera,
  Thermometer,
  Activity,
  Zap,
  Radio,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  Route,
} from 'lucide-react';
import { useMapStore } from '@/lib/store/map-store';
import { cameraInfo, trafficSignalInfo } from '@/lib/data';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const layers = [
  { key: 'roads', label: 'Road Network (OSM)', icon: Route, color: '#f59e0b' },
  { key: 'orangeLine', label: 'Orange Line Metro', icon: Train, color: '#ff6b00' },
  { key: 'metroBus', label: 'Metro Bus BRT', icon: Bus, color: '#dc2626' },
  { key: 'speedoBus', label: 'Speedo Bus Feeder', icon: Bus, color: '#3b82f6' },
  { key: 'trafficSignals', label: 'Traffic Signals', icon: TrafficCone, color: '#22c55e' },
  { key: 'cameras', label: 'PSCA Cameras', icon: Camera, color: '#ff0080' },
  { key: 'heatmap', label: 'Live Traffic', icon: Thermometer, color: '#ffb800' },
] as const;

const systemMetrics = [
  { label: 'CPU', value: 23, icon: Cpu },
  { label: 'Memory', value: 67, icon: HardDrive },
  { label: 'Network', value: 45, icon: Wifi },
];

export default function Sidebar() {
  const {
    layers: layerVisibility,
    toggleLayer,
  } = useMapStore();

  return (
    <aside className="w-72 glass-panel border-r border-[#00f0ff]/10 flex flex-col h-full">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00f0ff]/20 scrollbar-track-transparent">
        {/* Layers Section */}
        <div className="p-4 border-b border-[#00f0ff]/10">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-[#00f0ff]" />
          <h2 className="font-heading text-sm font-semibold text-white tracking-wider">
            MAP LAYERS
          </h2>
        </div>

        <div className="space-y-2">
          {layers.map((layer, index) => {
            const isActive = layerVisibility[layer.key as keyof typeof layerVisibility];
            return (
              <motion.div
                key={layer.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-lg transition-all cursor-pointer',
                  isActive
                    ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20'
                    : 'hover:bg-[#ffffff]/5 border border-transparent'
                )}
                onClick={() => toggleLayer(layer.key as keyof typeof layerVisibility)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                      isActive ? 'bg-[#0a0a0f]' : 'bg-[#0a0a0f]/50'
                    )}
                    style={{
                      boxShadow: isActive ? `0 0 12px ${layer.color}40` : 'none',
                    }}
                  >
                    <layer.icon
                      className="w-4 h-4 transition-colors"
                      style={{ color: isActive ? layer.color : '#8b9cb3' }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isActive ? 'text-white' : 'text-[#8b9cb3]'
                    )}
                  >
                    {layer.label}
                  </span>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggleLayer(layer.key as keyof typeof layerVisibility)}
                  className="data-[state=checked]:bg-[#00f0ff]"
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Network Status */}
      <div className="p-4 border-b border-[#00f0ff]/10">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-[#00ff88]" />
          <h2 className="font-heading text-sm font-semibold text-white tracking-wider">
            NETWORK STATUS
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#00f0ff]" />
              <span className="text-xs text-[#8b9cb3]">PSCA Central</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-[10px] font-mono text-[#00ff88]">ONLINE</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#ffb800]" />
              <span className="text-xs text-[#8b9cb3]">Signal Network</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-[10px] font-mono text-[#00ff88]">{trafficSignalInfo.totalSignals}/{trafficSignalInfo.totalSignals}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#ff0080]" />
              <span className="text-xs text-[#8b9cb3]">Camera Feeds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-[10px] font-mono text-[#00ff88]">{cameraInfo.onlineCameras}/{cameraInfo.totalCameras}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00f0ff]" />
              <span className="text-xs text-[#8b9cb3]">Encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#00f0ff]">AES-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          <h2 className="font-heading text-sm font-semibold text-white tracking-wider">
            SYSTEM RESOURCES
          </h2>
        </div>

        <div className="space-y-3">
          {systemMetrics.map((metric) => (
            <div key={metric.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-3 h-3 text-[#8b9cb3]" />
                  <span className="text-xs text-[#8b9cb3]">{metric.label}</span>
                </div>
                <span className="text-xs font-mono text-[#00f0ff]">{metric.value}%</span>
              </div>
              <div className="h-1 bg-[#0a0a0f] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: metric.value > 80 ? '#ef4444' : metric.value > 60 ? '#ffb800' : '#00ff88',
                    width: `${metric.value}%`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Uptime */}
        <div className="mt-4 p-3 rounded-lg bg-[#0a0a0f]/50 border border-[#00f0ff]/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b9cb3]">System Uptime</span>
            <span className="text-xs font-mono text-[#00ff88]">99.97%</span>
          </div>
          <div className="text-[10px] text-[#8b9cb3]/60 mt-1">
            Last restart: 47 days ago
          </div>
        </div>
      </div>
      </div>

      {/* Footer Info - Fixed at bottom */}
      <div className="p-4 border-t border-[#00f0ff]/10 flex-shrink-0">
        <div className="flex items-center justify-between text-[10px] text-[#8b9cb3] font-mono">
          <span>v2.4.1</span>
          <span>LAHORE ITS</span>
        </div>
      </div>
    </aside>
  );
}
