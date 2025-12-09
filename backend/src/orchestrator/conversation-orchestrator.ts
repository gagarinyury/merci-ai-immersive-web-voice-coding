/**
 * Conversation Orchestrator with Agent SDK
 *
 * Главный оркестратор для ведения разговора с пользователем.
 * Координирует работу специализированных субагентов.
 *
 * АРХИТЕКТУРА:
 * - Main orchestrator: ведет беседу, координирует, НЕ редактирует файлы
 * - Subagents: выполняют специализированные задачи изолированно
 * - Session store: хранит историю разговора между перезагрузками
 *
 * КЛЮЧЕВАЯ ОСОБЕННОСТЬ:
 * Оркестратор имеет read_file tool, но использует его РЕДКО.
 * Субагенты читают файлы в изолированном контексте.
 * Контекст оркестратора остается чистым для долгих разговоров.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { getSessionStore } from '../services/session-store.js';
import { createChildLogger } from '../utils/logger.js';
import { getOrchestratorConfig } from '../config/agents.js';
import { DIRECT_SYSTEM_PROMPT } from '../agents/prompts/system-prompt.js';
import { listGames } from '../services/game-compiler.js';
import type Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import type { EventServer } from '../websocket/event-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createChildLogger({ module: 'conversation-orchestrator' });

export interface SSEEmitter {
  onToolStart: (toolName: string, toolUseId: string) => void;
  onToolComplete: (toolName: string, toolUseId: string) => void;
  onToolFailed: (toolName: string, toolUseId: string, error?: string) => void;
  onThinking: (text: string) => void;
  onExecuteConsole?: (code: string) => void;  // Новый метод для execute_console
}

export interface ConversationRequest {
  userMessage: string;
  sessionId?: string;
  requestId?: string;
  sseEmitter?: SSEEmitter;  // Optional SSE emitter for real-time events
}

export interface ConversationResponse {
  response: string;
  sessionId: string;
  agentsUsed: string[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Main conversation orchestration function
 */
export async function orchestrateConversation(
  request: ConversationRequest
): Promise<ConversationResponse> {
  const startTime = Date.now();
  const sessionStore = getSessionStore();

  logger.info(
    {
      requestId: request.requestId,
      sessionId: request.sessionId,
      messagePreview: request.userMessage.substring(0, 100),
    },
    'Starting conversation orchestration'
  );

  // Prepare to save full conversation trace
  const conversationTrace: any[] = [];
  const traceDir = path.join(process.cwd(), 'logs/conversation-traces');
  await fs.mkdir(traceDir, { recursive: true });

  // Load existing conversation history if session exists
  let conversationHistory = request.sessionId
    ? sessionStore.get(request.sessionId)
    : null;

  // Generate new session ID if needed
  const sessionId = request.sessionId || generateSessionId();

  if (!conversationHistory) {
    conversationHistory = [];
    logger.debug({ sessionId }, 'Created new conversation session');
  } else {
    logger.debug(
      { sessionId, messageCount: conversationHistory.length },
      'Loaded existing conversation session'
    );
  }

  // Add user message to history
  const userMessage: Anthropic.MessageParam = {
    role: 'user',
    content: request.userMessage,
  };
  conversationHistory.push(userMessage);

  // Get orchestrator configuration
  const orchestratorConfig = getOrchestratorConfig();

  // Build conversation history as text for system prompt
  let conversationHistoryText = '';
  if (conversationHistory.length > 1) {
    // Format all messages except the last one (which is current user message)
    const historyMessages = conversationHistory.slice(0, -1);
    conversationHistoryText = '\n\n## Previous Conversation\n\n' +
      historyMessages.map(msg => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return `**${msg.role === 'user' ? 'User' : 'Assistant'}:** ${content}`;
      }).join('\n\n');

    logger.info({
      sessionId,
      totalMessages: conversationHistory.length,
      historyMessagesIncluded: historyMessages.length,
      historyTextLength: conversationHistoryText.length
    }, '📚 Conversation history added to system prompt');
  } else {
    logger.info({ sessionId }, '📚 New conversation (no history)');
  }

  // IMPORTANT: Agent SDK should use Claude Code OAuth instead of API key
  // Temporarily remove API key from environment to force OAuth usage
  const savedApiKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  // Build final system prompt with dynamic info
  const existingGames = await listGames();
  const gamesListText = existingGames.length > 0
    ? `\n\n## 📂 Existing Games (use NEW filename to create, or READ existing to modify)\n${existingGames.map(g => `- ${g}.ts`).join('\n')}`
    : '';

  const systemPrompt = DIRECT_SYSTEM_PROMPT.replace('{{CWD}}', process.cwd()) + gamesListText;

  const result = query({
    prompt: request.userMessage,
    model: 'claude-haiku-4-5-20251001',
    options: {
      // CRITICAL: Set working directory to src/generated/games - agent can ONLY write here
      // This prevents agent from editing current-game.ts (auto-generated) or game-base.ts
      // __dirname = backend/src/orchestrator, so ../../../src/generated/games = project/src/generated/games
      cwd: path.resolve(__dirname, '../../../src/generated/games'),

      // Allow reading from project root (examples, docs) but writing only to cwd
      additionalDirectories: [path.resolve(__dirname, '../../..')],

      // ❌ SKILLS: Disabled - agent reads docs directly from backend/docs/
      settingSources: [],

      // NO SUBAGENTS - direct tool access only
      agents: {},

      // Built-in tools for direct file operations + MCP tools
      allowedTools: [
        'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash',
        'mcp__iwsdk-mcp__generate_3d_model',
        'mcp__iwsdk-mcp__list_models',
        'mcp__iwsdk-mcp__spawn_model',
        'mcp__iwsdk-mcp__remove_model'
      ],

      // Auto-allow all permissions (for API mode)
      permissionMode: 'bypassPermissions',

      // System prompt with conversation history
      systemPrompt: systemPrompt + conversationHistoryText,

      // Max iterations - configurable via env
      maxTurns: orchestratorConfig.maxTurns,

      // Budget limit (optional)
      maxBudgetUsd: orchestratorConfig.maxBudgetUsd,

      // NOTE: Agent SDK query() doesn't support 'messages' parameter!
      // History is passed via systemPrompt instead (see above)

      // MCP Server: IWSDK documentation + Meshy 3D model generation
      mcpServers: {
        'iwsdk-mcp': {
          command: 'node',
          args: [path.join(process.cwd(), 'mcp-server/dist/index.js')],
        }
      },

      // Hooks for progress tracking
      hooks: {
        PreToolUse: [{
          hooks: [async (input) => {
            // Send tool_use_start event via SSE
            if (request.sseEmitter) {
              request.sseEmitter.onToolStart(input.tool_name, input.tool_use_id);
            }

            logger.debug('PreToolUse hook triggered', {
              toolName: input.tool_name,
              toolUseId: input.tool_use_id,
            });

            return { ok: true };
          }]
        }],

        PostToolUse: [{
          hooks: [async (input) => {
            // Send tool_use_complete event via SSE
            if (request.sseEmitter) {
              request.sseEmitter.onToolComplete(input.tool_name, input.tool_use_id);
            }

            logger.debug('PostToolUse hook triggered', {
              toolName: input.tool_name,
              toolUseId: input.tool_use_id,
            });

            return { ok: true };
          }]
        }],

        PostToolUseFailure: [{
          hooks: [async (input) => {
            // Send tool_use_failed event via SSE
            if (request.sseEmitter) {
              request.sseEmitter.onToolFailed(input.tool_name, input.tool_use_id, input.error);
            }

            logger.warn('PostToolUseFailure hook triggered', {
              toolName: input.tool_name,
              toolUseId: input.tool_use_id,
              error: input.error,
            });

            return { ok: true };
          }]
        }],
      }
    },
  });

  // Collect responses
  const responses: string[] = [];
  const agentsUsed = new Set<string>();
  const toolsUsed = new Set<string>();
  const filesCreated: string[] = [];
  const filesModified: string[] = [];
  let assistantMessage = '';

  // Performance tracking
  let lastMessageTime = Date.now();
  let toolCallCount = 0;
  const toolCallTimings: Array<{tool: string, duration: number, input: string}> = [];

  // Tool tracking map: toolUseId -> toolName
  const toolUseIdMap = new Map<string, string>();

  // Human-readable flow for debugging
  const readableFlow: string[] = [];
  const addToFlow = (entry: string) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    readableFlow.push(`[${elapsed}s] ${entry}`);
  };

  // Set SSE emitter in global for MCP tools
  if (request.sseEmitter) {
    (global as any).__SSE_EMITTER__ = request.sseEmitter;
  }

  addToFlow(`User: "${request.userMessage}"`);

  for await (const message of result) {
    const currentTime = Date.now();
    const timeSinceLastMessage = currentTime - lastMessageTime;
    const elapsedSeconds = ((currentTime - startTime) / 1000).toFixed(1);

    // Save full message to trace
    conversationTrace.push({
      timestamp: new Date().toISOString(),
      elapsedSeconds: parseFloat(elapsedSeconds),
      timeSinceLastMessage,
      message: message
    });

    lastMessageTime = currentTime;

    // Agent SDK wraps messages in {type, message} structure
    // We need to extract content from message.message.content
    let content: any;

    if ('message' in message && typeof message.message === 'object' && message.message !== null) {
      // Extract from wrapped message (type: "assistant")
      content = (message.message as any).content;
    } else {
      // Direct content (legacy format)
      content = message.content;
    }

    // Extract text content
    if (typeof content === 'string') {
      responses.push(content);
      assistantMessage += content;
      addToFlow(`Assistant text: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if ('text' in block) {
          responses.push(block.text);
          assistantMessage += block.text;
          addToFlow(`Assistant text: "${block.text.substring(0, 100)}${block.text.length > 100 ? '...' : ''}"`);

          // Send onThinking ONLY for intermediate thoughts (when tools are being used)
          // Skip if this looks like final response (no pending tool calls)
          if (request.sseEmitter && toolCallCount > 0) {
            request.sseEmitter.onThinking(block.text);
          }
        }
        // Track which agents were used
        if ('name' in block && typeof block.name === 'string') {
          agentsUsed.add(block.name);
          addToFlow(`Agent used: ${block.name}`);
        }
        // Track tool usage
        if ('type' in block && block.type === 'tool_use' && 'name' in block) {
          toolCallCount++;
          const toolName = block.name as string;
          const toolUseId = 'id' in block ? (block.id as string) : `tool_${toolCallCount}`;
          toolsUsed.add(toolName);

          // Store mapping for later tool_result tracking
          toolUseIdMap.set(toolUseId, toolName);

          const toolInput = 'input' in block ? JSON.stringify(block.input) : 'no input';
          const toolInputPreview = toolInput.length > 200 ? toolInput.substring(0, 200) + '...' : toolInput;

          // Extract key info for flow
          let flowInfo = toolName;
          if ('input' in block && block.input) {
            const input = block.input as any;
            if (input.file_path) flowInfo += ` → ${input.file_path}`;
            if (input.pattern) flowInfo += ` → pattern: ${input.pattern}`;
            if (input.command) flowInfo += ` → ${input.command.substring(0, 50)}`;
          }
          addToFlow(`🔧 Tool #${toolCallCount}: ${flowInfo}`);

          // MANUAL: Send tool_use_start event (hooks don't work)
          if (request.sseEmitter) {
            request.sseEmitter.onToolStart(toolName, toolUseId);
          }

          // PERFORMANCE: Log ALL tool calls at INFO level with timing
          logger.info({
            toolCallNumber: toolCallCount,
            toolName,
            toolInput: toolInputPreview,
            timeSinceLastMessage,
            elapsedTotal: currentTime - startTime
          }, `🔧 Tool #${toolCallCount}: ${toolName}`);
        }
        // Track tool results (parse write_file/edit_file results)
        if ('type' in block && block.type === 'tool_result' && 'content' in block) {
          const isError = 'is_error' in block && block.is_error;
          const toolUseId = 'tool_use_id' in block ? (block.tool_use_id as string) : `tool_${toolCallCount}`;

          // Get tool name from map
          const toolName = toolUseIdMap.get(toolUseId) || 'unknown';

          // MANUAL: Send tool completion/failure event (hooks don't work)
          if (request.sseEmitter) {
            if (isError) {
              const errorMsg = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
              request.sseEmitter.onToolFailed(toolName, toolUseId, errorMsg);
            } else {
              request.sseEmitter.onToolComplete(toolName, toolUseId);
            }
          }

          // Add to flow
          if (isError) {
            addToFlow(`   ❌ Tool failed: ${JSON.stringify(block.content).substring(0, 100)}`);
          } else {
            addToFlow(`   ✓ Tool succeeded`);
          }

          try {
            const resultContent = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
            const resultData = JSON.parse(resultContent);

            if (resultData.success && resultData.filePath) {
              // Check if it's a write operation (new file)
              if (resultData.bytesWritten !== undefined) {
                filesCreated.push(resultData.filePath);
                addToFlow(`   📝 File created: ${resultData.filePath}`);
              }
              // Check if it's an edit operation (modified file)
              if (resultData.changes !== undefined) {
                filesModified.push(resultData.filePath);
                addToFlow(`   ✏️  File modified: ${resultData.filePath}`);
              }
            }
          } catch (e) {
            // Not JSON or not a file operation result - ignore
          }
        }
      }
    } else if (content === undefined) {
      // No content (system messages, etc.) - skip silently
    } else {
      logger.warn({ contentType: typeof content }, 'Unexpected content type from Agent SDK');
    }
  }

  // Restore API key for other services (like legacy orchestrator)
  if (savedApiKey) {
    process.env.ANTHROPIC_API_KEY = savedApiKey;
  }

  // Add assistant response to history
  const assistantResponse: Anthropic.MessageParam = {
    role: 'assistant',
    content: assistantMessage || 'Task completed.',
  };
  conversationHistory.push(assistantResponse);

  // Save updated conversation history with metadata
  sessionStore.set(sessionId, conversationHistory, {
    agentsUsed: Array.from(agentsUsed),
    toolsUsed: Array.from(toolsUsed),
    filesCreated,
    filesModified,
  });

  const duration = Date.now() - startTime;

  // PERFORMANCE SUMMARY with execution flow
  logger.info(
    {
      requestId: request.requestId,
      sessionId,
      duration,
      toolCallCount,
      toolsUsed: Array.from(toolsUsed),
      agentsUsed: Array.from(agentsUsed),
      filesCreated: filesCreated.length,
      filesModified: filesModified.length,
      messageLength: assistantMessage.length,
    },
    `⚡ Completed in ${(duration/1000).toFixed(1)}s | ${toolCallCount} tool calls | ${filesCreated.length} files created`
  );

  // Log readable flow (only to console once)
  logger.info({ flow: readableFlow }, '📊 Execution Flow:');

  // Save conversation trace to JSON file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const traceFile = path.join(traceDir, `conversation-${timestamp}-${sessionId.substring(0, 8)}.json`);

  try {
    await fs.writeFile(
      traceFile,
      JSON.stringify({
        metadata: {
          requestId: request.requestId,
          sessionId,
          userMessage: request.userMessage,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date().toISOString(),
          duration,
          durationSeconds: (duration / 1000).toFixed(2),
          toolCallCount,
          agentsUsed: Array.from(agentsUsed),
          toolsUsed: Array.from(toolsUsed),
          filesCreated,
          filesModified,
          experimentMode: 'direct-orchestrator-no-subagents'
        },
        readableFlow,
        trace: conversationTrace
      }, null, 2)
    );
    logger.info({ traceFile, duration, toolCallCount }, '📝 Conversation trace saved');
  } catch (error) {
    logger.error({ error, traceFile }, 'Failed to save conversation trace');
  }

  return {
    response: assistantMessage || 'Task completed.',
    sessionId,
    agentsUsed: Array.from(agentsUsed),
  };
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
