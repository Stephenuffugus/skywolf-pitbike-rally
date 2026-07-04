/* Shared session state. One mutable object so modules stay close to the
   prototype's structure (ported from game/pit-bike-rally.html). */

export const S = {
  DATA: null,        // { economy, parts, cosmetics, tracks[] } from data/*.json
  G: null,           // persistent player state (save/save.js owns the schema)
  track: null,       // built track (track.js)
  bikes: [],
  race: {
    active: false, started: false, over: false,
    t: 0, countdown: 0, laps: 3, popups: [], finishOrder: [],
    pauseAfter: 0,
  },
  paused: false,
  currentScreen: 'menu',
};

export function partById(id) {
  return S.DATA.parts.parts.find(p => p.id === id);
}

export function bikeStats() {
  const G = S.G;
  const e = partById(G.equipped.engine), t = partById(G.equipped.tires),
        s = partById(G.equipped.susp), n = partById(G.equipped.nitro),
        g = partById(G.equipped.gears);
  return {
    top:   285 + e.top + g.top,                 // px/s
    accel: 190 + e.accel + g.accel,             // px/s^2
    steer: 2.55 + t.steer,                      // rad/s
    grip:  t.grip,                              // off-track/mud mitigation 0..0.22
    land:  s.land,                              // landing forgiveness 0..1
    charges: n.charges,
  };
}

export function statPct(st) {
  return {
    top:   (st.top - 285) / 140, accel: (st.accel - 190) / 140,
    steer: (st.steer - 2.55) / 0.85, land: st.land, nitro: (st.charges - 1) / 3,
  };
}

export function popup(x, y, text, color) {
  S.race.popups.push({ x, y, text, color, ttl: 1.1 });
}

export function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60), d = Math.floor((t * 10) % 10);
  return m + ':' + String(s).padStart(2, '0') + '.' + d;
}
