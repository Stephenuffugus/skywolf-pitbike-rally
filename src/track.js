/* Track building: Catmull-Rom resample, zones, pickups, prerender + dressing. */
import { S } from './state.js';
import { spr, drawSpr } from './sprites.js';

export const W = 1600, H = 900;

export function catmull(pts, spacing) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(4, Math.round(seg / spacing));
    for (let j = 0; j < steps; j++) {
      const u = j / steps, u2 = u * u, u3 = u2 * u;
      const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3);
      const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3);
      out.push([x, y]);
    }
  }
  return out;
}

export function buildTrack(def) {
  const pts = catmull(def.pts, 12);
  const N = pts.length;
  const normals = [];
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 1 + N) % N], b = pts[(i + 1) % N];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    normals.push([-dy / L, dx / L]);
  }
  const frac = i => i / N;
  const zoneAt = f => {
    for (const z of def.zones) { if (f >= z.a && f <= z.b) return z.type; }
    return null;
  };
  const pickups = def.pickups.map(pk => {
    const i = Math.floor(pk.t * N) % N;
    const nrm = normals[i], off = pk.side * def.width * 0.32;
    return { x: pts[i][0] + nrm[0] * off, y: pts[i][1] + nrm[1] * off, type: pk.type, active: true, timer: 0 };
  });
  return { def, pts, N, normals, width: def.width, frac, zoneAt, pickups };
}

export function nearestIdx(x, y, hint) {
  const track = S.track;
  const N = track.N;
  let best = -1, bd = Infinity;
  const scan = (i) => {
    const p = track.pts[(i + N) % N];
    const d = (p[0] - x) ** 2 + (p[1] - y) ** 2;
    if (d < bd) { bd = d; best = (i + N) % N; }
  };
  if (hint == null) { for (let i = 0; i < N; i += 2) scan(i); }
  else { for (let i = hint - 70; i <= hint + 70; i++) scan(i); }
  return { idx: best, dist: Math.sqrt(bd) };
}

/* Trackside dressing: theme prop sets placed deterministically outside the
   ribbon. Decor only — no collision. */
const THEME_PROPS = [
  ['prop_tree_pine', 'prop_fence_wood', 'prop_log_pile', 'prop_bench', 'prop_bunting_posts'],      // Rookie Oval (meadow)
  ['prop_cactus', 'prop_rock_large', 'prop_barrel_hazard', 'prop_sign_slowdown', 'prop_water_tower'], // Hairpin Gulch (desert)
  ['prop_tree_pine', 'prop_windmill', 'prop_corral_fence', 'prop_camper', 'prop_log_pile'],        // Peanut Flats (prairie)
  ['prop_rock_large', 'prop_cactus', 'prop_sign_danger', 'prop_watchtower_wood', 'prop_barrel_hazard'], // Snake Canyon
  ['prop_crowd_stand', 'prop_light_tower', 'prop_speaker_stack', 'prop_stage_lights', 'prop_bunting_posts'], // Stadium GP
  ['prop_log_pile', 'prop_porta_potty', 'prop_sign_slippery', 'prop_tree_pine', 'prop_medic_tent'],  // Mud Bowl (swamp)
  ['prop_rock_large', 'prop_silo', 'prop_oil_pump', 'prop_sign_hotlaps', 'prop_tree_pine'],        // Ridge Runner
  ['prop_crowd_stand_b', 'prop_light_tower_b', 'prop_ambulances', 'prop_shipping_container', 'prop_generator_red'], // Ironman
];

function placeDressing(track, ti) {
  const list = (THEME_PROPS[ti] || THEME_PROPS[0]).filter(n => spr(n));
  const out = [];
  const N = track.N;
  const count = 10;
  for (let k = 0; k < count; k++) {
    const i = Math.floor((k / count) * N + ti * 31) % N;
    const side = (k % 2 === 0 ? 1 : -1);
    const nrm = track.normals[i];
    const off = track.width * (0.95 + ((k * 7 + ti * 13) % 5) * 0.14);
    const x = track.pts[i][0] + nrm[0] * off * side;
    const y = track.pts[i][1] + nrm[1] * off * side;
    if (x < 30 || x > W - 30 || y < 30 || y > H - 30) continue;
    // don't sit on another stretch of ribbon
    const near = (() => {
      let bd = Infinity;
      for (let q = 0; q < N; q += 3) {
        const p = track.pts[q];
        const d = (p[0] - x) ** 2 + (p[1] - y) ** 2;
        if (d < bd) bd = d;
      }
      return Math.sqrt(bd);
    })();
    if (near < track.width * 0.72) continue;
    out.push({ name: list[k % list.length], x, y, size: 46 + ((k * 5 + ti * 3) % 3) * 10 });
  }
  return out;
}

export function prerenderTrack(trackCanvasRef, ti) {
  const track = S.track;
  const trackCanvas = document.createElement('canvas');
  trackCanvas.width = W; trackCanvas.height = H;
  const c = trackCanvas.getContext('2d');
  const th = track.def.theme;
  // checker ground
  for (let y = 0; y < H; y += 90) for (let x = 0; x < W; x += 90) {
    c.fillStyle = ((x + y) / 90) % 2 === 0 ? th.g1 : th.g2;
    c.fillRect(x, y, 90, 90);
  }
  const path = new Path2D();
  path.moveTo(track.pts[0][0], track.pts[0][1]);
  for (let i = 1; i < track.N; i++) path.lineTo(track.pts[i][0], track.pts[i][1]);
  path.closePath();
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = th.edge; c.lineWidth = track.width + 18; c.stroke(path);
  c.strokeStyle = th.dirt; c.lineWidth = track.width; c.stroke(path);
  c.strokeStyle = th.rut; c.lineWidth = track.width * 0.42; c.setLineDash([26, 34]); c.stroke(path); c.setLineDash([]);

  // zones
  for (const z of track.def.zones) {
    const i0 = Math.floor(z.a * track.N), i1 = Math.floor(z.b * track.N);
    if (z.type === 'mud') {
      const zp = new Path2D();
      zp.moveTo(track.pts[i0][0], track.pts[i0][1]);
      for (let i = i0; i <= i1; i++) { const p = track.pts[i % track.N]; zp.lineTo(p[0], p[1]); }
      c.strokeStyle = '#3f2f1d'; c.lineWidth = track.width * 0.94; c.stroke(zp);
      c.strokeStyle = '#4e3a24'; c.lineWidth = track.width * 0.6; c.setLineDash([10, 14]); c.stroke(zp); c.setLineDash([]);
    } else if (z.type === 'ramp') {
      const mid = Math.floor((i0 + i1) / 2) % track.N;
      const p = track.pts[mid], n = track.normals[mid];
      c.save(); c.translate(p[0], p[1]); c.rotate(Math.atan2(n[1], n[0]));
      const hw = track.width * 0.46;
      c.fillStyle = '#c9c2b4'; c.fillRect(-hw, -13, hw * 2, 26);
      c.fillStyle = '#d84a3a';
      for (let s = -hw; s < hw; s += 22) c.fillRect(s, -13, 11, 26);
      c.fillStyle = '#fff'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center'; c.fillText('▲▲', 0, -18);
      c.restore();
    }
  }
  // start/finish checker strip
  const p0 = track.pts[0], n0 = track.normals[0];
  c.save(); c.translate(p0[0], p0[1]); c.rotate(Math.atan2(n0[1], n0[0]));
  const hw = track.width / 2;
  for (let s = 0; s < 2; s++) for (let q = -hw; q < hw; q += 16) {
    c.fillStyle = ((q / 16 | 0) + s) % 2 === 0 ? '#ffffff' : '#17181c';
    c.fillRect(q, -12 + s * 12, 16, 12);
  }
  c.restore();

  // dressing sprites baked into the prerender — zero per-frame cost
  for (const d of placeDressing(track, ti)) {
    drawSpr(c, d.name, d.x, d.y, d.size, 0, 0);
  }
  return trackCanvas;
}
