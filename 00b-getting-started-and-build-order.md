# Getting Started & Build Order
Read `00-global-context-and-rules.md` first. This doc doesn't add any new rule, design decision,
or schema — it's the single place that answers two practical questions neither `00` nor any
module doc fully answers on its own: **"where do I actually start,"** and **"what's the human's
job, and when does it come up."** Written after a full cross-doc consistency pass across all 12
docs (`00`–`11`), specifically because those two questions kept being implicitly answered one
piece at a time across 11 different files rather than stated once, clearly, in one place.

---

## 1. The honest starting point, right now

Every single doc in this set — `00` through `11` — is fully written. **None of the app they
describe has been built yet.** Confirmed directly against the filesystem, not assumed:
`skillverse-app/` exists and runs (the pre-auth, mock-data Hub prototype); `skillverse-backend/`
does not exist at all; no `.env` file exists anywhere. This is not a gap in the docs — it's the
genuinely true, current state, and it's the reason this doc exists: **the next real session of
work on this project is the first line of actual implementation code**, not more planning.

If you're an agent picking this project up for the first time (this session or a brand new one),
your very first action should be reading `00`, then this doc, then `01-auth-and-account.md` —
nothing else needs reading before that first real build session starts.

---

## 2. The human's job, stated once, so it doesn't need re-discovering every module

The same pattern repeats for every one of the 11 module docs, and it's worth stating explicitly
instead of leaving it implicit in each doc's own §1/§5/§7:

1. **Read the module doc's §1 ("How to Use This Document")** — it tells the agent exactly what
   order to build backend vs. frontend in, and what checkpoint to run after each.
2. **Do any blocking manual setup first, if §5 has one.** Only `01-auth-and-account.md` has a real
   one: creating a free Resend account and API key (§2 below has the full, consolidated list —
   there is exactly one blocking item in this entire project).
3. **Let the agent build and self-test.** It should stop and ask if a doc is ambiguous — per the
   honesty rule, it must never silently guess.
4. **Personally verify the module's §7 Acceptance Criteria yourself, as a real user would** —
   create a real account, click every button, read every piece of copy. This step is not
   optional and not delegable to the agent's own report. Every module doc says this explicitly;
   it's repeated here because it's the single most important recurring human action in this whole
   project, more than any account signup.
5. **Only then update that module's §2 Current Status** from 🔴 to 🟡/🟢, and move to the next
   module. A status section the human hasn't personally verified is worse than no status at all —
   this is `00` §4's honesty rule applied to the build phase, not just to copy and comments.

**That five-step loop is the entire workflow for all 11 modules.** Nothing module-specific about
it — the only things that change module to module are *what* gets built and verified, never *how*
the human/agent trade off responsibility.

---

## 3. The complete human action-items checklist (consolidated — this is the whole list)

Checked directly: only `01-auth-and-account.md` has any real external account requirement in this
entire 12-doc set. Every other module's own §5 says "nothing new" — confirmed by reading all 11.

| # | Item | Blocking? | When it's actually needed |
|---|---|---|---|
| 1 | Create a free Resend account + generate an API key (`01` §5.1) | **Yes** | Before `01`'s backend Step 1 — nothing involving real verification/reset emails can be tested without it |
| 2 | Create a Google Cloud OAuth app (`01` §5.2) | No | Only before testing the "Continue with Google" path specifically — email/password is the primary, always-working path; this can be deferred indefinitely without blocking any other module |
| 3 | Generate JWT secrets | No — handled by the agent | `openssl rand -base64 32`, done automatically per `11` §5.1; nothing for the human to create |
| 4 | (Optional, not required) Skim `03`'s companion personality blurbs and zone check-in copy before it's built | No | A content-quality nudge, not a technical requirement — `03` §5 |

**That's the entire list.** If a future doc ever introduces a real new external account
requirement, it belongs here too — don't let it live undiscovered in a single module's §5.

**Re: the Google OAuth redirect URI and the sandbox's dynamic preview URLs (`01` §5.2, `11`
§5.1):** this is the one recurring, session-to-session human attention point, not a one-time setup
step — worth knowing that going in, not discovering it mid-session when Google login mysteriously
stops working.

**One thing that's already done and shouldn't be redone:** the 7 real sound effects `03`/`04` need
(Calm Cove's Quiet Sounds, the per-theme ambient tracks) are already sourced, processed, and sitting
in `skillverse-app/public/sounds/` — see `00a` §7.1 and that folder's own `SOURCES.md`. If a future
session sees `03`/`04` still at 🔴 and assumes sound assets need sourcing from scratch, that's a
stale assumption — check the actual folder first.

---

## 4. Build order across all 11 modules (the end-to-end sequence, not just within one module)

Each module doc's own §1 covers backend-then-frontend *within* that module. This is the order
*across* modules — already implied by each doc's own dependency list (its opening "Read ... first"
line), laid out once here as a single sequence instead of requiring it to be reconstructed by
reading 11 files' intros:

1. **`01-auth-and-account.md`** — nothing else can start before this; every later module assumes a
   real, logged-in guardian exists.
2. **`02-child-profile-and-personalization.md`** — needs `01`'s session to exist.
3. **`03-companion-system.md`** and **`04-theme-system.md`** — both depend on `02` (Tutorial
   Island's sequencing), not on each other; can be built in either order, or in parallel by two
   separate sessions.
4. **`05-hub-shell.md`** — the convergence point; needs `01`–`04` all real, since it wires their
   data into one authenticated shell. The single biggest integration lift in the whole project.
5. **`06-skill-world-template-and-catalog.md`** — needs `05`'s routing shell to exist (World Home
   is a route inside it) and `04`'s theme system (world art reuses active-theme ambience).
6. **`07-mini-games.md`** — needs `06`'s catalog (which games exist, which world they belong to).
7. **`08-adaptive-difficulty.md`** — edits `07`'s `MiniGameShell` in place; needs `07` built first.
8. **`09-rewards-and-economy.md`** — the second-biggest integration lift; delivers on real IOUs
   left by `03`, `05`, `06`, `07`, `08` all at once. Needs all five built first to have something
   real to attach rewards to.
9. **`10-guardian-dashboard.md`** — needs `01` (the parent-gate), `05` (the Journey Line it
   replaces mock data in), and `09` (the reward model it extends) at minimum.
10. **`11-data-model-and-backend-roadmap.md`** — **read differently from the other 10.** It was
    written last because it had nothing to consolidate until the other 10 existed, but it should
    be **used from the very first backend session, not saved for last**: type its §3 schema into
    `schema.prisma` incrementally as each module above adds its own models, rather than waiting
    until module 10 is done to write any of it. Treat `11` as a live reference open throughout the
    whole build, not a 12th sequential step.

**Why this order, not some other one:** it's not arbitrary — it's the actual dependency chain
already stated in each doc's own opening "Read ... first" line (`02` needs `01`; `05` needs
`01`–`04`; `08` edits `07`; `09` needs `03`/`05`/`06`/`07`/`08`; `10` needs `01`/`05`/`09`). This
section just makes that chain visible as one sequence instead of requiring it to be reconstructed.

---

## 5. Resuming work in a new sandbox session

Once real backend work has started (module `01` onward), every session after the first begins the
same way: **`11-data-model-and-backend-roadmap.md` §5.4**, the two `resume.sh` scripts. Don't
re-read this whole doc set each session — `11` §5.4 plus whichever module doc you're actively
building is enough.

---

## 6. What "done" means for this entire doc set (not just one module)

There is no single "the app is done" milestone tracked anywhere else, so it's worth saying here:
this project is done, for this phase, when all 11 modules (`01`–`10`, with `11` as the
continuously-updated schema/ops reference) show 🟢 in their own §2, each one personally verified
per §2 of this doc — not when an agent reports success, not when the docs are finished (they
already are), and not when the code merely runs without crashing.
