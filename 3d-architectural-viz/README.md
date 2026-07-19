# Caroline · 40 × 60 Site

An interactive 3D architectural visualization of a 60 m × 40 m gently sloping
plot: a 6 m × 8 m timber cabin with a fully glazed gable and rooftop solar
array, a flagstone patio, a natural swimming pool with a planted regeneration
edge, a curving gravel path, and a grove of 18 blooming cherry blossom trees —
rendered isometrically in soft golden-hour light.

Off-grid systems are modelled to scale and labelled: solar array + wall-mounted
battery, rain cistern (fed by a roof downpipe), borehole well, septic tank and
a backup generator.

The cabin interior is furnished: a front room behind the glazed gable
(kitchenette, dining, sofa), a small bathroom and bedroom along the back wall,
and a kids' mezzanine above them reached by ladder.

## Viewing

Open `index.html` in any browser — it is fully self-contained (Three.js r160
is inlined, no network access needed).

Controls:

- **drag** to orbit, **right/shift-drag** (two-finger drag on touch) to pan,
  **scroll / pinch** to zoom, **double-click** to reset
- **Roof on/off** — lift the roof and solar array
- **X-ray walls** — see through the timber walls to the furnished interior
- **Systems** — label the off-grid infrastructure
- **Project** — slide-in brief: plot, topography, philosophy, and per-component
  specs, motivations and draft budgets (edit `src/budget.json` and rebuild);
  opening it surfaces the systems labels on the model
- **Click any system** — clicking the solar array, cabin, cistern, borehole,
  generator or pool flies the camera to it and opens its card in the brief;
  clicking a card in the brief flies to the component
- **Day cycle** — animated sun path with a live energy dashboard: 11 kWp PV
  curve, 10 kWh battery state, load schedule (pond pump, solar-clipped
  borehole window, afternoon heat pump, evening loads) and AGS generator
  backup; nights show the cabin glowing warm under a moonlit sky
- **Tour** — a guided cinematic pass with captions: gate, cabin, pond,
  systems, grove; any drag or scroll hands control back
- **Season** — spring blossoms, summer greens, autumn ambers, or winter with
  snow, bare trees, a frozen pond, chimney smoke and the energy model switched
  to short days and biomass heating
- **Top view** — plan view of the whole site
- **Sound** — calm generative ambient loop (WebAudio, no assets)

Drifting petals and butterflies animate the scene, and three
Portuguese water dogs — two in lion cut (a bigger black and a smaller brown)
and a young brown one still in full coat — play across the lawn, leap into the
pool for a swim, shake off, and bark now and then (audible when Sound is on).
All motion respects `prefers-reduced-motion`.

## Structure

- `src/scene/` — the scene as ordered section modules sharing one closure
  (terrain, cabin, pool, grove, systems, dogs, seasons, day cycle, tour,
  render loop …), concatenated by the build; deterministic via a seeded PRNG
- `src/project.js` — the project brief as data (`window.PROJECT`) plus the
  drawer UI; each component record carries empty `budget`/`status`/`progress`
  fields so budgeting, planning and progress tracking can attach next
- `src/page.html` — page shell: title plate, control chips, golden-hour CSS
- `vendor/three.min.js` — pinned Three.js r160 (UMD build)
- `build.py` — inlines vendor + scene into `src/page.html` → `index.html`

## Rebuilding

```sh
python3 build.py
```
