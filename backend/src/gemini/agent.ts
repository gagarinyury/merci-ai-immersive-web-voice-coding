/**
 * Gemini Agent for Demo Deployment
 *
 * Simplified single-agent architecture using Gemini 2.5 Flash
 * - Handles conversation and code generation in one model
 * - Function calling for write_game_code tool
 * - Session management with TTL and message limits
 * - Rate limiting protection
 */

import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai';
import { createChildLogger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createChildLogger({ module: 'gemini-agent' });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

// Session store with TTL
interface Session {
  chat: any;
  messageCount: number;
  lastAccess: number;
}

const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_MESSAGES_PER_SESSION = 10;

// Function declarations
const tools = [{
  functionDeclarations: [{
    name: 'write_game_code',
    description: 'Write game code to games/ folder. Compiler will add physics helpers and infrastructure automatically. Use this for ANY code generation request.',
    parameters: {
      type: 'object' as const,
      properties: {
        filename: {
          type: 'string' as const,
          description: 'Game filename (e.g., "red-cube.ts", "shooter.ts")'
        },
        code: {
          type: 'string' as const,
          description: 'Complete TypeScript game code. Must include: imports, arrays (meshes, entities, geometries, materials), updateGame function, __GAME_UPDATE__ registration, HMR cleanup'
        },
        description: {
          type: 'string' as const,
          description: 'Brief description of what the code does (for user feedback)'
        }
      },
      required: ['filename', 'code', 'description']
    }
  }]
}];

/**
 * Load system prompt
 */
async function loadSystemPrompt(): Promise<string> {
  const promptPath = path.join(__dirname, 'system-prompt.txt');
  return await fs.readFile(promptPath, 'utf-8');
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccess > SESSION_TTL_MS) {
      sessions.delete(sessionId);
      logger.info({ sessionId }, 'Session expired and cleaned up');
    }
  }
}

/**
 * Get or create chat session
 */
async function getSession(sessionId: string, customApiKey?: string): Promise<Session> {
  cleanupExpiredSessions();

  let session = sessions.get(sessionId);

  // Create new session if doesn't exist or needs reset
  if (!session || session.messageCount >= MAX_MESSAGES_PER_SESSION) {
    const systemPrompt = await loadSystemPrompt();

    // Use custom API key if provided, otherwise use default
    const apiKey = customApiKey || process.env.VITE_GEMINI_API_KEY || '';
    const genAIClient = new GoogleGenerativeAI(apiKey);

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    logger.info({ modelName, sessionId }, 'Creating Gemini model');

    // Use structured output instead of function calling
    const model = genAIClient.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "JavaScript game code" },
            description: { type: "string", description: "Brief description" }
          },
          required: ["code", "description"]
        }
      }
    });

    const chat = model.startChat({
      history: []
    });

    session = {
      chat,
      messageCount: 0,
      lastAccess: Date.now()
    };

    sessions.set(sessionId, session);
    logger.info({ sessionId, reset: session.messageCount >= MAX_MESSAGES_PER_SESSION }, 'Created new session');
  }

  // Update access time
  session.lastAccess = Date.now();
  return session;
}

/**
 * Handle function call from Gemini
 */
async function handleFunctionCall(functionCall: any): Promise<any> {
  const { name, args } = functionCall;

  if (name === 'write_game_code') {
    const { filename, code, description } = args;

    logger.info({ filename, description }, 'Game code generated');

    // Return code to be executed via SSE (no file write for demo)
    return {
      success: true,
      message: `Created ${filename}: ${description}`,
      filename,
      code  // Return code so it can be sent via SSE
    };
  }

  throw new Error(`Unknown function: ${name}`);
}

/**
 * Main conversation function
 */
export async function geminiConversation(
  userMessage: string,
  sessionId: string = 'default',
  customApiKey?: string
): Promise<{
  response: string;
  functionResults?: any[];
  error?: string;
}> {
  try {
    const session = await getSession(sessionId, customApiKey);
    session.messageCount++;

    logger.info({ sessionId, messageCount: session.messageCount, messagePreview: userMessage.substring(0, 100) }, 'Processing message');

    // Send message to Gemini (structured output mode)
    const result = await session.chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();

    logger.info({ responseLength: text.length, preview: text.substring(0, 100) }, 'Response from Gemini');

    try {
      // Parse JSON response
      const data = JSON.parse(text);

      if (data.code) {
        // Return code for execution
        return {
          response: data.description || 'Code generated',
          functionResults: [{
            success: true,
            code: data.code,
            description: data.description
          }]
        };
      }
    } catch (parseError: any) {
      logger.warn({ error: parseError.message }, 'Failed to parse JSON response');
    }

    // Fallback - return text response
    return {
      response: text
    };

  } catch (error: any) {
    logger.error({ error: error.message, sessionId }, 'Gemini conversation failed');

    return {
      response: 'Sorry, I encountered an error processing your request.',
      error: error.message
    };
  }
}

/**
 * Clear session (for testing)
 */
export function clearSession(sessionId: string) {
  sessions.delete(sessionId);
  logger.info({ sessionId }, 'Session cleared');
}
