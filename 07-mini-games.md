# Module: Mini-Games
Read `00-global-context-and-rules.md`, `00a-visual-assets-and-style-guide.md`,
`02-child-profile-and-personalization.md`, `03-companion-system.md`,
`05-hub-shell.md`, and `06-skill-world-template-and-catalog.md` first.

**Scope of this doc:** the exact technical build of the 3 Arcade games `06` named (Launch
Challenge, Volcano Scale, Face Detective) and their Boss Battle modes — the shared engine
architecture, pixel-level UI, full content banks, scoring logic, and every interaction detail.
`06` said *what exists and what it's called*; this doc says *how it's built*. It does **not**
redefine anything `06` already owns (world identity, story framing, catalog data) or anything
deferred to `08`/`09` (real adaptive difficulty, real stars/rewards).

---

## 1. How to Use This Document

**Step 0:** nothing new to set up.

**Step 1 — the shared engine first**, since all three games depend on it: build `MiniGameShell`
(§3.2) before any specific game. Tell the agent:
> "Read docs `00`, `00a`, `02`, `03`, `05`, `06`, and `07-mini-games.md`. Build the shared
> `MiniGameShell` component from §3.2 and §3.3 first — difficulty selection, the 'Get Ready!'
> beat, round counting, the companion badge integration, inter-round transitions, and the summary
> screen shell. Don't build any specific game's content yet."

**Step 2 — build the three games in this order** (simplest to most content-heavy): Launch
Challenge (§3.4, no content bank) → Face Detective (§3.6, the largest content bank, includes Text
Mode) → Volcano Scale (§3.5, scenario bank). Each plugs into `MiniGameShell` per §3.2's interface.

**Step 3 — Boss Battle modes** (§3.7) — a configuration of each game, not new games.

**Checkpoint:** play all 3 games at all 3 difficulties, in both Face Detective's modes, confirm
the companion badge reacts correctly, confirm Heart Button pauses an active Launch Challenge
countdown and resumes correctly, confirm each game's summary screen uses its own correct copy
style (not a generic "X of Y right" applied to all three).

**When this module is "done":** every item in §7 verified. This module needs no other doc to be
"finished" — it's one of the few that can reach a genuine 🟢 on its own, since it makes zero
backend calls and has no dependency on `09`.

---

## 2. Current Status

🔴 **Nothing in this doc is built yet.**

---

## 3. Frontend & UI

### 3.1 Visual system
Reuses the Hub's existing visual language (`00` §6), each world's signature color (`06`
§3.6–3.8) accenting its own game's cards/buttons. No bespoke illustration — Face Detective uses
curated emoji (per `00a` §2's placeholder-first policy), Launch Challenge reuses the existing
`RocketLaunchTimer` visual asset, Volcano Scale reuses the Heart Button's existing 4-icon scale.

### 3.2 Shared engine — `MiniGameShell`
One shared component drives all 3 games and both Boss Battle modes. It owns:
- Difficulty selection (§3.3) and, for Face Detective only, the Text Mode toggle.
- The "Get Ready!" beat (~1–2s) before round 1.
- Round counting and a progress indicator ("Round 3 of 6").
- The persistent `GameCompanionBadge` (`06` §3.2) — bottom-left, ~48px, bounces in sync with each
  round's feedback.
- Inter-round transitions (a ~250ms crossfade).
- Sound cues on correct/incorrect, now concretely specified (resolved when sound effects were
  properly discussed — this used to just say "a soft chime / a neutral tone" with no actual spec;
  full technical approach is cross-cutting, `00a` §7.1): both are **synthesized via the shared
  `playTone()` helper**, not audio files. Correct = a short ascending two-note chime (e.g. C5→E5,
  ~150–200ms total, bright but gentle). Incorrect = a single, lower, soft tone (e.g. a brief A4,
  ~150ms) — deliberately not descending or buzzer-like, matching "never framed as failure" (`07`
  §3.4). Both respect the existing Sound toggle from Settings, and are silent when it's off — no
  separate per-game mute control is needed.
- Pausing: if the Heart Button is opened mid-round, any active timer (only relevant to Launch
  Challenge) pauses immediately and resumes exactly where it left off on close — a child
  regulating mid-game must never be penalized by time that passed while they stepped away.
- The session summary screen (§3.8) and Play Again / Back to World Home navigation.

**Interface each specific game implements** (sketch, not final code):
```
GameDefinition {
  gameId: string
  totalRounds(mode: "normal" | "boss"): number        // fixed per game: 5 (Launch), 6 (Volcano),
                                                        // 6 (Face Detective) normal; 8 for boss (§3.7)
  generateRound(difficulty, roundIndex, usedIds): RoundContent
  RoundComponent: Component<{ round, onAnswer }>        // the actual stimulus + input UI
  evaluateAnswer(round, answer): { correct: boolean, feedbackText: string }
  summarize(results): string                            // §3.8's game-specific copy, not generic
}
```

### 3.3 Difficulty selection (recap from `06` §3.5, plus Face Detective's addition)
Easy/Medium/Hard selector, defaulting from `taskBreakdownGranularity` (`fine`→Easy,
`medium`→Medium, `coarse`→Hard), always overridable. **Face Detective only:** an additional
toggle on this same screen — a book icon + **"Text Mode"** label — switching between the visual
(emoji) and text (scenario) round-renderers. Available to any player, not auto-detected from
assistive tech.

### 3.4 Launch Challenge (World of Time) — full mechanics
No content bank needed — purely a timing-skill game.
- **Round:** a countdown plays (reusing `RocketLaunchTimer`, theme-flavored per `05` §3.3's
  table), duration randomized within a band per difficulty (Easy: 5–7s, numbers fully visible;
  Medium: 6–9s, numbers hidden for the final 2s; Hard: 8–12s, **no numbers at all — instead a
  calm, slowly pulsing "Ready..." visual with zero timing information**, confirming the game is
  still live without giving anything away).
- The child taps **"BLAST OFF!"** whenever they believe the countdown has reached zero.
- **Scoring by proximity:** within 0.5s of true zero = "Perfect Launch!" (✨ visual), within 1.5s =
  "Great Launch!", beyond that = gentle encouragement ("Nice try! Let's go again."), never framed
  as failure.
- **5 rounds, normal mode, fixed** (not a range — picking one exact number removes ambiguity),
  each with an independently randomized duration within the active difficulty's band.
- **Session summary copy (game-specific, not generic):** *"{perfectCount} Perfect Launches,
  {greatCount} Great Launches!"* — if neither occurred, *"You're building your sense of timing —
  keep practicing!"*

### 3.5 Volcano Scale (World of Feelings) — full mechanics

**Round structure — two sequential steps, not one combined screen:**
1. Scenario text shown, question: **"How intense might this feel?"** — the same 4-icon scale as
   the Heart Button (`03` §3.8): 😌 Calm → 🙂 Okay → 😟 Worried → 🌋 Big Feelings.
2. After answering, question: **"What might help?"** — 4 strategy chips (quiet time, breathing, a
   trusted adult, movement), multi-select not required — pick one.

**Scoring — only the intensity judgment is scored, strategy choice is never marked wrong:**
each scenario has an "intended" intensity band; answering within it (or one step adjacent) counts
as accurate. Strategy selection always gets a warm acknowledgment regardless of which of the 4 is
picked — staying true to "there's no single right way to cope" while still giving the summary
something real to measure.

**Full scenario bank (18 total, 6 per tier) — each with its intended intensity and a bundled "why"
explanation shown after both steps are answered:**

*Easy (clear intensity, obviously fitting a specific strategy):*
1. "Sam's tower of blocks just got knocked over by their little brother." — Intended: 😟 Worried.
   *"Having something you built get knocked down is frustrating — noticing that early is step
   one."*
2. "Mia dropped her ice cream cone on the ground right after buying it." — Intended: 😟 Worried.
   *"Losing something you were looking forward to is disappointing, and that's okay to feel."*
3. "Leo's team lost the game in the very last second." — Intended: 🌋 Big Feelings. *"A close loss
   right at the end can bring up a lot of feelings at once."*
4. "Priya can't find her favorite toy anywhere in the house." — Intended: 😟 Worried. *"Not being
   able to find something important can feel stressful."*
5. "Omar got in trouble for something his friend actually did." — Intended: 🌋 Big Feelings.
   *"Being blamed for something unfair is a big one to sit with."*
6. "Zara's sandcastle got washed away by a wave." — Intended: 🙂 Okay. *"Some things, like sand
   castles, are a little expected to not last — that can soften the feeling."*

*Medium (a bit more nuanced):*
7. "Deshawn studied hard for the test but still didn't do as well as he hoped." — Intended: 😟
   Worried. *"Effort not matching the result is a tricky, quietly frustrating feeling."*
8. "Ana's friend canceled their weekend plans at the last minute." — Intended: 😟 Worried.
   *"Plans falling through can feel like a small loss, even when you understand why."*
9. "Noah has to give a presentation in front of the whole class tomorrow." — Intended: 😟 Worried.
   *"Anticipating something big coming up often brings worry before it even happens."*
10. "Lily's little sister keeps copying everything she does." — Intended: 🙂 Okay. *"Annoying
    moments with siblings are common and usually pass quickly."*
11. "Tariq has to share his new game with his cousin, who always breaks things." — Intended: 😟
    Worried. *"Worrying about something you care about getting damaged is a real, valid concern."*
12. "Jordan got picked last for the team again." — Intended: 🌋 Big Feelings. *"A repeated hurt
    can feel heavier than it would the first time."*

*Hard (ambiguous intensity, genuinely multiple reasonable strategies):*
13. "Aisha has been waiting all week for a letter back from her pen pal, and it still hasn't
    come." — Intended: 🙂 Okay / 😟 Worried (either counts). *"Waiting on something out of your
    control can sit anywhere between patient and uneasy, and both are normal."*
14. "Maya's parents are arguing in the next room and she can hear them." — Intended: 🌋 Big
    Feelings. *"Hearing grown-ups argue is genuinely hard for a lot of kids, even when it's not
    about them."*
15. "Jake's best friend has been hanging out with someone new a lot lately." — Intended: 😟
    Worried. *"Feeling a little unsure about a changing friendship is common, even without
    anything being wrong."*
16. "Emma has a big test tomorrow AND a sleepover tonight and isn't sure how to feel." — Intended:
    🙂 Okay / 😟 Worried (either counts). *"It's possible to feel excited and nervous about
    different things at the same time."*
17. "Sam just moved to a new school and doesn't know anyone yet." — Intended: 😟 Worried. *"New,
    unfamiliar places often bring a mix of nervous and hopeful."*
18. "A classmate said something confusing that might have been a joke or might have been mean." —
    Intended: 🙂 Okay / 😟 Worried (either counts). *"When you're not sure how something was
    meant, it's fair to feel unsure how to react too."*

**6 scenarios, normal session, fixed** (not a range), randomly drawn from the active difficulty
tier (no repeats within a session). **Session summary copy:** *"You read the room well for
{accurateCount} of {total} friends!"*

### 3.6 Face Detective (World of Faces) — full mechanics, both modes

**Visual Mode — the 12-emotion pool (from `06` §3.8), always exactly 4 options per round:**

| Emotion | Emoji | Explanation (shown on reveal, reused whenever this emotion is the answer) |
|---|---|---|
| Happy | 😊 | "A big smile that reaches the eyes usually means happy!" |
| Sad | 😢 | "Downturned eyes and a frown often show sadness." |
| Angry | 😠 | "Furrowed eyebrows and a tight mouth can mean angry." |
| Surprised | 😲 | "Wide eyes and an open mouth usually mean surprised!" |
| Scared | 😨 | "Wide eyes and a tense face can show fear." |
| Disgusted | 🤢 | "A scrunched-up nose often means disgusted." |
| Confused | 😕 | "One raised eyebrow or a tilted head can mean confused." |
| Excited | 🤩 | "Sparkling eyes and a big grin often mean excited!" |
| Nervous | 😬 | "A tight, stretched smile that doesn't quite reach the eyes can mean nervous." |
| Embarrassed | 😳 | "Rosy cheeks and looking away can mean embarrassed." |
| Proud | 😌 | "A calm, closed-eye smile can mean proud." |
| Skeptical | 🤨 | "One raised eyebrow with a flat mouth often means skeptical — not sure they believe something." |

**Difficulty:** Easy draws only from the first 4 rows; Medium from the first 8; Hard from all 12,
**and** whenever one of the 4 subtle emotions (Nervous/Embarrassed/Proud/Skeptical) is shown, it's
paired with one of its 3 context sentences below (randomly chosen, no repeat within a session).
The other 8 emotions at Hard tier get harder *distractor* options instead of needing their own
context sentences — the exact confusion-pairing table (don't invent different pairs):

| Emotion | Commonly-confused distractor(s) to prioritize at Hard tier |
|---|---|
| Happy | Excited, Proud |
| Sad | Embarrassed, Nervous |
| Angry | Disgusted |
| Surprised | Scared, Excited |
| Scared | Surprised, Nervous |
| Disgusted | Angry |
| Confused | Skeptical |
| Excited | Happy, Surprised |

(The 4 subtle emotions use context sentences instead of this table, per above.)

**Context sentences (Hard tier, 3 variants each):**
- **Nervous:** "Mia is about to go on stage for her first school play." / "Sam is waiting outside
  the principal's office, not sure why he was called in." / "Priya is about to try the big slide
  at the pool for the first time."
- **Embarrassed:** "Leo tripped in the lunch line and everyone turned to look." / "Zara realized
  she'd been calling her new friend the wrong name all week." / "Omar's voice cracked in the
  middle of his class presentation."
- **Proud:** "After weeks of practice, Ana finally landed the cartwheel on her own." / "Deshawn's
  little sister showed everyone the drawing he helped her make." / "Maya finished the puzzle
  she'd been working on for three days."
- **Skeptical:** "Jordan's friend said he once saw a dog ride a skateboard down the street." /
  "Someone told Aisha the homework had been cancelled, but her teacher hadn't said anything." /
  "A classmate claimed he finished the whole book in one night."

**Visual Mode layout:** a large (~140px) emoji face centered in a card, context sentence (if any)
above it, question **"How might this person be feeling?"** below, 4 answer options in a 2×2 grid
beneath that.

**Text Mode — full parallel scenario bank, one per emotion (reuses the 4 subtle emotions' first
context-sentence variant above rather than duplicating new content for those):**

| Emotion | Scenario | Explanation |
|---|---|---|
| Happy | "Emma's best friend surprised her with her favorite snack after a hard day." | "Little kind surprises from people we care about often bring happiness." |
| Sad | "Noah's favorite stuffed animal got left behind at the hotel after vacation." | "Losing something we love can bring on sadness." |
| Angry | "Someone knocked over Tariq's tower right after he finished building it." | "Having something we worked hard on ruined can bring up anger." |
| Surprised | "Jake opened the box and found a puppy inside — he wasn't expecting that at all." | "Finding something totally unexpected is a classic moment of surprise." |
| Scared | "The lights suddenly went out during the thunderstorm." | "Sudden changes, especially in the dark, can bring up fear." |
| Disgusted | "Lily found a moldy sandwich at the bottom of her backpack." | "Finding something gross or spoiled often brings disgust." |
| Confused | "The teacher gave instructions, but they didn't match what was written on the board." | "Mixed messages can leave anyone feeling confused." |
| Excited | "The family just found out they're going to the amusement park this weekend." | "Looking forward to something fun often brings excitement." |
| Nervous | "Mia is about to go on stage for her first school play." | "New or big moments can bring on nervousness, even when we're ready." |
| Embarrassed | "Leo tripped in the lunch line and everyone turned to look." | "Moments when everyone's looking at us can feel embarrassing." |
| Proud | "After weeks of practice, Ana finally landed the cartwheel on her own." | "Finishing something hard after lots of practice often brings pride." |
| Skeptical | "Jordan's friend said he once saw a dog ride a skateboard down the street." | "Surprising claims can make us feel unsure or skeptical." |

**Text Mode layout:** the scenario text in place of the emoji (same card position/size), same
question, same 4-option 2×2 grid below — structurally identical to Visual Mode, only the stimulus
differs, confirming the shared-engine architecture (§3.2) is doing its job.

**Both modes: 6 rounds, normal session, fixed** (not a range), no exact emotion repeats within a
session. **Session summary copy:** *"{correctCount} of {total} right!"* — the one game where a
plain accuracy count is actually the honest, natural framing.

### 3.7 Boss Battle mode (applies to all 3 games identically)
8 rounds (more than any game's normal-mode count of 5 or 6), all content drawn from the Hard tier
only, feedback **auto-advances after
~1.5s** instead of waiting for a manual tap — creating the "rapid-fire" feeling without removing
the educational moment entirely. Preceded by the dramatic intro card from `06` §3.3 (e.g. "⚔️ The
Final Countdown!"), and the companion's cheering line. Boss Battle stays permanently locked (`06`
§3.4) until `09` can track real per-child play counts.

### 3.8 Session summary screen — shared shell, game-specific copy
Layout: headline (varies, e.g. "Session Complete!"), the game-specific summary line (§3.4/3.5/3.6,
never a generic "X of Y" applied uniformly), the companion's effort-based reaction line (`06`
§3.2), and two buttons: **"Play Again"** / **"Back to {World Name}"**. This summary originally
showed performance only, never a rewards claim, per `06` §3.2's honesty rule — now that
`09-rewards-and-economy.md` exists, a real reward line (Stars/Coins actually earned) is shown
alongside the performance line, per `09` §3.5, never replacing it.

### 3.9 Accessibility & motion
Same bar as every other module: keyboard-navigable options with visible focus rings, round
transitions and the countdown respect `prefers-reduced-motion`, every option pairs icon with text
label. **Face Detective's known, honest limitation:** Visual Mode's core task — reading an
expression — has no true screen-reader equivalent; Text Mode (§3.6) is the real accommodation,
not an ARIA afterthought, and should be discoverable, not buried. The game's chrome (buttons,
round counter, difficulty selector) is fully accessible in both modes.

### 3.10 What this module hands off to other docs
- `08-adaptive-difficulty.md` will eventually replace the manual difficulty selector's behavior
  with real performance-based adaptation — this doc's difficulty bands/content stay the same,
  only *who picks* changes.
- `09-rewards-and-economy.md` **now delivers** real stars/rewards and real Boss Battle unlock
  tracking, per §3.8 above — each game's `evaluateAnswer`/`summarize` results (§3.2's
  `GameDefinition` interface) are what `09`'s `POST /quest-completions` (`09` §4.3) actually
  submits for server-side reward computation.

### 3.11 Tutorial Island integration (closes a connection `02` made but this doc never addressed)
Per `02` §3.6 step 4, Tutorial Island's "guided first mini-game" is simply
`recommendedWorldOrder[0]`'s Arcade game, reused here — **not a fourth game.** When invoked from
Tutorial Island, the same game component is used with a stripped-down wrapper: no difficulty
selector shown (fixed at Easy, matching the "guaranteed win" framing from `02`), no Boss Battle
option, no Text Mode toggle shown even if the recommended world is Faces (Visual Mode only, to
keep the first-ever experience as simple as possible — Text Mode remains available from then on
via the normal World Home flow). The companion badge, round feedback, and summary screen behave
identically either way — reusing `MiniGameShell` in both contexts is what makes this possible with
no duplicated game logic.

### 3.12 Exiting mid-session
Tapping away (closing the game, navigating back) before a session finishes **silently discards
that session** — no partial performance summary is shown, no penalty, nothing is saved (consistent
with §4.1's zero-persistence rule). The child simply returns to World Home as if the attempt never
happened. Applies identically to normal and Boss Battle sessions.

### 3.13 Reading the Calm Mode / Sound settings from inside a game (a real architectural gap)
`MiniGameShell`'s sound cues (§3.2) and respect for Calm Mode need to read the same toggles set in
`SettingsPanel` — but mini-games are reached via World Home (`06`), a different route than the Hub
page that currently holds this state only as local component props, not shared anywhere. This is
a genuinely new finding, not something an earlier doc already flagged. **Recommended fix:** move
Calm Mode and Sound from component state to `localStorage`, read synchronously from anywhere
(World Home, any mini-game, the Hub) with no context-threading needed — as a useful side effect,
they'd also survive a page reload, which they currently don't. This is a small retroactive
adjustment to the existing `SettingsPanel`/Hub code, not a new feature — apply it to `05`'s
existing implementation when building this module.

---

## 4. Backend & File Architecture

### 4.1 Backend calls — updated as `08` and `09` were written
This module originally made **zero backend calls** (pure client-side state, no Prisma model, no
API endpoint) — correct when this doc was the only one of the three written. That's since changed,
without this doc ever being updated to say so until now:
- `08-adaptive-difficulty.md` §4.4's `commitSession()` calls `PATCH /difficulty/:gameId` once, only
  on real session completion.
- `09-rewards-and-economy.md` §4.3's reward payout calls `POST /quest-completions` once, also only
  on real completion.

**Still true and unchanged:** zero calls *per round* — both calls above happen exactly once, at
session end, never between rounds, keeping gameplay responsive. An abandoned session (§3.12) still
triggers neither call, consistent with both `08` and `09`'s own "discard on exit" rules.

### 4.2 File architecture

```
skillverse-app/src/components/games/
├── MiniGameShell.tsx              # §3.2 — difficulty selector, Get Ready beat, round counter,
│                                   # GameCompanionBadge integration, pause-on-HeartButton,
│                                   # summary screen shell
├── DifficultySelector.tsx         # reused from 06, extended with Face Detective's Text Mode toggle
├── launchChallenge/
│   ├── LaunchChallenge.tsx        # §3.4 — implements GameDefinition
│   └── launchChallenge.content.ts # the 0.5s/1.5s scoring bands, duration ranges per difficulty
├── volcanoScale/
│   ├── VolcanoScale.tsx           # §3.5 — implements GameDefinition, two-step round UI
│   └── volcanoScale.scenarios.ts  # NEW — the 18-scenario bank from §3.5
└── faceDetective/
    ├── FaceDetective.tsx          # §3.6 — implements GameDefinition, both round-renderers
    ├── faceDetective.emotions.ts  # NEW — the 12-emotion pool + explanations + context sentences
    └── faceDetective.textMode.ts  # NEW — the 12-scenario Text Mode bank

skillverse-app/src/lib/
└── playTone.ts                    # NEW — `00a` §7.1's synthesized-tone helper (AudioContext/
                                     # OscillatorNode), used by MiniGameShell's correct/incorrect
                                     # cues above and by 09's celebration chime
```

---

## 5. What You Need to Do, With Why
Nothing new. No external accounts or credentials needed for this module.

---

## 6. Explicitly Out of Scope for This Module
- **Real adaptive difficulty.** `08`'s job — the manual selector here is an explicit placeholder.
- **Real stars/rewards and Boss Battle unlocking.** `09`'s job — sessions stay honestly
  performance-only, Boss Battle stays permanently locked.
- **Any round-by-round backend persistence.** Only the end-of-session calls described in §4.1
  (updated) exist — no per-round network traffic, and no raw history log beyond what `08`/`09`
  each minimally persist.
- **A second accessible alternative for Volcano Scale or Launch Challenge.** Neither has Face
  Detective's specific visual-interpretation problem (Volcano Scale is already text-based; Launch
  Challenge is a timing task, not a visual one), so neither needs an equivalent Text Mode.
- **Multiplayer, leaderboards, or comparing scores between children.** Never discussed, not part
  of this project's design anywhere.

---

## 7. Acceptance Criteria / Definition of Done

- [ ] All 3 games are playable end to end at all 3 difficulties, through `MiniGameShell` — no
      game bypasses the shared engine.
- [ ] Face Detective's Text Mode toggle is visible and functional; both modes produce structurally
      identical round layouts (stimulus swapped, question/options unchanged).
- [ ] Launch Challenge's Hard tier shows the pulsing "Ready..." visual with zero timing
      information, never a blank/broken-looking screen.
- [ ] Volcano Scale's two-step round flow (intensity, then strategy) works correctly, and the
      session summary only reflects intensity accuracy — never marks a strategy choice wrong.
- [ ] Each game's session summary uses its own correct copy style — verified all three are
      visually/textually distinct, not a shared generic template.
- [ ] Opening the Heart Button mid-round pauses an active Launch Challenge countdown and resumes
      it correctly on close, with no time penalty.
- [ ] The companion badge appears bottom-left during every game, bounces in sync with round
      feedback (never a duplicate text bubble), and shows the correct effort-based line at session
      end.
- [ ] Boss Battle mode runs exactly 8 Hard-tier rounds with auto-advancing feedback, preceded by
      the intro card and companion cheer, and now unlocks for real per `09` §3.6.
- [ ] A game makes exactly two network requests per completed session — one `PATCH` to `08`'s
      difficulty endpoint, one `POST` to `09`'s quest-completions endpoint — and zero requests
      during an abandoned session or between individual rounds, confirmed via the browser's
      network tab.
- [ ] Every interactive element is keyboard-navigable with visible focus rings, and all motion
      respects `prefers-reduced-motion`.
- [ ] Correct/incorrect sound cues play the specified synthesized tones (not a placeholder audio
      file), are silent when Sound is off, and the incorrect tone never sounds buzzer-like or
      punitive.
- [ ] Each game runs its exact fixed round count (5 for Launch Challenge, 6 for Volcano Scale, 6
      for Face Detective) in normal mode, 8 in Boss mode — never a variable count.
- [ ] Face Detective's Hard-tier distractors for the 8 non-subtle emotions match the
      confusion-pairing table exactly, not arbitrary wrong options.
- [ ] Tutorial Island's first-game step reuses the real game component with no difficulty
      selector, no Boss Battle option, and no Text Mode toggle shown — fixed Easy, Visual Mode
      only — rather than a separately-built simplified game.
- [ ] Exiting any session before it finishes discards it silently — no partial summary, no saved
      state, confirmed by reopening the game and seeing a fresh session start.
- [ ] Calm Mode and Sound settings are readable from inside a mini-game (not just the Hub page),
      and — as a side effect — now persist across a reload, closing the limitation `05` had
      flagged.
