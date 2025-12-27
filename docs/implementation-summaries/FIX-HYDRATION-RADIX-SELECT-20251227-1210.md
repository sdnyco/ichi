# Fix hydration for Radix Select in Expanded Profile Sheet (2025-12-27 12:10)

## What changed

- Added a small `hydrated` flag inside `ExpandedProfileSheet` that flips to `true` in a mount-only `useEffect`.
- When SSR/initial hydration is still running (`!hydrated`), the age-band field now renders a static, non-interactive shell that mirrors the Select trigger styling but skips Radix’s `Select`/`SelectContent`.
- Once hydration completes, the existing Radix `<Select>` (with the same items, handlers, and styling) renders exactly as before.

## Why

- Radix Select mounts a portal/collection subtree that uses `React.useId`; when it loads on the client but not during SSR, it shifts the hook order and bubbles up as a Dialog `aria-controls` mismatch on the “Your profile” button.
- Preventing the Radix subtree from rendering until after hydration keeps the server/client trees identical while preserving the same UI and behavior once the page is live.


