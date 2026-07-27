/** The Stable's camper fleet (demo data — horses live in a stable, after all). */

export interface Camper {
  id: string;
  name: string;
  model: string;
  berths: number;
  seats: number;
  transmission: 'manual' | 'automatic';
  lengthM: number;
  heightM: number;
  emoji: string;
  highlights: string[];
}

export const FLEET: Camper[] = [
  {
    id: 'pony',
    name: 'Pony',
    model: 'VW California Ocean',
    berths: 4,
    seats: 4,
    transmission: 'automatic',
    lengthM: 4.9,
    heightM: 2.0,
    emoji: '🐴',
    highlights: ['Pop-top roof', 'Fits in a normal parking space', 'Kitchenette with 2 burners'],
  },
  {
    id: 'mustang',
    name: 'Mustang',
    model: 'Ford Transit Custom Nugget',
    berths: 4,
    seats: 5,
    transmission: 'manual',
    lengthM: 5.3,
    heightM: 2.1,
    emoji: '🐎',
    highlights: ['Rear kitchen', 'Solar panel + 2nd battery', 'Roof tent for the kids'],
  },
  {
    id: 'stallion',
    name: 'Stallion',
    model: 'Fiat Ducato Adria Twin Plus',
    berths: 4,
    seats: 4,
    transmission: 'manual',
    lengthM: 6.4,
    heightM: 2.65,
    emoji: '🦄',
    highlights: ['Wet room with shower & toilet', 'Diesel heating', '110L fridge'],
  },
];

export function getCamper(id: string): Camper | undefined {
  return FLEET.find((c) => c.id === id);
}
