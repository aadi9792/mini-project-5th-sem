# Module: Skill World Template & Catalog
Read `00-global-context-and-rules.md`, `00a-visual-assets-and-style-guide.md`,
`02-child-profile-and-personalization.md`, `04-theme-system.md`, and `05-hub-shell.md` first.

**Scope of this doc:** the universal anatomy every Skill World follows (scoped down from the
original master spec for a realistic solo-built MVP), the full catalog of all 9 worlds (3 fully
designed, 6 light placeholders), the routing/transition architecture between the Hub and a world,
and the World Home screen template. It does **not** cover: the exact pixel-level UI or detailed
game logic for the three Arcade games (Launch Challenge, Volcano Scale, Face Detective — all go
in `07-mini-games.md`), real adaptive difficulty (`08-adaptive-difficulty.md`), or real
stars/rewards/Boss Battle unlock tracking (`09-rewards-and-economy.md`). This doc says *what
exists and what it's called*; `07` says *how it's built*.

**This doc also requires a retroactive fix to `05-hub-shell.md`**, flagged in §2 — don't skip it.

---

## 1. How to Use This Document

**Step 0 — the retroactive fix first.** Before building anything new, update `05`'s
`WorldEntryOverlay` per §2 below: it currently dismisses back to wherever it was triggered from
(correct when this doc didn't exist) and must now navigate to the real world page instead.

**Step 1 — backend/constants.** Tell the agent:
> "Read docs `00`, `00a`, `02`, `04`, `05`, and `06-skill-world-template-and-catalog.md`. First
> apply the `05` fix in §2. Then build the catalog constant in §4.1 (all 9 worlds) and update
> `data.ts`'s `color` fields for Time and Feelings per §3.7/§3.8's collision fix. Don't build any
> game logic yet — that's `07`."

**Step 2 — the World Home screen and routing.** Build the `/worlds/[worldId]` route (§3.3, §3.4),
the difficulty selector (§3.5), and the full transition chain (§3.3) — using placeholder "Coming
Soon" content where `07`'s actual games would plug in, if `07` isn't built yet.

**Step 3 — once `07` exists**, wire its three games into the Play/Boss Battle buttons this doc's
World Home screen already has slots for.

**When this module is "done":** every item in §7 verified. This doc's original ceiling — Boss
Battle access depending on `09` tracking real play counts — is now resolved: `09`
§3.6 makes Boss Battle unlocking real. Re-verify §7 against real unlock behavior before marking
§2 🟢, rather than the permanently-locked state this doc originally shipped with.

---

## 2. Current Status

🔴 **Nothing in this doc is built yet.**

**Retroactive fix required to `05-hub-shell.md` §3.3:** that doc correctly specified, at the time
it was written, that `WorldEntryOverlay` simply dismisses after playing because no real per-world
content existed yet. Now that this doc exists, that's wrong — **`WorldEntryOverlay`'s `onDone`
must navigate to `/worlds/{worldId}` instead of just closing**, for every trigger point `05`
defined (the map, Today's Quests, the Companion's "Let's go" button) and the World Atlas's own
"Enter" button. Update `05`'s file before or alongside building this doc — don't leave both docs
describing contradictory behavior.

---

## 3. Frontend & UI

### 3.1 Visual system
Fully reuses the Hub's existing playful visual language (`00` §6, `00a` §2's placeholder-emoji
policy) — no new design system. Each world's own signature color (§3.6–3.8) accents its
World Home screen header/cards, layered on top of whichever theme is active, exactly like the
companion accessory badges in `00a` §3.2 layer onto the active theme rather than replacing it.

**Verified for Dark Mode (`04` §3.2a), no change needed:** each world's signature color (Time
`#d4a24c`, Feelings `#e8935a`, Faces `#a79be0`) stays identical in Dark Mode — real contrast was
computed, not assumed: 6.27:1–6.76:1 as an accent/text color against Dark `--sv-card`, and
4.93:1–5.32:1 with the `--sv-ink` token (`00` §6.2.1) as text on a solid fill of any of them. If
this doc's World Home screen ever places text directly on a solid fill of a world's signature
color, that text must use `--sv-ink`, never `var(--sv-text)` — the same rule that applies to the
functional success/attention/warning tokens, for the same reason (the pairing depends on the
accent's own fixed lightness, not the page's light/dark mode).

### 3.2 Universal anatomy (scoped down from the master spec for this MVP)
Every Skill World — MVP or not — follows the same skeleton, deliberately lighter than the
original spec's vision (8–12 episode campaigns, a separate Side Quests feature, and a full
Knowledge Vault are more content production than a solo-built prototype can realistically carry):

1. **Story framing** — a single short paragraph (2–3 sentences), not a serialized campaign, shown
   in full every time the World Home screen is visited (not just the first time — short enough
   that repetition isn't friction, and it keeps the narrative hook present).
2. **Arcade** — exactly one replayable mini-game per world (Side Quests and Arcade are
   deliberately merged into this single concept — replaying the same game *is* the side-quest
   repetition the spec wanted).
3. **Boss Battle** — not a separate game design, a harder/timed variant of the same Arcade game.
4. **Knowledge Vault** — 5 short "Did you know?" cards, always accessible, never gated (it's just
   reading, no reason to lock learning behind anything).

**Cross-cutting rule for every Arcade/Boss session, in every world, including future ones built
in `07`:** a session ends with an honest performance summary ("You got 5 of 6 right!"). When this
doc was first written, it also had to say "never a stars/rewards claim," since `09` didn't exist
yet to actually award or persist that currency — faking it would have been a more serious honesty
violation than any other ephemeral interaction in this app. **Resolved, now that
`09-rewards-and-economy.md` exists:** sessions now show a real reward line alongside the
performance line (`09` §3.5), never replacing the honest performance report, just adding to it.

**The companion's presence inside a Skill World (new — resolves a gap the master spec's own "the
pet travels into Skill Worlds" line left unaddressed until now).** The Companion Invariance Rule
(`03` §3.2) still applies: everything below is identical regardless of which species is active,
only the emoji/theme-accessory badge changes, and tapping the badge anywhere still opens the
Companion Closet in ≤2 taps, same as on the Hub.
- **World Home screen:** a small companion presence near the top, with a world-specific greeting
  line (§3.6–3.8 give the exact line per world).
- **During gameplay rounds, in every Arcade/Boss session:** a small companion badge (~48px, same
  emoji-in-gradient-circle treatment as everywhere else) stays fixed in the **bottom-left corner**
  of the game screen throughout — chosen specifically to avoid the primary answer buttons/actions,
  which are centered or bottom-right in every one of the 3 games. It reacts with a gentle
  bounce/scale animation
  **synced to each round's existing feedback moment** (the educational explanation every game
  already shows per round — `06` doesn't duplicate that text in a second speech bubble) — a more
  enthusiastic bounce on a correct answer, a smaller, calmer, still-positive bounce on an
  incorrect one. This is purely a supplementary visual flourish, not a second source of
  information — the actual explanation stays in the text feedback and its own `aria-live`
  announcement (`06` §3.10), so no screen reader user misses anything by not perceiving the
  bounce.
- **End-of-session performance summary:** a reaction line based on effort, not score — e.g. "You're
  really getting the hang of this!" for a strong session, "Good effort — every try helps you
  learn!" for any other outcome. Never discouraging, never a bare restatement of the score.
- **Boss Battle intro card:** a cheering line alongside the dramatic intro moment (§3.3) — e.g.
  "You've got this! I believe in you!"

### 3.3 Routing and the full transition chain

**Routing:** each world gets a real page at `/worlds/[worldId]` (e.g. `/worlds/time`) — the World
Home screen (§3.4) — not a modal, consistent with `/worlds` (Atlas) and `/wins` already being real
pages. The actual gameplay session is a **full-screen overlay launched from World Home**, not its
own route — short, immersive, single-purpose sessions don't need routing complexity, and a modal
takeover (same pattern as the Heart Button's Calm Cove) makes "exit mid-game" trivial.

| Transition | Behavior |
|---|---|
| Hub/Quests/Companion/Atlas → a world | `WorldEntryOverlay` plays (unchanged visual, per-theme emoji/verb from `04` §3.4) → on completion, **navigates to `/worlds/{worldId}`** (the §2 fix) |
| World Home appears | Simple fade/slide-in — no extra fanfare, the overlay already provided the big moment |
| "Play" tapped → difficulty picker | Quick fade into the Easy/Medium/Hard selector (§3.5) |
| Difficulty picked → game starts | A brief "Get Ready!" beat (~1–2s), then round 1 begins immediately — no second countdown ritual stacked on top of the entry animation |
| Game ends → performance summary | In-place transition (no navigation) — "Play Again" or "Back to {World Name}" |
| "Back to {World Name}" / exit mid-game | Fades back to the World Home screen, not all the way to the Hub |
| Boss Battle tapped (once unlocked by `09`) | A short, more dramatic intro card (e.g. "⚔️ The Final Countdown!") for ~2s, marking it as the elevated, concluding moment the spec intends — then the harder session begins |
| World Home → back arrow | Standard back-navigation to wherever the child came from (`/hub` or `/worlds`) — no special exit ritual, since this is a frequent, low-stakes action |

All transitions respect `prefers-reduced-motion` the same way as everywhere else in this app —
faster/static, never skipped outright.

### 3.4 World Home screen (`/worlds/[worldId]`) — layout
- Header: back arrow + the world's **per-theme name** (§3.6–3.8's tables) + emoji, accented in the
  world's signature color.
- Story framing paragraph (§3.2), shown in full every visit.
- The companion presence (§3.2) and its world-specific greeting line, near the top.
- Primary button: **"Play {Arcade Game Name}"** — large, prominent.
- Secondary button: **Boss Battle** — dimmed + lock icon + **"Unlocks after 3 plays"** while
  locked. **Resolved by `09-rewards-and-economy.md` §3.6:** this is now a real, live count (e.g.
  "Unlocks after 1 more play") rather than a permanently-stuck placeholder — `09` tracks actual
  per-child completions.
- A **Knowledge Vault** section — always accessible, shows its 5 cards (one at a time, with
  Next/Previous, or all 5 in a simple scrollable list — either is fine, not a meaningful design
  decision).

### 3.5 Difficulty selection (manual placeholder, not real adaptive difficulty)
Before any Arcade or Boss session, a simple **Easy / Medium / Hard** selector — three large
buttons, icon + label each. Pre-selects a default based on the child's `taskBreakdownGranularity`
derived preference (`02` §4.4): `fine` → Easy, `medium` → Medium, `coarse` → Hard. This is an
explicitly simple, non-adaptive placeholder — a child needing less step-by-step support defaults
to more challenge, nothing cleverer than that. Real performance-based adaptive difficulty is
`08`'s job entirely; don't build anything smarter here. The child can always override the default
before starting.

### 3.6 World of Time ⏱️

**Visual identity — a color collision fix:** `data.ts` currently gives this world `#4fa6c9`,
identical to the Space theme's `--sv-primary` — meaning under Space theme, the planet would
visually blend into the general UI rather than reading as its own identity. Fix: **`#d4a24c`**
(warm gold/amber, clock-and-gears association), distinct across all 3 themes.

**Per-theme names (given directly by the master spec's own example table — no invention needed):**

| Theme | Name |
|---|---|
| Space | Planet Chronos |
| Ocean | Time Reef |
| Jungle | Ancient Time Temple |

**Story framing:** *"Time has frozen across the kingdom, and only a hero who can master its
rhythm can set it right again. You're here to learn its secrets, one countdown at a time."*

**Companion greeting (§3.2):** *"Ready to master time with me?"*

**Arcade — "Launch Challenge."** Reuses the exact `RocketLaunchTimer` visual asset from `05`, but
reframed from a passive countdown into an active timing-skill game: the child must tap **"BLAST
OFF!"** at the exact moment the countdown hits zero.
- **Easy:** countdown numbers fully visible throughout.
- **Medium:** numbers disappear for the final 2 seconds, forcing some internal estimation.
- **Hard:** no numbers at all — just an initial "Ready?" cue; the child counts internally and taps
  when they think it's time, directly training internal time sense rather than number-watching.
- Scoring by proximity to zero: within 0.5s = "Perfect Launch!", within 1.5s = "Great Launch!",
  further = gentle encouragement, never framed as failure.
- 5–6 launches per session, varying lengths; theme-flavored copy reuses the exact table already
  built in `05` §3.3.

**Boss Battle — "The Final Countdown":** a rapid-fire run of consecutive Hard-tier launches
(hidden numbers), back to back, no break between them.

**Knowledge Vault:**
1. "Did you know? Brains are much better at judging short bits of time (a few seconds) than long
   ones (an hour) — that's totally normal."
2. "Breaking a big task into smaller timed chunks can make it feel a lot less overwhelming."
3. "Needing a countdown or timer to get started isn't a kid thing — lots of adults use them too."
4. "Transitions — stopping one thing to start another — are genuinely hard for a lot of brains. A
   little warning before a change really helps."
5. "Clocks exist because humans have always found time tricky to track just by feel!"

### 3.7 World of Feelings 🌋

**Visual identity — another color collision fix:** `data.ts` currently gives this world
`#e38b8b`, identical to the app's fixed, meaning-carrying `--sv-warning` token (`04` §3.1) — a
real risk of this world subconsciously reading as "something's wrong." Fix: **`#e8935a`** (warm
coral-orange — still warm/volcanic, clearly distinct from the warning token).

**Per-theme names (proposed, extending the existing Space name's pattern — spec gives no explicit
example for this world):**

| Theme | Name |
|---|---|
| Space | The Volcano Isles (already in `data.ts`) |
| Ocean | The Tidal Isles |
| Jungle | The Smoldering Peaks |

**Story framing:** *"Deep inside every hero lives a family of feeling-creatures — some calm, some
fiery, all needing to be understood. You're here to learn their names and how to care for each
one."*

**Companion greeting (§3.2):** *"Let's learn about feelings together!"*

**Arcade — "Volcano Scale."** Deliberately **not** a self-report game (scoring a child's own real
feelings would be the wrong move) — instead, third-person scenarios: e.g. *"Sam's tower of blocks
just got knocked over by their little brother."* The child judges the scenario's intensity using
**the exact same 4-icon scale already built for the Heart Button's zone check-in** (`03` §3.8) —
😌 Calm → 🙂 Okay → 😟 Worried → 🌋 Big Feelings — deliberately reusing the same visual vocabulary
app-wide rather than inventing a second scale. Then the child picks which support strategy might
help the character, reusing the same 4 strategies from `02`'s questionnaire (quiet time,
breathing, a trusted adult, movement). Multiple strategies can be valid; feedback is always
constructive.
- **Easy:** obvious-intensity scenarios, one clearly best strategy.
- **Medium:** more nuanced scenarios.
- **Hard:** ambiguous intensity, multiple reasonable strategies, real judgment required.
- 5–6 scenarios per session, ending in an honest summary ("You picked a thoughtful strategy for 5
  of 6 friends!").

**Boss Battle — "Storm of Scenarios":** rapid-fire, all Hard-tier, timed.

**Knowledge Vault:**
1. "Did you know? All feelings are okay to have, even the big uncomfortable ones — it's what we
   *do* with them that we practice."
2. "Feelings often build up slowly, like a volcano warming before it erupts. Catching them early
   makes them easier to manage."
3. "There's no single 'right' way to calm down — quiet time, movement, breathing, or talking to
   someone can all work."
4. "It's okay to ask for help when a feeling feels too big to handle alone."
5. "Noticing how your body feels — a fast heartbeat, clenched fists — can be an early clue that a
   feeling is building."

### 3.8 World of Faces 👀

**Visual identity:** emoji 👀, signature color `#a79be0` (existing value kept — no collision).

**Per-theme names:**

| Theme | Name |
|---|---|
| Space | Expression Nebula (already in `data.ts`) |
| Ocean | Mirror Lagoon |
| Jungle | Whispering Grove |

**Story framing:** *"Somewhere between what we say and how we feel, there's a story waiting to be
read. You're the detective who can read it."*

**Companion greeting (§3.2):** *"Let's practice reading faces together!"*

**Arcade — "Face Detective."** A large expressive emoji face is shown; the child picks from 4
emotion options (icon + label together). Uses **curated emoji faces, not bespoke illustration** —
emoji already has a wide expressive range (🙂 😏 🤨 😟 🥺 😳 🙄, not just 4 basic emotions), solving
the spec's "subtle expression" requirement with zero art cost.
- **Easy pool (4):** Happy 😊, Sad 😢, Angry 😠, Surprised 😲.
- **Medium adds:** Scared 😨, Disgusted 🤢, Confused 😕, Excited 🤩.
- **Hard adds, paired with a one-line context sentence:** Nervous 😬, Embarrassed 😳, Proud 😌,
  Skeptical 🤨 (e.g. *"Maya just found out her science project got picked for the fair."*).
- Always exactly 4 answer options per round; at harder tiers the 3 wrong options are deliberately
  commonly-confused pairs (e.g. "disgusted" vs. "angry"), teaching real discrimination rather than
  padding difficulty.
- Feedback is always educational: correct → a one-line reason why ("Her eyebrows are raised and
  her mouth is open — that's surprise!"); incorrect → the same kind of explanation, never a bare
  "Wrong."
- 5–8 rounds per session.

**Boss Battle — "The Final Case":** a timed run of all Hard-tier faces with context sentences.

**Knowledge Vault:**
1. "Did you know? A real smile reaches the eyes, not just the mouth — scientists call it a
   'Duchenne smile.'"
2. "Sometimes a face shows one feeling while someone feels something different inside — and
   that's okay. Everyone's face works a little differently."
3. "Raised eyebrows can mean surprise... or sometimes it just means someone's listening closely!"
4. "It's okay to just ask someone how they're feeling instead of guessing — most people like being
   asked."
5. "Faces, voice, and words all work together to show feelings. Even without seeing a face,
   someone's tone of voice gives clues too."

### 3.9 The 6 non-MVP worlds (light catalog entries only)
No story, arcade, boss, or vault content — these exist only as "Coming Soon" tiles on the World
Map and World Atlas (`05` §3.3/§3.4), each with a real tagline pulled directly from the master
spec's own world summary table (not invented), rather than a generic "Coming soon" placeholder:

| World | Emoji | Tagline |
|---|---|---|
| Memory | 🧠 | "A messenger carries messages across the land" |
| Courage | 💪 | "A hero shrinks scary 'what ifs' with small brave steps" |
| Words | 💬 | "A diplomat builds bridges between villages with words" |
| Focus | 🎯 | "A hero tames wild distractions to save the forest" |
| Senses | 🌿 | "A scientist maps a strange world's sights and sounds" |
| Life Skills | 🏠 | "A town grows as skills are built" |

No per-theme names, colors, or anatomy are defined for these 6 — not needed until they're
actually scheduled to be built (Phase 2+).

### 3.10 Accessibility & motion
Same bar as every other module: difficulty selector and all game interactions are
keyboard-navigable with visible focus rings; the Boss Battle intro card and every transition in
§3.3 respect `prefers-reduced-motion`; emotion/intensity options always pair icon with text label
(never relying on the emoji alone, since some can be visually ambiguous even to sighted users);
performance summaries are announced via `aria-live="polite"`.

### 3.11 What this module hands off to other docs
- `07-mini-games.md` owns the exact pixel-level UI and technical game logic for all three Arcade
  games, **including building the persistent in-game `GameCompanionBadge` from §3.2** into each
  one — this doc specifies the companion's behavior/content, `07` implements it inside the actual
  game loops.
- `03-companion-system.md` already owns the Companion Invariance Rule and the Companion Closet
  this doc's companion presence relies on — no changes needed to `03` itself for this addition.
- `08-adaptive-difficulty.md` will eventually replace §3.5's placeholder difficulty default with
  real performance-based adaptation.
- `09-rewards-and-economy.md` **now delivers on this** — real stars/rewards alongside every
  session's performance summary, and real Boss Battle unlock tracking, both replacing what used
  to be this doc's honest placeholders. Also added, beyond what this doc originally anticipated:
  Collectibles (`09` §3.9) earned from completed sessions in each world, using each world's own
  themed set — a new addition this doc didn't define but `09` ties back to these 3 worlds by id.
- **Resolved, now that `10-guardian-dashboard.md` is written:** its Mission Report shows per-world
  session counts (`10` §3.2's "Game sessions played" breakdown), mapping `GameProgress`/
  `QuestCompletion`'s `gameId` to this doc's world names via `skillWorldCatalog.ts` (§4.1) — the
  mapping this doc already defines, not a new one `10` invents.
- `02-child-profile-and-personalization.md` **depends on this doc**, the other direction from the
  above: Tutorial Island's "guided first mini-game" step is resolved as `recommendedWorldOrder[0]`'s
  Arcade game at Easy difficulty (per `02` §3.6 step 4) — this doc is what makes that resolution
  possible, by being the thing that actually defines what each world's Arcade game is.

---

## 4. Backend & File Architecture

### 4.1 Catalog data model
Like themes (`04` §4.1), the Skill World catalog is fixed application content, not a per-child
adoptable roster — a backend/frontend constant, not a database table. No new Prisma model.

```
// shared constant, e.g. skillWorldCatalog.ts
{
  id: "time" | "feelings" | "faces" | "memory" | "courage" | "words" | "focus" | "senses" | "life",
  emoji: string,
  status: "unlocked" | "locked",            // only time/feelings/faces are "unlocked"
  color: string,                             // signature hex, independent of active theme
  namesByTheme: { space: string, ocean: string, jungle: string }, // only set for the 3 unlocked worlds
  tagline: string,                           // real flavor text for all 9, per §3.6-3.9
  storyFraming: string | null,               // only set for the 3 unlocked worlds
  arcadeGameId: string | null,               // links to 07's game registry, null for locked worlds
  knowledgeVault: string[] | null,           // the 5 cards, only set for the 3 unlocked worlds
}
```

### 4.2 Business rules
- Boss Battle access depends on real per-child play counts (3 plays of the matching Arcade game),
  tracked by `09-rewards-and-economy.md`'s `GameProgress` model — no local/session-based
  approximation, same reasoning as Companion's level gates in `03`. (Before `09` existed, this was
  correctly, permanently locked — that was the honest placeholder for its time, not the final
  design.)
- The difficulty selector's choice is **local component state only**, not persisted — resets each
  session, until `08-adaptive-difficulty.md`'s real per-child, per-game profile replaces it (`08`
  §3.4 keeps this exact selector as an always-available override even after that).
- `data.ts`'s existing `color` fields for `time` and `feelings` must be updated to the collision
  fixes in §3.6/§3.7 as part of building this module — not a cosmetic nice-to-have, a correctness
  fix for the functional-token collision.

### 4.3 File architecture

```
skillverse-app/
├── src/lib/
│   └── skillWorldCatalog.ts          # NEW — §4.1's constant, all 9 worlds
├── src/app/(child-app)/worlds/
│   └── [worldId]/
│       └── page.tsx                  # NEW — World Home screen, §3.4
├── src/components/worlds/
│   ├── WorldHome.tsx                 # NEW — shared template rendering any world from the catalog
│   ├── DifficultySelector.tsx        # NEW — §3.5
│   ├── KnowledgeVault.tsx            # NEW — §3.4's vault section, reused by all 3 worlds
│   ├── BossBattleIntroCard.tsx       # NEW — §3.3's "⚔️" intro moment
│   └── GameCompanionBadge.tsx        # NEW — §3.2's persistent in-game companion badge, reused by
│                                      # all three games built in 07 (synced bounce on round feedback)
└── src/components/
    ├── CompanionPet.tsx               # reused as-is on World Home (§3.4) — no new component
    │                                   # needed there, same one already built/owned by 03
    └── WorldMap.tsx                   # edited: WorldEntryOverlay's onDone now navigates per §2,
                                        # instead of just closing
```

---

## 5. What You Need to Do, With Why
Nothing new. No external accounts or credentials needed for this module.

---

## 6. Explicitly Out of Scope for This Module
- **The three Arcade games' actual implementation.** Content/mechanics are specified here;
  pixel-level UI and technical build belong to `07`.
- **Real adaptive difficulty.** `08`'s job; §3.5 is an explicitly simple placeholder.
- **Real stars/rewards and Boss Battle unlock tracking.** `09`'s job; both stay honestly
  placeholder/locked until then.
- **Full story campaigns (8–12 episodes), a separate Side Quests feature, or art-heavy Knowledge
  Vaults.** Deliberately scoped down per §3.2 — a realistic choice for this project's size, not an
  oversight.
- **Any content/mechanics for the 6 non-MVP worlds beyond their tagline.** Phase 2+.

---

## 7. Acceptance Criteria / Definition of Done

- [ ] `05`'s `WorldEntryOverlay` navigates to `/worlds/{worldId}` on completion for every trigger
      point (map, quests, companion button, World Atlas) — verified none of them still just
      dismiss back to their origin.
- [ ] `data.ts`'s `time` and `feelings` colors are updated to the collision fixes, confirmed
      visually distinct from `--sv-primary` and `--sv-warning` respectively across all 3 themes.
- [ ] Each of the 3 unlocked worlds' World Home screen shows the correct per-theme name when the
      active theme is switched, without a page reload.
- [ ] The companion appears with the correct world-specific greeting on World Home, bounces in
      sync with per-round feedback during gameplay (never a separate/duplicate text bubble), shows
      an effort-based (not score-based) reaction line at session end, and cheers on the Boss
      Battle intro card — verified for at least one of the 3 worlds end to end.
- [ ] Tapping the companion badge anywhere inside a Skill World still opens the Companion Closet,
      same as on the Hub.
- [ ] The story framing paragraph shows in full on every visit, not just the first.
- [ ] The difficulty selector pre-selects correctly based on `taskBreakdownGranularity`, and the
      child can override it.
- [ ] Every Arcade/Boss session ends with a performance summary, now alongside real reward values
      from `09` — the performance line is never replaced or hidden by the reward line.
- [ ] Boss Battle is visibly locked with accurate, live "Unlocks after N more play(s)" copy until
      `09` reports 3 completed sessions, then becomes real and tappable — not permanently stuck.
- [ ] The Knowledge Vault's 5 cards are accessible with no gating, for all 3 unlocked worlds.
- [ ] The 6 non-MVP worlds show their real taglines (§3.9) instead of a generic "Coming soon."
- [ ] The full transition chain in §3.3 matches exactly — no skipped or reordered steps (e.g., no
      second countdown stacked after "Get Ready!").
- [ ] All new interactive elements are keyboard-navigable and respect `prefers-reduced-motion`.
