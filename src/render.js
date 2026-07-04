/* Canvas rendering: view scaler, procedural bikes (per handoff: overhead bike
   sprites not yet approved), atlas pickups + FX, popups. */
import { S } from './state.js';
import { W, H } from './track.js';
import { drawSpr, frameCount } from './sprites.js';
import { drawFx } from './fx.js';
import { drawZone } from './track.js';

export const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
export let trackCanvas = null;
export let deckCanvas = null;
export function setTrackCanvas(c, deck) { trackCanvas = c; deckCanvas = deck || null; }

export let view = { s: 1, ox: 0, oy: 0 };

export function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  const s = Math.min(canvas.width / W, canvas.height / H);
  view = { s, ox: (canvas.width - W * s) / 2, oy: (canvas.height - H * s) / 2 };
}
window.addEventListener('resize', resize);

// roundRect polyfill for older webviews
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath();
  };
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b2 = n & 255;
  const m = v => Math.max(0, Math.min(255, Math.round(v * f)));
  return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b2) + ')';
}

/* Sprite bike: top-down ride strip per paint (wave 0704 — Stephen's approved
   top-down art). 3-frame bob cycle rolls with speed; steer adds a lean tilt;
   airborne bikes scale up and cast a wider shadow. */
function drawBikeSprite(c, b, name) {
  const race = S.race;
  c.save();
  c.translate(b.x, b.y);
  c.globalAlpha = 0.30;
  c.fillStyle = '#000';
  c.beginPath(); c.ellipse(2, 5 + b.z * 0.14, 13 + b.z * 0.06, 7.5 + b.z * 0.03, 0, 0, Math.PI * 2); c.fill();
  c.restore();

  const airWob = b.z > 0 ? Math.sin(race.t * 20) * 0.05 : 0;
  const scale = 1 + Math.min(1, b.z * 0.012) * 0.22;
  // constant-rate bob (like the flame/pickup anims): time x speed-varying rate
  // is non-monotonic, so braking strobed the frame order. plate staggers bikes
  // (b.idx is overwritten with the track-point index every physics tick).
  const f = b.speed > 40 ? Math.floor(race.t * 9 + (b.plate || 0)) % 3 : 0;
  c.save();
  c.translate(b.x, b.y - b.z * 0.5);
  c.rotate(b.heading + b.steer * 0.12 + airWob);
  if (b.nitroT > 0) {
    const nf = Math.floor(race.t * 18) % 3;
    drawSpr(c, 'fx_nitro_flame_strip', -27 - Math.random() * 3, 0, 21 + Math.random() * 5, 0, nf);
  }
  // pose frames (wave3): f0 air, f1 land, f2 lean left, f3 lean right
  const poses = name.replace('_strip', '_poses');
  let pi = -1;
  if (frameCount(poses) === 4) {
    if (b.z > 5) pi = 0;
    else if (b.landT > 0) pi = 1;
    else if (Math.abs(b.steer) > 0.5 && b.speed > 110) pi = b.steer > 0 ? 3 : 2;
  }
  if (pi >= 0) drawSpr(c, poses, 0, 0, 42 * scale, 0, pi);
  else drawSpr(c, name, 0, 0, 42 * scale, 0, f);
  c.restore();

  // floating plate number
  c.save(); c.translate(b.x, b.y - b.z * 0.5 - 19);
  c.fillStyle = '#f2c928';
  c.beginPath(); c.roundRect(-10, -8, 20, 13, 3); c.fill();
  c.fillStyle = '#17181c'; c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(String(b.plate), 0, -1.5);
  c.restore();
}

function drawBike(c, b) {
  const sprName = 'trackbike_' + (b.paint || 'green') + '_strip';
  if (frameCount(sprName) > 0) { drawBikeSprite(c, b, sprName); return; }

  const race = S.race;
  // ground shadow
  c.save();
  c.translate(b.x, b.y);
  c.globalAlpha = 0.30;
  c.fillStyle = '#000';
  c.beginPath(); c.ellipse(2, 5 + b.z * 0.14, 13 + b.z * 0.06, 7.5 + b.z * 0.03, 0, 0, Math.PI * 2); c.fill();
  c.restore();

  const col = b.color, dark = shade(col, 0.62), lite = shade(col, 1.3);
  c.save();
  c.translate(b.x, b.y - b.z * 0.5);
  const airWob = b.z > 0 ? Math.sin(race.t * 20) * 0.05 : 0;
  c.rotate(b.heading + b.steer * 0.12 + airWob);

  // rear wheel + swingarm
  c.fillStyle = '#141519';
  c.beginPath(); c.roundRect(-17, -3.6, 10, 7.2, 3); c.fill();
  c.fillStyle = '#3a3d45'; c.fillRect(-13.6, -1, 3.2, 2);
  c.strokeStyle = '#2c2f36'; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(-12, 0); c.lineTo(-4, 0); c.stroke();

  // exhaust
  c.strokeStyle = '#9aa0ab'; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(-2, 3.4); c.lineTo(-14, 4.6); c.stroke();

  // nitro flame
  if (b.nitroT > 0) {
    const L = 8 + Math.random() * 6;
    c.fillStyle = '#ffb347';
    c.beginPath(); c.moveTo(-17, 0); c.lineTo(-21 - L, -2.6); c.lineTo(-21 - L, 2.6); c.closePath(); c.fill();
    c.fillStyle = '#5fc9ff';
    c.beginPath(); c.moveTo(-17, 0); c.lineTo(-17 - L, -1.7); c.lineTo(-17 - L, 1.7); c.closePath(); c.fill();
  }

  // front wheel steers with input
  c.save();
  c.translate(12.5, 0); c.rotate(b.steer * 0.45);
  c.fillStyle = '#141519';
  c.beginPath(); c.roundRect(-4.5, -3.4, 9, 6.8, 3); c.fill();
  c.fillStyle = '#3a3d45'; c.fillRect(-1.4, -1, 2.8, 2);
  c.restore();

  // forks
  c.strokeStyle = '#c7ccd6'; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(8, -2.6); c.lineTo(12.5, -2.6); c.moveTo(8, 2.6); c.lineTo(12.5, 2.6); c.stroke();

  // rear fender + tank shrouds (paint color)
  c.fillStyle = col; c.strokeStyle = '#141519'; c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-6, -3); c.lineTo(-15, -2.2); c.lineTo(-15, 2.2); c.lineTo(-6, 3); c.closePath();
  c.fill(); c.stroke();
  c.beginPath();
  c.moveTo(9, 0); c.lineTo(5, -4.6); c.lineTo(-4, -4); c.lineTo(-6, 0); c.lineTo(-4, 4); c.lineTo(5, 4.6);
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = lite;
  c.beginPath(); c.moveTo(8, -0.6); c.lineTo(4.6, -3.4); c.lineTo(-2, -3); c.lineTo(-2, -0.6); c.closePath(); c.fill();

  // front fender
  c.fillStyle = col;
  c.beginPath(); c.roundRect(9.5, -2.6, 7.6, 5.2, 2.4); c.fill(); c.stroke();

  // seat
  c.fillStyle = '#1c1e24';
  c.beginPath(); c.roundRect(-9, -2.6, 8, 5.2, 2); c.fill();

  // rider: torso, arms, gloves, helmet
  c.fillStyle = dark; c.strokeStyle = '#141519'; c.lineWidth = 1.3;
  c.beginPath(); c.ellipse(-3.4, 0, 5.6, 4.6, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.strokeStyle = dark; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(-1.2, -3.6); c.lineTo(7.6, -5.4); c.moveTo(-1.2, 3.6); c.lineTo(7.6, 5.4); c.stroke();
  c.fillStyle = '#17181c';
  c.beginPath(); c.arc(7.6, -5.4, 1.4, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(7.6, 5.4, 1.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = col; c.strokeStyle = '#141519'; c.lineWidth = 1.4;
  c.beginPath(); c.arc(-1.6, 0, 3.9, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#141519';
  c.beginPath(); c.roundRect(0.8, -2.2, 2.2, 4.4, 1.2); c.fill();
  c.fillStyle = lite; c.fillRect(-4.6, -0.7, 3.4, 1.4);

  // handlebar turns with steering
  c.strokeStyle = '#dcdfe6'; c.lineWidth = 2;
  c.save(); c.translate(8.6, 0); c.rotate(b.steer * 0.45);
  c.beginPath(); c.moveTo(0, -6.4); c.lineTo(0, 6.4); c.stroke();
  c.fillStyle = '#17181c'; c.fillRect(-1, -7.4, 2, 2.2); c.fillRect(-1, 5.2, 2, 2.2);
  c.restore();

  c.restore();

  // floating plate number
  c.save(); c.translate(b.x, b.y - b.z * 0.5 - 19);
  c.fillStyle = '#f2c928';
  c.beginPath(); c.roundRect(-10, -8, 20, 13, 3); c.fill();
  c.fillStyle = '#17181c'; c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(String(b.plate), 0, -1.5);
  c.restore();
}

function drawGhost(ctx) {
  const { race } = S;
  const g = race.ghost;
  if (!g || !race.started || race.over) return;
  const lapMs = g.ms;
  const t = ((race.t * 1000) % lapMs) / 1000;
  const fi = t * g.hz;
  const n = g.pts.length / 3;
  const i0 = Math.floor(fi) % n, i1 = (i0 + 1) % n;
  const u = fi - Math.floor(fi);
  const x = g.pts[i0 * 3] + (g.pts[i1 * 3] - g.pts[i0 * 3]) * u;
  const y = g.pts[i0 * 3 + 1] + (g.pts[i1 * 3 + 1] - g.pts[i0 * 3 + 1]) * u;
  const h = g.pts[i0 * 3 + 2];
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.translate(x, y);
  ctx.rotate(h);
  ctx.fillStyle = '#cfd6ff';
  ctx.strokeStyle = '#8b93c9'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-14, -5, 28, 10, 5); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(4, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function render() {
  const { race, track, bikes } = S;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#101114';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!track || (!race.active && S.currentScreen !== 'race')) return;
  ctx.setTransform(view.s, 0, 0, view.s, view.ox, view.oy);
  if (trackCanvas) ctx.drawImage(trackCanvas, 0, 0);

  // shifting zones (Sandstorm Sweep) draw live over the prerender
  if (track.hasShiftZones) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let zi = 0; zi < track.def.zones.length; zi++) {
      if (track.def.zones[zi].shift) drawZone(ctx, track, zi);
    }
  }

  drawGhost(ctx);

  // pickups — sprocket coin spin (wave 0704) > legacy coin frames > procedural
  const haveSprocket = frameCount('pickup_sprocket_strip') > 0;
  const haveArt = haveSprocket || frameCount('pickup_coin_f01') > 0;
  for (const p of track.pickups) {
    if (!p.active) continue;
    const bob = Math.sin(race.t * 4 + p.x) * 2;
    if (haveArt) {
      if (p.type === 'cash') {
        const f = Math.floor(race.t * 8 + p.x) % 4;
        if (haveSprocket) drawSpr(ctx, 'pickup_sprocket_strip', p.x, p.y + bob, 26, 0, f);
        else drawSpr(ctx, 'pickup_coin_f0' + (f + 1), p.x, p.y + bob, 26, 0, 0);
      } else {
        drawSpr(ctx, 'pickup_nitro_can', p.x, p.y + bob, 26, 0, 0);
      }
    } else {
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.type === 'cash') {
        ctx.fillStyle = '#2c7a24'; ctx.beginPath(); ctx.arc(0, bob, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8ef07f'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⚙', 0, bob + 1);
      } else {
        ctx.fillStyle = '#1b5f80'; ctx.fillRect(-7, bob - 11, 14, 22);
        ctx.fillStyle = '#5fc9ff'; ctx.fillRect(-4, bob - 14, 8, 5);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('N', 0, bob + 1);
      }
      ctx.restore();
    }
  }

  // golden sprocket — oversized pulsing coin
  if (race.golden && race.golden.active) {
    const g = race.golden;
    const pulse = 1 + Math.sin(race.t * 6) * 0.12;
    ctx.save();
    ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 18;
    const f = Math.floor(race.t * 8) % 4;
    if (frameCount('pickup_sprocket_gold_strip')) drawSpr(ctx, 'pickup_sprocket_gold_strip', g.x, g.y, 40 * pulse, 0, f);
    else if (frameCount('pickup_coin_f01')) drawSpr(ctx, 'pickup_coin_f0' + (f + 1), g.x, g.y, 40 * pulse, 0, 0);
    else { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(g.x, g.y, 16 * pulse, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  // bikes sorted by y then z for layering; bridge riders draw above the deck
  const drawOrder = bikes.slice().sort((a, b) => (a.y + a.z) - (b.y + b.z));
  if (deckCanvas && track.onBridge) {
    for (const b of drawOrder) { if (!track.onBridge(b.idx)) drawBike(ctx, b); }
    ctx.drawImage(deckCanvas, 0, 0);
    for (const b of drawOrder) { if (track.onBridge(b.idx)) drawBike(ctx, b); }
  } else {
    for (const b of drawOrder) drawBike(ctx, b);
  }

  // particles above bikes
  drawFx(ctx);

  // popups
  for (const p of race.popups) {
    ctx.globalAlpha = Math.min(1, p.ttl * 2);
    ctx.fillStyle = p.color; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
}
