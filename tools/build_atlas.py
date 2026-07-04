#!/usr/bin/env python3
"""Build assets/atlas.png + assets/atlas.json from assets/art/{fx,props,pickup,ui}.
Also runs a magenta-fringe cleanup (key-color halo left by AI-sheet slicing).
Re-run whenever new art waves land: python3 tools/build_atlas.py
"""
import os, json, math
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'assets', 'art')
# 'ui' art is DOM <img> only (garage icons, medals, logo) — packing the
# hi-res wave2 recuts into the atlas doubled its size for zero canvas use
CATS = ['fx', 'props', 'pickup', 'trackbike']
PAD = 2
MAXW = 2048

# frame counts for multi-frame strip images (sliced at runtime)
STRIP_FRAMES = {
    'fx_dust_puff_strip': 4, 'fx_nitro_flame_strip': 3, 'fx_land_poof_strip': 3,
    'fx_collect_burst_strip': 4, 'fx_mud_splat_strip': 3, 'fx_water_splash_strip': 4,
    'fx_spark_hit_strip': 3, 'fx_gold_sparkle_strip': 4, 'fx_rain_overlay_strip': 2,
    'fx_confetti_strip': 4, 'fx_dirt_roost_strip': 4, 'fx_sand_burst_strip': 4,
    'fx_trail_dirt_strip': 4, 'fx_speed_lines_strip': 4, 'fx_dust_trail_strip': 3,
    'pickup_cash_strip': 3, 'pickup_key_strip': 3,
    'pickup_sprocket_strip': 4, 'pickup_sprocket_gold_strip': 4,
    # top-down ride strips (wave 0704): 3-frame bob cycle per paint
    **{'trackbike_%s_strip' % p: 3 for p in
       ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white', 'black', 'mint']},
}

def clean_magenta(im):
    """Kill near-pure-magenta halo pixels; desaturate weaker fringe."""
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # distance to pure #FF00FF
            d = math.sqrt((255-r)**2 + g**2 + (255-b)**2)
            if d < 90 or (r >= 70 and b >= 70 and g < min(r, b) * 0.35 and abs(r-b) < 70):
                px[x, y] = (r, g, b, 0)
            elif r > 120 and b > 120 and g < min(r, b) * 0.55 and abs(r-b) < 70:
                # magenta-ish fringe: pull toward neutral gray, cut alpha
                m = (r + g + b) // 3
                px[x, y] = (m, m, m, min(a, 140))
    return im

def main():
    entries = []
    for cat in CATS:
        d = os.path.join(ART, cat)
        for f in sorted(os.listdir(d)):
            if not f.endswith('.png'):
                continue
            im = clean_magenta(Image.open(os.path.join(d, f)))
            entries.append([f[:-4], im])
    # shelf pack, tallest first
    entries.sort(key=lambda e: -e[1].height)
    x = y = shelf = 0
    placed = []
    for name, im in entries:
        w, h = im.size
        if x + w + PAD > MAXW:
            x = 0
            y += shelf + PAD
            shelf = 0
        placed.append((name, im, x, y))
        x += w + PAD
        shelf = max(shelf, h)
    H = y + shelf + PAD
    atlas = Image.new('RGBA', (MAXW, H), (0, 0, 0, 0))
    manifest = {}
    for name, im, px_, py_ in placed:
        atlas.paste(im, (px_, py_), im)
        e = {'x': px_, 'y': py_, 'w': im.width, 'h': im.height}
        if name in STRIP_FRAMES:
            e['frames'] = STRIP_FRAMES[name]
        manifest[name] = e
    # 256-color palette with dithering: visually lossless on flat cartoon
    # sprites (verified frame-by-frame vs truecolor) and ~4-5x smaller
    atlas.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG) \
         .save(os.path.join(ROOT, 'assets', 'atlas.png'), optimize=True)
    # content hash rides in the manifest: sprites.js appends it as ?v= on the
    # png so a fresh json can never pair with a stale cached atlas image
    import hashlib
    png_hash = hashlib.sha1(open(os.path.join(ROOT, 'assets', 'atlas.png'), 'rb').read()).hexdigest()[:10]
    manifest['__v'] = png_hash
    with open(os.path.join(ROOT, 'assets', 'atlas.json'), 'w') as f:
        json.dump(manifest, f, separators=(',', ':'), sort_keys=True)
    kb = os.path.getsize(os.path.join(ROOT, 'assets', 'atlas.png')) // 1024
    print(f'atlas {MAXW}x{H} — {len(manifest) - 1} sprites — {kb} KB — v={png_hash}')

if __name__ == '__main__':
    main()
