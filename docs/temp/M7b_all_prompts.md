## M7b-2 — Error boundaries + error UI posture (no white screens)

M7b-2 — Error boundaries + error UI posture (no white screens)

Goal
- Prevent “blank page / broken overlay” failures.
- Convert common failures into user-facing, non-fatal error states with retry.
- Keep visuals minimal; no heavy redesign.

Rules
- INVESTIGATE first, report back, then implement.
- No broad refactors.
- Avoid introducing new global state frameworks.
- No new dependencies unless strictly necessary; if zod already exists, ok.

1) INVESTIGATE
- Identify the most likely user-facing crash points:
  - ExpandedProfileSheet
  - OtherProfileSheet
  - PlacePingPanel (place-context fetch)
  - PlaceCheckInDrawer
- For each:
  - how errors manifest today (throw, console.error, silent)
  - whether there’s already an error boundary or error.tsx in the route segment
  - whether it’s server-render or client-only

2) REPORT (before changes)
- Propose a boundary strategy:
  - Route-level error.tsx where appropriate
  - Component-level boundaries for client overlays/drawers (so one overlay can fail without taking the page)
- Propose minimal UI behaviors:
  - “Couldn’t load. Retry” inline state for overlays
  - maintain existing “Save Bar” semantics where relevant
- Identify error codes/messages worth standardizing (e.g., place_context_failed)

3) IMPLEMENT (after report)
- Add appropriate error boundaries:
  - route segment error.tsx (admin + main user flows where needed)
  - component boundaries for overlay/drawer surfaces if they’re client components
- Ensure retry is possible where it makes sense (button triggers refetch).
- Ensure errors are logged (hook into existing error logging infra if present; otherwise console.error is acceptable until M7a analytics/error_events, but prefer consistent helper).

Deliverable
- Minimal styling (shadcn Button + simple text).
- Implementation summary describing:
  - what boundaries were added where
  - what retry does
  - any standardized error messages
If you have questions or concerns, please ask before implementation.

---

## M7b-3 — Performance hygiene + fetch lifecycle safety (AbortController / stale responses)

M7b-3 — Performance hygiene + fetch lifecycle safety (avoid stale state + Safari weirdness)

Goal
- Prevent stale saves / out-of-order fetch updates.
- Add AbortController to key client fetches and ignore stale responses.
- Remove leftover debug code paths that could run in production.
- Keep changes surgical.

Rules
- INVESTIGATE first, report back, then implement.
- No behavior-changing refactors beyond request lifecycle correctness.
- Do not touch Embla/carousel init logic.
- No new dependencies unless strictly necessary; if zod already exists, ok.

1) INVESTIGATE
A) Fetch lifecycle hotspots
- Find client-side fetches that can race or update state after unmount:
  - /api/me/place-context
  - profile overlay fetches
  - check-in drawer context fetches
- For each, report:
  - where called
  - whether AbortController is used
  - whether state updates are guarded against stale/unmounted

B) Autosave / write paths
- Identify autosave calls that can fire rapidly (hooks changes, profile saves).
- Check if requests are serialized, debounced, or can overlap.
- Look for any evidence of out-of-order responses overwriting newer state.

C) Debug remnants
- Search for console.log/group, DEBUG comments, and dev-only instrumentation.
- Flag anything that might execute in production bundles.

2) REPORT (before changes)
- Propose a minimal “fetch helper” pattern:
  - createAbortableFetch or per-component AbortController with cleanup
  - request “version” refs to ignore stale responses where abort isn’t enough
- List exact targets you will patch (file paths + functions).
- List debug code you will remove or guard.

3) IMPLEMENT (after report)
- Add AbortController + cleanup to the identified fetches.
- Add stale response protection where needed (monotonic counter/ref).
- Ensure autosave cannot be overwritten by older responses (if applicable).
- Remove/guard debug logs so nothing noisy runs in production.

Deliverable
- Keep diff small and localized.
- Implementation summary listing:
  - which fetches became abortable
  - which stale guards were added
  - what debug code was removed/guarded
If you have questions or concerns, please ask before implementation.
