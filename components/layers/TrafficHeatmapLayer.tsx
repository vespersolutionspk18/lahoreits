'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

// Traffic density points based on major roads and intersections
interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1
}

// Major road corridors for traffic density simulation
const trafficCorridors = [
  // Ferozepur Road - Very Heavy Traffic
  { points: [[31.5640, 74.2920], [31.5520, 74.3030], [31.5340, 74.3170], [31.5150, 74.3290], [31.5040, 74.3340], [31.4900, 74.3400], [31.4600, 74.3500]], intensity: 0.95 },
  // Mall Road - Heavy Traffic
  { points: [[31.5750, 74.2980], [31.5690, 74.3071], [31.5620, 74.3193], [31.5596, 74.3245], [31.5428, 74.3353]], intensity: 0.85 },
  // Canal Road - Medium Traffic
  { points: [[31.4500, 74.2100], [31.4700, 74.2500], [31.5000, 74.3000], [31.5200, 74.3400], [31.5400, 74.3800], [31.5600, 74.4200]], intensity: 0.65 },
  // Ring Road - Low Traffic
  { points: [[31.3800, 74.1800], [31.4200, 74.2300], [31.4600, 74.2900], [31.5000, 74.3500], [31.5400, 74.3900], [31.5800, 74.3800], [31.6200, 74.3200]], intensity: 0.45 },
  // Multan Road - Heavy Traffic
  { points: [[31.5300, 74.2870], [31.5100, 74.2700], [31.5000, 74.2640], [31.4700, 74.2450], [31.4400, 74.2250], [31.4200, 74.2100]], intensity: 0.80 },
  // GT Road - Medium Traffic
  { points: [[31.5800, 74.3370], [31.5900, 74.3500], [31.6000, 74.3600], [31.6200, 74.3800], [31.6400, 74.4000]], intensity: 0.70 },
  // Jail Road - Heavy Traffic
  { points: [[31.5596, 74.3245], [31.5450, 74.3450], [31.5300, 74.3650], [31.5150, 74.3850]], intensity: 0.75 },
  // Defence Road - Medium Traffic
  { points: [[31.4700, 74.3700], [31.4800, 74.3900], [31.4900, 74.4100]], intensity: 0.55 },
  // Gulberg Main Boulevard - Very Heavy Traffic
  { points: [[31.5100, 74.3406], [31.5150, 74.3500], [31.5200, 74.3600]], intensity: 0.90 },
  // MM Alam Road - Heavy Traffic
  { points: [[31.5100, 74.3480], [31.5180, 74.3490], [31.5230, 74.3495]], intensity: 0.85 },
  // Wahdat Road - Medium Traffic
  { points: [[31.5100, 74.2850], [31.5000, 74.3000], [31.4900, 74.3200]], intensity: 0.60 },
  // Raiwind Road - Medium Traffic
  { points: [[31.4750, 74.2750], [31.4500, 74.2680], [31.4200, 74.2600], [31.4000, 74.2525]], intensity: 0.55 },
  // Allama Iqbal Road - Medium Traffic
  { points: [[31.5600, 74.3400], [31.5700, 74.3510], [31.5800, 74.3630]], intensity: 0.60 },
  // Walled City - Congested
  { points: [[31.5780, 74.3000], [31.5820, 74.3080], [31.5860, 74.3160], [31.5900, 74.3100], [31.5860, 74.3020]], intensity: 0.95 },
  // Data Darbar Area - Very Congested
  { points: [[31.5780, 74.3030], [31.5810, 74.3070], [31.5850, 74.3110]], intensity: 0.98 },
  // Airport Road - Low Traffic
  { points: [[31.5100, 74.3800], [31.5150, 74.3900], [31.5200, 74.4000], [31.5250, 74.4100]], intensity: 0.40 },
];

// Major intersection congestion hotspots
const congestionHotspots: HeatPoint[] = [
  // Critical congestion points
  { lat: 31.5100178, lng: 74.3406101, intensity: 1.0 },   // Liberty Chowk
  { lat: 31.5034963, lng: 74.3318483, intensity: 0.95 },  // Kalma Chowk
  { lat: 31.5491473, lng: 74.3151075, intensity: 0.90 },  // Qartaba Chowk
  { lat: 31.5540198, lng: 74.3043938, intensity: 0.88 },  // Chauburji
  { lat: 31.5806110, lng: 74.3062550, intensity: 0.95 },  // Bhatti Chowk
  { lat: 31.5913590, lng: 74.3057843, intensity: 0.85 },  // Azadi Chowk
  { lat: 31.5595887, lng: 74.3245067, intensity: 0.85 },  // Charing Cross
  { lat: 31.5620040, lng: 74.3193038, intensity: 0.80 },  // Regal Chowk
  { lat: 31.5681727, lng: 74.3100487, intensity: 0.90 },  // Anarkali
  { lat: 31.5655542, lng: 74.3142360, intensity: 0.85 },  // GPO
  { lat: 31.5319327, lng: 74.2872522, intensity: 0.75 },  // Yateem Khana
  { lat: 31.4961470, lng: 74.2640826, intensity: 0.80 },  // Multan Chungi
  { lat: 31.5774003, lng: 74.3364805, intensity: 0.85 },  // Railway Station
  { lat: 31.5120217, lng: 74.3288116, intensity: 0.75 },  // Qaddafi Stadium
  { lat: 31.5313981, lng: 74.3214495, intensity: 0.80 },  // Ichhra
  { lat: 31.4736422, lng: 74.2418249, intensity: 0.70 },  // Thokar
  { lat: 31.5646180, lng: 74.3443034, intensity: 0.65 },  // Garhi Shahu
];

// Generate heat points along corridors
function generateHeatPoints(): [number, number, number][] {
  const points: [number, number, number][] = [];

  // Add corridor points
  trafficCorridors.forEach(corridor => {
    const baseIntensity = corridor.intensity;

    // Interpolate between corridor waypoints
    for (let i = 0; i < corridor.points.length - 1; i++) {
      const start = corridor.points[i];
      const end = corridor.points[i + 1];

      // Add points along segment (every ~200m)
      const steps = 15;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const lat = start[0] + (end[0] - start[0]) * t;
        const lng = start[1] + (end[1] - start[1]) * t;

        // Add some variation to intensity
        const variation = (Math.random() - 0.5) * 0.2;
        const intensity = Math.min(1, Math.max(0.1, baseIntensity + variation));

        points.push([lat, lng, intensity]);
      }
    }
  });

  // Add hotspot points with higher weight
  congestionHotspots.forEach(spot => {
    // Add main point
    points.push([spot.lat, spot.lng, spot.intensity]);

    // Add surrounding points for better visualization
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 0.001; // ~100m radius
      const lat = spot.lat + Math.sin(angle) * distance;
      const lng = spot.lng + Math.cos(angle) * distance;
      points.push([lat, lng, spot.intensity * 0.7]);
    }
  });

  return points;
}

declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: { [key: number]: string };
    }
  ): L.Layer;
}

export default function TrafficHeatmapLayer() {
  const map = useMap();
  const [heatLayer, setHeatLayer] = useState<L.Layer | null>(null);

  useEffect(() => {
    // Generate heat points
    const heatPoints = generateHeatPoints();

    // Create heat layer
    const layer = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.3,
      gradient: {
        0.0: '#00ff88',  // Green - low traffic
        0.3: '#00f0ff',  // Cyan - light traffic
        0.5: '#ffb800',  // Amber - moderate traffic
        0.7: '#ff6b00',  // Orange - heavy traffic
        0.9: '#ff0080',  // Magenta - very heavy
        1.0: '#ef4444',  // Red - congested
      },
    });

    layer.addTo(map);
    setHeatLayer(layer);

    // Animate heat intensity periodically
    const interval = setInterval(() => {
      // Slightly vary the intensity for realistic effect
      const newPoints = heatPoints.map(([lat, lng, intensity]) => {
        const variation = (Math.random() - 0.5) * 0.1;
        const newIntensity = Math.min(1, Math.max(0.1, intensity + variation));
        return [lat, lng, newIntensity] as [number, number, number];
      });

      if (layer && (layer as any).setLatLngs) {
        (layer as any).setLatLngs(newPoints);
      }
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map]);

  return null;
}
