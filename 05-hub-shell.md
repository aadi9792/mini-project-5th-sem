# Module: Hub Shell
Read `00-global-context-and-rules.md`, `00a-visual-assets-and-style-guide.md`, `01-auth-and-account.md`,
`02-child-profile-and-personalization.md`, `03-companion-system.md`, and `04-theme-system.md`
first — this doc sits at the convergence of all five and assumes you've read them.

**Scope of this doc:** the Hub page itself (greeting, progress bar, world map, Journey Line,
today's quests, persistent nav), the new Rocket Launch Timer and Power-Down Ritual, the World
Atlas (`/worlds`) and Wins (`/wins`) pages, loading/error states, and the routing architecture
that ties the whole authenticated app together. It does **not** redefine anything already owned by
`01`–`04` — where this doc touches their territory (the companion widget, the Heart Button, theme
switching), it cross-references rather than repeats.

---

## 1. How to Use This Document

**Step 0:** nothing new to set up.

**Step 1 — routing/middleware first**, since everything else depends on it: build §4.2's
`middleware.ts` and the `(child-app)` layout's business-logic redirect before touching any Hub
component. Tell the agent:
> "Read docs `00`, `00a`, `01`–`04`, and `05-hub-shell.md`. First build the routing architecture
> in §4.2: `middleware.ts` for the coarse session check, and the `(child-app)` layout for the
> fine-grained Create-Profile/Tutorial-Island/Hub redirect. Don't touch any Hub UI component yet."

**Checkpoint:** confirm an unauthenticated visitor hitting `/hub` bounces to `/login`; confirm a
logged-in guardian with no child lands on Create Profile; confirm one with an incomplete Tutorial
Island lands there instead of the Hub; confirm a fully-set-up guardian reaches `/hub` normally;
confirm visiting `/` while already fully authenticated redirects to `/hub` instead of re-showing
Welcome.

**Step 2 — move and wire the Hub itself.** Tell the agent:
> "Move the existing Hub page from `src/app/page.tsx` into `src/app/(child-app)/hub/page.tsx` per
> §4.4. Wire it to real data per §4.1 (client-side fetch, loading states from §3.6). Then apply
> the rework specified in §3.3 for each component, in this order: Greeting/progress bar → World
> Map → Today's Quests → Journey Line (including the new Rocket Launch Timer and Power-Down
> Ritual) → Persistent Nav. The Companion widget and Heart Button reworks are owned by `03`, and
> the theme retrofit is owned by `04` — don't redo that work here, just confirm it's integrated."

**Step 3 — the two new pages.** Build `/worlds` (§3.4) and `/wins` (§3.5).

**When this module is "done":** every item in §7 verified. Given this doc depends on `09` for
quests/Journey Line/leveling/Win Gallery content (none of which exist yet), **this module has a
real ceiling** — mark §2 🟡, not 🟢, until `09` exists and those pieces can be verified with real
data instead of the frontend-only placeholders described here.

---

## 2. Current Status

🔴 **Nothing in this doc is built yet**, though the underlying Hub UI exists as the pre-auth
prototype described in earlier design discussions — static, mock-data-driven, living at `/`. This
doc's job is to turn that into the real, authenticated, data-wired Hub.

**Known pre-existing issue, formally out of scope (not a deferred fix):** on very short viewports
(under ~800px tall), the persistent nav can visually overlap the bottom planets in the world map's
orbit layout. This was a known limitation when the Hub was first prototyped. Per `00` §6.7
(this MVP's device strategy targets desktop browsers only; anything under 1024px wide is
explicitly best-effort/untested), this bug now falls inside a device range this project doesn't
support — it is **accepted, not scheduled**. Don't let it block anything else in this doc, and
don't silently claim it's fixed either.

---

## 3. Frontend & UI

### 3.1 Visual system
No new tokens or patterns. Everything here reuses the existing `--sv-*` tokens (now theme-dynamic
per `04`), the established card/button language, and `lucide-react` icons. Any genuinely new
visual element introduced in this doc (the progress bar, the launch/power-down rituals, the
tooltip, the skeleton states) is specified in full below — nothing is left to "match the vibe."

### 3.2 Layout (unchanged from the original design, now data-real)
Top to bottom: Greeting + progress bar → interactive World Map (primary visual focus) → Today's
Quests → Journey Line → Companion widget, with the Heart Button and Persistent Nav always visible
regardless of scroll position. Interaction rules unchanged: everything reachable in ≤2 taps, no
autoplay, no unsolicited pop-ups or sound — the action sheets and tooltips introduced below are
user-initiated (tap-to-open), which is standard interaction, not the "pop-up" the no-pop-ups rule
is about.

### 3.3 Component-by-component rework

**Greeting + progress bar.** Keeps its existing layout (time-of-day greeting, headline, a badge in
the top-right), now joined by the small Avatar badge from `09-rewards-and-economy.md` §3.3
(additive, doesn't replace this badge). The badge is rebuilt: "Level {n}" label, a horizontal
fill-bar beneath it (~120–140px wide, 8px tall, `border-radius: 999px`, `--sv-bg-soft` track,
`--sv-success` fill, width transitions over 500ms ease-out on change), and a caption below reading
"{starsIntoLevel} / {starsNeededForLevel} ⭐ to next level." **Resolved, now that
`09-rewards-and-economy.md` exists:** the leveling formula described here when this doc was first
written (level *N* requires *N* × 50 total stars) was an explicitly throwaway placeholder at the
time — `09` §3.2 has since made that exact same structural formula the real, canonical,
backend-persisted one, rather than inventing new complexity. The bar now reads real
`totalStars`/level values from `09`'s `GET /economy/summary` endpoint instead of local mock data.

**World Map.** All 3 MVP worlds (Time, Feelings, Faces) are **always unlocked for every child** —
no progressive unlock between them, matching exactly how the 3 built themes work. The remaining 6
worlds stay permanently "Coming Soon" tiles (same dimmed + lock icon treatment used for themes and
companions) until Phase 2 actually builds them — this is a static fact, not something that reads
from any backend unlock state. **Closing a dependency `02` §3.7 flagged but was never actually
delivered:** the planet matching `recommendedWorldOrder[0]` gets a subtle "recommended" treatment
— a gentle pulsing ring (respecting reduced motion) **plus a small "✨ Try this!" text badge**, not
the ring alone — distinguishing it from the other 2 unlocked planets without making them feel
lesser; never color/motion alone, per `00` §6.2. **What actually happens after the entry animation, for every trigger point in this doc (updated —
see `06-skill-world-template-and-catalog.md` §2, which now provides real per-world content and
retroactively supersedes this doc's original placeholder behavior):** the existing Hub map
currently works as tap planet → an info panel appears below the map ("ready to explore" / "coming
soon" message + an "Enter" button) → tapping "Enter" plays `WorldEntryOverlay` → **on completion,
the overlay now navigates to `/worlds/{worldId}`** (`06`'s World Home screen) rather than merely
dismissing — this doc's original text said it should just close, which was correct only until `06`
existed. Every trigger point this doc adds — Today's Quests, the Companion's "Let's go" button,
and the World Atlas's "Enter" button — behaves the same way: play the entry animation, then
navigate to the real world page. **Architecture implication unchanged from the original draft:**
the "which world is entering" state is still lifted from `WorldMap.tsx` up to the `hub/page.tsx`
level, with a single shared `onEnterWorld(worldId)` handler and one `WorldEntryOverlay` instance
reused by the map, Today's Quests, and the Companion widget — the only change is what that handler
does once the overlay finishes.


**Companion widget's "Let's go" button.** `03` §3.9 explicitly deferred this button's destination
to this doc and it was missed in the first draft — fixing it now: tapping it calls the shared
`onEnterWorld(recommendedWorldOrder[0])` handler described above, the exact same destination as
Today's Quests' first card and the World Map's highlighted planet — all three point at the same
recommendation, consistently, and all three share the one overlay instance.

**Real contrast bug to fix while rebuilding these two buttons (found during `04` §3.2a's Dark Mode
design, pre-existing, independent of Dark Mode itself):** both the current "Let's go" button
(`CompanionPet.tsx`) and the World Map info panel's "Enter" button (`WorldMap.tsx`) use
`bg-sv-primary` with white text as their **resting** state, only switching to the safe
`bg-sv-primary-deep` on hover — meaning the default, most commonly seen state fails AA (2.75:1–
3.33:1 across the 3 themes). Fix: both buttons' resting background becomes solid
`--sv-primary-deep` (hover becomes the existing "+5% brightness" rule from `01` §3.1, not a bigger
jump to a second color) — matching the one Primary Button standard used everywhere else in the
app, not a separate style for these two.

**Today's Quests.** The 3 `GAME`-type cards are chosen via a **frontend-only reordering** of quest
content based on `recommendedWorldOrder` (from `02` §4.4) — this reordering logic itself stays a
frontend-only sort, not a real recommendation backend, even now that `09`/`10` exist (this doc's
own §3.8/§6 cover the parts that *did* become real: quest completion/reward payout via `09`, and
real-life quest content via `10`'s `RealLifeQuest` model replacing the old mock data — this
paragraph is about the *ordering* logic specifically, which stays a simple frontend sort by
design, not something either of those docs replaced). Tapping a `GAME` quest card calls the same
shared `onEnterWorld(worldId)` handler, exactly as tapping its planet on the map would. `REAL_LIFE`
quest cards now read from `10`'s real `RealLifeQuest` data (not "none exist in the current
placeholder data" as this section originally said, before `10` existed) and tapping one marks it
current on the Journey Line / opens its action sheet, per §3.3 below — not a separate, second
completion system from the Journey Line's own.

**Journey Line + Rocket Launch Timer + Power-Down Ritual.** The timeline display is unchanged.
New interactions:
- Tapping the **current** stop opens a small action sheet: **"Start {label}"** if not yet
  launched this session, or **"Finish {label}"** if it has been. This "launched" flag is **local
  component state only — never persisted**, and resets on reload. This is a deliberate honesty
  line: it creates the feeling of starting/finishing a real-life task without ever claiming the
  stop is actually `done` in any real data.
- **"Start" first checks the child's derived `autoTransitionWarning` (`02` §4.4, newly wired per
  `02` §4.4a):** if `true`, a brief ~1s "Heads up, we're about to start!" beat plays before the
  Rocket Launch Timer itself begins; if `false` (the `transitions_easily` answer), the timer starts
  immediately, exactly as originally specified. Either way, the Rocket Launch Timer then plays: a
  countdown overlay (big numbers, same visual register as `WorldEntryOverlay`), duration taken
  directly from the child's derived `countdownSeconds` preference (`02` §4.4 — 3/5/10s), ending in
  a theme-flavored moment per the table below, skippable like every other animation in this app.
- **"Finish"** plays the Power-Down Ritual: a 2–3s gentle wind-down (a shrinking/dimming icon),
  also theme-flavored, also skippable.
- Both follow the same "per-theme emoji + verb" pattern `04` §3.4 established for
  `WorldEntryOverlay` — this table is new, Hub-specific content (not duplicated into `04`, per the
  centralize-only-when-shared rule from `00a` §1):

| Theme | Launch | Power-down |
|---|---|---|
| Space | "Blast off to {label}!" 🚀 | "Powering down…" 🤖 |
| Ocean | "Diving into {label}!" 🤿 | "Surfacing gently…" 🌊 |
| Jungle | "Venturing into {label}!" 🌿 | "Resting in the shade…" 🍃 |

- Tapping any **non-current** stop shows a small info tooltip/popover — no action sheet, purely
  informational. **Its exact content now depends on the child's derived `journeyLineVerbosity`
  (`02` §4.4, newly wired per `02` §4.4a)**, instead of always showing the same fixed detail level:
  - `minimal`: icon + label only.
  - `standard` (the original, only level this doc specified before this wiring): icon + label +
    time + one-line status ("Completed ✓" or "Coming up").
  - `detailed`: everything `standard` shows, plus one extra line previewing the *next* stop after
    this one ("Next up: {nextLabel}") — this is what actually satisfies `predictabilityPromptsDefault`
    for the children who most benefit from it, without needing a second, separate mechanism.
- **Explicitly not built here:** the Time Machine (estimate-vs-actual feedback) and any real
  completion/XP payout — both need `09`'s real timestamps and data model.

**Companion widget.** Owned entirely by `03` §3.9 — this doc doesn't redefine it, just confirms it
sits in its existing position in the layout.

**Heart Button.** Owned entirely by `03` §3.8 (the zone check-in addition) — same note.

**Persistent Nav.** The real, already-built nav is **Hub / Worlds / Wins / Settings** (4 items) —
note this for accuracy, since the original design discussion described a "Calm/Worlds/Wins" nav
that doesn't match what's actually built; "Calm" is the separate, always-visible Heart Button, not
a nav tab. **A real bug in the existing code needs fixing as part of this rework:** `active` is
currently tracked with a plain `useState`, defaulting to `"hub"` and only ever changed by a click
— meaning the browser back button or a direct URL visit leaves the wrong tab highlighted. Once
Worlds/Wins are real routes, `active` must be derived from Next.js's `usePathname()` instead.
- **Hub:** if already on `/hub`, scrolls to top and dismisses any open overlay; if on `/worlds` or
  `/wins`, navigates to `/hub`. Never purely a no-op from another page.
- **Worlds:** navigates to `/worlds` (§3.4), not a same-page scroll.
- **Wins:** navigates to `/wins` (§3.5).
- **Settings:** unchanged, opens `SettingsPanel` (which `04` §3.6 has already added a Theme row
  to).

**Settings Panel.** Owned by its original build plus `04` §3.6's Theme row addition. **One
retroactive fix identified while writing `07-mini-games.md`:** Calm Mode and Sound currently live
as local component state, inaccessible from other routes (World Home, mini-games) that also need
to respect them, and don't survive a reload either. Move both to `localStorage` instead — fixes
both problems at once, and is a small adjustment to this doc's existing implementation, not new
scope. See `07` §3.13 for the full reasoning.

**Initializing those `localStorage` values from the child's real preferences (resolved during `02`'s
dormant-preference audit, §4.4a there):** the very first time `sv-sound-on`/`sv-calm-mode` are read
and neither key exists yet in `localStorage` (a brand-new child, right after Tutorial Island),
initialize them from the derived `soundDefaultOn`/`calmModeDefault` values (`02` §4.4) instead of a
single hardcoded default for every child, then write them to `localStorage` immediately. **Once
either key exists, it's never overwritten from the derived preference again** — a child/guardian's
own later toggle choice always wins, permanently, over the original personalization answer. This
check belongs in `ChildDataContext`'s initial load (§4.1), since that's the one place the derived
preferences are already fetched.

### 3.4 World Atlas (`/worlds`)
A dedicated page, not a modal. Header: back arrow to `/hub` + title **"All Worlds."** A grid (list
on mobile) of all 9 catalog worlds, each card showing: emoji, name, tagline, and status. The 3
built worlds show an **"Enter"** button that triggers its own `WorldEntryOverlay` instance on this
page (separate from the Hub's shared one, since this is a different page) — on completion it
navigates to `/worlds/{worldId}` (`06`'s World Home screen), same as every other entry point in
this doc. The 6 unbuilt worlds show the same dimmed + lock-icon + "Coming Soon" treatment already
established for locked themes/companions, for visual consistency across the whole app.

### 3.5 Wins (`/wins`) — now real, per `09-rewards-and-economy.md`
Same page pattern as World Atlas: back arrow + title **"Your Wins."** This page was deliberately,
honestly empty when this doc was first written — no `09` existed yet to give it real content.
**Resolved:** `09` §3.10 now owns this page's actual content (the badge grid, the Collection, the
Shop entry point) in full. The empty-state copy above was correct for its time and should not be
treated as this page's permanent design — once `09` is built, this section is superseded by `09`
§3.10, not run alongside it.

### 3.6 Loading & error states
Since data now loads client-side (§4.1), the Hub needs real states for the gap before data
arrives:
- **Loading:** a `HubSkeleton` — pulsing placeholder shapes matching each real section's
  approximate size/position (greeting bar, world map circle, quest cards, journey line bar,
  companion card), `--sv-bg-soft` fill, opacity pulsing 40%–70% over 1.5s ease-in-out, looping;
  static at a fixed 55% opacity when `prefers-reduced-motion` is set, never pulsing in that case.
- **Error (fetch failure):** a centered message — `lucide AlertCircle` icon, **"Something went
  wrong loading your Hub."**, and a **"Try Again"** button that re-triggers the fetch. Never a raw
  error code or network exception shown.

### 3.6a Generic 404 / unknown route (a real gap found during a full UI/visual spec audit — this
is distinct from §4.2's `GET /children/me` business-logic 404, which is unrelated)

Every 404 discussed elsewhere in this doc set is a *data* state (e.g. "no child profile exists
yet"). Nothing previously specified what a visitor sees at a URL that simply doesn't exist (a
typo, an old bookmark, a removed dev route). Next.js's App Router needs a real `not-found.tsx` at
the root, and this doc owns it since it owns routing.

- **Route:** `src/app/not-found.tsx`, catches any unmatched path.
- **Content:** same centered-card shell as Auth (`01` §3.1: `--sv-card` background, `rounded-3xl`,
  soft shadow, `max-width: 420px`, centered on the themed ambience background per `00` §6.7's
  layout pattern) — reused rather than inventing a new shell for one screen.
- **Copy (exact):** a large 🧭 emoji, headline **"Hmm, this path doesn't exist."** (font-heading,
  28px/700), body text **"Let's get you back to familiar ground."** (`--sv-text-soft`, 15px), one
  Primary Button (§3.1 of `01`, now solid `--sv-primary-deep` per `00` §6.2.1) labeled **"Take me
  home."**
- **Behavior:** the button routes to `/` if there's no valid session (→ Welcome screen) or `/hub`
  if there is one — reuses the same session-cookie check `middleware.ts` already does (§4.2), no
  new auth logic needed.
- **Not themed per-world/per-theme** — this is a structural/system screen, not part of the game
  world, so it deliberately stays theme-neutral (always the Space-default palette) regardless of
  the child's active theme, the same way the Auth screens do (`01` §3.1).
- Respects `prefers-reduced-motion` the same as every other card entrance in this app (`01`'s
  "fade + 12px upward slide, 350ms ease-out" treatment).

### 3.7 Accessibility & motion
Same bar as every other module. Specific to this doc's new pieces: the action sheet and tooltip
are keyboard-dismissible (Escape) and trap focus like every other modal in this app; the countdown
announces **"Starting countdown"** once via `aria-live="polite"` at the start and **"Ready!"** once
at the end — not every individual number, which would be noisy for screen reader users; the
Power-Down Ritual's closing message is announced the same way. The World Atlas grid carries
`aria-label="All Skill Worlds"`, with each card labeled `"{world.name}, {status}"` (status being
"unlocked" or "coming soon"); the Wins page's empty state is a normal heading + paragraph, needing
no special ARIA treatment beyond what any static content needs.

### 3.8 What this module hands off to other docs
- `09-rewards-and-economy.md` owns: the real leveling curve (replacing §3.3's placeholder
  formula), real quest generation/assignment and completion (replacing the frontend-only
  reordering), the Time Machine, and all real Win Gallery content.
- **Resolved, now that `10-guardian-dashboard.md` is written:** it owns the actual creation of
  real-life Journey Line stops via its own `RealLifeQuest` model and `GET /journey/:childId/:date`
  endpoint — this doc's Journey Line switches from reading `src/lib/data.ts`'s mock `journeyStops`
  to that real endpoint, with its on-screen look (stations, timer, ritual) completely unchanged.
  `10` §3.4 also adds one small step to the existing "Finish" flow (a reminders-needed tap) before
  `09`'s completion call fires.
- **Resolved, now that `06-skill-world-template-and-catalog.md` is written:** the World Map and
  World Atlas's per-world name/tagline/color content should read from `06`'s
  `skillWorldCatalog.ts` constant (`06` §4.1), not the older, thinner `color`/`tagline` fields
  still in `src/lib/data.ts`'s `skillWorlds` array. When building this doc's World Map/Atlas
  pieces after `06` exists, switch to the new catalog as the data source — don't leave two
  competing sources of per-world truth in the codebase. If `06` isn't built yet when this doc is,
  the old `data.ts` fields are an acceptable temporary source, same honest placeholder pattern
  used throughout this project.

---

## 4. Backend & File Architecture

### 4.1 Data fetching architecture (unified with the routing check, not duplicated)
Client-side fetching, not server-side — chosen so the existing props-based component pattern
(`Greeting`, `JourneyLine`, `TodaysQuests` already take data as props, not fetch internally) stays
intact. **This fetch is not a separate thing from §4.2's routing check — they're the same call.**
`GET /children/me` is needed both to decide where a guardian should land *and* to render the Hub,
so it happens exactly once, in the `(child-app)` layout (§4.2), which then provides the result via
a React Context (`ChildDataContext`) to every page in that group. `GET /children/:id/preferences/
derived` (`02`) and `GET /companions/me` (`03`) are fetched alongside it, same layout, same
context — `/hub`, `/worlds`, and `/wins` all read from this one context rather than each firing
their own redundant requests. `activeTheme` arrives as part of `GET /children/me` (`04`). While
the layout's fetch is pending, render `HubSkeleton` (§3.6) in place of the page content; if it
fails, render the error state with a **"Try Again"** button that calls the context's `refetch()`.

**`09-rewards-and-economy.md`'s `GET /economy/summary` (stars/coins/level) is deliberately kept
out of this shared context** — a decision made explicitly when `09` was written, to stop
`ChildDataContext` from growing indefinitely as each new doc adds more data. Instead, the Hub page
fetches it independently, on every navigation to `/hub` (not just the first load of the session),
so the progress bar reflects rewards from a just-finished game session immediately upon return —
see `09` §3.12 for how that stays reliable even through a network failure.

### 4.2 Routing architecture (the real crux of this module)

**Full route map:**

| Route | Access | Expected onboarding state |
|---|---|---|
| `/` | Public-only | — redirects to `/hub` if already fully authenticated+onboarded |
| `/login`, `/signup`, `/verify-pending`, `/verify-email`, `/forgot-password`, `/reset-password` | Public-only | Same redirect-away-if-authenticated rule as `/` |
| `/terms`, `/privacy` | Always public | No redirect either direction |
| `/continue-as` | Protected | Fully complete (`01`) |
| `/create-profile` | Protected | No child, or child without preferences (`02`) |
| `/tutorial-island/*` | Protected | Preferences done, Tutorial Island not (`02`/`03`/`04`) |
| `/hub`, `/worlds`, `/wins` | Protected | Fully complete (this doc) |

**Layer 1 — `middleware.ts` (coarse, stateless):** checks only whether a valid `sv_access_token`
(or a usable `sv_refresh_token`) cookie exists for any route marked "Protected" above. No valid
session → redirect to `/login`. This check is intentionally shallow — it does not know anything
about child/onboarding state, because that requires an API call that doesn't belong at the edge on
every request. **This is a frontend routing concern only — it does not replace or substitute for
the backend's own JWT auth guards (`01` §4.13), which independently reject unauthenticated API
calls no matter what the frontend shows.** Both exist; neither is redundant.

**Layer 2 — symmetric onboarding-state resolution, applied to every Protected route, not just
`/hub`/`/worlds`/`/wins` (fixes a real gap — the first draft of this doc only redirected a guardian
*forward* out of an incomplete state, never *backward* out of a state they'd already finished):**
`GET /children/me`'s three-state response (`02` §4.5) resolves to exactly one "expected" route per
the table above. Every Protected page checks this on load — not just the `(child-app)` group — and
redirects if the current page doesn't match: an incomplete guardian hitting `/hub` directly is sent
to whichever earlier step they're missing; a *fully complete* guardian who manually navigates back
to `/create-profile` or `/tutorial-island` is sent forward to `/hub` instead of being allowed to
re-run onboarding (which would also just fail against `02`'s one-child-per-guardian rule, but
redirecting is a much better experience than letting them hit that error). `/continue-as`'s
**"Continue as {child}"** button navigates to `/hub`.

In practice: the `(child-app)` route group's `layout.tsx` performs this check once for
`/hub`/`/worlds`/`/wins` (and doubles as §4.1's data-fetch, per above), while `/continue-as`,
`/create-profile`, and `/tutorial-island/*` each call a small shared `useOnboardingGuard(expectedState)`
hook that performs the same check for their own single page. Once the `(child-app)` layout's check
resolves, it renders the actual page wrapped in the shared Heart Button and Persistent Nav chrome
(present on `/hub`, `/worlds`, and `/wins` alike, without each page including them separately) —
the Companion widget is **not** part of this shared chrome, it's Hub-page-specific content, only
rendered inside `hub/page.tsx`.

**Exact state-derivation (both layers of the guard use this same mapping, not an ad-hoc check
each):**

| `GET /children/me` result | Resolved state | Expected route |
|---|---|---|
| `404` (no child at all) | `no_child` | `/create-profile` |
| `200`, `hasPreferences: false` | `no_preferences` | `/create-profile` (resumes at the right step, per `02` §3.2) |
| `200`, `hasPreferences: true`, `tutorialCompleted: false` | `no_tutorial` | `/tutorial-island` |
| `200`, `hasPreferences: true`, `tutorialCompleted: true` | `complete` | `/hub` (or `/continue-as`, `/worlds`, `/wins`) |

**A `404` here is valid business state, not a failure** — `ChildDataContext`/`useOnboardingGuard`
must treat it as normal data for the redirect decision above, never route it into the generic error
state from §3.6. Only genuine failures (5xx responses, network errors) trigger that error UI.

**Partial failure, kept simple on purpose:** if any of the three parallel calls in §4.1 fails
(`children/me`, `preferences/derived`, `companions/me`) after the state above resolves to
`complete`, the whole `ChildDataContext` is treated as failed and the full-page error state from
§3.6 is shown — no attempt at partial rendering (e.g. "Hub without the companion widget"). Simpler
and more honest than a half-working page for a prototype.

**`/continue-as`, `/create-profile`, and `/tutorial-island/*` need their own lightweight loading/
error treatment too, since they sit outside `ChildDataContext`** (a gap worth closing explicitly —
these pages existed in `01`/`02` before this guard pattern did, and neither doc specified this).
They don't need a full `HubSkeleton` — a simple centered spinner while `useOnboardingGuard`
resolves is enough, given it's a single fast call — but on failure they must reuse the exact same
`lucide AlertCircle` + **"Something went wrong loading your Hub."** + **"Try Again"** pattern from
§3.6, not a new one invented per page.

### 4.3 Business rules
- World unlock state for the 3 MVP worlds is a static fact (`unlocked: true` for Time/Feelings/
  Faces, hardcoded), not a per-child database field — there is nothing to unlock yet.
- The "launched" state for the current Journey stop's action sheet is component state only, never
  sent to the backend.
- Today's Quests' reordering logic is a pure frontend function of `recommendedWorldOrder` — it
  reads from the already-fetched derived preferences, it does not call a new endpoint.

### 4.4 File architecture

```
skillverse-backend/
└── (no new backend code for this module — it only consumes endpoints already defined in 01–04)

skillverse-app/
├── middleware.ts                              # Layer 1, §4.2
├── src/app/
│   ├── (child-app)/
│   │   ├── layout.tsx                         # Layer 2 + §4.1's fetch, ChildDataContext provider,
│   │   │                                       # shared HeartButton/PersistentNav chrome
│   │   ├── hub/
│   │   │   └── page.tsx                       # moved from src/app/page.tsx; Companion widget lives
│   │   │                                       # here only, not in the shared layout; owns the
│   │   │                                       # lifted onEnterWorld state + single shared
│   │   │                                       # WorldEntryOverlay instance used by the map,
│   │   │                                       # Today's Quests, and the Companion widget
│   │   ├── worlds/
│   │   │   └── page.tsx                       # §3.4
│   │   └── wins/
│   │       └── page.tsx                       # §3.5
│   ├── continue-as/page.tsx                   # edited: now calls useOnboardingGuard("complete")
│   ├── page.tsx                                # now purely the Welcome screen from 01
│   └── not-found.tsx                           # NEW, §3.6a — generic catch-all 404
├── src/components/
│   ├── HubSkeleton.tsx                        # NEW, §3.6
│   ├── RocketLaunchTimer.tsx                  # NEW, §3.3
│   ├── PowerDownRitual.tsx                    # NEW, §3.3
│   ├── JourneyLine.tsx                        # edited: adds action sheet + tooltip from §3.3
│   ├── TodaysQuests.tsx                       # edited: adds the §3.3 reordering + tap-to-enter
│   ├── Greeting.tsx                           # edited: adds the §3.3 progress bar
│   └── PersistentNav.tsx                      # edited: usePathname()-derived active state, real
│                                               # navigation for Worlds/Wins/Hub, per §3.3
└── src/lib/
    ├── ChildDataContext.tsx                   # NEW — §4.1's shared fetch + context, exposes
    │                                           # { child, preferences, companion, loading, error, refetch }
    └── useOnboardingGuard.ts                  # NEW — §4.2's shared redirect hook, used by
                                                # continue-as/create-profile/tutorial-island pages
```

---

## 5. What You Need to Do, With Why
Nothing new. No external accounts or credentials needed for this module.

---

## 6. Explicitly Out of Scope for This Module
- **Real quest *generation and assignment*.** Owned by `10-guardian-dashboard.md`, now resolved
  there — this doc's Today's Quests reordering remains a frontend-only reordering of whatever
  quests exist, it just now reads real guardian-authored ones instead of mock data. Quest
  *completion and reward payout* was already real — see `09-rewards-and-economy.md` §3.5.
- **The Time Machine.** Still genuinely unaddressed — `09` and `10` both explicitly flagged this
  as not in their scope either, so it remains open rather than silently resolved by any doc.
- **Real Journey Line stop creation.** Resolved — owned by `10-guardian-dashboard.md` §3.3.
- **Progressive unlocking of the 3 MVP worlds, or any of the remaining 6.** All 3 are always on;
  the rest are static "Coming Soon" placeholders — no unlock-tracking system exists or is needed
  yet.
- **Fixing the known short-viewport nav/map overlap** (§2) — pre-existing, and now formally
  out-of-scope per `00` §6.7's desktop-only device strategy, not a deferred fix waiting on a
  future doc.

---

## 7. Acceptance Criteria / Definition of Done

- [ ] An unauthenticated visit to any Protected route (§4.2) redirects to `/login`; an
      authenticated visit to any Public-only route redirects to `/hub`.
- [ ] A guardian with no child lands on `/create-profile`; one with an incomplete Tutorial Island
      lands there; a fully-set-up guardian reaches `/hub` — verified for all three states.
- [ ] The redirect is symmetric: a fully-complete guardian who manually navigates to
      `/create-profile` or `/tutorial-island` is sent forward to `/hub`, not allowed to re-enter
      onboarding — verified by direct URL navigation, not just the normal flow.
- [ ] `GET /children/me` fires exactly once per Hub visit (confirmed via network tab), shared via
      `ChildDataContext` across `/hub`, `/worlds`, and `/wins` rather than refetched per page.
- [ ] Persistent Nav's active tab correctly reflects the real current route (via `usePathname()`)
      after a back-button navigation or direct URL visit, not just after a click.
- [ ] Tapping "Hub" while already on `/hub` scrolls/resets in place; tapping it from `/worlds` or
      `/wins` actually navigates to `/hub`.
- [ ] The World Map visually distinguishes the `recommendedWorldOrder[0]` planet with the pulsing
      ring **and** the "✨ Try this!" text badge (never the ring alone), and the Companion widget's
      "Let's go" button, the World Map's highlight, and Today's Quests' first card all point at the
      same recommended world, via one shared `onEnterWorld` handler and one overlay instance on the
      Hub page — not three separate implementations.
- [ ] After any entry animation finishes (map, quest card, companion button, or World Atlas), the
      overlay navigates to `/worlds/{worldId}` (per `06`), not back to its origin page — this
      superseded the doc's original placeholder behavior once `06` was written.
- [ ] `GET /children/me` returning `404` is handled as valid routing data (redirects to
      `/create-profile`), never shown as an error.
- [ ] `/continue-as`, `/create-profile`, and `/tutorial-island` each show a lightweight loading
      state while their guard resolves, and the same `AlertCircle`/"Try Again" error pattern as the
      Hub on failure — not a separately-invented treatment per page.
- [ ] The Hub shows `HubSkeleton` while loading and the exact error state from §3.6 on a simulated
      fetch failure, never a raw error.
- [ ] The progress bar fill and caption match the placeholder formula in §3.3 exactly, and the
      formula is clearly marked for deletion once `09` exists (e.g. a code comment, not just this
      doc).
- [ ] All 3 MVP worlds show as unlocked for every child with no exceptions; the other 6 always
      show "Coming Soon."
- [ ] Today's Quests order reflects `recommendedWorldOrder`; tapping a `GAME` quest correctly
      triggers `WorldEntryOverlay` for that world.
- [ ] Tapping the current Journey stop shows the correct action sheet state (Start vs. Finish)
      based on local session state only — confirmed by reloading the page and seeing it reset.
- [ ] The Rocket Launch Timer reads its duration from the child's real `countdownSeconds`
      preference and shows the correct theme-flavored copy from §3.3's table for all 3 themes.
- [ ] The Power-Down Ritual plays correctly after "Finish," with correct theme-flavored copy.
- [ ] Tapping a non-current stop shows the info tooltip, never the action sheet, and its content
      correctly matches the child's derived `journeyLineVerbosity` tier (minimal/standard/detailed)
      — spot-checked for all 3 tiers, including `detailed`'s "Next up" preview line.
- [ ] A child with `autoTransitionWarning: true` sees the extra pre-countdown beat before "Start"'s
      Rocket Launch Timer begins; a child with it `false` goes straight into the timer, unchanged
      from this doc's original behavior.
- [ ] A brand-new child's Sound/Calm Mode `localStorage` values are correctly initialized from
      their derived `soundDefaultOn`/`calmModeDefault` the first time they're read, and a
      guardian/child's own later toggle change is never overwritten back to that original default
      on a subsequent load.
- [ ] `/worlds` and `/wins` are real, reachable pages (not modals), both with working back
      navigation to `/hub`.
- [ ] `/wins` shows genuinely empty-state content — no fabricated badges or numbers.
- [ ] Persistent Nav's Worlds/Wins tabs navigate to real routes; Hub/Settings behave as specified.
- [ ] The action sheet, tooltip, and countdown are all keyboard-dismissible and correctly
      announced via `aria-live` per §3.7.
- [ ] Now that `09-rewards-and-economy.md` exists, the progress bar, `/wins`, and quest *reward
      payout* have all been re-verified with real data — this module can only move from 🟡 to 🟢
      once `10-guardian-dashboard.md` also exists and real quest *assignment* has been verified too.
- [ ] Calm Mode and Sound toggles live in `localStorage`, survive a reload, and are readable from
      World Home/mini-game routes too, not just the Hub page.
- [ ] Visiting a nonexistent path renders the real `not-found.tsx` screen from §3.6a (not Next.js's
      default error page), and its "Take me home" button routes correctly for both a logged-out
      and a logged-in visitor.
