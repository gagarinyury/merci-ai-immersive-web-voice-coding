# Immersive Web SDK Agent Skill

Agent Skill for Claude API to assist with creating AR experiences using Immersive Web SDK.

## Structure

```
immersive-web-skill/
├── SKILL.md                          # Main skill file with core instructions
├── resources/                        # Detailed documentation
│   ├── ecs-architecture.md          # ECS patterns and architecture
│   ├── three-js-integration.md      # Three.js integration details
│   ├── ar-scene-understanding.md    # AR scene understanding (planes, meshes, anchors)
│   ├── room-parameters.md           # Room dimensions and spatial awareness
│   ├── webxr-features.md            # WebXR API reference (AR focus)
│   └── troubleshooting.md           # Common issues and solutions
├── examples/                         # Working code examples
│   ├── basic-scene-setup.ts
│   ├── ar-placement-system.ts       # Hit-testing and object placement
│   ├── procedural-scene-generation.ts # AI-driven scene creation
│   ├── room-aware-scaling.ts        # Adaptive scaling for rooms
│   ├── grabbing-interactions.ts
│   ├── spatial-ui-example.ts
│   └── custom-system-example.ts
└── templates/                        # Configuration templates
    ├── vite.config.template.ts
    ├── ar-session.template.ts
    └── basic-scene.uikitml
```

## Focus

This skill is optimized for:
- **AR scene generation** through AI chat interfaces
- **Room understanding** (plane/mesh detection, hit-testing)
- **Procedural entity creation** from text descriptions
- **Spatial awareness** and room-adaptive content

## TODO Checklist

See individual files for completion status. Each file has a TODO header with structure outline.

## Usage

This skill will be packaged as a .zip and uploaded to Claude API via Skills API.
