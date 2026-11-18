class SoundController {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playTick() {
    this.playTone(880, 0.06, 'triangle', 0.05);
  }

  public playUrgentTick() {
    this.playTone(1046.5, 0.09, 'square', 0.045);
  }

  public playStart() {
    this.playTone(523.25, 0.12, 'triangle', 0.08, 0);
    this.playTone(659.25, 0.12, 'triangle', 0.08, 0.09);
    this.playTone(783.99, 0.18, 'triangle', 0.09, 0.18);
  }

  public playSubmit() {
    this.playTone(587.33, 0.1, 'sine', 0.07, 0);
    this.playTone(880, 0.18, 'sine', 0.08, 0.08);
  }

  public playTimeUp() {
    this.playTone(440, 0.18, 'sawtooth', 0.06, 0);
    this.playTone(349.23, 0.32, 'sawtooth', 0.06, 0.16);
  }

  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, 0.22, 'triangle', 0.08, i * 0.11);
    });
  }
}

export const soundFx = new SoundController();
