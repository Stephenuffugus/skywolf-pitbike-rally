#!/usr/bin/env python3
"""One-time in-place cleanup of assets/art/{bike,fx,props,pickup,ui}:
1. Magenta key-fringe removal (all sprites).
2. Baked caption-box removal (wave1_* sourced sprites carry a black rounded
   label box with white text near the top-left, e.g. "2. fx_nitro_flame_f01-03").
Raw originals in assets/art/raw are untouched.
"""
import os, json, math
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'assets', 'art')

def clean_magenta(px, w, h):
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            d = math.sqrt((255-r)**2 + g**2 + (255-b)**2)
            if d < 90 or (r >= 70 and b >= 70 and g < min(r, b) * 0.35 and abs(r-b) < 70):
                px[x, y] = (r, g, b, 0); n += 1
            elif r > 120 and b > 120 and g < min(r, b) * 0.55 and abs(r-b) < 70:
                m = (r + g + b) // 3
                px[x, y] = (m, m, m, min(a, 140)); n += 1
    return n

def erase_caption(px, w, h):
    """Find the near-black caption box in the top 35% of the image and clear it.
    Box = solid neutral-dark pixels; text inside = near-white. Sprites' own dark
    outlines are thin; the box is a wide solid run, so require long dark runs."""
    top = int(h * 0.35)
    rows = []
    for y in range(top):
        run = best = 0
        for x in range(w):
            r, g, b, a = px[x, y]
            dark = a > 180 and max(r, g, b) < 55 and abs(r-b) < 30 and abs(r-g) < 30
            run = run + 1 if dark else 0
            best = max(best, run)
        if best > w * 0.10 and best > 24:
            rows.append(y)
    if not rows:
        return False
    y0, y1 = min(rows), max(rows)
    if y1 - y0 < 6 or y1 - y0 > 60:      # not a caption-shaped band
        return False
    # find x-extent of the dark band
    x0, x1 = w, 0
    for y in range(y0, y1 + 1):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 120 and ((max(r, g, b) < 65) or (r > 190 and g > 190 and b > 190)):
                x0 = min(x0, x); x1 = max(x1, x)
    for y in range(max(0, y0-2), min(h, y1+3)):
        for x in range(max(0, x0-2), min(w, x1+3)):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 0)
    return True

def main():
    src_of = json.load(open(os.path.join(ART, 'rename_manifest.json')))
    total = caps = 0
    for rel, src in sorted(src_of.items()):
        cat = rel.split('/')[0]
        if cat in ('misc', 'raw'):
            continue
        p = os.path.join(ART, rel)
        im = Image.open(p).convert('RGBA')
        px = im.load()
        w, h = im.size
        clean_magenta(px, w, h)
        if src.startswith('wave1_'):
            if erase_caption(px, w, h):
                caps += 1
        im.save(p, optimize=True)
        total += 1
    print(f'cleaned {total} sprites, erased {caps} caption boxes')

if __name__ == '__main__':
    main()
