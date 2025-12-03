import dotenv from 'dotenv';

// Force override any global env variables with .env file
dotenv.config({ override: true });

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
};

export function validateConfig(): void {
  if (!config.anthropic.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required in .env file');
  }
}
