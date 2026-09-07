# UI Design System — AWS Student Builder Group v3

> v3 (2026-09-06): rebuilt under Anthropic's frontend-design skill. The v2 look
> was rejected as templated, so v3 removes the generic tells: single-word headline
> accents, tracked all-caps eyebrows, numbered markers on non-sequences, fade-up on
> every section, identical card hovers, middle-dot meta, mono spray, arrows on every
> link. Voice: IBM Plex Sans + Plex Mono. Boldness lives in ONE place (the hero
> deploy-log terminal, played once on load); everything else is a quiet ruled,
> left-aligned editorial system. Numbers survive only on the Journey rail, which is
> a true sequence.

> Goal: premium developer-community aesthetic. Dark-first, technical, credible.
> Principle: **one accent (Electric Violet #AD5CFF from logo), one grid, one glow** — depth comes from
> borders, spacing, glassmorphism, and typography.

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
| `brand` | `#AD5CFF` | Primary brand accent, active states, key highlights (sampled from `logo.png`) |
| `brandhover` | `#C084FC` | CTA hover |
| `brandpressed` | `#9333EE` | CTA pressed / deep violet accent |

Radius: cards `16px`, pills `999px`. Shadows: `card 0 8px 30px rgba(0,0,0,.35)`,
primary CTA `0 2px 18px rgba(173,92,255,.35)`.

## 2. Typography

- **Display (hero):** `text-5xl→7xl`, `font-bold`, `tracking-tight`, `leading-[1.05]`.
  Solid `text-brand` for single highlighted accent word.
- **Section titles:** `text-3xl→4xl` with mono index prefix (`01`, `02`…) in
  `font-mono text-brand`.
- **Eyebrow:** `text-xs font-semibold uppercase tracking-[0.2em] text-brand`
  with a `24px` rule line before it.
- **Body:** `text-base→lg text-fog leading-relaxed`, capped at `max-w-2xl`.
- **Mono labels:** `font-mono text-xs text-faint` for paths, dates, AWS services.

## 3. Signature patterns (used across pages)

1. **Grid + fade:** `.bg-grid` with radial mask on heroes and CTA panels.
2. **Terminal card:** traffic-light dots + mono path + command lines + blinking
   cursor. Used in hero.
3. **Date block (events):** mono day/month tile instead of generic banners.
4. **Stat strip:** single bordered container with `divide-x`, not 4 loose cards.
5. **Tech marquee:** infinite mono ticker of AWS services, `aria-hidden`,
   pauses under `prefers-reduced-motion`.
6. **Journey rail:** Learn → Build → Deploy → Connect as 4 numbered steps with
   a dashed connector on desktop.
7. **Watermark footer:** giant `text-white/[0.04]` wordmark behind columns.
8. **Scrollspy Navbar:** floating pill navigation with mutually exclusive active
   tracking (Home vs About) and smooth animated layout pill.

## 4. Component contracts

- **Button primary:** purple gradient pill (`from-brand to-[#9333ea]`), crisp white text, violet glow shadow, hover brightness lift.
- **Button secondary:** `border-line` outline, brightens border to `brand/50` + `bg-brand/5` on hover.
- **Navbar:** Sticky frosted glass (`backdrop-blur-md/xl`), floating center links pill with active spring pill indicator (`bg-brand/20 border-brand/45 shadow-[0_0_14px_rgba(173,92,255,0.3)]`), live Community Day indicator badge with pulsing ping dot, and gradient Join CTA.
- **Cards:** `rounded-2xl border-line bg-surface`, hover = `-translate-y-1` +
  `border-white/15` (+ `bg-raised` for feature cards). One glow accent per card max.
- **Avatars:** initials on gradient tile with `brand/20` ring — no external photos.
- **Progress bars:** `h-0.5` track, fill `bg-gradient-to-r from-[#ad5cff] via-[#c084fc] to-[#e879f9]`
  with purple glow.
- **Focus:** `2px brand outline, 3px offset` everywhere. Min touch target `44px`.

## 5. Page specs

- **Home (clean):** Hero → stat strip → About → Upcoming → Join CTA.
  Formats index, Journey rail, tech marquee, and hero promo line removed as
  redundant; dead components (Journey, TechMarquee, FeatureCard, StatCard)
  deleted. Modal is kept — it backs the Community Day register dialog.
- **Events:** heading → filter tabs (active = purple pill) → cards with date
  blocks → Past Events on muted coal cards with recap links.
- **Team:** leadership (large cards, gradient-ring avatars) → core grid →
  get-involved banner.

> Scope changes (2026-09-06): Learning and Projects sections removed. GitHub links removed; WhatsApp channel, Instagram, and college email active.

## 6. Motion

- Fade-up on scroll (`y 24 → 0`, `0.5s`, once, `-80px` margin), stagger ≤ `0.3s`.
- Card hover lift, button tap `scale .98` (via CSS active states).
- Hero terminal: blinking cursor + slow drift; marquee `30s linear infinite`.
- Animated counters in stat strip (requestAnimationFrame easeOutCubic).
- `prefers-reduced-motion`: all CSS loops off, counters jump to final, reveals static.

## 7. Responsive

- Hero stacks (copy first) below `lg`; terminal max `420px` centered.
- Grids: `1col → sm:2 → lg:3/4`. Marquee + stat strip scroll-safe (`overflow-x-clip`).
- Mobile nav: slide-down panel with clean dividers and active purple indicators, closes on link click. Footer stacks to 1 col.
