// Source: /immersive-web-sdk3/docs/concepts/spatial-ui/uikitml.md
// IWSDK UIKitML authoring language

export const uikitml = `
## Imports

\`\`\`ts
import { parse, interpret, generate } from '@pmndrs/uikitml';
\`\`\`

## Elements (tags)

\`\`\`html
<container>  <!-- layout node -->
<text>       <!-- MSDF text -->
<image>      <!-- image -->
<video>      <!-- video -->
<svg>        <!-- vector -->
<input>      <!-- input control -->
\`\`\`

## Syntax Example

\`\`\`html
<container id="menu" class="panel" style="padding: 12; gap: 8">
  <text class="title" style="fontSize: 24">Settings</text>
  <container class="row" style="flexDirection: row; gap: 6">
    <text>Music</text>
    <input id="music" />
  </container>
</container>
\`\`\`

## Class Blocks (styles)

\`\`\`css
.panel {
  backgroundColor: rgba(0, 0, 0, 0.6);
  padding: 12;
  sm: {
    padding: 8;
  }
}

.title {
  fontSize: 24;
  hover: {
    color: #fff;
  }
}
\`\`\`

## Property Names

Use **camelCase** (JavaScript style):
- backgroundColor (not background-color)
- fontSize (not font-size)
- flexDirection (not flex-direction)

## parse() API

\`\`\`ts
const result = parse(uikitmlText, { onError: (err) => console.error(err) });

// Returns:
{
  element: ElementJson,           // root element tree
  classes: {                      // class definitions
    [className]: { origin?, content }
  },
  ranges: {                       // source mapping
    [uid]: { start: { line, column }, end: { line, column } }
  }
}
\`\`\`

## interpret() API

\`\`\`ts
// Basic
const rootComponent = interpret(parseResult);

// With custom components kit
const kit = { gauge: GaugeComponent };
const rootComponent = interpret(parseResult, kit);
\`\`\`

## data-* Attributes

\`\`\`html
<container data-action="submit" data-index="5">
\`\`\`

Maps to userData:
\`\`\`ts
component.userData.action // "submit"
component.userData.index  // "5"
\`\`\`

## Custom Components (kit)

\`\`\`ts
import { Component } from '@pmndrs/uikit';

class Gauge extends Component {
  // custom implementation
}

const kit = { gauge: Gauge };  // <gauge> tag → Gauge class
const root = interpret(parseResult, kit);
\`\`\`

Unknown tags without kit entry → Container with userData.customElement

## Conditional Styles

| Group | Trigger |
|-------|---------|
| hover | pointer over |
| active | being pressed |
| focus | has focus |
| sm, md, lg, xl, 2xl | responsive breakpoints |

Application order: base → responsive → interactive
`;
