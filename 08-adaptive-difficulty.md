# Module: Adaptive Difficulty (The Just-Right Zone)
Read `00-global-context-and-rules.md`, `02-child-profile-and-personalization.md`,
`03-companion-system.md`, `06-skill-world-template-and-catalog.md`, and `07-mini-games.md` first.

**Scope of this doc:** replacing `07`'s manual difficulty default with real, performance-and-
regulation-based adaptation. It does **not** redesign any game's difficulty-tier content (`07`
owns that fully — Easy/Medium/Hard bands, scenario banks, emotion pools all stay exactly as
written); this doc only changes *what decides which tier gets served*, and *what gets
remembered between sessions*.

---

## 1. How to Use This Document

**Step 0:** nothing new to set up.

**Step 1 — backend first.** Tell the agent:
> "Read docs `00`, `02`, `03`, `06`, `07`, and `08-adaptive-difficulty.md`. Build the
> `GameDifficultyProfile` model (§4.1) and the two endpoints in §4.3. Don't touch any frontend
> game code yet."

**Step 2 — the `useDifficultyProfile` hook and `MiniGameShell` integration.** Tell the agent:
> "Build the `useDifficultyProfile` hook from §4.4, then integrate it into `07`'s
> `MiniGameShell` — this is an edit to existing code, not a new shell. Replace the manual
> default (currently from `taskBreakdownGranularity`) with the profile's current tier, while
> keeping the manual override selector working exactly as before."

**Checkpoint:** play a game to 3 consecutive strong results and confirm the tier steps up
mid-session; do the same for 3 consecutive struggles; trigger a distress zone check-in
mid-session and confirm an immediate step-down; complete a session and confirm the resulting
tier persists to the next session; abandon a session early and confirm nothing persists at all.

**When this module is "done":** every item in §7 verified.

---

## 2. Current Status

🔴 **Nothing in this doc is built yet.** `07`'s games currently use a static, non-adaptive
default (from `02`'s `taskBreakdownGranularity`) every single session. This doc's job is to
replace that default with a real, evolving per-game profile, without touching any of `07`'s
actual game content.

---

## 3. Frontend & UI

### 3.1 Visual system
No new visual system — this doc is almost entirely logic, not UI. The only visible additions are
a couple of companion reaction lines (§3.6), reusing the exact companion presence system already
built in `06`/`07`. No new screens, no new colors, no new components beyond a lightweight hook.

### 3.2 The adaptive algorithm

**Per-game "strong" vs. "struggle" definitions** (resolves a real gap — Launch Challenge has 3
outcome levels, the other two only have 2):

| Game | "Strong" (counts toward step-up) | "Struggle" (counts toward step-down) |
|---|---|---|
| Launch Challenge | Perfect Launch **or** Great Launch | Nice-try outcome only |
| Volcano Scale | Accurate intensity judgment | Inaccurate intensity judgment |
| Face Detective | Correct answer | Incorrect answer |

(Volcano Scale's unscored strategy choice, per `07` §3.5, never factors into this at all.)

**The rule:** 3 consecutive strong results → step up one tier (Easy→Medium→Hard, capping at
Hard). 3 consecutive struggle results → step down one tier (capping at Easy). Always exactly one
tier per step — never skips. A result of the opposite type resets the counter to 0 immediately
(strict consecutive, not a sliding window). This happens **live, within a session** — a child can
move through multiple tiers in one sitting. **A tier change only ever affects the *next* round
onward** — the round that just triggered the change was already generated and shown at the old
tier, and is never retroactively altered.

**Cold start:** a child with no `GameDifficultyProfile` row yet for a given game starts from the
exact same default `07`/`02` already established (`taskBreakdownGranularity`: `fine`→Easy,
`medium`→Medium, `coarse`→Hard) — no second cold-start mechanism invented.

### 3.3 Regulation-state integration (the distress step-down)
If the child opens the Heart Button mid-session and checks in **"Worried"** or **"Big
Feelings"** (`03` §3.8), the active game immediately steps down one tier for the rest of that
session, resets both streak counters to 0, and does **not** auto-escalate back up later in the
same sitting even if performance improves — per the earlier design discussion, re-establishing a
harder tier right after a visibly hard emotional moment would be the wrong instinct. **"Calm"**
and **"Okay"** check-ins have no effect on difficulty at all.

**Critically, this must never permanently lower a child's assessed skill** — an emotional moment
is not a performance signal. The mechanism: track a running `distressDropCount` (how many tiers
have been dropped specifically by distress events this session, not performance). At session end,
before persisting, the actually-served tier is bumped back up by `distressDropCount` (capped at
Hard) — effectively "refunding" exactly the distress-driven drops while still keeping any genuine
performance-driven drops that happened independently.

**Worked example:** profile starts at Hard. A distress check-in drops the served tier to Medium
(`distressDropCount = 1`). The child then genuinely struggles at Medium (3 struggles) → served
tier drops again to Easy (this one is performance-driven, `distressDropCount` stays 1). Session
ends at Easy. Persisted tier = `min(Hard, Easy + 1) = Medium` — the distress drop is forgiven, but
the real performance-based struggle still counts, landing the child back at Medium rather than
either the harsh Easy or the un-earned original Hard.

### 3.4 Manual override (stays, per the decision made)
The Easy/Medium/Hard selector from `07` §3.3 still exists and still works exactly as before —
it's always available for a single session's override. The only change: it now **defaults to the
child's current adaptive tier** for that game instead of the static `taskBreakdownGranularity`
mapping. Choosing a manual override for one session doesn't change the underlying persistent
profile — the next session still offers the adaptive tier as the default, not the one-off manual
choice.

### 3.5 Boss Battle now scales — but is isolated from the ongoing adaptive loop (resolves a real
gap — "scaling" alone left open whether Boss Battle performance feeds back into the profile)
`07` §3.7 originally hardcoded Boss Battle to always serve Hard-tier content. That's now replaced:
Boss Battle draws from whatever the child's **current adaptive tier** is for that game **at the
moment they enter it** — still a harder, 8-round, auto-advancing format than a normal session, but
no longer always absolute Hard-tier content for every child regardless of their actual level.

**Boss Battle is a fixed-tier snapshot, not a live adaptive session:** the tier is locked for the
entire 8 rounds — no further step-up/step-down happens *during* a Boss Battle, and a distress
check-in during one still pauses/affects the session the same way (§3.3's pause behavior from `07`
still applies), but doesn't trigger a tier change since there's no lower tier to drop to mid-battle
in this design. **Boss Battle results are never committed to `GameDifficultyProfile` at all** —
good or bad performance in a Boss Battle has zero effect on the child's ongoing adaptive level.
This keeps Boss Battle's identity as the special, elevated "test yourself" moment the spec intends,
separate from the everyday training loop, and avoids strange feedback-loop edge cases (e.g. an
unusually lucky Boss Battle run artificially inflating a profile that normal play hadn't earned).
Because of this, **none of §3.6's tier-change companion reactions ever fire during a Boss Battle**
— only the existing Boss Battle intro/cheer lines from `06`/`07` apply there.

### 3.6 Companion reactions to tier changes
Reuses the exact companion presence system already built (`06` §3.2, `07` §3.2) — no new UI.
- **Step-up (performance):** *"Let's try something a little trickier!"*
- **Step-down (performance):** *"Let's ease into this together."*
- **Step-down (distress-triggered):** a distinctly gentler line, not the same as a plain
  performance step-down — *"Let's take it easy for a bit — I'm right here with you."*

### 3.7 Accessibility & motion
No new interactive elements beyond what `07` already built — this doc only changes which content
is served, not how it's presented. The companion's new reaction lines are announced via the same
`aria-live` pattern already established for round feedback.

### 3.8 What this module hands off to other docs
- **Resolved, now that `10-guardian-dashboard.md` is written:** it shows a child's current tier
  per game, read directly from this doc's `GameDifficultyProfile` — **visibility only, no override
  control** (`10` §3.2/§3.9's explicit decision). Override control remains a real, flagged future
  extension, not built by this doc or `10`.
- `09-rewards-and-economy.md` may eventually want tier-change events as input to its own
  reporting — this doc still doesn't log history for that purpose (§4.2), so that remains an
  explicit future extension, not an assumption to make now. **The dependency that actually
  materialized ran the other way**: `09` §3.12 built a shared `reliableCommit` retry-and-cache
  utility (originally for its own reward submissions) that this doc's `commitSession()` now also
  uses (§4.4) — worth noting since it's the opposite direction from what was anticipated here.

---

## 4. Backend & File Architecture

### 4.1 Prisma model

```
GameDifficultyProfile {
  id        String   @id @default(cuid())
  childId   String
  gameId    String   // "launch-challenge" | "volcano-scale" | "face-detective"
  tier      String   // "easy" | "medium" | "hard"
  updatedAt DateTime @updatedAt
  @@unique([childId, gameId])
}
```

### 4.2 Business rules
- **Minimal persistence, not a history log.** Only the current tier per child per game is stored
  — no round-by-round result history. That kind of analytics belongs to `09`/`10` if they ever
  need it, not this doc.
- **Commit only on real session completion.** The resulting tier is written to the backend
  **once**, when a session finishes normally — never per round (keeps gameplay responsive, no
  network round-trip between rounds) and never for an abandoned session (`07`'s existing
  "exiting mid-session discards everything" rule applies here too — no adaptive drift is ever
  persisted from a session that didn't finish).
- **Per-game, not global.** Three independent `GameDifficultyProfile` rows per child (one for
  each of `07`'s three games) — a child's level at Launch Challenge has no bearing on their
  starting tier at Face Detective.
- **Boss Battle never writes to this table.** Per §3.5, a Boss Battle session reads the current
  tier once at entry and never commits any result back, regardless of outcome — only normal
  sessions ever call `PATCH /difficulty/:gameId`.

### 4.3 API endpoints (`/api/v1/children/:id/difficulty/...`)

| Method & path | Request body | Success response | Notes |
|---|---|---|---|
| `GET /difficulty/:gameId` | — | `200 { tier }` | Returns the cold-start default (§3.2) if no row exists yet, not a 404 — this is a legitimate, expected state, not an error |
| `PATCH /difficulty/:gameId` | `{ tier }` | `200 { tier }` | Upserts; called once, only on real session completion, per §4.2 |

### 4.4 File architecture

```
skillverse-backend/src/children/difficulty/
├── difficulty.controller.ts
└── difficulty.service.ts          # owns the cold-start default + upsert logic

skillverse-app/src/lib/
└── useDifficultyProfile.ts        # NEW — fetches starting tier, exposes:
                                     #   sessionTier (local state, live during play)
                                     #   reportRoundResult(strong: boolean)   — §3.2's 3-in-a-row logic
                                     #   reportDistressCheckIn()              — §3.3's step-down + refund tracking
                                     #   commitSession()                      — PATCHes the final tier via
                                     #     09's shared reliableCommit.ts utility (09 §3.12/§4.4), not a bare
                                     #     fetch — so a network failure at session end retries automatically
                                     #     instead of silently losing the tier update
                                     #   discardSession()                     — no-op, called on mid-session exit

skillverse-app/src/components/games/
└── MiniGameShell.tsx               # edited (not rebuilt): wires useDifficultyProfile in place of
                                     # the static taskBreakdownGranularity default from 07 §3.3,
                                     # adds the §3.6 companion reaction lines on tier change
```

---

## 5. What You Need to Do, With Why
Nothing new. No external accounts or credentials needed for this module.

---

## 6. Explicitly Out of Scope for This Module
- **Any redesign of difficulty-tier content.** `07` owns every band, scenario, and emotion pool —
  untouched by this doc.
- **Round-by-round result history/analytics.** Deliberately minimal persistence — see §4.2.
- **Guardian override control over the adaptive profile.** Resolved as out of scope everywhere —
  `10-guardian-dashboard.md` gives read-only visibility only, never control (see §3.8 above).
- **Cross-game difficulty correlation** (e.g. inferring a Face Detective level from Launch
  Challenge performance). Explicitly per-game, independent profiles.
- **Any server-side validation of client-reported round results *for difficulty-tier purposes
  specifically*.** Updated during a full cross-doc audit — `09` now exists and does tie real
  Stars/Coins to a session's reported round results, so the original reasoning here ("no stake
  exists yet") is no longer accurate and would be dishonest to leave as-is. What's still true,
  and still the actual reason this stays out of scope: `09` §4.2 already raised its own bar for
  the *reward* side (the server recomputes the bonus formula from submitted round-by-round
  results, rather than trusting a client-provided total) — but it still ultimately trusts the
  client's claim about what happened each round, same as this doc's tier-stepping logic does. The
  real remaining exposure is a child (or a tampered request) fabricating round outcomes — but the
  stakes stay low by design regardless: this doc's tier only changes *which content plays next*,
  and `09`'s bonus is capped at a modest amount either way (10–15 Stars) in a single-player,
  non-monetized app with no leaderboard or competitive stake. Accepted as a reasonable trust model
  for this phase on that basis — not because there's "no stake," but because the stake that exists
  is small and the fix (full server-side game-logic replay) would be real, disproportionate scope
  for a solo-built demo. Revisit only if this project ever adds real monetary stakes or
  competitive/leaderboard features, neither of which is planned.

---

## 7. Acceptance Criteria / Definition of Done

- [ ] 3 consecutive strong results step the tier up exactly one level, mid-session, for all 3
      games — verified using each game's correct strong/struggle definition from §3.2's table.
- [ ] 3 consecutive struggle results step the tier down exactly one level, mid-session.
- [ ] A tier change never skips a level, and never moves below Easy or above Hard.
- [ ] A "Worried" or "Big Feelings" check-in mid-session immediately drops the tier by one level
      and does not re-escalate for the rest of that session, even after further strong results.
- [ ] The distress-drop "refund" formula from §3.3 produces the correct persisted tier — verified
      against the worked example (Hard → distress to Medium → performance struggle to Easy →
      persists as Medium, not Easy or Hard).
- [ ] A completed session's resulting tier is fetched correctly as the default at the start of the
      next session for that same game.
- [ ] Abandoning a session mid-way leaves the previous session's persisted tier completely
      unchanged — confirmed by checking the database directly, not just the UI.
- [ ] The manual override selector still works exactly as before, now defaulting to the adaptive
      tier instead of the static `taskBreakdownGranularity` mapping, and a manual choice doesn't
      alter the persisted profile.
- [ ] Boss Battle draws content from the child's current adaptive tier (snapshotted at entry), not
      hardcoded Hard — but its tier stays fixed for all 8 rounds and its outcome is never written
      to `GameDifficultyProfile`, confirmed by checking the database after a Boss Battle session.
- [ ] A tier change triggered by round N only affects round N+1 onward — round N's already-shown
      content is never retroactively altered.
- [ ] The companion shows the correct, distinctly different reaction line for performance step-up,
      performance step-down, and distress step-down — three different lines, not one reused for
      all three.
- [ ] `GET /difficulty/:gameId` returns the correct cold-start default for a child with no
      existing profile row, with a `200`, never a `404` treated as an error state.
- [ ] `commitSession()` uses `09`'s shared `reliableCommit` utility (once `09` exists), not a bare
      `fetch` — a simulated network failure at session end retries automatically rather than
      silently losing the tier update.
