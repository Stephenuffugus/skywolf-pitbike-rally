/* Sprite-strip particle FX (dust, splats, bursts) using atlas strips. */
import { drawSpr, frameCount, spr } from './sprites.js';

const parts = [];
const MAX = 90;

export function spawnFx(name, x, y, opts) {
  if (!spr(name) || parts.length >= MAX) return;
  const o = opts || {};
  parts.push({
    name, x, y,
    size: o.size || 26,
    life: o.life || 0.45,
    ttl: o.life || 0.45,
    rot: o.rot || 0,
    vx: o.vx || 0, vy: o.vy || 0,
    frames: frameCount(name),
  });
}

export function updateFx(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.ttl -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.ttl <= 0) parts.splice(i, 1);
  }
}

export function drawFx(ctx) {
  for (const p of parts) {
    const t = 1 - p.ttl / p.life;                    // 0..1
    const f = Math.min(p.frames - 1, Math.floor(t * p.frames));
    ctx.globalAlpha = t > 0.75 ? (1 - t) * 4 : 1;
    drawSpr(ctx, p.name, p.x, p.y, p.size, p.rot, f);
    ctx.globalAlpha = 1;
  }
}

export function clearFx() { parts.length = 0; }
