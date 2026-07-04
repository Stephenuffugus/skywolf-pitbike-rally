# PIT BIKE RALLY — Skywolf Studios

Top-down single-screen arena racing with pit bikes — 4 riders, dirt, jumps,
mud, nitro — and a garage economy that turns race winnings into a bike-building
hobby. Inspired by the feel of classic arena racers; every asset and name is
original Skywolf IP. **Strictly in-game currency (Sprockets ⚙) — no real-money
purchases, ever.**

**Play:** https://stephenuffugus.github.io/skywolf-pitbike-rally/
(also embedded at https://lucidwinds.com/portal/)

## Controls
- **Touch:** left half = slide to steer, right buttons = GAS / BRAKE / NITRO
- **Keyboard:** WASD or arrows steer + throttle, Space = nitro, S/↓ = brake
- Landscape only — the game asks portrait phones to rotate.

## Run locally
Static files, no build step. ES modules need HTTP (not `file://`):
```
python3 -m http.server 8000     # then open http://localhost:8000/
```

## Repo layout
```
index.html            entry — screens markup, portal embed shim, Sunbeam SDK
css/game.css          all styling
src/                  ES modules: main (boot/loop), state, data, save,
                      sprites (atlas), track, physics, fx, race, render,
                      hud, input, ui, audio
data/                 ALL tuning lives here — economy.json, parts.json,
                      cosmetics.json, tracks/track01..08.json
assets/atlas.png+json packed sprite atlas (build: tools/build_atlas.py)
assets/art/           semantically-named sprites by category
                      (bike/ = SIDE-VIEW art: garage/menu/results ONLY —
                       never rotated on the track; raw/ = untouched originals)
tools/                build_atlas.py, clean_art.py, sheet_slicer.py
docs/                 design docs (handoff, tracks, art spec, AI prompts)
reference/            gameplay prototype + top-down bike art reference
```

## Status (roadmap from docs/PITBIKE_RALLY_HANDOFF.md)
- [x] Phase 1 — playable core: 8 tracks, physics, 3 AI riders, laps/HUD,
      payouts, garage (5 slots), paint + plates, localStorage save,
      touch + keyboard, atlas art for pickups/FX/track dressing
- [ ] Phase 2 — full economy: 10 part slots, rarities, wear/repair,
      rotating shop, entry fees, stunt scoring v2, cosmetics v2
- [ ] Phase 2 — track variants (mirror/reverse), medals, ghost laps
- [ ] Phase 3 — tracks 9–12, championship season, split-screen, trophies
- [ ] Overhead bike sprites (art pending — see reference/bike_topdown_reference.png)

## Art pipeline
Sprites are AI-generated on magenta `#FF00FF`, sliced by `tools/sheet_slicer.py`,
semantically renamed (assets/art/rename_manifest.json maps back to raw),
fringe-cleaned by `tools/clean_art.py`, packed by `tools/build_atlas.py`.
New waves: drop cut sprites into assets/art/<category>/, re-run build_atlas.
