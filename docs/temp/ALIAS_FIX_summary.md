[7 tools called]

Here’s what I found:

**Current alias flow**
- `PlaceCheckInDrawer` seeds and resets its `alias` state exclusively from `generateAlias()` (or the `initialAlias` prop) and never looks at place profile data (`src/components/place-check-in-drawer.tsx`, lines ~63–90 & reset handler). Every time the drawer mounts or resets, we pick a fresh alias.
- The `initialAlias` prop is supplied by `PlacePageContent`, which currently calls `generateAlias()` on the server (`src/app/place/[slug]/page.tsx`) just to keep SSR/CSR output identical; it does **not** pass through any stored alias.
- When the user submits, the API endpoint always calls `updatePlaceProfileAlias` with whatever alias came from the drawer (`src/app/api/check-ins/route.ts`, lines 78–88). So each check-in overwrites the place profile alias with this newly generated string, even if a prior alias already existed.

**Data we already have**
- `getPlaceGalleryBuckets` fetches `viewerProfile` from `place_profiles` (alias + aliasGenerated) whenever the viewer has ever checked into that place (`src/db/queries/places.ts`, lines 182–225). That object is handed to `PlacePageContent` as part of the `gallery` prop, but the drawer ignores it today.
- Because the alias lives in `place_profiles.alias` and the page query already returns it, we can know “user already has an alias for this place” before showing the drawer. First-time visitors simply won’t have a record yet, so we fall back to the generator as we do now.

**Proposed minimal fix**
1. Pass the persisted alias (if any) from `gallery.viewerProfile?.alias` down to `PlaceCheckInDrawer` (maybe as `existingAlias`). Keep the current random fallback for first-time users to preserve SSR parity.
2. Inside the drawer, treat “alias step required?” as `!existingAlias`. We can derive the step list dynamically (e.g. `const steps = hasAlias ? ["duration","mood","hint"] : STEP_IDS`) so the wizard never navigates to alias when a stored alias exists.
3. Seed/reset the `alias` state from `existingAlias ?? generateAlias()`. When an alias exists we simply reuse it—`handleRegenerateAlias` and the alias UI won’t render because the step is skipped.
4. Submission keeps sending `alias` (now the persisted value) so backend behavior and profile editor editing remain untouched.

**Edge cases / notes**
- First-time check-ins: `viewerProfile` will be null and we still run through the alias step exactly as today.
- If for some reason a user deleted their place profile (no alias) but has historical check-ins, the absence of `viewerProfile` will naturally re-enable the alias step.
- The alias editor in the profile sheet continues to be the place for re-rolls; this change only avoids re-rolling inside the check-in flow once an alias exists.

Let me know if you’re okay with that plan and I’ll implement it along with the doc summary.