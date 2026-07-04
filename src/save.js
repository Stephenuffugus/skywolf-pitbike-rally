/* localStorage persistence. Versioned schema + migrations + export/import. */
import { S } from './state.js';

export const SAVE_KEY = 'skywolf.pitbikerally.save.v1';

function defaults() {
  return {
    v: 2,
    wallet: S.DATA.economy.startWallet,
    owned: ['eng0', 'exh0', 'crb0', 'tir0', 'sus0', 'grs0', 'frm0', 'brk0', 'nit0', 'arm0'],
    equipped: {
      engine: 'eng0', exhaust: 'exh0', carb: 'crb0', tires: 'tir0', susp: 'sus0',
      gears: 'grs0', frame: 'frm0', brakes: 'brk0', nitro: 'nit0', armor: 'arm0',
    },
    ownedColors: ['red', 'blue', 'green'],
    color: 'green',
    plate: 7,
    skin: 'base',
    best: {},          // configKey -> ms
    medals: {},        // configKey -> ['gold','silver','bronze'] earned
    wear: {},          // partId -> 0..100
    ghosts: {},        // configKey -> {ms, hz, pts:[x,y,heading]*n} best-lap stream
    wins: 0, races: 0, earnings: 0,
    trackIndex: 0, variant: 0,
    muted: false,
    sunbeamDay: '', sunbeamEarnedToday: 0,
  };
}

function migrate(raw) {
  if (raw.v === 1) {
    // v1 -> v2: 10 slots, wear, medals, variants, ghosts, skins.
    const d = defaults();
    raw.owned = Array.from(new Set([...(raw.owned || []), ...d.owned]));
    raw.equipped = Object.assign({}, d.equipped, raw.equipped || {});
    raw.skin = raw.skin || 'base';
    raw.medals = raw.medals || {};
    raw.wear = raw.wear || {};
    raw.ghosts = raw.ghosts || {};
    raw.variant = raw.variant || 0;
    // v1 bests were keyed by bare trackIndex; v2 keys are "trackIndex:variant"
    const bests = {};
    for (const k in (raw.best || {})) bests[k.includes(':') ? k : k + ':0'] = raw.best[k];
    raw.best = bests;
    raw.v = 2;
  }
  return raw;
}

export function loadSave() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { /* corrupt */ }
  const d = defaults();
  const g = raw && raw.v ? Object.assign(d, migrate(raw)) : d;
  // Sets don't survive JSON; keep arrays in storage, Sets in memory
  g.owned = new Set(g.owned);
  g.ownedColors = new Set(g.ownedColors);
  S.G = g;
  return g;
}

export function saveNow() {
  const g = S.G;
  const out = Object.assign({}, g, {
    owned: Array.from(g.owned),
    ownedColors: Array.from(g.ownedColors),
  });
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(out)); } catch (e) { /* quota/private */ }
}

export function exportSave() {
  return localStorage.getItem(SAVE_KEY) || '';
}

export function importSave(text) {
  const parsed = JSON.parse(text);      // throws on bad input — caller handles
  if (!parsed || !parsed.v || parsed.v > 2) throw new Error('unsupported save version');
  localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
  return loadSave();
}
