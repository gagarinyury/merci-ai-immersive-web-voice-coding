import express, { Request, Response } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { config, validateConfig } from '../config/env.js';
import * as path from 'path';
import * as os from 'os';

// Ensure Claude CLI is in PATH
const homedir = os.homedir();
const claudePath = path.join(homedir, '.claude/local');
process.env.PATH = `${claudePath}${path.delimiter}${process.env.PATH}`;
console.log('Updated PATH:', process.env.PATH); // Debug log

import {
  uploadSkill,
  updateSkill,
  getOrCreateSkillId,
  listSkills
} from './skills/skill-manager.js';
// LEGACY: import { orchestrate } from './orchestrator/index.js'; // Заменён на Agent SDK
// DISABLED for Gemini deployment: import { orchestrateConversation } from './orchestrator/conversation-orchestrator.js';
import { geminiConversation } from './gemini/agent.js';
import { initGameCompiler } from './services/game-compiler.js';
import { logger } from './utils/logger.js';
import { requestLogger, getRequestLogger } from './middleware/request-logger.js';

const app = express();

// Middleware
// Allow all origins for demo deployment (GitHub Pages + localhost)
app.use(cors({
  origin: '*', // Allow all origins for public demo
  credentials: false
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for audio files (base64)
app.use(requestLogger); // Request logging with requestId

// Initialize Anthropic client (Legacy API)
// Agent SDK uses its own authentication (OAuth)
let anthropic: Anthropic | null = null;

if (config.anthropic.apiKey) {
  anthropic = new Anthropic({
    apiKey: config.anthropic.apiKey,
  });
} else {
  logger.warn('Anthropic API key not found. Legacy API endpoints will be disabled.');
}

// WebSocket server runs separately (see backend/src/websocket-server.ts)
// This allows restarting backend API without dropping WebSocket connections
logger.info('WebSocket server should be running separately on port', config.server.wsPort);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: config.anthropic.model,
    authMode: config.anthropic.apiKey ? 'api-key' : 'oauth-only'
  });
});

// Skill management endpoints
app.post('/api/skills/upload', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);
  try {
    reqLogger.info('Uploading skill');
    const skillId = await uploadSkill();
    reqLogger.info({ skillId }, 'Skill uploaded successfully');
    res.json({
      success: true,
      skillId,
      message: 'Skill uploaded successfully'
    });
  } catch (error) {
    reqLogger.error({ err: error }, 'Upload skill error');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/skills/update', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);
  try {
    const { skillId } = req.body;
    if (!skillId) {
      reqLogger.warn('Missing skillId in update request');
      return res.status(400).json({ error: 'skillId is required' });
    }

    reqLogger.info({ skillId }, 'Updating skill');
    const version = await updateSkill(skillId);
    reqLogger.info({ skillId, version }, 'Skill updated successfully');
    res.json({
      success: true,
      skillId,
      version,
      message: 'Skill updated successfully'
    });
  } catch (error) {
    reqLogger.error({ err: error, skillId: req.body.skillId }, 'Update skill error');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/skills/list', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);
  try {
    reqLogger.debug('Listing skills');
    const skills = await listSkills();
    reqLogger.info({ count: skills.length }, 'Skills listed successfully');
    res.json({
      success: true,
      skills
    });
  } catch (error) {
    reqLogger.error({ err: error }, 'List skills error');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/skills/current', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);
  try {
    reqLogger.debug('Getting current skill');
    const skillId = await getOrCreateSkillId();
    reqLogger.info({ skillId }, 'Current skill retrieved');
    res.json({
      success: true,
      skillId
    });
  } catch (error) {
    reqLogger.error({ err: error }, 'Get skill error');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Direct code execution endpoint - DISABLED for Gemini deployment
// This requires WebSocket server which runs separately in local dev
// For demo deployment, use /api/conversation/gemini instead
app.post('/api/execute', async (req: Request, res: Response) => {
  res.status(503).json({
    success: false,
    error: 'Direct execute endpoint is disabled. Use /api/conversation/gemini for demo deployment.'
  });
});

// Conversation endpoint - DISABLED for Gemini deployment
// This requires Claude Agent SDK with OAuth which is not available in demo mode
// Use /api/conversation/gemini for demo deployment
app.post('/api/conversation', async (req: Request, res: Response) => {
  res.status(503).json({
    success: false,
    error: 'Claude Agent SDK endpoint is disabled. Use /api/conversation/gemini for demo deployment.'
  });
});

// Gemini conversation endpoint (for demo deployment)
// Simplified single-agent architecture without Agent SDK
app.post('/api/conversation/gemini', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);
  const startTime = Date.now();

  try {
    const { message, sessionId } = req.body;

    if (!message) {
      reqLogger.warn('Missing message in Gemini conversation request');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check for custom API key in header
    const customApiKey = req.headers['x-custom-gemini-key'] as string | undefined;

    reqLogger.info(
      {
        message: message.substring(0, 100),
        sessionId: sessionId || 'default',
        hasCustomKey: !!customApiKey
      },
      'Gemini conversation request started'
    );

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Call Gemini agent with custom key if provided
    const result = await geminiConversation(message, sessionId, customApiKey);

    const duration = Date.now() - startTime;
    reqLogger.info({ duration, sessionId }, 'Gemini conversation completed');

    // Send SSE event
    res.write(`data: ${JSON.stringify({
      type: 'done',
      response: result.response,
      sessionId: sessionId || 'default',
      functionResults: result.functionResults,
      error: result.error
    })}\n\n`);

    res.end();

  } catch (error) {
    const duration = Date.now() - startTime;
    reqLogger.error({ err: error, duration }, 'Gemini conversation failed');

    // Send error as SSE event
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })}\n\n`);

    res.end();
  }
});

// =============================================================================
// 3D MODEL GENERATION ENDPOINTS
// =============================================================================
// Прямые endpoints для работы с 3D моделями (не через Agent SDK)

import { meshyTool, listModelsTool, spawnModelTool } from './tools/index.js';

// Generate 3D model via Meshy AI
app.post('/api/models/generate', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);
  const startTime = Date.now();

  try {
    const { description, withAnimation, animationType, autoSpawn, position } = req.body;

    if (!description) {
      reqLogger.warn('Missing description in generate model request');
      return res.status(400).json({ error: 'Description is required' });
    }

    reqLogger.info({ description, withAnimation }, 'Generating 3D model');

    const result = await meshyTool.run({
      description,
      withAnimation,
      animationType,
      autoSpawn,
      position,
    });

    const duration = Date.now() - startTime;
    reqLogger.info({ duration }, 'Model generation completed');

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    reqLogger.error({ err: error, duration }, 'Model generation failed');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// List all models in library
app.get('/api/models', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);

  try {
    const type = req.query.type as 'all' | 'humanoid' | 'static' | undefined;
    reqLogger.debug({ type }, 'Listing models');

    const result = await listModelsTool.run({ type });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    reqLogger.error({ err: error }, 'Failed to list models');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Spawn existing model into scene
app.post('/api/models/spawn', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);

  try {
    const { modelId, position, scale, grabbable, scalable, scaleRange } = req.body;

    if (!modelId) {
      reqLogger.warn('Missing modelId in spawn request');
      return res.status(400).json({ error: 'modelId is required' });
    }

    reqLogger.info({ modelId, position }, 'Spawning model');

    const result = await spawnModelTool.run({
      modelId,
      position,
      scale,
      grabbable,
      scalable,
      scaleRange,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    reqLogger.error({ err: error }, 'Failed to spawn model');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Remove model from scene
app.post('/api/models/remove', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);

  try {
    reqLogger.info('Removing model from scene');

    // Write empty file to clear the model
    const fs = await import('fs/promises');
    const path = await import('path');
    const generatedDir = path.join(process.cwd(), 'src/generated');

    const emptyModelCode = `/**
 * Model removed from scene
 * Use spawn_model to add a new model
 */

// Vite HMR cleanup
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    console.log('✓ Model cleanup complete (empty state)');
  });
}

export {};
`;

    await fs.writeFile(path.join(generatedDir, 'current-model.ts'), emptyModelCode);

    // Send SSE event for UI notification
    const sseEmitter = (global as any).__SSE_EMITTER__;
    if (sseEmitter?.emit) {
      sseEmitter.emit({
        type: 'file_created',
        filePath: 'src/generated/current-model.ts'
      });
    }

    reqLogger.info('Model removed from scene');

    res.json({
      success: true,
      message: 'Model removed from scene',
    });
  } catch (error) {
    reqLogger.error({ err: error }, 'Failed to remove model');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Speech-to-text endpoint via Gemini API
app.post('/api/speech-to-text', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);
  const startTime = Date.now();

  try {
    const { audioData } = req.body;

    if (!audioData) {
      reqLogger.warn('Missing audioData in speech-to-text request');
      return res.status(400).json({ error: 'audioData is required (base64 encoded)' });
    }

    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      reqLogger.error('Gemini API key not configured');
      return res.status(500).json({ error: 'Gemini API not configured' });
    }

    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

    const audioSizeMB = (audioData.length * 0.75 / 1024 / 1024).toFixed(2); // base64 is ~33% larger
    reqLogger.info({ model: geminiModel, audioLength: audioData.length, audioSizeMB }, 'Sending audio to Gemini API');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Transcribe this audio and translate it to English. If the audio is already in English, transcribe as-is. Return ONLY the English text, no other commentary or explanation.'
            },
            {
              inline_data: {
                mime_type: 'audio/webm',
                data: audioData
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      reqLogger.error({ status: response.status, error: errorText }, 'Gemini API error');

      // Handle specific errors with user-friendly messages
      let userMessage = `Gemini API error: ${response.statusText}`;
      if (response.status === 413) {
        userMessage = 'Recording too large. Please speak shorter phrases (max 30 seconds).';
      } else if (response.status === 429) {
        userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (response.status === 503) {
        userMessage = 'Gemini API temporarily unavailable. Please try again.';
      }

      return res.status(response.status).json({
        error: userMessage,
        details: errorText
      });
    }

    const data = await response.json();
    const transcribedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const duration = Date.now() - startTime;
    reqLogger.info({ duration, textLength: transcribedText.length }, 'Speech transcribed successfully');

    res.json({
      success: true,
      text: transcribedText.trim(),
      duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    reqLogger.error({ err: error, duration }, 'Speech-to-text failed');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test Claude API connection
app.post('/api/test-claude', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);
  try {
    const { message } = req.body;

    if (!message) {
      reqLogger.warn('Missing message in test-claude request');
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!anthropic) {
      reqLogger.warn('Anthropic client not initialized (missing API key)');
      return res.status(503).json({
        error: 'Anthropic API key not configured. Legacy API is disabled. Use Agent SDK endpoints.'
      });
    }

    reqLogger.info({ model: config.anthropic.model }, 'Testing Claude API');

    const response = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      temperature: config.anthropic.temperature,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent && 'text' in textContent ? textContent.text : '';

    reqLogger.info(
      {
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      'Claude API test successful'
    );

    res.json({
      success: true,
      response: responseText,
      usage: response.usage,
      model: response.model,
    });
  } catch (error) {
    reqLogger.error({ err: error }, 'Claude API test failed');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Serve generated 3D models
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, '../generated/models');
const publicDir = path.join(__dirname, '../../public');

app.use('/models', express.static(modelsDir));
app.use(express.static(publicDir));

// Start server
async function startServer() {
  try {
    validateConfig();

    // Initialize game compiler (watches game-code.ts → current-game.ts)
    await initGameCompiler();

    app.listen(config.server.port, () => {
      logger.info(
        {
          port: config.server.port,
          env: config.server.nodeEnv,
          logLevel: config.logging.level,
          model: config.anthropic.model,
          temperature: config.anthropic.temperature,
          maxTokens: config.anthropic.maxTokens,
          corsOrigin: config.server.corsOrigin,
        },
        'Server started successfully'
      );

      logger.info('Available endpoints (Gemini Demo Mode):');
      logger.info('  GET  /health - Health check');
      logger.info('  POST /api/conversation/gemini - Gemini AI conversation (ACTIVE)');
      logger.info('  POST /api/speech-to-text - Speech-to-text via Gemini');
      logger.info('  GET  /models/:filename - Serve generated 3D models');
      logger.info('');
      logger.info('Disabled endpoints (require local infrastructure):');
      logger.info('  POST /api/conversation - Claude Agent SDK (requires OAuth)');
      logger.info('  POST /api/execute - Direct execution (requires WebSocket)');
      logger.info('  POST /api/skills/* - IWSDK skill management');
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Handle graceful shutdown
const shutdown = () => {
  logger.info('Shutting down server...');
  // Note: WebSocket server runs separately (see websocket-server.ts)
  // File watcher is part of game compiler service
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
