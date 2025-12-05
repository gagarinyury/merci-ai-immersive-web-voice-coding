// Source: /immersive-web-sdk3/docs/concepts/ecs/architecture.md
// IWSDK built-in components, debugging, performance

export const ecsArchitecture = `
## Built-in Components

| Component | Fields | Description |
|-----------|--------|-------------|
| Transform | position, rotation, scale | 3D transform (auto with createTransformEntity) |
| Visibility | changed: boolean | Track visibility changes |
| Mesh | geometry | 3D mesh reference |
| Grabbable | - | Makes entity grabbable |
| RigidBody | - | Physics body |
| Interactable | glowColor: Vec3 | Hover/glow effects |
| HandTracking | - | Hand tracking data |
| FingerJoint | type: 'thumb'/'index'/... | Finger joint tracking |

## Entity API (additional)

\`\`\`ts
entity.index               // unique entity ID (number)
entity.getComponents()     // returns array of component definitions
\`\`\`

## Debugging API

\`\`\`ts
// Enable performance monitoring
world.enablePerformanceMonitoring = true;

// Access entity manager
world.entityManager.entities.forEach((entity) => {
  console.log(\`Entity \${entity.index}:\`, entity.getComponents().map(c => c.id));
});

// Query sizes in system
for (const [name, query] of Object.entries(this.queries)) {
  console.log(\`\${name}: \${query.entities.size} entities\`);
}
\`\`\`

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical entity count | 1000-5000 |
| Component overhead | ~8 bytes/entity |
| Component instance | ~32 bytes |
| Query index | ~4 bytes/entity |
| System class | ~1KB |
| Empty system update | ~0.1ms |

## Notes
- VoiceTarget: example only, not a built-in component
`;
