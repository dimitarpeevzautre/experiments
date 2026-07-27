import type { Attraction } from '../attractions';
import { destinationPoint, type LatLng } from '../geo';
import { DEFAULT_NARRATION_OPTIONS, TripNarrator, findCandidates, narrationScript } from '../narration';

const HERE: LatLng = { latitude: 42.6977, longitude: 23.3219 };

function attractionAt(id: string, coords: LatLng): Attraction {
  return {
    id,
    name: id,
    nameBg: id,
    category: 'nature',
    region: 'test',
    coords,
    blurb: 'blurb',
    narration: 'Narration text.',
    visitMinutes: 30,
  };
}

// Heading 0 = due north.
const near = attractionAt('near', destinationPoint(HERE, 90, 3)); // 3 km east
const aheadNorth = attractionAt('ahead-north', destinationPoint(HERE, 5, 20)); // 20 km, ~north
const behindSouth = attractionAt('behind-south', destinationPoint(HERE, 180, 20)); // 20 km south
const farAway = attractionAt('far', destinationPoint(HERE, 0, 200));
const ALL = [near, aheadNorth, behindSouth, farAway];

describe('findCandidates', () => {
  it('includes nearby attractions regardless of heading', () => {
    const c = findCandidates(HERE, 180, ALL, new Set());
    expect(c.map((x) => x.attraction.id)).toContain('near');
  });

  it('includes attractions ahead within the cone, excludes behind', () => {
    const ids = findCandidates(HERE, 0, ALL, new Set()).map((x) => x.attraction.id);
    expect(ids).toContain('ahead-north');
    expect(ids).not.toContain('behind-south');
  });

  it('ignores heading-based candidates when heading is unknown', () => {
    const ids = findCandidates(HERE, null, ALL, new Set()).map((x) => x.attraction.id);
    expect(ids).toEqual(['near']);
  });

  it('excludes already played attractions', () => {
    const ids = findCandidates(HERE, 0, ALL, new Set(['near'])).map((x) => x.attraction.id);
    expect(ids).not.toContain('near');
  });

  it('never includes attractions beyond the ahead radius', () => {
    const ids = findCandidates(HERE, 0, ALL, new Set()).map((x) => x.attraction.id);
    expect(ids).not.toContain('far');
  });

  it('ranks near above ahead', () => {
    const c = findCandidates(HERE, 0, ALL, new Set());
    expect(c[0].attraction.id).toBe('near');
    expect(c[0].reason).toBe('near');
  });

  it('respects a custom near radius', () => {
    const c = findCandidates(HERE, null, ALL, new Set(), {
      ...DEFAULT_NARRATION_OPTIONS,
      nearRadiusKm: 1,
    });
    expect(c).toHaveLength(0);
  });
});

describe('TripNarrator', () => {
  it('plays each attraction at most once', () => {
    const narrator = new TripNarrator(ALL);
    const first = narrator.next(HERE, 0);
    const second = narrator.next(HERE, 0);
    const third = narrator.next(HERE, 0);
    expect(first?.attraction.id).toBe('near');
    expect(second?.attraction.id).toBe('ahead-north');
    expect(third).toBeNull();
  });

  it('reset() allows replay', () => {
    const narrator = new TripNarrator([near]);
    expect(narrator.next(HERE, null)?.attraction.id).toBe('near');
    expect(narrator.next(HERE, null)).toBeNull();
    narrator.reset();
    expect(narrator.next(HERE, null)?.attraction.id).toBe('near');
  });
});

describe('narrationScript', () => {
  it('uses a proximity intro when near', () => {
    const [c] = findCandidates(HERE, null, [near], new Set());
    expect(narrationScript(c)).toMatch(/^You are near near\./);
  });

  it('mentions distance when ahead', () => {
    const [c] = findCandidates(HERE, 0, [aheadNorth], new Set());
    expect(narrationScript(c)).toMatch(/^About 20 kilometres ahead is ahead-north\./);
  });
});
