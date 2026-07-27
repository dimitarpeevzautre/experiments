import { bearingDeg, destinationPoint, distanceKm, headingDeltaDeg } from '../geo';

const SOFIA = { latitude: 42.6977, longitude: 23.3219 };
const PLOVDIV = { latitude: 42.1354, longitude: 24.7453 };

describe('distanceKm', () => {
  it('is ~133 km from Sofia to Plovdiv', () => {
    const d = distanceKm(SOFIA, PLOVDIV);
    expect(d).toBeGreaterThan(125);
    expect(d).toBeLessThan(140);
  });

  it('is zero for identical points', () => {
    expect(distanceKm(SOFIA, SOFIA)).toBeCloseTo(0, 6);
  });

  it('is symmetric', () => {
    expect(distanceKm(SOFIA, PLOVDIV)).toBeCloseTo(distanceKm(PLOVDIV, SOFIA), 9);
  });
});

describe('bearingDeg', () => {
  it('points north for a point due north', () => {
    const north = { latitude: SOFIA.latitude + 1, longitude: SOFIA.longitude };
    expect(bearingDeg(SOFIA, north)).toBeCloseTo(0, 1);
  });

  it('points roughly east for a point due east', () => {
    const east = { latitude: SOFIA.latitude, longitude: SOFIA.longitude + 1 };
    const b = bearingDeg(SOFIA, east);
    expect(b).toBeGreaterThan(88);
    expect(b).toBeLessThan(92);
  });

  it('Plovdiv is roughly southeast of Sofia', () => {
    const b = bearingDeg(SOFIA, PLOVDIV);
    expect(b).toBeGreaterThan(100);
    expect(b).toBeLessThan(140);
  });
});

describe('headingDeltaDeg', () => {
  it('handles the 0/360 wraparound', () => {
    expect(headingDeltaDeg(350, 10)).toBe(20);
    expect(headingDeltaDeg(10, 350)).toBe(20);
  });

  it('caps at 180', () => {
    expect(headingDeltaDeg(0, 180)).toBe(180);
    expect(headingDeltaDeg(90, 271)).toBe(179);
  });

  it('is zero for equal headings', () => {
    expect(headingDeltaDeg(123, 123)).toBe(0);
  });
});

describe('destinationPoint', () => {
  it('round-trips with distance and bearing', () => {
    const dest = destinationPoint(SOFIA, 45, 50);
    expect(distanceKm(SOFIA, dest)).toBeCloseTo(50, 1);
    expect(bearingDeg(SOFIA, dest)).toBeCloseTo(45, 0);
  });
});
