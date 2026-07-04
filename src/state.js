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

export function popup(x, y, text, color) {
  S.race.popups.push({ x, y, text, color, ttl: 1.1 });
}

export function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60), d = Math.floor((t * 10) % 10);
  return m + ':' + String(s).padStart(2, '0') + '.' + d;
}
