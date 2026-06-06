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

function thud(gain: number) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  // short filtered noise burst — a soft "tok" of a block landing
  const len = Math.floor(ctx.sampleRate * 0.08);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
  src.connect(filt).connect(g).connect(ctx.destination);
  src.start(t0);
}

// block released from the hook
export function playDrop() {
  blip(640, 0.07, 'sine', 0.08, 420);
}

// block lands and settles on the tower
export function playPlace(count: number) {
  thud(0.3);
  // a little rising chime that climbs as the tower grows — reward for height
  const f = 440 + Math.min(18, count) * 26;
  blip(f, 0.1, 'triangle', 0.1, f * 1.18);
}

// tower topples — burnout
export function playGameOver() {
  blip(300, 0.55, 'sawtooth', 0.16, 70);
  thud(0.4);
}
