# GAME_CARD — Pit Bike Rally

## At a glance
- **One-line hook:** Four pit bikes, one dirt arena — race, earn, build your dream bike.
- **Genre / vibe:** top-down arcade arena racer + garage economy
- **Core loop:** race 60–120s → earn Sprockets → buy parts/paint → race faster
- **Status:** working
- **Live URL:** https://stephenuffugus.github.io/skywolf-pitbike-rally/
- **Repo:** Stephenuffugus/skywolf-pitbike-rally

## What works / what's missing
- **Works:** 8 tracks (ramps, mud, pickups), 3 AI riders with corner-aware
  throttle + mild rubber-band, garage with 5 part slots (engine/tires/
  suspension/nitro/gearing), 9 paint colors + plate numbers, style points,
  nitro, localStorage save with export/import hooks, touch joystick +
  keyboard, atlas art for pickups/FX/track dressing, Sunbeam earns.
- **Missing / known issues:** overhead bike sprites (bikes are procedural
  canvas art until top-down sprites are approved — side-view art is used on
  menu/garage/results); Phase 2 economy (wear/repair, rotating shop, entry
  fees, medals, ghosts, track variants); paint preview on heroes is a CSS
  hue-shift approximation of the green art; landscape-only by design.

## Tech
- **Stack:** vanilla JS (ES modules), HTML5 Canvas 2D, CSS. Zero dependencies.
- **Build step:** none (art atlas rebuilt via `python3 tools/build_atlas.py` when art changes)
- **Entry point:** `index.html`
- **Controls:** touch (virtual stick + buttons) and keyboard (WASD/arrows, Space nitro)

## Existing economy
- **In-game score / currency:** Sprockets (⚙) — race payouts by place ×
  track purse, style bonus, on-track pickups, best-lap bonus. Sinks: parts
  (20 across 5 slots), paint colors. All tuning in `data/*.json`.
- **Earn-worthy moments for sunbeams (wired):**
  - Race finished 1st → `Sunbeam.earn(4, 'pitbike-rally:win')`
  - Race finished 2nd/3rd → `Sunbeam.earn(2, 'pitbike-rally:place')`
  - Local daily cap 30 sunbeams (tracked in save), guarded `window.Sunbeam &&` + `.catch()`
  - A casual session (4–6 races, mixed places) ≈ 12–24 sunbeams
- **localStorage keys:** `skywolf.pitbikerally.save.v1` (the only key this game writes)

## Nav map (every screen and its back/✕)
- **menu** → RACE → tracks; GARAGE → garage; "← All Sky Wolf games" → SWS_EXIT()
- **tracks** → ◂ Back → menu; tap card → race
- **garage** → ◂ Back → menu
- **race (canvas+HUD)** → pause (II) → pause overlay → RESUME (race) /
  RESTART (race) / QUIT TO MENU (menu — overlay always removed first)
- **results** → RACE AGAIN (race) / NEXT TRACK (race) / GARAGE / MENU
- All transitions are internal `setScreen()` swaps that hide every other
  screen + overlay — no history.back(), no navigation when embedded.
- **rotate overlay** shows in portrait (CSS only), sits above everything.

## Embed notes
- SWS embed snippet included verbatim; posts `{sws:'ready'}` on load.
- Fullscreen button hidden when `?embed=1`; no service worker at all.
- Landscape game: portrait embed shows the rotate prompt.

## Thumbnail source
- `assets/art/bike/bike_ride_f01.png` (transparent, 500×308) on any dirt/track
  background, or Stephen supplies one — placeholder wired in the portal until then.
