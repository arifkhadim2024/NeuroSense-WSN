// ============================================================================
// Web Audio API Synthesizer for WSN Digital Twin & Topology Lab
// Zero external audio asset dependencies — 100% procedural scientific audio
// ============================================================================

class SoundFXEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.35; // Default 35% volume
  private listeners: Array<(enabled: boolean, volume: number) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('wsn_audio_feedback');
      this.enabled = savedEnabled !== null ? savedEnabled === 'true' : true;

      const savedVol = localStorage.getItem('wsn_audio_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
    }
  }

  private initCtx(): { ctx: AudioContext; masterGain: GainNode } | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
      return { ctx: this.ctx, masterGain: this.masterGain };
    }
    return null;
  }

  public isAudioEnabled(): boolean {
    return this.enabled;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('wsn_audio_volume', String(this.volume));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
    }
    this.listeners.forEach((fn) => fn(this.enabled, this.volume));
  }

  public setAudioEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('wsn_audio_feedback', String(val));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(val ? this.volume : 0, this.ctx.currentTime);
    }
    this.listeners.forEach((fn) => fn(val, this.volume));
  }

  public toggleAudio(): boolean {
    const next = !this.enabled;
    this.setAudioEnabled(next);
    if (next) {
      this.playClickSound();
    }
    return next;
  }

  public subscribe(fn: (enabled: boolean, volume: number) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  // 1. Crisp UI Button Click / Tab Switch
  public playClickSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  // 2. High-Tech 3D Node Hover / Micro Chirp
  public playHoverSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  }

  // 3. System Activation Sound (When simulation or presentation begins)
  public playSystemActivationSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // 4. ANN Spatial Feature Digital Scan Sweep
  public playANNScanSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(960, now + 0.18);
      osc.frequency.linearRampToValueAtTime(640, now + 0.30);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(1200, now + 0.30);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  // 5. ANN Inference Confirmation Dual-Tone
  public playANNConfirmSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(1174.66, now + 0.08); // High D

      osc2.frequency.setValueAtTime(1320, now);
      osc2.frequency.setValueAtTime(1760, now + 0.08); // High A

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } catch {}
  }

  // 6. Overlap Detected Analytical Pulse
  public playOverlapDetectedSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.06); // C#5
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  // 7. Blindspot Detected Warning Pulse
  public playBlindspotDetectedSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(349.23, now); // F4
      osc.frequency.setValueAtTime(293.66, now + 0.08); // D4

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  // 8. PSO Multi-Objective Swarm Activation
  public playPSOBeginSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {}
  }

  // 9. Node Micro-Servo Repositioning Sound
  public playNodeMovementSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.05);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // 10. Data Routing Packet Transmission Pop / Pulse
  public playPacketSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // 11. Packet Destination Arrival Ping
  public playPacketArrivalSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(1960, now + 0.045);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // 12. Base Station Uplink Reception Chime
  public playSinkReceiveSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const chords = [587.33, 880, 1174.66]; // D5, A5, D6
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.32);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.32);
      });
    } catch {}
  }

  // 13. Energy Settlement Update Pulse
  public playEnergyUpdateSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  // 14. Optimization Iteration Improvement Chime
  public playImprovementSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  // 15. Optimization Convergence Harmonic Fanfare
  public playConvergenceSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major Chord
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.14, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.07);
        osc.stop(now + 0.55);
      });
    } catch {}
  }

  // 16. Optimization Frequency Sweep
  public playOptimizationSweep(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.45);

      osc2.frequency.setValueAtTime(280, now);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.45);
      filter.Q.setValueAtTime(4.0, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.48);
      osc2.stop(now + 0.48);
    } catch {}
  }

  // 17. Reset to Initial Distribution Chime
  public playResetSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(440, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  // 18. Node Depletion / Dead Warning Sound
  public playNodeDeadSound(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  // 19. Alert Tone / Warning Siren
  public playAlertTone(): void {
    if (!this.enabled) return;
    const sys = this.initCtx();
    if (!sys) return;
    const { ctx, masterGain } = sys;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }
}

export const soundFX = new SoundFXEngine();
