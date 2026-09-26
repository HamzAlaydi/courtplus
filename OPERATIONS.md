# Court+ Operations Runbook

Complete operational reference for the Court+ platform — all access, all services, how changes and features are made, and how everything deploys. **No secrets in this file** — only where they live.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        courtplusapp.com                      │
│                                                              │
│  website (Vercel)        dashboard (Vercel)    ops (Vercel)  │
│  courtplusapp.com        dashboard.courtplus…  ops.courtplus…│
│       │                        │                    │        │
│       └────────────────────────┼────────────────────┘        │
│                                ▼                             │
│                    api.courtplusapp.com                      │
│              EC2 t3.micro (eu-central-1) — Docker              │
│        ┌────────────┬──────────────┬───────────┐             │
│        │ NestJS API │ PostGIS DB   │ Redis     │ + Caddy TLS │
│        └────────────┴──────────────┴───────────┘             │
│                                                              │
│  mobile app (React Native) → api.courtplusapp.com            │
└─────────────────────────────────────────────────────────────┘

Monorepo: github.com/HamzAlaydi/courtplus (private)
├── backend/          NestJS 11 + TypeORM + PostGIS + BullMQ
├── dashboard/        Vendor web app (React 19 CRA + AntD)
├── ops/              Ops team console (React 19 Vite + AntD)
├── website/          Marketing site (React 19 Vite)
├── courtplusmobile/  Player app (React Native 0.80)
└── render.yaml       (unused — backend deploys to EC2, not Render)
```

---

## 2. All access points

### 2.1 Cloud & infrastructure

| Service | Account | How reached |
|---|---|---|
| **AWS** | `964816885138` (Hamza Juma Alaydi) | Console web login. IAM user `courtplus-backend` (policies: S3/SES/Rekognition/CloudFront/EC2 FullAccess). Keys in `backend/.env` |
| **EC2 instance** | `i-0a30af52bce0130af` (t3.micro, eu-central-1) | Elastic IP `63.186.130.126`. SSH: `ssh -i ~/.ssh/courtplus-ec2.pem ec2-user@63.186.130.126` |
| **EC2 security group** | `sg-0956ec5bc6f4ef1bf` | Port 22 restricted to current home IP (rotate it via AWS CLI when ISP changes); 80/443 open |
| **S3** | bucket `courtplus1-assets` (eu-central-1) | Private; presigned uploads; CORS set for dashboard origins |
| **CloudFront** | dist `E258KZDVE5HI6Y` | `d2s0i7s3svixzt.cloudfront.net` → serves `/assets/<id>` |
| **SES** | eu-central-1 | Identities: `courtplusapp.com` (DKIM via Vercel DNS), Gmail (verified). Sandbox mode — see §7 |
| **Stripe** | test mode, acct `acct_1LbPY6AE6urIzXY0` | Dashboard login. Keys in `backend/.env` |
| **Twilio** | trial ($15.50 credit) | Console login. Verify service `VA484094540989b4c0a708fa69264dc338` |
| **Firebase** | project `courtplus-f9379` | Console login (Google account). Service-account key in `backend/.env` (base64). Android+iOS apps registered `net.courtplus`, both SHA-1s added |
| **Google Maps** | project `ioss-3b115` (Stampi, billing-enabled) | Key used for **map tiles only**; geocoding/search = OSM Nominatim (free, no key) |
| **GitHub** | `HamzAlaydi` | `gh` CLI authed (keyring). EC2 pulls via deploy key `ec2-courtplus-api` (read-only, on the repo) |
| **Vercel** | `hamzalaydi` | Dashboard login. 3 projects: `courtplus-website`, `courtplus-dashboard`, `courtplus-ops`. API token `kimi-cli` was used for deploys — **revoke it at vercel.com/account/settings/tokens and issue a fresh one if needed** |
| **FastComet** | domain registrar | `courtplusapp.com` renews 19/04/2027. Nameservers: `ns1/ns2.vercel-dns.com` (DNS managed in Vercel) |
| **Gmail SMTP** | `hamza.alaydi.99@gmail.com` | App password in `backend/.env` (`MAIL_DRIVER=smtp`). Current mail sender for everything |
| **Local dev DB/Redis** | Homebrew services | Postgres `localhost:5432` db `courtplus` (PostGIS), Redis `localhost:6379` |

### 2.2 People accounts (production)

| Role | Email | Notes |
|---|---|---|
| Ops SuperAdmin | `hamza.alaydi.99+ops@outlook.sa` | ops.courtplusapp.com login; manage at /ops → Admins |
| Vendor (yours) | `hamza.alaydi.99@outlook.sa` | dashboard login; OTP via SMTP |
| Player (yours) | `+201044381820` | mobile signup; Twilio-verified number |

---

## 3. All APIs & service map

**Public API**: `https://api.courtplusapp.com` — Swagger at `/reference/api`.

| Area | Endpoints | External services |
|---|---|---|
| Auth | `/auth/customers/*`, `/auth/staff/*` | Twilio Verify (phone OTP), SES/SMTP (email OTP), Firebase (social) |
| Vendor | `/tenants`, `/branches`, `/courts`, `/schedules`, `/staff` | Google/Leaflet tiles, Nominatim geocoding |
| Bookings | `/bookings`, `/bookings/open` | Redis temp-slots, BullMQ reminders |
| Money | `/payments/stripe`, `/subscriptions/*`, `/billing/*`, `/payouts`, `/webhooks/payouts/stripe` | Stripe (test): products `prod_UwNgzjBSeM750o` ($30 base), `prod_UwinC0ND9GtJIP` ($10 branch add-on), `prod_UwinfHfsg9Uja8` ($10 court add-on); 3 webhook endpoints with distinct secrets (in server `.env`) |
| Moderation | `/ops/*` (SUPER_ADMIN only) | court approve/reject/suspend, vendor suspension, unsuspend requests, admin management, audit log |
| Media | `/assets/signed-url` | S3 presigned POST → CloudFront URL; Rekognition image moderation |
| Social | `/friendships`, `/posts`, `/reviews`, `/bookmarks`, `/blocks`, `/report` | — |
| Notifications | `/notifications`, `/notifications/token` | FCM push, in-app list, email templates (react-email) |
| Contact | `POST /contact` | SES/SMTP to `CONTACT_INBOX_EMAIL` |

**Env files** (all secrets live here, never committed): `backend/.env` (local), `~/courtplus/backend/.env` (EC2). Template: `backend/.env.example` (complete + current).

---

## 4. How changes & features are made

Standard loop used for every change in this project:

1. **Explore** — read the actual code (never assume), find root cause with evidence (logs, DB, API calls).
2. **Fix/build** — small, style-matching edits; backend changes must keep `pnpm build` + `pnpm test` (52/52) green; dashboard `CI=true npx react-scripts build` exit 0; ops `npm run build` exit 0; mobile `npx tsc --noEmit` exit 0.
3. **Verify** — real HTTP calls against local backend (JWT minting helper: `backend/scripts/qa-mint-token.js`), DB checks via `psql postgresql://postgres@localhost:5432/courtplus`.
4. **Commit + push** to `main` (single monorepo branch).
5. **Deploy** (§5) and **verify live** before reporting done.

New feature = same loop, plus: plan first (data model/migration if entities change → new file in `backend/src/migrations/`), en+ar i18n keys on every user-facing string, notification wiring if it's a lifecycle event, and a QA pass on the affected flows.

---

## 5. How everything deploys (fully autonomous)

### 5.1 Backend (EC2 Docker)

```bash
ssh -i ~/.ssh/courtplus-ec2.pem ec2-user@63.186.130.126
cd ~/courtplus
GIT_SSH_COMMAND='ssh -i ~/.ssh/courtplus-deploy' git pull
cd backend
docker compose -f docker-compose.prod.yml up -d --build api   # ~10 min
docker compose -f docker-compose.prod.yml exec -T api pnpm run migration:run
```

- Stack: `api` (NestJS) + `db` (PostGIS) + `redis` + `caddy` (auto-HTTPS for api.courtplusapp.com).
- Logs: `docker compose -f docker-compose.prod.yml logs api --tail 100`.
- **Disk routine**: every ~10 deploys run `docker image prune -a -f && docker builder prune -af` (20 GB disk; builds fail with ENOSPC otherwise).
- 3 GB swap configured; builds need `NODE_OPTIONS=--max-old-space-size=3072` (already in Dockerfile).

### 5.2 Frontends (Vercel, API-triggered)

```bash
TOKEN=<vercel-token>
curl -X POST https://api.vercel.com/v13/deployments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"<courtplus-dashboard|courtplus-website|courtplus-ops>","gitSource":{"type":"github","repoId":1310481935,"ref":"main"},"target":"production"}'
```

GitHub auto-deploy is NOT connected (Vercel GitHub app not installed) — deploys are always triggered via the API. Env vars are set per project (VITE_API_URL / REACT_APP_API_URL → api.courtplusapp.com).

### 5.3 Mobile (Android release APK)

```bash
cd courtplusmobile/android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
ANDROID_HOME=~/Library/Android/sdk ./gradlew assembleRelease
adb -s AU3N025A17003389 install -r app/build/outputs/apk/release/app-release.apk
```

Release = bundle baked in, production API. Debug/dev builds need Metro + `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:3000 tcp:3000` (both die when adb restarts — use release builds for testing).

### 5.4 DNS (Vercel)

`courtplusapp.com` zone in Vercel: A `api` → 63.186.130.126, dashboard/ops/website attached to projects, 3 SES DKIM CNAMEs. All other record changes via Vercel dashboard.

---

## 6. Operational gotchas (learned the hard way)

- **SSH allowlist**: port 22 is pinned to one IP — when the ISP rotates it, update via `aws ec2 authorize-security-group-ingress --group-id sg-0956ec5bc6f4ef1bf --protocol tcp --port 22 --cidr <newip>/32` (profile `courtplus` in `~/.aws`).
- **Stripe webhooks**: production secrets differ from `stripe listen` secrets. Endpoints: `/payments/stripe`, `/subscriptions/webhook`, `/webhooks/payouts/stripe`. Failed deliveries can be replayed by re-signing the event JSON with the endpoint's secret (HMAC `t=...,v1=...`) — used twice successfully.
- **Local webhooks need THREE `stripe listen` processes**, one per endpoint — `stripe listen` forwards every event to a single URL, and the old single `stripe:listen` script only fed `/payments/stripe`, so subscription events were silently dropped locally (checkout "succeeded" on Stripe, nothing activated in the app). Run in separate terminals: `pnpm stripe:listen:subscriptions`, `pnpm stripe:listen:payments`, `pnpm stripe:listen:connect` (the last one forwards BOTH platform `transfer.*` events and Connect `account.updated`). All three local secrets in `.env` are the one `stripe listen --print-secret` value.
- **Missed-webhook recovery**: a tenant whose subscription is ACTIVE on Stripe but missing locally (billing page still says "Subscribe", courts stuck in `pending_payment`) is repaired by `POST /subscriptions/sync` (Owner token). The billing page calls it automatically on return from Checkout with the `session_id`; with no body it searches Stripe by `metadata.tenantId`. Idempotent — safe to re-run.
- **Stripe redirect targets** must be dashboard routes. The dashboard has `/billing` (and `/settings`, `/home`) — it has NO `/dashboard` or `/pricing`. Defaults in `subscriptions.service.ts` and `stripe-payout.provider.ts` point at real routes now; keep it that way.
- **Throttler blocks**: per-key Redis blocks last 1h; clear by deleting `*:blocked` keys in the EC2 Redis container.
- **Migrations MUST live in `backend/src/migrations/`** — anywhere else never runs.
- **Metro/adb dev loop dies silently** — always prefer the release APK.
- **EC2 disk**: see §5.1 — prune or builds fail.

---

## 7. Launch blockers remaining

1. **Twilio** — trial: SMS only to verified numbers. Upgrade (~$20) for real users.
2. **SES** — sandbox: email only to verified addresses (currently Gmail SMTP covers everything via `MAIL_DRIVER=smtp`). Request production access in the SES console when ready; then set `MAIL_DRIVER=ses` + `SES_FROM_EMAIL=no-reply@courtplusapp.com` (domain already DKIM-verified).
3. **Stores** — Android: generate release keystore → Play Console. iOS: Apple Developer account ($99/y) → pods + archive.
4. **Deferred hardening** (from the security audit): JWT session check on ops routes, CORS restriction, hide Swagger in production, IP-keyed throttles on auth endpoints.

---

---

## 8. Backup & restore (added during production hardening)

Until this section existed there was **no backup of any kind**. Production data
lived only in the `pgdata` Docker volume on one EC2 instance: losing that volume
— instance termination, EBS failure, disk-full corruption, or a stray
`docker compose down -v` — destroyed every booking, payment and payout record
with no way back. Recovery point objective was "everything".

### 9.1 Nightly backup

`backend/scripts/backup-db.sh` dumps Postgres, gzips it, uploads to S3 and
prunes local copies. Install it:

```bash
# one-time: credentials for the backup job (chmod 600)
sudo tee /etc/courtplus-backup.env >/dev/null <<'ENV'
BACKUP_S3_BUCKET=s3://courtplus-backups
BACKUP_RETAIN_DAYS=14
AWS_PROFILE=courtplus-backup
ENV
sudo chmod 600 /etc/courtplus-backup.env

crontab -e
# 15 2 * * * /home/ec2-user/courtplus/backend/scripts/backup-db.sh >> /var/log/courtplus-backup.log 2>&1
```

**Use a dedicated IAM principal.** Do not reuse `courtplus-backend` (§2.1) — it
holds S3 FullAccess and its keys sit in `backend/.env` on the same box, so
anyone who reaches the instance could delete the backups too. Grant
`s3:PutObject` on the backup bucket only, and enable **S3 Versioning +
Object Lock** so history cannot be erased from the host.

Also enable **AWS Backup / DLM daily EBS snapshots** (7-day retention) on the
instance — that is the only thing that also covers Redis (BullMQ jobs) and the
`.env` file on disk.

### 9.2 Restore

```bash
# 1. Stop the API so nothing writes during the restore. Leave db running.
docker compose -f docker-compose.prod.yml stop api

# 2. Fetch the dump
aws s3 cp s3://courtplus-backups/courtplus-<STAMP>.sql.gz /tmp/ --profile courtplus-backup

# 3. Recreate the database (DESTRUCTIVE — the current DB is discarded)
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres -c 'DROP DATABASE IF EXISTS courtplus;' -c 'CREATE DATABASE courtplus;'

# 4. PostGIS extensions must exist before the dump loads
docker compose -f docker-compose.prod.yml exec -T db psql -U postgres -d courtplus \
  -c 'CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS btree_gist;'

# 5. Load
gunzip -c /tmp/courtplus-<STAMP>.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U postgres -d courtplus

# 6. Bring the API back (migrations run automatically on boot)
docker compose -f docker-compose.prod.yml up -d api
curl -fsS https://api.courtplusapp.com/health/ready
```

### 9.3 Restore drill — do this quarterly

An untested backup is not a backup. Restore the latest dump into a scratch
database, confirm PostGIS extensions come back and that row counts for
`bookings`, `payments` and `balance_transactions` match production, then record
the wall-clock time here. Remember the api image is `build: .` with a ~10 min
build, so image rebuild time is part of real recovery time.

| Date | Dump restored | Wall-clock | Result |
|------|---------------|-----------|--------|
| _(not yet run — schedule one before launch)_ | | | |

### 9.4 Deploy safety

`migrationsRun: true` (app.module.ts) means migrations execute automatically on
every container boot, with no human gate. **Take a dump immediately before every
deploy** so an automatic migration always has a restore point behind it:

```bash
./scripts/backup-db.sh && docker compose -f docker-compose.prod.yml up -d --build api
```

### 9.5 Disk-pressure commands — read before running

The `docker image prune` routine in §5.1 is safe. These are NOT:

- `docker compose -f docker-compose.prod.yml down -v` — **deletes `pgdata` immediately and irreversibly.** Never run it.
- `docker system prune -a --volumes` — safe only while the stack is up (the db container still references the volume). If the stack is down, it deletes the database.

Prefer the narrow form: `docker image prune -af --filter "until=168h" && docker builder prune -af`.

---

## 9. Useful commands

```bash
# local backend
cd backend && npm run start                 # :3000 (Swagger /reference/api)
pnpm test                                   # 83/83 expected
npm run migration:run                       # local migrations

# prod API logs
ssh -i ~/.ssh/courtplus-ec2.pem ec2-user@63.186.130.126 \
  "cd ~/courtplus/backend && docker compose -f docker-compose.prod.yml logs api --tail 100"

# prod DB
… exec -T db psql -U postgres -d courtplus

# QA token minting (any user/staff)
node backend/scripts/qa-mint-token.js
```

## 10. Billing & payments — how it works and how to fix it

**Model.** One Stripe subscription per tenant with up to three items:
base price (`STRIPE_BRANCH_PRICE_ID`, always qty 1: $30/mo, includes 1 branch
+ 2 courts), branch add-on (`STRIPE_BRANCH_ADDON_PRICE_ID`, $10, includes 1
extra court) and court add-on (`STRIPE_COURT_ADDON_PRICE_ID`, $10). Quantities
are ALWAYS derived from the tenant's real branch/court counts by
`PricingService` — there is no separate "court subscription". The first
Checkout already carries the add-ons; later changes go through
`stripe.subscriptions.update` (increases invoiced immediately, decreases at
the next period). Both add-on price ids are **required at boot**.

**Court lifecycle.** created → `pending_payment` → (subscription `active`,
i.e. no outstanding invoice) → `pending_approval` → ops approve → `available`.
Not subscribed yet: courts wait and are billed by the first Checkout. Lapsed
(cancelled/unpaid): creating branches or courts is refused server-side.

**Stripe dashboard endpoints (production).**

| URL | Type | Events | Secret |
|---|---|---|---|
| `/payments/stripe` | account | `charge.succeeded`, `charge.failed`, `payment_intent.*`, `charge.refunded` | `STRIPE_WEBHOOK_SECRET` |
| `/subscriptions/webhook` | account | `checkout.session.*`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed` | `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET` |
| `/webhooks/payouts/stripe` | account | `transfer.created`, `transfer.reversed` | `STRIPE_PAYOUTS_WEBHOOK_SECRET` |
| `/webhooks/payouts/stripe` | **Connect** | `account.updated` | `STRIPE_CONNECT_WEBHOOK_SECRET` |

Duplicate deliveries are ignored via `processed_webhook_events` (verified).

**When a vendor says "I paid but nothing happened".**
1. `POST /subscriptions/sync` with their Owner token (or ask them to open
   `/billing`) — pulls the subscription from Stripe and runs the same sync as
   the webhooks, then releases courts if fully paid. Idempotent.
2. If it still says no subscription: the Stripe subscription has neither
   `metadata.tenantId` nor a customer matching `tenants.providerCustomerId`.
   Set the metadata in the Stripe dashboard and re-run step 1.
3. The nightly cron (`[BILLING][RECONCILE]` in logs, 03:00) does step 1 for
   every live subscription anyway.

**Log markers to alert on.** `[BILLING]` (prices differ from constants,
sync failures, courts held back because an invoice is outstanding),
`[BILLING][RECONCILE]`, `[PAYMENT_FLOW]` errors (refund-on-unbookable,
off-session recharge after an expired authorisation), `[BALANCE]`.

**Payouts.** A payout is a Stripe *transfer* to the vendor's Express account:
final on `transfer.created`, failed on `transfer.reversed`. A vendor is
payout-ready when `payouts_enabled` and the `transfers` capability is
`active` (transfers-only accounts never get `charges_enabled`).

## 11. Realtime notifications (SSE)

**How it works.** `GET /notifications/stream` (Bearer auth, `text/event-stream`)
pushes `count` / `notification` events the moment `NotificationsService`
writes a row (staff, ops admins and customers alike), plus a `ping` every
25 s. Fan-out goes through the Redis channel `notifications:realtime`
(`NotificationsRealtimeService`), so it is correct with several API
replicas. Streams live at most 15 min; the dashboard and ops bells reconnect
with backoff and keep a 60 s poll as the fallback. Clients use `fetch`, not
`EventSource`, so the token never appears in a URL.

**Measured locally (2026-09-25):** badge updated 37–52 ms after the API call
in both consoles, no page reload, toast shown.

**Infrastructure requirements.**
- Caddy: `/notifications/stream` has its own `reverse_proxy` block with
  `flush_interval -1` and no response-header timeout (Caddyfile). Any other
  proxy/CDN in front must not buffer `text/event-stream`.
- `compression()` skips the stream path (main.ts); re-adding global
  compression without that filter silently kills realtime.
- Graceful shutdown: every stream is bound to
  `NotificationsRealtimeService.shutdown$`; without it `server.close()` waits
  forever for the open streams and a deploy hangs with the port closed. A
  15 s forced exit in main.ts backs that up. If a container ever refuses to
  stop, that is the first place to look.

**If the badge stops being live:** `curl -N -H "Authorization: Bearer <token>"
https://api.courtplusapp.com/notifications/stream` must print an `event:
count` frame immediately. No frame = proxy buffering or compression; frames
but no updates = Redis pub/sub (check `redis-cli PUBSUB CHANNELS`).

## 12. Accounts & auth — operational notes (pass 6)

- `DEV_OTP_BYPASS_CODE` is the ONLY bypass (phone and e-mail codes). It is
  refused in production by config validation; never set it on the server.
- Blocking a customer in ops now refuses login and refresh (`ACCOUNT_BLOCKED`).
  Password reset, account deletion and admin deactivation revoke every session.
- Phone numbers are normalised to E.164 on every auth endpoint; throttle keys
  use the normalised e-mail/phone. Refresh/logout are exempt from the
  per-IP auth throttle; the OTP throttle blocks for 15 min (was 1 h).
- Deleting a branch/court with upcoming bookings is refused
  (`*_HAS_UPCOMING_BOOKINGS`); cancel the bookings first (customers are refunded).
- Revenue: `[BALANCE][RECONCILE]` in the logs = the hourly job credited a paid
  booking that had no ledger row. Balances carry the tenant's currency.
- **Cancellation policy** (decided 2026-09-25): customers cancel/leave free up
  to 12 h before start (`BOOKING.CANCELLATION_CUTOFF_HOURS` in
  backend/src/modules/bookings/booking.constants.ts; the app mirrors the
  value in BookingDetails.logic.ts). Venue staff may cancel any time; the
  customer is refunded and notified with the reason.
