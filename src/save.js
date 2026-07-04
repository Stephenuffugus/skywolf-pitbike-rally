/* localStorage persistence. Versioned schema + migration stub + export/import. */
import { S } from './state.js';

export const SAVE_KEY = 'skywolf.pitbikerally.save.v1';

function defaults() {
  return {
    v: 1,
    wallet: S.DATA.economy.startWallet,
    owned: ['eng0', 'tir0', 'sus0', 'nit0', 'grs0'],
    equipped: { engine: 'eng0', tires: 'tir0', susp: 'sus0', nitro: 'nit0', gears: 'grs0' },
    ownedColors: ['red', 'blue', 'green'],
    color: 'green',
    plate: 7,
    best: {},          // trackIndex -> ms
    wins: 0, races: 0, earnings: 0,
    trackIndex: 0,
    muted: false,
    sunbeamDay: '', sunbeamEarnedToday: 0,
  };
}

function migrate(raw) {
  // future schema bumps go here (v1 -> v2 -> ...)
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
  if (!parsed || parsed.v !== 1) throw new Error('unsupported save version');
  localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
  return loadSave();
}
