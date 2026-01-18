'use client';

import { useEffect, useState } from 'react';
import { CircleMarker, Popup, useMap } from 'react-leaflet';
import { trafficSignals, TrafficSignal } from '@/lib/data/traffic-signals';
import { useMapStore } from '@/lib/store/map-store';

type SignalState = 'red' | 'yellow' | 'green';

interface SignalWithState extends TrafficSignal {
  currentState: SignalState;
  cycleOffset: number;
}

const SIGNAL_COLORS = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
};

export default function TrafficSignalsLayer() {
  const map = useMap();
  const { setSelectedItem } = useMapStore();
  const [signals, setSignals] = useState<SignalWithState[]>([]);

  // Initialize signals with random cycle offsets for realistic staggering
  useEffect(() => {
    const initializedSignals = trafficSignals.map((signal) => ({
      ...signal,
      currentState: (['red', 'yellow', 'green'] as SignalState[])[
        Math.floor(Math.random() * 3)
      ],
      cycleOffset: Math.random() * 90, // Random offset in seconds
    }));
    setSignals(initializedSignals);
  }, []);

  // Always-on signal cycling animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSignals((prev) =>
        prev.map((signal) => {
          const states: SignalState[] = ['green', 'yellow', 'red'];
          const currentIndex = states.indexOf(signal.currentState);
          // Stagger based on signal's unique offset - roughly 10% chance per tick
          const shouldTransition = Math.random() < 0.08;
          if (shouldTransition) {
            return {
              ...signal,
              currentState: states[(currentIndex + 1) % 3],
            };
          }
          return signal;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSignalClick = (signal: SignalWithState) => {
    setSelectedItem('signal', signal.id, signal);
    map.flyTo([signal.lat, signal.lng], 16, { duration: 0.5 });
  };

  const currentZoom = map.getZoom();

  return (
    <>
      {signals.map((signal) => (
        <CircleMarker
          key={signal.id}
          center={[signal.lat, signal.lng]}
          radius={currentZoom > 14 ? 6 : 4}
          pathOptions={{
            color: SIGNAL_COLORS[signal.currentState],
            weight: 2,
            fillColor: SIGNAL_COLORS[signal.currentState],
            fillOpacity: 0.8,
            className: 'transition-all duration-300',
          }}
          eventHandlers={{
            click: () => handleSignalClick(signal),
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {(['red', 'yellow', 'green'] as SignalState[]).map((state) => (
                    <div
                      key={state}
                      className="w-3 h-3 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: signal.currentState === state
                          ? SIGNAL_COLORS[state]
                          : '#1a1a1a',
                        boxShadow: signal.currentState === state
                          ? `0 0 8px ${SIGNAL_COLORS[state]}`
                          : 'none',
                      }}
                    />
                  ))}
                </div>
                {signal.isSmart && (
                  <span className="text-[10px] bg-[#00f0ff]/20 text-[#00f0ff] px-1.5 py-0.5 rounded font-mono">
                    SMART
                  </span>
                )}
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-1">
                {signal.intersection}
              </h3>
              <p className="text-[11px] text-[#8b9cb3] mb-2 font-mono">
                {signal.approach} Approach
              </p>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Status</span>
                  <span
                    className="font-mono uppercase"
                    style={{ color: SIGNAL_COLORS[signal.currentState] }}
                  >
                    {signal.currentState}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Cycle</span>
                  <span className="text-white font-mono">90s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b9cb3]">Connection</span>
                  <span className="text-[#00ff88] font-mono">ONLINE</span>
                </div>
                {signal.isSmart && (
                  <div className="flex justify-between">
                    <span className="text-[#8b9cb3]">AI Optimization</span>
                    <span className="text-[#00f0ff] font-mono">ACTIVE</span>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
