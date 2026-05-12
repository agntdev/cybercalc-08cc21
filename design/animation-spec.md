# CyberCalc Animation Spec

## Glitch Burst

Trigger: calculator key press, keyboard input, or AR fallback gesture.

Duration: 180ms.

Frames:
- Idle panel.
- Magenta edge shifts on the x axis.
- Cyan edge shifts opposite on x/y.
- Panel returns to rest.

Rule: never move text long enough to block reading. Respect `prefers-reduced-motion`.

## Circuit Trace Pulse

Trigger: passive background loop.

Duration: 3.2s repeating.

Frames:
- Trace starts at 20% opacity.
- Trace reaches 90% opacity at midpoint.
- Trace returns to 20% opacity.

Rule: traces stay behind the calculator layer and never intercept pointer input.

## Dynamic Lighting

Trigger: pointer movement.

Behavior: panel glow increases near the calculator center and decreases near panel edges. The body background radial light follows pointer position.

Rule: the default center state must be visually complete without pointer movement.

## AR Hologram Rise

Trigger: AR fallback toggle.

Duration: 420ms.

Frames:
- Overlay starts below center, transparent, and tilted.
- Overlay rises to center while opacity reaches 100%.
- Pointer movement controls small 3D tilt.

Rule: non-AR devices get the fallback overlay; WebXR devices can request immersive AR with `hit-test`, `light-estimation`, and `local-floor` options.
