// Tiny WebAudio sfx. Unlocked on first touch only (Aigram preloads games;
// never start audio at mount). All sounds are synthesized — no asset files.

let ctx: AudioContext | null = null;
let unlocked = false;

export function unlock() {
  if (unlocked) return;
  try {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    unlocked = true;
  } catch { /* no audio */ }
}

function blip(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// card thrown off the screen
export function playSwipe() {
  blip(420, 0.1, 'sine', 0.12, 180);
}

// a stat moved in the harmful direction
export function playBad() {
  blip(220, 0.16, 'sawtooth', 0.14, 130);
}

// a stat moved in the relieving direction
export function playGood() {
  blip(520, 0.12, 'triangle', 0.16, 720);
}

export function playDay() {
  blip(330, 0.08, 'sine', 0.1, 440);
}

export function playGameOver() {
  blip(300, 0.5, 'sawtooth', 0.16, 80);
}
