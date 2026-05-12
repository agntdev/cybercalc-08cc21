# CyberCalc Style Guide

## Foundations

CyberCalc uses a dark instrument-panel base with cyan, magenta, yellow, and green accents. Cyan is the primary action and data color, magenta is used for confirmation and glitch overlays, yellow is reserved for destructive or caution states, and green marks successful system status.

## Components

Calculator shell:
- Fixed-width glass panel with cyan border, inset glow, and CRT scanline overlay.
- Brand row uses mono uppercase spacing and should stay visually quiet.
- Display values are right-aligned and can wrap for long scientific notation.

Buttons:
- Number buttons use the neutral surface.
- Operators use cyan.
- Equals uses magenta.
- Clear uses yellow.
- Function buttons use green.

System controls:
- Settings, sync, and AR controls use compact text labels with neon borders.
- Status text should include provider/state/count in one line where possible.
- Fallback panels should always expose a readable text state when motion or WebXR is unavailable.

## Icon Set

Use `design/icons.svg` as the source icon set. Icons inherit `currentColor` so they can be dropped into cyan, magenta, yellow, or green states without duplicate assets.

## Accessibility

Keep contrast high against `#0a0a0f`. Motion-heavy effects must remain optional through `prefers-reduced-motion`, and fallback modes must be readable without WebGL, WebXR, or audio.
