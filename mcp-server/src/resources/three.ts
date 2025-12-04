/**
 * Resource: iwsdk://api/three
 *
 * Three.js API в контексте IWSDK
 *
 * ДОБАВЛЕНО:
 * - Geometry: Box, Sphere, Cylinder, Plane, Torus + параметры
 * - Material: MeshStandardMaterial (основной), MeshBasicMaterial, MeshPhysicalMaterial
 * - Mesh: создание, свойства
 * - Transforms: position, rotation (quaternion), scale
 * - Координатная система (1 unit = 1 meter)
 * - Color: hex форматы
 * - Текстуры: AssetManager.getTexture, colorSpace
 * - GLTF: AssetManager.getGLTF
 * - Два способа импорта: @iwsdk/core и 'three'
 *
 * НЕ ДОБАВЛЕНО:
 * - BufferGeometry (редко нужно для генерации)
 * - LOD (оптимизация, не базовое)
 * - InstancedMesh (продвинутое)
 * - Lights (IWSDK автоматически)
 * - Environment maps (автоматически)
 * - Shadows (редко в AR)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerThreeResource(server: McpServer) {
  server.resource("iwsdk://api/three", "Three.js API для IWSDK", async () => {
    const content = `# Three.js API в IWSDK

## Импорт

Два способа - оба работают:

\`\`\`typescript
// Способ 1: из @iwsdk/core (рекомендуется)
import { Mesh, BoxGeometry, MeshStandardMaterial } from '@iwsdk/core';

// Способ 2: из three напрямую
import * as THREE from 'three';
\`\`\`

## Формула создания объекта

\`\`\`
Mesh = Geometry + Material
Entity = world.createTransformEntity(mesh)
\`\`\`

---

## GEOMETRY (форма)

### BoxGeometry
\`\`\`typescript
new BoxGeometry(width, height, depth)
new BoxGeometry(1, 1, 1)      // куб 1x1x1 метр
new BoxGeometry(0.5, 0.2, 0.3) // прямоугольник
\`\`\`

### SphereGeometry
\`\`\`typescript
new SphereGeometry(radius, widthSegments, heightSegments)
new SphereGeometry(0.3, 32, 32)  // сфера радиус 30см, гладкая
new SphereGeometry(0.5, 16, 16)  // менее гладкая (performance)
\`\`\`

### CylinderGeometry
\`\`\`typescript
new CylinderGeometry(radiusTop, radiusBottom, height, segments)
new CylinderGeometry(0.2, 0.2, 0.8, 32)  // цилиндр
new CylinderGeometry(0, 0.3, 0.5, 32)    // конус (top=0)
\`\`\`

### PlaneGeometry
\`\`\`typescript
new PlaneGeometry(width, height)
new PlaneGeometry(2, 2)       // плоскость 2x2 метра
new PlaneGeometry(3.39, 0.96) // для баннера/текстуры
\`\`\`

### TorusGeometry
\`\`\`typescript
new TorusGeometry(radius, tube, radialSegments, tubularSegments)
new TorusGeometry(1, 0.3, 16, 100) // бублик
\`\`\`

---

## MATERIAL (внешний вид)

### MeshStandardMaterial (основной, реагирует на свет)
\`\`\`typescript
new MeshStandardMaterial({
  color: 0xff0000,     // красный (hex)
  roughness: 0.5,      // 0=зеркало, 1=матовый
  metalness: 0.2,      // 0=пластик, 1=металл
})

// Типичные комбинации:
// Пластик: roughness: 0.7, metalness: 0.0
// Металл:  roughness: 0.3, metalness: 0.8
// Резина:  roughness: 0.9, metalness: 0.0
\`\`\`

### MeshBasicMaterial (без освещения, для UI)
\`\`\`typescript
new MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,   // если нужна прозрачность
  opacity: 0.8,
})

// С текстурой:
new MeshBasicMaterial({
  map: texture,
  transparent: true,
})
\`\`\`

### MeshPhysicalMaterial (продвинутый PBR)
\`\`\`typescript
new MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.1,
  clearcoat: 1.0,           // лаковое покрытие
  transmission: 0.9,        // стекло
  thickness: 1.0,
})
\`\`\`

---

## MESH (объединение)

\`\`\`typescript
const geometry = new SphereGeometry(0.3, 32, 32);
const material = new MeshStandardMaterial({ color: 0xff0000 });
const mesh = new Mesh(geometry, material);

// Или одной строкой:
const mesh = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: 0x00ff00 })
);
\`\`\`

---

## TRANSFORMS (позиция, вращение, масштаб)

### Координатная система
\`\`\`
+Y (вверх)
|
|
|______ +X (вправо)
/
/
+Z (к зрителю)

1 unit = 1 метр (реальный мир)
\`\`\`

### Position
\`\`\`typescript
mesh.position.set(x, y, z)
mesh.position.set(0, 1.5, -2)    // 1.5м вверх, 2м от зрителя
mesh.position.set(-0.7, 1.5, -2) // слева

// После создания entity:
entity.object3D.position.set(0, 1, -2)
entity.object3D.position.x += 0.5  // сдвинуть
\`\`\`

### Scale
\`\`\`typescript
mesh.scale.set(sx, sy, sz)
mesh.scale.set(2, 2, 2)       // в 2 раза больше
mesh.scale.setScalar(0.5)     // в 2 раза меньше (uniform)

entity.object3D.scale.setScalar(1.5)
\`\`\`

### Rotation
\`\`\`typescript
// Через euler (градусы → радианы)
mesh.rotation.y = Math.PI / 2      // 90°
mesh.rotation.y = Math.PI          // 180°
mesh.rotateY(Math.PI)              // повернуть на 180°

// Через quaternion (для анимации)
mesh.quaternion.setFromAxisAngle(
  new Vector3(0, 1, 0),  // ось Y
  Math.PI / 4            // 45°
)

// lookAt
mesh.lookAt(targetPosition)
\`\`\`

---

## COLOR (цвет)

\`\`\`typescript
// Все форматы работают:
color: 0xff0000        // hex число (красный)
color: 0x00ff00        // зеленый
color: 0x0088ff        // голубой
color: '#ff0000'       // hex строка
color: 'red'           // CSS имя

// Популярные цвета:
0xff0000  // красный
0x00ff00  // зеленый
0x0000ff  // синий
0xffff00  // желтый
0xff00ff  // пурпурный
0x00ffff  // циан
0xffffff  // белый
0x000000  // черный
0x808080  // серый
\`\`\`

---

## TEXTURES (текстуры)

### Через AssetManager (рекомендуется)
\`\`\`typescript
import { AssetManager, SRGBColorSpace } from '@iwsdk/core';

const texture = AssetManager.getTexture('textureName')!;
texture.colorSpace = SRGBColorSpace;  // ВАЖНО для цветных текстур

const material = new MeshBasicMaterial({
  map: texture,
  transparent: true,
});
\`\`\`

### ColorSpace
\`\`\`typescript
import { SRGBColorSpace, LinearSRGBColorSpace } from '@iwsdk/core';

// Для цветных текстур (diffuse/albedo):
texture.colorSpace = SRGBColorSpace;

// Для data текстур (normal, roughness):
texture.colorSpace = LinearSRGBColorSpace;
\`\`\`

---

## GLTF МОДЕЛИ

\`\`\`typescript
import { AssetManager } from '@iwsdk/core';

const { scene: robotMesh } = AssetManager.getGLTF('robot')!;

robotMesh.position.set(-1.2, 0.4, -1.8);
robotMesh.scale.setScalar(1);

const entity = world.createTransformEntity(robotMesh);
\`\`\`

---

## ПОЛНЫЕ ПРИМЕРЫ

### Простой объект
\`\`\`typescript
import { World } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

const geometry = new THREE.SphereGeometry(0.3, 32, 32);
const material = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.4,
  metalness: 0.6
});
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(-0.7, 1.5, -2);

const entity = world.createTransformEntity(mesh);
(window as any).__trackEntity(entity, mesh);
\`\`\`

### Баннер с текстурой
\`\`\`typescript
import { Mesh, PlaneGeometry, MeshBasicMaterial, AssetManager, SRGBColorSpace } from '@iwsdk/core';

const texture = AssetManager.getTexture('banner')!;
texture.colorSpace = SRGBColorSpace;

const banner = new Mesh(
  new PlaneGeometry(3.39, 0.96),
  new MeshBasicMaterial({ map: texture, transparent: true })
);
banner.position.set(0, 1, 1.8);
banner.rotateY(Math.PI);

world.createTransformEntity(banner);
\`\`\`

---

## ЧАСТЫЕ ОШИБКИ

| Ошибка | Решение |
|--------|---------|
| Объект черный | Добавь roughness/metalness или используй MeshBasicMaterial |
| Текстура тусклая | Установи texture.colorSpace = SRGBColorSpace |
| Объект не виден | Проверь position.z (отрицательный = перед камерой) |
| Объект слишком большой | 1 unit = 1 метр, используй меньшие значения |
| PlaneGeometry боком | Поверни mesh.rotation.x = -Math.PI / 2 |
`;

    return {
      contents: [
        {
          uri: "iwsdk://api/three",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
