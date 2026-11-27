let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * Synthesizes a subtle, natural paper page-turn sound using Web Audio API
 * without external audio assets.
 */
export function playPageTurnSound(direction: 'next' | 'prev' = 'next'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.17;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);

    // Generate soft shaped noise buffer resembling paper friction
    const noiseBuffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = noiseBuffer.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      // Soft pink-ish filtering
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      const pink = (b0 + b1 + b2 + white * 0.1848) * 0.12;

      // Envelope: quick crisp lift, gentle flutter, smooth fade out
      const t = i / frameCount;
      const env = Math.sin(Math.PI * Math.pow(t, 0.72)) * (1 - t * 0.35);
      data[i] = pink * env;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.setValueAtTime(1.15, now);

    if (direction === 'next') {
      bandpass.frequency.setValueAtTime(1750, now);
      bandpass.frequency.exponentialRampToValueAtTime(880, now + duration);
    } else {
      bandpass.frequency.setValueAtTime(1150, now);
      bandpass.frequency.exponentialRampToValueAtTime(1650, now + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration + 0.01);
  } catch {
    // Ignore Web Audio errors if blocked by browser autoplay policy
  }
}
