import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { bearingDeg, distanceKm, interpolate, type LatLng } from '@/core/geo';
import { TripNarrator, narrationScript, type NarrationCandidate } from '@/core/narration';
import { ATTRACTIONS } from '@/data/attractions';
import { DEMO_ROUTE } from '@/data/routes';
import { speak, stopSpeaking } from '@/services/narrator';

export type DriveStatus = 'idle' | 'locating' | 'driving' | 'simulating' | 'denied';

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

const SIM_TICK_MS = 1500;
const SIM_KM_PER_TICK = 1.6; // ~64 km/h at 60x time compression

export function useDrive(): DriveState {
  const [status, setStatus] = useState<DriveStatus>('idle');
  const [position, setPosition] = useState<LatLng | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NarrationCandidate | null>(null);
  const [upNext, setUpNext] = useState<NarrationCandidate[]>([]);
  const [playedCount, setPlayedCount] = useState(0);

  const narrator = useRef(new TripNarrator(ATTRACTIONS));
  const speaking = useRef(false);
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const onFix = useCallback((pos: LatLng, hdg: number | null) => {
    setPosition(pos);
    setHeading(hdg);
    setUpNext(narrator.current.peek(pos, hdg));

    if (speaking.current) return;
    const candidate = narrator.current.next(pos, hdg);
    if (!candidate) return;

    speaking.current = true;
    setNowPlaying(candidate);
    setPlayedCount((n) => n + 1);
    speak(narrationScript(candidate), () => {
      speaking.current = false;
      setNowPlaying(null);
    });
  }, []);

  const stop = useCallback(() => {
    watcher.current?.remove();
    watcher.current = null;
    if (simTimer.current) clearInterval(simTimer.current);
    simTimer.current = null;
    stopSpeaking();
    speaking.current = false;
    setNowPlaying(null);
    setStatus('idle');
  }, []);

  const skip = useCallback(() => {
    stopSpeaking(); // onDone fires via onStopped, freeing the queue
  }, []);

  const startGps = useCallback(async () => {
    stop();
    setStatus('locating');
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      setStatus('denied');
      return;
    }
    watcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 150, timeInterval: 5000 },
      (loc) => {
        setSpeedKmh(loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed * 3.6 : null);
        onFix(
          { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
          loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : null,
        );
      },
    );
    setStatus('driving');
  }, [onFix, stop]);

  const startSimulation = useCallback(() => {
    stop();
    narrator.current.reset();
    setPlayedCount(0);

    const { waypoints } = DEMO_ROUTE;
    let segment = 0;
    let progressKm = 0;

    setStatus('simulating');
    setSpeedKmh(64);

    simTimer.current = setInterval(() => {
      if (segment >= waypoints.length - 1) {
        if (simTimer.current) clearInterval(simTimer.current);
        simTimer.current = null;
        setSpeedKmh(0);
        return;
      }
      const from = waypoints[segment];
      const to = waypoints[segment + 1];
      const segmentKm = distanceKm(from, to);

      progressKm += SIM_KM_PER_TICK;
      if (progressKm >= segmentKm) {
        progressKm -= segmentKm;
        segment += 1;
      }
      const a = waypoints[Math.min(segment, waypoints.length - 1)];
      const b = waypoints[Math.min(segment + 1, waypoints.length - 1)];
      const t = a === b ? 0 : Math.min(1, progressKm / Math.max(0.001, distanceKm(a, b)));
      onFix(interpolate(a, b, t), bearingDeg(a, b));
    }, SIM_TICK_MS);
  }, [onFix, stop]);

  useEffect(() => stop, [stop]);

  return {
    status,
    position,
    heading,
    speedKmh,
    nowPlaying,
    upNext,
    playedCount,
    startGps,
    startSimulation,
    skip,
    stop,
  };
}
