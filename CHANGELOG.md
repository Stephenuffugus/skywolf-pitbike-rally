# Changelog

## 2026-07-04 — v1.4 cache-freeze fix + progression unlocks + menu fit
- ROOT CAUSE of "race stuck at 3": the portal host ignores no-cache headers
  (modules observed cached 4h, one 7 DAYS) and served players mixed old/new
  module builds. Fix: every deploy is version-stamped — src-<hash>/ module
  dir + ?v=<hash> on all json/css/img fetches (vendor script rewrites) — so
  caches can never mix two builds again. Belt+suspenders: frame loop now
  survives per-frame exceptions, and a boot watchdog overlays a RELOAD
  button if a dead module graph is detected.
- PROGRESSION UNLOCKS: parts now unlock as a ladder — a tier-N part needs a
  tier N-1 part owned in the same slot (rotating legendary stock included).
  No more saving up to buy the fastest part first; locked cards show what
  to own next.
- Menu no longer clips the title on short landscape phones (flex spacers +
  scroll fallback + tighter sizes under 560px height).

## 2026-07-04 — v1.3 pose sprites + 7 biome grounds (drop 2)
- Bike pose sprites on-track: airborne (standing on pegs), landing
  (suspension compressed, 0.28s after touchdown), lean left/right (banked
  art +-14deg, picked by steer sign) — per paint, physics-driven.
- Every track gets its own infield: desert, prairie, canyon, stadium,
  swamp, ridge twilight, storm mud join meadow/sand. Per-track mapping
  with lighter theme washes (multiply on dark themes).
- bike_downed_side cut + stashed (crash mechanic is Phase 3).
- Stress test: all 12 tracks error-free; 58-60fps, 55 under all-bikes-nitro
  FX spam, 31+ at 4x CPU throttle; full race->results->payout flow verified.

## 2026-07-04 — v1.2 full art integration (Stephen's wave 0704 drop)
- **Top-down sprite bikes ON-TRACK** — the Phase-1 blocker is gone. 3-frame
  ride-bob strips per paint (9 colors, green-keyed from Stephen's approved
  top-down strip), speed-driven animation, steer lean, airborne scale-up,
  nitro flame FX sprite behind the bike. AI riders now paint from the same
  cosmetics palette (first three colors the player didn't pick), so results
  dots match what's on track. Procedural bikes remain as the no-atlas fallback.
- **Terrain tiles** (request Wave 2): seamless 512px tiles cut from the drop —
  meadow/sand ground picked by theme hue with a theme-color wash, dirt-loam
  ribbon, wet-mud + sand zone textures. Flat colors remain as fallback.
  Cut but not yet consumed (no such zone types yet): whoops, berm edge,
  hardpack, water a/b, mud shimmer frame b.
- **Backgrounds** (Wave 5): menu golden-hour scene, garage interior, night
  podium — sliced from the scene sheet, behind dark gradients on the menu,
  garage and results screens.
- **Hi-res recuts** from the drop's full-res originals (the earlier composite
  sheet cuts were 4-6x smaller): 8 props, 10 part-slot icons, sprocket +
  golden-sprocket spin strips, logo lockup. Six FX strips replaced under
  their existing atlas names (water splash, mud splat, spark hit, dust puff,
  nitro flame, gold sparkle) — magenta-contaminated dust/mud frames retinted.
- **Wired UI art**: sprocket pickups replace the coin (regular + golden),
  SKYWOLF start arch at the start line, new props in theme dressing
  (haybales, tire stacks, billboards, gate arrows, puddle), part icons in
  garage slot titles + cards, medal PNGs in track chips + results rows,
  logo lockup replaces the CSS text title (text restored on img error).
- Atlas rebuilt (255 sprites; `ui/` art now DOM-only, dropped from the atlas).
- Stashed for future wiring: top-down hero/riderless/sprawl poses, downed +
  tumble frames, helmets (no cosmetics UI yet), trophies (no shelf UI yet).

## 2026-07-04 — v1.1 Phase 2 core (`8ec5264`)
- Wear/repair, 10 part slots + rarities, rotating rare stock, circuits with
  entry fees + unlocks, medals, track variants (mirror/reverse), best-lap
  ghosts, golden sprocket, tracks 09-12. (Entry landed after the fact — the
  build session was interrupted by a codespace shutdown.)

## 2026-07-04 — v1.0 initial port (Phase 1 complete)
- Repo scaffold per handoff §6.2; all tuning data extracted to `data/*.json`.
- Ported the single-file prototype into ES modules unchanged in feel:
  physics, AI, collisions, 8 tracks, HUD, touch/keyboard input, synth audio.
- Added persistence: versioned localStorage save (`skywolf.pitbikerally.save.v1`),
  wallet/parts/paint/plate/bests/stats survive reload; export/import stubs.
- Art: 338 AI-cut sprites semantically renamed (assets/art/rename_manifest.json),
  magenta-fringe + baked-caption cleanup, 282-sprite packed atlas.
- Art-swapped pickups (spinning coin, nitro can), FX (dust, mud, land poof,
  collect burst, sparks), per-theme track dressing; menus/garage/results get
  side-view bike heroes with paint hue-shift.
- Portal wiring: SWS embed snippet, SWS_EXIT menu button, Sunbeam SDK earns
  (win 4 / podium 2, 30/day local cap), favicon.
- Fixed from prototype: results screen losing its skew style; audio context
  now suspends when the tab hides.
- Headless smoke test (race → payout → buy part → reload persistence): zero
  console errors.
