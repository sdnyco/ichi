Investigate-first: Profile editor inputs disabled state + “Check in first” explanation.

Context / desired behavior (MVP):
- When NOT checked in:
  - Mood: disabled + show small “Check in first” badge (same style as Hooks currently has)
  - Recognizability: disabled + show small “Check in first” badge
  - Hooks: SHOULD remain editable (no check-in required)
- When checked in:
  - all editable as today

Hunch:
- Current disable gating is likely shared across all three fields (mood/recognizability/hooks), and Hooks currently has an extra badge but still disabled.

Tasks:
1) INVESTIGATE:
   - Where the editor decides “disabled when not checked in” for Mood/Hooks/Recognizability.
   - Whether Hooks currently blocks editing via a shared `disabled` prop or check-in guard.
   - Whether we already persist any “last hooks” concept (e.g. place_profiles.lastHooks) on the write path.

2) REPORT BACK (before changing behavior):
   - Exact code locations and the current logic that disables each field.
   - Proposed minimal change plan to:
     a) keep Mood + Recognizability disabled (with badge)
     b) make Hooks editable even when not checked in
     c) persist selected hook IDs to place_profiles.lastHooks on save/change (so we can later display hooks for anchored users)

3) AFTER confirmation in the report, implement the fix:
   - Hooks editable while not checked in
   - Badges added to Mood + Recognizability when disabled
   - Write-path persists hooks to place_profiles.lastHooks
   - Ensure existing “profile completeness” logic still keys off underlying hook IDs (not translated labels)

Finish by writing an implementation summary in docs/implementation-summaries/.
If you have questions or concerns, please ask before implementation.
