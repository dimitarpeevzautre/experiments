/**
 * Multi-day trip plans: a curated itinerary of stops grouped into days, which
 * a guest can "start" and follow through, checking stops off as they go.
 * Pure domain logic — persistence lives in services/tripStore, content in
 * data/trips.
 */

import type { LatLng } from './geo';

export type StopType = 'attraction' | 'restaurant' | 'campsite' | 'wild-camping' | 'scenic';

export interface TripStop {
  id: string;
  type: StopType;
  name: string;
  coords: LatLng;
  description: string;
  /** Links into the attraction catalogue (drive-mode narration, detail screen). */
  attractionId?: string;
  camperNotes?: string;
  /** Marks the stop where this day ends (a campsite or wild-camping spot). */
  overnight?: boolean;
}

export interface TripDay {
  day: number;
  title: string;
  driveKm: number;
  stops: TripStop[];
}

export interface TripPlan {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  regions: string[];
  days: TripDay[];
}

export const STOP_TYPE_META: Record<StopType, { label: string; icon: string }> = {
  attraction: { label: 'Sight', icon: '⭐' },
  restaurant: { label: 'Food & drink', icon: '🍽️' },
  campsite: { label: 'Campsite', icon: '🏕️' },
  'wild-camping': { label: 'Wild camping', icon: '⛺' },
  scenic: { label: 'Scenic stop', icon: '🌄' },
};

export function allStops(plan: TripPlan): TripStop[] {
  return plan.days.flatMap((d) => d.stops);
}

export function totalKm(plan: TripPlan): number {
  return plan.days.reduce((sum, d) => sum + d.driveKm, 0);
}

export function nightsOut(plan: TripPlan): number {
  return allStops(plan).filter((s) => s.overnight).length;
}

/** Count stops by type, e.g. to render "8 sights · 4 food stops · 3 nights". */
export function stopTypeCounts(plan: TripPlan): Partial<Record<StopType, number>> {
  const counts: Partial<Record<StopType, number>> = {};
  for (const stop of allStops(plan)) {
    counts[stop.type] = (counts[stop.type] ?? 0) + 1;
  }
  return counts;
}

export interface TripProgress {
  done: number;
  total: number;
  complete: boolean;
  byDay: { day: number; done: number; total: number }[];
}

/** Progress against a plan; stale ids in `completed` (edited plans) are ignored. */
export function tripProgress(plan: TripPlan, completed: readonly string[]): TripProgress {
  const completedSet = new Set(completed);
  const byDay = plan.days.map((d) => ({
    day: d.day,
    done: d.stops.filter((s) => completedSet.has(s.id)).length,
    total: d.stops.length,
  }));
  const done = byDay.reduce((sum, d) => sum + d.done, 0);
  const total = byDay.reduce((sum, d) => sum + d.total, 0);
  return { done, total, complete: total > 0 && done === total, byDay };
}

/** First uncompleted stop in day order — what the guest should head for next. */
export function nextStop(
  plan: TripPlan,
  completed: readonly string[],
): { day: TripDay; stop: TripStop } | null {
  const completedSet = new Set(completed);
  for (const day of plan.days) {
    for (const stop of day.stops) {
      if (!completedSet.has(stop.id)) return { day, stop };
    }
  }
  return null;
}

/** The day the guest is currently on (day of the next stop; last day when done). */
export function currentDayNumber(plan: TripPlan, completed: readonly string[]): number {
  const next = nextStop(plan, completed);
  return next ? next.day.day : plan.days[plan.days.length - 1]?.day ?? 1;
}

export function toggleStop(completed: readonly string[], stopId: string): string[] {
  return completed.includes(stopId)
    ? completed.filter((id) => id !== stopId)
    : [...completed, stopId];
}

/** True when a plan contains wild-camping stops (used to show the legal note). */
export function hasWildCamping(plan: TripPlan): boolean {
  return allStops(plan).some((s) => s.type === 'wild-camping');
}
