/* Shared session state. One mutable object so modules stay close to the
   prototype's structure (ported from reference/prototype.html). */

export const S = {
  DATA: null,        // { economy, parts, cosmetics, tracks[] } from data/*.json
  G: null,           // persistent player state (save/save.js owns the schema)
  track: null,       // built track (track.js)
  bikes: [],
  race: {
    active: false, started: false, over: false,
    t: 0, countdown: 0, laps: 3, popups: [], finishOrder: [],
    pauseAfter: 0,
    trackIndex: 0, variant: 0, fee: 0, featured: false,
    golden: null,            // {x,y,active} when the Golden Sprocket spawned
    ghost: null, ghostRec: null,
    tt: false,               // time trial: solo, best lap against four target times
    career: false,           // a season round: points, a named rival, no fee
  },
  paused: false,
  currentScreen: 'menu',
};

export function partById(id) {
  return S.DATA.parts.parts.find(p => p.id === id);
}

/* Wear scales a part's stat contribution down, up to economy.wear.maxStatLoss
   at 100% wear. Stock (price 0) parts never wear. Nitro charge count is a
   bottle count — unaffected by wear. */
export function wearFactor(part) {
  if (!part || part.price === 0) return 1;
  const w = (S.G.wear && S.G.wear[part.id]) || 0;
  return 1 - S.DATA.economy.wear.maxStatLoss * (w / 100);
}

export function bikeStats() {
  const G = S.G;
  const st = { top: 285, accel: 190, steer: 2.55, grip: 0, land: 0, charges: 1, brake: 0, tough: 0 };
  for (const slot of S.DATA.parts.slots) {
    const p = partById(G.equipped[slot]);
    if (!p) continue;
    const wf = wearFactor(p);
    st.top += (p.top || 0) * wf;
    st.accel += (p.accel || 0) * wf;
    st.steer += (p.steer || 0) * wf;
    st.grip += (p.grip || 0) * wf;
    st.land += (p.land || 0) * wf;
    st.brake += (p.brake || 0) * wf;
    st.tough += (p.tough || 0) * wf;
    if (p.charges) st.charges = p.charges;
  }
  return st;
}

export function statPct(st) {
  return {
    top: (st.top - 285) / 250, accel: (st.accel - 190) / 250,
    steer: (st.steer - 2.55) / 1.9, land: st.land / 1.2,
    nitro: (st.charges - 1) / 4,
    brake: st.brake / 1.0, tough: st.tough / 1.1,
  };
}

/* ---- circuits & medals ---- */

export function configKey(trackIndex, variant) {
  return trackIndex + ':' + (variant || 0);
}

export function circuitOf(trackIndex) {
  return S.DATA.economy.circuits.find(c => c.tracks.includes(trackIndex));
}

export function circuitMedalCount(circuitId) {
  const c = S.DATA.economy.circuits.find(x => x.id === circuitId);
  if (!c) return 0;
  let n = 0;
  for (const k in S.G.medals) {
    const ti = parseInt(k, 10);
    if (c.tracks.includes(ti)) n += S.G.medals[k].length;
  }
  return n;
}

export function circuitUnlocked(circuit) {
  if (!circuit.unlock) return true;
  return circuitMedalCount(circuit.unlock.circuit) >= circuit.unlock.medals;
}

/* ---- career seasons ---- */
export function seasonById(id) { return S.DATA.seasons.seasons.find(s => s.id === id); }
export const AI_NAMES = ['Dusty', 'Rico', 'Mags'];
/* the two riders who are not this season's rival, in bike slot order (2, 3) */
export function seasonOthers(sea) { return AI_NAMES.filter(n => n !== sea.rival.name); }
export function seasonUnlocked(sea) { return !sea.unlock || !!S.G.trophies[sea.unlock]; }
/* standings: [{name, pts, you, rival}] sorted by points, ties keep order */
export function seasonStandings(car) {
  const sea = seasonById(car.id);
  const others = seasonOthers(sea);
  const rows = [
    { name: 'You', pts: car.pts[0], you: true },
    { name: sea.rival.name, pts: car.pts[1], rival: true },
    { name: others[0], pts: car.pts[2] },
    { name: others[1], pts: car.pts[3] },
  ];
  return rows.sort((a, b) => b.pts - a.pts);
}
export function seasonPlace(car) { return seasonStandings(car).findIndex(r => r.you) + 1; }

/* ---- time trial ---- */
export const TT_ORDER = ['bronze', 'silver', 'gold', 'platinum'];
export function ttTargets(def) {
  if (def && def.tt) return def.tt;                 // measured per track (autopilot laps, stock and maxed bike)
  const L = S.DATA.economy.tt.ladder, base = def && def.targetLap;
  if (!base) return null;                            // generated tracks fall back to the ladder
  return { platinum: base * L.platinum, gold: base * L.gold, silver: base * L.silver, bronze: base * L.bronze };
}
export function ttTierFor(def, lapS) {
  const t = ttTargets(def);
  if (!t || !(lapS < Infinity)) return null;
  let tier = null;
  for (const k of TT_ORDER) if (lapS <= t[k]) tier = k;
  return tier;
}

export function popup(x, y, text, color) {
  S.race.popups.push({ x, y, text, color, ttl: 1.1 });
}

export function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60), d = Math.floor((t * 10) % 10);
  return m + ':' + String(s).padStart(2, '0') + '.' + d;
}
