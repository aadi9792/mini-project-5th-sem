# Module: Guardian Dashboard

Read `00-global-context-and-rules.md`, `00a-visual-assets-and-style-guide.md`,
`01-auth-and-account.md`, `02-child-profile-and-personalization.md`, `05-hub-shell.md` (the
Journey Line), and `09-rewards-and-economy.md` (the reward model this doc retroactively changes)
first. Skim `03-companion-system.md` (zone check-ins), `04-theme-system.md` (theme switching,
reused not reinvented here), and `08-adaptive-difficulty.md` (the profile this doc surfaces
read-only) — this doc reads their data but doesn't change their logic.

**Scope of this doc:** the entry point into guardian-facing screens and the parent-gate that
protects them (§3.1); the Mission Report (§3.2); real-life quest authoring — Quest Control,
finally replacing every other doc's "not built yet" placeholder (§3.3); the "needed reminders"
tap-log that makes the Mission Report's headline metric real (§3.4); Theme & Profile Control,
reusing existing endpoints rather than rebuilding them (§3.5); Screen-Time & Boundaries — quiet
hours and a read-only play-time summary (§3.6); and the Consent Center — real data export and
account deletion (§3.7). It does **not** cover: the Resource Hub or the Professional/therapist
layer (both explicitly Phase 2/3 in the master spec itself — see §6), multi-child support (one
child per guardian is locked, `01` §6), or a real in-game hint system (explicitly cut during this
doc's discussion — see §3.4's note on `hintDelaySeconds`).

---

## 1. How to Use This Document

**Step 0:** nothing new to set up.

**Step 1 — backend first, in this order (each piece is fairly independent of the others, unlike
most prior docs):**
1. `POST /auth/verify-password` + the guardian-action-token issuing/verification middleware
   (§4.2–4.3) — small, and every other guardian-only endpoint in this doc sits behind it.
2. `RealLifeQuest`/`RealLifeQuestTemplate` models + endpoints, including `reorder` and
   `repeat-yesterday` (§4.1–4.3) — the biggest piece.
3. The retroactive `QuestCompletion` change (§3.4/§4.1) — do this alongside step 2, since a
   completed real-life quest now needs to point at the `RealLifeQuest` it completed.
4. `ScreenTimeSettings`/`PlaySession` models + endpoints, including the heartbeat endpoint and the
   lazy 20-minute-cutoff aggregation logic (§4.1–4.3).
5. The Consent Center's export/delete endpoints (§4.3) — isolated, can be done any time.

**Step 2 — frontend, in this order:**
1. The parent-gate UI and its in-memory token context (§3.1), the new entry point on the existing
   Continue-as-Child screen, and the "Switch to Dashboard" row in `SettingsPanel.tsx` (retroactive
   edits to `01`/the Hub, done as part of this doc, not left as a TODO — see §3.9/§4.4).
2. Quest Control (§3.3) — this is what finally makes `05`'s Journey Line real instead of reading
   `src/lib/data.ts`'s mock `journeyStops`. Includes wiring up `@dnd-kit` for reordering.
3. The "needed reminders?" tap row inside `JourneyLine.tsx`'s existing Finish/Power-Down flow
   (§3.4) — small, but easy to forget since it lives inside `05`'s component, not this doc's own
   pages.
4. The Mission Report (§3.2) — build after 2–3, since it reads data produced by them plus what
   `03`/`08`/`09` already log.
5. Theme & Profile Control (§3.5), Screen-Time (§3.6, including the heartbeat ping from the Hub),
   Consent Center (§3.7) — independent of each other, any order.

**Checkpoint:** as a guardian, author a day's real-life plan from scratch, have a test child
complete one real-life quest and one mini-game session, log back into the dashboard (through the
parent-gate), and confirm the Mission Report shows both completions with real numbers — no
placeholder text anywhere.

**When this module is "done":** every item in §7 verified, §2 updated honestly.

---

## 2. Current Status

🔴 **Nothing in this doc is built yet.** This is the first module in the doc set with **zero**
existing code to build on — no guardian-facing screen exists anywhere in the real app today
(confirmed by searching `src/` for "guardian"/"dashboard": nothing). The Journey Line the child
sees is still 100% mock data (`src/lib/data.ts`'s `journeyStops` array) with no backend model
behind it at all — this doc is what makes it real.

---

## 3. Frontend & UI

### 3.1 Entry point and the parent-gate

**Entry point (retroactive edit to `01` §3.6's "Continue as [Child]" screen):** that screen
currently offers only "Continue as {child.name}" and a small "Not you? Log out" link — there is no
path to anything guardian-facing today. Add a second, visually secondary action below the main
"Continue as {child}" button: a text link reading **"View Dashboard"**. The "Continue as {child}"
button stays the prominent, primary action (matches how most visits to this screen will actually
be used — handing the device to the child) — the dashboard link is real but deliberately
de-emphasized, never competing with it visually.

**The parent-gate.** Guardian and child share one session with no separate token (`01` §4.2) — so
once a guardian taps "Continue as {child}" and hands the device over, nothing *technically* stops
the child from navigating back. The gate: tapping **"View Dashboard"** — whether from the
Continue-as-Child screen, or from a **"Switch to Dashboard"** link added to the Hub's Settings
panel (so a guardian doesn't have to log out and back in just to check progress mid-session) —
always shows a small modal first:
- Headline: **"Just checking it's you"**
- Body: **"Enter your password to view the Guardian Dashboard."**
- One password field (show/hide toggle, matching `01`'s existing field style), submit button
  **"Continue"**, and a **"Cancel"** link that returns to wherever the guardian/child came from.
- Calls `POST /auth/verify-password` (§4.3) — checks the password against the *already-logged-in*
  guardian's hash and, on success, returns a short-lived signed **guardian action token** (a
  separate JWT, not the main access/refresh tokens — §4.2) rather than just a boolean. It does
  **not** re-issue or touch the main session's tokens/cookies (no point going through rate-limiting
  lockout logic meant for actual authentication — this is a re-confirmation, not a login).
- Wrong password: inline error, same style as `01`'s login form errors, no lockout counter here
  (the real lockout already exists on `POST /auth/login` itself — this isn't a second attack
  surface, since getting it wrong just means staying on the Continue-as-Child screen or back in
  the Hub, not a security boundary being bypassed).

**Two genuinely distinct token tiers — not just a frontend convention.** The first draft of this
section said both "no caching, ever" and "checked via a recent pass," which can't both be true, and
even after fixing the wording, a single token type can't actually make "fresh pass per action" a
*server-enforced* guarantee — the server can't tell a 14-minute-old token from a 10-second-old one
unless the token itself says so. The real design carries an explicit `tier` claim:
- **`POST /auth/verify-password` takes `{ password, intent: "view" | "action" }`.** Same password
  check either way; the `intent` only changes the token it issues.
- **`intent: "view"` → a token valid 15 minutes, claim `tier: "view"`.** Held **in memory only**
  (a React context value — never `localStorage`, never a cookie, so a refresh or closing the tab
  clears it and the next visit starts fresh). Sent as `Authorization: Guardian {token}` on every
  dashboard `GET` request. This is what makes moving between the Mission Report, Quest Control,
  Profile Control, etc. during one visit not re-ask for the password on every click.
- **`intent: "action"` → a token valid only 90 seconds, claim `tier: "action"`.** Requested fresh,
  every single time, immediately before any mutating call (saving/deleting/reordering a quest,
  changing screen-time settings, exporting data, deleting the account) — never reusing a `view`
  token for this, even if it hasn't expired. Mutating endpoints require `tier: "action"`
  specifically (§4.2) — a `view` token is rejected outright, regardless of its own remaining
  validity, which is what makes "fresh pass per action" a real, server-checked guarantee rather
  than a hopeful frontend habit.
- **Stated, accepted residual limitation:** within an action token's own 90-second window, nothing
  stops it being reused if it were somehow intercepted — single-use/nonce tracking would close that
  further but needs a stored-token blacklist, real added infrastructure for a window this short and
  this soon after the guardian just typed their password. Not built here; noted rather than implied
  to be airtight.
- Once confirmed, the guardian lands on the Dashboard (§3.2 onward). Leaving the Dashboard (a
  **"Back to Hub"** or **"Log Out"** action in its header) discards the in-memory token
  immediately — no further gate is needed going the other direction, since the gate only protects
  the guardian-only side.


### 3.2 The Mission Report (the dashboard's home screen)

Per `00` §2 Commandment 2 and the master spec's own framing: **observable patterns, never a
diagnosis, never a score, never a ranking.** Every number here traces to a real table — nothing
is invented to look complete. This genuinely constrains the content: the master spec's own example
("started 2 of 7 scheduled tasks independently... fewer prompts") needed real "prompts needed"
data that didn't exist before this doc (§3.4 adds it, for real-life quests only — see that
section's note on why games aren't included).

**"This week," defined once, used everywhere in this section:** a rolling 7-day window ending
right now (not a calendar Mon–Sun week) — avoids any week-start-day/timezone ambiguity, and "last
week" is simply the 7 days before that window. Every stat below uses this same definition.

**Layout:** a simple scrollable page, no tabs — this is a weekly check-in, not a live dashboard a
guardian stares at. Sections, in order:

1. **This week at a glance** — 3–4 headline stat cards, each comparing this week to last week:
   - **Real-life quests completed:** "{X} of {Y} this week" with a small "{up/down/same} from last
     week" note.
   - **Reminders needed:** a simple 3-bucket breakdown of this week's completed real-life quests
     by their logged reminder level (§3.4) — "No reminders: {n} · A couple: {n} · A lot: {n}" —
     the closest honest equivalent to the master spec's "prompts needed" framing, scoped to what's
     actually logged.
   - **Game sessions played:** total count this week, broken down per world (Time/Feelings/
     Faces) using `GameProgress`/`QuestCompletion` grouped by `gameId` — mapped to world names via
     `06`'s `skillWorldCatalog.ts`.
   - **Stars & Coins earned this week:** a simple sum from `QuestCompletion`, not a running total
     (the running total already lives on the child's own Hub — this is about *this week's*
     activity specifically).
2. **How {nickname} has been feeling** — a simple bar/count of this week's `ZoneCheckIn` rows by
   zone (😌/🙂/😟/🌋), with the exact copy: **"{nickname} checked in {n} times this week."** No
   interpretation added beyond the raw counts — explicitly not a mood score or trend judgment, per
   the honesty rule.
3. **Badges & progress** — the child's `EarnedBadge` list (reusing `09` §3.10's badge catalog,
   read-only here) and, per game, the current adaptive tier from `GameDifficultyProfile`
   (`08`) — labeled plainly **"Currently playing at: Easy/Medium/Hard"** per game, **read-only,
   no override control** (deliberately the lower-risk half of `08`'s "visibility or control"
   question it flagged — control is a real future extension, not built here).
4. **A link to Quest Control** (§3.3) if this week's real-life plan hasn't been set up yet, or a
   quick summary + "Edit" link if it has.

**No real-time push.** The Dashboard fetches fresh data every time it's opened (matches `09`
§3.11's existing pattern of refetching the economy summary on Hub navigation, not a `ChildDataContext`-style
cache) — this project's current-phase stack is deliberately REST-only (`00` §5), so the master
spec's "WebSocket live update" vision for guardian↔child is explicitly deferred to that doc's
target phase, not built here. A guardian sees a **"Refresh"** button, not a live-updating feed.

### 3.3 Quest Control — real-life quest authoring (the single biggest net-new piece of this doc)

This is what finally gives `05`'s Journey Line a real backend behind it, replacing
`src/lib/data.ts`'s hardcoded `journeyStops` array.

**Daily, not recurring — a deliberate scope cut.** The master spec's own example ("7:40am —
guardian assigns the day") describes a daily ritual, not a recurring weekly schedule. Building a
full recurring-schedule system (day-of-week rules, exceptions, etc.) is real added complexity this
phase doesn't need. Instead: a guardian authors **today's plan** (or a future date, for
getting-ahead-of-time flexibility — a simple date picker defaulting to today, matching the native
`<input type="date">` style already acceptable elsewhere in this doc set for plain date entry), one
day at a time, with a one-tap **"Repeat yesterday's plan"** convenience action that copies
yesterday's stops (new rows, not references) into today — covers the common case (same morning/
bedtime routine most days) without building real recurrence.

**Template library (the 5 templates named directly by the master spec §13 — no invention
needed):** Morning Routine 🌅, Homework 📚, Meals 🍽️, Bath 🛁, Bed 🌙 — plus a **"Custom"** option
for anything else. Authoring flow:
- A **"+ Add a quest"** button opens a small sheet: pick a template (shows its emoji + label,
  pre-filled) or tap "Custom" (free-text label, plus an emoji picker from the same small curated
  set already used elsewhere in this app, per `00a` §2's placeholder-emoji policy — not a full
  emoji keyboard).
- **Reward value — guardian-set, per quest** (resolves the `09` collision — that doc's flat 10
  Stars + 5 Coins becomes this quest's *default*, not a hard rule): two number inputs, Stars
  (bounded 5–50 server-side) and Coins (bounded 0–25 server-side), pre-filled with 10/5 so a
  guardian who doesn't care can just tap through without deciding anything. The bounds exist so a
  typo (or a well-meaning guardian trying to be generous) can't produce an economy-breaking
  reward — matches the spirit of `09`'s existing bounded-formula approach even though this value
  isn't formula-derived.
- Quests are ordered in a **real drag-and-drop list** (mirrors the visual order they'll appear on
  the child's Journey Line). **Correction made during this doc's gap-check:** the first draft
  claimed this "reuses whatever reordering interaction `05`'s Today's Quests already established"
  — checked against the real text of `05` §3.3, and that's wrong: Today's Quests' reordering is a
  pure automatic sort by `recommendedWorldOrder`, with no user-facing drag interaction anywhere in
  this app to reuse. This is genuinely new. Use **`@dnd-kit/core`** (a modern React drag-and-drop
  library with built-in keyboard support, not raw HTML5 drag-and-drop) specifically because
  real-drag was the chosen option *with* its accessibility cost accepted — `dnd-kit`'s keyboard
  sensor (Space to pick up, Arrow keys to move, Space to drop, Escape to cancel) is what makes that
  cost actually payable without hand-rolling keyboard support from scratch.
- Dropping a quest in a new position calls `PATCH /journey/:childId/reorder` (§4.3) with the full
  ordered list of that day's quest ids in one call — applied atomically server-side, not as several
  individual `orderIndex` updates racing each other.
- **Edited/removed quests for *today* that the child hasn't reached yet** update live the next
  time the child's Hub refetches; a quest already marked "Finished" (i.e. already has a
  `QuestCompletion` row) can't be edited or removed — it's a completed historical record now, not
  a plan.

**What this replaces, exactly:** `05`'s Journey Line component currently renders
`journeyStops` from `src/lib/data.ts`. It now fetches `GET /journey/:childId/:date` (§4.3) instead,
returning that day's ordered `RealLifeQuest` rows. The on-screen "stations" visual (the
train-line metaphor), the Rocket Launch Timer, and the Power-Down Ritual are **all unchanged** —
only the data source changes, from a static array to a real per-day, guardian-authored list.

### 3.4 "Needed reminders?" — the tap-to-log that makes §3.2's headline metric real

**Real-life quests only — games are explicitly excluded, and here's why (found during this doc's
own discussion, not glossed over):** `02`'s personalization questionnaire already derives an
`hintDelaySeconds` value per child (Q9, `02` §4.4), implying a hint system — but no actual
in-game hint mechanic was ever built to consume it (`07`'s `MiniGameShell` has no hint button or
hint-timer logic anywhere). Building one now would mean reopening `07`/`08` for a real new
mechanic (what a hint looks like, how it interacts with adaptive difficulty, whether it's shown to
the child as help or silently logged) — a materially bigger scope than this doc's job. **Decision:
`hintDelaySeconds` stays dormant, logged here as a known, still-open gap** (joining the Time
Machine as a flagged-but-unbuilt item) — not silently dropped, not quietly built around.

**Real-life quests are cheap to instrument, by contrast**, because a human (the guardian, or the
child self-reporting) is already present and already taps "Finish" — no new mechanic needed, just
one more tap in a flow that already exists.

**Where it happens:** `05` §3.3's existing Power-Down Ritual (triggered by tapping "Finish" on the
current Journey Line stop) gains one small step, inserted **after** the ritual animation plays but
**before** `09` §3.5's `POST /quest-completions` call fires:
- A simple 3-option row, icon + label each (never color alone, per `00` §6.2): **"No
  reminders needed 🌟" / "Needed a couple 🙂" / "Needed a lot 💪"** — phrased supportively, not as
  a failure count (matches the gentle, never-punishing tone everywhere else in this app).
- This is answered by **whoever is holding the device at that moment** — could be the child
  self-reporting, could be a guardian nearby. The doc doesn't prescribe which, matching how the
  real Journey Line already works (a shared-device, shared-moment feature, not a monitored one).
- Tapping an option attaches `remindersLevel: "none" | "a_couple" | "a_lot"` to the
  `POST /quest-completions` call (§4.1's new `QuestCompletion` field) — one extra tap, not a
  separate flow or a second screen.
- **Skippable** — a small "Skip" link dismisses it with no value logged (`remindersLevel: null`);
  §3.2's Mission Report breakdown simply doesn't count skipped ones in any bucket. Never forced,
  matching the zone check-in's own "always optional" precedent (`03` §3.8).

### 3.5 Theme & Profile Control — reuses existing endpoints, builds no new ones

Both pieces of this master-spec requirement already have real backend endpoints from earlier
docs — this section is screens only, not new mechanisms:
- **Theme control:** shows the child's current theme (emoji + name, same display `04` §3.6 already
  uses in the Hub's own Settings panel) with a **"Change"** button that opens the exact same
  `ThemePicker.tsx` component, calling the exact same `PATCH /children/:id/theme` (`04` §4.3) — no
  second implementation, no guardian-specific theme logic.
- **Profile control:** the 12 `ChildPreferences` fields (`02` §4.1) are shown as a flat, editable
  list grouped by the same categories the original questionnaire used (sensory, routines/
  transitions, guidance, interests) — **not** a replay of `02`'s 8-step wizard. Each field edits
  in place and calls `PATCH /children/:id/preferences` (`02` §4.5) with just that one field, which
  that endpoint already supports (`02` §4.3: "accepts any subset of the 12 fields"). Nickname and
  age are also editable here, alongside the preferences (they live on `Child`, not
  `ChildPreferences`, but belong in the same "profile" screen from a guardian's point of view).
- Both changes take effect immediately for the child, with no special "re-sync" step — this is
  exactly what `02` §4.3 already designed this endpoint to support, now finally given a real UI.

### 3.6 Screen-Time & Boundaries

**Scoped to quiet hours + a read-only summary — no hard daily time cap.** A hard cap needs
mid-session warnings, a countdown, and a "time's up" interruption flow — real added complexity
this "basic" build deliberately skips. Quiet hours alone covers the master spec's clearest use
case (bedtime) without that complexity.

- **Setting quiet hours:** two simple time pickers, **"Quiet hours start"** / **"Quiet hours
  end"** (24h, stored as `"HH:mm"` strings), both optional — leaving either blank means quiet
  hours are off. Saved via `PATCH /children/:id/screen-time` (§4.3).
- **What happens when quiet hours hit (soft lock, not a hard block):** if the child is in the Hub
  (or opens it) during the configured window, the Hub content is replaced with a calm, full-screen
  message: a moon/stars emoji, headline **"It's quiet time until {end time}."**, body **"Time to
  rest — you can come back after that!"** — **no further interaction with Hub content**, but the
  **Heart button/Calm Cove stays reachable regardless** (non-negotiable per `00` §7: regulation
  access in ≤2 taps "in every mode," and quiet hours is explicitly "every mode," not an exception).
  This check runs client-side against the current time and the fetched `ScreenTimeSettings` — no
  server-side enforcement needed, consistent with this being a gentle household tool, not a
  security control.
- **Read-only play-time summary** (new `PlaySession` tracking, §4.1): a simple **"Played {X}
  minutes today, {Y} minutes this week"** line on the Mission Report (§3.2) or this screen —
  whichever reads better once built; no enforcement tied to it, purely informational.
- **Session boundaries, and how an abandoned session actually gets closed (a real gap the first
  draft hand-waved — it referenced `01`'s refresh-token window as an "idle timeout," but that's a
  flat 7–30 day *absolute* expiry, not an idle timeout, and no idle-detection exists anywhere in
  this app today):** a `PlaySession` row starts when "Continue as {child}" is tapped. While the
  child is in the Hub, it sends a lightweight **heartbeat** (`POST /play-sessions/:id/heartbeat`,
  §4.3) every 5 minutes, updating `lastHeartbeatAt`. A session ends in one of two ways:
  1. **Explicitly** — `POST /play-sessions/:id/end` fires with the real current timestamp the
     moment the parent-gate (§3.1) is successfully passed going back to the dashboard. This is the
     accurate, common case.
  2. **Lazily, at read time** — `GET /children/:id/screen-time`'s aggregation (§4.2) treats any
     `PlaySession` with `endedAt: null` whose `lastHeartbeatAt` is more than **20 minutes** old as
     having effectively ended at that last heartbeat. Nothing ever writes `endedAt` for this case
     (no background cron job needed, consistent with this project's REST-only, no-Redis-yet
     current phase, `00` §5) — the 20-minute cutoff is applied purely as a calculation rule
     whenever `todayMinutes`/`weekMinutes` are computed.

### 3.7 Consent Center — real data export and deletion

Per the locked decision, this is real, not a placeholder — but it's still built on top of `01`'s
existing, explicitly-labeled-placeholder consent *text* (the actual Terms/Privacy/consent copy
stays the honest "this is a placeholder, not a final legal agreement" banner from `01` §3.4/§3.7;
only the *mechanism* — can a guardian actually get their data or delete it — becomes real here).
These are independent axes: a real delete button next to placeholder legal copy is not a
contradiction, it's just two different, already-separately-flagged kinds of "not finished yet."

- **"What we store"** — a plain-language list (not a legal document) of what's collected,
  grouped by doc: account info (`01`), child profile + preferences (`02`), companion + zone
  check-ins (`03`), game progress + rewards (`09`), real-life quests (this doc). Links to the
  actual `ConsentRecord` row's `consentTextVersion` and `createdAt` so a guardian can see exactly
  what they agreed to and when. **This is also where the master spec's "correct" (of "export,
  correct, delete") actually lives** — not a separate mechanism, just a pointer: **"Need to fix
  something? Edit it directly in Profile Control"** (§3.5), which already allows correcting
  nickname, age, and every preference field. Stated explicitly so "correct" doesn't look like a
  silently-dropped third of the requirement.
- **"Export my data"** — calls `GET /guardian/export` (§4.3), which returns a single JSON file
  (triggers a browser download, not an inline view) containing every row across every table tied
  to that guardian and their child — a genuinely complete export of their *data*, with one
  explicit exception: **password hashes, refresh-token hashes, and verification/reset token values
  are never included**, even though they're technically "tied to that guardian" — exporting
  security material would itself be a security bug, not a completeness feature. Treated as a
  mutating-tier action (§3.1) — requires a fresh parent-gate pass immediately before the download
  starts, since it reveals the full dataset at once.
- **"Delete my account"** — a real, irreversible, cascading delete (`DELETE /guardian/account`,
  §4.3). Given the severity: requires a fresh parent-gate pass (§3.1) immediately before showing
  this option, then a confirmation step where the guardian must type the exact phrase **"delete
  {nickname}'s account"** (the child's real nickname, pulled live, not a generic "DELETE") before
  the button enables — a real, deliberate speed bump for an action with no undo, not decorative
  friction. On success, the response clears the guardian's own session cookies and redirects to
  the Welcome screen (`01` §3.1) — there's no account left to hold a session for, so this isn't
  optional cleanup, it's required for the app to behave sensibly afterward.

### 3.8 Accessibility & motion

Same bar as every other module: every screen here is keyboard-navigable with visible focus rings;
the parent-gate modal traps focus and is Escape-dismissible like every other modal in this app;
state changes (quest saved, password confirmed/rejected, export triggered) are announced via
`aria-live="polite"`; the quiet-hours lock screen's headline/body pairing never relies on the
moon emoji alone to convey meaning. This entire module is adult-facing, so `00` §6's
large-tap-target/short-copy rules are relaxed here the same way `01`'s guardian-facing Auth
screens already relax them — information density can be higher than anywhere in the child's Hub.

### 3.9 What this module hands off to other docs, and retroactive edits made here

- **`01-auth-and-account.md`** — the Continue-as-Child screen (§3.6 there) needed a second
  "View Dashboard" action; this doc added it directly (§3.1 above) rather than leaving a dangling
  note, since no other doc was ever going to touch that screen again.
- **`05-hub-shell.md`** — the Journey Line's data source changes from `src/lib/data.ts`'s mock
  `journeyStops` to this doc's real `GET /journey/:childId/:date`, and the Power-Down Ritual gains
  §3.4's one extra tap before `09`'s completion call fires. Both are this doc's responsibility to
  implement when `05`'s components are touched for real — not a rewrite of `05`'s own spec, since
  the visual Journey Line itself (stations, timer, ritual) is completely unchanged.
- **`09-rewards-and-economy.md`** — the flat "10 Stars + 5 Coins" `REAL_LIFE` reward (§3.5 there)
  becomes a per-quest guardian-set default instead, and `QuestCompletion` gains two new fields
  (`realLifeQuestId`, `remindersLevel`) — see §4.1 below for the exact schema change, and `09`'s
  own file has been updated to point here rather than silently going stale (done in this same
  session — see the end of this doc's edits).
- **`08-adaptive-difficulty.md`** — its "guardian visibility or control" open question (§3.8/§6
  there) is resolved as **visibility only, no override control** — this doc shows the current
  tier per game, read-only. Control remains a real, flagged future extension, not built anywhere.
- **The Time Machine** (flagged open by `05` and `09`, still unresolved) and **real in-game hint
  tracking** (§3.4's `hintDelaySeconds` gap) **both remain genuinely open** — this doc deliberately
  does not pick either one up, for the reasons stated in §3.4 and this doc's own scope discussion.
  Both are now flagged in three docs each, not silently forgotten.

---

## 4. Backend & File Architecture

### 4.1 Data model (extends the shared `schema.prisma`)

```
RealLifeQuestTemplate {   // seeded once: the 5 master-spec templates + an implicit "custom" (null templateId)
  id    String @id        // "morning-routine" | "homework" | "meals" | "bath" | "bed"
  label String
  emoji String
}

RealLifeQuest {            // a guardian-authored Journey Line stop for one specific day
  id           String   @id @default(cuid())
  childId      String
  templateId   String?                  // null if fully custom; references RealLifeQuestTemplate
  label        String                   // pre-filled from template, or guardian's custom text
  emoji        String                   // pre-filled from template, or guardian's picked emoji
  scheduledFor DateTime                 // the calendar day this stop belongs to (date only, time-of-day is implicit position)
  orderIndex   Int                      // position within that day's Journey Line
  rewardStars  Int      @default(10)    // guardian-set, 5-50 enforced server-side
  rewardCoins  Int      @default(5)     // guardian-set, 0-25 enforced server-side
  createdAt    DateTime @default(now())
}

// Retroactive change to 09's QuestCompletion:
QuestCompletion {
  id              String   @id @default(cuid())
  childId         String
  questType       String   // "GAME" | "REAL_LIFE"
  gameId          String?  // set for GAME type, null for REAL_LIFE
  mode            String?  // "normal" | "boss", set for GAME type only
  realLifeQuestId String?  // NEW — set for REAL_LIFE type, null for GAME; links to the specific RealLifeQuest completed
  remindersLevel  String?  // NEW — "none" | "a_couple" | "a_lot" | null (skipped); REAL_LIFE only, always null for GAME
  starsAwarded    Int
  coinsAwarded    Int
  completedAt     DateTime @default(now())
}

ScreenTimeSettings {
  id               String  @id @default(cuid())
  childId          String  @unique
  quietHoursStart  String? // "HH:mm", null = off
  quietHoursEnd    String? // "HH:mm", null = off
}

PlaySession {
  id              String    @id @default(cuid())
  childId         String
  startedAt       DateTime  @default(now())
  lastHeartbeatAt DateTime  @default(now())   // NEW — updated every 5 min while the child is in the Hub
  endedAt         DateTime?                   // only ever set by an explicit end (§3.6); the lazy
                                               // 20-min-since-heartbeat cutoff is a read-time
                                               // calculation, never written back to this column
}
```

No new model is needed for the Consent Center's export/delete — both are stateless operations
against data that already exists. The parent-gate (§3.1) also needs no new model: its guardian
action token is a stateless signed JWT (§4.2), not a database row.

### 4.2 Business rules

- `rewardStars`/`rewardCoins` on `RealLifeQuest` are clamped server-side to 5–50 and 0–25
  respectively, regardless of what the frontend sends — same defense-in-depth pattern used
  throughout this doc set.
- A `RealLifeQuest` that already has a matching `QuestCompletion` row (via `realLifeQuestId`)
  cannot be edited or deleted — enforced server-side, not just hidden client-side (§3.3).
- "Repeat yesterday's plan" creates brand-new `RealLifeQuest` rows for today (copying label/emoji/
  templateId/rewards/order from yesterday's rows) — never references or moves yesterday's rows.
- **The guardian action token (resolves §3.1's real contradiction found during gap-check — the
  first draft said both "no caching" and "checked via a recent pass," which can't both be true, and
  a single undifferentiated token couldn't make "fresh per action" server-enforceable anyway):**
  `POST /auth/verify-password` is a pure password-hash comparison against the already-authenticated
  guardian, rate-limited the same way as other auth-adjacent endpoints (5 attempts/60s, per `01`
  §4.6's existing pattern) to prevent it being used as a password-guessing oracle. On success it
  issues a **separate JWT** (signed with its own `JWT_GUARDIAN_ACTION_SECRET`, payload
  `{ sub: guardianId, tier: "view" | "action", iat, exp }` per the caller's requested `intent`,
  §3.1) — never touching the main access/refresh tokens or their cookies. **Viewing endpoints
  (`GET`) accept either `tier`, as long as unexpired; mutating endpoints require `tier: "action"`
  specifically**, verified server-side by signature + claim + expiry — this is real enforcement,
  not a client-side-only convention. A `view` token presented to a mutating endpoint is rejected
  with a `401` even if it hasn't expired — this is what actually guarantees "fresh pass per
  action," not just frontend habit.
- `DELETE /guardian/account` cascades through every table keyed by `guardianId`/`childId` in a
  single transaction — partial deletion is treated as a failure state, not an acceptable partial
  outcome, given the irreversibility. On success, also clears the guardian's main session cookies
  (§3.7) — there's no account left to hold a session for.
- `GET /guardian/export`'s JSON omits `Guardian.passwordHash`, every `RefreshToken.tokenHash`, and
  every `EmailVerificationToken`/`PasswordResetToken` value — security material isn't "the
  guardian's data" in the sense this feature means, and shipping it in a downloadable file would be
  a real vulnerability, not a feature (§3.7).
- `GET /children/:id/screen-time` returns a default shape (`settings: { quietHoursStart: null,
  quietHoursEnd: null }`, `todayMinutes: 0`, `weekMinutes: 0`) if no `ScreenTimeSettings` row
  exists yet for that child, rather than a `404` — the same "missing row is a legitimate cold-start
  state, not an error" precedent `08` §4.3 already established for `GameDifficultyProfile`.
- **Closing the real gap the first draft left open:** a `PlaySession` is marked ended either by an
  explicit `POST /play-sessions/:id/end` call, or lazily at read time if `lastHeartbeatAt` is more
  than 20 minutes old (§3.6) — no background job computes or writes this; it's applied purely as a
  `WHERE`/calculation condition inside `GET /children/:id/screen-time`'s aggregation query.
- Quiet-hours enforcement is client-side only (§3.6) — deliberately not re-validated server-side,
  since nothing server-side is actually blocked (a child could, in principle, still complete a
  session via a direct API call during quiet hours; this is a household gentle-nudge tool, not an
  access-control system, and treating it as one would be a false sense of security not worth the
  added complexity).

### 4.3 API endpoints

All endpoints below except `POST /auth/verify-password` and the `/play-sessions/*` trio require a
valid guardian action token (§4.2) in the `Authorization: Guardian {token}` header — a `401` if
missing/expired/invalid. The `/play-sessions/*` endpoints are called from the *child* side of the
shared session (starting a session, heartbeating, ending it) and deliberately don't require this
token — they're not guardian actions.

| Method & path | Request body | Success response | Notes |
|---|---|---|---|
| `POST /auth/verify-password` | `{ password, intent: "view" \| "action" }` | `200 { verified: true, guardianActionToken, tier, expiresInSeconds }` (900 for `view`, 90 for `action`) or `401` | §3.1's parent-gate; never touches the main session's tokens/cookies |
| `GET /journey/:childId/:date` | — | `200 { quests: RealLifeQuest[] }` | `date` as `YYYY-MM-DD`; replaces `05`'s mock `journeyStops`; viewing-tier |
| `POST /journey/:childId` | `{ templateId?, label, emoji, scheduledFor, rewardStars, rewardCoins }` | `201 { quest }` | Action-tier — frontend always fetches a fresh token right before this call (§3.1) |
| `PATCH /journey/quests/:id` | any subset of the fields above | `200 { quest }` | Action-tier; rejects if a `QuestCompletion` already references this quest (§4.2) |
| `DELETE /journey/quests/:id` | — | `204` | Action-tier; same rejection rule as `PATCH` |
| `PATCH /journey/:childId/reorder` | `{ date, orderedQuestIds: string[] }` | `200 { quests: RealLifeQuest[] }` | NEW — the real drag-and-drop's drop event (§3.3); applies all `orderIndex` values atomically |
| `POST /journey/:childId/repeat-yesterday` | `{ forDate }` | `201 { quests: RealLifeQuest[] }` | Action-tier; §4.2's copy behavior |
| `GET /dashboard/mission-report/:childId` | — | `200 { ...§3.2's aggregated data }` | Viewing-tier; one call, pre-aggregated server-side |
| `PATCH /children/:id/screen-time` | `{ quietHoursStart?, quietHoursEnd? }` | `200 { settings }` | Action-tier |
| `GET /children/:id/screen-time` | — | `200 { settings, todayMinutes, weekMinutes }` | Viewing-tier; pre-aggregates `PlaySession` rows server-side, defaults per §4.2 if no row exists |
| `POST /play-sessions/start` | — | `201 { sessionId }` | Called when "Continue as {child}" is tapped; no guardian token (child-side) |
| `POST /play-sessions/:id/heartbeat` | — | `200` | NEW — every 5 min while the child is in the Hub; no guardian token (child-side) |
| `POST /play-sessions/:id/end` | — | `200` | Called on parent-gate success; no guardian token (child-side) |
| `GET /guardian/export` | — | `200` (file download, `application/json`) | Action-tier — fresh token required immediately before (§3.7) |
| `DELETE /guardian/account` | `{ confirmationPhrase }` | `204` | Action-tier; rejects with `400` unless `confirmationPhrase` exactly matches §3.7's required text; also clears the main session's cookies on success |

### 4.4 File architecture

```
skillverse-backend/src/
├── journey/
│   ├── journey.controller.ts
│   ├── journey.service.ts
│   └── real-life-quest-template.seed.ts   # seeds the 5 RealLifeQuestTemplate rows from §3.3 —
│                                            # naming fixed to match the .seed.ts convention every
│                                            # other seeded catalog in this doc set already uses
│                                            # (CompanionTemplate, ShopItemCatalog, etc.), not a
│                                            # one-off .constant.ts
├── dashboard/
│   ├── dashboard.controller.ts
│   └── dashboard.service.ts                    # §3.2's server-side aggregation
├── screen-time/
│   ├── screen-time.controller.ts
│   └── screen-time.service.ts
├── play-sessions/
│   ├── play-sessions.controller.ts
│   └── play-sessions.service.ts
├── guardians/
│   ├── guardians.module.ts         # NEW — see note below the tree
│   ├── guardians.controller.ts     # export/delete, §3.7
│   └── guardians.service.ts
└── auth/
    └── (extends existing auth module from 01) — adds verify-password to
        auth.controller.ts, auth.service.ts
```

**Correction made during a full cross-doc audit:** this section previously said `guardians/`
"extends existing guardian module from 01" — checked against `01`'s real file tree and that's
wrong, no `guardians/` module exists there; all of `01`'s guardian-related logic (signup, login,
etc.) lives entirely inside its own `auth/` module. `guardians/` is a genuinely **new** module,
introduced by this doc, the first place `Guardian`-as-a-resource (export/delete, §3.7) gets its
own dedicated controller/service — not an extension of anything pre-existing.

```
skillverse-app/src/app/(guardian)/
├── dashboard/page.tsx              # §3.2, the Mission Report
├── dashboard/quests/page.tsx       # §3.3, Quest Control
├── dashboard/profile/page.tsx      # §3.5, Theme & Profile Control
├── dashboard/screen-time/page.tsx  # §3.6
└── dashboard/consent/page.tsx      # §3.7

skillverse-app/src/components/
├── ParentGateModal.tsx              # NEW — §3.1; also owns the in-memory guardian-action-token
│                                     # context (never localStorage/cookies, per §3.1)
├── QuietHoursLockScreen.tsx         # NEW — §3.6
├── SettingsPanel.tsx                 # edited: new "Switch to Dashboard" row (§3.1), below the
│                                     # existing Theme/Dark Mode rows from `04`
└── JourneyLine.tsx                  # edited: fetches real quests (§3.3) instead of mock data via
                                      # `GET /journey/:childId/:date`, gains §3.4's reminders-level
                                      # tap row inserted into the existing Finish/Power-Down flow

skillverse-app/src/app/(auth)/continue-as/page.tsx
└── edited: adds the "View Dashboard" link (§3.1) next to the existing "Continue as {child}" button

skillverse-app/src/app/(guardian)/dashboard/quests/page.tsx
└── uses the new `@dnd-kit/core` + `@dnd-kit/sortable` dependencies (§3.3) — the only new
    frontend package this module adds

skillverse-backend/.env
└── adds `JWT_GUARDIAN_ACTION_SECRET` (§4.2) — a distinct secret from `JWT_ACCESS_SECRET` (`01`
    §4.2), so guardian action tokens and the main access token can never be confused for one
    another even if one secret were ever compromised
```

---

## 5. What You Need to Do, With Why

Nothing new. No external accounts or credentials needed for this module.

---

## 6. Explicitly Out of Scope for This Module

- **A real in-game hint system.** `hintDelaySeconds` stays dormant — see §3.4's full reasoning.
  Don't build this speculatively while touching `07`/`08`; it needs its own discussion first.
- **The Time Machine.** Still unbuilt, still flagged (now in `05`, `09`, and here) — not this
  doc's job, even though real-life quests now have real timestamps that would make it easier.
- **Recurring/scheduled quest templates** (e.g. "every weekday"). Deliberately cut for
  "repeat yesterday" instead — see §3.3's reasoning.
- **Hard daily screen-time caps, mid-session warnings, or forced logout.** Quiet hours only — see
  §3.6's reasoning. A "you've played for 30 minutes" cap is real future scope, not built here.
- **A real `GUARDIAN`/`CHILD` role system, or a separate child-vs-guardian main session token.**
  The underlying child-mode session is still the same one shared session it's always been (`01`
  §4.2, unchanged) — this doc doesn't change that. What *is* real (resolved during this doc's
  gap-check, §4.2): the guardian action token genuinely is checked server-side on every dashboard
  endpoint, via its own short-lived JWT — this is real enforcement for *those specific endpoints*,
  not a role system covering the whole app. The remaining honest limitation is narrower than the
  first draft stated: nothing stops someone from re-entering the correct password as often as the
  rate limit allows; the protection is "you must know the guardian's password," the same boundary
  `01`'s login already relies on, not a second independent secret.
- **The Resource Hub** (curated articles + therapist directory) and **the Professional layer**
  (therapist/teacher accounts). Both explicitly Phase 2/3 in the master spec itself (§18) — not a
  cut this project is making, just not yet in scope by the original plan.
- **Multi-child dashboards, child-switcher UI.** One child per guardian, locked (`01` §6).
- **Guardian override control over the adaptive-difficulty tier.** Visibility only — see §3.9.
- **Editing a `RealLifeQuest` that's already been completed.** It's a historical record at that
  point, not a plan — see §4.2.

---

## 7. Acceptance Criteria / Definition of Done

- [ ] The Continue-as-Child screen shows a working, visually secondary "View Dashboard" link that
      doesn't compete with the primary "Continue as {child}" button.
- [ ] Attempting to reach any `/dashboard/*` route without a valid guardian action token redirects
      to the gate modal/screen — tested by navigating there directly via URL with no token.
- [ ] The parent-gate accepts the correct password and rejects an incorrect one with an inline
      error, and never issues or changes the main session's cookie/tokens either way.
- [ ] A valid guardian action token lets a guardian move between dashboard pages (Mission Report →
      Quest Control → Profile) for up to 15 minutes without re-entering the password.
- [ ] Every mutating action (saving/deleting a quest, reordering, changing screen-time, exporting,
      deleting the account) re-opens the parent-gate and requests a fresh `intent: "action"` token
      immediately before it, never reusing the dashboard's existing `view` token.
- [ ] Directly calling a mutating dashboard endpoint (e.g. via `curl`/Postman) with no
      `Authorization: Guardian` header, an expired token, or — specifically — a **currently valid
      `view`-tier token**, is rejected with a `401` by the server itself in all three cases, not
      just hidden by the frontend. This last case is the one that actually proves the tier
      distinction is real and not cosmetic.
- [ ] An `action`-tier token correctly expires after 90 seconds and is rejected after that window.
- [ ] A guardian can author a full day's real-life plan from the template library and from
      scratch (custom), set a non-default reward value on at least one quest, reorder quests via
      real drag-and-drop, and see the correct result reflected on a test child's real Journey Line.
- [ ] The same reordering is fully achievable via keyboard alone (Space to pick up, Arrow keys to
      move, Space to drop, Escape to cancel) using `@dnd-kit`'s keyboard sensor — not mouse-only.
- [ ] "Repeat yesterday's plan" creates new rows for today, not references to yesterday's.
- [ ] A `PlaySession` with no heartbeat for over 20 minutes is correctly excluded from
      `todayMinutes`/`weekMinutes` beyond its last real heartbeat, without ever writing a fake
      `endedAt` value — confirmed by inspecting the database after simulating an abandoned session.
- [ ] A `PlaySession` that ends via a real parent-gate pass uses that real timestamp, not the
      lazy 20-minute cutoff, when both could technically apply.
- [ ] A `RealLifeQuest` with a completion against it cannot be edited or deleted (server
      correctly rejects, not just the UI hiding the option).
- [ ] Completing a real-life quest on the child side shows the reminders-level tap row (with a
      working Skip), and the selected value is correctly persisted to `QuestCompletion`.
- [ ] The reward actually paid out for a completed real-life quest matches that specific quest's
      guardian-set `rewardStars`/`rewardCoins` — not the old flat 10/5 — confirmed against a quest
      with a non-default value.
- [ ] The Mission Report's 4 headline sections all show real numbers from a test child's actual
      activity, with correct this-week-vs-last-week comparisons where specified.
- [ ] Editing a `ChildPreferences` field from the dashboard immediately affects the child's
      derived UI parameters (e.g. changing Q9's guidance answer changes `hintDelaySeconds`) with
      no separate "sync" step, matching `02` §4.3's existing design.
- [ ] Changing theme from the dashboard uses the same `ThemePicker.tsx`/endpoint as the Hub's own
      Settings panel — not a second implementation.
- [ ] Setting quiet hours correctly shows the lock screen on the child side during that window,
      with the Heart button/Calm Cove still fully reachable, and correctly does *not* show it
      outside the window.
- [ ] The play-time summary shows real, non-zero minutes after a test session, derived from real
      `PlaySession` start/end timestamps.
- [ ] "Export my data" downloads a real JSON file containing data from every relevant table, not
      a curated subset — and confirmed to **exclude** `passwordHash`, every `RefreshToken.tokenHash`,
      and every verification/reset token value, by inspecting the actual downloaded file.
- [ ] The Consent Center's "correct" section links to, and Profile Control's edits are reflected
      by, the same underlying data — not two disconnected ideas of "the profile."
- [ ] "Delete my account" requires a fresh `action`-tier token and typing the exact confirmation
      phrase before the button enables, actually removes every related row across every table on
      confirmation — verified by checking the database after, not just the UI redirecting away —
      and correctly clears the guardian's own session cookies, landing on the Welcome screen.
- [ ] Every screen in this module is keyboard-navigable with visible focus rings, and the
      parent-gate modal correctly traps focus and is Escape-dismissible.
