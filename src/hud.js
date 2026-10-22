/* Race HUD DOM updates. Ported unchanged. */
import { S, fmtTime, ttTargets, ttTierFor, TT_ORDER } from './state.js';
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
  const key = pos + '|' + lapShown + '|' + Math.floor(race.t * 10) + '|' + p.nitro + '|' + p.cash + '|' + p.style + '|' + p.bestLap;
  if (!force && key === lastHud) return;
  lastHud = key;
  if (race.tt) {
    // time trial: the position chip says TT, the clock is the CURRENT lap,
    // the cash chip is your best lap this run, the style chip the next target
    const def = S.track.def, tg = ttTargets(def);
    const tier = ttTierFor(def, p.bestLap);
    const next = tier ? TT_ORDER[TT_ORDER.indexOf(tier) + 1] : 'bronze';
    document.getElementById('hud-pos').textContent = 'TT';
    document.getElementById('hud-lap').textContent = 'LAP ' + lapShown + '/' + race.laps;
    document.getElementById('hud-time').textContent = fmtTime(race.started ? Math.max(0, race.t - p.lapStart) : 0);
    document.getElementById('hud-cash').textContent = p.bestLap < Infinity ? 'BEST ' + fmtTime(p.bestLap) : 'BEST --';
    document.getElementById('hud-style').textContent = !tg ? '' : next ? next.toUpperCase() + ' ' + fmtTime(tg[next]) : 'PLATINUM ✓';
    const pips0 = document.getElementById('nitro-pips');
    let s0 = '';
    for (let i = 0; i < Math.max(p.stats.charges, p.nitro); i++) s0 += '<i class="' + (i < p.nitro ? 'on' : '') + '"></i>';
    pips0.innerHTML = s0;
    return;
  }
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
