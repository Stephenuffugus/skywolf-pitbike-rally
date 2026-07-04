# PIT BIKE RALLY — AI Art Prompt Pack (Midjourney + ChatGPT)

Copy-paste prompts for every asset in PITBIKE_ART_ASSETS.md. Built for the magenta-key pipeline: sprites come back on flat magenta, the script at the bottom cuts them out (and builds the paint-tint masks automatically).

---

## 1. Workflow Rules (read once)

**Which tool for what:**
- **Midjourney** → stills, props, seamless textures (`--tile` is gold), backgrounds. Bad at text and multi-frame consistency.
- **ChatGPT (image gen)** → anything with TEXT (logo, billboards, badges), and **animation strips** — it follows "4-frame horizontal strip, same character in every frame" instructions far better than MJ.

**Consistency:** generate your first bike frame, get it approved, then reuse it as a Midjourney style/character reference (`--sref <image URL>` and keep the same `--seed`) for every other bike pose. In ChatGPT, re-attach the approved frame and say "same exact bike and rider as this image, new pose:".

**Magenta:** every sprite prompt ends with the magenta line. If a generator fights you and adds gradients/scenery, fall back to "isolated on a plain solid white background" — the script keys white too (`--key white`).

**Tint colors (replaces hand-made masks):** bike plastics, rider jersey, and helmet are generated in **pure bright green (#00FF00)**. The script detects green, converts it to a grayscale tint mask, and the game paints all 9+ colors at runtime. Never use green anywhere else on a bike sprite.

**Sizes:** don't chase exact pixels — generate at the aspect ratios given (`--ar`), we crop/downscale at atlas build. Animation strips: tell ChatGPT the frame count and "equal-width frames, aligned baselines."

**Expect to curate.** Generate 4, pick 1. Budget ~3× generations per shipped asset.

---

## 2. Reusable Style Block

Paste this into EVERY sprite prompt where you see **[STYLE]**:

> 2D arcade game sprite, top-down view with a slight 15-degree camera tilt, chunky saturated flat colors, bold dark charcoal outline (#17181C) around every shape, minimal cel shading lit from the top-left, clean cartoon vector style, crisp hard edges, no soft glow, no drop shadow, no background scenery, isolated on a solid flat pure magenta background (hex FF00FF)

Midjourney suffix for sprites: ` --style raw --ar 1:1 --no shadow, scenery, gradient, text`
Midjourney suffix for seamless textures: ` --tile --style raw --ar 1:1`

And this is **[BIKE]**, the master character — identical wording every time:

> a small pit bike (mini motocross bike) with an adult rider crouched on it, rider wears a pure bright green (#00FF00) jersey and pure bright green full-face helmet, bike plastic fairings and fenders pure bright green (#00FF00), black knobby tires, dark gray steel frame, yellow number plate on the front, bike faces RIGHT

---

## 3. WAVE 1 — P0 prompts (54 assets, do these first)

### 3.1 Bike poses — ChatGPT (strips) & Midjourney (stills)

**bike_ride_f01–04** (ChatGPT):
> Create a horizontal 4-frame sprite animation strip, equal-width frames. [BIKE], riding at speed. The ONLY differences between frames: knobby tire tread rotates a step each frame, and the rider bobs 2–3 pixels down in frames 2 and 4. Same exact bike, rider, colors, size, and position in all 4 frames. [STYLE]

**bike_air** (Midjourney):
> [BIKE], airborne over a jump, both wheels off the ground, rider standing on the pegs with knees bent, bike level. [STYLE] --style raw --ar 1:1 --no shadow, scenery, gradient, text

**bike_land** (Midjourney, reuse --sref + seed from bike_air):
> [BIKE], the moment of landing a jump, front suspension fully compressed, rider crouched low over the handlebars absorbing impact. [STYLE] --style raw --ar 1:1 --no shadow, scenery, gradient, text

**bike_wheelie_f01–02** (ChatGPT):
> Create a horizontal 2-frame sprite strip, equal-width frames. [BIKE], pulling a wheelie: front wheel lifted, rider leaning back. Frame 2 is identical except the front wheel is 10% higher. [STYLE]

### 3.2 Effects — ChatGPT strips (no green anywhere in FX)

**fx_dust_puff_f01–04:**
> Horizontal 4-frame sprite strip of a dust puff animation: a small tan-beige dust cloud that starts tight and dense (frame 1) and expands while fading and breaking into wisps (frame 4). Cartoon flat style, dark outline. [STYLE]

**fx_nitro_flame_f01–03:**
> Horizontal 3-frame sprite strip of a nitro exhaust flame pointing LEFT: a cone-shaped blue flame, bright cyan (#5FC9FF) core with a white hot center, flame flickers slightly between frames but keeps the same length. [STYLE]

**fx_land_poof_f01–03:**
> Horizontal 3-frame sprite strip: a flat ring of dust expanding outward along the ground, seen from above — starts as a small dense ring, grows wider and thinner, fades. Tan-beige dust, cartoon flat style. [STYLE]

**fx_collect_burst_f01–04:**
> Horizontal 4-frame sprite strip: a yellow starburst pickup-collect effect, golden yellow (#F2C928) — small four-point star flash that expands into radiating sparkle lines and fades. [STYLE]

**fx_mud_splat_f01–03:**
> Horizontal 3-frame sprite strip: dark brown mud splatter kicked upward — chunky droplets rise and spread apart across the frames. [STYLE]

### 3.3 Seamless terrain — Midjourney with `--tile`

Template — swap the [TEXTURE] line:
> seamless repeating texture for a 2D game, top-down view, [TEXTURE], chunky flat cartoon colors, subtle detail, low contrast, no objects, no text --tile --style raw --ar 1:1

| Save as | [TEXTURE] |
|---|---|
| terrain_dirt_loam | brown loam dirt racetrack surface with faint tire-tread chatter marks and small pebbles |
| terrain_berm_edge | raised dirt berm edge, darker packed soil with a ridge highlight running horizontally |
| terrain_rut_overlay | subtle darker worn groove lines in dirt, mostly transparent-feeling, very low contrast |
| terrain_mud_pit_a | wet dark brown mud with glossy wet highlights |
| terrain_mud_pit_b | wet dark brown mud, same as before but highlights shifted position (frame 2 of shimmer) |
| terrain_whoops | repeating parallel dirt rhythm bumps (whoops), alternating light ridge and dark valley stripes |
| ground_meadow_a | healthy green mowed grass, top-down |
| ground_desert_a | pale sandy desert scrub ground with tiny stones, top-down |
| ground_prairie_a | dry golden-green prairie grass, top-down |
| ground_canyon_a | red-orange rocky canyon floor, top-down |

(Only the "a" checker tile per theme — the build script auto-darkens it 6% for the "b" tile.)

### 3.4 Props — Midjourney (reuse [STYLE], `--ar` noted)

**prop_start_arch** (ChatGPT — it has text):
> A motocross start/finish arch spanning left to right: two metal truss towers holding a checkered banner that reads "SKYWOLF" in bold yellow letters, small wolf logo. [STYLE] (wide asset — landscape orientation)

**prop_start_line:**
> flat black-and-white checkerboard start line strip painted on dirt, seen from directly above, slightly worn. [STYLE] --ar 3:1

**prop_ramp_kicker:**
> a dirt jump ramp seen from above, its sloped face painted with bold diagonal red and white warning chevrons. [STYLE] --ar 2:1

**prop_haybale:**
> a rectangular hay bale barrier, warm straw yellow with visible baling twine. [STYLE]

**prop_tire_stack:**
> a short stack of racing tires painted alternating red and white, top-down view showing the top tire's hole. [STYLE]

**prop_fence_straight / prop_fence_curved:**
> a section of low crowd-barrier fencing, gray posts and orange mesh, straight horizontal section [second gen: gently curved section]. [STYLE] --ar 3:1

### 3.5 Pickups

**pickup_sprocket_f01–04** (ChatGPT):
> Horizontal 4-frame sprite strip of a spinning coin animation: the coin is a golden-yellow (#F2C928) gear/sprocket with teeth. Frames show it rotating: full circle face, three-quarter turned, thin edge-on, three-quarter turned back. Same size and center in every frame. [STYLE]

**pickup_nitro_f01–02** (ChatGPT):
> Horizontal 2-frame sprite strip: a small cyan-blue (#5FC9FF) nitro canister with a bright letter "N", frame 2 identical but with a white glint highlight moved across the can. [STYLE]

### 3.6 Logo & hero background

**ui_logo_lockup** (ChatGPT — text!):
> Game logo on a plain solid magenta background (#FF00FF): the words "PIT BIKE RALLY" in heavy italic uppercase letters, motocross number-plate style — plate-yellow (#F2C928) letters with a dark charcoal outline, slight forward skew, the word RALLY largest. Above it, small text "SKYWOLF STUDIOS" with a minimal angular wolf-head silhouette icon. Gritty but clean arcade racing energy. No other elements.

**bg_menu_hero** (Midjourney — NOT keyed, no magenta):
> wide illustrated game menu background: a small pit bike leaning against a wooden fence at golden hour, dirt racetrack and a corrugated garage behind it, dusty warm light, a wolf silhouette standing on a distant hill ridge, chunky flat cartoon illustration style with bold outlines, muted warm palette with plate-yellow accents, the upper-center third is calm open sky for title placement --ar 16:9 --style raw

---

## 4. WAVE 2 — P1 prompt templates

### 4.1 Remaining bike poses (reuse [BIKE] + your approved --sref)
| Save as | Pose line to append to [BIKE] |
|---|---|
| bike_whipL_f01–02 (GPT strip) | mid-air whip: rear of the bike kicked out to the LEFT, rider hanging on, frame 2 kicks further |
| bike_whipR_f01–02 (GPT strip) | mid-air whip: rear kicked RIGHT, frame 2 further |
| bike_brake | hard braking, rear wheel locked and stepping out slightly, rider braced back |
| rider_tumble_f01–04 (GPT strip, NO bike) | rider only, no bike: cartoon ragdoll tumble roll across 4 frames — impact, roll, sprawl, sitting up |
| bike_downed | the pit bike alone lying on its side on the ground, no rider |
| bike_remount_f01–02 (GPT strip) | rider lifting the fallen bike upright (frame 1), throwing a leg over the seat (frame 2) |

### 4.2 Remaining FX (ChatGPT strips)
| Save as | Description |
|---|---|
| fx_water_splash_f01–04 | white-blue crown water splash rising and falling |
| fx_spark_hit_f01–03 | small orange-white impact sparks scattering |
| fx_gold_sparkle_f01–04 | looping gold glint twinkle, four-point stars |
| fx_rain_overlay_f01–02 | seamless (--tile, MJ) thin diagonal pale-blue rain streaks, two offset frames |
| fx_headlight_glow | single soft cone of warm light on black background (we additive-blend; key BLACK not magenta) |
| fx_skidmark_a/b | dark rubber skid decal, one straight strip, one curved arc, on magenta |

### 4.3 Remaining terrain (MJ --tile template from §3.3)
water_cross_a/b (rippling shallow water, two shimmer frames) · sand_drift (pale wind-rippled sand) · hardpack (pale packed clay lane) · dirt_redclay · dirt_bog · ground tiles: stadium_night_a (dark blue-gray infield), swamp_a (dark mossy wet ground), duskridge_a (purple-brown twilight scrub), storm_a (cold gray-green mud ground).

### 4.4 Remaining props (MJ, [STYLE] template)
| Save as | Subject |
|---|---|
| prop_cone | orange traffic cone, top-down |
| prop_rock_a/b | two different gray boulders |
| prop_tree_pine / prop_tree_oak | stylized top-down trees (canopy view) |
| prop_cactus_a/b | two saguaro-style cacti, top-down |
| prop_swamp_stump | rotten tree stump in dark water ring |
| prop_bleacher_f01–02 (GPT strip) | packed crowd bleacher section, tiny colorful crowd, frame 2 arms raised (wave) |
| prop_floodlight | stadium floodlight tower, lamps glowing |
| prop_pit_tent | small racing paddock tent, yellow canopy, wolf logo |
| prop_flagman_f01–02 (GPT strip) | race marshal waving a checkered flag left then right |
| prop_bridge | wooden/steel track overpass deck seen from above, wide enough for one bike lane, railings both sides (--ar 2:1) |
| prop_gate_arrow_L / _R | lit LED arrow panel pointing LEFT [RIGHT], amber bulbs on dark housing |
| prop_puddle | irregular shallow rain puddle reflecting sky |
| prop_billboard_1/2/3 (ChatGPT — text) | trackside billboard reading "WOLFBURN FUELS" [2: "HOWLER EXHAUSTS", 3: "ALPHA TRACTION TIRES"], bold vintage racing-sponsor style |

### 4.5 Pickups & UI
| Save as | Tool | Prompt core |
|---|---|---|
| pickup_wrench_f01–02 | GPT | silver crossed wrench pickup icon, glint moves frame 2 |
| pickup_golden_f01–04 | GPT | same spinning sprocket coin as before but bright GOLD with white sparkle, slightly larger |
| pickup_spawn_glint_f01–03 | GPT | small white vertical flash that blooms and fades |
| ui_pos_badge_1–4 | GPT | four motocross number-plate medallions numbered 1, 2, 3, 4 — yellow plate, charcoal numerals, small laurel |
| ui_trophy_×4 | GPT | trophy set: bronze cup, silver cup, gold cup with wolf ears, black "Wolf's Den" fang trophy |
| ui_medal_×3 | GPT | bronze / silver / gold circular medals with a tiny sprocket emboss |
| ui_part_icons_×10 | GPT (one sheet OK) | a 2×5 grid of flat game icons on magenta: engine block, exhaust pipe, carburetor, suspension fork, knobby tire, gear sprocket, bike frame, brake disc, nitro bottle, crash-cage armor — identical stroke weight and size |
| ui_ghost_icon | GPT | translucent ghost-rider outline icon |
| ui_padlock | GPT | chunky padlock icon |
| ui_daily_flame | GPT | small flame badge with "2×" text |
| ui_logo_small | GPT | compact "PBR" plate monogram version of the main logo |

### 4.6 Backgrounds (MJ, no magenta, --ar 16:9 --style raw)
| Save as | Scene |
|---|---|
| bg_garage | interior garage wall: workbench, pegboard tools, tire stacks, an empty trophy shelf centered at upper third, warm bulb lighting, flat cartoon style with bold outlines |
| bg_podium | night stadium podium scene: three-step podium centered and empty, crowd bokeh and floodlights behind, confetti in the air, space on the steps for characters |

---

## 5. WAVE 3 — P2 (polish, same templates)
Celebration strips (victory_wheelie / whip / burnout via [BIKE] + GPT strips) · 3 helmet overlay variants · fx_confetti strip · rarity frames ×4 (GPT: ornamental sprite borders: gray/green/blue/gold) · bg_rotate_card · bg_results_texture · bike_push.

---

## 6. Keying Script (hand this to Claude Code)

Drop generated images in `raw/`, run, get transparent PNGs in `cut/` plus auto tint masks in `masks/`. Handles magenta OR white keys, despills pink halos, and converts pure-green regions into grayscale tint masks.

```python
# key_cut.py — pip install pillow numpy
import sys, pathlib
import numpy as np
from PIL import Image

KEY = (255, 0, 255) if '--key' not in sys.argv or 'magenta' in sys.argv else (255, 255, 255)
TOL = 60          # key tolerance
GREEN_TOL = 70    # tint-region detection

def process(path, outdir, maskdir):
    img = np.array(Image.open(path).convert('RGBA')).astype(int)
    r, g, b, a = img[..., 0], img[..., 1], img[..., 2], img[..., 3]

    # 1) key out background
    dist = np.sqrt((r-KEY[0])**2 + (g-KEY[1])**2 + (b-KEY[2])**2)
    alpha = np.clip((dist - TOL) / 40, 0, 1)
    img[..., 3] = (alpha * 255).astype(int)

    # 2) despill: kill magenta fringe on semi-edges
    fringe = (r > 140) & (b > 140) & (g < 120) & (img[..., 3] > 0) & (img[..., 3] < 255)
    img[..., 0][fringe] = (r[fringe] + g[fringe]) // 2
    img[..., 2][fringe] = (b[fringe] + g[fringe]) // 2

    # 3) tint mask from pure-green regions (bikes only; harmless elsewhere)
    gdist = np.sqrt((r-0)**2 + (g-255)**2 + (b-0)**2)
    tint = (gdist < GREEN_TOL) & (img[..., 3] > 128)
    if tint.any():
        # neutralize green to mid-gray in the color layer
        lum = (0.3*r + 0.59*g + 0.11*b).astype(int)
        for c in range(3):
            img[..., c][tint] = np.clip(lum[tint] - 40, 40, 200)
        mask = np.zeros(img.shape[:2], dtype=np.uint8)
        mask[tint] = 255
        m = Image.fromarray(mask, 'L')
        m.save(maskdir / (path.stem + '_mask.png'))

    Image.fromarray(img.astype('uint8'), 'RGBA').save(outdir / (path.stem + '.png'))

raw, cut, masks = map(pathlib.Path, ('raw', 'cut', 'masks'))
cut.mkdir(exist_ok=True); masks.mkdir(exist_ok=True)
for p in sorted(raw.glob('*.png')) + sorted(raw.glob('*.jpg')):
    process(p, cut, masks)
    print('cut:', p.name)
```

**Strip slicing:** for GPT animation strips, Claude Code should slice by dividing width by frame count after cutting, then trim each frame to its shared bounding box so anchors align.

## 7. Per-Asset QC Checklist
✔ subject fully inside frame, nothing cropped ✔ background is flat key color, no gradient ✔ bikes face RIGHT ✔ no baked shadow ✔ green ONLY on paintable regions ✔ outline present ✔ strips: frames equal width, character identical ✔ textures: actually tile (MJ --tile, spot-check by tiling 2×2).
