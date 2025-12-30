[11 tools called]

Here’s what I found and the Tailwind-only tweaks I’d make:

- `PlaceCheckInDrawer` (`src/components/place-check-in-drawer.tsx`), fixed bottom CTA wrapper:  
  - Current outer wrapper: `pointer-events-none fixed inset-x-0 bottom-0 z-30 px-6 pb-6 pt-4`  
    → add a responsive horizontal clamp so the bar follows the page container (`max-w-2xl`). I’d keep the fixed shell but make its padding `px-4 sm:px-6` for parity, then wrap the inner card with `mx-auto w-full max-w-2xl`.  
  - Inner card: `pointer-events-auto rounded-3xl border ...`  
    → becomes `pointer-events-auto mx-auto w-full max-w-2xl rounded-3xl border ...`.  
  - Effect: on phones/tablets (viewport ≤ `max-w-2xl`) nothing changes, but on desktop the CTA width can’t exceed the main column and sits centered.

- `PlaceGallery` (`src/components/place-gallery.tsx`), carousel item width classes:  
  - Current item: `basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[35%] xl:basis-[28%] max-w-sm`  
  - Proposed: keep the mobile `basis-[85%] sm:basis-[60%]`, but ease the larger breakpoints to about 2× width:  
    `basis-[85%] sm:basis-[60%] md:basis-[55%] lg:basis-[50%] xl:basis-[45%] 2xl:basis-[40%] max-w-md lg:max-w-xl`.  
  - This only touches `md+` classes, so mobile layout stays identical. The added `max-w-md` / `lg:max-w-xl` bumps the absolute cap so cards don’t get stuck at 24 rem on wide screens.

Let me know if you’d like different breakpoints or a specific max width before I apply the changes.