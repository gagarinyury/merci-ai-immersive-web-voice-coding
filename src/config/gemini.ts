/**
 * Gemini AI Configuration
 * Used for speech recognition and multimodal API
 */

/**
 * Gemini API Key from environment
 * Get your key at: https://aistudio.google.com/app/apikey
 */
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Gemini Model Selection
 * Available models:
 *   - gemini-2.0-flash: Fast, balanced performance (recommended for speech)
 *   - gemini-2.5-flash: Latest model (may have rate limits)
 */
export const GEMINI_MODEL = import.meta.env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * Fallback model for audio when main model is overloaded
 */
export const AUDIO_FALLBACK_MODEL = 'gemini-2.0-flash';

/**
 * Gemini API Endpoints
 */
export const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Get Gemini API URL for a specific model and endpoint
 */
export function getGeminiUrl(model: string, endpoint: 'generateContent' | 'streamGenerateContent' = 'generateContent'): string {
  return `${GEMINI_API_BASE_URL}/${model}:${endpoint}`;
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';
}

/**
 * Generation Config for different use cases
 */
export interface GeminiGenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}

/**
 * Default config for speech transcription
 */
export const SPEECH_TRANSCRIPTION_CONFIG: GeminiGenerationConfig = {
  temperature: 0.1, // Low temperature for accurate transcription
  maxOutputTokens: 1024, // Short responses for transcribed text
};

/**
 * Audio format configuration
 */
export const AUDIO_CONFIG = {
  mimeType: 'audio/webm', // Chrome/Quest Browser default
  fallbackMimeType: 'audio/wav',
  maxDurationMs: 60000, // 60 seconds max recording
  retryAttempts: 2,
  retryDelayMs: 2000,
};
