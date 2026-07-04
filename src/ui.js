/* Screens, menus, garage, results. Ported + save calls + paint-tinted heroes.
   Circular import with race.js is fine — all cross-calls happen at runtime. */
import { S, bikeStats, statPct, fmtTime } from './state.js';
import { startRace } from './race.js';
import { saveNow } from './save.js';
import { audioInit, audioRace } from './audio.js';

const screens = ['menu', 'tracks', 'garage', 'race', 'results'];

/* The delivered bike art is green; approximate the chosen paint with a CSS
   hue shift until tint-mask art lands (see docs/DESIGN.md §Art). */
const PAINT_FILTER = {
  green: 'none',
  red: 'hue-rotate(250deg) saturate(2) brightness(0.82)',
  blue: 'hue-rotate(130deg)',
  yellow: 'hue-rotate(315deg) saturate(1.6) brightness(1.05)',
  orange: 'hue-rotate(285deg) saturate(1.9) brightness(0.95)',
  purple: 'hue-rotate(175deg)',
  white: 'saturate(0.15) brightness(1.35)',
  black: 'saturate(0.25) brightness(0.55)',
  mint: 'hue-rotate(55deg) saturate(0.9)',
};

/* True fullscreen on phones: entering a race is a tap (user gesture), so we
   can hide the browser chrome then. Android/desktop only — iOS Safari has no
   element fullscreen on iPhone. Never inside the portal frame. */
export function tryAutoFullscreen() {
  if (window.SWS_EMBED || document.fullscreenElement) return;
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  const el = document.documentElement;
  if (!el.requestFullscreen) return;
  el.requestFullscreen().then(() => {
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { });
  }).catch(() => { });
}

function applyPaintToHeroes() {
  const f = PAINT_FILTER[S.G.color] || 'none';
  for (const id of ['menu-hero', 'garage-hero', 'res-hero']) {
    const el = document.getElementById(id);
    if (el) el.style.filter = f;
  }
}

export function setScreen(name) {
  S.currentScreen = name;
  for (const s of screens) {
    document.getElementById('scr-' + s).classList.toggle('show', s === name);
  }
  document.getElementById('hud').classList.toggle('show', name === 'race');
  document.getElementById('controls').classList.toggle('show', name === 'race');
  if (name === 'menu') renderMenu();
  if (name === 'tracks') renderTracks();
  if (name === 'garage') renderGarage();
}

export function renderMenu() {
  const G = S.G;
  document.getElementById('menu-wallet').textContent = G.wallet.toLocaleString() + ' ⚙';
  document.getElementById('menu-stats').textContent = G.wins + ' wins · ' + G.races + ' races · ' + G.earnings.toLocaleString() + '⚙ earned';
  applyPaintToHeroes();
}

export function renderTracks() {
  const G = S.G;
  const wrap = document.getElementById('track-list');
  wrap.innerHTML = '';
  S.DATA.tracks.forEach((t, i) => {
    const best = G.best[i];
    const card = document.createElement('button');
    card.className = 'track-card';
    card.innerHTML =
      '<span class="tnum">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="tname">' + t.name + '</span>' +
      '<span class="tmeta">' + t.laps + ' laps · purse ×' + t.purse.toFixed(1) + '</span>' +
      '<span class="tbest">' + (best ? 'BEST ' + fmtTime(best / 1000) : 'NO TIME SET') + '</span>';
    card.addEventListener('click', () => { audioInit(); tryAutoFullscreen(); startRace(i); });
    wrap.appendChild(card);
  });
  document.getElementById('tracks-wallet').textContent = G.wallet.toLocaleString() + ' ⚙';
}

export function renderGarage() {
  const G = S.G;
  const DATA = S.DATA;
  document.getElementById('garage-wallet').textContent = G.wallet.toLocaleString() + ' ⚙';
  applyPaintToHeroes();
  // stat bars
  const st = statPct(bikeStats());
  const bars = { 'st-top': st.top, 'st-acc': st.accel, 'st-han': st.steer, 'st-jmp': st.land, 'st-nit': st.nitro };
  for (const k in bars) {
    document.getElementById(k).style.width = Math.round(8 + bars[k] * 92) + '%';
  }
  // parts
  const pw = document.getElementById('parts-wrap');
  pw.innerHTML = '';
  for (const slot of DATA.parts.slots) {
    const box = document.createElement('div'); box.className = 'slot-box';
    box.innerHTML = '<div class="slot-title">' + DATA.parts.slotLabels[slot] + '</div>';
    const row = document.createElement('div'); row.className = 'slot-row';
    for (const part of DATA.parts.parts.filter(p => p.slot === slot)) {
      const owned = G.owned.has(part.id);
      const equipped = G.equipped[slot] === part.id;
      const b = document.createElement('button');
      b.className = 'part' + (equipped ? ' equipped' : owned ? ' owned' : '');
      b.innerHTML = '<span class="pname">' + part.name + '</span><span class="pprice">' +
        (equipped ? 'EQUIPPED' : owned ? 'TAP TO EQUIP' : part.price.toLocaleString() + ' ⚙') + '</span>';
      b.addEventListener('click', () => {
        if (equipped) return;
        if (owned) { G.equipped[slot] = part.id; saveNow(); renderGarage(); return; }
        if (G.wallet >= part.price) {
          G.wallet -= part.price; G.owned.add(part.id); G.equipped[slot] = part.id; saveNow(); renderGarage();
        } else flashWallet('garage-wallet');
      });
      row.appendChild(b);
    }
    box.appendChild(row); pw.appendChild(box);
  }
  // colors
  const cw = document.getElementById('color-wrap');
  cw.innerHTML = '';
  for (const col of DATA.cosmetics.colors) {
    const owned = G.ownedColors.has(col.id);
    const sel = G.color === col.id;
    const b = document.createElement('button');
    b.className = 'swatch' + (sel ? ' sel' : '');
    b.style.background = col.hex;
    b.innerHTML = owned ? '' : '<span>' + col.price + '⚙</span>';
    b.title = col.name;
    b.addEventListener('click', () => {
      if (owned) { G.color = col.id; saveNow(); renderGarage(); return; }
      if (G.wallet >= col.price) { G.wallet -= col.price; G.ownedColors.add(col.id); G.color = col.id; saveNow(); renderGarage(); }
      else flashWallet('garage-wallet');
    });
    cw.appendChild(b);
  }
  document.getElementById('plate-num').textContent = G.plate;
}

function flashWallet(id) {
  const el = document.getElementById(id);
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}

export function showResults(r) {
  const G = S.G;
  setScreen('results');
  const placeTxt = ['1st PLACE!', '2nd PLACE', '3rd PLACE', '4th PLACE'][r.place];
  document.getElementById('res-place').textContent = placeTxt;
  document.getElementById('res-place').className = 'res-place banner p' + r.place;
  const hero = document.getElementById('res-hero');
  hero.src = r.place === 0 ? 'assets/art/bike/bikeview_victory_f01.png'
           : r.place === 3 ? 'assets/art/bike/bikeview_downed.png'
           : 'assets/art/bike/bikeview_ride_a.png';
  applyPaintToHeroes();
  const purse = S.DATA.tracks[G.trackIndex].purse;
  const rows = [
    ['Finish payout ×' + purse.toFixed(1), r.basePay],
    ['Style bonus', r.stylePay],
    ['Track pickups', r.cash],
    ['Best lap bonus', r.bestLapBonus],
  ];
  const tb = document.getElementById('res-rows');
  tb.innerHTML = rows.map(x => '<div class="rrow"><span>' + x[0] + '</span><b>+' + x[1].toLocaleString() + ' ⚙</b></div>').join('');
  document.getElementById('res-total').textContent = '+' + r.total.toLocaleString() + ' ⚙';
  document.getElementById('res-wallet').textContent = G.wallet.toLocaleString() + ' ⚙';
  // standings
  document.getElementById('res-order').innerHTML = r.order.map((b, i) =>
    '<div class="orow' + (b.isAI ? '' : ' me') + '"><i style="background:' + b.color + '"></i>' + (i + 1) + '. ' + b.name +
    (b.finished ? ' — ' + fmtTime(b.finishTime) : ' — DNF') + '</div>').join('');
  const ni = G.trackIndex + 1;
  const nextBtn = document.getElementById('res-next');
  nextBtn.style.display = ni < S.DATA.tracks.length ? 'block' : 'none';
  nextBtn.textContent = 'NEXT: ' + (S.DATA.tracks[ni] ? S.DATA.tracks[ni].name.toUpperCase() : '');
}

export function bindUI() {
  const G = S.G;
  document.getElementById('btn-race').addEventListener('click', () => { audioInit(); tryAutoFullscreen(); setScreen('tracks'); });
  document.getElementById('btn-garage').addEventListener('click', () => setScreen('garage'));
  document.getElementById('tracks-back').addEventListener('click', () => setScreen('menu'));
  document.getElementById('garage-back').addEventListener('click', () => setScreen('menu'));
  document.getElementById('res-again').addEventListener('click', () => startRace(G.trackIndex));
  document.getElementById('res-next').addEventListener('click', () => startRace(Math.min(S.DATA.tracks.length - 1, G.trackIndex + 1)));
  document.getElementById('res-garage').addEventListener('click', () => setScreen('garage'));
  document.getElementById('res-menu').addEventListener('click', () => setScreen('menu'));
  document.getElementById('btn-sws-exit').addEventListener('click', () => window.SWS_EXIT());

  document.getElementById('plate-up').addEventListener('click', () => { G.plate = (G.plate % 99) + 1; saveNow(); renderGarage(); });
  document.getElementById('plate-dn').addEventListener('click', () => { G.plate = ((G.plate + 97) % 99) + 1; saveNow(); renderGarage(); });

  // pause
  document.getElementById('btn-pause').addEventListener('click', () => { S.paused = true; document.getElementById('pause-ov').classList.add('show'); audioRace(false); });
  document.getElementById('pause-resume').addEventListener('click', () => { S.paused = false; document.getElementById('pause-ov').classList.remove('show'); audioRace(true); });
  document.getElementById('pause-restart').addEventListener('click', () => { S.paused = false; document.getElementById('pause-ov').classList.remove('show'); startRace(G.trackIndex); });
  document.getElementById('pause-quit').addEventListener('click', () => { S.paused = false; S.race.active = false; document.getElementById('pause-ov').classList.remove('show'); audioRace(false); setScreen('menu'); });

  document.getElementById('btn-mute').addEventListener('click', e => {
    G.muted = !G.muted;
    e.target.textContent = G.muted ? '🔇' : '🔊';
    saveNow();
    if (G.muted) audioRace(false); else if (S.race.active) audioRace(true);
  });
  document.getElementById('btn-fs').addEventListener('click', () => {
    if (window.SWS_EMBED) return; // never toggle fullscreen inside the portal frame
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().then(() => {
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { });
      }).catch(() => { });
    } else if (document.exitFullscreen) document.exitFullscreen();
  });
  if (window.SWS_EMBED) document.getElementById('btn-fs').style.display = 'none';
  document.getElementById('btn-mute').textContent = G.muted ? '🔇' : '🔊';
}
