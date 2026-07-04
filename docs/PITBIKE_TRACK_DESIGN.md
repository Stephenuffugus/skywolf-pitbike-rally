# PIT BIKE RALLY — Track Design & Replayability

**Goal:** make 12 authored tracks play like 60+, and give players a reason to re-run tracks they've already beaten. Retention comes from variance, mastery targets, and daily rhythm — never from paywalls (Sprockets stay earn-only).

---

## 1. Replayability Systems (the retention engine)

### 1.1 Variant matrix — every track is four tracks
Every layout ships with **Mirror**, **Reverse**, and **Mirror+Reverse** variants, generated from the same JSON at load (flip X / reverse point order, re-derive racing line). Corners that were rhythmic right-handers become unfamiliar left-handers; a memorized track becomes fresh. 12 layouts × 4 = **48 raceable configurations**, near-zero extra art.

### 1.2 Weather/time layers
Each track defines which layers it supports: **Rain** (grip down ~12%, puddle decals, rain overlay, mud zones grow) and **Night** (headlight glow, floodlights on stadium tracks, pickups glint brighter). Variants pay +10–20% purse. Rain/night selection is part of the daily rotation seed, so the same circuit feels different day to day.

### 1.3 Challenge medals — 3 per configuration
Every track shows three medal objectives, each paying a one-time Sprocket bonus and counting toward garage trophies:
- **Win it** (gold medal): finish 1st.
- **Beat the clock** (silver): beat the target lap time listed on the track sheet.
- **Track special** (bronze): a track-specific stunt/economy goal (listed per track below).
48 configs × 3 medals = **144 medal chases**. Medal completion % is displayed on the track card — completionist fuel.

### 1.4 Ghost laps
The game records the player's best lap as a position/heading stream (~2KB) and replays it as a translucent ghost bike. Beating your own ghost is the single strongest "one more run" loop in racing games and costs no art. Later: share ghosts via save-export JSON.

### 1.5 Daily featured track
A seeded daily rotation flags one configuration with a **2× purse flame badge** plus a fixed weather layer. Combined with the daily first-win bonus (+500⚙), this creates a daily login habit loop: check featured → race it → spend at the shop rotation.

### 1.6 Golden Sprocket
Once per race, with ~35% probability, a **Golden Sprocket (1,000⚙)** spawns at a random pickup point mid-race with a distinct sparkle. It creates race-to-race variance, mid-race route decisions (detour vs. position), and slot-machine anticipation — paid entirely in earnable currency.

### 1.7 Risk/reward shortcuts
Every track from #3 onward has at least one shortcut that is *conditionally* faster: narrow, hazard-guarded, or requiring a specific upgrade (paddle tires for a mud cut, race suspension for a gap jump). Shortcuts convert garage purchases into new racing lines — upgrades literally unlock new ways to drive old tracks.

### 1.8 Rotating shop synergy
The rare-parts shop restocks after each completed race set (per the handoff). Track purses are tuned so a full 4-race set on mid circuits ≈ one Rare part — every set completion lands next to a fresh shop tempting the payout.

---

## 2. Circuit Structure

| Circuit | Tracks | Entry fee | AI build | Unlock |
|---|---|---|---|---|
| **Amateur** | 1–4 | Free | Stock–light mods | Default |
| **Pro** | 5–8 | 300⚙/race | Mid builds | Any 6 Amateur medals |
| **Ironman** | 9–11 | 800⚙/race | Heavy builds | Any 12 Pro medals |
| **Wolf's Den** | 12 | 1,500⚙ | Maxed builds | Ironman circuit trophy |

Medal-based unlocks (not just wins) let players progress through mastery *or* grinding — both paths feel fair.

---

## 3. Track Sheets

Target lap = silver-medal time on a mid-tier build. Purse multiplies the base payout table.

### 01 · ROOKIE OVAL — Meadow · 3 laps · purse ×1.0
The teaching track: wide (118u), two gentle ramps, generous pickups. Layout is a squashed oval with one flattened side so it isn't a pure throttle-hold.
**Signature:** first-jump tutorial ramp placed so even stock bikes clear it clean.
**Shortcut:** none — learn the racing line.
**Target lap:** 16.0s. **Special medal:** collect every pickup in one race.
**Layers:** rain, night.

### 02 · HAIRPIN GULCH — Desert · 3 laps · ×1.2
Three stacked straights joined by 180° hairpins. Teaches braking and the short-gearing tradeoff.
**Signature:** the middle hairpin apex is mud — brake early or paddle through.
**Shortcut:** inside curb at hairpin 2 is hardpack: tight entry, +0.4s if nailed.
**Target lap:** 21.5s. **Special:** finish a race without ever going off-track.
**Layers:** night (torch-lit gulch).

### 03 · PEANUT FLATS — Prairie · 4 laps · ×1.3
Flowing peanut-shaped double loop, rhythm over braking. Two ramps mid-straight reward holding throttle in air.
**Signature:** back-to-back tabletops — doubling them (nitro mid-air) chains style points.
**Shortcut:** waist of the peanut has a grass cut guarded by haybales; only worth it with soft-compound tires.
**Target lap:** 18.0s. **Special:** land 4 clean jumps in a single race.
**Layers:** rain, night.

### 04 · SNAKE CANYON — Canyon · 3 laps · ×1.5
Four tight switchback rows (width 86), the Amateur final exam. Mud on row two, kicker on row three.
**Signature:** descending-radius corners — each hairpin is slightly tighter than the last.
**Shortcut:** a gap-jump over the canyon lip between rows 3 and 4: needs Sport suspension or better to land clean; saves ~1.2s, costs ~0.8s on a botched landing.
**Target lap:** 24.0s. **Special:** hit the gap-jump shortcut twice in one race.
**Layers:** night.

### 05 · STADIUM GP — Stadium Night · 4 laps · ×1.7
Supercross under floodlights: chicane, triple ramp set, whoops strip, crowd bleachers. Pro circuit opener.
**Signature:** the whoops — full throttle punishes stock suspension with speed-killing bounces; Race suspension skims them.
**Shortcut:** inside line through the chicane is cone-tight but flat.
**Target lap:** 19.5s. **Special:** 250+ style points in one race.
**Layers:** night is the default look; "day" is its variant. Rain adds slop to the whoops.

### 06 · MUD BOWL — Swamp · 4 laps · ×1.8
A grip-management bowl where a third of the lap is mud/water. The track that sells paddle tires.
**Signature:** the "soup section" — 25% of the lap is continuous mud with a dry inside ribbon two bike-widths wide.
**Shortcut:** a water crossing cuts the bowl's kidney — slow but shorter; net-positive only with Paddle Pros.
**Target lap:** 20.5s. **Special:** win without nitro.
**Layers:** rain (mud zones expand ~30% — dramatic).

### 07 · RIDGE RUNNER — Dusk Ridge · 4 laps · ×2.0
The speed track: long sweepers, four big ramps, widest corners on the Pro circuit. Sells engines and tall gearing.
**Signature:** the "flight line" — four jumps spaced so a maxed engine chains all four airborne with nitro.
**Shortcut:** none; the shortcut *is* speed. Highest average velocity in the game.
**Target lap:** 16.5s. **Special:** total 3.0s+ airtime in one race.
**Layers:** dusk default; night; rain.

### 08 · IRONMAN CIRCUIT — Storm · 5 laps · ×2.5
Everything test: hairpins, mud, five zones, narrow width (90), the longest lap. Pro finale and prototype's current boss.
**Signature:** the S-hook mid-section where mud exits directly into a kicker — speed management chain.
**Shortcut:** inner hardpack lane bypassing the S-hook, gated by a tire-stack slalom.
**Target lap:** 27.0s. **Special:** win from 4th place on the final lap (comeback medal).
**Layers:** storm rain default; night.

### 09 · CROSSOVER JUNCTION — Stadium/Canyon mix · 4 laps · ×2.6 *(NEW)*
Figure-8 with a bridge overpass. The lap crosses itself — the field spreads so riders on different lap phases share the junction.
**Signature:** the crossing itself: traffic through the underpass while leaders thunder over the bridge. Near-misses every lap.
**Shortcut:** none — the drama is the junction.
**Target lap:** 22.0s. **Special:** cross the bridge while another rider is under it (proximity check) 3 times.
**Layers:** night, rain. *Build note: bridge needs a simple z-layer — bikes on the "over" segment draw above and don't collide with "under" bikes.*

### 10 · RALLYCROSS SWITCH — Prairie/Desert mix · 4 laps · ×2.7 *(NEW)*
The alternating-route track: a lit gate flips every lap, sending riders around the **outer sweep** (fast, long) on odd laps and the **inner joker hairpin** (slow, short) on even laps. Rally-cross joker-lap rules, automated.
**Signature:** no two consecutive laps drive the same — memorization resets every lap.
**Shortcut:** the joker section contains the race's only wrench pickup.
**Target lap:** 20.0s avg. **Special:** win with the fastest lap on BOTH route variants.
**Layers:** rain, night. *Build note: route gate is a zone flag the engine toggles per lap; arrows use `route_gate_arrows` asset.*

### 11 · SANDSTORM SWEEP — Desert · 5 laps · ×2.8 *(NEW)*
High-speed desert sweeps where **sand drifts migrate**: three sand zones shift position along the lap each time you cross the line (seeded per race).
**Signature:** reading the track — the racing line is discovered lap by lap, every race.
**Shortcut:** a dune kicker cuts the final sweep, but its landing zone is sometimes sand (seed-dependent) — a genuine gamble.
**Target lap:** 18.5s. **Special:** complete a lap touching zero sand.
**Layers:** dusk, storm. *Build note: zones get per-lap fraction offsets from the race seed — data-driven, no new physics.*

### 12 · WOLF'S DEN — Storm Night · 6 laps · ×3.0 *(NEW — finale)*
Skywolf's showcase. Longest track: a howling ridge climb (Ridge Runner speed), a den descent of descending hairpins (Snake Canyon), a flooded gulley (Mud Bowl), a crossover bridge, and a joker gate on the final sector. Every upgrade and every skill, one track.
**Signature:** the Den Drop — a huge tabletop into the hairpin sequence with a wolf-mark carved into the hillside beside it (hero art moment).
**Shortcut:** the "wolf's tooth" gap jump — the game's hardest, needing Factory Works suspension + 190 motor; saves 2s, ends races when missed.
**Target lap:** 32.0s. **Special:** win with all three: a Golden Sprocket collected, 300+ style, and zero off-tracks. (This medal is the game's endgame flex.)
**Layers:** storm night only — it should always feel like a boss fight.

---

## 4. Purse & Retention Tuning Notes

- A clean Amateur set (tracks 1–4, wins) ≈ 6,600⚙ → one Tier-2 part + change. Pro set ≈ 11,800⚙ net of fees → one Tier-3 or two Tier-2. Players should afford *something* after every set — never leave a session without a purchase decision.
- Featured-track 2× purse + daily win bonus makes the optimal daily session ~10 minutes: one featured race, one shop check. Short daily loops beat long forced grinds for retention.
- Medal bonuses: gold 400⚙ / silver 300⚙ / bronze 250⚙, one-time per configuration. Full medal clear of the game ≈ 45,000⚙ — roughly one full Legendary build, so completionism and bike-building converge on the same fantasy.
- Surface variety across the 12 tracks intentionally maps to part slots (mud→tires, whoops→suspension, sweeps→engine, hairpins→gearing/brakes) so every shop category has "its" tracks. When a player buys a part, suggest its showcase track on the purchase confirmation — closes the loop from spending back to racing.

## 5. Build Order

1. Refit existing 8 prototype tracks with shortcuts, medal defs, and target laps (data-only where possible).
2. Variant system (mirror/reverse) + ghost laps — biggest replay value per line of code.
3. Tracks 9–10 (bridge z-layer, route gates), then 11–12.
4. Daily featured rotation + Golden Sprocket + medal payouts.
