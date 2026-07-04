/* Atlas sprites. assets/atlas.png + assets/atlas.json built by tools/build_atlas.py.
   Strip entries carry {frames}; frame N is an even horizontal slice. */

let img = null;
let map = {};

/* Deploy version for cache-busting EVERY fetched asset (json/jpg). The portal
   host ignores no-cache headers (observed: modules served max-age=14400, one
   even 604800 — players got frozen mixed-version builds), so only unique URLs
   are safe. The vendor script rewrites this to the deploy hash; bump manually
   when releasing from the canonical repo. */
export const ART_V = '20260704c';

export async function loadAtlas() {
  const r = await fetch('assets/atlas.json?v=' + ART_V);
  map = await r.json();
  img = new Image();
  img.src = 'assets/atlas.png?v=' + (map.__v || ART_V);
  await img.decode();
  return map;
}

export function spr(name) { return map[name] || null; }

/* Draw sprite centered at (x,y), scaled so its longest side = size world px.
   rot in radians; frame for strips. */
export function drawSpr(ctx, name, x, y, size, rot, frame) {
  const e = map[name];
  if (!e || !img) return;
  const frames = e.frames || 1;
  const fw = e.w / frames;
  const f = Math.max(0, Math.min(frames - 1, frame | 0));
  const sc = size / Math.max(fw, e.h);
  const dw = fw * sc, dh = e.h * sc;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.drawImage(img, e.x + f * fw, e.y, fw, e.h, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

export function frameCount(name) {
  const e = map[name];
  return e ? (e.frames || 1) : 0;
}

/* Terrain tiles (wave2 0704): opaque 512px JPGs under assets/terrain/, used as
   canvas patterns for the track prerender. Only the tiles the prerender
   consumes are fetched; missing files degrade to the flat theme colors. */
const terrains = {};
const patternCache = {};

export async function loadTerrain() {
  const names = ['terrain_dirt_loam', 'terrain_mud_a', 'terrain_sand', 'ground_meadow',
                 'ground_desert', 'ground_prairie', 'ground_canyon', 'ground_stadium',
                 'ground_swamp', 'ground_ridge', 'ground_storm'];
  await Promise.all(names.map(n => new Promise(res => {
    const im = new Image();
    im.onload = () => { terrains[n] = im; res(); };
    im.onerror = () => res();
    im.src = 'assets/terrain/' + n + '.jpg?v=' + ART_V;
  })));
}

/* Pattern with the tile repeating every `scale` world px. Null if not loaded. */
export function terrainPattern(ctx, name, scale) {
  const im = terrains[name];
  if (!im) return null;
  const key = name + '@' + scale;
  if (!patternCache[key]) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = scale;
    cv.getContext('2d').drawImage(im, 0, 0, scale, scale);
    patternCache[key] = ctx.createPattern(cv, 'repeat');
  }
  return patternCache[key];
}
