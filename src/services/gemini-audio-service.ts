import {
  GEMINI_API_KEY,
  GEMINI_MODEL,
  AUDIO_FALLBACK_MODEL,
  getGeminiUrl,
  isGeminiConfigured,
  AUDIO_CONFIG,
  SPEECH_TRANSCRIPTION_CONFIG,
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
    if (!isGeminiConfigured()) {
      console.warn('⚠️ Gemini API key not configured. Speech recognition will not work.');
      console.warn('   Set VITE_GEMINI_API_KEY in .env file');
    }
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

    if (!isGeminiConfigured()) {
      throw new Error('Gemini API key not configured');
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

        // Check if audio is too short (less than 100ms)
        if (audioBlob.size < 1000) {
          this.cleanup();
          reject(new Error('Recording too short'));
          return;
        }

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
   * Transcribe audio using Gemini Multimodal API
   * Automatically detects language (Russian, English, etc.)
   * Includes retry mechanism with fallback models
   */
  private async transcribeWithGemini(base64Audio: string): Promise<string> {
    // Try main model first, then fallback
    const models = [GEMINI_MODEL, AUDIO_FALLBACK_MODEL];

    // Request payload
    const payload = {
      contents: [{
        parts: [
          {
            text: "Transcribe this audio exactly. Return ONLY the transcribed text, no other commentary."
          },
          {
            inline_data: {
              mime_type: AUDIO_CONFIG.mimeType,
              data: base64Audio
            }
          }
        ]
      }],
      generationConfig: SPEECH_TRANSCRIPTION_CONFIG,
    };

    // Try each model with retry
    for (const model of models) {
      const url = `${getGeminiUrl(model)}?key=${GEMINI_API_KEY}`;

      for (let attempt = 1; attempt <= AUDIO_CONFIG.retryAttempts; attempt++) {
        console.log(`🚀 Sending audio to ${model} (attempt ${attempt}/${AUDIO_CONFIG.retryAttempts})...`);

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          // Handle rate limiting / overload
          if (response.status === 503 || response.status === 429) {
            if (attempt < AUDIO_CONFIG.retryAttempts) {
              console.log(`⏳ ${model} overloaded, retrying in ${AUDIO_CONFIG.retryDelayMs}ms...`);
              await this.delay(AUDIO_CONFIG.retryDelayMs);
              continue;
            }
            // Try next model
            console.log(`⚠️ ${model} unavailable, trying fallback...`);
            break;
          }

          // Handle errors
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
          }

          // Parse response
          const data = await response.json();

          if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const text = data.candidates[0].content.parts[0].text;
            console.log(`✅ Transcription (${model}):`, text);
            return text.trim();
          } else {
            throw new Error('No transcription result in response');
          }
        } catch (error: any) {
          console.error(`❌ ${model} attempt ${attempt} failed:`, error.message);

          // If it's a rate limit error, try next model
          if (error.message?.includes('503') || error.message?.includes('429')) {
            break;
          }

          // If last attempt, rethrow
          if (attempt === AUDIO_CONFIG.retryAttempts) {
            throw error;
          }
        }
      }
    }

    // All models failed
    throw new Error('All models overloaded or failed. Please try again later.');
  }

  /**
   * Delay helper for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
