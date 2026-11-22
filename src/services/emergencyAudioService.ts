import { Platform, Vibration } from 'react-native';

/**
 * EmergencyAudioService
 * Generates a high-volume hospital emergency alert / siren sound.
 * Uses the Web Audio API (AudioContext) on Web / WebViews and rhythmic Vibration on physical devices.
 * Loops a high-gain two-tone emergency medical chime at maximum volume until acknowledged.
 */
class EmergencyAudioService {
  private audioCtx: any = null;
  private isAlarmPlaying: boolean = false;
  private sirenTimer: any = null;
  private toneToggle: boolean = false;

  private getAudioContext(): any {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      try {
        this.audioCtx = new AudioContextClass();
      } catch {
        return null;
      }
    }
    return this.audioCtx;
  }

  /**
   * Start high-volume emergency siren and vibration
   */
  startSiren(): void {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    // 1. Trigger continuous rhythmic vibration pattern on physical devices
    try {
      if (Platform.OS !== 'web' && Vibration && typeof Vibration.vibrate === 'function') {
        // [wait 0ms, vibrate 600ms, pause 250ms, vibrate 600ms, pause 400ms]
        Vibration.vibrate([0, 600, 250, 600, 400], true);
      }
    } catch {
      // Ignore vibration error
    }

    // 2. Start high-volume synthesizer audio loop
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      this.toneToggle = false;
      this.playSingleSirenTone();
      this.sirenTimer = setInterval(() => {
        this.playSingleSirenTone();
      }, 420);
    } catch {
      // Fallback: visual alert will continue regardless of audio permission
    }
  }

  /**
   * Plays a single high-gain two-tone pulse
   */
  private playSingleSirenTone(): void {
    if (!this.isAlarmPlaying) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Alternating high-piercing medical frequencies: 987.77Hz (B5) and 783.99Hz (G5)
      osc.type = 'sawtooth';
      const freq = this.toneToggle ? 987.77 : 783.99;
      this.toneToggle = !this.toneToggle;

      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // High volume gain (0.9 out of 1.0) with rapid decay
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.38);
    } catch {
      // Audio node error safe ignore
    }
  }

  /**
   * Stop high-volume siren and cancel physical vibration
   */
  stopSiren(): void {
    this.isAlarmPlaying = false;
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }

    try {
      if (Platform.OS !== 'web' && Vibration && typeof Vibration.cancel === 'function') {
        Vibration.cancel();
      }
    } catch {
      // Ignore
    }
  }

  isPlaying(): boolean {
    return this.isAlarmPlaying;
  }
}

export const emergencyAudioService = new EmergencyAudioService();
export default emergencyAudioService;
