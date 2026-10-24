/* Touch joystick + buttons + keyboard, and (v1.9) the analog throttle. */
import { S, popup } from './state.js';
import { audioNitro } from './audio.js';

export const input = { steer: 0, gas: false, brake: false };

const joy = { active: false, id: null, cx: 0, cy: 0 };
const JOY_R = 56;

/* v1.9 (his idea, 24 Oct: "an analog stick on the right thumb and the more you pull down the more you accelerate"): a
   floating stick appears under the right thumb. Pull DOWN = gas, from nothing at the 8 px dead zone to full at 56 px on a
   gentle curve; push UP and hold 120 ms = brake on the same curve (touch never had a brake); a FLICK = nitro: a fast move
   (48 px inside 80 ms) from the gas side to above the centre that comes back down 16 px within 300 ms, so nitro never needs
   the gas thumb to lift (his other note) and a fast move that stays up (a hard brake, a quick lift to coast) is never
   nitro. His left NITRO button is the steering thumb's way. Classic (the GAS and NITRO buttons) stays in the settings. */
export const THR = { DEAD: 8, FULL: 56, EXP: 1.2, BRAKE_HOLD: 0.12, FLICK_V: 600, FLICK_WIN: 0.08, FLICK_TOTAL: 0.3, FLICK_TOP: 8, FLICK_RET: 16, EDGE: 6 };
export function thrCurve(d) { return d <= THR.DEAD ? 0 : Math.pow(Math.min(1, (d - THR.DEAD) / (THR.FULL - THR.DEAD)), THR.EXP); }
const thr = { active: false, id: null, cx: 0, cy: 0, y: 0, lastY: 0, lastT: 0, smp: [], run: null, upSince: -1, flicks: 0 };
export const thrState = thr;   // read by the gates
const now = () => performance.now() / 1000;

/* one gesture of the thumb, watched sample by sample (a touch only reports when it moves; at 120 Hz Chrome sends one move
   per frame): an upward run begins on the gas side and has its top (the peak); it turns FAST when the thumb covers 48 px
   inside 80 ms; it is a flick when it reached above the centre and the thumb comes back down FLICK_RET px from the peak
   inside FLICK_TOTAL of turning fast. A slow drift before it only waits (it is timed from turning fast). Anything else
   (it stays up, it ends with the touch, it never left the gas side) is not a flick. */
function thrSample(y, t) {
  const R = thr.run, dy = y - thr.cy;
  if (y < thr.lastY - 0.5) {   // moving up
    if (!R && thr.lastY - thr.cy >= -THR.DEAD) thr.run = { peak: y, fast: false, tFast: 0 };
    else if (R && y < R.peak) R.peak = y;
  }
  thr.smp.push({ t, y }); while (thr.smp.length > 2 && t - thr.smp[1].t > 0.25) thr.smp.shift();
  // where the thumb was FLICK_WIN ago is its last report at or before then (a still thumb sends nothing)
  let y0 = thr.smp[0].y;
  for (let i = thr.smp.length - 1; i >= 0; i--) if (thr.smp[i].t <= t - THR.FLICK_WIN) { y0 = thr.smp[i].y; break; }
  const r = thr.run;
  if (r) {
    if (!r.fast && (y0 - y) / THR.FLICK_WIN > THR.FLICK_V) { r.fast = true; r.tFast = t; }
    if (r.fast && t - r.tFast > THR.FLICK_TOTAL) thr.run = null;   // fast but no return in time: a push (a brake, a lift)
    else if (y >= r.peak + THR.FLICK_RET) {   // came back down: a flick if it was fast and went above the centre
      if (r.fast && r.peak - thr.cy <= -THR.FLICK_TOP) { thr.flicks++; fireNitro(); }
      thr.run = null;
    }
  }
  thr.lastY = y; thr.lastT = t;
}
/* the throttle and brake the thumb asks for this frame */
function thrRead() {
  if (!thr.active) return { throttle: 0, brake: 0 };
  const t = now(), dy = thr.y - thr.cy, up = -dy;
  if (thr.run && thr.run.fast && t - thr.run.tFast > THR.FLICK_TOTAL) thr.run = null;
  if (up > THR.DEAD) { if (thr.upSince < 0) thr.upSince = t; } else thr.upSince = -1;
  // a quick flick is back under the centre inside the hold, so it never brakes; a held push brakes after BRAKE_HOLD
  const brake = (up > THR.DEAD && t - thr.upSince >= THR.BRAKE_HOLD) ? thrCurve(up) : 0;
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
  joyZone.addEventListener('contextmenu', e => e.preventDefault());
  joyZone.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
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
    /* the centre sits high enough that a full pull fits above the bottom edge: a thumb landing low starts with some gas */
    const cy = Math.min(y, innerHeight - THR.FULL - THR.EDGE);
    Object.assign(thr, { active: true, id, cx: x, cy, y, lastY: y, lastT: t, smp: [{ t, y }], run: null, upSince: -1 });
    thrBase.style.display = 'block';
    thrBase.style.left = (x - 38) + 'px'; thrBase.style.top = (cy - 84) + 'px';
    thrDraw();
  }
  function thrMove(y) { thr.y = y; thrSample(y, now()); thrDraw(); }
  function thrEnd() { thr.active = false; thr.id = null; thr.run = null; thrBase.style.display = 'none'; }
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
  thrZone.addEventListener('contextmenu', e => e.preventDefault());
  thrZone.addEventListener('mousedown', e => {
    if (e.button !== 0) return;   // the left button only: a right click's menu would swallow the mouseup
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
  if (!a && thr.active) { thr.active = false; thr.id = null; thr.run = null; const b = document.getElementById('thr-base'); if (b) b.style.display = 'none'; }
}

function fireNitro() {
  const p = S.bikes[0];
  const race = S.race;
  if (p && race.started && !race.over && !S.paused && p.nitro > 0 && p.nitroT <= 0) {
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
