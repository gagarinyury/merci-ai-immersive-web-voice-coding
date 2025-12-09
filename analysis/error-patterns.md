# VRCreator2 Error Pattern Analysis

**Analysis Date:** 2025-12-09
**Traces Analyzed:** 113 conversation logs
**Period:** 2025-12-07 to 2025-12-08

## Executive Summary

Analyzed 113 conversation traces to identify recurring error patterns and failure modes in the VRCreator2 agent system. Found 5 major categories of issues:

1. **Path Resolution Errors** - 25 occurrences (22%)
2. **Tool Availability Issues** - 1 occurrence
3. **Slow Queries** - 12 occurrences (>20s with <3 tool calls)
4. **No Action Queries** - 10 occurrences (toolCallCount=0)
5. **requestAnimationFrame Usage** - 4 occurrences (critical XR bug)

---

## 1. Path Resolution Errors (Critical)

### Problem
Agent uses hardcoded or incorrect file paths that don't match the actual project structure.

### Frequency
- 25 traces with "File does not exist" errors
- Most common: `/home/user/vrcreator2/src/generated/current-game.ts` (4 occurrences)
- Also found: `/Users/boris/Projects/ArmelloVR/ArmelloVR/...` (1 occurrence)
- Also found: `/Users/yurygagarin/Projects/vr-creator-2/...` (1 occurrence)

### Root Cause
Agent is using cached or hallucinated paths from training data instead of:
1. Using the `cwd` provided in system init message
2. Using Glob to find files first
3. Using relative paths from the known working directory

### Examples

**Trace:** `conversation-2025-12-08T11-01-01-317Z-session_.json`
```
User: "Посмотри, что за ошибка у нас в игре"
Agent tries: /home/user/vrcreator2/src/generated/current-game.ts
Error: File does not exist
Correct path: /Users/yurygagarin/code/vrcreator2/src/generated/current-game.ts
```

**Trace:** `conversation-2025-12-07T19-59-27-252Z-session_.json`
```
User: "Обнови рабочий файл"
Agent tries: /Users/boris/Projects/ArmelloVR/ArmelloVR/src/generated/current-game.ts
Error: File does not exist
Recovery: Agent uses Glob to find correct path
```

### Solution

**In system prompt, add explicit instruction:**

```
CRITICAL - FILE PATH RESOLUTION:

1. NEVER use hardcoded paths from examples
2. ALWAYS use one of these methods:
   a) Use Glob first: `src/generated/*.ts` to find files
   b) Use cwd from system init: {cwd}/src/generated/current-game.ts
   c) For project root files, concatenate: {cwd}/public/models/...

3. Common paths (use {cwd} prefix):
   - Main game file: {cwd}/src/generated/current-game.ts
   - Examples: {cwd}/examples/**/*.ts
   - Models: {cwd}/public/models/

4. If Read fails with "File does not exist":
   - Use Glob to search: `**/*current-game*.ts`
   - Do NOT retry same path
   - Do NOT assume path structure
```

### Prevention Pattern

```typescript
// WRONG - Hardcoded path
Read("/home/user/vrcreator2/src/generated/current-game.ts")

// RIGHT - Use Glob first
Glob("src/generated/current-game.ts")
// Then read result: /Users/yurygagarin/code/vrcreator2/src/generated/current-game.ts

// RIGHT - Use cwd
// cwd from system init: /Users/yurygagarin/code/vrcreator2
Read(`${cwd}/src/generated/current-game.ts`)
```

---

## 2. Tool Availability Issues

### Problem
Agent attempts to use MCP tools that don't exist in current session.

### Frequency
- 1 trace with tool not found error

### Example

**Trace:** `conversation-2025-12-08T15-28-28-059Z-session_.json`
```
User: "Удали 3D-модель из сцены"
Agent tries: mcp__iwsdk-mcp__remove_model
Error: No such tool available: mcp__iwsdk-mcp__remove_model
Recovery: Agent manually deletes model code from file
```

### Root Cause
Agent assumes tool exists based on pattern (generate_model, list_models → remove_model), but tool was never implemented.

### Solution

**In system prompt:**
```
AVAILABLE MCP TOOLS (COMPLETE LIST):
- mcp__iwsdk-mcp__generate_3d_model - Create new 3D model via Meshy AI
- mcp__iwsdk-mcp__list_models - List all models in library
- mcp__iwsdk-mcp__spawn_model - Add model to scene
- mcp__iwsdk-mcp__list_scene - List current scene objects
- mcp__iwsdk-mcp__validate_code - Validate TypeScript code

NOT AVAILABLE:
- remove_model (does not exist - manually edit code instead)
- delete_model (does not exist - use Bash to rm files)
- update_model (does not exist - regenerate with new params)
```

**Better approach:** Add `remove_model` tool to MCP server or document manual removal process.

---

## 3. Slow Queries (>20s, <3 tool calls)

### Problem
Agent spends excessive time (>20s) but makes very few tool calls (<3), suggesting:
- Overthinking/planning without action
- Large context processing
- Repeated failed attempts

### Frequency
12 traces with this pattern

### Examples

**Trace:** `conversation-2025-12-07T17-14-20-116Z-session_.json`
```
Duration: 63.98s
Tool calls: 2
User: "Сохрани этот файл как бэкап"
Problem: Simple task took 64 seconds with only 2 tools
```

**Trace:** `conversation-2025-12-07T15-43-36-655Z-session_.json`
```
Duration: 41.62s
Tool calls: 1
User: "Напиши файл с заметками, что тебе пришлось долго искать"
Problem: Single Write tool took 42 seconds
```

### Root Cause
- Agent re-reads large context multiple times
- No prompt caching effectively applied
- Complex reasoning before simple file operations

### Solution

**Optimize for simple operations:**
```
For simple file operations (copy, rename, backup):
1. DO NOT re-read file if just modified
2. DO NOT analyze entire codebase
3. ACT IMMEDIATELY:
   - Copy file: Read → Write (new path)
   - Rename: Read → Write → Bash (rm old)
   - Backup: Read → Write (add .backup suffix)

Target: <5 seconds for simple operations
```

---

## 4. No Tool Calls (toolCallCount=0)

### Problem
Agent responds to user query with text but makes zero tool calls, indicating:
- Clarification question when action was expected
- Misunderstanding user intent
- Over-cautious behavior

### Frequency
10 traces, typically with these patterns:
- `"découpe."` - Agent asks for clarification (valid)
- `"Ничего не делай"` - User explicitly says "do nothing" (valid)
- Complex queries where agent requests more info

### Examples

**Trace:** `conversation-2025-12-07T08-47-43-763Z-session_.json`
```
User: "découpe."
Agent: "Не совсем понял. Вы имели в виду вырезать из сцены?"
toolCallCount: 0
Assessment: VALID - unclear request
```

**Trace:** `conversation-2025-12-07T10-36-14-875Z-session_.json`
```
User: "Созда, блядь. Ничего, ничего не делай."
Agent: "Понял. Жду твоей команды."
toolCallCount: 0
Assessment: VALID - explicit instruction to wait
```

### Analysis
Most zero-tool-call cases are **appropriate clarification requests**. No fix needed - working as intended.

---

## 5. requestAnimationFrame Usage (Critical XR Bug)

### Problem
Agent uses `requestAnimationFrame` for game loops, which **FREEZES in XR mode on Quest**.

### Frequency
4 traces mention requestAnimationFrame

### Root Cause
- Agent may reference old examples or general web game patterns
- Not following CLAUDE.md instruction: "NEVER use requestAnimationFrame"

### Examples

**Trace:** Multiple traces around 2025-12-07**
```
Agent creates code with:
requestAnimationFrame(update);

Result: Animation freezes when entering XR
```

### Solution

**System prompt must emphasize (already in CLAUDE.md but needs reinforcement):**

```
❌ CRITICAL: NEVER USE requestAnimationFrame
✅ ALWAYS USE window.__GAME_UPDATE__

WRONG:
function animate() {
  // update logic
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

RIGHT:
const updateGame = (delta: number) => {
  // update logic - called 60 FPS in XR and browser
};
window.__GAME_UPDATE__ = updateGame;

WHY: requestAnimationFrame stops in XR mode on Quest devices.
The IWSDK GameUpdateSystem provides cross-platform 60 FPS updates.
```

**Add to code generation template verification step:**
```
Before generating code, verify:
[ ] Uses window.__GAME_UPDATE__, NOT requestAnimationFrame
[ ] Has HMR cleanup: window.__GAME_UPDATE__ = null
[ ] Uses world.input.gamepads for input
```

---

## 6. Physics Implementation Patterns

### Analysis
No physics-specific errors found in traces, suggesting physics patterns in CLAUDE.md are working well.

### Current Working Pattern
```typescript
// 1. Create mesh
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 1, -2);
world.scene.add(mesh);

// 2. Create entity (MUST use createTransformEntity)
const entity = world.createTransformEntity(mesh);

// 3. Add physics components IN ORDER
entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });

// 4. Track for cleanup
entities.push(entity);
meshes.push(mesh);
```

### Continue Following
- Use `world.createTransformEntity`, NOT `world.createEntity`
- PhysicsBody before PhysicsShape
- SphereGeometry + Auto = ✅
- BoxGeometry + Auto = ✅
- CylinderGeometry + Auto = ❌ (use Box or ConvexHull instead)

---

## 7. Grab System Patterns

### Analysis
No grab-specific errors found, suggesting current documentation is sufficient.

### Working Patterns
```typescript
// Distance grab (ray + trigger)
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, {
  movementMode: MovementMode.MoveFromTarget
});

// Direct grab (touch + squeeze)
entity.addComponent(Interactable);
entity.addComponent(OneHandGrabbable);

// Two-hand scale
entity.addComponent(Interactable);
entity.addComponent(TwoHandsGrabbable);
```

**Key insight:** GrabSystem is automatic - just add components, no manual input handling needed.

---

## 8. HMR Cleanup Patterns

### Analysis
No HMR-specific errors in traces. Current template cleanup is working.

### Required Pattern (from CLAUDE.md)
```typescript
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    // 1. Clear game loop
    window.__GAME_UPDATE__ = null;

    // 2. Remove from scene
    meshes.forEach(m => { if (m.parent) m.parent.remove(m); });

    // 3. Destroy entities (physics)
    entities.forEach(e => { try { e.destroy(); } catch {} });

    // 4. Dispose resources
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    // 5. AR cleanup (CRITICAL for passthrough mode)
    const sus = world.getSystem(SceneUnderstandingSystem);
    if (sus) {
      const qPlanes = sus.queries.planeEntities as any;
      if (qPlanes?.results) [...qPlanes.results].forEach((e: any) => {
        try { e.destroy(); } catch {}
      });
      const qMeshes = sus.queries.meshEntities as any;
      if (qMeshes?.results) [...qMeshes.results].forEach((e: any) => {
        try { e.destroy(); } catch {}
      });
    }
  });
}
```

**Continue using this pattern - it's working correctly.**

---

## Recommendations

### Priority 1 - Fix Immediately

1. **Path Resolution**
   - Add explicit "File Path Resolution Protocol" to system prompt
   - Force Glob usage before Read on first attempt
   - Provide `{cwd}` variable substitution in paths

2. **requestAnimationFrame Ban**
   - Add pre-generation checklist
   - Auto-validate generated code for RAF usage
   - Show error if RAF detected in code

### Priority 2 - Improve Experience

3. **Tool Documentation**
   - Explicitly list ALL available MCP tools
   - Document what's NOT available
   - Provide manual alternatives

4. **Performance Optimization**
   - Add "simple operation" fast path
   - Target <5s for file copy/rename/backup operations
   - Use prompt caching more aggressively

### Priority 3 - Nice to Have

5. **Missing Tools**
   - Add `remove_model` to MCP server
   - Add `update_model` (regenerate with new params)
   - Add `backup_file` tool for instant backups

---

## Success Patterns (Keep Doing)

✅ **Physics implementation** - No errors found, current pattern works
✅ **Grab system** - No errors found, automatic system works well
✅ **HMR cleanup** - No errors found, comprehensive cleanup works
✅ **Input API** - Modern API (world.input.gamepads) working correctly

---

## Appendix: Common Error Messages

### Error: "File does not exist"
**Cause:** Wrong file path (hardcoded or hallucinated)
**Fix:** Use Glob to find file first, then Read result

### Error: "No such tool available: X"
**Cause:** Tool doesn't exist in current MCP session
**Fix:** Check available tools list, use manual alternative (Edit/Write/Bash)

### Error: Animation freezes in XR
**Cause:** Using requestAnimationFrame instead of __GAME_UPDATE__
**Fix:** Replace RAF with window.__GAME_UPDATE__ = updateFn

### Error: Physics not working
**Cause:** Using world.createEntity instead of createTransformEntity
**Fix:** Always use world.createTransformEntity(mesh)

### Error: Grab not working
**Cause:** Missing Interactable component
**Fix:** Add Interactable first, then Grabbable component

---

## Metrics Summary

```
Total Traces Analyzed:     113
Date Range:                2025-12-07 to 2025-12-08

Error Breakdown:
├─ Path Resolution Errors: 25 (22.1%)
├─ Tool Not Found:         1  (0.9%)
├─ Slow Queries (>20s):    12 (10.6%)
├─ No Tool Calls:          10 (8.8%)
└─ RAF Usage:              4  (3.5%)

Success Rate:              ~65% (traces with is_error:false)
Average Duration:          ~15-20s per query
Average Tool Calls:        3-4 per query
```

---

**Generated:** 2025-12-09
**Analyst:** Claude Sonnet 4.5
**Data Source:** /Users/yurygagarin/code/vrcreator2/logs/conversation-traces/
