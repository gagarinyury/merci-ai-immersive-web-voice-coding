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
async function getSession(sessionId: string): Promise<Session> {
  cleanupExpiredSessions();

  let session = sessions.get(sessionId);

  // Create new session if doesn't exist or needs reset
  if (!session || session.messageCount >= MAX_MESSAGES_PER_SESSION) {
    const systemPrompt = await loadSystemPrompt();

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
      tools,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO
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

    // Write to games/ folder
    const gamesDir = path.join(process.cwd(), 'src/generated/games');
    await fs.mkdir(gamesDir, { recursive: true });

    const filePath = path.join(gamesDir, filename);
    await fs.writeFile(filePath, code, 'utf-8');

    logger.info({ filename, description }, 'Game code written');

    return {
      success: true,
      message: `Created ${filename}: ${description}`,
      filename,
      path: filePath
    };
  }

  throw new Error(`Unknown function: ${name}`);
}

/**
 * Main conversation function
 */
export async function geminiConversation(
  userMessage: string,
  sessionId: string = 'default'
): Promise<{
  response: string;
  functionResults?: any[];
  error?: string;
}> {
  try {
    const session = await getSession(sessionId);
    session.messageCount++;

    logger.info({ sessionId, messageCount: session.messageCount, messagePreview: userMessage.substring(0, 100) }, 'Processing message');

    // Send message to Gemini
    const result = await session.chat.sendMessage(userMessage);
    const response = result.response;

    // Check for function calls
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      // Execute function calls
      const functionResults = [];

      for (const functionCall of functionCalls) {
        logger.info({ functionName: functionCall.name }, 'Executing function');

        try {
          const toolResult = await handleFunctionCall(functionCall);
          functionResults.push(toolResult);

          // Send function result back to model
          await session.chat.sendMessage([{
            functionResponse: {
              name: functionCall.name,
              response: toolResult
            }
          }]);
        } catch (error: any) {
          logger.error({ error: error.message, functionName: functionCall.name }, 'Function call failed');
          functionResults.push({
            success: false,
            error: error.message
          });
        }
      }

      // Get final response after function execution
      const finalResponse = await session.chat.sendMessage('');

      return {
        response: finalResponse.response.text(),
        functionResults
      };
    }

    // No function calls - return text response
    return {
      response: response.text()
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
