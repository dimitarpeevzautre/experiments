# Architecture

## Overview

```
┌─────────────────────────────────────────────────────┐
│ UI (expo-router screens, themed components)          │
├─────────────────────────────────────────────────────┤
│ hooks/services                                       │
│   use-drive: GPS/simulator → narration engine → TTS  │
│   bookings: API client (mock today)                  │
│   checklistStore: AsyncStorage persistence           │
├─────────────────────────────────────────────────────┤
│ core (pure TS, unit-tested, no RN imports)           │
│   geo · narration · booking · checklists             │
├─────────────────────────────────────────────────────┤
│ data (seed content, swappable for API/CMS)           │
└─────────────────────────────────────────────────────┘
```

Design rule: everything that *decides* something lives in `src/core` as pure functions/classes and
is unit-tested; everything that *touches a device API* lives in `src/services` or `src/hooks`
behind a small interface. Screens only render state.

## Drive-mode narration

`core/narration.ts` selects the next story from the attraction catalogue given
`(position, heading, alreadyPlayed)`:

- **near**: within 6 km, regardless of heading — "You are near X."
- **ahead**: within 35 km AND bearing-to-attraction within 35° of the travel heading —
  "About N kilometres ahead is X."
- near beats ahead, closer beats farther, nothing repeats within a trip (`TripNarrator`).

`hooks/use-drive.ts` feeds it from either `expo-location` (`watchPositionAsync`, 150 m /5 s) or
the built-in simulator (`data/routes.ts`, 60× time compression), and speaks the winning script via
`services/narrator.ts` (expo-speech). Only one story plays at a time; a new fix while speaking
just refreshes the "within reach" list.

## Multi-day trips

`core/trips.ts` models a curated itinerary (`TripPlan`) as days of typed stops — attraction,
restaurant, campsite, wild-camping, scenic — with pure helpers for progress, the next stop, and
the current day. Guests start a trip (one active at a time, persisted by `services/tripStore.ts`)
and tick stops off; attraction stops deep-link into the narration catalogue via `attractionId`, so
drive mode tells their stories on the way. Wild-camping stops automatically surface a
leave-no-trace/legal note. Content lives in `data/trips.ts` and moves to the same CMS as
attractions; a natural v1 upgrade is generating trips dynamically (dates, season, interests) and
snapping stop order to real routing.

## Booking data

`services/bookings.ts` is the single seam to the backend. It currently resolves seed data with
fake latency; production swaps its internals for the thestable.bg API (auth token + `/bookings`
endpoints) without touching screens. Booking *derivations* (phase, nights, totals, "primary"
booking) are pure functions in `core/booking.ts`, so server and app can share test vectors.

## CarPlay / Android Auto

The app has a real car screen, built on `react-native-carplay` (Google's Android for Cars App
Library on Android, CarPlay templates on iOS) — the same JS drives both:

- `src/services/driveSession.ts` — the narration session is a framework-free singleton; the phone
  screen (`use-drive` via `useSyncExternalStore`) and the car template observe the same instance,
  so starting a drive on either surface updates both. The session outlives any screen.
- `src/car/setup.ts` — a single car-safe list template: now-playing row (tap = skip),
  start/stop GPS narration, start/stop demo drive, then the attractions within reach
  (tap = play that story now). Registered at app start on native platforms only.
- `plugins/withAndroidAuto.js` — config plugin adding the `automotive_app_desc.xml` +
  `com.google.android.gms.car.application` meta-data; the `CarAppService` itself is merged in
  from the library's manifest (navigation category).

**Android Auto — trying it**: the APK works on a real head unit or the Desktop Head Unit (DHU).
Because it isn't distributed through Google Play yet, enable *Developer settings → Unknown
sources* in the Android Auto app on the phone. Audio (TTS) routes through the car speakers
automatically.

**Apple CarPlay — status**: the JS template code is shared and ready, but shipping the CarPlay
scene needs (a) an Apple-granted CarPlay entitlement (apply at developer.apple.com), and (b) the
iOS scene-delegate setup from the react-native-carplay docs (a small config plugin once the
entitlement exists) — plus a macOS build machine. Until then iOS gets plain background audio.

Remaining upgrades for full car-audio citizenship:

1. Replace `expo-speech` output with pre-rendered audio files (studio or server-side TTS) played
   through **`react-native-track-player`**: a real media session with now-playing metadata and
   play/pause/skip from the steering wheel, plus lock-screen controls.
2. Location in background ("narrate even when the app is minimised") via `expo-location`
   background mode + a foreground service on Android — needed so stories trigger while another
   app (e.g. navigation) is in front. Today the car screen keeps the session alive while Android
   Auto is connected.
3. iOS CarPlay scene + entitlement (see status above).

The selection engine (`core/narration.ts`) is already UI-free precisely so v1 only swaps the
audio/output layer, not the logic.

## Roadmap

- [ ] Real booking API + guest auth (magic link against thestable.bg)
- [ ] Bulgarian + English localisation (data model already carries `nameBg`)
- [ ] Recorded narration audio; TTS stays as fallback for long-tail POIs
- [ ] `react-native-track-player` media session (steering-wheel controls, Android Auto browse)
- [ ] CarPlay audio app (entitlement application → `react-native-carplay`)
- [ ] Background location so drive mode works under a foregrounded nav app
- [ ] Offline attraction map + camper-friendly parking/campsite layer
- [ ] Trip routing on a real road network (ETA per leg, "resume from where I am"), map view of the day
- [ ] Restaurant/campsite data verified & maintained in the CMS (opening hours, prices, booking links)
- [ ] Damage report with photos on pickup/return (ties into the return checklist)
- [ ] Push notifications: pickup reminders, weather on your route

## Testing

- `npm test` — 47 unit tests over the domain core (geo math, narration selection, booking
  derivations, trip progress/next-stop, checklist state).
- `npm run typecheck` / `npm run lint` — strict TS + expo eslint config.
- Web smoke: `npx expo export --platform web` renders every route; the demo drive was verified
  headlessly (simulation ticks → narration fires → played-count increments).
