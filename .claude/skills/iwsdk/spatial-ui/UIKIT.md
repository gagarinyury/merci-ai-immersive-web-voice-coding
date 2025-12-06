## Imports

```ts
import { Root, Container, Text, Image, Video, Svg, Input, Textarea, reversePainterSortStable } from '@pmndrs/uikit';
```

## Components

| Component | Description |
|-----------|-------------|
| Container | Layout node (flexbox) |
| Text | MSDF text with wrapping |
| Image | Image content |
| Video | Video content |
| Svg | Vector graphics |
| Input | Text input control |
| Textarea | Multi-line input |

## Units

- UIKit intrinsic sizes: **centimeters (cm)**
- UIKitDocument target dimensions: **meters**
- UIKitDocument computes uniform scale to fit

## Raw UIKit Usage (without IWSDK)

```ts
import { Root, Container, Text, reversePainterSortStable } from '@pmndrs/uikit';

const root = new Root(camera, renderer, {
  width: 1000,   // cm
  height: 500,
  padding: 10,
});
scene.add(root);

const panel = new Container({ flexDirection: 'row', gap: 8 });
panel.add(new Text({ text: 'Hello XR' }));
root.add(panel);

renderer.setTransparentSort(reversePainterSortStable);
renderer.setAnimationLoop((t) => root.update(t));
```

## Layout Properties (Yoga/Flexbox)

```ts
{
  flexDirection: 'row' | 'column',
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between',
  alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch',
  gap: number,
  padding: number,
  margin: number,
  flexGrow: number,
  flexShrink: number,
  flexBasis: number | 'auto',
  width: number,
  height: number,
  minWidth: number,
  minHeight: number,
  maxWidth: number,
  maxHeight: number,
}
```

## Conditional Style Variants

```ts
hover   // pointer over
active  // being pressed
focus   // has focus
sm, md, lg, xl, 2xl  // responsive breakpoints
```

## classList API (runtime)

```ts
const doc = entity.getValue(PanelDocument, 'document');
const card = doc?.querySelector('.card');

card?.classList.add('selected');
card?.classList.remove('selected');
card?.classList.toggle('active');
```

## ECS Integration

```ts
// PanelDocument component holds the document reference
entity.getValue(PanelDocument, 'document')
```

## Transparent Sorting

```ts
import { reversePainterSortStable } from '@pmndrs/uikit';
renderer.setTransparentSort(reversePainterSortStable);
```

Required for correct layering of translucent UI panels.
