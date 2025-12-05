// Source: /immersive-web-sdk3/docs/concepts/xr-input/stateful-gamepad.md
// IWSDK StatefulGamepad API

export const statefulGamepad = `
## Access Gamepads

\`\`\`ts
const leftPad = xrInput.gamepads.left;
const rightPad = xrInput.gamepads.right;
// Always null-check: pad may not exist
\`\`\`

## Standard Component IDs

| ID | Description |
|----|-------------|
| xr-standard-trigger | Index trigger |
| xr-standard-squeeze | Grip/squeeze |
| xr-standard-thumbstick | Thumbstick |
| xr-standard-touchpad | Touchpad |
| a-button, b-button | A/B buttons |
| x-button, y-button | X/Y buttons |
| thumbrest | Thumb rest |
| menu | Menu button |

## Button Methods

\`\`\`ts
// By component ID
pad.getButtonPressed('xr-standard-trigger')  // boolean: currently pressed
pad.getButtonDown('xr-standard-trigger')     // boolean: just pressed this frame
pad.getButtonUp('xr-standard-trigger')       // boolean: just released this frame
pad.getButtonValue('xr-standard-trigger')    // number: 0..1 analog value

// By raw index
pad.getButtonUpByIdx(3)
\`\`\`

## Select Convenience Methods

\`\`\`ts
pad.getSelectStart()   // select just pressed
pad.getSelectEnd()     // select just released
pad.getSelecting()     // select currently held
\`\`\`

## Axes Methods

\`\`\`ts
// Get raw values
const { x, y } = pad.getAxesValues('xr-standard-thumbstick');

// Get magnitude (0..√2)
const mag = pad.get2DInputValue('xr-standard-thumbstick');
\`\`\`

## Directional State Machine

Edge-triggered directional events with threshold:

\`\`\`ts
pad.axesThreshold = 0.8;  // default, adjust for sensitivity

// Entering direction (just crossed threshold)
pad.getAxesEnteringUp('xr-standard-thumbstick')
pad.getAxesEnteringDown('xr-standard-thumbstick')
pad.getAxesEnteringLeft('xr-standard-thumbstick')
pad.getAxesEnteringRight('xr-standard-thumbstick')

// Leaving direction (just returned from threshold)
pad.getAxesLeavingUp('xr-standard-thumbstick')
pad.getAxesLeavingDown('xr-standard-thumbstick')
pad.getAxesLeavingLeft('xr-standard-thumbstick')
pad.getAxesLeavingRight('xr-standard-thumbstick')
\`\`\`

States: Default, Up, Down, Left, Right
`;
