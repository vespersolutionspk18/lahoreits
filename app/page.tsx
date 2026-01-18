'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import StatsPanel from '@/components/dashboard/StatsPanel';
import MapContainer from '@/components/map/MapContainer';
import { useMapStore } from '@/lib/store/map-store';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { addAlert } = useMapStore();

  useEffect(() => {
    setMounted(true);

    // Add realistic initial alerts
    const initialAlerts = [
      {
        id: 'alert-1',
        type: 'congestion' as const,
        title: 'Heavy Traffic on Mall Road',
        description: 'Average speed reduced to 15 km/h near GPO Chowk',
        location: 'Mall Road, GPO Intersection',
        timestamp: new Date(Date.now() - 3 * 60000),
      },
      {
        id: 'alert-2',
        type: 'incident' as const,
        title: 'Vehicle Breakdown',
        description: 'Stalled vehicle in right lane, tow truck dispatched',
        location: 'Ferozepur Road, Kalma Chowk',
        timestamp: new Date(Date.now() - 8 * 60000),
      },
      {
        id: 'alert-3',
        type: 'maintenance' as const,
        title: 'Signal Maintenance',
        description: 'Scheduled maintenance, manual traffic control active',
        location: 'Liberty Chowk',
        timestamp: new Date(Date.now() - 22 * 60000),
      },
    ];

    initialAlerts.forEach((alert, index) => {
      setTimeout(() => addAlert(alert), index * 200);
    });
  }, [addAlert]);

  if (!mounted) {
    return (
      <div className="h-screen bg-[#050508] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-xs font-mono text-[#8b9cb3]">CONNECTING TO NETWORK</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#050508]">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 relative overflow-hidden">
          <MapContainer />

          {/* Location indicator - responsive positioning */}
          <motion.div
            className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 px-2 sm:px-3 py-1 sm:py-1.5 glass-panel rounded-lg flex items-center gap-1.5 sm:gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono text-[#8b9cb3]">
              <span className="hidden sm:inline">LAHORE METROPOLITAN AREA</span>
              <span className="sm:hidden">LAHORE</span>
            </span>
          </motion.div>

          {/* Coordinates - hidden on small mobile */}
          <motion.div
            className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 glass-panel rounded-lg hidden xs:block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-[10px] sm:text-xs font-mono text-[#00f0ff]">
              31.5204° N, 74.3587° E
            </span>
          </motion.div>

          {/* Legend - responsive */}
          <motion.div
            className="absolute top-2 sm:top-4 left-2 sm:left-4 glass-panel rounded-lg p-2 sm:p-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-[9px] sm:text-[10px] font-semibold text-[#8b9cb3] mb-1.5 sm:mb-2 tracking-widest">LEGEND</h3>
            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff6b00]" />
                <span className="text-[9px] sm:text-[10px] text-[#8b9cb3]">Orange Line</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#dc2626]" />
                <span className="text-[9px] sm:text-[10px] text-[#8b9cb3]">Metro Bus</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#22c55e]" />
                <span className="text-[9px] sm:text-[10px] text-[#8b9cb3]">Signals</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff0080]" />
                <span className="text-[9px] sm:text-[10px] text-[#8b9cb3]">Cameras</span>
              </div>
            </div>
          </motion.div>

          {/* Data refresh indicator */}
          <motion.div
            className="absolute top-2 sm:top-4 right-2 sm:right-4 px-1.5 sm:px-2 py-0.5 sm:py-1 glass-panel rounded flex items-center gap-1 sm:gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-mono text-[#8b9cb3]">LIVE</span>
          </motion.div>
        </main>

        <StatsPanel />
      </div>
    </div>
  );
}
