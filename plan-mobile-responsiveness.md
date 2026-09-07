# Mobile Responsiveness Plan — AWS SBG Site

> Target devices: 360px phones → 390px large phones → 768px tablets → 1024px+ desktop.
> Rule: design mobile layouts intentionally — never just shrink desktop.

## 0. Audit snapshot (2026-09-06)

What's already safe: mobile-first grids (`grid` → `sm:` → `lg:`), `truncate` + `break-words` +
`[overflow-wrap:anywhere]` on long strings, 44px targets on nav/CTA/links, bottom-sheet
modal on small screens, `overflow-x-clip` on body.

Watch list (verify each while implementing):
1. Countdown `grid-cols-4` at 360px (~80px/cell — tight but OK; confirm numerals fit).
2. Event date rows + long venue strings on 360px.
3. Filter tabs row — must wrap, never force horizontal scroll.
4. Terminal hero `max-w-[480px]` centered full-width on mobile.
5. Drawer menu + sticky navbar at 360px (brand text truncates gracefully).
6. Footer 3-col → 1-col stack order (brand first).

## 1. Breakpoint contract

| Width | Layout |
|---|---|
| <640px | 1 column everywhere; full-width CTAs (`flex-col` button stacks); section padding `py-12`, container `px-5`; hero type `text-4xl/5xl` max |
| 640–1023px | 2-col grids where content allows; drawer nav still on <1024px (`lg:hidden` breakpoint) |
| ≥1024px | Full multi-col grids, side-by-side hero, desktop nav |

## 2. Per-area fixes

- **Navbar:** drawer full-width slide-down, links 48px rows, Join CTA full-width, closes on
  link/Escape; brand sub-line truncates (`truncate`, `min-w-0`).
- **Hero:** copy first, terminal second (`max-w-[480px] mx-auto`); mono log lines `break-all`;
  CTA stack vertical; proof bullets wrap.
- **Stats:** 2-col ruled strip on mobile, 4-col on `lg`; tabular numerals.
- **Events:** tabs `flex-wrap`; cards 1-col; date block shrinks (`w-12`); register/details
  links keep 44px height; empty state centered.
- **Countdown:** keep 4 cells; reduce numeral size below 380px if needed (`text-2xl` → check).
- **Team:** rows stack (avatar + text, no side squeeze); social buttons stay 44px.
- **Community Day page:** hero grid stacks; agenda/perks 1-col; venue + map buttons stack;
  register modal becomes bottom sheet (already: `items-end sm:items-center`).
- **Footer:** 1-col stack; bottom bar stacks centered.
- **Global:** no `w-[Npx]` fixed widths on mobile; images `max-w-full`; tables (if any) become
  stacked rows — never horizontal scroll.

## 3. Touch + a11y on mobile

- All interactive elements ≥44px; 8px+ spacing between adjacent targets.
- Visible focus rings (already global); drawer traps nothing — Escape + link-tap close.
- `prefers-reduced-motion` respected (hero static, no stagger, no marquee).
- Tap highlights: avoid gray flash (`-webkit-tap-highlight-color: transparent` if needed).

## 4. Verification (do this, in order)

1. `npm run build` green.
2. Chrome DevTools device toolbar: 360×740, 390×844, 768×1024, 1280×800.
3. On each: scroll every page top→bottom; check no `overflow-x` via
   `document.documentElement.scrollWidth <= window.innerWidth` in console.
4. Tap every button/link (real touch or emulation): reachable, ≥44px, visible feedback.
5. Rotate to landscape on phone widths; open drawer; submit register modal; toggle filters.
6. Lighthouse mobile on `/` and `/events`: Performance ≥90, Accessibility 100, Best Practices 100.

## 5. Acceptance checklist

- [ ] No horizontal scroll on any page at 360px, 390px, 768px
- [ ] Navbar drawer works; brand never overflows; sticky bar stays 56px
- [ ] Hero readable without zoom; terminal fully visible; CTAs full-width stacked
- [ ] All grids collapse intentionally (no 2-col squeeze at 360px)
- [ ] Countdown, date blocks, tabs wrap or fit at 360px
- [ ] Modal usable as bottom sheet; form fields zoom-free (`text-base` inputs on iOS)
- [ ] Lighthouse mobile thresholds met (see §4.6)
