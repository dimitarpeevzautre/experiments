import type { Booking } from '@/core/booking';
import { SEED_BOOKINGS } from '@/data/bookings';

/**
 * Booking API client. Currently a mock over seed data; swap the internals for
 * fetch() against the thestable.bg backend without touching the UI.
 */
export async function fetchBookings(): Promise<Booking[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return SEED_BOOKINGS;
}

export async function fetchBooking(id: string): Promise<Booking | null> {
  const bookings = await fetchBookings();
  return bookings.find((b) => b.id === id) ?? null;
}
