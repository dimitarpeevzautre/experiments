import {
  bookingPhase,
  daysUntilPickup,
  nights,
  primaryBooking,
  todayISO,
  totalPrice,
  type Booking,
} from '../booking';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    reference: 'TS-1',
    camperId: 'pony',
    start: '2026-07-25',
    end: '2026-08-03',
    pickupLocation: 'Sofia',
    dropoffLocation: 'Sofia',
    guests: 2,
    pricePerNight: 100,
    extras: [],
    depositPaid: true,
    ...overrides,
  };
}

describe('nights', () => {
  it('counts calendar nights', () => {
    expect(nights({ start: '2026-07-25', end: '2026-08-03' })).toBe(9);
    expect(nights({ start: '2026-07-25', end: '2026-07-26' })).toBe(1);
  });

  it('never goes negative', () => {
    expect(nights({ start: '2026-07-25', end: '2026-07-25' })).toBe(0);
    expect(nights({ start: '2026-07-25', end: '2026-07-20' })).toBe(0);
  });
});

describe('totalPrice', () => {
  it('is nights * rate + extras', () => {
    const b = makeBooking({
      extras: [
        { name: 'chairs', pricePerBooking: 25 },
        { name: 'insurance', pricePerBooking: 90 },
      ],
    });
    expect(totalPrice(b)).toBe(9 * 100 + 115);
  });
});

describe('bookingPhase', () => {
  const b = makeBooking();

  it('derives phase from today', () => {
    expect(bookingPhase(b, '2026-07-01')).toBe('upcoming');
    expect(bookingPhase(b, '2026-07-25')).toBe('active');
    expect(bookingPhase(b, '2026-08-03')).toBe('active');
    expect(bookingPhase(b, '2026-08-04')).toBe('completed');
  });

  it('cancelled wins over dates', () => {
    expect(bookingPhase(makeBooking({ cancelled: true }), '2026-07-25')).toBe('cancelled');
  });
});

describe('daysUntilPickup', () => {
  it('counts down and floors at zero', () => {
    expect(daysUntilPickup(makeBooking(), '2026-07-20')).toBe(5);
    expect(daysUntilPickup(makeBooking(), '2026-07-25')).toBe(0);
    expect(daysUntilPickup(makeBooking(), '2026-07-30')).toBe(0);
  });
});

describe('primaryBooking', () => {
  const active = makeBooking({ id: 'active', start: '2026-07-20', end: '2026-07-30' });
  const soon = makeBooking({ id: 'soon', start: '2026-08-10', end: '2026-08-15' });
  const later = makeBooking({ id: 'later', start: '2026-09-01', end: '2026-09-05' });
  const done = makeBooking({ id: 'done', start: '2026-05-01', end: '2026-05-05' });

  it('prefers the active booking', () => {
    expect(primaryBooking([done, later, active, soon], '2026-07-25')?.id).toBe('active');
  });

  it('falls back to the earliest upcoming booking', () => {
    expect(primaryBooking([done, later, soon], '2026-07-25')?.id).toBe('soon');
  });

  it('ignores cancelled bookings', () => {
    const cancelled = makeBooking({ id: 'c', start: '2026-07-20', end: '2026-07-30', cancelled: true });
    expect(primaryBooking([cancelled, soon], '2026-07-25')?.id).toBe('soon');
  });

  it('returns null when nothing is left', () => {
    expect(primaryBooking([done], '2026-07-25')).toBeNull();
  });
});

describe('todayISO', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
