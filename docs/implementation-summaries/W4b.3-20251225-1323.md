# W4b.3 — Hooks Consolidation (Session Details)
Date: 2025-12-25  
Run: W4b.3-20251225-1323

## Goal
Visually nest the Hooks UI inside the existing Session Details container so that all check-in scoped inputs sit together, without altering any behavior or APIs.

## Implemented
- Moved the entire Hooks heading + picker into the same bordered block that already contains Mood and Recognizability Hint.
- Retained all existing autosave hooks, limits, categories, and disabled states; only DOM structure and spacing changed.
- Global/basic sections remain untouched, preserving the dashed divider that separates ephemeral vs. persistent fields.

## Files
- `src/components/expanded-profile-sheet.tsx`

## Notes
- No copy, API, or logic changes were introduced. Hooks still autosave via the same PATCH call and respect the existing max selection cap.

