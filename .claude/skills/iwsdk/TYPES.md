# IWSDK Type Reference

## World

The main container for the scene that manages entities, components, and systems.

```typescript
interface World {
  // Create entity from THREE.js mesh
  createTransformEntity(mesh: THREE.Mesh): Entity;

  // Create entity from geometry and material
  createTransformEntity(
    geometry: THREE.BufferGeometry,
    material: THREE.Material
  ): Entity;
}
```

**Usage:**
```typescript
const world = window.__IWSDK_WORLD__ as World;
```

## Entity

An object in the scene. Every entity has a Transform component (via THREE.js mesh).

```typescript
interface Entity {
  // Add component to entity
  addComponent<T extends Component>(
    ComponentClass: new (...args: any[]) => T,
    config?: Partial<T>
  ): T;

  // Get component from entity
  getComponent<T extends Component>(
    ComponentClass: new (...args: any[]) => T
  ): T | undefined;

  // Check if entity has component
  hasComponent<T extends Component>(
    ComponentClass: new (...args: any[]) => T
  ): boolean;

  // Remove component from entity
  removeComponent<T extends Component>(
    ComponentClass: new (...args: any[]) => T
  ): void;

  // Access underlying THREE.js mesh
  mesh: THREE.Mesh;
}
```

**Transform access:**
```typescript
entity.mesh.position.set(x, y, z);
entity.mesh.rotation.set(rx, ry, rz);
entity.mesh.scale.set(sx, sy, sz);
```

## Component

Base class for all components. Components add behavior to entities.

```typescript
abstract class Component {
  entity: Entity;           // Parent entity
  enabled: boolean;         // Is component active
}
```

## Materials

### MeshStandardMaterial (Recommended - PBR)

Physically-based rendering material with realistic lighting.

```typescript
new THREE.MeshStandardMaterial({
  color: 0xff0000,           // Hex color (e.g., 0xff0000 = red)
  emissive: 0x000000,        // Emission color (glowing effect)
  emissiveIntensity: 1,      // Emission strength
  metalness: 0.5,            // 0 = non-metal, 1 = fully metallic
  roughness: 0.5,            // 0 = smooth/glossy, 1 = rough/matte
  wireframe: false,          // Show as wireframe
  transparent: false,        // Enable transparency
  opacity: 1,                // 0 = invisible, 1 = opaque
  side: THREE.FrontSide      // FrontSide, BackSide, DoubleSide
})
```

**Common presets:**
```typescript
// Shiny metal
{ color: 0xcccccc, metalness: 1, roughness: 0.1 }

// Matte plastic
{ color: 0xff0000, metalness: 0, roughness: 1 }

// Glass-like
{ color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.3 }
```

### MeshBasicMaterial (Unlit)

Simple material without lighting calculations. Good for UI elements or flat colors.

```typescript
new THREE.MeshBasicMaterial({
  color: 0xff0000,           // Hex color
  wireframe: false,
  transparent: false,
  opacity: 1,
  side: THREE.FrontSide
})
```

### MeshPhongMaterial (Legacy)

Older shiny material (use MeshStandardMaterial instead for better quality).

```typescript
new THREE.MeshPhongMaterial({
  color: 0xff0000,
  shininess: 30,             // 0 = matte, 100 = very shiny
  specular: 0x111111         // Specular highlight color
})
```

## Geometries

### Basic Shapes

```typescript
// Box (cube or rectangular)
new THREE.BoxGeometry(width, height, depth)
// Example: new THREE.BoxGeometry(1, 1, 1) - 1 meter cube

// Sphere
new THREE.SphereGeometry(radius, widthSegments, heightSegments)
// Example: new THREE.SphereGeometry(0.5, 32, 32) - smooth sphere

// Cylinder
new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
// Example: new THREE.CylinderGeometry(0.5, 0.5, 2, 32) - cylinder

// Cone (cylinder with radiusTop = 0)
new THREE.ConeGeometry(radius, height, radialSegments)
// Example: new THREE.ConeGeometry(0.5, 1, 32) - cone

// Plane (flat surface)
new THREE.PlaneGeometry(width, height)
// Example: new THREE.PlaneGeometry(2, 2) - 2x2 meter plane

// Torus (donut shape)
new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)
// Example: new THREE.TorusGeometry(1, 0.4, 16, 100) - donut

// Torus Knot (complex knot shape)
new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments)
// Example: new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
```

### Advanced Shapes

```typescript
// Icosahedron (20-sided polyhedron)
new THREE.IcosahedronGeometry(radius, detail)

// Octahedron (8-sided polyhedron)
new THREE.OctahedronGeometry(radius, detail)

// Dodecahedron (12-sided polyhedron)
new THREE.DodecahedronGeometry(radius, detail)

// Ring (flat donut)
new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments)
```

### Geometry Tips

- **Higher segment counts** = smoother appearance but worse performance
- **Default segments are usually fine** for most shapes
- **Use BufferGeometry** (all THREE.js geometries are BufferGeometry by default)
- **Position is set on mesh**, not geometry

## Colors

### Hex Colors

```typescript
0xff0000  // Red
0x00ff00  // Green
0x0000ff  // Blue
0xffff00  // Yellow
0xff00ff  // Magenta
0x00ffff  // Cyan
0xffffff  // White
0x000000  // Black
0x808080  // Gray
```

### Random Colors

```typescript
const randomColor = Math.random() * 0xffffff;
new THREE.MeshStandardMaterial({ color: randomColor });
```

### RGB to Hex

```typescript
// R=255, G=128, B=64
const hexColor = (255 << 16) | (128 << 8) | 64;  // 0xff8040
```

## Vector3 (Position, Rotation, Scale)

```typescript
// Set position
mesh.position.set(x, y, z);           // Set all axes
mesh.position.x = 1;                   // Set individual axis
mesh.position.copy(otherPosition);     // Copy from another Vector3

// Get position
const pos = mesh.position;
console.log(pos.x, pos.y, pos.z);

// Distance between points
const distance = mesh.position.distanceTo(otherPosition);

// Rotation (in radians)
mesh.rotation.set(rx, ry, rz);
mesh.rotation.y = Math.PI / 4;  // 45 degrees

// Scale
mesh.scale.set(sx, sy, sz);
mesh.scale.set(2, 2, 2);  // Double size
```

## Common Conversions

```typescript
// Degrees to radians
const radians = degrees * (Math.PI / 180);

// Radians to degrees
const degrees = radians * (180 / Math.PI);

// Common angles
Math.PI / 4    // 45 degrees
Math.PI / 2    // 90 degrees
Math.PI        // 180 degrees
Math.PI * 2    // 360 degrees
```
