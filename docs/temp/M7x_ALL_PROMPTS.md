
Investigate-first cleanup: remove dead “Check out” on self card.

Observed:
- “Check out” button on self card doesn’t do anything and never has.
- For MVP, we prefer removing it rather than wiring checkout semantics.

Task:
1) Confirm where the button is rendered and whether any code depends on its existence.
2) Confirm no backend route expects it.

Report back BEFORE implementing:
- Location(s) of rendering
- Any dependencies/side effects

Then implement:
3) Remove it cleanly (UI + any unused handlers).

Constraints:
- Add implementation summary.
- If you have questions or concerns, please ask before implementation.
