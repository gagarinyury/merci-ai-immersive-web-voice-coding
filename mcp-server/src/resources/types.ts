/**
 * Resource: iwsdk://types
 *
 * Core TypeScript types from @iwsdk/core
 * Neural network needs these to write correct IWSDK code
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const TYPES_CONTENT = `
# IWSDK Core Types

## World

Main entry point. Access via \`window.__IWSDK_WORLD__\`.

\`\`\`typescript
interface World {
  // Create entity with Three.js object
  createTransformEntity(object3D?: Object3D, options?: {
    parent?: Entity;
    persistent?: boolean;
  }): Entity;

  // Create entity without 3D object
  createEntity(): Entity;

  // Register system
  registerSystem<T extends System>(
    systemClass: new () => T,
    options?: { priority?: number }
  ): World;

  // Scene access
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  // Globals for cross-system data
  globals: Record<string, any>;
}
\`\`\`

## Entity

Container for components. May have Object3D attached.

\`\`\`typescript
interface Entity {
  // Object3D access (if created with createTransformEntity)
  readonly object3D: THREE.Object3D | null;

  // Component operations
  addComponent<T extends Component>(
    component: T,
    data?: Partial<ComponentData<T>>
  ): Entity;

  removeComponent<T extends Component>(component: T): Entity;

  has<T extends Component>(component: T): boolean;

  // Read/write component data
  getValue<T extends Component, K extends keyof ComponentData<T>>(
    component: T,
    field: K
  ): ComponentData<T>[K] | undefined;

  setValue<T extends Component, K extends keyof ComponentData<T>>(
    component: T,
    field: K,
    value: ComponentData<T>[K]
  ): void;

  // Vector fields - use for position/rotation without allocations
  getVectorView<T extends Component>(
    component: T,
    field: string
  ): Float32Array;

  // Destroy entity
  destroy(): void;
}
\`\`\`

## Types - Field Types for Components

Use in createComponent field definitions.

\`\`\`typescript
const Types = {
  // Primitives
  Boolean: 'boolean',
  Float32: 'float32',
  Float64: 'float64',
  Int8: 'int8',
  Int16: 'int16',
  Int32: 'int32',
  Uint8: 'uint8',
  Uint16: 'uint16',
  Uint32: 'uint32',
  String: 'string',

  // Vectors
  Vec2: 'vec2',    // [x, y]
  Vec3: 'vec3',    // [x, y, z]
  Vec4: 'vec4',    // [x, y, z, w] or quaternion

  // Special
  Enum: 'enum',    // requires enum map
  Object: 'object', // any JS object
  Entity: 'entity', // reference to another entity
} as const;
\`\`\`

## Component Field Definition

\`\`\`typescript
interface FieldDefinition {
  type: typeof Types[keyof typeof Types];
  default?: any;           // default value
  min?: number;            // for numeric types
  max?: number;            // for numeric types
  enum?: Record<string, string>; // for Enum type
}
\`\`\`

## Query Definition

Used in createSystem first argument.

\`\`\`typescript
interface QueryDefinition {
  required?: Component[];   // entity MUST have these
  optional?: Component[];   // entity MAY have these
  excluded?: Component[];   // entity MUST NOT have these
}

// Query result
interface Query {
  entities: Set<Entity>;

  // Subscribe to entity changes
  subscribe(
    event: 'qualify' | 'disqualify',
    callback: (entity: Entity) => void
  ): () => void;
}
\`\`\`

## System Config Definition

Used in createSystem second argument.

\`\`\`typescript
interface ConfigDefinition {
  [key: string]: FieldDefinition;
}

// Config values are Preact signals
interface Signal<T> {
  value: T;           // get/set with tracking
  peek(): T;          // get without tracking
  subscribe(fn: (value: T) => void): () => void;
}
\`\`\`

## System Lifecycle

\`\`\`typescript
abstract class System {
  // Access to queries defined in createSystem
  protected queries: Record<string, Query>;

  // Access to config signals
  protected config: Record<string, Signal<any>>;

  // World reference
  protected readonly world: World;

  // Player/camera access
  protected readonly player: {
    head: THREE.Object3D;
    leftHand: THREE.Object3D;
    rightHand: THREE.Object3D;
  };

  // Shared globals
  protected readonly globals: Record<string, any>;

  // Lifecycle methods
  init(): void;              // called once on register
  update(deltaTime: number): void;  // called every frame
  destroy(): void;           // called on unregister

  // Create entities from system
  protected createEntity(): Entity;
}
\`\`\`

## Query Predicates (import from @iwsdk/core)

Use in query \`where\` clause for value-based filtering:

\`\`\`typescript
import { eq, ne, lt, le, gt, ge, isin, nin } from '@iwsdk/core';

// Equality
eq(Component, 'field', value)   // field === value
ne(Component, 'field', value)   // field !== value

// Numeric comparison
lt(Component, 'field', value)   // field < value
le(Component, 'field', value)   // field <= value
gt(Component, 'field', value)   // field > value
ge(Component, 'field', value)   // field >= value

// Set membership
isin(Component, 'field', [a, b, c])  // field in [a, b, c]
nin(Component, 'field', [a, b, c])   // field not in [a, b, c]
\`\`\`

## Built-in Components (import from @iwsdk/core)

\`\`\`typescript
// Interaction
Interactable        // makes entity interactive
Pressed             // added when entity is pressed/clicked
Hovered             // added when entity is hovered

// Grabbing
OneHandGrabbable    // direct grab with one hand
TwoHandGrabbable    // grab with two hands, supports scale
DistanceGrabbable   // grab at distance via ray

// Audio
AudioSource         // spatial audio

// UI
PanelUI             // UIKit panel
ScreenSpace         // 2D screen positioning

// Transform (auto-added by createTransformEntity)
Transform           // position, rotation, scale

// Scene Understanding (AR/MR)
XRPlane             // detected flat surface (floor, wall, table)
XRMesh              // detected 3D geometry with semanticLabel
XRAnchor            // stable world-space anchor
\`\`\`

## XRMesh Properties (for AR scene understanding)

\`\`\`typescript
// Read mesh properties
entity.getValue(XRMesh, 'isBounded3D');    // boolean - object vs room mesh
entity.getValue(XRMesh, 'semanticLabel');  // string - 'table', 'chair', 'wall', etc.
entity.getValue(XRMesh, 'dimensions');     // [width, height, depth]
entity.getValue(XRMesh, 'min');            // bounding box min
entity.getValue(XRMesh, 'max');            // bounding box max
\`\`\`
`;

export function registerTypesResource(server: McpServer) {
  server.resource(
    "iwsdk://types",
    "IWSDK Core TypeScript types: World, Entity, Types, Query, System",
    async () => ({
      contents: [
        {
          uri: "iwsdk://types",
          mimeType: "text/markdown",
          text: TYPES_CONTENT,
        },
      ],
    })
  );
}
