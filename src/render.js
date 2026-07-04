/* Canvas rendering: view scaler, procedural bikes (per handoff: overhead bike
   sprites not yet approved), atlas pickups + FX, popups. */
import { S } from './state.js';
import { W, H } from './track.js';
import { drawSpr, frameCount } from './sprites.js';
import { drawFx } from './fx.js';

export const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
export let trackCanvas = null;
export function setTrackCanvas(c) { trackCanvas = c; }

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

function drawBike(c, b) {
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

export function render() {
  const { race, track, bikes } = S;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#101114';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!track || (!race.active && S.currentScreen !== 'race')) return;
  ctx.setTransform(view.s, 0, 0, view.s, view.ox, view.oy);
  if (trackCanvas) ctx.drawImage(trackCanvas, 0, 0);

  // pickups — atlas sprites (coin spin, nitro can bob), procedural fallback
  const haveArt = frameCount('pickup_coin_f01') > 0;
  for (const p of track.pickups) {
    if (!p.active) continue;
    const bob = Math.sin(race.t * 4 + p.x) * 2;
    if (haveArt) {
      if (p.type === 'cash') {
        const f = (Math.floor(race.t * 8 + p.x) % 4) + 1;
        drawSpr(ctx, 'pickup_coin_f0' + f, p.x, p.y + bob, 26, 0, 0);
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

  // bikes sorted by y then z for layering
  const drawOrder = bikes.slice().sort((a, b) => (a.y + a.z) - (b.y + b.z));
  for (const b of drawOrder) drawBike(ctx, b);

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
