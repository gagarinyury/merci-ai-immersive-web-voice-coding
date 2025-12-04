/**
 * Meshy AI Tool - 3D Model Generation with Rigging & Animation
 *
 * Currently Implemented:
 * ✅ Text-to-3D generation (preview mode - geometry only)
 * ✅ Auto-rigging for humanoid models
 * ✅ Basic animations (walk, run - automatic with rigging)
 * ✅ GLB analysis for metadata extraction
 * ✅ File size optimization (sculpture style, 100 polycount)
 *
 * TODO - Future Meshy AI Features:
 *
 * 🎨 Generation Methods:
 * - [ ] Image-to-3D: Convert images to 3D models (single/multiple images)
 * - [ ] Multi-image input: Better quality with multiple reference angles
 *
 * 🔧 Post-Processing:
 * - [ ] Remesh API: Refine and optimize existing models, export to formats
 * - [ ] Retexture API: Apply new textures to existing geometry
 *
 * 🏃 Animation Expansion:
 * - [ ] Custom Animation Library: 589 animations via action_id
 *       Categories: idle, combat, dancing, parkour, climbing, emotes, etc.
 *       Workflow: preview (40-60s) → rigging (40-60s) → animation (30-60s)
 *       Endpoint: POST /openapi/v1/animations
 *
 * 🔌 Integration:
 * - [ ] Webhooks: Real-time task completion notifications (replace polling)
 * - [ ] Balance API: Check Meshy credit balance
 *
 * Performance Notes:
 * - Current settings: 100 polycount, sculpture style → ~7.7MB GLB files
 * - Generation times: 40-90s (preview), 40-60s (rigging), 30-60s (animation)
 * - Models served via /models/:filename endpoint
 */

import Anthropic from '@anthropic-ai/sdk';
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { config } from '../../config/env.js';
import { getMeshyConfig, mapModelToFullId } from '../config/agents.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get Meshy configuration from centralized config
const meshyConfig = getMeshyConfig();

// Environment configuration
const MESHY_API_KEY = meshyConfig.apiKey;
const BASE_URL = 'https://api.meshy.ai';
const MODELS_DIR = path.join(__dirname, '../../generated/models');

// Anthropic client for prompt enhancement
const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

// Ensure models directory exists
await fs.mkdir(MODELS_DIR, { recursive: true });

// Default generation settings - ULTRA low poly for VR performance
const DEFAULT_CONFIG = {
  ai_model: meshyConfig.model, // Configurable via env
  art_style: 'sculpture', // sculpture имеет baked textures - меньше вес
  target_polycount: 100,   // Экстремально низкий polycount - PS1 style
  topology: 'triangle' as const,
  should_remesh: false
};

// Humanoid detection keywords
const HUMANOID_KEYWORDS = [
  'human', 'person', 'man', 'woman', 'boy', 'girl', 'child',
  'character', 'hero', 'villain', 'zombie', 'soldier', 'warrior',
  'robot', 'android', 'cyborg', 'alien', 'monster', 'creature',
  'knight', 'wizard', 'mage', 'archer', 'ninja', 'samurai',
  'человек', 'персонаж', 'герой', 'враг', 'зомби', 'солдат', 'робот'
];

// Animation IDs for basic locomotion
export const ANIMATIONS = {
  IDLE: 0,
  WALK: 1,              // Walking_Woman
  CASUAL_WALK: 30,      // Casual_Walk
  CONFIDENT_WALK: 106,  // Confident_Walk
  QUICK_WALK: 115,      // Quick_Walk
  IDLE_02: 11,
  IDLE_03: 12
};

// Types
interface MeshyTask {
  result: string; // task ID
}

interface MeshyStatus {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  progress: number;
  model_urls?: {
    glb: string;
    fbx?: string;
    usdz?: string;
  };
  task_error?: {
    message: string;
  };
}

interface RiggingResult {
  id: string;
  status: string;
  progress: number;
  result?: {
    rigged_character_glb_url: string;
    rigged_character_fbx_url: string;
    basic_animations?: {
      walking_glb_url: string;
      walking_fbx_url: string;
      walking_armature_glb_url: string;
      running_glb_url: string;
      running_fbx_url: string;
      running_armature_glb_url: string;
    };
  };
}

interface AnimationResult {
  id: string;
  status: string;
  progress: number;
  model_urls?: {
    glb: string;
    fbx: string;
  };
}

interface GLBMetadata {
  nodeCount: number;
  meshCount: number;
  animationCount: number;
  hasSkeleton: boolean;
  boneCount: number;
  facing: string;
  suggestedRotationY: number;
  error?: string;
}

interface GenerationResult {
  success: boolean;
  taskId: string;
  filename: string;
  localPath: string;
  servePath: string;
  sizeKB: string;
  prompt: {
    original: string;
    enhanced: string;
  };
  isHumanoid: boolean;
  metadata: GLBMetadata;
  rigged?: boolean;
  hasWalkAnimation?: boolean;
}

/**
 * Check if prompt describes a humanoid character
 */
function isHumanoidModel(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return HUMANOID_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Enhance user prompt for better Meshy results using Claude
 */
async function enhancePrompt(userPrompt: string, isHumanoid: boolean): Promise<string> {
  const systemPrompt = `You are a 3D model prompt optimizer for Meshy.ai API.

Your task: Transform user request into optimal Meshy prompt.

RULES:
1. Output ONLY the enhanced prompt (max 100 characters)
2. Always add: "low poly, simple geometric shapes, faceted, game asset"
3. For humanoid models: add "T-pose, arms spread horizontally"
4. Remove any style words that don't work in API (cartoon, anime, voxel)
5. Be specific about the object
6. English only

Examples:
- "сделай зомби" -> "low poly zombie character, T-pose, arms spread, faceted, game asset"
- "пистолет" -> "low poly pistol, simple geometric shapes, faceted, game asset"
- "дерево" -> "low poly tree, simple geometric trunk and foliage, faceted, game asset"

User request: "${userPrompt}"
Is humanoid: ${isHumanoid}

Enhanced prompt:`;

  try {
    const response = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: 100,
      temperature: meshyConfig.temperature, // Configurable via env
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const textContent = response.content.find(block => block.type === 'text');
    const enhancedPrompt = textContent && 'text' in textContent ? textContent.text : '';

    return enhancedPrompt.trim().replace(/^["']|["']$/g, '');
  } catch (error: any) {
    logger.error({ event: 'prompt_enhance_error', error: error.message });
    // Fallback to basic enhancement
    const base = isHumanoid
      ? `low poly ${userPrompt}, T-pose, arms spread, faceted, game asset`
      : `low poly ${userPrompt}, simple geometric shapes, faceted, game asset`;
    return base.substring(0, 600);
  }
}

/**
 * Create preview generation task (geometry only, no textures)
 */
async function createPreviewTask(prompt: string, isHumanoid: boolean): Promise<string> {
  const body: any = {
    mode: 'preview',
    prompt: prompt,
    ai_model: DEFAULT_CONFIG.ai_model,
    art_style: DEFAULT_CONFIG.art_style,
    target_polycount: DEFAULT_CONFIG.target_polycount,
    topology: DEFAULT_CONFIG.topology,
    should_remesh: DEFAULT_CONFIG.should_remesh
  };

  // Add T-pose for humanoid models
  if (isHumanoid) {
    body.is_a_t_pose = true;
    body.symmetry_mode = 'on';
  }

  logger.info({ event: 'meshy_create_task', body });

  const response = await fetch(`${BASE_URL}/v2/text-to-3d`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MESHY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meshy API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as MeshyTask;
  return data.result;
}

/**
 * Poll task status until completion
 */
async function waitForTask(taskId: string, onProgress?: (progress: number, elapsed: string, status: string) => void): Promise<MeshyStatus> {
  const startTime = Date.now();
  let lastProgress = -1;

  while (true) {
    const response = await fetch(`${BASE_URL}/v2/text-to-3d/${taskId}`, {
      headers: { 'Authorization': `Bearer ${MESHY_API_KEY}` }
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const status = await response.json() as MeshyStatus;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (status.progress !== lastProgress) {
      lastProgress = status.progress;
      if (onProgress) {
        onProgress(status.progress, elapsed, status.status);
      }
      logger.debug({
        event: 'meshy_poll_progress',
        taskId,
        progress: status.progress,
        elapsed
      });
    }

    if (status.status === 'SUCCEEDED') {
      logger.info({
        event: 'meshy_task_success',
        taskId,
        hasModelUrls: !!status.model_urls,
        modelUrls: status.model_urls
      });
      return status;
    }

    if (status.status === 'FAILED') {
      throw new Error(`Generation failed: ${status.task_error?.message || 'Unknown error'}`);
    }

    // Poll every 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

/**
 * Download model to local storage
 */
async function downloadModel(url: string, filename: string): Promise<{ path: string; size: number; sizeKB: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const filepath = path.join(MODELS_DIR, filename);

  await fs.writeFile(filepath, Buffer.from(buffer));

  const stats = await fs.stat(filepath);
  return {
    path: filepath,
    size: stats.size,
    sizeKB: (stats.size / 1024).toFixed(1)
  };
}

/**
 * Analyze GLB file for orientation metadata
 */
async function analyzeGLB(filepath: string): Promise<GLBMetadata> {
  try {
    const buffer = await fs.readFile(filepath);

    // Parse GLB header
    const magic = buffer.readUInt32LE(0);
    if (magic !== 0x46546C67) { // 'glTF'
      return { error: 'Not a valid GLB file' } as any;
    }

    // Read JSON chunk
    const jsonChunkLength = buffer.readUInt32LE(12);
    const jsonData = JSON.parse(buffer.subarray(20, 20 + jsonChunkLength).toString('utf-8'));

    const nodes = jsonData.nodes || [];
    const meshes = jsonData.meshes || [];
    const animations = jsonData.animations || [];

    // Detect skeleton
    const boneKeywords = ['hips', 'spine', 'head', 'arm', 'leg', 'hand', 'foot', 'neck', 'shoulder'];
    const bones = nodes.filter((n: any) => {
      const name = (n.name || '').toLowerCase();
      return boneKeywords.some(b => name.includes(b));
    });

    const hasSkeleton = bones.length > 0;

    // Determine facing direction from skeleton
    let facing = 'unknown';
    if (hasSkeleton) {
      const headNode = nodes.find((n: any) => (n.name || '').toLowerCase().includes('head'));
      if (headNode && headNode.translation) {
        facing = headNode.translation[2] > 0 ? 'positive_z' : 'negative_z';
      }
    }

    return {
      nodeCount: nodes.length,
      meshCount: meshes.length,
      animationCount: animations.length,
      hasSkeleton,
      boneCount: bones.length,
      facing,
      suggestedRotationY: facing === 'negative_z' ? Math.PI : 0
    };
  } catch (error: any) {
    logger.error({ event: 'glb_analyze_error', error: error.message });
    return { error: error.message } as any;
  }
}

/**
 * Create rigging task for humanoid model
 */
async function createRiggingTask(previewTaskId: string): Promise<string> {
  logger.info({ event: 'meshy_rigging_start', taskId: previewTaskId });

  const response = await fetch(`${BASE_URL}/openapi/v1/rigging`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MESHY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input_task_id: previewTaskId,
      height_meters: 1.7 // Default character height
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Rigging failed: ${response.status} - ${error}`);
  }

  const data = await response.json() as { result: string };
  logger.info({ event: 'meshy_rigging_created', taskId: data.result });
  return data.result;
}

/**
 * Wait for rigging task completion
 */
async function waitForRigging(taskId: string, onProgress?: (progress: number, elapsed: string, status: string) => void): Promise<RiggingResult> {
  const startTime = Date.now();
  let lastProgress = -1;

  while (true) {
    const response = await fetch(`${BASE_URL}/openapi/v1/rigging/${taskId}`, {
      headers: { 'Authorization': `Bearer ${MESHY_API_KEY}` }
    });

    if (!response.ok) {
      throw new Error(`Rigging status check failed: ${response.status}`);
    }

    const status = await response.json() as RiggingResult;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (status.progress !== lastProgress) {
      lastProgress = status.progress;
      if (onProgress) {
        onProgress(status.progress, elapsed, status.status);
      }
      logger.debug({ event: 'meshy_rigging_progress', taskId, progress: status.progress, elapsed });
    }

    if (status.status === 'SUCCEEDED') {
      logger.info({
        event: 'meshy_rigging_success',
        taskId,
        hasResult: !!status.result,
        hasAnimations: !!status.result?.basic_animations
      });
      return status;
    }

    if (status.status === 'FAILED') {
      throw new Error('Rigging failed');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

/**
 * Create animation task
 */
async function createAnimationTask(rigTaskId: string, actionId: number): Promise<string> {
  logger.info({ event: 'meshy_animation_start', rigTaskId, actionId });

  const response = await fetch(`${BASE_URL}/openapi/v1/animations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MESHY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rig_task_id: rigTaskId,
      action_id: actionId,
      post_process: {
        operation_type: 'extract_armature'
      },
      fps: 30
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Animation failed: ${response.status} - ${error}`);
  }

  const data = await response.json() as { result: string };
  logger.info({ event: 'meshy_animation_created', taskId: data.result });
  return data.result;
}

/**
 * Wait for animation task completion
 */
async function waitForAnimation(taskId: string, onProgress?: (progress: number, elapsed: string, status: string) => void): Promise<AnimationResult> {
  const startTime = Date.now();
  let lastProgress = -1;

  while (true) {
    const response = await fetch(`${BASE_URL}/openapi/v1/animations/${taskId}`, {
      headers: { 'Authorization': `Bearer ${MESHY_API_KEY}` }
    });

    if (!response.ok) {
      throw new Error(`Animation status check failed: ${response.status}`);
    }

    const status = await response.json() as AnimationResult;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (status.progress !== lastProgress) {
      lastProgress = status.progress;
      if (onProgress) {
        onProgress(status.progress, elapsed, status.status);
      }
      logger.debug({ event: 'meshy_animation_progress', taskId, progress: status.progress, elapsed });
    }

    if (status.status === 'SUCCEEDED') {
      return status;
    }

    if (status.status === 'FAILED') {
      throw new Error('Animation failed');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

/**
 * Main generation function
 */
export async function generateModel(
  userPrompt: string,
  options?: {
    withRigging?: boolean;
    withAnimation?: boolean;
    useRunAnimation?: boolean;
    animationId?: number;
    onProgress?: (progress: number, elapsed: string, status: string) => void;
  }
): Promise<GenerationResult> {
  logger.info({ event: 'meshy_generate_start', prompt: userPrompt, options });

  // 1. Detect if humanoid
  const isHumanoid = isHumanoidModel(userPrompt);
  logger.debug({ event: 'humanoid_detection', isHumanoid, prompt: userPrompt });

  // 2. Enhance prompt
  const enhancedPrompt = await enhancePrompt(userPrompt, isHumanoid);
  logger.info({ event: 'prompt_enhanced', original: userPrompt, enhanced: enhancedPrompt });

  // 3. Create generation task
  const taskId = await createPreviewTask(enhancedPrompt, isHumanoid);
  logger.info({ event: 'meshy_task_created', taskId });

  // 4. Wait for completion
  const result = await waitForTask(taskId, options?.onProgress);

  // 5. Check if model_urls exists
  if (!result.model_urls || !result.model_urls.glb) {
    throw new Error(`Model generation succeeded but no download URL returned. Status: ${result.status}`);
  }

  // 6. Download base model
  const glbUrl = result.model_urls.glb;
  let filename = `${taskId}.glb`;
  let download = await downloadModel(glbUrl, filename);

  logger.info({
    event: 'meshy_download_complete',
    filename,
    sizeKB: download.sizeKB
  });

  // 6. Analyze GLB for metadata
  let metadata = await analyzeGLB(download.path);

  // 7. Apply rigging if requested and humanoid
  let rigged = false;
  let hasWalkAnimation = false;

  if (isHumanoid && (options?.withRigging || options?.withAnimation)) {
    logger.info({ event: 'meshy_rigging_requested' });

    // Create rigging task
    const rigTaskId = await createRiggingTask(taskId);
    const rigResult = await waitForRigging(rigTaskId, options?.onProgress);

    // Check if rigging result exists
    if (!rigResult.result || !rigResult.result.rigged_character_glb_url) {
      throw new Error(`Rigging succeeded but no download URL returned. Status: ${rigResult.status}`);
    }

    // Download rigged model with animation
    // walking_glb_url - skeleton + walk animation
    // running_glb_url - skeleton + run animation
    const animUrl = options?.useRunAnimation
      ? rigResult.result.basic_animations?.running_glb_url
      : rigResult.result.basic_animations?.walking_glb_url;

    const riggedUrl = animUrl || rigResult.result.rigged_character_glb_url;
    const animType = options?.useRunAnimation ? 'running' : 'walking';
    filename = `${rigTaskId}_${animUrl ? animType : 'rigged'}.glb`;
    download = await downloadModel(riggedUrl, filename);
    rigged = true;
    hasWalkAnimation = !!animUrl;

    logger.info({ event: 'meshy_rigging_complete', filename, hasWalkAnimation });

    // Re-analyze rigged model
    metadata = await analyzeGLB(download.path);
  }

  // 8. Build result
  const modelResult: GenerationResult = {
    success: true,
    taskId,
    filename,
    localPath: download.path,
    servePath: `/models/${filename}`,
    sizeKB: download.sizeKB,
    prompt: {
      original: userPrompt,
      enhanced: enhancedPrompt
    },
    isHumanoid,
    metadata,
    rigged,
    hasWalkAnimation
  };

  logger.info({ event: 'meshy_generate_complete', result: modelResult });

  return modelResult;
}

/**
 * Claude tool definition using betaZodTool
 *
 * UPDATED: Now auto-saves to library and auto-spawns to scene
 */
export const meshyTool = betaZodTool({
  name: 'generate_3d_model',
  description: `Generate a custom 3D model using AI (Meshy.ai) and spawn it into the scene.

Features:
- Creates low-poly game assets from text descriptions
- Auto-detects humanoid models for rigging
- Supports walk/run animations for characters
- Auto-saves to model library (public/models/)
- Auto-spawns to scene with Grabbable + Scale interactions

Takes ~30-60 seconds for basic models, ~2-3 minutes with rigging+animation.`,

  inputSchema: z.object({
    description: z.string()
      .describe('What 3D model to generate. Be descriptive. Examples: "zombie enemy", "medieval sword", "sci-fi spaceship", "low poly tree", "робот"'),
    withAnimation: z.boolean().optional()
      .describe('For humanoid models: automatically rig and add animation. Default: true for humanoids.'),
    animationType: z.enum(['walk', 'run']).optional()
      .describe('Animation type: "walk" (default) or "run". Only used when withAnimation is true.'),
    autoSpawn: z.boolean().optional()
      .describe('Automatically spawn model into scene after generation. Default: true'),
    position: z.tuple([z.number(), z.number(), z.number()]).optional()
      .describe('Spawn position [x, y, z]. Default: [0, 1, -2]'),
  }),

  run: async (input) => {
    const {
      description,
      withAnimation,
      animationType,
      autoSpawn = true,
      position = [0, 1, -2],
    } = input;

    const startTime = Date.now();
    const toolLogger = logger.child({ module: 'tool:generate_3d_model' });

    toolLogger.info({ event: 'meshy_start', description, withAnimation, animationType, autoSpawn });

    try {
      // 1. Generate model via Meshy
      const result = await generateModel(description, {
        withRigging: withAnimation,
        withAnimation: withAnimation,
        useRunAnimation: animationType === 'run',
        onProgress: (progress, elapsed, status) => {
          toolLogger.debug({ event: 'meshy_progress', progress, elapsed, status });
        }
      });

      // 2. Save to library (public/models/)
      const { saveModelToLibrary, getModelGlbPath } = await import('./modelUtils.js');

      const glbBuffer = await fs.readFile(result.localPath);
      const animations: string[] = [];
      if (result.hasWalkAnimation) {
        animations.push(animationType === 'run' ? 'run' : 'walk');
      }

      const modelMeta = await saveModelToLibrary({
        glbBuffer,
        originalPrompt: description,
        enhancedPrompt: result.prompt.enhanced,
        isHumanoid: result.isHumanoid,
        rigged: result.rigged || false,
        animations,
        fileSize: `${result.sizeKB}KB`,
        polycount: 100,
      });

      toolLogger.info({
        event: 'model_saved_to_library',
        modelId: modelMeta.id,
        path: getModelGlbPath(modelMeta.id),
      });

      // 3. Auto-spawn to scene
      let spawnResult = null;
      if (autoSpawn) {
        const { spawnModelProgrammatic } = await import('./spawnModelTool.js');
        spawnResult = await spawnModelProgrammatic({
          modelId: modelMeta.id,
          position: position as [number, number, number],
          scale: 1,
          grabbable: true,
          scalable: true,
          scaleRange: [0.1, 5],
        });

        toolLogger.info({
          event: 'model_spawned',
          modelId: modelMeta.id,
          success: spawnResult.success,
        });
      }

      const duration = Date.now() - startTime;

      toolLogger.info({
        event: 'meshy_complete',
        duration,
        modelId: modelMeta.id,
        spawned: autoSpawn && spawnResult?.success,
      });

      // 4. Build response
      const animTypeText = animationType === 'run' ? 'Running' : 'Walking';
      const spawnInfo = autoSpawn && spawnResult?.success
        ? `\n**Spawned:** Yes - at position [${position.join(', ')}]
**Interactions:** Grabbable + Scalable (0.1x - 5x)`
        : autoSpawn && !spawnResult?.success
        ? `\n**Spawned:** Failed - ${spawnResult?.error}`
        : '';

      return `✅ 3D model generated and saved to library!

**Model ID:** ${modelMeta.id}
**Name:** ${modelMeta.name}
**Library Path:** ${getModelGlbPath(modelMeta.id)}
**Size:** ${result.sizeKB} KB
**Type:** ${result.isHumanoid ? 'Humanoid character' : 'Static object'}
${result.rigged ? '**Rigged:** Yes - has full skeleton' : ''}
${result.hasWalkAnimation ? `**Animation:** ${animTypeText} animation included!` : ''}${spawnInfo}

**Prompt:**
- Original: "${description}"
- Enhanced: "${result.prompt.enhanced}"

**Usage:**
- Use \`spawn_model("${modelMeta.id}")\` to add more instances
- Use \`list_models\` to see all available models
- Model is permanently saved in library`;

    } catch (error: any) {
      toolLogger.error({ event: 'meshy_error', error: error.message });
      throw new Error(`Failed to generate 3D model: ${error.message}`);
    }
  }
});
