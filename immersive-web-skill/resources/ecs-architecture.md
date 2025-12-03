# ECS Architecture in IWSDK

TODO: Fill with ~300 lines covering:

## Sections:

1. **Data-Oriented Design** (80 lines)
   - Columnar storage vs OOP
   - Memory layout advantages
   - Cache efficiency for VR/AR performance
   - SIMD potential

2. **Query Performance Model** (60 lines)
   - Bitmasking for O(1) component checks
   - How queries work internally
   - Query optimization patterns

3. **WebXR Frame Budget** (70 lines)
   - 72-90fps requirement
   - System priority architecture
   - Frame budget breakdown (11ms for 90fps)
   - Query-driven optimization

4. **Composition Patterns for WebXR** (50 lines)
   - Feature composition
   - Component combination examples
   - Hierarchical entities (parent-child)

5. **Scale and Performance Characteristics** (40 lines)
   - Entity limits (1000-5000 typical)
   - Component overhead
   - Memory usage patterns

Source material: /Users/yurygagarin/code/immersive-web-sdk/docs/concepts/ecs/architecture.md
