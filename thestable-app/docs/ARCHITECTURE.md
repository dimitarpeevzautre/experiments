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

## Booking data

`services/bookings.ts` is the single seam to the backend. It currently resolves seed data with
fake latency; production swaps its internals for the thestable.bg API (auth token + `/bookings`
endpoints) without touching screens. Booking *derivations* (phase, nights, totals, "primary"
booking) are pure functions in `core/booking.ts`, so server and app can share test vectors.

## CarPlay / Android Auto plan

Today (v0): narration is ordinary phone audio — with the phone connected via Bluetooth/USB it
plays through the car speakers, and `UIBackgroundModes: ["audio"]` (iOS) keeps it alive with the
screen off. This already delivers the core "listen while driving" experience with zero native code.

Next (v1): proper car-audio citizenship, which requires a dev client / prebuild (out of Expo Go):

1. Replace `expo-speech` output with pre-rendered audio files (studio or server-side TTS) played
   through **`react-native-track-player`**. That gives us:
   - a real media session: now-playing metadata, play/pause/skip from steering wheel and car UI;
   - **Android Auto** media browsing (the app appears as an audio source; attractions/routes
     exposed as a browse tree via the `onGetChildren` media-library callbacks);
   - lock-screen and CarPlay "Now Playing" control for free.
2. **CarPlay app** via `react-native-carplay` (requires a CarPlay audio-app entitlement from
   Apple): list template with "Nearby stories" / "My route", driven by the same `TripNarrator`.
3. Location in background ("narrate even when the app is minimised") via
   `expo-location` background mode + foreground service on Android — needed so stories trigger
   while another app (e.g. the navigation app) is in front.

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
- [ ] Damage report with photos on pickup/return (ties into the return checklist)
- [ ] Push notifications: pickup reminders, weather on your route

## Testing

- `npm test` — 36 unit tests over the domain core (geo math, narration selection, booking
  derivations, checklist state).
- `npm run typecheck` / `npm run lint` — strict TS + expo eslint config.
- Web smoke: `npx expo export --platform web` renders every route; the demo drive was verified
  headlessly (simulation ticks → narration fires → played-count increments).
