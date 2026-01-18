import { create } from 'zustand';
import { cameraInfo } from '@/lib/data/cameras';
import { trafficSignalInfo } from '@/lib/data/traffic-signals';

export interface LayerVisibility {
  orangeLine: boolean;
  metroBus: boolean;
  speedoBus: boolean;
  trafficSignals: boolean;
  cameras: boolean;
  heatmap: boolean;
  roads: boolean;
}

export interface Stats {
  activeOrangeLineTrains: number;
  activeMetroBuses: number;
  activeSpeedoBuses: number;
  camerasOnline: number;
  trafficIndex: number;
  avgSpeed: number;
}

export interface Alert {
  id: string;
  type: 'incident' | 'congestion' | 'maintenance' | 'info';
  title: string;
  description: string;
  location: string;
  timestamp: Date;
  lat?: number;
  lng?: number;
}

interface MapState {
  center: [number, number];
  zoom: number;
  layers: LayerVisibility;
  stats: Stats;
  alerts: Alert[];
  selectedItem: {
    type: 'station' | 'signal' | 'camera' | 'vehicle' | null;
    id: number | null;
    data: unknown;
  };

  // Actions
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setAllLayers: (visible: boolean) => void;
  updateStats: (stats: Partial<Stats>) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  setSelectedItem: (type: MapState['selectedItem']['type'], id: number | null, data?: unknown) => void;
  clearSelection: () => void;
}

const LAHORE_CENTER: [number, number] = [31.5204, 74.3587];
const DEFAULT_ZOOM = 12;

export const useMapStore = create<MapState>((set) => ({
  center: LAHORE_CENTER,
  zoom: DEFAULT_ZOOM,

  layers: {
    orangeLine: false,
    metroBus: false,
    speedoBus: false,
    trafficSignals: false,
    cameras: false,
    heatmap: false,
    roads: true, // ENABLED BY DEFAULT FOR VERIFICATION
  },

  stats: {
    activeOrangeLineTrains: 12,
    activeMetroBuses: 64,
    activeSpeedoBuses: 156,
    camerasOnline: cameraInfo.onlineCameras,
    trafficIndex: 42,
    avgSpeed: 28,
  },

  alerts: [],

  selectedItem: {
    type: null,
    id: null,
    data: null,
  },

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),

  toggleLayer: (layer) => set((state) => ({
    layers: {
      ...state.layers,
      [layer]: !state.layers[layer],
    },
  })),

  setAllLayers: (visible) => set((state) => ({
    layers: Object.keys(state.layers).reduce((acc, key) => ({
      ...acc,
      [key]: visible,
    }), {} as LayerVisibility),
  })),

  updateStats: (newStats) => set((state) => ({
    stats: { ...state.stats, ...newStats },
  })),

  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 10),
  })),

  removeAlert: (id) => set((state) => ({
    alerts: state.alerts.filter((a) => a.id !== id),
  })),

  clearAlerts: () => set({ alerts: [] }),

  setSelectedItem: (type, id, data = null) => set({
    selectedItem: { type, id, data },
  }),

  clearSelection: () => set({
    selectedItem: { type: null, id: null, data: null },
  }),
}));
