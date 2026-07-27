import type { LatLng } from '@/core/geo';

/**
 * Demo route for the drive simulator: Sofia → Koprivshtitsa → Shipka →
 * Buzludzha → Veliko Tarnovo. Waypoints roughly follow the real roads and
 * pass within narration range of several seeded attractions.
 */
export interface DemoRoute {
  id: string;
  title: string;
  waypoints: LatLng[];
}

export const DEMO_ROUTE: DemoRoute = {
  id: 'sofia-tarnovo',
  title: 'Sofia → Veliko Tarnovo (demo drive)',
  waypoints: [
    { latitude: 42.6977, longitude: 23.3219 }, // Sofia centre
    { latitude: 42.65, longitude: 23.62 }, // Trakia direction, Elin Pelin
    { latitude: 42.6, longitude: 23.95 }, // near Ihtiman
    { latitude: 42.6376, longitude: 24.3597 }, // Koprivshtitsa
    { latitude: 42.6, longitude: 24.7 }, // Sredna gora roads
    { latitude: 42.62, longitude: 25.0 }, // towards Karlovo valley
    { latitude: 42.7196, longitude: 25.3213 }, // Shipka town
    { latitude: 42.7358, longitude: 25.3934 }, // Buzludzha
    { latitude: 42.9, longitude: 25.55 }, // descending north
    { latitude: 43.0836, longitude: 25.6522 }, // Tsarevets, Veliko Tarnovo
  ],
};
