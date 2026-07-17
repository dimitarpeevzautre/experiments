# Caroline · 40 × 60 Site

An interactive 3D architectural visualization of a 60 m × 40 m gently sloping
plot: a 6 m × 8 m timber cabin with a fully glazed gable and rooftop solar
array, a flagstone patio, a natural swimming pool with a planted regeneration
edge, a curving gravel path, and a grove of 18 blooming cherry blossom trees —
rendered isometrically in soft golden-hour light.

Off-grid systems are modelled to scale and labelled: solar array + wall-mounted
battery, rain cistern (fed by a roof downpipe), borehole well, and septic tank
with leach field.

## Viewing

Open `index.html` in any browser — it is fully self-contained (Three.js r160
is inlined, no network access needed).

Controls:

- **drag** to orbit, **scroll** to zoom
- **Roof on/off** — lift the roof and solar array
- **X-ray walls** — see through the timber walls to the furnished interior
- **Systems** — label the off-grid infrastructure
- **Top view** — plan view of the whole site

## Structure

- `src/scene.js` — the scene: terrain heightfield with carved pool basin,
  procedural cabin, instanced blossom canopies, site systems, camera and UI
  wiring (deterministic, seeded PRNG)
- `src/page.html` — page shell: title plate, control chips, golden-hour CSS
- `vendor/three.min.js` — pinned Three.js r160 (UMD build)
- `build.py` — inlines vendor + scene into `src/page.html` → `index.html`

## Rebuilding

```sh
python3 build.py
```
