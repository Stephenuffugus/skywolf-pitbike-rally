#!/usr/bin/env python3
"""wave4_ride_rebuild.py — rebuild trackbike_<paint>_strip from the HI-RES
top-down rider (assets/art/bike/bike_topdown_hero.png, cut from Stephen's
1254px original). The old ride strip came from ~110px composite-sheet cells:
dark, muddy, rider unreadable at game size — players saw a riderless blob
except when the (hi-res) lean/air pose frames kicked in.

3 frames per paint: base / 1px-down bob / base — same filenames, no code
changes. Run: python3 tools/wave4_ride_rebuild.py && python3 tools/build_atlas.py
"""
import os, sys, json
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from wave_20260704 import repaint
from wave2_20260704 import shrink

PAINTS = [(c['id'], c['hex']) for c in
          json.load(open(os.path.join(ROOT, 'data', 'cosmetics.json')))['colors']]

hero = np.array(Image.open(os.path.join(ROOT, 'assets', 'art', 'bike',
                                        'bike_topdown_hero.png')).convert('RGBA')).astype(float)
base = shrink(hero, 92)
h, w = base.shape[:2]
PAD = 3
ch, cw = h + PAD * 2 + 1, w + PAD * 2   # +1 row for the bob shift

for pid, phex in PAINTS:
    f = repaint(base.copy(), phex)
    strip = np.zeros((ch, cw * 3, 4), float)
    for i, dy in enumerate((0, 1, 0)):   # subtle ride bob
        y0, x0 = PAD + dy, i * cw + PAD
        strip[y0:y0 + h, x0:x0 + w] = f
    out = os.path.join(ROOT, 'assets', 'art', 'trackbike', 'trackbike_%s_strip.png' % pid)
    Image.fromarray(np.clip(strip, 0, 255).astype('uint8'), 'RGBA').save(out, optimize=True)
    print('rebuilt', out.split('/')[-1], strip.shape[1], 'x', strip.shape[0])
