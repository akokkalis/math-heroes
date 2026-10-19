// Small sound effects made with the Web Audio API.
// No audio files to download, so they work offline.

let ctx;

function tone(frequency, start, duration, type = 'sine', volume = 0.15) {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration);
}

function safely(play) {
  try {
    play();
  } catch {
    // Sound is a bonus; never break the game over it.
  }
}

export const sounds = {
  correct: () => safely(() => { tone(660, 0, 0.12); tone(880, 0.1, 0.18); }),
  wrong: () => safely(() => tone(220, 0, 0.25, 'triangle')),
  win: () => safely(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25))),
  tap: () => safely(() => tone(440, 0, 0.05, 'sine', 0.05)),
};
