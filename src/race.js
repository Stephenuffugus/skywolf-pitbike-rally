/* Race lifecycle: start, per-frame update, finish + payouts + sunbeams. */
import { S, bikeStats, popup } from './state.js';
import { buildTrack, prerenderTrack } from './track.js';
import { makeBike, updateBike, updateAI, bikeCollisions, racePositions } from './physics.js';
import { setTrackCanvas } from './render.js';
import { clearFx, updateFx } from './fx.js';
import { hudInit, hudUpdate } from './hud.js';
import { setScreen, showResults } from './ui.js';
import { audioRace, audioTick } from './audio.js';
import { saveNow } from './save.js';

const AI_COLORS = ['#e4952f', '#7f56c9', '#3fb4c9'];
const AI_NAMES = ['Dusty', 'Rico', 'Mags'];

export function startRace(ti) {
  const { G, DATA, race } = S;
  G.trackIndex = ti;
  const def = DATA.tracks[ti];
  S.track = buildTrack(def);
  race.laps = def.laps;
  race.t = 0; race.countdown = 3.2; race.started = false; race.over = false; race.active = true;
  race.popups = []; race.finishOrder = []; race.pauseAfter = 0;
  for (const p of S.track.pickups) { p.active = true; p.timer = 0; }
  clearFx();

  const st = bikeStats();
  const track = S.track;
  const bikes = S.bikes = [];
  // grid: 2x2 behind start line
  const N = track.N;
  for (let k = 0; k < 4; k++) {
    const back = 30 + Math.floor(k / 2) * 22;
    const i = (N - back) % N;
    const nrm = track.normals[i];
    const lat = (k % 2 === 0 ? -1 : 1) * track.width * 0.22;
    const p = track.pts[i];
    const q = track.pts[(i + 6) % N];
    const bike = makeBike({
      x: p[0] + nrm[0] * lat, y: p[1] + nrm[1] * lat,
      heading: Math.atan2(q[1] - p[1], q[0] - p[0]),
      idx: i, lap: 0,
    });
    if (k === 0) {
      bike.isAI = false; bike.name = 'You';
      bike.color = DATA.cosmetics.colors.find(c => c.id === G.color).hex; bike.plate = G.plate;
      bike.stats = st; bike.nitro = st.charges;
    } else {
      const j = k - 1;
      const base = def.ai;
      const skill = base + j * 0.035 + Math.random() * 0.02;
      const aiUp = Math.min(1, ti / 7);
      bike.isAI = true; bike.skill = skill; bike.name = AI_NAMES[j]; bike.color = AI_COLORS[j]; bike.plate = [11, 23, 42][j];
      bike.stats = {
        top: 285 + 120 * aiUp * skill, accel: 190 + 100 * aiUp * skill,
        steer: 2.55 + 0.7 * aiUp, grip: 0.15 * aiUp, land: 0.6, charges: 1 + Math.round(2 * aiUp),
      };
      bike.nitro = bike.stats.charges;
    }
    bikes.push(bike);
  }
  setTrackCanvas(prerenderTrack(null, ti));
  setScreen('race');
  hudInit();
  audioRace(true);
}

export function updateRace(dt) {
  const race = S.race;
  if (S.paused) return;
  if (race.countdown > 0) {
    race.countdown -= dt;
    const c = Math.ceil(race.countdown);
    const el = document.getElementById('count');
    if (race.countdown <= 0) {
      race.started = true; el.textContent = 'GO!'; el.classList.add('go');
      setTimeout(() => { el.style.display = 'none'; }, 700);
    } else { el.textContent = c; el.style.display = 'block'; el.classList.remove('go'); }
    return;
  }
  race.t += dt;

  for (const b of S.bikes) { if (b.isAI) updateAI(b, dt); }
  for (const b of S.bikes) updateBike(b, dt);
  bikeCollisions();
  updateFx(dt);

  for (const p of S.track.pickups) { if (!p.active) { p.timer -= dt; if (p.timer <= 0) p.active = true; } }
  for (let i = race.popups.length - 1; i >= 0; i--) {
    const p = race.popups[i]; p.ttl -= dt; p.y -= 28 * dt; if (p.ttl <= 0) race.popups.splice(i, 1);
  }

  if (race.over) {
    race.pauseAfter -= dt;
    if (race.pauseAfter <= 0) { finishRace(); }
  }
  hudUpdate();
  audioTick();
}

/* Sunbeams (Sky Wolf shared currency): win pays 4, podium 2 — capped at 30/day
   per the studio earn policy. Game's own Sprockets are untouched by this. */
function earnSunbeams(place) {
  const G = S.G;
  const today = new Date().toISOString().slice(0, 10);
  if (G.sunbeamDay !== today) { G.sunbeamDay = today; G.sunbeamEarnedToday = 0; }
  const amt = place === 0 ? 4 : (place < 3 ? 2 : 0);
  if (!amt || G.sunbeamEarnedToday + amt > 30) return;
  G.sunbeamEarnedToday += amt;
  if (window.Sunbeam) Sunbeam.earn(amt, 'pitbike-rally:' + (place === 0 ? 'win' : 'place')).catch(function () { });
}

export function finishRace() {
  const { G, DATA, race } = S;
  race.active = false;
  audioRace(false);
  const order = racePositions();
  const place = order.indexOf(S.bikes[0]);
  const purse = DATA.tracks[G.trackIndex].purse;
  const p = S.bikes[0];
  const EC = DATA.economy;
  const basePay = Math.round(EC.place[place] * purse);
  const stylePay = Math.min(EC.styleCap, p.style * EC.styleRate);
  let bestLapBonus = 0;
  if (p.bestLap < Infinity) {
    bestLapBonus = EC.bestLap; // award for setting a clean best lap
  }
  const total = basePay + stylePay + p.cash + bestLapBonus;
  G.wallet += total; G.earnings += total; G.races++;
  if (place === 0) G.wins++;
  const ms = Math.round(p.finishTime * 1000) || Math.round(race.t * 1000);
  if (p.finished && (!G.best[G.trackIndex] || ms < G.best[G.trackIndex])) G.best[G.trackIndex] = ms;

  earnSunbeams(place);
  saveNow();
  showResults({ place, order, basePay, stylePay, cash: p.cash, bestLapBonus, total });
}
