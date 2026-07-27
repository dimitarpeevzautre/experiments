import {
  allStops,
  currentDayNumber,
  hasWildCamping,
  nextStop,
  nightsOut,
  stopTypeCounts,
  toggleStop,
  totalKm,
  tripProgress,
  type TripPlan,
} from '../trips';

const PLAN: TripPlan = {
  id: 'test-trip',
  title: 'Test trip',
  tagline: 'For testing',
  icon: '🧪',
  regions: ['Testland'],
  days: [
    {
      day: 1,
      title: 'Day one',
      driveKm: 100,
      stops: [
        { id: 's1', type: 'attraction', name: 'S1', coords: { latitude: 0, longitude: 0 }, description: '' },
        { id: 's2', type: 'restaurant', name: 'S2', coords: { latitude: 0, longitude: 0 }, description: '' },
        { id: 's3', type: 'campsite', name: 'S3', coords: { latitude: 0, longitude: 0 }, description: '', overnight: true },
      ],
    },
    {
      day: 2,
      title: 'Day two',
      driveKm: 50,
      stops: [
        { id: 's4', type: 'attraction', name: 'S4', coords: { latitude: 0, longitude: 0 }, description: '' },
        { id: 's5', type: 'wild-camping', name: 'S5', coords: { latitude: 0, longitude: 0 }, description: '', overnight: true },
      ],
    },
  ],
};

describe('plan aggregates', () => {
  it('flattens stops and sums distances', () => {
    expect(allStops(PLAN).map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4', 's5']);
    expect(totalKm(PLAN)).toBe(150);
    expect(nightsOut(PLAN)).toBe(2);
  });

  it('counts stops by type', () => {
    expect(stopTypeCounts(PLAN)).toEqual({
      attraction: 2,
      restaurant: 1,
      campsite: 1,
      'wild-camping': 1,
    });
  });

  it('detects wild camping', () => {
    expect(hasWildCamping(PLAN)).toBe(true);
    expect(hasWildCamping({ ...PLAN, days: [PLAN.days[0]] })).toBe(false);
  });
});

describe('tripProgress', () => {
  it('tracks per-day and overall progress', () => {
    const p = tripProgress(PLAN, ['s1', 's4']);
    expect(p.done).toBe(2);
    expect(p.total).toBe(5);
    expect(p.complete).toBe(false);
    expect(p.byDay).toEqual([
      { day: 1, done: 1, total: 3 },
      { day: 2, done: 1, total: 2 },
    ]);
  });

  it('ignores stale stop ids', () => {
    expect(tripProgress(PLAN, ['ghost']).done).toBe(0);
  });

  it('reports completion', () => {
    expect(tripProgress(PLAN, ['s1', 's2', 's3', 's4', 's5']).complete).toBe(true);
  });
});

describe('nextStop / currentDayNumber', () => {
  it('returns the first uncompleted stop in day order', () => {
    expect(nextStop(PLAN, [])?.stop.id).toBe('s1');
    expect(nextStop(PLAN, ['s1', 's2'])?.stop.id).toBe('s3');
    expect(nextStop(PLAN, ['s1', 's2', 's3'])?.stop.id).toBe('s4');
  });

  it('skips completed stops even out of order', () => {
    expect(nextStop(PLAN, ['s1', 's3'])?.stop.id).toBe('s2');
  });

  it('returns null when everything is done', () => {
    expect(nextStop(PLAN, ['s1', 's2', 's3', 's4', 's5'])).toBeNull();
  });

  it('derives the current day', () => {
    expect(currentDayNumber(PLAN, [])).toBe(1);
    expect(currentDayNumber(PLAN, ['s1', 's2', 's3'])).toBe(2);
    expect(currentDayNumber(PLAN, ['s1', 's2', 's3', 's4', 's5'])).toBe(2);
  });
});

describe('toggleStop', () => {
  it('adds and removes without mutating', () => {
    const c0: string[] = [];
    const c1 = toggleStop(c0, 's1');
    const c2 = toggleStop(c1, 's1');
    expect(c1).toEqual(['s1']);
    expect(c2).toEqual([]);
    expect(c0).toEqual([]);
  });
});
