# Immersive Web SDK - AR Scene Generation Skill

TODO: Fill this file with:

## Structure (~500 lines total):

1. **YAML Frontmatter** (10 lines)
   - name: immersive-web-development
   - description: Create AR experiences with Immersive Web SDK using AI-driven scene generation, room understanding (planes, meshes, anchors), hit-testing for object placement, and procedural entity creation. Use when building AR apps, generating scenes from text, placing objects in real space, or adapting content to room parameters.

2. **Purpose & When to Use** (50 lines)
   - Creating WebXR AR applications
   - AI-driven scene generation
   - Room understanding and adaptation
   - Procedural entity creation
   - When to use this skill

3. **Core Concepts** (100 lines)
   - ECS Architecture basics
   - Three.js Integration
   - WebXR AR Session Management

4. **Project Setup** (80 lines)
   - Installation (npm create @iwsdk@latest)
   - Dependencies (@iwsdk/core, super-three@0.177.0)
   - Vite Configuration (iwer, uikitml plugins)

5. **AR Session Configuration** (60 lines)
   - immersive-ar mode
   - Features: hit-test, plane-detection, mesh-detection, anchors, light-estimation
   - Session lifecycle

6. **Scene Understanding** (100 lines)
   - Plane detection (horizontal/vertical)
   - Mesh detection (3D room geometry)
   - Hit-testing for placement
   - Anchors for persistence
   - Lighting estimation

7. **Procedural Generation** (80 lines)
   - Creating entities programmatically
   - Dynamic spawning
   - Entity templates and factories
   - Batch operations

8. **Creating Entities** (60 lines)
   - Basic entity creation
   - Adding components (Transform, Mesh, etc)
   - Parametric creation

9. **XR Input & Grabbing** (80 lines)
   - One-hand grabbing
   - Two-hand grabbing (with scaling)
   - Distance grabbing

10. **Spatial UI** (70 lines)
    - UIKitML syntax
    - Loading UI
    - Event handling

11. **Custom Systems** (50 lines)
    - Creating custom systems
    - Queries
    - Registration

12. **Best Practices** (40 lines)
    - Performance (72-90 FPS)
    - ECS patterns
    - AR-specific tips
    - Asset management

13. **Common Pitfalls** (30 lines)
    - Don't use regular Three.js (use super-three)
    - Don't forget vite plugins
    - Check feature support
