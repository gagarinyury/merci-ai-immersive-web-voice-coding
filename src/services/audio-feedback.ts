/**
 * Audio Feedback Service
 *
 * Provides sound effects for UI interactions
 */

export class AudioFeedbackService {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Create AudioContext lazily (after user gesture)
    if (typeof AudioContext !== 'undefined') {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Play a short "beep" sound (for recording start/stop)
   */
  playBeep(frequency = 800, duration = 100) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Envelope: quick fade in/out
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Fade in
    gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000); // Fade out

    oscillator.start(now);
    oscillator.stop(now + duration / 1000);
  }

  /**
   * Play "recording started" sound (higher pitch beep)
   */
  playRecordingStart() {
    this.playBeep(1000, 80); // 1kHz, 80ms
  }

  /**
   * Play "recording stopped" sound (lower pitch beep)
   */
  playRecordingStop() {
    this.playBeep(600, 120); // 600Hz, 120ms
  }

  /**
   * Play "processing" sound (gentle pulsing tone)
   * Returns a function to stop the sound
   */
  playProcessing(): () => void {
    if (!this.audioContext) return () => {};

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 400;
    oscillator.type = 'sine';

    // Pulsing effect with LFO
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 2; // 2Hz pulse
    lfoGain.gain.value = 0.15; // Pulse depth
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);

    gainNode.gain.value = 0.1; // Base volume (very quiet)

    const now = this.audioContext.currentTime;
    lfo.start(now);
    oscillator.start(now);

    // Return stop function
    return () => {
      const stopTime = this.audioContext!.currentTime;
      gainNode.gain.linearRampToValueAtTime(0, stopTime + 0.1);
      oscillator.stop(stopTime + 0.1);
      lfo.stop(stopTime + 0.1);
    };
  }

  /**
   * Play "success" sound (ascending beeps)
   */
  playSuccess() {
    if (!this.audioContext) return;

    const frequencies = [600, 800, 1000];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playBeep(freq, 60);
      }, i * 80);
    });
  }

  /**
   * Play "error" sound (harsh descending beep)
   */
  playError() {
    if (!this.audioContext) return;

    const frequencies = [800, 600, 400];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playBeep(freq, 100);
      }, i * 100);
    });
  }
}
