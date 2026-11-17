# Module: Child Profile & Personalization
Read `00-global-context-and-rules.md` and `01-auth-and-account.md` first. This doc picks up
exactly where Auth leaves off: a guardian has a verified account and no child profile yet.

**Scope of this doc:** the guardian-facing Create Child Profile form, the 12-question
personalization questionnaire, how answers become actual app behavior, and the high-level
sequencing of Tutorial Island (the child-facing handoff moment). It does **not** cover: login/
sessions (`01`), companion mechanics — picking, naming, unlocking (`03-companion-system.md`),
theme mechanics — the catalog, switching architecture (`04-theme-system.md`), the Hub itself
(`05-hub-shell.md`), the Skill World catalog (`06-skill-world-template-and-catalog.md`, which now
resolves *which* game Tutorial Island's step 4 uses), or the actual technical build of that game
(`07-mini-games.md`, not written yet — Tutorial Island's step 4 is a route reserved for it, not a
design placeholder anymore).

---

## 1. How to Use This Document

**Step 0:** nothing new to set up — this module needs no new third-party accounts beyond what
`01` already requires.

**Step 1 — backend first.** Tell the agent:
> "Read `docs/00-global-context-and-rules.md`, `docs/01-auth-and-account.md`, and
> `docs/02-child-profile-and-personalization.md`. Build the backend in Section 4: the `Child` and
> `ChildPreferences` Prisma models (added to the same `schema.prisma` file `01` created), the
> endpoints, and the derived-preferences function in §4.4. Pay close attention to §4.3's
> submission-order and partial-failure rules — don't start the frontend yet."

**Checkpoint after Step 1:** using a REST client against an already-authenticated guardian
session, create a child profile, submit all 12 questionnaire answers, and confirm the derived
parameters in §4.4 compute correctly for a few different answer combinations — spot-check at
least 3 of the 12 questions' mappings by hand against the table. Also deliberately kill the
request between the two submission calls described in §4.3 and confirm `GET /children/me`
reports the in-between state correctly.

**Step 2 — frontend second.** Tell the agent:
> "Build the frontend in Section 3: the Create Child Profile wizard (§3.2–3.5) using the exact
> copy, validation messages, and visual spec in §3.1, then the Tutorial Island sequence shell
> (§3.6) — note that the companion picker, theme picker, and the first mini-game's actual
> implementation are each owned by a different doc and may not exist yet (the first mini-game's
> *which-game-and-difficulty* question is resolved — see §3.6 step 4 — only its build is pending);
> use §3.6's dev-only stub approach for whichever of those
> aren't built yet, clearly labeled as temporary, not as fully working screens."

**Checkpoint after Step 2:** complete the full wizard as a guardian would, confirm the progress
indicator, chip selection limits, and Back/Next/Edit behavior all work, confirm the single-child
rule blocks a second profile, and confirm routing sends a guardian with an incomplete Tutorial
Island back to it on next login (not to the Hub) — per `01` §3.10 and §3.7 below.

**When this module is "done":** every item in §7 is checked and personally verified, same
standard as `01`. Update §2 below accordingly — note this module may stay 🟡 (partially done)
for a while, since Tutorial Island's step 4 genuinely can't be completed until `07-mini-games.md`
exists; that's expected, not a failure of this doc.

---

## 2. Current Status

🟡 **Backend and Frontend Wizard + Tutorial Island Sequence Shell are built and verified locally.**
- **Backend (`skillverse-backend/src/children/`)**:
  - `ChildrenController`, `ChildrenService`, and `PreferencesService` implemented with `AuthGuard`.
  - All 7 endpoints functional: `POST /children`, `GET /children/me`, `PATCH /children/:id/profile`, `POST /children/:id/preferences`, `PATCH /children/:id/preferences`, `GET /children/:id/preferences/derived`, `POST /children/:id/complete-tutorial`.
  - One-child-per-guardian enforced server-side (409 Conflict).
  - Derived preferences pure function tested with all 12 mappings (sound, motion, transitions, focus, regulation, instructions, guidance, predictability, motor, recommended world order).
  - Idempotent `complete-tutorial` logic verified.
- **Frontend (`skillverse-app/src/app/(child-setup)/` & `(tutorial-island)/`)**:
  - 8-step Create Child Profile wizard (`/create-profile`) with progress dots, field validation, interest chips (max 5), option rows, and review screen with edit jump-backs.
  - Tutorial Island sequence routes: `/handoff`, `/avatar`, `/companion`, `/theme`, `/first-game`, `/win`.
  - Child handoff & routing integration in `/continue-as`.
- Next step for human verification: test completing the wizard and Tutorial Island sequence in the browser.

---

## 3. Frontend & UI

### 3.1 Visual system — two different modes, plus the elements unique to this doc
- **The Create Child Profile wizard (§3.2–3.5) is guardian-facing and utilitarian.** It reuses
  the Auth module's visual design system **exactly** — same card shell, same `--sv-*` tokens,
  same fixed Space-palette default, same typography (see `01-auth-and-account.md` §3.1). A
  guardian filling this out wants speed and clarity, same reasoning as the login screen — so
  question options render as a **simple vertical list of selectable rows** (a radio circle or
  checkbox square + label, same visual weight as `01`'s consent checkboxes), **not** large
  illustrated choice cards. Don't make this wizard feel like a game screen.
- **New elements this wizard needs that `01` doesn't have:**
  - **Progress dots** (top of every step): 8 small circles. Completed steps: filled
    `--sv-primary-deep` with a small white checkmark. Current step: filled `--sv-primary`, 20%
    larger than the others. Upcoming steps: `2px` outline only, `--sv-text-soft` at 30% opacity,
    no fill.
  - **Interest chips** (§3.3): unselected — white background, `1.5px solid` border at
    `--sv-text-soft` 25% opacity, `border-radius: 999px` (pill), padding `8px 16px`, text
    `--sv-text` 14px. Selected — background `--sv-primary`, text `#ffffff`, same shape, small
    checkmark icon before the label. Same chip styling is reused for Q6 and Q12's multi-select
    options (§3.4).
  - **Option rows** (single-select questions): full-width row, `48px` min-height, `1.5px solid`
    border at `--sv-text-soft` 20% opacity default, border becomes `--sv-primary` 2px when
    selected with a light `--sv-card-tint` background fill, radio indicator left-aligned, label
    text right of it.
  - **Error messages** (§3.3, §3.4): identical visual treatment to `01`'s field errors — exact same
    `--sv-warning` text color, 13px, paired with the lucide `AlertTriangle` icon, `4px` gap. Don't
    invent a different error style for this wizard.
- **Tutorial Island (§3.6) is child-facing and playful — a genuinely different register.** It
  reuses the Hub's actual components, not a themed version of the Auth wizard: the full-density,
  normal-speed `Starfield.tsx` from the Hub (not the muted auth version from `01` §3.1), the same
  card/button language as the Hub, Baloo 2 headlines at Hub-sized scale. It opens in the default
  Space presentation (no theme has been picked yet at that point) and visually shifts the moment
  a theme is chosen in step 3. The win screen's celebration (§3.6 step 5) follows the Global
  animation rules exactly (`00` §6.5) — a gentle effect (e.g. a soft star-burst, not confetti),
  respecting `prefers-reduced-motion`.

### 3.2 Create Child Profile wizard — structure and persistence model
An 8-step wizard, single column, same card shell as Auth. A progress indicator at the top of
every step reads **"Step {n} of 8"** with the dots from §3.1. Every step except the first has a
**Back** button (bottom-left) and every step except the last has a **Next** button (bottom-right,
disabled until that step's required fields are answered). The last step's button reads
**"Create Profile"** instead of "Next."

**Persistence model (resolves a real ambiguity — read carefully):** nothing in this wizard is
sent to the backend until the final "Create Profile" tap on step 8. All answers live in frontend
state (e.g. React state or form context) across steps 1–7. On step 8's submit, the frontend fires
two sequential calls: first `POST /children` (step 1's data), then — using the returned child id
— `POST /children/:id/preferences` (all 12 answers from steps 2–7). See §4.3 for exactly what to
do if the second call fails after the first succeeds; the short version is: the frontend must be
able to retry just the second call without re-attempting the first.

If a guardian closes the browser before reaching step 8, nothing was ever saved — no `Child`
record exists at all, and logging back in routes them to start this wizard fresh from step 1,
per `01` §3.10. A more elaborate per-step autosave system was considered and deliberately not
built for this phase — see §6.

### 3.3 Step 1 — exact fields, copy, and validation
- **Nickname** — text field, 2–20 characters, trimmed of leading/trailing whitespace before
  validation. Label: **"What should we call your child in the app?"** Error (empty or too
  short/long): **"Please enter a nickname (2–20 characters)."** Rendered as plain text everywhere
  it's displayed later (no HTML interpretation) — standard React escaping handles this, no extra
  sanitization library needed.
- **Age** — a dropdown/select control listing the integers 6 through 17 (not a free-text number
  field — this avoids any out-of-range or non-numeric input entirely). Label: **"How old are
  they?"** Placeholder before a selection is made: **"Select age."**
- **Interests** — the chip grid from §3.1, pick 1–5. Label: **"What do they love?"** Fixed chip
  list, each with its exact stored id (this is what actually goes in the `interests: String[]`
  array, §4.1 — don't invent different slugs):

  | Display | Stored id |
  |---|---|
  | 🚀 Space | `space` |
  | 🦕 Dinosaurs | `dinosaurs` |
  | 🐾 Animals | `animals` |
  | 🎨 Art & Drawing | `art` |
  | 🎵 Music | `music` |
  | ⚽ Sports | `sports` |
  | 🚗 Cars & Trucks | `cars` |
  | 🦸 Superheroes | `superheroes` |
  | 🏰 Princesses & Fairytales | `princesses_fairytales` |
  | 🧱 Building & Blocks | `building_blocks` |
  | 🐛 Nature & Bugs | `nature_bugs` |
  | 📚 Reading & Stories | `reading_stories` |

  Error if none selected: **"Pick at least one thing they love."** If a 6th chip is tapped: it
  doesn't select, and a brief inline note appears: **"You can pick up to 5."**

### 3.4 Steps 2–7 — exact question copy, options, type, and validation
All single-select (radio-style rows, §3.1) unless noted. These are answered **by the guardian,
about the child** ("How does {nickname} usually..."), not by the child. Every question must have
a selection before "Next" activates; the generic error shown if someone tries to proceed without
one (shouldn't normally be reachable since Next is disabled, but exists as a safety net) is:
**"Please choose an option to continue."**

| # | Question | Options | Type |
|---|---|---|---|
| Q1 | "How does {nickname} usually react to sudden or loud sounds?" | Not bothered / Mildly sensitive / Very sensitive, prefers quiet | single-select |
| Q2 | "How does {nickname} respond to fast movement or busy/flashing visuals?" | Enjoys lots of motion / Fine with moderate motion / Prefers calm, minimal motion | single-select |
| Q3 | "How does {nickname} usually handle switching between activities?" | Transitions easily / Needs a little warning / Finds it hard, needs clear countdowns | single-select |
| Q4 | "How long can {nickname} usually focus before needing a break?" | Under 3 minutes / 3–7 minutes / 7–15 minutes / 15+ minutes | single-select |
| Q5 | "How comfortable is {nickname} starting conversations or interacting with new characters?" | Very comfortable / Somewhat shy / Prefers to observe first | single-select |
| Q6 | "When {nickname} gets frustrated, what tends to help most?" | Quiet time alone / Breathing or calming activity / Talking to a trusted adult / Movement / Not sure yet | **multi-select (chip style, §3.1), minimum 1.** Error if none selected: **"Pick at least one option."** |
| Q7 | "Should the app gently check in on {nickname}'s mood sometimes, or only when they ask?" | Gentle occasional check-ins / Only when they ask | single-select |
| Q8 | "How does {nickname} prefer instructions?" | Mostly pictures/icons / Mix of pictures and short text / Short sentences / Longer text | single-select |
| Q9 | "When learning something new, how much guidance does {nickname} need?" | Jumps in independently / A few prompts help / Needs step-by-step guidance | single-select |
| Q10 | "Does {nickname} feel calmer knowing exactly what's coming next?" | Yes, really helps / Somewhat / Not a major factor | single-select |
| Q11 | "Does {nickname} find small, precise taps or drag gestures difficult?" | No difficulty / Some difficulty, bigger buttons help / Significant difficulty | single-select |
| Q12 | "Which would you like Skillverse to help with first?" | Time & transitions / Big feelings & meltdowns / Reading faces & social cues | **multi-select (chip style), max 2.** Tapping a 3rd shows: **"Pick up to 2."** and doesn't select it. |

### 3.5 Step 8 — Review screen
- Headline: **"Review {nickname}'s profile"**
- A read-only summary list of the basic info + all 12 answers, each with a small **"Edit"** link
  that jumps back to that step without losing other answers. **Answers are shown in their
  original human-readable option text** (e.g. "Mildly sensitive," "Space," "Art & Drawing") —
  never the internal stored codes from §4.1/§3.3 (e.g. `mildly_sensitive`, `space`, `art`). Those
  codes exist for the API and database only.
- Tapping "Next" from a step reached via an "Edit" link returns **directly to the Review step**,
  not through every intermediate step again — the wizard isn't strictly linear once in edit mode.
- Final button: **"Let's set up {nickname}'s adventure!"**

### 3.6 Tutorial Island — sequence overview (child-facing)
This section defines the **order and handoff copy only** — the actual steps are each fully
specified in their own docs (see the updated sequence immediately below; the original "steps 2–4
are specified, step 5 doesn't exist yet" note here predates the full sequence being finalized and
is superseded by it, not run alongside it).

**Updated sequence (retroactive change, once `09-rewards-and-economy.md` was written — the Avatar
quick-pick was inserted as the new step 2, before the companion pick):**

1. **Handoff screen** (guardian still holding the device): Headline: **"Time to meet your
   adventure, {nickname}!"** Body: **"Hand the device to {nickname} — let's get started."**
   Button: **"Start"**.
2. **Avatar quick-pick** — see `09-rewards-and-economy.md` §3.3/§3.4 in full. The child picks a
   base face from 6 emoji options; no naming, no accessories yet (those come later from the
   Shop). This doc only marks it as the first personalization step — establishing "who the child
   is" before meeting their companion friend.
3. **Companion picker** — see `03-companion-system.md` in full. This doc only marks it as the
   next step.
4. **Theme picker** — see `04-theme-system.md` in full. Companion appears "dressed" for the
   chosen theme at the end of this step, per the decision made when designing the companion
   system.
5. **Guided first mini-game** (~5 minutes, guaranteed win) — resolved once
   `06-skill-world-template-and-catalog.md` existed: this is simply the Arcade game belonging to
   `recommendedWorldOrder[0]` (the same world already highlighted everywhere else — the Hub map,
   Today's Quests, the Companion's "Let's go" button), played at **Easy** difficulty, framed as
   the child's first taste of real Skill World content rather than a throwaway tutorial-only game.
   No separate "first game" needs to be designed. The actual game mechanics/UI are
   `07-mini-games.md`'s job to build — this doc just resolves *which* game plays here and at what
   difficulty.
6. **Win screen:** Headline: **"You did it!"** Body: **"You earned your first stars and met
   {companionName}!"** Button: **"Go to your Hub."** Celebration animation per §3.1's rule.
7. On tapping that button, the frontend calls the `complete-tutorial` endpoint (§4.5) and routes
   into the Hub (`05-hub-shell.md`).

**Building this sequence before `03`/`04`/`07`/`09` all exist:** since this project builds modules
in a specific order, it's likely this doc gets built before some of those are ready. Build the
`avatar/`, `companion/`, `theme/`, and `first-game/` routes (§4.6) as simple, clearly-labeled
temporary placeholders in that case — e.g. a screen reading "Companion picker coming soon" with a
**"Skip (dev only)"** button that advances the sequence — so the overall shell and its routing can
be verified end to end. This skip button is a development aid only: it must be removed (or hidden
outside local development) once the real screens exist, and this module cannot be marked 🟢 in §2
while any such stub remains in place — a fake "Skip" button reaching the Hub without a real
avatar, companion, theme, or first win would itself violate the honesty rule by overstating what
the child actually experienced.

### 3.7 What this module hands off to other docs
- `05-hub-shell.md` must be updated to read the real child (`GET /children/me`) and the derived
  preferences (`GET /children/:id/preferences/derived`) instead of the static `child`/`pet`
  objects in its current mock `data.ts` — this is required rework, not optional polish, once this
  module exists.
- `recommendedWorldOrder` (from §4.4's derived parameters) is meant to be read by the Hub's world
  map to decide which Skill World is visually emphasized first — this doc only produces that
  value, it doesn't consume it.
- `09-rewards-and-economy.md`, `03-companion-system.md`, and `04-theme-system.md` own steps 2–4 of
  §3.6 fully; this doc only owns their place in the sequence and the screens immediately
  before/after them.
- Routing logic (which of: Create Profile wizard / Tutorial Island / Hub a guardian lands on) is
  owned by `01` §3.10, driven by the state values this module's `GET /children/me` endpoint
  reports — see §4.4.

---

## 4. Backend & File Architecture

### 4.1 Prisma models this module owns (added to the shared `schema.prisma` from `01`)

```
Child {
  id                  String    @id @default(cuid())
  guardianId          String    // one child per guardian for now — enforced in the service layer
  nickname            String
  age                 Int                 // validated 6–17
  interests           String[]            // stored as an array of the fixed chip ids from §3.3
  tutorialCompletedAt DateTime?           // null until Tutorial Island (steps 1–5 in §3.6) finishes
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

ChildPreferences {
  id          String   @id @default(cuid())
  childId     String   @unique
  // raw answers only — these are the source of truth; UI parameters are derived at
  // read-time by the function in §4.4, never stored separately
  q1Sound               String      // "not_bothered" | "mildly_sensitive" | "very_sensitive"
  q2Motion              String      // "enjoys_motion" | "moderate_motion" | "prefers_calm"
  q3Transitions         String      // "transitions_easily" | "needs_warning" | "needs_countdown"
  q4AttentionSpan       String      // "under_3" | "3_to_7" | "7_to_15" | "15_plus"
  q5SocialComfort       String      // "very_comfortable" | "somewhat_shy" | "observes_first"
  q6RegulationStrategy  String[]    // any of: "quiet_time" | "breathing" | "trusted_adult" | "movement" | "not_sure"
  q7CheckInStyle        String      // "gentle_checkins" | "only_when_asked"
  q8InstructionStyle    String      // "icons_only" | "icons_plus_text" | "short_sentences" | "longer_text"
  q9GuidanceNeeded      String      // "independent" | "a_few_prompts" | "step_by_step"
  q10Predictability     String      // "really_helps" | "somewhat" | "not_major"
  q11Motor              String      // "no_difficulty" | "some_difficulty" | "significant_difficulty"
  q12FirstFocusArea     String[]    // 1-2 of: "time" | "feelings" | "faces"
  updatedAt             DateTime @updatedAt
}
```

### 4.2 Business rules
- **One child per guardian, enforced server-side.** `POST /children` returns a `409 Conflict`
  with a clear message if the authenticated guardian already has a child — this isn't just a
  frontend assumption, the backend must actually reject it. See `01` §6 for why multi-child is
  out of scope right now.
- **Age bounds (6–17) and interests (1–5 selections from the fixed §3.3 list) are validated
  server-side**, not just in the form.
- **All 12 `ChildPreferences` fields are required together** — the backend only accepts a
  complete set in one `POST`, matching the wizard's "no skipping" rule. Partial submissions are
  rejected with a `400`.
- **Editing later never requires re-answering everything.** `PATCH /children/:id/preferences`
  accepts any subset of the 12 fields and only updates those — this is what makes the "editable
  anytime from the Guardian Dashboard" decision actually work.
- **Derived UI parameters are never stored.** They're computed fresh every time they're read (see
  §4.4) directly from whatever `ChildPreferences` currently holds, so an edit takes effect
  everywhere instantly with no migration step.
- **Nicknames are stored and returned as-is (trimmed), rendered as plain text client-side** — no
  server-side profanity filtering is applied here (unlike the companion-naming flow in `03`,
  where the child is typing freely); a guardian typing their own child's name is a much lower-risk
  input, and adding a filter here was not discussed or decided — don't add one speculatively.
- **`complete-tutorial` is idempotent.** Calling it when `tutorialCompletedAt` is already set
  simply returns the current child record unchanged (`200`), rather than erroring — a double-tap
  or a retried request must never fail.

### 4.3 Wizard submission order and partial-failure handling (resolves a real edge case)
Per §3.2, step 8 fires `POST /children` then `POST /children/:id/preferences` in sequence.
- If `POST /children` fails, nothing exists — show the generic error pattern from `01` §3.8 and
  let the guardian retry the whole step-8 submission.
- If `POST /children` succeeds but `POST /children/:id/preferences` fails (e.g. network drop), a
  `Child` now exists with no `ChildPreferences`. The frontend must **retry only the preferences
  call** using the child id it already received — it must never attempt `POST /children` again,
  since that would now correctly fail with the `409` from §4.2. Store the returned child id in
  local component state for exactly this retry path.
- `GET /children/me` must therefore be able to represent three distinct states, not two — see
  §4.4's response shape.

### 4.4 Derived UI parameters (exact mapping — implement as a pure function, no side effects)

This function takes a `ChildPreferences` record and returns the concrete settings other modules
(Hub, Skill Worlds, Companion) will read. Exact mapping, do not invent different values:

| From | Answer | Derives |
|---|---|---|
| Q1 | not_bothered | `soundDefaultOn: true, defaultVolume: 100` |
| | mildly_sensitive | `soundDefaultOn: true, defaultVolume: 50` |
| | very_sensitive | `soundDefaultOn: false, defaultVolume: 0` |
| Q2 | enjoys_motion | `calmModeDefault: false, particleIntensity: "normal"` |
| | moderate_motion | `calmModeDefault: false, particleIntensity: "low"` |
| | prefers_calm | `calmModeDefault: true, particleIntensity: "off"` |
| Q3 | transitions_easily | `countdownSeconds: 3, autoTransitionWarning: false` |
| | needs_warning | `countdownSeconds: 5, autoTransitionWarning: true` |
| | needs_countdown | `countdownSeconds: 10, autoTransitionWarning: true` |
| Q4 | under_3 | `defaultSessionMinutes: 3, focusBlockMinutes: 3` |
| | 3_to_7 | `defaultSessionMinutes: 5, focusBlockMinutes: 7` |
| | 7_to_15 | `defaultSessionMinutes: 10, focusBlockMinutes: 12` |
| | 15_plus | `defaultSessionMinutes: 15, focusBlockMinutes: 20` |
| Q5 | very_comfortable | `socialEntryMode: "jump_in"` |
| | somewhat_shy / observes_first | `socialEntryMode: "observe_first"` |
| Q6 | (multi-select, in selection order) | `regulationStrategyOrder: [...selections]`; if only `"not_sure"` was picked, use the fixed default order `["quiet_time", "breathing", "movement", "trusted_adult"]` |
| Q7 | gentle_checkins | `proactiveCheckInsEnabled: true` |
| | only_when_asked | `proactiveCheckInsEnabled: false` |
| Q8 | *(direct passthrough)* | `instructionDensity: "icons_only" \| "icons_plus_text" \| "short_sentences" \| "longer_text"` |
| Q9 | independent | `hintDelaySeconds: 45, taskBreakdownGranularity: "coarse"` |
| | a_few_prompts | `hintDelaySeconds: 20, taskBreakdownGranularity: "medium"` |
| | step_by_step | `hintDelaySeconds: 8, taskBreakdownGranularity: "fine"` |
| Q10 | really_helps | `predictabilityPromptsDefault: true, journeyLineVerbosity: "detailed"` |
| | somewhat | `predictabilityPromptsDefault: true, journeyLineVerbosity: "standard"` |
| | not_major | `predictabilityPromptsDefault: false, journeyLineVerbosity: "minimal"` |
| Q11 | no_difficulty | `tapTargetSize: "standard", preferTapOverDrag: false` |
| | some_difficulty | `tapTargetSize: "large", preferTapOverDrag: false` |
| | significant_difficulty | `tapTargetSize: "extra_large", preferTapOverDrag: true` |
| Q12 | (1–2 selections, in selection order) | `recommendedWorldOrder`: the selected world id(s) mapped `time`/`feelings`/`faces`, followed by whichever of the 3 MVP worlds weren't selected, in the fixed default order `["time", "feelings", "faces"]` |

### 4.4a Which of §4.4's 19 derived values are actually wired up anywhere (resolved during a full
cross-doc audit — a real finding: 14 of 19 were silently never consumed by any doc, with only
`hintDelaySeconds` ever honestly flagged as such. Gone through one by one; here's where each
actually landed)

**Wired up for real (9):**
- `countdownSeconds` (Q3) — Rocket Launch Timer duration, `05` §3.3. Already real.
- `regulationStrategyOrder` (Q6) — companion's suggested strategy, `03` §4.3. Already real.
- `taskBreakdownGranularity` (Q9) — manual difficulty default, `06`/`07`/`08`. Already real.
- `recommendedWorldOrder` (Q12) — World Map highlight, Today's Quests order, Companion's "Let's
  go," Tutorial Island's first game. Already real, the most heavily used of all 19.
- `soundDefaultOn` (Q1) — **newly wired.** The Settings Sound toggle (`04` §3.6, `localStorage`-
  backed per `05`/`07`'s retrofit) reads this as its value **only the first time it's ever set**
  for that child — if the `sv-sound-on` key already exists in `localStorage`, it's left alone, so
  a child/guardian's own later choice always wins over the original derived default. `defaultVolume`
  (Q1's second field) is **not** separately wired — no volume slider exists anywhere in this app
  (sound cues are short UI chimes, not adjustable music, `07` §3.1), so the only decision that
  matters in practice is on/off, which `soundDefaultOn` alone already fully captures.
  `defaultVolume` stays captured data with nothing to apply it to — an honest, not a silent, gap.
- `calmModeDefault` (Q2) — **newly wired**, same "first-set-only" rule as `soundDefaultOn`, into
  the Calm Mode toggle. `particleIntensity` (Q2's second field) is **not** separately wired, same
  reasoning as `defaultVolume` — Calm Mode is a binary toggle, not a 3-level control, so "low" and
  "normal" collapse to the same effective state; only the off/on distinction `calmModeDefault`
  already captures does anything.
- `autoTransitionWarning` (Q3) — **newly wired.** When `true`, the Rocket Launch Timer (`05` §3.3)
  shows one extra ~1s "Heads up, we're about to start!" beat before the countdown itself begins;
  when `false`, the countdown starts immediately as it already does today.
- `journeyLineVerbosity` (Q10) — **newly wired**, into the Journey Line's actual display detail
  (`05` §3.3): `minimal` shows icon + label only; `standard` (the existing/default look) adds the
  time; `detailed` adds a status line and a one-line preview of the next stop. **This also fully
  covers `predictabilityPromptsDefault`** (Q10's other field) without needing separate wiring — the
  mapping table already makes `predictabilityPromptsDefault: true` exactly whenever
  `journeyLineVerbosity` isn't `minimal`, so it's structurally redundant, not a second dormant
  field — wiring up verbosity alone already satisfies both.
- `tapTargetSize` (Q11) — **newly wired**, via the new `--sv-tap-scale` token (`00` §6.9) on
  child-operated surfaces only. `preferTapOverDrag` (Q11's second field) is **not** wired — the
  only drag interaction anywhere in this app is `10`'s guardian-only Quest Control reordering,
  which a child never touches, so there's nothing for a child's drag preference to apply to.

**Explicitly cut, permanently, flagged honestly (not silently dropped):**
- `defaultSessionMinutes`/`focusBlockMinutes` (Q4) — would conflict with `07`'s already-locked,
  deliberately fixed round counts (5/6/6, explicitly "not a range," reconfirmed multiple times
  across this project). Varying session length per child would reopen a settled design decision
  for a conflict with no clean fix. Cut outright, not half-wired.
- `socialEntryMode` (Q5) — would need a real "how boldly does new content introduce itself" system
  that doesn't exist anywhere. Real future scope, not built.
- `proactiveCheckInsEnabled` (Q7) — would need a notification/prompt-trigger engine that doesn't
  exist anywhere; today, every zone check-in is child-initiated via the Heart Button, full stop.
- `instructionDensity` (Q8) — would need a copy-density variation system (icons-only vs. full
  sentences, rendered differently per child) that doesn't exist anywhere; all copy in this doc set
  is fixed, exact text, chosen once per screen.
- `hintDelaySeconds` (Q9) — already flagged dormant by `10` §3.4 (no in-game hint mechanic was
  ever built to consume it); reconfirmed here, not re-litigated.
- `defaultVolume`, `particleIntensity` — see the "wired up" notes above; captured but structurally
  redundant with their sibling field given what controls actually exist today.
- `preferTapOverDrag` — see the `tapTargetSize` note above; nothing for it to apply to.

### 4.5 API endpoints (`/api/v1/children/...`, all require an authenticated guardian)

| Method & path | Request body | Success response | Notes |
|---|---|---|---|
| `POST /children` | `{ nickname, age, interests: [...] }` | `201 { child }` | Rejects if guardian already has a child (§4.2) |
| `GET /children/me` | — | `200 { child, hasPreferences: boolean, tutorialCompleted: boolean }` or `404` if no child exists at all | The three-state shape resolves §4.3's edge case and drives the `01` §3.10 routing decision directly, with no extra client-side calls needed |
| `PATCH /children/:id/profile` | any of `{ nickname, age, interests }` | `200 { child }` | |
| `POST /children/:id/preferences` | all 12 fields from §4.1 | `201 { preferences }` | First-time creation only; rejects partial submissions. Safe to retry per §4.3 |
| `PATCH /children/:id/preferences` | any subset of the 12 fields | `200 { preferences }` | Partial updates allowed — this is the "editable later" endpoint |
| `GET /children/:id/preferences/derived` | — | `200 { ...derived parameters from §4.4 }` | What the Hub/Worlds/Companion actually read |
| `POST /children/:id/complete-tutorial` | — | `200 { child }` | Sets `tutorialCompletedAt`; called at the end of §3.6 step 5 |

### 4.6 File architecture

```
skillverse-backend/src/children/
├── children.module.ts
├── children.controller.ts
├── children.service.ts            # owns the one-child rule, age/interest validation
├── preferences.service.ts         # owns §4.4's pure derivation function + partial-update logic
└── dto/
    ├── create-child.dto.ts
    ├── update-child-profile.dto.ts
    └── preferences.dto.ts

skillverse-app/src/app/(child-setup)/
├── layout.tsx                      # reuses the (auth) card shell from 01
└── create-profile/
    ├── page.tsx                    # the 8-step wizard shell (§3.2), step state + progress dots
    └── steps/
        ├── BasicInfoStep.tsx       # §3.3
        ├── QuestionStep.tsx        # generic renderer for §3.4's question shape, reused ×6
        └── ReviewStep.tsx          # §3.5

skillverse-app/src/app/(tutorial-island)/
├── layout.tsx                      # Hub-grade Calm Adventure visuals (full Starfield), NOT the auth card shell
├── handoff/page.tsx                 # §3.6 step 1
├── avatar/                         # built in 09 (§3.6 step 2)
├── companion/                      # built in 03 (§3.6 step 3)
├── theme/                          # built in 04 (§3.6 step 4)
├── first-game/                     # built in 07 (§3.6 step 5)
└── win/page.tsx                    # §3.6 step 6
```

---

## 5. What You Need to Do, With Why

Nothing new. This module needs no additional external accounts or credentials beyond what `01`
already set up (Resend, Google OAuth). The only thing worth doing before building: skim the
interest-chip list (§3.3) and the 12 questions (§3.4) once more yourself — they're written from
our earlier discussion, but you're the one who'll be looking at this wizard as a real guardian
would, so flag now if any wording feels off rather than after it's built.

---

## 6. Explicitly Out of Scope for This Module
- **The actual companion and theme pickers.** Fully specified in `03` and `04` — this doc only
  reserves their place in the Tutorial Island sequence.
- **The first mini-game's technical build.** *Which* game and difficulty is now resolved (§3.6
  step 4 — the recommended world's Arcade game, Easy difficulty), but its actual implementation is
  `07-mini-games.md`'s job. Tutorial Island cannot be fully built end-to-end until `07` exists —
  build everything else in this doc first, and treat `(tutorial-island)/first-game/` as a stub
  route until then.
- **Multi-child support.** One `Child` per guardian, enforced server-side — see `01` §6.
- **Per-step autosave to the backend.** The wizard holds all answers in frontend state and only
  persists at step 8 (§3.2) — a more elaborate system that saves progress after every single step
  was considered and deliberately not built, to keep this module simple; don't add it
  speculatively.
- **Using the interests field for anything yet** (e.g. flavoring quest text). It's captured and
  stored now for future use (the spec's "Interest Engine" concept), not read by anything yet.
- **A real Guardian Dashboard UI for editing preferences.** The `PATCH` endpoint in §4.5 exists
  and works, but the actual settings screen that calls it belongs to
  `10-guardian-dashboard.md`, not this doc.
- **Profanity/content filtering on the nickname field.** Explicitly not applied here — see §4.2.

---

## 7. Acceptance Criteria / Definition of Done

- [ ] A guardian can complete all 8 wizard steps and create a child profile; all 12 answers are
      required before the final step's button is reachable.
- [ ] Nothing is persisted to the backend before step 8; closing the browser at step 4, for
      example, leaves no `Child` record behind at all.
- [ ] A second attempt to create a child profile on the same account is rejected server-side with
      a clear message, not just hidden by the frontend.
- [ ] Age outside 6–17 and interests outside the fixed chip list are rejected server-side; the age
      field itself cannot produce an out-of-range value since it's a constrained dropdown, not
      free text.
- [ ] Selecting a 6th interest chip, or a 3rd option on Q12, is blocked client-side with the exact
      inline copy from §3.3/§3.4.
- [ ] If the preferences call fails after the child-creation call succeeds, retrying resubmits
      only the preferences call (confirm by inspecting network requests), and does not error with
      a duplicate-child conflict.
- [ ] `GET /children/me` correctly reports all three states: no child, child without preferences,
      and fully complete — verified by deliberately interrupting the flow partway.
- [ ] `GET /children/:id/preferences/derived` returns correct values for at least 5 spot-checked
      answer combinations, matching §4.4 exactly.
- [ ] Editing a single preference via `PATCH` updates only that field, and the derived endpoint
      reflects the change immediately with no other side effects.
- [ ] A guardian who finished the wizard but not Tutorial Island is routed back into Tutorial
      Island (not the Hub) on their next login, per `01` §3.10.
- [ ] The Review step's "Edit" links correctly return to the right step without losing other
      answers, and return directly to Review afterward rather than replaying every step.
- [ ] The Review step displays every answer in human-readable text, never an internal code like
      `mildly_sensitive` or `space`.
- [ ] Stored `interests` values exactly match the id column in §3.3's table, not invented slugs.
- [ ] Calling `complete-tutorial` a second time doesn't error.
- [ ] Error messages in this wizard visually match `01`'s field-error style exactly (color, icon,
      size) — no separate error style was invented for this doc.
- [ ] Tutorial Island's first-game step correctly resolves to `recommendedWorldOrder[0]`'s Arcade
      game at Easy difficulty (per `06`), not a placeholder or arbitrary world — testable once `06`
      and `07` both exist.
- [ ] If this module was built before `03`/`04`/`06`/`07` existed, any dev-only "Skip" stubs used
      in the interim have since been removed before marking §2 🟢 — none remain in place once this
      module is considered genuinely done.
- [ ] Wizard is keyboard-navigable and announces step changes via `aria-live`, matching `01`'s
      accessibility bar.
