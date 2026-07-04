/* Screens: menu, circuit/track select (variants, medals, fees, featured),
   garage (10 slots, wear/repair, rotating stock), results.
   Circular import with race.js is fine — all cross-calls happen at runtime. */
import { S, bikeStats, statPct, fmtTime, partById, configKey, circuitUnlocked, circuitMedalCount } from './state.js';
import { startRace, dailyFeatured } from './race.js';
import { saveNow } from './save.js';
import { audioInit, audioRace } from './audio.js';
import { partWear, repairCost, repairPart, repairAll, repairAllCost, rotatingStock, racesUntilRestock } from './shop.js';
import { VARIANTS } from './track.js';

const screens = ['menu', 'tracks', 'garage', 'race', 'results'];
const MEDAL_ICON = { gold: '🥇', silver: '🥈', bronze: '🥉' };

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

function applyPaintToHeroes() {
  const f = PAINT_FILTER[S.G.color] || 'none';
  for (const id of ['menu-hero', 'garage-hero', 'res-hero']) {
    const el = document.getElementById(id);
    if (el) el.style.filter = f;
  }
}

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
  const medals = Object.values(G.medals).reduce((n, m) => n + m.length, 0);
  document.getElementById('menu-stats').textContent =
    G.wins + ' wins · ' + G.races + ' races · ' + medals + ' medals · ' + G.earnings.toLocaleString() + '⚙ earned';
  applyPaintToHeroes();
}

function unlockedTrackList() {
  const out = [];
  for (const c of S.DATA.economy.circuits) {
    if (circuitUnlocked(c)) out.push(...c.tracks.filter(ti => ti < S.DATA.tracks.length));
  }
  return out;
}

function tryStart(ti, variant, featured) {
  audioInit();
  tryAutoFullscreen();
  const ok = startRace(ti, variant, { featured });
  if (!ok) flashWallet('tracks-wallet');
  else saveNow();
  return ok;
}

export function renderTracks() {
  const G = S.G;
  const wrap = document.getElementById('track-list');
  wrap.innerHTML = '';
  const unlocked = unlockedTrackList();
  const feat = dailyFeatured(unlocked);

  for (const circuit of S.DATA.economy.circuits) {
    const open = circuitUnlocked(circuit);
    const head = document.createElement('div');
    head.className = 'circuit-head' + (open ? '' : ' locked');
    let sub = circuit.fee ? circuit.fee + '⚙ entry per race' : 'free entry';
    if (!open) {
      const u = circuit.unlock;
      const cName = S.DATA.economy.circuits.find(c => c.id === u.circuit).name;
      sub = '🔒 earn ' + u.medals + ' ' + cName + ' medals to unlock (' + circuitMedalCount(u.circuit) + '/' + u.medals + ')';
    }
    head.innerHTML = '<span class="circuit-name banner">' + circuit.name + '</span><span class="circuit-sub">' + sub + '</span>';
    wrap.appendChild(head);
    if (!open) continue;

    for (const ti of circuit.tracks) {
      const t = S.DATA.tracks[ti];
      if (!t) continue;
      const card = document.createElement('div');
      card.className = 'track-card';
      const isFeat = feat && feat.trackIndex === ti;
      const variantChips = VARIANTS.map(v => {
        const key = configKey(ti, v.id);
        const medals = (G.medals[key] || []).map(m => MEDAL_ICON[m]).join('');
        const best = G.best[key];
        const featHere = isFeat && feat.variant === v.id;
        return '<button class="vbtn' + (featHere ? ' feat' : '') + '" data-ti="' + ti + '" data-v="' + v.id + '" ' +
          'title="' + v.label + (best ? ' — best ' + fmtTime(best / 1000) : '') + '">' +
          (v.tag || '▶') + (featHere ? '🔥' : '') + (medals ? '<i>' + medals + '</i>' : '') + '</button>';
      }).join('');
      const bestN = G.best[configKey(ti, 0)];
      card.innerHTML =
        '<span class="tnum">' + String(ti + 1).padStart(2, '0') + (isFeat ? ' <b class="feat-tag">🔥 2× TODAY</b>' : '') + '</span>' +
        '<span class="tname">' + t.name + '</span>' +
        '<span class="tmeta">' + t.laps + ' laps · purse ×' + t.purse.toFixed(1) +
          (circuit.fee ? ' · fee ' + circuit.fee + '⚙' : '') +
          (t.targetLap ? ' · target ' + t.targetLap.toFixed(1) + 's' : '') + '</span>' +
        (t.special ? '<span class="tspecial">🥉 ' + t.special.label + '</span>' : '') +
        '<span class="tbest">' + (bestN ? 'BEST ' + fmtTime(bestN / 1000) : 'NO TIME SET') + '</span>' +
        '<span class="vrow">' + variantChips + '</span>';
      wrap.appendChild(card);
    }
  }
  wrap.querySelectorAll('.vbtn').forEach(b => {
    b.addEventListener('click', () => {
      const ti = +b.dataset.ti, v = +b.dataset.v;
      const featHere = feat && feat.trackIndex === ti && feat.variant === v;
      tryStart(ti, v, featHere);
    });
  });
  document.getElementById('tracks-wallet').textContent = G.wallet.toLocaleString() + ' ⚙';
}

function partCard(part, opts) {
  const G = S.G;
  const owned = G.owned.has(part.id);
  const equipped = G.equipped[part.slot] === part.id;
  const wear = partWear(part.id);
  const b = document.createElement('button');
  b.className = 'part r-' + part.r + (equipped ? ' equipped' : owned ? ' owned' : '');
  let priceLine = equipped ? 'EQUIPPED' : owned ? 'TAP TO EQUIP' : part.price.toLocaleString() + ' ⚙';
  let wearLine = '';
  if (owned && part.price > 0) {
    const cls = wear >= 70 ? 'bad' : wear >= 35 ? 'mid' : '';
    wearLine = '<span class="pwear"><i class="' + cls + '" style="width:' + wear + '%"></i></span>';
    if (wear > 0) priceLine += ' · ' + wear + '% worn';
  }
  b.innerHTML =
    '<span class="pname">' + part.name + (part.r !== 'c' ? ' <em class="rtag r-' + part.r + '">' + S.DATA.parts.rarityLabels[part.r] + '</em>' : '') + '</span>' +
    wearLine +
    '<span class="pprice">' + priceLine + '</span>' +
    (owned && wear > 0 ? '<span class="pfix" data-id="' + part.id + '">🔧 REPAIR ' + repairCost(part) + '⚙</span>' : '');
  b.addEventListener('click', (e) => {
    if (e.target.classList.contains('pfix')) {
      if (repairPart(part)) { saveNow(); renderGarage(); }
      else flashWallet('garage-wallet');
      return;
    }
    if (equipped) return;
    if (owned) { G.equipped[part.slot] = part.id; saveNow(); renderGarage(); return; }
    if (G.wallet >= part.price) {
      G.wallet -= part.price; G.owned.add(part.id); G.equipped[part.slot] = part.id; saveNow(); renderGarage();
    } else flashWallet('garage-wallet');
  });
  return b;
}

export function renderGarage() {
  const G = S.G;
  const DATA = S.DATA;
  document.getElementById('garage-wallet').textContent = G.wallet.toLocaleString() + ' ⚙';
  applyPaintToHeroes();
  // stat bars
  const st = statPct(bikeStats());
  const bars = {
    'st-top': st.top, 'st-acc': st.accel, 'st-han': st.steer, 'st-jmp': st.land,
    'st-nit': st.nitro, 'st-brk': st.brake, 'st-tuf': st.tough,
  };
  for (const k in bars) {
    const el = document.getElementById(k);
    if (el) el.style.width = Math.round(8 + Math.max(0, Math.min(1, bars[k])) * 92) + '%';
  }

  const pw = document.getElementById('parts-wrap');
  pw.innerHTML = '';

  // rotating rare stock — the retention hook
  const rot = rotatingStock();
  const rbox = document.createElement('div');
  rbox.className = 'slot-box rot-box';
  rbox.innerHTML = '<div class="slot-title">⭐ Rotating rare stock <span class="rot-count">restocks in ' +
    racesUntilRestock() + ' race' + (racesUntilRestock() === 1 ? '' : 's') + '</span></div>';
  const rrow = document.createElement('div');
  rrow.className = 'slot-row';
  for (const part of rot) rrow.appendChild(partCard(part));
  rbox.appendChild(rrow);
  pw.appendChild(rbox);

  // repair-all bar
  const rac = repairAllCost();
  if (rac > 0) {
    const fixbar = document.createElement('button');
    fixbar.className = 'ghost-btn fix-all';
    fixbar.textContent = '🔧 REPAIR ALL PARTS — ' + rac.toLocaleString() + ' ⚙';
    fixbar.addEventListener('click', () => {
      if (repairAll()) { saveNow(); renderGarage(); } else flashWallet('garage-wallet');
    });
    pw.appendChild(fixbar);
  }

  // permanent stock by slot
  for (const slot of DATA.parts.slots) {
    const box = document.createElement('div'); box.className = 'slot-box';
    box.innerHTML = '<div class="slot-title">' + DATA.parts.slotLabels[slot] + '</div>';
    const row = document.createElement('div'); row.className = 'slot-row';
    for (const part of DATA.parts.parts.filter(p => p.slot === slot && (!p.rot || S.G.owned.has(p.id)))) {
      row.appendChild(partCard(part));
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
  if (!el) return;
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

  const t = S.DATA.tracks[S.race.trackIndex];
  const rows = [
    ['Finish payout' + (r.featured ? ' 🔥 FEATURED 2×' : ''), r.basePay],
    ['Style bonus', r.stylePay],
    ['Track pickups', r.cash],
    ['Best lap bonus', r.bestLapBonus],
  ];
  if (r.golden) rows.push(['✨ Golden Sprocket', r.golden]);
  for (const m of r.medals) rows.push([MEDAL_ICON[m] + ' ' + m.toUpperCase() + ' medal — ' + t.name, S.DATA.economy.medals[m]]);
  if (r.setPay) rows.push(['Race-set completion bonus', r.setPay]);
  const tb = document.getElementById('res-rows');
  tb.innerHTML = rows.map(x => '<div class="rrow"><span>' + x[0] + '</span><b>+' + x[1].toLocaleString() + ' ⚙</b></div>').join('')
    + (r.fee ? '<div class="rrow fee"><span>Entry fee</span><b>−' + r.fee.toLocaleString() + ' ⚙</b></div>' : '');
  document.getElementById('res-total').textContent = '+' + r.total.toLocaleString() + ' ⚙';
  document.getElementById('res-wallet').textContent = G.wallet.toLocaleString() + ' ⚙';
  document.getElementById('res-order').innerHTML = r.order.map((b, i) =>
    '<div class="orow' + (b.isAI ? '' : ' me') + '"><i style="background:' + b.color + '"></i>' + (i + 1) + '. ' + b.name +
    (b.finished ? ' — ' + fmtTime(b.finishTime) : ' — DNF') + '</div>').join('');

  const ni = S.race.trackIndex + 1;
  const nextBtn = document.getElementById('res-next');
  const nextOk = ni < S.DATA.tracks.length && unlockedTrackList().includes(ni);
  nextBtn.style.display = nextOk ? 'block' : 'none';
  nextBtn.textContent = 'NEXT: ' + (S.DATA.tracks[ni] ? S.DATA.tracks[ni].name.toUpperCase() : '');
}

export function bindUI() {
  const G = S.G;
  document.getElementById('btn-race').addEventListener('click', () => { audioInit(); tryAutoFullscreen(); setScreen('tracks'); });
  document.getElementById('btn-garage').addEventListener('click', () => setScreen('garage'));
  document.getElementById('tracks-back').addEventListener('click', () => setScreen('menu'));
  document.getElementById('garage-back').addEventListener('click', () => setScreen('menu'));
  document.getElementById('res-again').addEventListener('click', () => {
    if (!tryStart(S.race.trackIndex, S.race.variant, false)) setScreen('tracks');
  });
  document.getElementById('res-next').addEventListener('click', () => {
    const ni = Math.min(S.DATA.tracks.length - 1, S.race.trackIndex + 1);
    if (!tryStart(ni, 0, false)) setScreen('tracks');
  });
  document.getElementById('res-garage').addEventListener('click', () => setScreen('garage'));
  document.getElementById('res-menu').addEventListener('click', () => setScreen('menu'));
  document.getElementById('btn-sws-exit').addEventListener('click', () => window.SWS_EXIT());

  document.getElementById('plate-up').addEventListener('click', () => { G.plate = (G.plate % 99) + 1; saveNow(); renderGarage(); });
  document.getElementById('plate-dn').addEventListener('click', () => { G.plate = ((G.plate + 97) % 99) + 1; saveNow(); renderGarage(); });

  // pause
  document.getElementById('btn-pause').addEventListener('click', () => { S.paused = true; document.getElementById('pause-ov').classList.add('show'); audioRace(false); });
  document.getElementById('pause-resume').addEventListener('click', () => { S.paused = false; document.getElementById('pause-ov').classList.remove('show'); audioRace(true); });
  document.getElementById('pause-restart').addEventListener('click', () => {
    S.paused = false; document.getElementById('pause-ov').classList.remove('show');
    if (!tryStart(S.race.trackIndex, S.race.variant, false)) setScreen('tracks');
  });
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
