/* Race lifecycle: start (fees/variants/featured), per-frame update (ghost
   recording, golden spawn), finish (payouts, wear, medals, set bonus). */
import { S, bikeStats, popup, configKey, circuitOf } from './state.js';
import { buildTrack, applyVariant, prerenderTrack } from './track.js';
import { makeBike, updateBike, updateAI, bikeCollisions, racePositions } from './physics.js';
import { setTrackCanvas } from './render.js';
import { clearFx, updateFx } from './fx.js';
import { hudInit, hudUpdate } from './hud.js';
import { setScreen, showResults } from './ui.js';
import { audioRace, audioTick } from './audio.js';
import { saveNow } from './save.js';
import { applyRaceWear, setsCompleted } from './shop.js';
import { mulberry32, dayKey } from './rng.js';

/* AI paints come from the same cosmetics palette as the player so the
   top-down sprite strips (one per paint id) cover everyone; first three
   ids not taken by the player. Falls back to these hexes only if a paint
   id is missing from cosmetics.json. */
const AI_PAINT_PREFS = ['orange', 'purple', 'mint', 'red', 'blue', 'yellow'];
const AI_COLORS = ['#e4952f', '#7f56c9', '#3fb4c9'];
const AI_NAMES = ['Dusty', 'Rico', 'Mags'];
const GHOST_HZ = 10;

/* Today's featured config (2× purse): seeded by date over the tracks the
   player can actually enter. Returns {trackIndex, variant} or null. */
export function dailyFeatured(unlockedTracks) {
  if (!unlockedTracks.length) return null;
  const rng = mulberry32(dayKey() ^ 0xF17E);
  const ti = unlockedTracks[Math.floor(rng() * unlockedTracks.length)];
  const variant = Math.floor(rng() * 4);
  return { trackIndex: ti, variant };
}

export function isFeatured(ti, variant, unlockedTracks) {
  const f = dailyFeatured(unlockedTracks);
  return !!f && f.trackIndex === ti && f.variant === (variant || 0);
}

export function startRace(ti, variant, opts) {
  const { G, DATA, race } = S;
  variant = variant || 0;
  const circuit = circuitOf(ti);
  const fee = circuit ? circuit.fee : 0;
  if (fee > 0) {
    if (G.wallet < fee) return false;       // UI gates this; belt and suspenders
    G.wallet -= fee;
  }
  G.trackIndex = ti; G.variant = variant;
  const def = applyVariant(DATA.tracks[ti], variant);
  const raceSeed = (Math.random() * 0xFFFFFF) | 0;
  S.track = buildTrack(def, raceSeed);
  if (S.track.hasShiftZones) S.track.shiftZones(0);
  race.laps = def.laps;
  race.t = 0; race.countdown = 3.2; race.started = false; race.over = false; race.active = true;
  race.popups = []; race.finishOrder = []; race.pauseAfter = 0;
  race.trackIndex = ti; race.variant = variant; race.fee = fee;
  race.featured = !!(opts && opts.featured);
  race.ghostT = 0;

  // golden sprocket: rolled at race start, spawns once the player clears lap 1
  const goldRoll = def.goldenAlways || Math.random() < DATA.economy.golden.chance;
  race.golden = null;
  race.goldenPending = goldRoll;

  // ghost of your best lap on this config
  const ghost = G.ghosts[configKey(ti, variant)];
  race.ghost = ghost && ghost.pts && ghost.pts.length >= 6 ? ghost : null;

  for (const p of S.track.pickups) { p.active = true; p.timer = 0; }
  clearFx();

  const st = bikeStats();
  const track = S.track;
  const bikes = S.bikes = [];
  const N = track.N;
  for (let k = 0; k < 4; k++) {
    const back = 30 + Math.floor(k / 2) * 22;
    const i = (N - back) % N;
    const nrm = track.normals[i];
    const lat = (k % 2 === 0 ? -1 : 1) * track.width * 0.22;
    const p = track.pts[i];
    const q = track.pts[(i + 6) % N];
    const bike = makeBike({
      x: p[0] + nrm[0] * lat, y: p[1] + nrm[1] * lat,
      heading: Math.atan2(q[1] - p[1], q[0] - p[0]),
      idx: i, lap: 0,
    });
    if (k === 0) {
      bike.isAI = false; bike.name = 'You';
      bike.paint = G.color;
      bike.color = DATA.cosmetics.colors.find(c => c.id === G.color).hex; bike.plate = G.plate;
      bike.stats = st; bike.nitro = st.charges;
      bike.lapStream = [];
    } else {
      const j = k - 1;
      const base = DATA.tracks[ti].ai;
      const skill = base + j * 0.035 + Math.random() * 0.02;
      const aiUp = Math.min(1, ti / 11);
      const aiPaints = AI_PAINT_PREFS.filter(p => p !== G.color);
      const paintCol = DATA.cosmetics.colors.find(c => c.id === aiPaints[j]);
      bike.isAI = true; bike.skill = skill; bike.name = AI_NAMES[j];
      bike.paint = aiPaints[j];
      bike.color = paintCol ? paintCol.hex : AI_COLORS[j]; bike.plate = [11, 23, 42][j];
      bike.stats = {
        top: 285 + 130 * aiUp * skill, accel: 190 + 110 * aiUp * skill,
        steer: 2.55 + 0.75 * aiUp, grip: 0.16 * aiUp, land: 0.6 + 0.3 * aiUp,
        charges: 1 + Math.round(2 * aiUp), brake: 0.5 * aiUp, tough: 0.4 * aiUp,
      };
      bike.nitro = bike.stats.charges;
    }
    bikes.push(bike);
  }
  const layers = prerenderTrack(ti);
  setTrackCanvas(layers.base, layers.deck);
  setScreen('race');
  hudInit();
  audioRace(true);
  return true;
}

function spawnGolden() {
  const { race } = S;
  const track = S.track;
  const i = Math.floor(Math.random() * track.N);
  const side = (Math.random() * 2 - 1) * 0.3;
  const nrm = track.normals[i];
  race.golden = {
    x: track.pts[i][0] + nrm[0] * side * track.width,
    y: track.pts[i][1] + nrm[1] * side * track.width,
    active: true,
  };
  race.goldenPending = false;
  popup(race.golden.x, race.golden.y - 24, 'GOLDEN SPROCKET!', '#ffd23f');
}

export function updateRace(dt) {
  const race = S.race;
  if (S.paused) return;
  if (race.countdown > 0) {
    race.countdown -= dt;
    const c = Math.ceil(race.countdown);
    const el = document.getElementById('count');
    if (race.countdown <= 0) {
      race.started = true; el.textContent = 'GO!'; el.classList.add('go');
      setTimeout(() => { el.style.display = 'none'; }, 700);
    } else { el.textContent = c; el.style.display = 'block'; el.classList.remove('go'); }
    return;
  }
  race.t += dt;

  for (const b of S.bikes) { if (b.isAI) updateAI(b, dt); }
  for (const b of S.bikes) updateBike(b, dt);
  bikeCollisions();
  updateFx(dt);

  // ghost recording — sample the player's current lap at GHOST_HZ
  const p = S.bikes[0];
  race.ghostT -= dt;
  if (race.ghostT <= 0 && !p.finished) {
    race.ghostT = 1 / GHOST_HZ;
    if (p.lapStream) p.lapStream.push(Math.round(p.x), Math.round(p.y), Math.round(p.heading * 100) / 100);
  }

  // golden sprocket spawns after the configured lap
  if (race.goldenPending && p.lap > S.DATA.economy.golden.afterLap) spawnGolden();

  // bridge-pass medal (Crossover Junction): crossing over while a rival is under
  const track = S.track;
  if (track.onBridge && !p.finished) {
    const on = track.onBridge(p.idx);
    if (on && !p._wasOnBridge) {
      for (const b of S.bikes) {
        if (b.isAI && !track.onBridge(b.idx) && (b.x - p.x) ** 2 + (b.y - p.y) ** 2 < 150 * 150) {
          p.m_bridgePass = (p.m_bridgePass || 0) + 1;
          popup(p.x, p.y - 30, 'OVERPASS!', '#8ef07f');
          break;
        }
      }
    }
    p._wasOnBridge = on;
  }

  for (const pk of track.pickups) { if (!pk.active) { pk.timer -= dt; if (pk.timer <= 0) pk.active = true; } }
  for (let i = race.popups.length - 1; i >= 0; i--) {
    const pp = race.popups[i]; pp.ttl -= dt; pp.y -= 28 * dt; if (pp.ttl <= 0) race.popups.splice(i, 1);
  }

  if (race.over) {
    race.pauseAfter -= dt;
    if (race.pauseAfter <= 0) { finishRace(); }
  }
  hudUpdate();
  audioTick();
}

/* Sunbeams (Sky Wolf shared currency): win pays 4, podium 2 — capped at 30/day
   per the studio earn policy. Game's own Sprockets are untouched by this. */
function earnSunbeams(place) {
  const G = S.G;
  const today = new Date().toISOString().slice(0, 10);
  if (G.sunbeamDay !== today) { G.sunbeamDay = today; G.sunbeamEarnedToday = 0; }
  const amt = place === 0 ? 4 : (place < 3 ? 2 : 0);
  if (!amt || G.sunbeamEarnedToday + amt > 30) return;
  G.sunbeamEarnedToday += amt;
  if (window.Sunbeam) Sunbeam.earn(amt, 'pitbike-rally:' + (place === 0 ? 'win' : 'place')).catch(function () { });
}

/* Which of this config's three medals did this race earn (not yet owned)? */
function judgeMedals(p, place, def, key) {
  const G = S.G;
  const had = G.medals[key] || [];
  const earned = [];
  const bestMs = p.bestLap < Infinity ? p.bestLap * 1000 : Infinity;
  if (!had.includes('gold') && place === 0) earned.push('gold');
  if (!had.includes('silver') && def.targetLap && bestMs <= def.targetLap * 1000) earned.push('silver');
  if (!had.includes('bronze') && def.special && specialDone(p, place, def.special)) earned.push('bronze');
  if (earned.length) G.medals[key] = had.concat(earned);
  return earned;
}

function specialDone(p, place, sp) {
  switch (sp.type) {
    case 'allPickups': return (p.m_pickupsTaken || 0) >= S.track.pickups.length;
    case 'noOfftrack': return !p.m_offtrack;
    case 'cleanJumps': return (p.m_cleanJumps || 0) >= sp.n;
    case 'style':      return p.style >= sp.n;
    case 'winNoNitro': return place === 0 && !p.m_usedNitro;
    case 'airtime':    return (p.m_airtime || 0) >= sp.n;
    case 'comeback':   return place === 0 && p.m_finalLapPos === 4;
    case 'nitroGrabs': return (p.m_nitroGrabs || 0) >= sp.n;
    case 'bridgePass': return (p.m_bridgePass || 0) >= sp.n;
    case 'noSand':     return !!p.m_cleanSandLap;
    case 'wolfsden':   return place === 0 && (p.goldenCash || 0) > 0 && p.style >= 300 && !p.m_offtrack;
    default: return false;
  }
}

export function finishRace() {
  const { G, DATA, race } = S;
  race.active = false;
  audioRace(false);
  const order = racePositions();
  const place = order.indexOf(S.bikes[0]);
  const def = S.track.def;
  const p = S.bikes[0];
  const EC = DATA.economy;
  const key = configKey(race.trackIndex, race.variant);

  let purse = DATA.tracks[race.trackIndex].purse;
  if (race.featured) purse *= EC.featured.purseMult;
  const basePay = Math.round(EC.place[place] * purse);
  const stylePay = Math.min(EC.styleCap, p.style * EC.styleRate);
  let bestLapBonus = 0;
  if (p.bestLap < Infinity) bestLapBonus = EC.bestLap;

  // medals BEFORE wear so judging sees the race's true stats
  const newMedals = judgeMedals(p, place, def, key);
  let medalPay = 0;
  for (const m of newMedals) medalPay += EC.medals[m];

  // set completion bonus: every racesPerSet-th race
  G.races++;
  const setDone = G.races % EC.shop.racesPerSet === 0;
  const setPay = setDone ? EC.shop.setBonus : 0;

  const golden = p.goldenCash || 0;
  const total = basePay + stylePay + p.cash + bestLapBonus + medalPay + setPay + golden;
  G.wallet += total; G.earnings += total;
  if (place === 0) G.wins++;

  const ms = Math.round(p.finishTime * 1000) || Math.round(race.t * 1000);
  if (p.finished && (!G.best[key] || ms < G.best[key])) G.best[key] = ms;

  // ghost: store this config's best lap stream
  if (p.bestLapStream && p.bestLapStream.length >= 6) {
    const bestMs = Math.round(p.bestLap * 1000);
    const existing = G.ghosts[key];
    if (!existing || bestMs < existing.ms) {
      G.ghosts[key] = { ms: bestMs, hz: GHOST_HZ, pts: p.bestLapStream };
    }
  }

  applyRaceWear(race.laps);
  earnSunbeams(place);
  saveNow();
  showResults({
    place, order, basePay, stylePay, cash: p.cash, bestLapBonus,
    medals: newMedals, medalPay, setPay, golden, fee: race.fee,
    featured: race.featured, total,
  });
}
