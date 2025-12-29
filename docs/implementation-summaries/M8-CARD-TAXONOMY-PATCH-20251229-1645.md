# M8 — Card Taxonomy Follow-up (Implementation Summary)
Date: 2025-12-29
Run: M8-CARD-TAXONOMY-PATCH-20251229-1645

## Goal
Tighten the initial M8 drop by aligning TypeScript with runtime mood nullability and clarifying the presentational CTA semantics on the self-card notice.

## Implemented
- Allowed `PlaceGalleryEntry.mood` to be `string | null`, reflecting the self-card fallback path when the viewer has no active check-in, while keeping hooks nullable.
- Updated the self-card warning CTA to use a semantic `<span>` so the entire card remains the only interactive surface but the inline button styling no longer implies a nested actionable element.

## Files Added / Updated
- Updated: `src/db/queries/places.ts`
- Updated: `src/components/place-gallery.tsx`
- Added: `docs/implementation-summaries/M8-CARD-TAXONOMY-PATCH-20251229-1645.md`

## Known Issues / Follow-ups
- Hook persistence for anchored cards still requires a write-path update.
- CTA text remains hard-coded in English; localization can follow once the copy is finalized.

