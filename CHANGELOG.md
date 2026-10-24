# Changelog

## 2026-10-24 — v1.9 The analog throttle (build out Part 1)
- His idea: a floating stick appears under the right thumb. Pull down for gas, from nothing at 8 px to full at 56 px
  on a gentle curve, so half throttle is a real coast; push up and hold 120 ms to brake (touch never had a brake, so the
  brake parts now do something on a phone, and the lightest brake already slows like letting go); flick up and back for
  nitro: a fast move from the gas to above the centre that turns at once and comes back to the gas side, so nitro never
  needs the gas thumb to lift, and a hard brake (even one that eases), a brake dab or a quick lift is never nitro. A
  thumb landing low starts with the centre lifted, so full gas always fits above the edge.
- His other note: a NITRO button top left for the steering thumb on a straight (the steer zone starts under it).
- New saves start on Analog. A save from before keeps the GAS button and is offered the new throttle once; the pause
  menu switches between them any time. The NITRO popup lost its exclamation mark. Nitro never fires while paused; the
  nitro pips sit under the left NITRO; the HUD row fits between the corner buttons on narrow phones.
- From the v1.8 review: RESTART RACE in the pause menu restarts a career round as the same career round (it used to
  start a paid free race with wear and no points); a record set under newer physics is left alone by an older cached
  page; the Daily never races yesterday's ghost on today's track; restarting today's 2x featured race keeps the 2x.
- Gate: tools/pitbike-tests/p1_gate.mjs in lucid-winds drives the stick with real touch events (CDP).

## 2026-10-24 — v1.8 Protected earnings and versioned records (build out Part 0)
- The career no longer wears your parts (Astra's review, his call): only the free race mode, the Daily and featured
  races add wear, and the garage repairs them as before. Time trials never did.
- Every record now carries the physics it was set under (`physV` on the save, `pv` on time trial bests, ghosts and race
  bests; the save goes v2 to v3 and keeps every field byte for byte). A lap from older physics is never raced as a ghost,
  compared or beaten by a lap from newer physics. Physics is version 1; nothing about the riding changed.
- Dev hook: `__PBR.finishRace` and `__PBR.saveNow` for the gates.

## 2026-10-22 — v1.7 Career seasons with a rival (packet B)
- CAREER on the menu: three seasons (Rookie Cup 6 rounds, Pro Tour 8,
  Ironman Series 8) built from the authored tracks and variants, no entry
  fees, points 10/7/5/3 per round for all four riders, standings on the
  career screen, a named rival (Dusty, Rico, Mags) with a skill edge and a
  season long rubber band who talks before rounds and at the end, a prize
  split by final place and a trophy. Rounds are final (no race again).
  Finishing a season unlocks the next; a season can be ridden again for a
  better trophy. Data in data/seasons.json.
- Every plate and ghost button is at least 48 px tall.

## 2026-10-22 — v1.6 Time Trial (packet A of the replayability build out)
- TIME TRIAL on every authored track and variant: solo, no fee, no purse,
  no wear. Your best lap is judged against four target times (bronze,
  silver, gold, platinum) and each medal pays once per track and variant.
  The track card grows a dashed row of ⏱ chips with four dots; the HUD
  swaps to TT / current lap / best lap / next target with a ↻ restart
  button; results show the lap, the ladder and what paid, with RUN IT
  AGAIN (one second countdown) and NEXT. Targets live per track in
  data/tracks/*.json (`tt`), measured from autopilot laps on a stock and a
  maxed bike; the economy.tt ladder is the fallback (the Daily).
- Dev hook: `__PBR.autopilot = true` lets the AI drive the player's bike
  (headless gates and target measurement).
- Copy: dashes out of player text, "Sky Wolf Studio" title.

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
