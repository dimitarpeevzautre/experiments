/**
 * Booking domain model. Dates are ISO `YYYY-MM-DD` strings in local time —
 * rental days are calendar days, not 24h windows.
 */

export interface BookingExtra {
  name: string;
  pricePerBooking: number;
}

export interface Booking {
  id: string;
  /** Human reference shown to the guest, e.g. "TS-2026-0142". */
  reference: string;
  camperId: string;
  /** Pickup date, YYYY-MM-DD. */
  start: string;
  /** Return date, YYYY-MM-DD. */
  end: string;
  pickupLocation: string;
  dropoffLocation: string;
  guests: number;
  pricePerNight: number;
  extras: BookingExtra[];
  depositPaid: boolean;
  cancelled?: boolean;
}

export type BookingPhase = 'upcoming' | 'active' | 'completed' | 'cancelled';

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function nights(booking: Pick<Booking, 'start' | 'end'>): number {
  const ms = parseISODate(booking.end).getTime() - parseISODate(booking.start).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function totalPrice(booking: Booking): number {
  const extras = booking.extras.reduce((sum, e) => sum + e.pricePerBooking, 0);
  return nights(booking) * booking.pricePerNight + extras;
}

/** Phase of the booking relative to `today` (a YYYY-MM-DD string). */
export function bookingPhase(booking: Booking, today: string): BookingPhase {
  if (booking.cancelled) return 'cancelled';
  if (today < booking.start) return 'upcoming';
  if (today > booking.end) return 'completed';
  return 'active';
}

/** Whole days from `today` until pickup; 0 when pickup is today or past. */
export function daysUntilPickup(booking: Booking, today: string): number {
  const ms = parseISODate(booking.start).getTime() - parseISODate(today).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** The booking a guest most likely cares about right now: active, else next upcoming. */
export function primaryBooking(bookings: readonly Booking[], today: string): Booking | null {
  const live = bookings.filter((b) => !b.cancelled);
  const active = live.find((b) => bookingPhase(b, today) === 'active');
  if (active) return active;

  const upcoming = live
    .filter((b) => bookingPhase(b, today) === 'upcoming')
    .sort((a, b) => a.start.localeCompare(b.start));
  return upcoming[0] ?? null;
}

export function formatDateRange(booking: Pick<Booking, 'start' | 'end'>): string {
  const fmt = (iso: string) => {
    const d = parseISODate(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  return `${fmt(booking.start)} → ${fmt(booking.end)}`;
}

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
