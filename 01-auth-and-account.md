# Module: Auth & Account
Read `00-global-context-and-rules.md` first — this doc inherits every global rule (honesty
rule, design system, tech stack phasing) without repeating it.

**Scope of this doc:** guardian signup/login, sessions, consent capture (the legal-gate
checkboxes only), and the handoff into child mode. It does **not** cover: the child profile
fields or the 12-question personalization questionnaire (→ `02-child-profile-and-personalization.md`),
companion selection/naming (→ `03-companion-system.md`), or theme selection (→ `04-theme-system.md`).
Those all happen chronologically *after* this module's "Continue as Child" screen, during
Tutorial Island.

This doc is written so a coding agent with **zero other context** can build this module without
guessing. If you (the agent reading this later) hit a decision this doc doesn't answer, stop and
surface it — don't assume. See §1 for exactly how to work through this doc.

---

## 1. How to Use This Document

This doc is meant to be handed to a coding agent in **stages**, not as one "build all of this"
instruction. Here's the order, and why.

**Step 0 — before any code is written:** complete the blocking item in §5: create a Resend
account and get an API key (5 minutes, free). Nothing involving real verification/reset emails
can be tested without it. Google OAuth setup (also in §5) can be done later — email/password is
the primary path this module is built and tested against first.

**Step 1 — backend first.** Tell the agent, in a fresh session if needed:
> "Read `docs/00-global-context-and-rules.md` and `docs/01-auth-and-account.md`. Build the
> backend described in Section 4 of the auth doc. Implement the endpoints in this order: signup
> → email verification → login → refresh/logout → forgot/reset password → Google OAuth last.
> Don't start on the frontend yet."

Building in that order means each piece can be tested on its own before the next one depends on
it (e.g., you can't test login until signup + verification work).

**Checkpoint after Step 1 — do this yourself, don't take the agent's word for it:**
- Create a real account using your own email via a REST client (curl/Postman/Thunder Client).
- Confirm the verification email actually lands in your inbox via Resend, with the subject/body
  from §4.8.
- Confirm login returns a session cookie, confirm 5 wrong passwords trigger the lockout.
- Walk through every backend-only box in §7 Acceptance Criteria before moving on.

**Step 2 — frontend second, only after Step 1's checkpoint passes.** Tell the agent:
> "Now build the frontend described in Section 3 of the auth doc, including the exact visual
> spec in Section 3.1 and the exact copy in Sections 3.3–3.7. Match the colors, spacing,
> typography, and wording exactly — don't invent new values or new copy." Build screens in this
> order: Welcome → Sign Up → Check-your-email → Log In → Forgot/Reset Password →
> Continue-as-Child → Terms/Privacy stub pages.

**Checkpoint after Step 2:** visually compare the built screens against §3.1's exact values
(open the file and check against the actual hex codes/sizes, not "it looks about right" —
color/spacing drift is the single most common way these specs quietly stop being followed), and
compare every piece of on-screen text against §3.3–3.7 word for word. Then run the entire flow
end to end yourself as a real guardian would.

**When this module is actually "done":** every item in §7 is checked AND you've personally
verified it, not just the agent reporting success. Only then update §2 below from 🔴 to 🟢 — per
the project's honesty rule, this status line must never claim more than what's actually been
tested.

**If anything in this doc is unclear or missing once you're actually building:** that's a real
gap, not something to silently improvise around — bring it back for a quick discussion the way
every other decision in this project has been made, then update this doc before continuing.

---

## 2. Current Status

🟡 **Backend and Frontend Auth UI are built and running locally.**
- **Backend** (`skillverse-backend/`): NestJS server on port 4000 with Prisma SQLite database, bcrypt hashing, JWT cookie sessions, lockout after 5 failed attempts, email verification & password reset services.
- **Frontend** (`skillverse-app/`): Next.js App Router on port 3000 with Space design tokens, custom Baloo 2 and Nunito fonts, starfield backdrop, and all Module 01 screens: Welcome (`/`), Sign Up (`/signup`), Log In (`/login`), Check your email (`/verify-pending`), Verify Email (`/verify-email`), Forgot Password (`/forgot-password`), Reset Password (`/reset-password`), Continue as Child (`/continue-as`), and Terms/Privacy stub pages. API proxy configured to backend port 4000.
- Next step for human verification: test the end-to-end signup and login cycle in the browser.

---

## 3. Frontend & UI

### 3.1 Visual Design System for this module (exact values — read before building any screen)

**Default theme rule (important, resolves a real ambiguity):** every screen in this module
(Welcome, Sign Up, Log In, Forgot/Reset Password, Check-your-email, Continue-as-Child, Terms/
Privacy) **always renders in the Space theme palette, hard-coded — never dynamic, never reactive
to any child's personal theme choice.** Reasoning: these screens exist *before* any child or
theme context is known — a guardian hasn't logged in yet, or is choosing between children on a
shared family device, so there is nothing to theme against yet. Do not wire this module into the
theme-switching system described in `04-theme-system.md` at all.

**Color tokens (all existing `--sv-*` CSS variables from `globals.css` — no new tokens needed):**

| Element | Token / value | Notes |
|---|---|---|
| Page background | `--sv-bg` (`#f3f7ff`) | Starfield layers on top of this |
| Starfield stars | white dots, opacity 20%–90% via existing `@keyframes twinkle` | 40–60 stars, 1–2px each. Noticeably fewer/dimmer than the Hub's field |
| Starfield drift speed | existing `@keyframes drift`, duration ×1.5–2 slower than the Hub's | "noticeable but calm," per the agreed decision |
| Card background | `--sv-card` (`#ffffff`) | |
| Card shadow | `0 10px 40px rgba(47, 127, 163, 0.12)` | Soft, primary-tinted — not a generic black shadow |
| Card shape | `border-radius: 24px` (Tailwind `rounded-3xl`) | |
| Card size | `max-width: 420px`, padding `40px` desktop / `24px` mobile | Single column always, no side-by-side fields |
| Logo/wordmark | `--sv-primary-deep` (`#2f7fa3`) | **No real logo asset exists yet.** Use a text wordmark, "Skillverse," set in font-heading (Baloo 2), weight 700, ~22px, exactly the way the mascot placeholder is handled below — this is a known, acceptable placeholder, not a blocker |
| Tagline text | `--sv-text-soft` (`#6b7191`), 15px regular | Exact copy in §3.3 |
| Headline ("Welcome back" / "Create your guardian account") | `--sv-text` (`#2e3350`), font-heading (Baloo 2), 28px desktop / 24px mobile, weight 700 | |
| Pitch line (Sign Up only) | `--sv-text-soft`, 14px, font-body (Nunito) regular | |
| Field label | `--sv-text`, 13px, font-body, weight 600, `margin-bottom: 6px` | |
| Field input (default) | height `48px`, `border-radius: 12px`, border `1.5px solid rgba(107,113,145,0.25)`, background `#ffffff`, text `--sv-text` 15px | |
| Field input (focus) | border `--sv-primary`, plus a `3px` focus ring at `--sv-primary` 15% opacity | |
| Field input (error) | border `--sv-warning` (`#e38b8b`), `1.5px` | |
| Placeholder text | `--sv-text-soft` at 60% opacity | |
| Error helper text | `--sv-warning`, 13px, paired with a small warning-triangle icon (lucide `AlertTriangle`, 14px, same color), `4px` gap, `margin-top: 4px` | Never color alone — icon + text always together |
| Primary button | height `48px`, `border-radius: 999px` (pill), background **solid `var(--sv-primary-deep)`** (not a gradient into the lighter `--sv-primary` — see `00` §6.2.1, white-on-`--sv-primary` fails WCAG AA), text `#ffffff` 16px weight 700 | Hover: +5% brightness. Disabled: 50% opacity, no pointer events |
| Primary button (loading) | label replaced by a centered spinner (lucide `Loader2`, spinning); if `prefers-reduced-motion` is on, replace the spin with a static icon + "Please wait" text instead of just slowing it | |
| Google button | Per Google's own required branding: white `#ffffff` background, `1px solid #dadce0` border, text `#3c4043` 14px, official multicolor "G" logo left-aligned, height 44–48px. Do **not** reskin this in Skillverse colors — that's a real brand requirement | |
| Links (Forgot password, switch login/signup, "Request a new link") | `--sv-primary-deep`, 14px, underline on hover only | |
| Footer links (Terms • Privacy) | `--sv-text-soft` 13px body text, links in `--sv-primary-deep`, separated by `" • "` | |
| Consent block | background `--sv-card-tint` (`#f6f4ff`), `border-radius: 16px`, padding `16px`, `margin: 20px 0` | |
| Checkbox (default) | 20×20px, `border-radius: 6px`, `1.5px solid var(--sv-text-soft)` | |
| Checkbox (checked) | background `--sv-primary`, white checkmark icon | |
| Checkbox label text | `--sv-text`, 13px, `line-height: 1.4` | |
| Honesty-note line under consent block | `--sv-text-soft`, 12px, italic | The "this is a placeholder consent flow" line — see §3.4 |
| Lockout banner | background `--sv-warning` at 12% opacity, border `1px solid` `--sv-warning` at 40% opacity, `border-radius: 12px`, padding `12px 16px`, lucide `Lock` icon + `--sv-text` 13px text | |
| Divider (form → Google button) | `1px` line, `--sv-text-soft` at 15% opacity | No "or" label needed — Google is already clearly secondary by position |
| Mascot illustration | **Use a simple icon/emoji-in-a-soft-circle-badge treatment for now** (consistent with how the Hub already uses emoji rather than bespoke illustration) — e.g. a friendly robot emoji in a `--sv-card-tint` circle badge, ~64px. Real custom illustration is a future asset upgrade, not a blocker for building this screen | Explicitly not a child's chosen companion — this is a generic placeholder shown pre-login |

**Typography stack:** `font-heading` = Baloo 2 (headlines only), `font-body` = Nunito (everything
else) — already wired via `next/font/google` in the root layout. No new font loading needed.

**Spacing rhythm:** 8px base unit. Field-to-field gap: `16px`. Section-to-section gap (e.g. fields
block → consent block): `24px`. Card internal padding: `40px` desktop / `24px` mobile.

**Animation specifics:**
- Card entrance: fade + 12px upward slide, `350ms ease-out`, once on mount.
- Mascot idle motion (optional): 3px vertical bob, 4s period, infinite — **fully disabled** (not
  just slowed) when `prefers-reduced-motion` is set.
- None of these animations may block or delay interaction with the form.

**Responsive breakpoint:** single breakpoint at `640px` (Tailwind `sm`). Below it: card goes
full-width minus 24px side margins, padding drops to 24px, headline drops to 24px.

### 3.2 Screens in this module
1. **Welcome** — logo, tagline, short one-line pitch, "Log In" / "Sign Up" entry points.
2. **Sign Up** — name, email, password, confirm password, "Continue with Google," consent block.
3. **Check your email** — post-signup holding screen, "Resend email" action.
4. **Log In** — email + password, "Continue with Google," "Remember me," "Forgot password?" link.
5. **Forgot Password** — request screen → "check your email" confirmation → reset screen (new
   password + confirm, reached via the emailed link/token) → success screen.
6. **Continue as [Child]** — post-login landing screen, shows the one child profile tied to this
   account (data from `02-child-profile-and-personalization.md`) with a "Continue" action into
   the Hub. Built as the same component that becomes a real multi-child selector later, even
   though there's only ever one child to show right now.
7. **Terms / Privacy** — two static pages, linked from the footer of every screen above.

### 3.3 Welcome screen — exact copy
- Logo/wordmark (see §3.1): **"Skillverse"**
- Tagline: **"Where every child is the hero."**
- Pitch line: **"Turn everyday challenges into playable adventures."**
- Two buttons, equal visual weight: **"Log In"** and **"Sign Up"**.

### 3.4 Sign Up card — exact contents, order, and copy
1. Headline: **"Create your guardian account"**
2. Pitch line (Sign Up only): **"Skillverse turns everyday challenges into playable adventures
   for your child."**
3. Fields in order: Name, Email, Password, Confirm Password. Password field has a show/hide
   toggle (eye icon, right-aligned inside the field).
4. Consent block (see §3.1 styling), exact copy and order:
   - ☐ **"I confirm I am the parent or legal guardian of the child who will use this account."**
     *(required)*
   - ☐ **"I consent to Skillverse storing my child's profile and preference information to
     personalize their experience."** *(required)*
   - ☐ **"I understand Skillverse does not collect or store any medical diagnosis, and this app
     is not a medical device."** *(required acknowledgment)*
   - ☐ **"Send me occasional email updates about new features."** *(optional, unchecked by
     default)*
   - Note line below the block, exact copy: *"This is a placeholder consent flow for the
     prototype, not a final legal agreement."* — required by the honesty rule, not decorative.
5. Primary button: **"Create Account"**, full-width pill.
6. Divider (per §3.1).
7. Google button, exact label: **"Sign up with Google"**.
8. Switch link: **"Already have an account? Log in"**
9. Footer: **"Terms • Privacy"** (links to the stub pages in §3.7).

### 3.5 Log In card — exact contents, order, and copy
1. Headline: **"Welcome back"**
2. Email field, Password field (show/hide toggle).
3. One row: "Remember me" checkbox (left) + **"Forgot password?"** link (right).
4. Primary button: **"Log In"**, full-width pill.
5. Google button, exact label: **"Continue with Google"**.
6. Switch link: **"Don't have an account? Sign up"**
7. Same footer as Sign Up.

### 3.6 Check-your-email, Forgot Password & Continue-as-Child — exact copy

**Check your email (post-signup):**
- Headline: **"Check your email"**
- Body: **"We've sent a verification link to {email}. Click it to activate your account."**
- Button: **"Resend email"** — disabled for 60 seconds after each send, label during cooldown:
  **"Resend in {countdown}s"**.
- Below the button: **"Wrong email? "** + a link reading **"Go back"** (returns to Sign Up with
  fields preserved).

**Verify-email landing page (what the emailed link opens):**
- Success state — Headline: **"Email verified!"** Body: **"Your account is ready. Log in to
  continue."** Button: **"Log In"**.
- Invalid/expired token state — Headline: **"This link has expired"** Body: **"Verification
  links are valid for 24 hours and can only be used once."** Button: **"Request a new link"**
  (routes back to the Check-your-email screen's resend flow, prompting for the email again since
  the guardian isn't logged in yet).

**Forgot Password — request screen:**
- Headline: **"Reset your password"**
- Body: **"Enter the email on your account and we'll send you a reset link."**
- Field: Email. Button: **"Send Reset Link"**.
- Link back: **"Remembered it? Log in"**

**Forgot Password — confirmation screen (shown after submitting, always, per §4.5's
anti-enumeration rule):**
- Headline: **"Check your email"**
- Body: **"If an account exists for that email, we've sent a password reset link."**
- Smaller note: **"Didn't get it? Check spam, or try again in a minute."**

**Forgot Password — reset screen (opened from the emailed link):**
- Headline: **"Choose a new password"**
- Fields: New Password, Confirm New Password (both with show/hide toggle).
- Button: **"Update Password"**.
- Invalid/expired token state — same pattern as email verification: Headline: **"This link has
  expired"** Body: **"Password reset links are valid for 1 hour and can only be used once."**
  Button: **"Request a new link"** (routes back to the request screen).

**Forgot Password — success screen:**
- Headline: **"Password updated"**
- Body: **"You've been logged out of all devices for security. Log in with your new password."**
- Button: **"Log In"**.

**Continue as [Child]:**
- Headline: **"Who's playing today?"** (phrased for future multi-child support even though only
  one child exists now).
- One card showing the child's nickname with a default icon/avatar placeholder (no real avatar
  system exists yet — a simple colored circle with the child's first initial is an acceptable
  placeholder), button: **"Continue as {child.name}"**.
- **A second, visually secondary action below the main button: a text link reading "View
  Dashboard"** (added by `10-guardian-dashboard.md` §3.1 — this screen previously had no path to
  anything guardian-facing at all, a real gap that doc found and fixed here directly rather than
  leaving as a note). Tapping it opens `10`'s parent-gate modal before proceeding — this screen
  itself doesn't implement the gate, just the entry link into it.
- Small secondary link, separate from the child card: **"Not you? Log out"**.

### 3.7 Terms & Privacy stub pages — required content
These must not contain invented legal boilerplate — that would violate the honesty rule by
looking more official than it is. Each page gets:
- A clearly visible banner at the top: **"This is a placeholder page for the prototype phase. A
  real Privacy Policy and Terms of Service will be published before any public launch."**
- Underneath, a short, honest, plain-language summary of what's *actually* true right now —
  not a legal document, just real facts:
  - **Privacy page summary should state:** what's collected today (guardian name/email/password,
    one child's nickname/age/preferences), where it's stored (a local database during
    development), that it is not sold or shared with third parties, that there is no advertising
    or behavioral tracking of children, and that this placeholder will be replaced with a real,
    reviewed policy before any public launch.
  - **Terms page summary should state:** that Skillverse is in active development/prototype
    stage, is not a medical device and makes no medical claims, and that a real Terms of Service
    will be published before any public launch.
- Both pages use the same card/typography system as the rest of this module (§3.1), just as a
  simple scrollable content page rather than a form.

### 3.8 States every screen in this module needs
- **Loading:** primary button label replaced by spinner, button disabled.
- **Validation errors** (inline, under the specific field, exact copy):
  - Duplicate email on signup: *"That email's already registered — try logging in instead?"*
    (the "logging in" text is a link)
  - Wrong credentials on login: *"Incorrect email or password."*
  - Unverified account login attempt: *"Check your inbox to verify your email first."* with a
    "Resend email" link.
  - Password too weak: *"Password needs at least 8 characters and a number."*
  - Passwords don't match: *"Those passwords don't match."*
  - Required consent box unchecked: *"Please confirm this to continue."* directly under that
    checkbox, shown only on submit attempt.
- **Lockout state** (after 5 failed login attempts within 60 seconds, see §4.6): lockout banner
  per §3.1 styling, exact copy: *"Too many attempts. Try again in {countdown}s."* Live-updating
  countdown, submit button disabled meanwhile. This specific lockout applies to the login
  endpoint only — see §4.6 for how it differs from the general rate limiting on other endpoints.
- **Expired/invalid token states:** see §3.6 for the exact verify-email and reset-password
  expired-link copy.
- **Google OAuth failure/cancellation:** *"Google sign-in was cancelled or failed — try again or
  use email."* No automatic retry.
- **Generic network/server error:** *"Something went wrong. Please try again."* — never a raw
  error code, stack trace, or backend exception message shown to the guardian.

### 3.9 Accessibility & motion
- Every field has a real `<label for="...">`, never a placeholder-as-label.
- Visible focus ring (`2px solid var(--sv-primary)`) on every interactive element; the entire
  flow must be completable via keyboard alone.
- Error/success messages announced via an `aria-live="polite"` region, not just a visual color
  change.
- All animation respects `prefers-reduced-motion` exactly as the Hub already does. This module
  does not need its own Calm Mode toggle — a guardian hasn't set preferences yet at this point,
  so it should already default to minimal motion.
- Minimum tap target height `44px` on every button/input — an accessibility floor for this
  audience, not a mobile nicety.

### 3.10 What this module hands off to other docs
- After "Continue as Child," control passes to the Hub (`05-hub-shell.md`) — but if no child
  profile exists yet, route into Create Child Profile (`02`) first instead.
- If a child profile exists but Tutorial Island (companion + theme pick, `02`/`03`/`04`) was
  never completed, route there instead of the Hub.
- **Updated — routing ownership has since moved:** this doc originally said it "owns the routing
  decision," which was true when it was the only module written. `05-hub-shell.md` §4.2 has since
  centralized this into a shared `useOnboardingGuard` hook and a full route map covering every
  protected page symmetrically (including `/continue-as` itself redirecting *away* if a guardian
  isn't actually fully onboarded yet, not just redirecting others *into* it). This doc still owns
  what the Continue-as screen looks like (§3.2, §3.6); `05` owns the actual redirect logic that
  decides whether a guardian should see it at all.
- **`10-guardian-dashboard.md` owns:** everything behind the "View Dashboard" link this doc's
  Continue-as screen now includes (§3.6) — the parent-gate itself, and every screen past it. This
  doc only owns the link's presence and placement, not what it leads to.

---

## 4. Backend & File Architecture

### 4.1 Why a separate NestJS service (recap, so this doc stands alone)
A standalone NestJS backend, not Next.js API routes — matching the master spec's architecture.
SQLite via Prisma for now (file-based, survives in the workspace with no running server to
babysit between sessions), schema written to be Postgres-portable later. The Next.js frontend
proxies all `/api/*` calls to this backend via `next.config.ts` rewrites, so the browser only
ever sees one origin — this is what makes httpOnly cookies work cleanly with no cross-site cookie
issues.

### 4.2 Token architecture (resolves a real ambiguity — read carefully)
- **Access token: a real JWT.** Stateless, short-lived (15 minutes), signed with
  `JWT_ACCESS_SECRET`. Payload: `{ sub: guardianId, email, iat, exp }`. Verified on every
  protected request without a database lookup.
- **Refresh token: NOT a JWT — an opaque random string.** Generated as 48 random bytes, hex
  encoded. The plain value is sent to the browser as a cookie; only a SHA-256 hash of it
  (peppered with `JWT_REFRESH_SECRET` via HMAC-SHA256) is stored in the `RefreshToken` table.
  This is deliberate: a refresh token must be revocable before its natural expiry (on logout, on
  password reset, on rotation) — a stateless JWT can't be revoked early without extra
  infrastructure (a blocklist), so an opaque, database-tracked token is simpler and more correct
  here. Validating a refresh token means hashing the incoming value and looking up the match —
  not verifying a JWT signature.
- **Rotation:** every time a refresh token is used, the old `RefreshToken` row is marked
  `revokedAt = now()` and a brand new opaque token + row is issued. If a revoked token is ever
  presented again (a sign of token theft/replay), revoke every active refresh token for that
  guardian immediately as a precaution.
- **Child mode shares the guardian's own session — deliberate, not an oversight.** Once
  "Continue as Child" is tapped, the child's Hub session is just the same guardian session,
  carried forward. There is no separate child-specific token. The accepted tradeoff: if the
  guardian's session fully expires while a child is mid-activity, they'd hit a login wall —
  mitigated in practice by the access token's silent background refresh (§4.2 above), so this
  only actually happens if the full refresh-token window elapses (device untouched for the whole
  7–30 day window) or the guardian explicitly logs out elsewhere. A separate, longer-lived,
  child-specific session was considered and deliberately not built for this phase — don't add one
  without this being revisited first.

### 4.3 Cookies (exact attributes)
| Cookie name | Contents | `HttpOnly` | `Secure` | `SameSite` | `Path` | `Max-Age` |
|---|---|---|---|---|---|---|
| `sv_access_token` | signed JWT | yes | yes in production, no on local `http://localhost` dev | `Lax` | `/` | 900s (15 min) |
| `sv_refresh_token` | opaque token (plain value; hash is what's stored server-side) | yes | same as above | `Lax` | `/` | 2,592,000s (30 days) if "Remember me" was checked; **no `Max-Age` at all** (session cookie, cleared on full browser close) if not |

### 4.4 Prisma models this module owns (sketch — not final code; lives in the shared `schema.prisma`)

```
Guardian {
  id                 String   @id @default(cuid())
  email              String   @unique   // always stored lowercase; compare lowercase on lookup
  passwordHash       String?             // null if this account is Google-only
  googleId           String?  @unique
  name               String
  emailVerified      Boolean  @default(false)
  failedLoginAttempts Int     @default(0)
  lockedUntil        DateTime?           // null unless currently locked out
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

EmailVerificationToken {
  id          String   @id @default(cuid())
  guardianId  String
  tokenHash   String   @unique   // SHA-256 of the plain token emailed to the user
  expiresAt   DateTime            // createdAt + 24h
  usedAt      DateTime?
}

PasswordResetToken {
  id          String   @id @default(cuid())
  guardianId  String
  tokenHash   String   @unique   // SHA-256 of the plain token emailed to the user
  expiresAt   DateTime            // createdAt + 1h
  usedAt      DateTime?
}

RefreshToken {
  id          String   @id @default(cuid())
  guardianId  String
  tokenHash   String   @unique   // HMAC-SHA256(token, JWT_REFRESH_SECRET)
  deviceLabel String?             // derived from the User-Agent header at login time (e.g.
                                   // "Chrome on Windows") — best-effort only, never blocks login
                                   // if parsing fails; purely informational for a future
                                   // "active sessions" UI, not used for any security decision
  createdAt   DateTime @default(now())
  expiresAt   DateTime
  revokedAt   DateTime?
}

ConsentRecord {
  id                      String   @id @default(cuid())
  guardianId              String
  confirmedGuardianStatus Boolean
  dataStorageConsent      Boolean
  nonMedicalDeviceAck     Boolean
  marketingOptIn          Boolean  @default(false)
  consentTextVersion      String              // e.g. "v1" — bump this if consent copy ever changes
  createdAt               DateTime @default(now())
}
// This is the legal-gate consent captured at Sign Up — NOT the 12-question personalization
// questionnaire. That's ChildPreferences, defined in doc 02, in this same schema.prisma file.
```

### 4.5 Business rules that must be implemented exactly as stated (no improvising)
- **Email uniqueness is case-insensitive.** Store and compare emails lowercased.
- **Re-signup with an existing, unverified email** does not create a duplicate account or error —
  treat it as a "resend verification" request and show the same Check-your-email screen.
- **Re-signup with an existing, verified email** returns the duplicate-email error from §3.8.
- **Forgot-password responses never reveal whether an email exists.** Always respond with the
  same message (§3.6's confirmation-screen copy) regardless of whether it actually does — this
  prevents account enumeration. This is a deliberate security practice, not a gap.
- **A successful password reset revokes every active refresh token for that guardian** (forces
  logout on all devices) — a standard, deliberate security practice after a password change.
- **Google account linking:** if a Google login's email matches an existing `Guardian.email`,
  attach the `googleId` to that existing record rather than creating a second account (Google's
  own email verification is trusted as equivalent to ours) — per the decision made earlier.
- **Verification/reset tokens are single-use.** The moment one is consumed, set its `usedAt` and
  reject any further use of the same token, even if not yet expired, showing the expired-link
  copy from §3.6.
- **Password hashing:** bcrypt, cost factor 12.
- **One guardian per account — deliberate scope limit, not a missing feature.** There is no
  guardian-invite or account-sharing mechanism. If a second parent wants access to the same
  child's account, the only supported way right now is sharing the same login credentials. Do not
  build a guardian-invite flow, a `guardianId` many-to-many relation, or any "add a co-guardian"
  UI for this module — that's an explicitly deferred decision, not an accidental gap. Revisit it
  only if asked to.

### 4.6 Rate limiting vs. account lockout — two distinct mechanisms (do not conflate them)
These solve different problems and must both exist:

1. **General rate limiting** (spam/abuse prevention, via `@nestjs/throttler`): applied to
   `signup`, `login`, `forgot-password`, and `resend-verification` equally — **5 requests per 60
   seconds, keyed by IP address**. This is a blunt, generic defense against scripted abuse. A
   request beyond this limit gets a standard `429 Too Many Requests` with the generic error copy
   from §3.8 ("Something went wrong, please try again" is acceptable here, or NestJS's default
   throttler message — this case is rare enough in practice not to need bespoke copy).
2. **Account lockout** (brute-force protection, specific to `login` only): tracked per-email on
   the `Guardian.failedLoginAttempts` / `lockedUntil` fields (§4.4) — **5 failed password
   attempts within 60 seconds locks that specific account for 60 seconds**, regardless of which
   IP the attempts came from (deliberately per-email, not per-IP, so a shared home network
   doesn't lock out one attempt from blocking a different, correct one, and so a locked-out
   account stays locked out even if the attacker switches IPs). This is what produces the lockout
   banner and countdown in §3.5/§3.8.

Both mechanisms can be active on the login endpoint at the same time; they're independent checks.

### 4.7 Email link flow (exact mechanics)
Verification and reset emails link to **frontend** pages, not directly to backend endpoints:
- Verification email links to `${FRONTEND_URL}/verify-email?token={plainToken}` — that frontend
  page calls the backend's verify endpoint (via the proxy) on mount and shows the success or
  expired-link state from §3.6.
- Reset email links to `${FRONTEND_URL}/reset-password?token={plainToken}` — that frontend page
  renders the new-password form from §3.6, which submits `{ token, newPassword }` to the backend.

### 4.8 Transactional email content (sent via Resend, from `mail.service.ts`)

**Verification email:**
- From: `onboarding@resend.dev` (see §5.1 — no custom domain needed for the prototype)
- Subject: **"Verify your Skillverse account"**
- Body (plain-language, simple HTML — a centered card matching the app's rounded/friendly feel is
  a nice-to-have, not required; plain text with a clear link is acceptable for the prototype):
  > Hi {name}, click the link below to verify your email and finish setting up your Skillverse
  > account. This link expires in 24 hours and can only be used once.
  >
  > [Verify My Email] (button/link to the URL in §4.7)
  >
  > If you didn't create a Skillverse account, you can safely ignore this email.

**Password reset email:**
- From: `onboarding@resend.dev`
- Subject: **"Reset your Skillverse password"**
- Body:
  > Hi {name}, click the link below to reset your password. This link expires in 1 hour and can
  > only be used once.
  >
  > [Reset My Password] (button/link to the URL in §4.7)
  >
  > If you didn't request this, you can safely ignore this email — your password won't change.

### 4.9 API endpoints this module owns (`/api/v1/auth/...`)

| Method & path | Request body | Success response | Notes |
|---|---|---|---|
| `POST /auth/signup` | `{ name, email, password, confirmPassword, consent: {...} }` | `201 { message: "verification email sent" }` | See §4.5 for the re-signup rule |
| `GET /auth/verify-email?token=` | — | `200 { verified: true }` | |
| `POST /auth/resend-verification` | `{ email }` | `200 { message: "sent" }` | Rate-limited per §4.6 |
| `POST /auth/login` | `{ email, password, rememberMe }` | `200 { guardian: {...} }` + Set-Cookie headers | Rate-limited AND lockout-checked per §4.6 |
| `POST /auth/refresh` | — (reads `sv_refresh_token` cookie) | `200` + new Set-Cookie headers | Rotates the refresh token |
| `POST /auth/logout` | — | `204` | Revokes current device's `RefreshToken` row, clears both cookies |
| `POST /auth/forgot-password` | `{ email }` | `200 { message: "..." }` (always, see §4.5) | Rate-limited per §4.6 |
| `POST /auth/reset-password` | `{ token, newPassword, confirmNewPassword }` | `200 { message: "password updated" }` | Revokes all refresh tokens, per §4.5 |
| `GET /auth/google` | — | redirects to Google | |
| `GET /auth/google/callback` | — | redirects to frontend with session cookies set | |

### 4.10 Validation rules (DTOs — exact constraints, implement with `class-validator`)
- `name`: string, 2–60 characters.
- `email`: valid email format, lowercased before any DB operation.
- `password` / `newPassword`: minimum 8 characters, at least 1 number, at least 1 letter.
- `confirmPassword` / `confirmNewPassword`: must exactly match its counterpart.
- `consent.confirmedGuardianStatus`, `consent.dataStorageConsent`, `consent.nonMedicalDeviceAck`:
  must all be `true` — reject the request otherwise (`400`), don't silently default them.
- `consent.marketingOptIn`: boolean, defaults to `false` if omitted.
- Every error response shape: `{ statusCode, message, error }` (NestJS's default
  `HttpException` shape) — never leak a raw stack trace or ORM error message to the client; catch
  and rewrap anything unexpected into the generic "something went wrong" message from §3.8.

### 4.11 Testing expectations for this phase
No automated test suite (Jest/Supertest) is required to consider this module done in the current
prototype phase — verification happens manually via the §7 Acceptance Criteria checklist, done by
you, not an automated suite. Automated tests are part of the later target-phase stack (`00` §5)
and can be added as an explicit, separate decision later — don't treat their absence now as
something to silently "fix" by writing a test suite that wasn't asked for, and don't treat their
absence as permission to skip the manual verification in §7 either.

### 4.12 Backend packages to install
`@nestjs/core @nestjs/common @nestjs/platform-express @nestjs/jwt @nestjs/passport @nestjs/throttler @nestjs/config passport passport-jwt passport-google-oauth20 bcrypt prisma @prisma/client class-validator class-transformer cookie-parser resend` (latest stable versions — don't pin to anything specific unless a build breaks).

### 4.13 NestJS backend file architecture

```
skillverse-backend/
├── prisma/
│   └── schema.prisma          # shared file — this module owns Guardian/Token/Consent models;
│                               # doc 02 adds Child/ChildPreferences to the SAME file
├── src/
│   ├── main.ts                 # bootstraps Nest, cookie-parser, global prefix /api/v1, CORS/proxy config
│   ├── app.module.ts
│   ├── common/
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── filters/
│   │       └── http-exception.filter.ts   # ensures no raw stack traces ever reach the client
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── mail/
│   │   └── mail.service.ts              # wraps the Resend API; owns the templates in §4.8
│   └── auth/
│       ├── auth.module.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts               # owns the business rules in §4.5–4.6
│       ├── dto/
│       │   ├── signup.dto.ts
│       │   ├── login.dto.ts
│       │   ├── forgot-password.dto.ts
│       │   └── reset-password.dto.ts
│       └── strategies/
│           ├── jwt.strategy.ts
│           └── google.strategy.ts
├── .env                          # never committed; see §5 for contents
└── package.json
```

### 4.14 Next.js frontend file architecture (this module's slice)

```
skillverse-app/
├── next.config.ts                 # add rewrites: /api/:path* → backend URL
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx         # shared starfield + card shell for this route group
│   │   │   ├── page.tsx           # Welcome
│   │   │   ├── signup/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── verify-pending/page.tsx    # "Check your email" (§3.6)
│   │   │   ├── verify-email/page.tsx      # reads ?token=, calls backend, shows §3.6 result
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx    # reads ?token=, shows §3.6's form/result states
│   │   │   ├── terms/page.tsx             # §3.7 stub content
│   │   │   └── privacy/page.tsx           # §3.7 stub content
│   │   └── continue-as/page.tsx   # "Continue as [Child]" screen (§3.6); calls the shared
│                               # useOnboardingGuard("complete") hook from 05 §4.2 on load —
│                               # built when 05 is, not duplicated here
│   ├── components/auth/
│   │   ├── AuthCard.tsx           # shared card shell (logo, tagline, mascot, footer)
│   │   ├── SignUpForm.tsx
│   │   ├── LogInForm.tsx
│   │   ├── ConsentBlock.tsx
│   │   ├── GoogleButton.tsx
│   │   └── LockoutBanner.tsx
│   └── lib/auth/
│       └── authClient.ts          # fetch wrappers for /api/v1/auth/*; no manual token handling
│                                   # needed since cookies are httpOnly and sent automatically
```
All screens under `(auth)/` and `continue-as/` are interactive (forms, countdowns, client-side
redirects) and should be Next.js Client Components (`"use client"`); `terms` and `privacy` are
static content and can stay as Server Components.

---

## 5. What You Need to Do, With Why (manual setup, not something I can do for you)

These are real external accounts/credentials — I can write all the integration code, but I can't
create third-party accounts on your behalf.

### 5.1 Resend account (blocking — needed before any real email can send)
**Why:** a backend can't "fake" sending a real email — verification and password reset only mean
something if a real email lands in a real inbox.

**Steps:**
1. Create a free account at resend.com.
2. You don't need to verify your own domain for a prototype — Resend lets you send from their
   shared `onboarding@resend.dev` address immediately, which is enough for real verification/reset
   emails during development.
3. Generate an API key from the dashboard.
4. Hand me the key when we start building — it goes into the backend's `.env` as
   `RESEND_API_KEY`, never committed or shared in a screenshot.

### 5.2 Google Cloud OAuth app (not blocking — can be deferred)
**Why:** Google requires any app using "Sign in with Google" to be registered, with its own
client ID/secret, so Google knows who it's handing user data to.

**Steps:**
1. Create a project in Google Cloud Console (e.g. "Skillverse Dev").
2. Under "OAuth consent screen," set it to **Testing** mode (skips Google's full verification
   process) and add your own email as a test user.
3. Under "Credentials," create an **OAuth 2.0 Client ID**, type "Web application."
4. Add an **Authorized redirect URI** matching exactly where
   `/api/v1/auth/google/callback` will be reachable.

**Sandbox-specific caveat:** this workspace's live preview URLs are dynamically generated and can
change between sessions. The redirect URI registered in Google Cloud may need updating whenever
the backend's public URL changes, or Google will reject the login. Because of this, treat Google
login as a secondary path verified occasionally — email/password must always be the reliable,
always-working path during development.

5. Hand me the **Client ID** and **Client Secret** when ready — they go into `.env` as
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### 5.3 JWT secrets
**Why:** tokens are cryptographically signed so the backend can trust they weren't tampered with.
Using two separate secrets (access vs. refresh-token-hash pepper) means a leak of one doesn't
automatically compromise the other token type. I'll generate these for you when we build this
(e.g. via `openssl rand -base64 32`) — nothing for you to create yourself.

### 5.4 The `.env` file
Lives only in the backend project folder, excluded from git once a repo exists, never shared
publicly (not in a GitHub repo, a screenshot, or a LinkedIn post about this build):

```
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
RESEND_API_KEY=<from 5.1>
GOOGLE_CLIENT_ID=<from 5.2>
GOOGLE_CLIENT_SECRET=<from 5.2>
GOOGLE_CALLBACK_URL=<backend's public URL>/api/v1/auth/google/callback
FRONTEND_URL=<frontend's public URL>
```

**Your action items, summarized:** (1) create the Resend account + API key before Step 1 above —
blocking; (2) create the Google OAuth app whenever convenient — not blocking; (3) nothing else,
I'll handle the JWT secrets and `.env` wiring directly using what you provide for 1 and 2.

---

## 6. Explicitly Out of Scope for This Module
Each of these was discussed and deliberately deferred — not an oversight, and not something to
silently add "while you're in there":
- **Multi-guardian accounts.** One guardian per account; a second parent shares login credentials
  if needed. No invite flow, no `guardianId` many-to-many relation.
- **Multi-child accounts.** One child per guardian account for now. The "Continue as Child"
  screen is built to visually support a future list, but the data model and backend only need to
  handle one.
- **A separate child-specific session/token.** Child mode reuses the guardian's own session —
  see §4.2.
- **Real legal consent / DPDP compliance.** The consent checkboxes and Terms/Privacy pages are
  explicit placeholders (§3.4, §3.7), not a reviewed legal mechanism.
- **Automated tests.** See §4.11 — manual verification via §7 only, for this phase.
- **CSRF tokens, 2FA, device/session management UI, Sentry/monitoring.** None of these were part
  of this module's design discussion; don't add them speculatively.

## 7. Acceptance Criteria / Definition of Done

Don't mark §2's status 🟢 until every one of these has been personally verified by you (not just
claimed by a coding agent):

- [ ] A new guardian account can be created with valid inputs; all 3 required consent boxes are
      actually enforced (submission blocked if any is unchecked).
- [ ] Signing up with an already-verified email shows the correct duplicate-email error.
- [ ] Signing up again with an existing *unverified* email resends verification instead of erroring.
- [ ] The verification email actually arrives (via Resend), matches the subject/body in §4.8, and
      clicking its link verifies the account and shows the success state from §3.6.
- [ ] An expired or already-used verification link shows the correct expired-link state (§3.6),
      not a raw error.
- [ ] Logging in before verification is blocked with the correct message + resend option.
- [ ] Logging in with correct, verified credentials succeeds and lands on Continue-as-Child (or
      Create Child Profile if no child exists yet).
- [ ] Wrong password shows the correct inline error; the 5th wrong attempt within 60s triggers the
      lockout banner with a live countdown, and locks out even a correct password until it expires.
- [ ] "Remember me" unchecked → session cookie disappears after a full browser restart. Checked →
      it persists.
- [ ] Forgot-password: request → generic confirmation response regardless of email existing →
      real email arrives matching §4.8 → reset link works → new password works → old password no
      longer works → the guardian is logged out on all other devices after the reset.
- [ ] An expired or already-used reset link shows the correct expired-link state (§3.6).
- [ ] Logout clears both cookies and revokes that specific device's `RefreshToken` row (verify its
      `revokedAt` is set in the database, not just that the cookie disappeared client-side).
- [ ] Google login creates or correctly links an account by verified email (can be tested less
      frequently given the sandbox redirect-URI caveat in §5.2).
- [ ] No error message ever shown to the guardian contains a raw stack trace, SQL error, or
      internal exception detail.
- [ ] Every color, spacing, and type value on every screen matches §3.1 exactly — spot-checked
      against the actual hex codes and px values, not eyeballed.
- [ ] Every piece of on-screen copy matches §3.3–3.7 exactly, including the Terms/Privacy stub
      pages' honest placeholder content (no invented legal boilerplate).
- [ ] The entire flow is completable via keyboard alone, and errors are announced via `aria-live`.
