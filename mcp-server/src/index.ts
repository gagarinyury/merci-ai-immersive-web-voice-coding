/**
 * IWSDK MCP Server
 *
 * Предоставляет Claude знания об IWSDK API через Model Context Protocol.
 *
 * Архитектура:
 * - Resources: документация API в markdown формате
 * - Tools: валидация кода, список объектов сцены
 *
 * Каждый ресурс регистрируется с URI схемой iwsdk://
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// === Resource Content Imports ===
// ECS (Entity-Component-System)
import { ecsOverview } from "./resources/ecs/index.js";
import { ecsComponents } from "./resources/ecs/components.js";
import { ecsSystems } from "./resources/ecs/systems.js";
import { ecsEntity } from "./resources/ecs/entity.js";
import { ecsQueries } from "./resources/ecs/queries.js";
import { ecsLifecycle } from "./resources/ecs/lifecycle.js";
import { ecsWorld } from "./resources/ecs/world.js";
import { ecsPatterns } from "./resources/ecs/patterns.js";
import { ecsArchitecture } from "./resources/ecs/architecture.js";

// Grabbing (взаимодействие с объектами)
import { grabbingOverview } from "./resources/grabbing/index.js";
import { distanceGrabbing } from "./resources/grabbing/distance-grabbing.js";
import { grabbingInteractionTypes } from "./resources/grabbing/interaction-types.js";

// XR Input (контроллеры, руки)
import { xrInputOverview } from "./resources/xr-input/index.js";
import { inputVisuals } from "./resources/xr-input/input-visuals.js";
import { xrPointers } from "./resources/xr-input/pointers.js";
import { statefulGamepad } from "./resources/xr-input/stateful-gamepad.js";
import { xrOrigin } from "./resources/xr-input/xr-origin.js";

// Spatial UI
import { spatialUiOverview } from "./resources/spatial-ui/index.js";
import { uikit } from "./resources/spatial-ui/uikit.js";
import { uikitml } from "./resources/spatial-ui/uikitml.js";
import { uikitDocument } from "./resources/spatial-ui/uikit-document.js";
import { spatialUiFlow } from "./resources/spatial-ui/flow.js";

// Standalone resources
import { physicsOverview } from "./resources/physics.js";
import { audioOverview } from "./resources/audio.js";
import { assetsOverview } from "./resources/assets.js";
import { cameraOverview } from "./resources/camera.js";
import { environmentOverview } from "./resources/environment.js";
import { sceneUnderstandingOverview } from "./resources/scene-understanding.js";
import { apiIndex } from "./resources/api-index.js";
import { resourcesIndex } from "./resources/index.js";

// Types Map (карта типов API)
import { typesMapPart1, typesMapPart2, typesMapPart3, typesMapPart4, typesMapPart5 } from "./resources/types-map.js";

// Tools
import { registerValidateTool } from "./tools/validate.js";
import { registerListSceneTool } from "./tools/list-scene.js";
import { registerMeshyTools } from "./tools/meshy.js";

// === Create Server ===
const server = new McpServer({
  name: "iwsdk-mcp",
  version: "0.1.0",
});

// === Helper: Register Resource ===
let resourceCount = 0;

/**
 * Регистрирует ресурс в MCP сервере.
 *
 * АРГУМЕНТАЦИЯ использования этого хелпера:
 * - MCP SDK требует registerResource с конкретной сигнатурой
 * - Хелпер обеспечивает единообразие и упрощает добавление новых ресурсов
 * - URI схема iwsdk:// позволяет Claude понять контекст
 */
function registerResource(
  name: string,
  uri: string,
  title: string,
  description: string,
  content: string
) {
  resourceCount++;
  server.registerResource(
    name,
    uri,
    {
      title,
      description,
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: content,
        },
      ],
    })
  );
}

// === Register Resources ===

// API Index - обзор всех экспортов
registerResource(
  "api-index",
  "iwsdk://api/index",
  "IWSDK API Index",
  "Полный список экспортов @iwsdk/core с маппингом на ресурсы",
  apiIndex
);

// Resources Index - навигация по документации
registerResource(
  "resources-index",
  "iwsdk://api/resources",
  "Resources Index",
  "Навигация по всем доступным ресурсам документации",
  resourcesIndex
);

// === ECS Resources ===
// АРГУМЕНТАЦИЯ разделения: ECS - большая тема, разбитая на модули
// позволяет Claude запрашивать только нужную часть

registerResource(
  "ecs-overview",
  "iwsdk://api/ecs/overview",
  "ECS Overview",
  "Обзор Entity-Component-System: createComponent, createSystem, World",
  ecsOverview
);

registerResource(
  "ecs-components",
  "iwsdk://api/ecs/components",
  "ECS Components",
  "Types (Float32, Vec3, Entity...), field options, createComponent",
  ecsComponents
);

registerResource(
  "ecs-systems",
  "iwsdk://api/ecs/systems",
  "ECS Systems",
  "createSystem, config signals, priorities, pause/play, system properties",
  ecsSystems
);

registerResource(
  "ecs-entity",
  "iwsdk://api/ecs/entity",
  "ECS Entity",
  "createEntity, createTransformEntity, parenting, entity methods",
  ecsEntity
);

registerResource(
  "ecs-queries",
  "iwsdk://api/ecs/queries",
  "ECS Queries",
  "Predicates (eq, lt, isin...), qualify/disqualify events",
  ecsQueries
);

registerResource(
  "ecs-lifecycle",
  "iwsdk://api/ecs/lifecycle",
  "ECS Lifecycle",
  "World boot sequence, frame order, cleanup, destroy",
  ecsLifecycle
);

registerResource(
  "ecs-world",
  "iwsdk://api/ecs/world",
  "ECS World",
  "SessionMode, XR control, level loading, World.create options",
  ecsWorld
);

registerResource(
  "ecs-patterns",
  "iwsdk://api/ecs/patterns",
  "ECS Patterns",
  "State machine, pooling, anti-patterns, best practices",
  ecsPatterns
);

registerResource(
  "ecs-architecture",
  "iwsdk://api/ecs/architecture",
  "ECS Architecture",
  "Built-in components, debugging API, internal structure",
  ecsArchitecture
);

// === Grabbing Resources ===
// АРГУМЕНТАЦИЯ: grabbing - ключевая фича для VR, нужна детальная документация

registerResource(
  "grabbing-overview",
  "iwsdk://api/grabbing/overview",
  "Grabbing Overview",
  "Interactable, OneHandGrabbable, TwoHandGrabbable, DistanceGrabbable",
  grabbingOverview
);

registerResource(
  "grabbing-distance",
  "iwsdk://api/grabbing/distance",
  "Distance Grabbing",
  "DistanceGrabbable, MovementMode, returnToOrigin",
  distanceGrabbing
);

registerResource(
  "grabbing-types",
  "iwsdk://api/grabbing/types",
  "Interaction Types",
  "OneHand/TwoHands/Distance schemas, constraint options",
  grabbingInteractionTypes
);

// === XR Input Resources ===
// АРГУМЕНТАЦИЯ: input - сложная тема с контроллерами, руками, указателями

registerResource(
  "xr-input-overview",
  "iwsdk://api/xr-input/overview",
  "XR Input Overview",
  "XRInputManager setup, controller/hand detection",
  xrInputOverview
);

registerResource(
  "xr-input-visuals",
  "iwsdk://api/xr-input/visuals",
  "Input Visuals",
  "AnimatedController, AnimatedHand, adapters",
  inputVisuals
);

registerResource(
  "xr-input-pointers",
  "iwsdk://api/xr-input/pointers",
  "Pointers",
  "multiPointers, toggleSubPointer, ray casting",
  xrPointers
);

registerResource(
  "xr-input-gamepad",
  "iwsdk://api/xr-input/gamepad",
  "Stateful Gamepad",
  "Button/axes methods, component IDs, XR-Standard mapping",
  statefulGamepad
);

registerResource(
  "xr-input-origin",
  "iwsdk://api/xr-input/origin",
  "XR Origin",
  "Spaces structure (head, ray, grip), reference spaces",
  xrOrigin
);

// === Spatial UI Resources ===
// АРГУМЕНТАЦИЯ: UI в VR требует специфичных знаний

registerResource(
  "spatial-ui-overview",
  "iwsdk://api/spatial-ui/overview",
  "Spatial UI Overview",
  "Architecture overview, PanelUI, ScreenSpace",
  spatialUiOverview
);

registerResource(
  "spatial-ui-uikit",
  "iwsdk://api/spatial-ui/uikit",
  "UIKit",
  "@pmndrs/uikit components, layout props, styling",
  uikit
);

registerResource(
  "spatial-ui-uikitml",
  "iwsdk://api/spatial-ui/uikitml",
  "UIKitML",
  "XML-like markup language for UI, parse/interpret API",
  uikitml
);

registerResource(
  "spatial-ui-document",
  "iwsdk://api/spatial-ui/document",
  "UIKit Document",
  "querySelector, setTargetDimensions, document API",
  uikitDocument
);

registerResource(
  "spatial-ui-flow",
  "iwsdk://api/spatial-ui/flow",
  "UI Flow",
  "Vite plugin, PanelUI/ScreenSpace components",
  spatialUiFlow
);

// === Standalone Resources ===
// АРГУМЕНТАЦИЯ: отдельные системы, не требующие разбиения

registerResource(
  "physics",
  "iwsdk://api/physics",
  "Physics",
  "PhysicsBody, PhysicsShape, PhysicsManipulation, Havok integration",
  physicsOverview
);

registerResource(
  "audio",
  "iwsdk://api/audio",
  "Audio",
  "AudioUtils, AudioSource, spatial audio, PlaybackMode",
  audioOverview
);

registerResource(
  "assets",
  "iwsdk://api/assets",
  "Assets",
  "AssetManager, GLTF loading, textures, priority loading",
  assetsOverview
);

registerResource(
  "camera",
  "iwsdk://api/camera",
  "Camera",
  "CameraSource, CameraUtils, device access, permissions",
  cameraOverview
);

registerResource(
  "environment",
  "iwsdk://api/environment",
  "Environment",
  "IBL lighting, Dome background, gradients",
  environmentOverview
);

registerResource(
  "scene-understanding",
  "iwsdk://api/scene-understanding",
  "Scene Understanding",
  "XRPlane, XRMesh, XRAnchor, AR plane detection",
  sceneUnderstandingOverview
);

// Types Map
registerResource(
  "types-map",
  "iwsdk://api/types-map",
  "IWSDK Types Map",
  "Полная карта типов IWSDK API: компоненты, классы, интерфейсы с полями и примерами (5 частей)",
  typesMapPart1 + "\n\n" + typesMapPart2 + "\n\n" + typesMapPart3 + "\n\n" + typesMapPart4 + "\n\n" + typesMapPart5
);

// === Register Tools ===
// АРГУМЕНТАЦИЯ: tools позволяют Claude выполнять действия, не только читать

registerValidateTool(server);
registerListSceneTool(server);
registerMeshyTools(server);

// === Start Server ===
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("IWSDK MCP Server running on stdio");
  console.error(`Registered ${resourceCount} resources and 2 tools`);
}

main().catch(console.error);
