# Court+ — Production Readiness Audit

Audit date: 2026-09-20 · Scope: full monorepo (backend, dashboard, website, ops, mobile, infra)

Method: 20 independent auditors across 20 dimensions, each finding put through
adversarial verification (2 independent refuters for blocker/high, 1 for
medium/low), plus a completeness critic. Findings that survived refutation are
below. Every item was confirmed against the actual code, not inferred from
framework conventions.

---

## Verdict

**Not production ready.** The application is feature-complete and the code is
generally well-structured, but there are defects in the money layer, the
booking concurrency model, authentication and data durability that would cause
real financial loss and unrecoverable data loss under live traffic.

The single most urgent item is not a bug: **there are no database backups at
all.** Every booking, payment and payout record exists in exactly one Docker
volume on one EC2 instance.

### Confirmed findings by severity

Both audits have now completed. These are post-verification, post-dedup counts.

| | Raw | Confirmed | Blocker | High | Medium | Low |
|---|---:|---:|---:|---:|---:|---:|
| Backend (16 dimensions, 542 agents) | 351 | 224 | **20** | 63 | 113 | 37 |
| Infrastructure (4 dimensions, 61 agents) | 57 | 44 | **12** | 20 | 9 | 3 |

127 of the 408 raw findings were killed by the adversarial refuters. 48 of 542
backend agents stalled and were not retried, so the real figures are slightly
higher than reported — coverage is very good but not exhaustive.

---

## What was fixed in this pass

All changes typecheck clean; the backend test suite went from 52 to 62 passing
tests. The new migration was executed against a real PostGIS 16 database and
the exclusion constraint was verified to actually reject overlapping bookings.

### Security

| Fix | File |
|---|---|
| **OTP auth bypass removed.** `123456` approved any phone number whenever `NODE_ENV` was `development` *or* `dev`, and Joi explicitly accepted `dev`. Production `.env` is hand-edited on the EC2 box, so one typo = login as any user, staff or ops admin. Now gated on a separate `DEV_OTP_BYPASS_CODE` flag that **refuses to boot** if set while `NODE_ENV=production`; `dev` is no longer a legal `NODE_ENV`. | `shared/services/twilio.service.ts`, `config/validation.ts` |
| **Mass PII disclosure closed.** `GET /users` and `GET /users/:id` returned the full `User` entity — email, phone, date of birth, `firebaseUid`, `stripeCustomerId` — to any authenticated customer for any other user. The entity has no `@Exclude()` decorators, so the global `ClassSerializerInterceptor` had nothing to strip. Customer-to-customer reads are now redacted; staff/ops and self-reads are unchanged. | `users/users.privacy.ts`, `users/users.controller.ts` |
| **Logout now actually ends the session.** `JwtStrategy.validate()` returned the token payload unchecked, so a revoked session — including an ops operator whose access had just been pulled — kept working until the token expired. Added a self-expiring Redis denylist keyed on the session id already in the token. | `auth/strategies/jwt.strategy.ts`, `auth/auth.service.ts` |
| **Rate-limit bypass + audit-log forgery closed.** `getIpAddress()` read `x-forwarded-for` straight off raw headers and took the first entry — which, because Caddy *appends*, is the client-controlled value. An attacker rotated one header for unlimited login attempts and could forge any source IP in the audit trail. Now uses `req.ip` under an explicit `trust proxy` setting. | `decorators/ip.decorator.ts`, `main.ts` |
| **Swagger no longer public in production.** The full API map at `/reference/api` and `/api-json` was unauthenticated. Now opt-in via `ENABLE_API_DOCS`, and blocked at the edge as defence in depth. | `main.ts`, `Caddyfile` |
| **CORS restricted** from reflect-any-origin to an explicit allowlist, preserving mobile (no `Origin`) callers. | `main.ts` |
| **Secrets hardening at boot:** JWT secrets now require ≥32 chars and must differ from each other; 14 env vars that were read at runtime but never validated now fail at boot instead of deep inside a payment path. | `config/validation.ts` |

### Money

| Fix | File |
|---|---|
| **Commission corrected to the configured 20%.** `COURT_PLUS_PERCENTAGE=0.2` was validated, documented and set in config — and **read by no code**. The live rate was a hardcoded `PLATFORM_FEE_PERCENTAGE: 0.3`. Every tenant was paid 10 points less than the configuration claimed. | `payouts/services/balance.service.ts`, `payouts/constants/payout.constants.ts` |
| **Refunds now debit the tenant.** `TransactionType.BOOKING_REFUNDED` was declared and never used; all four refund call sites refunded the customer via Stripe without touching the tenant balance. The tenant kept the revenue, the customer got their money back, and Court+ absorbed **100% of every refund** — which the tenant could then withdraw. Wired to the existing `PAYMENT_REFUNDED` event, idempotent, debits pending before available. | `payouts/services/balance.service.ts` |
| **Lost-update race on balances fixed.** `getBalance()` was an unlocked `findOne` followed by `balance.x += n; save()`. TypeORM emits a full `UPDATE` with the in-memory value, so two concurrent bookings both read 1000 and both wrote 1070 — one payment's revenue vanished while both ledger rows persisted, leaving balance and ledger permanently divergent. All mutations now take `SELECT … FOR UPDATE`. | `payouts/services/balance.service.ts` |
| **Ledger converted from float to exact decimal.** `availableBalance`, `pendingBalance`, `totalEarnings` and `BalanceTransaction.amount` were `double precision` — binary floating point for money, while `Payment.amount` was already `numeric(10,2)`. Now `numeric(14,2)` with a string-safe transformer. | migration `1790000000000`, ledger entities |
| **Fee rounding corrected.** `Math.floor(amount * rate)` floored the fee to a **whole currency unit**, systematically under-charging the platform by up to ~1 SAR per booking. Now rounds to minor units. | `payouts/services/balance.service.ts` |
| **One balance row per tenant.** No unique constraint existed on `tenantId` while `getBalance()` was a get-or-create, so concurrent first-writes could split a tenant's money across two rows. Added a unique constraint plus an idempotent `ON CONFLICT DO NOTHING` insert. | migration `1790000000000` |
| **10 regression tests** covering rate, rounding, locking, refund reversal, idempotency and negative-balance behaviour. | `balance.service.spec.ts` |

### Booking integrity

**Double-booking is now impossible at the database level.** `reserveSlot()` used
`SELECT … FOR UPDATE` before inserting, but `FOR UPDATE` locks *matching rows* —
and a free slot matches zero rows, so it took **no lock at all**. Two concurrent
bookers both saw "free" and both inserted. There was no unique index, no
exclusion constraint and no advisory lock anywhere in the repo.

Added a PostgreSQL exclusion constraint (`btree_gist`, half-open `tstzrange`).
Verified empirically against PostGIS 16:

- overlapping reservation → **rejected** (`23P01`)
- adjacent slot (11:00 after 10:00–11:00) → allowed
- same time, different court → allowed

`reserveSlot()` converts the violation into a clean `false` rather than a 500.

> Note: `now()` cannot appear in an index predicate (Postgres requires
> IMMUTABLE; `42P17`). The constraint is therefore unpartitioned, which is safe
> because `cleanupExpiredReservations()` runs before every insert.

### Infrastructure

| Fix | File |
|---|---|
| **Database backups now exist.** Nightly `pg_dump` → gzip → S3, with a size sanity-check, dedicated-IAM guidance, S3 Versioning/Object Lock guidance, and a documented restore procedure + quarterly drill. | `scripts/backup-db.sh`, `OPERATIONS.md §8` |
| **Health probes added.** There were none: `render.yaml` health-checked the Swagger page and the api container had no healthcheck, so a Postgres/Redis outage read as healthy. `/health` (liveness, no dependencies) and `/health/ready` (DB + Redis). | `modules/health/*` |
| **Graceful shutdown.** `enableShutdownHooks()` was never called, and `CMD ["pnpm", …]` made pnpm PID 1 so SIGTERM never reached Node — every deploy killed in-flight requests and running BullMQ jobs. Now `tini` as PID 1, `node` directly, 30s `stop_grace_period`. | `main.ts`, `Dockerfile`, `docker-compose.prod.yml` |
| **API no longer exposed in plaintext.** `ports: "3000:3000"` bound `0.0.0.0` on the host, and Docker's iptables rules can bypass the security group — serving the API and Swagger over plain HTTP beside the Caddy TLS endpoint. Changed to `expose`. | `docker-compose.prod.yml` |
| **Dockerfile hardened:** Node 23 (odd-numbered, never LTS, EOL) → Node 22 LTS; single-stage → multi-stage; runs as `node` not root; `--frozen-lockfile`; layer caching fixed. | `Dockerfile`, `.dockerignore` |
| **Unbounded growth capped:** Docker json-file logs had no rotation on a 20 GB disk the runbook already documents as filling up. Redis had no `maxmemory` while holding BullMQ jobs + cache + throttler state. Memory limits on every container (app and DB share one box). | `docker-compose.prod.yml` |
| **Edge hardened:** the Caddyfile was two lines. Added HSTS preload, `nosniff`, `DENY` framing, Referrer-Policy, Permissions-Policy, server-header suppression, 2 MB body cap, upstream timeouts, rotated JSON access logs, and a 404 for the docs paths. | `Caddyfile` |
| **CI created.** There was none, while deploys are manual and the image builds on the production box. Two of the five most recent commits were boot-crash hotfixes — exactly what CI prevents. Path-filtered jobs: typecheck, lint, test, build, **migrations-apply-from-scratch**, Docker build, frontend builds, mobile, and gitleaks secret scanning. | `.github/workflows/ci.yml` |
| **`render.yaml` neutralised.** It described a Render deployment that is not how this app runs, with free-plan Postgres, the Swagger page as health check, and six runtime env vars missing. Applying it would have created a second live environment sharing production Stripe/Twilio/AWS credentials. | `render.yaml` |

---

## Pass 2 — additional fixes

Verified by booting the app against real Postgres + Redis and exercising the
endpoints, not just by compiling.

### Stripe correctness (all confirmed against the pinned API version)

The codebase pins `2025-04-30.basil` (SDK 18.1.0). Two fields the subscription
code read were **moved** in that version, and because every handler casts
`event.data.object as any`, TypeScript could not catch it — both reads silently
evaluated to `undefined` in production.

| Was | Reality in Basil | Consequence |
|---|---|---|
| `invoice.subscription` | `invoice.parent.subscription_details.subscription` | `handleInvoicePaid` returned early on **every** invoice — **a tenant who paid was never reactivated.** `handleInvoicePaymentFailed` likewise never fired. |
| `subscription.current_period_start/end` | `subscription.items.data[].current_period_*` | `new Date(undefined * 1000)` → **Invalid Date written to the database.** |

Fixed in `subscriptions/stripe-compat.ts`, which reads both the old and new
shapes so replayed historical events still work.

**`mapStripeStatus` gave away free subscriptions.** It mapped four statuses and
fell back to `|| ACTIVE`, so `incomplete` (first payment failed),
`incomplete_expired` and `paused` all granted a fully active subscription. All
eight Stripe statuses are now explicit and unknown ones fall back to `UNPAID`.

**Payouts transferred 1/100th of the amount.** `transfers.create({ amount })`
takes **minor** units; the value came from `TenantBalance`, which is **major**
units. A 250.00 SAR payout moved 250 halalas — 2.50 SAR. Fixed with an explicit
conversion (`common/money.ts`, zero-decimal currencies handled).

**Currency mismatch.** Balances were created as `USD` while `StripeService`
charges in the court's currency, defaulting to **SAR**. The default is now SAR,
a balance adopts the currency of the money funding it, and a mismatched credit
throws rather than silently mixing currencies.

**Webhook idempotency.** Stripe delivers at-least-once, retries for ~3 days and
does not guarantee ordering; there was **no deduplication anywhere**. Added a
`processed_webhook_events` ledger keyed on the Stripe event id — the INSERT
itself is the mutual exclusion, so concurrent deliveries cannot both proceed.
Wired into all three endpoints (payments, subscriptions, payouts), with the
claim released on failure so Stripe's retry is not swallowed, and a daily prune.

### Concurrency & performance

- **Distributed locks on all four `@Cron` jobs** (`common/distributed-lock.service.ts`, Redis `SET NX PX` + Lua compare-and-delete). `@nestjs/schedule` fires on every replica; without this, a second instance double-completes bookings and emits duplicate `ENDED` events — which credit tenant revenue, so duplicates were a money bug, not just noise.
- **Missing indexes added** (`payments` had *none* while the Stripe webhook looks up `providerPaymentId` on every event — a sequential scan per webhook). Created `CONCURRENTLY`, which required switching TypeORM to `migrationsTransactionMode: 'each'` — safer generally, since a failure no longer rolls back the whole batch. Two redundant indexes I initially added were removed after checking existing ones.

### Observability

- **Structured JSON logs** in production with timestamps, stack traces, per-env level, and **automatic redaction** of anything matching `password|token|secret|authorization|otp|code|card|cvv` before it reaches stdout.

### Verified by running, not by assuming

| Check | Result |
|---|---|
| App boots against real Postgres + Redis | ✅ no DI cycles |
| `GET /health` | ✅ `200 {"status":"ok"}` |
| `GET /health/ready` | ✅ `200` with live DB + Redis checks |
| SIGTERM | ✅ exits cleanly (graceful shutdown works) |
| `DEV_OTP_BYPASS_CODE` + `NODE_ENV=production` | ✅ **refuses to boot** |
| `/reference/api`, `/api-json` in production | ✅ `404` |
| CORS allowed origin | ✅ reflected |
| CORS unknown origin | ✅ rejected |
| 25 migrations from empty DB | ✅ all apply |
| Exclusion constraint | ✅ overlap rejected, adjacent allowed |
| Typecheck / build / 62 tests | ✅ all pass |

Two bugs in my own work were caught by running these rather than assuming:
`now()` is not IMMUTABLE so it cannot appear in an index predicate (`42P17`),
and TypeORM's default `migrationsTransactionMode: 'all'` forbids a migration
from opting out of its transaction.

---

## Pass 3 — blockers from the completed backend audit

The 16-dimension backend audit finished after the earlier passes and confirmed
**20 blockers**. Four were already fixed above. These were fixed in this pass:

**Customers could book and pay for suspended courts.**
`BookingsService` called `courtsService.findOne(courtId, { … })` with no third
argument. Every customer visibility filter — `court.status = AVAILABLE`,
`branch.suspendedAt IS NULL`, `tenant.blockedAt IS NULL` — is gated behind
`if (user && …)`, so omitting the user made all of them **dead code**. A
customer holding a court UUID from an earlier listing could book and pay for a
court ops had suspended, one under a suspended branch, one belonging to a
blocked tenant, or one never approved. `GET /courts/:id` already 404'd for
exactly those cases — only the booking path leaked, which defeated the entire
ops moderation lever. Fixed at both call sites (`book()` and the post-capture
`create()`), with the user forwarded only for customers so the existing staff
tenant check stays authoritative. Unknown court ids now 404 instead of 500.

**`charge.failed` corrupted an unrelated customer's payment.**
`processStripeEvent` routes `charge.failed` into `processPayment`, which had no
branch for it — so `paymentIntentId` stayed `undefined`. TypeORM omits an
undefined value from the `WHERE` clause, turning the lookup into
`SELECT … FROM payments LIMIT 1`: an **arbitrary, unrelated payment** was
marked `FAILED`. Added the missing branch plus a guard that refuses to run the
lookup without a resolved id.

**Every hold capture failed, and would have captured 1% if it hadn't.**
`completePayment` passed the internal Payment **UUID** to Stripe's capture API,
which needs a PaymentIntent id (`pi_…`) — so every capture failed with
"No such payment_intent". The amount was also passed in major units where
Stripe expects minor. Both fixed.

**Any user could steal or strip any court/branch/post image.**
`assignAssets` looked assets up by id with **no ownership check**, so any
authenticated caller who knew an asset id could attach someone else's image to
their own resource — simultaneously stripping it from the owner. An asset
already attached to a different resource can no longer be reassigned (this
needs no caller changes), plus an optional `uploaderId` ownership check.

**Unlimited auth brute force via capitalisation.**
Throttle keys were built from the raw request body
(`login-email-${request.body.email}`) while account lookup lowercases, so
`admin@x.com` and `Admin@x.com` were the same account but **different
rate-limit buckets**. Phone keys had the same flaw via spacing and `+`/`00`
prefixes. Keys are now normalised, with tests.

**Mobile had no reachable privacy policy.**
The Settings "Privacy Policy" row had no `onPress` at all. Apple rejects an app
that collects personal data without one. It now opens the published policy
(no in-app privacy body copy exists — there are no `settings.privacyPolicy*`
content keys).

### Final verification

| Check | Result |
|---|---|
| Backend typecheck / build | ✅ |
| Backend tests | ✅ **95 passing** (was 52) |
| Mobile typecheck | ✅ |
| Boots in `NODE_ENV=production` | ✅ 25 migrations applied |
| `/health/ready` | ✅ `200` with live DB + Redis |
| `/reference/api` in production | ✅ `404` |
| Structured JSON logs | ✅ timestamp, level, context, stack |

---

## Pass 4 — payments end to end (subscriptions, add-ons, payouts, bookings)

Triggered by a real failure: the owner paid a test-mode subscription and
landed on a blank `/dashboard?subscription=success`. Tracing that pulled the
whole payment chain apart. Everything below is fixed in the working tree,
typechecks, and passes the suite (83 tests); the redirect flow was then run
in the browser against a real Checkout session id.

### Subscription billing

| Defect | Fix |
|---|---|
| `successUrl`/`cancelUrl` had no class-validator decorator, so the global `whitelist` pipe stripped them and the backend fell back to `/dashboard` and `/pricing` — routes the dashboard does not have (blank page). | `@IsOptional() @IsUrl()` on both; all defaults now target `/billing`; success URL carries `session_id={CHECKOUT_SESSION_ID}`. Regression test through the real `ValidationPipe`. |
| Checkout sold the base plan (qty 1) regardless of existing branches/courts, and nothing added the extras afterwards — the "initial subscription vs court subscription" confusion. A tenant with 3 courts paid $30 and the 3rd court was free forever. | Checkout line items are built from `PricingService.computeTenantBreakdown` (base + branch add-on + court add-on). Every Stripe→local sync also reconciles add-ons. |
| Re-subscribing after a cancellation crashed the webhook on `UNIQUE(subscriptions.tenantId)`. | Sync upserts by tenant and re-points the row at the new Stripe subscription. |
| Webhook idempotency never detected a duplicate: TypeORM fills `identifiers` from the supplied PK even when `ON CONFLICT DO NOTHING` inserted nothing. Every redelivered event was processed twice. | `.returning('id')`; claimed ⇔ a row came back. Verified by resending a real event: second delivery logs "Duplicate … skipping". |
| Missed webhooks left Stripe ACTIVE / app empty with no recovery path. | `POST /subscriptions/sync` (by session id or `metadata.tenantId`, falling back to `providerCustomerId`), called by the billing page on return from Checkout; nightly `reconcileWithStripe` cron re-syncs every live subscription. |
| Every `invoice.paid` released ALL `pending_payment` courts, even when another add-on invoice was still unpaid. | Courts are released only when Stripe reports the subscription `active` (no outstanding invoice). |
| Branch/court creation gate was commented out (branches) or absent (courts). | Lapsed-only rule: no subscription at all is allowed (onboarding), a cancelled/unpaid one is not — enforced server-side for both. |
| Dashboard treated any subscription row as "subscribed" — cancelled/unpaid tenants had no Subscribe button. | Status-aware (`active`/`past_due`/`trialing`). |
| Scheduled cancellations (Customer Portal) were never persisted or shown. | Recorded on every sync; billing page shows "plan ends on <date>". |
| Duplicate Stripe customers on every checkout attempt. | Existing customer reused and persisted immediately. |
| Add-on price ids were optional; unset, the court add-on was silently skipped and courts stayed `pending_payment` forever. | `STRIPE_BRANCH_ADDON_PRICE_ID` / `STRIPE_COURT_ADDON_PRICE_ID` are required at boot. |
| Every quoted amount came from constants, not the Stripe prices actually charged. | Live prices loaded hourly; mismatch logged as `[BILLING]`; constants remain the fallback. |
| Add-court charged the card (always_invoice) before showing any price. | `GET /subscriptions/court-availability` returns the price impact; the Add Court form asks for confirmation first. |
| `subscription.quantity` had two conflicting writers; `BRANCH_DELETED` fired inside the transaction so the sync counted deleted units. | Single writer (branch count); event deferred to commit. |
| Unknown dashboard paths rendered an empty layout; portal opened via blocked `window.open`; billing menu shown to non-owners (403). | Catch-all route → `/home`; in-place navigation; owner-only menu entry. |

### Payouts (Stripe Connect)

| Defect | Fix |
|---|---|
| Webhook waited for `transfer.paid` / `transfer.failed`, which Stripe never emits — payouts stayed PROCESSING forever. | `transfer.created` completes, `transfer.reversed` fails. |
| Readiness required `charges_enabled`, which a transfers-only Express account never gets — no vendor could ever be marked payout-ready. | `payouts_enabled && capabilities.transfers === 'active'`; recipient service agreement requested. |
| Transfer events (platform endpoint) and `account.updated` (Connect endpoint) carry different signing secrets; only one was accepted. | Any configured payouts secret verifies (`STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_PAYOUTS_WEBHOOK_SECRET`, main secret). |

### Booking payments

| Defect | Fix |
|---|---|
| Split booking: the organiser never paid their own seat (whole hold released when everyone paid; only unpaid seats captured at settlement). | Organiser's share is captured in both paths. |
| A participant's COMPLETED payment was never persisted (no cascade), so the creator's hold was never released and the same seat was charged again to the organiser at settlement. | Payment saved explicitly. |
| Settlement tried to capture never-confirmed participant PaymentIntents, threw, and rolled back after the organiser's capture had already happened at Stripe. | Unpaid seats' intents are cancelled instead. |
| Card authorisations expire after 7 days; bookings further ahead could never be settled. | On an expired authorisation the saved card is charged off-session for the same amount. |
| A Stripe cancel that failed because the customer had just paid still marked the row CANCELLED, so the later `charge.succeeded` was ignored — charged, no booking, no refund. | Paid/processing intents are left pending for the webhook. |
| Paid but booking impossible (slot taken meanwhile): the webhook threw and Stripe retried for three days, then gave up. | Refunded immediately when the failure is a business (4xx) error. |
| Revenue reversal for a refund was deduped on `bookingId` only — the second participant refunded on a split booking was skipped as a duplicate. | Deduped per payment. |

### Still open in payments

- Bookings > 7 days ahead rely on the off-session recharge above; if the saved
  card needs authentication (`authentication_required`) the seat stays
  unsettled and is logged — needs a customer-facing "pay now" path.
- Subscription prices are USD while bookings are SAR; the app quotes each in
  its own currency but Stripe must have the base + add-on prices in ONE
  currency (checked at boot, logged if not).
- Stripe Connect vendor-side client (request/approve payouts) still needs to
  be verified end to end in test mode with a real Express account.

---

## Pass 5 — notifications: live badge, redesigned panel, shutdown fix

| Defect | Fix |
|---|---|
| Both bells polled every 30 s — a notification took up to half a minute to show, and every open tab hit the API twice a minute. | Server-Sent Events (`GET /notifications/stream`) fed by a Redis channel; badge count and the new item are pushed the instant the row is written (measured 37–52 ms in the browser, no reload). Poll kept at 60 s as fallback. |
| Open SSE streams kept `server.close()` waiting forever: a restart/deploy left the old process alive with the port closed (observed under `nest start --watch`). | Streams end on instance shutdown (`shutdown$`) before the HTTP server closes; 15 s forced exit as a backstop. Verified: old process exits in ~2 s with streams open. |
| Toasts/labels for 28 notification types showed the raw key (`booking_created`). | Labels added in en/ar. |
| No bulk "mark all as read"; ops looped one PATCH per item. | `PATCH /notifications/read-all`. |
| Dashboard panel: 40rem box, every unread row solid lime, raw timestamps, full-width type select, deprecated `Dropdown overlay`. | Rebuilt: icon + colour per kind, relative time with full-date tooltip, All/Unread filter, unread dot + soft tint, hover mark-read, empty state, RTL-safe, keeps itself inside narrow viewports. |
| Mobile: foreground push did not refresh an open notifications list. | Query invalidated on FCM foreground message. |

---

## Pass 6 — feature-by-feature QA sweep (live E2E + code audit)

Method: a real customer signed up through the API (phone + OTP), listed
courts, booked, paid with a Stripe test card, was notified, cancelled and was
refunded — whole and split bookings, from both the app side and the vendor
dashboard — while every ops/vendor/customer read endpoint was smoke-tested.
In parallel, 8 of 16 audit tracers (vendor auth, branches, courts, ops
console, vendor feedback, mobile auth, mobile profile, mobile courts) reported
~160 findings; each fix below was verified against the code before it was
made. Backend: 95 tests green, typecheck clean; dashboard, ops and mobile
typecheck/build clean.

### Money (found by the live test)
| Defect | Fix |
|---|---|
| Vendor revenue was never credited: the balance row was USD (created by a display read) while bookings are SAR — every credit was refused as a currency mismatch. | Balance currency comes from the tenant's preference; untouched rows are re-labelled (migration + at runtime); an hourly reconciler holds revenue for any paid booking without a ledger row (verified: 400 SAR held for a 500 SAR booking). |
| Split bookings could never settle: Stripe rejects `final_capture` on a plain PaymentIntent, so the participant's payment webhook failed AFTER the customer was charged. | Partial capture without the flag. Verified: participant paid 250, organiser's 250 captured from the hold, booking completed, both refunded on cancel. |
| Walk-in (staff) bookings created withdrawable balance with no money behind it. | Skipped. |
| Refunding still-pending revenue drove lifetime earnings negative. | Only released revenue is subtracted from earnings. |
| Cancellation lost the reason, left the booking "paid", and was allowed after the start time when the status job was late. | Reason + `refunded` persisted; refused once started. |
| A participant leaving a fully-settled match was refunded although nobody could be charged for the seat. | Refund only while the booking is still being paid for; the app says so. |

### Security / data
| Defect | Fix |
|---|---|
| Hard-coded OTP `123456` accepted for staff/ops e-mail codes whenever `NODE_ENV != production` (the shipped `.env.example`). | Gated on `DEV_OTP_BYPASS_CODE` only (Joi already forbids it in production). |
| Anyone could un-delete any customer account: recovery ran BEFORE the OTP check. | OTP verified first. |
| Reviews and follower lists returned the full user row (phone, e-mail, DOB, Stripe id). | Public columns only. Verified live. |
| Blocked customers could still log in / refresh. | Refused at login and refresh (`ACCOUNT_BLOCKED`). |
| Password reset, account deletion and admin deactivation left other sessions alive for 30 days. | All sessions revoked. |
| Vendor could move a court into another tenant's branch, or write ops-only statuses, via PATCH. | Ownership check; only available/unavailable accepted. |
| Reset-code throttle keys used the raw e-mail (brute-forceable by casing); resend shared the login bucket; refresh/logout throttled per office IP. | Keys normalised; separate resend key; refresh/logout exempt. |
| Deleted customers stayed visible in search/profiles; avatar assignment skipped the upload-ownership guard; deactivated admin e-mail re-creation was a 500. | Filtered; guard passed; clear error. |

### Flows that were broken
| Defect | Fix |
|---|---|
| Egyptian numbers typed with the trunk 0 registered but could never log in (raw string lookup). | Every phone DTO normalises to E.164. |
| Login/Register sent `undefined01…` when location permission was denied (country code crash). | Fallback country. |
| Arabic names rejected on sign-up (`[A-Za-z]` only). | Unicode-aware. |
| Profile could not be saved unless the username changed; DOB day/month swapped; crash without DOB (Google users). | Fixed. |
| Court availability filter (date + time) returned 500 (`'CANCELLED'` vs `cancelled`). | Fixed, verified 200. |
| Vendor "show to users" toggle and closed/maintenance branch status were ignored by customer listings. | Enforced. |
| "NaN km away" for courts without their own location. | Branch location used. |
| Working hours crossing midnight (16:00–02:00) made post-midnight slots unbookable. | Previous-day windows considered (unit-tested). |
| Availability calendar off by a day on UTC servers; 500 for a court without a schedule; courts with zero working hours accepted. | Range in court TZ; guarded; `ArrayMinSize(1)`. |
| Public signup created TWO tenants per vendor. | Duplicate branch removed. |
| Deleting a branch/court with paid upcoming bookings orphaned them. | Refused with a clear error (en/ar). |
| Removing a court video never persisted; clearing photos deleted the video too. | Fixed. |
| Ops e-mail failure turned an approved court into a 503; suspend→unsuspend of a pending court published it unreviewed. | Mail is best-effort; suspend only for live courts. |
| Admin/User staff got "branch not found" on every branch (wrong join column); "Under Maintenance" option sent a value the API rejects. | Fixed. |
| Court/branch lists had no ORDER BY (pages repeated/skipped); selectors loaded only 10 branches. | Ordered; full list. |
| Concurrent 401s in the app each burned the single-use refresh token → random logouts; any refresh hiccup logged out. | One in-flight refresh; logout only on 401/403. |
| No push after logout+login on one device (token dedupe); notification toggles were a placebo; pushes always English. | Per-session dedupe; toggles honoured; language from preferences. |

### UX
Dashboard: wrong-code/wrong-e-mail on OTP and reset pages no longer show
"Success"; sign-in shows the real reason (throttle vs credentials); the first
request after a token refresh no longer fails; closing the tab for 15 min no
longer logs the vendor out; logout revokes the server session and clears the
cache; ops reason shown on the court page and edit form; suspended branch
banner; cancel booking asks for a reason; cancelled bookings off the calendar;
booking details show surface/players; auth pages fully localised (ar/en);
account deletion lands on the sign-in page. Ops: unsuspend-request action
says what it does; approval drawer offers only valid actions; expired session
redirects to login; vendor search is case-insensitive. Mobile: cancel/leave a
booking (new), court/branch pages don't crash on a suspended court, branch
courts are tappable, saved courts open and can be unsaved, ratings show one
decimal, reviews cache per court, calendar month arrows, follow buttons and
several screens localised, dead Apple and Share buttons removed.

### Added after the PM decision (cancellation policy) and a second pass
| Item | Change |
|---|---|
| Cancellation policy | Customers can cancel or leave only up to **12 hours before the start** (`BOOKING.CANCELLATION_CUTOFF_HOURS`); inside the window the API answers `BOOKING_CANCELLATION_WINDOW_CLOSED`, the app hides the button and explains why, and the booking summary states the policy. Venue staff can still cancel at any time (customer refunded). Verified live: customer 400 inside the window, venue 201, customer 201 outside. |
| First-launch onboarding | The stepper showed literal placeholders ("Onboarding 1 description"), one static image, hard-coded English legal text and a dead Skip button. Rebuilt with three localised steps, dots, Next/Get started and Skip. |
| Location filter (Home/Courts) | The sheet was decorative. Search (Nominatim), radius slider, Done/Clear are wired and the chosen radius reaches the API. |
| Swept bookings' revenue | The fallback sweep that completes overdue bookings now emits `ENDED`, so their held revenue is released like job-completed ones. |
| Dead UI | "Capture moment" (no create flow), open-match filter icons and the profile Share item removed. |
| Translations | 24 dashboard keys had no Arabic; added. Mobile: reviews cache per court, follow buttons, branch/sort/search screens localised. |

### Still open from this sweep (not fixed here)
- Ops: no "deny" for an unsuspend request; branch suspension has no UI in the console.
- Vendor e-mails are English-only; in-app notification text for staff follows the customer-preferences table (English for Arabic dashboards).
- Mobile: Sign in with Apple is not implemented (App Store 4.8 requires it before an iOS release with Google login); profile stats (courts/hours) have no backend fields; volleyball not in the sport list; "moments" cannot be created from the app (only listed).
- Audit tracers for mobile booking UI, vendor schedule/revenue UI, ratings, timing, users/settings, community, i18n parity and the website did not complete (session limit); the money/timing paths were exercised live instead.

---

## Not fixed — ranked by what to do next

These are confirmed and specified, but out of scope for this pass. Ordered by
risk.

### Must fix before taking real payments — still open

1. **Payouts are entirely non-functional.** Two separate confirmed blockers:
   Stripe Connect onboarding **does not exist**, so `providerAccountId` and
   `isActive` are never set and no tenant can ever be paid; and the payouts
   module has **no client** in dashboard or ops, so nobody can request or
   approve one. This is unbuilt product, not a bug — it needs implementing.
2. ~~Split-payment creator is never charged~~ — **fixed in pass 4** (organiser's
   share captured; settlement no longer double-charges).
3. **Staff-created bookings credit the tenant's withdrawable balance** although
   no money was ever charged.
4. ~~Charged-but-no-booking~~ — **fixed in pass 4** (automatic refund when the
   booking cannot be created for a business reason).
5. ~~Connect webhook listens for `transfer.paid` / `transfer.failed`~~ —
   **fixed in pass 4** (`transfer.created` / `transfer.reversed`, both endpoint
   secrets accepted, readiness no longer requires `charges_enabled`).
6. **Payout TOCTOU** — check-then-decrement. Now behind a row lock, but the
   `PENDING_PAYOUT_EXISTS` guard is still unlocked.
7. **BullMQ job captures Stripe payments inside a DB transaction and swallows
   the error**, so failures neither roll back Stripe nor retry.

### Must fix before scaling past one instance

9. **No distributed lock on any `@Cron`.** Every replica runs every sweep —
   duplicate booking completion, duplicate reminders, duplicate payouts.
10. **Revenue credit rides a non-durable in-process event** with a swallow-all
    catch. A crash between payment and handler means the tenant is never
    credited, permanently. Needs a durable queue + Stripe reconciliation job.
11. **Cron sweep completes bookings without emitting `ENDED`**, so revenue
    stays in `pendingBalance` forever.
12. **`migrationsRun: true` with no advisory lock** — concurrent instances race
    on boot. (Pre-deploy dump now documented as the interim mitigation.)

### Data integrity

13. **`users.deletedAt` is a plain `@Column`, not `@DeleteDateColumn`** — soft-deleted users leak into every query.
14. **Two migrations share timestamp `1784930000000`** — non-deterministic order.
15. **A migration adds a NOT NULL column with no default** — crashes boot on a populated DB.
16. **`payments` and `logs` tables have zero indexes**; the Stripe webhook sequentially scans `payments` on every event.
17. **`branches.avgRating` is an integer column** but the code writes a fractional average.
18. **`bookings.startDate/endDate` are `timestamp without time zone`** while `slot_reservations` are `timestamptz`.

### Operational

19. **No error tracking or alerting of any kind** (no Sentry/Datadog/OTel — verified by grep). Nobody finds out the site is down except a customer. `SENTRY_DSN` is now validated in config; the wiring still needs doing.
20. **Unstructured logs** — `winston.format.simple()`, no timestamps, no request id, no per-env level.
21. **No staging environment.** Every change is tested in production.
22. **Twilio still on trial, SES still in sandbox** (runbook §7).
23. **No mobile release keystore, no Apple Developer account.** Also check for iOS `PrivacyInfo.xcprivacy` and an in-app account-deletion path — Apple rejects without both.
24. **`ops` console has no `robots.txt`** and all three SPAs ship no security headers in `vercel.json`.
25. **Tokens in `localStorage`** in both dashboard and ops — any XSS is full account takeover of an ops admin.

### Known-good — verified, no action needed

- No `.env` was ever committed; all are correctly gitignored across all five apps.
- `HttpExceptionFilter` does not leak internals or stack traces.
- The payouts webhook **fails closed** on a missing signing secret.
- Website SEO is genuinely well done (canonical, OG, sitemap, geo targeting).
- Privacy and Terms pages exist and are routed.
- All four frontend builds succeed; backend typechecks clean.
- Audit interceptor redacts `password`/`token`/`code` (though not `otp`, `idToken`, `pin`).

---

## Recommended sequence

1. **This week:** install the backup cron and run one restore drill. Nothing
   else matters until data loss is survivable.
2. Connect the CI workflow (push `.github/workflows/ci.yml`, enable Actions).
3. Work the Stripe list (items 1–8) with a test-mode replay of every webhook.
4. Add error tracking before launch, not after.
5. Add a staging environment before the next schema change.
