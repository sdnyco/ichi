[4 tools called]

Investigation recap (no code changes yet):

1. **Click flow & identifier mapping**
   - `src/components/place-gallery.tsx` builds `GalleryItem`s. When a card is clicked, `handleCardClick` runs.
     - **Self card** (`kind === "self"` or viewer userId match) short-circuits to `onSelfProfileRequested`; no overlay open, so no identifier passed downstream.
     - **Checked-in cards** (`kind === "active"`) call `setSelectedUserId(entry.userId)` and `setSelectedCheckInId(entry.id)` (the check-in UUID), then open `OtherProfileSheet`.
     - **Anchored cards** (`kind === "anchored"`) call `setSelectedUserId(entry.userId)` but have no `checkInId`, so the overlay receives only the userId.

   - `OtherProfileSheet` (`src/components/profile/other-profile-sheet.tsx`) reads `targetUserId`, `placeId`, and optional `checkInId`, but the fetch call only uses `viewerUserId`, `placeId`, and `targetUserId`. The check-in id is currently unused in the request.

2. **Overlay expectations**
   - `/api/profiles` (`src/app/api/profiles/route.ts`) requires three query params: `viewerUserId`, `placeId`, and `targetUserId`.
   - The handler joins `check_ins`, `places`, and `place_profiles`, with a `WHERE` clause that forces `checkIns.userId = targetUserId`, `checkIns.placeId = placeId`, and `checkIns.expiresAt > now`.
   - If no active check-in row matches, it returns 404 (`{ error: "not_found" }`).

3. **Why anchored cards 404**
   - Anchored entries come from `place_profiles` with no guarantee of an active check-in. Clicking them still sends only `userId`, so `/api/profiles` queries `check_ins` for an active row and finds none, yielding a 404. The issue isn’t mismatched identifiers (checked-in and anchored both use userId); it’s that the endpoint assumes “target user at this place” always has a live check-in.

4. **Minimal plan to unify the contract**
   - Keep the canonical identifier as `(placeId, targetUserId)` for *all* cards so the gallery contract stays simple.
   - Update `/api/profiles` and `OtherProfileSheet` so the response can represent both:
     - **Active view** – current behavior when a live check-in exists.
     - **Anchored-only view** – fall back to `place_profiles` (and optionally recent `check_ins` data or `lastSeenAt`) when no active check-in matches; return `activeCheckin: null` but include alias, hooks/last hooks, recognizability hint if available, etc.
   - Adjust `OtherProfileSheet` UI logic to handle `activeCheckin` being null (e.g., show “Not currently checked in” and hide sections that require live data). This keeps the identifier contract unified without introducing new routes.

Let me know if you’d like me to proceed with implementing that fallback + UI handling.