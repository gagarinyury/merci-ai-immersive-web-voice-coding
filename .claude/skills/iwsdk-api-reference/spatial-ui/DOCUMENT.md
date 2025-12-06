## Access UIKitDocument

```ts
const doc = entity.getValue(PanelDocument, 'document'); // UIKitDocument
```

## Query Methods

```ts
doc.getElementById('menu')              // single element by ID
doc.getElementsByClassName('row')       // array by class
doc.querySelector('#menu .title')       // first match
doc.querySelectorAll('.button')         // all matches
```

## Supported Selectors

| Selector | Example |
|----------|---------|
| #id | #menu |
| .class | .button |
| descendant | #parent .child |
| combined | #menu .row .button |

**Not supported**: attribute selectors, pseudo-classes (except UIKit hover/active/focus)

## Physical Sizing (meters)

```ts
// Set target dimensions in meters
doc.setTargetDimensions(1.0, 0.6);  // ~1m wide, 0.6m tall
```

### Sizing Formula

```
intrinsic size: centimeters (cm)
target size: meters

uiWidthMeters = intrinsicWidthCm / 100
scale = min(targetWidth / uiWidthMeters, targetHeight / uiHeightMeters)
```

Scale applied to Group, preserving internal layout.

## classList API

```ts
const button = doc.getElementById('start');
button?.classList.add('disabled');
button?.classList.remove('disabled');
button?.classList.toggle('active');
```

## Lifecycle

```ts
doc.dispose();  // cleanup signals and components
```

Called automatically by PanelUISystem.cleanupPanel

## Debug

```ts
console.log(doc.toString());  // element/class counts, computed sizes
```

## Related Systems

| System | Description |
|--------|-------------|
| PanelUISystem | Loads JSON, interprets, creates UIKitDocument, attaches to entity |
| ScreenSpaceUISystem | Re-parents under camera when XR not presenting |
