import type { Booking } from '@/core/booking';

/**
 * Demo bookings. In production these come from the thestable.bg booking API
 * (see docs/ARCHITECTURE.md); prices are in EUR.
 */
export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'b-2026-0142',
    reference: 'TS-2026-0142',
    camperId: 'mustang',
    start: '2026-07-25',
    end: '2026-08-03',
    pickupLocation: 'The Stable base — Sofia',
    dropoffLocation: 'The Stable base — Sofia',
    guests: 4,
    pricePerNight: 95,
    extras: [
      { name: 'Camping table & chairs', pricePerBooking: 25 },
      { name: 'Child seat', pricePerBooking: 15 },
      { name: 'Full insurance (zero excess)', pricePerBooking: 90 },
    ],
    depositPaid: true,
  },
  {
    id: 'b-2026-0198',
    reference: 'TS-2026-0198',
    camperId: 'pony',
    start: '2026-09-11',
    end: '2026-09-15',
    pickupLocation: 'The Stable base — Sofia',
    dropoffLocation: 'Varna airport handover',
    guests: 2,
    pricePerNight: 79,
    extras: [{ name: 'One-way fee', pricePerBooking: 120 }],
    depositPaid: false,
  },
  {
    id: 'b-2026-0077',
    reference: 'TS-2026-0077',
    camperId: 'stallion',
    start: '2026-05-01',
    end: '2026-05-06',
    pickupLocation: 'The Stable base — Sofia',
    dropoffLocation: 'The Stable base — Sofia',
    guests: 3,
    pricePerNight: 110,
    extras: [],
    depositPaid: true,
  },
];
