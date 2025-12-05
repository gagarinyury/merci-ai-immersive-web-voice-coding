import {
  AUDIO_CONFIG,
} from '../config/gemini.js';

/**
 * Service for handling Voice Input using Gemini Multimodal API
 *
 * Features:
 * - Records audio from microphone (WebM format)
 * - Automatic language detection (Russian, English, 100+ languages)
 * - Retry mechanism with fallback models
 * - Push-to-talk interface support
 *
 * Usage:
 * ```typescript
 * const service = new GeminiAudioService();
 *
 * // Start recording (on button press)
 * await service.start();
 *
 * // Stop and transcribe (on button release)
 * const text = await service.stop();
 * console.log('Transcribed:', text);
 * ```
 */
export class GeminiAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private stream: MediaStream | null = null;

  constructor() {
    // API key is now on backend - no need to check here
  }

  /**
   * Start recording audio from microphone
   * @throws Error if microphone access denied or not supported
   */
  async start(): Promise<void> {
    if (this.isRecording) {
      console.warn('🎤 Already recording');
      return;
    }

    if (!this.isSupported()) {
      throw new Error('Microphone not supported in this browser');
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder with WebM format (Quest Browser compatible)
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: AUDIO_CONFIG.mimeType,
      });

      this.audioChunks = [];

      // Collect audio chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;

      console.log('🎤 Gemini Audio: Recording started');
    } catch (error: any) {
      console.error('❌ Gemini Audio: Failed to start recording', error);
      this.cleanup();
      throw new Error(`Microphone access denied: ${error.message}`);
    }
  }

  /**
   * Stop recording and transcribe audio using Gemini API
   * @returns Transcribed text
   * @throws Error if transcription fails
   */
  async stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      // Handle stop event
      this.mediaRecorder.onstop = async () => {
        console.log('🎤 Gemini Audio: Recording stopped, processing...');

        // Create audio blob
        const audioBlob = new Blob(this.audioChunks, { type: AUDIO_CONFIG.mimeType });

        // Check if audio is too short (less than 100ms) or too large (>10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB limit
        if (audioBlob.size < 1000) {
          this.cleanup();
          reject(new Error('Recording too short'));
          return;
        }
        if (audioBlob.size > maxSize) {
          console.warn(`⚠️ Audio size: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB (limit: 10MB)`);
          this.cleanup();
          reject(new Error(`Recording too large: ${(audioBlob.size / 1024 / 1024).toFixed(1)}MB. Please speak shorter phrases.`));
          return;
        }
        console.log(`📊 Audio size: ${(audioBlob.size / 1024).toFixed(1)}KB`);


        try {
          // Convert to base64
          const base64Audio = await this.blobToBase64(audioBlob);

          // Transcribe with Gemini
          const text = await this.transcribeWithGemini(base64Audio);

          this.cleanup();
          resolve(text);
        } catch (error: any) {
          this.cleanup();
          reject(error);
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event: Event) => {
        console.error('❌ MediaRecorder error:', event);
        this.cleanup();
        reject(new Error('Recording failed'));
      };

      // Stop recording
      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  /**
   * Check if microphone is supported
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Cleanup resources (stop tracks, clear data)
   */
  private cleanup(): void {
    // Stop all audio tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Clear MediaRecorder
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }

    // Clear audio chunks
    this.audioChunks = [];
    this.isRecording = false;
  }

  /**
   * Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        // Extract base64 part (remove "data:audio/webm;base64," prefix)
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read audio blob'));
      };

      reader.readAsDataURL(blob);
    });
  }

  /**
   * Transcribe audio using backend endpoint (secure - API key on server)
   */
  private async transcribeWithGemini(base64Audio: string): Promise<string> {
    console.log('🚀 Sending audio to backend for transcription...');

    // Use relative URL - Vite proxy handles forwarding to backend
    const backendUrl = '/api/speech-to-text';
    console.log(`📡 Backend URL: ${backendUrl}`);

    try {
      // Add timeout to prevent hanging forever if backend is down
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: base64Audio }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Check if response is JSON or HTML
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(`Backend error: ${errorData.error || response.statusText}`);
        } else {
          // Got HTML (404 page or error) instead of JSON
          const htmlText = await response.text();
          console.error('❌ Received HTML instead of JSON:', htmlText.substring(0, 200));

          // Parse error message from HTML if available
          const errorMatch = htmlText.match(/<pre>(.*?)<br>/);
          const errorMsg = errorMatch ? errorMatch[1] : response.statusText;

          if (response.status === 413) {
            throw new Error('Recording too large. Please speak shorter phrases (backend limit exceeded).');
          }
          throw new Error(`Backend error ${response.status}: ${errorMsg}`);
        }
      }

      const data = await response.json();

      if (!data.success || !data.text) {
        throw new Error('No transcription returned from backend');
      }

      console.log(`✅ Transcription from backend:`, data.text);
      return data.text;

    } catch (error: any) {
      console.error('❌ Backend transcription failed:', error);

      // Handle specific network errors
      if (error.name === 'AbortError') {
        throw new Error('Backend timeout (30s). Is the backend running?');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to backend. Is it running on port 3001?');
      }

      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Delay helper for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
