/**
 * NeuroSense-WSN v2 Simulation Playback Engine
 * State Machine: IDLE -> PLAYING <-> PAUSED -> FINISHED
 * Controls unified multi-hop frame rendering, speed, scrubbing, and debug diagnostics.
 */

import { sound } from './sound.js';

class SimulationPlayer {
  constructor() {
    this.frames = [];
    this.currentIndex = 0;
    this.state = 'IDLE'; // 'IDLE' | 'PLAYING' | 'PAUSED' | 'FINISHED'
    this.speed = 1.0;
    this.lastFrameTime = 0;
    this.animFrameId = null;
    this.baseIntervalMs = 60;
    this.onFrameCallback = null;
    this.onStateCallback = null;
    this.showDebug = false;
    this.lastApiStatus = 'Ready';
    this.lastApiTimeMs = 0;
    this.lastError = null;
  }

  loadFrames(frames) {
    this.stop();
    this.frames = Array.isArray(frames) ? frames : [];
    this.currentIndex = 0;
    this.setState(this.frames.length > 0 ? 'PAUSED' : 'IDLE');
    if (this.frames.length > 0) {
      this.renderCurrentFrame();
    }
  }

  setState(newState) {
    this.state = newState;
    if (this.onStateCallback) {
      this.onStateCallback(this.state, this.currentIndex, this.frames.length);
    }
  }

  setSpeed(speedVal) {
    this.speed = Math.max(0.25, Math.min(16.0, parseFloat(speedVal) || 1.0));
    sound.simSpeed = this.speed;
    this.notifyState();
  }

  play() {
    if (!this.frames || this.frames.length === 0) return;
    if (this.state === 'FINISHED' || this.currentIndex >= this.frames.length - 1) {
      this.currentIndex = 0;
    }
    this.setState('PLAYING');
    sound.resume();
    this.lastFrameTime = performance.now();
    this.loop();
  }

  pause() {
    if (this.state === 'PLAYING') {
      this.setState('PAUSED');
      sound.pause();
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    }
  }

  resume() {
    if (this.state === 'PAUSED' && this.frames.length > 0) {
      this.play();
    }
  }

  togglePlay() {
    if (this.state === 'PLAYING') {
      this.pause();
    } else {
      this.play();
    }
  }

  stepForward() {
    if (!this.frames || this.frames.length === 0) return;
    this.pause();
    if (this.currentIndex < this.frames.length - 1) {
      this.currentIndex++;
      sound.click();
      this.renderCurrentFrame();
    } else {
      this.setState('FINISHED');
    }
  }

  stepBackward() {
    if (!this.frames || this.frames.length === 0) return;
    this.pause();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      sound.click();
      this.renderCurrentFrame();
    }
  }

  jumpToRound(roundNumber) {
    if (!this.frames || this.frames.length === 0) return;
    const targetIdx = Math.max(0, Math.min(this.frames.length - 1, roundNumber - 1));
    this.currentIndex = targetIdx;
    this.renderCurrentFrame();
    if (this.currentIndex >= this.frames.length - 1) {
      this.setState('FINISHED');
    }
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.currentIndex = 0;
    this.setState(this.frames.length > 0 ? 'PAUSED' : 'IDLE');
  }

  reset() {
    this.stop();
    this.frames = [];
    this.currentIndex = 0;
    this.setState('IDLE');
  }

  loop() {
    if (this.state !== 'PLAYING') return;
    const now = performance.now();
    const interval = this.baseIntervalMs / this.speed;

    if (now - this.lastFrameTime >= interval) {
      this.lastFrameTime = now;
      if (this.currentIndex < this.frames.length - 1) {
        this.currentIndex++;
        this.renderCurrentFrame();
      } else {
        this.setState('FINISHED');
        sound.runFinished();
        return;
      }
    }
    this.animFrameId = requestAnimationFrame(() => this.loop());
  }

  renderCurrentFrame() {
    if (!this.frames || this.frames.length === 0) return;
    const frame = this.frames[this.currentIndex];
    if (frame && frame.events) {
      frame.events.forEach(evt => {
        if (evt.startsWith('node_died:')) sound.nodeDied();
        else if (evt.startsWith('ch_elected:')) sound.chElected();
        else if (evt.startsWith('node_slept:')) sound.nodeSleep();
        else if (evt.startsWith('node_woke:')) sound.nodeWake();
      });
    }
    if (frame && frame.packets_round > 0) {
      sound.packetSink();
    }
    if (this.onFrameCallback) {
      this.onFrameCallback(frame, this.currentIndex, this.frames.length);
    }
    this.notifyState();
    this.updateDebugOverlay();
  }

  notifyState() {
    if (this.onStateCallback) {
      this.onStateCallback(this.state, this.currentIndex, this.frames.length);
    }
    this.updateDebugOverlay();
  }

  toggleDebugOverlay() {
    this.showDebug = !this.showDebug;
    const overlay = document.getElementById('player-debug-overlay');
    if (overlay) {
      overlay.style.display = this.showDebug ? 'block' : 'none';
      this.updateDebugOverlay();
    }
  }

  updateDebugOverlay() {
    const overlay = document.getElementById('player-debug-overlay');
    if (!overlay || !this.showDebug) return;
    overlay.innerHTML = `
      <div style="font-weight:700;color:var(--cyan);margin-bottom:4px;">DEBUG HUD (Key: D)</div>
      <div>Frames Loaded: <b>${this.frames.length}</b></div>
      <div>Current Frame: <b>${this.currentIndex + 1} / ${this.frames.length}</b></div>
      <div>Player State: <b style="color:var(--emerald)">${this.state}</b></div>
      <div>Sim Speed: <b>${this.speed}x</b></div>
      <div>API Status: <b>${this.lastApiStatus} (${this.lastApiTimeMs}ms)</b></div>
      <div>Last Error: <b style="color:var(--rose)">${this.lastError || 'None'}</b></div>
    `;
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.stepBackward();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        this.cycleSpeed(1);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        this.cycleSpeed(-1);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        sound.toggleMute();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.toggleDebugOverlay();
      }
    });
  }

  cycleSpeed(dir) {
    const speeds = [0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 16.0];
    let idx = speeds.indexOf(this.speed);
    if (idx === -1) idx = 2;
    idx = Math.max(0, Math.min(speeds.length - 1, idx + dir));
    this.setSpeed(speeds[idx]);
  }
}

export const player = new SimulationPlayer();
