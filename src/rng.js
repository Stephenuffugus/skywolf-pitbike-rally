/* Deterministic seeded RNG (mulberry32) — shop rotation, daily featured,
   per-race seeds. Same seed → same sequence, so rotations are fair/testable. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Pick n distinct items from arr, deterministically for a given seed. */
export function seededPick(arr, n, seed) {
  const rng = mulberry32(seed);
  const pool = arr.slice();
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/* Stable day key + numeric seed for daily rotation. */
export function dayKey(d) {
  const dt = d || new Date();
  return dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate();
}
