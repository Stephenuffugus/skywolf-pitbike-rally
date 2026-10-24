/* Touch joystick + buttons + keyboard, and (v1.9) the analog throttle. */
import { S, popup } from './state.js';
import { audioNitro } from './audio.js';

export const input = { steer: 0, gas: false, brake: false };

const joy = { active: false, id: null, cx: 0, cy: 0 };
const JOY_R = 56;

/* v1.9 (his idea, 24 Oct: "an analog stick on the right thumb and the more you pull down the more you accelerate"): a
   floating stick appears under the right thumb. Pull DOWN = gas, from nothing at the 8 px dead zone to full at 56 px on a
   gentle curve; push UP and hold 120 ms = brake on the same curve (touch never had a brake); a quick FLICK up = nitro, and
   the gas comes back to wherever the thumb settles, so nitro never needs the gas thumb to lift (his other note). His left
   NITRO button is the steering thumb's way. Classic (the GAS and NITRO buttons) stays in the settings. */
export const THR = { DEAD: 8, FULL: 56, EXP: 1.2, BRAKE_HOLD: 0.12, FLICK_V: 600, FLICK_WIN: 0.08, FLICK_MAX: 0.15, STILL: 0.04 };
export function thrCurve(d) { return d <= THR.DEAD ? 0 : Math.pow(Math.min(1, (d - THR.DEAD) / (THR.FULL - THR.DEAD)), THR.EXP); }
const thr = { active: false, id: null, cx: 0, cy: 0, y: 0, lastY: 0, lastT: 0, smp: [], upStart: -1, upFast: false, noBrake: false, upSince: -1, flicks: 0 };
export const thrState = thr;   // read by the gates
const now = () => performance.now() / 1000;

/* one upward run of the thumb has ended (a down move, or no move for STILL s): fast and short = a flick = nitro */
function thrRunEnd() {
  if (thr.upStart >= 0 && thr.upFast && thr.lastT - thr.upStart <= THR.FLICK_MAX) { thr.flicks++; thr.noBrake = true; fireNitro(); }
  thr.upStart = -1; thr.upFast = false;
}
function thrSample(y, t) {
  // a touch only reports when it moves, so a run that starts from rest began about a frame before its first sample
  if (y < thr.lastY - 0.5) { if (thr.upStart < 0) thr.upStart = Math.max(thr.lastT, t - 0.017); }
  else if (y > thr.lastY + 2) thrRunEnd();
  thr.smp.push({ t, y }); while (thr.smp.length > 2 && t - thr.smp[1].t > 0.25) thr.smp.shift();
  // how far up the thumb went in the last FLICK_WIN seconds: where it was then is its last report at or before then
  // (a still thumb sends nothing), so a flick is at least FLICK_V x FLICK_WIN = 48 px up inside 80 ms
  let y0 = thr.smp[0].y;
  for (let i = thr.smp.length - 1; i >= 0; i--) if (thr.smp[i].t <= t - THR.FLICK_WIN) { y0 = thr.smp[i].y; break; }
  if (thr.upStart >= 0 && (y0 - y) / THR.FLICK_WIN > THR.FLICK_V) thr.upFast = true;
  thr.lastY = y; thr.lastT = t;
}
/* the throttle and brake the thumb asks for this frame */
function thrRead() {
  if (!thr.active) return { throttle: 0, brake: 0 };
  const t = now();
  if (thr.upStart >= 0 && t - thr.lastT > THR.STILL) thrRunEnd();
  const dy = thr.y - thr.cy, up = -dy;
  if (up > THR.DEAD) { if (thr.upSince < 0) thr.upSince = t; } else { thr.upSince = -1; thr.noBrake = false; }
  const flicking = thr.upFast && thr.upStart >= 0 && t - thr.upStart <= THR.FLICK_MAX;   // never brake inside a flick
  const brake = (up > THR.DEAD && !thr.noBrake && !flicking && t - thr.upSince >= THR.BRAKE_HOLD) ? thrCurve(up) : 0;
  return { throttle: dy > 0 ? thrCurve(dy) : 0, brake };
}

export function bindInput() {
  const joyZone = document.getElementById('joy-zone');
  const joyBase = document.getElementById('joy-base');
  const joyStick = document.getElementById('joy-stick');

  function joyStart(x, y, id) {
    joy.active = true; joy.id = id; joy.cx = x; joy.cy = y;
    joyBase.style.display = 'block';
    joyBase.style.left = (x - 70) + 'px'; joyBase.style.top = (y - 70) + 'px';
    joyMove(x, y);
  }
  function joyMove(x, y) {
    let dx = x - joy.cx, dy = y - joy.cy;
    const d = Math.hypot(dx, dy);
    if (d > JOY_R) { dx = dx / d * JOY_R; dy = dy / d * JOY_R; }
    joyStick.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    input.steer = Math.max(-1, Math.min(1, dx / (JOY_R * 0.75)));
  }
  function joyEnd() {
    joy.active = false; joy.id = null; input.steer = 0;
    joyBase.style.display = 'none';
    joyStick.style.transform = 'translate(0,0)';
  }
  joyZone.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (!joy.active) joyStart(t.clientX, t.clientY, t.identifier);
  }, { passive: false });
  joyZone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === joy.id) joyMove(t.clientX, t.clientY);
  }, { passive: false });
  const joyDone = e => {
    for (const t of e.changedTouches) if (t.identifier === joy.id) joyEnd();
  };
  joyZone.addEventListener('touchend', joyDone);
  joyZone.addEventListener('touchcancel', joyDone);
  // mouse fallback for desktop testing
  joyZone.addEventListener('mousedown', e => {
    joyStart(e.clientX, e.clientY, 'm');
    const mm = ev => joyMove(ev.clientX, ev.clientY);
    const mu = () => { joyEnd(); removeEventListener('mousemove', mm); removeEventListener('mouseup', mu); };
    addEventListener('mousemove', mm); addEventListener('mouseup', mu);
  });

  // the analog throttle: a floating stick under the right thumb
  const thrZone = document.getElementById('thr-zone');
  const thrBase = document.getElementById('thr-base');
  const thrKnob = document.getElementById('thr-knob');
  function thrDraw() {
    const dy = Math.max(-THR.FULL, Math.min(THR.FULL, thr.y - thr.cy));
    thrKnob.style.transform = 'translateY(' + dy + 'px)';
  }
  function thrStart(x, y, id) {
    const t = now();
    Object.assign(thr, { active: true, id, cx: x, cy: y, y, lastY: y, lastT: t, smp: [{ t, y }], upStart: -1, upFast: false, noBrake: false, upSince: -1 });
    thrBase.style.display = 'block';
    thrBase.style.left = (x - 38) + 'px'; thrBase.style.top = (y - 84) + 'px';
    thrDraw();
  }
  function thrMove(y) { thr.y = y; thrSample(y, now()); thrDraw(); }
  function thrEnd() {
    if (thr.upStart >= 0) thrRunEnd();
    thr.active = false; thr.id = null; thrBase.style.display = 'none';
  }
  thrZone.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (!thr.active) thrStart(t.clientX, t.clientY, t.identifier);
  }, { passive: false });
  thrZone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === thr.id) thrMove(t.clientY);
  }, { passive: false });
  const thrDone = e => { for (const t of e.changedTouches) if (t.identifier === thr.id) thrEnd(); };
  thrZone.addEventListener('touchend', thrDone);
  thrZone.addEventListener('touchcancel', thrDone);
  thrZone.addEventListener('mousedown', e => {
    thrStart(e.clientX, e.clientY, 'm');
    const mm = ev => thrMove(ev.clientY);
    const mu = () => { thrEnd(); removeEventListener('mousemove', mm); removeEventListener('mouseup', mu); };
    addEventListener('mousemove', mm); addEventListener('mouseup', mu);
  });

  function bindBtn(id, on, off) {
    const el = document.getElementById(id);
    const down = e => { e.preventDefault(); el.classList.add('pressed'); on(); };
    const up = e => { if (e) e.preventDefault(); el.classList.remove('pressed'); if (off) off(); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up); el.addEventListener('touchcancel', up);
    el.addEventListener('mousedown', down); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', () => up());
  }
  bindBtn('btn-gas', () => input.gas = true, () => input.gas = false);
  // Classic: touch has no brake button (it covered the track); the analog stick brakes, the keyboard always could
  bindBtn('btn-nitro', fireNitro);
  bindBtn('btn-nitro-l', fireNitro);   // his left NITRO, for the steering thumb on a straight

  addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') input.steer = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') input.steer = 1;
    if (e.key === 'ArrowUp' || e.key === 'w') input.gas = true;
    if (e.key === 'ArrowDown' || e.key === 's') input.brake = true;
    if (e.key === ' ') fireNitro();
  });
  addEventListener('keyup', e => {
    if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) input.steer = 0;
    if (e.key === 'ArrowUp' || e.key === 'w') input.gas = false;
    if (e.key === 'ArrowDown' || e.key === 's') input.brake = false;
  });
}

/* the controls in use: 'analog' (the stick) or 'classic' (the GAS button); the body class shows the right set */
export function applyCtl() {
  const a = S.G.ctl !== 'classic';
  document.body.classList.toggle('ctl-analog', a);
  if (!a && thr.active) { thr.active = false; thr.id = null; const b = document.getElementById('thr-base'); if (b) b.style.display = 'none'; }
}

function fireNitro() {
  const p = S.bikes[0];
  const race = S.race;
  if (p && race.started && !race.over && p.nitro > 0 && p.nitroT <= 0) {
    p.nitro--; p.nitroT = 1.6; p.m_usedNitro = true;
    popup(p.x, p.y - 24, 'NITRO', '#5fc9ff'); audioNitro();
  }
}

export function applyPlayerInput() {
  const p = S.bikes[0];
  if (!p || !S.race.started || p.finished) return;
  p.steer = input.steer;
  if (S.G.ctl !== 'classic') {
    const a = thrRead();
    p.throttle = Math.max(a.throttle, input.gas ? 1 : 0);
    p.brake = Math.max(a.brake, input.brake ? 1 : 0);
  } else {
    p.throttle = input.gas ? 1 : 0;
    p.brake = input.brake ? 1 : 0;
  }
}
