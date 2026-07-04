# Changelog

## 2026-07-04 — v1.0 initial port (Phase 1 complete)
- Repo scaffold per handoff §6.2; all tuning data extracted to `data/*.json`.
- Ported the single-file prototype into ES modules unchanged in feel:
  physics, AI, collisions, 8 tracks, HUD, touch/keyboard input, synth audio.
- Added persistence: versioned localStorage save (`skywolf.pitbikerally.save.v1`),
  wallet/parts/paint/plate/bests/stats survive reload; export/import stubs.
- Art: 338 AI-cut sprites semantically renamed (assets/art/rename_manifest.json),
  magenta-fringe + baked-caption cleanup, 282-sprite packed atlas.
- Art-swapped pickups (spinning coin, nitro can), FX (dust, mud, land poof,
  collect burst, sparks), per-theme track dressing; menus/garage/results get
  side-view bike heroes with paint hue-shift.
- Portal wiring: SWS embed snippet, SWS_EXIT menu button, Sunbeam SDK earns
  (win 4 / podium 2, 30/day local cap), favicon.
- Fixed from prototype: results screen losing its skew style; audio context
  now suspends when the tab hides.
- Headless smoke test (race → payout → buy part → reload persistence): zero
  console errors.
