#!/usr/bin/env python3
"""wave2_20260704.py — process Stephen's full-res art drop
(In game art-20260704T142036Z zip; individual originals of the earlier
composite sheet PLUS the new Wave 2 terrain tiles and Wave 5 backgrounds).

Everything that duplicates a wave_20260704.py cut is RE-CUT here at 4-6x
resolution under the SAME filename (never-overshrink rule); terrain and
backgrounds are new categories:

  assets/terrain/terrain_*.jpg + ground_meadow.jpg   512px seam-fixed tiles
  assets/bg/bg_{menu,garage,podium}.jpg              sliced from the 3-row scene sheet
  assets/art/fx/fx_*_strip.png                       hi-res replacements, same
                                                     names + frame counts already
                                                     in build_atlas STRIP_FRAMES
  assets/art/props/prop_*                            hi-res recuts (8)
  assets/art/pickup/pickup_sprocket*_strip.png       hi-res recuts
  assets/art/ui/ui_part_* + ui_logo_lockup           hi-res recuts
  assets/art/bike/*_hero.png                         top-down pose stashes

Run: python3 tools/wave2_20260704.py   then: python3 tools/build_atlas.py
"""
import os, sys, json
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = os.path.join(ROOT, 'assets', 'art')
DROP = os.path.join(os.path.dirname(ROOT), 'artdrop0704', 'In game art')

sys.path.insert(0, HERE)
from wave_20260704 import defringe, heal_holes, trim, islands, strip_of

F = {
    'rider_hero':       'file_0000000003d471f78f88e5c62e5ce945.png',
    'terrain_whoops':   'file_00000000042871f79e8bb8f38c465f31.png',
    'bike_norider':     'file_000000000df871f7886ec34e8e1800a6.png',
    'terrain_water_a':  'file_00000000133871f78e50f1cbed3ca840.png',
    'terrain_water_b':  'file_000000001a5071f7a1a8def91f26cc87.png',
    'terrain_mud_a':    'file_000000002c2471f598af7736b64e5b6b.png',
    'ground_meadow':    'file_00000000463471f78b801872d5b2e8a2.png',
    'terrain_mud_b':    'file_000000004edc71f5a436ac1fc91291e2.png',
    'fx_water_splash':  'file_0000000062a071f5bd2555e5d57e6f67.png',
    'terrain_dirt_loam':'file_000000006c6c71f599f6998051990471.png',
    'bg_scenes':        'file_000000006c7c71f5a0d6f98e7e1cd376.png',
    'terrain_sand':     'file_00000000aaac71f7bf0999afeea2b1cf.png',
    'fx_mud_splat':     'file_00000000af9471f5a26f7de1390ea620.png',
    'terrain_berm_edge':'file_00000000b64071f7bde0ba0fd036280e.png',
    'fx_spark_hit':     'file_00000000c06c71f78979af83afe877d2.png',
    'props_sheet':      'file_00000000c20c71f5b19267884c2d2595.png',
    'parts_sheet':      'file_00000000cd8471f7958c562d0d40ffed.png',
    'terrain_hardpack': 'file_00000000ead871f5a2d27efb625c89f0.png',
    'fx_dust_puff':     'file_00000000f05871f5a90bb68c010f7af9.png',
    'fx_nitro_flame':   'file_00000000f57871f59b070755ab4ab329.png',
    'rider_sprawl':     'file_00000000fa2c71f5a0d834ec7a168b9a.png',
    'fx_gold_sparkle':  'file_00000000fc1071f78ee69f464b955498.png',
}

written, warnings = [], []


def src(key):
    return np.array(Image.open(os.path.join(DROP, F[key])).convert('RGB')).astype(float)


def key_magenta(rgb):
    """RGB sheet -> RGBA with soft magenta key + despill, then defringe."""
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    key = np.median(border, axis=0)
    d = np.sqrt(((rgb - key) ** 2).sum(axis=-1))
    alpha = np.clip((d - 60) / 90.0, 0, 1) * 255
    a = np.dstack([rgb, alpha])
    return defringe(a)


def kill_gridlines(a, scale):
    """Erase thin low-saturation separator lines (parts sheet has a faint grid)."""
    from scipy import ndimage
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    grayish = (a[..., 3] > 0) & (mx - mn < 36) & (mx > 90)
    lab, n = ndimage.label(grayish)
    if not n:
        return a
    sl = ndimage.find_objects(lab)
    for i, s in enumerate(sl):
        hh, ww = s[0].stop - s[0].start, s[1].stop - s[1].start
        if min(hh, ww) < 8 * scale and max(hh, ww) > 60 * scale:
            a[..., 3][lab == (i + 1)] = 0
    return a


def shrink(a, maxdim):
    hh, ww = a.shape[:2]
    if max(hh, ww) <= maxdim:
        return a
    r = maxdim / float(max(hh, ww))
    im = Image.fromarray(np.clip(a, 0, 255).astype('uint8'), 'RGBA')
    return np.array(im.resize((max(1, int(ww * r)), max(1, int(hh * r))),
                              Image.LANCZOS)).astype(float)


def save_rgba(a, rel):
    p = os.path.join(ART, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    Image.fromarray(np.clip(a, 0, 255).astype('uint8'), 'RGBA').save(p, optimize=True)
    written.append(rel)


def components2d(a, minarea=400):
    """2D connected components on alpha (dilated so nearby bits merge), row-major order."""
    from scipy import ndimage
    solid = a[..., 3] > 40
    merged = ndimage.binary_dilation(solid, iterations=14)
    lab, n = ndimage.label(merged)
    comps = []
    for s in ndimage.find_objects(lab):
        seg = trim(a[s])
        if seg.shape[0] * seg.shape[1] >= minarea and seg[..., 3].max() > 40:
            cy = (s[0].start + s[0].stop) / 2.0
            cx = (s[1].start + s[1].stop) / 2.0
            comps.append((cy, cx, seg))
    return comps


def rows_of(comps, tol):
    comps = sorted(comps, key=lambda c: c[0])
    rows = []
    for c in comps:
        if rows and abs(c[0] - rows[-1][0][0]) < tol:
            rows[-1].append(c)
        else:
            rows.append([c])
    return [[c[2] for c in sorted(r, key=lambda c: c[1])] for r in rows]


# ---------- 1. terrain tiles (seam-fixed, 512px JPG) ----------

def tileize(rgb, out):
    im = Image.fromarray(np.clip(rgb, 0, 255).astype('uint8'))
    side = min(im.size)
    im = im.crop(((im.width - side) // 2, (im.height - side) // 2,
                  (im.width + side) // 2, (im.height + side) // 2)).resize((512, 512), Image.LANCZOS)
    a = np.array(im).astype(float)
    # wrap-blend the seams: cross-fade each edge into the opposite edge
    band = 48
    ramp = (np.arange(band) / float(band))[:, None, None]  # 0 at edge -> 1 inward
    rolled = np.roll(a, 256, axis=0)
    a[:band] = a[:band] * ramp + rolled[:band] * (1 - ramp)
    a[-band:] = a[-band:] * ramp[::-1] + rolled[-band:] * (1 - ramp[::-1])
    rolled = np.roll(a, 256, axis=1)
    rampx = ramp.transpose(1, 0, 2)
    a[:, :band] = a[:, :band] * rampx + rolled[:, :band] * (1 - rampx)
    a[:, -band:] = a[:, -band:] * rampx[:, ::-1] + rolled[:, -band:] * (1 - rampx[:, ::-1])
    p = os.path.join(ROOT, 'assets', 'terrain', out + '.jpg')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    Image.fromarray(np.clip(a, 0, 255).astype('uint8')).save(p, quality=87, optimize=True)
    written.append('terrain/' + out + '.jpg')


def do_terrain():
    for k in ['terrain_dirt_loam', 'terrain_berm_edge', 'terrain_mud_a', 'terrain_mud_b',
              'terrain_whoops', 'terrain_hardpack', 'terrain_water_a', 'terrain_water_b',
              'terrain_sand', 'ground_meadow']:
        tileize(src(k), k)


# ---------- 2. backgrounds: slice 3-row scene sheet on dark separators ----------

def do_backgrounds():
    rgb = src('bg_scenes')
    lum = rgb.mean(axis=(1, 2))
    dark = lum < 18
    # find split bands (>=3px of near-black spanning full width)
    splits, run = [], None
    for i, v in enumerate(dark):
        if v and run is None:
            run = i
        elif not v and run is not None:
            if i - run >= 3 and 0.15 * len(dark) < (run + i) / 2 < 0.9 * len(dark):
                splits.append((run + i) // 2)
            run = None
    if len(splits) != 2:
        # fallback: fixed thirds observed in the contact sheet
        splits = [int(rgb.shape[0] * 0.47), int(rgb.shape[0] * 0.72)]
        warnings.append('bg_scenes: separator detect failed, used fixed splits')
    names = ['bg_menu', 'bg_garage', 'bg_podium']
    edges = [0] + splits + [rgb.shape[0]]
    for i, name in enumerate(names):
        seg = rgb[edges[i]:edges[i + 1]]
        keep = seg.mean(axis=(1, 2)) > 14   # shave the black separator rows
        y0, y1 = np.argmax(keep), len(keep) - np.argmax(keep[::-1])
        seg = seg[y0:y1]
        p = os.path.join(ROOT, 'assets', 'bg', name + '.jpg')
        os.makedirs(os.path.dirname(p), exist_ok=True)
        Image.fromarray(np.clip(seg, 0, 255).astype('uint8')).save(p, quality=88, optimize=True)
        written.append('bg/%s.jpg (%dx%d)' % (name, seg.shape[1], seg.shape[0]))


# ---------- 3. fx strips: hi-res replacements, same names/frame counts ----------

FX = {'fx_water_splash': 4, 'fx_mud_splat': 3, 'fx_spark_hit': 3,
      'fx_dust_puff': 4, 'fx_nitro_flame': 3, 'fx_gold_sparkle': 4}
EARTHY = ('fx_dust_puff', 'fx_mud_splat')


def unpink(a):
    """Source dust/mud frames carry magenta contamination: opaque pink wisps
    the key can't drop, plus spray the defringe desaturated to gray. Remap
    both onto the dust/mud brown, preserving darkness and highlights."""
    from wave_20260704 import rgb_to_hsv, hsv_to_rgb
    h, s, v = rgb_to_hsv(a)
    on = a[..., 3] > 0
    pink = on & ((h > 250) | (h < 15)) & (s > 0.08)
    gray = on & (s < 0.16) & (v > 0.15) & (v < 0.9)
    bad = pink | gray
    if not bad.any():
        return a
    h2 = np.where(bad, 30.0, h)
    s2 = np.where(pink, np.minimum(s, 0.42), np.where(gray, 0.40, s))
    a[..., :3] = np.where(bad[..., None], hsv_to_rgb(h2, s2, v), a[..., :3])
    return a


def do_fx():
    for k, n in FX.items():
        a = key_magenta(src(k))
        if k in EARTHY:
            a = unpink(a)
        # clusters are unevenly spaced: prefer alpha islands when the count
        # matches, else fall back to equal-width slices
        frames = islands(a, gap=int(a.shape[1] * 0.015))
        if len(frames) != n:
            w = a.shape[1] // n
            frames = [trim(a[:, i * w:(i + 1) * w]) for i in range(n)]
        frames = [shrink(f, 168) for f in frames if f.shape[0] > 4 and f.shape[1] > 4]
        if len(frames) != n:
            warnings.append('%s: expected %d frames, got %d — kept old cut' % (k, n, len(frames)))
            continue
        save_rgba(strip_of(frames), 'fx/%s_strip.png' % k)


# ---------- 4. props sheet: 8 hi-res recuts ----------

def do_props():
    a = key_magenta(src('props_sheet'))
    rows = rows_of(components2d(a), tol=a.shape[0] * 0.18)
    layout = [['prop_ramp_kicker', 'prop_ramp_tabletop', 'prop_start_arch'],
              ['prop_haybale', 'prop_tire_stack', 'prop_gate_arrow_l', 'prop_gate_arrow_r'],
              ['prop_puddle']]
    maxd = {'prop_start_arch': 340, 'prop_ramp_kicker': 260, 'prop_ramp_tabletop': 260,
            'prop_puddle': 240}
    if [len(r) for r in rows] != [len(r) for r in layout]:
        warnings.append('props_sheet layout %s != expected %s — kept old cuts'
                        % ([len(r) for r in rows], [len(r) for r in layout]))
        return
    for rnames, rsegs in zip(layout, rows):
        for name, seg in zip(rnames, rsegs):
            save_rgba(shrink(heal_holes(seg), maxd.get(name, 220)), 'props/%s.png' % name)


# ---------- 5. parts sheet: sprocket strips + logo + 10 part icons ----------

def do_parts():
    a = key_magenta(src('parts_sheet'))
    solid = a[..., 3] > 40
    prof = solid.mean(axis=1)
    bands, start = [], None
    for i, v in enumerate(prof > 0.005):
        if v and start is None:
            start = i
        elif not v and start is not None:
            bands.append((start, i)); start = None
    if start is not None:
        bands.append((start, len(prof)))
    bands = [b for b in bands if b[1] - b[0] > 12]   # drop grid-line slivers
    if len(bands) != 5:
        warnings.append('parts_sheet: %d bands (want 5) — kept old cuts' % len(bands))
        return
    minw = a.shape[1] * 0.013     # drop vertical grid-line slivers inside a band
    cells = [[seg for seg in islands(a[b0:b1], gap=6) if seg.shape[1] > minw]
             for b0, b1 in bands]
    counts = [len(c) for c in cells]
    if counts[0] != 4 or counts[1] != 4 or counts[3] != 5 or counts[4] != 5:
        warnings.append('parts_sheet cells %s (want [4,4,*,5,5]) — kept old cuts' % counts)
        return
    for r, rel in zip(cells[:2], ['pickup/pickup_sprocket_strip.png',
                                  'pickup/pickup_sprocket_gold_strip.png']):
        save_rgba(strip_of([shrink(heal_holes(f), 120) for f in r]), rel)
    names = ['engine', 'exhaust', 'carb', 'forks', 'tire',
             'sprocket', 'frame', 'brakes', 'nitro', 'armor']
    for i, seg in enumerate(cells[3] + cells[4]):
        save_rgba(shrink(heal_holes(seg), 160), 'ui/ui_part_%s.png' % names[i])
    b0, b1 = bands[2]
    save_rgba(shrink(trim(a[b0:b1]), 800), 'ui/ui_logo_lockup.png')


# ---------- 6. top-down pose stashes ----------

def do_poses():
    for k, rel, maxd in [('rider_hero', 'bike/bike_topdown_hero.png', 640),
                         ('bike_norider', 'bike/bike_topdown_norider.png', 640),
                         ('rider_sprawl', 'bike/rider_sprawl_hero.png', 480)]:
        save_rgba(shrink(heal_holes(trim(key_magenta(src(k)))), maxd), rel)


if __name__ == '__main__':
    do_terrain()
    do_backgrounds()
    do_fx()
    do_props()
    do_parts()
    do_poses()
    print('wrote %d files:' % len(written))
    for w in written:
        print('  ', w)
    if warnings:
        print('WARNINGS:')
        for w in warnings:
            print('  !', w)
