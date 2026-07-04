#!/usr/bin/env python3
"""
sheet_slicer.py — Pit Bike Rally magenta-sheet cutter.
Give it a composite sheet (like the Wave 1 preview): it finds every magenta
cell, crops it, keys the magenta to transparency, despills pink fringe,
and writes individual sprites + a transparency-proof contact sheet.

Usage:  pip install pillow numpy scipy
        python3 sheet_slicer.py wave1_sheet.png outdir/
Individual full-res generations work too (one big magenta cell = one sprite).
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage

EDGE_SOFT, MIN_AREA, TOL = 40, 1500, 70

def detect_key(a):
    """AI generators drift the magenta — find the sheet's ACTUAL background color."""
    px = a.reshape(-1, 3)
    pink = px[(px[:, 0] > 150) & (px[:, 2] > 100) & (px[:, 1] < 120)]
    if len(pink) < 1000: return None
    vals, counts = np.unique(pink // 8 * 8, axis=0, return_counts=True)
    return vals[counts.argmax()] + 4

def key_crop(crop, key):
    cr, cg, cb = crop[..., 0], crop[..., 1], crop[..., 2]
    d = np.sqrt((cr - key[0]) ** 2 + (cg - key[1]) ** 2 + (cb - key[2]) ** 2)
    alpha = np.clip((d - TOL) / EDGE_SOFT, 0, 1)
    fringe = (cr > 140) & (cb > 140) & (cg < 120) & (alpha > 0) & (alpha < 1)
    crop[..., 0][fringe] = (cr[fringe] + cg[fringe]) // 2
    crop[..., 2][fringe] = (cb[fringe] + cg[fringe]) // 2
    return np.dstack([crop, (alpha * 255).astype(int)]).astype('uint8'), alpha

def main(src, outdir):
    os.makedirs(outdir, exist_ok=True)
    a = np.array(Image.open(src).convert('RGB')).astype(int)
    key = detect_key(a)
    if key is None:
        print('no magenta background detected in', src); return
    print('auto-detected key color:', tuple(key))
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = np.sqrt((r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2) < TOL
    lab, n = ndimage.label(mag)
    boxes = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(ys) < MIN_AREA: continue
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        if (y1 - y0) < 24 or (x1 - x0) < 24: continue
        boxes.append((y0, y1, x0, x1))
    boxes.sort(key=lambda bx: (bx[0] // 60, bx[2]))
    count = 0
    files = []
    for (y0, y1, x0, x1) in boxes:
        out, alpha = key_crop(a[y0:y1 + 1, x0:x1 + 1].copy(), key)
        if (alpha > 0.5).mean() < 0.03: continue   # empty cell
        count += 1
        f = f'sprite_{count:03d}.png'
        Image.fromarray(out, 'RGBA').save(os.path.join(outdir, f))
        files.append(f)
    # contact sheet on checkerboard proves the transparency
    cols, cell = 10, 110
    rows = (len(files) + cols - 1) // cols
    yy, xx = np.mgrid[0:rows * cell, 0:cols * cell]
    bg = np.where(((yy // 20 + xx // 20) % 2 == 0)[..., None], 205, 160).astype('uint8').repeat(3, axis=2)
    sheet = Image.fromarray(bg)
    for i, f in enumerate(files):
        s = Image.open(os.path.join(outdir, f)); s.thumbnail((cell - 8, cell - 8))
        sheet.paste(s, ((i % cols) * cell + (cell - s.width) // 2,
                        (i // cols) * cell + (cell - s.height) // 2), s)
    sheet.save(os.path.join(outdir, '_contact_sheet.png'))
    print(f'{count} sprites cut -> {outdir} (see _contact_sheet.png)')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'cut')
