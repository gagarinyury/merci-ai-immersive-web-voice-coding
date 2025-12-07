# Spatial UI (UIKit + UIKitML)

Build 3D user interfaces using React-like flexbox components or XML markup.

## Imports
```typescript
// Core UI
import { Root, Container, Text, Image, Video, Svg, Input, Textarea, reversePainterSortStable } from '@pmndrs/uikit';

// Markup Language (Optional but recommended)
import { parse, interpret } from '@pmndrs/uikitml';
```

## Basic Concepts
- **3D World Integration**: UI is rendered on a plane in 3D space.
- **Flexbox Layout**: Uses Yoga engine (like React Native).
- **Interactions**: Supports hover, active, focus states.
- **Rendering**: Must enable transparent sort for correct layering.

## Setup
```typescript
import { reversePainterSortStable } from '@pmndrs/uikit';

// 1. Enable transparent sort
renderer.setTransparentSort(reversePainterSortStable);

// 2. Create Root
const root = new Root(camera, renderer, {
  width: 100, // cm
  height: 60,
  padding: 10,
  flexDirection: 'column',
  backgroundColor: 0x000000
});
root.container.backgroundOpacity = 0.5;

// 3. Add to Scene
const entity = world.createTransformEntity(root as any); // Wrap as entity
// OR
scene.add(root);

// 4. Update Loop
renderer.setAnimationLoop((t) => {
    root.update(t);
    renderer.render(scene, camera);
});
```

## UIKit Components

| Component | Description |
|-----------|-------------|
| `Container` | Layout node (`div`). Supports flexbox props. |
| `Text` | MSDF text. Properties: `text`, `fontSize`, `color`. |
| `Image` | Displays texture. |
| `Input` | Interactive text field. |
| `Button` | Not a primitive   build using Container + events. |

## UIKitML (XML Markup)

Preferred way to build complex panels. Defines structure and style strings.

### Syntax
```typescript
const xml = `
<container class="panel">
    <text class="title">Settings</text>
    <container class="row">
        <text>Volume</text>
        <container class="slider" data-action="volume-slider" />
    </container>
    <container class="btn" data-action="save">
        <text>Save</text>
    </container>
</container>
`;

const styles = `
.panel {
    flexDirection: column;
    padding: 20;
    gap: 10;
    backgroundColor: #222;
    backgroundOpacity: 0.8;
    borderRadius: 10;
}
.title {
    fontSize: 32;
    color: #fff;
    marginBottom: 20;
}
.row {
    flexDirection: row;
    justifyContent: space-between;
    alignItems: center;
}
.btn {
    padding: 10;
    backgroundColor: #444;
    hover: { backgroundColor: #666; }
    active: { backgroundColor: #888; }
}
`;

// Parse and Interpret
// Note: You can concatenate xml + styles or pass them together
const uiTree = interpret(parse(xml + styles));
root.add(uiTree);
```

### Event Handling (`data-action`)
Elements with `data-action` attributes store this in `userData`.

```typescript
// Detect clicks
uiTree.traverse((node) => {
    if (node.userData?.action === 'save') {
        // Add click listener (using generic Object3D interaction or UIKit events if supported)
        // UIKit uses standard Three.js raycasting
    }
});
```

## Styling Properties
CamelCase properties (JS style):
- `backgroundColor` (hex or string)
- `backgroundOpacity` (0-1)
- `borderRadius`
- `flexDirection`: `row` | `column`
- `justifyContent`: `flex-start` | `center` | `space-between`
- `alignItems`: `center` | `stretch` | `flex-start`
- `gap`, `padding`, `margin`

## Responsive & State Styles
Define nested blocks for states:
```css
.button {
    backgroundColor: #f00;
    hover: { backgroundColor: #fa0; }
    active: { backgroundColor: #0f0; }
    sm: { padding: 5; }
    lg: { padding: 20; }
}
```
