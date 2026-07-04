/* Tiny Web Audio synth: engine drone + nitro zip. Ported unchanged. */
import { S } from './state.js';

let AC = null, engOsc = null, engGain = null, engFilter = null;

export function audioInit() {
  if (AC || S.G.muted) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    engOsc = AC.createOscillator(); engOsc.type = 'sawtooth';
    engFilter = AC.createBiquadFilter(); engFilter.type = 'lowpass'; engFilter.frequency.value = 600;
    engGain = AC.createGain(); engGain.gain.value = 0;
    engOsc.connect(engFilter); engFilter.connect(engGain); engGain.connect(AC.destination);
    engOsc.start();
  } catch (e) { AC = null; }
}

export function audioRace(on) {
  if (!AC || !engGain) return;
  engGain.gain.linearRampToValueAtTime(on && !S.G.muted ? 0.045 : 0, AC.currentTime + 0.3);
}

export function audioTick() {
  if (!AC || !engOsc || !S.bikes[0]) return;
  const p = S.bikes[0];
  const f = 55 + (p.speed / Math.max(200, p.stats.top)) * 150 + (p.nitroT > 0 ? 40 : 0);
  engOsc.frequency.setTargetAtTime(f, AC.currentTime, 0.05);
}

export function audioNitro() {
  if (!AC || S.G.muted) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'square'; o.frequency.value = 220;
    o.frequency.exponentialRampToValueAtTime(880, AC.currentTime + 0.25);
    g.gain.value = 0.06; g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.3);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + 0.32);
  } catch (e) { }
}

/* Suspend the context when the tab hides — thermal etiquette. */
document.addEventListener('visibilitychange', () => {
  if (!AC) return;
  if (document.hidden) { AC.suspend().catch(() => {}); }
  else { AC.resume().catch(() => {}); }
});
