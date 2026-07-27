import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persisted state of the trip a guest has started (one active trip at a time). */
export interface ActiveTripState {
  tripId: string;
  /** YYYY-MM-DD the trip was started. */
  startedOn: string;
  completedStopIds: string[];
}

const KEY = 'trip:active';

export async function loadActiveTrip(): Promise<ActiveTripState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActiveTripState) : null;
  } catch {
    return null;
  }
}

export async function saveActiveTrip(state: ActiveTripState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function clearActiveTrip(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
