# Module: Rewards & Economy
Read `00-global-context-and-rules.md`, `00a-visual-assets-and-style-guide.md`,
`02-child-profile-and-personalization.md`, `03-companion-system.md`, `05-hub-shell.md`,
`06-skill-world-template-and-catalog.md`, `07-mini-games.md`, and `08-adaptive-difficulty.md`
first — this doc delivers on IOUs from all of them.

**Scope of this doc:** the real Stars/Leveling currency, the child Avatar system, real quest and
session rewards (replacing every "honest performance-only" placeholder), real Boss Battle unlock
tracking, real companion unlock/evolution (replacing `03`'s permanently-locked stub), the
combined cosmetics shop (avatar + companion), Collectibles, and the real Win Gallery. It does
**not** cover: the guardian-side quest-authoring UI (`10-guardian-dashboard.md` owns assigning
the day's real-life plan — this doc owns the data model and reward payout once a quest, however
created, is completed), or anything `08` already owns (adaptive difficulty logic stays untouched).

**A deliberate, large scope cut from the master spec, stated plainly:** the spec describes 5
currencies (XP, Coins, Stars, Badges, Collectibles) and a Day-Shield streak-protection system. This
doc merges XP and Stars into **one currency** (Stars) — the spec's split only makes sense with
multiple story chapters to gate with Stars specifically, and `06` deliberately cut story content
down to one framing paragraph per world, removing that need. Day Shields/streak protection are
cut entirely for this phase — no streak UI exists anywhere yet to protect. Both are real,
considered reductions, not oversights.

---

## 1. How to Use This Document

**Step 0:** nothing new to set up.

**Step 1 — backend first, in this order** (later pieces depend on earlier ones): Stars/Leveling
fields on `Child` (§3.2) → quest/session reward payout (§3.5) → Boss Battle unlock tracking
(§3.6) → companion unlock/evolution going live (§3.7) → the shop + avatar + collectibles +
badges (§3.3, §3.8–3.10). Tell the agent:
> "Read docs `00`, `00a`, `02`, `03`, `05`, `06`, `07`, `08`, and `09-rewards-and-economy.md`.
> Build the backend in this doc's §4, in the order given in §1. Each piece unblocks something a
> previous doc left honestly stubbed — don't skip ahead."

**Step 2 — the retroactive frontend updates**, one per affected doc: `05`'s Greeting/progress bar
and `/wins` page, `06`/`07`'s session summaries, `03`'s companion unlock/evolution display, `08`'s
`commitSession()` (switch it from a bare `fetch` to the new shared `reliableCommit` utility, §3.12),
and the new Avatar quick-pick step in `02`'s Tutorial Island sequence. Each is itemized in §3's
subsections and cross-referenced from the now-updated source docs.

**Checkpoint:** complete a full Arcade session and confirm real stars/coins are awarded and
visible; complete 3 sessions of one game and confirm its Boss Battle unlocks; reach Level 5 and
confirm a companion unlocks for real; buy and equip a shop item for both the avatar and the
companion; confirm a collectible can be earned; confirm `/wins` now shows real badges and a
collection, not the old empty state.

**When this module is "done":** every item in §7 verified, and every doc that was marked 🟡
pending this one (`03`, `05`, `06`, `07`) gets re-verified against its own acceptance criteria
with real data before being promoted to 🟢.

---

## 2. Current Status

🔴 **Nothing in this doc is built yet.** Until it exists: `05`'s progress bar uses a throwaway
formula, `/wins` is honestly empty, `06`/`07`'s sessions report performance only, Boss Battles are
permanently locked, and `03`'s companion unlocks/evolution are permanently stubbed at the lowest
state. This doc replaces all of that with real, working systems.

---

## 3. Frontend & UI

### 3.1 Visual system
Reuses the Hub's existing visual language entirely. The avatar (§3.3) and shop items (§3.8) are
built from curated emoji, per `00a` §2's placeholder-first policy — no new illustration system.

### 3.2 Stars & Leveling (the real currency, replacing `05`'s placeholder)
**One currency, called Stars (⭐)** — merges the spec's separate XP and Stars concepts (see the
scope-cut note above). Stars are earned via quest/session completion (§3.5) and accumulate on
`Child.totalStars`.

**The leveling formula — the exact same structural formula `05`'s placeholder already used, now
made canonical and real** (keeping it simple was already the right call; this doc makes it
official and backend-persisted rather than inventing new complexity for its own sake):
`level = floor(totalStars / 50) + 1`; the next level requires `level × 50` cumulative stars.
`05`'s progress bar now reads real values instead of its throwaway formula.

### 3.3 The Child Avatar (new)
A simple, emoji-layered visual representation of the child — distinct from the Companion Pet,
which is a separate character/friend, not the child's own likeness.

**Base face, picked once during Tutorial Island (§3.4), free:** 6 options —
😊 🙂 😄 🤗 😎 🥳. No naming needed (the avatar is simply "the child," already named via their
profile nickname).

**Accessories, purchased later from the Shop (§3.8), not part of the initial pick:** 3 categories
— Headwear, Eyewear, Neckwear — each a layered emoji overlay on the base face. Starts completely
unaccessorized; all accessories are shop purchases, never free.

**Where it appears:** a small avatar badge next to the Greeting text on the Hub (`05` §3.3,
additive — doesn't replace the existing Level/progress badge), and as the header image on the Win
Gallery (§3.10).

### 3.4 Updated Tutorial Island sequence (retroactive change to `02` §3.6)
**New step order: Handoff → Avatar quick-pick → Companion (pick + name) → Theme → First mini-game
→ Win screen.** The avatar comes first — the child establishes "who they are" before meeting
their companion friend. Avatar quick-pick screen: Headline **"Pick your look!"**, the 6 face
options in a grid, tap to select, immediate confirmation, no further customization at this stage
(accessories come later from the Shop). This is the only change to `02`'s sequence — every other
step keeps its existing design exactly as `02`/`03`/`04` already specified it.

### 3.5 Real quest & session rewards (replacing every "honest performance-only" placeholder)

**Arcade session (normal mode), per `06`/`07`:** 5 base Stars (just for completing) + up to 10
performance-bonus Stars, calculated per game:

| Game | Bonus formula (capped at 10) |
|---|---|
| Launch Challenge | `(perfectCount/totalRounds)×10 + (greatCount/totalRounds)×5`, capped at 10 |
| Volcano Scale | `(accurateCount/totalRounds)×10` |
| Face Detective | `(correctCount/totalRounds)×10` |

Plus a flat **5 Coins** per completed normal session, regardless of performance.

**Boss Battle:** 15 base Stars + up to 15 performance-bonus Stars (same per-game formulas, scaled
up), plus a flat **15 Coins** — reflecting its longer, harder, elevated format.

**`REAL_LIFE` quests (Journey Line tasks, per `05` §3.3):** originally specified here as a flat
**10 Stars + 5 Coins** on completion — **superseded by `10-guardian-dashboard.md` §3.3:** once a
guardian can actually author real-life quests, 10/50 and 5/25 become that specific quest's own
guardian-set `rewardStars`/`rewardCoins` (bounded 5–50 / 0–25 server-side), defaulting to 10/5 if
the guardian doesn't change them — so the "flat 10+5" behavior is still the common case, just no
longer a hard rule. No performance scoring exists for a real-life task either way, so no bonus
formula ever applies. **This is also where the Journey Line's ephemeral "launched" state (`05`
§3.3) becomes real:** tapping "Finish" on a real-life quest now calls `POST /quest-completions`
(§4.3) instead of just playing the Power-Down Ritual with nothing persisted — the ritual animation
stays exactly as built, it now has a real completion behind it, and (per `10` §3.4) one extra tap
asking whether reminders were needed, logged onto the same completion row via the new
`remindersLevel` field (§4.1). For this `questType: "REAL_LIFE"` case, `roundResults` (§4.3) is
omitted entirely — there are no rounds for a real-life task, so the server skips the bonus-formula
step and applies that specific quest's reward directly.

**Session summaries now show real rewards**, replacing `06` §3.2's and `07` §3.8's
honest-performance-only copy — e.g. Face Detective's summary becomes *"5 of 6 right! +12 ⭐ +5
🪙"* rather than just *"5 of 6 right!"* — the performance line stays, a reward line is added
alongside it, never replacing the honesty of the performance report.

### 3.6 Real Boss Battle unlock tracking (replacing the permanent lock)
Each game tracks a `completedSessionsCount` (normal-mode sessions only, not Boss Battles
themselves). At **3 completed sessions**, Boss Battle unlocks for that game, for real — replacing
the permanently-locked placeholder from `06` §3.4 and `07` §3.7. The "Unlocks after 3 plays" copy
already shown on the locked Boss Battle button now reflects real progress (e.g. "Unlocks after 1
more play") rather than being permanently stuck at the original count.

**Boss Battle has no lose condition — resolves a naming ambiguity in `bossBattlesWonCount`
(§4.1):** consistent with the gentle, no-punishment philosophy already established everywhere
else in this project, simply *finishing* all 8 rounds of a Boss Battle counts as "won," regardless
of accuracy — there's no scenario where completing one doesn't increment this count. The name
reflects the celebratory framing ("Boss Defeated," §3.10's badge), not a pass/fail gate.

### 3.7 Real companion unlock & evolution (replacing `03`'s stub)
`03` §3.4's level-gated companions (Fox at 5, Turtle at 10, Octopus at 25) and §3.5's evolution
stages (1–4 / 5–9 / 10–24 / 25+) now compute against the **real** level from §3.2, instead of
being permanently locked/stage-1. No change to the actual thresholds or stage visuals `03`
already defined — only the data feeding them becomes real.

### 3.8 The Cosmetics Shop (new, reached from `/wins`)
A **"🛍️ Shop"** button on the Win Gallery page (§3.10) leads to `/shop` — one combined shop, two
tabs: **Avatar** and **Companion**. Each tab shows a grid of items (emoji, name, price in Coins),
with **"Buy"** for unowned items and **"Equip"/"Unequip"** for owned ones.

**Avatar tab catalog:**

| Category | Item | Emoji | Price |
|---|---|---|---|
| Headwear | Top Hat | 🎩 | 30 |
| Headwear | Crown | 👑 | 50 |
| Headwear | Cap | 🧢 | 20 |
| Headwear | Bow | 🎀 | 20 |
| Eyewear | Glasses | 👓 | 20 |
| Eyewear | Sunglasses | 🕶️ | 25 |
| Neckwear | Scarf | 🧣 | 25 |

**Companion tab catalog** — purchased items layer **additively on top of** the existing free
theme-accessory badge (`00a` §3.2), never replacing it; a companion can show both its automatic
theme badge and a purchased accessory at once:

| Item | Emoji | Price |
|---|---|---|
| Bow Tie | 🎀 | 25 |
| Cap | 🧢 | 25 |
| Sunglasses | 🕶️ | 30 |
| Scarf | 🧣 | 25 |

Only one item per category can be equipped at a time (for the avatar; the companion's single
accessory slot works the same way) — buying doesn't force immediate equipping, "Buy" and "Equip"
are separate actions.

### 3.9 Collectibles (new, purely decorative)
15 total, 5 per MVP world, each with its own catalog:

| World | Collectibles |
|---|---|
| Time ⏱️ | ⏳ Hourglass Charm · 🕰️ Antique Clock · ⌛ Sand Timer · 🧭 Compass · 🔔 Tiny Bell |
| Feelings 🌋 | 💎 Calm Gem · 🌋 Tiny Volcano · 🌈 Rainbow Charm · 🫧 Bubble Orb · 🍃 Leaf Charm |
| Faces 👀 | 🎭 Mask Charm · 🔍 Magnifying Glass · 👁️ Watchful Eye · 💬 Speech Bubble · 📖 Storybook Charm |

**Earning:** each completed session (Arcade or Boss, any world) has a **20% chance** of awarding
one random not-yet-owned collectible from that world's set. Once all 5 from a world are owned, no
further chances are rolled for that world (fully collected). Purely decorative — no functional
use beyond display, per the earlier decision.

### 3.10 The Win Gallery (`/wins`, replacing the honest empty state)
Header: avatar image, child's nickname, Level, total Stars, total Coins, and the **"🛍️ Shop"**
button. Below that, two sections:
- **Badges** — a grid of the 10 badges below, earned ones shown in full color, unearned ones
  dimmed/silhouetted (never fully hidden — showing what's achievable is part of the motivation).
- **Collection** — all 15 collectible slots across the 3 worlds, same earned/unearned treatment.

**The 10 badges:**

| Badge | Emoji | Trigger |
|---|---|---|
| First Quest | 🎉 | Complete any quest (game or real-life) |
| First Mini-Game | 🎮 | Complete any Arcade session |
| Boss Defeated | ⚔️ | Win any Boss Battle |
| Getting Started | 🗓️ | Complete 5 quests total |
| New Friend | 🐾 | Unlock a companion beyond your starter |
| Level 5 | ⭐ | Reach Level 5 |
| Level 10 | 🌟 | Reach Level 10 |
| World Explorer | 🗺️ | Complete at least 1 session in each of the 3 MVP worlds |
| Taking Care | 💙 | Complete your first zone check-in via the Heart Button |
| First Purchase | 🛍️ | Buy your first shop item |

**Two trigger definitions tightened from their first draft, both for the same reason — they need
to hook into data that actually exists:** "World Explorer" originally said "visit all 3 worlds,"
but nothing tracks a mere page visit anywhere in this app — redefined against
`GameProgress.completedSessionsCount >= 1` for all 3 games, which is real, already-tracked data.
"Taking Care" originally said "use the Calm Cove," but the Calm Cove's actual tools (breathing
circle, ask-a-grown-up, quiet sounds, `03` §3.8) have no backend awareness at all — only the zone
check-in step that precedes them does (`03`'s `POST /zone-checkins`). Redefined against that real
call instead of a UI interaction nothing currently logs.

### 3.10a Celebration chime (added when sound effects were properly discussed — the celebration
*animations* on earning a badge/Collectible/level-up were already specified; the fact that none of
them had a sound was a real, previously-unaddressed gap, same conversation that fixed Calm Cove's
"Quiet sounds." Full asset/technical approach is cross-cutting, `00a` §7.4)

Whenever a badge (§3.10), a Collectible (§3.9), or a level-up (§3.2) is newly earned, a short,
synthesized, warm ascending chime plays (3–4 notes, via `07`'s shared `playTone()` helper, §4.4
there) — reinforcing the celebration that's already shown visually, not a new separate moment.
Respects the global Sound toggle (unlike Quiet Sounds, this is an incidental reinforcement effect,
not a deliberately-sought tool — `00a` §7.2's independence rule does **not** apply here). Plays
regardless of `prefers-reduced-motion`, since that setting governs visual motion specifically, not
audio feedback — a child with reduced animation isn't assumed to also want less sound.

### 3.11 Accessibility & motion
Same bar as every other module: the shop grid and badge/collection grids are keyboard-navigable
with visible focus rings; earned-vs-unearned state is always communicated with both a visual
treatment (dimming) and a text label ("Earned"/"Not yet"), never dimming alone; any
celebration animation on earning a badge/collectible respects `prefers-reduced-motion` — the new
celebration chime (§3.10a) is a separate, sound-specific exception to that same rule, not
contradicting it.

### 3.12 Reliable session-end commits (resolves a real cross-doc gap — what happens if the
end-of-session network call fails)
`08`'s `commitSession()` (difficulty tier) and this doc's reward submission both fire exactly once,
at session end — but neither originally said what happens if that one call fails. **Resolved: a
shared retry-and-cache utility, used by both**, so a network hiccup at exactly the worst moment
(right as a child finishes a session) never costs them their earned progress or shows them a scary
error. On failure, the pending commit (whichever payload — difficulty tier or reward submission)
is cached in `localStorage`, retried automatically with backoff (3 attempts: 2s, 5s, 10s), and if
the browser is closed before it succeeds, retried again on the next app load. The child always
sees their normal summary screen immediately — the sync happens invisibly in the background,
consistent with the gentle, never-punishing philosophy applied everywhere else in this project.
See §4.4 for the shared `reliableCommit` utility both `08` and this doc's frontend code use.

### 3.13 What this module hands off to other docs
- **Resolved, now that `10-guardian-dashboard.md` is written:** it owns actually creating real-life
  Journey Line quests (the guardian assigns the day's plan) via its own `RealLifeQuest` model —
  this doc only owns what happens when one, however created, is completed. The "simple
  auto-generated default set" placeholder this section originally described is no longer needed;
  `10` existing means real quests exist before this doc's reward logic is ever exercised for real.
- **Resolved:** `10`'s Mission Report (§3.2 there) reads this doc's `QuestCompletion`,
  `GameProgress`, `EarnedBadge`, and `Child.totalStars`/`totalCoins` directly for guardian-facing
  reporting — no new fields were needed on this doc's models for that, just read access.

---

## 4. Backend & File Architecture

### 4.1 Prisma models

```
// Extends the existing Child model (02 §4.1)
Child {
  // ...existing fields...
  totalStars      Int     @default(0)
  totalCoins      Int     @default(0)
  avatarBaseFace  String? // emoji string, null until Tutorial Island's avatar step runs
}

GameProgress {
  id                     String @id @default(cuid())
  childId                String
  gameId                 String   // "launch-challenge" | "volcano-scale" | "face-detective"
  completedSessionsCount Int      @default(0)
  bossBattlesWonCount    Int      @default(0)
  @@unique([childId, gameId])
}
// Separate from 08's GameDifficultyProfile on purpose — that doc owns only the adaptive tier;
// this one owns reward/unlock-relevant counts. Different concerns, different tables.

QuestCompletion {
  id              String   @id @default(cuid())
  childId         String
  questType       String   // "GAME" | "REAL_LIFE"
  gameId          String?  // set for GAME type, null for REAL_LIFE
  mode            String?  // "normal" | "boss", set for GAME type only
  realLifeQuestId String?  // NEW (10 §4.1) — set for REAL_LIFE type, links to the specific RealLifeQuest
  remindersLevel  String?  // NEW (10 §3.4) — "none" | "a_couple" | "a_lot" | null (skipped); REAL_LIFE only
  starsAwarded    Int
  coinsAwarded    Int
  completedAt     DateTime @default(now())
}

ShopItemCatalog {       // seeded once, like CompanionTemplate (03 §4.1)
  id          String @id   // slug, e.g. "top-hat"
  category    String       // "avatar-headwear" | "avatar-eyewear" | "avatar-neckwear" | "companion-accessory"
  emoji       String
  displayName String
  priceCoins  Int
}
OwnedShopItem {
  id          String   @id @default(cuid())
  childId     String
  itemId      String
  equipped    Boolean  @default(false)
  purchasedAt DateTime @default(now())
}

CollectibleCatalog {    // seeded once
  id          String @id
  worldId     String      // "time" | "feelings" | "faces"
  emoji       String
  displayName String
}
OwnedCollectible {
  id            String   @id @default(cuid())
  childId       String
  collectibleId String
  earnedAt      DateTime @default(now())
}

BadgeCatalog {           // seeded once, the 10 rows from §3.10
  id          String @id
  emoji       String
  displayName String
  description String
}
EarnedBadge {
  id        String   @id @default(cuid())
  childId   String
  badgeId   String
  earnedAt  DateTime @default(now())
}
```

### 4.2 Business rules
- **Reward issuance is server-side only**, computed from the actual round results a session
  reports, never trusted blindly from a single "final score" value the client could tamper with —
  same spirit as `08`'s acceptable-trust-model note, but rewards are real currency now, so the
  bar is a little higher: the server recomputes the bonus formula from submitted round-by-round
  results rather than accepting a pre-computed total.
- **Collectible/badge checks run automatically after every `QuestCompletion`** — the 20% roll
  (§3.9) and all 10 badge triggers (§3.10) are evaluated server-side immediately after a reward is
  issued, not on a separate schedule.
- **Boss Battle unlock is derived, not separately toggled** — `completedSessionsCount >= 3` is
  checked live, not written as a separate boolean that could drift out of sync.
- **Shop purchases are atomic**: check `totalCoins >= priceCoins`, deduct, create `OwnedShopItem`
  — never allow a negative coin balance.
- **Basic rate limiting extends to this doc's endpoints too** — the same lightweight per-IP
  throttling pattern from `01` §4.6, applied to `quest-completions` and `shop/purchase`
  specifically (cheap insurance, no real multiplayer/competitive stakes to justify more).
- **`GET /economy/summary` is fetched independently wherever it's needed** (the Hub's Greeting,
  the Win Gallery header) — deliberately **not** folded into the shared `ChildDataContext` (`05`
  §4.1), to keep that context from growing indefinitely as more docs add their own data. The Hub
  re-fetches this endpoint every time `/hub` is navigated to (not just on first load), so rewards
  earned in a just-finished session are reflected immediately on return — see §3.12 for how a
  completion's result gets there reliably even through a network hiccup.

### 4.3 API endpoints (`/api/v1/children/:id/...`)

| Method & path | Request body | Success response | Notes |
|---|---|---|---|
| `POST /quest-completions` | `{ questType, gameId?, mode?, roundResults }` | `201 { starsAwarded, coinsAwarded, newBadges: [...], newCollectible?: {...} }` | The one endpoint every quest/session completion calls — server computes everything from `roundResults`, per §4.2 |
| `GET /economy/summary` | — | `200 { totalStars, totalCoins, level, starsIntoLevel, starsNeededForLevel }` | `starsIntoLevel`/`starsNeededForLevel` are pre-computed server-side specifically to match `05` §3.3's caption field names exactly — the frontend should never have to redo the leveling-formula math itself, just display these two numbers directly |
| `GET /shop/catalog` | — | `200 { items: [...with owned/equipped flags] }` | |
| `POST /shop/purchase` | `{ itemId }` | `201 { item }` or `402` if insufficient coins | |
| `PATCH /shop/equip` | `{ itemId, equipped }` | `200 { item }` | |
| `GET /wins` | — | `200 { badges: [...], collectibles: [...] }`, each with earned/unearned status | Powers `/wins` directly |
| `PATCH /avatar` | `{ baseFace }` | `200 { avatarBaseFace }` | Called once, from Tutorial Island's avatar step |

### 4.4 File architecture

```
skillverse-backend/src/children/
├── economy/
│   ├── economy.controller.ts      # quest-completions, economy/summary
│   └── economy.service.ts         # reward computation (§4.2), badge/collectible checks
├── shop/
│   ├── shop.controller.ts
│   ├── shop.service.ts
│   └── shop-catalog.seed.ts       # seeds ShopItemCatalog from §3.8
└── wins/
    ├── wins.controller.ts
    ├── collectible-catalog.seed.ts  # seeds CollectibleCatalog from §3.9
    └── badge-catalog.seed.ts        # seeds BadgeCatalog from §3.10

skillverse-app/src/app/(child-app)/
├── wins/page.tsx                   # edited (not rebuilt): real content replaces the empty state
└── shop/page.tsx                   # NEW — §3.8, two-tab shop

skillverse-app/src/app/(tutorial-island)/
└── avatar/page.tsx                 # NEW — §3.4's avatar quick-pick, now step 1

skillverse-app/src/components/
├── AvatarBadge.tsx                 # NEW — the small Greeting-area avatar (§3.3)
└── ShopGrid.tsx                    # NEW — reused by both Shop tabs

skillverse-app/src/lib/
└── reliableCommit.ts               # NEW — §3.12's shared retry-and-cache utility; both this
                                      # doc's quest-completion submission AND 08's
                                      # useDifficultyProfile.commitSession() (08 §4.4, edited to
                                      # use this instead of a bare fetch) call through it
```

---

## 5. What You Need to Do, With Why
Nothing new. No external accounts or credentials needed for this module.

---

## 6. Explicitly Out of Scope for This Module
- **The Time Machine** (estimate-vs-actual time awareness, `05` §3.3). `05` flagged this as a `09`
  dependency, but it genuinely isn't addressed here — this doc's scope turned out to be about the
  Stars/Coins economy, the avatar, and the shop specifically, not every remaining `05` IOU. The
  Time Machine still needs real start/end timestamps per real-life task, which this doc's
  `QuestCompletion` model could support later, but doesn't build now. Flagged honestly as still
  open, not silently dropped.
- **Coins/cosmetics for anything beyond the avatar and companion.** No other customizable surface
  exists in this app.
- **Day Shields or any streak-protection system.** Cut per the scope note at the top of this doc —
  no streak UI exists anywhere to protect yet.
- **Trading, gifting, or any multi-child economy interaction.** Single-child accounts only (`01`
  §6), so this never applies.
- **Guardian-authored real-life quests.** `10`'s job — this doc only pays out rewards for
  whatever quest, however created, gets completed.
- **Collectible or badge rarity tiers, special edition items, or limited-time shop rotations.**
  Never discussed, real added scope beyond what this phase needs.

---

## 7. Acceptance Criteria / Definition of Done

- [ ] Completing any Arcade session awards the correct Stars (5 base + formula-based bonus) and 5
      flat Coins, computed server-side from submitted round results, not a client-provided total.
- [ ] Completing a Boss Battle awards the higher base/bonus amounts and 15 Coins.
- [ ] Completing a `REAL_LIFE` quest awards that specific quest's `rewardStars`/`rewardCoins`
      (10/5 by default, per `10` §3.3 — not hardcoded), and the Journey Line's "Finish" action
      (`05` §3.3) now actually persists this instead of being purely ephemeral.
- [ ] The Level shown in the Greeting and Win Gallery is computed from real `totalStars` via the
      documented formula, matching exactly — spot-checked at several star totals.
- [ ] A game's Boss Battle unlocks automatically and correctly after exactly 3 completed normal
      sessions of that game, with the "Unlocks after N more play(s)" copy updating accurately.
- [ ] Companion unlocks (Fox/Turtle/Octopus at levels 5/10/25) and evolution stages now reflect
      real level data — verified by reaching each threshold.
- [ ] The Shop correctly shows owned/unowned and equipped/unequipped state for every item, in both
      tabs, and purchases correctly deduct coins and never allow a negative balance.
- [ ] A purchased companion accessory displays alongside (not instead of) the existing free theme
      badge.
- [ ] Collectibles are awarded at the correct ~20% rate, never award a duplicate already owned,
      and correctly stop rolling once a world's 5 are all collected.
- [ ] All 10 badges trigger correctly at their exact documented conditions, no more and no fewer —
      including "World Explorer" (per-game completed-session counts, not page visits) and "Taking
      Care" (the zone check-in call, not an untracked Calm Cove UI interaction).
- [ ] Every completed Boss Battle increments `bossBattlesWonCount`, regardless of in-session
      accuracy — there is no failing condition to test for, by design.
- [ ] `GET /economy/summary` returns `starsIntoLevel`/`starsNeededForLevel` pre-computed, matching
      `05`'s caption exactly with no frontend-side leveling math required.
- [ ] `/wins` shows real badge/collectible data, replacing the old honest-empty-state content
      entirely.
- [ ] The Tutorial Island sequence now runs Avatar → Companion → Theme → First game → Win, in that
      order, with the avatar pick exactly as specified in §3.4.
- [ ] `03`, `05`, `06`, and `07`'s own Acceptance Criteria are re-verified with this module's real
      data before any of them are promoted from 🟡 to 🟢.
- [ ] Simulating a network failure on `POST /quest-completions` (e.g. via dev tools) still shows
      the child their normal summary screen, then the reward syncs automatically once connectivity
      is restored — verified by checking the database after the retry succeeds.
- [ ] The same reliable-commit behavior works for `08`'s difficulty-tier PATCH, using the same
      shared `reliableCommit` utility, not a second independent implementation.
- [ ] The Hub's economy summary refetches on every navigation to `/hub`, correctly showing updated
      stars/level right after returning from a completed session, with no manual reload needed.
- [ ] `quest-completions` and `shop/purchase` are rate-limited the same way `01`'s auth endpoints
      are, confirmed by triggering the limit deliberately.
- [ ] The celebration chime plays for a new badge, a new Collectible, and a level-up (all 3,
      independently verified), reuses `07`'s shared `playTone()` rather than a second
      implementation, is silent when Sound is off, and still plays when `prefers-reduced-motion`
      is set.
