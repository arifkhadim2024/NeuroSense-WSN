/**
 * NeuroSense-WSN v2 Sound Synthesizer (Web Audio API)
 * Generates dynamic sound effects without external audio files.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = (typeof localStorage !== 'undefined' && localStorage.getItem('wsn_muted') === 'true');
    this.volume = parseFloat((typeof localStorage !== 'undefined' && localStorage.getItem('wsn_volume')) || '0.25');
    this.lastSoundTime = 0;
    this.soundCountInWindow = 0;
    this.windowStart = 0;
    this.simSpeed = 1.0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val)));
    localStorage.setItem('wsn_volume', this.volume.toString());
    if (this.masterGain && !this.isMuted && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('wsn_muted', this.isMuted.toString());
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  shouldThrottle(isMilestone = false) {
    if (this.isMuted) return true;
    if (this.simSpeed >= 4.0 && !isMilestone) return true;
    const now = performance.now();
    if (now - this.windowStart > 1000) {
      this.windowStart = now;
      this.soundCountInWindow = 0;
    }
    if (this.soundCountInWindow >= 8 && !isMilestone) return true;
    this.soundCountInWindow++;
    return false;
  }

  playTone(freq, duration, type = 'sine', decay = 0.05) {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  click() {
    if (this.shouldThrottle(false)) return;
    this.playTone(1200, 0.02, 'triangle');
  }

  phase1() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.35);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  nodeSleep() {
    if (this.shouldThrottle(false)) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.08);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  nodeWake() {
    if (this.shouldThrottle(false)) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.08);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  chElected() {
    if (this.shouldThrottle(false)) return;
    this.playTone(523.25, 0.06, 'sine');
    setTimeout(() => this.playTone(659.25, 0.09, 'sine'), 50);
  }

  chainEdge(idx = 0) {
    if (this.shouldThrottle(false)) return;
    const freq = 600 + Math.min(600, idx * 30);
    this.playTone(freq, 0.025, 'triangle');
  }

  packetHop() {
    if (this.shouldThrottle(false)) return;
    const freq = 900 + (Math.random() * 400 - 200);
    this.playTone(freq, 0.015, 'sine');
  }

  packetSink() {
    if (this.shouldThrottle(false)) return;
    this.playTone(880, 0.08, 'sine');
  }

  nodeDied() {
    if (this.shouldThrottle(true)) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.25);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  nodeInject() { this.playTone(550, 0.04, 'sine'); }
  nodeDelete() { this.playTone(280, 0.04, 'sine'); }
  pause() { this.playTone(440, 0.05, 'sine'); setTimeout(() => this.playTone(330, 0.07, 'sine'), 40); }
  resume() { this.playTone(330, 0.05, 'sine'); setTimeout(() => this.playTone(440, 0.07, 'sine'), 40); }

  runFinished() {
    if (this.shouldThrottle(true)) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.12, 'sine'), i * 80);
    });
  }

  error() {
    this.playTone(220, 0.08, 'sawtooth');
    setTimeout(() => this.playTone(200, 0.10, 'sawtooth'), 90);
  }
}

export const sound = new SoundEngine();
