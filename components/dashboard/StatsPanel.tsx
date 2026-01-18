'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Train,
  Bus,
  Camera,
  Gauge,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  MapPin,
  X,
} from 'lucide-react';
import { useMapStore } from '@/lib/store/map-store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const alertConfig = {
  incident: { color: '#ef4444', icon: AlertTriangle, label: 'INCIDENT' },
  congestion: { color: '#ffb800', icon: TrendingUp, label: 'CONGESTION' },
  maintenance: { color: '#00f0ff', icon: Clock, label: 'MAINTENANCE' },
  info: { color: '#8b9cb3', icon: MapPin, label: 'INFO' },
};

// Client-only time display to avoid hydration mismatch
function TimeAgo({ timestamp }: { timestamp: Date }) {
  const [timeAgo, setTimeAgo] = useState('--');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const minutes = Math.floor(diff / 60000);

      if (minutes < 1) setTimeAgo('Just now');
      else if (minutes < 60) setTimeAgo(`${minutes}m ago`);
      else {
        const hours = Math.floor(minutes / 60);
        if (hours < 24) setTimeAgo(`${hours}h ago`);
        else setTimeAgo(`${Math.floor(hours / 24)}d ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timestamp]);

  return <>{timeAgo}</>;
}

export default function StatsPanel() {
  const { stats, alerts, removeAlert, rightSidebarOpen, closeSidebars } = useMapStore();

  const statCards = [
    {
      label: 'Orange Line',
      value: stats.activeOrangeLineTrains,
      unit: 'trains',
      icon: Train,
      color: '#ff6b00',
      trend: 'up',
    },
    {
      label: 'Metro Bus',
      value: stats.activeMetroBuses,
      unit: 'buses',
      icon: Bus,
      color: '#dc2626',
      trend: 'stable',
    },
    {
      label: 'Cameras Online',
      value: stats.camerasOnline.toLocaleString(),
      unit: '',
      icon: Camera,
      color: '#00ff88',
      trend: 'up',
    },
    {
      label: 'Traffic Index',
      value: stats.trafficIndex,
      unit: '/100',
      icon: Gauge,
      color: stats.trafficIndex > 60 ? '#ef4444' : stats.trafficIndex > 40 ? '#ffb800' : '#00ff88',
      trend: stats.trafficIndex > 50 ? 'down' : 'up',
    },
  ];

  const panelContent = (
    <>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00f0ff]/20 scrollbar-track-transparent">
        {/* Stats Grid */}
        <div className="p-4 border-b border-[#00f0ff]/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#00f0ff]" />
              <h2 className="font-heading text-sm font-semibold text-white tracking-wider">
                LIVE STATISTICS
              </h2>
            </div>
            {/* Mobile close button */}
            <button
              onClick={closeSidebars}
              className="lg:hidden p-1 rounded hover:bg-[#00f0ff]/10 transition-colors"
            >
              <X className="w-5 h-5 text-[#8b9cb3]" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="stat-card p-2 sm:p-3"
              >
                <div className="flex items-start justify-between mb-1 sm:mb-2">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
                  {stat.trend === 'up' && <TrendingUp className="w-3 h-3 text-[#00ff88]" />}
                  {stat.trend === 'down' && <TrendingDown className="w-3 h-3 text-[#ef4444]" />}
                </div>
                <div className="stat-value text-lg sm:text-xl" style={{ color: stat.color }}>
                  {stat.value}
                  {stat.unit && <span className="text-[10px] sm:text-xs text-[#8b9cb3] ml-1">{stat.unit}</span>}
                </div>
                <div className="stat-label text-[10px] sm:text-xs mt-0.5 sm:mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Speed Indicator */}
          <div className="mt-4 p-3 rounded-lg bg-[#0a0a0f]/50 border border-[#00f0ff]/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#8b9cb3]">Average Speed</span>
              <span className="font-mono text-sm text-[#00f0ff]">{stats.avgSpeed} km/h</span>
            </div>
            <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, #00ff88, #ffb800, #ef4444)`,
                  width: `${(stats.avgSpeed / 60) * 100}%`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${(stats.avgSpeed / 60) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#8b9cb3] mt-1">
              <span>0</span>
              <span>30</span>
              <span>60 km/h</span>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="flex flex-col">
          <div className="p-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ffb800]" />
              <h2 className="font-heading text-sm font-semibold text-white tracking-wider">
                LIVE ALERTS
              </h2>
            </div>
            <span className="text-xs font-mono text-[#8b9cb3] bg-[#ffb800]/10 px-2 py-0.5 rounded">
              {alerts.length}
            </span>
          </div>

          <ScrollArea className="px-4 pb-4 max-h-64">
            <div className="space-y-2">
              {alerts.map((alert, index) => {
                const config = alertConfig[alert.type];
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-2 sm:p-3 rounded-lg bg-[#0a0a0f]/50 border border-[#00f0ff]/10 relative group"
                  >
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#ffffff]/10 rounded"
                    >
                      <X className="w-3 h-3 text-[#8b9cb3]" />
                    </button>

                    <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                      <config.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: config.color }} />
                      <span
                        className="text-[9px] sm:text-[10px] font-mono tracking-wider"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-[#8b9cb3] ml-auto">
                        <TimeAgo timestamp={alert.timestamp} />
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-medium text-white mb-0.5 sm:mb-1">{alert.title}</h4>
                    <p className="text-[10px] sm:text-xs text-[#8b9cb3] mb-1 sm:mb-2">{alert.description}</p>

                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#00f0ff]">
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>{alert.location}</span>
                    </div>
                  </motion.div>
                );
              })}

              {alerts.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#00ff88]" />
                  </div>
                  <p className="text-xs sm:text-sm text-[#8b9cb3]">All systems operational</p>
                  <p className="text-[10px] sm:text-xs text-[#8b9cb3]/60">No active alerts</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Connection Status - Fixed at bottom */}
      <div className="p-4 border-t border-[#00f0ff]/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs text-[#8b9cb3]">Connected to PSCA Network</span>
          </div>
          <span className="text-[10px] font-mono text-[#00f0ff]">LIVE</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop panel - always visible on lg+ */}
      <aside className="hidden lg:flex w-80 glass-panel border-l border-[#00f0ff]/10 flex-col h-full">
        {panelContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {rightSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebars}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            {/* Drawer - slides from right */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-14 bottom-0 w-80 max-w-[85vw] glass-panel border-l border-[#00f0ff]/10 flex flex-col z-50"
            >
              {panelContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
