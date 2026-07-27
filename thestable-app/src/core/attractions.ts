import type { LatLng } from './geo';

export type AttractionCategory =
  | 'monastery'
  | 'fortress'
  | 'nature'
  | 'old-town'
  | 'monument'
  | 'cave'
  | 'coast';

export interface Attraction {
  id: string;
  name: string;
  nameBg: string;
  category: AttractionCategory;
  region: string;
  coords: LatLng;
  /** One-line teaser shown in lists. */
  blurb: string;
  /** The full spoken script for drive-mode narration. */
  narration: string;
  /** Rough time needed for a stop, in minutes. */
  visitMinutes: number;
  camperNotes?: string;
}

export const CATEGORY_LABELS: Record<AttractionCategory, string> = {
  monastery: 'Monastery',
  fortress: 'Fortress',
  nature: 'Nature',
  'old-town': 'Old town',
  monument: 'Monument',
  cave: 'Cave',
  coast: 'Coast',
};

export const CATEGORY_ICONS: Record<AttractionCategory, string> = {
  monastery: '⛪',
  fortress: '🏰',
  nature: '🏔️',
  'old-town': '🏘️',
  monument: '🗿',
  cave: '🕳️',
  coast: '🌊',
};
