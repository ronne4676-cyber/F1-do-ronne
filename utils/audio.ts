
/**
 * Audio service for synthesizing sound effects without external assets.
 * Uses the Web Audio API to create beeps and chimes for UI feedback.
 */

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
  const ctx = initAudio();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playConfirmSFX = () => {
  playTone(880, 'sine', 0.2, 0.1);
};

export const playUpgradeSFX = () => {
  // Mechanical double-tone
  playTone(440, 'square', 0.1, 0.05);
  setTimeout(() => playTone(660, 'square', 0.15, 0.05), 80);
};

export const playRaceStartSFX = () => {
  // Classic 5-light sequence
  for (let i = 0; i < 5; i++) {
    setTimeout(() => playTone(440, 'sine', 0.4, 0.15), i * 1000);
  }
  // Lights out tone
  setTimeout(() => playTone(880, 'sine', 0.8, 0.2), 5200);
};

export const playNotificationSFX = () => {
  playTone(523.25, 'sine', 0.1, 0.1); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.2, 0.1), 100); // E5
};
