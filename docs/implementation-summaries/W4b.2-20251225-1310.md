# W4b.2 — Expanded Profile UX Refinements
Date: 2025-12-25  
Run: W4b.2-20251225-1310

## Goal
Polish the overlay experience without touching business logic: tighter navigation, clearer save state, and more legible check-in timing.

## Implemented
- **Global top bar:** merged the Back control into the fixed save-status bar (`SaveStatusBar`). The left side now shows “← Back” (closes the overlay), while the center continues to reflect autosave state.
- **Check-in status readability:** the status block now formats remaining time in hours whenever ≥60 minutes (e.g. `178m` → `2h`). This uses display-only logic; autosave + timers untouched.
- **Copy updates:** added new locale strings for the global back label and the refined status sentence in both `en-US` and `de-DE`.

## Files Touched
- `src/components/profile/save-status-bar.tsx`
- `src/components/expanded-profile-sheet.tsx`
- `src/locales/en-US.json`, `src/locales/de-DE.json`

## Follow-ups
- “Check out” button remains disabled until backend support lands (tracked separately).
- Hook/session consolidation still pending (planned for later W4b iteration).

