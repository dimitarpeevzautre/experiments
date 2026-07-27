# The Stable — camper companion app

Mobile app for [thestable.bg](https://thestable.bg) guests: manage your camper booking, learn to
operate the van without phoning the base at midnight, and explore Bulgaria with hands-free audio
stories about the places you're driving past.

Built with **Expo (React Native) + TypeScript**, one codebase for iOS, Android and web preview.

## What's in the app

| Tab | What it does |
| --- | --- |
| **Home** | Your current/next trip at a glance, quick actions (drive mode, checklists, SOS) |
| **Bookings** | All bookings grouped by phase — on the road, upcoming, past — with price breakdowns |
| **Trips** | Curated multi-day road trips (Rila & Pirin, Balkan Heartland, Southern Black Sea) mixing sights, restaurants, campsites and wild-camping overnights. Start one and check off stops as you go — progress is persisted, the next stop is highlighted, and the active trip surfaces on Home. |
| **Camper** | Interactive checklists (departure / camp setup / return, persisted locally) and an operating guide: water, electrics, gas, toilet, heating, driving in Bulgaria, troubleshooting |
| **Explore** | 19 hand-picked Bulgarian attractions with categories, camper parking notes and listenable stories |
| **Drive mode** | Start it when you set off: the app watches your GPS position + heading and narrates attractions you're near or heading towards via text-to-speech — each story told once per trip. Includes a 60× **demo drive** (Sofia → Veliko Tarnovo) so you can try it from the sofa. |

In-car audio today works the "background audio" way: phone connected over Bluetooth / Android Auto
/ CarPlay, narration plays through the car speakers. Full CarPlay/Android Auto *apps* (on-screen
templates, media browsing) are the next step — the plan lives in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Getting started

```bash
npm install
npm start          # Expo dev server — scan the QR with Expo Go, or press a/i/w
```

Useful scripts:

```bash
npm test           # unit tests (jest-expo) for the domain core
npm run typecheck  # tsc --noEmit
npm run lint       # eslint via expo lint
npx expo export --platform web   # static web build
```

## Code layout

```
src/
  core/        pure TypeScript domain logic (no React Native imports, unit-tested)
    geo.ts         haversine distance, bearings, heading math
    narration.ts   picks what to narrate next (near / ahead-in-cone), once per trip
    booking.ts     booking phases, nights, pricing
    trips.ts       multi-day itineraries: progress, next stop, day derivation
    checklists.ts  checklist state helpers
  data/        seed content: attractions + narration scripts, fleet, guide, checklists, demo route
  services/    thin wrappers: booking API (mock), TTS narrator, checklist persistence
  hooks/       use-drive (GPS watch / drive simulator → narration engine)
  components/  small themed UI kit (Card, Pill, ProgressBar, Screen)
  app/         expo-router screens (tabs + detail routes)
```

The domain core is deliberately free of React/Expo imports so the same logic can later power the
CarPlay/Android Auto extensions and a backend "trip replay" without changes.

## Status / roadmap

This is the first cut — real booking API, auth, Bulgarian localisation, offline maps, recorded
audio (replacing TTS) and the native car integrations are tracked in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#roadmap).
