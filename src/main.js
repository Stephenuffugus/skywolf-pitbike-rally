/* Boot: load data + atlas + save, bind UI/input, run the loop. */
import { S } from './state.js';
import { loadData } from './data.js';
import { loadSave } from './save.js';
import { loadAtlas } from './sprites.js';
import { bindUI, setScreen } from './ui.js';
import { bindInput, applyPlayerInput } from './input.js';
import { updateRace } from './race.js';
import { render, resize } from './render.js';
import { startRace } from './race.js';

async function boot() {
  await loadData();
  loadSave();
  try { await loadAtlas(); } catch (e) { console.warn('atlas failed to load — procedural fallback', e); }
  bindUI();
  bindInput();
  resize();
  setScreen('menu');
  // debug/test handle (harmless in production; used by smoke tests)
  window.__PBR = { S, startRace, setScreen };

  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - lastT) / 1000);
    lastT = now;
    if (S.race.active && S.currentScreen === 'race') {
      applyPlayerInput();
      updateRace(dt);
      render();
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
