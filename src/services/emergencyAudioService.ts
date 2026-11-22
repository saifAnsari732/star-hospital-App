import { Platform, Vibration } from 'react-native';

/**
 * Pre-synthesizes a high-gain two-tone emergency medical siren as a standalone WAV Data URI.
 * Provides guaranteed fallback audio playback on HTML5 Audio elements when Web Audio
 * AudioContext is restricted or blocked by browser autoplay policies.
 */
function createSirenWavDataUri(): string {
  const sampleRate = 22050;
  const duration = 0.84; // 840ms loop (420ms tone 1, 420ms tone 2)
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const totalSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM Samples: alternating high-piercing medical tones (987.77Hz and 783.99Hz)
  const half = Math.floor(numSamples / 2);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = i < half ? 987.77 : 783.99;
    // Harmonic wave with slight drive for high acoustic penetration in noisy wards
    const sampleVal = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.75 : -0.75;
    const intVal = Math.max(-32767, Math.min(32767, Math.floor(sampleVal * 32000)));
    view.setInt16(44 + i * 2, intVal, true);
  }

  // Convert ArrayBuffer to Base64 in isomorphic environment
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  const nodeBuffer = (globalThis as any).Buffer;
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : nodeBuffer
      ? nodeBuffer.from(binary, 'binary').toString('base64')
      : '';

  return `data:audio/wav;base64,${base64}`;
}

/**
 * EmergencyAudioService
 * Generates a high-volume hospital emergency alert / siren sound.
 * Features:
 * 1. Web Audio API AudioContext with high-gain oscillator nodes.
 * 2. Self-contained HTML5 Audio fallback for restricted browser contexts.
 * 3. Proactive auto-unlock event hooks on first user interaction anywhere in the app.
 * 4. Continuous rhythmic vibration on physical Android/iOS devices.
 * 5. Autoplay blocked state detection and reactive listener callback.
 */
class EmergencyAudioService {
  private audioCtx: any = null;
  private isAlarmPlaying: boolean = false;
  private sirenTimer: any = null;
  private toneToggle: boolean = false;
  private isAudioUnlocked: boolean = false;
  private isAutoplayBlocked: boolean = false;
  private fallbackAudio: any = null;
  private blockedChangeListeners: Set<(blocked: boolean) => void> = new Set();
  private wavDataUri: string | null = null;

  constructor() {
    this.setupGlobalUnlockListeners();
  }

  /**
   * Installs one-time global interaction listeners on the browser window/document.
   * Browsers restrict audio playback until the user has clicked/tapped once.
   */
  private setupGlobalUnlockListeners(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const onUserInteraction = () => {
      this.unlockAudio();
    };

    const events = ['click', 'touchstart', 'touchend', 'keydown', 'pointerdown'];
    events.forEach((evt) => {
      try {
        window.addEventListener(evt, onUserInteraction, { once: false, passive: true });
        document.addEventListener(evt, onUserInteraction, { once: false, passive: true });
      } catch {
        // Safe ignore
      }
    });
  }

  /**
   * Lazily initializes and returns the Web Audio API AudioContext.
   */
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
   * Lazily initializes the HTML5 Audio element fallback with pre-synthesized WAV data URI.
   */
  private getFallbackAudio(): any {
    if (typeof window === 'undefined' || typeof (window as any).Audio === 'undefined') {
      return null;
    }

    if (!this.fallbackAudio) {
      try {
        if (!this.wavDataUri) {
          this.wavDataUri = createSirenWavDataUri();
        }
        const audio = new (window as any).Audio(this.wavDataUri);
        audio.loop = true;
        audio.volume = 1.0;
        this.fallbackAudio = audio;
      } catch {
        this.fallbackAudio = null;
      }
    }
    return this.fallbackAudio;
  }

  /**
   * Unlocks audio output on user gesture or component mount.
   */
  async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        // Play an imperceptible 1-sample silent sound to prime the audio pipeline
        try {
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        } catch {
          // Non-blocking
        }
      }

      this.isAudioUnlocked = true;
      this.setAutoplayBlocked(false);

      // If siren was triggered while audio was blocked, restart immediately
      if (this.isAlarmPlaying && !this.sirenTimer) {
        this.startToneLoop();
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start high-volume emergency siren and vibration
   */
  startSiren(): void {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    // 1. Continuous rhythmic vibration on physical devices
    try {
      if (Platform.OS !== 'web' && Vibration && typeof Vibration.vibrate === 'function') {
        // [wait 0ms, vibrate 600ms, pause 250ms, vibrate 600ms, pause 400ms]
        Vibration.vibrate([0, 600, 250, 600, 400], true);
      }
    } catch {
      // Safe vibration ignore
    }

    // 2. Start audio playback
    this.startAudioPlayback();
  }

  private startAudioPlayback(): void {
    if (typeof window === 'undefined') return;

    const ctx = this.getAudioContext();

    if (ctx && ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          this.setAutoplayBlocked(false);
          this.startToneLoop();
        })
        .catch(() => {
          // Autoplay blocked by browser policy without user gesture
          this.setAutoplayBlocked(true);
          this.tryFallbackHtml5Audio();
        });
    } else if (ctx && ctx.state === 'running') {
      this.setAutoplayBlocked(false);
      this.startToneLoop();
    } else {
      this.tryFallbackHtml5Audio();
    }
  }

  private startToneLoop(): void {
    if (!this.isAlarmPlaying || this.sirenTimer) return;
    this.toneToggle = false;
    this.playSingleSirenTone();
    this.sirenTimer = setInterval(() => {
      this.playSingleSirenTone();
    }, 420);
  }

  private tryFallbackHtml5Audio(): void {
    const html5Audio = this.getFallbackAudio();
    if (html5Audio) {
      html5Audio.currentTime = 0;
      html5Audio
        .play()
        .then(() => {
          this.setAutoplayBlocked(false);
        })
        .catch(() => {
          this.setAutoplayBlocked(true);
        });
    }
  }

  /**
   * Plays a single high-gain two-tone pulse via Web Audio API
   */
  private playSingleSirenTone(): void {
    if (!this.isAlarmPlaying) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx || ctx.state !== 'running') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Alternating high-piercing medical frequencies: 987.77Hz (B5) and 783.99Hz (G5)
      osc.type = 'sawtooth';
      const freq = this.toneToggle ? 987.77 : 783.99;
      this.toneToggle = !this.toneToggle;

      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Maximum safe gain with rapid punch decay (0.95 out of 1.0)
      gain.gain.setValueAtTime(0.95, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.38);
    } catch {
      // Safe audio node ignore
    }
  }

  /**
   * Stop high-volume siren, stop HTML5 fallback audio, and cancel vibration
   */
  stopSiren(): void {
    this.isAlarmPlaying = false;
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }

    // Stop fallback HTML5 audio if active
    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
        this.fallbackAudio.currentTime = 0;
      } catch {
        // Safe ignore
      }
    }

    // Cancel physical device vibration
    try {
      if (Platform.OS !== 'web' && Vibration && typeof Vibration.cancel === 'function') {
        Vibration.cancel();
      }
    } catch {
      // Safe ignore
    }
  }

  isPlaying(): boolean {
    return this.isAlarmPlaying;
  }

  isBlocked(): boolean {
    return this.isAutoplayBlocked;
  }

  private setAutoplayBlocked(blocked: boolean): void {
    if (this.isAutoplayBlocked !== blocked) {
      this.isAutoplayBlocked = blocked;
      this.blockedChangeListeners.forEach((fn) => {
        try {
          fn(blocked);
        } catch {
          // Safe ignore
        }
      });
    }
  }

  onBlockedChange(listener: (blocked: boolean) => void): () => void {
    this.blockedChangeListeners.add(listener);
    return () => {
      this.blockedChangeListeners.delete(listener);
    };
  }
}

export const emergencyAudioService = new EmergencyAudioService();
export default emergencyAudioService;
