# Place Check-In Drawer Hydration Fix (2025-12-27 11:06)

## What changed

- Server page now generates a deterministic alias via `generateAlias()` and passes it down as `initialDrawerAlias` so the first render of `<PlaceCheckInDrawer />` is identical on both server and client.
- `PlacePageContent` threads the alias through to the drawer, and the drawer’s `useState` initializes from the provided value (falling back to `generateAlias()` only when none is supplied). Later resets still use the existing client-side generator.
- Added explicit generics to the drawer’s duration and mood state to keep TypeScript happy after the prop change.

## Why

- The drawer previously called `generateAlias()` inside its initial `useState`, causing the server-rendered markup to differ from the client’s hydrated tree (different alias → different Radix `aria-controls` IDs). Passing the server-generated alias removes the randomness from the hydration path, eliminating the intermittent mismatch warning without altering user-facing behavior.


