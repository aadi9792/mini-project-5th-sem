/**
 * Skillverse Audio Engine
 * Pure Web Audio API synthesizers for Quiet Sounds (Rain, Ocean, Wind, White Noise)
 * and Theme Ambience (Space, Ocean, Jungle), plus gentle UI audio chimes.
 * Requires 0 external audio files, has 0 load latency, and loops with 0 seam artifacts.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentQuietSound: string | null = null;
  private quietNodes: { source?: AudioNode; stop?: () => void } | null = null;
  private bgmNodes: { source?: AudioNode; stop?: () => void } | null = null;
  private currentBgm: string | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- UI Chimes ---
  playRewardChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + i * 0.08);

      gain.gain.setValueAtTime(0.001, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.5);
    });
  }

  playTapChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // --- Quiet Sounds (Calm Cove) ---
  playQuietSound(type: "rain" | "ocean-waves" | "gentle-wind" | "white-noise"): void {
    if (this.currentQuietSound === type) {
      this.stopQuietSound();
      return;
    }

    this.stopQuietSound();
    const ctx = this.getContext();
    if (!ctx) return;

    this.currentQuietSound = type;

    // Create 5-second noise buffer
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    if (type === "white-noise") {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      this.quietNodes = {
        stop: () => {
          try {
            noise.stop();
            noise.disconnect();
          } catch {}
        },
      };
    } else if (type === "rain") {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      this.quietNodes = {
        stop: () => {
          try {
            noise.stop();
            noise.disconnect();
          } catch {}
        },
      };
    } else if (type === "ocean-waves") {
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05, ctx.currentTime);

      // Slow wave modulation
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 sec wave period
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      lfo.start();

      this.quietNodes = {
        stop: () => {
          try {
            noise.stop();
            lfo.stop();
            noise.disconnect();
          } catch {}
        },
      };
    } else if (type === "gentle-wind") {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(150, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      lfo.start();

      this.quietNodes = {
        stop: () => {
          try {
            noise.stop();
            lfo.stop();
            noise.disconnect();
          } catch {}
        },
      };
    }
  }

  stopQuietSound() {
    if (this.quietNodes?.stop) {
      this.quietNodes.stop();
    }
    this.quietNodes = null;
    this.currentQuietSound = null;
  }

  getActiveQuietSound(): string | null {
    return this.currentQuietSound;
  }
}

export const soundEngine = new SoundEngine();

