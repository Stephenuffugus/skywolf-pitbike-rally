/* Boot: load data + atlas + save, bind UI/input, run the loop. */
import { S } from './state.js';
import { loadData } from './data.js';
import { loadSave } from './save.js';
import { loadAtlas, loadTerrain } from './sprites.js';
import { bindUI, setScreen } from './ui.js';
import { bindInput, applyPlayerInput } from './input.js';
import { updateRace } from './race.js';
import { render, resize } from './render.js';
import { startRace } from './race.js';

async function boot() {
  // set the debug/watchdog handle BEFORE any await: the index.html watchdog
  // uses its absence to detect a dead module graph (mixed-version cache)
  window.__PBR = { S, startRace, setScreen };
  await loadData();
  loadSave();
  // parallel: terrain never depends on the atlas, and both gate the prerender
  await Promise.all([
    loadAtlas().catch(e => console.warn('atlas failed to load — procedural fallback', e)),
    loadTerrain().catch(e => console.warn('terrain tiles failed — flat colors', e)),
  ]);
  bindUI();
  bindInput();
  resize();
  setScreen('menu');

  let lastT = performance.now();
  function frame(now) {
    // one bad frame must never kill the loop (a dead rAF chain freezes the
    // countdown forever) — log once, skip the frame, keep running
    try {
      const dt = Math.min(0.033, (now - lastT) / 1000);
      lastT = now;
      if (S.race.active && S.currentScreen === 'race') {
        applyPlayerInput();
        updateRace(dt);
        render();
      }
    } catch (e) {
      if (!window.__PBR_FRAME_ERR) {
        window.__PBR_FRAME_ERR = true;
        console.error('frame error (loop kept alive):', e);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot().catch(e => {
  console.error('Pit Bike Rally failed to boot:', e);
  const el = document.getElementById('scr-menu');
  el.classList.add('show');
  const foot = document.getElementById('menu-stats');
  if (foot) foot.textContent = 'Load error — check connection and refresh.';
});
