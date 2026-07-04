/* Economy services: wear & repair, rotating rare-parts stock, set bonuses. */
import { S, partById } from './state.js';
import { seededPick } from './rng.js';

export function setsCompleted() {
  return Math.floor(S.G.races / S.DATA.economy.shop.racesPerSet);
}

export function racesUntilRestock() {
  const per = S.DATA.economy.shop.racesPerSet;
  return per - (S.G.races % per);
}

/* Current rotating stock — derived, never stored: same set count → same stock. */
export function rotatingStock() {
  const pool = S.DATA.parts.parts.filter(p => p.rot);
  return seededPick(pool, S.DATA.economy.shop.rotationSlots, 0x5EED + setsCompleted());
}

export function partWear(id) {
  return Math.round((S.G.wear && S.G.wear[id]) || 0);
}

/* Wear accrual after a race: equipped, non-stock parts only. */
export function applyRaceWear(laps) {
  const W = S.DATA.economy.wear;
  const add = W.perRace + laps * W.perLap;
  for (const slot of S.DATA.parts.slots) {
    const p = partById(S.G.equipped[slot]);
    if (!p || p.price === 0) continue;
    S.G.wear[p.id] = Math.min(100, ((S.G.wear[p.id]) || 0) + add);
  }
}

export function repairCost(part) {
  const w = partWear(part.id);
  if (!w) return 0;
  const per = S.DATA.economy.wear.repairPerTier;
  return Math.max(10, Math.round((part.tier + 1) * per * (w / 100)));
}

/* Repair one part; returns true if paid. */
export function repairPart(part) {
  const cost = repairCost(part);
  if (!cost || S.G.wallet < cost) return false;
  S.G.wallet -= cost;
  delete S.G.wear[part.id];
  return true;
}

export function repairAllCost() {
  let total = 0;
  for (const id in (S.G.wear || {})) {
    const p = partById(id);
    if (p) total += repairCost(p);
  }
  return total;
}

export function repairAll() {
  const cost = repairAllCost();
  if (!cost || S.G.wallet < cost) return false;
  S.G.wallet -= cost;
  S.G.wear = {};
  return true;
}
