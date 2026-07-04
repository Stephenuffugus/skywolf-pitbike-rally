/* Race HUD DOM updates. Ported unchanged. */
import { S, fmtTime } from './state.js';
import { racePositions } from './physics.js';

let lastHud = '';

export function hudInit() {
  document.getElementById('count').style.display = 'block';
  hudUpdate(true);
}

export function hudUpdate(force) {
  const p = S.bikes[0];
  const race = S.race;
  const order = racePositions();
  const pos = order.indexOf(p) + 1;
  const lapShown = Math.max(1, Math.min(race.laps, p.lap));
  const key = pos + '|' + lapShown + '|' + Math.floor(race.t * 10) + '|' + p.nitro + '|' + p.cash + '|' + p.style;
  if (!force && key === lastHud) return;
  lastHud = key;
  document.getElementById('hud-pos').textContent = pos + ['st', 'nd', 'rd', 'th'][pos - 1];
  document.getElementById('hud-lap').textContent = 'LAP ' + lapShown + '/' + race.laps;
  document.getElementById('hud-time').textContent = fmtTime(race.t);
  document.getElementById('hud-cash').textContent = '+' + p.cash + '⚙';
  document.getElementById('hud-style').textContent = p.style + ' STYLE';
  const pips = document.getElementById('nitro-pips');
  let s = '';
  for (let i = 0; i < Math.max(p.stats.charges, p.nitro); i++) s += '<i class="' + (i < p.nitro ? 'on' : '') + '"></i>';
  pips.innerHTML = s;
}
