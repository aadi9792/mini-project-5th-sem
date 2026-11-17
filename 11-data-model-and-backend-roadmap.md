# Module: Data Model & Backend Roadmap

Read `00-global-context-and-rules.md` first. This doc is different in character from every other
doc in this set: it doesn't make new product decisions — it **consolidates** the schema, API
surface, and env vars that `01`–`10` already locked, scattered one piece at a time across 10
files, into one place a coding agent can actually build from in a single pass. It also serves as
the **session-start runbook** — the concrete, copy-pasteable answer to "how do I get both servers
running again" that every prior doc deferred to here.

**Scope of this doc:** the full consolidated `schema.prisma` (§3), the full API surface map (§4),
local dev setup — ports, `.env`, the proxy architecture, migrations, seeding, and the exact resume
sequence (§5), the consolidated NestJS module file tree (§6), and brief target-phase migration
notes for when this eventually moves to Postgres/Redis/Docker (§7). It does **not** redefine any
business rule, UI behavior, or data shape that `01`–`10` already specified — if this doc and a
module doc ever seem to disagree on a *field's meaning or behavior* (not its mechanical SQL type),
the module doc wins; this doc should only ever disagree by being stale, which is a bug to fix here,
not a real conflict to resolve in the module doc.

---

## 1. How to Use This Document

**This doc has no "build order" in the usual sense** — there's no new frontend/backend split to
follow, because everything here was already decided elsewhere. Use it two ways:

1. **Scaffolding from zero** (the actual current state — see §2): when first creating
   `skillverse-backend/`, copy §3's schema directly into `schema.prisma`, build the module tree in
   §6, and wire the endpoints in §4 one module at a time, in the same order the module docs
   themselves recommend (`01` → `02` → `03`/`04` → `05`/`08` → `09` → `10`) — this doc doesn't
   reorder that, it just shows the destination.
2. **Resuming an existing session** (every session after the first real one): jump straight to
   §5.4's Quick Resume runbook. Don't re-read this whole doc each time — it's a reference, not a
   checklist to redo.

**When this module is "done":** every item in §8 verified, §2 updated honestly. Note that this doc
can only reach 🟢 after the *last* module doc it consolidates does — it has no independent content
of its own to finish first.

---

## 2. Current Status

🔴 **`skillverse-backend/` does not exist yet** — confirmed by listing the actual filesystem, not
assumed. No `.env` file exists anywhere in the workspace. No migration has ever been run. Every
model, endpoint, and env var in this doc is a consolidation of what `01`–`10` already specified on
paper — none of it has been scaffolded into real code yet. This doc's own content doesn't change
that; it just means the *first* real backend session has a complete, single-pass target to build
toward instead of re-deriving it from 10 separate files.

A few small, real inconsistencies were found and fixed in earlier docs while preparing this one
(not invented here, just caught during consolidation): `01` referenced `next.config.js` in two
places — the real file (confirmed on disk) is `next.config.ts`; `00` §5 pointed at a
`08-data-model-and-backend-roadmap.md` that was always supposed to be this file, `11`; `10`'s
`RealLifeQuestTemplate` seed file was named `.constant.ts` instead of matching every other seeded
catalog's `.seed.ts` convention. All three are fixed in their source docs, not just noted here.

---

## 3. The Full Consolidated Schema

Every model below is copied verbatim from its owning doc, with three exceptions where a model was
extended incrementally across multiple docs and is shown here in its final, merged form (each
field tagged with where it came from): `Child` (base in `02`, `+activeTheme` in `04`,
`+totalStars`/`totalCoins`/`avatarBaseFace` in `09`) and `QuestCompletion` (base in `09`,
`+realLifeQuestId`/`remindersLevel` in `10`).

```prisma
// ───────────────────────────────────────────────────────────────────────────
// 01-auth-and-account.md
// ───────────────────────────────────────────────────────────────────────────

model Guardian {
  id                  String    @id @default(cuid())
  email               String    @unique   // always stored lowercase; compare lowercase on lookup
  passwordHash        String?              // null if this account is Google-only
  googleId            String?   @unique
  name                String
  emailVerified       Boolean   @default(false)
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?            // null unless currently locked out
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model EmailVerificationToken {
  id         String    @id @default(cuid())
  guardianId String
  tokenHash  String    @unique   // SHA-256 of the plain token emailed to the user
  expiresAt  DateTime             // createdAt + 24h
  usedAt     DateTime?
}

model PasswordResetToken {
  id         String    @id @default(cuid())
  guardianId String
  tokenHash  String    @unique   // SHA-256 of the plain token emailed to the user
  expiresAt  DateTime             // createdAt + 1h
  usedAt     DateTime?
}

model RefreshToken {
  id          String    @id @default(cuid())
  guardianId  String
  tokenHash   String    @unique   // HMAC-SHA256(token, JWT_REFRESH_SECRET)
  deviceLabel String?              // best-effort User-Agent label, never blocks login if parsing fails
  createdAt   DateTime  @default(now())
  expiresAt   DateTime
  revokedAt   DateTime?
}

model ConsentRecord {
  id                      String   @id @default(cuid())
  guardianId              String
  confirmedGuardianStatus Boolean
  dataStorageConsent      Boolean
  nonMedicalDeviceAck     Boolean
  marketingOptIn          Boolean  @default(false)
  consentTextVersion      String              // e.g. "v1" — bump if consent copy ever changes
  createdAt               DateTime @default(now())
}

// ───────────────────────────────────────────────────────────────────────────
// 02-child-profile-and-personalization.md, extended by 04 and 09 (merged form)
// ───────────────────────────────────────────────────────────────────────────

model Child {
  id                  String    @id @default(cuid())
  guardianId          String    // one child per guardian for now — enforced in the service layer
  nickname            String
  age                 Int                 // validated 6–17
  interests           String[]            // fixed chip ids from `02` §3.3
  tutorialCompletedAt DateTime?           // null until Tutorial Island finishes (`02` §3.6)
  activeTheme         String?             // "space" | "ocean" | "jungle" — from `04` §4.1
  totalStars          Int       @default(0)                  // from `09` §4.1
  totalCoins          Int       @default(0)                  // from `09` §4.1
  avatarBaseFace      String?             // emoji; null until Tutorial Island's avatar step — `09` §4.1
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model ChildPreferences {
  id                    String   @id @default(cuid())
  childId               String   @unique
  // raw answers only — UI parameters are derived at read-time (`02` §4.4), never stored separately
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

// ───────────────────────────────────────────────────────────────────────────
// 03-companion-system.md
// ───────────────────────────────────────────────────────────────────────────

model CompanionTemplate {              // seeded once — fixed catalog, not guardian/child input
  speciesId        String   @id            // "robot" | "dragon" | "owl" | "fox" | "turtle" | "octopus"
  displayName      String
  emoji            String
  personalityBlurb String
  isStarter        Boolean  @default(false)
  unlockLevel      Int?                     // null when isStarter is true
}

model ChildCompanion {
  id         String   @id @default(cuid())
  childId    String
  speciesId  String                        // references CompanionTemplate.speciesId
  customName String                        // the child-given name
  isActive   Boolean  @default(false)       // exactly one true per childId, enforced in the service layer
  adoptedAt  DateTime @default(now())
}

model ZoneCheckIn {
  id        String   @id @default(cuid())
  childId   String
  zone      String                          // "calm" | "okay" | "worried" | "big_feelings"
  createdAt DateTime @default(now())
}

// ───────────────────────────────────────────────────────────────────────────
// 08-adaptive-difficulty.md
// ───────────────────────────────────────────────────────────────────────────

model GameDifficultyProfile {
  id        String   @id @default(cuid())
  childId   String
  gameId    String   // "launch-challenge" | "volcano-scale" | "face-detective"
  tier      String   // "easy" | "medium" | "hard"
  updatedAt DateTime @updatedAt

  @@unique([childId, gameId])
}

// ───────────────────────────────────────────────────────────────────────────
// 09-rewards-and-economy.md, QuestCompletion extended by 10 (merged form)
// ───────────────────────────────────────────────────────────────────────────

model GameProgress {
  id                     String @id @default(cuid())
  childId                String
  gameId                 String   // "launch-challenge" | "volcano-scale" | "face-detective"
  completedSessionsCount Int      @default(0)
  bossBattlesWonCount    Int      @default(0)

  @@unique([childId, gameId])
}
// Separate from GameDifficultyProfile on purpose (08 owns only the adaptive tier; this owns
// reward/unlock-relevant counts — different concerns, different tables).

model QuestCompletion {
  id              String   @id @default(cuid())
  childId         String
  questType       String   // "GAME" | "REAL_LIFE"
  gameId          String?  // set for GAME type, null for REAL_LIFE
  mode            String?  // "normal" | "boss", set for GAME type only
  realLifeQuestId String?  // set for REAL_LIFE type — from `10` §4.1
  remindersLevel  String?  // "none" | "a_couple" | "a_lot" | null (skipped) — REAL_LIFE only — from `10` §3.4
  starsAwarded    Int
  coinsAwarded    Int
  completedAt     DateTime @default(now())
}

model ShopItemCatalog {       // seeded once
  id          String @id   // slug, e.g. "top-hat"
  category    String       // "avatar-headwear" | "avatar-eyewear" | "avatar-neckwear" | "companion-accessory"
  emoji       String
  displayName String
  priceCoins  Int
}

model OwnedShopItem {
  id          String   @id @default(cuid())
  childId     String
  itemId      String
  equipped    Boolean  @default(false)
  purchasedAt DateTime @default(now())
}

model CollectibleCatalog {    // seeded once
  id          String @id
  worldId     String      // "time" | "feelings" | "faces"
  emoji       String
  displayName String
}

model OwnedCollectible {
  id            String   @id @default(cuid())
  childId       String
  collectibleId String
  earnedAt      DateTime @default(now())
}

model BadgeCatalog {           // seeded once, the 10 rows from `09` §3.10
  id          String @id
  emoji       String
  displayName String
  description String
}

model EarnedBadge {
  id       String   @id @default(cuid())
  childId  String
  badgeId  String
  earnedAt DateTime @default(now())
}

// ───────────────────────────────────────────────────────────────────────────
// 10-guardian-dashboard.md
// ───────────────────────────────────────────────────────────────────────────

model RealLifeQuestTemplate {   // seeded once: the 5 master-spec templates (implicit "custom" = null templateId)
  id    String @id        // "morning-routine" | "homework" | "meals" | "bath" | "bed"
  label String
  emoji String
}

model RealLifeQuest {
  id           String   @id @default(cuid())
  childId      String
  templateId   String?                  // null if fully custom
  label        String
  emoji        String
  scheduledFor DateTime                 // the calendar day this stop belongs to
  orderIndex   Int                      // position within that day's Journey Line
  rewardStars  Int      @default(10)    // guardian-set, 5–50 enforced server-side
  rewardCoins  Int      @default(5)     // guardian-set, 0–25 enforced server-side
  createdAt    DateTime @default(now())
}

model ScreenTimeSettings {
  id              String  @id @default(cuid())
  childId         String  @unique
  quietHoursStart String? // "HH:mm", null = off
  quietHoursEnd   String? // "HH:mm", null = off
}

model PlaySession {
  id              String    @id @default(cuid())
  childId         String
  startedAt       DateTime  @default(now())
  lastHeartbeatAt DateTime  @default(now())   // updated every 5 min while the child is in the Hub
  endedAt         DateTime?                   // only ever set by an explicit end; the lazy
                                               // 20-min cutoff is a read-time calculation (`10` §4.2)
}
```

**What's deliberately not here:** `07-mini-games.md`'s `GameDefinition` is a **frontend
TypeScript interface** (`generateRound`, `RoundComponent`, `evaluateAnswer`, `summarize`), not a
Prisma model — `07` has zero backend calls of its own (`07` §4.1), so it contributes nothing to
this schema. Don't go looking for a `GameDefinition` table; it doesn't exist and never should.

**Foreign keys are intentionally written as plain `String` fields with no `@relation` above,
matching every module doc's own style** — Prisma relations could be added (`@relation(fields:
[childId], references: [id])`) for real referential integrity once this is actually built; the
module docs never specified cascade behavior per relation, so adding `@relation` attributes here
would be inventing a decision, not consolidating one. **Do add real `@relation` fields when this
schema is actually typed into `schema.prisma`** — just set `onDelete: Cascade` consistently for
every child-owned table (everything with a `childId`) and every guardian-owned table (everything
with a `guardianId`), since that's what `10` §4.2's cascading account-delete already assumes exists.

---

## 4. Full API Surface (consolidated map, not a re-specification)

Every endpoint below is fully specified in its owning doc — this table exists so an agent can find
"which doc do I read for this route" in one lookup, not to restate behavior. All paths are relative
to the `/api/v1` prefix (`01` §4.1's NestJS bootstrap).

| Domain | Endpoints | Owning doc |
|---|---|---|
| Auth | `POST /auth/signup`, `/login`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`, `/resend-verification`, `GET /auth/verify-email`, `GET /auth/google`, `GET /auth/google/callback` | `01` |
| Auth (dashboard) | `POST /auth/verify-password` | `10` §3.1/§4.2 |
| Children | `POST /children`, `GET /children/me`, `PATCH /children/:id/profile` | `02` |
| Preferences | `POST /children/:id/preferences`, `PATCH /children/:id/preferences`, `GET /children/:id/preferences/derived`, `POST /children/:id/complete-tutorial` | `02` |
| Theme | `PATCH /children/:id/theme` | `04` |
| Companions | `GET /companions/catalog`, `GET /companions/me`, `POST /companions/adopt`, `POST /companions/:id/activate`, `PATCH /companions/:id/rename` | `03` |
| Zone check-ins | `POST /zone-checkins` | `03` |
| Difficulty | `GET /difficulty/:gameId`, `PATCH /difficulty/:gameId` | `08` |
| Economy | `GET /economy/summary`, `GET /wins`, `PATCH /avatar`, `GET /shop/catalog`, `POST /shop/purchase`, `PATCH /shop/equip`, `POST /quest-completions` | `09` |
| Journey / Quest Control | `GET /journey/:childId/:date`, `POST /journey/:childId`, `PATCH /journey/quests/:id`, `DELETE /journey/quests/:id`, `PATCH /journey/:childId/reorder`, `POST /journey/:childId/repeat-yesterday` | `10` §4.3 |
| Dashboard | `GET /dashboard/mission-report/:childId` | `10` §4.3 |
| Screen-time | `PATCH /children/:id/screen-time`, `GET /children/:id/screen-time` | `10` §4.3 |
| Play sessions | `POST /play-sessions/start`, `POST /play-sessions/:id/heartbeat`, `POST /play-sessions/:id/end` | `10` §4.3 |
| Guardian (consent) | `GET /guardian/export`, `DELETE /guardian/account` | `10` §4.3 |

**Auth header conventions, consolidated:** most endpoints rely on the main `sv_access_token`
httpOnly cookie (`01` §4.3), verified as a standard JWT. The `10`-owned endpoints additionally (or
instead, for `verify-password` itself) require the separate `Authorization: Guardian {token}`
header described in `10` §4.2 — these are two independent, non-overlapping auth mechanisms by
design (`10` §6), not layers of the same system.

---

## 5. Environment & Local Dev Setup

### 5.1 The full `.env` file (consolidated — every variable any doc has named)

**Gap caught while consolidating:** the §4 endpoint table's source docs include two more vars `01`
§5.4 already named that an earlier draft of this section missed — `GOOGLE_CALLBACK_URL` and
`FRONTEND_URL`. Both matter more here than the others, for a reason specific to this sandbox: they
hold **public** URLs, and this workspace's live-preview URLs are dynamically generated and can
change between sessions (the same caveat `01` §5.2 already flags for Google's redirect-URI
registration) — unlike `DATABASE_URL`/the JWT secrets, which stay stable forever once generated,
these two may need re-checking at the start of a session if the preview URLs rotated.

```bash
# skillverse-backend/.env — never committed (already in .gitignore)

DATABASE_URL="file:./dev.db"

JWT_ACCESS_SECRET=<generate with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 32>
JWT_GUARDIAN_ACTION_SECRET=<generate with: openssl rand -base64 32>

RESEND_API_KEY=<from 01 §5.1 — blocking, you create this account>
GOOGLE_CLIENT_ID=<from 01 §5.2 — not blocking, can defer>
GOOGLE_CLIENT_SECRET=<from 01 §5.2 — not blocking, can defer>

# The two session-sensitive ones — re-verify these first if Google login or any
# cross-origin behavior misbehaves after a sandbox restart:
GOOGLE_CALLBACK_URL=<backend's current public preview URL>/api/v1/auth/google/callback
FRONTEND_URL=<frontend's current public preview URL>

PORT=4000
NODE_ENV=development
```

**`PORT` and `NODE_ENV` are new in this doc** — every module doc referenced "the backend" without
ever pinning an actual port number (confirmed: not one doc specifies one). Fixed here: **the
backend always runs on port 4000.** `NODE_ENV=development` keeps `01` §4.3's cookie `Secure`
attribute off locally — this still works correctly even though the sandbox serves the frontend
over HTTPS at the edge (a non-`Secure` cookie works over both HTTP and HTTPS; only a `Secure`
cookie would *refuse* to work over plain HTTP) — don't "fix" this to `true` for local dev, it isn't
broken.

### 5.2 Port & proxy architecture (now concretely pinned down)

- **Backend:** NestJS, bound to `0.0.0.0:4000` (not `localhost`, per this sandbox's requirement
  that servers bind to all interfaces to be reachable — same rule the frontend already follows).
- **Frontend:** Next.js dev server, its usual port (whatever `next dev` picks / is assigned).
- **The rewrite, finally concrete** — add to `next.config.ts` (confirmed as the real filename,
  fixing `01`'s stale `.js` reference):

  ```ts
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:4000/api/:path*" }];
  }
  ```

  This rewrite always targets `localhost:4000` — **not** the backend's public sandbox preview URL
  — because both processes run on the same machine; Next.js's *server* makes this request, not the
  user's browser, so the dynamic public preview URL is irrelevant here. This is also why CORS is a
  non-issue for normal app traffic (§5.7).

### 5.3 What survives between sandbox sessions, and what doesn't (verified, not assumed)

Confirmed directly against this workspace, not inferred from general Next.js/Prisma knowledge:

| Survives (plain files under `/home/user`) | Does NOT survive (excluded from snapshots) |
|---|---|
| `schema.prisma` itself | `node_modules/` (both frontend and backend) |
| `dev.db` (the actual SQLite data file) | `.next/` (frontend build cache) |
| `.env` | `dist/`/`build/` (backend compiled output) |
| Prisma `migrations/` folder (plain `.sql` files) | Any running process (both dev servers) |

**The practical consequence:** real data entered during testing (a test guardian/child, their
quests, their progress) genuinely persists across sessions — you are not starting from a truly
empty database every time, only from a cold *process* state. What needs redoing each session is
reinstalling dependencies and regenerating the Prisma Client (which lives inside `node_modules`),
not recreating the database or re-entering secrets.

### 5.4 Quick Resume — the runbook every future session should start with

**Two small helper scripts**, written once, used every session after:

```bash
# skillverse-backend/scripts/resume.sh
#!/bin/bash
set -e
if [ ! -d node_modules ]; then npm install; fi
npx prisma generate
if [ ! -f prisma/dev.db ]; then
  npx prisma migrate dev --name init
  npx prisma db seed
fi
npm run start:dev
```

```bash
# skillverse-app/scripts/resume.sh
#!/bin/bash
set -e
if [ ! -d node_modules ]; then npm install; fi
npm run dev
```

**Each is a `start_process`-style long-running command** (the backend on port 4000, the frontend
on its own port) — run the backend's script first, confirm it's actually listening (a `GET
/api/v1/health` returning `200` is a cheap, worthwhile addition — not specified by any other doc,
proposed here as a trivial unauthenticated endpoint purely for this check), then the frontend's.
If `prisma/dev.db` already exists (the common case after the first real session), the backend
script skips straight to `start:dev` — migrations and seeding are one-time steps, not a per-session
ritual (§5.6).

### 5.5 Migration strategy: `prisma migrate dev`, not `db push`

Chosen over `db push` specifically because this schema is already fully specified (not an
exploratory, rapidly-changing prototype at this point — `01`–`10` locked it) and because `01` §4.1
already committed to being "Postgres-portable later." `migrate dev` builds real, named migration
files as the schema grows across modules — exactly the artifact a later Postgres move needs, and
genuinely useful evidence of real backend practice for a portfolio/demo project. The extra step per
schema change (`npx prisma migrate dev --name add-journey-models`, etc.) is small compared to that
payoff. `cuid()` is used as the ID strategy everywhere already (not Postgres's `autoincrement()`),
so no model needs changing when that move eventually happens — only `DATABASE_URL` does.

### 5.6 Seeding — one-time, not per-session

`prisma/seed.ts` runs all 5 catalog seed files in one pass (`companion-catalog.seed.ts`,
`shop-catalog.seed.ts`, `collectible-catalog.seed.ts`, `badge-catalog.seed.ts`,
`real-life-quest-template.seed.ts` — the last one's filename fixed during this doc's own
consolidation, §2). Registered via `package.json`'s `"prisma": { "seed": "ts-node prisma/seed.ts"
}` so `npx prisma db seed` finds it. Triggered automatically by §5.4's resume script **only** the
first time `dev.db` doesn't exist yet — re-running it on an already-seeded database would violate
each catalog table's implicit "seeded once" assumption (none of the `*.seed.ts` scripts are written
to be idempotent/upsert-safe, since no module doc ever needed them to run twice).

### 5.7 CORS — why this app barely needs it, and the minimal config it still gets

Because the browser only ever talks to the Next.js frontend's own origin (§5.2's rewrite proxies
server-side, invisibly to the browser), **CORS never actually matters for real app traffic** — this
was `01` §4.1's whole point in choosing the proxy approach over direct cross-origin calls. The
backend still gets a minimal CORS config (`origin: "http://localhost:3000"` — or whatever the
frontend's actual local port is — `credentials: true`) purely so a developer can hit the backend
directly with `curl`/Postman/a REST client during debugging without it being rejected outright; it
is not a production-grade allowlist and isn't meant to be one yet.

---

## 6. NestJS Module Layout (consolidated)

```
skillverse-backend/
├── .env
├── prisma/
│   ├── schema.prisma                        # §3, in full
│   ├── migrations/                          # created by `prisma migrate dev`
│   ├── seed.ts                              # §5.6, runs all 5 seeders below
│   └── seeds/
│       ├── companion-catalog.seed.ts         # 03
│       ├── shop-catalog.seed.ts              # 09
│       ├── collectible-catalog.seed.ts       # 09
│       ├── badge-catalog.seed.ts             # 09
│       └── real-life-quest-template.seed.ts  # 10 (renamed during this doc's consolidation)
├── scripts/
│   └── resume.sh                            # §5.4
└── src/
    ├── main.ts                              # bootstraps Nest, cookie-parser, /api/v1 prefix,
    │                                         # minimal CORS (§5.7), binds 0.0.0.0:4000
    ├── app.module.ts                        # imports every feature module below
    ├── health/
    │   └── health.controller.ts             # GET /health — new, trivial, proposed in §5.4
    ├── auth/                                # 01 (signup/login/.../refresh) + 10 (verify-password)
    ├── guardians/                           # NEW, introduced by 10 (export/delete, §3.7) — not
    │                                         # an extension of 01, which has no guardians/ module
    │                                         # of its own (all its logic lives in auth/)
    ├── children/                            # 02 (profile/preferences) + 04 (theme) + 09 (Child's
    │                                         # extended fields live on the same model, no separate module)
    ├── companions/                          # 03
    ├── zone-checkins/                       # 03
    ├── difficulty/                          # 08
    ├── economy/                             # 09 — actually 3 sibling folders in 09's own §4.4
    │                                         # (economy/, shop/, wins/), shown collapsed to one
    │                                         # line here; follow 09 §4.4 for the exact split, not
    │                                         # this simplified map
    ├── journey/                             # 10 (Quest Control)
    ├── dashboard/                           # 10 (Mission Report aggregation)
    ├── screen-time/                         # 10
    ├── play-sessions/                       # 10
    └── common/
        ├── guards/                          # access-token guard, guardian-action-token guard (10 §4.2)
        ├── constants/
        │   └── themes.constant.ts           # 04's 6-entry theme catalog (code constant, not a table)
        └── filters/                         # global exception filter — never leak a raw stack
                                              # trace or DB error to a client response
```

**Dependencies (consolidated from `01` §4.4, unchanged — no new packages needed by `02`–`10`'s
backend work beyond what `01` already installs):** `@nestjs/core @nestjs/common
@nestjs/platform-express @nestjs/jwt @nestjs/passport @nestjs/throttler @nestjs/config passport
passport-jwt passport-google-oauth20 bcrypt prisma @prisma/client class-validator
class-transformer cookie-parser resend`.

---

## 7. Target-Phase Migration Notes (brief — not built now, see `00` §5)

When this project eventually moves beyond its current phase:
- **Postgres:** change `DATABASE_URL` to a Postgres connection string, re-point `schema.prisma`'s
  `datasource` block's `provider` from `sqlite` to `postgresql`, re-run `migrate dev` once against
  the new target. No model needs restructuring — `cuid()` IDs and every field type used in §3 are
  already Postgres-compatible.
- **Redis/BullMQ, Socket.IO, Docker, AWS S3, Sentry/CloudWatch:** all explicitly deferred per `00`
  §5's existing phase split — nothing in `01`–`10` assumes any of these exist yet (e.g. `10` §3.2
  explicitly chose polling over WebSocket for exactly this reason). Introducing any of them is a
  real, separate future decision, not a natural extension of this doc.

---

## 8. What You Need to Do, With Why

Nothing new beyond what `01` §5 already asked for (the Resend account is blocking; the Google
Cloud OAuth app is not). This doc introduces no new external account or credential — `PORT`,
`NODE_ENV`, and `JWT_GUARDIAN_ACTION_SECRET` are all generated/decided locally, nothing to sign up
for.

---

## 9. Explicitly Out of Scope for This Module

- **Any new product decision.** This doc consolidates `01`–`10`; it doesn't make new calls about
  what the app does. If something feels undecided while writing this doc, that's a sign it belongs
  back in the owning module doc, not resolved here as a side effect.
- **Real `@relation`/cascade wiring in `schema.prisma`.** Noted as a real to-do in §3, not done
  here — adding it requires deciding cascade behavior per relation, which no module doc specified
  explicitly beyond `10` §4.2's account-delete assumption.
- **Postgres, Redis, Docker, or any other target-phase infrastructure.** §7 is notes, not a build.
- **A CI/CD pipeline, automated tests, or Swagger docs.** Never discussed anywhere in this doc set;
  real future scope, not silently assumed to exist.
- **Idempotent/re-runnable seed scripts.** Each seeds once, by design (§5.6) — making them safely
  re-runnable is a nice-to-have, not required for this phase.

---

## 10. Acceptance Criteria / Definition of Done

- [ ] `npx prisma validate` passes against §3's schema with zero errors once it's typed into a real
      `schema.prisma`.
- [ ] A fresh sandbox session, starting from zero installed dependencies, reaches both servers
      running and reachable using only §5.4's two resume scripts — no manual troubleshooting steps
      beyond what's written there.
- [ ] `GET /health` returns `200` with no auth required, confirming the backend is reachable before
      debugging anything more complex.
- [ ] A guardian/child created in one sandbox session is still present (confirmed via a real query,
      not just "the app didn't complain") after the sandbox restarts and `resume.sh` is re-run.
- [ ] The Next.js rewrite correctly proxies a real `/api/v1/*` call through to the backend with no
      CORS error ever appearing in the browser console, confirming §5.2/§5.7's architecture holds.
- [ ] Every endpoint in §4's table is reachable at its documented path with the `/api/v1` prefix,
      cross-checked against its owning doc's exact request/response shape — this doc's table is a
      map, not the source of truth, so a mismatch means fixing *this* doc, not the owning one.
- [ ] Running `npx prisma db seed` twice in a row is recognized as unsupported (§9) — don't treat a
      duplicate-key error from doing so as a bug to silently work around.
- [ ] `JWT_GUARDIAN_ACTION_SECRET` is confirmed distinct from `JWT_ACCESS_SECRET`/
      `JWT_REFRESH_SECRET` in the actual `.env` — not accidentally reused.
- [ ] After a sandbox restart, `GOOGLE_CALLBACK_URL`/`FRONTEND_URL` are checked against the
      session's actual current preview URLs before assuming Google login is broken — per §5.1's
      note, a stale value here (not a code bug) is the first thing to rule out.
