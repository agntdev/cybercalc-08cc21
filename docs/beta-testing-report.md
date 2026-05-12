# CyberCalc Closed Beta Report

## Program

Closed beta is local-first: crash reports, feedback, performance summaries, and issue rankings are stored in `cybercalc_beta_program_v1` until a real backend is connected.

## Top 10 Issues Fixed

| Rank | Issue | Fix |
|---:|---|---|
| 1 | Long display values can wrap over the prompt marker | Existing display wrapping keeps values inside the display container. |
| 2 | Settings panel can obscure the display on narrow screens | Compact status rows keep new controls inside the panel. |
| 3 | WebGL unavailable in some headless or locked-down browsers | Visual effects fall back to CSS. |
| 4 | Offline sync needs visible queue state | Sync status reports provider, count, and state. |
| 5 | AR unavailable on desktop should still have a fallback | AR fallback hologram handles non-AR devices. |
| 6 | Push setup needs an unavailable state for simulators | Mobile framework returns unavailable when device push is not supported. |
| 7 | Repeated decimal input should not duplicate dots | Calculator decimal handling ignores duplicate decimals. |
| 8 | Divide-by-zero error should not enter history sync | Calculator emits sync events only for successful results. |
| 9 | Motion-heavy effects need reduced-motion behavior | CSS disables heavy animations through `prefers-reduced-motion`. |
| 10 | Beta feedback needs local-only storage by default | Feedback is captured locally and sanitized before storage. |

## Monitoring

- Crash source: `window.error` and `unhandledrejection`.
- Performance source: browser `performance` navigation/resource entries.
- Feedback source: settings panel feedback button.
- Privacy default: no network transmission.
