# PIT BIKE RALLY — Complete Art Asset List

**Studio:** Skywolf Studios · **Pipeline:** magenta-key cutouts (same workflow as Vine Runner)
**Companion doc:** PITBIKE_TRACK_DESIGN.md (themes referenced here are defined there)

---

## 1. Pipeline & Technical Spec (read first)

**Key color:** pure magenta `#FF00FF` background on every sprite deliverable. No anti-aliased edges against the magenta — use hard 1px edges or a 1px dark outline as the outermost pixel so keying leaves no halo. We key with ~8% tolerance, then store runtime assets as transparent PNG atlases.

**Authoring scale:** the game world is 1600×900 units and a bike is ~34 units long on screen. Author everything at **4× world scale** and we downscale once at atlas build. Bike frames: 160×160 canvas cells (bike ≈ 136×88 inside). Terrain tiles: 360×360 authored → 90 world units. Props sized per table below (authored 4×).

**Angle convention:** all bikes/riders face **RIGHT (0°)**, viewed top-down with a slight 15° camera tip so wheels and rider read clearly. The engine rotates sprites at runtime — deliver ONE angle per frame, never rotation sets.

**Light direction:** top-left, consistent everywhere. Shadows are procedural (engine draws them) — never bake shadows into sprites.

**Style target:** chunky saturated flats with a 2px dark outline (`#17181c`), minimal gradients. Reads at small sizes, keys cleanly, matches the number-plate UI. Core palette to reuse: ink `#17181c`, plate yellow `#f2c928`, burn orange `#f07020`, dust `#c9c2b4`, nitro blue `#5fc9ff`, grip green `#8ef07f`.

**Tinting (important — saves ~150 assets):** bike plastics, rider jersey, and helmet are painted at runtime. Deliver each bike frame as **two layers**: (a) the full-color frame with plastics/jersey/helmet in neutral 50% gray, and (b) a magenta-keyed **tint mask** frame where only the paintable regions are white. 9+ paint colors come free. If masks are impractical, fall back to delivering the 3 free colors (red/blue/green) and we tint the rest with a hue shader — but masks are strongly preferred.

**Naming:** `category_name_f##.png` (e.g., `bike_whipL_f02.png`, `fx_mudsplat_f01.png`). One folder per category below.

**Priorities:** P0 = replaces programmer art for shippable v1 · P1 = full launch · P2 = polish/season 2.

---

## 2. Bikes & Riders (folder: `bike/`)

Bike + rider are ONE combined sprite per frame (they never separate except the tumble). Every frame needs its tint-mask twin.

| Asset | Frames | FPS | Loop | Pri | Notes |
|---|---|---|---|---|---|
| bike_ride | 4 | 12 | yes | P0 | Wheel spin + slight rider bob. This is 90% of gameplay. |
| bike_wheelie | 2 | 8 | yes | P0 | Front wheel up, rider leaned back. |
| bike_air | 1 | — | — | P0 | Neutral airborne pose, legs slightly off pegs. |
| bike_whipL | 2 | 10 | no | P1 | Rear end kicked left mid-air (style trick). |
| bike_whipR | 2 | 10 | no | P1 | Mirror of whipL — deliver both, don't flip (rider posture differs). |
| bike_land | 1 | — | — | P0 | Suspension compressed, rider crouched. Held 4 ticks on landing. |
| bike_brake | 1 | — | — | P1 | Rear wheel locked, slight fishtail posture. |
| rider_tumble | 4 | 10 | no | P1 | Rider ragdoll roll (rider only, no bike). |
| bike_downed | 1 | — | — | P1 | Bike on its side, wheel spinning optional +1 frame. |
| bike_remount | 2 | 6 | no | P1 | Rider picking bike up, throwing leg over. |
| bike_push | 1 | — | — | P2 | Rider pushing bike (out-of-fuel gag for a future mode). |
| rider_victory_wheelie | 2 | 8 | yes | P1 | Podium celebration. |
| rider_victory_whip | 2 | 8 | yes | P2 | Alt celebration (shop item). |
| rider_victory_burnout | 2 | 10 | yes | P2 | Alt celebration (shop item). |

Subtotal: **25 frames × 2 layers = 50 images** (P0 core: 12 images).

### Rider gear variants (P2, folder: `gear/`)
Helmet swap overlays only — 3 helmet shapes (moto classic, retro open-face, wolf-eared special), each 1 overlay frame aligned to all bike poses via anchor sheet. **3 images + anchor JSON.**

---

## 3. Effects & Particles (folder: `fx/`)

No tint masks needed. All loop = no unless noted.

| Asset | Frames | FPS | Pri | Notes |
|---|---|---|---|---|
| fx_dust_puff | 4 | 12 | P0 | Kicked up behind rear wheel on dirt; also collision poof. |
| fx_mud_splat | 3 | 12 | P0 | Brown splatter when crossing mud. |
| fx_water_splash | 4 | 14 | P1 | White/blue crown splash for water crossings. |
| fx_nitro_flame | 3 | 18 | P0 | Blue cone flame off the exhaust, `#5fc9ff` core. |
| fx_spark_hit | 3 | 16 | P1 | Bike-vs-bike contact sparks. |
| fx_land_poof | 3 | 12 | P0 | Ring of dust on jump landing. |
| fx_skidmark | 2 | — | P1 | Dark decal strips (straight + curved) stamped on braking. |
| fx_collect_burst | 4 | 16 | P0 | Yellow starburst when grabbing a pickup. |
| fx_gold_sparkle | 4 | 10 | P1 | Ambient glint loop for the Golden Sprocket (loops). |
| fx_confetti | 6 | 12 | P2 | Podium confetti (or we do it procedurally — deliver only if cheap). |
| fx_rain_overlay | 2 | 8 | P1 | Tileable diagonal rain streak layer for rain variants (loops). |
| fx_headlight_glow | 1 | — | P1 | Soft cone for night variants, additive blend. |

Subtotal: **39 images.**

---

## 4. Terrain & Track Surfaces (folder: `terrain/`)

The track ribbon is drawn by the engine (stroked path), so dirt must be a **seamless texture** we pattern-fill along the ribbon, not a drawn track shape.

### Shared surface set (theme-agnostic)
| Asset | Count | Pri | Notes |
|---|---|---|---|
| dirt_loam (seamless tile) | 1 | P0 | Default brown dirt, subtle tire chatter marks. |
| dirt_redclay (seamless) | 1 | P1 | Canyon/desert tracks. |
| dirt_bog (seamless) | 1 | P1 | Swamp tracks, darker + wetter. |
| berm_edge (seamless strip) | 1 | P0 | Raised outer lip texture, tiles along track edge. |
| rut_overlay (seamless strip) | 1 | P0 | Center groove darkening, alpha overlay. |
| mud_pit (seamless, 2-frame shimmer) | 2 | P0 | Glossy wet highlight alternates. |
| water_cross (seamless, 2-frame) | 2 | P1 | Rippling shallow water. |
| sand_drift (seamless) | 1 | P1 | For movable sand zones on Sandstorm Sweep. |
| hardpack_shortcut (seamless) | 1 | P1 | Pale packed clay for shortcut lanes. |
| whoops_strip | 1 | P0 | Repeating rhythm-bump section, tiles along path. |

### Per-theme ground (8 themes × 2 checker tiles)
Meadow, Desert, Prairie, Canyon, Stadium Night, Swamp, Dusk Ridge, Storm — each needs ground tile A + B (the engine checkers them). Keep them quiet/low-contrast so the track pops. **16 tiles, P0 for themes 1–4, P1 for 5–8.**

Subtotal: **28 images.**

---

## 5. Track Furniture & Props (folder: `props/`)

| Asset | Frames | Pri | Notes |
|---|---|---|---|
| start_arch | 1 | P0 | Checkered banner arch spanning the track, Skywolf branding. |
| start_line_decal | 1 | P0 | Checkerboard ground strip. |
| ramp_kicker | 1 | P0 | Red/white chevron face — replaces prototype's flat marker. |
| ramp_tabletop | 1 | P1 | Longer two-part jump (up-face + down-face). |
| haybale | 1 | P0 | Solid bumper prop. |
| tire_stack | 1 | P0 | Red/white stack, corner protection. |
| fence_section | 2 | P0 | Straight + curved crowd fencing. |
| cone | 1 | P1 | Apex markers. |
| rock_a / rock_b | 2 | P1 | Off-track dressing. |
| tree_pine / tree_oak | 2 | P1 | Meadow/prairie dressing. |
| cactus_a / cactus_b | 2 | P1 | Desert dressing. |
| swamp_stump | 1 | P1 | Swamp dressing. |
| bleacher_crowd | 2 | P1 | 2-frame wave loop, tiles horizontally. |
| floodlight_tower | 1 | P1 | Stadium night, paired with fx_headlight_glow. |
| pit_tent | 1 | P1 | Skywolf-liveried paddock tent. |
| billboard × 3 brands | 3 | P1 | Fictional sponsors: **Wolfburn Fuels**, **Howler Exhausts**, **Alpha Traction Tires**. |
| flagman | 2 | P1 | 2-frame flag wave at start/finish. |
| bridge_overpass | 1 | P1 | For Crossover Junction's figure-8 (deck + shadow edge). |
| route_gate_arrows | 2 | P1 | Lit arrow panel, LEFT and RIGHT states, for alternating-route tracks. |
| puddle_decal | 1 | P1 | Rain variant dressing. |

Subtotal: **29 images.**

---

## 6. Pickups (folder: `pickup/`)

| Asset | Frames | FPS | Pri | Notes |
|---|---|---|---|---|
| sprocket_coin | 4 | 10 | P0 | Spinning gear coin, plate-yellow. THE currency icon. |
| nitro_can | 2 | 6 | P0 | Blue canister with glint. |
| wrench | 2 | 6 | P1 | Free-repair pickup. |
| golden_sprocket | 4 | 10 | P1 | Oversized gold variant, pairs with fx_gold_sparkle. |
| spawn_glint | 3 | 12 | P1 | Brief flash when a pickup respawns. |

Subtotal: **15 images.**

---

## 7. UI (folder: `ui/`)

The current CSS look ships fine for buttons/chips, so most UI stays vector. Art is needed only where CSS can't deliver:

| Asset | Count | Pri | Notes |
|---|---|---|---|
| logo_lockup | 1 | P0 | "PIT BIKE RALLY" + Skywolf wolf mark, on magenta for keying. |
| logo_small | 1 | P1 | Compact wordmark for HUD/results. |
| position_badge 1st–4th | 4 | P1 | Plate-styled place medallions. |
| trophy_amateur/pro/ironman/wolfsden | 4 | P1 | Garage trophy shelf. |
| medal_bronze/silver/gold | 3 | P1 | Per-track challenge medals (see track doc). |
| part_icons × 10 slots | 10 | P1 | Engine, exhaust, carb, suspension, tires, gearing, frame, brakes, nitro, armor. One icon each; rarity shown by CSS border color. |
| rarity_frame × 4 | 4 | P2 | Optional ornamental frames (Common/Uncommon/Rare/Legendary) if CSS borders feel flat. |
| joystick_thumb_art | 1 | P2 | Textured stick cap (current CSS version acceptable). |
| ghost_icon | 1 | P1 | Best-lap ghost toggle. |
| padlock | 1 | P1 | Locked track/part state. |
| daily_flame_badge | 1 | P1 | "Featured 2×" marker on track select. |

**Do NOT produce:** track-select thumbnails (engine renders real minimaps from track data), color swatches (CSS), stat bars, buttons, chips (CSS).

Subtotal: **31 images.**

---

## 8. Full-Screen Backgrounds (folder: `bg/`)

Painted scenes, delivered at 2048×1152, safe-zone the center 1600×900. These are NOT keyed — deliver as final JPG/PNG.

| Asset | Pri | Notes |
|---|---|---|
| bg_menu_hero | P0 | Pit bike leaned on a fence at golden hour, garage behind, Skywolf wolf silhouette on the hill. Title sits top-center — keep that zone quiet. |
| bg_garage | P1 | Interior workbench wall: tools, tires, trophy shelf (shelf must align with trophy icon slots — coords in build sheet). |
| bg_podium | P1 | Three-step podium in a stadium, crowd bokeh, room for 3 bike sprites on the steps. |
| bg_rotate_card | P2 | Fun "turn your phone" illustration (current CSS animation is fine meanwhile). |
| bg_results_texture | P2 | Subtle dirt-spray texture strip for the results card header. |

Subtotal: **5 images.**

---

## 9. Asset Count & Delivery Order

| Category | Images | P0 core |
|---|---|---|
| Bikes & riders (incl. tint masks) | 50 | 12 |
| Rider gear | 3 | 0 |
| Effects | 39 | 14 |
| Terrain | 28 | 13 |
| Props | 29 | 7 |
| Pickups | 15 | 6 |
| UI | 31 | 1 |
| Backgrounds | 5 | 1 |
| **Total** | **~200** | **54** |

**Recommended delivery waves:**
1. **Wave 1 (P0, 54 images):** bike_ride/air/land + masks, dust/nitro/land/collect FX, loam dirt + berm + rut + mud + whoops, 4 theme grounds, start arch/line, ramp, haybale, tire stack, fence, sprocket + nitro pickups, logo, menu hero. → Game stops looking like programmer art.
2. **Wave 2 (P1):** everything else needed for the 12-track launch set (night/rain layers, bridge, gates, tumble/remount, remaining themes, UI badges, garage/podium bgs).
3. **Wave 3 (P2):** celebrations, gear, confetti, ornamental frames.

**Definition of done per asset:** correct canvas size, magenta `#FF00FF` bg (sprites only), no AA halo, top-left light, outlined in `#17181c`, named per convention, tint mask included where marked, animation frames aligned on a shared anchor point.
