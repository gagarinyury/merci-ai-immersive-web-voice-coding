// Source: /immersive-web-sdk3/docs/concepts/ecs/components.md
// IWSDK Component types and API

export const ecsComponents = `
## Types (from elics, re-exported by @iwsdk/core)

| Type                             | Description                      |
| -------------------------------- | -------------------------------- |
| \`Types.Int8\`, \`Types.Int16\`      | Integer numbers                  |
| \`Types.Float32\`, \`Types.Float64\` | Floating point numbers           |
| \`Types.Boolean\`                  | true/false values                |
| \`Types.String\`                   | Text strings                     |
| \`Types.Vec2\`                     | 2D vectors [x, y]                |
| \`Types.Vec3\`                     | 3D vectors [x, y, z]             |
| \`Types.Vec4\`                     | 4D vectors [x, y, z, w]          |
| \`Types.Color\`                    | RGBA colors [r, g, b, a]         |
| \`Types.Entity\`                   | References to other entities     |
| \`Types.Object\`                   | Any JavaScript object            |
| \`Types.Enum\`                     | String values from a defined set |

## Field Options

\`\`\`ts
{
  type: Types.Float32,
  default: 100,      // default value
  min: 0,            // numeric only: minimum
  max: 100,          // numeric only: maximum
}
\`\`\`

## Enum Fields

\`\`\`ts
const MovementMode = { Walk: 'walk', Fly: 'fly' } as const;

const Locomotion = createComponent('Locomotion', {
  mode: { type: Types.Enum, enum: MovementMode, default: MovementMode.Walk },
});
\`\`\`

## Entity Reference

\`\`\`ts
const Targeting = createComponent('Targeting', {
  target: { type: Types.Entity },  // stores entity index, null by default
});

// Usage
entity.setValue(Targeting, 'target', otherEntity);
const target = entity.getValue(Targeting, 'target'); // Entity | null
\`\`\`

## Vector Performance (zero-allocation)

\`\`\`ts
// getVectorView returns Float32Array view - mutate in place
const pos = entity.getVectorView(Transform, 'position'); // Float32Array [x,y,z]
pos[0] += 1;  // no allocation
pos[1] = 5;
\`\`\`

**WARNING**: getVectorView mutation does NOT trigger query re-evaluation.
If query uses predicates on vector field, use setValue with full tuple:

\`\`\`ts
entity.setValue(Transform, 'position', [newX, newY, newZ]);
\`\`\`

## Internal Fields Convention

Prefix with \`_\` for internal implementation details:

\`\`\`ts
const MyComponent = createComponent('MyComponent', {
  publicField: { type: Types.Float32 },
  _internalField: { type: Types.Boolean },  // hidden in docs/tools
});
\`\`\`

`;
