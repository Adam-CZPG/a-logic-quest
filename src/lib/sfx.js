const KEY = 'mathpuzzle_sound';

export function isSoundOn() {
  return (typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : 'on') !== 'off';
}

export function toggleSound() {
  const on = !isSoundOn();
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
  return on;
}

export function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
}

let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone({ freq = 440, dur = 0.15, type = 'sine', gain = 0.12, when = 0, slideTo = null }) {
  const c = getCtx();
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Pleasant rising scale — pitch climbs as the expression grows
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];

export function playTap(index = 0) {
  if (!isSoundOn()) return;
  try {
    const f = SCALE[Math.min(index, SCALE.length - 1)];
    tone({ freq: f, dur: 0.2, type: 'sine', gain: 0.14 });
    tone({ freq: f * 2, dur: 0.12, type: 'sine', gain: 0.04, when: 0.02 });
  } catch {}
}

export function playUndo() {
  if (!isSoundOn()) return;
  try { tone({ freq: 420, slideTo: 260, dur: 0.14, type: 'triangle', gain: 0.08 }); } catch {}
}

export function playClear() {
  if (!isSoundOn()) return;
  try {
    tone({ freq: 600, slideTo: 200, dur: 0.22, type: 'triangle', gain: 0.08 });
  } catch {}
}

export function playWin() {
  if (!isSoundOn()) return;
  try {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) =>
      tone({ freq: f, dur: 0.32, type: 'sine', gain: 0.13, when: i * 0.09 })
    );
    tone({ freq: 1567.98, dur: 0.6, type: 'sine', gain: 0.1, when: 0.5 });
  } catch {}
}

export function playBlock() {
  if (!isSoundOn()) return;
  try { tone({ freq: 180, slideTo: 120, dur: 0.12, type: 'square', gain: 0.05 }); } catch {}
}

export function playClick() {
  if (!isSoundOn()) return;
  try { tone({ freq: 700, dur: 0.06, type: 'sine', gain: 0.06 }); } catch {}
}

export function playTimeUp() {
  if (!isSoundOn()) return;
  try {
    [392, 330, 262, 196].forEach((f, i) =>
      tone({ freq: f, dur: 0.3, type: 'triangle', gain: 0.12, when: i * 0.18 })
    );
  } catch {}
}