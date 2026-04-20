# Mobile UX Audit — Irrigation App
**Date:** 2026-04-17
**Files changed:** 10 of 14 source files

---

## Nav.jsx

**Issues found:**
- Single horizontal scrolling nav on all screen sizes. On 390px mobile this is awkward — 6 items, overflow-x-auto, requires horizontal swipe to reach items.
- Nav link icons were 13px and labels were `text-xs` — too small to tap reliably.
- No bottom tab bar pattern.

**Changes made:**
- Added `hidden md:flex` top nav that only appears on desktop (unchanged appearance).
- Added a slim mobile-only top bar (`md:hidden`) showing just the app name.
- Added a `fixed bottom-0` bottom tab bar (`md:hidden`) with 6 tabs — each tab is `flex-1` so all 6 share equal width across the screen. Icons bumped to 20px, labels to `text-[10px]`.
- Active tab gets `bg-blue-700` highlight with white text.

---

## App.jsx

**Issues found:**
- `<main>` had no bottom padding — on mobile, the fixed bottom tab bar (h-16 = 64px) would overlap the bottom of all page content.

**Changes made:**
- Added `pb-16 md:pb-0` to `<main>` so page content scrolls clear of the bottom nav on mobile and is unchanged on desktop.

---

## Controllers.jsx

**Issues found:**
- Form inputs: `py-2` only (~36px height) — below Apple/Google's 44px minimum tap target.
- Save/Cancel buttons: side-by-side with no full-width option, small on narrow screens.
- `autoFocus` removed — triggers soft keyboard immediately on mobile, which is disruptive.
- Add button: fixed small size, no `min-h`.
- Edit/Delete icon buttons: `p-2` only — tappable area ~37px square.

**Changes made:**
- All inputs/selects: added `py-2.5 min-h-[44px]`.
- All inputs: added `inputMode="text"` for correct virtual keyboard.
- Save/Cancel: `flex-col sm:flex-row` + `w-full sm:w-auto` — stacked full-width on mobile, side-by-side on sm+.
- Add button: `py-2.5 min-h-[44px]`.
- Edit/Delete buttons: `p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center`.
- All buttons: `touch-manipulation` to prevent 300ms tap delay.
- Removed `autoFocus` from name inputs.
- Changed `p-4` to explicit `px-4 py-4` on page wrapper for consistent padding.

---

## ValveBoxes.jsx

Same pattern as Controllers.jsx — identical changes applied:
- Input `min-h-[44px]`, `py-2.5`, `inputMode="text"`.
- Save/Cancel buttons full-width on mobile.
- Edit/Delete buttons enlarged to 44x44px tap targets.
- `touch-manipulation` on all buttons.
- Removed `autoFocus`.

---

## ConnectionBoxes.jsx

Same pattern as Controllers.jsx — identical changes applied.
- Also shortened the Add button label to "Add Conn. Box" to avoid overflow on very narrow screens (320px).

---

## Valves.jsx

**Issues found:**
- Same form/button issues as above pages.
- `ValveCard` had `ml-4` indent which eats 16px from already-narrow mobile screens.
- Collapse/expand row buttons were too small (`py-2`).

**Changes made:**
- All form inputs/selects: `min-h-[44px]`, `py-2.5`.
- Save/Cancel: full-width on mobile.
- All action buttons: 44x44px tap targets.
- Controller group header buttons: `py-2.5 min-h-[44px]`.
- `ValveCard` indent: `ml-2 sm:ml-4` (halved on mobile).
- `touch-manipulation` on all interactive elements.
- Removed `autoFocus`.

---

## WateringHeads.jsx

Same pattern as Valves.jsx — identical changes applied:
- Form inputs/selects: `min-h-[44px]`, `py-2.5`.
- Save/Cancel: full-width on mobile.
- Edit/Delete buttons: 44x44px.
- Valve group header buttons: `py-2.5 min-h-[44px]`.
- `HeadCard` indent: `ml-2 sm:ml-4`.
- `touch-manipulation` on all buttons.
- Removed `autoFocus`.

---

## MapView.jsx

**Issues found:**
- Sidebar (`w-64`, 256px) starts open by default — on a 390px screen this blocks 66% of the map immediately.
- Sidebar had a tiny tab toggle button on its right edge — `p-1.5`, only ~28px — nearly untappable on mobile.
- Filter selects used `p-2` (below 44px).
- Clear filter link was `text-xs` — small tap target.
- No way to quickly dismiss the sidebar on mobile — only the tiny tab button.
- Sidebar width was 256px on all screens — too narrow for comfortable mobile use.

**Changes made:**
- Sidebar defaults to **closed** on mobile (`window.innerWidth < 768`), open on desktop — map is immediately visible.
- Added a dark backdrop overlay (`bg-black/30`) behind sidebar on mobile; tapping it closes the sidebar.
- Added an X close button inside the sidebar header, visible only on mobile.
- When a filter is applied on mobile, sidebar auto-closes so you can see the map result.
- Sidebar width: `w-72 md:w-64` (288px on mobile for better thumb reach, 256px on desktop).
- Sidebar toggle tab: `hidden md:flex` — only shown on desktop where the subtle edge tab makes sense.
- Filter selects: `min-h-[44px]`, `py-2.5`.
- "Open filter" button (shown when sidebar is closed): replaced the tiny `<ChevronRight>` with a proper `px-3 py-2 min-h-[44px]` button labeled "Filter" with a blue dot indicator when a filter is active.
- Clear filter: bumped from `text-xs` to `text-sm`, added `min-h-[36px]`.
- `touch-manipulation` on all interactive elements.

---

## LocationPicker.jsx

**Issues found:**
- Map height was hardcoded at `height: 300` via inline style — fine on desktop but wastes vertical space on short mobile screens when the keyboard is also open.
- Coordinate display text was `text-xs` — hard to read.
- No way to clear a placed pin without editing the lat/lng fields directly.

**Changes made:**
- Map height: `clamp(220px, 40vw, 300px)` — scales proportionally on narrow screens, caps at 300px on wide.
- Coordinate text: `text-xs` → `text-sm`.
- "Click the map" hint updated to "Tap the map" for mobile phrasing.
- Added a "Remove pin" button (shown only when a pin is placed) for easy pin clearing on mobile.

---

## ConfirmDialog.jsx

**Issues found:**
- Dialog was `items-center justify-center` on all screens — fine on desktop, but on mobile with keyboard open it can clip behind the keyboard.
- Cancel/Delete buttons were `px-4 py-2` — ~36px height, below 44px minimum.
- Buttons were right-aligned only, requiring precise tapping in top-right area.

**Changes made:**
- Dialog alignment: `items-end sm:items-center` — slides up from the bottom on mobile like a sheet (more natural), centered modal on sm+.
- Buttons: `py-3 min-h-[48px]` — generous tap target.
- Button layout: `flex-col-reverse sm:flex-row` + `w-full sm:w-auto` — stacked full-width on mobile (Delete on top, Cancel below, matching natural "confirm" pattern), row on sm+.
- `touch-manipulation` on both buttons.
- `rounded-xl` (slightly more rounded) to match the sheet-from-bottom aesthetic.

---

## Toast.jsx

**Issues found:**
- Toast was positioned `bottom-4 right-4` — overlaps the bottom tab bar on mobile.
- Container had no max-width — on narrow screens a long message could overflow.

**Changes made:**
- Position: `bottom-20 right-2 md:bottom-4 md:right-4` — clears the 64px bottom tab bar on mobile (20 = 80px), uses right-2 to avoid edge clipping on narrow screens.
- Added `max-w-[calc(100vw-1rem)]` to prevent overflow on 390px screens.
- Fixed a minor bug: `{message}` in the span was referencing the outer variable, changed to `{toast.message}`.
- Toast dismiss button: `min-h-[32px] min-w-[32px]` with `flex items-center justify-center` for easier tap.

---

## index.css

**Changes made:**
- Added `.safe-area-pb` utility class using `env(safe-area-inset-bottom)` for the bottom tab bar on iPhones with home indicator.
- Added `touch-action: manipulation` globally on `button, a, select, input, textarea` — eliminates the 300ms tap delay on iOS without needing to set it on every element individually.
- Added `@supports` block to apply safe-area padding to the fixed bottom nav.
- Added `button { min-height: 44px }` as a baseline fallback (belt-and-suspenders alongside the explicit Tailwind classes).

---

## Summary of Mobile UX Improvements

| Area | Before | After |
|------|--------|-------|
| Navigation | Horizontal scroll tab bar, all screens | Bottom tab bar on mobile, top bar on desktop |
| Tap targets | ~36px buttons/inputs throughout | 44px minimum enforced via `min-h-[44px]` |
| Form buttons | Side-by-side only | Stacked full-width on mobile, row on sm+ |
| Map sidebar | Opens full on all screens, tiny toggle tab | Closed by default on mobile, wide enough for thumbs, dismissible by tap or X button |
| Confirm dialog | Centered overlay, small buttons | Bottom sheet on mobile, full-width buttons |
| Toast position | Bottom-right, overlaps bottom nav | Elevated above bottom nav on mobile |
| LocationPicker | Fixed 300px height, text-xs coords | Responsive clamp height, text-sm, "Remove pin" button |
| Touch delay | 300ms delay on iOS | Eliminated via `touch-action: manipulation` |
| Safe area | None | iOS home indicator handled via `env(safe-area-inset-bottom)` |
| Indent in cards | ml-4 on mobile (16px wasted) | ml-2 on mobile, ml-4 on sm+ |

All changes use responsive Tailwind classes — desktop appearance is preserved exactly.
