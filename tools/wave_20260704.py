#!/usr/bin/env python3
"""wave_20260704.py — cut + wire prep for Stephen's all-waves contact sheet
(assets/art/raw/sheet_allwaves_20260704.png, ChatGPT, answers ART_REQUEST_CHATGPT.md).

Reproducible: re-slices the raw sheet with sheet_slicer, then classifies the
numbered cuts (mapping verified by eye against the labeled contact sheet),
transforms, and files semantic PNGs into assets/art/. Key outputs:

  trackbike/trackbike_<paint>_strip.png   4-frame TOP-DOWN ride strip x 9 paints
                                          (flipped to face RIGHT, registered,
                                          green keyed to each cosmetics color)
  pickup/pickup_sprocket_strip.png        spinning sprocket coin (4f)
  pickup/pickup_sprocket_gold_strip.png   golden sprocket (4f)
  props/prop_*                            kicker/tabletop ramps, start arch,
                                          haybale, tire stack, gate arrows,
                                          3 billboards, puddle
  ui/ui_part_*                            10 part-slot icons (DOM <img>)
  ui/ui_trophy_* / ui_medal_* / ui_helmet_* / ui_logo_lockup
  bike/                                   downed variants, tumble frames,
                                          victory poses (stashed, unwired)

Run: python3 tools/wave_20260704.py   then: python3 tools/build_atlas.py
"""
import os, sys, json, tempfile
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = os.path.join(ROOT, 'assets', 'art')
RAW = os.path.join(ART, 'raw', 'sheet_allwaves_20260704.png')
sys.path.insert(0, HERE)
import sheet_slicer

PAINTS = [(c['id'], c['hex']) for c in
          json.load(open(os.path.join(ROOT, 'data', 'cosmetics.json')))['colors']]


# ---------- pixel helpers ----------

def load(n, cutdir):
    return np.array(Image.open(os.path.join(cutdir, 'sprite_%03d.png' % n))
                    .convert('RGBA')).astype(float)


def save(a, rel):
    p = os.path.join(ART, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    Image.fromarray(np.clip(a, 0, 255).astype('uint8'), 'RGBA').save(p, optimize=True)
    return rel


def defringe(a):
    """Kill leftover magenta/pink halo AND baked magenta-tinted shadows.
    Magenta-band pixels die only NEAR transparency (fringe + under-shadows
    touch the outside); interior dark pixels with a pink cast survive."""
    from scipy import ndimage
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    h, s, v = rgb_to_hsv(a)
    near_out = ndimage.binary_dilation(al < 40, iterations=7)
    magband = (h > 262) & (h < 352) & (s > 0.20) & near_out
    pinkish = (r > 60) & (b > 50) & (g < np.minimum(r, b) * 0.55) & (np.abs(r - b) < 90)
    strong = magband | (pinkish & ((g < np.minimum(r, b) * 0.35) | (al < 140)))
    a[..., 3] = np.where(strong, 0, al)
    m = (r + g + b) / 3
    for ch in (0, 1, 2):
        a[..., ch] = np.where(pinkish & ~strong, m, a[..., ch])
    # drop barely-there alpha dust
    a[..., 3] = np.where(a[..., 3] < 40, 0, a[..., 3])
    return a


def heal_holes(a):
    """Interior transparent speckles (soft-key ate dark pixels): fill any hole
    not connected to the outside, inpainting color from solid neighbors."""
    from scipy import ndimage
    solid = a[..., 3] > 40
    holes = ndimage.binary_fill_holes(solid) & ~solid
    k = np.ones((3, 3))
    for _ in range(8):
        if not holes.any():
            break
        cnt = ndimage.convolve(solid.astype(float), k, mode='constant')
        edge = holes & (cnt > 0)
        if not edge.any():
            break
        for ch in range(3):
            s = ndimage.convolve(a[..., ch] * solid, k, mode='constant')
            a[..., ch] = np.where(edge, s / np.maximum(cnt, 1), a[..., ch])
        a[..., 3] = np.where(edge, 255, a[..., 3])
        solid |= edge
        holes &= ~edge
    return a


def trim(a, thr=40):
    ys, xs = np.where(a[..., 3] > thr)
    if len(ys) == 0:
        return a
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def rgb_to_hsv(a):
    r, g, b = a[..., 0] / 255, a[..., 1] / 255, a[..., 2] / 255
    mx, mn = np.max(a[..., :3] / 255, axis=-1), np.min(a[..., :3] / 255, axis=-1)
    d = mx - mn + 1e-9
    h = np.zeros_like(mx)
    h = np.where(mx == r, ((g - b) / d) % 6, h)
    h = np.where(mx == g, (b - r) / d + 2, h)
    h = np.where(mx == b, (r - g) / d + 4, h)
    return h * 60, d / (mx + 1e-9), mx


def hsv_to_rgb(h, s, v):
    c = v * s
    x = c * (1 - np.abs((h / 60) % 2 - 1))
    m = v - c
    z = np.zeros_like(h)
    conds = [(h < 60, (c, x, z)), (h < 120, (x, c, z)), (h < 180, (z, c, x)),
             (h < 240, (z, x, c)), (h < 300, (x, z, c)), (h >= 300, (c, z, x))]
    r, g, b = z.copy(), z.copy(), z.copy()
    done = np.zeros(h.shape, bool)
    for cond, (rr, gg, bb) in conds:
        pick = cond & ~done
        r, g, b = np.where(pick, rr, r), np.where(pick, gg, g), np.where(pick, bb, b)
        done |= cond
    return np.stack([(r + m) * 255, (g + m) * 255, (b + m) * 255], axis=-1)


def repaint(a, hexcol):
    """Green jersey/fairing (#00FF00 family per the art request) -> paint color.
    Hue window 62-175 deg dodges the yellow number plate (~48) and tire browns."""
    t = a.copy()
    h, s, v = rgb_to_hsv(t)
    mask = (h > 62) & (h < 175) & (s > 0.22) & (v > 0.12) & (t[..., 3] > 30)
    n = int(hexcol.lstrip('#'), 16)
    pr, pg, pb = (n >> 16) & 255, (n >> 8) & 255, n & 255
    ph, ps, pv = rgb_to_hsv(np.array([[[pr, pg, pb, 255]]], float))
    ph, ps, pv = float(ph[0, 0]), float(ps[0, 0]), float(pv[0, 0])
    oh = np.where(mask, ph, h)
    os_ = np.where(mask, ps * (0.55 + 0.45 * s), s)
    # lift lightness for pale paints (white) so they read bright, not gray
    lift = 0.30 + 0.95 * pv if pv > 0.85 and ps < 0.2 else 0.30 + 0.85 * pv
    ov = np.where(mask, np.clip(v * lift, 0, 1), v)
    t[..., :3] = hsv_to_rgb(oh, os_, ov)
    return t


def islands(a, axis=1, thr=40, gap=2):
    """Split one image into content islands along an axis (for multi-item cells)."""
    prof = (a[..., 3] > thr).sum(axis=0 if axis == 1 else 1)
    on = prof > 0
    runs, start = [], None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append((start, i)); start = None
    if start is not None:
        runs.append((start, len(on)))
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] <= gap:
            merged[-1] = (merged[-1][0], r[1])
        else:
            merged.append(list(r))
    out = []
    for x0, x1 in merged:
        seg = a[:, x0:x1] if axis == 1 else a[x0:x1, :]
        seg = trim(seg)
        if seg.shape[0] * seg.shape[1] > 60:
            out.append(seg)
    return out


def strip_of(frames, pad=4):
    """Equal-cell horizontal strip, each frame centered by alpha centroid."""
    cw = max(f.shape[1] for f in frames) + pad * 2
    ch = max(f.shape[0] for f in frames) + pad * 2
    cw += cw % 2
    ch += ch % 2
    out = np.zeros((ch, cw * len(frames), 4), float)
    for i, f in enumerate(frames):
        al = (f[..., 3] / 255.0) ** 3 * 255  # bias register to solid pixels
        tot = al.sum() + 1e-9
        cy = (np.arange(f.shape[0])[:, None] * al).sum() / tot
        cx = (np.arange(f.shape[1])[None, :] * al).sum() / tot
        y0 = int(round(ch / 2 - cy)); x0 = int(round(i * cw + cw / 2 - cx))
        y0 = max(0, min(ch - f.shape[0], y0))
        x0 = max(i * cw, min((i + 1) * cw - f.shape[1], x0))
        out[y0:y0 + f.shape[0], x0:x0 + f.shape[1]] = np.maximum(
            out[y0:y0 + f.shape[0], x0:x0 + f.shape[1]], f)
    return out


# ---------- main ----------

def main():
    cutdir = tempfile.mkdtemp(prefix='wave0704_')
    sheet_slicer.main(RAW, cutdir)
    manifest_p = os.path.join(ART, 'rename_manifest.json')
    manifest = json.load(open(manifest_p))
    written = []

    def file_out(a, rel, src_n):
        written.append(save(a, rel))
        manifest[rel] = 'sheet_allwaves_20260704.png#%03d' % src_n

    C = lambda n: defringe(load(n, cutdir))

    # --- Wave 1: top-down ride strip -> 9 paint variants ---
    # frame 3 of the generated strip drifted (different pose/palette); the
    # remaining three make a clean bob cycle
    ride = [trim(heal_holes(np.array(
                Image.fromarray(np.clip(C(n), 0, 255).astype('uint8'))
                .transpose(Image.FLIP_LEFT_RIGHT)).astype(float)))
            for n in (1, 2, 4)]
    for pid, phex in PAINTS:
        file_out(strip_of([repaint(f, phex) for f in ride]),
                 'trackbike/trackbike_%s_strip.png' % pid, 1)

    # downed / tumble / victory / drifted poses -> stashed for future wiring
    for n, rel in [(9, 'bike/bike_top_downed_a.png'), (15, 'bike/bike_top_downed_b.png'),
                   (16, 'bike/bike_top_downed_c.png'), (17, 'bike/bike_top_downed_d.png'),
                   (22, 'bike/rider_tumble_f01.png'), (23, 'bike/rider_tumble_f02.png'),
                   (24, 'bike/rider_tumble_f03.png'), (25, 'bike/rider_tumble_f04.png'),
                   (46, 'bike/bikeview_victory_wheelie_b.png'),
                   (47, 'bike/bikeview_victory_burnout_b.png')]:
        file_out(trim(heal_holes(C(n))), rel, n)

    # --- Wave 3 props + Wave 2 puddle ---
    for n, rel in [(5, 'props/prop_ramp_kicker.png'), (6, 'props/prop_ramp_tabletop.png'),
                   (7, 'props/prop_start_arch.png'), (11, 'props/prop_haybale.png'),
                   (12, 'props/prop_tire_stack.png'), (13, 'props/prop_gate_arrow_l.png'),
                   (14, 'props/prop_gate_arrow_r.png'), (18, 'props/prop_billboard_wolfburn.png'),
                   (19, 'props/prop_billboard_howler.png'), (20, 'props/prop_billboard_alpha.png'),
                   (21, 'props/prop_puddle.png')]:
        file_out(trim(C(n)), rel, n)

    # --- Wave 4 pickups: split each strip cell into 4 equal frames ---
    for n, rel in [(26, 'pickup/pickup_sprocket_strip.png'),
                   (27, 'pickup/pickup_sprocket_gold_strip.png')]:
        fr = islands(C(n))
        if len(fr) != 4:  # coins touching -> fall back to 4 even slices
            a = trim(C(n)); w = a.shape[1] // 4
            fr = [trim(a[:, i * w:(i + 1) * w]) for i in range(4)]
        file_out(strip_of(fr), rel, n)

    # --- Wave 4 UI: part icons (DOM <img>, also atlas-packed harmlessly) ---
    part_icons = ['engine', 'exhaust', 'carb', 'forks', 'tire',
                  'sprocket', 'frame', 'brakes', 'nitro', 'armor']
    for i, slot in enumerate(part_icons):
        file_out(trim(C(31 + i)), 'ui/ui_part_%s.png' % slot, 31 + i)

    # trophies: #43 bronze standalone; #44 = silver/gold/wolfsden in one cell
    file_out(trim(C(43)), 'ui/ui_trophy_bronze.png', 43)
    tri = islands(C(44))
    for seg, name in zip(tri, ['silver', 'gold', 'wolfsden'][:len(tri)]):
        file_out(seg, 'ui/ui_trophy_%s.png' % name, 44)

    # medals: #45 = bronze/silver/gold
    med = islands(C(45))
    for seg, name in zip(med, ['bronze', 'silver', 'gold'][:len(med)]):
        file_out(seg, 'ui/ui_medal_%s.png' % name, 45)

    # helmets: #28 = classic/retro/wolf-ears (stash for cosmetics phase)
    hel = islands(C(28))
    for seg, name in zip(hel, ['classic', 'retro', 'wolf'][:len(hel)]):
        file_out(seg, 'ui/ui_helmet_%s.png' % name, 28)

    # logo: crop the garbled "studio" microtext line off the top
    logo = trim(C(30))
    file_out(trim(logo[int(logo.shape[0] * 0.20):]), 'ui/ui_logo_lockup.png', 30)

    # composites/drifted views kept raw for future recuts
    for n in (8, 10, 29, 41, 42, 48):
        file_out(trim(C(n)), 'misc/wave0704_cell_%03d.png' % n, n)

    json.dump(manifest, open(manifest_p, 'w'), indent=1, sort_keys=True)
    print('wrote %d files:' % len(written))
    for w in written:
        print('  ', w)


if __name__ == '__main__':
    main()
