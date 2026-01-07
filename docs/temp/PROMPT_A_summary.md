[16 tools called]

## Findings

- The profile editor hangs all three sections off a single `hasActiveCheckin` flag derived from `context?.activeCheckin`. Mood buttons, recognizability text area, and the Hooks picker each receive `disabled={!hasActiveCheckin}`, which is what currently blocks interaction when you are not checked in.

```966:1005:src/components/expanded-profile-sheet.tsx
{MOOD_OPTIONS.map((option) => (
  <button
    key={option.id}
    type="button"
    disabled={!hasActiveCheckin}
    onClick={() => setMoodValue(option.id)}
    className={cn(
      "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
      moodValue === option.id
        ? "border-white bg-white text-zinc-900"
        : "border-white/20 text-white hover:border-white/60",
      !hasActiveCheckin && "cursor-not-allowed opacity-40",
    )}
  >
    {t(locale, option.labelKey)}
  </button>
))}
<Textarea
  value={hintValue}
  maxLength={MAX_HINT_LENGTH}
  disabled={!hasActiveCheckin}
  onChange={(event) => setHintValue(event.target.value)}
  placeholder={t(locale, "profile.recognizability.placeholder")}
  className="min-h-[120px] border-white/20 bg-transparent text-base text-white placeholder:text-white/40"
/>
```

- Hooks adds the “Check in first” badge but still shares that same `disabled` prop, so the picker UI renders but is inert whenever the user lacks an active check-in.

```1016:1034:src/components/expanded-profile-sheet.tsx
{!hasActiveCheckin ? (
  <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-300">
    {t(locale, "profile.hooks.disabled")}
  </span>
) : null}
<HooksPicker
  locale={locale}
  selected={hooksValue}
  max={MAX_HOOKS}
  disabled={!hasActiveCheckin}
  onChange={setHooksValue}
/>
```

- On the write path, hooks are only saved when an active check-in exists. The hooks autosave effect bails out unless `activeCheckin` is truthy and `hasSeededHooks` is true (note that `hasSeededHooks` is set to false whenever there is no live check-in, even if the server has `placeProfile.lastHooks` data).

```197:205:src/components/expanded-profile-sheet.tsx
if (data.activeCheckin) {
  const hooks =
    data.activeCheckin.hooks ?? data.placeProfile?.lastHooks ?? []
  setHooksValue(hooks)
  setHasSeededHooks(true)
} else {
  setHooksValue([])
  setHasSeededHooks(false)
}
```

```673:720:src/components/expanded-profile-sheet.tsx
useEffect(() => {
  if (!activeCheckin) return
  if (!userId) return
  if (!hasSeededHooks) return
  const serverHooks = activeCheckin.hooks ?? []
  if (JSON.stringify(serverHooks) === JSON.stringify(hooksValue)) return
  const hookSignature = JSON.stringify(hooksValue)
  if (hookSignature === lastHooksSubmitted.current) return

  const handle = window.setTimeout(() => {
    lastHooksSubmitted.current = hookSignature
    void sendPatch<ActiveCheckinResponse>("/api/me/active-checkin", {
      userId,
      placeId,
      hooks: hooksValue,
    })
    ...
  }, AUTOSAVE_DELAY)

  return () => window.clearTimeout(handle)
}, [activeCheckin, hasSeededHooks, hooksValue, placeId, sendPatch, userId])
```

- The `/api/me/active-checkin` endpoint is the only place that currently refreshes `place_profiles.lastHooks`; it writes both the `check_ins` row and `place_profiles` whenever `hooks` are provided. Without a check-in, that route refuses the request.

```96:148:src/app/api/me/active-checkin/route.ts
if (hasHooks) {
  const parsed = parseHookListInput(body.hooks ?? null)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  nextHooks = parsed.hooks
}
...
if (nextHooks !== undefined) {
  await getOrCreatePlaceProfile(userId, placeId)
  await db
    .update(placeProfiles)
    .set({
      lastHooks: nextHooks,
      updatedAt: now,
    })
    .where(
      and(
        eq(placeProfiles.userId, userId),
        eq(placeProfiles.placeId, placeId),
      ),
    )
}
```

- We technically already have a write path that can set `place_profiles.lastHooks` without a check-in (`/api/me/place-profile` accepts `lastHooks`), but nothing in the profile editor ever calls it today, so anchored users never refresh their hooks.

```42:172:src/app/api/me/place-profile/route.ts
const hooksProvided = Object.prototype.hasOwnProperty.call(body, "lastHooks")
...
if (hooksProvided) {
  const parsed = parseHookListInput(body.lastHooks ?? null)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  nextHooks = parsed.hooks
}
...
if (nextHooks !== undefined) {
  updateData.lastHooks = nextHooks
}
```

## Proposed Plan

- **Badges for gated sections**  
  Leave the existing `disabled={!hasActiveCheckin}` logic on mood buttons and the recognizability textarea, but render the same rounded “Check in first” badge beside those headings whenever `!hasActiveCheckin`. That mirrors Hooks’ current affordance while keeping the fields read-only, satisfying requirement (a).

- **Hooks editable all the time**  
  Remove the `disabled={!hasActiveCheckin}` flag from `HooksPicker` so the control stays interactive. Keep the existing badge copy for visual messaging, but only hide it once the user is checked in. Update `seedStateFromContext` so `hooksValue` always initializes from `data.placeProfile?.lastHooks ?? []` when no check-in exists, and treat the initial seed as “complete” (set `hasSeededHooks` true after first load) so autosave can run for anchored states too.

- **Dual write-path for hooks**  
  Rework the hooks autosave effect into two branches:
  - If `hasActiveCheckin`, keep the current `/api/me/active-checkin` PATCH so check-in rows stay authoritative.
  - Otherwise, debounce and hit `/api/me/place-profile` with `{ lastHooks: hooksValue.length ? hooksValue : null }`. This will persist IDs directly into `place_profiles.lastHooks`, leveraging the existing validation. Ensure both branches still update React context so UI reflects saved hooks.
  The data we send remains the hook IDs array, so any “profile completeness” logic or downstream renderers continue to operate on IDs rather than localized labels, meeting requirement (c).

- **Future implementation step**  
  After these updates land, we’ll verify that anchored cards (`place_gallery` and `other-profile-sheet`) already consume `lastHooks`, so they will immediately benefit once users can edit hooks while not checked in.