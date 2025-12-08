/**
 * IWSDK Input & Grab API Reference
 *
 * === HOW GRAB SYSTEM WORKS ===
 *
 * 1. AUTOMATIC - GrabSystem handles everything, you just add components:
 *    - Add Interactable + OneHandGrabbable/TwoHandsGrabbable/DistanceGrabbable to entity
 *    - System auto-detects squeeze/trigger/pinch and handles grab logic
 *
 * 2. INPUT TRIGGERS:
 *    - selectStart/selectEnd = trigger button (xr-standard-trigger)
 *    - squeezeStart/squeezeEnd = grip button (xr-standard-squeeze)
 *    - For hands: pinch = select, grab gesture = squeeze
 *
 * 3. POINTER TYPES:
 *    - RayPointer: distance interaction (луч) - uses SELECT (trigger)
 *    - GrabPointer: direct touch/grip - uses SQUEEZE (grip)
 *
 * 4. COMPONENT COMBINATIONS:
 *    - Interactable alone = hover/press detection only (Hovered/Pressed tags)
 *    - Interactable + DistanceGrabbable = grab with ray (trigger to grab)
 *    - Interactable + OneHandGrabbable = direct grab (squeeze when touching)
 *    - Interactable + TwoHandsGrabbable = two-hand manipulation with scale
 *
 * 5. FLOW:
 *    InputSystem -> detects Interactable entities -> raycasts -> adds Hovered/Pressed
 *    GrabSystem -> finds *Grabbable entities -> creates handles -> processes grab
 *
 * === MANUAL INPUT (for custom logic like shooting) ===
 *
 *   const gp = world.input.gamepads.right;
 *   if (gp?.getButtonDown('xr-standard-trigger')) { shoot(); }
 *
 * === GRABBABLE OBJECT SETUP ===
 *
 *   entity.addComponent(Interactable);
 *   entity.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget });
 */

// === GRAB COMPONENTS ===

// Required for any interaction (hover, press, grab)
export declare const Interactable: Component<{}>;

// Transient tags (auto-managed by InputSystem)
export declare const Hovered: Component<{}>;  // pointer over entity
export declare const Pressed: Component<{}>;  // pointer pressing entity

// Movement modes for DistanceGrabbable
export declare const MovementMode: {
    MoveFromTarget: string;      // follows ray endpoint
    MoveTowardsTarget: string;   // moves toward hand
    MoveAtSource: string;        // relative to hand delta
    RotateAtSource: string;      // rotate only, no translation
};

// One hand grab - direct touch/grip
export declare const OneHandGrabbable: Component<{
    rotate?: boolean;                    // default: true
    rotateMin?: [number, number, number];
    rotateMax?: [number, number, number];
    translate?: boolean;                 // default: true
    translateMin?: [number, number, number];
    translateMax?: [number, number, number];
}>;

// Two hands grab - with scaling
export declare const TwoHandsGrabbable: Component<{
    rotate?: boolean;                    // default: true
    rotateMin?: [number, number, number];
    rotateMax?: [number, number, number];
    translate?: boolean;                 // default: true
    translateMin?: [number, number, number];
    translateMax?: [number, number, number];
    scale?: boolean;                     // default: true
    scaleMin?: [number, number, number];
    scaleMax?: [number, number, number];
}>;

// Distance grab - raycast interaction
export declare const DistanceGrabbable: Component<{
    rotate?: boolean;                    // default: true
    rotateMin?: [number, number, number];
    rotateMax?: [number, number, number];
    translate?: boolean;                 // default: true
    translateMin?: [number, number, number];
    translateMax?: [number, number, number];
    scale?: boolean;                     // default: true
    scaleMin?: [number, number, number];
    scaleMax?: [number, number, number];
    movementMode?: string;               // MovementMode enum
    returnToOrigin?: boolean;            // default: false
    moveSpeed?: number;                  // for MoveTowardsTarget
}>;

type Component<T> = import("elics").Component<T>;

// === GAMEPAD INPUT ===

export declare enum AxesState {
    Default = 0,
    Up = 1,
    Down = 2,
    Left = 3,
    Right = 4
}

export declare enum InputComponent {
    Trigger = "xr-standard-trigger",
    Squeeze = "xr-standard-squeeze",
    Touchpad = "xr-standard-touchpad",
    Thumbstick = "xr-standard-thumbstick",
    A_Button = "a-button",
    B_Button = "b-button",
    X_Button = "x-button",
    Y_Button = "y-button",
    Thumbrest = "thumbrest",
    Menu = "menu"
}

export declare class StatefulGamepad {
    readonly handedness: XRHandedness;
    readonly gamepad: Gamepad;
    readonly inputSource: XRInputSource;

    // Button state - use InputComponent enum values as id
    getButtonPressed(id: string): boolean;      // held down now
    getButtonDown(id: string): boolean;         // just pressed this frame
    getButtonUp(id: string): boolean;           // just released this frame
    getButtonTouched(id: string): boolean;      // finger touching
    getButtonValue(id: string): number;         // 0-1 analog value

    // By index (0-based)
    getButtonPressedByIdx(idx: number): boolean;
    getButtonDownByIdx(idx: number): boolean;
    getButtonUpByIdx(idx: number): boolean;
    getButtonTouchedByIdx(idx: number): boolean;
    getButtonValueByIdx(idx: number): number;

    // Select button shortcuts
    getSelectStart(): boolean;
    getSelectEnd(): boolean;
    getSelecting(): boolean;

    // Thumbstick/Touchpad axes
    getAxesValues(id: string): { x: number; y: number } | undefined;
    getAxesState(id: string): AxesState | undefined;
    get2DInputValue(id: string): number | undefined;

    // Axes direction detection
    getAxesEnteringState(id: string, state: AxesState): boolean;
    getAxesLeavingState(id: string, state: AxesState): boolean;
    getAxesEnteringUp(id: string): boolean;
    getAxesEnteringDown(id: string): boolean;
    getAxesEnteringLeft(id: string): boolean;
    getAxesEnteringRight(id: string): boolean;
    getAxesLeavingUp(id: string): boolean;
    getAxesLeavingDown(id: string): boolean;
    getAxesLeavingLeft(id: string): boolean;
    getAxesLeavingRight(id: string): boolean;
}

// === PLAYER RIG (XROrigin) ===

import { Group } from 'three';

export declare class XROrigin extends Group {
    readonly head: Group;                        // headset position/rotation

    readonly raySpaces: {                        // aim direction (for raycasting)
        left: Group;
        right: Group;
    };

    readonly gripSpaces: {                       // hand/controller position
        left: Group;
        right: Group;
    };

    readonly secondaryRaySpaces: {               // secondary ray (hand tracking)
        left: Group;
        right: Group;
    };

    readonly secondaryGripSpaces: {              // secondary grip (hand tracking)
        left: Group;
        right: Group;
    };
}

// === ACCESS VIA WORLD ===

// world.input.gamepads.left  -> StatefulGamepad | undefined
// world.input.gamepads.right -> StatefulGamepad | undefined
// world.player               -> XROrigin
// world.player.head          -> Group (headset)
// world.player.gripSpaces.right.position -> Vector3
// world.player.raySpaces.right.quaternion -> Quaternion
