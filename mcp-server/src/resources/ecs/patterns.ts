// Source: /immersive-web-sdk3/docs/concepts/ecs/patterns.md
// IWSDK ECS patterns and anti-patterns

export const ecsPatterns = `
## World API: Object3D to Entity Lookup

\`\`\`ts
const entity = this.world.getEntityByObject3D(object3D);
\`\`\`

## State Machine Pattern

Use enum component + where predicates for state-driven systems:

\`\`\`ts
const PlayerState = {
  Idle: 'idle',
  Walking: 'walking',
  Grabbing: 'grabbing',
} as const;

const PlayerController = createComponent('PlayerController', {
  state: { type: Types.Enum, enum: PlayerState, default: PlayerState.Idle },
});

// Separate system per state
export class WalkingSystem extends createSystem({
  walkers: {
    required: [PlayerController],
    where: [eq(PlayerController, 'state', 'walking')],
  },
}) { /* walking logic */ }

export class GrabbingSystem extends createSystem({
  grabbers: {
    required: [PlayerController],
    where: [eq(PlayerController, 'state', 'grabbing')],
  },
}) { /* grab logic */ }
\`\`\`

## Entity Pooling Pattern

Use Transform presence to toggle active/inactive:

\`\`\`ts
export class ProjectileSystem extends createSystem({
  active: { required: [Projectile, Transform] },
  inactive: { required: [Projectile], excluded: [Transform] },
}, {
  poolSize: { type: Types.Int32, default: 100 },
}) {
  init() {
    // Pre-create pool
    for (let i = 0; i < this.config.poolSize.peek(); i++) {
      const e = this.createEntity();
      e.addComponent(Projectile);
      // No Transform = inactive
    }
  }

  spawn(position: [number, number, number]) {
    const e = this.queries.inactive.entities[0];
    if (e) e.addComponent(Transform, { position }); // activate
  }

  despawn(e: Entity) {
    e.removeComponent(Transform); // back to pool
  }
}
\`\`\`

## Anti-Pattern: Types.Object for References

\`\`\`ts
// BAD: breaks ECS data orientation
const Bad = createComponent('Bad', {
  mesh: { type: Types.Object },      // Three.js object
  callbacks: { type: Types.Object }, // functions
});

// GOOD: use IDs, lookup in systems
const Good = createComponent('Good', {
  meshId: { type: Types.String, default: '' },
});
\`\`\`

## Notes
- Only hasComponent() exists, no has() method
`;
