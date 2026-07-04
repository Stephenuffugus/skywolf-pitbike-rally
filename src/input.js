/* Touch joystick + buttons + keyboard. Ported unchanged. */
import { S, popup } from './state.js';
import { audioNitro } from './audio.js';

export const input = { steer: 0, gas: false, brake: false };

const joy = { active: false, id: null, cx: 0, cy: 0 };
const JOY_R = 56;

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

  function bindBtn(id, on, off) {
    const el = document.getElementById(id);
    const down = e => { e.preventDefault(); el.classList.add('pressed'); on(); };
    const up = e => { if (e) e.preventDefault(); el.classList.remove('pressed'); if (off) off(); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up); el.addEventListener('touchcancel', up);
    el.addEventListener('mousedown', down); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', () => up());
  }
  bindBtn('btn-gas', () => input.gas = true, () => input.gas = false);
  // touch has no brake button (it covered the track); brake stays on keyboard
  bindBtn('btn-nitro', fireNitro);

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

function fireNitro() {
  const p = S.bikes[0];
  const race = S.race;
  if (p && race.started && !race.over && p.nitro > 0 && p.nitroT <= 0) {
    p.nitro--; p.nitroT = 1.6; popup(p.x, p.y - 24, 'NITRO!', '#5fc9ff'); audioNitro();
  }
}

export function applyPlayerInput() {
  const p = S.bikes[0];
  if (!p || !S.race.started || p.finished) return;
  p.steer = input.steer;
  p.throttle = input.gas ? 1 : 0;
  p.brake = input.brake ? 1 : 0;
}
