import * as Location from 'expo-location';

import { bearingDeg, distanceKm, interpolate, type LatLng } from '@/core/geo';
import { TripNarrator, narrationScript, type NarrationCandidate } from '@/core/narration';
import { ATTRACTIONS } from '@/data/attractions';
import { DEMO_ROUTE } from '@/data/routes';
import { speak, stopSpeaking } from '@/services/narrator';

/**
 * The one narration session shared by every surface — the phone drive-mode
 * screen and the Android Auto / CarPlay screen all observe and control this
 * singleton, so starting a drive on the phone updates the car display and
 * vice versa.
 */

export type DriveStatus = 'idle' | 'locating' | 'driving' | 'simulating' | 'denied';

export interface DriveSessionState {
  status: DriveStatus;
  position: LatLng | null;
  heading: number | null;
  speedKmh: number | null;
  nowPlaying: NarrationCandidate | null;
  upNext: NarrationCandidate[];
  playedCount: number;
}

type Listener = (state: DriveSessionState) => void;

const SIM_TICK_MS = 1500;
const SIM_KM_PER_TICK = 1.6; // ~64 km/h at 60x time compression

export class DriveSession {
  private state: DriveSessionState = {
    status: 'idle',
    position: null,
    heading: null,
    speedKmh: null,
    nowPlaying: null,
    upNext: [],
    playedCount: 0,
  };

  private listeners = new Set<Listener>();
  private narrator = new TripNarrator(ATTRACTIONS);
  private speaking = false;
  private watcher: Location.LocationSubscription | null = null;
  private simTimer: ReturnType<typeof setInterval> | null = null;

  getState(): DriveSessionState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(patch: Partial<DriveSessionState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  private onFix(position: LatLng, heading: number | null) {
    this.setState({ position, heading, upNext: this.narrator.peek(position, heading) });

    if (this.speaking) return;
    const candidate = this.narrator.next(position, heading);
    if (!candidate) return;
    this.play(candidate);
  }

  /** Speak a candidate now and mark it played (also used by car-screen taps). */
  play(candidate: NarrationCandidate) {
    stopSpeaking();
    this.narrator.markPlayed(candidate.attraction.id);
    this.speaking = true;
    this.setState({
      nowPlaying: candidate,
      playedCount: this.state.playedCount + 1,
      upNext: this.state.position
        ? this.narrator.peek(this.state.position, this.state.heading)
        : this.state.upNext.filter((c) => c.attraction.id !== candidate.attraction.id),
    });
    speak(narrationScript(candidate), () => {
      this.speaking = false;
      this.setState({ nowPlaying: null });
    });
  }

  skip() {
    stopSpeaking(); // onDone fires via onStopped, freeing the queue
  }

  stop() {
    this.watcher?.remove();
    this.watcher = null;
    if (this.simTimer) clearInterval(this.simTimer);
    this.simTimer = null;
    stopSpeaking();
    this.speaking = false;
    this.setState({ status: 'idle', nowPlaying: null });
  }

  async startGps(): Promise<void> {
    this.stop();
    this.setState({ status: 'locating' });
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      this.setState({ status: 'denied' });
      return;
    }
    this.watcher = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 150, timeInterval: 5000 },
      (loc) => {
        this.setState({
          speedKmh:
            loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed * 3.6 : null,
        });
        this.onFix(
          { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
          loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : null,
        );
      },
    );
    this.setState({ status: 'driving' });
  }

  startSimulation() {
    this.stop();
    this.narrator.reset();
    this.setState({ playedCount: 0, status: 'simulating', speedKmh: 64 });

    const { waypoints } = DEMO_ROUTE;
    let segment = 0;
    let progressKm = 0;

    this.simTimer = setInterval(() => {
      if (segment >= waypoints.length - 1) {
        if (this.simTimer) clearInterval(this.simTimer);
        this.simTimer = null;
        this.setState({ speedKmh: 0 });
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
      this.onFix(interpolate(a, b, t), bearingDeg(a, b));
    }, SIM_TICK_MS);
  }
}

export const driveSession = new DriveSession();
