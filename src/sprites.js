/* Atlas sprites. assets/atlas.png + assets/atlas.json built by tools/build_atlas.py.
   Strip entries carry {frames}; frame N is an even horizontal slice. */

let img = null;
let map = {};

export async function loadAtlas() {
  const r = await fetch('assets/atlas.json');
  map = await r.json();
  img = new Image();
  img.src = 'assets/atlas.png';
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
