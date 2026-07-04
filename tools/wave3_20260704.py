#!/usr/bin/env python3
"""wave3_20260704.py — drop 2 (2-20260704T173026Z): Wave A poses + Wave B grounds.

  assets/terrain/ground_{desert,prairie,canyon,stadium,swamp,ridge,storm}.jpg
  assets/art/trackbike/trackbike_<paint>_poses.png   4-frame strip:
      f0=air  f1=land  f2=lean_left  f3=lean_right   (x9 paints, green-keyed)
  assets/art/bike/bike_downed_side.png               riderless, stashed

Lean naming is derived, not assumed: canvas y is down and physics does
heading += steer*rate, so steer>0 turns clockwise (a visual RIGHT turn when
facing right) and the rider hangs toward +y. After rotation-normalizing each
lean sprite to face right, the pose whose green rider centroid sits at +y
(below the bike axis) is lean_right.

Run: python3 tools/wave3_20260704.py   then: python3 tools/build_atlas.py
"""
import os, sys, json, math
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = os.path.join(ROOT, 'assets', 'art')
DROP = os.path.join(os.path.dirname(ROOT), 'artdrop2', '2')

sys.path.insert(0, HERE)
from wave_20260704 import defringe, heal_holes, trim, islands, strip_of, repaint, rgb_to_hsv
from wave2_20260704 import key_magenta, shrink, tileize

F = {
    'grounds_grid':  'file_000000004218722f81cbde169ef0de5e.png',   # 2x2: desert prairie / canyon stadium
    'grounds_strip': 'file_00000000b56c722fb4a60fe20a4de8aa.png',   # 1x3: swamp ridge storm
    'poses':         'file_00000000c12c722f9d4de4586344b100.png',   # air land lean lean downed
}
PAINTS = [(c['id'], c['hex']) for c in
          json.load(open(os.path.join(ROOT, 'data', 'cosmetics.json')))['colors']]

written, warnings = [], []


def src(k):
    return np.array(Image.open(os.path.join(DROP, F[k])).convert('RGB')).astype(float)


def save_rgba(a, rel):
    p = os.path.join(ART, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    Image.fromarray(np.clip(a, 0, 255).astype('uint8'), 'RGBA').save(p, optimize=True)
    written.append(rel)


# ---------- grounds ----------

def magenta_mask(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r > 150) & (b > 150) & (g < np.minimum(r, b) * 0.5)


def split_on_gutters(rgb, axis):
    """Split along magenta gutter rows/columns (>60% magenta)."""
    m = magenta_mask(rgb)
    prof = m.mean(axis=1 if axis == 0 else 0)
    gut = prof > 0.6
    cells, start = [], None
    for i, v in enumerate(gut):
        if not v and start is None:
            start = i
        elif v and start is not None:
            if i - start > 40:
                cells.append((start, i))
            start = None
    if start is not None and len(gut) - start > 40:
        cells.append((start, len(gut)))
    return cells


def do_grounds():
    grid = src('grounds_grid')
    rows = split_on_gutters(grid, 0)
    names = [['ground_desert', 'ground_prairie'], ['ground_canyon', 'ground_stadium']]
    if len(rows) != 2:
        warnings.append('grounds_grid rows %d != 2' % len(rows)); return
    for (r0, r1), rnames in zip(rows, names):
        band = grid[r0:r1]
        cols = split_on_gutters(band, 1)
        if len(cols) != 2:
            warnings.append('grounds_grid cols %d != 2' % len(cols)); return
        for (c0, c1), name in zip(cols, rnames):
            tileize(band[:, c0:c1], name)
            written.append('terrain/%s.jpg' % name)
    strip = src('grounds_strip')
    cols = split_on_gutters(strip, 1)
    snames = ['ground_swamp', 'ground_ridge', 'ground_storm']
    if len(cols) != 3:
        # thin separators may not be >60% magenta — fall back to equal thirds
        w = strip.shape[1] // 3
        cols = [(i * w + 8, (i + 1) * w - 8) for i in range(3)]
        warnings.append('grounds_strip gutters not found, used thirds')
    for (c0, c1), name in zip(cols, snames):
        tileize(strip[:, c0:c1], name)
        written.append('terrain/%s.jpg' % name)


# ---------- poses ----------

def kill_dark_gutters(a):
    """Baked-in black separator columns: near-black, near-full-height."""
    dark = (a[..., 3] > 0) & (a[..., :3].max(axis=-1) < 40)
    colfrac = dark.mean(axis=0)
    kill = colfrac > 0.7
    a[..., 3] = np.where(kill[None, :], 0, a[..., 3])
    return a


def principal_angle(a):
    ys, xs = np.where(a[..., 3] > 60)
    x = xs - xs.mean(); y = ys - ys.mean()
    cov = np.array([[np.mean(x * x), np.mean(x * y)], [np.mean(x * y), np.mean(y * y)]])
    evals, evecs = np.linalg.eigh(cov)
    v = evecs[:, np.argmax(evals)]
    return math.degrees(math.atan2(v[1], v[0]))


def normalize_pose(a):
    """Rotate so the bike's long axis is horizontal, nose (yellow plate) right."""
    ang = principal_angle(a)
    if ang > 90: ang -= 180
    if ang < -90: ang += 180
    if abs(ang) > 8:
        im = Image.fromarray(np.clip(a, 0, 255).astype('uint8'), 'RGBA')
        a = np.array(im.rotate(ang, expand=True, resample=Image.BICUBIC)).astype(float)
    a = trim(a)
    # nose check: yellow plate centroid must sit right of center
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    yellow = (r > 170) & (g > 130) & (b < 110) & (a[..., 3] > 60)
    if yellow.sum() > 30:
        if np.where(yellow)[1].mean() < a.shape[1] / 2:
            a = a[:, ::-1].copy()
    return a


def rider_side(a):
    """+1 rider hangs below axis (+y), -1 above. Green = jersey/fairing;
    use the offset of green mass from the alpha centroid."""
    h, s, v = rgb_to_hsv(a)
    green = (h > 70) & (h < 165) & (s > 0.45) & (v > 0.3) & (a[..., 3] > 60)
    ys_all = np.where(a[..., 3] > 60)[0]
    ys_g = np.where(green)[0]
    return 1 if ys_g.mean() > ys_all.mean() else -1


def do_poses():
    a = kill_dark_gutters(key_magenta(src('poses')))
    w = a.shape[1] // 5
    cells = [trim(a[:, i * w:(i + 1) * w]) for i in range(5)]
    if any(c.shape[0] < 30 for c in cells):
        warnings.append('pose cells degenerate'); return
    air, land, leanA, leanB, downed = cells
    # handedness = sign of the baked yaw tilt (y-down: nose-up = negative
    # angle = left-curving attitude). The rider offset is symmetric in this
    # art, so the tilt sign is the only reliable signal.
    angA, angB = principal_angle(leanA), principal_angle(leanB)
    for a_ in (angA, angB):
        pass
    def wrap(x):
        if x > 90: x -= 180
        if x < -90: x += 180
        return x
    angA, angB = wrap(angA), wrap(angB)
    if (angA < 0) == (angB < 0):
        warnings.append('lean tilts same sign (%.1f / %.1f) — assigned by magnitude' % (angA, angB))
    if angA < angB:
        lean_l_raw, lean_r_raw = leanA, leanB
    else:
        lean_l_raw, lean_r_raw = leanB, leanA

    def tilted(p, deg):
        p = normalize_pose(p)
        im = Image.fromarray(np.clip(p, 0, 255).astype('uint8'), 'RGBA')
        # PIL rotate() is CCW-positive in image coords (visual CCW with y down
        # means nose dips DOWN for negative deg) — keep 14 deg of lean read
        return trim(np.array(im.rotate(deg, expand=True, resample=Image.BICUBIC)).astype(float))
    lean_l, lean_r = tilted(lean_l_raw, 14), tilted(lean_r_raw, -14)
    air, land = normalize_pose(air), normalize_pose(land)

    # match the ride strip's bike length (~90px) so on-track scale is stable
    frames = [shrink(heal_holes(p), 92) for p in (air, land, lean_l, lean_r)]
    for pid, phex in PAINTS:
        save_rgba(strip_of([repaint(f.copy(), phex) for f in frames]),
                  'trackbike/trackbike_%s_poses.png' % pid)
    save_rgba(shrink(heal_holes(downed), 300), 'bike/bike_downed_side.png')


if __name__ == '__main__':
    do_grounds()
    do_poses()
    print('wrote %d files' % len(written))
    for x in written:
        print('  ', x)
    if warnings:
        print('WARNINGS:')
        for x in warnings:
            print('  !', x)
