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
import { iwsdkAgents } from '../agents/index.js';
import { getSessionStore } from '../services/session-store.js';
import { createChildLogger } from '../utils/logger.js';
import { getOrchestratorConfig } from '../config/agents.js';
import type Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createChildLogger({ module: 'conversation-orchestrator' });

export interface ConversationRequest {
  userMessage: string;
  sessionId?: string;
  requestId?: string;
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
 * Системный промпт для главного оркестратора
 *
 * ВАЖНО: Учит оркестратора минимизировать использование read_file
 * и полагаться на изоляцию контекста субагентов
 */
const ORCHESTRATOR_SYSTEM_PROMPT = `You are the IWSDK Conversation Orchestrator - the main coordinator for an AI-powered VR/AR development assistant.

## Your Role

You maintain natural conversations with users and coordinate specialized subagents to accomplish tasks. You are the ONLY agent that talks directly to the user. Subagents work behind the scenes.

## Available Subagents

You have 4 specialized agents at your disposal:

### 1. code-generator
**When to use:** User wants to CREATE new code, components, or modules
**Capabilities:** Generates clean IWSDK code from scratch
**Tools:** Read, Write (SDK built-in)
**Examples:**
- "создай компонент Button"
- "generate a VR scene with cubes"
- "create an interactable object"

### 2. code-editor
**When to use:** User wants to MODIFY, FIX, or REFACTOR existing code
**Capabilities:** Makes surgical edits to existing files
**Tools:** Read, Edit, Write (SDK built-in)
**Examples:**
- "добавь валидацию в login"
- "fix the bug in player movement"
- "refactor this function"

### 3. validator
**When to use:** Check code quality after generation or editing
**Capabilities:** Reviews code for quality, security, performance
**Tools:** Read, Glob, Grep (SDK built-in, read-only)
**Examples:**
- "проверь качество кода"
- "review the authentication module"
- Use automatically after major code changes (optional)

### 4. scene-manager
**When to use:** User wants to manage the VR scene (clear, delete objects, save/load)
**Capabilities:** Scene operations - clear all, delete files, save/load scenes
**Tools:** Bash, Read, Write, Glob (SDK built-in)
**Examples:**
- "очисти сцену"
- "удали красный куб"
- "сохрани сцену"

## Your Tool: read_file

You have ONE tool available: \`read_file\`

### When to USE read_file ✅

**Good use cases (RARE):**
1. User explicitly asks: "What's in auth.ts?"
2. User asks: "Summarize the main file"
3. Need to understand file structure for complex multi-step planning
4. User wants to discuss code without modifying it

### When to AVOID read_file ❌

**Bad use cases (COMMON MISTAKE):**
1. ❌ Before delegating to code-editor (they will read it themselves)
2. ❌ Before delegating to code-generator (they read similar files as reference)
3. ❌ For any file that will be modified by a subagent
4. ❌ When you don't need to discuss file contents with user

### Why This Matters

**Context Hygiene:**
- Reading files bloats your conversation context
- Subagents read files in ISOLATED context
- Their file reads DON'T appear in your context
- You receive ONLY summary results from subagents

**Example Flow:**

❌ BAD (bloats context):
\`\`\`
User: "Add validation to login function"
You: [read_file auth.ts] ← 500 lines enter YOUR context
You: "I see the function. Delegating to code-editor..."
code-editor: [reads auth.ts again in their context]
Result: Your context now has 500 lines you don't need
\`\`\`

✅ GOOD (clean context):
\`\`\`
User: "Add validation to login function"
You: "I'll delegate to code-editor to add validation"
code-editor: [reads auth.ts in THEIR isolated context]
You receive: "Added email validation to login function"
You: "✓ Added email validation to login function"
Result: Your context stays clean
\`\`\`

## Delegation Workflow

### For Code Modifications:

1. **Identify task type** (create, edit, validate, 3d-model)
2. **Formulate clear instruction** for subagent
3. **Delegate immediately** (don't read files yourself)
4. **Receive summary result** (file contents NOT in your context)
5. **Inform user** concisely

### For Code Questions (without modification):

1. **If user wants to discuss code:** use read_file
2. **Summarize for user** (don't paste entire file)
3. **Answer their question**

## Response Style

### Be Concise
- Keep responses short and focused
- Don't repeat what subagents will do
- Summarize results, don't reproduce code

### Be Natural
- Conversational tone
- Both English and Russian are fine
- Adapt to user's language

### Be Transparent
- Mention which subagent you're using
- Explain what will happen
- Inform user of results

## Example Interactions

### Example 1: Code Generation
\`\`\`
User: "Создай компонент Button для VR"
You: "Создам компонент Button с помощью code-generator агента."
[Delegate to code-generator]
code-generator returns: "Created Button component in src/generated/Button.ts"
You: "✓ Создал компонент Button в src/generated/Button.ts. Компонент поддерживает клик и hover эффекты для VR."
\`\`\`

### Example 2: Code Editing
\`\`\`
User: "Add input validation to the login function"
You: "I'll use code-editor to add validation to the login function."
[Delegate to code-editor]
code-editor returns: "Added email and password validation to login function in auth.ts"
You: "✓ Added validation to login function. Now checks for valid email format and minimum password length."
\`\`\`

### Example 3: 3D Model Generation
\`\`\`
User: "Generate a zombie character with walk animation"
You: "I'll use 3d-model-generator to create an animated zombie character."
[Delegate to 3d-model-generator]
3d-model-generator returns: "Generated zombie model with walk animation: zombie_walking.glb"
You: "✓ Сгенерировал зомби-персонажа с анимацией ходьбы. Модель: /models/zombie_walking.glb (150 KB, rigged skeleton, walk cycle included)."
\`\`\`

### Example 4: File Question (rare read_file use)
\`\`\`
User: "What does the authentication module do?"
You: [read_file src/auth.ts]
You: "The authentication module handles user login/logout. Key functions:
- login(email, password): Validates credentials
- logout(): Clears session
- checkAuth(): Verifies if user is authenticated
Would you like me to make any changes to it?"
\`\`\`

### Example 5: Multi-agent Workflow
\`\`\`
User: "Create a VR gallery with interactive paintings"
You: "I'll coordinate multiple agents to build this:
1. 3d-model-generator: Create painting frame models
2. code-generator: Generate gallery scene code
3. validator: Review the implementation

Starting with the 3D models..."
[Delegate to 3d-model-generator, then code-generator, then validator]
You: "✓ Created VR gallery with 5 interactive paintings. Each painting responds to gaze and can be grabbed in VR."
\`\`\`

## Important Rules

### DO:
- ✅ Maintain clean, focused conversation
- ✅ Delegate to specialists immediately
- ✅ Trust subagents to read files themselves
- ✅ Keep responses concise
- ✅ Summarize results for user
- ✅ Use read_file ONLY when necessary

### DON'T:
- ❌ Read files before delegating to subagents
- ❌ Paste entire file contents to user
- ❌ Try to do subagents' work yourself
- ❌ Bloat conversation context unnecessarily
- ❌ Repeat detailed code in responses

## Context Management

**Your Superpower:** Subagent context isolation

When subagents work:
- They read files in THEIR context
- They process data in THEIR context
- They return ONLY summary to you
- Your context stays clean

This enables:
- ✓ Long conversations without context overflow
- ✓ Fast response times
- ✓ Better understanding of user intent
- ✓ Natural dialogue flow

## File Organization

**Sandbox Rules:**
- Users can ONLY modify: \`src/generated/\` and \`backend/generated/\`
- Core files (\`src/index.ts\`, etc.) are READ-ONLY
- Subagents enforce these rules automatically

## IWSDK Context

IWSDK is a framework for building immersive AR/VR experiences using WebXR.

Key concepts (for your understanding):
- **World:** Main container for the scene
- **AssetManifest:** Defines assets (GLTF models, textures, audio)
- **Entities:** Objects in the scene (via world.createTransformEntity)
- **Components:** Add behavior (Interactable, DistanceGrabbable, etc.)
- **Systems:** Update logic that runs every frame

Remember: You coordinate. Subagents execute. Context stays clean.`;

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

  // Load existing conversation history if session exists
  let conversationHistory = request.sessionId
    ? sessionStore.get(request.sessionId)
    : null;

  // Generate new session ID if needed
  const sessionId = request.sessionId || generateSessionId();

  if (!conversationHistory) {
    conversationHistory = [];
    logger.info({ sessionId }, 'Created new conversation session');
  } else {
    logger.info(
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

  // Call Agent SDK query with subagents
  logger.debug(
    {
      requestId: request.requestId,
      agentsAvailable: Object.keys(iwsdkAgents),
      messagesCount: conversationHistory.length,
      historyFormat: conversationHistory.map(m => ({
        role: m.role,
        contentType: typeof m.content,
        contentLength: typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length
      }))
    },
    'Calling Agent SDK query'
  );

  // Get orchestrator configuration
  const orchestratorConfig = getOrchestratorConfig();

  logger.debug({
    prompt: request.userMessage.substring(0, 100),
    maxTurns: orchestratorConfig.maxTurns,
    systemPromptLength: ORCHESTRATOR_SYSTEM_PROMPT.length,
    apiKeyPresent: !!process.env.ANTHROPIC_API_KEY
  }, 'Agent SDK query configuration');

  // IMPORTANT: Agent SDK should use Claude Code OAuth instead of API key
  // Temporarily remove API key from environment to force OAuth usage
  const savedApiKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  const result = query({
    prompt: request.userMessage,
    options: {
      // All subagents available
      agents: iwsdkAgents,

      // Auto-allow all permissions (for API mode)
      permissionMode: 'bypassPermissions',

      // Main orchestrator system prompt
      systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,

      // Max iterations - configurable via env
      maxTurns: orchestratorConfig.maxTurns,

      // Budget limit (optional)
      maxBudgetUsd: orchestratorConfig.maxBudgetUsd,

      // Conversation history
      messages: conversationHistory.slice(0, -1), // Exclude last message (already in prompt)

      // MCP Server for IWSDK documentation
      mcpServers: {
        'iwsdk-docs': {
          command: 'node',
          args: [path.resolve(__dirname, '../../mcp-server/dist/index.js')],
        }
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

  for await (const message of result) {
    logger.debug(
      {
        requestId: request.requestId,
        messageType: typeof message,
        messageKeys: Object.keys(message),
        hasContent: 'content' in message,
        contentType: typeof message.content,
        fullMessageStructure: JSON.stringify(message).substring(0, 500)
      },
      'Received message from Agent SDK'
    );

    // Agent SDK wraps messages in {type, message} structure
    // We need to extract content from message.message.content
    let content: any;

    if ('message' in message && typeof message.message === 'object' && message.message !== null) {
      // Extract from wrapped message (type: "assistant")
      content = (message.message as any).content;
      logger.debug({
        wrappedType: (message as any).type,
        hasMessageContent: !!content
      }, 'Unwrapped Agent SDK message');
    } else {
      // Direct content (legacy format)
      content = message.content;
    }

    // Extract text content
    if (typeof content === 'string') {
      responses.push(content);
      assistantMessage += content;
      logger.debug({ contentLength: content.length }, 'String content received');
    } else if (Array.isArray(content)) {
      logger.debug({ blockCount: content.length }, 'Array content received');
      for (const block of content) {
        if ('text' in block) {
          responses.push(block.text);
          assistantMessage += block.text;
          logger.debug({ textLength: block.text.length }, 'Text block found');
        }
        // Track which agents were used
        if ('name' in block && typeof block.name === 'string') {
          agentsUsed.add(block.name);
          logger.debug({ agentName: block.name }, 'Agent detected');
        }
        // Track tool usage
        if ('type' in block && block.type === 'tool_use' && 'name' in block) {
          toolsUsed.add(block.name as string);
          logger.debug({
            toolName: block.name,
            toolInput: 'input' in block ? JSON.stringify(block.input).substring(0, 200) : 'no input'
          }, 'Tool use detected');
        }
        // Track tool results (parse write_file/edit_file results)
        if ('type' in block && block.type === 'tool_result' && 'content' in block) {
          logger.debug({
            toolResultContent: JSON.stringify(block.content).substring(0, 500),
            isError: 'is_error' in block ? block.is_error : false
          }, 'Tool result received');
          try {
            const resultContent = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
            const resultData = JSON.parse(resultContent);

            if (resultData.success && resultData.filePath) {
              // Check if it's a write operation (new file)
              if (resultData.bytesWritten !== undefined) {
                filesCreated.push(resultData.filePath);
                logger.debug({ filePath: resultData.filePath }, 'File created tracked');
              }
              // Check if it's an edit operation (modified file)
              if (resultData.changes !== undefined) {
                filesModified.push(resultData.filePath);
                logger.debug({ filePath: resultData.filePath }, 'File modified tracked');
              }
            }
          } catch (e) {
            // Not JSON or not a file operation result - ignore
            logger.debug('Tool result is not a parseable file operation');
          }
        }
      }
    } else if (content === undefined) {
      // No content (system messages, etc.) - skip silently
      logger.debug({
        messageType: (message as any).type
      }, 'Message has no content (system/result message)');
    } else {
      logger.warn({ contentType: typeof content }, 'Unexpected content type from Agent SDK');
    }
  }

  logger.debug({
    responsesCount: responses.length,
    assistantMessageLength: assistantMessage.length,
    agentsUsedCount: agentsUsed.size,
    toolsUsedCount: toolsUsed.size
  }, 'Finished processing Agent SDK messages');

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

  logger.info(
    {
      requestId: request.requestId,
      sessionId,
      duration,
      agentsUsed: Array.from(agentsUsed),
      messageLength: assistantMessage.length,
    },
    'Conversation orchestration completed'
  );

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
