# PIT BIKE RALLY — ChatGPT Art Request v2 (REMAINING ONLY — 2026-07-04)

Everything from v1 landed and is IN THE GAME as of `c5a10cf` (top-down ride
strip, all terrain track tiles, water, backgrounds, props, sprockets, logo,
part icons, medals, trophies, helmets, FX). This file is only what's LEFT.
Drop finished images or a zip anywhere and tell Claude — the pipeline
(slice → key → clean → atlas → wire) is automated.

One generation note from processing the last drop: two dust/spray frames came
out pink (magenta bleed). It was auto-corrected, but add **"no pink or magenta
anywhere in the dust or spray"** to smoke/dust prompts.

## Rules (same as before)

- One asset or strip per image, on **solid flat magenta #FF00FF**.
- No drop shadows, no scenery, light from top-left, thick #17181C outline.
- Bikes/riders **face RIGHT**; anything paintable is **pure #00FF00 green**.
- For every bike prompt, ATTACH your top-down rider image from the last drop
  (`In game art/file_0000000003d471f78f88e5c62e5ce945.png` — also in this
  repo as `assets/art/bike/bike_topdown_hero.png`) and open with:
  > Same exact bike and rider, same top-down camera as this image, new pose:

**[STYLE] block:**
> 2D arcade game sprite, top-down view with a slight 15-degree camera tilt, chunky saturated flat colors, bold dark charcoal outline (#17181C) around every shape, minimal cel shading lit from the top-left, clean cartoon vector style, crisp hard edges, no soft glow, no drop shadow, no background scenery, isolated on a solid flat pure magenta background (hex FF00FF)

---

## WAVE A — remaining top-down poses (finishes the on-track animation set)

**A1 · bike_air (1 frame):**
> Same exact bike and rider, same top-down camera as this image, new pose: airborne over a jump, both wheels off the ground, rider standing on the pegs with knees bent, bike level. [STYLE]

**A2 · bike_land (1 frame):**
> Same exact bike and rider, same top-down camera as this image, new pose: the moment of landing a jump, front suspension fully compressed, rider crouched low over the handlebars absorbing impact. [STYLE]

**A3 · bike_lean_left (1 frame):**
> Same exact bike and rider, same top-down camera as this image, new pose: banked hard into a LEFT turn, whole bike and rider tilted left, seen from above. [STYLE]

**A4 · bike_lean_right (1 frame):** (same prompt, RIGHT)

**A5 · bike_downed_side (1 frame):**
> The same pit bike alone, no rider, lying flat ON ITS SIDE on the ground, wheels pointing to the left, seen from directly above. [STYLE]

---

## WAVE B — the 7 remaining biome ground tiles (each track gets its own infield)

Template — swap [TEXTURE]:
> A seamless repeating game texture, square image, top-down view: [TEXTURE]. Chunky flat cartoon colors, subtle detail, low contrast, no objects, no text, no vignette — the edges must tile perfectly when repeated.

| # | Save as | [TEXTURE] |
|---|---|---|
| B1 | ground_desert | pale sandy desert scrub with tiny stones |
| B2 | ground_prairie | dry golden-green prairie grass |
| B3 | ground_canyon | red-orange rocky canyon floor |
| B4 | ground_stadium | dark blue-gray groomed stadium infield dirt |
| B5 | ground_swamp | dark mossy wet ground |
| B6 | ground_ridge | purple-brown twilight scrub dirt |
| B7 | ground_storm | cold gray-green rain-soaked mud |

---

## WAVE C — shop content (Phase 3; do AFTER A + B)

**C1 · "RUST BUCKET" bike skin** — the ride strip pose set (4-frame ride strip
plus A1-A4 poses) with this bike description instead:
> a small beat-up pit bike (mini motocross bike) with an adult rider crouched on it, rider wears a pure bright green (#00FF00) jersey and helmet, bike has RUSTY dented fenders with green (#00FF00) patches of surviving paint, mismatched wheels, duct tape on the seat, dark gray frame, cardboard number plate, bike faces RIGHT

**C2 · "FACTORY WORKS" bike skin** — same pose set with:
> a sleek factory-race pit bike (mini motocross bike) with an adult rider crouched on it, rider wears a pure bright green (#00FF00) race suit and helmet with sponsor stripes, bike has polished chrome frame, pure bright green (#00FF00) aerodynamic fairings, gold-anodized forks and wheels, bright yellow number plate, bike faces RIGHT

**C3 · Decal pack (one sheet, has text):**
> A sticker sheet of 8 small racing sponsor-parody decals on solid magenta: "WOLFBURN FUELS", "HOWLER EXHAUSTS", "ALPHA TRACTION", a howling wolf head, a lightning bolt, a flaming gear sprocket, the number 13 in a circle, a "FULL SEND" banner. Bold vintage moto-sticker style, dark outlines.

---

## Already delivered — do NOT redo
Ride strip + 9 paints, riderless upright bike, sprawled rider, tumble frames,
victory wheelie/burnout, all track-surface tiles (loam, berm, mud ×2, whoops,
hardpack, water ×2, sand) + meadow, all 3 backgrounds, all props, sprocket
coins, logo, part icons, medals, trophies, helmets ×3, every FX strip.
(Whoops/berm/hardpack/water tiles and helmets/trophies are shipped in the repo
awaiting their game features — they need code, not art.)
