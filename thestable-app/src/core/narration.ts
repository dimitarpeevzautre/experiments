/**
 * Drive-mode narration selection.
 *
 * Given the vehicle's position and heading, pick which attraction to talk
 * about next. Two ways in:
 *   - "near":  within `nearRadiusKm` of the vehicle, regardless of heading
 *   - "ahead": within `aheadRadiusKm` AND roughly in the direction of travel
 *              (bearing to the attraction within `aheadConeDeg` of heading)
 *
 * Attractions already narrated this trip are never repeated.
 */

import type { Attraction } from './attractions';
import { bearingDeg, distanceKm, headingDeltaDeg, type LatLng } from './geo';

export interface NarrationOptions {
  nearRadiusKm: number;
  aheadRadiusKm: number;
  aheadConeDeg: number;
}

export const DEFAULT_NARRATION_OPTIONS: NarrationOptions = {
  nearRadiusKm: 6,
  aheadRadiusKm: 35,
  aheadConeDeg: 35,
};

export interface NarrationCandidate {
  attraction: Attraction;
  distanceKm: number;
  reason: 'near' | 'ahead';
}

export function findCandidates(
  position: LatLng,
  heading: number | null,
  attractions: readonly Attraction[],
  playedIds: ReadonlySet<string>,
  options: NarrationOptions = DEFAULT_NARRATION_OPTIONS,
): NarrationCandidate[] {
  const candidates: NarrationCandidate[] = [];

  for (const attraction of attractions) {
    if (playedIds.has(attraction.id)) continue;

    const d = distanceKm(position, attraction.coords);
    if (d <= options.nearRadiusKm) {
      candidates.push({ attraction, distanceKm: d, reason: 'near' });
      continue;
    }

    if (heading !== null && d <= options.aheadRadiusKm) {
      const delta = headingDeltaDeg(heading, bearingDeg(position, attraction.coords));
      if (delta <= options.aheadConeDeg) {
        candidates.push({ attraction, distanceKm: d, reason: 'ahead' });
      }
    }
  }

  // Near beats ahead; closer beats farther.
  return candidates.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === 'near' ? -1 : 1;
    return a.distanceKm - b.distanceKm;
  });
}

/** Build the spoken text for a candidate, including a distance-aware intro. */
export function narrationScript(candidate: NarrationCandidate): string {
  const { attraction, reason } = candidate;
  const km = Math.round(candidate.distanceKm);
  const intro =
    reason === 'near'
      ? `You are near ${attraction.name}.`
      : `About ${km} kilometres ahead is ${attraction.name}.`;
  return `${intro} ${attraction.narration}`;
}

/**
 * Stateful trip narrator: tracks what has been played so each attraction is
 * announced at most once per trip.
 */
export class TripNarrator {
  private played = new Set<string>();

  constructor(
    private readonly attractions: readonly Attraction[],
    private readonly options: NarrationOptions = DEFAULT_NARRATION_OPTIONS,
  ) {}

  get playedIds(): ReadonlySet<string> {
    return this.played;
  }

  peek(position: LatLng, heading: number | null): NarrationCandidate[] {
    return findCandidates(position, heading, this.attractions, this.played, this.options);
  }

  /** Pick the best candidate, mark it played, and return it (or null). */
  next(position: LatLng, heading: number | null): NarrationCandidate | null {
    const [best] = this.peek(position, heading);
    if (!best) return null;
    this.played.add(best.attraction.id);
    return best;
  }

  /** Mark an attraction played out-of-band (e.g. manually selected in the car UI). */
  markPlayed(attractionId: string): void {
    this.played.add(attractionId);
  }

  reset(): void {
    this.played.clear();
  }
}
