# Module: Companion System
Read `00-global-context-and-rules.md`, `01-auth-and-account.md`, and
`02-child-profile-and-personalization.md` first.

**Scope of this doc:** the companion catalog (starters + unlockable), picking and naming a
companion during Tutorial Island, the Companion Closet (viewing/renaming/swapping), evolution
stages, and the companion's reactive behavior to a child's emotional state (the zone check-in
mechanic, specified here because the companion is what makes it meaningful). It does **not**
cover: theme mechanics (`04-theme-system.md` — note the Companion Invariance Rule below is the
companion-system equivalent of that doc's Theme Invariance Rule), exactly how a companion looks
while a given theme is active (the theme accessory badge — see
`00a-visual-assets-and-style-guide.md` §3, which is the authoritative source for that, to avoid
this doc and `04` drifting apart on it), the Hub shell itself (`05-hub-shell.md`, though this doc
requires changes to it — see §2), or the XP/leveling math that drives unlocks
(`09-rewards-and-economy.md`, not written yet — see the dependency note in §2 before assuming
this module can be fully finished end to end).

---

## 1. How to Use This Document

**Step 0:** nothing new to set up.

**Step 1 — backend first.** Tell the agent:
> "Read docs `00`, `01`, `02`, and `03-companion-system.md`. Build the backend in Section 4: the
> `CompanionTemplate`, `ChildCompanion`, and `ZoneCheckIn` models, seeded with the catalog in
> §3.3/§3.4, and the endpoints in §4.4. Note that unlock-level checks depend on a child's level,
> which doesn't exist until `09-rewards-and-economy.md` is built — stub that check to always
> treat level-gated companions as locked for now (see §4.3), don't invent a leveling system here."

**Checkpoint after Step 1:** confirm the catalog endpoint returns all 6 companions with correct
lock status, confirm adopting a starter auto-activates it on a child's first adoption, confirm the
naming filter rejects an obviously bad test name, confirm a zone check-in returns the right
companion reaction for each of the 4 states.

**Step 2 — frontend second.** Tell the agent:
> "Build the frontend in Section 3: the Tutorial Island companion picker (§3.6), the Companion
> Closet (§3.7), the zone check-in addition to the existing Heart Button (§3.8 — this means
> editing `HeartButton.tsx`, not replacing it), and the Hub companion widget update (§3.9 — this
> means editing `CompanionPet.tsx`, which currently always shows a hardcoded 🌟 with no species
> logic at all)."

**When this module is "done":** `09-rewards-and-economy.md` now exists and provides the real
leveling data this doc's unlock-gating and evolution stages depend on (`09` §3.7) — re-verify
every item in §7 against real level data before marking §2 🟢, rather than the permanently-stubbed
state this doc originally shipped with.

---

## 2. Current Status

🔴 **Nothing in this doc is built yet.** Two things to know before starting:
1. The existing `CompanionPet.tsx` on the Hub is a static placeholder — fixed emoji, fixed name/
   line props, a "Let's go" button with no handler. Building this module means rewriting it, not
   extending it.
2. The existing `HeartButton.tsx`'s Calm Cove has no zone check-in step — just a breathing circle
   and two inert buttons (one of them, "🎧 Quiet sounds," has zero `onClick` at all). §3.8
   specifies what needs to be added to this existing component.
3. **One piece of this is already further along than the rest:** the 4 real audio files §3.8's
   "Quiet sounds" needs already exist in the workspace (`public/sounds/quiet/`, `00a` §7.1/7.2) —
   only the component code to actually use them doesn't. Don't re-source these when building this.

---

## 3. Frontend & UI

### 3.1 Visual system
All screens in this doc are **child-facing** and use the Hub's existing playful visual language
— reuse the actual classes/patterns already in the codebase (`rounded-2xl` cards, `bg-sv-card-
tint`, `font-heading` for names/headlines, `font-body` for description text, the existing gentle
Framer Motion float/bob animations already used in `CompanionPet.tsx`), not the utilitarian Auth
style from `01`. No new color tokens are needed. Every companion is shown as an emoji inside a
circular gradient badge (the same visual treatment the current placeholder already uses:
`bg-gradient-to-br from-sv-primary to-sv-secondary`), consistent with the project's established
"placeholder emoji instead of bespoke art" approach — real illustrated companion art is a future
asset upgrade, not a blocker.

### 3.2 The Companion Invariance Rule (the core design constraint for this doc)
Mirrors the Theme Invariance Rule from `00` §6.6. **Every companion species behaves identically —
same mood-mirroring logic, same suggestion behavior, same evolution stages, same XP source.**
Only the emoji, display name, and personality blurb differ between species. Never make one
species "better" at regulation support than another, and never let the active companion's species
change any game mechanic anywhere in the app. Switching companions is a pure identity/cosmetic
choice.

### 3.3 Starter companion catalog (always available, no level requirement)

| Species id | Display name | Emoji | Personality blurb (shown on the picker card) |
|---|---|---|---|
| `robot` | Robot | 🤖 | "Curious and clever, always ready to figure things out with you." |
| `dragon` | Dragon | 🐉 | "Bold and playful, loves cheering you on for every brave step." |
| `owl` | Owl | 🦉 | "Calm and thoughtful, great for quiet moments together." |

### 3.4 Unlockable companion catalog (level-gated)

| Species id | Display name | Emoji | Personality blurb | Unlocks at |
|---|---|---|---|---|
| `fox` | Fox | 🦊 | "Clever and quick, loves a good challenge." | Level 5 |
| `turtle` | Turtle | 🐢 | "Steady and patient, always has time for you." | Level 10 |
| `octopus` | Octopus | 🐙 | "Creative and flexible, good at trying new things." | Level 25 |

These levels are deliberately the same milestones as the evolution stages in §3.5 — reaching
level 5/10/25 both evolves the active companion's look *and* unlocks a new one to adopt, so each
milestone pays off twice.

### 3.5 Evolution stages (applies globally, to whichever companion is active)
Evolution is tied to the **child's overall level**, not to any individual companion — swapping
the active companion never resets or changes evolution progress, since there's only one evolution
track per child, applied to whichever companion they currently have active. No custom art exists
yet, so evolution is expressed purely through simple visual treatment of the existing emoji-badge:

| Stage | Level range | Name | Visual treatment |
|---|---|---|---|
| 1 | 1–4 | Hatchling | Badge as currently built, no extra effects |
| 2 | 5–9 | Companion | Add a small colored ring around the badge (`--sv-attention`, 2px) |
| 3 | 10–24 | Trusted Companion | Add a soft pulsing glow behind the badge (respects reduced-motion — static glow if so) |
| 4 | 25+ | Hero's Companion | Badge grows 15% larger, glow becomes permanent, add a small ⭐ sparkle badge overlay in the corner |

### 3.6 Tutorial Island — Companion Picker (step 2 of `02` §3.6)
1. **Picker screen** — Headline: **"Meet your companions!"** Three cards (§3.3), each showing the
   emoji badge, display name, and personality blurb. Tapping one selects it (no "confirm" step
   needed, tapping is the commitment, consistent with "no unsolicited friction" — but see step 2
   for the real commitment point, naming).
2. **Naming screen** — Headline: **"What will you call your {displayName}?"** Text field, 2–15
   characters. Button: **"That's the name!"** Validation (see §4.2 for the filter mechanics):
   - Empty or too short/long: **"Give your companion a name (2–15 letters)."**
   - Filter-rejected name: **"Let's pick a different name for your companion."** (deliberately
     vague/non-accusatory — never tell a child their chosen word was flagged as inappropriate)
3. **Confirmation screen** — Headline: **"It's nice to meet you, {customName}!"** Shows the newly
   named companion with a small celebratory animation (gentle, per `00` §6.5). Button:
   **"Let's go!"** — proceeds to the theme picker (`04-theme-system.md`).

### 3.7 Companion Closet (post-Tutorial-Island, reachable from the Hub)
Opened by tapping the Companion widget on the Hub (§3.9) — this is the ≤2-tap entry point, no new
nav item needed.
- Headline: **"Your Companions"**
- A grid of all 6 catalog entries, in this fixed order: the currently active companion first
  (visually highlighted, e.g. a `--sv-primary` border), then any other owned companions, then the
  remaining available-but-unadopted starters, then locked companions in ascending unlock-level
  order. Unlocked-and-owned: full color, tappable. Unlocked-but-not-yet-adopted (the 2 other
  starters): full color with a small **"New!"** badge, tappable to adopt instantly (opens the
  naming screen from §3.6 step 2, reused). Level-locked: dimmed, with a small lock icon and
  **"Unlocks at Level {n}"** label, not tappable.
- Tapping an owned companion that isn't currently active shows a confirm sheet: **"Make
  {customName} your active companion?"** with **"Yes, switch"** / **"Not now"** — switching is
  instant and free, no cost, any time, matching the gentle/no-punishment philosophy.
- The currently active companion has a **"Rename"** link (reuses the naming screen's validation).

### 3.8 Zone check-in (addition to the existing `HeartButton.tsx` Calm Cove)
This doesn't replace the existing Calm Cove (breathing circle, "ask a grown-up," "quiet sounds")
— it adds a check-in step **before** those options, so the companion can react.

**"Quiet sounds" finally gets real behavior (resolved when sound effects were discussed properly
for the first time — this button has existed in the real code with zero `onClick` handler this
entire project, confirmed by reading `HeartButton.tsx` directly; full asset/technical approach is
cross-cutting and lives in `00a` §7.2, specified here since this is the doc that already edits this
file; the real audio files themselves — not just the spec — now exist too, see §4.4's file tree):**
tapping it expands into 4 looping options — 🌧️ Rain, 🌊 Ocean Waves, 🍃 Gentle Wind, 🤍
White Noise — tapping one loops it, tapping again (or picking another) stops/swaps it, and closing
Calm Cove stops whatever's playing. Works regardless of the global Sound toggle's state (`00a`
§7.2's independence rule) — a child who opened Calm Cove specifically for this must never find it
silent just because they'd turned off game chimes elsewhere. **Also pauses `04`'s Background Music
(if it's on) the moment Calm Cove opens, resuming it automatically on close** — resolved during a
later final gap-check (full reasoning in `00a` §7.2/`04` §3.3a); this is the one real place in the
whole app where two ambient audio beds could otherwise overlap.
- When the Heart Button opens, show the check-in first: Headline: **"How are you feeling?"** Four
  large tappable options, each icon + label together (never color alone, per `00` §6.2):
  - 😌 **Calm**
  - 🙂 **Okay**
  - 😟 **Worried**
  - 🌋 **Big Feelings**
- After a selection, show the companion's reaction line (exact mapping in §4.3) above the
  existing Calm Cove tools, which remain visible/available regardless of which zone was picked —
  the check-in informs the companion's words, it never gates access to the calming tools
  themselves.
- This check-in is always optional to answer in detail — tapping the Heart Button and going
  straight to "quiet sounds" without checking in at all must still work exactly as it does today.
- **Fix while this file is open anyway (a real, pre-existing contrast bug found during `04` §3.2a's
  Dark Mode design, unrelated to Dark Mode itself):** the floating Heart button icon currently uses
  `fill-white` on `bg-sv-warning`, measuring only 2.52:1 — fails WCAG's 3:1 non-text-contrast
  minimum for a meaningful icon, in Light mode, today. Since this module already edits
  `HeartButton.tsx` directly, fix it here: change the icon to use the `--sv-ink` token (`#2e3350`,
  `00` §6.2.1) instead of white — measures 4.89:1, safe in both Light and Dark mode (it's a fixed
  token, never overridden by theme or mode).
- **Second fix, required for Dark Mode (`04` §3.2a) to actually work on this screen:** the modal
  sheet's background (`bg-gradient-to-b from-sv-bg-soft to-white`) has a literal `to-white` stop —
  once `--sv-card` has a real Dark value, this literal stop would stay white even in Dark Mode.
  Change it to `to-sv-card`.

### 3.9 Hub companion widget — required rework
`CompanionPet.tsx` currently renders a hardcoded 🌟 regardless of species and has no interaction.
It needs to:
- Render the active companion's actual emoji + evolution-stage visual treatment (§3.5), not a
  fixed star.
- Become tappable, opening the Companion Closet (§3.7).
- Show an **ambient idle line**, not the zone check-in reaction lines (resolves a real gap — the
  widget's day-to-day text was never actually defined before now). This is a separate, simpler
  system from §4.3: pick at random from a fixed pool on each Hub load, not tied to any check-in:
  - "Ready for an adventure, {nickname}?"
  - "I'm here whenever you need me!"
  - "Let's see what's new today!"
  - "You're doing great — keep going!"
  - "Pick a quest and let's go!"

  **The zone check-in reaction lines from §4.3 only ever appear inside the Heart Button modal at
  the moment of check-in** — they never update this widget's idle line. Keeping these two
  systems separate avoids ambiguous state like "how long should a reaction line persist on the
  Hub."
- Keep the existing `aria-label="{name}, your companion pet"` pattern (already present in the
  current code) — update it to use the companion's real `customName`, don't drop it during the
  rewrite.
- The existing "Let's go" button's destination is out of scope for this doc — it depends on
  `recommendedWorldOrder` (from `02` §4.4) and the Today's Quests widget, which belongs to
  `05-hub-shell.md`'s rework, not here. Leave it pointing at a sensible default (the first
  recommended world) and flag it as a `05` concern if it needs more.

### 3.10 Accessibility & motion
Same bar as every other module (`01` §3.9, `02` §3.9): every interactive element in the picker,
naming screen, Closet, and zone check-in is keyboard-navigable with a visible focus ring; step/
screen changes and the companion's reaction line are announced via `aria-live="polite"`; the
evolution-stage glow (§3.5) and any adoption/celebration animation respect
`prefers-reduced-motion` exactly as the Hub already does, with glow effects becoming static
rather than animated when it's set.

### 3.11 What this module hands off to other docs
- `05-hub-shell.md` must be updated per §3.9 — this is required rework, not optional polish.
- `09-rewards-and-economy.md` owns the child's level, which this module depends on for every
  unlock-gated companion and for evolution stage. **Now resolved:** `09` §3.7 makes this real —
  level-gated companions and evolution stages compute against the actual level instead of being
  permanently stubbed. (While building this module before `09` existed, treating all level-gated
  companions as locked and evolution as Stage 1 was the correct honest placeholder — not something
  to fake around.)
- `04-theme-system.md` owns companion accessories per theme (the "dressed for the adventure"
  reveal) — this doc only hands off the chosen, named companion to that step; the exact accessory
  mechanism lives in `00a-visual-assets-and-style-guide.md` §3.2.
- **Resolved, now that `10-guardian-dashboard.md` is written:** its Mission Report (§3.2 there)
  reads this module's `ZoneCheckIn` table directly, showing a plain weekly count per zone — no
  interpretation or "regulation strategies used" scoring was actually built (the Calm Cove's
  individual tools, e.g. breathing circle vs quiet sounds, were never tracked per-use — only the
  check-in's zone itself is real data, per `09` §3.x's own honesty finding about untracked UI).
  This module only needed to keep logging check-ins accurately; it still doesn't build any
  reporting view itself.
- `06-skill-world-template-and-catalog.md` **extends** this module (added after this doc was
  written) with the companion's presence inside Skill Worlds — a world-specific greeting, a
  persistent in-game reaction badge, session-end encouragement, and Boss Battle cheering. None of
  that changes anything defined here; it's purely additional behavior layered on top of the
  Companion Invariance Rule and Companion Closet this doc already owns.

---

## 4. Backend & File Architecture

### 4.1 Prisma models this module owns

```
CompanionTemplate {
  speciesId        String   @id            // "robot" | "dragon" | "owl" | "fox" | "turtle" | "octopus"
  displayName      String
  emoji            String
  personalityBlurb String
  isStarter        Boolean  @default(false)
  unlockLevel      Int?                     // null when isStarter is true
}
// Seeded once from §3.3/§3.4 — this is fixed catalog data, not guardian/child input.

ChildCompanion {
  id          String   @id @default(cuid())
  childId     String
  speciesId   String                        // references CompanionTemplate.speciesId
  customName  String                        // the child-given name
  isActive    Boolean  @default(false)
  adoptedAt   DateTime @default(now())
}
// Exactly one row per childId may have isActive: true — enforced in the service layer, not a DB
// constraint (SQLite doesn't make a partial-unique-index trivial here; a transaction that
// deactivates all others before activating one is the simpler, equally correct approach).
// Duplicate customName values across a child's own companions are allowed and not validated
// against each other — not worth the complexity for a low-stakes cosmetic field.

ZoneCheckIn {
  id        String   @id @default(cuid())
  childId   String
  zone      String                          // "calm" | "okay" | "worried" | "big_feelings"
  createdAt DateTime @default(now())
}
```

### 4.2 Naming filter (exact mechanics, and an honest limitation)
Use a simple, free, open-source profanity word-list library (e.g. the `bad-words` npm package) to
check `customName` against a blocklist, case-insensitively, substring-aware. If it matches,
reject with the vague copy from §3.6 (never explain *why* to a child). **Be honest about this
filter's limits**: a word-list filter is not perfect moderation — it can miss creative misspellings
and can occasionally false-positive on an innocent word. That's an accepted, stated limitation for
a prototype, not something to silently oversell as "safe" in any copy or future documentation.

### 4.3 Zone check-in → companion reaction (exact mapping)
The companion's suggested strategy, when relevant, reads from the `regulationStrategyOrder`
derived parameter from `02` §4.4 — take the **first** entry in that array and phrase it using
this lookup:

| Strategy code | Spoken phrase |
|---|---|
| `quiet_time` | "take some quiet time" |
| `breathing` | "try a breathing exercise" |
| `trusted_adult` | "talk to a grown-up you trust" |
| `movement` | "get up and move around a bit" |

| Zone | Companion mood | Companion line |
|---|---|---|
| `calm` | Happy (default idle state) | A simple cheerful acknowledgment, e.g. "Glad you're feeling good!" |
| `okay` | Attentive | "Doing okay? I'm here if you want to chat." |
| `worried` | Concerned | "Want to {strategy phrase}? I'll come with you." |
| `big_feelings` | Gentle / calm (the companion visually becomes stiller/quieter itself — modeling calm, never mirroring distress) | "That's a big feeling. Let's go to the Calm Cove together?" |

### 4.4 API endpoints (`/api/v1/companions/...` and `/api/v1/zone-checkins`, all require an
authenticated guardian acting on behalf of their child)

| Method & path | Request body | Success response | Notes |
|---|---|---|---|
| `GET /companions/catalog` | — | `200 { companions: [{ ...template, locked, adopted }] }` | `locked` reflects §3.10's "always locked until `09` exists" stub for now |
| `POST /companions/adopt` | `{ speciesId, customName }` | `201 { companion }` | Rejects if `speciesId` is locked (not a starter and child's level < `unlockLevel`) or already adopted. Auto-activates if this is the child's first-ever companion (this is what powers the Tutorial Island flow — no separate endpoint needed for it) |
| `PATCH /companions/:id/rename` | `{ customName }` | `200 { companion }` | Same filter as adoption |
| `POST /companions/:id/activate` | — | `200 { companion }` | Deactivates all other `ChildCompanion` rows for this child first |
| `GET /companions/me` | — | `200 { active, owned: [...], evolutionStage: { stage: 1-4, name } }` | `evolutionStage` per §3.5's table, computed from the child's level (stubbed to `{ stage: 1, name: "Hatchling" }` until `09` exists) |
| `POST /zone-checkins` | `{ zone }` | `201 { mood, line }` | Per §4.3's table; also persists the `ZoneCheckIn` row |

### 4.5 File architecture

```
skillverse-backend/src/companions/
├── companions.module.ts
├── companions.controller.ts
├── companions.service.ts          # adoption/activation rules, §4.1's single-active enforcement
├── companion-catalog.seed.ts      # seeds CompanionTemplate rows from §3.3/§3.4 on first run
├── naming-filter.service.ts       # wraps the word-list library from §4.2
└── zone-checkins/
    ├── zone-checkins.controller.ts
    └── zone-checkins.service.ts   # §4.3's mapping logic

skillverse-app/src/app/(tutorial-island)/companion/
├── page.tsx                       # §3.6 step 1, the picker
├── name/page.tsx                  # §3.6 step 2
└── confirm/page.tsx               # §3.6 step 3

skillverse-app/src/components/
├── CompanionPet.tsx                # rewritten per §3.9, not a new file
├── CompanionCloset.tsx             # §3.7, opened from CompanionPet.tsx
└── HeartButton.tsx                 # edited in place to add §3.8's check-in step before the
                                     # existing Calm Cove content — the breathing circle and the
                                     # "ask a grown-up" button stay exactly as they are; also §3.8's
                                     # two Dark Mode-driven fixes: the modal sheet's
                                     # `to-white` gradient stop becomes `to-sv-card`, and the
                                     # Heart icon's `fill-white` becomes `--sv-ink`; and the
                                     # "Quiet sounds" button finally gets its §3.8 `onClick`,
                                     # using the shared `useSound` hook from `00a` §7.1

skillverse-app/public/sounds/quiet/   # §3.8/`00a` §7.2 — all 4 already real, sourced, and in the
                                        # workspace (`.ogg` + `.mp3` each, see SOURCES.md there),
                                        # not just specified — nothing left to source for this part
├── rain.ogg / rain.mp3
├── ocean-waves.ogg / ocean-waves.mp3
├── gentle-wind.ogg / gentle-wind.mp3
└── white-noise.ogg / white-noise.mp3
```

---

## 5. What You Need to Do, With Why

Nothing blocking. One small thing worth doing yourself before this is built: skim the 6
companions' personality blurbs (§3.3/§3.4) and the zone check-in copy (§3.8) — like the
questionnaire wording in `02`, these were written from our discussion but are worth a final human
read before they're locked into code.

---

## 6. Explicitly Out of Scope for This Module
- **Real illustrated companion art.** Emoji-in-a-badge placeholder, same pattern as every other
  module so far — a future asset upgrade, not a blocker.
- **The actual leveling/XP system.** Owned entirely by `09-rewards-and-economy.md`. This module
  only reads a child's level once it exists; it does not compute it.
- **Theme-specific companion accessories** (the "dressed for the adventure" visuals). The exact
  mechanism is authoritatively defined in `00a-visual-assets-and-style-guide.md` §3.2 (a uniform
  small accessory badge per theme, not a per-companion-per-theme illustration) — this doc doesn't
  restate it.
- **The Hub's "Let's go" button destination logic.** Flagged in §3.9 as a `05` concern.
- **Stronger-than-word-list content moderation** (e.g. an AI moderation API) for companion names.
  A basic filter was the explicit, deliberate choice — see §4.2's honesty note.
- **Multiple simultaneously-active companions, or per-companion separate evolution tracks.**
  Exactly one active companion at a time; evolution is global per child, not per companion — see
  §3.5.

---

## 7. Acceptance Criteria / Definition of Done

- [ ] All 6 companions appear correctly in the catalog endpoint, 3 marked always-unlocked
      (starters) and 3 marked locked (pending `09`).
- [ ] Adopting a starter for the first time auto-activates it; adopting a second companion later
      does not auto-activate it.
- [ ] The naming filter rejects an obvious test bad word with the vague, non-accusatory copy from
      §3.6 — never a message explaining why it was rejected.
- [ ] Only one `ChildCompanion` row per child ever has `isActive: true`, verified directly against
      the database after switching companions via the Closet.
- [ ] Switching the active companion is free, instant, and has zero effect on any game mechanic
      anywhere (Companion Invariance Rule, §3.2).
- [ ] All 4 zone check-in options return the correct mood/line from §4.3's table, and the
      "worried" line correctly reflects whichever strategy is first in that child's
      `regulationStrategyOrder` from `02`.
- [ ] The breathing circle and "ask a grown-up" tools still work exactly as before, now appearing
      after the new check-in step rather than being replaced by it.
- [ ] "Quiet sounds" now actually works — all 4 tracks loop correctly, tapping a second one swaps
      without overlapping audio, closing Calm Cove stops playback, and it keeps working with the
      global Sound toggle switched off (confirmed independently, not just assumed from the spec).
- [ ] The Hub's companion widget shows the real active companion's emoji and evolution-stage
      treatment, not the old hardcoded 🌟.
- [ ] The Hub widget shows an ambient idle line from §3.9's pool, and this line is never
      overwritten by a zone check-in reaction — the two systems stay visibly separate.
- [ ] The widget's `aria-label` correctly reads the active companion's real `customName`.
- [ ] The Companion Closet grid orders entries exactly as specified in §3.7 (active first, then
      owned, then available starters, then locked by ascending level).
- [ ] The theme accessory badge (`00a` §3.2) correctly appears on the companion regardless of
      which theme is active, once `04` exists to provide it.
- [ ] Every screen in this module is keyboard-navigable with visible focus rings, and the
      companion's reaction line is announced via `aria-live`.
- [ ] Now that `09-rewards-and-economy.md` exists, gated companions have been re-verified actually
      unlocking at the right real level (not the earlier permanently-locked stub) before this
      module is marked 🟢.
- [ ] A purchased companion accessory from `09`'s shop (§3.8) displays additively alongside this
      doc's existing free theme-accessory badge (`00a` §3.2), never replacing it.
