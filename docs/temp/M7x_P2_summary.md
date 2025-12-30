**Investigation**

1. The “checked in … ago” string is built inside `src/components/profile/other-profile-sheet.tsx` in the `statusText` computation. When `activeCheckin` is present it always calls:

```ts
t(locale, "profile.checkin.status", {
  place: placeName,
  agoFormatted: formatDurationToken(startedMinutes),
  remainingFormatted: formatDurationToken(remainingMinutes),
})
```

2. `startedMinutes`/`remainingMinutes` are derived from `data.activeCheckin`, which comes from the `/api/profiles` response for the **target** user (the selected card). So the timing is correct, but the localized string hardcodes the pronoun “You checked into {place} …” (`profile.checkin.status` in both en/de locales). There’s no conditional branch for whether `targetUserId === viewerUserId`.

3. Representation:
   - `viewerUserId` is stored separately in the component.
   - `targetUserId` exists, but the status copy ignores both and always renders the “You…” variant, even when viewing someone else.

**Plan**

- Keep the timing logic as is (since it already uses the target user’s timestamps).
- Add a simple check (`targetUserId === viewerUserId`) before rendering the status:
  - If it’s the viewer’s own profile, reuse the existing “You checked in…” string.
  - Otherwise use a new locale key (or reuse the same key with placeholders) for “Checked in …” or “They checked in …” to avoid second-person phrasing.
- Minimal change: introduce `profile.checkin.statusOther` (copy like “Checked into {place} …”) and choose based on the comparison.

Let me know if you’d like me to implement that conditional copy tweak.