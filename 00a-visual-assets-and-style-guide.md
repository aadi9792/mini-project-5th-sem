# Visual Assets & Style Guide
Read `00-global-context-and-rules.md` first.

**Scope note (added later, when sound effects were finally discussed — this doc's title predates
that but its own §1 rule already covers it correctly):** this doc also now owns the cross-cutting
**sound** asset/technical strategy (§8) for the same reason it owns cross-cutting visuals — sound
touches `03`, `04`, `07`, and `09` alike, so the strategy belongs in one place, not four.

## 1. Purpose and how to use this doc
This doc is the single source of truth for visual content that **crosses module boundaries** —
anything whose appearance depends on more than one module (e.g. a companion's look depends on
both `03-companion-system.md`'s catalog and `04-theme-system.md`'s active theme), or any asset
likely to need a real-art upgrade later. Per-module docs still own visual specs that are entirely
self-contained to them (e.g. the login page's exact color table lives in `01`, not here, because
nothing else needs it). Rule of thumb: if only one doc needs an answer, it stays in that doc; if
two or more docs need the same visual answer, it belongs here, and those docs cross-reference it
instead of repeating it.

This doc grows over time — it is not meant to be "finished" after this first pass. As `04`, `05`,
`06`, `07`, and `09` get written, each should add its own cross-cutting visual content here (see
§7) rather than duplicating it inline.

---

## 2. Current global asset strategy
No bespoke illustration exists anywhere in the project yet. Every character/companion/decorative
visual uses an **emoji-in-a-gradient-badge placeholder**: a circular badge,
`bg-gradient-to-br from-sv-primary to-sv-secondary`, with the relevant emoji centered — this is
the exact pattern already established in the real, currently-built `CompanionPet.tsx`. This is a
deliberate, stated choice for the prototype phase, not an oversight, and every placeholder
described in this doc is meant to be swappable for real art later without changing layout or
behavior code (see §6).

UI chrome (buttons, nav icons, etc.) uses `lucide-react` exclusively — don't introduce a second
icon library for that purpose. Decorative/character content uses emoji placeholders, never lucide
icons, and the two systems are never mixed for the same purpose.

---

## 3. Companion visuals (cross-cutting content only — see `03-companion-system.md` for the full
catalog, evolution stages, and behavior, which are not repeated here)

### 3.1 Base badge
Applies identically to all 6 companions: circular badge,
`bg-gradient-to-br from-sv-primary to-sv-secondary`, the species' emoji centered (see `03` §3.3/
§3.4 for exactly which emoji belongs to which species — that table is the single source for this,
not repeated here, to avoid the two docs drifting apart).

### 3.2 Theme accessory badges (the actual cross-cutting piece)
**Policy: one small accessory badge per theme, applied uniformly to any companion, regardless of
species or evolution stage.** This deliberately keeps the combinatorial space small (3 badges
total, not a unique illustration per companion-per-theme combination) while still visually
communicating the active theme:

| Theme | Accessory badge emoji | Treatment |
|---|---|---|
| Space | 🚀 | Small circle badge, `--sv-primary` background, positioned bottom-right of the base badge (§3.1), sized ~35% of the base badge |
| Ocean | 🌊 | Same treatment, swapped emoji. Background stays `--sv-primary` (the token) — **not** a stale hedge anymore: `04-theme-system.md` has long since defined Ocean's own `--sv-primary` value (`#2aa9a0` Light / `#36c9bd` Dark), so this badge already shows Ocean's real accent color automatically via the normal token cascade, no special-casing needed |
| Jungle | 🌿 | Same treatment, swapped emoji — same automatic token resolution as Ocean |

This badge is **additional to**, not a replacement for, the evolution-stage ring/glow effects
defined in `03` §3.5 — both can be visible at once (e.g. a Stage 3 companion in the Ocean theme
shows both the pulsing glow and the small 🌊 badge in the corner).

True bespoke illustration (e.g. a robot visibly wearing a tiny space helmet, rather than a generic
badge overlay) is a real future upgrade — see §6 — not required for the current placeholder phase.

---

## 4. Asset file conventions (for when real art eventually replaces placeholders)
- Real image assets, whenever created, live under `skillverse-app/public/assets/{category}/
  {id}.svg` (or `.png`) — e.g. `public/assets/companions/robot.svg`,
  `public/assets/themes/ocean/accessory-badge.svg`.
- Prefer SVG for simple iconography (scales cleanly, small file size); PNG only where complex
  gradients/textures don't vectorize well.
- Alt text / `aria-label` rules for each asset are defined in the module doc that introduces that
  asset (e.g. `03` already specifies the companion badge's `aria-label` pattern) — this doc
  doesn't duplicate those rules, only file/naming conventions.

## 5. Icon usage conventions
- UI chrome: `lucide-react`, consistent sizing — 16px inline with text, 20–24px for standalone
  buttons, matching what's already used in the real `HeartButton.tsx`/`SettingsPanel.tsx`.
- Decorative/character/world/companion visuals: emoji placeholders per §2.

## 6. Future real-art upgrade path (informational only, not scheduled)
When real illustrated art is eventually commissioned or generated, every component referencing a
placeholder emoji should do so through a single lookup (e.g. a `companionArt[speciesId]` map,
`themeAccessory[themeId]` map) rather than inline emoji literals scattered across components — so
swapping in real art later is a data change, not a refactor. This is a recommendation for how
code should already be structured when it's built now, not a future task to schedule separately.

## 7. Sound asset & technical strategy (added later — resolves a real, previously-unaddressed gap)

Until now, sound had a global on/off toggle (`00` §6.4, `04`'s `localStorage` retrofit) and exactly
one specified use case (`07`'s mini-game correct/incorrect chimes) — no asset strategy, no
technical mechanism, and one named, already-built, completely inert feature (`HeartButton.tsx`'s
"🎧 Quiet sounds" button — confirmed in the real code: a plain `<button>` with no `onClick` at all).
This section is the sound equivalent of §2's visual placeholder policy.

### 7.1 Two different kinds of sound, two different sources — a deliberate split
- **Short UI feedback cues** (mini-game correct/incorrect, the reward/celebration chime, §7.4) are
  **fully synthesized in code via the Web Audio API** — oscillator-based tones, zero audio files,
  zero asset sourcing. This is the sound-equivalent of the emoji-placeholder policy: cheap,
  consistent, and good enough for short, simple feedback blips.
- **Longer, ambient audio** (Calm Cove's Quiet Sounds, §7.2; the per-theme background track, §7.3)
  uses **real short looping audio files** — synthesized tones can't convincingly fake rain or ocean
  waves, and these moments are explicitly about genuine calm, not a quick blip. Actually sourced
  from **Wikimedia Commons' CC0/Public Domain audio collection** (not Pixabay/Freesound, which
  require an API key/login for real downloads — Wikimedia Commons' files are directly downloadable
  with per-file licensing stated plainly on each file's page), one exception noted in the next
  bullet. **Honesty-rule note:** these are real public-domain field recordings, not original
  composition — same honest framing as the mascot/companion emoji placeholders being explicitly
  not bespoke art.
- **One deliberate exception: the Space theme's ambient track (`04` §3.3a) is fully synthesized,
  not sourced**, via simple layered sine tones + a quiet noise bed — there's no real "sound of
  space" to honestly record, so synthesis is actually the *more* honest choice for this one
  specific track, not a shortcut. Every other ambient track (Ocean, Jungle, all 4 Quiet Sounds) is
  a genuine field recording; this is the one intentional departure, not an inconsistency.
- **The 7 real files this policy needed now actually exist in the workspace, sourced and
  processed for real** (not just specified — done while this gap was being closed): all real CC0/
  Public Domain, sourced from Wikimedia Commons, trimmed to a clean short loop and normalized
  locally. Full source/license table in `skillverse-app/public/sounds/SOURCES.md` — check there
  before assuming any of this needs re-sourcing.
- **File convention, and a real format correction made while actually sourcing these files**
  (parallel to §4's `public/assets/` convention): `skillverse-app/public/sounds/{category}/
  {id}.ogg` **and** `{id}.mp3`, both provided for every file — not `.mp3` alone as an earlier draft
  of this section said. Two real reasons, found during actual implementation, not anticipated
  up front: (1) `.ogg` loops seamlessly with no gap, while MP3 encoders pad the start/end of every
  file with a few milliseconds of silence, causing an audible click/stutter at the loop seam — so
  `.ogg` is the primary format for anything that loops; (2) Safari/iOS doesn't support Ogg Vorbis
  playback at all, so `.mp3` has to exist too, purely as its fallback. Real playback code must
  provide both via multiple `<source>` elements inside the `<audio>` element — never `.ogg` alone,
  or Safari users get silence with no error.
- **Playback mechanism:** a tiny shared `useSound(baseId, { loop, volume })` hook wrapping a native
  HTML5 `<audio>` element for file playback — it takes a base id (e.g. `"quiet/rain"`) and renders
  both `<source src="/sounds/quiet/rain.ogg" type="audio/ogg">` and `<source
  src="/sounds/quiet/rain.mp3" type="audio/mpeg">` so the browser picks whichever it supports,
  never a single hardcoded extension. A separate small `playTone(freq, duration)` helper uses
  `AudioContext`/`OscillatorNode` for synthesized cues. No third-party audio library (e.g.
  Howler.js) — this app never has more than one or two sounds active at once, so the native APIs
  are enough and keep the dependency list small.
- **No volume slider exists anywhere** (confirmed dormant, `02` §4.4a) — every sound plays at one
  fixed, deliberately moderate level (synthesized tones) or each file's own mastered loudness (real
  audio files, normalized when sourced) — never jarring, per `00` §6.4's "no sudden/loud sounds"
  rule. This isn't a gap to fill later; it's consistent with there being no granular volume control
  anywhere in this app's actual design.

### 7.2 Calm Cove's "Quiet sounds" (owned by `03-companion-system.md` §3.8, which already edits
`HeartButton.tsx` directly — specified here only because the asset/technical approach is
cross-cutting; the feature itself stays local to `03`, per this doc's own §1 rule)
- Tapping the existing "🎧 Quiet sounds" button expands into **4 looping options**, icon + label
  each (never icon alone): 🌧️ Rain, 🌊 Ocean Waves, 🍃 Gentle Wind, 🤍 White Noise.
- Tapping one starts that track looping; tapping it again (or picking a different one) stops/
  swaps it. Only one plays at a time. **Honest correction on loop quality, found by actually
  measuring the real files, not assumed:** the processing pass that created these files (§7.1)
  applied a fade-in/fade-out at each clip's edges rather than a true crossfade loop — measured
  directly with `ffprobe`/`volumedetect`, these fades go to actual silence at both ends. Looped
  back-to-back, that produces an audible brief dip at each loop point, not a genuinely seamless
  loop. **Decision: kept as-is for this phase** — a short periodic dip in a quiet ambient bed is
  an acceptable placeholder-quality rough edge, not worth a second processing pass right now — but
  it's real, not hidden: nowhere in this doc set should claim these specific files loop with zero
  audible seam. A proper future fix would crossfade each clip's tail into its head instead of
  fading either end to silence.
- **Deliberately independent of the global Sound toggle** — this is a tool a child/guardian
  *intentionally opened* specifically for calming audio, not an incidental UI effect, matching
  `00` §7's "every regulation feature reachable in every mode" principle. Turning Sound off (for
  game chimes, etc.) never silences this.
- **Stops automatically when Calm Cove is closed** — no persistent mini-player exists anywhere
  else in this app's design, so a track doesn't keep playing in the background after the sheet
  closes. Loops indefinitely otherwise (no auto-cutoff timer) — a child may want it running for a
  while, and this is exactly the kind of feature where cutting it off arbitrarily would undercut
  its purpose.
- **Pauses the theme's Background Music (§7.3) automatically while open, resumes it automatically
  on close if it was playing before** — a real interaction gap found and resolved during this
  doc's own final review: without this, a child with Background Music on would hear two ambient
  beds layered at once the moment they opened Quiet Sounds, which defeats the point of a *calming*
  tool. This pause/resume is local to the Calm Cove session only — it never touches the
  `sv-background-music` toggle's actual saved state, so Background Music correctly comes back
  exactly as the child left it.

### 7.3 Per-theme ambient background track (owned by `04-theme-system.md`, extending its ambience
work — a new feature, not previously discussed in any direction until now)
- One soft, short, looping ambient bed per theme (Space/Ocean/Jungle) — real audio files per
  §7.1's convention (`public/sounds/ambient/{themeId}.ogg`+`.mp3`) — all 3 already exist in the
  workspace, Space synthesized per §7.1's noted exception, Ocean/Jungle real recordings. (Not
  claimed as a *perfectly seamless* loop — see §7.2's honest correction on the actual fade-based
  processing used; applies equally here.)
- **A new, separate "Background Music" row in `SettingsPanel.tsx`**, below the existing "Sound"
  row — its own toggle, not folded into the Sound toggle, since someone might want game chimes on
  without the ambient bed or vice versa. **Off by default** for every child, regardless of any
  derived preference — this is deliberately not treated like `soundDefaultOn` (`02` §4.4a), since
  starting with *any* autoplaying audio, however soft, would cut against `00` §6.4's "no
  autoplay, no unsolicited sound" rule as a default. It's an explicit, manual opt-in only.
- Switching theme while Background Music is on crossfades to the new theme's track, reusing the
  same brief fade technique already used for the theme-switch visual transition (`04` §3.2) —
  one unified "theme is changing" moment, not two uncoordinated transitions.
- Independent of Dark Mode (a color-only toggle) and of Calm Mode (which governs motion, not
  audio, per existing precedent) — neither affects whether or how this track plays.
- **Keeps playing during an active mini-game session, deliberately — a real interaction decided
  during this doc's final review, not left implicit:** it's a soft ambient bed, not something that
  needs to duck for every sub-screen; the mini-game's own correct/incorrect chimes (`07` §3.2) are
  short and infrequent enough that they don't meaningfully compete with a quiet background track.
  The only thing that *does* pause it is Quiet Sounds (§7.2's pause/resume rule) — that's the one
  real "two ambient beds at once" problem, and it's the only case actually solved.
- **Architecture note for whoever builds this:** the `<audio>` element driving this must live in a
  component that persists across route changes (e.g. `ThemeProvider`, which already wraps the
  whole child-app and manages `data-theme`/Dark Mode state) — not inside a page-specific component,
  or it would restart/cut out on every navigation between the Hub, World Home, and a mini-game.

### 7.4 Reward/badge/level-up celebration chime (owned by `09-rewards-and-economy.md`)
- A short, synthesized (§7.1), warm ascending chime (3–4 notes, gentle — never a loud fanfare)
  plays whenever a badge, a Collectible, or a level-up is newly earned — the same moments that
  already get a visual celebration, reinforcing it rather than adding a new one.
- **This one *does* respect the global Sound toggle** — unlike Quiet Sounds (§7.2), this is an
  incidental UI reinforcement effect, not a deliberately-sought tool, so it follows the same rule
  as the mini-game correct/incorrect cues.
- Plays regardless of the `prefers-reduced-motion` setting — that setting governs *visual* motion
  specifically; reducing celebratory animation doesn't imply a child also wants less audio
  feedback, a different accessibility axis.

## 8. Growing this doc
As each new doc gets written, the actual pattern that's emerged is: **most module-specific visual
content stays local to that doc**, and only genuinely cross-cutting content (needed by 2+ docs)
gets added here — this section's original forward-looking list assumed more content would end up
centralized than actually has. Updated as docs are written:
- `04-theme-system.md` — **done.** Full theme color/ambience/switching detail stayed entirely in
  `04` itself (not cross-cutting — nothing else needs to look those values up directly). Only the
  companion accessory badges in §3 above were genuinely shared, and already live here.
- `05-hub-shell.md` — **done.** The "recommended world" ring/badge and the Rocket Launch Timer/
  Power-Down Ritual theme copy both stayed local to `05`, per the same rule — they're Hub-specific,
  not shared with any other doc.
- `06-skill-world-template-and-catalog.md` — **done.** Each world's signature color and per-theme
  name stayed local to `06` (world-specific, not shared) — nothing new added here.
- `07-mini-games.md` — **done, stayed local.** Game-specific emoji banks (Face Detective's 12
  emotions, Volcano Scale's scenarios) follow `00a` §2's placeholder-first policy but aren't
  referenced from any other doc, so they stayed in `07` itself — same pattern as `09`.
- `08-adaptive-difficulty.md` — **done, nothing added.** This doc is pure logic/data (tier
  calculations, the regulation-state "refund" formula) with no new visual content of its own; it
  reuses tier-change companion lines already defined in `06`/`03`. Nothing cross-cutting to add.
- **Stale-reference check (found during a full UI/visual spec audit):** `00` §6.2.1, §6.7, and
  §6.8 added new cross-cutting rules (verified contrast, device/responsive strategy, dark-mode and
  favicon non-goals) directly to `00` itself rather than here, since they're system-wide policy,
  not *visual asset* content specifically — correctly out of this doc's scope per §1 above.
- **Dark Mode (added later, `04` §3.2a) also correctly stayed out of this doc.** It's a color-token
  architecture question (which `--sv-*` values exist per mode), not an *asset* question (no new
  emoji/icon/illustration conventions were needed) — owned entirely by `00` §6.2.1 (the ink/
  contrast rules) and `04` §3.2a (the palette and mechanism), consistent with this doc's own
  "most things stay local" pattern above.
- `09-rewards-and-economy.md` — **done, and it turned out to stay local after all.** Badges,
  Collectibles, and the Avatar/Shop catalogs are all fully self-contained to `09` §3.3/§3.8–3.10 —
  none of them are actually referenced from a second doc the way the companion accessory badge
  is, so per this doc's own rule (§1), they didn't need centralizing here. Worth noting since this
  section guessed otherwise before `09` was written.
- **Sound effects (added much later — a real gap found when the user asked directly whether sound
  had ever been discussed).** Genuinely cross-cutting this time, unlike most additions above: the
  asset/technical strategy now lives here (§7), touching `03` (Quiet Sounds), `04` (the per-theme
  ambient track + Settings row), `07` (mini-game chimes), and `09` (the celebration chime) all at
  once — exactly the "needed by 2+ docs" case this doc's §1 rule says belongs here, not local to
  any one of them.
