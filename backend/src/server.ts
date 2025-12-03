import express, { Request, Response } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { config, validateConfig } from '../config/env.js';
import {
  uploadSkill,
  updateSkill,
  getOrCreateSkillId,
  listSkills
} from './skills/skill-manager.js';
import { orchestrate } from './orchestrator/index.js';
import { LiveCodeServer } from './websocket/live-code-server.js';
import { FileWatcher } from './websocket/file-watcher.js';
import { setLiveCodeServer } from './tools/injectCode.js';
import { logger } from './utils/logger.js';
import { requestLogger, getRequestLogger } from './middleware/request-logger.js';

const app = express();

// Middleware
app.use(cors({ origin: config.server.corsOrigin }));
app.use(express.json());
app.use(requestLogger); // Request logging with requestId

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

// Initialize WebSocket Live Code Server
const liveCodeServer = new LiveCodeServer(3002);
setLiveCodeServer(liveCodeServer);

// Initialize File Watcher for src/generated/
const fileWatcher = new FileWatcher(liveCodeServer);
fileWatcher.start();

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: config.anthropic.model
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

// Direct code execution endpoint - bypass orchestrator
app.post('/api/execute', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);

  try {
    const { code } = req.body;

    if (!code) {
      reqLogger.warn('Missing code in execute request');
      return res.status(400).json({ error: 'Code is required' });
    }

    reqLogger.info({ codeLength: code.length }, 'Direct execute request');

    // Type check and compile
    const { typeCheckAndCompile } = await import('./tools/typescript-checker.js');
    const result = typeCheckAndCompile(code);

    if (!result.success) {
      reqLogger.warn({ errors: result.errors }, 'Type check failed');
      return res.status(400).json({
        success: false,
        error: 'Type check failed',
        errors: result.errors
      });
    }

    // Check WebSocket clients
    const clientCount = liveCodeServer.getClientCount();
    if (clientCount === 0) {
      reqLogger.warn('No WebSocket clients connected');
      return res.status(400).json({
        success: false,
        error: 'No clients connected to WebSocket'
      });
    }

    // Broadcast code
    liveCodeServer.broadcast({
      action: 'execute',
      code: result.compiledCode!,
      timestamp: Date.now()
    });

    reqLogger.info({ clientCount }, 'Code broadcast successfully');

    res.json({
      success: true,
      clientCount,
      codeLength: result.compiledCode!.length
    });

  } catch (error) {
    reqLogger.error({ err: error }, 'Execute request failed');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Orchestrator endpoint - Main endpoint for code generation with tools
app.post('/api/orchestrate', async (req: Request, res: Response) => {
  const reqLogger = getRequestLogger(req);
  const startTime = Date.now();

  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      reqLogger.warn('Missing message in orchestrate request');
      return res.status(400).json({ error: 'Message is required' });
    }

    reqLogger.info(
      {
        message: message.substring(0, 100), // Первые 100 символов для лога
        hasHistory: !!conversationHistory
      },
      'Orchestrator request started'
    );

    const result = await orchestrate({
      userMessage: message,
      conversationHistory,
      requestId: req.requestId, // Передаем requestId в orchestrator
    });

    const duration = Date.now() - startTime;
    reqLogger.info(
      {
        duration,
        toolsUsed: result.toolsUsed,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
      'Orchestrator request completed'
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    reqLogger.error({ err: error, duration }, 'Orchestrator request failed');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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

// Start server
async function startServer() {
  try {
    validateConfig();

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

      logger.info('Available endpoints:');
      logger.info('  GET  /health - Health check');
      logger.info('  POST /api/orchestrate - Generate code with AI tools');
      logger.info('  POST /api/test-claude - Test Claude API');
      logger.info('  POST /api/skills/upload - Upload IWSDK skill');
      logger.info('  POST /api/skills/update - Update skill version');
      logger.info('  GET  /api/skills/list - List all skills');
      logger.info('  GET  /api/skills/current - Get current skill ID');
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
