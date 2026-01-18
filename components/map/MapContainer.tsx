'use client';

import { useEffect, useState, useId } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the map to avoid SSR issues with Leaflet
const DynamicMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-[#00f0ff]/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-[#00f0ff] rounded-full animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-[#00f0ff] text-sm tracking-wider">INITIALIZING</span>
          <span className="font-mono text-[#8b9cb3] text-xs">Loading Traffic Grid...</span>
        </div>
      </div>
    </div>
  ),
});

export default function MapContainer() {
  const [mounted, setMounted] = useState(false);
  const [renderKey, setRenderKey] = useState(Date.now());
  const containerId = useId();

  useEffect(() => {
    setMounted(true);

    // Handle HMR cleanup
    return () => {
      setRenderKey(Date.now());
    };
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin" />
      </div>
    );
  }

  return (
    <div key={`container-${containerId}-${renderKey}`} className="w-full h-full">
      <DynamicMap />
    </div>
  );
}
