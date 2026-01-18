// Export all data
export * from './orange-line';
export * from './metro-bus';
export * from './speedo-bus';
export * from './traffic-signals';
export * from './cameras';
export * from './road-network';

// Map configuration
export const mapConfig = {
  center: [31.5204, 74.3587] as [number, number],
  zoom: 12,
  minZoom: 10,
  maxZoom: 18,
  bounds: [
    [31.30, 74.10], // Southwest
    [31.75, 74.55], // Northeast
  ] as [[number, number], [number, number]],

  // Dark tile options
  tileProviders: {
    cartoDark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    stadiaDark: {
      url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    },
  },
};

// Color palette for reference
export const colors = {
  // Primary
  spaceBblack: '#0a0a0f',
  midnightBlue: '#0d1117',
  deepNavy: '#161b22',
  slateGray: '#21262d',
  coolGray: '#8b9cb3',
  silver: '#c9d1d9',

  // Accents
  electricCyan: '#00f0ff',
  hotMagenta: '#ff0080',
  amberGold: '#ffb800',
  neonGreen: '#00ff88',

  // Transit
  orangeLine: '#ff6b00',
  metroBus: '#dc2626',
  speedoBus: '#3b82f6',

  // Signals
  signalRed: '#ef4444',
  signalYellow: '#eab308',
  signalGreen: '#22c55e',
};
