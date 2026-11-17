# Skillverse — Global Context & Rules
**Read this file first. Every other doc in `/docs` assumes you've read this one.**

Status: Living document. Last updated: 2026-10-28 (Dark Mode + `10-guardian-dashboard.md` added).

---

## 0. How this doc set works

This is not one spec file — it's a set of per-module "context + rules" docs, written so a
coding agent (human or AI, this session or a brand new one) can open **one file**, understand
the part it governs with zero other context, and build or extend it correctly.

Files (current, final doc split — this list replaced an earlier draft plan that grouped things
differently; keep this one updated as new docs are written, since it's the first thing read):
- `00-global-context-and-rules.md` — this file. Cross-cutting rules, design system, tech stack,
  glossary, honesty rules. **Authoritative over every other doc.** If a module doc ever seems to
  contradict this one, this one wins unless the module doc explicitly says "override: global rule
  X doesn't apply here, because Y."
- `00a-visual-assets-and-style-guide.md` — cross-cutting visual content shared by 2+ docs (asset
  strategy, icon conventions, companion theme-accessory badges).
- `00b-getting-started-and-build-order.md` — added after a full cross-doc consistency pass: where
  to actually start, the end-to-end build order across all 11 modules, and the one consolidated
  human action-items checklist (read this before starting real implementation work).
- `01-auth-and-account.md` — signup/login, sessions, consent capture (built as a real NestJS +
  SQLite backend, not mock).
- `02-child-profile-and-personalization.md` — the child profile, the 12-question personalization
  questionnaire, and Tutorial Island's sequencing.
- `03-companion-system.md` — picking, naming, unlocking, and the behavior of the companion.
- `04-theme-system.md` — the 3 real themes (Space/Ocean/Jungle), the switching architecture, and
  Dark Mode (an orthogonal Light/Dark toggle on top of all 3 themes).
- `05-hub-shell.md` — the Hub itself, routing/auth-guard architecture, the Journey Line rituals.
- `06-skill-world-template-and-catalog.md` — the shape every Skill World follows + the catalog of
  all 9 worlds' content (3 fully designed, 6 light placeholders).
- `07-mini-games.md` — the shared `MiniGameShell` engine and the exact technical build (round
  counts, scoring, full content banks) of the 3 Arcade games `06` names.
- `08-adaptive-difficulty.md` — the Just-Right Zone difficulty engine.
- `09-rewards-and-economy.md` — the real Stars/Coins economy, the child Avatar, the cosmetics
  shop, Collectibles, real quest/session rewards, and the real Win Gallery.
- `10-guardian-dashboard.md` — the parent-gate, the Mission Report, real-life quest authoring
  (Quest Control), Theme & Profile Control, Screen-Time & Boundaries, and the Consent Center.
- `11-data-model-and-backend-roadmap.md` — the full consolidated schema, API surface map, env
  vars, local dev/proxy setup, and the session-resume runbook.

**Rule for working on any single part:** read `00` (+ `00a` if your task touches shared visuals,
+ `00b` if this is a fresh start or you need the cross-module build order/human checklist) + the
one module doc you're touching. You do not need to read every other module doc unless your task
crosses boundaries (e.g., building a Skill World game that awards XP touches both `06` and `09`).

**Rule for finishing any session of work:** update the "Current Status" section of whichever
module doc(s) you touched, before ending the session. This doc set is only useful if it stays
true. A stale status section is worse than no doc at all.

---

## 1. What Skillverse is

**One-line idea:** A single gamified world where children play skill-building games themed to
their interests, run their day through a gamified time & task manager, and quietly learn the
life skills they struggle with most — wrapped in one gentle, unified adventure.

**Audience:** Children and teens (6–17) with ADHD, autism, and Down syndrome, plus their
guardians, and eventually therapists/teachers.

**Core experience loop:** Explore → Play → Learn → Regulate → Win.

**Who it's for:**

| User | Role | What they want |
|---|---|---|
| Child (primary) | Plays the world | Fun, feeling powerful, being the hero — not being "managed" |
| Guardian (secondary, the customer) | Sets up the day, pays | Peace at home, visible progress, trustworthy tool |
| Therapist/Teacher (later phase) | Prescribes practice | A tool that reinforces their goals and reports progress |
| Sibling (bonus) | Plays too | Not left out — family co-op |

**Key principle:** The child is the user; the guardian is the customer. Sell to the adults,
delight the child. Every UI decision should be checked against: would a 6–17 year old with
attention/sensory/communication differences find this calm, clear, and winnable?

---

## 2. The 10 Design Commandments (locked — do not reword)

1. **The child is the hero, never the problem.** No "fixing." Skills are powers the hero unlocks.
2. **Skills over labels.** The child's screen never shows a diagnosis. Personalization happens
   through profile preferences and observed needs, never diagnostic badges. No diagnosis
   automatically assigns a child to a fixed game path.
3. **Calm by default.** Low stimulation is the baseline; stimulation is opt-in. No flashing, no
   autoplay, adjustable everything.
4. **Failure is gentle.** No broken streaks, no lost progress, no harsh "FAIL" screens. Hints,
   encouragement, easier retries instead. A bad day costs nothing.
5. **One world, one economy.** Games, tasks, stories, and family quests all feed the same
   coins/XP/stars/pet system. Nothing is siloed.
6. **Dual interface.** Kids see a game world; guardians see a dashboard. Both feel in control.
7. **Short sessions, tiny wins.** Every activity is 3–10 minutes. A win happens every session.
8. **The Just-Right Zone.** Difficulty auto-adapts so every child is challenged enough to grow,
   but never pushed into overwhelm — and eases back when the child struggles.
9. **Play anywhere, learn everywhere.** In-app skills map to real-life quests.
10. **Safety & privacy by design.** Verified guardian consent, no child tracking/advertising, no
    minor data without permission. A feature, not paperwork.

## 3. The Core Support Loop (every game/activity follows this)

1. **Identify the difficulty** the child actually has (e.g., trouble starting homework).
2. **Practice safely in a game** — predictable, low-stakes.
3. **Adapt the challenge** — based on performance and regulation state (see `04`).
4. **Transfer to real life** — a real-world quest mirrors the in-game skill.
5. **Measure meaningful progress** — observable patterns (independent starts, prompts needed,
   focus duration), never diagnostic scores.
6. **Celebrate growth** — effort, strategy use, independence, real-life progress.

A game that only tests whether a child can do something, without teaching a strategy, adapting,
transferring, or celebrating, is not a Skillverse game yet — it's a draft.

---

## 4. The honesty rule (critical — applies to code, docs, and anything said about this project)

This rule governs this build exactly as strictly as it governs the IEEE papers and any LinkedIn
posts about this project: **never describe Skillverse as more finished, more tested, or more
real than it actually is.**

Concretely, for this codebase:
- Never write comments, READMEs, UI copy, or commit messages that claim a feature works if it's
  mocked, stubbed, or partially built. Say what's real.
- Never claim data persists if it's in-memory or a static TS file.
- Never claim "tested with children" or "validated by clinicians" anywhere in the app or docs —
  that hasn't happened. If placeholder copy needs a trust-building line, use honest
  future-tense framing ("designed with child-development best practices in mind"), not
  false-past-tense claims.
- Every module doc's "Current Status" section is the single source of truth for what's real.
  If you're unsure whether something is built, check the status section — don't assume the
  master spec describes reality.
- **Game/quest sessions must never claim a reward wasn't actually persisted.** This came up
  concretely while designing `06`'s Arcade games, before `09-rewards-and-economy.md` existed: a
  session could honestly say "you got 5 of 6 right," but couldn't yet say "you earned 3 stars,"
  since nothing existed to actually award or persist that currency. Now that `09` exists, real
  stars/coins genuinely are awarded and shown — the rule going forward is the general one: a
  reward claim must always be backed by something that's actually persisted, whichever phase this
  project is in. This is a stricter line than other ephemeral interactions in this app (like the
  Journey Line's local-only "launched" state, which never claimed to be more than a feeling) —
  stars/coins explicitly imply permanent progress, so faking that would be a more serious
  violation than a feeling-only interaction resetting on reload.
- When presenting this project (demo, portfolio, college submission, LinkedIn), the same rule
  applies: describe it as "in active development," not "launched" or "complete."

---

## 5. Tech stack — three tiers, not two (corrected during a full cross-doc audit — the original
two-tier framing below had gone stale and briefly contradicted itself)

**A real contradiction existed here and is now fixed:** this section used to describe only a
"current phase" (frontend shell, no backend) and a far-off "target phase" (Postgres/Redis/
WebSocket/Docker) — but §11 below already resolved "backend migration timing" as *"a real backend
was started immediately"*, and `01`–`11` go on to fully specify a real NestJS+SQLite backend as
the immediate build target, not something deferred indefinitely. The two-tier table made it look
like that real backend was the same distant thing as Postgres/Redis/Docker, which it isn't. Three
tiers, not two:

### Tier 1 — what's literally running in the code today (verified against the actual filesystem)
| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline` tokens in `globals.css`) |
| Animation | Framer Motion + CSS keyframes |
| Icons | lucide-react |
| Data | Static TypeScript objects in `src/lib/data.ts` — no database, no API, no auth. `skillverse-backend/` does not exist yet, confirmed by listing the real filesystem (`11` §2) |
| Hosting (dev) | `next dev`, bound to `0.0.0.0` for live preview |

### Tier 2 — the real backend `01`–`11` already specify, and the actual next thing to build
**Not a "later" phase — this is the immediate build target**, already fully designed across every
module doc, consolidated in `11-data-model-and-backend-roadmap.md`.

| Layer | Technology |
|---|---|
| Backend language/framework | Node.js + TypeScript, NestJS (modular monolith, not microservices) |
| API | REST, versioned under `/api/v1/*`, port `4000` (`11` §5.2) |
| Database | SQLite via Prisma (file-based, Postgres-portable schema — `01` §4.1) |
| Auth | Real JWT access token + opaque hashed refresh token (`01` §4.2) — no role system; guardian/child share one session by design |
| Email | Resend (transactional verification/reset emails only) |

### Tier 3 — genuine target phase, later, per Master Spec §21–24 (not built, not actively planned)
Documented so nothing built in Tier 2 needs a rewrite if this phase ever starts. See `11` §7 for
brief migration notes.

| Layer | Technology |
|---|---|
| Real-time | WebSocket + Socket.IO (child ↔ guardian live updates) — Tier 2 uses polling/refetch instead, see `10` §3.2 |
| Database | PostgreSQL (Tier 2's SQLite schema is already written to port cleanly) |
| Cache/jobs | Redis + BullMQ |
| Role system | `GUARDIAN, CHILD, THERAPIST, TEACHER, ADMIN` — Tier 2 has no role field at all |
| File storage | AWS S3 |
| Deployment | Docker + AWS |
| Docs/testing/monitoring | Swagger, Jest + Supertest, Sentry + CloudWatch |

**Migration principle (updated — this used to only talk about `data.ts`, which undersold how far
Tier 2 already goes):** `src/lib/data.ts`'s mock shapes should stay close to Tier 2's real Prisma
models so that, module by module, swapping a mock import for a real `fetch()` call is additive,
not a rewrite — this is already exactly how `01`–`11` were each written (every module doc includes
a real schema addition, not just a shape sketch). The handful of modules not yet touched by a real
backend call at any point (`06`'s catalog, `07`'s games before `08`/`09` wire in) are intentionally
pure frontend/constants, not an oversight — see each doc's own §4 for which is which.

---

## 6. Design system (Calm Adventure)

### 6.1 Style direction
"Soft 3D Adventure + Calm UI + Interactive World Map": spacious layouts, rounded cards/buttons,
large tap targets, soft gradients (not neon), friendly illustrations, simple icons + short text,
consistent nav, limited choices per screen, clear feedback after every action. It should feel
like a game world, not a medical or educational app.

### 6.2 Color tokens (already implemented in `src/app/globals.css`)

**Important update since this table was first written: 7 of these 13 tokens are now
theme-variable, not fixed.** `04-theme-system.md` introduced Ocean and Jungle alongside the
original Space values below — the values shown here are the **Space/Light** values only. The
token *names* stay constant and are safe to treat as locked; their *values* change per active
theme for everything except the 6 functional tokens marked below, which never change across
themes (see `04` §3.1 for the exact fixed-vs-variable split and all 3 themes' full value sets).

**Second update, added when Dark Mode was built (`04` §3.2a): there are now two independent
axes, not one.** *Theme* (Space/Ocean/Jungle) still controls the 7 brand tokens' hue/identity.
*Mode* (Light/Dark, a separate Settings toggle) now ALSO affects color — every token except
`--sv-success`/`--sv-attention`/`--sv-warning` (and the new `--sv-ink`, §6.2.1) gets a distinct
dark-mode value. `--sv-card`/`--sv-text`/`--sv-text-soft` vary by mode but **not** by theme (one
shared dark value, same across all 3 themes) — the 7 brand tokens vary by **both** theme and mode
(6 full sets total). The "Theme-variable?" column below answers the theme question only; see `04`
§3.2a for which tokens also carry a dark-mode value.

| Token | Space/Light hex | Use | Theme-variable? |
|---|---|---|---|
| `--sv-bg` | `#f3f7ff` | Background | Yes |
| `--sv-bg-soft` | `#eaf1ff` | Secondary background | Yes |
| `--sv-primary` | `#4fa6c9` | Primary (soft blue/teal) | Yes |
| `--sv-primary-deep` | `#2d799b` (fixed from `#2f7fa3` — see §6.2.1) | Primary, emphasis | Yes |
| `--sv-secondary` | `#a79be0` | Secondary (lavender) | Yes |
| `--sv-secondary-deep` | `#8577c9` | Secondary, emphasis | Yes |
| `--sv-success` | `#6fc3a0` | Success (gentle green) | **No — fixed, both modes** |
| `--sv-attention` | `#ffbf69` | Attention (warm yellow/orange) | **No — fixed, both modes** |
| `--sv-warning` | `#e38b8b` | Warning (muted red) | **No — fixed, both modes** |
| `--sv-card` | `#ffffff` (Light) / `#1e2238` (Dark) | Card background | No theme-variance, but **varies by mode** |
| `--sv-card-tint` | `#f6f4ff` | Tinted card | Yes |
| `--sv-text` | `#2e3350` (Light) / `#eef1fb` (Dark) | Primary text (dark navy / off-white) | No theme-variance, but **varies by mode** |
| `--sv-text-soft` | `#6b7191` (Light) / `#8a90b8` (Dark) | Secondary text | No theme-variance, but **varies by mode** |
| `--sv-ink` | `#2e3350` | Text/icons on a solid accent-color fill (§6.2.1) | **No — fixed, both modes, always** |

**Hard rule:** never communicate information through color alone — always pair color with an
icon and a label (e.g., a zone check-in color must always have an emoji/icon + word, never just
a colored dot).

### 6.2.1 Verified contrast (WCAG AA) — a real gap-check finding, not a guess

Every pairing below was actually computed (relative-luminance contrast ratio, not eyeballed)
across all 3 themes once `04-theme-system.md`'s real hex values existed. This section exists
because nobody had done this check before — it's not decorative, it's load-bearing for every
doc that specifies a text/background pair.

- **`--sv-text` (`#2e3350`) is safe everywhere** — 10.7:1 to 12.3:1 against every background
  token in every theme (`--sv-bg`, `--sv-bg-soft`, `--sv-card-tint`, `--sv-card`). Never a concern.
- **`--sv-text-soft` (`#6b7191`) is only safe on `--sv-card` (white), `--sv-bg`, or
  `--sv-card-tint`** (4.37:1–4.78:1, passes AA). **Hard rule: never place `--sv-text-soft` on
  `--sv-bg-soft`** — it measures 4.15:1–4.21:1 across all 3 themes, which fails AA for normal-size
  text. No doc currently does this, but it's an easy mistake to make later (e.g., a muted caption
  on a secondary-background card) — check this section first if you're about to.
- **Real bug found and fixed:** the Primary Button (the single most-used interactive element in
  the app — every "Create Account," "Log In," "Play," "Enter," "Buy" button reuses this style)
  specified white text on a gradient running into the lighter `--sv-primary`. Measured contrast of
  white-on-`--sv-primary` was 2.75:1 (Space), 2.88:1 (Ocean), 3.33:1 (Jungle) — all fail AA (need
  4.5:1 for 16px/700 text, which doesn't qualify as "large text" under the 3:1 exception). **Fix:**
  the Primary Button background is now solid `--sv-primary-deep`, never a gradient into
  `--sv-primary` (updated in `01` §3.1). Space's `--sv-primary-deep` was also nudged 5% darker
  (`#2f7fa3` → `#2d799b`) because it measured 4.48:1 — just under the line (see `04` §3.2 for the
  exact before/after). All 3 themes now clear AA with margin: Space 4.86:1, Ocean 4.63:1, Jungle
  5.02:1.
- **`--sv-secondary`/`--sv-secondary-deep` are not currently paired with white text anywhere** in
  any doc (only used as semi-transparent ambience-particle colors so far, per `04` §3.3). Standing
  rule: if any future doc wants a solid secondary-colored button or badge with white text, it must
  re-run this same check first — white-on-secondary measures only 2.39:1–3.33:1 across themes,
  i.e. it is **not** safe as-is and would need the same kind of fix as the Primary Button got.
- **`--sv-success`/`--sv-attention`/`--sv-warning` always pair with dark text, never white** — dark
  text on them measures 4.89:1–7.57:1 (safe), white text measures only 1.63:1–2.52:1 (badly fails).
  This matches how every doc already uses them (e.g. the `01` lockout banner uses `--sv-warning` as
  a tinted background with dark text, never a solid fill with white text) — now written down as an
  explicit rule instead of an accident of how it happened to be built.
- **New token: `--sv-ink` (`#2e3350`, fixed — literally the same value as light mode's
  `--sv-text`, but never overridden by theme *or* mode).** Added when Dark Mode was designed
  (`04` §3.2a): text/icons placed directly on a **solid, full-opacity** fill of an accent color
  (`--sv-success`/`--sv-attention`/`--sv-warning`, or a Skill World's own signature color, `06`
  §3.6–3.8) must use `--sv-ink`, never `var(--sv-text)` — because that pairing's correctness
  depends on the accent color's own fixed lightness, not on which mode the page is in. (Verified:
  `--sv-ink` on `--sv-success`/`--sv-attention`/`--sv-warning`/Time's/Feelings'/Faces' colors all
  measure 4.89:1–7.57:1 — safe everywhere, in both modes.) `var(--sv-text)` stays correct for its
  existing uses (body text on a neutral background, or text inside a *low-opacity tinted* banner
  like the `01` lockout banner) because those surfaces are neutral/near-background, not a solid
  saturated fill.
- **Two real pre-existing contrast bugs found in the actual code while designing this:** both
  `CompanionPet.tsx`'s "Let's go" button and `WorldMap.tsx`'s "Enter" button use `bg-sv-primary`
  (not `-deep`) with white text as their **resting** state, only switching to the safe
  `-primary-deep` on hover — meaning the default, most-commonly-seen state fails AA (2.75:1–3.33:1)
  right now, independent of Dark Mode. Flagged for `05` to fix when those components are rebuilt
  for real: every primary CTA button must use solid `--sv-primary-deep` as its resting background,
  matching the `01` §3.1 standard — never plain `--sv-primary` with white text, hover or not.

### 6.3 Typography
Fonts already wired: heading font via `--font-heading` (Baloo 2), body font via `--font-body`
(Nunito), both loaded with `next/font/google` in `layout.tsx`. Friendly, rounded, highly
readable. Copy is conversational: "Start your next quest!" never "Initiate the scheduled
activity." Supportive and collaborative tone, never clinical or instructional.

### 6.4 Interaction rules (apply everywhere, not just the Hub)
- Everything reachable in **≤ 2 taps**.
- No autoplay, no pop-ups, no unsolicited sound.
- Every important action: Tap → response animation → optional sound → progress update → reward.
- Buttons: large, rounded, clearly separated, icon-supported.

### 6.5 Animation rules
**Use:** gentle movement, pet reactions, slow clouds, subtle particles, smooth transitions,
filling progress bars, small reward animations, skippable world-entry animations (2–3s), gentle
celebrations.
**Avoid:** flashing, rapid shaking, constantly-moving backgrounds, autoplay, sudden/loud sounds,
multiple simultaneous animations, aggressive confetti.
**Calm Mode (default):** reduced motion, muted effects, no flashing. Already implemented as the
`.calm-mode` class + a `prefers-reduced-motion` media query in `globals.css` — any new animated
component must respect both.

### 6.6 Theme invariance rule (critical, applies the moment a second theme is built)
Themes (Space, Ocean, Jungle, City, Magic, Sports) change visuals, sounds, characters, and
animations only. They **never** change: game mechanics, controls, learning objectives, the
difficulty system, navigation, or reward structure. A new theme = new assets over the same game
logic. Space is the current and only implemented theme (confirmed MVP theme per spec).

### 6.7 Device & responsive strategy (resolved via `ask_user` — a real gap found during a full
UI/visual spec audit; nothing had ever stated this before)

**Decision: this MVP targets desktop browsers.** It's being built and evaluated as a portfolio/demo
project, primarily viewed on a laptop. Reference design width ~1440px, tested range roughly
1280px–1920px wide, height ≥800px, landscape.

- **Layout pattern (already how the real Hub is built — confirmed in `src/app/page.tsx`, which
  already uses `mx-auto max-w-5xl` — this section formalizes an existing pattern, it doesn't
  invent a new one):** the themed ambience (Starfield/bubbles/ellipses) fills the full viewport
  edge-to-edge; the actual interactive content sits in a centered column capped at `max-w-5xl`
  (1024px) so desktop never looks like a stretched-out phone screen. Auth screens (`01`) keep
  their own narrower `max-width: 420px` card — that's correct for a single login form and stays
  as-is.
- **Mobile/tablet (<1024px wide) is explicitly best-effort and untested for this MVP** — not a
  supported target, not a silent gap. The known short-viewport nav/World-Map overlap bug flagged
  in `05` §2 (under ~800px tall) is formally **accepted as a known limitation of an
  out-of-scope device range**, not a deferred fix waiting on a future doc. If a change happens to
  help mobile for free (e.g. reusing an existing Tailwind responsive class), fine — no new mobile
  work is owed.
- **Orientation:** no orientation lock (it's a web app); landscape desktop is the only case
  designed for.
- **No new breakpoints beyond what already exists** (`01`'s single `640px` card breakpoint) are
  required by this decision — the capped-column-on-full-bleed-background pattern just needs to be
  followed consistently as new screens get built.

### 6.8 Explicit visual non-goals for this MVP (stated once, here, instead of silently missing)

Per the project's honesty rule, things that are deliberately not being built get said out loud,
not just left undone:

- **Dark Mode exists and is in scope** (added after a user request — reverses an earlier
  "not planned" note in this doc; see `04-theme-system.md` §3.2a for the full architecture,
  palette, and verified-contrast writeup). It's a separate, orthogonal toggle from Theme — any of
  the 3 themes can be viewed in Light or Dark.
- **No custom favicon/app-icon/PWA manifest work beyond a minimal placeholder.** Use a plain emoji
  favicon (🧭, matching the "exploration" feel) via a data-URI `<link rel="icon">` in `layout.tsx`,
  and a minimal `manifest.json` with just `name`, `short_name`, and `theme_color` (`--sv-primary`)
  — enough for a correct browser tab and title, not a real installable-PWA effort.
- **No generic international/RTL support.** English only, left-to-right only.

---

### 6.9 Tap target scaling (`tapTargetSize`, added when `02`'s dormant-preference audit resolved
real wiring for this one)

`02` §4.4's Q11 derives `tapTargetSize: "standard" | "large" | "extra_large"` from a motor-
difficulty preference answered about the **child**. New token: `--sv-tap-scale` (`1` / `1.15` /
`1.3`), set via a `data-tap-size` attribute on `<html>` (same mechanism as `data-theme`/`.dark` —
no component needs to branch on the value, it just reads the token). Interactive elements on
**child-operated surfaces** use `min-height: calc({base}px * var(--sv-tap-scale, 1))` instead of a
bare pixel value.

**Deliberate scope boundary (this is a child preference, not a guardian one):** applies only to
screens the **child** actually operates — the Hub, mini-games (`07`), World Home/Knowledge Vault
(`06`), Tutorial Island's child-facing steps (avatar/companion/theme pickers, the first game), and
the Heart Button/Calm Cove/Companion Closet. It does **not** apply to the Auth screens (`01`) or
the Create Child Profile wizard (`02` §3.1) — both are explicitly guardian-operated (a guardian
types their own credentials and answers the questionnaire *about* the child; the child never taps
through either), and both already have their own, separately-justified `44px` accessibility floor
for adult use (`01` §3.9) that this token doesn't touch. The Guardian Dashboard (`10`) is the same
case — adult-operated, not in scope for this token.

**Honest scope admission:** this token is additive, applied to child-facing components as they're
built — it does **not** retroactively rewrite every exact pixel value already specified elsewhere
in this doc set (e.g. `07`'s existing button sizes). Treat `--sv-tap-scale` as the convention going
forward for child-facing interactive elements, not an obligation to re-audit already-complete specs.



- Calm Mode is the default state, not an opt-in extra.
- User overrides to support eventually: High Contrast, Large Text, Sound Off, Reduce Motion,
  Simplified Interface, **Dark Mode** (added via `04` §3.2a — Light is the default, Dark is an
  opt-in toggle). Not all built yet — see `05-hub-shell.md` status for what exists today (Calm
  Mode + Sound toggle exist; Dark Mode is spec'd in `04` §3.2a but not yet built; the rest are
  future work).
- Every regulation feature (the Heart button) must be reachable in ≤ 2 taps in every mode.
- Any new theme must pass a sensory checklist before shipping: no strobing, adjustable volume,
  gentle color ramps.

## 8. Content safety & ethics baseline

- No medical claims, anywhere, ever. Skillverse is a skill-support tool, not diagnosis or
  treatment. If/when a "not a medical device" footer or onboarding line is built, it must say
  exactly that.
- No advertising, no behavioral tracking of children, no data selling. This applies even during
  prototyping — do not wire real analytics/ad SDKs "just to test," ever.
- No diagnosis is ever shown on the child's screen or used as a label in UI copy.
- AI-driven features (e.g., a future Rehearsal Room) must be scripted/guardrailed, never
  open-ended free chat with a child, when they're eventually built.
- Crisis helplines (India: Tele-MANAS 14416, iCall, Vandrevala Foundation) should be surfaced
  near regulation content once that's built for real — not required for the current mock Heart
  button/Calm Cove, but don't forget it before anything regulation-related ships for real users.

---

## 9. Repo & code conventions (observed/established so far)

- Project root: `/home/user/skillverse-app`.
- `src/app/` — Next.js App Router pages and global styles/layout.
- `src/components/` — one file per UI component, PascalCase filenames matching the exported
  component name.
- `src/lib/data.ts` — single source of mock data today; interfaces defined alongside the data
  they describe (e.g., `SkillWorld` interface next to the `skillWorlds` array).
- Anything using `Math.random()`, `new Date()`, or other non-deterministic/client-only values
  **must** be generated inside `useEffect` + state (client-only), never at module/render top
  level — Next.js will throw a prerender error otherwise. This bit us twice already
  (`Starfield.tsx`, `Greeting.tsx`); don't reintroduce it.
- `docs/` — this doc set.
- Keep components small and named after what they render (`CompanionPet.tsx`, not `Widget3.tsx`).
- **Backend conventions (NestJS, not yet built — `skillverse-backend/` doesn't exist yet) live in
  `11-data-model-and-backend-roadmap.md` §6, not here** — this section only ever covered the
  frontend, since the backend didn't exist when it was written. `11` has the full module layout,
  naming pattern (`{domain}.controller.ts`/`.service.ts`/`.module.ts`), and seed-file convention.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| **Hub** | The home-base screen: world map, Journey Line, quests, pet, Heart button, nav. |
| **Skill World** | A themed "folder" teaching one skill domain (Time, Memory, Feelings, etc.). |
| **Journey Line** | The horizontal "train map of your day" — the real-life task manager. |
| **Just-Right Zone** | The adaptive-difficulty principle: always challenged, never overwhelmed. |
| **Heart button** | One-tap, always-reachable emotional regulation entry point. |
| **Calm Cove** | A quiet, low-stimulation micro-world reachable from the Heart button. |
| **Companion Pet** | One pet per child; mirrors mood, suggests (never commands) regulation. |
| **Zone / Zone check-in** | Simple emotional state model: Calm/Okay/Worried/Big Feelings (or Blue/Green/Yellow/Red). |
| **Quest** | A unit of activity, either `GAME` (in-app) or `REAL_LIFE` (guardian-assigned); both feed the same reward pipeline. |
| **World-entry animation** | Short (2–3s), skippable transition animation when entering a Skill World. |
| **Mission Report** | The guardian-facing progress summary; observable patterns, never diagnostic scores. |

---

## 11. Open cross-cutting decisions (not yet resolved — do not silently assume an answer)

This section is kept up to date as docs get written — all four of the original items here have
now been resolved and are noted as such, not deleted outright, so the history of the decision is
traceable.

**Resolved since this list was first written:**
1. ~~Exact adaptive-difficulty algorithm~~ — resolved: `08-adaptive-difficulty.md` defines the
   full within-session, performance-and-regulation-based algorithm, replacing `06`/`07`'s manual
   placeholder selector (which still exists as an always-available override, per `08` §3.4).
2. ~~Exact reward numbers~~ — resolved: `09-rewards-and-economy.md` defines the real Stars/Coins
   amounts, the leveling formula (keeping `05`'s original placeholder structure, now made
   canonical), and the full shop price list — replacing every "honest performance-only" and
   "throwaway formula" placeholder across `03`, `05`, `06`, and `07`.
3. ~~Theme rollout order after Space~~ — resolved: Ocean and Jungle were both built alongside
   Space in `04-theme-system.md`, not staged later.
4. ~~Backend migration timing~~ — resolved: a real backend (NestJS + SQLite, Postgres-portable)
   was started immediately, beginning with `01-auth-and-account.md`, rather than staying
   frontend-only longer.

**No items are currently open.** The next genuinely open cross-cutting question should be added
here the same way, not resolved silently.

**Logged for traceability, not a resolution of the 4 items above:** Dark Mode (`04` §3.2a) was
added later as a brand-new cross-cutting feature — a user request, not an answer to a question
that was already on this list. It's noted here anyway, for the same "don't lose the history"
reason this section exists at all.

**A note on reading "doesn't exist yet" / "once X exists" anywhere in docs `01`–`10` (added after
a full cross-doc consistency pass found this had become a real source of ambiguity):** every doc
in this set, `00` through `11`, now exists in full. Phrases like these, written while this doc set
was still being built one module at a time, refer to **the real backend/frontend code for that
module being built**, never to the doc file's existence — which is no longer in question for any
of them. The one and only source of truth for what's actually implemented is each doc's own §2
Current Status (🔴/🟡/🟢) — not whether a cross-referenced doc number "exists," since all of them
now do. If this is ever ambiguous in a specific sentence, treat it as a documentation bug (the
phrasing is stale) rather than a real open question — the underlying intent was always "once that
module's real code is built," and that hasn't changed.
