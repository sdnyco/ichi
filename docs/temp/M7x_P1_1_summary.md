**Investigation recap (still no code changes):**

1. **Current `/api/profiles` contract**
   - Requires `viewerUserId`, `placeId`, `targetUserId`.
   - Queries `check_ins` joined to `places`, `place_profiles`, `user_traits` with `WHERE check_ins.placeId = placeId`, `check_ins.userId = targetUserId`, and `check_ins.expiresAt > now`.
   - If no active check-in row matches, it returns `404 { error: "not_found" }`.
   - So anchored-only users (no active check-in) always produce 404, which matches the observed failure.

2. **Data available for anchored users**
   - `place_profiles`: alias, aliasGenerated, isAnchored, lastHooks, availability flags, updatedAt.
   - `users`: `lastSeenAt` (already touched elsewhere), `isBanned`.
   - There’s no recognizability hint outside of check-ins, but we can surface last hooks/alias plus `lastSeenAt` to show “Last seen …”.
   - We can also inspect the most recent expired check-in (optional) if needed for additional context, but it’s not necessary for the MVP fix.

3. **`OtherProfileSheet` UI expectations**
   - Currently assumes `data.activeCheckin` and uses its fields for mood, hooks, recognizability hint, and timing copy. If `activeCheckin` were null today, it would crash/empty because the code references nested values unguarded.
   - Minimal adjustment: treat `activeCheckin` as optional. When null, show a generic status pill like “Not currently checked in” plus last-seen timestamp, hide the sections that rely on mood/recognizability/hook data (or fall back to `profile.lastHooks` if we include that in the response). The alias + global traits already come from the `profile`/`userTraits` shape, so they can still render.

**Proposed path**

- Keep the canonical request as `(viewerUserId, placeId, targetUserId)`.
- Update `/api/profiles` so it first tries the current active-check-in query. If it finds one, return the existing structure.
- If not, query `place_profiles` for that user/place (plus `users.lastSeenAt`, `place_profiles.lastHooks`) and return `activeCheckin: null` along with `profile`, `userTraits` (if available), and a new field such as `lastSeenAt`.
- Update `OtherProfileSheet` to check `activeCheckin` before rendering each live-only section; when it’s null, show a fallback card (alias + “Anchored” copy), optionally list the last hooks (from `profile.lastHooks`), and hide the check-in timing/mood blocks.

Let me know if you’d like me to implement that contract change + UI handling.