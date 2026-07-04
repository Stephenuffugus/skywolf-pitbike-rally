# PIT BIKE RALLY — Claude Code Handoff Document

**Studio:** Skywolf Studios
**Repository:** New standalone repo (suggested name: `skywolf-pitbike-rally`)
**Deployment target:** Fully integrated page/module inside the Skywolf Studios portal (plain HTML/JS site)
**Inspiration:** Ivan "Ironman" Stewart's Super Off Road (1989) — top-down, single-screen arena racing with a between-race upgrade shop — remade with **pit bikes** and made unique to Skywolf Studios.

---

## 1. Vision Statement

A fast, chaotic, top-down arena racer where 4 pit bikes battle around a single-screen dirt track full of jumps, mud pits, water hazards, and shortcuts. Races are short (60–120 seconds), the loop is addictive, and the real hook is the **economy**: every race pays out in-game cash that feeds a deep bike-building system with dozens of parts and cosmetic options. **Strictly in-game currency — no real-money purchases, ever.** The player's garage becomes their trophy case.

What makes it ours (not just a clone):
- Pit bikes instead of trucks: lighter physics, wheelies, whips off jumps, bikes can be knocked down (rider tumbles, remounts).
- A **stunt bonus** layer: mid-race style points (whips, wheelies, clean landings) convert to bonus cash.
- A **parts marketplace with rotating stock** — the shop restocks with random rare parts between race sets, giving a reason to keep racing.
- **Wear and maintenance**: parts degrade slightly with use; repairing is cheap, but neglect hurts performance. Creates a real economy sink.

---

## 2. Core Gameplay

### 2.1 Camera & Presentation
- Fixed top-down (or slightly angled 2.5D-style faux-iso, like Super Off Road) single-screen track. The entire track is always visible.
- Canvas-rendered, 60 FPS target, resolution-independent scaling to fit the portal page container.

### 2.2 Race Structure
- 4 riders per race: 1 player (Phase 1) + 3 AI. Phase 3 adds local multiplayer (shared keyboard) — see roadmap.
- Laps: 4–6 depending on track.
- Countdown start, position tracking, lap timer, best-lap tracking.
- Finishing positions pay out cash (see economy). Finishing last in a set costs a "continue" in classic arcade spirit — but paid with in-game cash, never real money.

### 2.3 Bike Physics (arcade, not sim)
- Velocity/heading model with drift factor on dirt; tighter grip on hardpack sections.
- Jumps: ramps launch the bike; airborne bikes ignore steering friction, cast a shadow, and land with a suspension-dependent recovery window.
- Wheelie on hard acceleration (cosmetic + small speed bonus + stunt points, but reduces steering).
- Collisions: bike-vs-bike bumps trade momentum; a hard enough hit knocks a rider down (1.5–2.5s remount penalty, reduced by "Armor" upgrades).
- Surfaces: dirt (base), mud (slow + slippery), water splash (slow), sand (drag), hardpack shortcut (fast, narrow).

### 2.4 Track Elements
- Ramps/tabletops, whoops sections (rhythm bumps that punish full throttle without suspension upgrades), mud pits, water crossings, hay bales/tire walls (solid), crowd barriers (track bounds), and **nitro pickups** that spawn like Super Off Road's on-track cash/nitro icons.
- On-track pickups: cash bundles ($), wrench (small free repair), nitro canister (adds one nitro charge for this race).
- 8 launch tracks minimum, each a data-driven layout (see track format in §6). Include mirrored variants for cheap variety like the original game did.

### 2.5 Controls
- Keyboard: Arrow keys / WASD steer + throttle, Space or Shift = nitro, Ctrl = brake.
- Optional on-screen touch controls for mobile portal visitors (Phase 2).
- Gamepad API support (Phase 2, nice-to-have).

### 2.6 AI
- 3 difficulty personalities per race set (Rookie, Vet, Ironman-tier) using waypoint/racing-line following with rubber-banding kept subtle. AI bikes also upgrade over the season so the difficulty curve tracks the player's economy.

---

## 3. Economy & Currency (THE core system — strictly in-game)

### 3.1 Currency
- Single soft currency: **Sprockets (⚙)** — earned only by playing. No real-money purchases, no premium currency, no ads. This is a hard design constraint.
- Persisted in `localStorage` under a namespaced key (see §6.5), with export/import of save data as JSON so players can back up their garage.

### 3.2 Earning
| Source | Payout (baseline, tunable in `economy.json`) |
|---|---|
| 1st place | 1,500 ⚙ |
| 2nd place | 1,000 ⚙ |
| 3rd place | 600 ⚙ |
| 4th place | 300 ⚙ |
| Best lap of race | +250 ⚙ |
| On-track cash pickup | 100–300 ⚙ each |
| Stunt points (whips/wheelies/clean landings) | converted at race end, cap ~500 ⚙/race |
| Race-set completion bonus (4 races) | +1,000 ⚙ |
| Daily first-win bonus | +500 ⚙ |

### 3.3 Sinks (what keeps the economy healthy)
- **Parts purchases** (the big one — see §4).
- **Repairs/maintenance**: parts accrue wear (0–100%). Racing at high wear reduces that part's stat contribution up to −30%. Repair cost scales with part tier.
- **Race entry fees** for higher-tier circuits (Amateur free; Pro and Ironman circuits have entry fees but bigger purses).
- **Continues** after last-place finishes in a circuit.
- **Cosmetics** (pure vanity, priced aggressively — this is where hoarders spend).
- **Garage slots**: player starts with 1 bike; additional bike slots (own multiple differently-built bikes) cost escalating amounts.

### 3.4 Rotating Shop
- The Parts Shop has permanent stock (all common/uncommon parts) plus **3 rotating rare/legendary slots** that restock after every completed race set, seeded RNG. Rare parts have slightly better stats *and* unique visuals. This is the retention hook — never gated behind anything but Sprockets.

### 3.5 Tuning file
All prices, payouts, wear rates, and stat curves live in a single `data/economy.json` so balance passes never touch game code.

---

## 4. Bike Customization (massive, data-driven)

### 4.1 Performance part slots (each affects stats)
| Slot | Stats affected | Tiers |
|---|---|---|
| Engine (50cc → 190cc big-bore kits) | Top speed, acceleration | 5 tiers × rarities |
| Exhaust | Acceleration, sound profile | 4 tiers |
| Carb/Fuel system | Throttle response (acceleration curve) | 4 tiers |
| Suspension (forks + shock) | Jump landing recovery, whoops handling | 5 tiers |
| Tires (knobby/paddle/hybrid/slick) | Grip per surface type — tires are situational, not linear | 4 types × 3 tiers |
| Sprocket/Gearing | Trade top speed ↔ acceleration slider | 3 tiers |
| Frame | Weight (handling vs. bump resistance) | 4 tiers |
| Brakes | Brake power, drift control | 3 tiers |
| Nitro tank | Nitro capacity (charges per race) | 4 tiers |
| Armor/Crash cage | Knockdown resistance, remount speed | 3 tiers |

Stats model: each bike has derived stats — Top Speed, Acceleration, Handling, Jump, Toughness, Nitro — computed from equipped parts + wear. Show a Super Off Road-style stat bar screen in the garage.

### 4.2 Cosmetics (zero stat effect, pure Sprocket sink)
- Plastics/fairing color (full palette + patterns), frame color, wheel color, seat.
- Number plates: background color, number font, custom 1–3 digit number.
- Decal packs (sponsor-parody stickers — invent fictional brands, e.g., "Wolfburn Fuels," "Howler Exhausts" — keep the Skywolf identity).
- Rider gear: helmet, jersey, gloves colorways.
- Victory celebrations (wheelie, whip, revving burnout) shown on podium screen.

### 4.3 Rarity & uniqueness
- Rarities: Common / Uncommon / Rare / Legendary. Higher rarity = better stat rolls + distinct sprite/palette. Legendary parts are shop-rotation only.
- Every part is a JSON entry in `data/parts.json` — adding content should never require code changes.

---

## 5. Progression

- **Circuits**: Amateur → Pro → Ironman. Each is a series of race sets across the 8 tracks with rising AI builds and entry fees/purses.
- **Trophies**: circuit completion trophies displayed in the garage.
- **Season structure (Phase 3)**: 16-race championship with points table, like the original's long-haul mode.
- **Stats page**: lifetime earnings, wins, best laps per track, total stunt points.

---

## 6. Technical Specification

### 6.1 Stack (must match portal: plain HTML/JS)
- **Vanilla JavaScript (ES modules), HTML5 Canvas 2D, CSS.** No framework, no build step, no bundler required — the game must run by opening `index.html` or being included in a portal page. (Optional: a tiny dev server script for local testing.)
- No external runtime dependencies. Audio via Web Audio API (synthesized or small bundled files).
- All state persistence via `localStorage`; no backend required for launch.

### 6.2 Suggested repo structure
```
skywolf-pitbike-rally/
├── index.html              # standalone entry (also embeddable)
├── css/game.css
├── src/
│   ├── main.js             # boot, game loop, scene manager
│   ├── scenes/             # menu, race, garage, shop, podium, results
│   ├── engine/             # loop, input, camera/scaler, audio, rng
│   ├── race/               # physics, collisions, ai, pickups, stunts, hud
│   ├── economy/            # wallet, payouts, wear, shop rotation
│   ├── garage/             # loadout, stat derivation, cosmetics
│   └── save/               # localStorage save/load, export/import JSON
├── data/
│   ├── economy.json
│   ├── parts.json
│   ├── cosmetics.json
│   └── tracks/track01.json ... track08.json
├── assets/                 # sprites, audio (or procedural placeholders first)
├── docs/DESIGN.md          # living design doc (seed it from this handoff)
└── README.md
```

### 6.3 Track data format (data-driven)
Tracks are JSON: a tile/surface grid or polygon list defining surfaces, plus arrays for walls, ramps (with launch vectors), checkpoints (ordered, for lap validation and AI racing line), pickup spawn points, and start grid positions. Include a `mirror: true` flag support to auto-generate mirrored variants.

### 6.4 Rendering
- Start with clean procedural/vector-style placeholder art (colored shapes with outlines can look intentionally stylish) so gameplay is playable in week 1; swap in sprite sheets later. Bikes need 16+ rotation frames or runtime rotation of a single sprite.
- Shadow + height offset for airborne bikes.

### 6.5 Save data
- Key: `skywolf.pitbikerally.save.v1`. Versioned schema with a migration function stub. Contents: wallet, owned parts (with wear), equipped loadouts per bike slot, cosmetics, circuit progress, stats, shop-rotation seed/state, settings.

### 6.6 Portal integration (Skywolf Studios)
- The game must be embeddable two ways: (a) linked as its own page from the portal, and (b) embedded via `<iframe>` or a `<script type="module">` mount into a container div — implement `PitbikeRally.mount(containerElement)`.
- Match/hook the portal's shared header/nav if one exists — **inspect the portal repo's existing pages and replicate its page shell, fonts, and color scheme** so the game page feels native. (Portal specifics weren't available at handoff time; confirm during setup.)
- Add the game's card/tile/link to the portal's game index page as part of the final integration PR.

---

## 7. Build Roadmap (suggested milestones)

**Phase 1 — Playable core (MVP)**
1. Repo scaffold, game loop, scene manager, input, canvas scaler.
2. One track (JSON-driven), player bike physics, laps/checkpoints, HUD.
3. 3 AI riders with waypoint racing lines.
4. Race payouts + wallet + localStorage save.
5. Garage with 4 part slots (engine, tires, suspension, nitro) + stat bars; basic shop.

**Phase 2 — The full economy**
6. All 10 part slots, rarities, wear/repair, rotating shop, entry fees, continues.
7. Cosmetics system + number plates + rider gear.
8. Stunt scoring (wheelies/whips/clean landings) → payout conversion.
9. Remaining 7 tracks + mirrored variants; 3 circuits with rising AI builds.
10. Audio, polish pass, touch controls.

**Phase 3 — Uniquely Skywolf**
11. Local 2-player split keyboard racing.
12. Championship season mode with points table.
13. Garage slots for multiple bikes; trophy room; stats page.
14. Portal integration PR: page shell match, index tile, iframe/mount support.

**Definition of done per phase:** playable in-browser with no console errors, save/load verified, economy numbers all sourced from `data/*.json`, README updated.

---

## 8. Hard Constraints & Non-Goals

- ❌ No real-money purchases, premium currency, ads, or external monetization of any kind. Sprockets are earned by play only.
- ❌ No copyrighted assets, names, logos, or audio from the original Super Off Road — it's inspiration for mechanics/feel only. All branding is original Skywolf IP.
- ❌ No backend/server dependency for launch (localStorage only).
- ❌ No build toolchain requirement — must run as static files, matching the portal.
- ✅ All content (parts, cosmetics, tracks, prices) data-driven via JSON.
- ✅ Deterministic seeded RNG for shop rotation (fair, testable).

---

## 9. First Actions for Claude Code

1. Create the repo `skywolf-pitbike-rally` with the structure in §6.2 and seed `docs/DESIGN.md` from this document.
2. Inspect the Skywolf Studios portal repo to note its page shell, styling conventions, and how games are linked — record findings in `docs/DESIGN.md` §Portal Integration.
3. Build Phase 1, item by item, committing per milestone with descriptive messages.
4. Keep a `CHANGELOG.md` and check off roadmap items in the README as they land.
