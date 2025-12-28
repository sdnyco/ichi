# Place Gallery Step C – Shadows No Longer Clip (2025-12-28 12:46)

## What changed

- Added vertical padding (`py-4`) to the carousel content track so each card’s drop shadow now falls within the viewport instead of being cut off by the Embla wrapper.

## Why

- The viewport still clamps horizontal overflow for the full-bleed effect, but the extra top/bottom breathing room prevents the shadow from being clipped without introducing any scrollbars or altering the existing carousel behavior.

## Follow-ups

- None for this step; future layout work (e.g., bleed tweaks) should retain the vertical padding to keep shadows intact.

