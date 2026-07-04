/* Track building: Catmull-Rom resample, variants (mirror/reverse), zones
   (mud/ramp/sand/bridge), pickups, prerender + dressing + bridge deck. */
import { S } from './state.js';
import { spr, drawSpr } from './sprites.js';
import { mulberry32 } from './rng.js';

export const W = 1600, H = 900;

export const VARIANTS = [
  { id: 0, tag: '',   label: 'Classic' },
  { id: 1, tag: 'M',  label: 'Mirror' },
  { id: 2, tag: 'R',  label: 'Reverse' },
  { id: 3, tag: 'MR', label: 'Mirror + Reverse' },
];

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

/* Apply a variant to a track def: mirror flips X, reverse runs the loop the
   other way (zone/pickup lap-fractions re-mapped so they stay on the same
   physical piece of track). Returns a transformed shallow copy. */
export function applyVariant(def, variant) {
  if (!variant) return def;
  const mirror = !!(variant & 1), reverse = !!(variant & 2);
  let pts = def.pts.map(p => mirror ? [W - p[0], p[1]] : [p[0], p[1]]);
  let zones = def.zones.map(z => Object.assign({}, z));
  let pickups = def.pickups.map(p => Object.assign({}, p));
  if (reverse) {
    pts = pts.slice().reverse();
    // point i becomes point (n-1-i): fraction f maps to (1-f)
    zones = zones.map(z => Object.assign({}, z, { a: 1 - z.b, b: 1 - z.a }));
    pickups = pickups.map(p => Object.assign({}, p, { t: (1 - p.t) % 1 }));
  }
  return Object.assign({}, def, { pts, zones, pickups });
}

export function buildTrack(def, raceSeed) {
  const pts = catmull(def.pts, 12);
  const N = pts.length;
  const normals = [];
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 1 + N) % N], b = pts[(i + 1) % N];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    normals.push([-dy / L, dx / L]);
  }
  const frac = i => i / N;

  // per-zone lap offsets (Sandstorm Sweep: sand drifts migrate every lap)
  const offsets = def.zones.map(() => 0);
  const zoneRange = (zi) => {
    const z = def.zones[zi], off = offsets[zi];
    return [(z.a + off) % 1, (z.b + off) % 1];
  };
  const zoneAt = f => {
    for (let zi = 0; zi < def.zones.length; zi++) {
      const [a, b] = zoneRange(zi);
      if (a <= b ? (f >= a && f <= b) : (f >= a || f <= b)) return def.zones[zi].type;
    }
    return null;
  };
  const hasShiftZones = def.zones.some(z => z.shift);
  const shiftRng = mulberry32((raceSeed || 1) ^ 0xA55);
  const shiftZones = (lap) => {
    for (let zi = 0; zi < def.zones.length; zi++) {
      if (def.zones[zi].shift) offsets[zi] = shiftRng() * 0.9;
    }
  };

  const bridge = def.zones.find(z => z.type === 'bridge');
  const onBridge = bridge
    ? (idx) => { const f = idx / N; return f >= bridge.a && f <= bridge.b; }
    : null;

  const pickups = def.pickups.map(pk => {
    const i = Math.floor(pk.t * N) % N;
    const nrm = normals[i], off = pk.side * def.width * 0.32;
    return { x: pts[i][0] + nrm[0] * off, y: pts[i][1] + nrm[1] * off, type: pk.type, active: true, timer: 0 };
  });

  return {
    def, pts, N, normals, width: def.width, frac, zoneAt, zoneRange, pickups,
    hasShiftZones, shiftZones, onBridge,
  };
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
  ['prop_tree_pine', 'prop_fence_wood', 'prop_log_pile', 'prop_bench', 'prop_bunting_posts'],
  ['prop_cactus', 'prop_rock_large', 'prop_barrel_hazard', 'prop_sign_slowdown', 'prop_water_tower'],
  ['prop_tree_pine', 'prop_windmill', 'prop_corral_fence', 'prop_camper', 'prop_log_pile'],
  ['prop_rock_large', 'prop_cactus', 'prop_sign_danger', 'prop_watchtower_wood', 'prop_barrel_hazard'],
  ['prop_crowd_stand', 'prop_light_tower', 'prop_speaker_stack', 'prop_stage_lights', 'prop_bunting_posts'],
  ['prop_log_pile', 'prop_porta_potty', 'prop_sign_slippery', 'prop_tree_pine', 'prop_medic_tent'],
  ['prop_rock_large', 'prop_silo', 'prop_oil_pump', 'prop_sign_hotlaps', 'prop_tree_pine'],
  ['prop_crowd_stand_b', 'prop_light_tower_b', 'prop_ambulances', 'prop_shipping_container', 'prop_generator_red'],
  ['prop_crowd_stand', 'prop_girder_bridge', 'prop_light_tower', 'prop_scaffold', 'prop_stage_lights'],   // 9 Crossover
  ['prop_windmill', 'prop_cactus', 'prop_hot_air_balloon', 'prop_corral_fence', 'prop_tube_man'],         // 10 Rallycross
  ['prop_cactus', 'prop_rock_large', 'prop_satellite_dish', 'prop_water_tower', 'prop_sign_warning'],     // 11 Sandstorm
  ['prop_fire_barrel', 'prop_torch', 'prop_watchtower_b', 'prop_ambulances', 'prop_sign_danger'],         // 12 Wolf's Den
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

function strokeSegment(c, track, a, b, width, style, dash) {
  const N = track.N;
  const i0 = Math.floor(a * N), i1 = Math.floor(b * N);
  const zp = new Path2D();
  zp.moveTo(track.pts[i0 % N][0], track.pts[i0 % N][1]);
  const steps = (i1 - i0 + N) % N || 1;
  for (let s = 1; s <= steps; s++) {
    const p = track.pts[(i0 + s) % N];
    zp.lineTo(p[0], p[1]);
  }
  c.strokeStyle = style; c.lineWidth = width;
  if (dash) c.setLineDash(dash);
  c.stroke(zp);
  c.setLineDash([]);
}

/* Draw a (possibly shifted) sand/mud style zone — used both at prerender time
   for static zones and at runtime for shifting ones. */
export function drawZone(c, track, zi) {
  const z = track.def.zones[zi];
  const [a, b] = track.zoneRange(zi);
  if (z.type === 'mud') {
    strokeSegment(c, track, a, b, track.width * 0.94, '#3f2f1d');
    strokeSegment(c, track, a, b, track.width * 0.6, '#4e3a24', [10, 14]);
  } else if (z.type === 'sand') {
    strokeSegment(c, track, a, b, track.width * 0.94, '#d9bd80');
    strokeSegment(c, track, a, b, track.width * 0.6, '#c8ab6c', [8, 12]);
  }
}

export function prerenderTrack(ti) {
  const track = S.track;
  const trackCanvas = document.createElement('canvas');
  trackCanvas.width = W; trackCanvas.height = H;
  const c = trackCanvas.getContext('2d');
  const th = track.def.theme;
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

  // static zones (shifting ones draw at runtime)
  for (let zi = 0; zi < track.def.zones.length; zi++) {
    const z = track.def.zones[zi];
    if (z.shift || z.type === 'bridge') continue;
    if (z.type === 'ramp') {
      const i0 = Math.floor(z.a * track.N), i1 = Math.floor(z.b * track.N);
      const mid = Math.floor((i0 + i1) / 2) % track.N;
      const p = track.pts[mid], n = track.normals[mid];
      c.save(); c.translate(p[0], p[1]); c.rotate(Math.atan2(n[1], n[0]));
      const hw = track.width * 0.46;
      c.fillStyle = '#c9c2b4'; c.fillRect(-hw, -13, hw * 2, 26);
      c.fillStyle = '#d84a3a';
      for (let s = -hw; s < hw; s += 22) c.fillRect(s, -13, 11, 26);
      c.fillStyle = '#fff'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center'; c.fillText('▲▲', 0, -18);
      c.restore();
    } else {
      drawZone(c, track, zi);
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

  // bridge deck on its own layer: drawn at runtime BETWEEN under- and
  // over-bikes so the z-order reads correctly
  let deckCanvas = null;
  const bridge = track.def.zones.find(z => z.type === 'bridge');
  if (bridge) {
    deckCanvas = document.createElement('canvas');
    deckCanvas.width = W; deckCanvas.height = H;
    const d = deckCanvas.getContext('2d');
    d.lineJoin = 'round'; d.lineCap = 'round';
    strokeSegment(d, track, bridge.a, bridge.b, track.width + 22, '#2b241c');   // shadow edge
    strokeSegment(d, track, bridge.a, bridge.b, track.width + 10, '#6f5636');   // deck rails
    strokeSegment(d, track, bridge.a, bridge.b, track.width - 6, '#94714a');    // deck
    strokeSegment(d, track, bridge.a, bridge.b, track.width * 0.5, '#83643f', [18, 16]); // planks
  }
  return { base: trackCanvas, deck: deckCanvas };
}
