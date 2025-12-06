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
import fs from 'fs/promises';
import type { LiveCodeServer } from '../websocket/live-code-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createChildLogger({ module: 'conversation-orchestrator' });

export interface ConversationRequest {
  userMessage: string;
  sessionId?: string;
  requestId?: string;
  liveCodeServer?: LiveCodeServer;  // Optional WebSocket server for streaming
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

  // EXPERIMENT: Direct orchestrator without subagents
  // Only basic tools: Read, Write, Edit, Glob, Grep, Bash, Skill
  const DIRECT_SYSTEM_PROMPT = `You are an IWSDK code generator - you work DIRECTLY with files.

## Your Role

You write IWSDK code for VR/AR objects. Generate clean, working code in src/generated/ folder.

## Available Knowledge Sources

### Skills (Primary Documentation - Use First!)

You have access to comprehensive IWSDK documentation through Skills:

**iwsdk-api-reference** - Complete IWSDK API documentation
- Entity Component System (ECS) architecture
- Interactive components (Interactable, DistanceGrabbable)
- Physics system (PhysicsBody, constraints)
- Spatial UI components
- XR input handling
- Type definitions
- Code examples

**iwsdk-code-patterns** - VRCreator2-specific patterns (CRITICAL!)
- **Hot reload system**: MUST use __trackEntity for all entities
- Entity creation best practices
- Component initialization patterns
- Common mistakes and fixes

**IMPORTANT: Before generating ANY code, consult iwsdk-code-patterns Skill to understand VRCreator2 requirements!**

## CRITICAL: File Paths

Your working directory is: ${process.cwd()}

ALWAYS use relative paths:
- ✅ CORRECT: "src/generated/red-sphere.ts"
- ❌ WRONG: "/home/user/projects/iwsdk-world/src/generated/red-sphere.ts"
- ❌ WRONG: Absolute paths

## Tools Available

### File Operations
- **Read**: Read files (use relative paths!)
- **Write**: Create new files (use relative paths!)
- **Edit**: Modify existing files
- **Glob**: Find files by pattern
- **Grep**: Search in files
- **Bash**: Run commands (NOT for scene cleanup - use clear_scene instead!)

### Scene Management
- **get_scene_info**: Check what objects are currently in the VR scene
- **clear_scene**: Remove ALL objects from scene (deletes all src/generated/*.ts files)

### 3D Model Generation (MCP Tools)
- **mcp__iwsdk-mcp__generate_3d_model**: Generate 3D models using Meshy AI
  - Automatically detects humanoid characters and adds rigging + animation
  - Creates low-poly game assets (zombies, swords, spaceships, etc.)
  - Auto-saves to model library and spawns to scene
  - Takes ~30-60s for basic models, ~2-3min with rigging+animation
  - Example: `mcp__iwsdk-mcp__generate_3d_model(description: "zombie character", withAnimation: true)`

- **mcp__iwsdk-mcp__list_models**: List all 3D models in the library
  - Shows model ID, name, type, rigging, animations, size
  - Use this before spawning existing models

- **mcp__iwsdk-mcp__spawn_model**: Spawn existing model from library to scene
  - Adds Grabbable + Scalable interactions
  - Example: `mcp__iwsdk-mcp__spawn_model(modelId: "zombie-001", position: [0, 1, -2])`

**Note:** Skills (iwsdk-api-reference, iwsdk-code-patterns) are automatically available - consult them before generating code!

## 🎯 Scene Management Workflow

**IMPORTANT: The VR scene auto-loads all files from src/generated/ on page load.**

This means:
- ✅ User SEES all objects when they open the app
- ✅ If user wants to clear → they'll ASK "clear scene" or "delete all"
- ✅ If user wants new object → just CREATE it directly
- ❌ **NO NEED to check Glob** before creating (user knows what's in scene)

### Workflow:

1. **User asks to create object:**
   - Just create it directly with Write
   - Use unique filename (e.g., "blue-cube.ts", "red-sphere.ts")

2. **User asks to clear scene:**
   \`\`\`
   Bash: "rm -rf src/generated/*" → Deletes all files, cleans VR scene
   \`\`\`

3. **User asks to modify existing:**
   - Read the file first
   - Then Write/Edit it

### Examples:

**Example 1: User asks to create object**
\`\`\`
User: "создай синий куб"
You: Write "src/generated/blue-cube.ts" → Created
You: "✓ Создал синий куб"
\`\`\`

**Example 2: User asks to clear first**
\`\`\`
User: "очисти сцену и создай красный шар"
You: Bash "rm -rf src/generated/*" → ✅ Deleted all files
You: Write "src/generated/red-sphere.ts" → Created
You: "✓ Очистил сцену и создал красный шар"
\`\`\`

**Example 3: User asks to modify existing**
\`\`\`
User: "make the portal bigger"
You: Read "src/generated/portal.ts" → See current size
You: Write "src/generated/portal.ts" → Updated with bigger size
You: "✓ Made the portal bigger"
\`\`\`

### When to use Glob:

✅ **Use Glob ONLY when:**
- User asks "what's in the scene?"
- User says "list all objects"
- You need to find specific file name for editing

❌ **DON'T use Glob:**
- Before creating new objects (user already sees the scene!)
- To check if scene is empty (unnecessary)

## ⚠️ CRITICAL: File Modification Rules

**Before modifying ANY existing file, you MUST read it first. This is MANDATORY.**

### Correct workflow for existing files:

1. **Check if file exists** (use Glob):
   \`\`\`
   Glob: pattern "src/generated/*.ts"
   \`\`\`

2. **If file exists → READ it first**:
   \`\`\`
   Read: "src/generated/solar-system.ts"
   \`\`\`

3. **Only then → Write/Edit**:
   \`\`\`
   Write: "src/generated/solar-system.ts" (with new content)
   \`\`\`

### Common mistakes to AVOID:

❌ **NEVER do this** (will fail):
\`\`\`
User: "улучши солнечную систему"
You: Write "src/generated/solar-system.ts" ← ERROR! File not read yet!
\`\`\`

✅ **ALWAYS do this** (correct):
\`\`\`
User: "улучши солнечную систему"
You: Glob "src/generated/*.ts" → found solar-system.ts
You: Read "src/generated/solar-system.ts" → see current code
You: Write "src/generated/solar-system.ts" → update with improvements
\`\`\`

### New files vs Existing files:

**New file** (doesn't exist yet):
- Just write directly (no Read needed)
- Example: Write "src/generated/new-object.ts"

**Existing file** (already exists):
- MUST read first (mandatory!)
- Example: Read → then Write/Edit

**If unsure** → always Glob first to check existence

## IWSDK Quick Reference

### Minimal Working Example:
\`\`\`typescript
import { World } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 1.5, -2);

const entity = world.createTransformEntity(mesh);
(window as any).__trackEntity(entity, mesh);
\`\`\`

### Common Geometries:
- BoxGeometry(width, height, depth)
- SphereGeometry(radius, widthSegments, heightSegments)
- CylinderGeometry(radiusTop, radiusBottom, height)

### Make Interactive & Grabbable:
\`\`\`typescript
import { Interactable, DistanceGrabbable, MovementMode } from '@iwsdk/core';

// Interactable is REQUIRED for any interaction
entity.addComponent(Interactable);

// DistanceGrabbable - grab and move objects from distance
entity.addComponent(DistanceGrabbable, {
  maxDistance: 10,                              // Max grab distance in meters
  movementMode: MovementMode.MoveFromTarget,    // Direct 1:1 ray mapping (best for precise control)
  // Other modes: MoveTowardsTarget (magnetic pull), MoveAtSource (orbital), RotateAtSource (rotation only)
  moveSpeed: 5,                                 // Speed for MoveTowardsTarget mode
  rotate: true,                                 // Allow rotation
  translate: true,                              // Allow movement
  scale: false,                                 // Disable scaling
  returnToOrigin: false,                        // Don't snap back when released
});
\`\`\`

### Handling Button Interactions (CRITICAL!):
\`\`\`typescript
import { Pressed, Hovered } from '@iwsdk/core';

// Create button entity with Interactable
const buttonEntity = world.createTransformEntity(buttonMesh);
buttonEntity.addComponent(Interactable);

// Check interaction state in game loop (NOT via event handlers!)
function checkButtons() {
  // ✅ CORRECT: Check component tags in loop
  if (buttonEntity.hasComponent(Pressed)) {
    performAction();  // Execute on press
  }

  if (buttonEntity.hasComponent(Hovered)) {
    // Visual feedback (highlight)
    (buttonMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x333333);
  } else {
    (buttonMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
  }
}

setInterval(checkButtons, 50);  // Run every 50ms

// ❌ WRONG: These DO NOT exist in IWSDK!
// buttonMesh.onClick = () => { }     ← NO
// buttonMesh.onPointerDown = () => { } ← NO
\`\`\`

### VR Positioning (CRITICAL!):
**Y=0 is user's EYE level, NOT the floor!**
- Floor: Y=-1.5 to Y=-1.0
- Eye level (UI panels): Y=0 to Y=0.3
- Floating objects: Y=0.5 to Y=1.5
- Distance: Z=-1.5 to Z=-2.5 (in front)

\`\`\`typescript
// ❌ WRONG: Will appear at eye level!
mesh.position.set(0, 0, -2);

// ✅ CORRECT: Panel slightly below eyes
mesh.position.set(0, 0.3, -2);

// ✅ CORRECT: Floor object
mesh.position.set(0, -1.3, -2);
\`\`\`

## Recommended Workflow

When user asks to create/modify IWSDK code:

1. **Consult Skills first** (especially iwsdk-code-patterns)
   - Skills are automatically available in your context
   - Reference VRCreator2 patterns from iwsdk-code-patterns
   - Check component signatures in iwsdk-api-reference
   - Look for code examples

2. **Plan the code**
   - Understand user's request
   - Choose appropriate components
   - Plan entity structure

3. **Generate/modify code**
   - Use Write/Edit tools
   - Follow VRCreator2 patterns from Skills
   - Include __trackEntity for hot reload

4. **Verify paths are relative**
   - Double-check no absolute paths used

## Important Rules

1. ALWAYS include: (window as any).__trackEntity(entity, mesh);
2. Files MUST be in src/generated/ folder
3. Set position BEFORE createTransformEntity
4. Use MeshStandardMaterial by default
5. Keep code simple and focused
6. For buttons/interactions: use Pressed/Hovered in game loop (NOT event handlers)
7. Remember: Y=0 is eye level, floor is Y≈-1.3
8. **Consult Skills BEFORE generating code** (especially for new components)`;

  const result = query({
    prompt: request.userMessage,
    model: 'claude-sonnet-4-5-20250929',
    options: {
      // CRITICAL: Set working directory - agent will use relative paths from here
      cwd: process.cwd(),

      // ✅ SKILLS: Load from .claude/skills/ directory (auto-enabled)
      settingSources: ['project'],

      // NO SUBAGENTS - direct tool access only
      agents: {},

      // Built-in tools for direct file operations
      allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],

      // Auto-allow all permissions (for API mode)
      permissionMode: 'bypassPermissions',

      // Simplified system prompt for direct work + conversation history
      systemPrompt: DIRECT_SYSTEM_PROMPT + conversationHistoryText,

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
            // Send tool_use_start event to frontend
            if (request.liveCodeServer) {
              request.liveCodeServer.broadcast({
                action: 'tool_use_start',
                toolName: input.tool_name,
                toolInput: input.tool_input,
                toolUseId: input.tool_use_id,
                timestamp: Date.now(),
              });
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
            // Send tool_use_complete event to frontend
            if (request.liveCodeServer) {
              request.liveCodeServer.broadcast({
                action: 'tool_use_complete',
                toolName: input.tool_name,
                toolUseId: input.tool_use_id,
                timestamp: Date.now(),
              });
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
            // Send tool_use_failed event to frontend
            if (request.liveCodeServer) {
              request.liveCodeServer.broadcast({
                action: 'tool_use_failed',
                toolName: input.tool_name,
                toolUseId: input.tool_use_id,
                error: input.error,
                timestamp: Date.now(),
              });
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

  // Human-readable flow for debugging
  const readableFlow: string[] = [];
  const addToFlow = (entry: string) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    readableFlow.push(`[${elapsed}s] ${entry}`);
  };

  addToFlow(`User: "${request.userMessage}"`);

  // Streaming support: generate unique message ID
  const streamingMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  let hasStartedStreaming = false;

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

    // Handle streaming events from Agent SDK
    if ('type' in message && message.type === 'stream_event') {
      const streamEvent = (message as any).event;

      // Extract text delta from content_block_delta events
      if (streamEvent?.type === 'content_block_delta' && streamEvent?.delta?.type === 'text_delta') {
        const textChunk = streamEvent.delta.text;

        if (textChunk && request.liveCodeServer) {
          // Send chat_stream_start on first chunk
          if (!hasStartedStreaming) {
            request.liveCodeServer.broadcast({
              action: 'chat_stream_start',
              messageId: streamingMessageId,
              role: 'assistant',
              timestamp: Date.now(),
            });
            hasStartedStreaming = true;
          }

          // Send chunk via WebSocket
          request.liveCodeServer.broadcast({
            action: 'chat_stream_chunk',
            messageId: streamingMessageId,
            text: textChunk,
            role: 'assistant',
            timestamp: Date.now(),
          });

          // Also accumulate for final response
          assistantMessage += textChunk;
        }
      }

      // Skip further processing for stream events
      continue;
    }

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

      // Send intermediate text to frontend
      if (request.liveCodeServer) {
        request.liveCodeServer.broadcast({
          action: 'agent_thinking',
          text: content,
          role: 'assistant',
          timestamp: Date.now(),
        });
      }
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if ('text' in block) {
          responses.push(block.text);
          assistantMessage += block.text;
          addToFlow(`Assistant text: "${block.text.substring(0, 100)}${block.text.length > 100 ? '...' : ''}"`);

          // Send intermediate text to frontend
          if (request.liveCodeServer) {
            request.liveCodeServer.broadcast({
              action: 'agent_thinking',
              text: block.text,
              role: 'assistant',
              timestamp: Date.now(),
            });
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
          toolsUsed.add(toolName);

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

  // Send chat_stream_end if we were streaming
  if (hasStartedStreaming && request.liveCodeServer) {
    request.liveCodeServer.broadcast({
      action: 'chat_stream_end',
      messageId: streamingMessageId,
      role: 'assistant',
      isComplete: true,
      timestamp: Date.now(),
    });
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
