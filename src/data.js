/* Loads all tuning data. Balance passes edit data/*.json, never code. */
import { S } from './state.js';
import { ART_V } from './sprites.js';

async function j(url) {
  const r = await fetch(url + '?v=' + ART_V);
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  return r.json();
}

export async function loadData() {
  const [economy, parts, cosmetics, trackIndex] = await Promise.all([
    j('data/economy.json'), j('data/parts.json'), j('data/cosmetics.json'),
    j('data/tracks/index.json'),
  ]);
  const tracks = await Promise.all(trackIndex.map(id => j('data/tracks/' + id + '.json')));
  S.DATA = { economy, parts, cosmetics, tracks };
  return S.DATA;
}
