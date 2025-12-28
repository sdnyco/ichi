# Fix Hydration via Viewer Snapshot (2025-12-28 11:42)

## What changed

- `PlaceGallery` now treats `renderedAt` as required, drops the client-side identity bootstrap, and only renders the self card when the server supplied `initialViewerUserId` plus the `viewerHasEverCheckedIn` flag allow it. The memo always uses the server timestamp, so no `new Date()` fallback can drift during hydration.
- `PlacePingPanel` accepts the server-provided viewer id and skips all identity fetching on mount; without a cookie, the panel renders nothing and defers all network work.
- `PlacePageContent` passes the viewer id into the ping panel, and when no cookie is available it calls `getOrCreateLocalUserId()` in a passive effect that simply refreshes the page once the cookie is restored, keeping the initial tree untouched.

## Why

- Hydration was still unstable because localStorage identity bootstrapping would cause client-only self cards and ping CTAs to appear during the first render, changing the DOM ahead of the Radix dialog trigger and shifting `aria-controls`.
- By relying exclusively on the SSR snapshot for both identity and relative time, the markup React hydrates now matches exactly what the server streamed, eliminating the intermittent warning while preserving the existing UX once the cookie is back in place.

## Follow-ups

- Monitor analytics for “no self card shown” cases to confirm the refresh path recovers quickly when cookies are missing.
- When we introduce future gallery or ping promotions, ensure those paths also respect the SSR viewer snapshot so we don’t reintroduce tree drift.

