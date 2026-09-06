# UI Design System — AWS Student Builder Group v2

> Goal: premium developer-community aesthetic. Dark-first, technical, credible.
> Principle: **one accent (AWS orange), one grid, one glow** — depth comes from
> borders, spacing, and typography, not gradients everywhere.

## 1. Tokens

| Token | Value | Usage |
|---|---|---|
| `ink` | `#0B0E11` | Page background |
| `coal` | `#0F1317` | Alt section background |
| `surface` | `#141A20` | Card background |
| `raised` | `#1A2129` | Card hover |
| `line` | `#232C36` | 1px borders (always visible, never pure black gaps) |
| `cream` | `#F5F3EE` | Headings |
| `fog` | `#A8B0BB` | Body copy |
| `faint` | `#6B7480` | Captions, mono labels |
| `brand` | `#FF9900` | CTA, active states, key highlights only |
| `brandhover` | `#E8890B` | CTA hover |

Radius: cards `16px`, pills `999px`. Shadows: `card 0 8px 30px rgba(0,0,0,.35)`,
primary CTA `0 8px 30px rgba(255,153,0,.25)`.

## 2. Typography

- **Display (hero):** `text-5xl→7xl`, `font-bold`, `tracking-tight`, `leading-[1.05]`.
  One gradient word max (`from-cream via-cream to-brand` is banned — use solid
  `text-brand` for a single word).
- **Section titles:** `text-3xl→4xl` with mono index prefix (`01`, `02`…) in
  `font-mono text-brand`.
- **Eyebrow:** `text-xs font-semibold uppercase tracking-[0.2em] text-brand`
  with a `24px` rule line before it.
- **Body:** `text-base→lg text-fog leading-relaxed`, capped at `max-w-2xl`.
- **Mono labels:** `font-mono text-xs text-faint` for paths, dates, AWS services.

## 3. Signature patterns (used across pages)

1. **Grid + fade:** `.bg-grid` with radial mask on heroes and CTA panels.
2. **Terminal card:** traffic-light dots + mono path + command lines + blinking
   cursor. Used in hero and project cards.
3. **Date block (events):** mono day/month tile instead of generic banners.
4. **Stat strip:** single bordered container with `divide-x`, not 4 loose cards.
5. **Tech marquee:** infinite mono ticker of AWS services, `aria-hidden`,
   pauses under `prefers-reduced-motion`.
6. **Journey rail:** Learn → Build → Deploy → Connect as 4 numbered steps with
   a dashed connector on desktop.
7. **Watermark footer:** giant `text-white/[0.04]` wordmark behind columns.

## 4. Component contracts

- **Button primary:** orange pill, black text, glow shadow, `hover:-translate-y-0.5`.
- **Button secondary:** `border-line` outline, brightens border to `brand/60` on hover.
- **Cards:** `rounded-2xl border-line bg-surface`, hover = `-translate-y-1` +
  `border-white/15` (+ `bg-raised` for feature cards). One glow accent per card max.
- **Avatars:** initials on gradient tile with `brand/20` ring — no external photos.
- **Progress bars:** `h-1.5` track `bg-white/10`, fill `bg-gradient-to-r from-brand to-amber-300`
  with glow dot at the tip.
- **Focus:** `2px brand outline, 3px offset` everywhere. Min touch target `44px`.

## 5. Page specs

- **Home:** Hero (copy left, terminal + floating chips right) → tech marquee →
  stat strip → About `01` (4 cards) → What We Do `02` on coal (6 cards) →
  Journey rail `03` → Upcoming `04` on coal → Join CTA.
- **Events:** heading → filter tabs (active = orange pill) → cards with date
  blocks → Past Events on muted coal cards with recap links.
- **Team:** leadership (large cards, gradient-ring avatars) → core grid →
  get-involved banner.

> Scope change (2026-09-06): Learning and Projects sections removed completely.

## 6. Motion

- Fade-up on scroll (`y 24 → 0`, `0.5s`, once, `-80px` margin), stagger ≤ `0.3s`.
- Card hover lift, button tap `scale .98` (via CSS active states).
- Hero terminal: blinking cursor + slow drift; marquee `30s linear infinite`.
- Animated counters in stat strip (requestAnimationFrame easeOutCubic).
- `prefers-reduced-motion`: all CSS loops off, counters jump to final, reveals static.

## 7. Responsive

- Hero stacks (copy first) below `lg`; terminal max `420px` centered.
- Grids: `1col → sm:2 → lg:3/4`. Marquee + stat strip scroll-safe (`overflow-x-clip`).
- Mobile nav: slide-down panel, closes on link click. Footer stacks to 1 col.
