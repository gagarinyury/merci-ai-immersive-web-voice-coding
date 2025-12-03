import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Force override any global env variables with .env file
dotenv.config({ override: true });

// Compute project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '..');

interface EnvConfig {
  anthropic: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  server: {
    port: number;
    nodeEnv: string;
    corsOrigin: string;
  };
  logging: {
    level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    prettyPrint: boolean;
  };
}

export const config: EnvConfig = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '1.0'),
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10),
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  logging: {
    level: (process.env.LOG_LEVEL as any) || 'info',
    prettyPrint: process.env.NODE_ENV !== 'production',
  },
};

export function validateConfig(): void {
  if (!config.anthropic.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required in .env file');
  }
}
