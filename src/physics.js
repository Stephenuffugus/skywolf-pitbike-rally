/* Bike physics + AI, ported unchanged from the prototype; FX hooks added. */
import { S, popup } from './state.js';
import { nearestIdx } from './track.js';
import { spawnFx } from './fx.js';

export function makeBike(opts) {
  return Object.assign({
    x: 0, y: 0, heading: 0, speed: 0, z: 0, vz: 0,
    steer: 0, throttle: 0, brake: 0,
    lap: 0, idx: 0, finished: false, finishTime: 0,
    nitro: 0, nitroT: 0, cash: 0, style: 0, air: 0,
    lapStart: 0, bestLap: Infinity,
    isAI: false, skill: 1, look: 26, name: 'You', color: '#e23b2e', plate: 7,
    lastRampF: -1, dustT: 0,
  }, opts);
}

export function updateBike(b, dt) {
  const { track, race } = S;
  if (b.finished) { b.throttle = 0.4; } // cruise after finish
  const st = b.stats;
  const zone = track.zoneAt(track.frac(b.idx));
  const near = nearestIdx(b.x, b.y, b.idx);
  const off = near.dist > track.width / 2;

  // target speed
  let top = st.top, accel = st.accel;
  if (b.nitroT > 0) { top *= 1.55; accel *= 1.7; b.nitroT -= dt; }
  let envMul = 1;
  if (b.z <= 0) {
    if (off)                envMul = 0.50 + st.grip * 1.1;
    else if (zone === 'mud') envMul = 0.60 + st.grip * 1.2;
  }
  const target = b.throttle * top * envMul;

  if (b.speed < target) b.speed = Math.min(target, b.speed + accel * (b.z > 0 ? 0.25 : 1) * dt);
  else b.speed = Math.max(target, b.speed - (off ? 330 : 240) * dt);
  if (b.brake > 0 && b.z <= 0) b.speed = Math.max(0, b.speed - 520 * b.brake * dt);
  if (b.throttle === 0 && b.brake === 0) b.speed = Math.max(0, b.speed - 140 * dt);

  // steering (reduced in air, scaled with speed)
  const spdF = Math.min(1, b.speed / 140 + 0.15) * (0.6 + 0.4 * Math.min(1, 320 / Math.max(80, b.speed)));
  const airF = b.z > 0 ? 0.25 : 1;
  b.heading += b.steer * st.steer * spdF * airF * dt;

  // ramps
  if (b.z <= 0 && zone === 'ramp' && b.speed > 140) {
    const f = track.frac(b.idx);
    if (Math.abs(f - b.lastRampF) > 0.03) {
      b.lastRampF = f;
      b.vz = Math.min(430, b.speed * 0.95);
      b.z = 0.01;
      b.air = 0;
    }
  }
  if (b.z > 0) {
    b.vz -= 1150 * dt; b.z += b.vz * dt; b.air += dt;
    if (b.z <= 0) {
      b.z = 0;
      const hard = b.vz < -330 && st.land < 0.6;
      if (hard) b.speed *= (0.55 + st.land * 0.35);
      spawnFx('fx_land_poof_strip', b.x, b.y + 6, { size: 34, life: 0.4 });
      if (!b.isAI) {
        const pts = Math.round(b.air * 22 + (hard ? 0 : 12));
        b.style += pts;
        popup(b.x, b.y - 30, (hard ? 'ROUGH ' : 'CLEAN +') + pts, hard ? '#ff8866' : '#ffd23f');
      }
      b.vz = 0;
    }
  }

  // rolling dust / mud kick behind the rear wheel
  b.dustT -= dt;
  if (b.z <= 0 && b.speed > 90 && b.dustT <= 0) {
    const back = 16;
    const dx = b.x - Math.cos(b.heading) * back, dy = b.y - Math.sin(b.heading) * back;
    if (zone === 'mud') spawnFx('fx_mud_splat_strip', dx, dy, { size: 24, life: 0.5 });
    else spawnFx('fx_dust_puff_strip', dx, dy, { size: 20 + b.speed * 0.02, life: 0.5 });
    b.dustT = b.isAI ? 0.22 : 0.12;
  }

  // integrate
  b.x += Math.cos(b.heading) * b.speed * dt;
  b.y += Math.sin(b.heading) * b.speed * dt;
  b.x = Math.max(10, Math.min(1590, b.x));
  b.y = Math.max(10, Math.min(890, b.y));

  // progress & laps
  const prevIdx = b.idx;
  b.idx = near.idx;
  const N = track.N;
  if (prevIdx > N - 70 && b.idx < 70 && !b.finished) {
    b.lap++;
    if (!b.isAI) {
      const lapT = race.t - b.lapStart;
      if (b.lap >= 2 && lapT < b.bestLap) b.bestLap = lapT;
      b.lapStart = race.t;
    }
    if (b.lap > race.laps) {
      b.finished = true; b.finishTime = race.t;
      race.finishOrder.push(b);
      if (b === S.bikes[0]) { race.over = true; race.pauseAfter = 1.6; }
    }
  } else if (prevIdx < 70 && b.idx > N - 70) {
    b.lap = Math.max(0, b.lap - 1); // crossed backwards
  }

  // pickups (player + AI can take nitro; only player takes cash)
  if (b.z <= 0) {
    for (const p of track.pickups) {
      if (!p.active) { continue; }
      const d = (p.x - b.x) ** 2 + (p.y - b.y) ** 2;
      if (d < 26 * 26) {
        if (p.type === 'cash') {
          if (!b.isAI) {
            const EC = S.DATA.economy;
            const amt = EC.pickupCash[0] + Math.floor(Math.random() * (EC.pickupCash[1] - EC.pickupCash[0]));
            b.cash += amt; popup(p.x, p.y, '+' + amt + '⚙', '#8ef07f');
            spawnFx('fx_collect_burst_strip', p.x, p.y, { size: 40, life: 0.4 });
            p.active = false; p.timer = 9;
          }
        } else {
          b.nitro = Math.min(4, b.nitro + 1);
          if (!b.isAI) {
            popup(p.x, p.y, '+NITRO', '#5fc9ff');
            spawnFx('fx_collect_burst_strip', p.x, p.y, { size: 40, life: 0.4 });
          }
          p.active = false; p.timer = 9;
        }
      }
    }
  }
}

export function updateAI(b, dt) {
  const { track } = S;
  const N = track.N;
  const look = Math.round(9 + b.speed * 0.035);
  const ti = (b.idx + look) % N;
  const tp = track.pts[ti];
  let want = Math.atan2(tp[1] - b.y, tp[0] - b.x);
  let dh = want - b.heading;
  while (dh > Math.PI) dh -= 2 * Math.PI;
  while (dh < -Math.PI) dh += 2 * Math.PI;
  b.steer = Math.max(-1, Math.min(1, dh * 2.1));

  // corner-aware throttle: measure curvature ahead
  const ahead = (b.idx + Math.round(24 + b.speed * 0.08)) % N;
  const a1 = track.pts[b.idx], a2 = track.pts[(b.idx + 16) % N], a3 = track.pts[ahead];
  const h1 = Math.atan2(a2[1] - a1[1], a2[0] - a1[0]);
  const h2 = Math.atan2(a3[1] - a2[1], a3[0] - a2[0]);
  let turn = Math.abs(h2 - h1); if (turn > Math.PI) turn = 2 * Math.PI - turn;
  const cornerMul = Math.max(0.55, 1 - turn * 0.6);
  // mild rubber-band vs player
  const player = S.bikes[0];
  const gap = ((player.lap * N + player.idx) - (b.lap * N + b.idx)) / N;
  const rb = Math.max(0.96, Math.min(1.04, 1 + gap * 0.04));
  b.throttle = Math.min(1, b.skill * cornerMul * rb + 0.06);
  b.brake = (turn > 1.3 && b.speed > 270) ? 0.6 : 0;

  if (b.nitro > 0 && b.nitroT <= 0 && turn < 0.18 && Math.random() < 0.006) { b.nitro--; b.nitroT = 1.5; }
}

export function bikeCollisions() {
  const bikes = S.bikes;
  for (let i = 0; i < bikes.length; i++) for (let j = i + 1; j < bikes.length; j++) {
    const a = bikes[i], c = bikes[j];
    if (a.z > 0 || c.z > 0) continue;
    const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
    if (d > 0 && d < 26) {
      const push = (26 - d) / 2, ux = dx / d, uy = dy / d;
      a.x -= ux * push; a.y -= uy * push; c.x += ux * push; c.y += uy * push;
      a.speed *= 0.97; c.speed *= 0.97;
      const rel = Math.abs(a.speed - c.speed);
      if (rel > 120) spawnFx('fx_spark_hit_strip', (a.x + c.x) / 2, (a.y + c.y) / 2, { size: 26, life: 0.3 });
    }
  }
}

export function racePositions() {
  const N = S.track.N;
  return S.bikes.slice().sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1; if (b.finished) return 1;
    return (b.lap * N + b.idx) - (a.lap * N + a.idx);
  });
}
