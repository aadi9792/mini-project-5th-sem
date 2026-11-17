# Module: Theme System
Read `00-global-context-and-rules.md`, `00a-visual-assets-and-style-guide.md`, and
`02-child-profile-and-personalization.md` first.

**Scope of this doc:** the 3 real themes (Space, Ocean, Jungle) and their exact color/ambience/
animation specs, the theme-switching architecture that makes the Hub actually respond to an
active theme instead of being Space-hardcoded, the Tutorial Island theme picker, changing theme
later from Settings, **and Dark Mode (§3.2a)** — a separate, orthogonal Light/Dark toggle that
applies to whichever theme is active. It does **not** cover: companion accessory badges (owned by
`00a-visual-assets-and-style-guide.md` §3.2, already built against this doc's 3 themes), the
Companion system itself (`03-companion-system.md`), or building out City/Magic/Sports for real
(explicitly out of scope — see §6).

---

## 1. How to Use This Document

**Step 0:** nothing new to set up.

**Step 1 — backend first (small).** Tell the agent:
> "Read docs `00`, `00a`, `02`, and `04-theme-system.md`. Add the `activeTheme` field to the
> `Child` model (§4.1) and the endpoint in §4.3. This is a small backend addition compared to
> other modules — most of this doc's work is frontend."

**Step 2 — frontend, in this order, since each piece depends on the last:**
1. Retrofit the color system first (§3.1–3.2): turn the hardcoded `globals.css` tokens into a
   theme-switchable system. Verify the existing Hub still looks *exactly* the same with
   `data-theme="space"` as it did before this change — this step should be invisible if done
   right.
2. Generalize the ambient background (§3.3): rename/restructure `Starfield.tsx` into a
   theme-aware `ThemeAmbience.tsx`, add the Ocean and Jungle variants.
3. Make `WorldEntryOverlay` theme-aware (§3.4) — it currently hardcodes 🚀 and "Launching to
   {world.name}…", both Space-specific.
4. Add the theme picker (§3.5) and the Settings "Change Theme" entry (§3.6).
5. **Add Dark Mode (§3.2a)** — do this after steps 1–4 work for Light mode across all 3 themes,
   since it reuses the exact same `data-theme` mechanism and just adds a second, orthogonal `.dark`
   class. Building it last avoids debugging two new systems (theme-switching and mode-switching)
   at once.

**Checkpoint:** switch a test child between all 3 themes via the picker and Settings, and confirm
every Hub element (background, cards, buttons, world-entry animation, companion accessory badge
from `00a`) updates correctly with no leftover hardcoded Space values anywhere. Then repeat the
same checkpoint with Dark Mode on, for all 3 themes (6 total combinations).

**When this module is "done":** every item in §7 verified, §2 updated honestly.

---

## 2. Current Status

🔴 **Nothing in this doc is built yet, including Dark Mode (§3.2a, added after this doc was
first written — still spec only, not implemented).** The Hub is currently **hardcoded to Space,
Light mode** — the `--sv-*` tokens in `globals.css` have fixed values, `Starfield.tsx` only
renders stars, and `WorldEntryOverlay` (inside `WorldMap.tsx`) hardcodes a rocket emoji and launch
copy. This is the single biggest retrofit so far in this doc set — bigger than the Hub rework
flagged in `02`/`03` — because it touches the actual CSS token system every other built component
already depends on. Do this retrofit carefully and verify nothing visually breaks for the Space
theme before trusting Ocean/Jungle, and build Dark Mode last (§1 above), once Light-mode
theme-switching is fully verified.

**Background Music (§3.3a) is also spec-only, but its 3 real audio files already exist** (`.ogg`+
`.mp3` each, 6 files total) in `public/sounds/ambient/` (`00a` §7.1/7.3) — same situation as `03`'s
Quiet Sounds. Nothing to source when building this; only the toggle, playback, and pause/resume
logic need writing.

---

## 3. Frontend & UI

### 3.1 Which tokens change per theme, and which never do (resolves a real design question)
Not every color should vary by theme. **Functional tokens carry meaning and must stay identical
across all themes** so they're never ambiguous: `--sv-success`, `--sv-attention`, `--sv-warning` —
these never change, in either theme or mode (§3.2a). `--sv-card`, `--sv-text`, and
`--sv-text-soft` are also theme-invariant (identical across Space/Ocean/Jungle) but, as of Dark
Mode (§3.2a), they are **not** mode-invariant — they take one value in Light and a different one
in Dark, the same value regardless of which theme is active. **Decorative/brand tokens vary per
theme, and — as of §3.2a — per mode too**: `--sv-bg`, `--sv-bg-soft`, `--sv-primary`,
`--sv-primary-deep`, `--sv-secondary`, `--sv-secondary-deep`, `--sv-card-tint`. Token *names*
never change between themes or modes — only their values — so no component ever needs to know
which theme or mode is active; it just keeps using `var(--sv-primary)` and gets the right color
automatically. This is the Theme Invariance Rule (`00` §6.6) applied at the CSS level, now
extended by the same logic to modes.

### 3.2 Exact color values, all 3 themes

**Real fix applied during the `00` §6.2.1 contrast audit:** Space's original `--sv-primary-deep`
(`#2f7fa3`) gave white text only a 4.48:1 contrast ratio against it — just under the 4.5:1 WCAG AA
line for normal-weight text, which matters because the Primary Button (§3.1 of `01`) is solid
`--sv-primary-deep` with white text. Nudged 5% darker to `#2d799b` (visually indistinguishable)
to clear AA with margin (4.86:1). Ocean's and Jungle's `--sv-primary-deep` already passed (4.63:1,
5.02:1) and were left untouched.

| Token | Space | Ocean | Jungle |
|---|---|---|---|
| `--sv-bg` | `#f3f7ff` | `#eafbfb` | `#f4f9ef` |
| `--sv-bg-soft` | `#eaf1ff` | `#dbf4f3` | `#e9f3df` |
| `--sv-primary` | `#4fa6c9` | `#2aa9a0` | `#6a9955` |
| `--sv-primary-deep` | `#2d799b` (was `#2f7fa3` — see contrast fix above) | `#1f827a` | `#4f7a3d` |
| `--sv-secondary` | `#a79be0` | `#4fb3d9` | `#c98a4b` |
| `--sv-secondary-deep` | `#8577c9` | `#2f8fb3` | `#a66d35` |
| `--sv-card-tint` | `#f6f4ff` | `#eafcfb` | `#f1f7ea` |

**Implementation mechanism:** add a `[data-theme="ocean"]` and `[data-theme="jungle"]` block in
`globals.css`, each overriding only the 7 variable tokens above (the existing `:root` block stays
as the Space/default values, unchanged). A `data-theme` attribute is set on the `<html>` element
at runtime by the theme provider (§4.4's `ThemeProvider.tsx`), read from the child's
`activeTheme` field (§4.1). **`ThemeProvider` defaults to `"space"` whenever `activeTheme` is
`null`** — this is what makes `02` §3.1's "Tutorial Island opens in the default Space presentation
before a theme is picked" rule actually work; it's the provider's one explicit fallback rule, not
something each screen needs to handle separately. No component code needs to branch on theme —
this is the entire point of keeping token names constant.

**Two things that look like hardcoded colors but are correctly NOT part of this retrofit** (don't
"fix" either of these — they're deliberate, not oversights):
- Literal Tailwind classes like `bg-white` (e.g. in the existing `SettingsPanel.tsx`/
  `HeartButton.tsx`) are harmless to leave as-is, since `--sv-card` is fixed at `#ffffff` across
  every theme anyway — there's no visual difference, so this isn't a theme bug.
- Each Skill World's `color` field in `data.ts` (e.g. `"#4fa6c9"` for Time) is an intentional,
  **per-world identity marker** — it's what makes the Time planet look different from the
  Feelings planet, regardless of which theme is active, and is unrelated to this doc entirely.
  Leave it exactly as it is; it is not a "leftover hardcoded hex" to clean up.

The actual audit for this retrofit should check every file under `skillverse-app/src/components/`
for the **7 theme-variable tokens from §3.2 specifically** (`bg`, `bg-soft`, `primary`,
`primary-deep`, `secondary`, `secondary-deep`, `card-tint`) written as a literal hex value instead
of the `var(--sv-*)`/`bg-sv-*` form — not every color reference in the codebase.

**No change is needed to `globals.css`'s `@theme inline` block.** Tailwind v4's generated utility
classes (e.g. `bg-sv-bg`) just emit `background-color: var(--color-sv-bg)`, which already resolves
through to whatever `--sv-bg` currently is via normal CSS cascade — a `[data-theme="ocean"]`
override further up the tree is picked up automatically. Don't restructure the Tailwind theme
mapping to "support" theme-switching; it already does, for free.

**Theme transition:** when the active theme changes (from the picker or Settings), wrap the swap
in a brief full-screen fade: 250ms fade to a neutral white overlay, swap the `data-theme`
attribute instantly while hidden, 250ms fade back in. This avoids relying on CSS custom property
transitions (inconsistent browser support) for a clean-looking swap. Respects
`prefers-reduced-motion` — the fade still happens but near-instantly (per the existing global
reduced-motion override in `globals.css`), never skipped outright, since the color change itself
would otherwise look like a jarring, disorienting flash.

### 3.2a Dark Mode (added after this doc was first written — a user request, not in the original
master spec; locked decisions: always-Light on first load, no OS `prefers-color-scheme`
auto-detection, saved to `localStorage` like Calm Mode/Sound, not backend-persisted like `04`'s
own theme choice)

**Architecture:** Dark Mode is a second, independent axis from Theme — a boolean toggle, not a 4th
"theme." Implemented as a `.dark` class on `<html>`, alongside the existing `data-theme` attribute
(so the two combine: `<html data-theme="ocean" class="dark">`). `globals.css` gets 3 new override
blocks — `[data-theme="space"].dark`, `[data-theme="ocean"].dark`, `[data-theme="jungle"].dark` —
each overriding all 13 tokens (not just the 7 brand ones, since `--sv-card`/`--sv-text`/
`--sv-text-soft` now need dark-tuned values too — see §3.1). A `ThemeProvider` reads a new
`darkMode: boolean` from `localStorage` (key `sv-dark-mode`, default/missing → `false`) and toggles
the `.dark` class — this is pure client state, no `GET`/`PATCH` endpoint, no `Child` model change,
unlike the theme id itself.

**Why this doesn't need a dark-tuned value for every token (verified by computing actual WCAG
contrast ratios, not guessing):** `--sv-success`/`--sv-attention`/`--sv-warning` already measure
6.2:1–11.8:1 as text/icons/borders against the new dark backgrounds below — no change needed, they
work unmodified in both modes. The only tokens that truly need new values are the ones that
represent a *light-colored surface* in Light mode (`--sv-bg`, `--sv-bg-soft`, `--sv-card`,
`--sv-card-tint`) or *dark-colored text* in Light mode (`--sv-text`, `--sv-text-soft`) — these
genuinely have to invert. The 4 brand accent tokens (`--sv-primary`, `--sv-primary-deep`,
`--sv-secondary`, `--sv-secondary-deep`) get dark-tuned values mainly so they still pop visually
against a near-black background rather than looking washed out, not because the light-mode values
would literally fail a contrast test if left alone.

**Full palette, all 3 themes, Dark column (Light column = §3.2's existing table, unchanged):**

| Token | Space Dark | Ocean Dark | Jungle Dark |
|---|---|---|---|
| `--sv-bg` | `#0b0e1c` | `#061c1f` | `#0e1a0d` |
| `--sv-bg-soft` | `#12172b` | `#0c2528` | `#152613` |
| `--sv-primary` | `#5fc3e8` | `#36c9bd` | `#8bc46a` |
| `--sv-primary-deep` | `#2672a1` | `#197e76` | `#4c7b38` |
| `--sv-secondary` | `#b9aef0` | `#5fc7e8` | `#e0a868` |
| `--sv-secondary-deep` | `#9f8fe0` | `#3aa8cc` | `#d68c37` |
| `--sv-card-tint` | `#1b2040` | `#0d2a2c` | `#182a14` |

**Shared across all 3 themes in Dark mode** (these 3 tokens don't vary by theme, per §3.1):
`--sv-card` = `#1e2238`, `--sv-text` = `#eef1fb`, `--sv-text-soft` = `#8a90b8`.

**Unchanged in Dark mode, both axes:** `--sv-success` (`#6fc3a0`), `--sv-attention` (`#ffbf69`),
`--sv-warning` (`#e38b8b`), `--sv-ink` (`#2e3350`, new token, `00` §6.2.1).

**Contrast verification actually computed (WCAG relative-luminance formula, not eyeballed), so
this doesn't repeat `00` §6.2.1's mistake-by-omission of never checking in the first place:**
- `--sv-text` on any Dark surface (`--sv-bg`/`--sv-bg-soft`/`--sv-card`/`--sv-card-tint`, all 3
  themes): 13.4:1–17.0:1. Hugely safe.
- `--sv-text-soft` on the same surfaces: 4.53:1–9.0:1 — tightest case is Ocean's `--sv-card-tint`
  at 4.53:1, still clears AA's 4.5:1 with a sliver of margin; everywhere else has real headroom.
- White text on each theme's Dark `--sv-primary-deep` (the Primary Button standard, `00` §6.2.1):
  Space 5.24:1, Ocean 4.90:1, Jungle 5.00:1 — all comfortably pass. (These `-deep` values were
  deliberately chosen darker than a naive "brighten everything for dark mode" instinct would
  suggest, specifically to keep this pairing safe — see the worked numbers that drove this choice
  in this doc's build notes if the exact values ever need revisiting.)
- `--sv-success`/`--sv-attention`/`--sv-warning` (unchanged values) as text/border against Dark
  surfaces: 6.2:1–11.8:1. `--sv-ink` on top of a solid fill of any of them: 4.89:1–7.57:1. Both
  safe without any dark-specific tuning.
- Skill World signature colors (`06` §3.6–3.8: Time `#d4a24c`, Feelings `#e8935a`, Faces
  `#a79be0`) were also re-checked against the new Dark surfaces and **do not need dark-tuned
  variants** — they measure 6.27:1–6.76:1 as text/accents against Dark `--sv-card`, and (per the
  `--sv-ink` rule, `00` §6.2.1) 4.93:1–5.32:1 with `--sv-ink` text on a solid fill of any of them.
  They stay identical across both modes, same as the functional tokens.

**Real retrofit this surfaced in the actual codebase** (found while verifying §3.1's old "leave
`bg-white` alone, `--sv-card` is always `#ffffff` anyway" guidance — that reasoning is now wrong,
since `--sv-card` has a real Dark value, so every literal `bg-white` used as a *surface* is now a
genuine Dark Mode bug, not a harmless no-op):
- `SettingsPanel.tsx` line 35 (`bg-white` on the panel sheet itself) → must become `bg-sv-card`.
- `HeartButton.tsx` line 34 (`bg-gradient-to-b from-sv-bg-soft to-white` on the Calm Cove sheet) →
  the `to-white` must become `to-sv-card`.
- `JourneyLine.tsx` lines 30/33 (`bg-white` on each stop's pip/marker) → must become `bg-sv-card`.
- **Not** a bug, correctly left alone: `SettingsPanel.tsx`'s toggle-switch thumb (`bg-white`,
  line 113) — this is a small indicator sitting on a *colored track* (`bg-sv-primary`/
  `bg-sv-text-soft/30`), not a neutral surface, and a literal white thumb reads fine in both modes
  (the same reasoning that keeps `text-white` correct on brand-colored buttons, below).
- **Also not a bug:** `text-white` used on top of a *saturated brand-colored* background (e.g.
  `HeartButton.tsx`'s `bg-sv-primary text-white`, `WorldMap.tsx`'s gradient overlay) stays literal
  white in both modes — brand colors stay vivid/saturated in Dark mode too, so white text keeps
  working the same way it does in Light mode. Only *neutral surface* colors (cards, sheets,
  pips) needed to become tokens; button/badge foreground-on-brand-color pairings did not.
- **A real, separate pre-existing bug, not caused by Dark Mode but found while auditing for it:**
  `HeartButton.tsx`'s floating Heart icon uses `fill-white` on `bg-sv-warning` — measuring only
  2.52:1, which fails even the 3:1 WCAG non-text-contrast threshold for a meaningful icon, in
  Light mode, today, regardless of Dark Mode. Fix: change to the new `--sv-ink` token (`#2e3350`)
  instead of white — measures 4.89:1, safe. **Already written into `03-companion-system.md` §3.8
  directly** (that doc already edits `HeartButton.tsx` for its zone check-in feature, so the fix
  lives there, not as a dangling TODO here).

**Toggle placement, default, and persistence:** a new **"Dark Mode"** row is added to
`SettingsPanel.tsx` (§3.6 below), directly under the existing "Theme" row, using the same
`ToggleRow`/`Switch` pattern already used for Calm Mode. **Default is always Light** on first use
— no OS dark-mode detection, a deliberate choice (consistent with Theme and Calm Mode both already
being explicit, predictable opt-ins rather than OS-driven). Persisted to `localStorage` only
(`sv-dark-mode`), exactly like Calm Mode/Sound (moved to `localStorage` per `05`'s retrofit note
and `07` §3.13) — **not** saved to the
`Child` backend record the way the theme *id* is (§4.1 below), since this is a lower-stakes,
purely-cosmetic device preference, not an identity choice. This does mean Dark Mode doesn't follow
a child across devices/browsers — an accepted tradeoff, consistent with `00` §6.7's overall
desktop-single-session framing for this MVP.

**Ambience and World colors need zero code changes to support Dark Mode correctly** —
`ThemeAmbience.tsx`'s particles already read `var(--sv-secondary-deep)` (§3.3 below), which
automatically resolves to the right Dark value through the normal CSS cascade; Skill Worlds'
signature colors (`06`) are literal, mode-invariant hex values that were already verified safe
against Dark surfaces above. This is the entire payoff of the token-based architecture `04`/`00`
established from the start — Dark Mode is "free" everywhere except the handful of literal-color
retrofit spots listed above.

### 3.3 Ambient background per theme
`Starfield.tsx` is renamed/restructured into `ThemeAmbience.tsx`, which renders one of 3 particle
systems based on the active theme. All 3 share the same underlying drift/fade technique already
built (the CSS keyframe approach in `globals.css`), just with different shapes/counts/colors —
none use emoji, to stay visually consistent with the existing abstract-dot Starfield style.

| Theme | Particle shape | Count | Size | Opacity range | Motion |
|---|---|---|---|---|---|
| Space (existing) | Dots (stars) | 40–60 (Hub density, not the muted Auth version) | 1–3px | 20%–90%, twinkling | Slow upward/diagonal drift, existing `@keyframes drift`/`twinkle` |
| Ocean | Circles (bubbles) | 15–25 | 4–14px, varied | 10%–40%, no twinkle | Rises from bottom toward top, looping, via a new `@keyframes rise` (translateY only, no fade needed beyond constant opacity) |
| Jungle | Soft blurred ellipses (leaf silhouettes) | 10–18 | 20–40px wide, blurred (`filter: blur(2px)`) | 15%–40% | Slow diagonal drift, reusing the existing `@keyframes drift`, slightly slower duration |

All 3 particle colors use `var(--sv-secondary-deep)` at the stated opacity — matching what the
existing Space implementation already does (`bg-sv-secondary-deep/40`, confirmed in the real
`Starfield.tsx`) — never a separate hardcoded color, so Ocean/Jungle automatically match their
theme without special-casing. **Critically, generate every particle's randomized position/size/
delay inside `useEffect` + state, exactly like the existing `Starfield.tsx` already does** — this
is not optional polish, it's avoiding a bug that already happened once and was already fixed (per
`00` §9: `Math.random()` at module/render top level breaks Next.js prerendering). The Ocean and
Jungle variants are new code and could easily reintroduce this if written from scratch without
copying the existing pattern.

The new `rise` keyframe (Ocean bubbles, doesn't exist yet): animates from `transform:
translateY(0)` at the bottom of its container to `transform: translateY(-110vh)` above the top,
each bubble given a randomized duration between 12–20s (same per-particle randomization pattern
as the existing stars' `delay`). Jungle's leaf drift reuses the existing `@keyframes drift`
unchanged, just at roughly 1.3× the duration used for Space's drift (slightly slower, per the
"calm, exploratory" feel from the original catalog).

### 3.3a Per-theme ambient background track (added when sound effects were finally discussed — a
genuinely new feature, not previously addressed in any direction; full asset/technical strategy is
cross-cutting and lives in `00a` §7.3, specified here since this is the doc that owns per-theme
content and already builds the visual half of "ambient background per theme" above)

One soft, short, looping audio file per theme (`public/sounds/ambient/{themeId}.ogg`
+`.mp3` — see `00a` §7.1 for the dual-format/sourcing convention; not a perfectly seamless loop,
see `00a` §7.2's honest correction — a brief fade dip at the loop point, kept as-is for this
phase). **Already real, not just specified:** all 3 files exist in the workspace today — Ocean and
Jungle are genuine CC0 field recordings, Space is deliberately synthesized rather than sourced (no
real recording of "space ambience" exists to honestly use, `00a` §7.1) — full source/license table
in `skillverse-app/public/sounds/SOURCES.md`. Controlled by a **new
"Background Music" row in `SettingsPanel.tsx`**, directly below the existing "Sound" row — its own
separate toggle, `localStorage`-backed (`sv-background-music`), **off by default for every child
regardless of any derived preference** (deliberately not treated like `soundDefaultOn`, since
starting any child in a state with autoplaying audio, however soft, would itself violate `00`
§6.4's "no autoplay, no unsolicited sound" rule — this one is a manual opt-in only, never a derived
default). Switching theme while it's on crossfades to the new theme's track using the same brief
fade already used for the theme-switch visual transition (§3.2) — one coordinated "theme is
changing" moment, not two separate transitions firing independently. Entirely independent of Dark
Mode (color-only) and Calm Mode (motion-only, per existing precedent) — neither affects it.

**Three interaction questions resolved during a later final gap-check (not left implicit):**
- **Pauses automatically while `03`'s Quiet Sounds is open, resumes automatically on close if it
  was playing before** (full reasoning in `00a` §7.2) — the one real "two ambient beds at once"
  problem this app has, and the only case where Background Music gets paused by anything.
- **Keeps playing, deliberately, during an active mini-game session** — it's a soft bed, not
  something that needs to duck for `07`'s own short, infrequent correct/incorrect chimes.
- **Lives in `ThemeProvider`**, not a page-specific component — `ThemeProvider` already wraps the
  whole child-app and persists across route changes (it manages `data-theme`/Dark Mode state the
  same way), so the `<audio>` element driving this doesn't restart/cut out every time the child
  navigates between the Hub, World Home, and a mini-game.

### 3.4 World-entry animation per theme
`WorldEntryOverlay` (in `WorldMap.tsx`) currently hardcodes a 🚀 emoji and "Launching to
{world.name}…" — both Space-specific. Generalize to a small lookup keyed by theme:

| Theme | Emoji | Verb copy |
|---|---|---|
| Space | 🚀 | "Launching to {world.name}…" |
| Ocean | 🤿 | "Diving to {world.name}…" |
| Jungle | 🌿 | "Venturing to {world.name}…" |

Everything else about this overlay (the gradient background using `--sv-primary-deep`/
`--sv-secondary-deep`, the 2–3s duration, the skip button, respecting reduced motion) stays
exactly as already built — it already automatically re-themes correctly once §3.2's token system
is in place, since it's built from theme-variable tokens already.

### 3.5 Theme picker (Tutorial Island step 3, per `02` §3.6)

**Full theme catalog (resolves a real gap — this table didn't exist anywhere before now, despite
being referenced repeatedly):**

| Id | Emoji | Display name | Built? |
|---|---|---|---|
| `space` | 🚀 | Space | Yes |
| `ocean` | 🌊 | Ocean | Yes |
| `jungle` | 🌿 | Jungle | Yes |
| `city` | 🏙️ | City | No — "Coming Soon" |
| `magic` | ✨ | Magic | No — "Coming Soon" |
| `sports` | ⚽ | Sports | No — "Coming Soon" |

This is the exact content of `themes.constant.ts` (§4.4) and the exact order/content the picker
renders. Every tile, including the 3 locked ones, shows its emoji (dimmed/greyscale for locked
tiles) — a locked tile is never a blank box, it still visually says what it is, just not yet
available.

- Headline: **"Choose your adventure world!"**
- A grid of all 6 catalog entries above, in table order.
  - **Space, Ocean, Jungle** (real): the tile's emoji at full color, a preview swatch — a
    **static CSS gradient** (`linear-gradient` using that theme's `--bg` → `--primary` →
    `--secondary` stops), not a live particle preview (deliberately simpler — a scaled-down live
    `ThemeAmbience` renderer isn't worth the added complexity for a small picker card), theme
    name, and one descriptive word from the original catalog (Space: "Explore the stars," Ocean:
    "Dive in calm waters," Jungle: "Adventure through the trees"). Tapping selects it immediately
    (no separate confirm step, consistent with the companion picker's directness).
  - **City, Magic, Sports** (not built): the tile's emoji shown dimmed/greyscale, a small lock
    icon overlay (lucide `Lock`, same icon used for locked companions in `03`), and a **"Coming
    Soon"** label. Tapping one shows a brief, non-blocking toast: **"{Theme name} is coming
    soon!"** — `--sv-text` background at 90% opacity, white text, centered near the bottom of the
    screen, auto-dismisses after 2 seconds. Always give feedback on tap rather than leaving the
    tile feeling inert/broken.
- On selecting a real theme, play the full-screen fade transition from §3.2, then proceed to the
  companion "dressed for the adventure" reveal moment (already specified in `03` §3.6 step 3 and
  `00a` §3.2) before continuing to the first mini-game. **This reveal ceremony is a one-time
  Tutorial Island moment** — see §3.6 for what happens when theme is changed later.

**A note on emoji choices that look inconsistent but aren't:** the companion's theme accessory
badge (`00a` §3.2) uses 🌊 for Ocean, while this doc's world-entry animation (§3.4) uses 🤿 for
Ocean. This is intentional, not a drift between docs — the accessory badge is a small ambient
flavor icon, while the entry animation pairs with an action verb ("Diving to...") that reads
better with a diving mask than a wave. Don't "fix" this to make them match; they serve different
moments.

### 3.6 Changing theme later (Settings)
Add a new row to the existing `SettingsPanel.tsx`, below the current Calm Mode and Sound toggles:
label **"Theme"**, showing the current theme's emoji + name (per §3.5's catalog table, e.g. "🌊
Ocean"), with a **"Change"** button. Tapping it swaps
the *content* of the already-open Settings panel to show the `ThemePicker` (§3.5, reused
component) in place, with a small back-arrow returning to the settings list — **not** a second
modal stacked on top of the first. Avoid nested dialogs here; they complicate focus management
and screen-reader behavior for no real benefit. Per the master spec's own rule, themes are never
locked once picked — a child can switch between Space/Ocean/Jungle as often as they like, with no
cost, exactly like switching companions. Switching theme here updates the companion's accessory
badge (`00a` §3.2) quietly, as part of the same fade transition from §3.2 — there is no repeat of
Tutorial Island's "dressed for the adventure" reveal ceremony; that special moment happens exactly
once, the first time a theme is ever chosen.

**New "Dark Mode" row (§3.2a), directly below the Theme row:** label **"Dark Mode"**, helper text
**"Easier on the eyes in low light."**, a `Switch` toggling `localStorage`'s `sv-dark-mode` —
exactly the same `ToggleRow` component already used for Calm Mode, no new UI pattern. Toggling it
applies the same brief full-screen-fade technique as a theme change (§3.2) so the swap never looks
like a jarring flash — but fades to **black when turning Dark Mode on, white when turning it
off**, not always white (fading through white while switching *into* dark would itself be the
jarring flash this technique exists to avoid). Respects `prefers-reduced-motion` the same way
(near-instant fade, never skipped outright).

**New "Background Music" row, directly below the Dark Mode row (§3.3a):** label **"Background
Music"**, helper text **"A soft ambient sound for your world."**, a `Switch` toggling
`localStorage`'s `sv-background-music` — same `ToggleRow` pattern, no new UI component. Off by
default, per §3.3a's reasoning.

### 3.7 Accessibility & motion
Same bar as every other module: the picker and Settings' theme row (and the new Dark Mode row,
§3.2a) are keyboard-navigable with visible focus rings; the fade transition in §3.2 (and its Dark
Mode variant), all 3 ambience systems in §3.3, apply the same way and respect
`prefers-reduced-motion`; locked theme tiles are communicated with icon + text together ("Coming
Soon" + lock icon), never styling (dimming) alone. Dark Mode is itself an accessibility-adjacent
feature (lower glare/light sensitivity, which genuinely matters for some children with sensory
sensitivity) but is not a substitute for `00` §7's own override list (High Contrast, Large Text,
etc.) — it's a new, separate option on that list, not a replacement for any of the others.

### 3.8 What this module hands off to other docs
- `05-hub-shell.md` must adopt the `ThemeAmbience.tsx` component in place of the current direct
  `Starfield.tsx` usage, and must ensure every Hub element only ever uses the `--sv-*` token
  names (never a hardcoded hex) — any hardcoded color found during this retrofit is a bug to fix,
  not a style choice to preserve.
- `00a-visual-assets-and-style-guide.md` §3.2 (companion accessory badges) depends on this doc's
  3 theme ids (`space`/`ocean`/`jungle`) existing — already written against them.
- **Resolved, now that `06-skill-world-template-and-catalog.md` is written:** Skill Worlds do
  *not* get their own per-theme background art. Each world's World Home screen reuses whichever
  `ThemeAmbience` variant is already active, with the world's own fixed signature color (`06`
  §3.6–3.8, independent of theme) layered on top as an accent — the same "accent over the active
  theme" pattern already used for companion accessory badges (`00a` §3.2), not a third, separate
  per-world art system.
- **New, from Dark Mode (§3.2a), already resolved:** `CompanionPet.tsx`'s "Let's go" button and
  `WorldMap.tsx`'s "Enter" button both used `bg-sv-primary` (not `-deep`) with white text as their
  resting state, which fails AA — a real pre-existing bug, independent of Dark Mode. Since
  `05-hub-shell.md` already rebuilds both buttons for real, the fix (resting state becomes solid
  `--sv-primary-deep`, matching `01` §3.1's standard) was written directly into `05`, not left
  dangling here.
- **New, from Dark Mode (§3.2a), already resolved:** `HeartButton.tsx`'s Heart icon (`fill-white`
  on `bg-sv-warning`) was a separate real contrast bug, pre-existing and independent of Dark Mode.
  Since `03-companion-system.md` already edits this file directly (its zone check-in addition),
  the fix (switch to the new `--sv-ink` token) was written into `03` §3.8 directly rather than left
  as a dangling TODO here.

---

## 4. Backend & File Architecture

### 4.1 Data model addition (extends the `Child` model from `02`, same shared `schema.prisma`)

```
Child {
  // ...existing fields from 02 §4.1...
  activeTheme String?  // "space" | "ocean" | "jungle" — null until Tutorial Island's theme
                        // picker step completes; always set after that
}
```

No new Prisma model is needed for the theme catalog itself — unlike companions (`03`), themes
aren't a per-child adoptable/unlockable roster, they're fixed application configuration tied
directly to CSS and asset files. The catalog (all 6 entries, which 3 are real) lives as a simple
backend constant, not a database table — there's nothing here that benefits from being
data-driven at this stage.

**Dark Mode (§3.2a) deliberately gets no `Child` model field at all** — per the locked decision,
it's `localStorage`-only (key `sv-dark-mode`), same tier as Calm Mode/Sound, not a backend-tracked
preference like `activeTheme` above. No migration, no endpoint, no `GET /children/me` field.

### 4.2 Business rules
- `PATCH /children/:id/theme` only accepts `"space"`, `"ocean"`, or `"jungle"` — rejects
  `"city"`/`"magic"`/`"sports"` with a `400` even though the frontend already prevents selecting
  them, same defense-in-depth pattern used elsewhere in this doc set.
- Changing theme is unlimited, free, and instant — no cost, no cooldown, matching the "themes are
  never locked forever" rule from the original spec.

### 4.3 API endpoint

| Method & path | Request body | Success response | Notes |
|---|---|---|---|
| `PATCH /children/:id/theme` | `{ theme: "space" \| "ocean" \| "jungle" }` | `200 { child }` | Used by both the Tutorial Island picker and the Settings "Change Theme" flow — one endpoint, two entry points |

`activeTheme` is already included in whatever `GET /children/me` (from `02` §4.5) returns, since
it's just a field on the same `Child` record — no separate read endpoint is needed.

### 4.4 File architecture

```
skillverse-backend/src/children/
└── (no new files — the theme field and validation are added to the existing children.service.ts
    and children.controller.ts from 02)
skillverse-backend/src/common/constants/
└── themes.constant.ts             # the 6-entry catalog (id, name, isBuilt) from §3.5

skillverse-app/src/components/
├── ThemeProvider.tsx               # NEW — reads activeTheme, sets `data-theme` on <html>,
│                                    # exposes a `setTheme()` function that performs §3.2's fade;
│                                    # also reads/writes §3.2a's `sv-dark-mode` localStorage key
│                                    # and toggles the `.dark` class on <html>
├── ThemeAmbience.tsx                # replaces Starfield.tsx's role; Starfield.tsx's existing
│                                    # star logic becomes this file's "space" branch, unchanged
├── ThemePicker.tsx                  # §3.5, reused by both Tutorial Island and Settings
├── SettingsPanel.tsx                # edited: new "Dark Mode" row (§3.6) below Theme, and the new
│                                    # "Background Music" row (§3.3a/§3.6) below that; also the
│                                    # §3.2a retrofit — its own modal sheet's `bg-white` (line 35)
│                                    # becomes `bg-sv-card` so it inverts correctly in Dark Mode
├── JourneyLine.tsx                  # edited: each stop's `bg-white` pip/marker becomes
│                                    # `bg-sv-card`, same §3.2a retrofit reasoning
└── WorldMap.tsx                     # edited in place: WorldEntryOverlay gets the §3.4 lookup

skillverse-app/src/app/(tutorial-island)/theme/
└── page.tsx                        # §3.5, Tutorial Island step 3

skillverse-app/src/app/globals.css
└── edited: add `[data-theme="X"].dark` blocks for all 3 themes (§3.2a's full dark palette),
    alongside the existing `[data-theme="ocean"]`/`[data-theme="jungle"]` light blocks

skillverse-app/public/sounds/ambient/   # §3.3a — all 3 already real and in the workspace
                                          # (`.ogg` + `.mp3` each, see SOURCES.md there)
├── space.ogg / space.mp3     # synthesized, not sourced — see `00a` §7.1's noted exception
├── ocean.ogg / ocean.mp3     # real CC0 field recording
└── jungle.ogg / jungle.mp3   # real CC0 field recording
```

(`HeartButton.tsx`'s own two §3.2a fixes — the `to-white` → `to-sv-card` surface retrofit, and the
separate `fill-white` → `--sv-ink` icon-contrast bug — are listed in `03-companion-system.md`'s
file architecture instead, since that doc already edits this file directly for the zone check-in
feature; not duplicated here to avoid two docs claiming the same edit.)

---

## 5. What You Need to Do, With Why
Nothing new. No external accounts or credentials needed for this module.

---

## 6. Explicitly Out of Scope for This Module
- **Building City, Magic, or Sports for real.** They exist only as "Coming Soon" tiles in the
  picker — no color tokens, ambience system, or art direction defined for them, deliberately.
- **Per-Skill-World art that changes with theme.** Not decided — see §3.8's note to `06`.
- **A theme catalog database table.** Explicitly a code-level constant, not data-driven — see
  §4.1's reasoning.
- **Parallax/depth effects, weather systems, or day/night cycles per theme.** Never discussed;
  the 3 ambience systems in §3.3 are deliberately simple, consistent with the "no bespoke art
  yet" placeholder strategy from `00a`.
- **Any per-theme difference in game mechanics, difficulty, or reward structure.** Forbidden
  outright by the Theme Invariance Rule (`00` §6.6) — this is a constraint, not an open question.
- **OS-level `prefers-color-scheme` auto-detection for Dark Mode.** Explicitly decided against —
  Dark Mode always starts off (Light) on first load, a manual opt-in only, same tier as Theme and
  Calm Mode. Don't add auto-detection later without it being a real, discussed decision.
- **Dark Mode following a child across devices/browsers.** It's `localStorage`-only (§3.2a), a
  deliberate tradeoff, not an oversight.
- **A 4th "theme" that's actually just Dark Mode in disguise.** Dark Mode is an orthogonal toggle
  on top of all 3 real themes, not a new theme id in the §3.5 catalog.

---

## 7. Acceptance Criteria / Definition of Done

- [ ] With `data-theme="space"` (or no attribute at all, Space being the default), the Hub looks
      pixel-identical to how it looked before this module's retrofit — this retrofit must be
      invisible for the existing theme.
- [ ] Switching to Ocean or Jungle correctly re-colors every Hub surface (background, cards,
      buttons, nav) with zero leftover hardcoded values for the 7 theme-variable tokens
      specifically — confirmed by grepping `src/components/` for each token's hex, not by
      eyeballing. (Each Skill World's per-world `color` field is correctly left untouched — see
      §3.2. **Literal `bg-white` is a different story as of §3.2a — see the Dark Mode criteria
      below; it is no longer universally "correctly left alone."**)
- [ ] Ocean and Jungle particle positions are generated inside `useEffect` + state, matching the
      existing `Starfield.tsx` pattern exactly — verified by confirming the dev build has no
      hydration/prerender warnings after adding them.
- [ ] A child with `activeTheme: null` (mid-Tutorial-Island, before the picker step) correctly
      renders in the Space theme by default, with no special-case code outside `ThemeProvider`.
- [ ] Functional colors (success/attention/warning/text) are visually identical across all 3
      themes — confirm by comparing screenshots, not just reading the CSS.
- [ ] `ThemeAmbience.tsx` renders the correct particle system per theme, matching §3.3's
      counts/sizes/motion, and respects `prefers-reduced-motion`.
- [ ] `WorldEntryOverlay` shows the correct emoji and verb copy per §3.4 for all 3 themes.
- [ ] The theme picker shows all 6 catalog entries in the fixed order from §3.5, with City/Magic/
      Sports dimmed, locked, and giving the toast feedback on tap rather than doing nothing.
- [ ] Changing theme from Settings uses the exact same `ThemePicker.tsx` component as Tutorial
      Island, not a second implementation, and swaps in place within the existing Settings panel
      rather than opening a second stacked modal.
- [ ] Locked theme tiles use the same lucide `Lock` icon as locked companions in `03`, and tapping
      one shows the exact toast styling from §3.5, not a silent no-op.
- [ ] `themes.constant.ts` matches §3.5's catalog table exactly (all 6 ids/emojis/names), and every
      picker tile — including the 3 locked ones — shows its emoji, never a blank box.
- [ ] Switching theme from Settings updates the companion's accessory badge quietly with no
      repeated reveal ceremony; the ceremony only ever plays once, during Tutorial Island.
- [ ] `PATCH /children/:id/theme` rejects the 3 unbuilt theme ids server-side, not just
      client-side.
- [ ] The theme-change fade transition plays on every switch, including a (near-instant, not
      skipped) version when `prefers-reduced-motion` is set.
- [ ] **Dark Mode (§3.2a):** toggling the new Settings row correctly re-colors all 13 tokens (not
      just the 7 brand ones) for whichever theme is currently active, with zero leftover literal
      colors — re-run the same hex-grepping check as the Light-mode criteria above, this time
      including `white`/`#ffffff`/`--sv-card`'s old assumption.
- [ ] All 6 theme × mode combinations (Space/Ocean/Jungle × Light/Dark) have been visually checked,
      not just Space — this is explicitly called out because the Light-mode retrofit above only
      needed Space verified carefully; Dark Mode needs all 6, since it's new code in all 6 cells.
- [ ] Dark Mode defaults to off or every new child/session, is **not** derived from
      `prefers-color-scheme`, and survives a page reload via `localStorage`.
- [ ] `SettingsPanel.tsx`'s own sheet background, `JourneyLine.tsx`'s stop markers, and
      `HeartButton.tsx`'s Calm Cove sheet (fixed in `03` §3.8) all correctly turn dark in Dark
      Mode — these were literal `bg-white`/`to-white` before this module's retrofit.
- [ ] The Primary Button resting-state fix (`CompanionPet.tsx`'s "Let's go," `WorldMap.tsx`'s
      "Enter," per `05`) and `HeartButton.tsx`'s icon-contrast fix (per `03` §3.8) are verified
      independently of Dark Mode — they're correct in Light mode too, not just Dark.
- [ ] White text on every theme's `--sv-primary-deep`, in both Light and Dark, still measures
      ≥4.5:1 — re-verify with real computed contrast if any of §3.2/§3.2a's exact hex values ever
      change, don't just eyeball a "looks fine" judgment.
- [ ] **Background Music (§3.3a):** off by default for a brand-new child, toggles correctly, and
      crossfades (not an abrupt cut) when the theme changes while it's playing.
- [ ] Each theme's ambient track loops correctly (a brief fade dip at the seam is accepted per
      `00a` §7.2 — not claimed as a perfectly seamless loop; a hard click/pop would still be a bug).
- [ ] Background Music correctly pauses when Quiet Sounds opens and resumes automatically on close
      (only if it was on before), keeps playing unmodified during an active mini-game session, and
      survives navigating between the Hub, World Home, and a mini-game without restarting — proving
      `ThemeProvider` is really where its `<audio>` element lives, not a page-specific component.
