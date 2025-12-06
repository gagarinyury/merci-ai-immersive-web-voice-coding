---
name: iwsdk-code-patterns
description: VRCreator2-specific patterns for IWSDK including hot reload system, best practices, common mistakes, and code templates. Use when working with VRCreator2 project structure.
---

# IWSDK Code Patterns

VRCreator2-specific patterns and best practices for IWSDK development.

## Documentation

- [Hot Reload System](HOT_RELOAD.md) - **CRITICAL:** __trackEntity pattern
- [Best Practices](BEST_PRACTICES.md) - Code quality guidelines
- [Common Mistakes](COMMON_MISTAKES.md) - Troubleshooting guide
- [Templates](TEMPLATES.md) - Code templates
- [Project Structure](PROJECT_STRUCTURE.md) - VRCreator2 file organization

## Quick Reference

### Hot Reload Pattern (REQUIRED)

```typescript
// ALWAYS include this for VRCreator2
(window as any).__trackEntity(entity, mesh);
```

### Position Before Entity Creation

```typescript
// ✅ CORRECT
mesh.position.set(0, 1.5, -2);
const entity = world.createTransformEntity(mesh);

// ❌ WRONG
const entity = world.createTransformEntity(mesh);
entity.object3D.position.set(0, 1.5, -2);
```

## See Also

For IWSDK API reference, see [iwsdk-api-reference](../iwsdk-api-reference/SKILL.md).
