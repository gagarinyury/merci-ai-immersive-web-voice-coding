// Source: /immersive-web-sdk3/docs/concepts/ecs/queries.md
// IWSDK Query predicates and patterns

export const ecsQueries = `
## Predicates (from elics, re-exported by @iwsdk/core)

\`\`\`ts
import { eq, ne, lt, le, gt, ge, isin, nin } from '@iwsdk/core';
\`\`\`

| Predicate | Description | Example |
|-----------|-------------|---------|
| eq | equals | eq(Health, 'current', 100) |
| ne | not equals | ne(Status, 'state', 'idle') |
| lt | less than | lt(Health, 'current', 30) |
| le | less or equal | le(Timer, 'remaining', 0) |
| gt | greater than | gt(Score, 'points', 1000) |
| ge | greater or equal | ge(Level, 'xp', 100) |
| isin | in array | isin(Status, 'phase', ['combat', 'boss']) |
| nin | not in array | nin(State, 'mode', ['disabled', 'paused']) |

## Entity Reference Predicates (null check)

\`\`\`ts
const Target = createComponent('Target', {
  entity: { type: Types.Entity, default: null },
});

export class TargetingSystem extends createSystem({
  hasTarget: { required: [Target], where: [ne(Target, 'entity', null)] },
  noTarget: { required: [Target], where: [eq(Target, 'entity', null)] },
}) {}
\`\`\`

## Cross-Component Predicates

Predicates can reference fields from different required components:

\`\`\`ts
{
  combined: {
    required: [Health, Armor, Status],
    where: [
      lt(Health, 'current', 50),
      gt(Armor, 'value', 10),
    ],
  },
}
\`\`\`

## Query Update Mechanism

\`\`\`
setValue(Component, 'field', value)
  → updateEntityValue(entity, component)
  → re-evaluate queries with 'where' on that component
  → emit qualify/disqualify
  → update query.entities
\`\`\`

**Important**: Only setValue() triggers query re-evaluation.
getVectorView() mutations do NOT trigger re-evaluation.

## Query API Summary

\`\`\`ts
this.queries.myQuery.entities        // Set<Entity>
this.queries.myQuery.entities.size   // count
this.queries.myQuery.subscribe('qualify', (e) => {})
this.queries.myQuery.subscribe('disqualify', (e) => {})
\`\`\`
`;
