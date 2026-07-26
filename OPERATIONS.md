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

## 8. Useful commands

```bash
# local backend
cd backend && npm run start                 # :3000 (Swagger /reference/api)
pnpm test                                   # 52/52 expected
npm run migration:run                       # local migrations

# prod API logs
ssh -i ~/.ssh/courtplus-ec2.pem ec2-user@63.186.130.126 \
  "cd ~/courtplus/backend && docker compose -f docker-compose.prod.yml logs api --tail 100"

# prod DB
… exec -T db psql -U postgres -d courtplus

# QA token minting (any user/staff)
node backend/scripts/qa-mint-token.js
```
