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

const app = express();

// Middleware
app.use(cors({ origin: config.server.corsOrigin }));
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

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
  try {
    const skillId = await uploadSkill();
    res.json({
      success: true,
      skillId,
      message: 'Skill uploaded successfully'
    });
  } catch (error) {
    console.error('Upload skill error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/skills/update', async (req: Request, res: Response) => {
  try {
    const { skillId } = req.body;
    if (!skillId) {
      return res.status(400).json({ error: 'skillId is required' });
    }

    const version = await updateSkill(skillId);
    res.json({
      success: true,
      skillId,
      version,
      message: 'Skill updated successfully'
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/skills/list', async (req: Request, res: Response) => {
  try {
    const skills = await listSkills();
    res.json({
      success: true,
      skills
    });
  } catch (error) {
    console.error('List skills error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/skills/current', async (req: Request, res: Response) => {
  try {
    const skillId = await getOrCreateSkillId();
    res.json({
      success: true,
      skillId
    });
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Orchestrator endpoint - Main endpoint for code generation with tools
app.post('/api/orchestrate', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await orchestrate({
      userMessage: message,
      conversationHistory,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Orchestrator Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Test Claude API connection
app.post('/api/test-claude', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

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

    res.json({
      success: true,
      response: responseText,
      usage: response.usage,
      model: response.model,
    });
  } catch (error) {
    console.error('Claude API Error:', error);
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
      console.log(`✓ Server running on http://localhost:${config.server.port}`);
      console.log(`✓ Claude Model: ${config.anthropic.model}`);
      console.log(`✓ Temperature: ${config.anthropic.temperature}`);
      console.log(`✓ Max Tokens: ${config.anthropic.maxTokens}`);
      console.log(`✓ CORS Origin: ${config.server.corsOrigin}`);
      console.log(`\nEndpoints:`);
      console.log(`  GET  /health - Health check`);
      console.log(`  POST /api/orchestrate - Generate code with AI tools`);
      console.log(`  POST /api/test-claude - Test Claude API`);
      console.log(`  POST /api/skills/upload - Upload IWSDK skill`);
      console.log(`  POST /api/skills/update - Update skill version`);
      console.log(`  GET  /api/skills/list - List all skills`);
      console.log(`  GET  /api/skills/current - Get current skill ID`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
