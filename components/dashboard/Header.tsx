'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Wifi,
  WifiOff,
  Settings,
  Bell,
  User,
  ChevronDown,
} from 'lucide-react';
import { useMapStore } from '@/lib/store/map-store';

export default function Header() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { alerts } = useMapStore();

  useEffect(() => {
    // Set initial time on client only to avoid hydration mismatch
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <header className="h-14 glass-dark border-b border-[#00f0ff]/10 flex items-center justify-between px-4 z-50">
      {/* Left: Logo and Title */}
      <div className="flex items-center gap-4">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#ff0080] p-[1px]">
              <div className="w-full h-full rounded-lg bg-[#0a0a0f] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#00f0ff]" />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h1 className="font-display text-lg font-bold tracking-wider text-white leading-none">
              LAHORE <span className="text-[#00f0ff]">ITS</span>
            </h1>
            <span className="text-[10px] text-[#8b9cb3] font-mono tracking-widest">
              INTEGRATED TRAFFIC MANAGEMENT
            </span>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#00f0ff]/30 to-transparent" />

        {/* System Status */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00ff88]/10 border border-[#00ff88]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-[10px] font-mono text-[#00ff88] tracking-wider">
              SYSTEM ONLINE
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/20">
            {isOnline ? (
              <Wifi className="w-3 h-3 text-[#00f0ff]" />
            ) : (
              <WifiOff className="w-3 h-3 text-[#ef4444]" />
            )}
            <span className="text-[10px] font-mono text-[#00f0ff] tracking-wider">
              LIVE DATA
            </span>
          </div>
        </motion.div>
      </div>

      {/* Center: Time Display */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="font-mono text-2xl font-bold text-white tracking-wider text-glow-cyan">
          {currentTime ? formatTime(currentTime) : '--:--:--'}
        </div>
        <div className="text-[10px] text-[#8b9cb3] font-mono tracking-widest">
          {currentTime ? formatDate(currentTime) : '---'}
        </div>
      </motion.div>

      {/* Right: Controls */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Alerts */}
        <button className="relative p-2 rounded-lg hover:bg-[#00f0ff]/10 transition-colors">
          <Bell className="w-5 h-5 text-[#8b9cb3] hover:text-[#00f0ff] transition-colors" />
          {alerts.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff0080] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {alerts.length}
            </span>
          )}
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-[#00f0ff]/10 transition-colors">
          <Settings className="w-5 h-5 text-[#8b9cb3] hover:text-[#00f0ff] transition-colors" />
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#00f0ff]/30 to-transparent" />

        {/* User */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#00f0ff]/10 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#ff0080] p-[1px]">
            <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
              <User className="w-4 h-4 text-[#00f0ff]" />
            </div>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium text-white leading-none">Operator</span>
            <span className="text-[10px] text-[#8b9cb3]">Control Room</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#8b9cb3]" />
        </button>
      </motion.div>
    </header>
  );
}
