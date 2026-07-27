import { useCallback, useSyncExternalStore } from 'react';

import type { LatLng } from '@/core/geo';
import type { NarrationCandidate } from '@/core/narration';
import { driveSession, type DriveStatus } from '@/services/driveSession';

export type { DriveStatus };

export interface DriveState {
  status: DriveStatus;
  position: LatLng | null;
  heading: number | null;
  speedKmh: number | null;
  nowPlaying: NarrationCandidate | null;
  upNext: NarrationCandidate[];
  playedCount: number;
  startGps: () => Promise<void>;
  startSimulation: () => void;
  skip: () => void;
  stop: () => void;
}

/**
 * React view over the shared drive session (see services/driveSession). The
 * session outlives the screen so narration keeps running when the guest
 * switches tabs or the car display takes over.
 */
export function useDrive(): DriveState {
  const state = useSyncExternalStore(
    useCallback((onStoreChange: () => void) => driveSession.subscribe(onStoreChange), []),
    () => driveSession.getState(),
  );

  return {
    ...state,
    startGps: () => driveSession.startGps(),
    startSimulation: () => driveSession.startSimulation(),
    skip: () => driveSession.skip(),
    stop: () => driveSession.stop(),
  };
}
