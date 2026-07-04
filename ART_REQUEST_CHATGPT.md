# PIT BIKE RALLY — ChatGPT Art Request (everything I need, in order)

For Stephen. Every prompt below is copy-paste ready for ChatGPT image gen.
Work top to bottom — Wave 1 changes the game the most. Drop finished images
(or zips) anywhere in the repo and tell Claude; the pipeline (slice → key →
clean → atlas → wire) is automated on my side.

## Rules that apply to every sprite (read once)

- One asset or one animation strip **per image**. If you batch a grid sheet,
  put small black label chips top-left of each cell — I auto-erase them.
- Every sprite sits on **solid flat magenta #FF00FF** (backgrounds in Wave 5
  are the exception — those are full scenes, no magenta).
- **No drop shadows, no scenery, no gradients in the background.** Light
  always from top-left. Thick dark charcoal (#17181C) outline around shapes.
- Bikes and riders always **face RIGHT**.
- Anything paintable (bike plastics, jersey, helmet) is **pure bright green
  #00FF00** — my keying script turns green into a tint mask so the game can
  paint all 9 colors at runtime. Never use that green anywhere else.
- Animation strips: say "horizontal N-frame strip, equal-width frames, same
  character identical in every frame except the described change."

**Paste this style block wherever you see [STYLE]:**

> 2D arcade game sprite, top-down view with a slight 15-degree camera tilt, chunky saturated flat colors, bold dark charcoal outline (#17181C) around every shape, minimal cel shading lit from the top-left, clean cartoon vector style, crisp hard edges, no soft glow, no drop shadow, no background scenery, isolated on a solid flat pure magenta background (hex FF00FF)

**Paste this wherever you see [BIKE] (identical wording every time):**

> a small pit bike (mini motocross bike) with an adult rider crouched on it, rider wears a pure bright green (#00FF00) jersey and pure bright green full-face helmet, bike plastic fairings and fenders pure bright green (#00FF00), black knobby tires, dark gray steel frame, yellow number plate on the front, bike faces RIGHT

---

## WAVE 1 — TOP-DOWN BIKE (the blocker; on-track bikes are programmer art until this exists)

⚠️ **For every prompt in this wave, ATTACH the file `reference/bike_topdown_reference.png`
from the repo** and start the prompt with:

> Repaint this exact top-down pose, angle and framing in the style described below —

Generators keep drifting to side views; the attached reference is what keeps
the camera overhead. Get **1a approved first** (send it to me, I'll wire it in
and screenshot it on-track), then reattach your approved frame to every other
bike prompt with "same exact bike and rider as this image, new pose:".

**1a · bike_ride strip (4 frames) — THE most important asset in this list:**
> Repaint this exact top-down pose, angle and framing in the style described below — create a horizontal 4-frame sprite animation strip, equal-width frames. [BIKE], riding at speed. The ONLY differences between frames: knobby tire tread rotates a step each frame, and the rider bobs slightly down in frames 2 and 4. Same exact bike, rider, colors, size, and position in all 4 frames. [STYLE]

**1b · bike_air (1 frame):**
> Same exact bike and rider as this image, new pose: airborne over a jump, both wheels off the ground, rider standing on the pegs with knees bent, bike level. [STYLE]

**1c · bike_land (1 frame):**
> Same exact bike and rider as this image, new pose: the moment of landing a jump, front suspension fully compressed, rider crouched low over the handlebars absorbing impact. [STYLE]

**1d · bike_wheelie strip (2 frames):**
> Same exact bike and rider as this image, new pose: horizontal 2-frame sprite strip, equal-width frames — pulling a wheelie, front wheel lifted, rider leaning back. Frame 2 identical except the front wheel is slightly higher. [STYLE]

**1e · bike_lean_left / 1f · bike_lean_right (1 frame each):**
> Same exact bike and rider as this image, new pose: banked hard into a LEFT turn, whole bike and rider tilted left, seen from above. [STYLE]
(then run again with RIGHT)

**1g · bike_downed (1 frame):**
> The same pit bike alone lying on its side on the ground, no rider, seen from above. [STYLE]

**1h · rider_tumble strip (4 frames):**
> Horizontal 4-frame sprite strip: the rider only, no bike — cartoon ragdoll tumble roll across the frames: impact, roll, sprawl, sitting up. Rider wears the same pure bright green (#00FF00) jersey and helmet. [STYLE]

---

## WAVE 2 — TERRAIN TILES (replaces the flat painted track)

Template — swap the [TEXTURE] line:
> A seamless repeating game texture, square image, top-down view: [TEXTURE]. Chunky flat cartoon colors, subtle detail, low contrast, no objects, no text, no vignette — the edges must tile perfectly when repeated.

(If edges don't quite tile, send them anyway — I fix seams in the pipeline.)

| # | Save as | [TEXTURE] |
|---|---|---|
| 2a | terrain_dirt_loam | brown loam dirt racetrack surface with faint tire-tread chatter marks and small pebbles |
| 2b | terrain_berm_edge | raised dirt berm edge, darker packed soil with a ridge highlight running horizontally |
| 2c | terrain_mud_pit_a | wet dark brown mud with glossy wet highlights |
| 2d | terrain_mud_pit_b | wet dark brown mud, highlights in shifted positions (shimmer frame 2) |
| 2e | terrain_whoops | repeating parallel dirt rhythm bumps, alternating light ridge and dark valley stripes |
| 2f | terrain_hardpack | pale packed clay lane, smooth and fast-looking |
| 2g | terrain_water_a | rippling shallow blue-green water |
| 2h | terrain_water_b | same water, ripples shifted (shimmer frame 2) |
| 2i | terrain_sand | pale wind-rippled sand |
| 2j | ground_meadow | healthy green mowed grass |
| 2k | ground_desert | pale sandy desert scrub with tiny stones |
| 2l | ground_prairie | dry golden-green prairie grass |
| 2m | ground_canyon | red-orange rocky canyon floor |
| 2n | ground_stadium | dark blue-gray groomed stadium infield dirt |
| 2o | ground_swamp | dark mossy wet ground |
| 2p | ground_ridge | purple-brown twilight scrub dirt |
| 2q | ground_storm | cold gray-green rain-soaked mud |

---

## WAVE 3 — TRACK FURNITURE we don't have yet
(You already gave me: cones, fences, trees, cacti, rocks, logs, crowd stands,
floodlights, flags, bunting, signs, barrels, tire singles, bridges, tents,
generators, towers — all wired or ready. Don't redo those.)

**3a · prop_ramp_kicker:**
> A dirt jump ramp seen from directly above, its sloped face painted with bold diagonal red and white warning chevrons, wide landscape orientation. [STYLE]

**3b · prop_ramp_tabletop:**
> A long tabletop dirt jump seen from directly above: chevron-painted up-slope, flat dirt top, down-slope — one wide asset. [STYLE]

**3c · prop_start_arch (has text):**
> A motocross start/finish arch spanning left to right: two metal truss towers holding a checkered banner that reads "SKYWOLF" in bold yellow letters with a small angular wolf-head logo, wide landscape orientation. [STYLE]

**3d · prop_haybale:**
> A rectangular hay bale barrier, warm straw yellow with visible baling twine, seen from slightly above. [STYLE]

**3e · prop_tire_stack:**
> A short stack of racing tires painted alternating red and white, top-down view showing the top tire's hole. [STYLE]

**3f · prop_gate_arrow_L and _R:**
> A lit LED arrow panel on a dark housing, bright amber bulbs forming a LEFT-pointing arrow. [STYLE]  (run again with RIGHT)

**3g · prop_billboards (3, have text):**
> A trackside billboard on two wooden posts reading "WOLFBURN FUELS" in bold vintage racing-sponsor lettering. [STYLE]
(run again: "HOWLER EXHAUSTS", then "ALPHA TRACTION TIRES")

**3h · prop_puddle:**
> An irregular shallow rain puddle seen from above, reflecting pale sky. [STYLE]

---

## WAVE 4 — CURRENCY + LOGO

**4a · pickup_sprocket strip (4 frames) — replaces the "P" coin with our ⚙:**
> Horizontal 4-frame sprite strip of a spinning coin animation: the coin is a golden-yellow (#F2C928) gear sprocket with visible teeth. Frames show it rotating — full face, three-quarter turned, thin edge-on, three-quarter back. Same size and center every frame. [STYLE]

**4b · pickup_golden_sprocket strip (4 frames):**
> Same spinning sprocket coin, but brilliant gold with a white four-point sparkle, slightly larger and more ornate — a rare jackpot version. [STYLE]

**4c · ui_logo_lockup (has text):**
> Game logo on a plain solid magenta background (#FF00FF): the words "PIT BIKE RALLY" in heavy italic uppercase letters, motocross number-plate style — plate-yellow (#F2C928) letters with a dark charcoal outline, slight forward skew, the word RALLY largest. Above it, small text "SKYWOLF STUDIOS" with a minimal angular wolf-head silhouette icon. Gritty but clean arcade racing energy. No other elements.

**4d · ui_part_icons (one 2×5 sheet is fine):**
> A 2×5 grid of flat game icons on solid magenta: engine block, exhaust pipe, carburetor, suspension fork, knobby tire, gear sprocket, bike frame, brake disc, nitro bottle, crash-cage armor. Identical stroke weight and size, chunky cartoon style with dark outlines.

**4e · ui_trophies (one image, 4 trophies in a row):**
> Four game trophies in a row on solid magenta: a bronze cup, a silver cup, a gold cup with tiny wolf ears on the handles, and a black fang-shaped trophy engraved "WOLF'S DEN". Chunky cartoon style, dark outlines. [STYLE]

**4f · ui_medals (one image, 3 medals in a row):**
> Three round medals in a row on solid magenta — bronze, silver, gold — each embossed with a tiny gear sprocket. [STYLE]

---

## WAVE 5 — BACKGROUNDS (full scenes — NO magenta, no sprites)

**5a · bg_menu_hero:**
> Wide illustrated game menu background: a small pit bike leaning against a wooden fence at golden hour, dirt racetrack and a corrugated-metal garage behind it, dusty warm light, a wolf silhouette standing on a distant hill ridge. Chunky flat cartoon illustration with bold outlines, muted warm palette with golden-yellow accents. The upper-center third is calm open sky for title placement. Landscape 16:9.

**5b · bg_garage:**
> Interior garage wall, straight-on: workbench with tools, pegboard, tire stacks, an empty trophy shelf centered in the upper third, warm bulb lighting. Chunky flat cartoon style with bold outlines. Landscape 16:9.

**5c · bg_podium:**
> Night stadium podium scene: an empty three-step podium centered, crowd bokeh and floodlights behind, confetti in the air, space on the steps for characters. Chunky flat cartoon style. Landscape 16:9.

---

## WAVE 6 — CUSTOMIZATION & SKINS (the shop content you asked about)

Do this wave AFTER 1a is approved — every skin repeats the approved pose set.

**6a · Helmet styles ×3** (shop cosmetics; overlay-sized, one image each):
> A single motocross helmet icon seen from above and slightly behind, pure bright green (#00FF00) shell: [VARIANT]. [STYLE]
- VARIANT 1: classic full-face motocross helmet with visor peak
- VARIANT 2: retro open-face helmet with goggles strapped on
- VARIANT 3: helmet with small pointed wolf ears molded on top

**6b · Bike skin "RUST BUCKET"** (budget-beater look — repeat prompts 1a–1f but replace the [BIKE] block with):
> a small beat-up pit bike (mini motocross bike) with an adult rider crouched on it, rider wears a pure bright green (#00FF00) jersey and helmet, bike has RUSTY dented fenders with green (#00FF00) patches of surviving paint, mismatched wheels, duct tape on the seat, dark gray frame, cardboard number plate, bike faces RIGHT

**6c · Bike skin "FACTORY WORKS"** (endgame chrome — same, replace [BIKE] with):
> a sleek factory-race pit bike (mini motocross bike) with an adult rider crouched on it, rider wears a pure bright green (#00FF00) race suit and helmet with sponsor stripes, bike has polished chrome frame, pure bright green (#00FF00) aerodynamic fairings, gold-anodized forks and wheels, bright yellow number plate, bike faces RIGHT

**6d · Decal pack (one sheet, has text):**
> A sticker sheet of 8 small racing sponsor-parody decals on solid magenta: "WOLFBURN FUELS", "HOWLER EXHAUSTS", "ALPHA TRACTION", a howling wolf head, a lightning bolt, a flaming gear sprocket, the number 13 in a circle, a "FULL SEND" banner. Bold vintage moto-sticker style, dark outlines.

**6e · Victory celebration strips (2 frames each — podium screen):**
> Same exact bike and rider as this image (attach approved 1a): horizontal 2-frame strip — [CELEBRATION]. [STYLE]
- CELEBRATION 1: victory wheelie with one fist raised, frame 2 fist pumps higher
- CELEBRATION 2: standing burnout, rear tire smoke, frame 2 more smoke and bike turned slightly

---

## What happens on my side, automatically
Slice sheets/strips → key magenta → despill fringe → extract green tint masks
(so the game paints your 9 colors) → clean captions → pack atlas → wire into
the game → screenshot proof back to you. Approve or redline, I iterate.
