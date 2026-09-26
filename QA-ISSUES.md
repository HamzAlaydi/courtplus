# Court+ — Issue Register

Compiled 25 September 2026. Scope: the whole monorepo — backend, vendor dashboard, ops console, mobile app, marketing website and the live payment rail.

Sections 1-16 are the original register, written before anything was fixed:
every entry carries the file, the reproduction path, the impact and a
suggested fix. Sections 17 onwards record the fixes.


## Status: 84 of 92 confirmed items are fixed

Seven passes ran on 25 September 2026, each fix verified against the running
stack rather than just compiled. The fourth reviewed the other three; the
sixth came from the product owner driving the real apps on a real phone.

| Pass | What it covered | Fixed | Section |
|---|---|---:|---|
| 1 | The 15 critical items | 15 | 17 |
| 2 | Adversarial verification of all 62 high findings, then the clearest of them | 15 | 18 |
| 3 | Working down the rest of the confirmed list | 17 | 19 |
| 4 | Adversarial review OF the fixes; 12 regressions caught and fixed | 12 | 20 |
| 5 | The last 20: missing features and product calls | 19 | 21 |
| 6 | Live device testing: zero stats, silent Pay failure, currency, maps | 6 | 22 |
| 7 | Outbound-email audit: 34 raised, 30 confirmed, 12 fixed | 12 | 23 |

**Eight items remain**: two in section 21 (Sign in with Apple, and whether
branch assignment is a real access boundary) and six in section 23 — the
missing booking-confirmation, billing and payout-failure emails, plus three
smaller mail-layer gaps. Section 23 also records one finding deliberately NOT
changed, with the reasoning.

Sign in with Apple needs an Apple
developer account and native configuration that do not exist in this
repository, and whether branch assignment is a real access boundary is a
product decision that changes many queries.

After all seven passes: backend typecheck clean, **131** backend tests passing
(was 95), mobile typecheck clean, dashboard, ops console and website all
build.

## How this was produced

Two passes were combined:

1. **A live pass I ran myself** against the running stack: the backend on port 3000, the vendor dashboard, the ops console, the marketing site, the Android app on a Pixel emulator, the local Postgres database, and the project's real Stripe account. Everything in the first section was reproduced, not inferred.
2. **A twelve-part code audit** run by independent auditors, one per feature area, each tracing screens through services to the database and back.

An adversarial verification pass was planned for every finding. It did not run: the session limit was reached after the twelve tracers finished. Findings from pass 2 therefore carry **one** auditor's judgement and are marked accordingly. I re-checked the most severe ones by hand; those are marked **Verified by hand**.

Counts below are after removing refuted duplicates across areas.

| Severity | Count | Meaning |
|---|---:|---|
| Critical | 15 | Money is lost, security is breached, data is destroyed, or a core flow crashes |
| High | 61 | A core flow is broken or shows wrong data to a class of users |
| Medium | 168 | Real bug with a workaround, inconsistency, or missing validation |
| Low | 141 | Polish, copy, and cosmetic layout |
| **Total** | **385** | |

## Build and test status at the time of writing

| Check | Result |
|---|---|
| Backend typecheck | clean |
| Backend unit tests | 95 passed, 13 suites |
| Vendor dashboard build | succeeds (warnings only) |
| Ops console build | succeeds |
| Mobile typecheck | clean |
| Website build | succeeds |

A green build is not evidence of correctness here: every critical item below compiles and passes the existing tests.

## The 15 critical items, in one place

1. **Stripe Connect payouts cannot work for Saudi (or GCC/Egyptian) vendors with the current Stripe platform account** _(verified by hand)_
   `backend/src/modules/payouts/providers/stripe-payout.provider.ts:26` — Vendors can never be paid through the product. Revenue accumulates in tenant balances with no legal way out; this is a business/legal-entity decision, not a code fix.
2. **Stripe platform account is not activated (charges_enabled=false, payouts_enabled=false)** _(verified by hand)_
   `backend/.env.example:34` — Launch blocker: every customer payment and every vendor subscription fails in production.
3. **Mobile booking crashes at the summary step for any court without its own location record** _(verified by hand)_
   `courtplusmobile/src/components/molecules/CourtBookingCard/CourtBookingCard.component.tsx:40` — Bookings impossible for affected courts; app crash for customers.
4. **Vendor Owner/Admin can block ANY customer platform-wide via PATCH /admin/users/:id/block (no tenant scoping)** _(verified by hand)_
   `backend/src/modules/admin/admin.controller.ts:57` — A single vendor (or a disgruntled Admin-role employee) can ban customers from the entire marketplace, including customers who only book with competitors; the customer cannot log in anywhere and support has no audit of wh
5. **Staff refresh-token query joins `staff` on a `blockedAt` column that does not exist — every vendor/ops token refresh fails, forcing re-login every 15 minutes** _(verified by hand)_
   `backend/src/modules/auth/auth.service.ts:611` — Every vendor and ops admin is thrown out of the dashboard/ops console 15 minutes after logging in, on any API call; in-flight requests fail. Core session flow is broken for all staff.
6. **Split bookings created <30 min before start never settle the organiser's hold: vendor is never paid for unpaid seats**
   `backend/src/modules/bookings/reminders.service.ts:48` — For any open/split match created less than 30 minutes before kick-off with at least one unpaid seat (common for last-minute open matches), the match is played, the booking is marked COMPLETED, but the organiser is never 
7. **Staff refresh-token query references non-existent Staffer.blockedAt: every ops/vendor token refresh fails (forced logout every 15 min)** _(verified by hand)_
   `backend/src/modules/auth/auth.service.ts:611` — Every ops admin (and every vendor dashboard user) is thrown to the login page 15 minutes after signing in, mid-review, losing drawer/modal state; the SSE bell stream dies too. The console is unusable for sessions longer 
8. **Payout approval is not idempotent and not locked: double Stripe transfer / vendor paid twice on retry or concurrent approve** _(verified by hand)_
   `backend/src/modules/payouts/services/payouts.service.ts:105` — Court+ loses real money: a vendor can be paid twice (Stripe transfer plus restored balance) on a transient failure, and concurrent approvals send duplicate transfers.
9. **Open/split booking with no invitees is charged in full immediately, then treated as a HOLD: cannot settle, cannot cancel, cannot refund** _(verified by hand)_
   `backend/src/modules/bookings/bookings.service.ts:217` — Organiser of an open match without invitees pays the whole court up front; the booking is shown as partially paid forever, the vendor is never credited (no PAYMENT_COMPLETED), any joiner who pays is charged with no seat 
10. **Second 'Pay your part' on a stale Booking Details screen charges the customer twice; backend /pay has no status guard** _(verified by hand)_
   `courtplusmobile/src/screens/ActivityFlow/BookingDetails/BookingDetails.logic.ts:136` — A customer who pays their share and taps the (still visible) Pay button again is charged the share a second time; the money is captured by Stripe but the platform never links or refunds it.
11. **Open-match organiser with no invited friends is auto-charged 100% of the court, then joiners pay again on top** _(verified by hand)_
   `courtplusmobile/src/screens/OpenMatchFlow/ConfirmMatch/ConfirmMatch.logic.ts:29` — Organisers of open matches are overcharged (never refunded when players join) and the venue is paid more than the court price; the app shows the wrong 'part'.
12. **Booking Details / summary cards crash when the court has no own location (court.location is null)**
   `courtplusmobile/src/screens/ActivityFlow/BookingDetails/BookingDetails.component.tsx:82` — Customers cannot open booking details, cannot finish booking such courts, and invitees see a red screen; the venue loses bookings on those courts.
13. **Approving a payout always fails AFTER the Stripe transfer is sent, then refunds the vendor's balance: vendor is paid twice** _(verified by hand)_
   `backend/src/modules/payouts/services/payouts.service.ts:145` — Every approved payout sends the transfer to the vendor's Stripe account AND restores the same amount to their withdrawable balance (PAYOUT_FAILED +amount ledger row). The vendor can request the money again; Court+ loses 
14. **Stripe Connect onboarding cannot complete for any new vendor: tenant_payout_settings.bankName is NOT NULL and startOnboarding inserts without it (500, orphaned Stripe accounts)** _(verified by hand)_
   `backend/src/modules/payouts/services/payouts.service.ts:382` — No vendor can ever become payout-ready from the dashboard: clicking 'Set up payouts' shows the generic 'Something went wrong' toast; each click leaves an unused Express account in the Stripe platform. Combined with the r
15. **Split bookings settled from the organiser's hold are never credited to the vendor (paymentStatus never becomes COMPLETED, PAYMENT_COMPLETED never emitted)**
   `backend/src/modules/bookings/bookings.service.ts:1715` — Vendors receive 0 of the revenue for every split/open-match booking in which any seat was covered by the organiser — including the shares that participants did pay. Court+ keeps 100% instead of 20%. The booking still sho

## Where the issues are

| # | Area | Critical | High | Medium | Low | Total |
|---|---|---:|---:|---:|---:|---:|
| 1 | Live end-to-end checks (payments rail, mobile app, dashboard, website) | 3 | 5 | 9 | 11 | 28 |
| 2 | Vendor revenue, balances, payouts and statistics | 3 | 2 | 12 | 12 | 29 |
| 3 | Booking lifecycle (backend) | 1 | 11 | 11 | 9 | 32 |
| 4 | Vendor subscriptions and billing | 0 | 2 | 14 | 11 | 27 |
| 5 | Vendor sign-up, login, OTP and password reset | 1 | 2 | 13 | 6 | 22 |
| 6 | Vendor staff, roles and the Settings page | 1 | 5 | 13 | 12 | 31 |
| 7 | Ops console: approvals, suspensions, vendors, payouts | 2 | 4 | 14 | 12 | 32 |
| 8 | Branches: creation, editing, visibility, working hours | 0 | 5 | 15 | 12 | 32 |
| 9 | Courts: creation, media, pricing, status and approval | 0 | 4 | 14 | 11 | 29 |
| 10 | Schedules, availability, slots, timezones and reminders | 1 | 5 | 13 | 8 | 27 |
| 11 | Notifications and vendor feedback (in-app, push, e-mail) | 0 | 3 | 13 | 11 | 27 |
| 12 | Mobile booking and open-match screens | 3 | 8 | 12 | 11 | 34 |
| 13 | Mobile onboarding, login, profile and settings | 0 | 5 | 15 | 15 | 35 |
| | **Total** | **15** | **61** | **168** | **141** | **385** |


---

## 1. Live end-to-end checks (payments rail, mobile app, dashboard, website)

28 issues — 3 critical, 5 high, 9 medium, 11 low.

### 1. [CRITICAL] Stripe Connect payouts cannot work for Saudi (or GCC/Egyptian) vendors with the current Stripe platform account

- **Where:** `backend/src/modules/payouts/providers/stripe-payout.provider.ts:26`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The Stripe platform account behind STRIPE_SECRET_KEY (acct_1LbPY6AE6urIzXY0) is registered in Czechia (country CZ, default currency CZK). Stripe refuses to create a connected Express account for a venue in SA, AE, EG, US or GB from this platform: with the 'recipient' service agreement the API answers 'The recipient ToS agreement is not supported for platforms in CZ creating accounts in SA', and without it 'SA is not currently supported by Stripe'. The whole payout design (Express accounts + transfers) therefore has no working configuration for the target market.
- **How to reproduce:** Dashboard -> Settings -> Payouts -> 'Set up payouts' (POST /payouts/account/onboard) -> 500; or call the Stripe API directly with the project key.
- **Impact:** Vendors can never be paid through the product. Revenue accumulates in tenant balances with no legal way out; this is a business/legal-entity decision, not a code fix.
- **Evidence:**

```
GET https://api.stripe.com/v1/account -> {country:'CZ', default_currency:'czk'}
POST /v1/accounts type=express country=SA tos_acceptance[service_agreement]=recipient -> 400 'The recipient ToS agreement is not supported for platforms in CZ creating accounts in SA'
POST /v1/accounts type=express country=SA (full agreement) -> 400 'SA is not currently supported by Stripe'
Same 400 for AE, EG, US, GB with the recipient agreement.
```
- **Suggested fix (NOT applied):** Decide the payout rail before launch: (a) a Stripe entity in a country whose cross-border payout list includes SA (check https://stripe.com/docs/connect/cross-border-payouts) — Stripe still does not onboard SA-based connected accounts, so this only works if vendors have bank accounts in supported countries; (b) a KSA payment provider (e.g. Moyasar, Tap, HyperPay) for both charges and settlements; or (c) manual bank transfers run by ops using the bank fields that already exist on TenantPayoutSettings and PayoutProvider.CUSTOM, with the ops Payouts page marking payouts as sent. Until then hide the 'Set up payouts' path.

### 2. [CRITICAL] Stripe platform account is not activated (charges_enabled=false, payouts_enabled=false)

- **Where:** `backend/.env.example:34`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The Stripe account the project keys belong to reports charges_enabled=false and payouts_enabled=false. Test mode works, but no live charge (booking, subscription) can be taken until Stripe activation (business verification) is completed for the live account.
- **How to reproduce:** Switch the API keys to live and attempt any Checkout/PaymentIntent.
- **Impact:** Launch blocker: every customer payment and every vendor subscription fails in production.
- **Evidence:**

```
GET https://api.stripe.com/v1/account -> {id:'acct_1LbPY6AE6urIzXY0', charges_enabled:false, payouts_enabled:false, business_name:null}
```
- **Suggested fix (NOT applied):** Complete Stripe account activation for the legal entity that will operate Court+, in a country Stripe supports for the intended currencies (SAR presentment), and re-check charges_enabled before go-live.

### 3. [CRITICAL] Mobile booking crashes at the summary step for any court without its own location record

- **Where:** `courtplusmobile/src/components/molecules/CourtBookingCard/CourtBookingCard.component.tsx:40`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** CourtBookingCard renders courtData.location.name without a null guard. Courts created from the vendor dashboard without picking a court-level place get locationId = null (courts.service.ts:114 sets locationId: location?.id and never falls back to the branch location), so GET /courts/:id returns location: null and the booking summary (step 4) throws a Render Error. In a release build this is a hard crash; the customer can never reach payment for that court. Locally 2 of 15 courts have a null location, including the live vendor court created through the dashboard in this QA round.
- **How to reproduce:** Create a court in the dashboard without choosing a place for the court, then in the app: Court -> Book This Court -> pick a slot -> Next -> Next -> Next.
- **Impact:** Bookings impossible for affected courts; app crash for customers.
- **Evidence:**

```
Emulator: Booking step 4 -> red box 'Render Error: Cannot read property name of null' at CourtBookingCard.component.tsx (40:39).
Code line 40: text={courtData.location.name ?? ""}
DB: select count(*) filter (where "locationId" is null) from courts -> 2 of 15 (QA Court 1, ملاعب الشروق كرة).
```
- **Suggested fix (NOT applied):** Use courtData.location?.name ?? courtData.branch?.location?.name ?? branch name in the card; on the backend default a new court's locationId to its branch locationId; add a null-location court to the mobile test data.

### 4. [HIGH] POST /payouts/account/onboard turns any Stripe rejection into a 500 with no error code; dashboard shows only 'Something went wrong'

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:335`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** startOnboarding calls provider.createConnectedAccount without catching Stripe errors. An invalid_request_error from Stripe (unsupported country, missing capability, bad key) surfaces as {statusCode:500, code:'INTERNAL_SERVER_ERROR'}; the vendor sees a generic toast and nothing is logged with the tenant id.
- **How to reproduce:** Settings -> Payouts -> Set up payouts.
- **Impact:** Vendor cannot tell whether to retry, contact support, or that the feature is unavailable in their country.
- **Evidence:**

```
curl -X POST /payouts/account/onboard -> {"statusCode":500,"code":"INTERNAL_SERVER_ERROR"}; dashboard toast 'Something went wrong. Please try again.' (observed in the browser).
```
- **Suggested fix (NOT applied):** Catch Stripe errors in startOnboarding, log with tenantId, and return a 400 with a dedicated code (e.g. PAYOUT_COUNTRY_NOT_SUPPORTED / PAYOUT_PROVIDER_ERROR) mapped in dashboard errors.*.

### 5. [HIGH] Android release build is signed with the public debug keystore

- **Where:** `courtplusmobile/android/app/build.gradle:99`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** buildTypes.release uses signingConfigs.debug (debug.keystore / androiddebugkey). Google Play rejects debug-signed bundles, and the debug key is public so anyone could produce an 'update' that installs over the app. versionCode is still 1 / versionName 1.0.
- **How to reproduce:** ./gradlew bundleRelease and upload to Play Console.
- **Impact:** No publishable Android build exists; the store upload will be refused.
- **Evidence:**

```
build.gradle:89-104 signingConfigs { debug { storeFile file('debug.keystore') keyAlias 'androiddebugkey' ... } } ... release { signingConfig signingConfigs.debug }
```
- **Suggested fix (NOT applied):** Create a release keystore (or enrol in Play App Signing), keep it out of git, wire signingConfigs.release from gradle.properties/env, bump versionCode per release.

### 6. [HIGH] All QA-pass fixes (231 files, 6 migrations) exist only as uncommitted changes on one laptop

- **Where:** `PRODUCTION-READINESS.md:1`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** git status shows 190 modified and 41 untracked files (+7204/-1727 lines) including six new migrations, the health module, the vendors module, the realtime notifications service and the payouts client. Nothing is committed, pushed, reviewed or built by CI; the last commit is aad8690.
- **How to reproduce:** git status
- **Impact:** A disk failure or an accidental checkout loses weeks of fixes; production cannot be deployed from git.
- **Evidence:**

```
git status --short | wc -l -> 231; git diff --stat -> 190 files changed, 7204 insertions(+), 1727 deletions(-)
```
- **Suggested fix (NOT applied):** Commit in reviewable chunks on a branch, open a PR, let .github/workflows/ci.yml run, then deploy.

### 7. [HIGH] Booking step 1 shows a fixed '30 mins / SR {hourlyRate}' instead of the selected duration and its price

- **Where:** `courtplusmobile/src/screens/CourtFlow/Booking/ChooseTime/ChooseTime.component.tsx:72`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The 'Total Selected Time' chip is the literal string 30 mins and 'Total Cost' is the court's hourly rate, regardless of the slots selected. The backend charges hourlyRate * duration / 60 (bookings.service.ts:209) and the summary step computes the same, so a customer booking 30 minutes on a 150/h court is told 'SR 150' on step 1 and charged 75, or told 150 and charged 300 for two hours.
- **How to reproduce:** Open any court -> Book This Court; compare the header chips with the summary on step 4.
- **Impact:** Wrong price shown before payment; disputes and abandoned bookings.
- **Evidence:**

```
ChooseTime.component.tsx:58 text={`30 ${t("general.mins")}`}; line 72 text={`SR ${courtData.hourlyRate}`}
Emulator: 30 mins selected on a 150/h court shows 'Total Cost SR 150'.
```
- **Suggested fix (NOT applied):** Derive both chips from the selected slots (duration, hourlyRate * duration / 60) and use one currency label (SAR vs SR) taken from the court currency.

### 8. [HIGH] Open Match list serves completed, months-old matches as joinable ('Book now')

- **Where:** `backend/src/modules/bookings/bookings.service.ts:706`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** GET /bookings/open only adds booking.open = true (and court/branch/tenant visibility) to the query; it applies no default startDate >= now() and no status filter unless the client passes them, and the mobile app passes neither. The Open Match screen therefore lists bookings from July 2026 with status completed and paymentStatus completed, each with a 'Book now' button and open seats.
- **How to reproduce:** Home -> Open Match after any open booking has finished.
- **Impact:** Customers try to join finished matches; the screen fills with stale data and hides real upcoming matches; join attempts fail or, if the join path lacks its own guard, create participants on a completed booking.
- **Evidence:**

```
Live API as QA customer: GET /bookings/open?page=1&pageSize=10 -> total 3: [completed/completed 2026-07-27 open=true QA Court 1], [completed/completed 2026-07-27 open=true], [completed/completed 2026-07-26 open=true Cairo Test Court] (today is 2026-09-25).
bookings.service.ts find(): `if (openBookings) qb.andWhere('booking.open = :open')`; status filter only `if (status && status.length > 0)`; startDate filter only `if (startDate)`.
Emulator: Open Match screen shows 'Mon 27 Jul, 07:00 AM ... Book now'.
```
- **Suggested fix (NOT applied):** In find() when isLookingForOpenBookings: add booking.startDate > now() (court-tz aware) and booking.status IN (pending, confirmed) by default; order by startDate ASC; the app should also hide matches without free seats.

### 9. [MEDIUM] Vendor balance ledger shows '+0.00 SAR Booking revenue' marker rows for every hold

- **Where:** `backend/src/modules/payouts/services/balance.service.ts:262`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** holdBookingRevenue records the hold as a BOOKING_COMPLETED transaction with amount 0 and metadata {held:true, heldAmount}. The transactions endpoint (and now the dashboard 'Recent balance activity' table) shows these as '+0.00 SAR Booking revenue' followed later by '-400.00 SAR Booking refund', so a vendor sees refunds of money that never visibly arrived. There is no distinct transaction type for hold/release.
- **How to reproduce:** Pay for a booking, then open Settings -> Payouts -> Recent balance activity.
- **Impact:** Vendors cannot reconcile their earnings; support tickets.
- **Evidence:**

```
balance.service.ts:262-266 type: TransactionType.BOOKING_COMPLETED, amount: 0, metadata: { held: true, heldAmount: netAmount }
GET /payouts/transactions -> booking_completed amount 0 {held:true, heldAmount:400}; booking_refunded -400
```
- **Suggested fix (NOT applied):** Add TransactionType.BOOKING_HELD / BOOKING_RELEASED (or filter held markers out of the vendor-facing list and show 'on hold' amounts separately).

### 10. [MEDIUM] Raw Stripe error text is stored as payout failureReason and shown to vendors

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:1`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** When provider.createPayout throws, the Stripe message is persisted verbatim in payout.failureReason. The vendor dashboard (Payouts -> Payout history) and the ops page render that column, so vendors read developer text such as "You passed an empty string for destination. We assume empty values are an attempt to unset a parameter..." (seen on a stored payout).
- **How to reproduce:** Approve a payout for a tenant whose Stripe account is missing; open the vendor Payouts history.
- **Impact:** Confusing/unprofessional; leaks integration details.
- **Evidence:**

```
GET /payouts (SuperAdmin) -> status failed, failureReason: "You passed an empty string for destination ..."; dashboard PayoutsSection renders row.failureReason under the status tag.
```
- **Suggested fix (NOT applied):** Store the raw message in metadata for ops only and map failures to a short, translated vendor-facing reason.

### 11. [MEDIUM] Booking date strip opens on past dates with the selected day off-screen

- **Where:** `courtplusmobile/src/components/molecules/HorizontalDatePicker/HorizontalDatePicker.component.tsx:35`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** On open the strip shows 16-20 September while the selected date is 25 September (visible only after scrolling right). The list is pre-padded with past weeks and relies on scrollToIndex/initialScrollIndex without a stable item layout, so the initial position lands on an earlier week.
- **How to reproduce:** Court -> Book This Court.
- **Impact:** Customers see unavailable past days first and may think the court has no availability.
- **Evidence:**

```
Emulator: Booking step 1 shows Wed 16 ... Sun 20 first; step 2 summary shows Date 25 Sep 2026.
HorizontalDatePicker.component.tsx:31-41 generates previous weeks, line 35 scrollToIndex({ index: WEEKS_BATCH }), line 89 initialScrollIndex={centerIndex}.
```
- **Suggested fix (NOT applied):** Start the list at today (no past weeks) or provide getItemLayout so the initial scroll is exact.

### 12. [MEDIUM] Home/Courts header shows an endless spinner instead of a location when reverse geocoding returns nothing

- **Where:** `courtplusmobile/src/hooks/uselocation.ts:9`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** FALLBACK_LOCATION has an empty address and the header renders an ActivityIndicator whenever the address is empty (isLoading || !currentLocation). When Nominatim is slow, blocked or returns no result the spinner never stops and there is no way to see or change the area being searched.
- **How to reproduce:** Run the app where nominatim.openstreetmap.org is slow or blocked (common on mobile networks) or on an emulator.
- **Impact:** Looks broken; customers cannot tell which area is being searched.
- **Evidence:**

```
Emulator with a GPS fix and location permission granted: the 'Location' label showed a spinner for more than 3 minutes on Home and Courts. Header component line 33: {isLoading || !currentLocation ? (<ActivityIndicator />) : ...}; uselocation.ts:9-10 FALLBACK_LOCATION = { address: "", ... }.
```
- **Suggested fix (NOT applied):** Show a fallback label ('Near you', coordinates or 'Set location') after a timeout and keep the label tappable.

### 13. [MEDIUM] Arabic (RTL) court details loses the Moments tab and shows untranslated '30 mins'

- **Where:** `courtplusmobile/src/screens/CourtFlow/CourtDetails/CourtDetails.component.tsx:1`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** In Arabic the court tab bar shows only three tabs (تفاصيل الملعب، المواعيد المتاحة، المواصفات); the fourth tab (Moments) overflows off the left edge because the tab row is a fixed-width row, not a scrollable/wrapping one, and the Arabic labels are longer. The 'min time' stat renders the English string '30 mins' inside the Arabic UI.
- **How to reproduce:** Settings -> Language (Arabic) -> open any court.
- **Impact:** Arabic users cannot reach court moments; mixed-language UI.
- **Evidence:**

```
Emulator screenshot (Arabic) of Court Details: tabs المواصفات / المواعيد المتاحة / تفاصيل الملعب only; stat chip '30 mins' with Arabic label الوقت المناسب. English screenshot shows four tabs.
```
- **Suggested fix (NOT applied):** Make the tab row horizontally scrollable or shrink labels; translate the min-time value with the existing general.mins key.

### 14. [MEDIUM] Vendor dashboard shows branch revenue and customer spending with a hard-coded dollar sign

- **Where:** `dashboard/src/pages/Branches.js:89`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** Branches.js builds the Total Revenue cell as '$ ' + branch.totalRevenue and Users.js renders Spending as `$${v}`, while the tenant, its courts and every booking are in SAR (the Home and Courts pages say 'SAR'). A Saudi vendor sees '$ 0' and '$0' next to 'SAR' amounts on other pages.
- **How to reproduce:** Dashboard -> Branches; Dashboard -> Users.
- **Impact:** Wrong currency shown to vendors; erodes trust in the numbers.
- **Evidence:**

```
Branches.js:89 totalRevenue: "$ " + branch.totalRevenue; Users.js:147 render: (v) => `$${v}`; browser: Branches table 'Total Revenue $ 0', Users table 'Spending $0', Home 'Total Revenue 0 SAR'.
```
- **Suggested fix (NOT applied):** Format with the tenant currency (tenant.preferences.currency / balance.currency) through one shared money formatter.

### 15. [MEDIUM] Vendor dashboard 'Users' shows 0 bookings for a customer with 7 bookings on the vendor's court

- **Where:** `backend/src/modules/users/users.service.ts:696`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The Users page reads users.bookingsCount / totalSpent, denormalised counters kept in sync only by BookingEventType.CREATED (+1), CANCELLED (-1), PAYMENT_CAPTURED and PAYMENT_REFUNDED event handlers. The counter is global per customer (not per vendor), it goes back to 0 for cancelled bookings, and any booking created through a path that does not emit CREATED (or an event lost while the process restarts, since events are in-process and non-durable) leaves it wrong. On the local DB the customer has 7 bookings (1 completed) on this vendor's court and the page shows Bookings 0 / Spending $0.
- **How to reproduce:** Dashboard -> Users after a customer has booked.
- **Impact:** Vendors cannot rank or recognise their customers; the sort by spending/bookings is meaningless.
- **Evidence:**

```
GET /users?sortBy=spending (vendor) -> bookingsCount: 0, totalSpent: 0 for qa_customer_1; DB: 7 bookings by that user on court 07491b98 (6 cancelled, 1 completed, 500 SAR captured). users.service.ts:696-759 @OnEvent handlers are the only writers.
```
- **Suggested fix (NOT applied):** Compute bookings/spend per tenant at read time (COUNT/SUM over bookings joined to the vendor's courts) or maintain per-tenant counters transactionally in the booking service.

### 16. [MEDIUM] Marketing website renders a blank white page for any unknown URL (no 404 route)

- **Where:** `website/src/App.jsx:38`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The router defines only /, players, journal, faqs, contact-us, terms and privacy under the Layout; there is no catch-all route. Any other path (a typo, an old link such as /contact, /login, /app) renders nothing at all: empty body, no header/footer, no message, while the page title still says Court+.
- **How to reproduce:** Open the site at any path that is not in the list above.
- **Impact:** Dead ends for visitors and search engines; looks like the site is down.
- **Evidence:**

```
App.jsx:38-46 <Routes> ... no path="*"; browser: http://localhost:5173/contact and /this-page-does-not-exist -> empty <body>, white screenshot.
```
- **Suggested fix (NOT applied):** Add a `*` route with a 404 page inside the Layout (and a 404 rewrite/status on Vercel for SEO).

### 17. [MEDIUM] Vendor signup accepts duplicate businesses (same name and phone); ops Vendors list cannot tell them apart

- **Where:** `backend/src/modules/vendors/vendors.service.ts:71`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** Tenant creation only checks the owner's e-mail. Two vendor registrations with different e-mails but the same business name and phone produce two tenants; nothing on tenants is unique except the id, and the ops console lists both as 'HAMZA PLAYGROUND +201044382820' with identical rows. Three older tenants also have no name and no phone (created through the staff signup path), so the ops list shows '—' rows that cannot be searched or contacted.
- **How to reproduce:** Register a vendor twice with the same business phone and different e-mails.
- **Impact:** Duplicate venues in the marketplace, split bookings/reviews, support confusion; ops cannot contact nameless tenants.
- **Evidence:**

```
DB: select name, "phoneNumber", count(*) from tenants group by 1,2 having count(*)>1 -> ('HAMZA PLAYGROUND', '+201044382820', 2) and (null, null, 3); ops /vendors page shows the duplicate rows and '—' names. tenant.entity.ts has no unique index on phoneNumber.
```
- **Suggested fix (NOT applied):** Enforce unique normalised business phone per tenant (and warn on duplicate names) at signup; require name/phone for every tenant and backfill the three empty ones.

### 18. [LOW] Payouts section banner wraps one word per line on viewports narrower than ~900px

- **Where:** `dashboard/src/components/settings/PayoutsSection.js:205`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The antd Alert uses the 'action' slot for the 'Set up payouts' button; with the sidebar open at ~800px the message column collapses and the text renders one word per line. Fine at 1280px.
- **How to reproduce:** Open Settings -> Payouts in a window narrower than 900px.
- **Impact:** Unreadable banner on small laptops/tablets.
- **Evidence:**

```
Screenshot at 800px: 'Set / up / yo / ur / pa / yo / ut' inside the info Alert.
```
- **Suggested fix (NOT applied):** Render the button below the text (no 'action' slot) or give the Alert a flex-wrap layout.

### 19. [LOW] Settings page logs 'useForm instance is not connected to any Form element' on every load

- **Where:** `dashboard/src/pages/Settings.js:1`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** A Form.useForm() instance (delete-account form) is created while its Modal is closed, so antd warns on each render. Harmless but noisy and hides real warnings.
- **How to reproduce:** Open /settings with devtools.
- **Impact:** Console noise only.
- **Evidence:**

```
Browser console on /settings: Warning: Instance created by `useForm` is not connected to any Form element. Forget to pass `form` prop?
```
- **Suggested fix (NOT applied):** Use forceRender on the Modal or create the form inside the modal component.

### 20. [LOW] Dashboard requests a non-existent locale file (en-US.json) on every load

- **Where:** `dashboard/src/i18n.js:11`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** i18next-browser-languagedetector reports the full browser tag (en-US, ar-SA). Without load: languageOnly the http backend first fetches /assets/locales/en-US.json, which does not exist; in dev the SPA fallback returns index.html (200, JSON parse error swallowed), in production on Vercel the rewrite does the same. Only en.json and ar.json exist. A user whose browser is ar-SA gets the same extra failed fetch before ar.json.
- **How to reproduce:** Open the dashboard with devtools network tab.
- **Impact:** Wasted request and a parse error per page load; header language switcher shows the raw tag "en-US".
- **Evidence:**

```
Network log: GET /assets/locales/en-US.json -> 200 (index.html) then GET /assets/locales/en.json; i18n.js has fallbackLng: "en" and loadPath "/assets/locales/{{lng}}.json" with no load/supportedLngs option.
```
- **Suggested fix (NOT applied):** Add supportedLngs: ["en","ar"] and load: "languageOnly" (or nonExplicitSupportedLngs) to the i18next init.

### 21. [LOW] Customer-facing copy errors on Home and court screens

- **Where:** `courtplusmobile/src/translation/en.json:1`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** 'Find a courts, coaches + more' (search placeholder), 'Play amazing Match', 'If you are looking for player at your level', 'Long' as the court length label, 'courts times' stat label, and two different currency labels ('SAR 150' on details vs 'SR 150' in booking).
- **How to reproduce:** Open Home, a court, Specs, Book.
- **Impact:** Unpolished first impression.
- **Evidence:**

```
Emulator screenshots of Home, Court Details (Specs) and Booking step 1.
```
- **Suggested fix (NOT applied):** Copy-edit en/ar strings and use one currency label derived from the court currency.

### 22. [LOW] Arabic bottom tab labels are truncated with ellipses

- **Where:** `courtplusmobile/src/translation/ar.json:1`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** Three of five tab labels are cut: 'الملف الشخص...', 'التواصل الاجت...', 'الصفحة الرئي...'. The Arabic labels (الملف الشخصي, التواصل الاجتماعي, الصفحة الرئيسية) are too long for the tab width and the tab bar has no allowFontScaling/label-width handling.
- **How to reproduce:** Switch the app to Arabic.
- **Impact:** Navigation labels unreadable for Arabic users, the main market.
- **Evidence:**

```
Emulator screenshot (Arabic) of the bottom tab bar on Home and Profile.
```
- **Suggested fix (NOT applied):** Use shorter Arabic labels (الرئيسية, المجتمع, الملف) or reduce the tab label font/allow two lines.

### 23. [LOW] Arabic profile stats grid wraps the third stat onto its own row

- **Where:** `courtplusmobile/src/screens/ProfileFlow/Profile/Profile.component.tsx:160`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The three stat tiles (courts played / hours / sessions) are laid out in a row sized for the short English labels; with the Arabic labels (الملاعب التي تم اللعب فيها, عدد ساعات اللعب, عدد مرات اللعب) the third tile wraps under the first two and the divider layout breaks.
- **How to reproduce:** Switch to Arabic -> Profile tab.
- **Impact:** Broken layout on the profile screen for Arabic users.
- **Evidence:**

```
Emulator screenshot (Arabic) of My Profile: two tiles on the first row, 'عدد مرات اللعب' alone on a second row.
```
- **Suggested fix (NOT applied):** Give the tiles flex: 1 with numberOfLines/adjustsFontSizeToFit, or shorten the Arabic labels.

### 24. [LOW] Tapping 'Language' switches the language and restarts the app immediately, with no picker or confirmation

- **Where:** `courtplusmobile/src/screens/ProfileFlow/Settings/Settings.logic.tsx:113`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The Language row's onPress is changeLanguage directly: one tap flips English<->Arabic, forces RTL and restarts the JS app (a blank screen for ~3 s). A user exploring the settings loses their place and may not know how to switch back.
- **How to reproduce:** Profile -> ... -> Language.
- **Impact:** Accidental language switch; abrupt restart.
- **Evidence:**

```
Settings.logic.tsx:113 onPress: changeLanguage; emulator: tap -> white screen -> app relaunched in Arabic (logcat: Running "Court Plus" with new pid).
```
- **Suggested fix (NOT applied):** Show a language picker/confirmation before applying, and a loading state during restart.

### 25. [LOW] Home promotes a 'Coaches' feature that is only a 'coming soon' screen

- **Where:** `courtplusmobile/src/screens/Coaches/Coaches.component.tsx:23`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The Home card 'Coaches — Start your professional career' (one of the two main call-to-actions) opens a screen whose whole content is coaches.comingSoon / coaches.description and a button back home. There is no coaches feature in the backend.
- **How to reproduce:** Home -> Coaches.
- **Impact:** Dead end on the first screen; store reviewers flag placeholder features.
- **Evidence:**

```
Coaches.component.tsx:23 text={t("coaches.comingSoon")}; Home screenshot shows the Coaches card next to Open Match.
```
- **Suggested fix (NOT applied):** Hide the card until the feature exists or label it 'Coming soon' on the card itself.

### 26. [LOW] Court 'Availability' calendar never shows the promised availability colouring

- **Where:** `courtplusmobile/src/screens/CourtFlow/CourtDetails/components/CourtAvailability/CourtAvailability.logic.ts:17`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The calendar legend says 'Fully Booked' (grey) / 'Available' (green) but the component only passes unavailableDays (fully booked days) as bookedDays; days with availability are never coloured green, so on a normal month every day looks identical and the legend is misleading.
- **How to reproduce:** Court -> Availability tab.
- **Impact:** Customers cannot see which days are bookable at a glance.
- **Evidence:**

```
CourtAvailability.logic.ts:17 const unavailableDays = data?.unavailableDays ?? []; component passes bookedDays={unavailableDays} only. Emulator screenshot: no day coloured, legend shows both colours.
```
- **Suggested fix (NOT applied):** Mark available days (schedule days) green and non-schedule days disabled, or drop the 'Available' legend.

### 27. [LOW] Users page sort control shows raw 'ASC' / 'DESC' and is not translated

- **Where:** `dashboard/src/pages/Users.js:261`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The sort-order Select lists the literal options 'ASC' and 'DESC' and the page header reads 'Total Spending DESC'; column titles ('Bookings', 'Spending', 'Blocked') are hard-coded English so the Arabic dashboard mixes languages.
- **How to reproduce:** Dashboard -> Users (Arabic UI).
- **Impact:** Confusing, untranslated controls.
- **Evidence:**

```
Users.js:261-262 <Option value="ASC">ASC</Option> <Option value="DESC">DESC</Option>; browser page text: 'Blocked / Total Spending / DESC'.
```
- **Suggested fix (NOT applied):** Use translated labels (Ascending/Descending, تصاعدي/تنازلي) and t() for column titles.

### 28. [LOW] App-store buttons on the website link to the generic store home pages

- **Where:** `website/src/pages/home:1`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The App Store and Google Play badges link to https://apps.apple.com and https://play.google.com (no app id). Visitors land on the store front page instead of the Court+ listing.
- **How to reproduce:** Click either store badge on the home page.
- **Impact:** Lost installs; must be updated at launch.
- **Evidence:**

```
DOM on http://localhost:5173/: <a href="https://apps.apple.com"><img src=apps_store.png>, <a href="https://play.google.com"><img src=google_store.png>.
```
- **Suggested fix (NOT applied):** Point the badges at the real listings once published (or hide them until then).

---

## 2. Vendor revenue, balances, payouts and statistics

29 issues — 3 critical, 2 high, 12 medium, 12 low.

### 29. [CRITICAL] Approving a payout always fails AFTER the Stripe transfer is sent, then refunds the vendor's balance: vendor is paid twice

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:145`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** approvePayout() is intentionally NOT @Transactional (comment at lines 101-104) but still calls runOnTransactionCommit() inside the try block after the Stripe transfer has been created and the payout row saved as PROCESSING. typeorm-transactional's runOnTransactionCommit throws 'No hook manager found in context. Are you using @Transactional()?' when there is no active transaction (node_modules/typeorm-transactional/dist/hooks/index.js:42-47, 101-103; getTransactionalContext() is storage.get(), undefined outside @Transactional; nothing in src wraps requests). The throw lands in the catch, which credits the full amount back to the vendor's available balance (refundFailedPayout), marks the payout FAILED with that error text, and returns 400 PAYOUT_CREATION_FAILED to ops. Money has already left the platform account. The later transfer.created webhook then finds the payout by providerPayoutId and flips it FAILED -> COMPLETED without checking status.
- **How to reproduce:** Vendor with an active connected account requests a payout; ops clicks Approve. Observe: Stripe transfer exists, payouts.status = 'failed' with failureReason 'No hook manager found in context…', balance_transactions has payout_requested -X then payout_failed +X, vendor available balance back to the pre-request value. After the transfer.created webhook the row becomes 'completed'.
- **Impact:** Every approved payout sends the transfer to the vendor's Stripe account AND restores the same amount to their withdrawable balance (PAYOUT_FAILED +amount ledger row). The vendor can request the money again; Court+ loses the payout amount on every approval. Ops sees 'Failed to create the payout. Please try again.' and a retry answers PAYOUT_NOT_PENDING. The unit spec mocks runOnTransactionCommit (balance.service.spec.ts:13-16) so tests cannot catch this.
- **Evidence:**

```
payouts.service.ts:101-104  // NOTE: intentionally NOT @Transactional — the catch below performs compensating writes
payouts.service.ts:129  const result = await provider.createPayout({...})
payouts.service.ts:143  await this.payoutRepo.save(payout);
payouts.service.ts:145-147  runOnTransactionCommit(() => { this.eventEmitter.emit('payout.approved', { payout }); });
payouts.service.ts:150-162  } catch (error) { await this.balanceService.refundFailedPayout(...); payout.status = PayoutStatus.FAILED; payout.failureReason = error.message; ... throw new BadRequestException('PAYOUT_CREATION_FAILED');
typeorm-transactional hooks/index.js:45-46  if (!emitter) { throw new Error('No hook manager found in context. Are you using @Transactional()?'); }
typeorm-transactional hooks/index.js:101-103  var runOnTransactionCommit = function (cb) { getTransactionalContextHook().once('commit', cb); };
```
- **Suggested fix (NOT applied):** Emit 'payout.approved' directly (this.eventEmitter.emit) or wrap approvePayout in @Transactional and move the Stripe call outside the transaction (create transfer first, then a transactional save that cannot throw from hooks). Additionally never run the compensating refund when the provider call succeeded: only refund when createPayout itself threw (track a boolean), and log/alert for DB failures after a successful transfer.

### 30. [CRITICAL] Stripe Connect onboarding cannot complete for any new vendor: tenant_payout_settings.bankName is NOT NULL and startOnboarding inserts without it (500, orphaned Stripe accounts)

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:382`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** startOnboarding() creates a TenantPayoutSettings row with only tenantId/provider/isActive, creates the Stripe Express account and account link, and then save()s the row. The entity declares bankName as a non-nullable column and the live schema confirms 'bankName character varying NOT NULL' with no default (migration 1770385362235-payouts.ts:8; psql \d tenant_payout_settings). TypeORM emits DEFAULT for the undefined column, Postgres rejects with a not-null violation, the request ends in a 500 and providerAccountId is never stored. Because the Stripe account is created before the save, every retry creates another orphan Express account. The same applies to PUT /payouts/settings (updatePayoutSettings, lines 264-274) for a tenant with no row. The only tenant that has a settings row in the DB was seeded with bankName 'QA Bank', which is why this was never hit.
- **How to reproduce:** Log in as the Owner of tenant 7bc4d409… (no tenant_payout_settings row), Settings -> Payouts -> 'Set up payouts'. POST /payouts/account/onboard returns 500 (QueryFailedError: null value in column "bankName" violates not-null constraint).
- **Impact:** No vendor can ever become payout-ready from the dashboard: clicking 'Set up payouts' shows the generic 'Something went wrong' toast; each click leaves an unused Express account in the Stripe platform. Combined with the request/approve flow this means the whole vendor-earnings feature is unusable in production.
- **Evidence:**

```
payouts.service.ts:341-347  let settings = await this.settingsRepo.findOne({ where: { tenantId } }); if (!settings) { settings = this.settingsRepo.create({ tenantId, provider: PayoutProvider.STRIPE, isActive: false }); }
payouts.service.ts:367  const account = await provider.createConnectedAccount(tenantId, {...})
payouts.service.ts:380-382  settings.providerAccountId = account.accountId; settings.isActive = false; await this.settingsRepo.save(settings);
tenant-payout-settings.entity.ts:22-23  @Column()\n  bankName?: string;
migration 1770385362235-payouts.ts:8  "bankName" character varying NOT NULL
live DB: bankName | character varying | not null | (no default)
```
- **Suggested fix (NOT applied):** Make bankName nullable (entity `@Column({ nullable: true })` + migration ALTER COLUMN DROP NOT NULL); additionally persist the settings row BEFORE calling Stripe (or store the accountId immediately after accounts.create and create the account link second) so a failure cannot orphan the connected account.

### 31. [CRITICAL] Split bookings settled from the organiser's hold are never credited to the vendor (paymentStatus never becomes COMPLETED, PAYMENT_COMPLETED never emitted)

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1715`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Vendor revenue is held only in the PAYMENT_COMPLETED handler (balance.service.ts:455-488) and the hourly reconciler only picks bookings with paymentStatus = COMPLETED (balance.service.ts:515). For a split booking where at least one seat is unpaid at the 30-minute reminder, processPendingPayments() captures the organiser's share plus the unpaid seats and emits PAYMENT_CAPTURED (stats only), but never updates booking.paymentStatus to COMPLETED and never emits PAYMENT_COMPLETED. The 'all participants paid' path (lines 557-574) that does so is only reached from processPayment, i.e. when the last participant pays themselves. So the customer(s) are charged the full amount, but no hold is ever created, ENDED releases nothing, and the reconciler skips the booking.
- **How to reproduce:** Create a split booking with 2 invited players, have only one pay, wait for the 30-minute reminder job: organiser is charged their share + the empty seat; balance_transactions has no booking_completed row for the booking; after the match ends pendingBalance/availableBalance unchanged; reconciler never picks it (paymentStatus stays partially_paid).
- **Impact:** Vendors receive 0 of the revenue for every split/open-match booking in which any seat was covered by the organiser — including the shares that participants did pay. Court+ keeps 100% instead of 20%. The booking still shows as played/paid in the dashboard stats (PAYMENT_CAPTURED increments court/branch/tenant totalRevenue) so the vendor's 'Total Revenue' and their balance disagree.
- **Evidence:**

```
bookings.service.ts:1715  async processPendingPayments(bookingId: string) {
bookings.service.ts:1778-1780  const captureTotal = creatorShare + actualDeduction; await this.paymentsService.completePayment(creatorPayment.id, captureTotal);
bookings.service.ts:1782-1791  this.eventEmitter.emit(BookingEventType.PAYMENT_CAPTURED, {...})   // no paymentStatus update, no PAYMENT_COMPLETED anywhere in 1715-1820
bookings.service.ts:561-574  if (isAllParticipantsPaid && booking.paymentStatus !== PaymentStatus.COMPLETED) { booking.paymentStatus = PaymentStatus.COMPLETED; ... emit(BookingEventType.PAYMENT_COMPLETED
balance.service.ts:455  @OnEvent(BookingEventType.PAYMENT_COMPLETED)
balance.service.ts:515  .where('b."paymentStatus" = :paid', { paid: PaymentStatus.COMPLETED })
```
- **Suggested fix (NOT applied):** At the end of processPendingPayments (when the capture succeeded) set booking.paymentStatus = COMPLETED and emit PAYMENT_COMPLETED inside runOnTransactionCommit, exactly as processPayment does; alternatively make the reconciler consider bookings whose captured payments sum to totalAmount regardless of paymentStatus.

### 32. [HIGH] Refunding a participant of an unsettled split booking debits the vendor for revenue that was never credited (balance and lifetime earnings go negative)

- **Where:** `backend/src/modules/payouts/services/balance.service.ts:421`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** reverseBookingRevenue() never checks that a hold/credit exists for the booking; it only dedupes on a prior BOOKING_REFUNDED row. Revenue for a split booking is held only when paymentStatus reaches COMPLETED. A participant who paid and then leaves (or is removed by the organiser) before settlement is refunded (bookings.service.ts:1034-1041, 1131-1137) and PAYMENT_REFUNDED fires. With no hold for that booking, fromPending = min(pendingBalance, net) takes the money from OTHER bookings' pending revenue, or when nothing is pending, fromAvailable = net and both availableBalance and totalEarnings are decremented for money the vendor never received.
- **How to reproduce:** Split booking, invitee pays, invitee leaves ≥12h before start (or organiser removes them). Check tenant_balances: availableBalance/totalEarnings negative; balance_transactions has booking_refunded -net with no preceding booking_completed for that bookingId.
- **Impact:** A vendor whose open match had one player join, pay 100 SAR and leave 13h before start ends up with availableBalance -80 and totalEarnings -80 and a 'Booking refund −80.00' line in their activity, although they were never credited anything. A negative available balance blocks all payout requests (deductPayout INSUFFICIENT_BALANCE). If the booking later completes, the vendor is under-credited by that net amount permanently.
- **Evidence:**

```
balance.service.ts:406-419  const alreadyReversed = await this.transactionRepo.findOne({ where: { tenantId, bookingId, type: TransactionType.BOOKING_REFUNDED, ...(paymentId ? { paymentId } : {}) } });   // only dedupe, no 'was it credited' check
balance.service.ts:421-425  const fromPending = Math.min(balance.pendingBalance, netAmount); const fromAvailable = Math.round((netAmount - fromPending) * 100) / 100; balance.pendingBalance = ...; balance.availableBalance = ...;
balance.service.ts:430  balance.totalEarnings = Math.round((balance.totalEarnings - fromAvailable) * 100) / 100;
bookings.service.ts:1034-1038  } else if (participant.payment.status === PaymentStatus.COMPLETED) { ... await this.paymentsService.refund(participant.payment.id);
bookings.service.ts:1131-1137  if (participant.paymentId) { ... await this.paymentsService.refund(participant.paymentId); }
```
- **Suggested fix (NOT applied):** In reverseBookingRevenue, look up the booking's own BOOKING_COMPLETED rows: if none exists (revenue never held) skip the reversal (log it); if a hold exists but was not released, debit pending by min(heldAmount, net); if released, debit available. Track per-booking held/released amounts rather than using the aggregate pendingBalance.

### 33. [HIGH] Payout approval is not idempotent and not serialised: no Stripe idempotency key, no row lock/status re-check, and the compensating refund also runs when the failure happens after the transfer succeeded

- **Where:** `backend/src/modules/payouts/providers/stripe-payout.provider.ts:85`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** transfers.create is called without an idempotencyKey (the payout id would be the natural key). approvePayout reads the payout with a plain findOne and checks status === PENDING without a lock; two concurrent approvals (two ops admins, a retried request after a timeout, a double POST) both pass the check and both create a transfer. The catch block also cannot distinguish 'Stripe threw' from 'the DB save at line 143 threw after Stripe succeeded' and refunds the balance in both cases.
- **How to reproduce:** Fire two POST /payouts/:id/approve requests concurrently with a SuperAdmin token; both reach transfers.create before either saves status PROCESSING. Or simulate a DB failure on payoutRepo.save after a successful transfer.
- **Impact:** Duplicate or phantom transfers: a vendor can receive the same payout twice while the balance is deducted once (or, in the save-failure case, not at all). Ops has no way to detect this from the console.
- **Evidence:**

```
stripe-payout.provider.ts:85-94  const transfer = await this.stripe.transfers.create({ amount: toStripeAmount(dto.amount, dto.currency), currency: ..., destination: dto.destinationAccount, metadata: dto.metadata, });   // no second arg { idempotencyKey }
payouts.service.ts:106-116  const payout = await this.payoutRepo.findOne({ where: { id: payoutId } }); ... if (payout.status !== PayoutStatus.PENDING) { throw new BadRequestException('PAYOUT_NOT_PENDING'); }
payouts.service.ts:126-143  try { ... const result = await provider.createPayout({...}); ... await this.payoutRepo.save(payout);
payouts.service.ts:150-156  } catch (error) { await this.balanceService.refundFailedPayout(payout.tenantId, payout.id, payout.amount, payout.currency);
```
- **Suggested fix (NOT applied):** Claim the payout first with a conditional UPDATE (status PENDING -> PROCESSING) or SELECT … FOR UPDATE inside a short transaction; pass { idempotencyKey: `payout:${payout.id}` } to stripe.transfers.create; only refund the balance when the provider call itself failed (flag set before the Stripe call, cleared after), and alert on post-transfer persistence failures.

### 34. [MEDIUM] Payout request/approve accept a settings row with isActive=true but no providerAccountId, producing a Stripe error that is stored and shown to the vendor

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:118`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** requestPayout and approvePayout gate only on `isActive: true`; approvePayout then passes settings.providerAccountId (possibly empty) as the Stripe destination. getAccountStatus() meanwhile defines 'configured' as !!providerAccountId, so the vendor UI and the backend disagree. The live DB already contains exactly this case: tenant c1b01fa6 has providerAccountId '' with isActive = true and a payout that failed with Stripe's raw message.
- **How to reproduce:** With a tenant_payout_settings row where isActive = true and providerAccountId is NULL/'' (as in the seeded QA tenant), request a payout (succeeds) and approve it in ops.
- **Impact:** Ops approval fails with a provider error; the payout flips to FAILED and the vendor's balance is refunded, but the vendor sees a Stripe internal message in their payout history. Any inconsistency between isActive and providerAccountId (webhook ordering, manual fixes) reproduces it.
- **Evidence:**

```
payouts.service.ts:53-59  const settings = await this.settingsRepo.findOne({ where: { tenantId, isActive: true } }); if (!settings) { throw new BadRequestException('PAYOUT_ACCOUNT_NOT_CONFIGURED'); }
payouts.service.ts:118-124  const settings = await this.settingsRepo.findOne({ where: { tenantId: payout.tenantId, isActive: true } });
payouts.service.ts:133  destinationAccount: settings.providerAccountId,
payouts.service.ts:322-325  isConfigured: !!settings.providerAccountId,
live DB payouts.failureReason: "You passed an empty string for 'destination'. We assume empty values are an attempt to unset a parameter; however 'destination' cannot be unset..."
```
- **Suggested fix (NOT applied):** Require settings.providerAccountId (non-empty) in both requestPayout and approvePayout (throw PAYOUT_ACCOUNT_NOT_CONFIGURED); never set isActive without an account id.

### 35. [MEDIUM] Raw provider / internal error text is stored in failureReason and rendered verbatim to the vendor

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:159`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** approvePayout stores error.message (Stripe API text or, per finding 1, 'No hook manager found in context. Are you using @Transactional()?') in payout.failureReason. PayoutsSection renders row.failureReason under the status tag for every payout, untranslated and in English even in the Arabic UI.
- **How to reproduce:** Any failed approval; open Settings -> Payouts as the vendor.
- **Impact:** Vendors see English developer/provider messages in their payout history; leaks implementation details (Stripe parameter names, ORM library names).
- **Evidence:**

```
payouts.service.ts:158-159  payout.status = PayoutStatus.FAILED; payout.failureReason = error.message;
PayoutsSection.js:150-154  {row.failureReason ? (<Text type="secondary" style={{ display: "block", fontSize: 12 }}>{row.failureReason}</Text>) : null}
live DB payouts.failureReason: "You passed an empty string for 'destination'..."
```
- **Suggested fix (NOT applied):** Store a stable code (e.g. PROVIDER_ERROR) in failureReason for the vendor and keep the raw message in payout.metadata for ops; translate codes client-side.

### 36. [MEDIUM] Webhook handlers have no status guards: repeated transfer.reversed events credit the full payout each time, and transfer.created flips a FAILED/CANCELLED payout to COMPLETED

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:217`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** failPayoutFromProvider unconditionally sets FAILED and refunds payout.amount to the balance; Stripe emits transfer.reversed once per reversal (partial reversals are possible, and each has a new event id so idempotency does not dedupe them), so two partial reversals credit 2x the full amount. completePayoutFromProvider unconditionally sets COMPLETED, so a payout that was already FAILED (and refunded to the balance) becomes COMPLETED.
- **How to reproduce:** Reverse a transfer partially twice from the Stripe dashboard; or approve a payout (finding 1 makes it FAILED) and let transfer.created arrive.
- **Impact:** Over-crediting of vendor balances on reversals; inconsistent payout history (a refunded payout shown as Completed).
- **Evidence:**

```
payouts.service.ts:222-239  const payout = await this.payoutRepo.findOne({ where: { providerPayoutId } }); ... payout.status = PayoutStatus.FAILED; ... await this.balanceService.refundFailedPayout(payout.tenantId, payout.id, payout.amount, payout.currency);
payouts.service.ts:200-210  const payout = await this.payoutRepo.findOne({ where: { providerPayoutId } }); ... payout.status = PayoutStatus.COMPLETED; payout.sentAt = new Date();
payouts-webhook.controller.ts:107-115  private async handleTransferReversed(transfer: any) { ... await this.payoutsService.failPayoutFromProvider(transfer.id, 'Transfer reversed by Stripe'); }
```
- **Suggested fix (NOT applied):** Guard transitions: complete only from PROCESSING; on reversal refund only the reversed amount (transfer.amount_reversed delta) and only if not already FAILED; record PAYOUT_COMPLETED ledger rows for auditability.

### 37. [MEDIUM] PENDING_PAYOUT_EXISTS check is a TOCTOU: concurrent requests create two pending payouts

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:65`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** requestPayout counts pending/processing payouts with a plain COUNT before inserting; the balance row lock is only taken later in deductPayout. Two concurrent requests both see 0 and both insert; each is then deducted (if the balance suffices) and both appear in ops for approval.
- **How to reproduce:** Double-submit POST /payouts/request concurrently with an available balance ≥ 2×amount.
- **Impact:** Violates the one-open-request rule the UI advertises; ops must reject duplicates manually.
- **Evidence:**

```
payouts.service.ts:65-74  const pendingPayouts = await this.payoutRepo.count({ where: { tenantId, status: In([PayoutStatus.PENDING, PayoutStatus.PROCESSING]) } }); if (pendingPayouts > 0) { throw new BadRequestException('PENDING_PAYOUT_EXISTS'); }
payouts.service.ts:85-92  await this.payoutRepo.save(payout); await this.balanceService.deductPayout(...)
balance.service.ts:315  const balance = await this.getBalanceForUpdate(tenantId);   // lock taken only here
```
- **Suggested fix (NOT applied):** Take the balance row lock (getBalanceForUpdate) at the start of requestPayout before counting, or add a partial unique index on payouts(tenantId) WHERE status IN ('pending','processing').

### 38. [MEDIUM] Hourly hold reconciler credits bookings that already ended into pendingBalance, where the money is stuck forever

- **Where:** `backend/src/modules/payouts/services/balance.service.ts:507`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** reconcileMissingHolds() selects paid, non-cancelled bookings with no booking_completed ledger row and calls holdBookingRevenue, which only increments pendingBalance. Release happens exclusively in the ENDED handler. A booking whose PAYMENT_COMPLETED handler failed and that ended before the next hourly run gets a hold after ENDED already fired, so nothing ever moves it to availableBalance.
- **How to reproduce:** Make the hold handler fail for a booking (e.g. currency mismatch), let the booking end, wait for the reconciler: booking_completed {held:true} row created, no release ever follows.
- **Impact:** Vendor sees revenue permanently 'On hold – Released after each booking ends' although the booking ended; cannot withdraw it.
- **Evidence:**

```
balance.service.ts:507-521  const missing = await this.bookingRepo.createQueryBuilder('b') ... .where('b."paymentStatus" = :paid', ...) .andWhere('b.status != :cancelled', ...) ... .andWhere('t.id IS NULL')   // no exclusion / special-casing of status COMPLETED
balance.service.ts:531-536  await this.holdBookingRevenue(tenantId, booking.id, amount, ...)
balance.service.ts:609-623  @OnEvent(BookingEventType.ENDED) async handleBookingEnded(...) { ... await this.releaseHeldRevenue(tenantId, booking.id); }
```
- **Suggested fix (NOT applied):** In the reconciler, if booking.status === COMPLETED (or endDate < now) call releaseHeldRevenue immediately after holdBookingRevenue, or credit available directly (addBookingRevenue exists but is unused).

### 39. [MEDIUM] Home 'Total Bookings' counts cancelled bookings while 'Total Revenue' excludes them (live: 7 bookings, 0 revenue, all cancelled)

- **Where:** `backend/src/modules/stats/stats.service.ts:135`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** basicStats COUNT(DISTINCT booking.id) and getTotalBookingsChart have no status filter, whereas getRevenueChart excludes CANCELLED. The vendor's headline card therefore counts cancelled/refunded bookings as bookings. Verified live: GET /stats/tenant returned {totalRevenue:0, totalBookings:7} for a tenant whose 7 bookings are all cancelled or fully refunded.
- **How to reproduce:** Open the dashboard Home for the QA vendor tenant.
- **Impact:** Misleading KPIs on the vendor home page; bookings chart shows activity that never happened.
- **Evidence:**

```
stats.service.ts:135-139  .select(['COALESCE(SUM(payment.amount), 0) as revenue', 'COUNT(DISTINCT booking.id) as totalbookings'])
stats.service.ts:271-279  .select(['DATE(booking.startDate) as date', 'COUNT(booking.id) as count']) .where('booking.courtId IN (:...courtIds)') ... // no status filter
stats.service.ts:201-203  .andWhere('booking.status != :cancelled', { cancelled: BookingStatus.CANCELLED })   // only in revenue chart
live: {"totalRevenue":0,"upcomingBookings":0,"totalBookings":7,...}
```
- **Suggested fix (NOT applied):** Exclude BookingStatus.CANCELLED (and optionally unpaid split bookings) from totalBookings and totalBookingsChart, or add a separate 'Cancelled' KPI.

### 40. [MEDIUM] Currency is hardcoded in revenue displays ('SAR' on Home/Branch/CourtCard, '$' in Branches list) although tenant currency is a free ISO-4217 preference

- **Where:** `dashboard/src/components/home/StatCards.js:37`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The tenant currency is user-settable to any ISO 4217 code (UpdateTenantPreferencesDto @IsISO4217CurrencyCode) and the live DB has a USD tenant with a USD balance, yet the Home revenue card and chart tooltip append t('home.currency') = 'SAR'/'ر.س', Branch.js and CourtCard.js append literal 'SAR', and Branches.js prefixes '$ '. The same vendor thus sees '$ 1,950' in the branches table and '1,950 SAR' on the branch page.
- **How to reproduce:** Set tenant preference currency to USD; open Home, Branches, a Branch page.
- **Impact:** Wrong currency shown to non-SAR tenants; '$' shown to SAR tenants in the Branches list.
- **Evidence:**

```
StatCards.js:36-37  value: stats?.totalRevenue ?? 0, suffix: t("home.currency"),
HomeCharts.js:76-79  formatter={(value) => [`${Number(value).toLocaleString()} ${t("home.currency")}`, ...
Branches.js:89  totalRevenue: "$ " + branch.totalRevenue,
Branch.js:189  {branch?.totalRevenue?.toLocaleString() ?? 0} <span>SAR</span>
CourtCard.js:76  {court?.totalRevenue?.toLocaleString() ?? 0} <span>SAR</span>
update-tenant-preferences.dto.ts:11  @IsISO4217CurrencyCode()
```
- **Suggested fix (NOT applied):** Read the tenant preference currency (or the balance currency) once and format all money with Intl.NumberFormat(locale, {style:'currency', currency}); remove the literal '$ ' and 'SAR'.

### 41. [MEDIUM] No notifications for the payout lifecycle: vendors are never told a payout was approved/rejected/failed and ops is never told a request arrived

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:458`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** 'payout.requested', 'payout.approved', 'payout.rejected', 'payout.completed' and 'payout.failed' are emitted, but the only listeners are the logger stubs in PayoutsService itself; no notification type, e-mail template or i18n content exists for payouts (i18n.ts only has the error codes at 317-324). The vendor copy promises review ('Requests are reviewed by Court+ before the transfer is sent') but the outcome is discoverable only by re-opening Settings -> Payouts.
- **How to reproduce:** Request a payout as a vendor; reject it in ops; observe no in-app/e-mail/push notification on either side.
- **Impact:** Vendors do not learn that a payout was rejected (with reason) or failed; ops does not learn about new requests without polling the Payouts page.
- **Evidence:**

```
payouts.service.ts:458-471  @OnEvent('payout.requested') async onPayoutRequested(payload) { this.logger.log(`Payout requested: ${payload.payout.id}`); } ... @OnEvent('payout.failed') ... this.logger.log(...)
grep 'payout.' across src: no other @OnEvent listeners
en.json settings.payouts.requestHint: "Minimum {{amount}} {{currency}} per request. Requests are reviewed by Court+ before the transfer is sent."
```
- **Suggested fix (NOT applied):** Add NotificationType PAYOUT_REQUESTED (ops/SuperAdmin), PAYOUT_APPROVED/REJECTED/COMPLETED/FAILED (tenant owner) with EN/AR content and e-mail templates, wired to the existing events.

### 42. [MEDIUM] Payouts tab is shown to Admin/User staff although every payouts endpoint is Owner-only: they see zero balances and a 'Set up payouts' button that returns 403

- **Where:** `dashboard/src/pages/Settings.js:479`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Settings renders the Payouts tab for any signed-in staff, but /payouts/balance, /transactions, /account/status, /account/onboard, /request and GET /payouts are all @AuthorizedUserType.isStaff([StaffRole.OWNER]). For a non-owner every query 403s silently (react-query default), so the section shows 0.00 balances, 'No payouts yet' and the info banner 'Set up your payout account to receive your earnings' with a primary button whose click yields 'You don't have permission to do this.'
- **How to reproduce:** Log in as an Admin-role staffer, open Settings -> Payouts, click 'Set up payouts'.
- **Impact:** Admins are shown a fake empty state and a dead call-to-action; confusion about whether the venue has earnings.
- **Evidence:**

```
Settings.js:478-482  { key: "payouts", label: t("settings.payouts.title"), children: <PayoutsSection /> },   // no role check anywhere in Settings.js
payouts.controller.ts:45  @AuthorizedUserType.isStaff([StaffRole.OWNER])  (also lines 52, 75, 94, 105, 119)
PayoutsSection.js:207-229  const configured = !!account?.isConfigured; return (<Alert type={configured ? "warning" : "info"} ... action={<Button ... onClick={() => onboardingMutation.mutate()}>
```
- **Suggested fix (NOT applied):** Hide the tab (or render an 'Owner only' notice) unless the current staff role is Owner; treat 403 on the balance query as 'not permitted' rather than 0.

### 43. [MEDIUM] Vendor UI only treats 'pending' as blocking, backend blocks on pending OR processing: request form is enabled during PROCESSING and fails with 'A payout request is already pending'

- **Where:** `dashboard/src/components/settings/PayoutsSection.js:85`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** hasPending is computed from status === 'pending' only, while requestPayout rejects when any PENDING or PROCESSING payout exists. After approval the payout is PROCESSING until the transfer.created webhook is processed (which, per the webhook race, may take a Stripe retry cycle; if the platform webhook endpoint is not configured it stays PROCESSING forever). During that time the vendor can type an amount and submit, only to get PENDING_PAYOUT_EXISTS, with no banner explaining why.
- **How to reproduce:** Approve a payout, then as the vendor submit a new request before the webhook lands.
- **Impact:** Confusing error for vendors right after an approval; permanently stuck vendors if the webhook is not delivered.
- **Evidence:**

```
PayoutsSection.js:85  const hasPending = (payouts?.items || []).some((p) => p.status === "pending");
PayoutsSection.js:235-236  const canRequest = isReady && !hasPending && available >= MIN_PAYOUT_AMOUNT && !loadingBalance;
payouts.service.ts:65-73  status: In([PayoutStatus.PENDING, PayoutStatus.PROCESSING]) ... throw new BadRequestException('PENDING_PAYOUT_EXISTS');
```
- **Suggested fix (NOT applied):** Treat 'processing' as pending in the UI (and in the pendingRequest banner); optionally add a status refresh from Stripe for PROCESSING payouts older than N hours.

### 44. [MEDIUM] Ops Payouts page does not refresh after a failed approval: row keeps 'pending' with Approve/Reject buttons although the backend already marked it FAILED

- **Where:** `ops/src/pages/PayoutsPage.tsx:59`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** approveMutation.onError only shows a toast; refresh() is called only onSuccess. Since approvePayout marks the payout FAILED and refunds the balance before throwing PAYOUT_CREATION_FAILED (400), the list is stale: the operator sees 'Failed to create the payout. Please try again.' and a still-pending row, retries, and gets 'This payout is not pending.'
- **How to reproduce:** Approve a payout whose Stripe transfer fails.
- **Impact:** Operators act on stale state and get contradictory errors; with finding 1 this happens on every approval.
- **Evidence:**

```
PayoutsPage.tsx:53-60  const approveMutation = useMutation({ mutationFn: approvePayout, onSuccess: () => { message.success(...); refresh(); }, onError: (e) => message.error(apiErrorMessage(e, "Failed to approve payout")), });
payouts.service.ts:158-162  payout.status = PayoutStatus.FAILED; ... await this.payoutRepo.save(payout); throw new BadRequestException('PAYOUT_CREATION_FAILED');
```
- **Suggested fix (NOT applied):** Call refresh() in onError (or onSettled) for both mutations.

### 45. [MEDIUM] Revenue/bookings charts bucket by DATE(booking.startDate) in the DB session timezone, not the court's timezone; dashboard then parses the day as UTC

- **Where:** `backend/src/modules/stats/stats.service.ts:195`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Courts carry a schedule timeZone (schedule.entity.ts:28) but the chart queries group by DATE(booking.startDate) with no AT TIME ZONE, so the day boundary is the Postgres session timezone (UTC in a default container). A Riyadh booking at 00:30 local is charted on the previous calendar day. On the client, HomeCharts does new Date('YYYY-MM-DD') which is UTC midnight, then toLocaleDateString — for any viewer west of UTC the label shifts back one more day.
- **How to reproduce:** Book a court at 00:30 Asia/Riyadh; on a UTC database the revenue point appears on the previous date.
- **Impact:** Daily revenue/bookings attributed to the wrong day for evening/night bookings; vendors reconcile against their own day-based records and see discrepancies.
- **Evidence:**

```
stats.service.ts:195  'DATE(booking.startDate) as date',
stats.service.ts:205  .groupBy('DATE(booking.startDate)')
stats.service.ts:273,277  'DATE(booking.startDate) as date' ... .groupBy('DATE(booking.startDate)')
HomeCharts.js:16-17  const formatPointDate = (x, language) => new Date(x).toLocaleDateString(language, { month: "short", day: "numeric" });
schedule.entity.ts:28  timeZone: string = 'UTC';
```
- **Suggested fix (NOT applied):** Group by DATE(booking.startDate AT TIME ZONE court_schedule.timeZone) (join schedule) or by the tenant's timezone; on the client parse the point as a local date (split the string) rather than via Date parsing.

### 46. [LOW] Ledger never shows 'Payout sent' and shows '+0.00 Booking revenue' hold rows; negative adjustments would render with a plus sign

- **Where:** `dashboard/src/components/settings/PayoutsSection.js:181`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** holdBookingRevenue writes a booking_completed row with amount 0 (the held amount lives in metadata), which the activity table renders as '+0.00 SAR Booking revenue' (seen live: two such rows for the QA vendor). completePayoutFromProvider writes no PAYOUT_COMPLETED row, so the translated 'Payout sent' type is unreachable and a completed payout leaves only 'Payout requested'. The sign is decided by type membership (CREDIT_TYPES) rather than by the amount's sign, so a negative 'adjustment' would show '+'.
- **How to reproduce:** Open Settings -> Payouts -> Recent balance activity after a paid booking.
- **Impact:** Confusing activity feed; vendors cannot see when a payout was actually sent.
- **Evidence:**

```
balance.service.ts:259-268  this.transactionRepo.create({ tenantId, type: TransactionType.BOOKING_COMPLETED, amount: 0, currency, bookingId, metadata: { held: true, heldAmount: netAmount } })
payouts.service.ts:198-215  completePayoutFromProvider ... payout.status = COMPLETED; payout.sentAt = new Date();   // no transactionRepo write
PayoutsSection.js:42  const CREDIT_TYPES = new Set(["booking_completed", "payout_failed", "adjustment"]);
PayoutsSection.js:182-187  const credit = CREDIT_TYPES.has(row.type); ... {credit ? "+" : "−"}{formatMoney(Math.abs(Number(value || 0)), ...)}
live /payouts/transactions: {"type":"booking_completed","amount":0,..."metadata":{"held":true,"heldAmount":400}}
```
- **Suggested fix (NOT applied):** Render held rows as 'On hold +heldAmount' (use metadata.heldAmount) or skip them; write a PAYOUT_COMPLETED ledger row (amount 0 or informational) when the transfer completes; derive the sign from Math.sign(amount).

### 47. [LOW] transfer.created webhook can arrive before providerPayoutId is persisted, answering 404 and leaving the payout PROCESSING until Stripe retries

- **Where:** `backend/src/modules/payouts/controllers/payouts-webhook.controller.ts:104`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Stripe emits transfer.created synchronously with transfers.create; the payout row gets providerPayoutId only after the API call returns (payouts.service.ts:140-143). completePayoutFromProvider looks the payout up by providerPayoutId and throws NotFoundException when the row is not there yet; the controller releases the idempotency claim and returns a 404, so completion waits for Stripe's retry schedule.
- **How to reproduce:** Approve a payout with the webhook endpoint pointed at the app; observe a 404 for the first transfer.created delivery.
- **Impact:** Payout shows 'Processing' (and blocks new requests, see UI finding) for minutes to hours; webhook error noise.
- **Evidence:**

```
payouts-webhook.controller.ts:104  await this.payoutsService.completePayoutFromProvider(transfer.id);
payouts.service.ts:200-206  const payout = await this.payoutRepo.findOne({ where: { providerPayoutId } }); if (!payout) { throw new NotFoundException('PAYOUT_NOT_FOUND'); }
payouts.service.ts:129-143  const result = await provider.createPayout({...}); payout.providerPayoutId = result.providerPayoutId; ... await this.payoutRepo.save(payout);
```
- **Suggested fix (NOT applied):** Look the payout up by transfer.metadata.payoutId (already sent) instead of providerPayoutId, or return 200 and schedule a short retry when the row is not yet linked.

### 48. [LOW] Payout history and balance activity are capped at 10 rows with pagination disabled

- **Where:** `dashboard/src/components/settings/PayoutsSection.js:75`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Both lists are fetched with pageSize 10 and rendered with pagination={false}; the backend supports paging. After ten payouts or ten ledger entries the vendor cannot see older history.
- **How to reproduce:** Vendor with more than 10 ledger entries (a single booking generates 2-3).
- **Impact:** No access to older payouts/ledger rows from the UI.
- **Evidence:**

```
PayoutsSection.js:73-80  queryFn: () => listPayouts({ page: 1, pageSize: 10 }) ... queryFn: () => listPayoutTransactions({ page: 1, pageSize: 10 })
PayoutsSection.js:352  pagination={false}
PayoutsSection.js:365  pagination={false}
```
- **Suggested fix (NOT applied):** Enable antd Table pagination bound to page/pageSize state and the API's pagination.totalCount.

### 49. [LOW] Per-share commission rounding on split refunds can leave ±0.01 permanently in pendingBalance versus the single hold on totalAmount

- **Where:** `backend/src/modules/payouts/services/balance.service.ts:400`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The hold is computed once as splitAmount(totalAmount) (e.g. 100 → net 80.00), but each participant refund is reversed as splitAmount(share) rounded to 2dp (3 shares of 33.33/33.33/33.34 → nets 26.66+26.66+26.67 = 79.99). After a full cancellation 0.01 stays in pendingBalance forever (or −0.01 when it rounds the other way).
- **How to reproduce:** Split booking of 100 SAR among 3 players, all pay, organiser cancels ≥12h before.
- **Impact:** Ledger/balance never reconcile to zero for cancelled split bookings; small residues accumulate.
- **Evidence:**

```
balance.service.ts:193-197  const platformFee = Math.round(amount * this.commissionRate * 100) / 100; const netAmount = Math.round((amount - platformFee) * 100) / 100;
balance.service.ts:254  const { platformFee, netAmount } = this.splitAmount(amount);   // hold on booking.totalAmount
balance.service.ts:400  const { netAmount } = this.splitAmount(refundedAmount);   // per payment
```
- **Suggested fix (NOT applied):** On the last refund of a booking, reverse the remainder of the booking's held/credited amount rather than a freshly rounded share (track per-booking held amount).

### 50. [LOW] Refund reversal after release debits the aggregate pendingBalance of other bookings instead of availableBalance, overstating withdrawable funds later

- **Where:** `backend/src/modules/payouts/services/balance.service.ts:421`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** fromPending = min(balance.pendingBalance, net) uses the tenant-wide pending total, not this booking's hold. If a booking whose revenue was already released is refunded while other bookings are still pending, the refund is taken from the other bookings' pending money; when those release, availableBalance ends up higher than the money actually earned and pendingBalance goes negative. Today app flows refuse refunds after start (bookings.service.ts:921-931), so this is latent, but the unit test 'falls through to available balance once revenue has been released' documents the intended behaviour and the implementation does not meet it whenever any other booking is pending.
- **How to reproduce:** A (net 400) released → available 400; B (net 400) pending; refund A: pending 0, available 400; release B: available 800, pending −400.
- **Impact:** If any post-release refund path is added (disputes, ops refunds, staff cancellation of ended bookings), vendors could withdraw more than earned.
- **Evidence:**

```
balance.service.ts:421-425  const fromPending = Math.min(balance.pendingBalance, netAmount); const fromAvailable = Math.round((netAmount - fromPending) * 100) / 100; balance.pendingBalance = ...; balance.availableBalance = ...;
balance.service.spec.ts:161  it('falls through to available balance once revenue has been released'
```
- **Suggested fix (NOT applied):** Decide the bucket per booking: if a release row exists for the booking, debit available; else debit min(heldAmount, net) from pending.

### 51. [LOW] Ops rejection reason is shown verbatim to the vendor as the payout's failure reason

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:181`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** rejectPayout stores the operator's free-text reason in failureReason, which the vendor's payout history renders under the 'Rejected' tag. The ops modal does not indicate that the text is customer-visible; the live DB already holds a reason 'Suspicious activity'.
- **How to reproduce:** Reject a payout in ops with an internal note; view as the vendor.
- **Impact:** Internal notes leak to vendors; potential for hostile wording reaching customers.
- **Evidence:**

```
payouts.service.ts:180-182  payout.status = PayoutStatus.CANCELLED; payout.failureReason = reason;
PayoutsSection.js:150-154  {row.failureReason ? (<Text type="secondary" ...>{row.failureReason}</Text>) : null}
live DB payouts.failureReason: 'Suspicious activity'
```
- **Suggested fix (NOT applied):** Label the ops field 'Reason (visible to the vendor)' or split into vendor-facing reason + internal note.

### 52. [LOW] Home header shows 'Published' for any tenant with a name, regardless of subscription or approved courts

- **Where:** `dashboard/src/components/home/WelcomeHeader.js:9`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Status is derived purely from tenant.blockedAt and tenant.name; a new vendor with no subscription and no approved court sees a green 'Published' tag while the subscribe banner below says courts are not published.
- **How to reproduce:** Open Home as a freshly signed-up vendor.
- **Impact:** Contradictory status signals on the landing page.
- **Evidence:**

```
WelcomeHeader.js:9-13  const status = tenant?.blockedAt ? "blocked" : tenant?.name ? "published" : "unpublished";
Home.js:60-66  const hasSubscription = ["active", "past_due", "trialing"].includes(billingOverview?.subscription?.status); const showSubscribeBanner = ... ((billingOverview && !billingOverview.subscription) || pendingCharges?.count > 0);
```
- **Suggested fix (NOT applied):** Base the tag on hasSubscription and at least one approved court (or drop it).

### 53. [LOW] Revenue KPI animation rounds money to whole units and formats without the active locale

- **Where:** `dashboard/src/components/home/useCountUp.js:20`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** useCountUp ends at Math.round(target) so a totalRevenue of 1,234.56 is displayed as 1,235; StatCard then calls toLocaleString() with no locale, so Arabic UI shows Latin grouping.
- **How to reproduce:** Tenant with fractional revenue.
- **Impact:** Inaccurate money on the dashboard headline.
- **Evidence:**

```
useCountUp.js:20  setValue(Math.round(numericTarget * eased));
StatCards.js:20  {animatedValue.toLocaleString()}
```
- **Suggested fix (NOT applied):** Keep two decimals for the revenue card (or skip the count-up for money) and pass i18n.language to toLocaleString.

### 54. [LOW] Stripe Express onboarding hardcodes business_type 'company' and builds return URLs from an optional FRONTEND_URL

- **Where:** `backend/src/modules/payouts/providers/stripe-payout.provider.ts:38`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** All vendors are onboarded as companies, so sole-proprietor venues are forced through company KYC. refresh_url/return_url are `${FRONTEND_URL}/settings?...` while FRONTEND_URL is Joi optional (validation.ts:49) and empty in .env.example, giving 'undefined/settings?payouts=complete' which Stripe rejects. The default account country 'SA' has never been exercised against Stripe test mode (PRODUCTION-READINESS 'Still open').
- **How to reproduce:** Deploy without FRONTEND_URL; call POST /payouts/account/onboard.
- **Impact:** Onboarding fails at boot-config level if FRONTEND_URL is unset; individual vendors cannot pass KYC as 'company'.
- **Evidence:**

```
stripe-payout.provider.ts:38-41  business_type: 'company', company: { name: businessInfo.businessName },
stripe-payout.provider.ts:49-50  refresh_url: `${this.configService.get('FRONTEND_URL')}/settings?payouts=refresh`, return_url: `${this.configService.get('FRONTEND_URL')}/settings?payouts=complete`,
validation.ts:49  FRONTEND_URL: Joi.string().uri().optional(),
payouts.service.ts:368-372  country: (country || this.configService.get<string>('payouts.defaultCountry') || 'SA').toUpperCase(),
```
- **Suggested fix (NOT applied):** Make FRONTEND_URL required (or required when payouts are enabled); accept business_type from the vendor (default 'individual' or ask in the UI); verify SA/EG Express onboarding in Stripe test mode before launch.

### 55. [LOW] GET /stats/tenant is open to SuperAdmin tokens with no tenantId and then aggregates across all tenants

- **Where:** `backend/src/modules/stats/stats.controller.ts:21`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The controller allows any staff role; a SuperAdmin session has tenantId undefined. tenantsRepository.findOne({ where: { id: undefined } }) matches the first tenant (TypeORM drops undefined conditions), branchesRepository.find({ where: { tenantId: undefined } }) returns every branch, and the stats/charts are computed across the whole platform in one request.
- **How to reproduce:** GET /stats/tenant with the ops SuperAdmin bearer token.
- **Impact:** Unbounded cross-tenant aggregation query reachable with an ops token; not used by the ops console today.
- **Evidence:**

```
stats.controller.ts:21  @AuthorizedUserType.isStaff()
stats.controller.ts:39-43  return this.statsService.getTenantStats({ tenantId: user.tenantId, ...
stats.service.ts:69-79  const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } }); ... const branches = await this.branchesRepository.find({ where: { tenantId }, select: ['id'] });
```
- **Suggested fix (NOT applied):** Restrict to tenant roles (isStaff([OWNER, ADMIN, USER])) or 404 when user.tenantId is missing.

### 56. [LOW] Payout amount stored as double precision while every other money column is numeric(14,2)

- **Where:** `backend/src/modules/payouts/entities/payout.entity.ts:15`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Payout.amount is @Column('float') (live: double precision) whereas TenantBalance, BalanceTransaction, Payment and Booking money are numeric with a rounding transformer. The same value therefore round-trips through binary floating point between request, deduction, refund and Stripe conversion.
- **How to reproduce:** Compare payouts.amount with the payout_requested ledger row for amounts like 0.1-multiples over time.
- **Impact:** Precision inconsistency in the money layer; ledger sums vs payout amounts can differ in the last cent after many operations.
- **Evidence:**

```
payout.entity.ts:15-16  @Column('float')\n  amount: number;
live DB payouts: amount | double precision | not null
tenant-balance.entity.ts:17  @Column('numeric', { precision: 14, scale: 2, default: 0, transformer: moneyTransformer })
```
- **Suggested fix (NOT applied):** Migrate payouts.amount to numeric(14,2) with the moneyTransformer.

### 57. [LOW] Tenant stats load courts with one query per branch (N+1)

- **Where:** `backend/src/modules/stats/stats.service.ts:88`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** getTenantStats loops over branches and issues courtsRepository.find per branch, then runs five aggregate queries; a tenant with many branches pays a query per branch on every Home load.
- **How to reproduce:** Tenant with 20 branches: 20 court queries per dashboard load.
- **Impact:** Slower Home page for multi-branch vendors.
- **Evidence:**

```
stats.service.ts:88-94  for (const branchId of branchIds) { const courts = await this.courtsRepository.find({ where: { branchId }, select: ['id'] }); allCourtIds.push(...courts.map((court) => court.id)); }
```
- **Suggested fix (NOT applied):** Single query: courtsRepository.find({ where: { branchId: In(branchIds) }, select: ['id'] }) or join branches -> courts in the aggregate queries.

---

## 3. Booking lifecycle (backend)

32 issues — 1 critical, 11 high, 11 medium, 9 low.

### 58. [CRITICAL] Open/split booking with no invitees is charged in full immediately, then treated as a HOLD: cannot settle, cannot cancel, cannot refund

- **Where:** `backend/src/modules/bookings/bookings.service.ts:217`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** For a SPLIT booking (the default for every open match created from the app) the organiser's hold is holdAmount = total - total/(invitees+1). With zero invitees holdAmount is 0, so StripeService creates the PaymentIntent with capture_method 'automatic' and the full price is captured at confirmation. processParticipantPayment nevertheless sets the payment to HOLD and the booking to PARTIALLY_PAID because paymentType is SPLIT. Every later path assumes an uncaptured authorisation: when a joiner pays, completePayment() calls paymentIntents.capture on an already-captured PI (Stripe error, webhook throws, joiner's seat rolls back and Stripe retries for 3 days); when the organiser cancels, release() calls paymentIntents.cancel on a succeeded PI (502, transaction rolled back, no refund).
- **How to reproduce:** Create an open match from the app without picking participants (SPLIT, participants []), pay. Payment row = HOLD although Stripe shows the full amount captured. Cancel the booking -> 502 PAYMENT_PROVIDER_ERROR, nothing refunded.
- **Impact:** Organiser of an open match without invitees pays the whole court up front; the booking is shown as partially paid forever, the vendor is never credited (no PAYMENT_COMPLETED), any joiner who pays is charged with no seat and no refund, and the organiser cannot cancel to get money back.
- **Evidence:**

```
bookings.service.ts:216-220  if (paymentType === PaymentType.SPLIT) { const playerAmount = bookingAmount / (participants.length + 1); const holdAmount = bookingAmount - playerAmount; paymentInfo.amount = playerAmount; paymentInfo.holdAmount = holdAmount;
stripe.service.ts:79  capture_method: holdAmount ? 'manual' : 'automatic',
bookings.service.ts:447-451  if (data?.paymentType === PaymentType.WHOLE) { payment.status = PaymentStatus.COMPLETED; } else { payment.status = PaymentStatus.HOLD; }
bookings.service.ts:456-458  paymentStatus: data?.paymentType === PaymentType.WHOLE ? PaymentStatus.COMPLETED : PaymentStatus.PARTIALLY_PAID
payments.service.ts:504  await this.stripeService.capturePayment(providerPaymentId, { amount_to_capture: ... })  // on a captured PI -> StripeInvalidRequestError
payments.service.ts:425  await this.stripeService.releasePayment(payment.providerPaymentId);  // cancel() path for HOLD -> 502 on a succeeded PI
courtplusmobile ConfirmMatch.logic.ts:36-48  createBookingMutation({ ..., participants: participants?.map(p => p.id) ?? [], paymentType: PaymentType.SPLIT, open: true, ... })
```
- **Suggested fix (NOT applied):** Never create a manual-capture flow with holdAmount 0: if participants.length === 0 either treat the booking as WHOLE for the organiser (status COMPLETED, PAYMENT_CAPTURED emitted, refund path) or reject SPLIT without invitees for non-open bookings and, for open matches, authorise the full amount with capture_method manual (holdAmount = total - share where share is computed against playersASide*2 seats).

### 59. [HIGH] Organiser who lists themself (or a duplicate id) as a participant is charged, booking creation crashes on the unique index, no refund and Stripe retries for 3 days

- **Where:** `backend/src/modules/bookings/participants.service.ts:46`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** CreateBookingDto only requires unique UUIDs; nothing excludes the caller's own id, deleted users (users.count has no deletedAt filter) or validates participants at all when open=true (ValidateIf(!open)). Participants are only materialised in create(), which runs inside the charge.succeeded webhook after the card has been charged. createParticipants pushes a creator row with the same (bookingId,userId) as the invitee row, the unique index throws a QueryFailedError (not an HttpException), isUnbookable() is false, the error is rethrown, the idempotency claim is released and Stripe retries the same event for three days. No booking, no refund.
- **How to reproduce:** POST /bookings with participants containing the caller's own user id (or any id twice via open:true which skips ArrayUnique), pay the intent; webhook logs a 23505 unique violation and Stripe keeps retrying.
- **Impact:** Customer money captured with no booking and no automatic refund; slot reservation stays until TTL; support has to refund manually.
- **Evidence:**

```
create-booking.dto.ts:53-58  @IsArray() @IsUUID(undefined,{each:true}) @ValidateIf((o) => !o.open) @IsOptional() @ArrayUnique() participants?: string[];
participants.service.ts:46-62  participants = userIds.map(...); ... if (user.type === UserType.Customer && creatorPaymentId) { const creator = new Participant(); creator.userId = user.id; ... participants.push(creator); }
participant.entity.ts:25  @Index(['bookingId', 'userId'], { unique: true })
payments.service.ts:267-273  return (!payment.bookingId && error instanceof HttpException && error.getStatus() < 500);
payments.service.ts:164-171  try { await this.bookingsService.processParticipantPayment(payment); } catch (error) { if (this.isUnbookable(payment, error)) { ... return; } throw error; }
users.service.ts:173-175  async count(where) { return this.usersRepository.count({ where }); }  // no deletedAt filter
```
- **Suggested fix (NOT applied):** Validate participants in book() before creating the PaymentIntent (exclude sessionUser.id, require existing non-deleted users, enforce MAX_PARTICIPANTS_PER_BOOKING) and drop the ValidateIf(!open) so the array is always validated; treat QueryFailedError unique violations in processPayment as unbookable (refund).

### 60. [HIGH] Open-match join is unreachable: the app's 'Book now' calls POST /bookings/:id/pay for a non-participant and always gets 404; no client calls /join or /request/respond

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/OpenMatch/OpenMatch.logic.ts:38`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The Open Matches screen renders a 'Book now' button for every match the user did not create and wires it to payMatch (POST /bookings/:id/pay). The controller looks the caller up among the booking's participants and throws PARTICIPANT_NOT_FOUND when they are not one. Nothing in mobile, dashboard or ops calls POST /bookings/:id/join or POST /bookings/:id/request/respond, so joining, and the organiser's approve/reject of join requests (autoAccept=false), cannot happen from any client. Participants stuck in pending_approval in the DB (booking aa000000-...-a1) confirm it.
- **How to reproduce:** Log in as customer 2, open Open Matches, tap Book now on any match -> snackbar PARTICIPANT_NOT_FOUND.
- **Impact:** The social/open-match feature advertised in the app does not work: every 'Book now' shows 'We couldn't find that participant.'; organisers can never approve requests.
- **Evidence:**

```
OpenMatch.component.tsx:34-43  <OpenMatchItem showBookNowButton={!isMyBooking} booking={item} onBookNowPress={() => handlePay(item)} />
OpenMatch.logic.ts:38-40  const response = await payMatchMutation({ id: booking.id });
bookings.controller.ts:185-189  const participants = await this.participantsService.getParticipants(id); const participant = participants.find(p => p.userId === user.id); if (!participant) { throw new NotFoundException(PARTICIPANT_NOT_FOUND); }
grep '/join|request/respond' courtplusmobile/src dashboard/src ops/src -> no matches
GET /bookings/open (customer) -> participant status 'pending_approval' on aa000000-0000-4000-8000-0000000000a1 (never approvable)
```
- **Suggested fix (NOT applied):** Wire 'Book now' to POST /bookings/:id/join (then present the payment sheet with the returned PaymentResponseDto for split matches), add an approve/reject UI for the organiser on booking_join_request_submitted notifications calling /request/respond with the requester's userId, and hide the button for existing participants.

### 61. [HIGH] POST /bookings/:id/respond lets a join-requester approve themself (and lets a cancelled participant re-join) because it only rejects status READY

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1362`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** respondToBookingInvitation is meant for invited participants (pending_response). Its only guard is `status === READY`, and the accept branch writes the new status with repository.update, bypassing the state machine. A user who joined an approval-required open match (status pending_approval) can call /respond {accept:true} and become READY / PENDING_PAYMENT without the organiser's approval; a participant who left (cancelled) can re-accept and re-enter the match, bypassing the 12h cut-off and the max-participant check.
- **How to reproduce:** Join an autoAccept=false open match (participant pending_approval), then POST /bookings/:id/respond {"accept":true} as the same user -> status becomes ready.
- **Impact:** Organiser's approval requirement is meaningless; strangers can force themselves into a match (and for WHOLE bookings play for free).
- **Evidence:**

```
bookings.service.ts:1362-1367  if (participant.status === ParticipantStatus.READY) { ... throw new ForbiddenException(ALREADY_RESPONDED); }
bookings.service.ts:1369-1374  if (accept) { const newStatus = ...WHOLE ? ParticipantStatus.READY : ParticipantStatus.PENDING_PAYMENT; const result = await this.participantsService.update({ id: participant.id }, { status: newStatus });
bookings.service.ts:1640-1645  participant = await this.participantsService.create({ userId: sessionUser.id, bookingId, status: ParticipantStatus.PENDING_APPROVAL });
```
- **Suggested fix (NOT applied):** Require participant.status === PENDING_RESPONSE (use transitionParticipantStatus with ACCEPT/ACCEPT_FREE) and return 400 otherwise.

### 62. [HIGH] joinBooking has no booking status/time guard and GET /bookings/open lists past and cancelled matches, so customers can join and pay for cancelled or finished bookings

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1563`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** joinBooking only checks `booking.open`; it never checks status (cancelled/completed/in_progress) or that startDate is in the future. For a split match it immediately creates a PaymentIntent and the webhook marks the participant READY without any status check either. The open listing has no default status/date filter and the mobile passes only page, so the Open Matches screen shows July matches that are already completed (live result).
- **How to reproduce:** POST /bookings/94a7a177-f592-480c-90d1-9657b05a5238/join (open, cancelled) -> participant created; for a split match a PaymentIntent is returned.
- **Impact:** Customers see stale matches and can be charged for a seat in a match that is over or cancelled; vendor balance is credited for it.
- **Evidence:**

```
bookings.service.ts:1563-1568  if (!booking.open) { ... throw new ForbiddenException(BOOKING_NOT_OPEN); }   // no status / startDate check
bookings.service.ts:1692-1694  if (booking.paymentType === PaymentType.SPLIT) { return this.pay(participant); }
bookings.service.ts:478-506  const booking = await this.findOne({ id: bookingId }); ... payment.status = PaymentStatus.COMPLETED; ... transitionParticipantStatus(participant, READY)   // no booking.status check
bookings.service.ts:723-727  if (openBookings) { qb.andWhere('booking.open = :open', ...) }   // no status/startDate default
live GET /bookings/open as customer 2 -> items: aa000000-...-b1 completed 2026-07-27, aa000000-...-a1 completed, 67b85659 completed (today is 2026-09-25); DB also has 94a7a177 open+cancelled
```
- **Suggested fix (NOT applied):** In joinBooking reject when status !== PENDING or startDate <= now (and ideally inside the cancellation window); in processParticipantPayment refuse/refund payments for non-pending bookings; default the /open listing to status=pending and startDate>=now.

### 63. [HIGH] Split shares are computed three different ways (creation, /pay, settlement) so the sum collected never equals the court price when anyone declines, joins, leaves or is added

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1231`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** book() fixes the organiser's share as total/(invitees+1) at creation. pay() charges each participant total/booking.participants.length at the moment they pay (this count includes the creator, cancelled leavers and pending invitees, and changes as people decline (row deleted), join or are added). processPendingPayments deducts total/participants.length per unpaid seat. Example: 100 SAR, organiser + 3 invitees -> organiser 25, hold 75; one invitee declines (row deleted); the two others pay 33.33 each; organiser captured 25 -> 91.67 collected. Open match with 1 invitee + 1 joiner: organiser 50, both others pay 33.33 -> 116.67 collected. BalanceService then holds booking.totalAmount regardless of what was actually captured.
- **How to reproduce:** Split booking with 3 invitees, one declines, others pay -> compare Stripe captures with totalAmount.
- **Impact:** Customers over- or under-pay their share; the vendor is credited the list price while Stripe captured a different sum; the platform eats the difference.
- **Evidence:**

```
bookings.service.ts:217  const playerAmount = bookingAmount / (participants.length + 1);
bookings.service.ts:1231-1233  const amount = (booking.hourlyRate * (booking.duration / BOOKING.MINUTES_PER_HOUR)) / booking.participants.length;
bookings.service.ts:1759-1762  const totalParticipants = participants.length; const amountPerParticipant = booking.totalAmount / totalParticipants; const totalToDeduct = amountPerParticipant * participantsWithPendingPayments.length;
bookings.service.ts:1410  await this.participantsService.delete(participant.id);   // decline removes the row, changing the divisor
balance.service.ts:463,479  const amount = Number(booking.totalAmount); ... await this.holdBookingRevenue(tenantId, booking.id, amount, ...)
```
- **Suggested fix (NOT applied):** Freeze the per-seat share on the booking at creation (e.g. booking.sharePerSeat = total / seats where seats = playersASide*2 for open matches or invitees+1 otherwise), use it in pay() and settlement, and credit the vendor with the actually captured sum (sum of PAYMENT_CAPTURED).

### 64. [HIGH] After a participant leaves and is refunded, the organiser's hold is never captured and the booking stays PARTIALLY_PAID, so the vendor gets nothing for that booking

- **Where:** `backend/src/modules/bookings/bookings.service.ts:526`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Leaving (before settlement) refunds the participant and sets the booking back to PARTIALLY_PAID but the participant row stays with status CANCELLED and payment REFUNDED. From then on `allNonCreatorsPaid` can never be true (CANCELLED != READY), so the organiser's share is never captured when the others pay. At the 30-minute settlement the leaver is not counted as an unpaid seat either (REFUNDED is not PENDING/FAILED), so if nobody else is pending the function returns null: the organiser's authorisation is never captured and expires, the booking never reaches PAYMENT_COMPLETED and BalanceService never holds any revenue for it.
- **How to reproduce:** Split booking A+B+C; B and C pay; B leaves >12h before start (refunded). C's payment already happened; nothing captures A. At T-30 processPendingPayments returns null.
- **Impact:** Vendor loses the organiser's share and the leaver's share; the organiser plays without paying; booking shows 'pending' payment in the dashboard forever.
- **Evidence:**

```
bookings.service.ts:1034-1042  } else if (participant.payment.status === PaymentStatus.COMPLETED) { await this.paymentsService.refund(participant.payment.id); await this.bookingsRepository.update(id, { paymentStatus: PaymentStatus.PARTIALLY_PAID }); }
bookings.service.ts:1056  this.participantsService.transitionParticipantStatus(participant, ParticipantStatus.CANCELLED);
bookings.service.ts:526-529  const allNonCreatorsPaid = nonCreatorParticipants.every((p) => p.status === ParticipantStatus.READY && p.payment?.status === PaymentStatus.COMPLETED);
bookings.service.ts:1728-1740  const participantsWithPendingPayments = participants.filter((p) => !p.isCreator && (!p.payment || [PaymentStatus.PENDING, PaymentStatus.FAILED].includes(p.payment.status))); if (participantsWithPendingPayments.length === 0) { ... return null; }
```
- **Suggested fix (NOT applied):** Exclude CANCELLED participants from the 'all paid' check and treat a refunded/left seat as an unpaid seat to be covered by the organiser (or re-open it explicitly), then mark the booking COMPLETED and emit PAYMENT_COMPLETED once every remaining seat is covered.

### 65. [HIGH] Settlement via the organiser's hold never marks the booking paid or emits PAYMENT_COMPLETED, so the vendor is never credited for split bookings with an unpaid seat

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1780`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** processPendingPayments captures organiser share + unpaid seats from the hold, but never updates booking.paymentStatus to COMPLETED nor emits BookingEventType.PAYMENT_COMPLETED. BalanceService.holdBookingRevenue only runs on PAYMENT_COMPLETED, and the hourly reconcileMissingHolds only looks at bookings with paymentStatus COMPLETED, so the money captured at settlement is never credited to the tenant balance. The dashboard shows partially_paid as 'pending'.
- **How to reproduce:** Split booking with one invitee who never responds; at T-30 organiser is charged; tenant_balances unchanged; GET booking shows paymentStatus partially_paid.
- **Impact:** Every split booking where an invitee never responded is fully charged to customers but yields zero vendor revenue in the balance/payout system.
- **Evidence:**

```
bookings.service.ts:1778-1780  const creatorShare = Number(creatorPayment.amount); const captureTotal = creatorShare + actualDeduction; await this.paymentsService.completePayment(creatorPayment.id, captureTotal);
bookings.service.ts:1805-1813  this.logger.log(`Deducted ...`); return { pendingParticipants: ..., amountDeducted: actualDeduction, ... };   // no booking update, no PAYMENT_COMPLETED
balance.service.ts:455-457  @OnEvent(BookingEventType.PAYMENT_COMPLETED) async handlePaymentCompleted({ booking })
balance.service.ts:515  .where('b."paymentStatus" = :paid', { paid: PaymentStatus.COMPLETED })
dashboard SceduleDetails.js:225-230  ["pending", "partially_paid", "hold"].includes(match.paymentStatus) ? "pending" : "paid"
```
- **Suggested fix (NOT applied):** After a successful capture set booking.paymentStatus = COMPLETED and emit PAYMENT_COMPLETED inside the same transaction (runOnTransactionCommit), and make reconcileMissingHolds also pick bookings whose captured payments cover the price.

### 66. [HIGH] Participant PaymentIntents are never cancelled (no expiry job, settlement cancels nothing) so a late confirmation double-charges a seat or pays for a cancelled booking

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1799`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** pay() creates a PENDING payment (bookingId+userId) but, unlike book(), never schedules a cancellation job and never links the participant row (participant.paymentId is only set when the webhook completes). processPendingPayments therefore finds participant.paymentId null for every unpaid seat and cancels nothing; cancel() of the whole booking also only touches COMPLETED/HOLD payments. The client secret stays valid, so a participant confirming later is charged: after settlement the organiser already paid that seat (double collection), and after cancellation the customer pays for a cancelled match (webhook has no booking.status check). Live DB: payment 310ffdab is still 'pending' for booking aa000000-...-b1 since 2026-07-26.
- **How to reproduce:** Accept a split invitation (get client secret), do not pay; let settlement run (organiser charged), then confirm the old client secret -> charge succeeds and participant becomes READY.
- **Impact:** Customers can be charged twice for one seat, or charged for a cancelled booking; stale intents accumulate in Stripe.
- **Evidence:**

```
bookings.service.ts:1228-1238  async pay(participant) { ... return this.paymentsService.createPaymentIntentDetails({ amount, bookingId: booking.id, currency: booking.currency }, user); }   // no schedulePaymentCancellation
bookings.service.ts:1799-1803  for (const participant of participantsWithPendingPayments) { if (participant.paymentId) { await this.paymentsService.cancelPayment(participant.paymentId); } }
bookings.service.ts:505-507  participant.payment = payment; await this.participantsService.save(participant);   // paymentId linked only after payment
bookings.service.ts:941-957  cancel(): only COMPLETED -> refund, HOLD -> release; PENDING participant intents untouched
psql: 310ffdab-...|pending|75.00||aa000000-0000-4000-8000-0000000000b1|...|2026-07-26
```
- **Suggested fix (NOT applied):** Store the intent id on the participant when pay() runs (or look payments up by bookingId+userId+PENDING), cancel them in processPendingPayments and in cancel(), schedule the same 10-minute cancellation job as book(), and make processParticipantPayment refund when the booking is not PENDING or the seat is already covered.

### 67. [HIGH] POST /bookings/:id/pay has no state guard: paid, READY, WHOLE-booking and creator participants can create and pay new PaymentIntents; a second payment throws and Stripe retries with no refund

- **Where:** `backend/src/modules/bookings/bookings.controller.ts:181`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The controller only checks that the caller is a participant; pay() never checks participant.status, booking.paymentType or booking.status. A participant on a WHOLE booking (already paid by the organiser), the organiser themself, or a READY participant tapping Pay again gets a fresh PaymentIntent for total/participants.length. When such a duplicate payment succeeds, processParticipantPayment tries READY -> READY, the state machine throws BadRequest (from===to), the transaction rolls back, isUnbookable is false (bookingId set) so the error is rethrown, the idempotency claim is released and Stripe retries for three days; the customer keeps the charge.
- **How to reproduce:** As a READY participant call POST /bookings/:id/pay twice and confirm both intents.
- **Impact:** Double charges with no automatic refund; participants of whole bookings can be charged although the court is already paid.
- **Evidence:**

```
bookings.controller.ts:181-196  async payForBooking(...) { const participants = ...; const participant = participants.find(p => p.userId === user.id); if (!participant) throw ...; ... return this.bookingsService.pay(participant); }
bookings.service.ts:1228-1238  async pay(participant) { const amount = ... / booking.participants.length; return this.paymentsService.createPaymentIntentDetails({...}) }
bookings.service.ts:504  this.participantsService.transitionParticipantStatus(participant, ParticipantStatus.READY);
participant-state-machine.ts:80-82  if (from === to) { return false; }
payments.service.ts:164-171  catch (error) { if (this.isUnbookable(payment, error)) {...} throw error; }
```
- **Suggested fix (NOT applied):** Reject pay() unless booking.paymentType === SPLIT, booking.status === PENDING and participant.status === PENDING_PAYMENT; reuse an existing PENDING payment for the same participant instead of creating a new intent; in the webhook, refund a payment whose participant is already READY.

### 68. [HIGH] cancel() is not atomic with Stripe: a refund failure mid-loop leaves earlier refunds done at Stripe but rolled back in the DB, PAYMENT_REFUNDED never fires and the booking can never be cancelled again; expired split authorisations (>7 days) make cancel return 502

- **Where:** `backend/src/modules/bookings/bookings.service.ts:941`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** cancel() runs under @Transactional and refunds/releases each participant sequentially. If any Stripe call throws (card refund failure, 'already refunded', or paymentIntents.cancel on an authorisation Stripe already expired after 7 days), the DB transaction rolls back: payments already refunded at Stripe stay COMPLETED locally, the vendor balance reversal (emitted only on commit) never happens, the booking stays active, and the customer gets 502 PAYMENT_PROVIDER_ERROR. A retry re-refunds the same intents and fails again ('charge_already_refunded'), so the booking becomes uncancellable. Split bookings made more than 7 days ahead hit this on every cancel because release() cannot cancel an already-cancelled PI.
- **How to reproduce:** Split booking created 8+ days before start (authorisation expired). Creator cancels -> 502; booking still pending.
- **Impact:** Customers refunded at Stripe while the platform still shows them paid and the vendor keeps the credit; other customers cannot cancel at all (>7-day split bookings).
- **Evidence:**

```
bookings.service.ts:941-957  for (const participant of booking.participants) { ... if (COMPLETED) await this.paymentsService.refund(participant.payment.id); else if (HOLD) await this.paymentsService.release(participant.payment.id); }
payments.service.ts:331-348  try { refund = await this.stripeService.refundPayment(...) } catch (error) { ... throw error; }
payments.service.ts:363-371  runOnTransactionCommit(() => { this.eventEmitter.emit(BookingEventType.PAYMENT_REFUNDED, ...) });
payments.service.ts:414-425  if (payment.status !== PaymentStatus.HOLD) throw new Error(...); await this.stripeService.releasePayment(payment.providerPaymentId);   // Stripe: cannot cancel a canceled PI -> 502
stripe.service.ts:42-45  if (type.startsWith('Stripe')) { return new BadGatewayException(PAYMENT_PROVIDER_ERROR); }
```
- **Suggested fix (NOT applied):** Persist each Stripe outcome immediately (per-payment transaction or write status before the next Stripe call), treat 'already refunded/canceled' as success, and emit the balance reversal per payment rather than on the outer commit.

### 69. [HIGH] releaseHeldRevenue releases the original held amount even after part of it was reversed by a refund, over-crediting the vendor

- **Where:** `backend/src/modules/payouts/services/balance.service.ts:285`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** reverseBookingRevenue debits pendingBalance for a refund that happens before the match ends (e.g. organiser removes a paid participant after settlement via removeParticipants), but the hold transaction keeps metadata.heldAmount unchanged. When the booking ENDS, releaseHeldRevenue finds that hold row and moves the full heldAmount from pending to available/totalEarnings, so the refunded share is paid out to the vendor anyway and pendingBalance goes negative.
- **How to reproduce:** Fully paid split booking (hold 80 net). Organiser removes a paid participant (refund 25 -> pending 60). Match ends -> available += 80.
- **Impact:** Platform pays the vendor money that was refunded to the customer; ledger and balance diverge (negative pending).
- **Evidence:**

```
balance.service.ts:275-290  const heldTx = await this.transactionRepo.findOne({ where: { tenantId, bookingId, type: BOOKING_COMPLETED }, order: { createdAt: 'DESC' } }); if (heldTx?.metadata?.held) { const heldAmount = heldTx.metadata.heldAmount; balance.pendingBalance -= heldAmount; balance.availableBalance += heldAmount; balance.totalEarnings += heldAmount;
balance.service.ts:421-425  const fromPending = Math.min(balance.pendingBalance, netAmount); ... balance.pendingBalance = Math.round((balance.pendingBalance - fromPending) * 100) / 100;
bookings.service.ts:1132-1137  if (participant.paymentId) { await this.paymentsService.refund(participant.paymentId); }   // allowed while booking is pending/in_progress, no cutoff
```
- **Suggested fix (NOT applied):** Subtract reversed amounts from the hold (store remaining held amount, or compute release = heldAmount - sum(BOOKING_REFUNDED for bookingId) and clamp at 0).

### 70. [MEDIUM] Customer who backs out of the payment sheet is locked out of that slot for 10 minutes with 'slot already reserved' because reserveSlot counts their own reservation

- **Where:** `backend/src/modules/bookings/slots.service.ts:128`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** book() correctly ignores the caller's own reservation in isSlotReservedByOther, but reserveSlot() then queries any active reservation on the slot without excluding userId, finds the caller's own row from the previous attempt and returns false, so book() throws SLOT_ALREADY_RESERVED. The mobile 'Pay again' path re-calls POST /bookings and shows 'That slot is already reserved. Please pick another time.' until the 600 s TTL passes; the slots screen also shows the slot as taken to the same user.
- **How to reproduce:** Create a booking, dismiss the payment sheet, tap Pay again -> 400 SLOT_ALREADY_RESERVED.
- **Impact:** Every customer who cancels the Stripe sheet and retries sees a misleading error for up to 10 minutes and may book elsewhere.
- **Evidence:**

```
slots.service.ts:128-137  const existingReservation = await this.slotReservationRepository.createQueryBuilder('reservation').where('reservation.courtId = :courtId', ...).andWhere('reservation.startDate < :endDate', ...).andWhere('reservation.endDate > :startDate', ...).andWhere('reservation.expiresAt > :now', ...).getOne(); if (existingReservation) { return false; }
bookings.service.ts:196-202  const reserved = await this.slotsService.reserveSlot(...); if (!reserved) { ... throw new BadRequestException(SLOT_ALREADY_RESERVED); }
courtplusmobile useStripePayment.ts:63-67  // A voluntary cancel is not a failure: stay on the current screen so pressing Pay again re-initializes ...
courtplusmobile en.json:305  "SLOT_ALREADY_RESERVED": "That slot is already reserved. Please pick another time."
```
- **Suggested fix (NOT applied):** In reserveSlot, exclude/extend the caller's own reservation (upsert by courtId+userId+slot, refresh expiresAt) and reuse the pending PaymentIntent instead of creating a new one.

### 71. [MEDIUM] Open-match listing exposes other users' e-mail, paymentId and cancellationReason to every customer

- **Where:** `backend/src/modules/bookings/bookings.service.ts:666`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** find() selects the whole participant entity ('participant') plus user.email for every participant, and GET /bookings/open returns this to any authenticated customer for bookings they are not part of. Live response shows paymentId of another user's payment; email is included whenever set.
- **How to reproduce:** GET /bookings/open with any customer token.
- **Impact:** Personal data (e-mail, payment references, private cancellation reasons) leaks to strangers; violates the app's own privacy hardening done for reviews.
- **Evidence:**

```
bookings.service.ts:660-667  .select(['booking', 'participant', 'user.firstName', 'user.lastName', 'user.avatarUrl', 'user.username', 'user.email', ...
live GET /bookings/open as customer 2 -> participants[].paymentId = '5716cd55-495d-4d38-8c73-a8f18c70ca32', user.email field present (null for phone-only users), cancellationReason field present
```
- **Suggested fix (NOT applied):** Select only public participant fields (id, userId, status, isCreator) and drop user.email for customers; keep email/paymentId only for staff or the participant themself.

### 72. [MEDIUM] Split settlement never runs for bookings made less than 30 minutes ahead, and start/end status jobs are never scheduled for bookings 15-60 minutes ahead

- **Where:** `backend/src/modules/bookings/reminders.service.ts:48`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** processPendingPayments is only triggered by the THIRTY_MINUTES reminder job. scheduleBookingReminders schedules only one reminder (60, 30 or 15) based on the lead time and scheduleBookingStatusJobs only from the HOUR reminder or when lead time <= 15 min. So: lead 15-30 min -> only the 15-min reminder, no settlement (organiser never charged for unpaid seats, hold expires); lead 15-60 min -> no start/end jobs, booking never goes IN_PROGRESS, BOOKING_STARTED is never sent and completion relies on the 10-minute sweep.
- **How to reproduce:** Create a split booking 20 minutes before start with an invitee who does not pay; observe no capture at T-30 and no start_ job in the queue.
- **Impact:** Last-minute split bookings are never settled (vendor loses unpaid seats); short-lead bookings show 'pending' during play and get no start notification.
- **Evidence:**

```
reminders.service.ts:51-75  if (timeUntilBooking > HOUR) {...HOUR} else if (> HALF_HOUR) {...HALF_HOUR} else if (> QUARTER_HOUR) {...QUARTER_HOUR} else if (timeUntilBooking > 0) { await this.scheduleBookingStatusJobs(...) }
bookings.processor.ts:74-76  if (reminderType === BookingReminderType.THIRTY_MINUTES && booking.paymentType === PaymentType.SPLIT) { await this.bookingsService.processPendingPayments(booking.id); }
bookings.processor.ts:138-144  if (currentMinutes === REMINDER_INTERVALS.HOUR) { await this.remindersService.scheduleBookingStatusJobs(...) }
```
- **Suggested fix (NOT applied):** Always schedule start/end jobs in handleBookingCreated, and run settlement at min(T-30, now) when the booking is created inside the window (or at the start job).

### 73. [MEDIUM] joinBooking blocks every user without a gender set (and demands a gender restriction on every open match), and caps joiners at a fixed 4 regardless of playersASide

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1598`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The gender guard throws BOOKING_GENDER_RESTRICTION when the joiner has no gender even if the match is 'other'/unrestricted; CreateBookingDto makes gender and level mandatory for open matches (no IsOptional under ValidateIf(open)), so there is no 'mixed' match. Capacity uses MAX_PARTICIPANTS_PER_BOOKING=4 while playersASide can be 1 (2 players total), so a singles match accepts 4 players.
- **How to reproduce:** Customer with gender null calls POST /bookings/:id/join on a match with gender 'other'.
- **Impact:** Users who skipped gender in onboarding can never join any open match; singles matches overfill.
- **Evidence:**

```
bookings.service.ts:1597-1606  if (!user.gender || (booking.gender === Gender.MALE && user.gender !== Gender.MALE) || (booking.gender === Gender.FEMALE && user.gender !== Gender.FEMALE)) { throw new ForbiddenException(BOOKING_GENDER_RESTRICTION); }
create-booking.dto.ts:107-109  @IsEnum(Gender) @ValidateIf((o) => o.open) gender?: Gender;   // required when open
bookings.service.ts:1620-1633  const participantCount = booking.participants.filter(...).length; if (participantCount >= BOOKING.MAX_PARTICIPANTS_PER_BOOKING) { throw new BadRequestException(BOOKING_MAX_PARTICIPANTS_REACHED); }
booking.constants.ts:5  MAX_PARTICIPANTS_PER_BOOKING: 4,
```
- **Suggested fix (NOT applied):** Only enforce gender when booking.gender is MALE/FEMALE; make gender/level optional for open matches; compute capacity as playersASide * 2.

### 74. [MEDIUM] joinBooking returns 500 for a user who already requested/joined/left (unique index) and refuses users who are merely invited elsewhere at that time

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1640`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** There is no 'already a participant' check before participantsService.create; the unique (bookingId,userId) index throws a QueryFailedError which the catch rethrows as a 500 INTERNAL_SERVER_ERROR (a second tap on Join, or the creator joining their own match). The overlap check counts any participant row of the user (pending_response invitations never answered, cancelled leavers) as a conflicting booking.
- **How to reproduce:** POST /bookings/:id/join twice as the same user -> second call 500.
- **Impact:** Raw 500 instead of a clear message; users blocked from joining because of an unanswered invitation to another match.
- **Evidence:**

```
bookings.service.ts:1640-1645  participant = await this.participantsService.create({ userId: sessionUser.id, bookingId, status: ParticipantStatus.PENDING_APPROVAL });
participant.entity.ts:25  @Index(['bookingId', 'userId'], { unique: true })
bookings.service.ts:1696-1698  } catch (error) { this.logger.error(...); throw error; }
bookings.service.ts:1570-1586  .leftJoin('booking.participants', 'participant').where('(participant.userId = :userId OR booking.userId = :userId)').andWhere('booking.status != :cancelledStatus') ...getCount();   // no participant.status filter
```
- **Suggested fix (NOT applied):** Check existing participant first (return PARTICIPANT_ALREADY_EXISTS / allow re-join of cancelled rows), and filter the overlap query to active statuses (ready, entered, pending_payment, pending_approval).

### 75. [MEDIUM] Removing a participant who accepted but has not paid returns 500, and removal (with refund) is allowed at any time, even after the match started

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1132`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** removeParticipants calls paymentsService.refund for any participant with a paymentId; refund() throws a plain Error('Payment is not completed') for PENDING/FAILED payments, which surfaces as 500. There is no cancellation-window or start-time guard (only CANCELLED/COMPLETED are blocked), so an organiser can remove paid players minutes before or during the match and trigger full refunds while keeping the court, and the booking's paymentStatus is not reverted to PARTIALLY_PAID as the leave path does.
- **How to reproduce:** DELETE /bookings/booking/:id/participants/remove with a participant whose payment is pending.
- **Impact:** Organisers get a 500 on a normal action; vendor exposed to refunds inside the no-cancel window.
- **Evidence:**

```
bookings.service.ts:1132-1137  if (participant.paymentId) { ... await this.paymentsService.refund(participant.paymentId); }
payments.service.ts:319-324  if (payment.status !== PaymentStatus.COMPLETED) { ... throw new Error('Payment is not completed'); }
bookings.service.ts:1106-1114  if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) { throw new BadRequestException(BOOKING_NOT_ACTIVE); }   // IN_PROGRESS allowed, no cutoff
```
- **Suggested fix (NOT applied):** Skip/cancel PENDING payments instead of refunding, apply assertCancellationWindowOpen to removals, and set paymentStatus back to PARTIALLY_PAID when a paid seat is refunded.

### 76. [MEDIUM] GET /bookings/:id/events returns 500 for staff when the booking id is unknown (null dereference)

- **Where:** `backend/src/modules/bookings/bookings.controller.ts:274`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** For staff users the controller calls bookingsService.findOne, which returns null for an unknown id, then dereferences booking.court.branch.tenantId without a null check. Verified live: 500 INTERNAL_SERVER_ERROR with the vendor token.
- **How to reproduce:** curl -H 'Authorization: Bearer <vendor>' localhost:3000/bookings/<random uuid>/events
- **Impact:** Dashboard activity log crashes with a generic error for deleted/unknown bookings instead of 404.
- **Evidence:**

```
bookings.controller.ts:265-276  const booking = await this.bookingsService.findOne({ id }, { staff: true, court: { branch: true } }); if (booking.court.branch.tenantId !== user.tenantId) { throw new ForbiddenException(...); }
live: GET /bookings/00000000-0000-4000-8000-000000000000/events (vendor token) -> {"statusCode":500,"code":"INTERNAL_SERVER_ERROR"}
```
- **Suggested fix (NOT applied):** if (!booking) throw new NotFoundException(BOOKING_NOT_FOUND) before the tenant check.

### 77. [MEDIUM] Join-request notification is sent to the organiser but its text tells them 'Your request to join the booking has been submitted' (EN and AR)

- **Where:** `backend/src/modules/notifications/content/i18n.ts:117`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** BOOKING_JOIN_REQUEST_SUBMITTED is emitted to booking.userId (the organiser) with requester data, but the in-app/push template is written from the requester's perspective in both languages, so the organiser reads a confirmation of a request they never made and gets no hint who wants to join.
- **How to reproduce:** Join an autoAccept=false open match; check the organiser's notifications.
- **Impact:** Organisers are misled and cannot tell a join request from their own action; no requester name is shown.
- **Evidence:**

```
bookings.service.ts:1832-1838  this.notificationsService.sendNotification(booking.userId, { type: NotificationType.BOOKING_JOIN_REQUEST_SUBMITTED, data: { bookingId, participantId, userId: participant.userId } ...
i18n.ts:117-119  booking_join_request_submitted: { title: 'Join Request Submitted', content: 'Your request to join the booking has been submitted' }
i18n.ts:450-452  booking_join_request_submitted: { title: 'تم تقديم طلب الانضمام', content: 'تم تقديم طلبك للانضمام إلى الحجز' }
```
- **Suggested fix (NOT applied):** Change the template to '{{name}} wants to join your booking at {{courtName}}' (EN/AR) and pass requesterName/courtName in data.

### 78. [MEDIUM] Reminders, cancellation and 'started/ended' notifications are sent to participants who left, declined-pending or were never accepted

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1457`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** notifyParticipants loads every participant row of the booking regardless of status (only exceptUserIds is applied). A participant who left (status cancelled) or who never answered an invitation still receives 'Your booking starts in 30 minutes', 'Your booking has started/ended', and 'Your booking ... was cancelled. Any payment is refunded'.
- **How to reproduce:** Leave a split match >12h before; at T-60 you still receive the reminder push/e-mail.
- **Impact:** Customers who left a match keep getting reminders and refund promises for it; pushes and e-mails go to the wrong people.
- **Evidence:**

```
bookings.service.ts:1457-1463  const whereCondition = exceptUserIds?.length ? { userId: Not(In(exceptUserIds)) } : {}; const participants = await this.participantsService.getParticipants(bookingId, {}, whereCondition); const userIds = participants.map((participant) => participant.userId);
bookings.processor.ts:86-94  await this.bookingsService.notifyParticipants(booking.id, NotificationType.BOOKING_REMINDER, {...}, [], {...})
bookings.service.ts:2034-2043  this.notifyParticipants(booking.id, NotificationType.BOOKING_CANCELLED, {...}, [], {...})
```
- **Suggested fix (NOT applied):** Filter notifyParticipants to active statuses (ready, entered, pending_payment, pending_response as appropriate per notification type).

### 79. [MEDIUM] processPendingPayments swallows every error (Stripe capture failures) inside the transaction and returns normally, so failed settlements are neither retried nor alerted

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1814`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Still open from PRODUCTION-READINESS #7: the whole settlement is wrapped in try/catch that logs and returns {error}, so the BullMQ reminder job succeeds, no retry happens, and a declined off-session recharge or Stripe outage silently leaves the organiser uncharged. The comment in rechargeExpiredAuthorization about authentication_required confirms the seat then stays unsettled.
- **How to reproduce:** Split booking with an expired authorisation whose saved card requires authentication; the 30-min job logs an error and finishes green.
- **Impact:** Vendor silently loses revenue for unpaid seats whenever the capture fails; nobody is notified.
- **Evidence:**

```
bookings.service.ts:1814-1819  } catch (error) { this.logger.error('Error processing pending payments:', error); return { error: 'Failed to process payments' }; }
bookings.processor.ts:74-76  if (reminderType === THIRTY_MINUTES && booking.paymentType === SPLIT) { await this.bookingsService.processPendingPayments(booking.id); }
payments.service.ts:585-590  if (fresh.status !== 'succeeded') { this.logger.error(...); return null; }
```
- **Suggested fix (NOT applied):** Rethrow so BullMQ retries, mark the booking with a settlementFailed flag, notify ops/vendor, and give the organiser a 'pay now' path.

### 80. [MEDIUM] Mobile booking details show the amount in the 'Payment Status' row and its enums do not know partially_paid/refunded/hold/in_progress

- **Where:** `courtplusmobile/src/screens/ActivityFlow/BookingDetails/BookingDetails.component.tsx:198`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The 'Payment Status' ActionItem renders formatCurrency(totalAmount) as its value instead of the status, so a refunded or partially paid booking looks identical to a paid one. The Booking model's PaymentStatus/MatchStatus/ParticipantStatus enums lack the backend values partially_paid, refunded, hold, in_progress, pending_approval, cancelled and no_show, so nothing in the app can present them. For split bookings the user's own share is never shown, only the court total.
- **How to reproduce:** Cancel a paid booking in the app, open it from history: Payment Status row shows '500 SAR'.
- **Impact:** Customers cannot see whether they were refunded or still owe their share; support load.
- **Evidence:**

```
BookingDetails.component.tsx:198-209  <ActionItem image={Images.court} title={t("activity.paymentStatus")} ... right={ <CustomText text={formatCurrency(Number(item.totalAmount))} font="headline3" weight="bold" /> } />
models/Booking.ts:15-19  export enum PaymentStatus { PAID = "paid", COMPLETED = "completed", PENDING = "pending" }
models/Booking.ts:21-27  export enum MatchStatus { CANCELLED, ACCEPTED, PENDING, AWAITING_HOST, COMPLETED }   // no in_progress
backend payment.entity.ts:15-24  PaymentStatus { PENDING, COMPLETED, FAILED, REFUNDED, PARTIALLY_PAID, HOLD, RELEASED, CANCELLED }
```
- **Suggested fix (NOT applied):** Render a translated status label (paid/partially paid/refunded/pending) from item.paymentStatus, align the mobile enums with the backend, and show the participant's own share for split bookings.

### 81. [LOW] Organiser's approve/reject endpoint does not check the target participant's status or capacity and its DTO documents participantId as the participant row id while the code needs the userId

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1293`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** respondToJoinRequest looks the target up by (bookingId, participantId) using getParticipant(bookingId, userId), i.e. participantId must be a userId although the DTO says 'UUID of the participant'. Accepting writes READY/PENDING_PAYMENT with repository.update on any row (cancelled, already ready, no_show) without the state machine and without re-checking max participants.
- **How to reproduce:** Call /request/respond with the participant's row id -> 404.
- **Impact:** Any client built against the Swagger contract will get PARTICIPANT_NOT_FOUND; approvals can overfill a match or resurrect cancelled participants.
- **Evidence:**

```
join-request.dto.ts:11-17  description: 'UUID of the participant' ... participantId: string;
bookings.service.ts:1251-1254  this.participantsService.getParticipant(bookingId, participantId)   // second arg is userId
bookings.service.ts:1293-1298  if (accept) { const newStatus = ...; const result = await this.participantsService.update({ id: participant.id }, { status: newStatus });
```
- **Suggested fix (NOT applied):** Rename the field to userId (or resolve by participant id), require status PENDING_APPROVAL via transitionParticipantStatus(APPROVE) and re-run the capacity check.

### 82. [LOW] Any participant row, including those who left, never answered or no-showed, can review the court

- **Where:** `backend/src/modules/reviews/reviews.service.ts:93`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Review gating checks only that a participant row exists for the user on a COMPLETED booking; participants with status cancelled, pending_response, pending_approval or no_show pass.
- **How to reproduce:** Be invited to a booking, never respond, wait for completion, POST /reviews.
- **Impact:** Court ratings can be written by people who never played there.
- **Evidence:**

```
reviews.service.ts:90-96  if (booking.status !== BookingStatus.COMPLETED) { throw ... } const participant = await this.participantsService.getParticipant(bookingId, userId); if (!participant) { throw new BadRequestException(PARTICIPANT_NOT_FOUND); }
```
- **Suggested fix (NOT applied):** Require participant.status in (ready, entered).

### 83. [LOW] POST /bookings/:id/enter works at any time (days before the match, on cancelled bookings)

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1414`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** enterBooking only requires a READY participant; it does not check booking.status (PENDING/IN_PROGRESS vs CANCELLED/COMPLETED) or that now is within the booking window, and it notifies all other participants that the user 'entered the booking'.
- **How to reproduce:** POST /bookings/:id/enter a week before the match.
- **Impact:** Bogus 'X entered the booking' notifications and attendance data.
- **Evidence:**

```
bookings.service.ts:1420-1437  const participant = await this.participantsService.getParticipant(bookingId, user.id); ... this.participantsService.transitionParticipantStatus(participant, ParticipantStatus.ENTERED); await this.participantsService.save(participant);
```
- **Suggested fix (NOT applied):** Require status IN_PROGRESS (or startDate - grace <= now <= endDate).

### 84. [LOW] Distance ordering on bookings is always overridden by the default createdAt sort

- **Where:** `backend/src/modules/bookings/bookings.service.ts:788`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** When lat/lng are given the query orders by distance, but sortBy defaults to CREATED_AT in the DTO and the following switch calls qb.orderBy again, replacing the distance order.
- **How to reproduce:** GET /bookings/open?lat=..&lng=..
- **Impact:** Nearby open matches are not shown nearest-first.
- **Evidence:**

```
bookings.service.ts:788  qb.orderBy('distance', 'ASC');
bookings.service.ts:791-802  if (sortBy) { switch (sortBy) { ... case Sort.CREATED_AT: qb.orderBy('booking.createdAt', sortDirection); ...
list-bookings.dto.ts:177  sortBy?: Sort = Sort.CREATED_AT;
```
- **Suggested fix (NOT applied):** Use addOrderBy for the secondary sort or skip the default when a distance sort is active.

### 85. [LOW] Booking duration/start are only checked against schedule windows, not the slot grid; no maximum duration

- **Where:** `backend/src/modules/bookings/dto/create-booking.dto.ts:44`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** duration has Min(30) and no Max, startAt accepts any minute. A customer can book 12:17-12:52 or a 24 h block inside a 24 h window; such bookings fragment the vendor's slot grid (the slots endpoint marks whole slots unavailable) and are priced pro-rata by hourlyRate*duration/60.
- **How to reproduce:** POST /bookings with startAt '2026-10-01 12:17', duration 35.
- **Impact:** Odd bookings block neighbouring slots and confuse vendors.
- **Evidence:**

```
create-booking.dto.ts:44-46  @IsNumber() @Min(BOOKING.MIN_DURATION_MINUTES) duration?: number;
create-booking.dto.ts:33-36  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/) startAt?: string;
bookings.service.ts:208-209  const bookingAmount = court.hourlyRate * (duration / BOOKING.MINUTES_PER_HOUR);
```
- **Suggested fix (NOT applied):** Validate startAt/duration against the court's slot length (court.minDuration) and cap duration.

### 86. [LOW] addParticipants accepts unknown user ids (FK 500), self-add (unique 500) and has no cut-off; participants added after full payment inflate collections

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1205`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** No existence check is done before participantsService.create, so a non-existent uuid hits the users FK and a self-add hits the unique index (500s). Adding is allowed until COMPLETED with no cancellation-window check, and on a settled split booking a newly added participant is charged total/participants.length on top of the already fully paid court.
- **How to reproduce:** POST /bookings/booking/:id/participants/add with a random v4 uuid.
- **Impact:** Raw 500s for organisers; overcollection on settled split bookings.
- **Evidence:**

```
bookings.service.ts:1205-1211  for (const userId of newUserIds) { const participant = await this.participantsService.create({ bookingId, userId, status: ParticipantStatus.PENDING_RESPONSE, isCreator: false });
bookings.service.ts:1169-1177  if (booking.status === CANCELLED || COMPLETED) throw BOOKING_NOT_ACTIVE;   // no cutoff
bookings.service.ts:1231-1233  amount = ... / booking.participants.length
```
- **Suggested fix (NOT applied):** Validate users exist, forbid self, apply the cut-off, and price added seats from the frozen share (see share-math finding).

### 87. [LOW] Cancelled bookings are labelled 'refunded' even when only an uncaptured hold was released, and the vendor e-mail always says 'Refunded to the original payment method'

- **Where:** `backend/src/modules/bookings/bookings.service.ts:978`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** moneyReturned is true for HOLD payments (nothing was captured), so paymentStatus becomes REFUNDED; the staff cancellation e-mail hard-codes refundStatus regardless of whether any money moved (also for walk-in bookings with no payment).
- **How to reproduce:** Cancel a split booking before anyone paid; status shows refunded.
- **Impact:** Customers and vendors see refund wording when no charge existed.
- **Evidence:**

```
bookings.service.ts:978-987  const moneyReturned = booking.participants.some((p) => p.payment && [PaymentStatus.COMPLETED, PaymentStatus.HOLD].includes(p.payment.status)); await this.bookingsRepository.update(id, { status: CANCELLED, ..., ...(moneyReturned ? { paymentStatus: PaymentStatus.REFUNDED } : {}) });
bookings.service.ts:2083  refundStatus: 'Refunded to the original payment method',
```
- **Suggested fix (NOT applied):** Use RELEASED/CANCELLED for hold-only cases and derive refundStatus from actual refunds.

### 88. [LOW] Invitation-accepted e-mail reports a hard-coded maxParticipants of 10 while the system caps at 4

- **Where:** `backend/src/modules/bookings/bookings.service.ts:2125`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleParticipantAccepted passes maxParticipants: 10 into the e-mail template data although BOOKING.MAX_PARTICIPANTS_PER_BOOKING is 4 (and open matches are playersASide*2).
- **How to reproduce:** Accept a whole-booking invitation and read the organiser's e-mail.
- **Impact:** E-mail shows wrong '2/10 players' style counts.
- **Evidence:**

```
bookings.service.ts:2124-2125  currentParticipants: booking.participants?.filter(...).length || 1, maxParticipants: 10,
booking.constants.ts:5  MAX_PARTICIPANTS_PER_BOOKING: 4,
```
- **Suggested fix (NOT applied):** Use the real capacity.

### 89. [LOW] bookings.startDate/endDate are 'timestamp without time zone' while reservations are timestamptz (still open from PRODUCTION-READINESS #18)

- **Where:** `backend/src/modules/bookings/entities/booking.entity.ts:64`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Booking columns are declared with bare @Column() (naive timestamp) whereas SlotReservation uses timestamptz; correctness depends on the Node process running in UTC. Confirmed in the live schema.
- **How to reproduce:** Run the API with TZ=Asia/Riyadh and create a booking; stored value differs from the reservation.
- **Impact:** A container with a non-UTC TZ would shift every booking by the offset; overlap checks between reservations and bookings would disagree.
- **Evidence:**

```
booking.entity.ts:63-69  @Column() startDate: Date; @Column() endDate: Date;
slot-reservation.entity.ts:18-25  @Column('timestamptz') startDate: Date; ... @Column('timestamptz') endDate: Date;
psql information_schema: bookings|startDate|timestamp without time zone ; slot_reservations|startDate|timestamp with time zone
```
- **Suggested fix (NOT applied):** Migrate bookings columns to timestamptz and pin TZ=UTC in the Dockerfile.

---

## 4. Vendor subscriptions and billing

27 issues — 0 critical, 2 high, 14 medium, 11 low.

### 90. [HIGH] Cancelled / unpaid subscription never affects live courts, bookings or customer visibility — vendor keeps operating for free after month one

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:510`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** When Stripe cancels a subscription (customer.subscription.deleted) or it becomes unpaid, the only effect is subscription.status on the local row. Nothing suspends/hides/unpublishes the tenant's courts, nothing touches upcoming bookings, and the customer-facing court query filters only on court.status, branch.suspendedAt and tenant.blockedAt — no subscription condition anywhere. SubscriptionEvents.CANCELLED / PAYMENT_FAILED are emitted but no module listens (grep of backend/src finds no @OnEvent for them). The only enforcement of a lapsed subscription is canAddUnits (no NEW branches/courts). The dashboard copy billing.ends_on_hint ('Courts stay live until then') promises the opposite.
- **How to reproduce:** Subscribe, get a court approved, open 'Manage payment method' and cancel the plan (or let renewal fail). After period end the court is still listed/bookable in the mobile app and the vendor keeps receiving bookings and payouts.
- **Impact:** The business loses all recurring revenue after the first paid month: a vendor can cancel from the Stripe portal (or let the card fail until Stripe cancels) and every approved court stays live and bookable indefinitely. Ops get no signal.
- **Evidence:**

```
subscriptions.service.ts:521-526: subscription.status = SubscriptionStatus.CANCELLED; subscription.cancelledAt = new Date(); await this.subscriptionRepository.save(subscription); }  |  courts.service.ts:262-266 (customer visibility): queryBuilder.andWhere('court.status = :visibleStatus', {visibleStatus: CourtStatus.AVAILABLE}); queryBuilder.andWhere('branch.suspendedAt IS NULL'); queryBuilder.andWhere('tenant.blockedAt IS NULL');  |  en.json billing.ends_on_hint: 'Courts stay live until then. You can resume the plan any time…'
```
- **Suggested fix (NOT applied):** On handleSubscriptionDeleted / status→UNPAID: mark the tenant's AVAILABLE courts as SUSPENDED (or add a tenant-level 'subscriptionLapsedAt' checked in the customer court/branch queries and in slot booking), notify the vendor and ops, and restore on invoice.paid/reactivation. Align the ends_on_hint copy with the real behaviour.

### 91. [HIGH] Subscribe button can create a SECOND Stripe subscription — checkout never checks Stripe for an existing live/unpaid one

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:223`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** createCheckoutSession only consults the LOCAL row via getActiveSubscription (ACTIVE/PAST_DUE). If the local row is UNPAID (Stripe unpaid/paused/incomplete) or missing (webhook not yet processed / dropped, or the sync race in the next finding), the dashboard shows the Subscribe CTA (LIVE_STATUSES excludes unpaid/cancelled) and hides 'Manage payment method', so the vendor's only option creates a brand-new Checkout for the same Stripe customer. Stripe happily creates a second subscription; the old unpaid one keeps generating invoices and is never cancelled by the app. reconcileWithStripe only re-syncs rows that are ACTIVE/PAST_DUE, so the duplicate is never noticed.
- **How to reproduce:** Let a renewal fail until Stripe marks the subscription unpaid (or pause it in Stripe test dashboard) → dashboard shows 'Subscribe' → complete Checkout → Stripe customer now has two subscriptions; local row re-points to the new one, old one still open.
- **Impact:** Vendor is billed twice per month (two subscriptions on one customer; Stripe retries the old unpaid invoices against the newly saved card). Finance has to refund manually; local state tracks only one of the two.
- **Evidence:**

```
subscriptions.service.ts:223 const existingSubscription = await this.getActiveSubscription(tenantId);  :232-240 if (existingSubscription) { await this.syncQuantities(tenantId); return { url: successUrl || ... } }  :260-266 const session = await this.paymentsService.createCheckoutSession({ customerId: providerCustomerId, lineItems, ... })  |  :130-142 getActiveSubscription returns null unless status in [ACTIVE, PAST_DUE]  |  Billing.js:151-153 const LIVE_STATUSES = ["active","past_due","trialing"]; const hasSubscription = LIVE_STATUSES.includes(overview?.subscription?.status);  :206-215 {hasSubscription && (<Button ...>{t("billing.manage_payment")}</Button>)}  :253 {overview && !hasSubscription && (<Alert ... Subscribe CTA
```
- **Suggested fix (NOT applied):** Before creating a Checkout Session call searchSubscriptionsByTenant and (a) if a live one exists, sync it instead of creating a new one; (b) if an unpaid/paused one exists, cancel it (or route the vendor to its hosted invoice / portal). Show the portal button for any tenant with a providerCustomerId.

### 92. [MEDIUM] Return-from-Checkout sync races the subscription.created webhook on UNIQUE(subscriptions.tenantId) → 'could not confirm' toast and stale Subscribe CTA

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:776`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Both POST /subscriptions/sync (fired by Billing.js on the ?subscription=success redirect) and the customer.subscription.created webhook run syncSubscriptionFromStripe concurrently. Each does findOne(providerSubscriptionId) → findOne(tenantId) → create → save. When both miss, the second INSERT violates the UNIQUE(tenantId) constraint and throws. If the loser is the HTTP sync, the page shows billing.sync_failed, onError does not invalidate any query, and billing-overview (fetched in parallel, staleTime 60s) still shows 'No active subscription' + Subscribe — which feeds the duplicate-subscription finding above.
- **How to reproduce:** Complete Checkout with webhooks enabled; the redirect and the webhook arrive within the same second. Observe 500 on POST /subscriptions/sync (unique_violation) and the warning toast.
- **Impact:** Vendor who just paid sees a warning and a Subscribe button for up to a minute; a second click starts another Checkout.
- **Evidence:**

```
subscriptions.service.ts:776-800 let subscription = await this.subscriptionRepository.findOne({ where: { providerSubscriptionId } }); if (!subscription) { const existingForTenant = await this.subscriptionRepository.findOne({ where: { tenantId } }); if (existingForTenant) {...} else { subscription = this.subscriptionRepository.create({ tenantId, ... }); } }  :836 const saved = await this.subscriptionRepository.save(subscription);  |  migration 1767525300019: CONSTRAINT "REL_0c5fe8e5f9f4dd4a8c0134abc9" UNIQUE ("tenantId")  |  Billing.js:72-74 onError: () => { notify("warning", t("billing.sync_failed")); }  |  dashboard/src/index.js:19 staleTime: 60000
```
- **Suggested fix (NOT applied):** Serialise per tenant (DistributedLockService.runExclusively('subscriptions:sync:'+tenantId)) or use an upsert on tenantId (INSERT … ON CONFLICT (tenantId) DO UPDATE). In Billing.js, refetch billing queries in onError too.

### 93. [MEDIUM] Delete then re-add a branch/court in the same period is charged twice (decrease = no credit, increase = always_invoice)

- **Where:** `backend/src/modules/subscriptions/pricing.service.ts:365`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** doSyncTenantSubscription applies quantity decreases with proration_behavior 'none' (no credit — the vendor keeps paying for the removed unit until period end) but every increase with 'always_invoice' (immediate prorated charge). A vendor who deletes court #3 and re-creates it (typo in the name, wrong branch, etc.) pays the add-on for the remainder of the period a second time. The docstring claims downgrades are 'deferred to the next period', which is not what 'none' does either (the quantity drops immediately in Stripe).
- **How to reproduce:** Tenant with 1 branch + 3 courts (1 court add-on). Delete a court, then create a new one → a new prorated add-on invoice is issued although the month's add-on was already paid.
- **Impact:** Vendor is double-charged for a unit-month; support/refund burden.
- **Evidence:**

```
pricing.service.ts:365-371 if (itemUpdates.length > 0) { await this.paymentsService.updateSubscriptionItems(subscription.providerSubscriptionId, itemUpdates, direction === 'decreased' ? 'none' : 'always_invoice'); }  |  :273-276 * Upgrades are invoiced immediately (always_invoice) ... downgrades are * deferred to the next period (no proration credit).
```
- **Suggested fix (NOT applied):** Use 'create_prorations' for decreases (credit) or keep the removed unit's quantity until period end and only lower it at renewal; alternatively skip the immediate invoice when the new quantity does not exceed the quantity already invoiced this period.

### 94. [MEDIUM] Deleting a pending_payment court leaves its unpaid proration invoice open — subscription stays past_due for a court that no longer exists

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:955`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Creating a paid court issues an immediate invoice (always_invoice). If the card is declined the court stays pending_payment and the subscription becomes past_due. If the vendor then deletes that court, COURT_DELETED → syncAfterUnitChange lowers the item quantity with proration 'none', but the open invoice is never voided (there is no invoices.void anywhere in backend/src). Stripe keeps dunning it; the billing page offers 'Pay open invoice'; if dunning is set to cancel, the whole subscription is cancelled over a deleted court.
- **How to reproduce:** With an active subscription, create a 3rd court using a declining test card → past_due + open invoice. Delete the court. Billing still shows 'Pay open invoice' for that amount.
- **Impact:** Vendor is asked to pay (and may pay) for a unit they removed; subscription can lapse; support escalations.
- **Evidence:**

```
subscriptions.service.ts:955-961 @OnEvent(CourtEvent.COURT_DELETED) async handleCourtDeleted(event) { const tenantId = event.court.branch?.tenantId; if (tenantId) { await this.syncAfterUnitChange(tenantId); } }  |  pricing.service.ts:349-353 if (quantity === 0 && !required) { itemUpdates.push({ id: existing.id, deleted: true }); ... direction = 'decreased'  :369 direction === 'decreased' ? 'none' : 'always_invoice'  |  grep -rn "invoices.void\|voidInvoice" backend/src → no results
```
- **Suggested fix (NOT applied):** When a unit decrease follows a failed add-on invoice, void the open proration invoice for that subscription (stripe.invoices.voidInvoice) or use 'create_prorations' so the credit cancels the open charge.

### 95. [MEDIUM] Courts suspended / changes_requested by ops (and suspended branches) keep being billed as add-ons

- **Where:** `backend/src/modules/subscriptions/pricing.service.ts:190`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** getTenantCounts counts every non-deleted branch and court regardless of status. A court that ops suspended or sent back with changes_requested, or a branch ops suspended, is still counted toward branchAddons/courtAddons and billed $10/month while the vendor cannot use it. Ops moderation (courts.service.ts suspend/requestChanges) never triggers a billing adjustment.
- **How to reproduce:** Tenant with 1 branch + 3 courts (1 add-on). Ops suspend court #3 → next invoice still $40.
- **Impact:** Vendors pay for units the platform itself took offline; disputes/chargebacks.
- **Evidence:**

```
pricing.service.ts:193-200 this.branchRepository.count({ where: { tenantId, deletedAt: IsNull() } }), this.courtRepository.count({ where: { deletedAt: IsNull(), branch: { tenantId } } })  |  courts.service.ts:968-975 async suspend(...) { ... status: CourtStatus.SUSPENDED ... } (no subscription/pricing call)
```
- **Suggested fix (NOT applied):** Exclude SUSPENDED/CHANGES_REQUESTED courts and suspended branches from the billable count (or credit them) and emit a unit-change sync from the moderation actions.

### 96. [MEDIUM] Ops-blocked (suspended) tenants keep being charged the subscription while all their courts are hidden

- **Where:** `backend/src/modules/tenants/tenants.service.ts:62`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** blockTenant only writes blockedAt/blockedReason. Customer queries hide every court/branch of a blocked tenant (courts.service.ts:266), but the Stripe subscription is neither paused nor cancelled, so the vendor keeps paying base + add-ons for a fully disabled account, possibly for months.
- **How to reproduce:** Ops → suspend vendor. Next month Stripe still invoices the vendor's card.
- **Impact:** Suspended vendors are billed for nothing; refund requests and reputational damage.
- **Evidence:**

```
tenants.service.ts:82-85 await this.tenantRepository.update(tenantId, { blockedAt: blocked ? new Date() : null, blockedReason: blocked ? reason : null });  (no subscription / Stripe call in the method)  |  courts.service.ts:266 queryBuilder.andWhere('tenant.blockedAt IS NULL');
```
- **Suggested fix (NOT applied):** On block: pause collection (subscriptions.update pause_collection) or set cancel_at_period_end; on unblock: resume. Show the billing state in the ops console.

### 97. [MEDIUM] Adding a second branch charges the card immediately with no price warning (unlike courts)

- **Where:** `dashboard/src/pages/AddBranch.js:138`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** BRANCH_CREATED → syncAfterUnitChange → doSyncTenantSubscription pushes a branch add-on with proration 'always_invoice', so the prorated $10/mo is charged the moment the branch is saved. AddCourt.js fetches court-availability and shows a confirmation modal with the amount; AddBranch.js has no availability query at all (the only 'availability' strings are schedule availabilities) and the branch-availability response carries no price fields (nextChargeCents/chargedNow are court-only).
- **How to reproduce:** Active subscription, 1 branch. Add a branch → Stripe invoice created and charged instantly; no dialog mentioned money.
- **Impact:** Unexpected card charge with no consent step; vendors with lapsed plans get a raw error only after filling the whole form.
- **Evidence:**

```
subscriptions.service.ts:945-948 @OnEvent(BranchEvent.BRANCH_CREATED) async handleBranchCreated(event) { await this.syncAfterUnitChange(event.branch.tenantId); }  |  :354-359 return { canCreate, currentCount, limit: null, subscriptionStatus }  (no charge info)  |  pricing.service.ts:369 direction === 'decreased' ? 'none' : 'always_invoice'  |  AddBranch.js: grep 'charge|price|billing|canCreate' → no matches
```
- **Suggested fix (NOT applied):** Extend BranchAvailabilityResponseDto with nextBranchChargeCents/currency/chargedNow (also 1 included court changes) and add the same confirm modal + canCreate pre-check to AddBranch.js.

### 98. [MEDIUM] Admin/User staff can create paid courts, but the price-confirmation endpoint is Owner-only → the owner's card is charged with no confirmation

- **Where:** `dashboard/src/pages/AddCourt.js:202`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** POST /courts allows any staff role (isStaff() with no roles). AddCourt.js relies on GET /subscriptions/court-availability to show the 'this court costs X, charged now' modal, but that controller is class-level @AuthorizedUserType.isStaff([StaffRole.OWNER]), so for Admin/User staff the query 403s (retried twice by the default QueryClient), courtAvailability stays undefined, canCreate === false and nextCourtChargeCents > 0 are both false, and the court is created straight away — the backend then invoices the owner's saved card (always_invoice).
- **How to reproduce:** Log in as an Admin staffer, add a 3rd court → no modal, court created, Stripe proration invoice charged.
- **Impact:** A branch manager can trigger recurring charges on the owner's card without anyone seeing a price; owner learns from the invoice.
- **Evidence:**

```
AddCourt.js:202-206 const { data: courtAvailability } = useQuery({ queryKey: ["court-availability"], queryFn: getCourtAvailability, enabled: !id });  :244-253 if (courtAvailability?.canCreate === false) {...} if (courtAvailability?.nextCourtChargeCents > 0) { setPendingCreate(finalData); return; } createCourtMutate(finalData);  |  subscriptions.controller.ts:47-48 @UseGuards(JwtAuthGuard, UserTypeGuard) @AuthorizedUserType.isStaff([StaffRole.OWNER])  |  courts.controller.ts:74-75 @AuthorizedUserType.isStaff() create(
```
- **Suggested fix (NOT applied):** Open GET /subscriptions/court-availability (and branch-availability) to all staff roles (read-only), or block non-owners from creating billable units and tell them to ask the owner.

### 99. [MEDIUM] Open (unpaid) invoices are listed as '0 USD' in the Billing invoice table

- **Where:** `dashboard/src/pages/Billing.js:173`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The Amount column uses record.amountPaidCents ?? record.amountDueCents. Stripe returns amount_paid = 0 (not null) for open/uncollectible invoices, so ?? never falls through and every unpaid invoice — exactly the ones the vendor must act on — shows 0.
- **How to reproduce:** Create a court with a declining test card → Billing → Invoices shows the open invoice with amount 0 USD and status 'open'.
- **Impact:** Vendor cannot see how much is outstanding on a failed add-on/renewal invoice.
- **Evidence:**

```
Billing.js:171-175 dataIndex: "amountPaidCents", ... render: (value, record) => formatAmount(record.amountPaidCents ?? record.amountDueCents, record.currency)  |  subscriptions.service.ts:461-462 amountDueCents: invoice.amount_due, amountPaidCents: invoice.amount_paid
```
- **Suggested fix (NOT applied):** Show amountDueCents for non-paid statuses (status === 'paid' ? amountPaidCents : amountDueCents).

### 100. [MEDIUM] After a scheduled cancellation completes, Billing shows a stale 'plan ends on <past date> … resume from Manage payment method' while that button is hidden and Subscribe is shown

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:510`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** A portal cancellation first arrives as customer.subscription.updated (cancel_at_period_end=true) and is stored in metadata. When the period ends, customer.subscription.deleted only sets status=CANCELLED; metadata.cancelAtPeriodEnd/cancelAt are never cleared, and reconcileWithStripe skips CANCELLED rows. getBillingOverview still returns cancelAtPeriodEnd:true, so Billing.js renders the warning (with a date in the past and advice to use a button that is now hidden because hasSubscription is false) next to the 'No active subscription' CTA. Home.js also hides its subscribe banner because a row exists.
- **How to reproduce:** Cancel from the portal, wait for period end (or use Stripe test clock) → open /billing.
- **Impact:** Contradictory, misleading billing page for every vendor whose plan ended; Home never prompts them to re-subscribe.
- **Evidence:**

```
subscriptions.service.ts:521-523 subscription.status = SubscriptionStatus.CANCELLED; subscription.cancelledAt = new Date(); await this.subscriptionRepository.save(subscription);  :432 cancelAtPeriodEnd: !!subscription.metadata?.cancelAtPeriodEnd,  :90-94 where: { status: In([ACTIVE, PAST_DUE]) }  |  Billing.js:237-249 {overview?.subscription?.cancelAtPeriodEnd && (<Alert ... message={t("billing.ends_on", { date: ... })} description={t("billing.ends_on_hint")}  :206 {hasSubscription && (<Button ...manage_payment  |  Home.js:64-66 showSubscribeBanner = ... ((billingOverview && !billingOverview.subscription) || pendingCharges?.count > 0)
```
- **Suggested fix (NOT applied):** In handleSubscriptionDeleted (and mapStripeStatus→CANCELLED paths) reset metadata.cancelAtPeriodEnd=false/cancelAt=null; in Billing.js only show the ends_on alert when status is live; treat cancelled/unpaid as 'no subscription' on Home.

### 101. [MEDIUM] invoice.paid flips a CANCELLED local subscription back to ACTIVE without checking Stripe

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:550`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Paying an open invoice of a subscription Stripe already cancelled (dunning) does not reactivate it in Stripe, but handleInvoicePaid unconditionally sets the local row ACTIVE whenever it is not ACTIVE/PAST_DUE. The very next line fetches the live status (isFullyPaid) but only uses it to gate courts. Result: dashboard shows 'Active', canAddUnits allows new courts, and the add-on sync then calls subscriptions.update on a canceled subscription (Stripe error → court stuck pending_payment). Corrected only by the 3 AM reconcile.
- **How to reproduce:** Let dunning cancel a subscription, then pay the last open invoice from its hosted page → /billing shows Active.
- **Impact:** Wrong status shown for up to 24 h; courts created in that window are never billed and never released.
- **Evidence:**

```
subscriptions.service.ts:550-559 if (![ACTIVE, PAST_DUE].includes(subscription.status)) { // A paid invoice means the subscription is in good standing again. subscription.status = SubscriptionStatus.ACTIVE; await this.subscriptionRepository.save(subscription); }  :569 if (await this.isFullyPaid(subscriptionId)) {  :606-609 const live = await this.paymentsService.retrieveSubscription(...); return ['active','trialing'].includes(live.status);
```
- **Suggested fix (NOT applied):** Retrieve the live subscription once and set status = mapStripeStatus(live.status) instead of hard-coding ACTIVE.

### 102. [MEDIUM] Add-on sync failure is swallowed, then courts beyond the quota are released unbilled and later charged silently by the nightly reconcile

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:849`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** syncSubscriptionFromStripe catches and only logs a failure of pricingService.syncTenantSubscription. Callers (syncFromStripe, reconcileWithStripe, handleInvoicePaid) then check isFullyPaid — which is true because the add-on items were never added — and call activatePendingCourts, which releases EVERY pending_payment court, including those that exceed the included units. The next successful sync (nightly cron) adds the items with always_invoice, charging the card with no confirmation.
- **How to reproduce:** Make the court add-on price id invalid (or Stripe 5xx) then return from Checkout with 3 courts → all 3 courts move to pending_approval; Stripe subscription has base only.
- **Impact:** Courts go live unpaid; later surprise charge without the promised confirmation; revenue leakage if the sync keeps failing.
- **Evidence:**

```
subscriptions.service.ts:852-861 try { await this.pricingService.syncTenantSubscription(saved); } catch (error) { // Never let an add-on sync failure undo the subscription itself... this.logger.error(...) }  :338-343 if (subscription.providerSubscriptionId && (await this.isFullyPaid(...))) { await this.activatePendingCourts(tenantId); }  :103-106 (reconcile) await this.syncSubscriptionFromStripe(live, ...); if (await this.isFullyPaid(...)) { await this.activatePendingCourts(...) }
```
- **Suggested fix (NOT applied):** Return the sync outcome from syncSubscriptionFromStripe and skip activatePendingCourts when the add-on sync failed; retry the sync with backoff and alert ops.

### 103. [MEDIUM] Past-due renewal with no pending courts has no call to action on Billing/Home/Courts

- **Where:** `dashboard/src/pages/Billing.js:320`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** When the monthly renewal fails, status becomes past_due (still 'live' for the UI). The only hint is the small status text under 'Next Invoice'. The 'Pay open invoice' button and openInvoice logic live exclusively inside the Pending Charges card, which renders only when pendingCharges.count > 0 (a court awaiting payment). Home.js and Courts.js banners are also driven by pending courts only, so a vendor whose card expired sees no alert until Stripe cancels.
- **How to reproduce:** Set the customer's card to a declining one in Stripe test mode and advance a test clock past renewal → /billing shows only 'Past Due' in small text.
- **Impact:** Vendors miss failed renewals and end up cancelled; churn that a single banner would prevent.
- **Evidence:**

```
Billing.js:320 {pendingCharges?.count > 0 && (<Card title={t("billing.pending_charges.title")} ...  :343-352 if (openInvoice?.hostedInvoiceUrl) { window.open(openInvoice.hostedInvoiceUrl, ...) } ... {hasSubscription && openInvoice ? t("billing.pay_invoice") : ...}  :311-315 <small>{overview?.subscription?.status ? t(`billing.subscription_status.${...}`) : t("billing.no_subscription")}</small>  |  Home.js:64-66 showSubscribeBanner = ... (!billingOverview.subscription) || pendingCharges?.count > 0
```
- **Suggested fix (NOT applied):** Render a top-level warning Alert when status === 'past_due' or an open invoice exists, with the hosted invoice link / portal button; reuse it on Home.

### 104. [MEDIUM] Subscription payment-failed notification is in-app only (email: false) — vendors who do not open the dashboard are never told

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:663`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleInvoicePaymentFailed calls notifyStaff with email: false, so a failed renewal produces just a bell entry. The less critical COURT_PENDING_PAYMENT event does send an email (email: true). Combined with the missing past-due banner, a vendor can go from failed payment to cancellation without a single email.
- **How to reproduce:** Fail a renewal in test mode; check the owner's mailbox — nothing.
- **Impact:** Involuntary churn; vendors blame the platform for cancelling them.
- **Evidence:**

```
subscriptions.service.ts:663-674 await this.notificationsService.notifyStaff({ tenantId: subscription.tenantId }, { email: false, type: NotificationType.SUBSCRIPTION_PAYMENT_FAILED, ...  |  :1011-1015 await this.notificationsService.notifyStaff({ tenantId }, { email: true, type: NotificationType.COURT_PENDING_PAYMENT,
```
- **Suggested fix (NOT applied):** Send an email (and push) for SUBSCRIPTION_PAYMENT_FAILED with the hosted invoice link; consider a second reminder before Stripe's final retry.

### 105. [MEDIUM] A court stuck in pending_payment after a Stripe error has no retry path in the UI; 'Pay now' opens a portal with nothing to pay

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:984`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** If syncTenantSubscription throws while handling COURT_CREATED (Stripe outage, invalid price, etc.), the court is left pending_payment and only logged. No invoice exists, so Billing's Pending Charges button falls through to the customer portal, where there is nothing to pay. POST /subscriptions/sync would repair it but the dashboard only calls it from the ?subscription= redirect params; there is no manual 'Refresh/Sync' control. The vendor waits for the 3 AM cron.
- **How to reproduce:** Temporarily break STRIPE_COURT_ADDON_PRICE_ID, create a 3rd court → pending_payment; click 'Pay now' → Stripe portal with no open invoice.
- **Impact:** Vendor cannot publish the court for up to a day and gets no explanation.
- **Evidence:**

```
subscriptions.service.ts:984-994 } catch (error) { // ... Leave it pending — the billing page's pending-charges view and POST /subscriptions/sync reconcile it ... return; }  |  Billing.js:78-87 useEffect(() => { ... const outcome = searchParams.get("subscription"); if (!outcome) return; ... syncMutation.mutate({ sessionId, outcome });  :338-347 if (!hasSubscription) return checkoutMutation.mutate(); if (openInvoice?.hostedInvoiceUrl) {...} portalMutation.mutate();
```
- **Suggested fix (NOT applied):** Add a 'Retry / refresh billing' button that calls POST /subscriptions/sync; when pending courts exist but no open invoice, call syncQuantities server-side before opening the portal.

### 106. [LOW] Non-owner staff receive billing notifications that deep-link to /billing, where every request 403s ('Failed to load billing information')

- **Where:** `dashboard/src/components/layout/NotificationsDropdown.js:119`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** notifyStaff({tenantId}) fans out to every staffer of the tenant (staff.service getStaff has no role filter), so Admin/User staff get COURT_PENDING_PAYMENT / SUBSCRIPTION_PAYMENT_* notifications. Clicking them navigates to /billing (route not role-gated in App.js although the menu entry is hidden for non-owners); all /billing and /subscriptions endpoints are Owner-only, so they see the load_failed alert and an empty page.
- **How to reproduce:** Log in as Admin, create a paid court, click the 'Payment Pending' notification.
- **Impact:** Confusing dead-end for managers; noise notifications they cannot act on.
- **Evidence:**

```
NotificationsDropdown.js:119-122 case "court_pending_payment": case "subscription_payment_failed": case "subscription_payment_succeeded": return "/billing";  |  App.js:81 <Route path="billing" element={<Billing />} />  |  DashboardLayout.js:86 const canSeeBilling = !staffRole || staffRole === "Owner";  |  staff.service.ts:604-612 staff = await this.staffRepository.find({ where: { tenantId, deletedAt: IsNull() }, ...  |  billing.controller.ts:34-35 @UseGuards(JwtAuthGuard, UserTypeGuard) @AuthorizedUserType.isStaff([StaffRole.OWNER])
```
- **Suggested fix (NOT applied):** Send billing notifications to Owners only (or role filter in notifyStaff), and guard the /billing route (redirect non-owners to /home with a message).

### 107. [LOW] Subscribe CTA and Home banner quote the base plan only while the first Checkout bills base + existing add-ons

- **Where:** `dashboard/src/pages/Billing.js:258`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** createCheckoutSession builds line items from the tenant's actual branch/court counts, so a tenant with 2 branches and 5 courts is charged $60/mo at Checkout. The CTA description and the Home banner interpolate only pricing.baseAmountCents ('Subscribe — Base plan 30 USD/mo …').
- **How to reproduce:** Create 2 branches + 5 courts before subscribing → CTA says 30 USD, Checkout says 60 USD.
- **Impact:** Price shown before Checkout differs from the amount charged; trust issue.
- **Evidence:**

```
Billing.js:258-260 description={t("billing.subscribe_cta.description", { amount: formatAmount(pricing?.baseAmountCents, currency) })}  |  Home.js:82-86 amount: `${((billingOverview?.pricing?.baseAmountCents ?? 3000) / 100).toLocaleString()} ...`  |  subscriptions.service.ts:251-252 const breakdown = await this.pricingService.computeTenantBreakdown(tenantId); const lineItems = this.pricingService.buildCheckoutLineItems(breakdown);
```
- **Suggested fix (NOT applied):** Quote breakdown.monthlyAmountCents in the CTA/banner ('Your plan: 60 USD/mo (base 30 + 3 add-ons)').

### 108. [LOW] 'Next Invoice' shows the full monthly amount for cancelled / unpaid plans and for plans scheduled to end

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:440`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** nextInvoiceAmountCents is breakdown.monthlyAmountCents whenever any row exists, regardless of status or cancel_at_period_end. Billing shows e.g. 'Next Invoice 30 USD — Cancelled'.
- **How to reproduce:** Cancel plan, open /billing.
- **Impact:** Misleading number for lapsed vendors.
- **Evidence:**

```
subscriptions.service.ts:440-442 nextInvoiceAmountCents: subscription ? breakdown.monthlyAmountCents : null,  |  Billing.js:304-309 {formatAmount(overview?.nextInvoiceAmountCents ?? breakdown?.monthlyAmountCents, currency)}
```
- **Suggested fix (NOT applied):** Return 0/null when status is cancelled/unpaid or cancelAtPeriodEnd is true, and label the card accordingly.

### 109. [LOW] Billing amounts/dates ignore the UI language and invoice status is shown as raw English Stripe text

- **Where:** `dashboard/src/pages/Billing.js:34`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** formatAmount (Billing.js), formatMoney (AddCourt.js) and the Home banner call toLocaleString() with no locale; the 'plan ends on' date uses toLocaleDateString() without i18n.language whereas invoice dates pass it; the invoice Status tag prints value ('paid', 'open', 'void', 'uncollectible') untranslated and colours everything non-paid orange.
- **How to reproduce:** Switch dashboard to Arabic, open /billing.
- **Impact:** Arabic vendors see mixed-language/locale output on the money page.
- **Evidence:**

```
Billing.js:34-36 const formatAmount = (cents, currency) => `${((cents ?? 0) / 100).toLocaleString()} ${...}`  :242-245 date: new Date(...).toLocaleDateString(),  :166-167 new Date(value).toLocaleDateString(i18n.language)  :180-182 render: (value) => (<Tag color={value === "paid" ? "green" : "orange"}>{value}</Tag>)  |  AddCourt.js:59-60 const formatMoney = (cents, currency) => `${((cents ?? 0) / 100).toLocaleString()} ...`
```
- **Suggested fix (NOT applied):** Pass i18n.language to toLocaleString/toLocaleDateString (or Intl.NumberFormat with currency) and translate invoice statuses (billing.invoice_status.*).

### 110. [LOW] Court 'payment pending' email is English-only and carries a hard-coded '© 2025' footer

- **Where:** `backend/src/emails/court-payment-pending.tsx:49`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The only e-mail in the subscription flow (sent with email:true from handleCourtCreated) has no Arabic variant and a static year in the footer.
- **How to reproduce:** Create a paid court as an Arabic-language owner.
- **Impact:** Arabic vendors get English mail; stale year looks unmaintained.
- **Evidence:**

```
court-payment-pending.tsx:49-51 <Text className="text-[12px] text-gray-500 m-0">© 2025 Court+. All rights reserved.</Text>  |  :15 title="Payment Pending for Your Court"
```
- **Suggested fix (NOT applied):** Use new Date().getFullYear() in the shared footer and localise the template via the staffer's language.

### 111. [LOW] Vendor subscription is priced and charged in USD while every other amount in the product (bookings, payouts, SA default) is SAR

- **Where:** `backend/src/modules/subscriptions/pricing.service.ts:25`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** PRICING.CURRENCY is 'usd' and the live Stripe prices/invoices are USD (GET /billing/invoices returns currency 'usd'); booking payment intents default to 'sar'. Saudi vendors pay FX/cross-border fees and see two currencies in one product. The readiness doc lists this as still open; nothing in code reconciles it.
- **How to reproduce:** Open /billing: '30 USD per month'; open any booking: SAR.
- **Impact:** Confusing pricing and extra card fees for the target market.
- **Evidence:**

```
pricing.service.ts:19-26 export const PRICING = { BASE_AMOUNT_CENTS: 3000, ADDON_AMOUNT_CENTS: 1000, ... CURRENCY: 'usd' }  |  stripe.service.ts:73 currency: (currency || 'sar').toLowerCase(),  |  live GET /billing/invoices → "currency":"usd"
```
- **Suggested fix (NOT applied):** Create SAR prices in Stripe and set PRICING.CURRENCY accordingly (product decision).

### 112. [LOW] First invoice.paid is silently dropped when it arrives before customer.subscription.created — vendor never gets the payment-succeeded notification

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:542`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Stripe does not order events. handleInvoicePaid returns when no local row exists yet, but the controller has already claimed the event id, so it is never retried. Court activation is covered by checkout.session.completed, but SUBSCRIPTION_PAYMENT_SUCCEEDED is lost.
- **How to reproduce:** Complete Checkout; when invoice.paid lands first (common), no 'Subscription Payment Successful' notification.
- **Impact:** Missing first payment confirmation in the bell.
- **Evidence:**

```
subscriptions.service.ts:542-548 const subscription = await this.subscriptionRepository.findOne({ where: { providerSubscriptionId: subscriptionId } }); if (!subscription) { return; }  |  subscriptions.controller.ts:170-172 if (await this.idempotency.alreadyProcessed(event, 'subscriptions')) { return { received: true }; }
```
- **Suggested fix (NOT applied):** When the row is missing, call syncFromStripe-style resolution (retrieve the subscription by id and sync it) before proceeding, or release the event so Stripe retries.

### 113. [LOW] Two courts created concurrently: a court that fits the included quota is flagged billable and left pending_payment

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:1001`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Per-tenant syncs are serialised, but the queued sync reads fresh counts that include both new courts. Each COURT_CREATED handler then computes withoutThisCourt = courtCount - 1 from that shared breakdown, so both courts see courtAddons > withoutThisCourt.courtAddons and both are treated as paid add-ons; reconcilePendingCourts (which would free the included one) is only invoked from syncAfterUnitChange, not from court creation.
- **How to reproduce:** With 1 court and an active plan, submit two Add Court forms within a second.
- **Impact:** An included (free) court waits for a payment that is not required; if the card declines both are stuck.
- **Evidence:**

```
subscriptions.service.ts:1001-1006 const withoutThisCourt = this.pricingService.computeBreakdown(breakdown.branchCount, breakdown.courtCount - 1); const addsBillableAddon = breakdown.courtAddons > withoutThisCourt.courtAddons;  |  :1049-1051 (syncAfterUnitChange) await this.reconcilePendingCourts(tenantId, breakdown);  — not called from handleCourtCreated
```
- **Suggested fix (NOT applied):** Call reconcilePendingCourts after the sync in handleCourtCreated (it already computes free slots from the fresh breakdown).

### 114. [LOW] A court that fits the included units goes straight to ops approval even when the subscription is past_due

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:1033`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** getActiveSubscription includes PAST_DUE, and the 'fits within included units' branch marks the court pending_approval without the isFullyPaid gate that handleInvoicePaid enforces ('courts go to approval only when nothing is outstanding').
- **How to reproduce:** Past-due tenant with 1 court adds a 2nd (included) court → it reaches the ops queue.
- **Impact:** Inconsistent gating; a non-paying vendor can still get new courts approved and live.
- **Evidence:**

```
subscriptions.service.ts:973 const subscription = await this.getActiveSubscription(tenantId);  :1033-1037 // Court fits within the included units: no charge required, send it straight to the ops approval queue. const [updatedCourt] = await this.courtsService.markCourtsPendingApproval([court.id]);  |  :561-575 comment + if (await this.isFullyPaid(subscriptionId)) { await this.activatePendingCourts(...) } else { ...courts stay pending_payment }
```
- **Suggested fix (NOT applied):** Apply the same isFullyPaid check before markCourtsPendingApproval in handleCourtCreated.

### 115. [LOW] branchCount is required by the checkout DTO/Swagger but ignored by the service

- **Where:** `backend/src/modules/subscriptions/dto/checkout-session.dto.ts:10`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** CreateCheckoutSessionDto validates branchCount (IsInt, Min 1, documented as 'Number of branches to subscribe for') but createCheckoutSession derives everything from computeTenantBreakdown and never reads the parameter. API consumers are misled and the dashboard hard-codes 1.
- **How to reproduce:** POST /subscriptions/checkout {branchCount: 99} → charged for actual counts.
- **Impact:** Misleading contract; harmless today.
- **Evidence:**

```
checkout-session.dto.ts:10-12 @IsInt() @Min(1) branchCount: number;  |  subscriptions.service.ts:217-222 async createCheckoutSession(tenantId: string, branchCount: number, successUrl?: string, cancelUrl?: string) — branchCount unused in the body (lines 223-271)  |  Billing.js:132-133 createCheckoutSession({ branchCount: 1, ...
```
- **Suggested fix (NOT applied):** Remove the field from the DTO and the dashboard call.

### 116. [LOW] Webhook for a Stripe subscription that cannot be mapped to a tenant returns 400 and is released — Stripe retries it for 3 days

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:894`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** resolveTenantId throws BadRequestException when metadata.tenantId is absent and no tenant owns the Stripe customer (e.g. a subscription created for a non-tenant customer on the same Stripe account). The controller releases the idempotency claim and rethrows, so every retry re-runs and re-fails, flooding logs.
- **How to reproduce:** Create a subscription in the Stripe dashboard for a customer without tenant metadata.
- **Impact:** Log noise and alert fatigue; no user impact.
- **Evidence:**

```
subscriptions.service.ts:894-896 throw new BadRequestException(`Stripe subscription ${stripeSubscription.id} cannot be matched to a tenant`);  |  subscriptions.controller.ts:196-201 } catch (error) { await this.idempotency.release(event.id); throw error; }
```
- **Suggested fix (NOT applied):** Log and acknowledge (200) unmatched subscriptions instead of throwing.

---

## 5. Vendor sign-up, login, OTP and password reset

22 issues — 1 critical, 2 high, 13 medium, 6 low.

### 117. [CRITICAL] Staff refresh-token query joins `staff` on a `blockedAt` column that does not exist — every vendor/ops token refresh fails, forcing re-login every 15 minutes

- **Where:** `backend/src/modules/auth/auth.service.ts:611`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** The working tree changed getSessionByRefreshToken() to join the user with `user.deletedAt IS NULL AND user.blockedAt IS NULL` for BOTH customers and staff. `Staffer` (staff table) has no `blockedAt` column (only tenants/users got it in migration 1766659502921-admins.ts). Postgres rejects the query; the catch-all turns it into INVALID_REFRESH_TOKEN, so POST /auth/staff/refresh-token can never succeed. The compiled dist (built 04:01:20, served by pid 39795 started 04:29) contains the same condition. Access tokens live 15 min (line 480), so the dashboard/ops console log every staff user out 15 minutes after login (axiosInstance refreshAuthToken → logout + clearTokens on failure).
- **How to reproduce:** Log into the dashboard, wait >14 minutes (or set tokenExpiry near), trigger any API call → request interceptor calls /auth/staff/refresh-token → 401 INVALID_REFRESH_TOKEN → dashboard dispatches logout.
- **Impact:** Every vendor and ops admin is thrown out of the dashboard/ops console 15 minutes after logging in, on any API call; in-flight requests fail. Core session flow is broken for all staff.
- **Evidence:**

```
auth.service.ts:604-613  .leftJoinAndMapOne('session.user', decoded.type === UserType.Staff ? Staffer : User, 'user', 'user.id = session.userId AND user.deletedAt IS NULL AND user.blockedAt IS NULL')
auth.service.ts:648-650  } catch (error) { throw new UnauthorizedException(INVALID_REFRESH_TOKEN); }
staff.entity.ts:14-101   class Staffer — columns firstName…deletedAt; no blockedAt
psql: SELECT session.id FROM sessions session LEFT JOIN staff "user" ON "user".id = session."userId" AND "user"."deletedAt" IS NULL AND "user"."blockedAt" IS NULL  → ERROR: column user.blockedAt does not exist
information_schema.columns(staff): createdAt,updatedAt,id,firstName,lastName,email,pendingEmail,phoneNumber,password,verifiedAt,lastPasswordChangeAt,tenantId,role,notificationsCount,deletedAt
dist/src/modules/auth/auth.service.js:409 contains the same 'user.blockedAt IS NULL' condition
```
- **Suggested fix (NOT applied):** Build the join condition per user type: for Staffer use only `user.deletedAt IS NULL` (or add a blockedAt column to staff via migration if staff blocking is intended). Add a unit/integration test for staff refresh.

### 118. [HIGH] Dashboard treats an expired access token as logged-out on reload: any 15-minute break forces a fresh login although a 30-day refresh token exists

- **Where:** `dashboard/src/modules/AuthWrapper.js:11`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** auth.js loadAuthFromStorage() was changed to keep isAuthenticated=true with an expired tokenExpiry (comment: 'the request interceptor refreshes on the first call'), but AuthWrapper and GuestWrapper still require `tokenExpiry > currentTime`. On page load/refresh after the 15-minute access token expired, AuthWrapper renders <Navigate to="/auth/signin"> before any request (and hence any refresh) happens, and GuestWrapper then shows the sign-in form. The valid refresh token in localStorage is never used; the old session row stays active.
- **How to reproduce:** Log in, wait 16 minutes, press F5 → sign-in page appears; localStorage still holds refreshToken.
- **Impact:** Vendors who reopen or reload the dashboard after >15 min idle must log in again every time; the 'stay logged in for 30 days' behaviour advertised by the auth.js fix does not work (independent of the backend refresh bug).
- **Evidence:**

```
AuthWrapper.js:9-16   const isTokenValid = useMemo(() => { const currentTime = Math.floor(Date.now()/1000); return isAuthenticated && tokenExpiry > currentTime; }, …); if (!isTokenValid) { return <Navigate to="/auth/signin" replace />; }
GuestWrapper.js:9-14  same check; if (isTokenValid) redirect to "/"
auth.js:20-33         // An expired ACCESS token is not a logged-out user … return { …, isAuthenticated: true, tokenExpiry: parseInt(tokenExpiry) };
auth.service.ts:476-481 accessToken … expiresIn: '15m'
```
- **Suggested fix (NOT applied):** In AuthWrapper/GuestWrapper treat the presence of a refresh token as authenticated, and on boot (or when tokenExpiry is past) call refreshAuthToken() before rendering protected routes; only redirect when refresh fails.

### 119. [HIGH] Login/forgot-password rate limit is keyed only by e-mail and counts successful requests: 6 requests in 15 min blocks that e-mail for 1 hour, so anyone can lock any vendor or ops admin out of login

- **Where:** `backend/src/app.module.ts:116`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The 'auth' throttler is limit 6 / ttl 15 min / blockDuration 1 h. /auth/staff/login uses the key `login-email-<email>` with no IP component, and @nestjs/throttler increments the counter before the handler runs, so successful logins count too. Any unauthenticated caller who knows an address (e.g. admin@…, a vendor's public contact e-mail) can send 6 requests and lock that account out of login for an hour, repeatedly. The same applies to forgot-password (per e-mail) — a victim cannot request a reset while under attack — and to signup (per IP: a sports complex behind one NAT that creates 7 accounts is blocked for an hour). The dashboard shows 'Too many attempts. Please wait a moment and try again.' for a 1-hour block.
- **How to reproduce:** POST /auth/staff/login 6× with {email: victim, password: 'wrongwrong'} from any IP → 7th request (even with the correct password) returns 429 TOO_MANY_REQUESTS for 60 minutes.
- **Impact:** Denial of service against any vendor's or ops admin's login (and password reset) by an anonymous attacker; legitimate users who sign in from several devices/tabs within 15 minutes also lock themselves out for an hour.
- **Evidence:**

```
app.module.ts:114-120   throttlers: [{ name: 'auth', ttl: ms('15m'), limit: 6, blockDuration: ms('1h') }, …
auth.staff.controller.ts:70-77  @Throttle({ auth: { generateKey(req) { … return `login-email-${normalizeEmailKey(request.body.email)}`; } } })
auth.staff.controller.ts:141-148 `forgot-password-${normalizeEmailKey(request.body.email)}`
auth.staff.controller.ts:45-52  signup key `signup-email-${ip}`
node_modules/@nestjs/throttler/dist/throttler.guard.js:115-117 const { totalHits, …, isBlocked } = await this.storageService.increment(key, ttl, limit, blockDuration, throttler.name); if (isBlocked) { …
dashboard/public/assets/locales/en.json errors.TOO_MANY_REQUESTS: "Too many attempts. Please wait a moment and try again."
```
- **Suggested fix (NOT applied):** Key the login limiter on email+IP (or use separate per-IP and per-email budgets with a much higher per-email limit), skip counting successful logins (reset the bucket on success), shorten blockDuration, and adjust the TOO_MANY_REQUESTS copy to state the actual wait.

### 120. [MEDIUM] A 401 from the API never logs the dashboard out: after a server-side session revocation the user keeps a dead session and sees generic errors for up to 15 minutes

- **Where:** `dashboard/src/service/axiosInstance.js:152`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The response interceptor's 401 handling is commented out; only the request interceptor refreshes, and only when the local tokenExpiry is within 60 s. When the backend revokes the session (password reset from another device → revokeAllSessions, logout elsewhere, JwtStrategy denylist SESSION_REVOKED), every call returns 401 but the dashboard keeps the tokens and stays on the page; each screen shows 'Something went wrong' until the access token's own expiry triggers a refresh that fails.
- **How to reproduce:** Log in on two browsers; reset the password via forgot-password in browser A; use browser B → every request 401s, no redirect, 'Something went wrong' toasts.
- **Impact:** After resetting their password (or logging out on another device) a vendor's other open dashboard shows failing pages with a generic error instead of being sent to sign in.
- **Evidence:**

```
axiosInstance.js:143-174  axiosInstance.interceptors.response.use((response) => response, async (error) => { … // if (error.response?.status === 401 && !originalRequest._retry) { … } (entire block commented out) … return Promise.reject(error); });
axiosInstance.js:128-136  if (tokenExpiry && tokenExpiry - currentTime < 60) { accessToken = await refreshAuthToken(); …
jwt.strategy.ts:42-45     const revoked = await this.cacheManager.get(revokedSessionKey(payload.sid)); if (revoked) { throw new UnauthorizedException('SESSION_REVOKED'); }
auth.service.ts:676-688   handlePasswordReset → this.revokeAllSessions(user.id)
```
- **Suggested fix (NOT applied):** Restore the 401 branch: on 401 for a non-/auth URL, attempt one refresh and retry, and if that fails dispatch logout() and redirect to /auth/signin.

### 121. [MEDIUM] Concurrent requests queued behind a failing token refresh are never resolved — they hang forever

- **Where:** `dashboard/src/service/axiosInstance.js:65`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** refreshAuthToken() pushes waiting callers into refreshSubscribers while a refresh is in flight and only drains that array on the success path. On the failure paths (invalid response, thrown error, missing refresh token) it dispatches logout and returns null without resolving the queued promises, so every request that arrived during the failed refresh stays pending indefinitely (spinners never end, mutations never settle).
- **How to reproduce:** Let the access token near expiry, open a page with 3+ parallel queries, make refresh fail → 2+ requests never resolve; React Query shows perpetual loading.
- **Impact:** Pages that fire several queries at once (Home, Courts, Schedule) freeze with loading states when the refresh fails (which currently is always, see the refresh-join finding).
- **Evidence:**

```
axiosInstance.js:65-70   if (isRefreshing) { return new Promise((resolve) => { refreshSubscribers.push(resolve); }); }
axiosInstance.js:77-82   if (!data?.accessToken || !data?.refreshToken) { … dispatch(logout()); clearTokens(); return null; }   // subscribers not resolved
axiosInstance.js:104-105 refreshSubscribers.forEach((callback) => callback(data.accessToken)); refreshSubscribers = [];   // success only
axiosInstance.js:108-112 } catch (err) { … dispatch(logout()); clearTokens(); return null; }   // subscribers not resolved
```
- **Suggested fix (NOT applied):** Keep a rejecter list too (or resolve with null) and drain refreshSubscribers in a finally block on every exit path.

### 122. [MEDIUM] Refresh-token rotation has no grace window: two dashboard tabs refreshing at the same time log both tabs out

- **Where:** `backend/src/modules/auth/auth.service.ts:483`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Each refresh replaces the session's hashed refresh token in place, immediately invalidating the previous one. The dashboard's isRefreshing lock is per tab, and the refresh trigger is time-based (tokenExpiry − now < 60 s), so two open tabs both send the same old refresh token; the second one is rejected (INVALID_REFRESH_TOKEN) and that tab runs dispatch(logout()) + clearTokens(), which wipes the NEW tokens the first tab just stored — both tabs end up logged out.
- **How to reproduce:** Open the dashboard in two tabs, wait until the access token is about to expire, interact with both within a few seconds → one refresh succeeds, the other fails and clears localStorage.
- **Impact:** Vendors who keep two dashboard tabs open (schedule + courts is common) get logged out of both after an idle period.
- **Evidence:**

```
auth.service.ts:483-496  const hashedRefreshToken = await hashPassword(refreshToken); await this.sessionsRepository.upsert({ id: sid, … refreshToken: hashedRefreshToken, … }, { conflictPaths: ['id'] });
auth.service.ts:615-626  const isValid = await verifyPassword({ hash: session.refreshToken, password: refreshToken }); if (… || !isValid) { throw new UnauthorizedException(INVALID_REFRESH_TOKEN); }
axiosInstance.js:49      let isRefreshing = false;   // module-level, per tab
axiosInstance.js:108-112 catch (err) { … dispatch(logout()); clearTokens(); return null; }
auth-utils.js:19-25      clearTokens removes accessToken/refreshToken/tokenExpiry/userData/role
```
- **Suggested fix (NOT applied):** Accept the previous refresh token for a short grace period (store prev hash + timestamp) or issue per-request idempotent rotation; on the client, use a shared lock (BroadcastChannel/localStorage lock) and do not clear tokens when localStorage already holds a newer refresh token.

### 123. [MEDIUM] Sign-in shows no message at all when the API is unreachable (network error / backend down)

- **Where:** `dashboard/src/actions/auth_actions.js:9`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** signInStaff swallows the request error via .catch((err) => err). When there is no HTTP response (connection refused, DNS, CORS), data.response is undefined, so the code falls through to destructuring accessToken from the AxiosError and jwtDecode(undefined) throws; the outer catch only returns a value when error.response exists, so it returns undefined. SigninForm only notifies when the thunk returns a string, so the button just stops loading with no feedback.
- **How to reproduce:** Stop the backend (or set REACT_APP_API_URL to an unreachable host), submit valid credentials → no notification.
- **Impact:** Vendors clicking Sign In during an outage or with a wrong API URL see nothing happen and retry blindly.
- **Evidence:**

```
auth_actions.js:7      const data = await authService.signInStaff(credentials).catch((err) => err);
auth_actions.js:9-13   if (data.response && data.response.data) { return data.response.data.code || …; }
auth_actions.js:24-27  const { accessToken, refreshToken, user } = data; const decodedToken = jwtDecode(accessToken);
auth_actions.js:48-56  } catch (error) { … if (error.response && error.response.data) { … return new Error(errorMessage); } }   // else returns undefined
SigninForm.js:18-22    const data = await dispatch(signInStaff(values)); if (typeof data === "string") { notify("error", …) }
```
- **Suggested fix (NOT applied):** In signInStaff return a code (e.g. 'NETWORK_ERROR') when err.response is absent and map it to a localized message; also drop the `new Error(...)` return, which SigninForm never handles.

### 124. [MEDIUM] Invited vendor's automatic login after 'Finish setup' is discarded by redux-persist rehydration — they land on the sign-in page

- **Where:** `dashboard/src/pages/SignupForm.js:39`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The tokened signup path writes the session into the individual localStorage keys and then hard-reloads to /home without dispatching login/setAuthData. The store is wrapped in redux-persist (key 'persist:root', PersistGate). On reload, auth's initial state is rebuilt from the keys (isAuthenticated true) but the REHYDRATE action then merges the last persisted auth state (autoMergeLevel1 overwrites keys unchanged since init) — which for this browser is the guest state written while the signup page was open — so isAuthenticated becomes false and AuthWrapper redirects to /auth/signin. The user who just set a password is shown a login form with no explanation.
- **How to reproduce:** Open /auth/signup?token=…&email=… in a browser that has visited the dashboard before, complete the form → redirected to /home → immediately shown /auth/signin.
- **Impact:** Vendors coming from the marketing-site e-mail link finish setup and are bounced to sign-in instead of the dashboard; confusing first impression (they can log in manually).
- **Evidence:**

```
SignupForm.js:37-55   if (invitationToken && data?.accessToken) { … localStorage.setItem("accessToken", accessToken); … localStorage.setItem("role", role); … window.location.href = "/home"; return; }   // no dispatch
context/index.js:7-13  const persistConfig = { key: "root", storage, whitelist: ["auth"] }; const persistedReducer = persistReducer(persistConfig, authReducer);
index.js:28-30         <Provider store={store}><BrowserRouter><PersistGate loading={null} persistor={persistor}>
auth.js:39-42          const persistedAuthState = loadAuthFromStorage(); const authSlice = createSlice({ … initialState: persistedAuthState,
auth_actions.js:38-47  (normal login DOES dispatch setAuthData, so persist:root and the keys agree there)
```
- **Suggested fix (NOT applied):** Dispatch setAuthData (or the login reducer) with the returned tokens and navigate() instead of writing raw keys + hard reload; better, make redux-persist the single source of truth and drop the duplicated key writes.

### 125. [MEDIUM] 'Users' menu is shown to Admin/User-role staff but GET /staff is Owner-only — they get an untranslated 'Failed to load users' error

- **Where:** `dashboard/src/components/layout/DashboardLayout.js:96`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The sidebar gates only Billing by role (canSeeBilling) while the Users entry is unconditional and App.js has no role guard on /users. The Users page queries GET /staff, which the backend restricts to Owner (AuthorizedUserType.isStaff([StaffRole.OWNER])). Admin and User staff therefore see a menu item that always fails with a hard-coded English toast.
- **How to reproduce:** Invite a staff member as Admin, log in as them, click Users → 403 → 'Failed to load users'.
- **Impact:** Every non-Owner dashboard user has a permanently broken menu entry; Arabic users see an English error.
- **Evidence:**

```
DashboardLayout.js:87    const canSeeBilling = !staffRole || staffRole === "Owner";
DashboardLayout.js:96-100 { key: "users", icon: <FiUsers …/>, label: <Link to="/users">{t("sideNav.users")}</Link> },   // no role check
staff.controller.ts:280-281 @Get() @AuthorizedUserType.isStaff([StaffRole.OWNER])
staff.service.js:26      url: branchId ? `${API_URL}?branchId=${branchId}` : API_URL,   // GET /staff
Users.js:63-65           useEffect(() => { if (isError) message.error("Failed to load users"); }, [isError]);
```
- **Suggested fix (NOT applied):** Hide the Users entry (and guard the /users route) unless role === 'Owner', and localize the error via notifyError.

### 126. [MEDIUM] Changing the password from Settings does not revoke other sessions (unlike the reset flow), so a stolen refresh token survives a password change

- **Where:** `backend/src/modules/staff/staff.service.ts:692`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** AuthService.resetPassword emits PASSWORD_CHANGED and the handler revokes every session ('A changed password must invalidate a stolen refresh token'). StaffService.changePassword (POST /staff/me/change-password, used by the dashboard Settings page) only updates the hash and lastPasswordChangeAt; no event, no revokeAllSessions, no denylist. Other devices keep working for up to 30 days.
- **How to reproduce:** Log in on device A and B; change password on A via Settings; device B continues to work and can refresh for 30 days.
- **Impact:** A vendor who changes their password after suspecting compromise does not actually kick out the attacker's session.
- **Evidence:**

```
staff.service.ts:692-696  const hashedPassword = await hashPassword(newPassword); await this.update(userId, { password: hashedPassword, lastPasswordChangeAt: new Date() });   // nothing else
auth.service.ts:418-420   this.eventEmitter.emit(AuthEvent.PASSWORD_CHANGED, { user } satisfies UserPayload);
auth.service.ts:676-688   @OnEvent(AuthEvent.PASSWORD_CHANGED) … // A changed password must invalidate a stolen refresh token. this.revokeAllSessions(user.id),
Settings.js:158-161       await changePassword({ currentPassword: values.oldPassword, newPassword: values.newPassword,
```
- **Suggested fix (NOT applied):** Emit AuthEvent.PASSWORD_CHANGED (or call authService.revokeAllSessions(userId, currentUser.sid)) from changePassword.

### 127. [MEDIUM] Auth pages mix hard-coded English into Arabic/RTL screens (buttons, links, helper text, hero copy, validation)

- **Where:** `dashboard/src/pages/SigninForm.js:73`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** All five auth screens contain literal English strings that bypass i18n, so a vendor using the Arabic dashboard sees an RTL page with English buttons and sentences: Sign In/Sign Up/Reset Password buttons, 'Loading...', 'Do not have an account? Join Now', 'have an account? Join Now', the hero paragraph, the OTP/reset explanatory text, 'Back to Sign In', the fallback 'Invalid username or password' notification, and the 'Passwords do not match!' validator (both Signup and Reset).
- **How to reproduce:** Switch the dashboard to Arabic, open /auth/signin, /auth/signup, /auth/verification, /auth/forget-password, /auth/reset-password.
- **Impact:** Arabic-speaking vendors get a half-translated onboarding experience; the first thing a new vendor sees is inconsistent.
- **Evidence:**

```
SigninForm.js:25   notify("error", "Invalid username or password");
SigninForm.js:73   {loading ? "Loading..." : "Sign In"}
SigninForm.js:82-85 Do not have an account?{" "}<Link …>Join Now</Link>
SignupForm.js:124  return Promise.reject("Passwords do not match!");   (also ResetPass.js:136)
SignupForm.js:141  Sign Up   /  SignupForm.js:158-159 Create a free account and get full access to hundred of courts…
OtpForm.js:100-102 Court+ just sent you a 8-Digit Code to … please check your Email & enter the code below.
ForgetPass.js:60   Reset Password   /  ResetPass.js:100-101, 153, 171-174 hard-coded English
```
- **Suggested fix (NOT applied):** Move every literal into the auth.* locale block (en + ar) and use t(); use message keys in the confirm-password validators.

### 128. [MEDIUM] OTP page copy and wiring are wrong: says '8-Digit Code' for a 6-digit code, submit button reads 'Sign Up', and the 'Join Now' link has a trailing space that opens a blank page

- **Where:** `dashboard/src/pages/OtpForm.js:101`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The verification screen tells the user an 8-digit code was sent while the input is length 6 and the backend requires exactly 6 characters; the primary button is labelled 'Sign Up' although the action is 'Verify'; and the footer link target is "/auth/signin " (trailing space) which does not match any nested route, so clicking it renders nothing inside GuestWrapper. The Signup and ForgetPass footers also read 'have an account? Join Now' while pointing to sign-in.
- **How to reproduce:** Sign up, land on /auth/verification, read the text, click 'Join Now' → URL /auth/signin%20, blank page.
- **Impact:** New vendors are told to look for a code that never arrives in that shape, press a mislabelled button, and can hit a blank page from the verification screen.
- **Evidence:**

```
OtpForm.js:100-102  Court+ just sent you a 8-Digit Code to <strong>{email}</strong> …
OtpForm.js:106      <Input.OTP size="large" length={6} />
verify-code.dto.ts:55-56 @Length(6, 6, { message: INVALID_CODE }) code: string;
OtpForm.js:116      Sign Up   (submit button label on the verify form)
OtpForm.js:134      <Link className="active" to="/auth/signin ">   (trailing space)
SignupForm.js:147-150  have an account? <Link … to="/auth/signin">Join Now</Link>
App.js:50-57        nested <Routes> for signin/signup/verification/… — "signin " matches none
```
- **Suggested fix (NOT applied):** Fix the copy to '6-digit', label the button 'Verify', remove the trailing space, and change the footer sentences to 'Already have an account? Sign in'.

### 129. [MEDIUM] Staff invitation link omits the e-mail parameter and the invited signup page is titled 'Finish setting up your facility' even for staff joining an existing business

- **Where:** `backend/src/modules/staff/staff.service.ts:387`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** SignupForm expects `/auth/signup?token=…&email=…` (pre-fills and locks the address because the backend binds the token to that exact e-mail). The vendor-registration link includes email, but the staff-invitation link built in generateInviteLink does not, so invited staff must re-type the exact address (a typo yields INVALID_INVITATION with no hint). In addition, isInvited is derived from the token alone, so an Admin/User invited into someone else's tenant sees the heading 'Finish setting up your facility'.
- **How to reproduce:** As Owner invite staff@x.com as Admin; open the link from the e-mail → email field empty, heading says 'Finish setting up your facility'; type Staff@X.com (any other address) → 'This invitation is invalid or has expired.'
- **Impact:** Invited staff get a confusing heading and can fail signup by typing a different e-mail than the one invited; the copy misleads them about what they are joining.
- **Evidence:**

```
staff.service.ts:386-387  const baseUrl = this.configService.get<string>('FRONTEND_URL'); const invitationLink = `${baseUrl}/auth/signup?token=${token}`;
vendors.service.ts:124    const registrationLink = `${baseUrl}/auth/signup?token=${token}&email=${encodeURIComponent(email)}`;
SignupForm.js:16-23       // … arrives here from the link in their email: /auth/signup?token=...&email=... … const invitedEmail = searchParams.get("email") || undefined; const isInvited = Boolean(invitationToken);
SignupForm.js:73          <h2>{isInvited ? t("auth.finish_setup") : t("auth.sign_up")}</h2>   // en: "Finish setting up your facility"
staff.service.ts:145-150  if (!invitation || invitation.email !== email || …) { throw new NotFoundException(INVALID_INVITATION); }
```
- **Suggested fix (NOT applied):** Append `&email=` to the staff invitation link and pick the heading from the invitation role/tenant (e.g. 'Join {tenantName}').

### 130. [MEDIUM] FRONTEND_URL is optional in config validation, so invitation and registration e-mails can carry 'undefined/auth/signup?…' links

- **Where:** `backend/src/config/validation.ts:49`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Both link builders interpolate the frontend base URL without a fallback; Joi marks FRONTEND_URL optional, so a deployment that omits it boots fine and silently sends broken links to every invited staff member and every vendor registering from the website (also the 'account exists' e-mail's sign-in/reset links). The two call sites also read the value through different keys ('FRONTEND_URL' vs 'app.frontendUrl').
- **How to reproduce:** Start the backend without FRONTEND_URL, trigger POST /vendors/register → e-mail contains 'undefined/auth/signup?token=…'.
- **Impact:** Vendors and invited staff receive unusable onboarding links if the variable is missing; nothing in boot or logs flags it.
- **Evidence:**

```
validation.ts:49          FRONTEND_URL: Joi.string().uri().optional(),
staff.service.ts:386-387  const baseUrl = this.configService.get<string>('FRONTEND_URL'); const invitationLink = `${baseUrl}/auth/signup?token=${token}`;
vendors.service.ts:123-124 const baseUrl = this.configService.get<string>('app.frontendUrl'); const registrationLink = `${baseUrl}/auth/signup?token=${token}&email=…`;
vendors.service.ts:164,172-173 signInLink: `${baseUrl}/auth/signin`, resetPasswordLink: `${baseUrl}/auth/forget-password`
```
- **Suggested fix (NOT applied):** Make FRONTEND_URL required (Joi .required()), and read it from one config key everywhere.

### 131. [MEDIUM] Signing up with the e-mail of a deactivated (soft-deleted) staff account returns 409 DUPLICATE_ENTRY, shown as 'Something went wrong'

- **Where:** `backend/src/modules/auth/auth.service.ts:90`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** signupWithEmail checks staffService.exists({email}), which honours TypeORM's soft-delete filter and therefore misses rows with deletedAt set, but the unique index idx_staff_email covers soft-deleted rows. The insert fails with a 23505, which HttpExceptionFilter maps to 409 DUPLICATE_ENTRY — a code the dashboard's COVERED_CODES list lacks, so the user gets the generic fallback and no way forward. The invite flow already handles this case with STAFF_EMAIL_DEACTIVATED; signup does not. The same happens for the marketing-site registration link for such an address (vendors.register also excludes soft-deleted rows).
- **How to reproduce:** Delete a staff account via Settings, then POST /auth/staff/signup with the same e-mail → 409 {code:'DUPLICATE_ENTRY'} → dashboard 'Something went wrong. Please try again.'
- **Impact:** A staff member who deleted their account and later tries to sign up again (or is re-invited/registered) is stuck with a meaningless error.
- **Evidence:**

```
auth.service.ts:90-93     const existingUser = await this.staffService.exists({ email }); if (existingUser) { throw new BadRequestException(ACCOUNT_ALREADY_EXISTS); }
staff.service.ts:113-115   async exists(where) { return this.staffRepository.exists({ where }); }   // soft-deleted rows excluded
staff.entity.ts:12         @Index('idx_staff_email', ['email'], { unique: true })
exception-filter.ts:34-38  if (driverCode === '23505') { status = 409; code = DUPLICATE_ENTRY; }
staff.service.ts:341-349   // The unique index covers soft-deleted rows: re-creating a deactivated admin's e-mail was a raw 500 … throw new BadRequestException(STAFF_EMAIL_DEACTIVATED);
errorMessages.js:5-86      COVERED_CODES has no DUPLICATE_ENTRY / STAFF_EMAIL_DEACTIVATED
```
- **Suggested fix (NOT applied):** Use withDeleted:true in the existence check and return STAFF_EMAIL_DEACTIVATED (add it and DUPLICATE_ENTRY to the dashboard error map), or restore/reactivate the soft-deleted row.

### 132. [MEDIUM] resend-verification-code and reset-password disclose whether an e-mail has a staff account, defeating the anti-enumeration design of forgot-password and /vendors/register

- **Where:** `backend/src/modules/auth/auth.service.ts:503`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** forgotPassword deliberately returns nothing for unknown e-mails and VendorsService.register returns an identical response 'so the endpoint cannot be used to discover which emails have accounts'. But the public POST /auth/staff/resend-verification-code answers 400 INVALID_EMAIL for unknown addresses and 201 for known ones, and POST /auth/staff/reset-password answers {isValid:false, errorCode:'INVALID_EMAIL'} vs 'INVALID_CODE'. Both are throttled per e-mail (not per IP), so an attacker can probe a different address on every request without limit.
- **How to reproduce:** POST /auth/staff/resend-verification-code {email:'x@y.com'} → 400 INVALID_EMAIL; with an existing vendor e-mail → 201.
- **Impact:** Vendor and ops-admin e-mail addresses can be enumerated by anyone, which feeds the login-lockout attack above and phishing.
- **Evidence:**

```
auth.service.ts:501-505  async sendVerificationCode({ email }) { const staffer = await this.staffService.getByEmail(email); if (!staffer) { throw new BadRequestException(INVALID_EMAIL); }
auth.service.ts:388-396  async resetPassword(…) { const staffer = …; if (!staffer) { return { isValid: false, errorCode: INVALID_EMAIL }; }
auth.service.ts:376-380  async forgotPassword(email) { const staffer = …; if (!staffer) { return; }
vendors.controller.ts:23-27 description: 'Always returns success, whether or not a link was sent, so the endpoint cannot be used to discover which emails have accounts'
auth.staff.controller.ts:92-99 key `resend-code-${normalizeEmailKey(request.body.email)}`
```
- **Suggested fix (NOT applied):** Return 201 silently from resend-verification-code for unknown addresses and return INVALID_CODE (not INVALID_EMAIL) from reset-password.

### 133. [LOW] Verification and reset e-mails say the code expires in 10 minutes; the backend keeps it valid for 15

- **Where:** `backend/src/emails/account-verification.tsx:26`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Both OTP e-mail templates state a 10-minute expiry while VerificationService.createVerification sets expiresAt = now + 15 minutes.
- **How to reproduce:** Trigger signup or forgot-password and read the e-mail.
- **Impact:** Users who read the e-mail late believe their code is dead and request a new one unnecessarily (eating into the 6-per-15-min resend budget).
- **Evidence:**

```
account-verification.tsx:25-27  This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
forgot-password.tsx:25-27       This code will expire in 10 minutes. …
verification.service.ts:66      expiresAt: dayjs().add(15, 'minutes').toDate(),
```
- **Suggested fix (NOT applied):** Pass the expiry into the template from one shared constant.

### 134. [LOW] Auth DTOs call .toLowerCase() on the raw `email` value, so a non-string e-mail crashes with 500 instead of a 400 validation error

- **Where:** `backend/src/modules/auth/dto/login.dto.ts:27`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** EmailLoginDto, EmailSignupDto, SendVerificationCodeDto and ResetPasswordDto transform `value.toLowerCase()` without a type guard (VerifyEmailCodeDto has one). class-transformer runs the transform before class-validator, so a body like {"email": null} or {"email": 123} throws a TypeError inside the ValidationPipe, which the catch-all filter reports as 500 INTERNAL_SERVER_ERROR and logs as an error. All such junk shares the 'unknown' throttle bucket.
- **How to reproduce:** POST /auth/staff/login {"email": 123, "password": "xxxxxxxx"} → 500 INTERNAL_SERVER_ERROR (expected 400 INVALID_EMAIL).
- **Impact:** Malformed clients/attackers can generate 500s and error-log noise on public auth endpoints; the response tells the client nothing useful.
- **Evidence:**

```
login.dto.ts:26-28          @IsEmail(undefined, { message: INVALID_EMAIL }) @Transform(({ value }) => value.toLowerCase()) email: string;
signup.dto.ts:38-40         same pattern
forgot-password.dto.ts:10-12 same pattern
reset-password.dto.ts:33-35  same pattern
verify-code.dto.ts:44       @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))   // guarded version
exception-filter.ts:20-21   let status = 500; let code = 'INTERNAL_SERVER_ERROR';
```
- **Suggested fix (NOT applied):** Guard the transform (typeof value === 'string' ? value.trim().toLowerCase() : value) in all four DTOs.

### 135. [LOW] Settings 'change password' has no client-side minimum length; the server's default English validation text is shown verbatim

- **Where:** `dashboard/src/pages/Settings.js:378`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Signup and reset enforce min 8 with localized messages, but the Settings form only marks newPassword required. ChangePasswordDto uses @MinLength(8) with the library default message, which HttpExceptionFilter forwards as `code` and errorMessages.getErrorMessage passes through as a readable string — so Arabic users see 'newPassword must be longer than or equal to 8 characters'.
- **How to reproduce:** Settings → change password → new password 'abc' → English library message.
- **Impact:** Inconsistent password rules across screens and an untranslated error in the Arabic dashboard.
- **Evidence:**

```
Settings.js:378-383   <Form.Item name="newPassword" label={t("settings.newPassword")} rules={[{ required: true }]}>
change-password.dto.ts:18-21  @IsString() @IsNotEmpty() @MinLength(8) newPassword: string;   // no custom message
exception-filter.ts:26-30 const message = … exceptionResponse['message'] …; code = (Array.isArray(message) ? message[0] : message) ?? exception.message;
errorMessages.js:101-106  if (CODE_PATTERN.test(code)) {…} return code; // readable backend message
```
- **Suggested fix (NOT applied):** Add { min: 8, message: t('auth.password_min') } on the client and use INVALID_PASSWORD as the DTO message.

### 136. [LOW] Logout after more than 15 minutes idle never reaches the server: the session row stays active for 30 days

- **Where:** `dashboard/src/components/layout/NavDropdown.js:40`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleLogout calls POST /auth/staff/logout with the stored access token. The request interceptor skips refresh for every /auth URL, so an expired access token is sent as-is, the JwtAuthGuard rejects it with 401, the error is swallowed, and only the local tokens are cleared. The refresh token remains valid server-side (session ACTIVE, expiresAt +30 d) and is never denylisted.
- **How to reproduce:** Log in, wait 16 minutes, click Logout → POST /auth/staff/logout returns 401; sessions row still status='active'.
- **Impact:** On a shared computer, 'Logout' after an idle period does not revoke the session; anyone who copied the refresh token from localStorage keeps access.
- **Evidence:**

```
NavDropdown.js:38-47   const handleLogout = async () => { try { await authService.logoutStaff(); } catch (e) { // Best effort: the local session is dropped regardless. } … dispatch(logout()); };
axiosInstance.js:121-123 if (config.url.startsWith("/auth")) { return config; }   // no refresh for /auth/staff/logout
auth.staff.controller.ts:202-206 @Post('logout') @UseGuards(JwtAuthGuard) async logout(@CurrentUser() user) { return this.authService.logout(user); }
auth.service.js:8-14   logoutStaff() { return apiRequest({ method: "post", url: `${API_URL}/logout`, customHeaders: authHeader() }); }
```
- **Suggested fix (NOT applied):** Refresh before calling logout (or allow the logout endpoint to accept the refresh token via JwtRefreshGuard) and revoke by sid.

### 137. [LOW] verify-code accepts context=password_reset and validates reset codes without consuming them, giving a second, separately-throttled guessing channel

- **Where:** `backend/src/modules/auth/auth.staff.controller.ts:119`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** POST /auth/staff/verify-code takes any VerificationContext from the client. With context 'password_reset' it runs verifyCode (which never deletes the row) and returns {verified:true/false}; only ACCOUNT_VERIFICATION triggers a side effect. Its throttle bucket (`verify-code-<email>`) is separate from `reset-password-<email>`, doubling the attempts per 15 minutes against a 6-digit reset code and letting an attacker confirm a guessed code before spending it on the reset endpoint.
- **How to reproduce:** POST /auth/staff/verify-code {email, code, context:'password_reset'} repeatedly.
- **Impact:** Slightly weakens reset-code security; no direct account takeover on its own given the 6-attempt throttle.
- **Evidence:**

```
auth.staff.controller.ts:119-134  @Post('verify-code') async verifyCode(@Body() body: VerifyEmailCodeDto) { const { isValid, errorCode, context, userId } = await this.verificationService.verifyCode({ ...body, channel: VerificationChannel.EMAIL, identifier: body.email, userType: UserType.Staff }); if (isValid && context === VerificationContext.ACCOUNT_VERIFICATION) { await this.authService.verifyAccount(userId); } return { verified: isValid, errorCode }; }
verify-code.dto.ts:63-64  @IsEnum(VerificationContext, …) context: VerificationContext;
verification.service.ts:137-154  const isValid = verification.context === context && (await verifyPassword(…)); … return { isValid: true, … }   // row not deleted
auth.staff.controller.ts:111-118 key `verify-code-${normalizeEmailKey(request.body.email)}`
```
- **Suggested fix (NOT applied):** Restrict verify-code to ACCOUNT_VERIFICATION (whitelist the context server-side) or share the throttle bucket with reset-password.

### 138. [LOW] Vendor auth e-mails (verification, reset, invitation, registration) are English-only; no language is passed even though the dashboard supports Arabic

- **Where:** `backend/src/modules/auth/verification.service.ts:184`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** sendVerificationEmail never sets `language`, EmailService defaults subjects to 'en', the React templates contain only English strings and BaseEmail sets <Html lang="en">. An Arabic-language vendor receives English OTP/reset/invitation mails. (Listed as still open in PRODUCTION-READINESS.md; still true in the working tree.)
- **How to reproduce:** Set the dashboard to Arabic and trigger forgot-password.
- **Impact:** Arabic-speaking vendors get English onboarding and security e-mails.
- **Evidence:**

```
verification.service.ts:184-191  await this.emailService.sendEmail({ to: [user.email], template, data: { name: …, otp: code } });   // no language
email.service.ts:100-105  async sendEmail({ data, to, subject, template, language = 'en', replyTo })
base-email.tsx:36         <Html lang="en">
account-verification.tsx:8-15  Verify Your Account … Thank you for signing up! …
```
- **Suggested fix (NOT applied):** Store the staff language preference (session.language exists) and pass it to sendEmail; add Arabic template variants with dir="rtl".

---

## 6. Vendor staff, roles and the Settings page

31 issues — 1 critical, 5 high, 13 medium, 12 low.

### 139. [CRITICAL] Vendor Owner/Admin can block ANY customer platform-wide via PATCH /admin/users/:id/block (no tenant scoping)

- **Where:** `backend/src/modules/admin/admin.controller.ts:57`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Also reported by:** ops-console
- **Problem:** The vendor dashboard's Users page calls PATCH /admin/users/:id/block. The handler-level decorator overrides the controller's SuperAdmin restriction and allows OWNER and ADMIN. usersService.blockUser sets users.blockedAt on the global user row with no check that the customer belongs to (or ever booked with) the vendor's tenant, and login enforces blockedAt globally (assertNotBlocked -> ACCOUNT_BLOCKED, refresh path `user.blockedAt IS NULL`). The id is an arbitrary UUID, so any vendor staffer can lock any customer of any other vendor out of the whole app.
- **How to reproduce:** Log in as vendor Owner; PATCH http://localhost:3000/admin/users/<any customer uuid>/block -> 204. That customer now gets ACCOUNT_BLOCKED on POST /auth/users/login/phone.
- **Impact:** A single vendor (or a disgruntled Admin-role employee) can ban customers from the entire marketplace, including customers who only book with competitors; the customer cannot log in anywhere and support has no audit of why.
- **Evidence:**

```
admin.controller.ts:57-71
  @Patch('users/:id/block')
  @AuthorizedUserType.isStaff([
    StaffRole.SUPER_ADMIN,
    StaffRole.OWNER,
    StaffRole.ADMIN,
  ])
  ... await this.usersService.blockUser(userId, true);
users.service.ts:672-682 blockUser(): `await this.usersRepository.update(userId, { blockedAt: blocked ? new Date() : null });` (no tenantId condition)
auth.service.ts:431-433 `if (user?.blockedAt) throw new ForbiddenException(ACCOUNT_BLOCKED)`; dashboard Users.js:78-79 `mutationFn: (id) => blockUser(id)` -> admin.service.js:15-20 `url: `${API_URL}/users/${id}/block``
```
- **Suggested fix (NOT applied):** Either restrict block/unblock to SUPER_ADMIN only, or implement a tenant-scoped ban (e.g. tenant_blocked_users table checked at booking time) and, at minimum, verify the target user has a booking at the caller's tenant before writing anything.

### 140. [HIGH] Vendor dashboard has no staff management UI: invite, pending invitations, revoke, change role, unassign are unreachable

- **Where:** `dashboard/src/components/layout/DashboardLayout.js:90`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The backend exposes POST /staff/invite, GET /staff/invitations, POST /staff/invitations/:id/revoke, PATCH /staff/:id/role, POST /staff/unassign, and staff.service.js/staff.action.js wrap most of them, but no page in the dashboard calls sendInvitation/getAllStaffInvitations/revokeInvitation, and there is no updateStaffRole/unassign action at all. The sidebar 'Users' entry is the customer list (admin_action). The only staff UI is the Branch page 'Add Staff' modal, which can only assign staff who already exist, and the Owner cannot be assigned (CANNOT_ASSIGN_OWNER_TO_BRANCH), so for a fresh vendor the modal is permanently empty.
- **How to reproduce:** Log in as vendor Owner; look for any place to invite a staffer — none. Open a branch -> Add Staff -> dropdown shows only yourself; selecting yourself returns CANNOT_ASSIGN_SELF.
- **Impact:** Vendors cannot add a single team member; the whole Owner/Admin/User role model and branch assignment cannot be exercised by real users. The PM will find the 'roles' feature does not exist from the vendor's point of view.
- **Evidence:**

```
DashboardLayout.js:90-127 items = home, users (customers), branches, courts, schedule, billing — no team/staff entry.
`grep -rln "sendInvitation\|revokeInvitation\|getAllStaffInvitations" dashboard/src` -> only actions/staff.action.js and service/staff.service.js.
Branch.js:155-160 `<Button className="staff-button" onClick={() => setStaffModalOpen(true)}>+ Add Staff</Button>` and 258-262 lists GET /staff items only.
staff.controller.ts:264 `@Post('invite')`, 311 `@Post('invitations/:id/revoke')`, 329 `@Patch(':id/role')`, 366 `@Post('unassign')`.
```
- **Suggested fix (NOT applied):** Add a Team page: list staff (GET /staff), invite by email with role + optional branch (POST /staff/invite), pending invitations with revoke, role change (PATCH /staff/:id/role), branch assign/unassign.

### 141. [HIGH] Change Password in Settings does not revoke other sessions (refresh tokens stay valid 30 days)

- **Where:** `backend/src/modules/staff/staff.service.ts:692`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** StaffService.changePassword only rewrites the hash and lastPasswordChangeAt. It neither calls AuthService.revokeAllSessions nor emits AuthEvent.PASSWORD_CHANGED; the handler that revokes all sessions runs only for the forgot/reset-password flow. JwtStrategy validates purely from the token payload and the revoked-session denylist, so nothing about lastPasswordChangeAt is checked.
- **How to reproduce:** Log in on device A and B; on A change password in Settings; on B keep using the dashboard — all requests continue to succeed, and token refresh keeps working.
- **Impact:** A vendor who changes their password because they suspect a compromise leaves the attacker's device logged in for up to 30 days (refresh) — the standard security expectation of 'change password = log out everywhere else' is not met.
- **Evidence:**

```
staff.service.ts:692-696
    const hashedPassword = await hashPassword(newPassword);
    await this.update(userId, {
      password: hashedPassword,
      lastPasswordChangeAt: new Date(),
    });
auth.service.ts:418 `this.eventEmitter.emit(AuthEvent.PASSWORD_CHANGED, ...)` is inside resetPassword only; 676-686 `@OnEvent(AuthEvent.PASSWORD_CHANGED) ... this.revokeAllSessions(user.id)`; 472 refresh `expiresIn: '30d'`; jwt.strategy.ts:39-57 validate() checks only the denylist.
```
- **Suggested fix (NOT applied):** In changePassword call `await this.authService.revokeAllSessions(userId, currentSid)` (pass currentUser) or emit AuthEvent.PASSWORD_CHANGED; also delete pending verifications.

### 142. [HIGH] Email change stores the address as typed (mixed case) while login/forgot-password lowercase it -> user locked out

- **Where:** `backend/src/modules/staff/dto/change-email.dto.ts:9`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** RequestEmailChangeDto has no lowercase Transform, unlike every auth DTO. verifyEmailChange copies pendingEmail into staff.email verbatim. Login (EmailLoginDto), forgot-password and reset-password lowercase the input, and StaffService.getByEmail does an exact match, so an email saved as 'Hamza@Outlook.sa' can never be matched again.
- **How to reproduce:** Settings -> Change Email -> 'Test@Example.com' + password -> verify code -> logout -> sign in with 'Test@Example.com' -> 401 INVALID_CREDENTIALS.
- **Impact:** Any staffer who types their new e-mail with a capital letter (very common on phones, which auto-capitalise) is locked out after logout: login returns INVALID_CREDENTIALS and forgot-password returns EMAIL_NOT_FOUND. Also `getByEmail` duplicate check (721) misses case variants so two accounts can differ only by case.
- **Evidence:**

```
change-email.dto.ts:9-11
  @IsEmail()
  @IsNotEmpty()
  email: string;
login.dto.ts:26-27 `@IsEmail(...) @Transform(({ value }) => value.toLowerCase()) email`; forgot-password.dto.ts:11 and reset-password.dto.ts:34 same; staff.service.ts:109-111 `findOne({ where: { email, deletedAt: IsNull() } })`; staff.service.ts:761-764 `await this.update(userId, { email: staff.pendingEmail, pendingEmail: null })`.
```
- **Suggested fix (NOT applied):** Add `@Transform(({ value }) => value?.trim().toLowerCase())` to RequestEmailChangeDto.email (and lower-case in getByEmail / a CITEXT or lower() unique index).

### 143. [HIGH] Payouts 'Recent balance activity' shows '+0.00 SAR Booking revenue' for every held booking

- **Where:** `dashboard/src/components/settings/PayoutsSection.js:181`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** holdBookingRevenue writes a BOOKING_COMPLETED ledger row with amount 0 and the real amount in metadata.heldAmount; release writes a second BOOKING_COMPLETED row with the amount. The UI renders every row by `amount` only, so the vendor sees a '+0.00' revenue line for each paid booking (and a '−400.00 Booking refund' with no visible matching credit when a held booking is refunded).
- **How to reproduce:** Customer pays a booking; vendor opens Settings -> Payouts -> Recent balance activity -> row 'Booking revenue +0.00 SAR'.
- **Impact:** Vendors read their earnings ledger as 'we earned 0 on this booking' / 'we were debited 400 for a refund of a booking that never credited us'. Money display is wrong for the core hold/release flow.
- **Evidence:**

```
balance.service.ts:259-268
      this.transactionRepo.create({ tenantId, type: TransactionType.BOOKING_COMPLETED, amount: 0, currency, bookingId, metadata: { held: true, heldAmount: netAmount } })
PayoutsSection.js:181-189
          const credit = CREDIT_TYPES.has(row.type);
          return (<Text type={credit ? "success" : "danger"}>{credit ? "+" : "−"}{formatMoney(Math.abs(Number(value || 0)), ...)}</Text>);
Live GET /payouts/transactions: {"type":"booking_completed","amount":0,"currency":"SAR",...,"metadata":{"held":true,"heldAmount":400}} followed by {"type":"booking_refunded","amount":-400}
```
- **Suggested fix (NOT applied):** Render rows with metadata.held as 'On hold {heldAmount}' (neutral colour) or hide them and show only the release row; alternatively write the hold row with the amount and a `held` flag and have the UI label it.

### 144. [HIGH] Branch assignment only filters the Branches endpoints; Courts, Schedule/Bookings still expose every branch to Admin/User staff

- **Where:** `backend/src/modules/courts/courts.service.ts:255`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** For non-Owner roles, BranchesService.list/findOne inner-join branch_staffers on the current staffer, but CourtsService.list and BookingsService list scope only by tenantId. A User-role staffer assigned to one branch therefore sees and manages courts, bookings and the schedule of all branches, while the Branches page shows only theirs (and a staffer with no assignment sees an empty Branches page but full Courts/Schedule).
- **How to reproduce:** Invite a User-role staffer with branchId=A (via API), log in as them: /branches shows only A, /courts and /schedule show courts and bookings of branch B as well.
- **Impact:** Branch assignment gives a false sense of access control; a branch employee sees other branches' bookings/customers and can act on courts they were not assigned to. Behaviour is inconsistent between pages.
- **Evidence:**

```
branches.service.ts:189-194
      if (user.role !== StaffRole.SUPER_ADMIN && user.role !== StaffRole.OWNER) {
        queryBuilder.innerJoin('branch.staff', 'staffMember').andWhere('staffMember.stafferId = :stafferId', { stafferId: user.id });
courts.service.ts:255-257
    if (user.type === UserType.Staff) {
      queryBuilder.andWhere('branch.tenantId = :tenantId', { tenantId: user.tenantId,
bookings.service.ts:702-703
    if (user.type === UserType.Staff) {
      qb.andWhere('branch.tenantId = :tenantId', { tenantId: user.tenantId });
```
- **Suggested fix (NOT applied):** Apply the same stafferId join in courts/bookings/stats/schedule list & detail queries for non-Owner staff (helper `applyStaffBranchScope(qb,user)`), or remove branch assignment from the product.

### 145. [MEDIUM] Users page: sorting by table header sends `bookingsCount`/`totalSpent`, rejected by @IsEnum(UsersSortBy) -> 'Failed to load users'

- **Where:** `dashboard/src/pages/Users.js:291`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The Table onChange copies `sorter.field` (the column dataIndex) into queryParams.sortBy, but the backend enum accepts spending|bookings|reviews|followers|following|minutes only.
- **How to reproduce:** Dashboard -> Users -> click the 'Bookings' or 'Spending' column header.
- **Impact:** Clicking either sortable column header breaks the page (400 validation error, red toast, stale rows) until the sort dropdown is used again.
- **Evidence:**

```
Users.js:139 `dataIndex: "bookingsCount", key: "bookings", sorter: true`; 145 `dataIndex: "totalSpent", key: "spending", sorter: true`; 291 `const newSortBy = s && s.field ? s.field : prev.sortBy;`
list-users.dto.ts:7-14 enum UsersSortBy { Spending='spending', Bookings='bookings', ... }; 35-37 `@IsEnum(UsersSortBy) @IsOptional() sortBy?`
```
- **Suggested fix (NOT applied):** Use `s.columnKey` (keys already match the enum) instead of `s.field`.

### 146. [MEDIUM] Settings shows Business Profile save and Payouts to Admin/User roles whose calls are Owner-only (403s, 16 failing requests)

- **Where:** `dashboard/src/pages/Settings.js:312`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The Collapse renders all sections regardless of role. PATCH /tenants and every /payouts endpoint are Owner-only, so non-owner staff get a form they can fill but not save, and a Payouts panel whose four queries each fail (react-query default retry 3 -> 16 x 403), showing zero balances and a 'Set up payouts' button that itself 403s.
- **How to reproduce:** Log in as Admin-role staff -> Settings -> edit business name -> Save -> error toast; expand Payouts -> zeros, 'Set up payouts' -> error.
- **Impact:** Admin/User staff see errors ('You don't have permission') on save and a misleading empty payouts screen; the backend takes needless load.
- **Evidence:**

```
tenants.controller.ts:50-51 `@AuthorizedUserType.isStaff([StaffRole.OWNER]) updateTenant(`; payouts.controller.ts:45,52,94,105,119 `@AuthorizedUserType.isStaff([StaffRole.OWNER])`; Settings.js:312-482 items business/password/email/payouts/delete rendered unconditionally; PayoutsSection.js:65-80 four useQuery calls with no `enabled`/retry guard; 219-228 Set up button -> onboardingMutation.
```
- **Suggested fix (NOT applied):** Read role from the ['staff-me'] query (or localStorage userData.role as DashboardLayout does) and hide/disable Business Profile save, Payouts and the sidebar entry for non-Owners.

### 147. [MEDIUM] 'Delete Account' offered to the Owner, but the backend refuses after the password step; no way for an owner to close the business

- **Where:** `dashboard/src/pages/Settings.js:483`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The delete section and modal are shown to every role. requestAccountDeletion throws OWNER_CANNOT_DELETE_ACCOUNT for Owners, so the owner enters their password and only then learns it is impossible. There is no alternative flow to delete an owner/tenant (PRODUCTION-READINESS item 23 notes Apple requires an in-app deletion path).
- **How to reproduce:** Log in as Owner -> Settings -> Delete Account -> enter password -> 'The owner account can't be deleted.'
- **Impact:** Confusing dead-end for the most common dashboard user (the Owner); business closure has no supported path.
- **Evidence:**

```
Settings.js:483-496 `{ key: "delete", label: t("settings.deleteAccount"), children: (<Button type="primary" danger block onClick={() => setDeleteModalOpen(true)}>` (no role check)
staff.service.ts:913-915
    if (currentUser.role === StaffRole.OWNER) {
      throw new ForbiddenException(OWNER_CANNOT_DELETE_ACCOUNT);
```
- **Suggested fix (NOT applied):** Hide the section for Owner and show a 'Contact support to close your business' note, or implement tenant closure (ownership transfer / tenant soft-delete with subscription cancellation).

### 148. [MEDIUM] Pending e-mail change is lost on page refresh; the verification code cannot be entered

- **Where:** `dashboard/src/pages/Settings.js:105`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** pendingVerification/pendingEmail live only in component state. After a refresh (or navigating away) the section shows the 'Change Email' form again although the backend still has staff.pendingEmail set and GET /staff/me returns it.
- **How to reproduce:** Settings -> Change Email -> send code -> press F5 -> no 'Verify Email' form.
- **Impact:** User requests a change, waits for the e-mail, refreshes, and the code box is gone; they must re-enter e-mail + password to get a new code (the old one is silently invalidated by the upsert).
- **Evidence:**

```
Settings.js:105-106 `const [pendingVerification, setPendingVerification] = useState(false); const [pendingEmail, setPendingEmail] = useState("");`; 413 `children: !pendingVerification ? (<Form ... onFinish={handleChangeEmail}>` — no read of staff-me.
staff.entity.ts:36-37 `@Column({ nullable: true }) pendingEmail?: string;` and live GET /staff/me -> `"pendingEmail":null` (field is returned).
```
- **Suggested fix (NOT applied):** Seed pendingVerification/pendingEmail from the ['staff-me'] query (`user.pendingEmail`), and keep a 'Cancel'/'Resend' path that does not need the password again.

### 149. [MEDIUM] No rate limit or attempt counter on e-mail-change / account-deletion OTP endpoints; unlimited OTP e-mails to arbitrary addresses

- **Where:** `backend/src/modules/staff/staff.controller.ts:233`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Unlike the phone endpoints (which use @Throttle + ThrottlerGuard), POST /staff/me/email/change, /me/email/verify, /me/delete and /me/delete/verify have no throttling, no global ThrottlerGuard is registered, and VerificationService.verifyCode has no failed-attempt counter. Codes are 6 digits valid 15 minutes and can be re-requested without limit. /me/email/change sends an e-mail to any address the caller types.
- **How to reproduce:** Loop POST /staff/me/email/verify with codes 000000..999999 — never throttled; loop POST /staff/me/email/change to victim@x -> one e-mail per call.
- **Impact:** An attacker with a stolen session can brute-force the deletion/e-mail codes; any staffer can use the platform to spam OTP e-mails to any address (SES reputation / abuse).
- **Evidence:**

```
staff.controller.ts:213 `@Post('me/email/change')`, 233 `@Post('me/email/verify')`, 103 `@Post('me/delete')`, 123 `@Post('me/delete/verify')` — none carry @Throttle/@UseGuards(ThrottlerGuard); compare 139-148 `@Throttle({ auth: {...} }) @UseGuards(ThrottlerGuard) @Post('me/phone/code')`.
verification.service.ts:116-146 findOne by identifier/context, expiry check, verifyPassword — no attempts column; 66 `expiresAt: dayjs().add(15, 'minutes')`.
app.module.ts:111-135 ThrottlerModule with named throttlers only; `grep -n APP_GUARD backend/src/app.module.ts` -> none.
```
- **Suggested fix (NOT applied):** Apply the 'auth' throttler keyed by user id to these four handlers; add an attempts counter to verifications and invalidate after ~5 failures; throttle sends per target identifier.

### 150. [MEDIUM] Account deletion revokes only the current session, never emits STAFF_DELETED, and leaves branch_staffers rows

- **Where:** `backend/src/modules/staff/staff.service.ts:963`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** verifyAccountDeletion soft-deletes the staffer and calls authService.logout(currentUser), which denylists only the current sid. AuthService.revokeAllSessions exists precisely for this case but is not used. No StaffEvent.STAFF_DELETED is emitted anywhere, although TenantsService listens to it to decrement tenant.totalStaff; branch_staffers rows are not removed.
- **How to reproduce:** Delete account on device A while logged in on B; B continues to work for up to 15 min. Check tenants.totalStaff before/after: unchanged.
- **Impact:** Other devices of the deleted staffer keep working until the 15-minute access token expires (auth.service.ts:480); tenant.totalStaff shown to ops drifts upward forever; stale branch links.
- **Evidence:**

```
staff.service.ts:963-973
    await this.staffRepository.update(currentUser.id, { deletedAt: new Date() });
    ...
    await this.authService.logout(currentUser);
auth.service.ts:573-577 `/** End every active session of a user ... Password resets, account deletion and admin deactivation used to leave other devices' tokens valid for up to 30 days. */ async revokeAllSessions(`; `grep -rn "StaffEvent\." backend/src` -> only STAFF_CREATED emitted (staff.service.ts:250); tenants.service.ts:333-336 `@OnEvent(StaffEvent.STAFF_DELETED) ... incrementCount(staff.tenantId, -1, 'totalStaff')`.
```
- **Suggested fix (NOT applied):** Call revokeAllSessions(userId), emit STAFF_DELETED via runOnTransactionCommit, delete branch_staffers for the staffer.

### 151. [MEDIUM] A deleted staffer's e-mail can never sign up again (raw 500) or be re-invited (STAFF_EMAIL_DEACTIVATED, unmapped in dashboard)

- **Where:** `backend/src/modules/staff/entities/staff.entity.ts:12`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The unique index on staff.email covers soft-deleted rows. The invite path detects this and throws STAFF_EMAIL_DEACTIVATED (a code the dashboard's COVERED_CODES does not include -> generic message). The signup path checks `exists({ email })`, which excludes soft-deleted rows, then INSERTs and hits the unique index -> unhandled 500.
- **How to reproduce:** Staffer deletes account; same e-mail -> POST /auth/staff/signup -> 500; Owner invites the e-mail -> generic error.
- **Impact:** An employee who deletes their account (or a deactivated admin) is permanently locked out of the platform under that e-mail; re-signup shows 'Something went wrong'.
- **Evidence:**

```
staff.entity.ts:12 `@Index('idx_staff_email', ['email'], { unique: true })` with 99-100 `@DeleteDateColumn() deletedAt`.
staff.service.ts:341-349 `// The unique index covers soft-deleted rows: re-creating a deactivated admin's e-mail was a raw 500 ... throw new BadRequestException(STAFF_EMAIL_DEACTIVATED)`.
auth.service.ts:90-93 `const existingUser = await this.staffService.exists({ email }); if (existingUser) throw ...ACCOUNT_ALREADY_EXISTS` and staff.service.ts:113-115 `exists(where)` (no withDeleted) -> save() at 161 violates the index.
dashboard/src/utils/errorMessages.js:32-44 staff codes list lacks STAFF_EMAIL_DEACTIVATED.
```
- **Suggested fix (NOT applied):** Change to a partial unique index (`WHERE "deletedAt" IS NULL`) or anonymise the e-mail on deletion (`<id>@deleted.local`); add STAFF_EMAIL_DEACTIVATED to COVERED_CODES + locales.

### 152. [MEDIUM] Invitation e-mail link omits the `email` param SignupForm expects, and FRONTEND_URL is optional (link/return_url become 'undefined/...')

- **Where:** `backend/src/modules/staff/staff.service.ts:386`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The invitation link is `${FRONTEND_URL}/auth/signup?token=...` while SignupForm reads `?token=&email=` to pre-fill and lock the address (backend ties the token to the exact e-mail). FRONTEND_URL is not required by config validation and is also used to build Stripe Connect return/refresh URLs.
- **How to reproduce:** Send an invitation; open the link; e-mail field is empty/editable; type 'Name@Domain.com' -> signup lowercases so it works, but 'other@domain.com' -> 404 INVALID_INVITATION.
- **Impact:** Invitees must retype the exact address (any variation -> INVALID_INVITATION); with FRONTEND_URL unset every invitation e-mail points to 'undefined/auth/signup' and Stripe onboarding fails on an invalid return_url.
- **Evidence:**

```
staff.service.ts:386-387
    const baseUrl = this.configService.get<string>('FRONTEND_URL');
    const invitationLink = `${baseUrl}/auth/signup?token=${token}`;
SignupForm.js:17-22 `// ... /auth/signup?token=...&email=... const invitedEmail = searchParams.get("email") || undefined;` and 98 `<Input ... disabled={isInvited} />`.
validation.ts:49 `FRONTEND_URL: Joi.string().uri().optional(),`; stripe-payout.provider.ts:49-50 `refresh_url: `${this.configService.get('FRONTEND_URL')}/settings?payouts=refresh``.
```
- **Suggested fix (NOT applied):** Append `&email=${encodeURIComponent(email)}` to the link; make FRONTEND_URL `.required()` in validation.ts.

### 153. [MEDIUM] Branch 'Assign Staff' modal: names render 'undefined', Owner-only API used from an Admin-visible page, no refresh after assign, untranslated, no unassign

- **Where:** `dashboard/src/pages/Branch.js:258`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Options print `staff.name` (Staffer has firstName/lastName only). GET /staff is Owner-only but Admins can open branches (and create them), so they get 403s. The list includes the Owner and the current user (backend rejects both), already-assigned staff are not marked, nothing is invalidated after success, a second `getAllStaff(id)` query is unused, POST /staff/unassign has no UI, and every string is hard-coded English. console.log of branch/staff data remains.
- **How to reproduce:** Open any branch -> + Add Staff -> dropdown shows 'undefined – owner@x'; pick it -> 'You can't assign yourself'.
- **Impact:** The only staff-related UI in the dashboard shows 'undefined – email', offers choices the backend refuses, gives no feedback of who is assigned, and cannot remove anyone; Arabic users see English.
- **Evidence:**

```
Branch.js:258-262 `{staffData?.items?.map((staff) => (<Select.Option ...>{staff.name} – {staff.email}</Select.Option>))}`; staff.entity.ts:19-27 firstName/lastName only.
Branch.js:27-30 `queryFn: () => getAllStaff()`; staff.controller.ts:280-281 `@Get() @AuthorizedUserType.isStaff([StaffRole.OWNER])`; branches.controller.ts:124 `@AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.ADMIN]) create(`.
Branch.js:32-35 unused `useQuery({ queryKey: ["staff", id] ... })`; 86-92 no queryClient.invalidateQueries; 159 `+ Add Staff`, 237 `title="Assign Staff to Branch"`, 246, 251, 74, 90, 98 literals; 69-70, 87 console.log.
staff.service.ts:799-801 CANNOT_ASSIGN_SELF, 811-814 CANNOT_ASSIGN_OWNER_TO_BRANCH; staff.controller.ts:366 `@Post('unassign')` unused by dashboard.
```
- **Suggested fix (NOT applied):** Render `${firstName} ${lastName}`; filter out Owner/self/already-assigned; add an assigned-staff list with unassign; invalidate ['staff', id]; hide button for non-Owners; use t() keys.

### 154. [MEDIUM] antd ConfigProvider has no `locale`; Settings validation rules have no messages -> English/mixed text in the Arabic UI

- **Where:** `dashboard/src/App.js:36`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** ConfigProvider sets direction only. All Settings forms use `rules={[{ required: true }]}` etc. without `message`, so antd's default English validateMessages ('${label} is required', '${label} must be at least 3 characters', '${label} is not a valid email') appear under Arabic labels. Locale keys for these messages exist in both en.json and ar.json but are unused. Pagination/empty-state antd text is English as well.
- **How to reproduce:** Switch to Arabic -> Settings -> Update Password with empty fields.
- **Impact:** Arabic vendors see 'كلمة المرور القديمة is required' style messages throughout Settings and Business Profile.
- **Evidence:**

```
App.js:36-43 `<ConfigProvider direction={direction} theme={{ token: { colorPrimary: "#c0ff42" } }}>` (no locale; `grep -rn "antd/locale" dashboard/src` -> none).
Settings.js:325 `rules={[{ required: true, min: 3 }]}`, 374/381 `rules={[{ required: true }]}`, 390-397, 422 `rules={[{ required: true, type: "email" }]}`, 428, 447, 521, 538.
en.json/ar.json define settings.oldPasswordRequired, newPasswordRequired, confirmPasswordRequired, emailRequired, emailInvalid, passwordRequired, codeRequired, passwordsDontMatch (unused).
```
- **Suggested fix (NOT applied):** Pass `locale={i18n.language === 'ar' ? arEG : enUS}` to ConfigProvider and/or add `message: t(...)` using the existing keys.

### 155. [MEDIUM] Settings handlers swallow backend error codes (wrong current password, same password, expired code, duplicate e-mail) and show generic failures; no client min-length for new password

- **Where:** `dashboard/src/pages/Settings.js:164`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleChangePassword, handleChangeEmail, handleVerifyEmail and handleDeleteConfirm use bare `catch {}` and a fixed message, although the backend returns specific, already-localised codes and `notifyError` (used by handleSaveBusiness) maps them. The new-password field has no min-8 rule while the DTO requires it, so a 7-character password yields 'Failed to update password' with no reason.
- **How to reproduce:** Settings -> Change Password with wrong current password -> 'Failed to update password'.
- **Impact:** Users cannot tell whether they mistyped the current password, chose the same password, used a taken e-mail, or the code expired.
- **Evidence:**

```
Settings.js:164-165 `} catch { notify("error", t("settings.passwordUpdateFailed")); }`; 183-184 sendCodeFailed; 199-200 emailVerificationFailed; 270-271 invalidCode (also for CODE_EXPIRED/network); 381 `rules={[{ required: true }]}` on newPassword.
staff.service.ts:679-690 INCORRECT_CURRENT_PASSWORD / NEW_PASSWORD_SAME_AS_CURRENT; 715-724 INVALID_CREDENTIALS / EMAIL_MUST_BE_DIFFERENT / STAFF_EMAIL_ALREADY_EXISTS; change-password.dto.ts:20 `@MinLength(8) newPassword`; errorMessages.js:9-13,33-35 cover these codes; Settings.js:85 shows the correct pattern `notifyError(notify, err, t, "business_profile.save_failed")`.
```
- **Suggested fix (NOT applied):** Use `notifyError(notify, err, t, fallbackKey)` in all four handlers; add `{ min: 8, message: t('auth.password_min') }` to newPassword.

### 156. [MEDIUM] Payout request enabled in UI while a payout is `processing`; backend rejects with PENDING_PAYOUT_EXISTS

- **Where:** `dashboard/src/components/settings/PayoutsSection.js:85`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The UI blocks a new request only when a payout has status 'pending'. The backend blocks on pending OR processing (i.e. after ops approval until Stripe's transfer.created webhook lands).
- **How to reproduce:** Request payout; ops approves (status processing); vendor tries another request.
- **Impact:** Vendor sees no banner, fills the amount, submits, and gets 'A payout request is already pending.'
- **Evidence:**

```
PayoutsSection.js:85 `const hasPending = (payouts?.items || []).some((p) => p.status === "pending");` and 235-236 `canRequest = isReady && !hasPending && ...`
payouts.service.ts:65-74
    const pendingPayouts = await this.payoutRepo.count({ where: { tenantId, status: In([PayoutStatus.PENDING, PayoutStatus.PROCESSING]) } });
    if (pendingPayouts > 0) throw new BadRequestException('PENDING_PAYOUT_EXISTS');
```
- **Suggested fix (NOT applied):** `hasPending = items.some(p => p.status === 'pending' || p.status === 'processing')` and adjust the banner copy.

### 157. [MEDIUM] Tenant profile PATCH recomputes profileCompletion from the request body, cannot clear the phone, and accepts an ignored `documents` field

- **Where:** `backend/src/modules/tenants/tenants.service.ts:255`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** profileCompletion.name/phoneNumber are set to `!!name` / `!!phoneNumber` from the DTO rather than the stored values, and `save({...tenant, name, phoneNumber})` skips undefined columns. The dashboard sends `phoneNumber: undefined` when the field is cleared, so the phone stays but the completion flag flips to false; a caller sending only logoAssetId flips both flags false. UpdateTenantDto also validates a `documents` array that the service never uses.
- **How to reproduce:** Settings -> Business Profile -> clear phone -> Save -> reload: phone still shown; GET /tenants profileCompletion.phoneNumber=false.
- **Impact:** Home 'profile completion' card shows wrong state; vendors cannot remove a business phone; API contract advertises a documents field that does nothing.
- **Evidence:**

```
tenants.service.ts:255-261
    tenant.profileCompletion.name = !!name;
    tenant.profileCompletion.phoneNumber = !!phoneNumber;
    const updatedTenant = await this.tenantRepository.save({ ...tenant, name, phoneNumber });
update-tenant.dto.ts:32-40 `documents?: string[]` vs tenants.service.ts:242 destructured `documents` unused; Settings.js:76-80 `updateTenant({ name: values.name, phoneNumber: values.phoneNumber, ...(logoAssetId ? { logoAssetId } : {}) })`.
```
- **Suggested fix (NOT applied):** Compute flags from the merged entity; accept `phoneNumber: null` to clear; remove `documents` from the DTO.

### 158. [LOW] 'Edit Profile' navigates to Settings, which has no name fields; PATCH /staff/me is never used

- **Where:** `dashboard/src/components/layout/NavDropdown.js:52`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The profile modal's primary action goes to /settings, but Settings only offers business profile/password/email/payouts/delete; staff first/last name cannot be edited anywhere although the backend and service layer support it.
- **How to reproduce:** Avatar -> Profile -> Edit Profile -> no name inputs.
- **Impact:** A staffer whose name is wrong (or empty after invitation) cannot fix it; the dashboard greeting shows the wrong name.
- **Evidence:**

```
NavDropdown.js:52-55 `const handleEditProfile = () => { setIsModalVisible(false); navigate("/settings"); };` 116-118 `<Button key="edit" type="primary" onClick={handleEditProfile}>{t("nav.editProfile")}`; staff.controller.ts:82-92 `@Patch('me') updateMe(... UpdateStaffDto)`; staff.service.js:14-21 updateMe defined; Settings.js imports no updateMe.
```
- **Suggested fix (NOT applied):** Add a 'My profile' section (firstName/lastName) using updateMe and invalidate ['staff-me'].

### 159. [LOW] Users page: hard-coded '$' currency, dead 'View' button, Block shown to User role (403), all copy untranslated

- **Where:** `dashboard/src/pages/Users.js:148`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Spending is rendered with a dollar sign although tenants trade in SAR; the eye button has no handler; every label/toast is an English literal; the Block/Unblock buttons are shown to User-role staff whom the backend rejects.
- **How to reproduce:** Dashboard -> Users.
- **Impact:** Wrong currency shown to every vendor; confusing dead control; English page in the Arabic dashboard.
- **Evidence:**

```
Users.js:148 ``render: (v) => `$${v}` `` (live GET /payouts/balance -> "currency":"SAR"); 170 `<Button icon={<EyeOutlined />} size="small" />`; 19-26, 64, 84, 101, 115, 133, 138, 144, 151, 155-157, 161, 175-186, 219, 228, 235-236 literals; admin.controller.ts:58-62 block allowed for SUPER_ADMIN/OWNER/ADMIN only.
```
- **Suggested fix (NOT applied):** Format with tenant preference currency; remove or implement View; wrap strings in t(); hide Block for User role.

### 160. [LOW] CreateStaffInvitationDto.role uses Nest's DI `@Optional()` instead of class-validator `@IsOptional()`; ROLE_REQUIRED unreachable

- **Where:** `backend/src/modules/staff/dto/staff-invitation.dto.ts:23`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** `Optional` is imported from @nestjs/common (a constructor-injection decorator) and has no validation effect, so `@IsIn` runs on undefined and returns a raw class-validator message; the service's ROLE_REQUIRED branch can never execute and SuperAdmin invitations without an explicit role fail validation.
- **How to reproduce:** POST /staff/invite {email} without role.
- **Impact:** Unlocalised 'role must be one of the following values' 400 instead of ROLE_REQUIRED; latent bug for the ops invite flow.
- **Evidence:**

```
staff-invitation.dto.ts:5 `import { Optional } from '@nestjs/common';` 23-25 `@IsIn(INVITATION_ALLOWED_ROLES) @Optional() role?: StaffRole;`; staff.service.ts:329-331 `if (!superAdmins && !role) throw new BadRequestException(ROLE_REQUIRED);`
```
- **Suggested fix (NOT applied):** Replace with `@IsOptional()` from class-validator (or make role required and drop the service check).

### 161. [LOW] Payout completion writes no ledger row ('Payout sent' never appears), failure reasons are raw English, Payout.amount is a float column

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:199`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** completePayoutFromProvider only flips status, so the activity list shows 'Payout requested −X' and nothing on completion; the transactionTypes.payout_completed translation is dead. failureReason is shown verbatim ('Transfer reversed by Stripe' or Stripe's error.message) in both languages. Payout.amount is `float` while every other money column is numeric(14,2).
- **How to reproduce:** Complete a payout via Stripe webhook; Recent activity shows no 'Payout sent' row.
- **Impact:** Ledger looks incomplete; Arabic vendors get English failure text; float storage risks cent drift on large payouts.
- **Evidence:**

```
payouts.service.ts:199-216 completePayoutFromProvider: `payout.status = PayoutStatus.COMPLETED; payout.sentAt = new Date(); await this.payoutRepo.save(payout);` (no transactionRepo write; `grep TransactionType.PAYOUT_COMPLETED backend/src` -> none).
PayoutsSection.js:150-153 `{row.failureReason ? (<Text ...>{row.failureReason}</Text>) : null}`; payouts-webhook.controller.ts:113 `'Transfer reversed by Stripe'`; payouts.service.ts:159 `payout.failureReason = error.message;`
payout.entity.ts:15-16 `@Column('float') amount: number;`
```
- **Suggested fix (NOT applied):** Write a PAYOUT_COMPLETED ledger row on completion; store a failure code and translate client-side; migrate amount to numeric(14,2) with moneyTransformer.

### 162. [LOW] Payout history and balance activity are capped at the latest 10 rows with no pagination

- **Where:** `dashboard/src/components/settings/PayoutsSection.js:73`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Both tables fetch page 1 / pageSize 10 and disable antd pagination, although the backend paginates both lists.
- **How to reproduce:** Tenant with >10 transactions -> only 10 visible.
- **Impact:** After a few weeks of bookings a vendor cannot see older ledger rows or payouts (no export either).
- **Evidence:**

```
PayoutsSection.js:73-80 `listPayouts({ page: 1, pageSize: 10 })` / `listPayoutTransactions({ page: 1, pageSize: 10 })`; 352 and 365 `pagination={false}`; payouts.controller.ts:50-71,146-157 return `pagination: { totalCount, totalPages, currentPage }`.
```
- **Suggested fix (NOT applied):** Drive page/pageSize from antd Table pagination using pagination.totalCount.

### 163. [LOW] Business logo cannot be removed: deleting the image in the uploader is a no-op and the API has no way to unset it

- **Where:** `dashboard/src/pages/Settings.js:58`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** ImageUploader calls onFileChange(null) on removal; handleUploadLogo returns early, leaving logoAssetId/logoUrl unchanged; UpdateTenantDto only accepts a UUID for logoAssetId and the service only assigns.
- **How to reproduce:** Settings -> Business Profile -> remove logo -> Save -> reload: logo still there.
- **Impact:** Vendor who uploaded a wrong logo can only replace it, never remove it; the completion flag also never returns to false.
- **Evidence:**

```
ImageUploader.js:46-48 `if (!newFileList.length) { onFileChange(null, {}); }`; Settings.js:58 `if (!file) return;`; update-tenant.dto.ts:28-30 `@IsUUID() @IsOptional() logoAssetId?`; tenants.service.ts:246-253 only `if (logoAssetId) assignAssets(...)`.
```
- **Suggested fix (NOT applied):** Accept `logoAssetId: null` -> unassign TenantLogo assets and set profileCompletion.logo=false; handle null in handleUploadLogo.

### 164. [LOW] Confirm-password mismatch rejects with an empty message (red border, no text)

- **Where:** `dashboard/src/pages/Settings.js:393`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The custom validator calls `Promise.reject()` without an Error/message, so antd shows the field as invalid with no explanation; the `settings.passwordsDontMatch` key exists in both locales and is unused.
- **How to reproduce:** Settings -> Change Password -> different confirm value -> submit.
- **Impact:** Users don't know why the form won't submit.
- **Evidence:**

```
Settings.js:391-397
    ({ getFieldValue }) => ({ validator(_, value) { return !value || value === getFieldValue("newPassword") ? Promise.resolve() : Promise.reject(); } })
en.json `settings.passwordsDontMatch = 'Passwords do not match'` (present in ar.json too).
```
- **Suggested fix (NOT applied):** `Promise.reject(new Error(t('settings.passwordsDontMatch')))`.

### 165. [LOW] Dashboard never handles 401 (interceptor commented out); a session revoked server-side leaves a broken shell until manual logout

- **Where:** `dashboard/src/service/axiosInstance.js:152`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The response interceptor's 401/refresh branch is commented out and AuthWrapper only compares the stored expiry, so when the backend revokes the session (logout elsewhere is fine, but account deletion on another device, ops deactivation, or the revoked-session denylist) every request fails with SESSION_REVOKED while the sidebar and pages stay visible.
- **How to reproduce:** Ops deactivates a staffer while they are logged in -> pages show 'Failed to load' errors, no redirect.
- **Impact:** Deactivated/deleted staff or users whose session was revoked see a dashboard where everything errors instead of being sent to sign-in.
- **Evidence:**

```
axiosInstance.js:152-171 `// if (error.response?.status === 401 && !originalRequest._retry) { ... }` (entire block commented), 173 `return Promise.reject(error);`; AuthWrapper.js:9-16 `isAuthenticated && tokenExpiry > currentTime`; jwt.strategy.ts:42-45 throws UnauthorizedException('SESSION_REVOKED').
```
- **Suggested fix (NOT applied):** On 401 with SESSION_REVOKED/INVALID_TOKEN clearTokens(), dispatch(logout()) and redirect to /auth/signin.

### 166. [LOW] After e-mail change the JWT still carries the old address; Stripe Connect onboarding is created with it

- **Where:** `backend/src/modules/payouts/controllers/payouts.controller.ts:110`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** verifyEmailChange updates the DB only and does not refresh/revoke the session; SessionUser.email comes from the access-token payload, and startOnboarding passes `user.email` to Stripe as the connected account e-mail.
- **How to reproduce:** Change e-mail, then immediately Set up payouts -> Stripe account e-mail is the old one.
- **Impact:** Stripe verification e-mails go to the old address for the rest of the session (up to token refresh + re-login).
- **Evidence:**

```
payouts.controller.ts:110-114 `return this.payoutsService.startOnboarding(user.tenantId, user.email, dto.country);`; payouts.service.ts:373 `email: requesterEmail || tenant?.email || undefined`; staff.service.ts:761-772 verifyEmailChange (no session handling); session.ts:7 `email: string` in the token payload.
```
- **Suggested fix (NOT applied):** Read the owner e-mail from the DB in startOnboarding (already queried at 363-366) instead of the token; consider re-issuing the session on e-mail change.

### 167. [LOW] Two staffers can request the same new e-mail; the second verification fails with a raw 500 (unique index)

- **Where:** `backend/src/modules/staff/staff.service.ts:721`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** requestEmailChange only checks existing `email`, not other staffers' `pendingEmail` or pending invitations. Both users receive codes; whoever verifies second hits the unique index on staff.email inside update() -> unhandled 500.
- **How to reproduce:** User A and B both request change to x@y.com; A verifies; B verifies -> 500.
- **Impact:** Rare, but the loser sees 'Something went wrong' instead of a clear 'e-mail already taken'.
- **Evidence:**

```
staff.service.ts:721-726
    const existingStaff = await this.getByEmail(email);
    if (existingStaff && existingStaff.id !== userId) throw new BadRequestException(STAFF_EMAIL_ALREADY_EXISTS);
    await this.update(userId, { pendingEmail: email });
761-764 `await this.update(userId, { email: staff.pendingEmail, pendingEmail: null });` with staff.entity.ts:12 unique index.
```
- **Suggested fix (NOT applied):** Re-check getByEmail(pendingEmail) in verifyEmailChange and return STAFF_EMAIL_ALREADY_EXISTS; also reject if another staffer has it as pendingEmail.

### 168. [LOW] Expired invitations remain listed as 'pending' forever

- **Where:** `backend/src/modules/staff/staff.service.ts:630`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** listInvitations filters on status=PENDING only; expiry (7 days) is checked only when the token is redeemed, so the list (used by ops today and by any future vendor Team page) shows dead invitations as pending with no indication.
- **How to reproduce:** Invite, wait 7 days, GET /staff/invitations -> still returned.
- **Impact:** Owners/ops believe an invite is still live; the invitee gets INVALID_INVITATION.
- **Evidence:**

```
staff.service.ts:630-637 `where: { tenantId..., status: StaffInvitationStatus.PENDING, ... }` (no expires condition); 375 `const expires = dayjs().add(7, 'days').toDate();`; 145-150 expiry check only in verifyInvitationToken.
```
- **Suggested fix (NOT applied):** Add `expires: MoreThan(new Date())` to the query or expose `expired: true` in the response.

### 169. [LOW] Staff role shown raw ('Owner'/'Admin'/'User') in the nav and profile modal, untranslated in Arabic

- **Where:** `dashboard/src/components/layout/NavDropdown.js:102`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The enum value from the API is rendered directly.
- **How to reproduce:** Switch to Arabic; look at the top-right user chip.
- **Impact:** English word in the Arabic header on every page.
- **Evidence:**

```
NavDropdown.js:102 `<small className="nav-role">{user?.role}</small>`; 134-136 `<Tag color="green" className="profile-role">{user?.role}</Tag>`
```
- **Suggested fix (NOT applied):** Map through `t(`roles.${role}`)` with keys in both locale files.

---

## 7. Ops console: approvals, suspensions, vendors, payouts

32 issues — 2 critical, 4 high, 14 medium, 12 low.

### 170. [CRITICAL] Staff refresh-token query references non-existent Staffer.blockedAt: every ops/vendor token refresh fails (forced logout every 15 min)

- **Where:** `backend/src/modules/auth/auth.service.ts:611`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** getSessionByRefreshToken joins the session to Staffer (for staff tokens) with the raw condition 'user.id = session.userId AND user.deletedAt IS NULL AND user.blockedAt IS NULL'. Staffer has no blockedAt column (only User does), so TypeORM's replacePropertyNamesForTheWholeQuery leaves 'user.blockedAt' unreplaced (it returns the original match when the property is unknown) and Postgres fails with a syntax error on the unquoted reserved word 'user'. The catch converts every error into UnauthorizedException(INVALID_REFRESH_TOKEN), so POST /auth/staff/refresh-token can never succeed for ops admins or vendor staff. The ops client refreshes proactively when the 15-minute access token is about to expire (client.ts:93-102) and on failure clears storage and hard-redirects to /login. The condition was added in the uncommitted working tree (git diff shows the '+ ... AND user.blockedAt IS NULL' line); no staff session in the DB shows a refresh after the file's 04:01 save time.
- **How to reproduce:** Log in to the ops console, wait ~14 minutes, click any page: the request interceptor calls refresh-token, gets 401 INVALID_REFRESH_TOKEN, and you land on /login.
- **Impact:** Every ops admin (and every vendor dashboard user) is thrown to the login page 15 minutes after signing in, mid-review, losing drawer/modal state; the SSE bell stream dies too. The console is unusable for sessions longer than 15 minutes.
- **Evidence:**

```
auth.service.ts:608-613: .leftJoinAndMapOne('session.user', decoded.type === UserType.Staff ? Staffer : User, 'user', 'user.id = session.userId AND user.deletedAt IS NULL AND user.blockedAt IS NULL')
staff.entity.ts: grep 'blocked' -> no match
psql of the emitted SQL: ... AND "user"."deletedAt" IS NULL AND user.blockedAt IS NULL -> ERROR: syntax error at or near "."
ops/src/api/client.ts:93-102: if (exp && exp - now < 60) { token = await refreshAuthToken(); if (!token) { tokenStore.clear(); ... window.location.href = "/login"
```
- **Suggested fix (NOT applied):** Build the join condition per user type: only add 'user.blockedAt IS NULL' when decoded.type === UserType.Customer (or add a blockedAt column to Staffer if staff blocking is intended). Add a unit test for staff refresh.

### 171. [CRITICAL] Payout approval is not idempotent and not locked: double Stripe transfer / vendor paid twice on retry or concurrent approve

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:105`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** approvePayout reads the payout with a plain findOne (no SELECT FOR UPDATE, deliberately not @Transactional), checks status === PENDING, then calls stripe.transfers.create without an idempotency key. (1) Two ops admins (or a double submit / retried request) approving the same pending payout both pass the status check and each creates a transfer. (2) If the transfer succeeds but payoutRepo.save fails (line 143) or the network drops after Stripe created the transfer, the catch block credits the amount back to the vendor balance and marks the payout FAILED, although the money has already left the platform account; the vendor can then request the same amount again. (3) rejectPayout (line 166) is @Transactional but also reads without a lock, so approve and reject racing on the same row ends with a transfer sent AND the balance restored.
- **How to reproduce:** Open the Payouts page in two browser tabs as two admins, click Approve on the same pending payout within the same second; or simulate a DB failure right after transfers.create.
- **Impact:** Court+ loses real money: a vendor can be paid twice (Stripe transfer plus restored balance) on a transient failure, and concurrent approvals send duplicate transfers.
- **Evidence:**

```
payouts.service.ts:106-116: const payout = await this.payoutRepo.findOne({ where: { id: payoutId } }); ... if (payout.status !== PayoutStatus.PENDING) throw new BadRequestException('PAYOUT_NOT_PENDING');
payouts.service.ts:129-143: const result = await provider.createPayout({...}); payout.providerPayoutId = result.providerPayoutId; ... await this.payoutRepo.save(payout);
payouts.service.ts:150-162: } catch (error) { await this.balanceService.refundFailedPayout(...); payout.status = PayoutStatus.FAILED; ...
stripe-payout.provider.ts:85-94: const transfer = await this.stripe.transfers.create({ amount: toStripeAmount(...), currency, destination, metadata }); (no idempotencyKey)
```
- **Suggested fix (NOT applied):** Do the PENDING->PROCESSING transition atomically first (UPDATE ... WHERE status='pending' RETURNING, or SELECT FOR UPDATE inside a transaction), call Stripe with idempotencyKey = payout.id, and only refund/mark FAILED when the provider confirms no transfer was created (retrieve by metadata/idempotency before compensating).

### 172. [HIGH] GET /payouts and GET /payouts/:id return the requesting staffer's password hash and full Tenant entity

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:403`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** listPayouts and getPayout leftJoinAndSelect the requestedBy Staffer and the Tenant. The Staffer entity has no @Exclude on password/lastPasswordChangeAt (sanitizeStaff is only applied in StaffService paths), and the global ClassSerializerInterceptor strips nothing, so the ops PayoutsPage (and vendor Owners for their own tenant) receive bcrypt/scrypt password hashes, pendingEmail, phoneNumber, plus tenant providerCustomerId. Verified live.
- **How to reproduce:** curl -H 'Authorization: Bearer <ops token>' http://localhost:3000/payouts?pageSize=3 and inspect items[].requestedBy.password.
- **Impact:** Credential hashes of every vendor owner who ever requested a payout are exposed to any ops admin and logged in browser devtools/network; offline cracking of vendor passwords becomes possible.
- **Evidence:**

```
payouts.service.ts:401-404: .createQueryBuilder('payout').leftJoinAndSelect('payout.requestedBy', 'staff').leftJoinAndSelect('payout.tenant', 'tenant')
payouts.service.ts:446-449: relations: ['requestedBy', 'tenant']
staff.entity.ts: no @Exclude anywhere; line 47: password?: string;
Live GET /payouts (SuperAdmin): "requestedBy":{...,"email":"owner@e2e.test","password":"b4d7db516723a158006cc3ebb68825d1:a2df10c4...","verifiedAt":...}
```
- **Suggested fix (NOT applied):** Select only id/firstName/lastName/email for requestedBy and id/name for tenant (addSelect), or map through sanitizeStaff; add @Exclude() to Staffer.password.

### 173. [HIGH] Unsuspend requests can only be approved: no deny/close path, so a refused vendor is stuck forever and the ops inbox never empties

- **Where:** `backend/src/modules/ops/ops.service.ts:314`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** resolveUnsuspendRequest always lifts the suspension; the console offers a single 'Approve & unsuspend' action. If ops disagree with the vendor's message there is no way to close the request: it stays unresolved (dashboard 'Pending unsuspend requests' counter and the 30s-polling inbox keep showing it) and the vendor cannot submit a corrected request because requestUnsuspend rejects while an open one exists. Neither can ops send the vendor a reply/reason.
- **How to reproduce:** Suspend a vendor, submit an unsuspend request from the dashboard, then try to refuse it in the ops console.
- **Impact:** Vendors whose request is not accepted get no answer and cannot try again; ops must either wrongly unsuspend or leave the queue polluted.
- **Evidence:**

```
ops.service.ts:321-328: if (!request.resolvedAt) { await this.unsuspendRequestRepository.update(id, { resolvedAt: new Date() }); await this.unsuspendTenant(request.tenantId); }
ops/src/pages/VendorsPage.tsx:209-217: <Popconfirm title="Approve this request and unsuspend the vendor?" ...><Button size="small" type="primary">Approve & unsuspend</Button>
tenants.service.ts:112-117: const existingRequest = await this.unsuspendRequestRepository.findOne({ where: { tenantId, resolvedAt: IsNull() } }); if (existingRequest) throw new BadRequestException(UNSUSPEND_REQUEST_ALREADY_EXISTS);
```
- **Suggested fix (NOT applied):** Add POST /ops/unsuspend-requests/:id/deny with a reason (sets resolvedAt + outcome, notifies tenant staff with the reason) and a Deny button in UnsuspendRequestsTab; allow a new request after a denial.

### 174. [HIGH] Payout approve/reject are not written to the audit log (no @Audited, no LogEntity for payouts)

- **Where:** `backend/src/modules/payouts/controllers/payouts.controller.ts:127`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Every other ops action is decorated with @Audited so the Activity Log records who did what, but the two money-moving SuperAdmin endpoints are not, and LogEntity has no payout value. The Activity Log therefore never shows which admin sent a transfer or rejected a withdrawal, and the rejection reason is stored only in payouts.failureReason.
- **How to reproduce:** Approve a payout, open Activity Log: no row appears.
- **Impact:** No accountability for real-money decisions; a disputed or fraudulent payout approval cannot be attributed to an admin from the console.
- **Evidence:**

```
payouts.controller.ts:127-134: @Post(':id/approve') @ApiOperation(...) @AuthorizedUserType.isStaff([StaffRole.SUPER_ADMIN]) async approvePayout(...)  (no @Audited)
payouts.controller.ts:136-144: @Post(':id/reject') ... async rejectPayout(...)  (no @Audited)
logging/entities/log.entity.ts:11-22: export enum LogEntity { USER, BOOKING, REVIEW, COURT, BRANCH, TENANT, STAFF, SUBSCRIPTION, OPS_ADMIN, UNSUSPEND_REQUEST }  (no PAYOUT)
```
- **Suggested fix (NOT applied):** Add LogEntity.PAYOUT and @Audited(LogEntity.PAYOUT, LogAction.UPDATE) to both handlers; include payoutId, tenantId, amount in the snapshot.

### 175. [HIGH] Ops are never notified of new payout requests and the dashboard has no pending-payouts card

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:458`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The only listener for 'payout.requested' writes a log line. There is no NotificationType for payouts, so no bell notification, push or e-mail reaches SuperAdmins, and DashboardPage only counts pending courts, unsuspend requests and log entries. A vendor's withdrawal sits until an admin happens to open the Payouts page.
- **How to reproduce:** Request a payout as a vendor Owner; watch the ops bell and dashboard: nothing changes.
- **Impact:** Vendors wait indefinitely for money; ops have no signal that a request exists.
- **Evidence:**

```
payouts.service.ts:458-461: @OnEvent('payout.requested') async onPayoutRequested(payload) { this.logger.log(`Payout requested: ${payload.payout.id}`); }
notifications/entities/notification.entity.ts:39-50: NotificationType enum contains court_*/branch_*/tenant_* only, no payout_* value
ops/src/pages/DashboardPage.tsx:14-30: useQuery listPendingCourts / listUnsuspendRequests / listLogs only
```
- **Suggested fix (NOT applied):** Add NotificationType.PAYOUT_REQUESTED with i18n content, call notificationsService.notifyOps from onPayoutRequested, and add a 'Payouts pending review' card (GET /payouts?status=pending&pageSize=1) to DashboardPage.

### 176. [MEDIUM] Vendor gets no notification or e-mail when a payout is approved, rejected, completed or fails; the rejection reason is only visible deep in Settings

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:463`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** 'payout.approved', 'payout.rejected', 'payout.completed' and 'payout.failed' are emitted but the only listeners log to the server console; no NotificationType exists for them. The ops rejection reason (PayoutsPage ReasonModal label says it is shown to the vendor) is written to payouts.failureReason and surfaces only if the vendor opens Settings > Payouts.
- **How to reproduce:** Reject a payout with a reason in the ops console; the vendor receives nothing.
- **Impact:** Vendors do not learn that money was sent or why a withdrawal was refused unless they poll the settings page.
- **Evidence:**

```
payouts.service.ts:463-471: @OnEvent('payout.completed') ... this.logger.log(...); @OnEvent('payout.failed') ... this.logger.log(...)
grep 'payout.approved|payout.rejected' across backend/src -> only the emitters in payouts.service.ts:146,192
ops/src/components/ReasonModal.tsx:44: label="Reason (shown to the vendor)"
dashboard/src/components/settings/PayoutsSection.js:150-152: {row.failureReason ? (... {row.failureReason}
```
- **Suggested fix (NOT applied):** Add PAYOUT_APPROVED/REJECTED/COMPLETED/FAILED notification types with EN/AR content and e-mail templates and notify tenant staff from the event handlers.

### 177. [MEDIUM] Ops 'Log out' only clears localStorage; the server session and 30-day refresh token stay active

- **Where:** `ops/src/auth/AuthContext.tsx:36`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** logout() never calls POST /auth/staff/logout, so the session row remains ACTIVE and the sid is not put on the revocation denylist; the access token keeps working for up to 15 min and the refresh token for 30 days if copied (e.g. from devtools on a shared machine). Note the request interceptor also strips Authorization from any /auth URL, so a naive client.post('/auth/staff/logout') would be sent unauthenticated.
- **How to reproduce:** Log out of the ops console; reuse the previous bearer token with curl within 15 min: requests still succeed.
- **Impact:** An ops admin's session survives logout; PRODUCTION-READINESS claims 'Logout now actually ends the session', which is not true for the ops console.
- **Evidence:**

```
AuthContext.tsx:36-39: const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);
ops/src/api/client.ts:87: if (config.url?.startsWith("/auth")) return config;
auth.staff.controller.ts:201-206: @Post('logout') @UseGuards(JwtAuthGuard) async logout(@CurrentUser() user) { return this.authService.logout(user); }
```
- **Suggested fix (NOT applied):** Call POST /auth/staff/logout (with the access token attached, e.g. exempt that URL from the /auth skip) before clearing storage.

### 178. [MEDIUM] All ops admins behind one IP share a 300-requests/15-min bucket with a 1-hour block; dashboard polling alone can lock the whole team out

- **Where:** `backend/src/modules/ops/ops.controller.ts:46`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** OpsController applies ThrottlerGuard with the named 'auth' and 'phone' throttlers overridden to 300/15 min. The tracker is req.ip (default getTracker) and blockDuration is inherited from the root 'auth' throttler (1 h). DashboardPage fires 3 ops requests every 30 s (90 per 15 min per tab); four open dashboard tabs or 3-4 admins on an office NAT/VPN exceed 300 and every /ops route answers 429 TOO_MANY_REQUESTS for an hour (rendered as 'Too many attempts' or as empty tables).
- **How to reproduce:** Open the dashboard in 4 tabs from one IP and wait 15 minutes.
- **Impact:** Ops console goes dark for the whole office for an hour under normal use.
- **Evidence:**

```
ops.controller.ts:46-50: @UseGuards(JwtAuthGuard, UserTypeGuard, ThrottlerGuard) @Throttle({ auth: { limit: 300, ttl: ms('15m') }, phone: { limit: 300, ttl: ms('15m') } })
app.module.ts:115-120: { name: 'auth', ttl: ms('15m'), limit: 6, blockDuration: ms('1h') }
node_modules/@nestjs/throttler/dist/throttler.guard.js:83: blockDuration = routeOrClassBlockDuration || namedThrottler.blockDuration || ttl; :135-137 getTracker(req) { return req.ip; }
ops/src/pages/DashboardPage.tsx:9,17,23,29: const POLL = 30_000; refetchInterval: POLL (x3)
```
- **Suggested fix (NOT applied):** Key the ops throttle on user id (generateKey with req.user.id), raise the limit, and set an explicit short blockDuration; or drop ThrottlerGuard from authenticated ops reads.

### 179. [MEDIUM] Branch suspension/unsuspension has no UI in the ops console (API functions exist but are unused)

- **Where:** `ops/src/api/ops.ts:59`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** suspendBranch/unsuspendBranch are exported but no page imports them; the Vendors page lists tenants only and the Approvals page shows courts only, so the POST /ops/branches/:id/suspend moderation lever documented in the product facts cannot be used without curl. The notification type, email template and audit entity for branch suspension are all wired on the backend.
- **How to reproduce:** Try to suspend a branch in the ops console: no entry point exists.
- **Impact:** Ops cannot suspend a problematic branch (all its courts) from the console; PRODUCTION-READINESS line 402 still lists this as open.
- **Evidence:**

```
ops/src/api/ops.ts:59-68: export async function suspendBranch(id, reason) {...} export async function unsuspendBranch(id) {...}
grep 'suspendBranch|unsuspendBranch' ops/src/pages -> no matches
ops.controller.ts:120-139: @Post('branches/:id/suspend') ... @Post('branches/:id/unsuspend')
```
- **Suggested fix (NOT applied):** Add a vendor detail drawer (branches with suspend/unsuspend + reason) or a Branches tab on VendorsPage backed by a GET /ops/branches?tenantId= listing.

### 180. [MEDIUM] Ops cannot suspend or even list courts a vendor has set to 'unavailable'; controller doc claims pending courts can be suspended

- **Where:** `backend/src/modules/courts/courts.service.ts:973`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** CourtsService.suspend only accepts AVAILABLE. A vendor can toggle a court to 'unavailable' (allowed by PATCH /courts) to dodge a suspension and flip it back later; the Approvals page status filter has no 'unavailable' option so ops never see such courts, and the Swagger summary still advertises 'available/pending_approval -> suspended', which the backend rejects with INVALID_COURT_STATUS_TRANSITION.
- **How to reproduce:** Vendor sets a court to Unavailable; ops filter shows nothing for it; POST /ops/courts/:id/suspend returns 400.
- **Impact:** A sanctioned court can go live again without review; ops have a blind spot in the moderation queue.
- **Evidence:**

```
courts.service.ts:968-973: async suspend(id, reason, reviewer) { ... this.assertCourtStatus(court, [CourtStatus.AVAILABLE]);
ops.controller.ts:95-97: summary: 'Suspend a court (available/pending_approval -> suspended)'
ops/src/pages/CourtApprovalsPage.tsx:31-36: STATUS_OPTIONS = [pending_approval, changes_requested, suspended, available]  (no 'unavailable')
courts.service.ts:759-763: vendor may set status AVAILABLE/UNAVAILABLE
```
- **Suggested fix (NOT applied):** Allow suspend from UNAVAILABLE too (assertCourtStatus [AVAILABLE, UNAVAILABLE]), add 'Unavailable' to STATUS_OPTIONS, fix the ApiOperation summary.

### 181. [MEDIUM] PATCH /admin/tenants/:id/block suspends a vendor with no reason and no notification, bypassing the ops flow

- **Where:** `backend/src/modules/admin/admin.controller.ts:104`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** A second SuperAdmin path blocks a tenant via tenantsService.blockTenant(tenantId, true) without a reason and without the TENANT_SUSPENDED notification/e-mail that OpsService.suspendTenant sends. blockedReason is written as NULL, so the vendor dashboard alert shows no explanation and the vendor is never told.
- **How to reproduce:** PATCH /admin/tenants/<id>/block with an ops token; check tenants.blockedReason (NULL) and vendor notifications (none).
- **Impact:** Inconsistent suspensions: vendor silently loses visibility with no reason and cannot address the problem.
- **Evidence:**

```
admin.controller.ts:112-116: async blockTenant(@Param('id', ParseUUIDPipe) tenantId) { await this.tenantsService.blockTenant(tenantId, true); }
tenants.service.ts:82-86: await this.tenantRepository.update(tenantId, { blockedAt: blocked ? new Date() : null, blockedReason: blocked ? reason : null });
ops.service.ts:242-264: suspendTenant(...) { await blockTenant(id, true, reason); ... notifyStaff({ tenantId: id }, { email: true, type: TENANT_SUSPENDED, data: { reason } ...
dashboard/src/components/layout/DashboardLayout.js:222-228: {tenant?.blockedAt && (<Alert ... description={tenant.blockedReason || undefined}
```
- **Suggested fix (NOT applied):** Remove the /admin block/unblock tenant endpoints or route them through OpsService.suspendTenant with a mandatory reason.

### 182. [MEDIUM] PATCH /ops/admins/:id/role can promote any vendor staffer to SuperAdmin (keeping tenantId) or demote an ops admin into a tenant role with no tenant

- **Where:** `backend/src/modules/staff/staff.service.ts:537`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** updateSuperAdminRole loads any non-deleted staffer by id and writes the requested role with no check that the target is (or becomes) a coherent account: a vendor Owner can be turned into SUPER_ADMIN while retaining tenantId, and an ops admin can be set to Owner/Admin/User with tenantId NULL (a broken account that passes UserTypeGuard for tenant routes with tenantId undefined). The endpoint is exposed but unused by the console (ops.ts updateAdminRole has no caller), so it is untested dead surface.
- **How to reproduce:** PATCH /ops/admins/<vendor staffer id>/role {"role":"SuperAdmin"} with an ops token.
- **Impact:** Privilege escalation of vendor staff to platform admin by a single mistaken call; demoted admins become orphaned accounts.
- **Evidence:**

```
staff.service.ts:537-550: async updateSuperAdminRole(id, role) { const staff = await this.getById(id); if (!staff) throw ...; if (staff.role === SUPER_ADMIN && role !== SUPER_ADMIN) await this.assertNotLastSuperAdmin(staff); await this.staffRepository.update(id, { role }); ...
ops.controller.ts:213-226: @Patch('admins/:id/role') ... updateAdminRole(@Param('id') id, @Body() dto: UpdateOpsAdminRoleDto) { return this.opsService.updateAdminRole(id, dto.role); }
ops/src/api/ops.ts:119-122: export async function updateAdminRole(...)  (never imported by a page)
```
- **Suggested fix (NOT applied):** Restrict to staff with tenantId IS NULL, only allow SUPER_ADMIN<->(disabled) transitions, revoke the target's sessions on change, or remove the endpoint.

### 183. [MEDIUM] Vendors with no name/phone are unidentifiable across the console (rows show '—'), and suspension emails read 'Account null has been suspended'

- **Where:** `ops/src/pages/VendorsPage.tsx:92`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Tenant.name and phoneNumber are nullable and several live tenants have both NULL (e.g. tenant 679ef6bf..., owner of the pending 'QA Court 3'). GET /admin/tenants selects no owner email, so the Vendors table renders '—' for Name and Contact; the Approvals table/drawer show '—' for Vendor; the ReasonModal title becomes 'Suspend vendor — '; and the TENANT_SUSPENDED e-mail interpolates resourceName=null into its preview/title.
- **How to reproduce:** Open Vendors: rows with '—' in Name and Contact; open a pending court from such a tenant.
- **Impact:** Ops cannot tell which vendor they are suspending or whose court they are approving; vendor receives a malformed e-mail.
- **Evidence:**

```
VendorsPage.tsx:92-97: { title: "Name", dataIndex: "name", render: (v) => v ?? "—" }, { title: "Contact", dataIndex: "phoneNumber", render: (v) => v ?? "—" }
tenants.service.ts:157-169: select: { id, name, phoneNumber, totalBranches, ... blockedAt }  (no owner/email)
ops.service.ts:257-261: emailData: { resourceType: 'Account', resourceName: tenant.name, reason }
emails/resource-suspended.tsx:16: preview={`${resourceType} ${resourceName} has been suspended`}
Live GET /ops/courts/pending: "tenant":{"id":"679ef6bf-...","name":null,"phoneNumber":null,...}
```
- **Suggested fix (NOT applied):** Join the owner (email) in listTenants and show it as fallback; fall back to owner email/tenant id in the approvals drawer and e-mail data.

### 184. [MEDIUM] Moderation/suspension e-mails to vendors are English-only although in-app content is localised (EN/AR)

- **Where:** `backend/src/modules/notifications/notifications.service.ts:463`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** notifyStaffMembers sends staff e-mails through sendEmail(), which passes no language to EmailService (defaults to 'en'), and the court-approved, court-changes-requested and resource-suspended templates are hard-coded English JSX. Push/in-app content for the same events has Arabic strings in i18n.ts. Arabic-speaking vendors (the SAR default market) receive the reason for a rejection or suspension in English only.
- **How to reproduce:** Set a vendor's language to Arabic and request changes on their court; the e-mail arrives in English.
- **Impact:** Inconsistent, non-localised vendor communication for the most important moderation outcomes.
- **Evidence:**

```
notifications.service.ts:463-475: async sendEmail(emails, { data, type }) { ... return this.emailService.sendEmail({ to: emails, template, data }); }  (no language)
email.service.ts:100-124: async sendEmail({ ..., language = 'en' }) ... subject: subject || this.getSubject(template, language)
emails/court-changes-requested.tsx:17-24: title="Changes Requested for Your Court" ... 'Our team reviewed your court and requested a few changes ...'
i18n.ts:494-496 (ar): court_changes_requested: { title: 'تم طلب تعديلات', ...}
```
- **Suggested fix (NOT applied):** Group staff recipients by language like sendParticipantEmails does and localise the three templates.

### 185. [MEDIUM] Payout approval/request only check isActive, not that a Stripe account id exists; ops then see a raw Stripe error and the payout is dead

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:118`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** approvePayout (and requestPayout) look up settings with { isActive: true } and pass settings.providerAccountId straight to Stripe. A settings row that is active without providerAccountId (legacy PUT /settings rows, or an account wiped on the Stripe side) makes transfers.create fail; the catch marks the payout FAILED and refunds the balance, so ops cannot retry: the vendor must notice and re-request. The live DB already contains such a payout. The console maps PAYOUT_CREATION_FAILED to 'Failed to create the payout. Please try again.', which is misleading because the row is no longer pending, and failureReason shows Stripe's raw text.
- **How to reproduce:** Approve a payout for a tenant whose tenant_payout_settings has isActive=true and providerAccountId NULL.
- **Impact:** Ops get a confusing failure, the vendor's withdrawal silently fails and must be re-requested; no one is told.
- **Evidence:**

```
payouts.service.ts:118-124: const settings = await this.settingsRepo.findOne({ where: { tenantId: payout.tenantId, isActive: true } }); if (!settings) throw new BadRequestException('PAYOUT_ACCOUNT_NOT_CONFIGURED');
payouts.service.ts:133: destinationAccount: settings.providerAccountId,
Live GET /payouts: "status":"failed","failureReason":"You passed an empty string for 'destination'. ..."
ops/src/api/client.ts:204: PAYOUT_CREATION_FAILED: "Failed to create the payout. Please try again."
```
- **Suggested fix (NOT applied):** Require providerAccountId (and provider readiness) in both request and approve; show account readiness on the ops Payouts row; reword the error to say the payout was marked failed.

### 186. [MEDIUM] Suspending a court leaves paid upcoming bookings in place with no customer notice and no warning to the reviewer

- **Where:** `backend/src/modules/courts/courts.service.ts:968`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** CourtsService.suspend only flips status; nothing cancels, refunds or notifies bookings already made on that court. countUpcomingBookings exists and blocks deletion of a court with live bookings, but suspension neither uses it nor warns ops. The console's Suspend dialog has no mention of existing bookings, and the vendor e-mail says the court 'is no longer visible to customers', while customers still hold bookings on it.
- **How to reproduce:** Book a court for tomorrow as a customer, then suspend it in the ops console; the booking remains PENDING and no one is notified.
- **Impact:** Customers can show up to a court ops deemed unfit, or the vendor cancels late; ops decide without knowing the booking impact.
- **Evidence:**

```
courts.service.ts:968-982: async suspend(...) { ... await this.courtRepository.update(id, { status: SUSPENDED, rejectionReason: reason, ... }); return this.findForModeration(id); }
courts.service.ts:882-884: if (await this.countUpcomingBookings([id])) throw new BadRequestException(COURT_HAS_UPCOMING_BOOKINGS);  (delete path only)
ops/src/pages/CourtApprovalsPage.tsx:255-259: {selected.status === "available" && (<Button danger onClick={() => setReasonAction("suspend")}>Suspend</Button>)}
emails/resource-suspended.tsx:22-23: has been suspended by our team and is no longer visible to customers
```
- **Suggested fix (NOT applied):** Return upcomingBookings count in the pending list / drawer, show it in the Suspend confirmation, and define the policy (cancel+refund with notification, or block suspension like delete).

### 187. [MEDIUM] List pages render the empty state ('Queue is empty', 'No vendors found') on fetch errors; dashboard cards spin forever

- **Where:** `ops/src/pages/CourtApprovalsPage.tsx:113`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** No page reads isError/error from useQuery. When a request fails (429 throttle block, 401 during a refresh failure, 500), isLoading becomes false and dataSource is undefined, so antd shows the custom empty text as if the queue were really empty. DashboardPage uses loading={!data}, so a failed query leaves the card skeleton loading permanently with no message.
- **How to reproduce:** Stop the backend (or trigger the 429 block) and open Court Approvals: it says 'Queue is empty'.
- **Impact:** Ops believe there is nothing to review while the API is failing; outages are invisible.
- **Evidence:**

```
CourtApprovalsPage.tsx:49-52: const { data, isLoading } = useQuery({...}); :115-117: loading={isLoading} dataSource={data?.items} locale={{ emptyText: <Empty description="Queue is empty" /> }}
VendorsPage.tsx:35-38,76-80: same pattern with 'No vendors found'
PayoutsPage.tsx:45-49,89-92 and ActivityLogPage.tsx:79-82,141-144: same
DashboardPage.tsx:39-43: <Card hoverable onClick=... loading={!pendingCourts}>
```
- **Suggested fix (NOT applied):** Handle isError with an Alert + Retry in each page and use isLoading (not !data) for the dashboard cards.

### 188. [MEDIUM] Creating an ops admin with a deactivated admin's e-mail hits the unique index: 409 DUPLICATE_ENTRY shown as generic 'Failed to create admin', no reactivation path

- **Where:** `backend/src/modules/staff/staff.service.ts:482`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** createSuperAdmin checks getByEmail (deletedAt IS NULL only) and then inserts; deactivateSuperAdmin soft-deletes, and idx_staff_email is unique across soft-deleted rows, so re-creating a deactivated admin fails at the DB. The exception filter maps it to 409 DUPLICATE_ENTRY, which the console does not translate (apiErrorMessage falls back to 'Failed to create admin'). The analogous vendor-staff path already returns STAFF_EMAIL_DEACTIVATED; there is no 'reactivate' action anywhere.
- **How to reproduce:** Deactivate qa-opsadmin@e2e.test (already soft-deleted in the DB), then create an admin with that e-mail.
- **Impact:** A deactivated admin can never be brought back with the same corporate e-mail and the operator gets no explanation.
- **Evidence:**

```
staff.service.ts:482-485: const existingStaff = await this.getByEmail(email); if (existingStaff) throw new BadRequestException(STAFF_EMAIL_ALREADY_EXISTS);
staff.service.ts:110: findOne({ where: { email, deletedAt: IsNull() } })
staff.entity.ts:12: @Index('idx_staff_email', ['email'], { unique: true })
staff.service.ts:341-349 (vendor invite path): withDeleted: true ... throw new BadRequestException(STAFF_EMAIL_DEACTIVATED);
exception-filter.ts:35-38: if (driverCode === '23505') { status = 409; code = DUPLICATE_ENTRY; }
ops/src/api/client.ts:137-212: ERROR_MESSAGES has no DUPLICATE_ENTRY / STAFF_EMAIL_DEACTIVATED entry
```
- **Suggested fix (NOT applied):** Mirror the withDeleted check in createSuperAdmin (return STAFF_EMAIL_DEACTIVATED), map that code and DUPLICATE_ENTRY in the console, and add a reactivate action.

### 189. [MEDIUM] resolveUnsuspendRequest marks the request resolved before unsuspending; a failure leaves the vendor blocked with no way to re-request

- **Where:** `backend/src/modules/ops/ops.service.ts:321`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The method is not transactional: it updates resolvedAt, then calls unsuspendTenant (blockTenant + getTenant + notifyStaff). If any of those throws (tenant deleted -> TENANT_NOT_FOUND, notification insert failure, DB hiccup) the request is already resolved, the ops UI shows 'Failed to resolve request', the request disappears from the inbox, the tenant stays blocked, and requestUnsuspend now allows a new request only because the old one is 'resolved' - but nothing tells the vendor to file one.
- **How to reproduce:** Make unsuspendTenant throw (e.g. tenant soft-deleted) and resolve its request.
- **Impact:** Silent inconsistent state between the inbox and the vendor's suspension.
- **Evidence:**

```
ops.service.ts:321-328: if (!request.resolvedAt) { await this.unsuspendRequestRepository.update(id, { resolvedAt: new Date() }); await this.unsuspendTenant(request.tenantId); }
ops.service.ts:269-271: async unsuspendTenant(id) { await this.tenantsService.blockTenant(id, false); const tenant = await this.tenantsService.getTenant(id); ...
```
- **Suggested fix (NOT applied):** Wrap in @Transactional and unsuspend first, then mark resolved; or let blockTenant(false) resolve requests (it already does) and drop the separate update.

### 190. [LOW] Suspension reason and date are not visible anywhere in the console (vendor list, unsuspend inbox)

- **Where:** `backend/src/modules/tenants/tenants.service.ts:157`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** listTenants selects blockedAt but not blockedReason, and VendorsPage shows only a Suspended tag; the Unsuspend Requests tab loads the tenant relation (which includes blockedReason/blockedAt) but renders only the vendor's message. Ops must decide on a reinstatement without seeing why or when the vendor was suspended.
- **How to reproduce:** Open Vendors > Unsuspend Requests: no reason column.
- **Impact:** Poorly informed reinstatement decisions.
- **Evidence:**

```
tenants.service.ts:157-169: select: { id: true, name: true, phoneNumber: true, ..., blockedAt: true }  (no blockedReason)
VendorsPage.tsx:100-106: title: "Status", dataIndex: "blockedAt", render: (blockedAt) => blockedAt ? <StatusTag status="suspended" /> : ...
VendorsPage.tsx:185-204: columns Vendor / Message / Requested only; ops.service.ts:294-302 loads relations: ['tenant']
```
- **Suggested fix (NOT applied):** Add blockedReason/blockedAt to the tenant select and show them in both tabs.

### 191. [LOW] Approvals drawer shows the hourly rate without a currency and hides schedule/prices and the previous review reason

- **Where:** `ops/src/pages/CourtApprovalsPage.tsx:215`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Court.currency is a virtual property populated only by CourtsService listing paths (from tenantPreferences), not by OpsService.listPendingCourts, so the drawer renders '150' with no currency (live response has no currency key). The reviewer also cannot see the court's schedule or the reason ops gave on the previous round for a resubmitted court (rejectionReason is returned by the API but not in the ops Court type or UI).
- **How to reproduce:** Open any pending court in the drawer.
- **Impact:** Ops approve pricing they cannot interpret (SAR vs EGP vs USD) and cannot verify that requested changes were made.
- **Evidence:**

```
CourtApprovalsPage.tsx:215: children: `${selected.hourlyRate} ${selected.currency ?? ""}`.trim()
court.entity.ts:164-168: @ApiProperty({ description: 'The currency code ... from tenant settings' }) currency?: string;  (no @Column)
courts.service.ts:441: const currency = (court.branch as any)?.tenantPreferences?.currency || 'SAR';  (not used by ops.service.ts:50-80)
Live GET /ops/courts/pending item: "hourlyRate":150,"sport":"tennis",... (no "currency")
ops/src/api/types.ts:84-102: interface Court has no rejectionReason
```
- **Suggested fix (NOT applied):** Join tenantPreferences.currency in listPendingCourts, return schedule summary, and show rejectionReason/reviewedAt in the drawer.

### 192. [LOW] RejectPayoutDto accepts an empty or unbounded reason (no IsNotEmpty/MaxLength) unlike CourtModerationDto

- **Where:** `backend/src/modules/payouts/dto/reject-payout.dto.ts:5`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The console enforces a non-empty reason client-side, but the API accepts reason: '' or a multi-megabyte string which is stored in payouts.failureReason and shown to the vendor.
- **How to reproduce:** POST /payouts/<id>/reject {"reason":""} with an ops token -> 200.
- **Impact:** Vendors can receive a rejection with no reason; oversized reasons bloat the row.
- **Evidence:**

```
reject-payout.dto.ts:4-8: export class RejectPayoutDto { @IsString() @ApiProperty(...) reason: string; }
court-moderation.dto.ts:9-12: @IsString() @IsNotEmpty() @MaxLength(1000) reason: string;
```
- **Suggested fix (NOT applied):** Add @IsNotEmpty() @MaxLength(1000).

### 193. [LOW] AdminsPage decides 'last active admin' from the current page, not the total count

- **Where:** `ops/src/pages/AdminsPage.tsx:72`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** isLastAdmin = activeAdmins.length <= 1 uses the page's items. With 11+ admins, the single row on page 2 (or a page size of 1) has Deactivate disabled with the tooltip 'The last active admin cannot be deactivated' even though ten others exist.
- **How to reproduce:** Create 11 admins, go to page 2.
- **Impact:** Wrong disabled state/tooltip on paginated lists.
- **Evidence:**

```
AdminsPage.tsx:49: const activeAdmins = data?.items ?? [];
AdminsPage.tsx:72: const isLastAdmin = activeAdmins.length <= 1;
AdminsPage.tsx:205-211: const disabled = a.id === user?.id || isLastAdmin;
```
- **Suggested fix (NOT applied):** Use data.pagination.totalCount <= 1.

### 194. [LOW] Last-super-admin guard is a non-atomic count-then-update; two admins deactivating each other concurrently can leave zero admins

- **Where:** `backend/src/modules/staff/staff.service.ts:505`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** assertNotLastSuperAdmin counts active SuperAdmins and deactivateSuperAdmin then soft-deletes without a transaction or lock. Two concurrent deactivations (A deactivates B while B deactivates A) both see count=2 and both succeed, locking everyone out of the console with no recovery path except SQL.
- **How to reproduce:** Fire two PATCH /ops/admins/:id/deactivate for each other's ids simultaneously with two admins.
- **Impact:** Total loss of ops access in a rare race.
- **Evidence:**

```
staff.service.ts:505-513: const superAdminCount = await this.staffRepository.count({ where: { role: SUPER_ADMIN, deletedAt: IsNull() } }); if (superAdminCount <= 1) throw ...
staff.service.ts:516-524: await this.assertNotLastSuperAdmin(staff); await this.staffRepository.update(id, { deletedAt: new Date() });
```
- **Suggested fix (NOT applied):** Run in a transaction with pg_advisory_xact_lock or SELECT ... FOR UPDATE on the SuperAdmin rows, re-check the count inside it.

### 195. [LOW] SuperAdmin accounts can be created with trivially weak passwords (only MinLength 8)

- **Where:** `backend/src/modules/ops/dto/ops-admin.dto.ts:29`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** CreateOpsAdminDto enforces only 8 characters; the console's strength meter is advisory. 'aaaaaaaa' is accepted for the highest-privilege role, and there is no forced password change on first login even though the creator knows the password.
- **How to reproduce:** Create an admin with password 'aaaaaaaa'.
- **Impact:** Platform-admin accounts with guessable passwords.
- **Evidence:**

```
ops-admin.dto.ts:29-32: @ApiProperty({ example: 'Str0ngP@ssword', minLength: 8 }) @IsString() @MinLength(8) password: string;
AdminsPage.tsx:107-112: rules={[{ required: true, ... }, { min: 8, message: "Minimum 8 characters" }]}
```
- **Suggested fix (NOT applied):** Add a complexity validator (or zxcvbn score) server-side and require a password change on first login / send an invite link instead.

### 196. [LOW] payouts.amount is a float column while every other money column is numeric(14,2)

- **Where:** `backend/src/modules/payouts/entities/payout.entity.ts:15`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Payout.amount is declared @Column('float') (DB: double precision) whereas tenant_balances and balance_transactions use numeric(14,2) with a money transformer. The float value is what deductPayout/refundFailedPayout use, so a requested 100.10 can round-trip as 100.09999... and be refunded/transferred with a cent drift.
- **How to reproduce:** Request a payout of 100.10 and compare payouts.amount with the balance_transactions row.
- **Impact:** Ledger and payout amounts can disagree by rounding.
- **Evidence:**

```
payout.entity.ts:15-16: @Column('float') amount: number;
information_schema (live): payouts|amount|double precision ; tenant_balances|availableBalance|numeric|14|2
tenant-balance.entity.ts:14-17: // numeric, not float: binary floating point cannot represent 0.10 exactly ... @Column('numeric', { precision: 14, scale: 2, ... transformer: moneyTransformer })
```
- **Suggested fix (NOT applied):** Migrate payouts.amount to numeric(14,2) with moneyTransformer.

### 197. [LOW] ReasonModal keeps stale 'reason' state across opens: OK button enabled with an empty textarea after cancel/reopen

- **Where:** `ops/src/components/ReasonModal.tsx:36`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The OK button's disabled state comes from a local useState that is never reset when the modal opens; only the antd form is reset. After typing a reason, cancelling and reopening (or after a successful action followed by a new one), the button is enabled while the field is empty; clicking it runs validateFields which fails silently with a red 'A reason is required' message.
- **How to reproduce:** Type a reason, Cancel, click Suspend again.
- **Impact:** Minor inconsistent button state in every suspend/request-changes/reject dialog.
- **Evidence:**

```
ReasonModal.tsx:25-29: const [reason, setReason] = useState(""); useEffect(() => { if (open) form.resetFields(); }, [open, form]);
ReasonModal.tsx:36: okButtonProps={{ danger, loading, disabled: !reason.trim() }}
ReasonModal.tsx:53: onChange={(e) => setReason(e.target.value)}
```
- **Suggested fix (NOT applied):** setReason('') in the open effect, or derive disabled from Form.useWatch('reason').

### 198. [LOW] Court/branch suspension e-mail tells vendors to 'request an unsuspension from your dashboard', which exists only for account suspension

- **Where:** `backend/src/emails/resource-suspended.tsx:43`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The same ResourceSuspended template is used for COURT_SUSPENDED, BRANCH_SUSPENDED and TENANT_SUSPENDED. Its closing paragraph points to an unsuspend request, but POST /tenants/request-unsuspend only works while the tenant is blocked; court and branch suspensions have no vendor-side request path at all.
- **How to reproduce:** Suspend a court; read the e-mail.
- **Impact:** Vendors look for a button that does not exist.
- **Evidence:**

```
resource-suspended.tsx:43-47: You can still log in to your dashboard to resolve the issue. Once resolved, contact support or request an unsuspension from your dashboard.
ops.service.ts:162-166: emailData: { resourceType: 'Court', ... } ; ops.service.ts:210-214: emailData: { resourceType: 'Branch', ... }
tenants.service.ts:108-110: if (!tenant.blockedAt) throw new BadRequestException(TENANT_NOT_BLOCKED);
```
- **Suggested fix (NOT applied):** Make the closing paragraph conditional on resourceType (courts/branches: 'contact support').

### 199. [LOW] Non-SuperAdmin staff who sign in on the ops login page get a server session that is never revoked

- **Where:** `ops/src/auth/AuthContext.tsx:25`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** login() calls POST /auth/staff/login first (which creates a 30-day session row) and only then rejects non-SuperAdmin roles client-side, discarding the tokens without calling logout. Each such attempt leaves an orphaned active session.
- **How to reproduce:** Log in to the ops console with a vendor Owner account.
- **Impact:** Session table pollution and dangling credentials for vendor staff.
- **Evidence:**

```
AuthContext.tsx:25-34: const data = await loginStaff(email, password); if (data.user?.role !== "SuperAdmin") { throw new Error("This console is restricted ..."); } tokenStore.set(...)
auth.service.ts:482-493: await this.sessionsRepository.upsert({ id: sid, userId, ..., expiresAt: dayjs().add(30, 'days').toDate() })
```
- **Suggested fix (NOT applied):** Call POST /auth/staff/logout with the returned access token before throwing, or add a role check to a dedicated ops login endpoint.

### 200. [LOW] Vendors tab has no suspended/active filter although GET /admin/tenants supports ?blocked=

- **Where:** `ops/src/pages/VendorsPage.tsx:35`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** listTenants exposes a blocked flag (declared in ops.ts too) but the page offers only a name search; with hundreds of vendors ops cannot list the suspended ones.
- **How to reproduce:** Try to see only suspended vendors.
- **Impact:** Slower moderation on realistic vendor counts.
- **Evidence:**

```
VendorsPage.tsx:35-38: queryFn: () => listTenants({ page, pageSize, search: search || undefined })
admin-tenants.dto.ts:17-24: @IsOptional() @IsBoolean() @Transform(...) blocked?: boolean;
ops/src/api/ops.ts:73-75: params: PageParams & { search?: string; blocked?: boolean }
```
- **Suggested fix (NOT applied):** Add a Status Select (All / Active / Suspended) wired to blocked.

### 201. [LOW] Activity Log rows never show the target record; missing actor e-mail is labelled 'system'

- **Where:** `ops/src/pages/ActivityLogPage.tsx:168`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The audit interceptor stores only request params/body, and the table columns are Time / Actor / Entity / Action / IP, so an ops admin must expand each row and read raw JSON to know which court or vendor was acted on. Rows whose actorEmail is null (live example: a court delete with actorEmail null) are rendered as 'system', suggesting an automated job.
- **How to reproduce:** Open Activity Log.
- **Impact:** Audit trail is hard to read and can misattribute actions to the system.
- **Evidence:**

```
audit.interceptor.ts:52-57: payload: { params: request.params, body: request.body ? omit(request.body, SENSITIVE_BODY_FIELDS) : undefined }
ActivityLogPage.tsx:168-189: columns Time, Actor (render: (v) => v ?? "system"), Entity, Action, IP
DashboardPage.tsx:85: {log.actorEmail ?? "system"}
Live GET /ops/logs item: "entity":"court","action":"delete","actorStaffId":"5c24e86c-...","actorEmail":null
```
- **Suggested fix (NOT applied):** Store a targetId/targetLabel in the log (from params.id and the handler result) and render it; show 'unknown' or the staff id instead of 'system' when actorStaffId is set.

---

## 8. Branches: creation, editing, visibility, working hours

32 issues — 0 critical, 5 high, 15 medium, 12 low.

### 202. [HIGH] Closed / under-maintenance / hidden branches stay bookable through a direct court id

- **Where:** `backend/src/modules/courts/courts.service.ts:587`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The customer visibility filter in CourtsService.findOne only checks court.status, branch.suspendedAt and tenant.blockedAt. It does NOT check branch.status = 'open' or branch.isVisible, which findAll does enforce. BookingsService.create loads the court through this findOne, so a customer holding a court id (Saved list, booking history 'book again', shared link, or a list fetched before the vendor closed the branch) can open the court and pay for a booking in a branch the vendor has set to closed / occupied / under_maintenance or hidden with the 'Show to users' switch.
- **How to reproduce:** Vendor sets branch status = closed. Customer opens a court of that branch from Saved (GET /courts/:id returns 200) and POST /bookings succeeds.
- **Impact:** Vendors who close a branch (maintenance, holiday, private event) still receive paid bookings and must cancel/refund manually; customers arrive at a closed venue.
- **Evidence:**

```
courts.service.ts:587-596  if (user && user.type !== UserType.Staff) { ... andWhere('court.status = :visibleStatus') ... andWhere('branch.suspendedAt IS NULL'); andWhere('tenant.blockedAt IS NULL'); }   // no isVisible / status
courts.service.ts:269-272 (findAll only)  queryBuilder.andWhere('branch.isVisible IS DISTINCT FROM false'); queryBuilder.andWhere('branch.status = :openStatus', { openStatus: BranchStatus.OPEN });
bookings.service.ts:134-140  const court = await this.courtsService.findOne(courtId, { schedule: true, branch: true }, sessionUser);
```
- **Suggested fix (NOT applied):** Add `branch.isVisible IS DISTINCT FROM false` and `branch.status = 'open'` to the customer block of CourtsService.findOne (and to the availability/slots path that uses it), matching findAll.

### 203. [HIGH] Admin-role staff can create a branch but can never see or edit it afterwards

- **Where:** `backend/src/modules/branches/branches.service.ts:189`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** POST /branches is allowed for Owner and Admin, but list/findOne for any role other than SuperAdmin/Owner require a BranchStaffer assignment row. create() never inserts a BranchStaffer for the creator and no event listener does either, so an Admin who creates a branch is redirected to /branches and the new branch is missing; opening /branches/:id returns BRANCH_NOT_FOUND until the Owner assigns them.
- **How to reproduce:** Log in as an Admin staffer, add a branch, land on /branches: the branch is absent; GET /branches/:id -> 404 BRANCH_NOT_FOUND.
- **Impact:** Admin staff lose the branch they just created (and were possibly charged an add-on for); they may create it again, producing duplicates and double billing.
- **Evidence:**

```
branches.controller.ts:124  @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.ADMIN])  create(
branches.service.ts:189-195  if (user.role !== StaffRole.SUPER_ADMIN && user.role !== StaffRole.OWNER) { queryBuilder.innerJoin('branch.staff', 'staffMember').andWhere('staffMember.stafferId = :stafferId', ...
branches.service.ts:311-315  if (user.role !== ... OWNER) { where.staff = { stafferId: user.id }; }
branches.service.ts:106-112  const branchData: Partial<Branch> = { ...data, locationId: location.id, tenantId: currentUser.tenantId }; const branch = await this.branchRepository.save(branchData);   // no BranchStaffer row
```
- **Suggested fix (NOT applied):** In BranchesService.create, insert a BranchStaffer for the creator when their role is not Owner (or let Admins see all tenant branches like Owners).

### 204. [HIGH] Branch page 'Total Revenue' / 'Total Bookings' show event counters that disagree with real bookings and can go negative

- **Where:** `dashboard/src/pages/Branch.js:189`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The branch page and the branches list read the lifetime counter columns branches.totalRevenue / totalBookings, which are only maintained by event listeners (increment on PAYMENT_CAPTURED, decrement on PAYMENT_REFUNDED, no floor). The live DB shows they are wrong: the vendor's branch has 7 bookings and 1000 of completed payments but counters 0 / 0; 'QA Branch 1' has totalRevenue = -150.00. The Home page computes revenue from payments, so the two pages disagree.
- **How to reproduce:** Open /branches/045346fc-04f3-47b4-9732-bf1af8887d6d as the vendor: Total Revenue 0 SAR, Total Bookings 0, while Home shows revenue and 7 bookings exist.
- **Impact:** Vendors see 0 SAR or negative revenue for branches that earned money; numbers contradict the Home page and the balance page.
- **Evidence:**

```
Branch.js:189  {branch?.totalRevenue?.toLocaleString() ?? 0} <span>SAR</span>   Branch.js:197 {branch?.totalBookings?.toLocaleString() ?? 0}
branches.service.ts:646-655  if (update.value > 0) { await this.increment(...) } else { await this.decrement(branchId, update.field, Math.abs(update.value)); }   // no GREATEST(0, ...)
stats.service.ts:404-412  await this.branchesService.updateMatchStats(branchId, { totalRevenue: -refundedAmount });
DB: SELECT ... FROM branches -> 045346fc (الشروق) totalBookings=0 actual_total=7 totalRevenue=0.00 completed_amount=1000.00 ; 6d19c21e (QA Branch 1) totalRevenue=-150.00 ; b4e7f9e5 totalBookings=3 actual=6 totalRevenue=100 completed=700
stats.service.ts (tenant stats)  'COALESCE(SUM(payment.amount), 0) as revenue'   // Home page is computed, branch page is not
```
- **Suggested fix (NOT applied):** Compute branch KPIs from bookings/payments at read time (the existing getMonthStats-style queries) instead of counters, or add a reconciliation job; floor decrements with GREATEST(0, ...).

### 205. [HIGH] 'Pending Open Matches' counter never decreases when bookings are played

- **Where:** `backend/src/modules/stats/stats.service.ts:435`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** branches.upcomingBookings is incremented on BOOKING CREATED when the start is in the future and decremented only on CANCELLED. There is no handler for booking completion/end, so the value grows forever. Branch.js shows this column under the label 'Pending Open Matches' (it is also not specific to open matches).
- **Impact:** Vendors see a growing 'pending' number that never matches their calendar.
- **Evidence:**

```
stats.service.ts:435  ...(isFuture && { upcomingBookings: 1 }),
stats.service.ts:467-469  if (isFuture) { stats.upcomingBookings = -1; }   // only in the cancelled path
stats.service.ts:316,326,336,375  @OnEvent(BookingEventType.CREATED) / CANCELLED / PAYMENT_CAPTURED / PAYMENT_REFUNDED   // no COMPLETED handler
Branch.js:202-206  <span>{t("branch.pending_matches")}</span> ... {branch?.upcomingBookings ?? 0}
DB: b4e7f9e5 'Cairo E2E Branch' upcomingBookings=4, actual upcoming (pending/in_progress, endDate>now)=0
```
- **Suggested fix (NOT applied):** Decrement upcomingBookings when a booking reaches COMPLETED/IN_PROGRESS end (BookingEventType completed/ended), or compute it live (count pending bookings with endDate > now).

### 206. [HIGH] Creating a second branch charges the card immediately with no warning on the form

- **Where:** `dashboard/src/pages/AddBranch.js:186`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Only one branch is included in the base plan; every extra branch is a paid add-on. BRANCH_CREATED triggers syncAfterUnitChange -> pricingService.syncTenantSubscription, which updates Stripe quantities and generates a prorated invoice on the vendor's card. AddCourt.js fetches court-availability and shows 'this court adds X, charged now'; AddBranch.js never calls /subscriptions/branch-availability, and the backend branch-availability response carries no price impact at all.
- **How to reproduce:** Active subscription, one branch. Add a second branch: no notice, Stripe invoice appears.
- **Impact:** Vendors are billed for a branch add-on (plus proration) without being told; a lapsed-subscription vendor also only learns they cannot create a branch after filling the whole form.
- **Evidence:**

```
pricing.service.ts:22  INCLUDED_BRANCHES: 1,   pricing.service.ts:168 const branchAddons = Math.max(0, branchCount - PRICING.INCLUDED_BRANCHES);
subscriptions.service.ts:945-948  @OnEvent(BranchEvent.BRANCH_CREATED) async handleBranchCreated(event) { await this.syncAfterUnitChange(event.branch.tenantId); }
subscriptions.service.ts:1049-1050  await this.pricingService.syncTenantSubscription(subscription);
subscriptions.service.ts:347-360  getBranchAvailability ... return { canCreate, currentCount, limit: null, subscriptionStatus }   // no nextBranchChargeCents
AddCourt.js:249  if (courtAvailability?.nextCourtChargeCents > 0) {   // courts warn; AddBranch.js has no availability query (grep)
```
- **Suggested fix (NOT applied):** Return nextBranchChargeCents/chargedNow from getBranchAvailability and show the same pre-charge notice (and canCreate block) in AddBranch.js as AddCourt.js does.

### 207. [MEDIUM] Branch deletion failure (upcoming bookings) is completely silent in the dashboard

- **Where:** `dashboard/src/pages/AddBranch.js:201`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleConfirm closes the modal and calls deleteBranch without a .catch. When the backend refuses with 400 BRANCH_HAS_UPCOMING_BOOKINGS the vendor sees nothing at all (unhandled promise rejection). Even if caught, BRANCH_HAS_UPCOMING_BOOKINGS is not in errorMessages COVERED_CODES so the localized text that exists in en/ar would still be replaced by the generic message. The success toast is hard-coded English.
- **Impact:** Vendor clicks 'Yes, delete', nothing happens, branch still there, no explanation.
- **Evidence:**

```
AddBranch.js:199-206  const handleConfirm = () => { setIsModalVisible(false); deleteBranch(id).then(() => { ... notify("success", "Branch is deleted successfully"); }); };   // no .catch
branches.service.ts:458-460  if (await this.courtsService.countUpcomingBookings(courtIds)) { throw new BadRequestException(BRANCH_HAS_UPCOMING_BOOKINGS); }
errorMessages.js:45-60  // Tenant, branches & courts ... "BRANCH_NOT_FOUND", "BRANCH_CREATION_NOT_ALLOWED", "INVALID_BRANCH_STATUS_TRANSITION", ...   // BRANCH_HAS_UPCOMING_BOOKINGS absent
public/assets/locales/ar.json errors.BRANCH_HAS_UPCOMING_BOOKINGS = 'هذا الفرع لديه حجوزات قادمة. ألغِها قبل حذفه.'
```
- **Suggested fix (NOT applied):** Add .catch(err => notifyError(notify, err, t, ...)), add BRANCH_HAS_UPCOMING_BOOKINGS to COVERED_CODES, translate the success toast.

### 208. [MEDIUM] Deleting a branch leaves tenant court counters stale (Home and ops still count the deleted courts)

- **Where:** `backend/src/modules/courts/courts.service.ts:895`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** BranchesService.delete soft-deletes courts through deleteBranchCourts, a bulk softDelete that emits no COURT_DELETED events. tenant.totalCourts is only decremented by the COURT_DELETED listener, so after deleting a branch the vendor Home 'Total courts' card and the ops Vendors table keep counting the removed courts. Court schedules, assets and BranchStaffer rows are also left dangling.
- **Impact:** Wrong court counts shown to the vendor and to ops after a branch deletion.
- **Evidence:**

```
branches.service.ts:462  await this.courtsService.deleteBranchCourts(id);
courts.service.ts:895-897  async deleteBranchCourts(branchId: string) { await this.courtRepository.softDelete({ branchId }); }
tenants.service.ts:323-325  @OnEvent(CourtEvent.COURT_DELETED) private async handleCourtDeleted({ court }) { await this.incrementCount(court.branch.tenantId, -1, 'totalCourts'); }
dashboard StatCards.js:54-55  label: t("home.stats.totalCourts"), value: tenant?.totalCourts ?? 0,
ops VendorsPage.tsx:99  { title: "Courts", dataIndex: "totalCourts", ...
```
- **Suggested fix (NOT applied):** Decrement totalCourts by the number of courts deleted in BranchesService.delete (or emit COURT_DELETED per court), and clean BranchStaffer rows.

### 209. [MEDIUM] Submit button has no loading state: double-click creates two branches (and two add-on charges)

- **Where:** `dashboard/src/pages/AddBranch.js:373`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The submit button is never disabled while createBranch is in flight and there is no idempotency key or uniqueness on (tenantId, name). A double-click or a slow network retry creates two identical branches; each BRANCH_CREATED event bumps the Stripe add-on quantity.
- **Impact:** Duplicate branches and double proration invoices for the vendor.
- **Evidence:**

```
AddBranch.js:373-380  <Button htmlType="submit" className="btn-submit" style={{ marginRight: "2rem" }} type="primary">   // no loading / disabled
AddBranch.js:186  createBranch(formData).then(() => { refetchBranches(); navigate("/branches"); ...
branches.service.ts:85-112  availability check then branchRepository.save(branchData)   // no uniqueness / idempotency
```
- **Suggested fix (NOT applied):** Track a submitting state and set loading/disabled on the button; optionally reject duplicate names per tenant server-side.

### 210. [MEDIUM] Saving a branch depends on Nominatim reverse geocoding; failures produce an empty address and a raw English 400

- **Where:** `dashboard/src/components/LocationSelector.js:85`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** updateLocation awaits a public Nominatim /reverse call and forwards its display_name as the address; on failure or a place with no display_name the address is ''. The address box is read-only, so the vendor cannot fix it, and the backend requires a non-empty address when coordinates are sent. The Latitude/Longitude InputNumbers call updateLocation on every keystroke (no debounce), which exceeds Nominatim's 1 request/second policy and gets the client throttled/blocked, making the failure likely.
- **Impact:** Vendor cannot save the branch when the free geocoder is slow, throttled or has no address for the pin; sees 'address should not be empty' in English.
- **Evidence:**

```
LocationSelector.js:85-96  const updateLocation = async (lat, lng, name = placeName) => { const addr = await reverseGeocode(lat, lng); ... onChange({ coordinates: { lat, lng }, address: addr, name }); };
LocationSelector.js:111-114  const updateLat = (value) => updateLocation(Number(value), coordinates.lng, "");  // fires per keystroke
LocationSelector.js:163-173  <label>Address</label> <div ...>{address || "No address available"}</div>   // not editable
create-branch.dto.ts:90-93  @ValidateIf((o) => o.coordinates && !o.placeId) @IsNotEmpty() @IsString() address?: string;
```
- **Suggested fix (NOT applied):** Make the address field editable (prefilled from reverse geocode), debounce lat/lng edits, and fall back to the searched place's display_name.

### 211. [MEDIUM] Working-hours form lets invalid schedules through and shows raw English backend validation text

- **Where:** `dashboard/src/components/WorkingHours.js:152`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** No client-side validation: a cleared TimePicker emits startTime/endTime null, and zero enabled days emits an empty availabilities array. The backend rejects both, and getErrorMessage passes readable backend strings through untranslated, so Arabic users get 'availabilities must contain at least 1 elements' / 'startTime must be a string'.
- **Impact:** Vendors get English validation errors in the Arabic UI and no inline hint on which day/time is wrong.
- **Evidence:**

```
WorkingHours.js:152-153  startTime: data.startTime ? data.startTime.format("HH:mm") : null, endTime: data.endTime ? data.endTime.format("HH:mm") : null,
create-update-schedule.dto.ts:23  @ArrayMinSize(1)   create-update-schedule.dto.ts:30-35 @IsString() @IsNotEmpty() @Matches(...) startTime
errorMessages.js:105  return code; // readable backend message, e.g. "phoneNumber must be a valid phone number"
exception-filter.ts:30  code = (Array.isArray(message) ? message[0] : message) ?? exception.message;
```
- **Suggested fix (NOT applied):** Validate enabled days and both times in WorkingHours before submit, and map class-validator messages to localized field errors.

### 212. [MEDIUM] Phone number is optional in the form but required by the create DTO

- **Where:** `dashboard/src/pages/AddBranch.js:295`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The phone field has no required rule (validator passes when empty) while CreateBranchDto.phoneNumber is @IsPhoneNumber() without @IsOptional(). A vendor who leaves it blank fills the whole form, uploads images, and gets 'phoneNumber must be a valid phone number' as a toast in English.
- **Impact:** Confusing late failure with an untranslated message.
- **Evidence:**

```
AddBranch.js:295-303  rules={[{ validator: (_, value) => !value || isValidPhoneNumber(value) ? Promise.resolve() : Promise.reject(...) }]}
create-branch.dto.ts:59-60  @IsPhoneNumber() phoneNumber: string;   // no IsOptional; entity column NOT NULL
```
- **Suggested fix (NOT applied):** Add { required: true } with a translated message to the phone Form.Item (or make the DTO optional and the column nullable).

### 213. [MEDIUM] PATCH /branches/:id is open to every staff role while create/delete are Owner/Admin only

- **Where:** `backend/src/modules/branches/branches.controller.ts:286`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** update() is decorated with isStaff() (any role including User), so a User-role staffer assigned to a branch can close it, hide it from customers, move its location, change phone/hours and images. Create and delete on the same resource are restricted to Owner/Admin.
- **Impact:** A low-privilege staffer can take a branch offline (status closed / isVisible false), stopping revenue.
- **Evidence:**

```
branches.controller.ts:124  @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.ADMIN])  create(
branches.controller.ts:286  @AuthorizedUserType.isStaff()  update(
branches.controller.ts:324  @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.ADMIN])  delete(
```
- **Suggested fix (NOT applied):** Restrict status/isVisible/location/schedule changes to Owner/Admin (or the whole PATCH), keeping only operational fields for User role.

### 214. [MEDIUM] Live Google Maps API key committed in dashboard source and shipped in the bundle although unused

- **Where:** `dashboard/src/pages/AddBranch.js:316`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** AddBranch passes a hard-coded Google API key to LocationSelector, which does not even accept an apiKey prop (the map now uses Leaflet/Nominatim). The key is in git history and every production bundle for no benefit.
- **Impact:** If the key is unrestricted it can be abused against the company's Google billing; at minimum it is a leaked credential.
- **Evidence:**

```
AddBranch.js:316  apiKey="AIzaSyBA82Tqljmxcixjt3dkrSMxYWHCF8Vxt9E"
LocationSelector.js:8-13  export default function LocationSelector({ initialPlaceName = "", initialCoordinates = null, initialAddress = "", onChange })   // no apiKey
```
- **Suggested fix (NOT applied):** Remove the prop, rotate/restrict the key in Google Cloud, purge from history if possible.

### 215. [MEDIUM] Ops console has no way to suspend or unsuspend a branch (endpoints and dashboard banner exist)

- **Where:** `ops/src/api/ops.ts:60`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The API client defines suspendBranch/unsuspendBranch but no ops page calls them; branch_* notifications route to /vendors which has no branch list. The backend endpoints, the vendor-facing 'This branch is suspended' banner and the branch_suspended notifications are therefore unreachable in practice (already noted as open in PRODUCTION-READINESS.md line 402).
- **Impact:** Ops cannot act on a problematic branch without suspending the whole vendor or every court individually.
- **Evidence:**

```
ops/src/api/ops.ts:60-66  export async function suspendBranch(id, reason) { ... `/ops/branches/${id}/suspend` ... }  export async function unsuspendBranch(id) ...   // no other references (grep)
ops.controller.ts:120  @Post('branches/:id/suspend')   ops.controller.ts:132 @Post('branches/:id/unsuspend')
ops/src/components/NotificationsBell.tsx:34  if (kind.startsWith("tenant_") || kind.startsWith("branch_")) return "/vendors";
dashboard Branch.js:116-124  {branch?.suspendedAt && (<Alert ... message={t("branch.suspended_title", ...)} description={branch.suspendedReason} />)}
```
- **Suggested fix (NOT applied):** Add a branches tab on the vendor detail page with suspend/unsuspend actions wired to the existing API functions.

### 216. [MEDIUM] Branch page shows a dead, untranslated filter toolbar (12 months / 30 days / 7 days / 12 hours / + / Select date / Filter)

- **Where:** `dashboard/src/pages/Branch.js:174`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Seven buttons render above the KPI cards with no onClick handlers and English-only labels; the KPI cards are lifetime totals that no filter affects. Vendors click them and nothing happens.
- **Impact:** Unfinished UI exposed to vendors; looks broken in Arabic.
- **Evidence:**

```
Branch.js:17  const filterOptions = ["12 months", "30 days", "7 days", "12 hours"];
Branch.js:174-181  {filterOptions.map((filter) => (<Button key={filter}>{filter}</Button>))} <Button type="default">+</Button> <Button icon={<CalendarOutlined />}>Select date</Button> <Button icon={<FilterOutlined />}>Filter</Button>
```
- **Suggested fix (NOT applied):** Remove the toolbar or implement period filtering against a computed-stats endpoint.

### 217. [MEDIUM] Hard-coded English strings throughout the branch screens break the Arabic dashboard

- **Where:** `dashboard/src/components/LocationSelector.js:123`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Labels, placeholders, validation messages, modal copy and toasts in the branch flow are literal English and never pass through t(), so the RTL Arabic UI mixes languages.
- **Impact:** Arabic-speaking vendors see English fragments in forms, errors and modals.
- **Evidence:**

```
LocationSelector.js:123 <label>Place Name</label>  :129 placeholder="Search place"  :136 <label>Latitude</label>  :145 <label>Longitude</label>  :163 <label>Address</label>  :172 {address || "No address available"}
AddBranch.js:310 label="Location"  :313 message: "Location is required"  :327 message: "Status is required"  :204 notify("success", "Branch is deleted successfully")
Branch.js:159 + Add Staff  :179-180 Select date / Filter  :237 title="Assign Staff to Branch"  :246 Select staff to assign:  :251 placeholder="Choose staff members"  :74/:90/:98 message.warning/success/error English
Branches.js:87  location: branch.location?.name || "N/A"   (locale key branches.no_location exists and is unused)
```
- **Suggested fix (NOT applied):** Route every string through t() and add ar/en keys; use the existing unused keys (branchForm.place_name, branches.no_location).

### 218. [MEDIUM] Branches list shows revenue with a '$' sign while everything else is SAR

- **Where:** `dashboard/src/pages/Branches.js:89`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The Total Revenue column is built as '$ ' + totalRevenue whereas the branch page, court cards and the rest of the dashboard label amounts SAR (tenant currency). No formatting either (e.g. '$ -150').
- **Impact:** Wrong currency shown to vendors in the branches table.
- **Evidence:**

```
Branches.js:89  totalRevenue: "$ " + branch.totalRevenue,
Branch.js:189  {branch?.totalRevenue?.toLocaleString() ?? 0} <span>SAR</span>
CourtCard.js:76  {court?.totalRevenue?.toLocaleString() ?? 0} <span>SAR</span>
```
- **Suggested fix (NOT applied):** Format with the tenant currency (same helper as Branch.js) and toLocaleString.

### 219. [MEDIUM] Branch page lists only the first 10 courts with no pagination

- **Where:** `dashboard/src/pages/Branch.js:47`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** getCourts({ branchId }) is called without pageSize; the backend default is 10 and the page renders courts.items only, with no pager. A branch with more than 10 courts silently hides the rest.
- **Impact:** Vendors with large venues cannot reach some courts from the branch page.
- **Evidence:**

```
Branch.js:47-51  const { data: courts } = useQuery({ queryKey: ["branch-courts", id], queryFn: () => getCourts({ branchId: id }), keepPreviousData: false });
Branch.js:225  {courts?.items?.map((court) => (<CourtCard .../>))}
common/pagination.input.dto.ts:28  pageSize?: number = 10;
```
- **Suggested fix (NOT applied):** Pass pageSize: 100 or render a pager from courts.pagination.

### 220. [MEDIUM] Customer GET /branches/:id ignores status and isVisible, unlike the branch list

- **Where:** `backend/src/modules/branches/branches.service.ts:316`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** findOne for customers filters only suspendedAt and tenant.blockedAt, whereas find() also requires isVisible <> false and status = open. A bookmarked closed/hidden branch therefore still opens from the mobile Saved screen (getBranchById with includeCourts=true) and shows an empty court list with no explanation, and its rating/likes remain reachable.
- **Impact:** Inconsistent visibility: hidden branches disappear from search but remain reachable by id with a blank courts tab.
- **Evidence:**

```
branches.service.ts:316-319  } else if (user?.type === UserType.Customer) { where.suspendedAt = IsNull(); where.tenant = { blockedAt: IsNull() }; }
branches.service.ts:200-206  andWhere('branch.suspendedAt IS NULL') ... andWhere('branch.isVisible IS DISTINCT FROM false'); andWhere('branch.status = :openStatus'
courtplusmobile Saved.component.tsx:50-51  navigate("CourtStack", { screen: item.type === "court" ? "CourtDetails" : "BranchDetails", ...
courtplusmobile court.service.ts:58-70  getBranchById ... `${endPoints.branches}/${id}` params { includeCourts }
```
- **Suggested fix (NOT applied):** Apply the same isVisible/status conditions in findOne for customers (return 404 or a 'closed' flag the app can render).

### 221. [MEDIUM] Overlap validation misses cross-midnight windows that spill into the next day's window

- **Where:** `backend/src/modules/schedules/schedules.service.ts:142`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** isValidAvailabilities only compares two windows when they share a day number. Mon 22:00-02:00 and Tue 00:00-03:00 share no day, so they pass, yet both cover Tuesday 00:00-02:00. getSlots then emits the Monday spill-over slots (labelled 00:00, 01:00 with no date) under Monday and the Tuesday window's own 00:00-02:00 slots under Tuesday, and isTimeInScheduleAvailabilities accepts both, so the calendar shows duplicated/misplaced early-morning slots.
- **Impact:** Vendors can save contradictory hours; customers see overlapping/duplicate slots around midnight.
- **Evidence:**

```
schedules.service.ts:142-146  const overlappingDays = groupA.days.filter((day) => groupB.days.includes(day)); if (overlappingDays.length === 0) continue;
schedule.entity.ts:183-188  ...this.availabilities.filter((avail) => avail.days.includes(previousDay) && avail.endTime <= avail.startTime).map((avail) => ({ avail, anchor: slotStart.subtract(1, 'day') })),
schedule.entity.ts:227-236  const availabilitiesForDay = this.availabilities.filter((a) => a.days.includes(dayOfWeek)); for (const availability of availabilitiesForDay) { const timeSlots = availability.getSlots(currentDate, duration);
```
- **Suggested fix (NOT applied):** Normalise windows to absolute minute ranges per weekday (splitting cross-midnight windows into day N and day N+1 parts) before checking overlaps.

### 222. [LOW] Vendor branches-list filters (Place ID / Latitude / Longitude / Radius) do nothing useful

- **Where:** `dashboard/src/pages/Branches.js:160`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The vendor list exposes customer-search parameters. placeId can never match because Nominatim-created locations store placeId = NULL (0 rows in DB); lat without lng is silently ignored by the backend; typing coordinates and a radius to find one's own branches is not a vendor use case.
- **Impact:** Confusing controls that never change results.
- **Evidence:**

```
Branches.js:160-201  <Input placeholder={t("branches.place_id_placeholder")} .../> <Input placeholder={t("branches.latitude_placeholder")} type="number" .../> ... radius
locations.service.ts:131-139  return this.locationRepository.save({ name, address, country, coordinates: {...} });   // no placeId
DB: SELECT count(*) FROM locations WHERE "placeId" IS NOT NULL -> 0
branches.service.ts:214  if (lng && lat) {   // lat alone ignored (live GET /branches?lat=24 -> 200, unfiltered)
```
- **Suggested fix (NOT applied):** Keep only the name search for vendors (or a branch status filter).

### 223. [LOW] Updating a branch that has no schedule row throws a 500

- **Where:** `backend/src/modules/branches/branches.service.ts:431`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** update() dereferences branch.schedule.id without a null check whenever schedule data is sent (the dashboard always sends it). One live branch in the DB has no schedule row; any edit of it crashes instead of creating the schedule.
- **Impact:** Edit form fails with a generic error for such branches.
- **Evidence:**

```
branches.service.ts:430-432  if (scheduleData) { await this.schedulesService.update(branch.schedule.id, scheduleData); }
DB: SELECT b.id,b.name FROM branches b LEFT JOIN schedules s ON s."branchId"=b.id WHERE s.id IS NULL AND b."deletedAt" IS NULL -> b4e7f9e5-... 'Cairo E2E Branch'
```
- **Suggested fix (NOT applied):** If branch.schedule is missing, call schedulesService.create(scheduleData, branch.id, true) (courts.service.ts:800-802 already does this).

### 224. [LOW] Branch cover/logo assignment skips the uploader ownership check

- **Where:** `backend/src/modules/branches/branches.service.ts:115`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** assignAssets is called without uploaderId, so the 'asset uploaded by someone else' guard never runs; any not-yet-attached asset id (another tenant's fresh upload, a customer's pending post image) can be claimed as a branch cover/logo.
- **Impact:** Low-probability IDOR (UUIDs), but content ownership is not enforced.
- **Evidence:**

```
branches.service.ts:115-118  const assets = await this.assetsService.assignAssets(coverAssetId, branch.id, AssetType.BranchCover);   // no uploaderId (same at 127, 411, 419)
assets.service.ts:160-165  if (uploaderId && asset.uploadedBy && asset.uploadedBy !== uploaderId) { ... throw new NotFoundException(ASSET_NOT_FOUND); }
```
- **Suggested fix (NOT applied):** Pass currentUser.id as uploaderId from BranchesService (and CourtsService).

### 225. [LOW] Branch 'description' exists in the API/entity but the dashboard never lets vendors set it

- **Where:** `dashboard/src/pages/AddBranch.js:283`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** CreateBranchDto/Branch expose description and it is returned to the mobile app, but the form has only name, phone, location, status, visibility and hours. The field is dead for real vendors.
- **Impact:** Vendors cannot describe their venue; API contract misleads client developers.
- **Evidence:**

```
create-branch.dto.ts:51-53  @IsOptional() @IsString() description?: string;
branch.entity.ts:46-47  @Column({ nullable: true }) description?: string;
AddBranch.js:283-362  Form.Items: name, phoneNumber, location, status, visibility switch   // no description
```
- **Suggested fix (NOT applied):** Add a translated description textarea or drop the field.

### 226. [LOW] monthStats is computed for every branch on every staff list call but no client reads it

- **Where:** `backend/src/modules/branches/branches.service.ts:283`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** For staff, find() runs getMonthStats per branch (3 queries each, cached per month but invalidated on every booking event); the dashboard never renders monthStats (grep: no usage). Month boundaries also use the server timezone rather than the branch's.
- **Impact:** Wasted queries on every list load; the one accurate number the API produces is ignored by the UI.
- **Evidence:**

```
branches.service.ts:283-290  if (user.type === UserType.Staff || options.include.stats) { mappedBranches = await Promise.all(mappedBranches.map(async (branch) => { branch.monthStats = await this.getMonthStats(branch.id); ...
branches.service.ts:525,534-535  const now = dayjs(); ... const startOfMonth = now.startOf('month').toDate();   // server TZ
live GET /branches -> monthStats: {'totalRevenue': 1000, 'upcomingBookings': 0, 'totalBookings': 7}   (dashboard shows totalRevenue 0 from the counter instead)
```
- **Suggested fix (NOT applied):** Either show monthStats on the branch page (and compute in branch TZ) or drop it from the list response.

### 227. [LOW] Location dedup within 10 m silently discards small pin corrections on edit

- **Where:** `backend/src/modules/branches/locations.service.ts:109`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** addLocationWithCoordinates returns any existing location within 10 m that has the same name (the branch name). When a vendor nudges the marker a few metres to fix the entrance, the same location row is reused and the new coordinates are dropped without feedback.
- **Impact:** Map pin does not move after saving.
- **Evidence:**

```
locations.service.ts:109-124  .where(`ST_DWithin(location.coordinates::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 10)`).andWhere('location.name = :name', { name }).getOne(); if (existingLocation) { return existingLocation; }
branches.service.ts:394-396  location = await this.locationsService.addLocationWithCoordinates({ coordinates, name: data.name || branch.name, address, ...
```
- **Suggested fix (NOT applied):** On update, update the branch's own location row instead of dedup-searching.

### 228. [LOW] 'Show to users' switch and non-open statuses interact invisibly

- **Where:** `dashboard/src/pages/AddBranch.js:346`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Customers only see a branch when isVisible is not false AND status is open, but the form presents status and visibility as independent controls; the tooltip says the switch 'will make the branch visible to end users'. A vendor with status 'occupied' and the switch on believes the branch is listed. No warning when closing a branch that has upcoming bookings.
- **Impact:** Vendors misunderstand why their branch is missing from the app.
- **Evidence:**

```
branches.service.ts:202-206  andWhere('branch.isVisible IS DISTINCT FROM false'); andWhere('branch.status = :openStatus', { openStatus: BranchStatus.OPEN });
AddBranch.js:331-344  Radio.Buttons open / closed / occupied / under_maintenance   AddBranch.js:358 <Tooltip title={t("branchForm.visibility_tooltip")}>
en.json branchForm.visibility_tooltip = "This will make the branch visible to end users"
```
- **Suggested fix (NOT applied):** Explain in the tooltip/help text that only 'Open' branches are listed, and confirm before switching an open branch with upcoming bookings to another status.

### 229. [LOW] 'Add Staff' modal offers the Owner and yourself, then surfaces raw error text

- **Where:** `dashboard/src/pages/Branch.js:258`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The assign modal lists every staffer including the Owner and the current user; the backend rejects both (CANNOT_ASSIGN_OWNER_TO_BRANCH / CANNOT_ASSIGN_SELF) and the modal shows err.response.data.message (absent, the filter puts the code in `code`) falling back to axios' 'Request failed with status code 400'. Already-assigned staff are not indicated.
- **Impact:** Confusing failures in the branch page's staff assignment.
- **Evidence:**

```
Branch.js:258-262  {staffData?.items?.map((staff) => (<Select.Option key={staff.id} value={staff.id}>{staff.name} – {staff.email}</Select.Option>))}
Branch.js:95-99  const errMsg = err?.response?.data?.message || err?.message || "Failed to assign staff"; message.error(errMsg);
staff.service.ts:799-814  if (staffIds.includes(currentUser.id)) throw CANNOT_ASSIGN_SELF ... if (owners.length > 0) throw CANNOT_ASSIGN_OWNER_TO_BRANCH
```
- **Suggested fix (NOT applied):** Filter Owner/self out of the options, mark assigned staff, and use notifyError for localized messages.

### 230. [LOW] Three different default countries in one form (Dubai map, Egypt phone, Riyadh timezone)

- **Where:** `dashboard/src/components/LocationSelector.js:16`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The map opens on Dubai, the phone input defaults to Egypt, and the timezone defaults to Asia/Riyadh.
- **Impact:** Extra clicks and a sense of an unpolished product for the target market.
- **Evidence:**

```
LocationSelector.js:16  if (!coords) return { lat: 25.276987, lng: 55.296249 };   // Dubai
AddBranch.js:306  <PhoneInput defaultCountry="EG" />
AddBranch.js:279  initialValues={{ zone: "Asia/Riyadh" }}
```
- **Suggested fix (NOT applied):** Drive all three from one market/tenant-country setting.

### 231. [LOW] WorkingHours collapses multiple windows on the same day and overwrites them on save

- **Where:** `dashboard/src/components/WorkingHours.js:71`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The initial-schedule loader keeps one window per weekday (last wins). A schedule with two windows on Monday (valid per backend) is shown as a single window and, on submit, silently replaced by that single window.
- **Impact:** Split-shift schedules set via API are destroyed by a dashboard edit.
- **Evidence:**

```
WorkingHours.js:71-82  initialSchedule.availabilities.forEach(({ days, startTime, endTime }) => { days.forEach((dayNumber) => { ... updatedDays[dayName] = { enabled: true, startTime: dayjs(startTime, "HH:mm"), endTime: dayjs(endTime, "HH:mm") }; }); });
```
- **Suggested fix (NOT applied):** Support multiple windows per day in the editor or warn before overwriting.

### 232. [LOW] Edit sends the stored placeId, which would take precedence over new coordinates

- **Where:** `backend/src/modules/branches/branches.service.ts:391`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** On edit the dashboard sends placeId (from the existing location) together with the new coordinates; the backend prefers placeId and returns the existing location, so a location change would be dropped. No current location has a placeId (Nominatim path stores none), so this only affects legacy/Google-created rows.
- **Impact:** Location edits ignored for any branch whose location carries a placeId.
- **Evidence:**

```
AddBranch.js:93  setPlaceId(branch.location?.placeId || "");   AddBranch.js:152 placeId: placeId,
branches.service.ts:391-394  if (placeId) { location = await this.locationsService.addLocation(placeId); } else if (coordinates && address) {
locations.service.ts:80-83  const location = await this.getByPlaceId(placeId); if (location) { return location; }
```
- **Suggested fix (NOT applied):** Do not send placeId on edit unless the user picked a new place; or let explicit coordinates win server-side.

### 233. [LOW] Availability days accept an empty array, duplicates and non-integers

- **Where:** `backend/src/modules/schedules/dto/create-update-schedule.dto.ts:44`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** @IsNotEmpty() on an array passes [] (as the sibling comment on line 21-22 notes), and @IsNumber allows 1.5 and repeated days, producing dead or odd availability rows.
- **Impact:** Malformed schedules via API; no effect through the dashboard.
- **Evidence:**

```
create-update-schedule.dto.ts:44-49  @IsArray() @IsNotEmpty() @IsNumber(undefined, { each: true }) @Min(0, { each: true }) @Max(6, { each: true }) days: number[];
create-update-schedule.dto.ts:21-22  // IsNotEmpty([]) is true for an empty array
```
- **Suggested fix (NOT applied):** Use @ArrayMinSize(1), @ArrayUnique() and @IsInt({ each: true }).

---

## 9. Courts: creation, media, pricing, status and approval

29 issues — 0 critical, 4 high, 14 medium, 11 low.

### 234. [HIGH] Any staff role (including 'User') can create, edit, delete and resubmit courts — no role restriction unlike branches

- **Where:** `backend/src/modules/courts/courts.controller.ts:74`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Court mutations are guarded only by @AuthorizedUserType.isStaff() with no roles, and UserTypeGuard treats a missing roles array as 'any role'. Branch create/delete restrict to OWNER/ADMIN. A StaffRole.USER member can therefore create courts (which triggers a prorated Stripe add-on charge on the tenant's card), change prices, unassign all media, and delete courts.
- **How to reproduce:** Log in to the dashboard as a staff member with role 'User', open Courts > Add court, submit — court is created and (with an active subscription) the add-on is invoiced.
- **Impact:** A low-privilege staff account can incur subscription charges for the tenant and destroy or misprice the vendor's inventory; Owner/Admin have no way to prevent it.
- **Evidence:**

```
courts.controller.ts:74  @AuthorizedUserType.isStaff()   (create)
courts.controller.ts:210 @AuthorizedUserType.isStaff()   (update)
courts.controller.ts:248 @AuthorizedUserType.isStaff()   (delete)
courts.controller.ts:282 @AuthorizedUserType.isStaff()   (resubmit)
user-type.guard.ts:44  (metadata.roles ? metadata.roles.includes(user.role) : true)
branches.controller.ts:124 @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.ADMIN])  (branch create)
staff/entities/enum.ts: OWNER='Owner', ADMIN='Admin', USER='User'
```
- **Suggested fix (NOT applied):** Apply @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.ADMIN]) to POST /courts, PATCH /courts/:id, DELETE /courts/:id and POST /courts/:id/resubmit (mirror branches.controller). Hide the Add/Edit/Delete controls in the dashboard for the User role.

### 235. [HIGH] Working hours that cross midnight: post-midnight slots are returned under the previous date, so the app books the wrong night and shows them as free even when taken

- **Where:** `backend/src/modules/schedules/entities/schedule.entity.ts:232`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Schedule.getSlots iterates one calendar day and calls Availability.getSlots, which extends the window past midnight (endTime <= startTime). The generated slots are pushed with only 'HH:mm' labels, so for date=Saturday with a 16:00-02:00 window the response contains startTime 00:00, 00:30, 01:00, 01:30 — these belong to Sunday. The mobile app builds startAt as `${selectedDate} ${slot.startTime}` → 'Saturday 00:00', i.e. Friday night. Additionally getAvailability loads bookings only between startOf(day) and endOf(day) of the requested date, so bookings on Sunday 00:00-02:00 are never seen and those slots are always reported available. Reproduced with the real entity: date=2026-10-03 (Sat), 16:00-02:00 → 20 slots, last {startTime:'01:30',endTime:'02:00'}, post-midnight labelled slots: 00:00,00:30,01:00,01:30.
- **How to reproduce:** Set a court's Saturday hours to 16:00-02:00, GET /courts/:id/availability?date=<a Saturday> → slots 00:00-01:30 listed under Saturday; in the app select 00:30 and confirm.
- **Impact:** Customers at venues with late hours (the team's own stated Riyadh padel case) pick '00:30' on Saturday's list and are charged for Saturday 00:30 (the previous night) or get SLOT_OUTSIDE_SCHEDULE_HOURS/SLOT_IN_PAST; double-booking risk is masked because next-day bookings are not loaded.
- **Evidence:**

```
availability.entity.ts:43-45  if (slotEnd.isSameOrBefore(slotStart)) { slotEnd = slotEnd.add(1, 'day'); }
schedule.entity.ts:246-250  slots.push({ startTime: start.format('HH:mm'), endTime: end.format('HH:mm'), available });
courts.service.ts:1088-1101  startOfDay = dayjs.tz(date, tz).startOf('day') ... findBookingsInRange(id, startOfDay, endOfDay)
courtplusmobile BookingSummary.logic.ts:52-55  startAt: `${formatDate(timeSummary?.date ...,'yyyy-MM-dd')} ${sortedSlots[0]?.startTime ?? ''}`
schedule.spec.ts:6  'Riyadh padel hours: 16:00-02:00' (the team's own expected configuration)
```
- **Suggested fix (NOT applied):** Return a full ISO start/end (or a date field) per slot and make the client send that; in getAvailability widen the bookings/reservations range to [startOfDay, endOfDay + max window overrun] and, when building slots, attribute post-midnight slots to the next date (or exclude them from the earlier date and include them in the next date's list via the 'previous day' logic already in isTimeInScheduleAvailabilities).

### 236. [HIGH] Customers can open and book a court whose branch is hidden (isVisible=false) or not OPEN — findOne lacks the visibility filters that findAll applies

- **Where:** `backend/src/modules/courts/courts.service.ts:587`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** findAll (list/discovery) hides courts of hidden or closed/under-maintenance branches, but findOne (court detail, month availability, and the booking path in BookingsService.initiateBooking/createBooking) only checks court.status, branch.suspendedAt and tenant.blockedAt. Any customer holding the court id (booking history 'book again', shared link, push notification deep link, bookmark cache) can view, get slots for, and pay for a court in a branch the vendor switched off or closed.
- **How to reproduce:** As vendor set branch status to closed (or 'show to users' off). As a customer, GET /courts/<courtId> → 200; POST booking for it → succeeds.
- **Impact:** Vendors who close a branch for maintenance or hide it still receive paid bookings; customers show up at a closed venue and need refunds.
- **Evidence:**

```
courts.service.ts:262-272 (findAll): andWhere('branch.isVisible IS DISTINCT FROM false'); andWhere('branch.status = :openStatus', { openStatus: BranchStatus.OPEN })
courts.service.ts:587-596 (findOne): only court.status = :visibleStatus, branch.suspendedAt IS NULL, tenant.blockedAt IS NULL
bookings.service.ts:134-141  const court = await this.courtsService.findOne(courtId, { schedule: true, branch: true }, sessionUser);
courts.controller.ts:335  const court = await this.courtsService.findOne(id, { schedule: true }, user);
```
- **Suggested fix (NOT applied):** Add the same two predicates to findOne's customer branch (branch.isVisible IS DISTINCT FROM false AND branch.status = OPEN) so detail, availability and booking share one visibility rule.

### 237. [HIGH] Customer-facing court responses expose vendor revenue and internal moderation data (totalRevenue, upcomingBookings, rejectionReason, reviewedByStaffId, branch.tenantId)

- **Where:** `backend/src/modules/courts/courts.service.ts:223`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Both findAll and findOne select every court column and return the raw entity to customers. Verified with a customer token: GET /courts and GET /courts/:id return totalRevenue, totalBookings, totalOpenBookings, upcomingBookings, minutesBooked, rejectionReason, submittedAt, reviewedAt, reviewedByStaffId, deletedAt and branch.tenantId. There is no ClassSerializerInterceptor or @Exclude on the entity.
- **How to reproduce:** Customer login, GET /courts?pageSize=1 → items[0].totalRevenue / rejectionReason / reviewedByStaffId are present.
- **Impact:** Any app user can scrape every vendor's per-court revenue, booking volume and ops rejection reasons; competitors and journalists can rank venues by income; internal staff UUIDs are disclosed.
- **Evidence:**

```
courts.service.ts:223-236  .select(['court', 'location.id', ... 'tenantPreferences.currency'])   // 'court' = all columns
courts.service.ts:512-515  createQueryBuilder('court').where('court.id = :id') ... (no column restriction)
Live customer response keys: ...totalBookings,totalOpenBookings,totalRevenue,upcomingBookings,minutesBooked,postsCount,rejectionReason,submittedAt,reviewedAt,reviewedByStaffId,deletedAt,branch(tenantId)...
grep ClassSerializerInterceptor|@Exclude in main.ts / court.entity.ts → none
```
- **Suggested fix (NOT applied):** Whitelist customer-visible court columns in findAll/findOne (or map to a CustomerCourtDto) and strip business/moderation fields unless user.type === Staff; drop branch.tenantId from customer payloads.

### 238. [MEDIUM] Orphaned upload cleanup never deletes anything: `used: Not(true)` excludes NULL rows, and uploads/unassigns set used to NULL

- **Where:** `backend/src/modules/assets/assets.service.ts:217`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** generateUploadUrl inserts the asset without `used` (NULL) and unassignUpdate sets `used: null`. cleanUp filters `used: Not(true)`, which TypeORM renders as `"used" != true` (operator 'notEqual'); in Postgres NULL != true is NULL, so no orphan row ever matches. The 2-hourly cron is therefore a no-op. Live DB: 29 assets with used IS NULL, all older than 2 h, 0 with used=false. Combined with POST /assets/signed-url being open to any authenticated user with no throttle and a 100 MB ceiling for video types, S3 storage and asset rows grow without bound.
- **How to reproduce:** Upload a photo in Add court and press Cancel; wait > 2 h past the next cron run; row and S3 object still exist.
- **Impact:** Every abandoned upload (cancelled form, replaced photo, failed submit) is stored forever; storage cost and asset table grow with each vendor edit; abuse by any customer account is unbounded.
- **Evidence:**

```
assets.service.ts:105-110  assetRepository.save({ id, key, bucket, uploadedBy: user.id })   // used not set → NULL
assets.service.ts:22-26   unassignUpdate = { used: null, resourceId: null, type: null }
assets.service.ts:218-222 where: { used: Not(true), updatedAt: LessThan(...) }
typeorm QueryBuilder.js:1037-1040  operator: 'notEqual' → `"used" != $1`
SQL: SELECT count(*) FILTER (WHERE used IS NULL) ... → used_null=29, used_false=0, stale_null=29
assets.controller.ts:17-23 @Post('signed-url') — no @Throttle
```
- **Suggested fix (NOT applied):** Use `[{ used: IsNull() }, { used: false }]` (or `Raw(alias => alias + ' IS DISTINCT FROM true')`) in cleanUp, set used=false on generateUploadUrl, and add a per-user throttle on signed-url.

### 239. [MEDIUM] GET /courts crashes (500) when `sport` is sent more than once — Transform calls value.split on an array

- **Where:** `backend/src/modules/courts/dto/list-courts.dto.ts:41`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The sport filter's @Transform assumes a string; a repeated query param (`?sport=tennis&sport=football`, or `sport[]=`) arrives as an array and `.split` throws inside class-transformer, producing an unhandled 500 instead of a 400. Confirmed live with both vendor and customer tokens.
- **How to reproduce:** curl -H 'Authorization: Bearer <any token>' 'http://localhost:3000/courts?sport=tennis&sport=football'
- **Impact:** Any client (or a mis-serialised multi-select filter in the app) turns the main discovery endpoint into a 500; error logs fill with stack traces.
- **Evidence:**

```
list-courts.dto.ts:39-41
  @IsEnum(Sport, { each: true })
  @Transform(({ value }) => value.split(','))
Live: GET /courts?sport=tennis&sport=football → {"statusCode":500,"code":"INTERNAL_SERVER_ERROR"} (vendor and customer)
```
- **Suggested fix (NOT applied):** @Transform(({ value }) => Array.isArray(value) ? value.flatMap(v => String(v).split(',')) : String(value).split(','))

### 240. [MEDIUM] Add/Edit court form can be submitted repeatedly while the request is in flight — duplicate courts and duplicate add-on charges

- **Where:** `dashboard/src/pages/AddCourt.js:745`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The submit button has no loading/disabled state and handleSubmit calls createCourtMutate directly; useMutation's isPending is never read. A double click (or a slow network) creates two identical courts; when the tenant has an active subscription each one runs handleCourtCreated → syncTenantSubscription → prorated add-on invoice. The backend has no idempotency key or duplicate-name guard.
- **How to reproduce:** Fill the Add court form and double-click Submit (or click again while the spinner is absent); two courts appear in the list.
- **Impact:** Vendor is billed for an extra court add-on and must delete the duplicate; ops queue receives duplicates.
- **Evidence:**

```
AddCourt.js:745  <Button type="primary" htmlType="submit">{t("common.submit")}</Button>
AddCourt.js:152  const { mutate: createCourtMutate } = useMutation({ mutationFn: createCourt, ...   // isPending unused
AddCourt.js:254  createCourtMutate(finalData);
subscriptions.service.ts:963-983  @OnEvent(CourtEvent.COURT_CREATED) ... syncTenantSubscription(subscription)
```
- **Suggested fix (NOT applied):** Read isPending from both mutations and set `loading`/`disabled` on the submit button; also disable the confirm modal's OK while pending.

### 241. [MEDIUM] Delete from the edit page swallows errors: a court with upcoming bookings 'deletes' silently and nothing happens

- **Where:** `dashboard/src/pages/AddCourt.js:373`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleConfirm closes the modal and calls deleteCourt(id).then(...) with no catch. The backend intentionally rejects deletion with COURT_HAS_UPCOMING_BOOKINGS (400); the vendor sees the modal close, no toast, stays on the page, and gets an unhandled promise rejection in the console. The card-level delete in CourtCard handles the error correctly, so behaviour differs between the two entry points.
- **How to reproduce:** Open a court with a future booking → Edit → Delete → confirm: modal closes, no message, court remains.
- **Impact:** Vendor believes the delete failed for an unknown reason, retries, or assumes the court is gone.
- **Evidence:**

```
AddCourt.js:371-378
  const handleConfirm = () => {
    setIsModalVisible(false);
    deleteCourt(id).then(() => { ... notify("success", "Court is deleted successfully"); });
  };
courts.service.ts:883-885  if (await this.countUpcomingBookings([id])) { throw new BadRequestException(COURT_HAS_UPCOMING_BOOKINGS); }
CourtCard.js:33-35  onError: (err) => { notifyError(notify, err, t, "courtCard.delete_failed"); }
```
- **Suggested fix (NOT applied):** Use the same useMutation + notifyError pattern as CourtCard (errors.COURT_HAS_UPCOMING_BOOKINGS already exists in both locales).

### 242. [MEDIUM] After creating a court the dashboard always says 'pending payment — complete payment in Billing' and redirects to Billing, even when the court is free/included or auto-charged

- **Where:** `dashboard/src/pages/AddCourt.js:157`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** CourtsService.create saves status=PENDING_PAYMENT and returns findOne() before the transaction commits; the subscriptions handler that flips an included court to PENDING_APPROVAL (or auto-invoices the add-on off-session) runs only after commit. The HTTP response therefore always carries pending_payment, and the form treats that as 'the vendor must go pay'. For a subscribed tenant within included units nothing is owed and the court is already in the ops queue; for a paid add-on the charge is automatic (the confirm modal just said so), yet the toast tells them to complete payment manually.
- **How to reproduce:** As a subscribed vendor with a free included court slot, add a court → toast says pending payment and you are sent to /billing; refresh Courts → status is already Pending Approval.
- **Impact:** Vendors are told to pay when nothing is due, land on Billing confused, and may open support tickets; contradicts the add-on confirm copy ('charged to your card now').
- **Evidence:**

```
courts.service.ts:110-115  status: CourtStatus.PENDING_PAYMENT ... courts.service.ts:144 return this.findOne(court.id, ...)
courts.service.ts:137-142  runOnTransactionCommit(() => emit(COURT_CREATED))
subscriptions.service.ts:1033-1037  // Court fits within the included units ... markCourtsPendingApproval([court.id])
AddCourt.js:157-160  if (created?.status === "pending_payment") { notify("success", t("billing.court_pending_payment")); navigate("/billing"); return; }
en.json billing.court_pending_payment: "Court created. It's pending payment — complete payment in Billing to publish it."
```
- **Suggested fix (NOT applied):** Return the intended next state from the API (compute the breakdown before responding, or return a `requiresPayment` flag), and branch the toast/navigation on that; keep the Billing redirect only when no subscription exists.

### 243. [MEDIUM] Suspending a court (ops) leaves paid upcoming bookings in place and customers are never informed

- **Where:** `backend/src/modules/courts/courts.service.ts:967`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** suspend() only flips status and notifies the tenant's staff. No listener in bookings or notifications reacts to COURT_SUSPENDED, so existing PENDING bookings stay valid, the court still appears in customers' upcoming activity, and no cancellation/refund or customer notification is triggered. The customer-side cancel is also blocked inside 12 h of start.
- **How to reproduce:** Customer books tomorrow; ops suspends the court; customer's booking remains 'upcoming' with no notification.
- **Impact:** Customers hold paid bookings for a court ops removed for a reason (safety, fraud, misrepresentation); they either play on a suspended court or discover it on arrival.
- **Evidence:**

```
courts.service.ts:967-981  async suspend(...) { ... update(id, { status: CourtStatus.SUSPENDED, rejectionReason: reason, ... }) }
ops.service.ts:146-172  suspendCourt → notificationsService.notifyStaff({ tenantId }, { type: COURT_SUSPENDED ... })   // staff only
grep 'COURT_SUSPENDED|CourtStatus.SUSPENDED' backend/src/modules/bookings → no handler (only a comment at bookings.service.ts:265)
```
- **Suggested fix (NOT applied):** On suspend (and branch/tenant suspension), list live bookings on the court and either cancel+refund them with a customer notification or surface them to ops for a decision before confirming the suspension.

### 244. [MEDIUM] Ops cannot suspend a court the vendor has toggled to 'unavailable' — backend and ops console only allow suspend from 'available'

- **Where:** `backend/src/modules/courts/courts.service.ts:973`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** suspend() asserts status === AVAILABLE and the ops console renders the Suspend button only for available courts. A vendor can dodge or delay a suspension by switching the court off, then back on later; ops has no path to lock a misbehaving court that is currently 'unavailable'.
- **How to reproduce:** Vendor toggles a court to unavailable; ops POST /ops/courts/:id/suspend → 400.
- **Impact:** Moderation can be evaded; ops receives INVALID_COURT_STATUS_TRANSITION (400) with no explanation in the console.
- **Evidence:**

```
courts.service.ts:973  this.assertCourtStatus(court, [CourtStatus.AVAILABLE]);
courts.service.ts:970-972  // Only a published court is suspended...
ops/src/pages/CourtApprovalsPage.tsx:255-258  {selected.status === "available" && ( <Button danger onClick={() => setReasonAction("suspend")}>Suspend</Button> )}
```
- **Suggested fix (NOT applied):** Allow suspend from [AVAILABLE, UNAVAILABLE] and remember the pre-suspension state (or always return to UNAVAILABLE on unsuspend and let the vendor re-enable).

### 245. [MEDIUM] Edits to an approved court (photos, video, name, price, location, sport) go live immediately with no re-review

- **Where:** `backend/src/modules/courts/courts.service.ts:755`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The product requires ops approval for courts, but update() on an AVAILABLE court writes every field directly and keeps status available. A vendor can pass review with accurate photos and then replace them, rename the court, or change the sport with zero moderation (only the Rekognition nudity check on images applies). Resubmission is only wired for changes_requested.
- **How to reproduce:** Get a court approved, then edit its photos and name — changes are visible to customers instantly.
- **Impact:** Approval is a one-time gate; listings can drift to misleading content after approval, undermining the moderation process ops relies on.
- **Evidence:**

```
courts.service.ts:755-765  if (court.status !== AVAILABLE && court.status !== UNAVAILABLE) { delete updateData.status; } else if (...) { throw ... }
courts.service.ts:785-790  if (images?.length) { await this.assetsService.assignAssets(images, court.id, AssetType.CourtImage); }
courts.service.ts:805-807  if (Object.keys(updateData).length > 0) { await this.courtRepository.update(id, updateData); }
AddCourt.js:177-179  // Courts with requested changes go back to the ops queue only AFTER a successful edit
```
- **Suggested fix (NOT applied):** Define which fields are 'moderated' (media, name, sport, location); on change to an AVAILABLE court either move it to PENDING_APPROVAL (keeping it bookable until reviewed) or record a pending revision for ops.

### 246. [MEDIUM] Dashboard court cards show the second photo as the cover: findAll strips the first asset from `assets` and the dashboard reads assets[0]

- **Where:** `backend/src/modules/courts/courts.service.ts:440`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** mapCourts sets mainAsset to the first image and then removes it from `assets` (assets.slice(1)) when there are 2+ images. Courts.js ignores mainAsset and uses the first remaining asset as the card image, i.e. the vendor's second photo — contradicting the 'Cover image' badge in the form. With exactly one photo the behaviour flips (assets is not sliced), so the card image changes meaning depending on count.
- **How to reproduce:** Upload two photos, mark the first as cover (index 0), save → Courts list card shows photo #2.
- **Impact:** Vendors see a different cover than the one they chose; the list looks inconsistent with the mobile app (which uses mainAsset).
- **Evidence:**

```
courts.service.ts:437-440  const mainAsset = assets.length ? assets.find(a => a.type === AssetType.CourtImage) : null; assets = assets.length > 1 ? assets.slice(1) : assets;
Courts.js:77-80  const imageAssets = assets.filter((asset) => asset.type === "court_image"); if (imageAssets.length > 0) { // The first image is the vendor's cover... return imageAssets[0]?.url || FALLBACK_IMAGE; }
AddCourt.js:673-677  {index === 0 && ( <span className="cover-badge">{t("courtForm.cover_image")}</span> )}
```
- **Suggested fix (NOT applied):** Use court.mainAsset in Courts.js (fallback to assets[0]); or stop mutating `assets` in mapCourts and let clients pick.

### 247. [MEDIUM] Hard-coded English toasts, placeholders and labels in the court form and place picker — Arabic vendors see mixed-language UI

- **Where:** `dashboard/src/pages/AddCourt.js:163`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Several user-visible strings bypass t(): success toasts for create/update/delete, 'Image/Video uploaded successfully!', 'Image removed.', 'Video removed.', the sport and size select placeholders ('Select the court format' — also wrong for the size field), the video remove control rendered as a bare 'X', and the place autocomplete's 'Search place' / 'Unknown' / 'No address available'. The details tab also prints the raw sport enum ('tennis') instead of the translated label.
- **How to reproduce:** Switch dashboard to Arabic, add a court and upload a photo.
- **Impact:** Arabic dashboard users get English feedback at the most important moments (save/delete/upload) and an untranslated video-remove control.
- **Evidence:**

```
AddCourt.js:163  notify("success", "Court created successfully.");
AddCourt.js:191  notify("success", "Court updated successfully.");
AddCourt.js:334-337  notify("success", `${isVideo ? "Video" : "Image"} uploaded successfully!`);
AddCourt.js:363/367/376  "Video removed." / "Image removed." / "Court is deleted successfully"
AddCourt.js:485,505  <Select placeholder="Select the court format">
AddCourt.js:725-730  <div className="remove-icon-video " onClick=...>X</div>
GooglePlaceses.js:58-59,78  "Unknown" / "No address available" / placeholder="Search place"
Court.js:62  <strong>{court?.sport || t("court.not_specified")}</strong>
```
- **Suggested fix (NOT applied):** Move every string to en/ar.json (courtForm.*), reuse courtForm.<sport> for the details tab, and replace the 'X' with an icon button with aria-label.

### 248. [MEDIUM] Submitting a court with no working days returns the raw English validator message; no client-side check

- **Where:** `backend/src/modules/schedules/dto/create-update-schedule.dto.ts:23`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The DTO requires at least one availability (ArrayMinSize(1)). The dashboard never checks that a day is enabled, so a vendor who leaves all switches off gets a 400 whose code is the class-validator sentence 'schedule.availabilities must contain at least 1 elements'; getErrorMessage passes any non-SNAKE_CASE code through verbatim, so this English text is shown in the Arabic UI with no hint about which section to fix.
- **How to reproduce:** Add court, fill everything, leave all days disabled, submit.
- **Impact:** Confusing, untranslated error in a core onboarding flow; vendor does not know the schedule section is the problem.
- **Evidence:**

```
create-update-schedule.dto.ts:20-26  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) availabilities: AvailabilityDto[];
AddCourt.js:208-237  handleSubmit builds schedule.availabilities from state with no length check
exception-filter.ts:30  code = (Array.isArray(message) ? message[0] : message) ?? exception.message;
errorMessages.js:101-106  if (CODE_PATTERN.test(code)) {...} return code; // readable backend message
```
- **Suggested fix (NOT applied):** Validate in handleSubmit (availabilities.length === 0 → notify t('courtForm.hours_required') and scroll to WorkingHours); optionally map the validator message to a code.

### 249. [MEDIUM] Court price and dimensions have no bounds and hourlyRate is a float column — 0/negative/huge prices are accepted by the API

- **Where:** `backend/src/modules/courts/dto/create-court.dto.ts:129`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** hourlyRate, length and width are only @IsNumber; nothing enforces > 0 or a maximum, and `size` has no type validator at all (any JSON value is persisted). The dashboard's InputNumber min=1 is the only guard, so any API client (or a staff account bypassing the form) can set hourlyRate 0 or negative, producing 0/negative booking totals that Stripe rejects at payment time. hourlyRate is also stored as double precision, unlike every other money column (numeric(14,2)), so booking totals are computed from binary floats (court.hourlyRate * duration/60) before being rounded by the numeric column and by Math.round(major*100) for Stripe.
- **How to reproduce:** PATCH /courts/:id {"hourlyRate": 0} → 200; book 60 min → amount 0.
- **Impact:** Free or negative-priced bookings, payment-intent creation failures, and half-cent discrepancies between displayed and charged totals.
- **Evidence:**

```
create-court.dto.ts:106-114  @IsNumber() @IsNotEmpty() length / width   (no @Min)
create-court.dto.ts:129-132  @IsNumber() @IsNotEmpty() hourlyRate: number;   (no @Min/@Max)
create-court.dto.ts:125-127  @IsOptional() size?: string;   (no @IsString)
court.entity.ts:161-162  @Column('float') hourlyRate: number;
SQL information_schema: hourlyRate → double precision, totalRevenue → numeric
bookings.service.ts:333-334  const bookingAmount = court.hourlyRate * (duration / BOOKING.MINUTES_PER_HOUR);
```
- **Suggested fix (NOT applied):** Add @IsPositive()/@Min(1) @Max(...) on hourlyRate, @IsPositive on length/width, @IsIn(['full','half']) on size; migrate hourlyRate to numeric(14,2) with the moneyTransformer and round booking totals with a decimal helper.

### 250. [MEDIUM] Court list `startAt` availability filter parses the time in the server's timezone and ignores working hours

- **Where:** `backend/src/modules/courts/courts.service.ts:361`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** When the app filters courts by 'available at YYYY-MM-DD HH:mm', the backend does dayjs(startAt) (server-local, UTC in production) instead of the court's schedule.timeZone, so a Riyadh 14:00 is treated as 14:00 UTC (17:00 Riyadh) and the exclusion subquery checks the wrong window. The filter also never consults the schedule, so courts closed at that time are still returned as 'available'.
- **How to reproduce:** Book a court 14:00-15:00 Riyadh; filter GET /courts?startAt=<date> 14:00&duration=60 on a UTC server → the court is still listed.
- **Impact:** Customers filtering by a time get courts that are actually booked or closed at that time and miss ones that are free; results differ between local dev (Riyadh clock) and production (UTC).
- **Evidence:**

```
courts.service.ts:361-363  if (startAt && duration) { const startDate = dayjs(startAt).toDate(); const endDate = dayjs(startAt).add(duration, 'minutes').toDate();
courts.service.ts:365-374  subQuery ... .where('booking.status != :cancelledStatus').andWhere('booking.startDate < :endDate').andWhere('booking.endDate > :startDate')
courtplusmobile CourtFilter.logic.ts:42-45  storedFilters?.startAt ...
```
- **Suggested fix (NOT applied):** Interpret startAt per court in its schedule timezone (join schedules and compare using AT TIME ZONE), or require an ISO instant from the client, and additionally exclude courts whose schedule has no window covering the range.

### 251. [MEDIUM] findAll logs a JSON dump of every court page to stdout on every request

- **Where:** `backend/src/modules/courts/courts.service.ts:389`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** A leftover console.log(JSON.stringify(courts, null, 2)) runs on the hottest customer endpoint (discovery list, infinite scroll, bookmarks, search). Each call serialises the page with branch, location, assets and tenant preferences synchronously and writes it to the log, inflating log volume and CPU per request and leaking tenant data into logs.
- **How to reproduce:** GET /courts with any token and watch the backend stdout.
- **Impact:** Latency and log cost scale with traffic; log aggregators fill with vendor/tenant data.
- **Evidence:**

```
courts.service.ts:383-389
    const [courts, total] = await queryBuilder.skip(...).take(pageSize).getManyAndCount();

    console.log(JSON.stringify(courts, null, 2));
```
- **Suggested fix (NOT applied):** Remove the console.log (use this.logger.debug behind a flag if needed).

### 252. [LOW] Resubmitting a court keeps the old rejection reason, which is then shown under the 'Pending Approval' banner

- **Where:** `backend/src/modules/courts/courts.service.ts:1003`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** resubmit() updates only status and submittedAt; rejectionReason is cleared only on approve/unsuspend. The court page and edit page render the banner for pending_approval with description = rejectionReason, so after the vendor fixes and resubmits they still see 'Rejection reason: …' under a Pending Approval alert.
- **How to reproduce:** Ops requests changes; vendor edits and saves; open the court page.
- **Impact:** Vendor is unsure whether the resubmission was registered or rejected again.
- **Evidence:**

```
courts.service.ts:1003-1006  update(id, { status: CourtStatus.PENDING_APPROVAL, submittedAt: new Date() });
Court.js:126-133  {court?.status && ["changes_requested", "suspended", "pending_approval", "pending_payment"].includes(court.status) && ( <Alert ... description={court.rejectionReason ? `${t("courtCard.rejection_reason")}: ${court.rejectionReason}` : undefined} /> )}
AddCourt.js:417-425  same banner
```
- **Suggested fix (NOT applied):** Either clear rejectionReason on resubmit or only show the reason for changes_requested/suspended.

### 253. [LOW] Availability accepts impossible dates/months and returns rolled-over data with 200

- **Where:** `backend/src/modules/courts/dto/get-court-availability.dto.ts:11`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Only the shape (\d{4}-\d{2}-\d{2} / \d{4}-\d{2}) is validated. dayjs.tz silently rolls month 13 / day 45 forward, so ?date=2026-13-45 returned a full day of slots and ?month=2026-13 returned all 31 days available (live), attributed to a date that does not exist.
- **How to reproduce:** GET /courts/:id/availability?date=2026-13-45
- **Impact:** Garbage-in produces plausible-looking availability; client date bugs go unnoticed.
- **Evidence:**

```
get-court-availability.dto.ts:10-15  @Matches(/^\d{4}-\d{2}-\d{2}$/ ...) date?: string;
get-court-availability.dto.ts:23-29  @Matches(/^\d{4}-\d{2}$/ ...) month?: string;
Live: /availability?date=2026-13-45 → HTTP 200 with 48 slots; ?month=2026-13 → HTTP 200 availableDays [1..31]
```
- **Suggested fix (NOT applied):** Add a custom validator using dayjs(value, format, true).isValid() (strict) for both fields.

### 254. [LOW] Status switch is shown on court creation but ignored; tooltip promises visibility that requires payment and approval

- **Where:** `dashboard/src/pages/AddCourt.js:575`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** On the Add court page the Available/Unavailable switch (default on) with tooltip 'This will make the court visible to end users' is rendered and sent as status, but CourtsService.create always overwrites it with pending_payment; the DTO even marks status as required. A vendor who sets 'unavailable' at creation still gets an AVAILABLE court on approval.
- **How to reproduce:** Add court with the switch off → after ops approval the court is available.
- **Impact:** Misleading control; vendor's intent is discarded without feedback.
- **Evidence:**

```
AddCourt.js:575-594  <Form.Item label={t("courtForm.status")}> ... <Switch checked={courtStatus} onChange={setCourtStatus} /> <Tooltip title={t("courtForm.status_tooltip")}>
AddCourt.js:233-236  ...(isModerationStatus ? {} : { status: courtStatus ? "available" : "unavailable" }),
create-court.dto.ts:49-50  @IsEnum(CourtStatus) status: CourtStatus;   (required)
courts.service.ts:110-113  save({ ...data, status: CourtStatus.PENDING_PAYMENT, ...})
courts.service.ts:941-942  approve → status: CourtStatus.AVAILABLE
```
- **Suggested fix (NOT applied):** Hide the switch on create (show the moderation explanation instead) and make status optional in CreateCourtDto; optionally persist the vendor's choice and apply it on approval.

### 255. [LOW] Currency hard-coded as 'SAR' on the court page and card while the API returns court.currency

- **Where:** `dashboard/src/pages/Court.js:86`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The backend derives currency from tenant preferences (default SAR) and returns it on every court; the dashboard ignores it and prints a literal 'SAR' next to hourly rate and total income.
- **How to reproduce:** Set tenant preferences currency to USD; open a court page.
- **Impact:** Wrong currency label for any tenant whose preferences currency is not SAR.
- **Evidence:**

```
Court.js:86  <strong>{court?.hourlyRate} SAR</strong>
CourtCard.js:76  {court?.totalRevenue?.toLocaleString() ?? 0} <span>SAR</span>
courts.service.ts:627  const currency = (court.branch as any)?.tenantPreferences?.currency || 'SAR';
```
- **Suggested fix (NOT applied):** Render court.currency (fallback t('courtForm.unit_rate')).

### 256. [LOW] Court media assignment never passes the uploader id, and does not check that the asset's media family matches the slot

- **Where:** `backend/src/modules/courts/courts.service.ts:118`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** AssetsService.assignAssets has an optional uploaderId guard, but CourtsService.create/update call it without one, so any not-yet-assigned asset id (from any user/tenant) can be attached to a court. It also never checks that the asset was presigned as an image vs video, so an image asset can be attached as court_video (the S3 policy only enforces the family at upload time, not at assignment).
- **How to reproduce:** Presign a court_image, upload, then PATCH another tenant's court (as its staff) with videoAssetId = that id → accepted.
- **Impact:** Cross-tenant attachment of unassigned uploads; a JPEG attached as the court video breaks the video player in the app.
- **Evidence:**

```
courts.service.ts:118-131  assignAssets(videoAssetId, court.id, AssetType.CourtVideo); ... assignAssets(images, court.id, AssetType.CourtImage);   // no currentUser.id
courts.service.ts:772-790  same in update()
assets.service.ts:133-138  async assignAssets(assetIds, resourceId, type, uploaderId?: string)
assets.service.ts:160  if (uploaderId && asset.uploadedBy && asset.uploadedBy !== uploaderId) { ... }
s3.service.ts:64-69  conditions.push(['starts-with', '$Content-Type', WildcardContentType[fileType]]);
```
- **Suggested fix (NOT applied):** Pass currentUser.id as uploaderId from CourtsService (and branches/posts), and store the presigned family on the asset row so assignAssets can reject mismatched types.

### 257. [LOW] Every court save re-runs Rekognition on all photos, and an explicit-content deletion happens silently after the vendor saved

- **Where:** `backend/src/modules/assets/assets.service.ts:184`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** assignAssets re-saves every provided asset and emits ASSET_ASSIGNED for each, including ones already attached, so an edit of a court with N photos triggers N DetectModerationLabels calls. If a photo is flagged it is deleted from S3 and the table without any notification; the court silently loses that image (possibly its cover) after the vendor saw a success toast.
- **How to reproduce:** Edit a court with 10 photos and change only the name; observe 10 Rekognition calls.
- **Impact:** Unnecessary AWS cost/latency per edit; vendors cannot understand why a photo disappeared.
- **Evidence:**

```
assets.service.ts:184-195  for (const asset of assets) { ... await this.assetRepository.save(asset); runOnTransactionCommit(() => emit(AssetEvent.ASSET_ASSIGNED, { asset })) }
assets.service.ts:263-276  handleAssetAssigned → detectExplicitContent(asset.key); if (explicit) { await this.delete(asset.id); return; }
```
- **Suggested fix (NOT applied):** Only emit ASSET_ASSIGNED for assets whose resourceId changed; on explicit detection notify the tenant staff (notification type + reason).

### 258. [LOW] Courts list groups by branch name — two branches with the same name collide in a single React key/group

- **Where:** `dashboard/src/pages/Courts.js:172`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** groupedByBranch is keyed by branch id, but the rendered section uses group.name as the React key; two branches named identically produce duplicate keys (React warning, possible mis-rendering on filter changes).
- **How to reproduce:** Create two branches named 'Main' with courts; open Courts.
- **Impact:** Rendering glitches when a vendor has same-named branches (e.g. 'Main').
- **Evidence:**

```
Courts.js:171-173  branchGroups.map((group) => ( <section key={group.name} className="courts-branch-group">
```
- **Suggested fix (NOT applied):** Key the section by branch id (keep the id in the group object).

### 259. [LOW] Court card external-link icon is a <Link> with no destination

- **Where:** `dashboard/src/components/CourtCard.js:97`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The FiExternalLink icon is wrapped in a react-router Link without a `to`, so it resolves to the current URL — a visible control that does nothing.
- **How to reproduce:** Click the arrow icon on any court card.
- **Impact:** Dead control on every card.
- **Evidence:**

```
CourtCard.js:97-99  <Link className="court-card-link"> <FiExternalLink color="#777" size={24} /> </Link>
```
- **Suggested fix (NOT applied):** Point it at the court page (to={`${id}`}) or remove it.

### 260. [LOW] Asset mimeType/fileSize are never recorded and the presign accepts any image/* (including SVG) with no server-side type check

- **Where:** `backend/src/modules/assets/assets.service.ts:99`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** generateUploadUrl stores only id/key/bucket/uploadedBy; nothing ever writes mimeType or fileSize (no setter anywhere in backend/src), so the columns selected in findAll are always null. The S3 policy only requires Content-Type to start with 'image/' or 'video/', which the browser derives from the file extension; SVG (image/svg+xml) or a renamed binary passes and is served from the CDN as-is. The dashboard's png/jpeg/webp restriction is client-side only.
- **How to reproduce:** POST /assets/signed-url {type:'court_image'} then upload an .svg with Content-Type image/svg+xml → accepted; attach to a court.
- **Impact:** Clients receive null media metadata; unsupported formats (SVG, HEIC) reach the CDN and render broken in the app.
- **Evidence:**

```
assets.service.ts:105-110  save({ id, key, bucket, uploadedBy: user.id })
grep 'mimeType\s*[:=]' backend/src → no results
s3.service.ts:18-22  WildcardContentType = { image: 'image/', video: 'video/', ... }
functions.js:18-21  formData.append("Content-Type", file.type || fallback);
```
- **Suggested fix (NOT applied):** Sign an exact Content-Type from an allow-list (image/jpeg|png|webp; video/mp4|webm) and record mimeType/fileSize via an S3 event or a HEAD on assignment.

### 261. [LOW] Concurrent edits of the same court's working hours can leave duplicated availability rows (no lock/version on schedule update)

- **Where:** `backend/src/modules/schedules/schedules.service.ts:112`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** update() reads schedule.availabilities, removes them and inserts the new set inside a transaction but without a row lock or version check. Two staff saving the same court at once both read the same rows, both 'remove' them (the second remove affects nothing and does not fail) and both insert, leaving two overlapping sets; Schedule.getSlots then emits duplicate slots for each window.
- **How to reproduce:** Two dashboard sessions save the same court within the same second.
- **Impact:** Duplicate/overlapping windows after a race; the availability screen lists each slot twice.
- **Evidence:**

```
schedules.service.ts:96-99  const schedule = await this.schedulesRepository.findOne({ where: { id }, relations: ['availabilities'] });
schedules.service.ts:118-124  if (schedule.availabilities?.length) { await this.availabilitiesRepository.remove(schedule.availabilities); } if (newAvailabilities.length) { await this.availabilitiesRepository.save(newAvailabilities); }
schedule.entity.ts:228-236  availabilitiesForDay = this.availabilities.filter(...); for (const availability of availabilitiesForDay) { ... slots.push(...) }
```
- **Suggested fix (NOT applied):** Lock the schedule row (pessimistic_write) in update(), or delete by scheduleId instead of by loaded entities, and add a @VersionColumn on Court for optimistic concurrency.

### 262. [LOW] QuickTime .mov videos are accepted although Chrome and most Android devices cannot play them

- **Where:** `dashboard/src/pages/AddCourt.js:296`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The video dropzone accepts video/quicktime and .mov (typical iPhone exports, often HEVC) and the backend only checks the 'video/' prefix. The dashboard preview (<video src>) and the customer app then render an unplayable file for Chrome/Android viewers; nothing warns the vendor.
- **How to reproduce:** Upload an iPhone .mov; open the court in Chrome on Windows.
- **Impact:** Court videos silently fail to play for a large share of customers.
- **Evidence:**

```
AddCourt.js:293-298  matchesFile(file, ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"], [".mp4", ".mov", ".m4v", ".webm"])
AddCourt.js:692  accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm"
s3.service.ts:64-69  starts-with $Content-Type 'video/'
```
- **Suggested fix (NOT applied):** Restrict to mp4 (H.264/AAC) and webm, or transcode server-side before publishing.

---

## 10. Schedules, availability, slots, timezones and reminders

27 issues — 1 critical, 5 high, 13 medium, 8 low.

### 263. [CRITICAL] Split bookings created <30 min before start never settle the organiser's hold: vendor is never paid for unpaid seats

- **Where:** `backend/src/modules/bookings/reminders.service.ts:48`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The only place the organiser's manual-capture hold is captured for unpaid seats (and for the organiser's own share) is processPendingPayments, which runs exclusively inside the THIRTY_MINUTES reminder job (bookings.processor.ts:74-76). scheduleBookingReminders schedules that job only when the booking is created more than 30 minutes before start; for 15<t<=30 it schedules the 15-minute reminder only, for t<=15 only start/end jobs. Neither processBookingEnd (processor.ts:173-214) nor the 10-minute sweep (slots.service.ts:62-102) calls processPendingPayments, so the PaymentIntent authorisation is never captured and expires at Stripe.
- **How to reproduce:** Create a split/open booking whose start is 25 minutes away, have one invitee not pay, wait for the match to end: the creator payment stays HOLD forever, no PAYMENT_CAPTURED event, tenant pending balance unchanged.
- **Impact:** For any open/split match created less than 30 minutes before kick-off with at least one unpaid seat (common for last-minute open matches), the match is played, the booking is marked COMPLETED, but the organiser is never charged and the vendor's balance never receives the money.
- **Evidence:**

```
reminders.service.ts:57-75  } else if (timeUntilBooking > REMINDER_INTERVALS.HALF_HOUR) { ...HALF_HOUR } else if (timeUntilBooking > REMINDER_INTERVALS.QUARTER_HOUR) { ...QUARTER_HOUR } else if (timeUntilBooking > 0) { scheduleBookingStatusJobs(...) }
bookings.processor.ts:74-76  if (reminderType === BookingReminderType.THIRTY_MINUTES && booking.paymentType === PaymentType.SPLIT) { await this.bookingsService.processPendingPayments(booking.id); }
bookings.processor.ts:173-214 processBookingEnd: changeBookingStatus -> ENDED event -> notifyParticipants -> notifyRateReminder (no capture)
bookings.service.ts:1775-1780 // The organiser pays their own seat PLUS every seat nobody paid for ... await this.paymentsService.completePayment(creatorPayment.id, captureTotal);
```
- **Suggested fix (NOT applied):** Trigger processPendingPayments from a dedicated delayed job scheduled at CREATED (start - 30 min, or immediately if closer), and as a safety net call it from processBookingEnd and the completeExpiredBookings sweep before emitting ENDED.

### 264. [HIGH] Cross-midnight schedules: post-midnight slots are labelled with the previous day's date and their bookings are never loaded

- **Where:** `backend/src/modules/schedules/entities/schedule.entity.ts:246`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Schedule.getSlots returns only HH:mm strings. For a window such as Saturday 16:00-02:00 it emits 00:00..01:30 slots that really belong to Sunday, under the Saturday date. Every client composes startAt as `${selectedDate} ${slot.startTime}` (mobile BookingSummary.logic.ts:52-55, ConfirmMatch.logic.ts:41-43, dashboard BookingModal.js:77), so tapping '00:30' on Saturday books Saturday 00:30 (the previous night) -> SLOT_IN_PAST, or, if Friday also has night hours, silently books the wrong night 24h earlier. In addition courts.service.getAvailability fetches bookings/reservations only for [startOfDay,endOfDay] of the selected date, so the post-midnight slots are always shown as available even when booked.
- **How to reproduce:** Set a court to Sat 16:00-02:00, GET /courts/:id/availability?date=<Saturday> -> slots include 00:00-00:30 ... ; book '00:30' from the app -> SLOT_IN_PAST or booking on Saturday 00:30.
- **Impact:** Any venue with night hours (the padel norm, e.g. 16:00-02:00) exposes 4 slots per day that either error out or book the wrong night, and can be double-shown as free.
- **Evidence:**

```
schedule.entity.ts:246-250  slots.push({ startTime: start.format('HH:mm'), endTime: end.format('HH:mm'), available });
availability.entity.ts:43-45  if (slotEnd.isSameOrBefore(slotStart)) { slotEnd = slotEnd.add(1, 'day'); }
courts.service.ts:1088-1101  const startOfDay = dayjs.tz(date, tz).startOf('day')...; const endOfDay = ...endOf('day'); findBookingsInRange(id, startOfDay, endOfDay)
courtplusmobile BookingSummary.logic.ts:52-55  startAt: `${formatDate(timeSummary?.date?.toString() ?? "", "yyyy-MM-dd")} ${sortedSlots[0]?.startTime ?? ""}`
```
- **Suggested fix (NOT applied):** Return a full ISO start/end (or a `date` field) per slot and have clients send that; widen the bookings/reservations query to [startOfDay, endOfDay + max window overflow]; or drop post-midnight slots from the previous day's list and generate them under the next day.

### 265. [HIGH] Reminder/status jobs load the booking without court/schedule: reminder times sent in UTC, court/branch blank, staff reminder never sent

- **Where:** `backend/src/modules/bookings/bookings.processor.ts:36`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** BookingsProcessor.process calls bookingsService.findOne({ id }) whose default relations are only participants.payment (bookings.service.ts:833-846). processReminder then reads booking.court?.schedule?.timeZone || 'UTC' and booking.court?.name/branch?.name, so the participant reminder e-mail/push carries date/time in UTC (e.g. 07:00 for a 10:00 Riyadh match) and 'Court:' / 'Location:' empty. notifyStaffBookingReminder returns early because booking.court?.branch?.id is undefined, so vendors never receive the 'booking starting soon' notification.
- **How to reproduce:** Create a booking >1h ahead, wait for the 1-hour reminder: e-mail shows UTC times and 'Court: ' blank; no staff notification row is created.
- **Impact:** Customers get reminder e-mails with the wrong hour and no court name; staff reminders are a dead feature.
- **Evidence:**

```
bookings.processor.ts:36  const booking = await this.bookingsService.findOne({ id: bookingId });
bookings.service.ts:835-839  relations: FindOptionsRelations<Booking> = { participants: { payment: true } },
bookings.processor.ts:78-80  const tz = booking.court?.schedule?.timeZone || 'UTC'; const startDateLocal = dayjs(booking.startDate).tz(tz);
bookings.processor.ts:96-101  courtName: booking.court?.name, branchName: booking.court?.branch?.name, ... sportType: booking.court?.sport,
bookings.service.ts:1482-1484  if (!booking.court?.branch?.id) { return; }
```
- **Suggested fix (NOT applied):** Load relations { court: { branch: true, schedule: true }, participants: { payment: true } } in the processor (or add a dedicated findForJobs).

### 266. [HIGH] Vendor 'New booking' modal treats booked slots as free and breaks on month navigation

- **Where:** `dashboard/src/components/Schedule/BookingModal.js:333`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The modal reads slot.isReserved but the API slot shape is { startTime, endTime, available } (slots-response.dto.ts:16-17), so isBooked is always undefined: every slot is clickable, booked ones are never coloured, and choosing one yields a 409 that surfaces as 'Something went wrong!'. Month navigation calls getCourtAvailabilty({ selectedCourtId, ... }) (wrong key -> /courts/undefined/availability) and stores the month result into dayAvailability, wiping the day's slot list. It also posts playerAside (typo, stripped by whitelist) and never sends the chosen 'call/walk-in' method.
- **How to reproduce:** Schedule > New booking > pick a court with an existing booking today: the booked slot renders as available; click it, Book now -> error toast. Navigate to next month -> slot list empties.
- **Impact:** Front-desk staff cannot see which slots are taken, get opaque failures when they pick one, and cannot book in any month other than the current one.
- **Evidence:**

```
BookingModal.js:333  const isBooked = slot.isReserved;
slots-response.dto.ts:16-17  @ApiProperty({ example: false, description: 'Whether the slot is reserved' }) available: boolean;
BookingModal.js:183-189  getCourtAvailabilty({ selectedCourtId, params: { month }, }).then((res) => { setDayAvailability(res); })
court_actions.js:10  export const getCourtAvailabilty = async ({ courtId, params }) =>
BookingModal.js:242-244  playerAside: formData.participants?.length, level: "intermediate", gender: "male",
```
- **Suggested fix (NOT applied):** Use slot.available; pass courtId and set monthAvailability in onMonthDay; drop the bogus fields or send the real method.

### 267. [HIGH] Customer who closes the payment sheet is locked out of their own slot for 10 minutes ('already reserved')

- **Where:** `backend/src/modules/bookings/slots.service.ts:128`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** book() reserves the slot for SLOT_RESERVATION_TTL_SECONDS (600) before creating the PaymentIntent, and the reservation is only deleted inside create() after a successful payment. If the customer dismisses the Stripe sheet, their card fails, or Stripe is down, a retry hits reserveSlot whose fast-path query has no userId exclusion, so their own live reservation returns false and book() throws SLOT_ALREADY_RESERVED (mobile copy: 'That slot is already reserved. Please pick another time.'). The slot also renders as unavailable to them in getSlots (checkSlotOverlapWithReservedSlots ignores userId). The payment-cancellation job never releases the reservation.
- **How to reproduce:** Tap Book, close the Stripe sheet, tap Book again on the same slot -> 400 SLOT_ALREADY_RESERVED.
- **Impact:** Every abandoned/failed payment blocks the same customer from retrying the same slot for up to 10 minutes with a misleading message.
- **Evidence:**

```
slots.service.ts:128-137  .where('reservation.courtId = :courtId').andWhere('reservation.startDate < :endDate').andWhere('reservation.endDate > :startDate').andWhere('reservation.expiresAt > :now').getOne(); if (existingReservation) { return false; }
bookings.service.ts:196-202  const reserved = await this.slotsService.reserveSlot(...); if (!reserved) { ... throw new BadRequestException(SLOT_ALREADY_RESERVED); }
bookings.service.ts:389-390  if (user.id) { await this.slotsService.releaseSlotReservation(courtId, startDate, endDate, user.id);
payments.processor.ts:45-48  processPaymentCancellation -> paymentsService.cancelPayment(paymentId) (no reservation release)
courtplusmobile/src/translation/en.json:305  "SLOT_ALREADY_RESERVED": "That slot is already reserved. Please pick another time."
```
- **Suggested fix (NOT applied):** In reserveSlot, treat an existing reservation by the same userId as re-usable (extend expiresAt) and exclude own reservations in getSlots; release the reservation when the PaymentIntent is cancelled/failed.

### 268. [HIGH] Bookings created 15-60 minutes before start never get start/end jobs: status stays 'pending' during play, no started/ended notifications

- **Where:** `backend/src/modules/bookings/reminders.service.ts:57`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** scheduleBookingStatusJobs is called only (a) from scheduleBookingReminders when the booking is <=15 minutes away and (b) from BookingsProcessor.scheduleNextReminder when the ONE-HOUR reminder runs. For bookings created between 15 and 60 minutes before start the chain starts at the 30- or 15-minute reminder, so the booking is never moved to IN_PROGRESS, BOOKING_STARTED/BOOKING_ENDED are never sent, no ENDED BookingEvent row is written, and completion is left to the 10-minute sweep (up to 10 minutes late).
- **How to reproduce:** Create a booking starting in 40 minutes; at start time status remains pending; ~10 minutes after end the sweep flips it to completed.
- **Impact:** Walk-in/last-minute bookings show 'pending' in the vendor dashboard and app while being played; customers never receive the started/ended pushes; ended history event missing.
- **Evidence:**

```
reminders.service.ts:57-75  } else if (timeUntilBooking > REMINDER_INTERVALS.HALF_HOUR) { scheduleBookingReminder(..., HALF_HOUR) } else if (... > QUARTER_HOUR) { scheduleBookingReminder(..., QUARTER_HOUR) } else if (timeUntilBooking > 0) { scheduleBookingStatusJobs(...) }
bookings.processor.ts:138-144  if (currentMinutes === REMINDER_INTERVALS.HOUR) { await this.remindersService.scheduleBookingStatusJobs(...) }
```
- **Suggested fix (NOT applied):** Always call scheduleBookingStatusJobs from scheduleBookingReminders (the jobs already guard on delay > 0), independently of the reminder tier.

### 269. [MEDIUM] Reminders and started/ended pushes go to participants who left, were removed, or never accepted

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1457`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** notifyParticipants builds the recipient list from participantsService.getParticipants(bookingId, {}, whereCondition) with no status filter, so CANCELLED, NO_SHOW, PENDING_RESPONSE and PENDING_APPROVAL participants receive 'Your booking starts in 1 hour', 'Booking Started', 'Booking Ended' (and the reminder e-mail).
- **How to reproduce:** Join an open match, leave it, wait for the 1-hour reminder: push/e-mail still arrives.
- **Impact:** A player who left a match (refunded) keeps getting reminders and 'your booking has started' for a game they are not in; invitees who ignored the invite get reminders too.
- **Evidence:**

```
bookings.service.ts:1457-1463  const whereCondition = exceptUserIds?.length ? { userId: Not(In(exceptUserIds)) } : {}; const participants = await this.participantsService.getParticipants(bookingId, {}, whereCondition); const userIds = participants.map((participant) => participant.userId);
participants.service.ts:93-97  where: FindOptionsWhere<Participant> = {}, ... return this.participantsRepository.find({ where: { bookingId, ...where }, relations });
```
- **Suggested fix (NOT applied):** Filter participants to READY/ENTERED (and creator) for reminder/started/ended notifications.

### 270. [MEDIUM] Expired-booking sweep can complete a booking twice with the end job and emit ENDED twice; sweep path also skips the ENDED event row and BOOKING_ENDED push

- **Where:** `backend/src/modules/bookings/slots.service.ts:78`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** completeExpiredBookings fetches candidates, bulk-updates them to COMPLETED with no status guard, then emits ENDED for every fetched row regardless of `affected`. If the BullMQ end job for one of those bookings runs between the find and the update (worker lag at the 10-minute tick), both paths emit ENDED. balance.service.releaseHeldRevenue is not @Transactional, so two concurrent releases can both read metadata.held and credit twice. The sweep also never writes the ENDED BookingEvent nor sends BOOKING_ENDED, unlike processBookingEnd.
- **How to reproduce:** Stall the bookings worker for a few seconds across a 10-minute cron tick with a booking that ends right before the tick, then resume: two ENDED events for one booking.
- **Impact:** Rare double credit of vendor balance; inconsistent booking history/notifications between swept and normally-ended bookings.
- **Evidence:**

```
slots.service.ts:78-92  const result = await this.bookingsRepository.update({ id: In(expiredBookings.map((booking) => booking.id)) }, { status: BookingStatus.COMPLETED }); ... for (const booking of expiredBookings) { this.eventEmitter.emit(BookingEventType.ENDED, { booking });
slots.service.ts:52-54  // Without the lock, every replica completes the same bookings and emits duplicate ENDED events — which credit tenant revenue
bookings.processor.ts:198-211  eventsService.create({ event: BookingEventType.ENDED }) ... notifyParticipants(booking.id, NotificationType.BOOKING_ENDED ...)
balance.service.ts:272-290  async releaseHeldRevenue(...) { const balance = await this.getBalanceForUpdate(tenantId); ... if (heldTx?.metadata?.held) { balance.availableBalance += heldAmount;
```
- **Suggested fix (NOT applied):** Update with `status IN (pending,in_progress)` per booking and emit only for rows actually affected (or use changeBookingStatus per booking); write the ENDED event and BOOKING_ENDED notification in the sweep; make releaseHeldRevenue transactional.

### 271. [MEDIUM] Slot/availability generation drifts by one hour after a DST change for zones with DST (Cairo, Amman, Beirut, London)

- **Where:** `backend/src/modules/schedules/entities/schedule.entity.ts:223`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** getSlots/getDaysAvailability anchor on dayjs.tz(from, tz).startOf('day') and then walk days with .add(1, 'day'); the dayjs tz instance carries a fixed utcOffset, so every day after a DST switch inside the range is anchored with the pre-switch offset and Availability.getSlots' currentDate.hour(h) yields wall times one hour off. Verified with the repo's dayjs: for Africa/Cairo after 2026-04-24 the '09:00' slot instant is 07:00Z while 09:00 Cairo is 06:00Z; the month walk lands on 01:00 instead of 00:00. The previous-day anchor in isTimeInScheduleAvailabilities (slotStart.subtract(1,'day')) has the same issue for cross-midnight windows on the switch day. The dashboard offers these zones (modules/timeZones.js:19-21,39) and the DTO accepts any IANA zone.
- **How to reproduce:** Court in Africa/Cairo, fully book 2026-04-25 09:00-21:00, GET /courts/:id/availability?month=2026-04 -> day 25 listed as available.
- **Impact:** Month availability (availableDays/unavailableDays) is computed against shifted instants after the switch: fully booked days can show as available, past/today judgement is off by an hour; cross-midnight bookings on the switch day may be wrongly rejected/accepted.
- **Evidence:**

```
schedule.entity.ts:223-224  let currentDate = dayjs.tz(from, this.timeZone).startOf('day'); const endDate = dayjs.tz(to, this.timeZone).endOf('day');
schedule.entity.ts:254  currentDate = currentDate.add(1, 'day');
availability.entity.ts:35-36  const slotStart = currentDate.hour(startHour).minute(startMinute).second(0);
schedule.entity.ts:188  .map((avail) => ({ avail, anchor: slotStart.subtract(1, 'day') })),
probe (backend dayjs 1.11.13): 2026-04-25 Sat +02:00 09:00 slot instant = 2026-04-25T07:00:00.000Z | true 09:00 Cairo = 2026-04-25T06:00:00.000Z
```
- **Suggested fix (NOT applied):** Re-derive each day with dayjs.tz(`${YYYY-MM-DD}`, tz) (string parse) instead of add(1,'day') on a tz instance, and build slot instants from the date string + HH:mm via dayjs.tz(string, tz).

### 272. [MEDIUM] No overlap constraint on bookings; create() relies on FOR UPDATE that locks nothing when the slot is free

- **Where:** `backend/src/modules/bookings/slots.service.ts:222`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The exclusion constraint added in migration 1790000000000 covers only slot_reservations (confirmed on the live DB: only excl_slot_reservation_overlap exists). create() calls checkSlotAvailability({ lock: true }) which does SELECT ... FOR UPDATE on overlapping bookings; as the code's own comment says, zero matching rows means no lock, so two concurrent create() calls (a staff dashboard booking plus a customer webhook whose reservation already expired, or two webhooks) both pass and both insert.
- **How to reproduce:** Fire a staff POST /bookings and a customer payment webhook for the same slot within the same few milliseconds.
- **Impact:** Double booking of the same court/time is possible under concurrency; staff and customers would both hold a confirmed, paid booking.
- **Evidence:**

```
slots.service.ts:121-127  // The previous implementation relied on `SELECT ... FOR UPDATE` here, but FOR UPDATE locks matching rows, and a free slot matches zero rows, so it took no lock at all
slots.service.ts:222-232  if (options?.lock) { return this.bookingsRepository.createQueryBuilder('booking').setLock('pessimistic_write')...getMany(); }
bookings.service.ts:316-321  const { available, reason, details } = await this.slotsService.checkSlotAvailability(startDate, endDate, court.schedule, { lock: true });
live DB: SELECT conname FROM pg_constraint WHERE contype='x' -> excl_slot_reservation_overlap only
```
- **Suggested fix (NOT applied):** Add EXCLUDE USING gist (courtId WITH =, tsrange(startDate,endDate,'[)') WITH &&) WHERE status <> 'cancelled' on bookings and map 23P01 to ConflictException in create().

### 273. [MEDIUM] Booking times stored as naive timestamps whose meaning depends on the Node/DB process timezone; TZ is not pinned anywhere

- **Where:** `backend/src/modules/bookings/entities/booking.entity.ts:64`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** bookings.startDate/endDate are `timestamp` (no zone) while slot_reservations use timestamptz. node-postgres writes a Date as the process-local wall time and Postgres drops the offset, so the stored value is 'UTC' only if the Node process runs in UTC; nothing sets TZ in the Dockerfile/compose/main.ts. Raw queries compare the naive column with NOW() (DB session zone). On the provided stack Node and the DB session are both Africa/Cairo (a DST zone), so stored wall times shift by an hour across Egypt's DST dates and would break the moment the API and DB disagree on zone.
- **How to reproduce:** Run the API with TZ=Asia/Riyadh and the DB with timezone=UTC: 'endDate > NOW()' and the sweep disagree by 3 hours.
- **Impact:** Any deployment or restore where the API container zone, the DB session zone, or DST state differs shifts every booking, reminder and revenue-release time by hours.
- **Evidence:**

```
booking.entity.ts:64-69  @Column() startDate: Date; ... @Column() endDate: Date;
migrations/1764088979463-init.ts:34  "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL
shared/dayjs.ts:26-27  * ... are converted to UTC for storage (Postgres naive timestamp columns hold UTC);
courts.service.ts:916  .andWhere('b."endDate" > NOW()')
users.service.ts:636-637  WHERE b."userId" = $1 AND b.status IN ('pending','in_progress') AND b."endDate" > NOW()
live: SHOW timezone -> Africa/Cairo; bookings row: 2026-09-27 20:00:00 (naive)
```
- **Suggested fix (NOT applied):** Migrate startDate/endDate to timestamptz (matching slot_reservations) and set TZ=UTC explicitly in the runtime image / main.ts.

### 274. [MEDIUM] Vendor dashboard renders booking times in the browser's timezone and ignores the per-booking timeZone the API returns

- **Where:** `dashboard/src/components/Schedule/MyCalendar.js:54`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The API attaches timeZone (court schedule zone) to every booking (bookings.service.ts:815-821), but MyCalendar, BookingTable and ScheduleDetails format startDate/endDate with new Date()/dayjs() in the browser zone. A vendor admin whose laptop is not in the court's zone (Cairo vendor with Riyadh courts in winter, travelling owner, ops via the same components) sees every booking shifted, and the calendar places events on the wrong hours/days.
- **How to reproduce:** Set the OS timezone to Europe/London and open Schedule: a 20:00 Riyadh booking shows 18:00.
- **Impact:** Wrong times shown to vendors whenever browser zone != court zone (including Egypt DST months for Riyadh courts).
- **Evidence:**

```
MyCalendar.js:54-59  const start = new Date(match.startDate); const end = new Date(match.endDate); const formattedTitle = `${formatDate(start, "HH:mm")} - ${formatDate(end, "HH:mm")} | ...`
BookingTable.js:77-81  {`${dayjs(record.startDate).format("HH:mm")} - ${dayjs(record.endDate).format("HH:mm")}`} ... {dayjs(record.startDate).format("DD MMM YYYY")}
SceduleDetails.js:95-96  {dayjs(match.startDate).format("HH:mm")} - {dayjs(match.endDate).format("HH:mm")}
bookings.service.ts:817-819  // Booking datetimes are stored as UTC; the court's schedule timezone is the authoritative zone ... timeZone: booking.court?.schedule?.timeZone ?? null,
```
- **Suggested fix (NOT applied):** Format with dayjs.tz(value, match.timeZone) (dayjs utc+timezone plugins) in all three components and feed react-big-calendar zone-shifted Dates.

### 275. [MEDIUM] Mobile cards mix device-zone and court-zone rendering of the same booking

- **Where:** `courtplusmobile/src/components/molecules/OpenMatchItem/OpenMatchItem.component.tsx:73`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** OpenMatchItem shows the headline date/time with date-fns formatDate (device zone) and, a few lines below, the time via convertToUTCTime(startDate, timeZone) (court zone). BookingDetails prints the date in device zone (component line 146) but the time range in court zone (logic 63-64); MatchInvitationCard passes new Date(item.startDate) for the date. Around midnight or for any user outside the court's zone the same card shows two different times/dates.
- **How to reproduce:** Device in Europe/London, open match at 00:30 Riyadh: card shows 'Sat 03 Oct, 09:30 pm' and '00:30'.
- **Impact:** Travelling customers or expats see contradictory times on open-match and booking cards.
- **Evidence:**

```
OpenMatchItem.component.tsx:73  text={formatDate(booking.startDate, "E dd MMM, hh:mm a")}
OpenMatchItem.component.tsx:97  <CustomText text={convertToUTCTime(booking.startDate, booking.timeZone)} />
BookingDetails.component.tsx:146  text={formatDate(item.startDate, "dd MMM yyyy")}
BookingDetails.logic.ts:62-64  const zone = item.timeZone; const formattedStartTime = formatInZone(item.startDate, "HH:mm", zone);
MatchInvitationCard.component.tsx:58  selectedDate={new Date(item.startDate)}
```
- **Suggested fix (NOT applied):** Use formatInZone(..., booking.timeZone) for every date/time on these cards.

### 276. [MEDIUM] Mobile slot selection is 'pick boundaries': cannot book the last half-hour before a taken slot, in-between availability never checked

- **Where:** `courtplusmobile/src/utils/helpers.ts:604`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** getSlotsDurationMinutes = lastSelected.start - firstSelected.start (30 min for a single pick). Because unavailable slots are disabled (TimeSlots.component.tsx:40), a free 09:00-10:00 gap before a 10:00 booking can only be booked as 09:00-09:30 (selecting 09:00 and 09:30 gives duration 30), and the last slot of the day can never be the end boundary. Nothing checks that the slots between two selected boundaries are available, so selecting 09:00 and 11:00 around a booked 09:30 produces a server 409 after the summary screen. Buttons show only startTime so users cannot tell they are picking boundaries rather than blocks.
- **How to reproduce:** Court with a 10:00 booking; try to book 09:00-10:00 in the app: 10:00 is disabled, picking 09:00+09:30 books 30 minutes only.
- **Impact:** Vendors lose the last 30 minutes before every existing booking; customers hit 'That time overlaps with another booking' after choosing seemingly valid boundaries.
- **Evidence:**

```
helpers.ts:604-612  if (slots.length === 1) return SLOT_DURATION_MINUTES; const sortedSlots = sortSlotsByStartTime(slots); return timeToMinutes(sortedSlots[sortedSlots.length - 1].startTime) - timeToMinutes(sortedSlots[0].startTime);
TimeSlots.component.tsx:40-46  disabled={!slot.available} ... text={slot.startTime}
ChooseTime.logic.ts:36-48  onTimeSlotPress toggles the slot with no contiguity/availability check
```
- **Suggested fix (NOT applied):** Model selection as contiguous 30-minute blocks (duration = count*30, end = last.endTime), enforce contiguity and availability on tap, and show start-end on each chip.

### 277. [MEDIUM] Open-match confirmation shows a fake clock time (UTC midnight) and the picked day shifts for devices west of UTC

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/ConfirmMatch/ConfirmMatch.logic.ts:21`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** PickDate stores the calendar's dateString ('YYYY-MM-DD'). ConfirmMatch formats that string with 'EEE dd MMM, hh:mm aaa': new Date('YYYY-MM-DD') is UTC midnight, so the screen prints e.g. 'Fri 25 Sep, 03:00 am' in Riyadh, unrelated to the chosen slots. PickTime and ConfirmMatch also derive the API date from new Date(dateString) in device-local rendering, which yields the previous day on any device with a negative UTC offset.
- **How to reproduce:** Create open match, pick any day: ConfirmMatch shows '03:00 am'. Set device zone to America/New_York and pick 25 Sep: slots and startAt are for 24 Sep.
- **Impact:** Confirmation screen shows a misleading time; users in the Americas book the day before the one they tapped.
- **Evidence:**

```
PickDate.logic.ts:24-26  const onDayPress = (d: DateData) => { setMatchData({ date: d.dateString }); navigate("PickTime"); };
ConfirmMatch.logic.ts:21  const formattedDate = formatDate(date ?? "", "EEE dd MMM, hh:mm aaa");
ConfirmMatch.component.tsx:56  text={formattedDate}
PickTime.logic.ts:15  date: new Date(date ?? "").toLocaleDateString("en-CA") ?? "",
ConfirmMatch.logic.ts:41  startAt: `${formatDate(date?.toString() ?? "", "yyyy-MM-dd")} ${
```
- **Suggested fix (NOT applied):** Keep the date as a string and format with a date-only pattern (parse with date-fns parseISO/parse in local), never wrap dateString in new Date().

### 278. [MEDIUM] Court search 'available at' filter parses the wall time in the server zone and ignores opening hours

- **Where:** `backend/src/modules/courts/courts.service.ts:362`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** findAll converts startAt with dayjs(startAt) (server-local parse), unlike the booking path which uses parseBookingDateTime(startAt, court.schedule.timeZone). On a UTC server the app's '2026-09-26 18:00' (CourtFilter.logic.ts:110-114) is checked at 21:00 Riyadh. The subquery only excludes courts with overlapping bookings; a court closed at that hour is still returned as available.
- **How to reproduce:** Book a court 18:00-19:00 Riyadh, then search with availability 18:00 on a UTC server: the court is still listed.
- **Impact:** Availability filter returns courts that are booked at the requested time and courts that are closed, and hides free ones.
- **Evidence:**

```
courts.service.ts:361-363  if (startAt && duration) { const startDate = dayjs(startAt).toDate(); const endDate = dayjs(startAt).add(duration, 'minutes').toDate();
courts.service.ts:365-374  .from('bookings', 'booking').where('booking.status != :cancelledStatus').andWhere('booking.startDate < :endDate').andWhere('booking.endDate > :startDate') ... `court.id NOT IN ${subQuery}`
bookings.service.ts:159  const startDate = parseBookingDateTime(startAt, court.schedule.timeZone);
CourtFilter.logic.ts:110-114  startAt: availabilityEnabled ? `${formatDate(selectedDate.toString(), "yyyy-MM-dd")} ${PERIOD_HOURS[selectedPeriod]}` : undefined,
```
- **Suggested fix (NOT applied):** Resolve the instant per court zone (or accept an ISO instant), and also exclude courts whose schedule has no availability window covering the range.

### 279. [MEDIUM] Booking duration accepts any number >= 30 (no 30-minute step, no maximum, fractional allowed)

- **Where:** `backend/src/modules/bookings/dto/create-booking.dto.ts:44`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** duration is only @IsNumber() @Min(30). A direct API call with duration 31 creates 09:00-09:31, which blocks the 09:30-10:00 slot for everyone (overlap check) while charging 31/60 of the rate; 45.5 or 1e6 are accepted by validation (the latter fails only later on schedule hours). Slots are otherwise generated on a fixed 30-minute grid (courts.controller.ts:330).
- **How to reproduce:** POST /bookings with duration 31 on a free slot -> 201; GET availability shows the following slot unavailable.
- **Impact:** A crafted request fragments the slot grid and underpays; vendors lose a bookable half-hour.
- **Evidence:**

```
create-booking.dto.ts:44-46  @IsNumber() @Min(BOOKING.MIN_DURATION_MINUTES) duration?: number;
bookings.service.ts:160  const endDate = dayjs(startDate).add(duration, 'minutes').toDate();
bookings.service.ts:208-209  const bookingAmount = court.hourlyRate * (duration / BOOKING.MINUTES_PER_HOUR);
courts.controller.ts:328-330  this.courtsService.getAvailability(id, { date, duration: 30 }, user)
```
- **Suggested fix (NOT applied):** Add a custom validator: integer, multiple of 30, and a sane maximum (e.g. 240).

### 280. [MEDIUM] Reminder pipeline is a fragile chain: one permanently failed job cancels all later reminders, status jobs and split settlement

- **Where:** `backend/src/modules/bookings/bookings.processor.ts:121`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Only the first reminder is enqueued at CREATED; the 30-min, 15-min, start/end jobs and (for split) processPendingPayments are enqueued from inside the previous job's handler after notifications succeed. With attempts: 3 and a 5 s fixed backoff, a 15-second FCM/SMTP/DB blip at the 1-hour mark silently loses everything downstream for that booking; the sweep only fixes completion.
- **How to reproduce:** Make notificationsService.sendNotification throw during the 1-hour job; observe no further jobs for that booking.
- **Impact:** Sporadic loss of reminders/status transitions and, for split bookings, of the organiser capture.
- **Evidence:**

```
bookings.processor.ts:118  await this.scheduleNextReminder(booking, minutesBeforeBooking);
bookings.processor.ts:130-144  if (nextMinutes !== null) { await this.remindersService.scheduleBookingReminder(...) } if (currentMinutes === REMINDER_INTERVALS.HOUR) { await this.remindersService.scheduleBookingStatusJobs(...) }
bookings.module.ts:31-35  attempts: 3, backoff: { type: 'fixed', delay: 5000 },
```
- **Suggested fix (NOT applied):** Enqueue all reminder/status jobs at CREATED with absolute delays (jobIds are already unique), and enqueue the next job before sending notifications.

### 281. [MEDIUM] Arabic reminder push interpolates English '1 hour' / '30 minutes'

- **Where:** `backend/src/modules/bookings/bookings.processor.ts:82`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The reminder text is built in English in the processor and passed as {{time}} into both locales, so Arabic users get 'يبدأ حجزك خلال 1 hour'. The same string is used for the staff reminder (inTime).
- **How to reproduce:** Arabic-language customer receives the 1-hour reminder.
- **Impact:** Mixed-language notification in every Arabic reminder.
- **Evidence:**

```
bookings.processor.ts:82-84  const reminderTime = minutesBeforeBooking >= 60 ? `${Math.floor(minutesBeforeBooking / 60)} hour${minutesBeforeBooking >= 120 ? 's' : ''}` : `${minutesBeforeBooking} minutes`;
bookings.processor.ts:92-93  minutesBeforeMatch: minutesBeforeBooking, time: reminderTime,
i18n.ts:388  content: 'يبدأ حجزك خلال {{time}}',
```
- **Suggested fix (NOT applied):** Pass minutesBeforeMatch only and localise the duration inside i18n (plural forms per locale).

### 282. [LOW] Branch working hours are collected in the dashboard but never affect booking

- **Where:** `dashboard/src/pages/AddBranch.js:160`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** AddBranch sends a schedule (timeZone + availabilities) that is stored with branchId, but booking/availability only ever consult court.schedule; there is no fallback or intersection with the branch hours, and no client displays them.
- **How to reproduce:** Set branch hours 08:00-14:00 and a court 00:00-00:00; bookings at 20:00 succeed.
- **Impact:** Vendors who set branch hours (e.g. closed Fridays) still get bookings on courts whose own hours differ; misleading required form section.
- **Evidence:**

```
AddBranch.js:160-162  schedule: { timeZone: zone, availabilities: formattedAvailabilities,
schedules.service.ts:43-46  const schedule = await this.schedulesRepository.save({ timeZone, ...(isForBranch ? { branchId: entityId } : { courtId: entityId }), });
bookings.service.ts:152-157  if (!court.schedule) { ... throw new BadRequestException(SCHEDULE_NOT_FOUND); }
```
- **Suggested fix (NOT applied):** Either intersect court availability with branch availability in Schedule.getSlots/checkSlotAvailability, or remove the branch working-hours form.

### 283. [LOW] POST /bookings/:id/enter has no time window: participants can 'enter' days early and trigger 'Booking Started' notifications

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1415`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** enterBooking only checks that the participant exists; no comparison with startDate/endDate. The app hides the button outside +/-10 minutes (BookingSummaryCard.logic.ts:40-41), but the API accepts the call any time, emitting PARTICIPANT_ENTERED ('{{name}} entered the booking' under the title 'Booking Started').
- **How to reproduce:** curl POST /bookings/:id/enter for a booking next week -> 201, others notified.
- **Impact:** Spurious 'Booking Started' pushes; ENTERED state (which blocks CANCEL in the state machine) can be reached before the match.
- **Evidence:**

```
bookings.service.ts:1420-1437  const participant = await this.participantsService.getParticipant(bookingId, user.id); ... this.participantsService.transitionParticipantStatus(participant, ParticipantStatus.ENTERED); await this.participantsService.save(participant);
BookingSummaryCard.logic.ts:40-41  const isLessThan10Minutes = Math.abs(differenceInMinutes(new Date(item.startDate), new Date())) <= 10;
i18n.ts:69-72  booking_entered: { title: 'Booking Started', content: '{{name}} entered the booking' },
```
- **Suggested fix (NOT applied):** Reject enter when now < startDate - 15 min or now > endDate.

### 284. [LOW] Availability validation misses overlap between a cross-midnight window and the next day's window

- **Where:** `backend/src/modules/schedules/schedules.service.ts:142`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** isValidAvailabilities only compares windows that share a day number. Saturday 16:00-02:00 plus Sunday 00:00-00:00 passes although both cover Sunday 00:00-02:00, so those instants are offered twice (under Saturday and Sunday) and the vendor's grid silently double-lists them.
- **How to reproduce:** PATCH court schedule with [{days:[6],16:00-02:00},{days:[0],00:00-00:00}] -> 200.
- **Impact:** Confusing duplicate slots and inconsistent availability for venues that mix night hours and 24h days.
- **Evidence:**

```
schedules.service.ts:142-146  const overlappingDays = groupA.days.filter((day) => groupB.days.includes(day)); if (overlappingDays.length === 0) continue;
schedules.service.ts:153-159  const aCrossesMidnight = aEnd <= aStart; ... if (aStart < bEndAdjusted && aEndAdjusted > bStart) { return false; }
```
- **Suggested fix (NOT applied):** When A crosses midnight, also compare its spill-over [0, aEnd] against windows of day+1.

### 285. [LOW] Vendor bookings list date filters floor to UTC days and exclude bookings that end after the range

- **Where:** `backend/src/modules/bookings/dto/list-bookings.dto.ts:66`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** startDate/endDate are re-floored to UTC day boundaries regardless of the court zone, and the query uses booking.endDate <= endDate, so a booking that starts on the last day of the month and ends after midnight is dropped from the month calendar, while bookings from the previous local evening (after 21:00Z) leak in.
- **How to reproduce:** Booking 23:30-00:30 on the last day of the month; it is absent from that month's calendar.
- **Impact:** Month/week views in the vendor calendar miss cross-midnight bookings on the range's last day.
- **Evidence:**

```
list-bookings.dto.ts:66  @Transform(({ value }) => dayjs(value).utc().startOf('day').toDate())
list-bookings.dto.ts:77  @Transform(({ value }) => dayjs(value).utc().endOf('day').toDate())
bookings.service.ts:752-758  if (startDate) { qb.andWhere('booking.startDate >= :startDate', { startDate }); } if (endDate) { qb.andWhere('booking.endDate <= :endDate', { endDate }); }
MyCalendar.js:31-32  const startDate = startOfMonth(date).toISOString(); const endDate = endOfMonth(date).toISOString();
```
- **Suggested fix (NOT applied):** Filter on booking.startDate < endDate (overlap semantics) and respect the passed instants without UTC flooring.

### 286. [LOW] Dashboard booking calendar tints adjacent-month days with the viewed month's availability

- **Where:** `dashboard/src/components/Schedule/BookingCalendar.js:18`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** tileClassName matches only date.getDate() against availableDays/unavailableDays of the fetched month, so the trailing/leading days of neighbouring months shown in the grid get the wrong colour.
- **How to reproduce:** Open New booking in a month whose grid shows next-month days.
- **Impact:** Misleading green/grey tiles for days outside the current month.
- **Evidence:**

```
BookingCalendar.js:18-25  const day = date.getDate(); if (availability?.availableDays?.includes(day)) { return "available-day"; } if (availability?.unavailableDays?.includes(day)) { return "unavailable-day"; }
```
- **Suggested fix (NOT applied):** Compare month and year as well (or hide neighbouring days).

### 287. [LOW] unavailableDays on GET /courts/:id is computed for the server's current month, not the court's

- **Where:** `backend/src/modules/courts/courts.service.ts:655`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** mapCourts derives the month with dayjs().format('YYYY-MM') (server zone) while getDaysAvailability interprets that month in the court zone; around month boundaries (court in Riyadh, server UTC, 21:00-24:00Z) the wrong month's days are returned.
- **How to reproduce:** Call GET /courts/:id at 22:00Z on the last day of a month for an Asia/Riyadh court.
- **Impact:** Court details show last month's unavailable days for the first hours of each month.
- **Evidence:**

```
courts.service.ts:655-661  if (relations.availability && court.schedule) { const availability = await this.getDaysAvailability(court.schedule, dayjs().format('YYYY-MM'), 30); mappedCourt.unavailableDays = availability.unavailableDays; }
```
- **Suggested fix (NOT applied):** Use dayjs().tz(court.schedule.timeZone).format('YYYY-MM').

### 288. [LOW] ScheduleDetails: 'Tomorrow' tag is computed from a 24h diff and the Cancel button is shown for completed/cancelled bookings

- **Where:** `dashboard/src/pages/SceduleDetails.js:86`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** dayjs(startDate).diff(dayjs(),'day') === 1 is true for anything 24-47h away (often the day after tomorrow) and false for tomorrow-morning bookings viewed this afternoon. The cancel button has no status guard, so cancelling a completed/cancelled/in-progress booking just produces the generic 'cancel_fail' toast.
- **How to reproduce:** Open a completed booking in the dashboard: Cancel is offered; click -> error.
- **Impact:** Wrong 'Tomorrow' label and dead-end cancel action for vendors.
- **Evidence:**

```
SceduleDetails.js:86-88  {dayjs(match.startDate).diff(dayjs(), "day") === 1 && (<Tag color="green">{t("scheduleDetails.tomorrow")}</Tag>)}
SceduleDetails.js:70-72  <Button danger type="primary" onClick={handleCancelBooking}>{t("scheduleDetails.cancel_booking")}</Button>
bookings.service.ts:919-927  if (booking.status === IN_PROGRESS || COMPLETED || started) { throw new BadRequestException(BOOKING_NOT_ACTIVE); }
```
- **Suggested fix (NOT applied):** Compare calendar days in the court zone; hide Cancel unless status is pending and startDate > now.

### 289. [LOW] Every court listing dumps the full result set to stdout

- **Where:** `backend/src/modules/courts/courts.service.ts:389`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** findAll logs JSON.stringify(courts, null, 2) on every GET /courts (customer home/search hot path), serialising branches, locations and assets for each page into the logs.
- **How to reproduce:** GET /courts and read the API stdout.
- **Impact:** Log volume/latency on the most frequently hit endpoint; leaks court/branch data into logs.
- **Evidence:**

```
courts.service.ts:389  console.log(JSON.stringify(courts, null, 2));
```
- **Suggested fix (NOT applied):** Remove the console.log.

---

## 11. Notifications and vendor feedback (in-app, push, e-mail)

27 issues — 0 critical, 3 high, 13 medium, 11 low.

### 290. [HIGH] Staff booking-reminder e-mail always crashes at render and is never delivered

- **Where:** `backend/src/emails/staff-booking-reminder.tsx:77`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The template dereferences props the backend never sends: `teamsInvolved.join(' vs ')` (line 77) and `staffAssigned.map(...)` (line 93). The only caller passes {bookingId, courtName, branchName, inTime, date, startTime, endTime, expectedAttendees} (bookings.processor.ts:107-116). render() throws, the exception is swallowed by notifyStaffMembers' try/catch (notifications.service.ts:672-681) and logged as a warning, so venue staff never get the 60/30/15-minute reminder e-mail. Rendering the component with the caller's props reproduces: `Cannot read properties of undefined (reading 'join')`. The template also says the booking is 'coming up in 3 days' (line 39) and contains invented sections (Teams, Staff Assigned, Setup Time, Event Coordinator).
- **How to reproduce:** Create a booking >1h ahead, wait for the 60-minute reminder job; check MailService/SES: no staff reminder e-mail; backend log shows 'Failed to send staff email for type booking_reminder'.
- **Impact:** Vendors never receive the reminder e-mail for upcoming bookings; the failure is invisible (warn log only).
- **Evidence:**

```
staff-booking-reminder.tsx:77  <strong>Teams:</strong> {teamsInvolved.join(' vs ')}
staff-booking-reminder.tsx:93  {staffAssigned.map((staff, index) => (
bookings.processor.ts:107-116  await this.bookingsService.notifyStaffBookingReminder(booking, reminderTime, { bookingId, courtName, branchName, inTime: reminderTime, date, startTime, endTime, expectedAttendees })
notifications.service.ts:673-680  await this.sendEmail(emails, { data: emailData, type }); } catch (error) { this.logger.warn(`Failed to send staff email for type ${type}...`)
runtime: REMINDER RENDER FAILED: Cannot read properties of undefined (reading 'join')
```
- **Suggested fix (NOT applied):** Rewrite the template around the data actually available (court, branch, date, time, inTime, attendees, link) and drop the fabricated sections; make optional props default to [] and add a render test per template with the real caller payload.

### 291. [HIGH] Payout request/approval/rejection/completion sends no notification to ops or to the vendor

- **Where:** `backend/src/modules/payouts/services/payouts.service.ts:458`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The payout lifecycle emits payout.requested / payout.completed / payout.failed events, but the only handlers just log. approvePayout/rejectPayout (lines 105-197) never call NotificationsService, there is no PAYOUT_* NotificationType in notification.entity.ts (lines 11-54) and no e-mail template. Ops admins are not told a vendor is waiting for money; vendors are not told a payout was approved, rejected (with reason) or failed by Stripe. The only place a rejection reason surfaces is the Payouts table in dashboard Settings (PayoutsSection.js:150-152 `row.failureReason`).
- **How to reproduce:** As vendor request a payout; as ops approve or reject it: no bell entry appears for either side and no e-mail is sent.
- **Impact:** Ops may leave payouts pending for days; vendors do not learn that their withdrawal was rejected or failed unless they open Settings > Payouts.
- **Evidence:**

```
payouts.service.ts:458-472
  @OnEvent('payout.requested') async onPayoutRequested(payload) { this.logger.log(`Payout requested: ${payload.payout.id}`); }
  @OnEvent('payout.completed') async onPayoutCompleted(payload) { this.logger.log(...) }
  @OnEvent('payout.failed') async onPayoutFailed(payload) { this.logger.log(...) }
grep -rn 'notif' backend/src/modules/payouts -> no matches
notification.entity.ts:11-54 has no PAYOUT_* member
```
- **Suggested fix (NOT applied):** Add PAYOUT_REQUESTED (notifyOps), PAYOUT_APPROVED/REJECTED/COMPLETED/FAILED (notifyStaff tenant, email:true with reason/amount) with en+ar content, and wire them in the payout event handlers.

### 292. [HIGH] Push token cache is never invalidated on logout and never expires, so a logged-out device (and the next account on it) keeps receiving the old user's pushes

- **Where:** `backend/src/modules/notifications/notifications.service.ts:388`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** getTokens() caches each user's FCM tokens under `tokens#${userId}` with cacheManager.set(...) and no TTL; CacheModule is registered without a ttl (app.module.ts:140-153) and @nestjs/cache-manager only applies `options.ttl`, so entries live forever. The only invalidation is in saveToken() (line 347). AuthService.logout (auth.service.ts:552-571) revokes the session row but never touches this cache, and the mobile app does not call messaging().deleteToken() on logout (profile.service.ts:84-87; no deleteToken usage anywhere). Result: after user A logs out, every notification for A is still pushed to that phone. If user B then logs in on the same phone, B's saveToken invalidates only `tokens#B`, so B's phone now shows A's booking/payment/social notifications (title + body) until A logs in somewhere and re-uploads a token.
- **How to reproduce:** Log in as A on a phone, receive a push, log out; trigger any notification for A (e.g. someone follows A): the phone still shows it. Log in as B on the same phone: B keeps seeing A's pushes.
- **Impact:** Private notification content (bookings, payments, who followed you) leaks to whoever holds the device after logout; users cannot stop pushes by logging out.
- **Evidence:**

```
notifications.service.ts:377-390  this.cacheManager.set(`tokens#${userId}`, userTokens);   // no ttl
notifications.service.ts:344-349  async saveToken(user, token) { ... this.invalidateUserTokens(user.id) }  // only caller
auth.service.ts:566-571  await this.sessionsRepository.update({ userId: user.id, id: user.sid }, { status: SessionStatus.REVOKED });  // no cache invalidation
app.module.ts:140-153  CacheModule.registerAsync({ ... useFactory: () => ({ store: new Cacheable({...}) }) })  // no ttl
node_modules/@nestjs/cache-manager/dist/cache.providers.js:26,41  ttl: options.ttl
```
- **Suggested fix (NOT applied):** Invalidate `tokens#${userId}` in logout/revokeAllSessions (and clear session.fcmToken), give the tokens cache a short TTL, and call messaging().deleteToken() on mobile logout.

### 293. [MEDIUM] Customer unseen-count is stuck at NULL for most users: badge/API always report 0 despite unread notifications

- **Where:** `backend/src/modules/users/users.service.ts:659`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** users.notificationsCount is a nullable integer with no DB default (migration 1764088979463-init.ts:74) and incrementNotificationsCount uses repository.increment, i.e. `SET notificationsCount = notificationsCount + 1`, which keeps NULL as NULL. The staff side was fixed with COALESCE (staff.service.ts:895-907) plus a backfill migration, the users side was not. Live DB: 5 of 7 users have NULL; the QA customer c782514d… has 31 unread notifications and GET /notifications/unseen-count returns {"count":0}; the SSE 'count' snapshot is also 0. (The mobile app currently renders no badge at all, so customers get no unread cue either way.)
- **How to reproduce:** Log in as +201099900001, GET /notifications (31 unread) then GET /notifications/unseen-count -> 0.
- **Impact:** Any client showing the unseen badge (SSE count, unseen-count endpoint) shows 0 for affected customers; markAllAsSeen writes 0 so the counter never recovers.
- **Evidence:**

```
users.service.ts:659-665  await this.usersRepository.increment({ id: In(userIds) }, 'notificationsCount', 1);
staff.service.ts:903  notificationsCount: () => 'COALESCE("notificationsCount", 0) + 1',
SQL: SELECT "notificationsCount", unread FROM users ... WHERE id='c782514d-b1eb-4a8d-87d8-feff30e293ab' -> |31   (count NULL, 31 unread)
GET /notifications/unseen-count (customer token) -> {"count":0}
```
- **Suggested fix (NOT applied):** Use COALESCE in incrementNotificationsCount (same as staff), add a backfill migration setting notificationsCount = count of unread rows, and make the column NOT NULL DEFAULT 0.

### 294. [MEDIUM] Vendor staff receive the customer-worded booking_cancelled text ('Your booking … refunded to your original payment method')

- **Where:** `backend/src/modules/notifications/content/i18n.ts:39`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The same i18n key is used for customers and for venue staff. handleBookingCancelled calls notifyStaff with type BOOKING_CANCELLED (bookings.service.ts:2060-2072), so the vendor's bell/push says 'Your booking at X on … was cancelled: venue closed. Any payment is refunded to your original payment method.' — even when the vendor's own staff cancelled it, and implying the vendor is being refunded. Confirmed on the live vendor account. The same applies to booking_reminder ('Your booking starts in {{time}}', line 55) sent to staff via notifyStaffBookingReminder (bookings.service.ts:1485-1498).
- **How to reproduce:** Cancel any booking; open the dashboard bell as the vendor.
- **Impact:** Vendors read misleading copy in every cancellation (and reminder) notification; ambiguous who cancelled and who is refunded.
- **Evidence:**

```
i18n.ts:39-43  booking_cancelled: { title: 'Booking Cancelled', content: 'Your booking at {{courtName}} on {{date}} at {{startTime}} was cancelled{{reasonSuffix}}. Any payment is refunded to your original payment method.' }
bookings.service.ts:2060-2063  this.notificationsService.notifyStaff({ tenantId..., branchId... }, { type: NotificationType.BOOKING_CANCELLED, ...
live GET /notifications (vendor Owner): "content": "Your booking at ملاعب الشروق كرة on Sep 25, 2026 at 7:00 AM was cancelled: venue closed. Any payment is refunded to your original payment method."
```
- **Suggested fix (NOT applied):** Add staff-specific keys (e.g. staff_booking_cancelled / staff_booking_reminder) with 'A booking at {{courtName}} … was cancelled by {{cancelledBy}}' wording, selected by recipient type in generateNotificationContent.

### 295. [MEDIUM] 'Join request submitted' notification is worded for the requester but delivered to the organiser

- **Where:** `backend/src/modules/notifications/content/i18n.ts:117`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleParticipantJoinRequestSubmitted sends BOOKING_JOIN_REQUEST_SUBMITTED to booking.userId (the organiser) — bookings.service.ts:1832-1836 — but the in-app/push text reads 'Join Request Submitted — Your request to join the booking has been submitted' (ar: 'تم تقديم طلبك للانضمام إلى الحجز'). The organiser therefore sees a message about *their own* request, with no requester name, while the e-mail for the same event correctly says '{requesterName} wants to join your booking'. The requester receives no in-app confirmation at all.
- **How to reproduce:** As customer B request to join A's open booking; A's notification list shows 'Your request to join the booking has been submitted'.
- **Impact:** Organisers of open matches do not understand they must approve someone; core open-match flow copy is wrong.
- **Evidence:**

```
i18n.ts:117-120  booking_join_request_submitted: { title: 'Join Request Submitted', content: 'Your request to join the booking has been submitted' }
bookings.service.ts:1832-1837  this.notificationsService.sendNotification(booking.userId, { type: NotificationType.BOOKING_JOIN_REQUEST_SUBMITTED, data: { bookingId, participantId, userId: participant.userId }, emailData: { requesterName, ...
booking-join-request-submitted.tsx:27  preview={`${requesterName} wants to join your booking`}
```
- **Suggested fix (NOT applied):** Change the content to '{{name}} requested to join your booking' (pass name in data) and consider a separate confirmation type for the requester.

### 296. [MEDIUM] Mobile 'Follow Back' button on a follow notification tries to follow yourself and always fails

- **Where:** `courtplusmobile/src/components/molecules/NotificationItem/NotificationItem.logic.ts:36`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleFollow calls followMutation({ id: item.userId }). On the Notification model, top-level userId is the notification *recipient* (the current user, models/Notification.ts:51); the follower's id is in item.data.userId (friendships.service.ts:226-231). The backend rejects the call with 'You cannot follow yourself' (friendships.service.ts:39-41), so the button only ever shows an error snackbar. Same mistake in handleMatchAccept (line 23, participantId: item.userId) — harmless only because participantId is stripped by the DTO whitelist.
- **How to reproduce:** Have another user follow you, open Notifications, tap 'Follow Back' -> snackbar 'You cannot follow yourself'.
- **Impact:** Every customer who taps Follow Back from Notifications gets an error; the social loop is broken from the notifications screen.
- **Evidence:**

```
NotificationItem.logic.ts:33-36  const handleFollow = useCallback(async () => { ... await followMutation({ id: item.userId ?? "" });
models/Notification.ts:51  userId: string;   // recipient
friendships.service.ts:226-231  sendNotification(followingId, { type: FOLLOW, data: { userId: followerId, firstName, lastName } })
friendships.service.ts:39-41  if (followerId === followingId) { throw new BadRequestException('You cannot follow yourself'); }
```
- **Suggested fix (NOT applied):** Use item.data.userId (and item.data.participantId / current user for accept); hide the button when the follow-back already exists.

### 297. [MEDIUM] All participant e-mail CTAs use the wrong URL scheme (courtplus:// vs court-plus) and the app has no deep-link routing

- **Where:** `backend/src/emails/booking-invitation.tsx:64`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** booking-invitation.tsx:64, booking-reminder-participant.tsx:79, booking-join-request-submitted.tsx:57, booking-join-request-approved.tsx:62, booking-invitation-accepted.tsx:64 and booking-invitation-rejected.tsx:61 link to `courtplus://bookings/<id>`. The app registers the scheme `court-plus` (ios/CourtPlus/Info.plist:36-38, android/app/src/main/AndroidManifest.xml:33) and defines no React Navigation `linking` config (grep for linking/getStateFromPath in courtplusmobile/src/navigation returns nothing), so even a correct scheme would not open the booking. Most mail clients also refuse to render custom-scheme buttons.
- **How to reproduce:** Receive a booking invitation e-mail and tap the button: nothing opens.
- **Impact:** Every 'View Booking / Review Request / View Invitation' button in customer e-mails is dead.
- **Evidence:**

```
booking-invitation.tsx:62-67  <Button ... href={`courtplus://bookings/${bookingId}`}>View Invitation</Button>
Info.plist:36-38  <key>CFBundleURLSchemes</key><array><string>court-plus</string>
AndroidManifest.xml:33  <data android:scheme="court-plus" />
```
- **Suggested fix (NOT applied):** Use an https universal link (e.g. https://courtplusapp.com/bookings/<id>) with app links/universal links configured, add a linking config for bookings/:id, and fall back to the store page.

### 298. [MEDIUM] Staff and review e-mail buttons link to routes that do not exist (dashboard /bookings/:id, website /reviews/:id)

- **Where:** `backend/src/emails/staff-booking-created.tsx:104`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** staff-booking-created.tsx:104, staff-booking-cancelled.tsx:108 and staff-booking-reminder.tsx:158 point to https://dashboard.courtplusapp.com/bookings/${bookingId}, but the dashboard router (dashboard/src/App.js:70-87) only has schedule, schedule/:id, courts/:id etc.; the catch-all `*` redirects to /home. review-added.tsx:72 points to https://courtplusapp.com/reviews/${reviewId}; the website (website/src/App.jsx:39-46) has no reviews route.
- **How to reproduce:** Open a staff booking e-mail and click the button.
- **Impact:** Vendors clicking 'View Booking Details' land on the dashboard home; 'View Review Details' 404s on the marketing site.
- **Evidence:**

```
staff-booking-created.tsx:104  href={`https://dashboard.courtplusapp.com/bookings/${bookingId}`}
review-added.tsx:72  href={`https://courtplusapp.com/reviews/${reviewId}`}
dashboard/src/App.js:82-87  <Route path="schedule" .../> <Route path="schedule/:id" .../> ... <Route path="*" element={<Navigate to="/home" replace />} />
website/src/App.jsx:40-46  routes: '', players, journal, faqs, contact-us, terms, privacy
```
- **Suggested fix (NOT applied):** Link to `${FRONTEND_URL}/schedule/${bookingId}` and `${FRONTEND_URL}/courts/${courtId}` (reviews tab) using the configured frontend URL instead of hard-coded hosts.

### 299. [MEDIUM] Participant e-mails are always sent in English: language lookup never loads preferences (TypeORM select without relations)

- **Where:** `backend/src/modules/users/users.service.ts:856`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** getUserEmailsWithLanguage selects `preferences: { language: true }` but passes no `relations`; TypeORM's buildSelect ignores relation keys (the relation branch is commented out in SelectQueryBuilder.js:2249-2262), so r.preferences is always undefined and language falls back to EN. Even if it worked, every template is hard-coded English/LTR (`<Html lang="en">`, base-email.tsx:36) so an Arabic subject would wrap an English body, and staff e-mails never pass a language at all (notifications.service.ts:471-475; email.service.ts:105 default 'en').
- **How to reproduce:** Set language=ar in /users/me/preferences, get invited to a booking: e-mail subject and body are English.
- **Impact:** Arabic-speaking customers and vendors receive English-only e-mails regardless of their language setting.
- **Evidence:**

```
users.service.ts:860-873  .find({ where: { id: In(userIds), email: Not(IsNull()) }, select: { email: true, preferences: { language: true } } })  // no relations
users.service.ts:876  language: r.preferences?.language || Language.EN,
node_modules/typeorm/query-builder/SelectQueryBuilder.js:2247-2262  else if (embed) {...} // } else if (relation) { ...commented out
base-email.tsx:36  <Html lang="en">
```
- **Suggested fix (NOT applied):** Load preferences with `relations: { preferences: true }` (or join sessions/preferences by deviceId), pass `language` to the templates and add Arabic copy with dir="rtl".

### 300. [MEDIUM] Dashboard notification titles/contents ignore the vendor's Arabic UI language

- **Where:** `backend/src/modules/notifications/notifications.service.ts:243`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** list() derives the language from usersService.getPreferences(userId, deviceId) — the *customer* preferences table. Staff have no preferences row, so getPreferences returns the default `language: Language.EN` (users.service.ts:781-792); the dashboard request sends no language parameter or Accept-Language (notification.service.js:6-13) and ListNotificationsDto has no language field. An Arabic-UI vendor therefore sees Arabic filter labels next to English notification titles/bodies, although Arabic strings exist in i18n.ts:372+.
- **How to reproduce:** Switch the dashboard to العربية and open the bell: item text is English.
- **Impact:** Mixed-language notification panel for Arabic vendors; Arabic translations are unreachable for staff.
- **Evidence:**

```
notifications.service.ts:235-247  const [notifications, total, preferences] = await Promise.all([..., this.usersService.getPreferences(userId, deviceId)]); ... this.populateNotifications(notifications, preferences?.language)
users.service.ts:781-787  const defaultPreferences = { userId, deviceId, language: Language.EN, ...
dashboard/src/service/notification.service.js:6-13  getNotifications(params) { return apiRequest({ method: "get", url: API_URL, params, customHeaders: authHeader() }); }
```
- **Suggested fix (NOT applied):** Accept a `lang` query param / Accept-Language in GET /notifications and /stream and use it for staff; store a staff language preference.

### 301. [MEDIUM] Notification preference toggles do not take effect until the push-token cache is rebuilt; 'Nearby Courts' toggle controls nothing

- **Where:** `backend/src/modules/users/users.service.ts:835`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** updatePreferences only deletes `user_preferences#…`, but the per-session `notifications` snapshot used for push filtering is cached inside `tokens#${userId}` (notifications.service.ts:377-390, read at 508-510) and that key is only cleared by saveToken. After turning 'Likes' off, pushes keep arriving until the app cold-starts and re-uploads its FCM token. In addition the `nearbyCourts` toggle exposed in the app (Notifications.logic.ts:60-64) has no corresponding entry in PREFERENCE_BY_TYPE (lines 55-73) and no producer, so it is a placebo.
- **How to reproduce:** Disable 'Likes' in Settings > Notifications, have someone like your post: push still arrives.
- **Impact:** Users who mute a category keep getting those pushes; one visible setting does nothing.
- **Evidence:**

```
users.service.ts:834-836  const saved = await this.preferencesRepository.save(preferences); await this.cacheManager.del(`user_preferences#${userId}_${deviceId}`);
notifications.service.ts:379-388  notifications: prefs?.notifications, ... this.cacheManager.set(`tokens#${userId}`, userTokens);
notifications.service.ts:508-510  const tokens = (await this.getTokens(userIds)).filter((t) => allowedByPreference(t, type));
notifications.service.ts:55-73  PREFERENCE_BY_TYPE = { FOLLOW: 'followers', POST_LIKE: 'likes', MOMENT_POSTED: 'updates', ... }  // no nearbyCourts
```
- **Suggested fix (NOT applied):** Invalidate `tokens#${userId}` in updatePreferences (or read preferences at send time), and remove/implement the nearbyCourts toggle.

### 302. [MEDIUM] Subscription payment failure notifies vendors in-app only — no e-mail, no template

- **Where:** `backend/src/modules/subscriptions/subscriptions.service.ts:663`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleInvoicePaymentFailed calls notifyStaff with `email: false`, and SUBSCRIPTION_PAYMENT_FAILED has no entry in notificationTypeToEmailTemplate (notifications.service.ts:85-96), so a vendor whose card is declined only learns it from the dashboard bell. Meanwhile new courts stay pending_payment (lines 570-576) and existing courts risk suspension. The dashboard does not register FCM tokens, so there is no push either.
- **How to reproduce:** Fail a subscription invoice in Stripe test mode; only a bell entry is created.
- **Impact:** Vendors can lose court visibility/billing standing without any out-of-app alert.
- **Evidence:**

```
subscriptions.service.ts:663-675  await this.notificationsService.notifyStaff({ tenantId: subscription.tenantId }, { email: false, type: NotificationType.SUBSCRIPTION_PAYMENT_FAILED, ...
notifications.service.ts:85-96  notificationTypeToEmailTemplate = { BOOKING_CREATED..., COURT_PENDING_PAYMENT: ... }  // no SUBSCRIPTION_PAYMENT_FAILED
```
- **Suggested fix (NOT applied):** Add a subscription-payment-failed e-mail template (amount, retry date, Billing link) and send it with email:true.

### 303. [MEDIUM] Participants who left a match still receive its reminders, start/end, joins and cancellation e-mails

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1461`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** notifyParticipants fetches every participant row with no status filter (participants.service.ts:86-98 default where {}). Leaving a booking sets status CANCELLED and keeps the row (bookings.service.ts:1056), unlike removal/rejection which delete it (1147, 1315, 1410). So a user who left keeps getting BOOKING_REMINDER (processor 86-105), BOOKING_STARTED/ENDED (processor 165-169, 209-213), BOOKING_JOINED/ENTERED, and on cancellation the push 'Your booking … was cancelled … Any payment is refunded' plus the participant e-mail (2037-2058). Pending invitees who never accepted are also included.
- **How to reproduce:** Join a match, leave it, then have the organiser cancel it: you receive the cancellation push and e-mail.
- **Impact:** Ex-participants get confusing reminders and refund promises for a match they left; noise erodes trust in notifications.
- **Evidence:**

```
bookings.service.ts:1461  const participants = await this.participantsService.getParticipants(bookingId, {}, whereCondition);
participants.service.ts:94-97  return this.participantsRepository.find({ where: { bookingId, ...where }, relations });
bookings.service.ts:1056  this.participantsService.transitionParticipantStatus(participant, ParticipantStatus.CANCELLED);
```
- **Suggested fix (NOT applied):** Filter notifyParticipants to active statuses (READY, ENTERED, PENDING_PAYMENT/APPROVAL as appropriate) and exclude CANCELLED/NO_SHOW.

### 304. [MEDIUM] Group e-mails put every recipient in the To: header, exposing customers' addresses to each other

- **Where:** `backend/src/modules/notifications/notifications.service.ts:569`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** sendParticipantEmails groups a booking's participants by language and sends one message with `to: emails`; MailService passes the array straight to SES Destination.ToAddresses / nodemailer `to`. Every participant of an open match (strangers) can see the e-mail addresses of all other participants. Staff broadcasts (line 669-673) behave the same.
- **How to reproduce:** Create an open match with 3 participants who have e-mails; cancel it; inspect a participant's received e-mail headers.
- **Impact:** Personal data (e-mail addresses) disclosed between unrelated customers; GDPR/PDPL exposure.
- **Evidence:**

```
notifications.service.ts:569-577  Object.entries(emailsByLanguage).map(([language, emails]) => this.emailService.sendEmail({ to: emails, template, data: emailData, language }))
mail.service.ts:80  Destination: { ToAddresses: to },
mail.service.ts:69-72  return this.transporter.sendMail({ from: this.from, to, subject, html, ...
```
- **Suggested fix (NOT applied):** Send one message per recipient (or use Bcc), which also allows per-recipient language.

### 305. [MEDIUM] Booking reminder for venue staff only reaches branch-linked staffers; tenant owners without a branch link are skipped

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1485`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** notifyStaffBookingReminder calls notifyStaff({ branchId }) without tenantId. getStaff only unions tenant-level staff when tenantId is also passed (staff.service.ts:583-603), so owners created at tenant level (no branch_staffers row) get no reminder, while BOOKING_CREATED/BOOKING_CANCELLED pass both ids (1979-1980, 2057) and do reach them.
- **How to reproduce:** Tenant with only an Owner and no branch staffer link: create a booking 61 min ahead; no BOOKING_REMINDER row is created for the owner.
- **Impact:** Owner-only tenants (the common small-vendor case) receive booking created/cancelled but never the reminder.
- **Evidence:**

```
bookings.service.ts:1485-1486  await this.notificationsService.notifyStaff({ branchId: booking.court.branch.id }, {
staff.service.ts:592-596  // Branch links are not guaranteed to exist for every staffer (e.g. owner created at tenant level). When a tenantId is also provided, union with tenant-level staff
bookings.service.ts:1979-1980  this.notificationsService.notifyStaff({ tenantId: booking.court.branch.tenantId, branchId: booking.court.branch.id },
```
- **Suggested fix (NOT applied):** Pass both tenantId and branchId in notifyStaffBookingReminder.

### 306. [LOW] Staff booking e-mails ship blank fields, placeholder text, wrong numbering and an unconditional 'refunded' status

- **Where:** `backend/src/emails/staff-booking-created.tsx:86`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** staff-booking-created renders 'Phone:', 'Email:' and 'Additional Notes:' rows although the caller never passes customerPhone/customerEmail/additionalNotes (bookings.service.ts:1985-2000) — verified render shows `Phone:</strong>` empty; paymentAmount has no currency and paymentStatus is the raw enum. staff-booking-cancelled lists 'Required Actions 1., 3., 4.' (lines 75-83), a Contact Information block filled with '' (2084-2086) and `refundStatus: 'Refunded to the original payment method'` for every booking incl. unpaid/staff-created ones (2083). Four templates end with 'Address: to be added' (staff-booking-created:118, staff-booking-cancelled:122, staff-booking-reminder:172, review-added:92), '© 2025' is hard-coded, and each template prints its own copyright line on top of the shared Footer. review-added greets 'Hello Team,' (reviews.service.ts:266 staffName:'Team') and asks staff to 'respond to this review' though no reply feature exists.
- **How to reproduce:** Create then cancel a booking as staff; read the two e-mails.
- **Impact:** Vendor-facing e-mails look unfinished and state a refund that may not exist.
- **Evidence:**

```
staff-booking-created.tsx:86-91  <strong>Phone:</strong> {customerPhone} ... <strong>Email:</strong> {customerEmail}
bookings.service.ts:1988-2000  emailData: { bookingId, courtName, branchName, date, startTime, endTime, numberOfPeople, customerName, paymentStatus, paymentAmount }
bookings.service.ts:2083-2086  refundStatus: 'Refunded to the original payment method', contactPerson: '', contactPhone: '', contactEmail: '',
staff-booking-cancelled.tsx:75-83  1. Notify any on-site staff ... 3. Remove any booking-specific ... 4. Direct any player inquiries
staff-booking-created.tsx:118  Address: to be added
```
- **Suggested fix (NOT applied):** Pass real customer contact data or drop the rows; compute refundStatus from the actual payment; remove placeholder/copyright duplicates.

### 307. [LOW] Reminder duration and dates are English inside Arabic notifications

- **Where:** `backend/src/modules/bookings/bookings.processor.ts:83`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The processor builds `reminderTime` as '1 hour' / '30 minutes' in English and the Arabic template interpolates it verbatim ('يبدأ حجزك خلال 1 hour'). Dates/times are formatted with dayjs 'MMM DD, YYYY' / 'h:mm A' without locale (bookings.service.ts:2032-2034), producing 'يوم Sep 27, 2026 الساعة 8:00 PM' in Arabic cancellation notifications.
- **How to reproduce:** Set language=ar and receive a reminder push.
- **Impact:** Mixed-language, LTR fragments inside RTL pushes for Arabic users.
- **Evidence:**

```
bookings.processor.ts:83-85  const reminderTime = minutesBeforeBooking >= 60 ? `${Math.floor(minutesBeforeBooking / 60)} hour${...}` : `${minutesBeforeBooking} minutes`;
i18n.ts:386-388  booking_reminder: { title: 'تذكير الحجز', content: 'يبدأ حجزك خلال {{time}}' }
bookings.service.ts:2032-2034  date: startDateLocal.format('MMM DD, YYYY'), startTime: startDateLocal.format('h:mm A'),
```
- **Suggested fix (NOT applied):** Pass minutes as a number and format with i18next plural/relative keys per language; format dates with the recipient's locale at render time.

### 308. [LOW] Dashboard 'Unread' view cannot load older pages, showing 'You're all caught up' while unread items exist

- **Where:** `dashboard/src/components/layout/NotificationsDropdown.js:353`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The Unread segment filters only the pages already loaded (line 202-203), and the Load more button is rendered only when `visible.length > 0`. With 10 read items on page 1 and unread items on later pages, the panel shows the empty state and offers no way to load more.
- **How to reproduce:** Mark the 10 newest as read, keep older unread, switch to Unread.
- **Impact:** Vendors think they have no unread notifications when they do.
- **Evidence:**

```
NotificationsDropdown.js:202-203  const visible = view === "unread" ? notifications.filter((n) => !n.readAt) : notifications;
NotificationsDropdown.js:353  {hasNextPage && visible.length > 0 && (
```
- **Suggested fix (NOT applied):** Add a server-side `unread=true` filter (readAt IS NULL) and always show Load more when hasNextPage.

### 309. [LOW] Ops bell shows only the newest 15 notifications with no pagination; 'Mark all as read' disabled when those 15 are read

- **Where:** `ops/src/components/NotificationsBell.tsx:69`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** listNotifications({ page: 1, pageSize: 15 }) is the only fetch; there is no Load more. `unreadItems` is computed from those 15, so the 'Mark all as read' button is disabled even when older unread items exist, and older pending-approval alerts are unreachable from the bell.
- **Impact:** Ops admins can miss older court submissions / unsuspend requests.
- **Evidence:**

```
NotificationsBell.tsx:67-72  queryFn: () => listNotifications({ page: 1, pageSize: 15 }),
NotificationsBell.tsx:99  const unreadItems = (data?.items ?? []).filter((n) => !n.readAt);
NotificationsBell.tsx:137  disabled={unreadItems.length === 0}
```
- **Suggested fix (NOT applied):** Paginate with an infinite query and base the button on the unseen/unread count from the server.

### 310. [LOW] Vendor notification filter lists ops-only types the vendor can never receive

- **Where:** `dashboard/src/components/layout/NotificationsDropdown.js:56`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** NOTIFICATION_TYPES includes court_pending_approval, court_resubmitted and tenant_unsuspend_requested, which are produced only via notifyOps (subscriptions.service.ts:716-727, ops.service.ts:355-369, tenants.service.ts:124-133). Selecting them always yields an empty list.
- **Impact:** Confusing dead filter options for vendors.
- **Evidence:**

```
NotificationsDropdown.js:55-59  const NOTIFICATION_TYPES = ["court_pending_approval", "court_approved", ... "court_resubmitted", ... "tenant_unsuspend_requested",
subscriptions.service.ts:717-718  await this.notificationsService.notifyOps({ type: NotificationType.COURT_PENDING_APPROVAL,
```
- **Suggested fix (NOT applied):** Remove the three ops-only types from the vendor filter.

### 311. [LOW] Mobile invitation 'Accept' button ignores state, offers no decline, and does not refresh bookings

- **Where:** `courtplusmobile/src/components/molecules/NotificationItem/NotificationItem.utils.ts:9`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Every booking_invitation notification renders an Accept button forever (no check of participant status or readAt). After accepting, the button remains; a second tap returns ALREADY_RESPONDED as an error snackbar. There is no Decline. On success only getNotifications is invalidated, not getBookings (MatchInvitationCard.logic.ts:30 invalidates bookings), so the Activity tab is stale; for split bookings the user is not guided to pay.
- **Impact:** Confusing double-accept errors; stale booking list after accepting from Notifications.
- **Evidence:**

```
NotificationItem.utils.ts:9-12  ["booking_invitation"]: { title: t("notifications.accept"), onPress: onAccept },
NotificationItem.logic.ts:17-31  await respondMatchMutation({ id: item.data.bookingId ?? "", accept: true, participantId: item.userId ?? "" }); invalidateQuery("getNotifications");
```
- **Suggested fix (NOT applied):** Hide/disable the button once responded (use relations.booking/participant status), add Decline, invalidate getBookings and route to payment for split matches.

### 312. [LOW] Mobile notification rows have no read/unread state or badge, and text renders a double period

- **Where:** `courtplusmobile/src/components/molecules/NotificationItem/NotificationItem.component.tsx:40`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The Notification model has no readAt field (models/Notification.ts:46-69) and the row never shows an unread indicator; the Home bell (Home.component.tsx:50-52) has no count. The row text is `${item.content}. ${formattedTime}` while several contents already end with '.', e.g. booking_cancelled -> '…original payment method.. 2h ago'.
- **Impact:** Customers cannot tell new from old notifications; sloppy punctuation.
- **Evidence:**

```
NotificationItem.component.tsx:40  text={`${item.content}. ${formattedTime}`}
i18n.ts:41-42  '... Any payment is refunded to your original payment method.'
models/Notification.ts:46-69  export type Notification = { createdAt; updatedAt; id; type; userId; resourceId?; count?; content; image; title; relations; data }  // no readAt
```
- **Suggested fix (NOT applied):** Add readAt to the model, style unread rows, show the unseen count on the bell, and avoid appending '.' when content already ends with punctuation.

### 313. [LOW] Join-request notification is fired without await (unhandled rejection, may be lost)

- **Where:** `backend/src/modules/bookings/bookings.service.ts:1832`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleParticipantJoinRequestSubmitted calls this.notificationsService.sendNotification(...) without await or catch; a DB error becomes an unhandled promise rejection and the event handler resolves before the row exists. Every other handler awaits inside Promise.allSettled.
- **Impact:** Organiser may silently not get the join request; process-level unhandled rejection warnings.
- **Evidence:**

```
bookings.service.ts:1832-1836  this.notificationsService.sendNotification(booking.userId, { type: NotificationType.BOOKING_JOIN_REQUEST_SUBMITTED, ...
```
- **Suggested fix (NOT applied):** await it inside try/catch or Promise.allSettled like the sibling handlers.

### 314. [LOW] Invitation-accepted notification/e-mail is broadcast to all participants as 'accepted YOUR invitation' with a hard-coded max of 10 players

- **Where:** `backend/src/modules/bookings/bookings.service.ts:2111`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleParticipantAccepted notifies every participant except the accepter with BOOKING_INVITATION_ACCEPTED ('{{name}} accepted your booking invitation') and the e-mail 'has accepted your invitation', although only the organiser invited them; emailData.maxParticipants is hard-coded to 10.
- **Impact:** Non-organiser participants get inaccurate copy and a wrong capacity figure.
- **Evidence:**

```
bookings.service.ts:2111-2126  this.notifyParticipants(booking.id, NotificationType.BOOKING_INVITATION_ACCEPTED, { userId, bookingId, name }, [userId], { acceptedByName, ..., currentParticipants: ..., maxParticipants: 10 })
```
- **Suggested fix (NOT applied):** Send BOOKING_INVITATION_ACCEPTED to the organiser only and BOOKING_JOINED to the others; pass the booking's real capacity.

### 315. [LOW] iOS push badge is always 1, never the real unseen count

- **Where:** `backend/src/modules/shared/services/firebase.service.ts:77`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The APNs payload hard-codes `badge: 1`, so the app icon shows '1' no matter how many unseen notifications exist and is never cleared by a push.
- **Impact:** Misleading app-icon badge on iOS.
- **Evidence:**

```
firebase.service.ts:75-77  aps: { sound: 'default', badge: 1,
```
- **Suggested fix (NOT applied):** Pass the recipient's unseen count (already computed in publishRealtime) as the badge, or omit it.

### 316. [LOW] Open SSE streams outlive logout/deactivation for up to 15 minutes

- **Where:** `backend/src/modules/notifications/notifications.service.ts:174`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The JWT denylist is only consulted when the stream is opened (jwt.strategy.ts:39-58); an already-open /notifications/stream keeps emitting count/notification events until the 15-minute lifetime cap or client close, so a deactivated ops admin or a logged-out vendor tab (if not closed) keeps receiving realtime events.
- **Impact:** Bounded (15 min) leakage of new-notification metadata after access is revoked.
- **Evidence:**

```
notifications.service.ts:142  STREAM_MAX_LIFETIME_MS = 15 * 60 * 1000;
notifications.service.ts:178-180  return merge(snapshot$, events$, heartbeat$).pipe(takeUntil(merge(closed$, expired$, this.realtime.shutdown$)));
```
- **Suggested fix (NOT applied):** Publish a 'revoked' realtime event on logout/deactivation and complete matching streams, or re-check the denylist on each emission.

---

## 12. Mobile booking and open-match screens

34 issues — 3 critical, 8 high, 12 medium, 11 low.

### 317. [CRITICAL] Second 'Pay your part' on a stale Booking Details screen charges the customer twice; backend /pay has no status guard

- **Where:** `courtplusmobile/src/screens/ActivityFlow/BookingDetails/BookingDetails.logic.ts:136`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** BookingDetails renders from `route.params.item` (a snapshot) and never refetches. After a successful split payment the button is still "Pay your part" (participant status in the snapshot is still pending_payment). Tapping it again calls POST /bookings/:id/pay; the controller only checks that the participant exists (bookings.controller.ts:185-195) and `pay()` (bookings.service.ts:1228-1237) creates a fresh automatic-capture PaymentIntent regardless of participant status. The sheet opens, the card is charged again, and the webhook then throws on `transitionParticipantStatus(READY -> READY)` (bookings.service.ts:504, participant-state-machine.ts:80-82), so the second charge is neither recorded nor refunded. The same path exists from the Open Match list: a READY participant of an open booking still sees "Book now" (OpenMatch.component.tsx:35-43) which also calls /pay.
- **How to reproduce:** Invite a friend to a split booking; as the friend open Current Bookings > booking > 'Pay your part', pay with test card, stay on the screen, tap 'Pay your part' again and pay. Two charges in Stripe, one recorded.
- **Impact:** A customer who pays their share and taps the (still visible) Pay button again is charged the share a second time; the money is captured by Stripe but the platform never links or refunds it.
- **Evidence:**

```
BookingDetails.logic.ts:19  const { item } = route.params;
BookingDetails.logic.ts:136-140  if (currentParticipant?.status === ParticipantStatus.PENDING_PAYMENT) { return { title: t("booking.payPart"), onPress: handlePay }; }
bookings.controller.ts:186-195  const participant = participants.find(p => p.userId === user.id); ... return this.bookingsService.pay(participant);
bookings.service.ts:1228-1237  async pay(participant) { ... return this.paymentsService.createPaymentIntentDetails({ amount, bookingId: booking.id, currency }, user); }
participant-state-machine.ts:80-82  if (from === to) { return false; }
```
- **Suggested fix (NOT applied):** Refetch the booking after payment (GET /bookings/:id) and drive buttons from fresh data; in the API reject /pay unless participant.status === PENDING_PAYMENT and no COMPLETED/PENDING payment already exists for that participant.

### 318. [CRITICAL] Open-match organiser with no invited friends is auto-charged 100% of the court, then joiners pay again on top

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/ConfirmMatch/ConfirmMatch.logic.ts:29`
- **Status:** **Verified by hand** against the running system, database or Stripe API.
- **Problem:** ConfirmMatch always sends paymentType=split with only the explicitly invited friends as participants (usually none for an open match). Backend `book()` computes the organiser share as `bookingAmount / (participants.length + 1)` = the full amount when nobody is invited, and `holdAmount = 0`, which makes the Stripe intent `capture_method: 'automatic'`. The organiser's card is captured for the whole court price immediately. Every later joiner is charged `total / booking.participants.length` via `pay()` (bookings.service.ts:1231-1233), so a 2v2 match collects 100% + 50% + 33% + 25% of the court price. The screen labels this full amount "Pay your part".
- **How to reproduce:** Open Match > Start a match, do not add players, 2 vs 2, Continue to payment: the sheet asks for the full court price and captures it. Have another user join and pay: a second charge for half the price is collected.
- **Impact:** Organisers of open matches are overcharged (never refunded when players join) and the venue is paid more than the court price; the app shows the wrong 'part'.
- **Evidence:**

```
ConfirmMatch.logic.ts:29-31  const totalParticipants = participants?.length ? participants?.length + 1 : 1; const totalAmountSplitted = totalAmount / totalParticipants;
ConfirmMatch.logic.ts:40  paymentType: PaymentType.SPLIT,
bookings.service.ts:217-218  const playerAmount = bookingAmount / (participants.length + 1); const holdAmount = bookingAmount - playerAmount;
stripe.service.ts:79  capture_method: holdAmount ? 'manual' : 'automatic',
bookings.service.ts:1231-1233  const amount = (booking.hourlyRate * (booking.duration / BOOKING.MINUTES_PER_HOUR)) / booking.participants.length;
```
- **Suggested fix (NOT applied):** Compute the open-match share from seats (playersASide*2) or from the intended participant count, keep the organiser on a manual-capture hold, and show the computed share on ConfirmMatch; reconcile joiner shares against that same denominator.

### 319. [CRITICAL] Booking Details / summary cards crash when the court has no own location (court.location is null)

- **Where:** `courtplusmobile/src/screens/ActivityFlow/BookingDetails/BookingDetails.component.tsx:82`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** `mapCourts` returns `location: null` when a court has no locationId (courts.service.ts:445-451; `locationId` is nullable, 2 of 15 seeded courts have none). The mobile code dereferences `court.location.name` with `??` guarding only `name`, not `location`, so it throws `Cannot read property 'name' of null`. Live check as QA customer +201099900001: all 7 bookings in Booking History return `court.location = null`, so tapping any of them crashes Booking Details. The same expression is in CourtBookingCard (used by Booking Summary step 4 and by MatchInvitationCard), so booking one of these courts crashes at the payment step and invitees crash on the Current tab.
- **How to reproduce:** Log in as +201099900001, Activity > Booking History > tap any booking. Or book a court whose branch created it without a location and reach step 4.
- **Impact:** Customers cannot open booking details, cannot finish booking such courts, and invitees see a red screen; the venue loses bookings on those courts.
- **Evidence:**

```
BookingDetails.component.tsx:82  text={item.court.location.name ?? ""}
CourtBookingCard.component.tsx:40  text={courtData.location.name ?? ""}
courts.service.ts:445-451  location: court.location ? { ...court.location, lng: ..., lat: ... } : null,
court.entity.ts:154-155  @Column('uuid', { nullable: true }) locationId?: string;
live GET /bookings?status=completed,cancelled -> 7 items, every one 'courtLoc= None'
```
- **Suggested fix (NOT applied):** Use optional chaining and fall back to the branch location (`item.court.location?.name ?? item.court.branch?.location?.name ?? ''`) in BookingDetails, CourtBookingCard and OpenMatchItem; optionally have mapCourts fall back to the branch location.

### 320. [HIGH] Joining an open match is impossible: 'Book now' calls /bookings/:id/pay instead of /join

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/OpenMatch/OpenMatch.logic.ts:38`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The app has no call to POST /bookings/:id/join anywhere (grep for 'join' in src returns only notification type strings). The Open Match list's only CTA runs `payMatchMutation` -> POST /bookings/:id/pay. For a user who is not yet a participant the controller throws PARTICIPANT_NOT_FOUND, so every 'Book now' tap shows "We couldn't find that participant." The whole open-match discovery/join feature (gender/level checks, auto-accept, join requests) is unreachable from the app.
- **How to reproduce:** Open Match tab > tap 'Book now' on any match you did not create -> snackbar 'We couldn't find that participant.'
- **Impact:** No customer can join any open match; the headline social feature is dead and shows an error toast.
- **Evidence:**

```
OpenMatch.logic.ts:38-40  const response = await payMatchMutation({ id: booking.id });
OpenMatchItem.component.tsx:101-104  <CustomButton title="Book now" ... onPress={onBookNowPress}
bookings.controller.ts:186-188  const participant = participants.find(p => p.userId === user.id); if (!participant) { throw new NotFoundException(PARTICIPANT_NOT_FOUND); }
bookings.controller.ts:329-341  @Post(':id/join') ... joinBooking(...)  // never called by the app
```
- **Suggested fix (NOT applied):** Add a joinMatch service (POST /bookings/:id/join), call it from 'Book now', present the payment sheet only when the response contains clientSecret, otherwise show a 'request sent, waiting for organiser' state.

### 321. [HIGH] Retrying payment after cancelling/failing the Stripe sheet is blocked for 10 minutes by the user's own slot reservation

- **Where:** `courtplusmobile/src/screens/CourtFlow/Booking/BookingSummary/BookingSummary.logic.ts:50`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Every 'Pay' tap posts a new booking request. `book()` reserves the slot for 600 s before creating the PaymentIntent. `reserveSlot` refuses when ANY live reservation overlaps, including the caller's own (only `isSlotReservedByOther` excludes self), so after the customer cancels the sheet (returns silently) or lands on BookingFailed > 'Try Again', the next 'Pay' gets 400 SLOT_ALREADY_RESERVED ("That slot is already reserved. Please pick another time.") until the reservation expires. The abandoned PaymentIntent is also left to the 600 s cancellation job.
- **How to reproduce:** Book a court > Pay > dismiss the Stripe sheet > tap Pay again -> 'That slot is already reserved'.
- **Impact:** A declined card or an accidental dismiss locks the customer out of the slot they are trying to pay for; they are told the slot is taken and abandon the booking.
- **Evidence:**

```
BookingSummary.logic.ts:50-59  const response = await createBookingMutation({ courtId..., startAt..., duration..., participants..., paymentType });
useStripePayment.ts:65-67  const isCancelled = didCancel || error?.code === "Canceled"; if (isCancelled) { return; }
bookings.service.ts:196-201  const reserved = await this.slotsService.reserveSlot(...); if (!reserved) { ... throw new BadRequestException(SLOT_ALREADY_RESERVED); }
slots.service.ts:128-137  const existingReservation = await this.slotReservationRepository.createQueryBuilder('reservation').where('reservation.courtId = :courtId'...).andWhere('reservation.expiresAt > :now'...).getOne(); if (existingReservation) { return false; }
```
- **Suggested fix (NOT applied):** In reserveSlot treat a live reservation by the same user as renewable (update expiresAt and return true), or reuse/cancel the previous intent; on the client keep the first payment response and re-present the same sheet on retry.

### 322. [HIGH] Open Match tab lists finished, past and already-joined matches with an active 'Book now'

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/OpenMatch/OpenMatch.logic.ts:20`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The app requests /bookings/open with only `page`, and the backend query only adds `booking.open = true` plus court visibility; there is no status or start-date filter and no exclusion of bookings the user already participates in. Live check as the QA customer: 3 items returned, all status `completed` with startDate 2026-07-26/27 (two months ago), one containing a pending_approval participant. OpenMatchItem shows them as bookable.
- **How to reproduce:** Log in as +201099900001, open the Open Match tab: three completed July matches are listed with 'Book now'.
- **Impact:** Customers see dead matches, try to book them and get errors; the list never reflects what is actually joinable.
- **Evidence:**

```
OpenMatch.logic.ts:20  } = useGetOpenBookings({ page: 1 });
bookings.service.ts:706-712  if (user.type === UserType.Customer && isLookingForOpenBookings) { ... qb.andWhere('court.status = :visibleCourtStatus'...); qb.andWhere('branch.suspendedAt IS NULL'); qb.andWhere('tenant.blockedAt IS NULL'); }
bookings.service.ts:724-726  if (openBookings) { qb.andWhere('booking.open = :open', { open: openBookings }); }
live GET /bookings/open?page=1 -> aa000000 completed 2026-07-27T04:00:00.000Z open=True ... ; 67b85659 completed 2026-07-26T11:00:00.000Z
```
- **Suggested fix (NOT applied):** Send `status=pending&startDate=<today>` (and sortBy startDate ASC) from the app and/or default the /bookings/open query to future, pending, non-full bookings excluding the caller's own participations.

### 323. [HIGH] Time-slot selection books a range between the first and last chip, so two adjacent 30-min chips book only 30 minutes and gaps are silently included

- **Where:** `courtplusmobile/src/utils/helpers.ts:604`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Slots are rendered as individual 30-minute chips and can be toggled in any order/non-contiguously. `getSlotsDurationMinutes` treats the selection as range boundaries: 1 chip = 30 min, N chips = lastStart - firstStart. Selecting 10:00 and 10:30 books 10:00-10:30 (the 10:30 chip is selected but not booked); selecting 10:00 and 12:00 books two hours including 10:30-11:30 even if those chips were unavailable (the API then rejects with SLOT_OVERLAPS_WITH_BOOKING after the user reaches the pay step). The ChooseTime header never reflects the selection: it always prints '30 mins' and the bare hourly rate with a hard-coded 'SR' prefix.
- **How to reproduce:** Book a court, tap 10:00 and 10:30, Next: summary shows 10:00 - 10:30 and the price of 30 minutes. Tap 10:00 and 12:00 with 11:00 greyed out, continue to Pay: 409 overlap error.
- **Impact:** Customers book and pay for a different duration than the chips they selected, or hit a late overlap error; the total shown on step 1 is always wrong for more than one chip.
- **Evidence:**

```
helpers.ts:604-611  if (slots.length === 1) return SLOT_DURATION_MINUTES; ... return timeToMinutes(sortedSlots[sortedSlots.length - 1].startTime) - timeToMinutes(sortedSlots[0].startTime);
ChooseTime.logic.ts:42-46  if (timeSlotIndex === -1) { newSlots.push(slot); } else { newSlots.splice(timeSlotIndex, 1); }
ChooseTime.component.tsx:58  text={`30 ${t("general.mins")}`}
ChooseTime.component.tsx:72  text={`SR ${courtData.hourlyRate}`}
```
- **Suggested fix (NOT applied):** Make each chip a 30-min unit (duration = chips*30), enforce contiguity (only allow selecting a chip adjacent to the current selection) and compute the header duration/cost from the selection using formatCurrency.

### 324. [HIGH] Creating an open match fails with a generic error unless a gender is explicitly chosen; no 'mixed' option exists

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/ConfirmMatch/ConfirmMatch.logic.ts:47`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** NewMatch defaults `selectedGender` to '' and shows the label 'Male & Female'. ConfirmMatch forwards `gender: ''` with `open: true`; the DTO validates `@IsEnum(Gender) @ValidateIf(o => o.open)` with no IsOptional, so class-validator rejects the request. The exception filter returns the validator message as `code`, which the app cannot map, so the user sees 'Something went wrong. Please try again.' There is also no way to send Gender.OTHER (the only value the join check treats as open to everyone, bookings.service.ts:1615-1618).
- **How to reproduce:** Open Match > Start a match > pick court, date, time, game type > Create Match > Continue to payment -> 'Something went wrong'.
- **Impact:** The default path of the New Match screen cannot create a match, and mixed-gender matches cannot be created at all.
- **Evidence:**

```
NewMatch.logic.tsx:41  const [selectedGender, setSelectedGender] = useState<string>("");
NewMatch.logic.tsx:147-150  text={ !selectedGender ? t("openMatch.maleFemale") : mapGenderValue(selectedGender)?.title ?? "" }
ConfirmMatch.logic.ts:45-47  open: true, level: level?.key ?? "", gender,
create-booking.dto.ts:107-109  @IsEnum(Gender) @ValidateIf((o) => o.open) gender?: Gender;
exception-filter.ts:30  code = (Array.isArray(message) ? message[0] : message) ?? exception.message;
```
- **Suggested fix (NOT applied):** Map the 'Male & Female' choice to Gender.OTHER (or omit gender and make the DTO @IsOptional), and surface validation messages meaningfully.

### 325. [HIGH] 'Members need to be accepted' switch is inverted and there is no UI to approve join requests

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/NewMatch/NewMatch.logic.tsx:30`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The switch labelled 'Members need to be accepted' is bound directly to `autoAccept` (default true). Switch ON therefore sends autoAccept=true, which the backend treats as 'no approval needed'; switching it OFF creates a match whose joiners land in pending_approval. The organiser can never act on those requests: the app never calls POST /bookings/:id/request/respond (no reference in src) and the join-request notification routes to the placeholder Activity Log. The seeded DB already contains such a stuck participant (pending_approval).
- **How to reproduce:** Create a match with the switch OFF, have another user join via API: they stay pending_approval with no screen to approve them.
- **Impact:** Organisers get the opposite of what they toggle, and any match that does require approval traps joiners forever.
- **Evidence:**

```
NewMatch.logic.tsx:30  const [autoAccept, setAutoAccept] = useState(true);
NewMatch.component.tsx:117-127  text={t("openMatch.membersAccepted")} ... <CustomSwitch value={autoAccept} onValueChange={setAutoAccept}
ConfirmMatch.logic.ts:48  autoAccept,
bookings.service.ts:1650-1652  if (!booking.autoAccept) { participant = await this.participantsService.create({ ... status: ParticipantStatus.PENDING_APPROVAL });
SQL: participants on open bookings -> pending_approval|1
```
- **Suggested fix (NOT applied):** Send `autoAccept: !requiresApproval`, and add an approve/reject UI (POST /bookings/:id/request/respond) on Booking Details for participants in pending_approval.

### 326. [HIGH] Invitation card and Booking Details show the whole booking total instead of the customer's share; 'Payment status' row prints an amount

- **Where:** `courtplusmobile/src/components/molecules/MatchInvitationCard/MatchInvitationCard.component.tsx:52`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** For split bookings the invitee is charged `total / participants` (bookings.service.ts:1231-1233), but the invitation card's headline price is `item.totalAmount` (the full court price). Booking Details prints `item.totalAmount` three times — as 'Court cost', as 'Total' and as the value of the 'Payment Status' row — never the user's own share and never the actual paymentStatus (paid/unpaid/refunded).
- **How to reproduce:** Invite a friend to a split booking; as the friend look at the Current tab card and Booking Details: SAR 500 shown although the share is SAR 250 and the status row shows 'SAR 500'.
- **Impact:** Invitees think they must pay the full court price before accepting; nobody can see whether a booking is paid or refunded.
- **Evidence:**

```
MatchInvitationCard.component.tsx:52  text={formatCurrency(Number(item.totalAmount))}
BookingDetails.component.tsx:177  text={formatCurrency(Number(item.totalAmount))}
BookingDetails.component.tsx:192  text={formatCurrency(Number(item.totalAmount))}
BookingDetails.component.tsx:198-209  title={t("activity.paymentStatus")} ... right={ <CustomText text={formatCurrency(Number(item.totalAmount))} ...
```
- **Suggested fix (NOT applied):** Show the participant share (`totalAmount / activeParticipants`) for split bookings and render `item.paymentStatus` (mapped through translations) in the status row.

### 327. [HIGH] Activity Log screen is a placeholder with fake hard-coded data, yet every booking/payment notification routes there

- **Where:** `courtplusmobile/src/screens/ActivityFlow/ActivityLog/ActivityLog.component.tsx:20`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The screen fetches events but renders a single static ActivityLogItem with fixed text ('Elizabeth Chandra entering to the booked court', 'Tennis Outdoor Court A', '2 days ago') and a hard-coded English title. It is reachable from the Booking Details header icon and is the target of every booking/payment push notification tap (notificationNavigation.ts:113-114). The events hook is also broken for later use: its queryFn ignores pageParam so it would refetch page 1 endlessly once 10+ events exist.
- **How to reproduce:** Tap the history icon on Booking Details, or tap any booking push notification.
- **Impact:** Customers tapping a 'payment succeeded' or 'booking cancelled' notification land on fake data about a stranger.
- **Evidence:**

```
ActivityLog.component.tsx:18-20  <Header whiteColor title="Activity Log" /> ... <ActivityLogItem />
ActivityLogItem.component.tsx:19  text="Elizabeth Chandra entering to the booked court "
ActivityLogItem.component.tsx:24  text="Tennis Outdoor Court A"
ActivityLogItem.component.tsx:31  text="2 days ago"
notificationNavigation.ts:113-114  if (bookingKinds.includes(kind ?? "") || paymentKinds.includes(kind ?? "")) { return bookingId ? activityLogRoute(bookingId) : activityTabRoute(); }
bookings.query.ts:124  queryFn: ({ pageParam = 1 }) => getMatchEvents({ id }),
```
- **Suggested fix (NOT applied):** Render `eventsData` with real user names, event copy and timestamps (and pass page to the API), or route notifications to Booking Details until the screen exists.

### 328. [MEDIUM] 'Pay your part' shows only the share while the Stripe sheet asks the organiser to authorise the full court price

- **Where:** `courtplusmobile/src/screens/CourtFlow/Booking/BookingSummary/BookingSummary.logic.ts:84`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** For split bookings the app's TOTAL bar shows `totalAmountSplitted`, but the backend creates the organiser's PaymentIntent for `holdAmount + amount` (the whole booking) with manual capture. The PaymentSheet therefore displays and authorises e.g. SAR 500 when the screen said SAR 125. Nothing on the summary explains the hold amount; the T&C paragraph is generic.
- **How to reproduce:** Book a court with 1 friend, keep 'Pay your part', tap Pay: the sheet shows the full price.
- **Impact:** Customers see a different amount in the payment sheet than on the confirmation screen and abandon or dispute the charge.
- **Evidence:**

```
BookingSummary.logic.ts:84-86  const finalAmount = isSplitPaymentSelected ? totalAmountSplitted : totalAmount;
BookingButtons.component.tsx:44  text={`${t("general.currency")} ${amount.toString()}`}
bookings.service.ts:217-220  const playerAmount = bookingAmount / (participants.length + 1); const holdAmount = bookingAmount - playerAmount; paymentInfo.amount = playerAmount; paymentInfo.holdAmount = holdAmount;
stripe.service.ts:72  amount: Math.round(Number(holdAmount + amount) * 100),
```
- **Suggested fix (NOT applied):** Show both numbers on the summary ('Your share X, temporary hold Y, released when friends pay') and in the TOTAL bar, matching the sheet.

### 329. [MEDIUM] Accepting an invitation discards the returned PaymentIntent and the card keeps showing 'Accept' after success

- **Where:** `courtplusmobile/src/components/molecules/MatchInvitationCard/MatchInvitationCard.logic.ts:83`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** POST /bookings/:id/respond returns Stripe sheet data for split bookings; `respondMatch` returns only `OK`, so an orphan PaymentIntent/payment row is created every accept and the user is left to press a second button. Worse, `secondaryButton` is memoised on `[t]` only, so after the list refetches with status pending_payment the same card instance still shows 'Accept' (calling accept again creates another orphan intent) until the screen remounts.
- **How to reproduce:** As an invitee tap Accept on a split invitation: button still says Accept; tap again -> another intent created.
- **Impact:** Invitees cannot pay from the card right after accepting; every accept leaves an abandoned PaymentIntent in Stripe and a PENDING payment row.
- **Evidence:**

```
MatchInvitationCard.logic.ts:26-31  await respondMatchMutation({ id: booking.id, accept: true, participantId: participant.id }); invalidateQuery("getBookings");
bookings.service.ts (mobile):84-90  export const respondMatch = async (...) => { const response = await axiosInstance.post<RespondMatchResponse>(...); return response.data.OK; };
MatchInvitationCard.logic.ts:83-96  const secondaryButton = useMemo(() => { if (participant?.status === ParticipantStatus.PENDING) {...} if (participant?.status === ParticipantStatus.PENDING_PAYMENT) {...} }, [t]);
bookings.service.ts (backend):1383-1387  if (participant.booking.paymentType === PaymentType.SPLIT) { ... return this.pay(participant); }
```
- **Suggested fix (NOT applied):** Use the respond response to open the payment sheet immediately, and compute the button from `participant.status` (add it to the useMemo deps or drop the memo).

### 330. [MEDIUM] Participants who left, are awaiting approval or no-showed still appear under 'Current' as invitation cards with a lone 'Reject' button

- **Where:** `courtplusmobile/src/components/organisms/CurrentBookings/CurrentBookings.component.tsx:40`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The /bookings list joins any participant row for the user regardless of status, and the mobile ParticipantStatus enum lacks pending_approval, no_show and cancelled. CurrentBookings routes every non-creator, non-READY status to MatchInvitationCard whose secondary button is undefined for those statuses, so a customer who already left a match (status cancelled, e.g. live booking ab1808d3) sees '<creator> invited you to match', a 'Reject' button and an empty second button. Pending join requests the user sent are shown with the same 'invited you' copy.
- **How to reproduce:** Leave a split match from Booking Details, return to Current Bookings: the match is still listed as an invitation with Reject.
- **Impact:** Confusing and wrong state for customers who left a match or requested to join one; the empty button is a dead tap target.
- **Evidence:**

```
CurrentBookings.component.tsx:37-52  const isParticipantReady = currentParticipant?.status === ParticipantStatus.READY; return isMyCurrentBooking || isParticipantReady ? (<BookingSummaryCard .../>) : (<MatchInvitationCard ... participant={currentParticipant!!} />);
MatchInvitationCard.component.tsx:64-70  <ButtonsRow onPress={handleReject} onSecondaryPress={secondaryButton?.onPress ?? (() => {})} title={t("activity.reject")} secondaryTitle={secondaryButton?.title ?? ""}
models/Booking.ts:29-35  export enum ParticipantStatus { ACCEPTED, PENDING = "pending_response", PENDING_PAYMENT, ENTERED, READY }
bookings.service.ts:627-631  qb.innerJoin(Participant, 'userParticipant', 'userParticipant.bookingId = booking.id AND userParticipant.userId = :userId', ...)
```
- **Suggested fix (NOT applied):** Filter out cancelled/no_show participations (client or API), add the missing statuses to the enum and render explicit 'Request pending' / 'You left' states.

### 331. [MEDIUM] Confirm Match shows '12:00 am' as the match time instead of the selected slot

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/ConfirmMatch/ConfirmMatch.logic.ts:21`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** `date` in the open-match store is the calendar's 'YYYY-MM-DD' string; it is formatted with a pattern containing `hh:mm aaa`, so the confirmation headline always reads e.g. 'Fri 25 Sep, 12:00 am'. The chosen start time is never displayed on this screen (only the duration in minutes).
- **How to reproduce:** Create a match at 18:00 and look at the Confirm screen: it shows 12:00 am.
- **Impact:** Organisers confirm and pay for a match whose displayed time is wrong.
- **Evidence:**

```
ConfirmMatch.logic.ts:21  const formattedDate = formatDate(date ?? "", "EEE dd MMM, hh:mm aaa");
PickDate.logic.ts:25  setMatchData({ date: d.dateString });
ConfirmMatch.component.tsx:55-63  <CustomText text={formattedDate} .../> ... <LabelValuePair label={`${duration}`} value={t("general.mins")} />
```
- **Suggested fix (NOT applied):** Format `${date} ${sortedSlots[0].startTime}` (court-local) and show the time range from formatTimeRange.

### 332. [MEDIUM] New Match can be submitted without a time slot, and stale slots leak between matches

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/NewMatch/NewMatch.logic.tsx:180`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The date is stored as soon as a day is tapped (before PickTime), and the Create button only checks court/date/level/sport/playersASide, never `selectedSlots`. Backing out of PickTime yields a ConfirmMatch with '0 mins' and a request `startAt: 'YYYY-MM-DD '` that fails the DTO regex with a generic error. `clearMatchData` does not reset `selectedSlots`, so a slot picked for a previous match (possibly another court or day) is silently reused for the next one.
- **How to reproduce:** Start a match, pick a day, press back on Pick Time, Create Match -> Continue to payment: error. Then create another match at a different court: the previous time is pre-applied.
- **Impact:** Organisers reach payment with an invalid or wrong time; a second match can be created for a time they never picked.
- **Evidence:**

```
NewMatch.logic.tsx:180-188  return (!selectedCourt || !selectedDate || !selectedLevel || !selectedSport[0] || !playerAside);
PickDate.logic.ts:24-27  const onDayPress = (d: DateData) => { setMatchData({ date: d.dateString }); navigate("PickTime"); };
ConfirmMatch.logic.ts:41-43  startAt: `${formatDate(date?.toString() ?? "", "yyyy-MM-dd")} ${sortedSlots[0]?.startTime ?? ""}`,
openMatch.ts:33-41  clearMatchData: () => set({ date: undefined, court: undefined, selectGame: undefined, selectType: undefined, selectGender: undefined, autoAccept: false }),
```
- **Suggested fix (NOT applied):** Require `selectedSlots?.length` in the disabled check, reset slots in clearMatchData and when the court/date changes.

### 333. [MEDIUM] Hard-coded English strings across the booking and open-match UI break the Arabic build

- **Where:** `courtplusmobile/src/components/molecules/BookingButtons/BookingButtons.component.tsx:31`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Several user-visible labels bypass i18n and render in English under RTL/Arabic: the TOTAL / 'Including taxes' bar on the pay step, 'Date' and 'Time' on the booking card, the 'Book now' CTA, 'Continue to payment', the 'Time' label on New Match, the 'Activity Log' title, and the currency prefixes 'SAR' (AmountDisplay) and 'SR' (ChooseTime) which also ignore the RTL ordering that formatCurrency implements.
- **How to reproduce:** Switch the app to Arabic and open any booking summary / open match card.
- **Impact:** Arabic-speaking customers see mixed-language payment screens; translations exist (booking.taxes, general.date/time, openMatch.bookNow, general.currency) but are unused.
- **Evidence:**

```
BookingButtons.component.tsx:31,37  text="TOTAL" ... text="Including taxes"
CourtBookingCard.component.tsx:53,72  text="Date" ... text="Time"
OpenMatchItem.component.tsx:102  title="Book now"
ConfirmMatch.component.tsx:92  title="Continue to payment"
NewMatch.logic.tsx:82  text={"Time"}
AmountDisplay.component.tsx:17  text="SAR"
ChooseTime.component.tsx:72  text={`SR ${courtData.hourlyRate}`}
```
- **Suggested fix (NOT applied):** Replace each literal with the existing translation keys and use formatCurrency for amounts.

### 334. [MEDIUM] Split share is rounded to a whole number on screen while the backend charges the exact fraction

- **Where:** `courtplusmobile/src/screens/CourtFlow/Booking/BookingSummary/BookingSummary.logic.ts:33`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** `totalAmountSplitted` uses `.toFixed(0)`, so a 75 SAR booking split two ways shows 'SAR 38' in the option row and in the TOTAL bar, whereas the backend computes 37.5 and Stripe captures 37.50. Whole amounts are not rounded, so the two rows can disagree with each other too.
- **How to reproduce:** Court at 150/h, one 30-min slot, one friend: screen says 38, charge is 37.50.
- **Impact:** The price the customer agrees to differs from the charge on their statement.
- **Evidence:**

```
BookingSummary.logic.ts:33-36  const totalAmountSplitted = (totalAmount / ((participants?.length ?? 1) + 1)).toFixed(0);
BookingSummary.component.tsx:68  amount={Number(totalAmountSplitted)}
bookings.service.ts:217  const playerAmount = bookingAmount / (participants.length + 1);
```
- **Suggested fix (NOT applied):** Keep two decimals (or the currency's minor unit) and format with formatCurrency; round identically on both sides.

### 335. [MEDIUM] Dates rendered in device timezone next to times rendered in court timezone

- **Where:** `courtplusmobile/src/screens/ActivityFlow/BookingDetails/BookingDetails.component.tsx:146`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** BookingDetails prints the time with formatInZone (court zone) but the date with formatDate (device zone). OpenMatchItem prints the headline 'E dd MMM, hh:mm a' in device zone and the small clock in court zone, so the same card can show two different times. MatchInvitationCard builds the date from `new Date(item.startDate)` (device zone). For a device outside the court's zone (travelling customer, Egypt/KSA courts on one account; the seed has Asia/Riyadh and Africa/Cairo courts) a late-evening booking flips to the next/previous day.
- **How to reproduce:** Set the device to a UTC-8 zone and open an Open Match card for a 01:00 Riyadh match: headline says the previous day, clock says 01:00.
- **Impact:** Customers see contradictory or wrong dates/times for the same booking, contradicting the 'all times are court-local' notice.
- **Evidence:**

```
BookingDetails.component.tsx:146  text={formatDate(item.startDate, "dd MMM yyyy")}
BookingDetails.logic.ts:63-64  const formattedStartTime = formatInZone(item.startDate, "HH:mm", zone);
OpenMatchItem.component.tsx:73  text={formatDate(booking.startDate, "E dd MMM, hh:mm a")}
OpenMatchItem.component.tsx:97  <CustomText text={convertToUTCTime(booking.startDate, booking.timeZone)} />
MatchInvitationCard.component.tsx:58  selectedDate={new Date(item.startDate)}
```
- **Suggested fix (NOT applied):** Use formatInZone(…, item.timeZone) for every date and time derived from booking timestamps.

### 336. [MEDIUM] Time Summary 'Cancel' button does nothing

- **Where:** `courtplusmobile/src/screens/CourtFlow/Booking/TimeSummary/TimeSummary.component.tsx:103`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Step 2 of the booking flow wires the Cancel button to an empty function; every other step clears the booking and pops to top. Tapping Cancel here gives no feedback and leaves the user in the flow.
- **How to reproduce:** Book a court > choose a slot > Next > tap Cancel.
- **Impact:** Dead control in the core booking flow.
- **Evidence:**

```
TimeSummary.component.tsx:103  <BookingButtons onCancelPress={() => {}} onNextPress={onNextPress} />
InviteFriend.logic.ts:35-38  const onCancelPress = () => { clearBooking(); dispatch(StackActions.popToTop()); };
```
- **Suggested fix (NOT applied):** Reuse the InviteFriend cancel handler (clearBooking + popToTop).

### 337. [MEDIUM] Invite Friend lets the same player be added twice and allows 5 participants; both only fail (or misbehave) at the pay step

- **Where:** `courtplusmobile/src/screens/CourtFlow/Booking/InviteFriend/InviteFriend.logic.ts:22`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** `onAddPress` appends without checking whether the user is already selected and the list shows no selected state, so duplicates are easy. The DTO has @ArrayUnique, so the request fails at 'Pay' with the validator message, which the app cannot translate ('Something went wrong'). The cap is 4 invitees + organiser = 5, but BOOKING.MAX_PARTICIPANTS_PER_BOOKING is 4; the create path never enforces it (only add/join do), so 5-seat bookings are created with shares of total/5.
- **How to reproduce:** Invite Friend: tap '+' twice on the same person, Next, Pay -> generic error.
- **Impact:** Customers reach the payment step and get an unexplained error, or create bookings larger than the product allows.
- **Evidence:**

```
InviteFriend.logic.ts:22-26  const onAddPress = (friend: User) => { if (selectedFriends.length < 4) { setSelectedFriends([...selectedFriends, friend]); } };
InviteFriend.component.tsx:44-54  <ProfileCard name={item.firstName} ... onAddPress={() => onAddPress(item)} .../>
create-booking.dto.ts:57  @ArrayUnique() participants?: string[];
booking.constants.ts:5  MAX_PARTICIPANTS_PER_BOOKING: 4,
participants.service.ts:37-53  if (userIds.length > 0) { const usersCount = await this.usersService.count({ id: In(userIds) }); if (usersCount !== userIds.length) { throw ... } participants = userIds.map(...)
```
- **Suggested fix (NOT applied):** Ignore already-selected users (or toggle), cap at MAX_PARTICIPANTS_PER_BOOKING - 1, and enforce the max in createParticipants.

### 338. [MEDIUM] Open match card shows the hourly rate as the price to 'Book now'

- **Where:** `courtplusmobile/src/components/molecules/OpenMatchItem/OpenMatchItem.component.tsx:93`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The amount next to the Book now button is `booking.court.hourlyRate`, not the booking total nor the share a joiner would pay (`total / participants` on the API). A 90-minute booking on a 150/h court shows 'SAR 150' while the joiner would be charged a different amount.
- **How to reproduce:** Open Match tab, compare the card price with the payment sheet after joining (once joining works).
- **Impact:** Customers decide to join based on a number unrelated to what they will pay.
- **Evidence:**

```
OpenMatchItem.component.tsx:93  <AmountDisplay amount={booking.court.hourlyRate} />
bookings.service.ts:1231-1233  const amount = (booking.hourlyRate * (booking.duration / BOOKING.MINUTES_PER_HOUR)) / booking.participants.length;
```
- **Suggested fix (NOT applied):** Show the joiner share computed from totalAmount and the active participant count (or seats), labelled 'your share'.

### 339. [MEDIUM] After a successful payment the app shows 'Booking Success' before the booking exists and never refreshes the Activity list

- **Where:** `courtplusmobile/src/hooks/useStripePayment.ts:76`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** POST /bookings only creates a PaymentIntent and a slot reservation; the booking row is created when the payment_intent.succeeded webhook runs processParticipantPayment. The app navigates to BookingSuccess as soon as the sheet resolves, does not invalidate getBookings or clear bookingData, and no query refetches on focus (no focusManager/useFocusEffect in src). Opening the Activity tab right after paying shows the old list until pull-to-refresh, and if the webhook is delayed the booking is simply absent with no 'processing' state.
- **How to reproduce:** Pay for a court, tap 'Ok, Continue', open Activity: nothing new until pull-to-refresh (or until the webhook lands).
- **Impact:** Customers who paid cannot find their booking immediately and may book again.
- **Evidence:**

```
useStripePayment.ts:76-78  if (shouldNavigate) { navigate("CourtStack", { screen: "BookingSuccess" }); }
BookingSuccess.component.tsx:13-15  const onPress = () => { dispatch(StackActions.popToTop()); };
bookings.service.ts:229-236  const paymentResponse = await this.paymentsService.createPaymentIntentDetails(paymentInfo, user); await this.paymentsService.schedulePaymentCancellation(...); ... return paymentResponse;
payments.service.ts:158-165  if (paymentIntentStatus === PaymentStatus.COMPLETED) { ... await this.bookingsService.processParticipantPayment(payment);
```
- **Suggested fix (NOT applied):** Invalidate getBookings/getOpenBookings and clear bookingData on success, and poll GET /bookings until the booking appears (or show a 'confirming your booking' state).

### 340. [LOW] 'Enter Court' is shown by time window only, ignoring participant/booking status; second tap errors

- **Where:** `courtplusmobile/src/components/molecules/BookingSummaryCard/BookingSummaryCard.logic.ts:40`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The button appears whenever |now - start| <= 10 min, including after the participant has already entered (status ENTERED) and on cancelled bookings shown in history within that window. A second tap sends /enter again and the state machine rejects ENTERED -> ENTERED with a 400 whose message the app renders as 'Something went wrong'. `currentParticipant` is computed from a list that already excludes the current user, so it is always undefined and cannot be used to fix this.
- **How to reproduce:** Enter a court, then tap Enter Court again within the window.
- **Impact:** Customers see an Enter button that errors after first use and on dead bookings.
- **Evidence:**

```
BookingSummaryCard.logic.ts:40-41  const isLessThan10Minutes = Math.abs(differenceInMinutes(new Date(item.startDate), new Date())) <= 10;
BookingSummaryCard.logic.ts:30-36  const participants = item.participants.filter((participant) => participant.userId !== profileId); const currentParticipant = participants.find((participant) => participant.userId === profileId);
participant-state-machine.ts:56-61  [ParticipantStatus.ENTERED]: { on: { NO_SHOW: ... } },
```
- **Suggested fix (NOT applied):** Hide the button unless the user's participant status is READY and the booking is pending/in_progress.

### 341. [LOW] Pick Date and Pick Time work without a court and parse the day as UTC midnight

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/PickTime/PickTime.logic.ts:15`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** PickDate can be opened before a court is chosen: it requests GET /courts//availability?month=… (404) and still navigates to PickTime on day press. PickTime turns the 'YYYY-MM-DD' string into `new Date(...)` (UTC midnight) and back with toLocaleDateString, and ConfirmMatch does the same through formatDate, so devices west of UTC request and book the previous day. `useGetCourtAvailability` has no `enabled` guard and shares the `getCourtDetails` key, so bookmark toggles refetch availability.
- **How to reproduce:** New Match > Date (before Location) > pick a day; or set the device to UTC-5 and compare the slots' day.
- **Impact:** Wrong-day slots for non-KSA devices; wasted 404 requests and a dead-end Pick Time when no court is chosen.
- **Evidence:**

```
PickTime.logic.ts:13-16  const { data, isLoading } = useGetCourtAvailability({ id: court?.id ?? "", date: new Date(date ?? "").toLocaleDateString("en-CA") ?? "" });
PickDate.logic.ts:17-22  useGetCourtAvailability({ id: court?.id ?? "", month: ... })
ConfirmMatch.logic.ts:41  startAt: `${formatDate(date?.toString() ?? "", "yyyy-MM-dd")} ...
court.query.ts:88-91  useQuery({ queryKey: [queryKeys.getCourtDetails, requestData], queryFn: () => getCourtAvailability(requestData) });
```
- **Suggested fix (NOT applied):** Disable date/time rows until a court is selected, keep the date as a plain string (no Date round-trip), and add `enabled: !!id` with a dedicated query key.

### 342. [LOW] Booking-history and current tabs share one query cache key; skeleton replaces the list on every refetch

- **Where:** `courtplusmobile/src/apis/bookings/bookings.query.ts:31`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** `useGetBookings` keys the infinite query on `[getBookings]` only, so the 'current' (status pending,in_progress) and 'history' (status completed,cancelled) tabs overwrite the same pages and each tab mount triggers a full refetch of all cached pages with the other filter. `isLoading` is mapped to `isFetching`, so pull-to-refresh and every invalidation hide the whole list behind a skeleton instead of showing the RefreshControl.
- **How to reproduce:** Switch between Current and History tabs repeatedly on a slow network.
- **Impact:** Flicker and redundant network traffic on every tab switch/refresh; risk of mixed pages when both fetches are in flight.
- **Evidence:**

```
bookings.query.ts:31  queryKey: [queryKeys.getBookings],
bookings.query.ts:44  isLoading: isFetching,
CurrentBookings.logic.ts:19  useGetBookings({ page: 1, status: "pending,in_progress" });
BookingHistory.logic.ts:17  useGetBookings({ page: 1, status: "completed,cancelled" });
```
- **Suggested fix (NOT applied):** Include `request` in the query key (as useGetOpenBookings does) and expose `isLoading`/`isRefetching` separately.

### 343. [LOW] BookingButtons renders a bare '0' text node when the amount is zero (RN crash)

- **Where:** `courtplusmobile/src/components/molecules/BookingButtons/BookingButtons.component.tsx:25`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** `{amount && (...)}` evaluates to the number 0 when amount is 0, which React Native renders as a raw string outside <Text> and throws 'Text strings must be rendered within a <Text> component'. Reachable when a court's hourlyRate is 0 or the computed duration is 0.
- **How to reproduce:** Set a court hourlyRate to 0 and reach Booking Summary.
- **Impact:** Red-screen crash on the pay step for free/zero-priced courts.
- **Evidence:**

```
BookingButtons.component.tsx:25  {amount && (
BookingSummary.component.tsx:88  amount={Number(finalAmount)}
```
- **Suggested fix (NOT applied):** Use `{amount != null && (...)}` or `typeof amount === 'number' && (...)`.

### 344. [LOW] Placeholder image used instead of the court photo on booking and match summaries

- **Where:** `courtplusmobile/src/components/molecules/CourtBookingCard/CourtBookingCard.component.tsx:26`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** TimeSummary, CourtBookingCard (Booking Summary and invitation cards) and the New Match location row render the static `Images.openMatch` asset although `getCourtImage(court)` exists and is used elsewhere.
- **How to reproduce:** Book any court and look at steps 2 and 4.
- **Impact:** Every court looks identical on confirmation screens; customers cannot visually confirm the venue.
- **Evidence:**

```
CourtBookingCard.component.tsx:26  <Image source={Images.openMatch} style={themedStyles.courtImage} />
TimeSummary.component.tsx:38  <Image source={Images.openMatch} style={themedStyles.courtImage} />
NewMatch.logic.tsx:67  <Image source={Images.openMatch} style={themedStyles.courtImage} />
```
- **Suggested fix (NOT applied):** Use getCourtImage(courtData).

### 345. [LOW] Booking Ticket prints the raw sport enum and a participant UUID, and is offered for cancelled/unaccepted bookings

- **Where:** `courtplusmobile/src/screens/ActivityFlow/BookingTicket/BookingTicket.component.tsx:30`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The ticket title is `item.court.sport` ('paddle') untranslated, 'Player ID' is the participant row UUID, and BookingDetails shows the 'Booking Ticket' button for cancelled bookings and for invitees who have not accepted (status pending_response), producing a ticket with no status.
- **How to reproduce:** Open a cancelled booking from History > Booking Ticket.
- **Impact:** Unprofessional ticket and misleading access for bookings that are not valid.
- **Evidence:**

```
BookingTicket.component.tsx:30  <CustomText font="title" weight="bold" text={item.court.sport} />
BookingTicket.logic.ts:39-42  { title: t("activity.playerID"), value: player?.id, }
BookingDetails.logic.ts:142-145  return { title: t("activity.bookingTicket"), onPress: onBookingTicketPress };
```
- **Suggested fix (NOT applied):** Map the sport through mapSportItem, show a human reference/QR, and hide the ticket unless the booking is active and the participant is READY/ENTERED.

### 346. [LOW] Activity header bell icon is not tappable and Open Match empty state uses booking copy

- **Where:** `courtplusmobile/src/screens/ActivityFlow/Activity/Activity.component.tsx:40`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The Activity tab renders a bell icon in the header with no onPress (Courts' header opens Notifications), and the Open Match list's empty state title is 'No bookings available to display at the moment.' while the subtitle talks about open matches; after paying on an open match nothing confirms success (`shouldNavigate` false) and the card keeps its Book now button.
- **How to reproduce:** Tap the bell on Activity; open the Open Match tab with no matches.
- **Impact:** Dead tap target and mismatched copy; no confirmation after paying to join.
- **Evidence:**

```
Activity.component.tsx:40-44  trailingComponent={ <View style={themedStyles.layersContainer}> <Image source={Images.bell} /> </View> }
OpenMatch.component.tsx:98-101  emptyConfig={{ image: Images.emptyBooking, title: t("activity.noBookings"), subtitle: t("openMatch.noMatchesSubtitle"),
OpenMatch.logic.ts:49-51  await showPaymentOverlay(booking?.court?.mainAsset ?? "", false); } invalidateQuery("getOpenBookings");
```
- **Suggested fix (NOT applied):** Wire the bell to Notifications, add an openMatch.noMatches title, and show a success snackbar/state after joining.

### 347. [LOW] Terms text on Booking Summary describes a hold even for 'Pay everything', and no hint about the 10-minute reservation

- **Where:** `courtplusmobile/src/screens/CourtFlow/Booking/BookingSummary/BookingSummary.component.tsx:79`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The same paragraph ('we temporarily hold the total booking cost until two hours after the end of the match') is shown regardless of payment type; whole bookings are captured immediately (automatic capture). Nothing tells the customer that the slot and PaymentIntent expire after 600 s; if the sheet is left open longer, the intent is cancelled by the job and the user only sees a raw Stripe error then BookingFailed.
- **How to reproduce:** Select 'Pay everything' and read the terms; leave the sheet open 11 minutes then pay.
- **Impact:** Misleading payment terms and unexplained failures for slow payers.
- **Evidence:**

```
BookingSummary.component.tsx:78-81  <DottedContainer ...> <CustomText text={t("booking.termsAndConditionsDescription")} /> <CustomText text={t("booking.cancellationPolicy")} /> </DottedContainer>
booking.constants.ts:9  SLOT_RESERVATION_TTL_SECONDS: 600,
payment.constants.ts:2  CANCELLATION_DELAY_SECONDS: 600,
useStripePayment.ts:69-74  if (error) { showSnackbar({ message: error.message || t("general.error") }); if (shouldNavigate) { navigate("CourtStack", { screen: "BookingFailed" }); } return; }
```
- **Suggested fix (NOT applied):** Show hold wording only for split, and add 'Complete payment within 10 minutes' with a countdown.

### 348. [LOW] iOS swipe-back from Booking Success returns to the pay step (only Android hardware back is disabled)

- **Where:** `courtplusmobile/src/hooks/useDisableBackHandler.ts:5`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** BookingSuccess/BookingFailed rely on useDisableBackHandler, which only intercepts the Android hardwareBackPress event; the native-stack swipe gesture on iOS still pops to BookingSummary, where 'Pay' creates another intent for the same slot and fails with SLOT_ALREADY_RESERVED / overlap.
- **How to reproduce:** On iOS, after Booking Success swipe from the left edge.
- **Impact:** iOS users can re-enter the payment step after success and hit confusing errors.
- **Evidence:**

```
useDisableBackHandler.ts:5-11  BackHandler.addEventListener("hardwareBackPress", () => true);
BookingSuccess.component.tsx:10  useDisableBackHandler();
```
- **Suggested fix (NOT applied):** Set `gestureEnabled: false` / `headerBackVisible: false` on BookingSuccess and BookingFailed, or reset the stack on success.

### 349. [LOW] New Match pre-selects Tennis and an undefined participant before the profile loads; sport is never sent

- **Where:** `courtplusmobile/src/screens/OpenMatchFlow/NewMatch/NewMatch.logic.tsx:43`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** `participants` is initialised with `[profileData!!]` synchronously, so when the profile query has not resolved the first slot is undefined; `selectedSport` defaults to `sports[1]` (Tennis) regardless of the chosen court and is displayed on ConfirmMatch but never sent to the API (the court's sport governs), so the confirmation chip can contradict the court.
- **How to reproduce:** Pick a paddle court in New Match without touching the sport chips: ConfirmMatch says Tennis.
- **Impact:** Confusing sport chip on confirmation; occasional empty first avatar slot.
- **Evidence:**

```
NewMatch.logic.tsx:43  const [participants, setParticipants] = useState<User[]>([profileData!!]);
NewMatch.logic.tsx:44-46  const [selectedSport, setSelectedSport] = useState<SportFilterItem[]>([ sports[1], ]);
ConfirmMatch.component.tsx:40-41  <Chip title={game.label} isSelected
```
- **Suggested fix (NOT applied):** Derive the sport from the selected court and initialise participants once the profile is available.

### 350. [LOW] respondMatch sends a `participantId` field the DTO does not declare (contract drift)

- **Where:** `courtplusmobile/src/apis/bookings/bookings.service.ts:84`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** POST /bookings/:id/respond is called with `{accept, participantId, rejectionReason}` but BookingResponseDto only has accept/rejectionReason; the extra field is silently stripped today (whitelist: true) and will turn into a 400 the day forbidNonWhitelisted is enabled, which main.ts says is the intended end state.
- **How to reproduce:** Enable forbidNonWhitelisted and accept an invitation.
- **Impact:** Latent breakage of accept/reject when validation is tightened.
- **Evidence:**

```
bookings.service.ts (mobile):84-89  export const respondMatch = async ({ id, ...data }: RespondMatchRequest) => { const response = await axiosInstance.post<RespondMatchResponse>(`${endPoints.bookings}/${id}/respond`, data);
bookings.types.ts:60-65  export interface RespondMatchRequest { id: string; accept: boolean; participantId: string; rejectionReason?: string; }
booking-response.dto.ts:4-17  export class BookingResponseDto { @IsBoolean() accept: boolean; ... rejectionReason?: string; }
main.ts:39-43  // NOT enabling forbidNonWhitelisted yet ... Enable it once client payloads have been audited
```
- **Suggested fix (NOT applied):** Drop participantId from the respond payload (it is the join-request endpoint's field).

---

## 13. Mobile onboarding, login, profile and settings

35 issues — 0 critical, 5 high, 15 medium, 15 low.

### 351. [HIGH] Deleted account permanently burns its phone number and username; "Start Fresh" is a dead end and there is no 30-day purge

- **Where:** `backend/src/modules/auth/auth.service.ts:529`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** users.deletedAt is a plain @Column (not @DeleteDateColumn), so usersRepository.findOne/exists include soft-deleted rows. sendPhoneCode(purpose='signup') throws PHONE_NUMBER_ALREADY_EXISTS when the deleted user has verifiedAt; signupWithPhone throws ACCOUNT_ALREADY_EXISTS for a deleted match; checkUsername/exists({username}) and sendUpdatePhoneNumberVerification/exists({phoneNumber}) also match deleted rows. No @Cron ever hard-deletes users. After the 30-day recovery window closes, login says ACCOUNT_NOT_RECOVERABLE, sign-up says the number is taken, and the RecoverAccount 'Start Fresh' button just opens Register where the same number is rejected.
- **How to reproduce:** Delete account in Settings, wait >30 days (or just tap 'Start Fresh' on RecoverAccount), register with the same phone → 'This number is already linked to another account'.
- **Impact:** A customer who deleted their account (or waited >30 days) can never register or log in again with their own phone number, and their username is locked forever. Support cannot fix it without SQL.
- **Evidence:**

```
auth.service.ts:529 `if (purpose === 'signup' && user?.verifiedAt) { throw new BadRequestException(PHONE_NUMBER_ALREADY_EXISTS); }`
auth.service.ts:134-135 `if (existingUser.deletedAt) { throw new BadRequestException(ACCOUNT_ALREADY_EXISTS); }`
users.service.ts:216-222 `async get(where) { return this.usersRepository.findOne({ where }); } ... async exists(where) { return this.usersRepository.exists({ where }); }`
user.entity.ts:237-238 `@Column({ nullable: true }) deletedAt?: Date;`
RecoverAccount.logic.ts:60-62 `const onStartFresh = () => { navigate("Register"); };`
```
- **Suggested fix (NOT applied):** Exclude deletedAt rows in signup/check-username/change-phone lookups (or switch to @DeleteDateColumn and use withDeleted only in auth paths), and add a scheduled job that anonymises/hard-deletes users whose deletedAt is older than 30 days (null phone/username/email, revoke sessions).

### 352. [HIGH] User blocking is dead: backend never enforces blocks anywhere and the app has no Block UI

- **Where:** `backend/src/modules/blocks/blocks.service.ts:49`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** POST /blocks/:id/block stores a row, but no other module imports BlocksService or joins the blocks table: user search (users.service.find), profile reads, friendships.follow, posts, open-match joins all ignore blocks. The mobile app has no block action at all (grep for 'block' in courtplusmobile/src finds only a comment) — Profile's context menu only offers Report.
- **How to reproduce:** Call POST /blocks/{id}/block with a customer token, then as the blocked user GET /users/{blockerId}, POST /friendships/{blockerId}/follow — all succeed.
- **Impact:** Customers have no way to stop harassment; even via the API a 'blocked' user still sees the blocker's profile, posts, can follow them and join their matches. The product spec lists blocks as part of the social layer.
- **Evidence:**

```
blocks.service.ts:49-54 `const block = await this.blocksRepository.save({ blockerId, blockedId }); return block;`
blocks.module.ts:12 `exports: [BlocksService],` — grep -rn "BlocksService|blocksRepository|from '../blocks" src outside blocks/ returns nothing
friendships.service.ts:43-50 only checks `usersService.exists({ id: followerId })` / `exists({ id: followingId })`
Profile.logic.ts:69-78 `contextActionMenuItems ... [{ text: t("general.report"), icon: "flag", onPress: onReportPress }]`
```
- **Suggested fix (NOT applied):** Add a block-aware filter (both directions) to users.find, getById(friendship), friendships, posts and booking participant lookups; add Block/Unblock to the profile context menu and a Blocked users screen in Settings.

### 353. [HIGH] Profile stats (courts played, hours) always show 0 and never update

- **Where:** `courtplusmobile/src/screens/ProfileFlow/Profile/Profile.logic.ts:41`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The stats block reads data.matchesPlayedCount and data.minutesPlayedCount, which the backend User entity does not have (it exposes bookingsCount and minutesBookedCount — confirmed live: GET /users/me returns matchesPlayedCount: undefined, minutesBookedCount: 0). In addition the useMemo has an empty dependency array, so even bookingsCount is computed once while data is still undefined and never refreshed.
- **How to reproduce:** Book and complete a match, open Profile tab → all three counters read 0.
- **Impact:** Every profile (own and others') shows '0 courts played / 0 hrs / 0 sessions' regardless of activity — wrong data shown to all customers.
- **Evidence:**

```
Profile.logic.ts:41-62 `const sessions = useMemo(() => [ { title: `${data?.matchesPlayedCount ?? "0"}`, ... }, { title: `${convertMinutesToHours(data?.minutesPlayedCount ?? 0)} ...` }, { title: `${data?.bookingsCount ?? "0"}`, ... } ], []);`
user.entity.ts:188-197 `bookingsCount: number; ... minutesBookedCount: number;` (no matchesPlayedCount/minutesPlayedCount)
Live GET /users/me keys: `...bookingsCount,minutesBookedCount,reviewsCount,totalSpent,postsCount...`
```
- **Suggested fix (NOT applied):** Map to the real fields (bookingsCount, minutesBookedCount) and add [data, t] to the useMemo deps; decide what 'courts played' should be (distinct courts) and add a backend counter if needed.

### 354. [HIGH] Single-name users display as "Name undefined" and Update Profile then saves the literal string "undefined" as last name

- **Where:** `courtplusmobile/src/utils/helpers.ts:177`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** generateFullName concatenates firstName and lastName with no null handling. Signup sends lastName: undefined when the customer types a single word (the fullName regex allows it), and Google accounts with a one-word display name also have no lastName. The profile header, Logout modal and Update Profile prefill then show 'Ahmed undefined'; saving Update Profile splits that string and PATCHes lastName='undefined' into the database.
- **How to reproduce:** Register with full name 'Ahmed', verify OTP, open Profile → header shows 'Ahmed undefined'; tap Update → Save → lastName is now 'undefined'.
- **Impact:** Customers with a single name (common in Arabic naming) see a broken name everywhere and can corrupt their record with 'undefined' as a surname, which is then shown to other users and vendors.
- **Evidence:**

```
helpers.ts:177-182 `export const generateFullName = (data) => { return `${data.firstName} ${data.lastName}`; };`
OTPVerification.logic.ts:57-58 `lastName: signUpData?.fullName.trim().split(/\s+/).slice(1).join(" ") || undefined,`
UpdateProfile.logic.ts:26 `fullName: generateFullName(user!!),` and :50 `const [firstName, ...rest] = data.fullName.trim().split(/\s+/);`
user.entity.ts:41-42 `@Column({ nullable: true }) lastName?: string;`
```
- **Suggested fix (NOT applied):** `[firstName, lastName].filter(Boolean).join(' ')` in generateFullName; in Update Profile send lastName: rest.join(' ') || null and accept null in UpdateUserDto.

### 355. [HIGH] Sign in with Apple is not implemented although Google sign-in is offered (App Store Guideline 4.8)

- **Where:** `courtplusmobile/src/hooks/useSocial.ts:30`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The app ships third-party (Google) login but no Apple login; onAppleLogin is an empty stub and the footer comment acknowledges it. Apple rejects iOS builds that offer a third-party social login without Sign in with Apple (or an equivalent privacy-preserving option).
- **How to reproduce:** Open Login on iOS → only Google icon under 'or'.
- **Impact:** iOS release will be rejected at review; iPhone customers cannot use a native sign-in.
- **Evidence:**

```
useSocial.ts:30 `const onAppleLogin = () => {};`
OnboardingFooter.component.tsx:41-43 `{/* Sign in with Apple is not implemented yet (no onPress); ... App Store rule 4.8 requires it before an iOS release with Google sign-in */}`
package.json: `@invertase/react-native-apple-authentication -` (not installed)
```
- **Suggested fix (NOT applied):** Add @invertase/react-native-apple-authentication, exchange the Apple identity token through Firebase (sign_in_provider 'apple.com' already fits loginWithSocial), and render the Apple button on iOS.

### 356. [MEDIUM] Ops 'block user' does not revoke sessions; a blocked customer keeps a valid access token for up to 15 minutes

- **Where:** `backend/src/modules/users/users.service.ts:672`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** blockUser only sets blockedAt. JwtStrategy.validate never checks blockedAt/deletedAt, and blockUser does not call authService.revokeAllSessions (delete() does). The block only takes effect when the access token expires and the refresh join (user.blockedAt IS NULL) fails.
- **How to reproduce:** Ops blocks a customer who is logged in; the customer keeps using the app until the token expires.
- **Impact:** An abusive user blocked by ops can continue booking, posting and messaging for up to 15 minutes after the block.
- **Evidence:**

```
users.service.ts:672-682 `async blockUser(userId, blocked) { ... await this.usersRepository.update(userId, { blockedAt: blocked ? new Date() : null }); await this.invalidateUser(userId); }`
jwt.strategy.ts:39-57 `async validate(payload) { if (payload?.sid) { ... revoked = await this.cacheManager.get(revokedSessionKey(payload.sid)) ... } return payload; }`
auth.service.ts:480 `expiresIn: '15m',`
```
- **Suggested fix (NOT applied):** Call authService.revokeAllSessions(userId) inside blockUser (and on tenant/user suspension), or check blockedAt in JwtStrategy via the cached user.

### 357. [MEDIUM] Anyone can lock a customer out of login for 1 hour by sending 6 wrong OTPs for their phone number

- **Where:** `backend/src/modules/auth/auth.users.controller.ts:142`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** POST /auth/customers/login/phone is throttled with the 'auth' bucket keyed only by the (normalised) phone number: 6 attempts / 15 min then blockDuration 1h. The key ignores IP/device, so an attacker who knows a victim's number can trigger the block and the legitimate user gets TOO_MANY_REQUESTS for an hour.
- **How to reproduce:** POST login/phone 6× with a wrong code for +2010xxxxxxx → the real owner's correct code is rejected with 429 for 60 minutes.
- **Impact:** Targeted denial of service on any customer's login; support tickets during launches.
- **Evidence:**

```
auth.users.controller.ts:142-149 `@Throttle({ auth: { generateKey(req) { const request = req.switchToHttp().getRequest(); return `login-phone-${normalizePhoneKey(request.body.phoneNumber)}`; } } })`
app.module.ts:116-120 `{ name: 'auth', ttl: ms('15m'), limit: 6, blockDuration: ms('1h') }`
```
- **Suggested fix (NOT applied):** Key the OTP-verify limiter on phone+IP (or device id) with a separate, higher per-phone ceiling, and rely on Twilio Verify's own per-verification attempt limit.

### 358. [MEDIUM] ACCOUNT_BLOCKED and ACCOUNT_HAS_UPCOMING_BOOKINGS have no translation, so blocked users and delete-account failures see 'Something went wrong'

- **Where:** `courtplusmobile/src/utils/errorMessages.ts:13`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** getApiErrorMessage falls back to messages.somethingWentWrong for any code missing from translation files. en.json/ar.json contain 141 message keys but neither ACCOUNT_BLOCKED (returned by login/send-code/social for ops-blocked users) nor ACCOUNT_HAS_UPCOMING_BOOKINGS (returned by DELETE /users/me when the customer has a pending/in-progress booking).
- **How to reproduce:** With a paid upcoming booking, Settings → Delete account → generic error.
- **Impact:** A customer trying to delete their account is told 'Something went wrong' and never learns they must cancel upcoming bookings first; blocked users get no explanation and keep retrying.
- **Evidence:**

```
errorMessages.ts:13-18 `if (code && i18n.exists(`messages.${code}`)) { return t(`messages.${code}`); } return t("messages.somethingWentWrong");`
auth.service.ts:431-434 `if (user?.blockedAt) { throw new ForbiddenException(ACCOUNT_BLOCKED); }`
users.service.ts:640-641 `if (Number(count) > 0) { throw new BadRequestException(ACCOUNT_HAS_UPCOMING_BOOKINGS); }`
grep -c ACCOUNT_BLOCKED|ACCOUNT_HAS_UPCOMING_BOOKINGS en.json ar.json → 0 / 0
```
- **Suggested fix (NOT applied):** Add both keys (EN/AR) under messages; for ACCOUNT_HAS_UPCOMING_BOOKINGS say that upcoming bookings must be cancelled first.

### 359. [MEDIUM] Age error copy says '18 or older' but the rule and date picker enforce 14

- **Where:** `courtplusmobile/src/translation/en.json:290`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Backend PhoneSignupDto/UpdateUserDto use @MaxDate(now − 14 years) and the DatePickerModal caps at 14 years, but messages.INVALID_AGE tells the user they must be 18+ (EN and AR).
- **How to reproduce:** Set device clock / pick DOB 13 years ago → error says 'must be 18 or older'.
- **Impact:** Contradictory legal age statement; a 15-year-old is accepted while the app text claims 18+ is required.
- **Evidence:**

```
en.json:290 `"INVALID_AGE": "You must be 18 or older to use Court+."`; ar.json:290 `"INVALID_AGE": "يجب أن يكون عمرك 18 عامًا أو أكثر لاستخدام Court+."`
signup.dto.ts:139-141 `@MaxDate(() => dayjs().subtract(14, 'year').toDate(), { message: INVALID_AGE })`
DatePickerModal.component.tsx:10-15 `// Matches the backend rule (@MaxDate: today - 14 years ...) date.setFullYear(date.getFullYear() - 14);`
```
- **Suggested fix (NOT applied):** Decide the real minimum age with the PM and align DTO, picker and copy.

### 360. [MEDIUM] Update Profile cannot remove a last name — the old surname silently persists

- **Where:** `courtplusmobile/src/screens/ProfileFlow/UpdateProfile/UpdateProfile.logic.ts:59`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** When the full name is edited to a single word, lastName is sent as undefined; TypeORM update ignores undefined so the previous lastName stays. The screen then reloads showing the old two-word name.
- **How to reproduce:** Profile 'John Doe' → Update → fullName 'John' → Save → header still 'John Doe'.
- **Impact:** Customers cannot correct their name; a stale surname keeps showing to other players and vendors.
- **Evidence:**

```
UpdateProfile.logic.ts:59 `lastName: rest.join(" ") || undefined,`
users.service.ts:192-208 `const update: any = { ...data }; ... await this.usersRepository.update(id, update);`
```
- **Suggested fix (NOT applied):** Send lastName: rest.join(' ') || null and allow null in UpdateUserDto (@ValidateIf / IsOptional with null).

### 361. [MEDIUM] Changing avatar/cover or adding/removing a sport inside Update Profile navigates back and discards unsaved edits

- **Where:** `courtplusmobile/src/components/organisms/ProfileImageHeader/ProfileImageHeader.logic.ts:83`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Both shared components call goBack() after their own mutation unless isCompleteProfile. UpdateProfile renders them without that flag, so picking a new photo or managing sports pops the Update Profile screen while name/username/bio/DOB edits are still unsaved.
- **How to reproduce:** Update Profile → edit bio → tap camera → choose photo → screen closes, bio not saved.
- **Impact:** Customers lose typed changes and are confused why the edit screen closed after uploading a photo.
- **Evidence:**

```
ProfileImageHeader.logic.ts:82-83 `invalidateQuery("getProfile"); !isCompleteProfile && goBack();`
SportsLevelManager.logic.ts:40-41 `invalidateQuery("getProfile"); !isCompleteProfile && goBack();` and :98-99 same after addSportMutation
UpdateProfile.component.tsx:52-58 `<ProfileImageHeader user={user} ... isUpdating />` and :97 `<SportsLevelManager sports={user?.sports ?? []} />`
```
- **Suggested fix (NOT applied):** Remove the goBack() from the shared components (let the parent decide) and refresh the params/user via the getProfile query instead of route params.

### 362. [MEDIUM] Register form does not enforce backend name/username rules; errors surface only after the SMS was sent, and Arabic usernames are rejected with a generic message

- **Where:** `courtplusmobile/src/screens/OnboardingFlow/Register/Register.data.ts:13`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The form only requires non-empty username and a letters-only full name. Backend requires firstName/lastName ≥2 chars, username /^[a-zA-Z0-9_.-]+$/ with MinLength 3 on check-username but MinLength 2 on signup (inconsistent), and usernames are case-sensitive. A single-letter first name or 'Ali A' passes the form, the OTP SMS is sent, and only signup/phone fails with INVALID_FIRST_NAME/INVALID_LAST_NAME on the OTP screen. Arabic-script usernames fail check-username with 'That username isn't valid' and no rule explanation.
- **How to reproduce:** Register with full name 'A B', username 'أحمد' → OTP screen error / 'username isn't valid'.
- **Impact:** Sign-up fails late (after consuming an SMS and the throttle budget) with unexplained errors; Arabic-speaking users cannot understand why their username is refused.
- **Evidence:**

```
Register.data.ts:13 `username: yup.string().required(t("general.requiredField")),` (no pattern/length)
signup.dto.ts:107-108 `@MinLength(2, { message: INVALID_FIRST_NAME }) firstName` :117-118 `@MinLength(2, { message: INVALID_LAST_NAME }) lastName` :128-130 `@MinLength(2 ...) @MaxLength(50 ...) @Matches(/^[a-zA-Z0-9_.-]+$/ ...) username`
check-username.dto.ts:11-13 `@MinLength(3, { message: INVALID_USERNAME }) ... @Matches(/^[a-zA-Z0-9_.-]+$/ ...)`
OTPVerification.logic.ts:52-62 signup happens after OTP with `firstName: signUpData?.fullName.trim().split(/\s+/)[0] || ""`
```
- **Suggested fix (NOT applied):** Mirror the rules in the yup schema with localised messages (min 2/3 chars, allowed charset), align MinLength between the two DTOs, and show inline helper text for username rules.

### 363. [MEDIUM] Report reasons are hard-coded English strings and are never translated

- **Where:** `courtplusmobile/src/utils/constants.ts:253`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** reportReasons titles are literals ('Violence,Abuse and Related reasons', 'Fake Account', ...) while every other list in the file uses t(). Arabic users see English in the Report bottom sheet used on profiles, courts and branches.
- **How to reproduce:** Switch to Arabic → open any profile → ⋯ → Report → reasons are English.
- **Impact:** Broken Arabic experience in a safety-critical flow.
- **Evidence:**

```
constants.ts:253-270 `export const reportReasons: Item[] = [ { title: "Violence,Abuse and Related reasons", key: "violence" }, { title: "Fake Account", key: "fakeAccount" }, { title: "Hate Speech", key: "hateSpeech" }, { title: "Other", key: "other" } ];`
```
- **Suggested fix (NOT applied):** Use t('report.reasons.violence') etc. with EN/AR entries.

### 364. [MEDIUM] Deleted accounts still appear in followers/following lists and can still be followed

- **Where:** `backend/src/modules/friendships/friendships.service.ts:92`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** friendships.find joins the user without a deletedAt IS NULL filter and follow() only checks exists({id}) (which includes soft-deleted rows). Tapping such a row opens GET /users/:id which excludes deleted users, so the app renders an empty profile.
- **How to reproduce:** Follow a user, that user deletes their account, open Following list → still listed; tap → blank profile.
- **Impact:** Ghost users in social lists; follower counts include deleted accounts; opening them shows a blank profile.
- **Evidence:**

```
friendships.service.ts:92-100 `.where('friendship.followingId = :targetUserId', { targetUserId }).leftJoinAndSelect('friendship.follower', 'user');` (no deletedAt condition)
friendships.service.ts:43-50 `this.usersService.exists({ id: followingId }) ... if (!follower || !following) throw new NotFoundException(USER_NOT_FOUND);`
users.service.ts:131-133 `// A deleted account must not be reachable by id ... query.andWhere('user.deletedAt IS NULL');`
```
- **Suggested fix (NOT applied):** Add user.deletedAt IS NULL (and block filters) to friendships.find and follow(); decrement counts on account deletion.

### 365. [MEDIUM] Account deletion only checks bookings the user organised; paid split-match participations are orphaned

- **Where:** `backend/src/modules/users/users.service.ts:635`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** delete() blocks only when bookings.userId = current user. A customer who joined an open/split match (participant row with a paid or authorised share) can delete their account; their share stays attached to a soft-deleted user with no path to refund or notify them, and the organiser's match keeps a ghost participant.
- **How to reproduce:** Join a split match and pay your share, then delete the account → succeeds.
- **Impact:** Money held/charged for a participant who no longer exists; organiser sees a phantom player.
- **Evidence:**

```
users.service.ts:635-642 `SELECT COUNT(*)::int AS count FROM bookings b WHERE b."userId" = $1 AND b.status IN ('pending','in_progress') AND b."endDate" > NOW()` ... `throw new BadRequestException(ACCOUNT_HAS_UPCOMING_BOOKINGS)`
```
- **Suggested fix (NOT applied):** Also count participants rows (paid/pending) for upcoming bookings, or automatically leave the match (respecting the 12h rule) before deletion.

### 366. [MEDIUM] Reports against users never reach ops, and the reports list ignores pagination

- **Where:** `backend/src/modules/reporting/reporting.service.ts:123`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleReportCreated returns early unless the entity is a branch or court, and even then only notifies the tenant's staff — no SuperAdmin/ops notification exists for user (or booking) reports, so a 'Fake account'/'Hate speech' report just sits in the table. listReports never applies skip/take although it returns totalPages.
- **How to reproduce:** Report a user from their profile → no ops notification; GET /report?page=2 returns the same full list.
- **Impact:** Safety reports from customers are effectively lost; ops cannot page through reports.
- **Evidence:**

```
reporting.service.ts:123-127 `if (![ReportEntity.BRANCH, ReportEntity.COURT].includes(report.entityType)) { return; }`
reporting.service.ts:106-114 `const [reports, total] = await qb.getManyAndCount(); return { items: reports, pagination: { totalCount: total, totalPages: Math.ceil(total / pageSize), currentPage: page } };` (no .skip/.take)
```
- **Suggested fix (NOT applied):** Notify SuperAdmins for USER/BOOKING reports (and surface them in the ops console); add skip((page-1)*pageSize).take(pageSize).

### 367. [MEDIUM] Choosing a language on the Welcome screen restarts the app and shows Welcome again

- **Where:** `courtplusmobile/src/screens/OnboardingFlow/Welcome/Welcome.component.tsx:34`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** handleDonePress calls changeLanguage() (which forceRTL + RNRestart.restart()) before setFirstVisit(); firstVisit stays true, so after the restart the customer lands on Welcome a second time and must press Done again.
- **How to reproduce:** Fresh install on an English device → pick العربية → Done → app restarts → Welcome again.
- **Impact:** Every Arabic-speaking first-time user (device in English) sees the welcome screen twice — looks like a crash/loop on first launch.
- **Evidence:**

```
Welcome.component.tsx:28-39 `const shouldChangeLanguage = () => { if (i18n.language === currentLanguage) return false; changeLanguage(); return true; }; const handleDonePress = () => { if (!shouldChangeLanguage()) { setFirstVisit(); navigation.dispatch(StackActions.replace("Login")); } };`
helpers.ts:516-521 `export const changeLanguage = () => { ... I18nManager.forceRTL(newLanguage === "ar"); RNRestart.restart(); };`
```
- **Suggested fix (NOT applied):** Call setFirstVisit() before changeLanguage(), or persist the chosen language and skip Welcome when firstVisit is false.

### 368. [MEDIUM] GET /blocks?search never matches: filters are ANDed across firstName/lastName/username/email and use case-sensitive LIKE

- **Where:** `backend/src/modules/blocks/blocks.service.ts:66`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** A nested where object in TypeORM means all four properties must match the pattern simultaneously, and Like() is case-sensitive in Postgres, so searching the blocked list returns nothing for practically any input.
- **How to reproduce:** POST /blocks/{id}/block then GET /blocks?search=<username> → items: [].
- **Impact:** Once a Blocked-users screen exists, search will appear broken; API clients get empty results.
- **Evidence:**

```
blocks.service.ts:66-73 `if (search) { where.blocked = { firstName: Like(`%${search}%`), lastName: Like(`%${search}%`), username: Like(`%${search}%`), email: Like(`%${search}%`) }; }`
```
- **Suggested fix (NOT applied):** Use an array of where objects (OR) with ILike, or a query builder with `(user.firstName ILIKE :s OR ...)`.

### 369. [MEDIUM] Delete-account dialog promises permanent deletion in 30 days, but no job ever deletes or anonymises the data

- **Where:** `courtplusmobile/src/translation/en.json:221`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The copy states data 'will be permanently deleted in 30 days'. The backend only sets deletedAt; the only @Cron jobs are for webhooks, slots, pricing, subscriptions, assets and balances. Phone, email, DOB, avatar and posts remain indefinitely.
- **How to reproduce:** Delete account, query users table after 31 days → row and PII intact.
- **Impact:** Misleading privacy statement; PII retained forever contrary to what the customer was told (and to store privacy requirements).
- **Evidence:**

```
en.json:221 `"deleteAccountDescription": "Your data will be permanently deleted in 30 days.If you change your mind, you can still restore your account anytime during this period."`
users.service.ts:643-645 `await this.usersRepository.update(currentUser.id, { deletedAt: new Date() });`
grep '@Cron' src → only webhook-idempotency, slots, pricing, subscriptions, assets, balance services
```
- **Suggested fix (NOT applied):** Add a daily job to anonymise/hard-delete accounts deleted >30 days ago, or change the copy to match reality.

### 370. [MEDIUM] Google sign-up derives the username from the e-mail local part without applying username rules, then Update Profile can never be saved

- **Where:** `backend/src/modules/auth/auth.service.ts:256`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** loginWithSocial sets username = email.split('@')[0].toLowerCase() (e.g. 'john+test' or 'a.b' of 1–2 chars) with no validation. The mobile Update Profile always re-sends username; UpdateUserDto rejects it with INVALID_USERNAME (min 3, /^[a-zA-Z0-9_.-]+$/) so the Save button appears to fail for any field until the user guesses they must change the username.
- **How to reproduce:** Sign in with a Google account 'ab+x@gmail.com' → Update Profile → set DOB → Save → INVALID_USERNAME.
- **Impact:** Google users with '+' aliases or very short local parts cannot edit their profile (DOB/gender are mandatory for them) and get an unrelated 'username isn't valid' error.
- **Evidence:**

```
auth.service.ts:256-262 `let username = email.split('@')[0].toLowerCase(); const { available, suggestions } = await this.usersService.checkUsername(username); if (!available && suggestions) { username = suggestions[0]; }`
update-user.dto.ts:73-76 `@MinLength(3, { message: INVALID_USERNAME }) @MaxLength(50 ...) @Matches(/^[a-zA-Z0-9_.-]+$/, { message: INVALID_USERNAME }) username?: string;`
UpdateProfile.logic.ts:56-64 `await editProfileMutation({ user: { firstName, lastName ..., username: data.username, ... } });`
```
- **Suggested fix (NOT applied):** Sanitise/validate the generated username in loginWithSocial (strip disallowed chars, pad to 3+) and only send username from the app when it changed.

### 371. [LOW] Change-phone verifies only the new number; the old number is never re-confirmed

- **Where:** `backend/src/modules/users/users.service.ts:303`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** POST /users/me/phone/code + /verify swap the account's login identifier after an OTP to the new number only. Anyone holding an unlocked device (or a still-valid 30-day refresh token) can move the account to their own number and permanently lock the owner out, since login is phone+OTP.
- **How to reproduce:** Settings → Change phone → new number → OTP → account now belongs to the new number.
- **Impact:** Account takeover with a borrowed/stolen unlocked phone; no notification to the old number.
- **Evidence:**

```
users.service.ts:303-327 `async sendUpdatePhoneNumberVerification({ phoneNumber }, { id: userId }, ip) { ... await this.usersRepository.update(userId, { pendingPhoneNumber: phoneNumber }); await this.verificationService.sendPhoneCode(phoneNumber, ip); }`
users.service.ts:356-359 `await this.usersRepository.update(currentUser.id, { phoneNumber: formattedPhoneNumber, pendingPhoneNumber: null });`
```
- **Suggested fix (NOT applied):** Require an OTP on the current number (or recent re-auth) before allowing the change, send an SMS to the old number, and revoke other sessions.

### 372. [LOW] Deep-link scheme court-plus:// is registered on both platforms but the app has no linking configuration

- **Where:** `courtplusmobile/src/navigation/MainNavigation.tsx:8`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** iOS Info.plist and AndroidManifest declare the court-plus URL scheme, but NavigationContainer has no `linking` prop and nothing calls Linking.getInitialURL, so any court-plus:// link only launches the app to Splash.
- **How to reproduce:** Open court-plus://courts/123 from Safari/Chrome → app opens on Splash/Home only.
- **Impact:** Shared/marketing links cannot open a court, match or profile; dead capability exposed to the OS.
- **Evidence:**

```
MainNavigation.tsx:8 `<NavigationContainer ref={navigationRef}>` (no linking)
ios/CourtPlus/Info.plist:36-39 `<key>CFBundleURLSchemes</key><array><string>court-plus</string></array>`
android/app/src/main/AndroidManifest.xml:29-34 `<action android:name="android.intent.action.VIEW" /> ... <data android:scheme="court-plus" />`
```
- **Suggested fix (NOT applied):** Add a linking config (prefixes ['court-plus://', 'https://courtplusapp.com']) mapping to CourtDetails/Profile/Booking, or remove the scheme until supported.

### 373. [LOW] Phone-number account enumeration: send-code and login reveal whether a number is registered or deleted before any OTP

- **Where:** `backend/src/modules/auth/auth.service.ts:526`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** send-code with purpose='login' returns USER_NOT_FOUND for unregistered numbers, and login/phone returns ACCOUNT_DELETED before the code is verified. Both are unauthenticated and distinguish registered / deleted / unknown numbers.
- **How to reproduce:** POST /auth/customers/send-code {phoneNumber, purpose:'login'} → 404 vs 201.
- **Impact:** Attackers can confirm which phone numbers have Court+ accounts (privacy leak) at throttle speed.
- **Evidence:**

```
auth.service.ts:526-528 `if (purpose === 'login' && !user) { throw new NotFoundException(USER_NOT_FOUND); }`
auth.service.ts:343-345 `if (user.deletedAt && !recover) { throw new BadRequestException(ACCOUNT_DELETED); }` (before verificationService.verifyCode at :347)
```
- **Suggested fix (NOT applied):** Return 201 for send-code regardless (send nothing for unknown numbers) and only report ACCOUNT_DELETED after a valid OTP.

### 374. [LOW] check-username is exempt from all rate limits, allowing unlimited username enumeration

- **Where:** `backend/src/modules/auth/auth.users.controller.ts:85`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The controller class skips both throttlers and check-username adds no @Throttle, so the unauthenticated endpoint can be hammered to enumerate existing usernames (it also returns suggestions).
- **How to reproduce:** Loop POST /auth/customers/check-username with a wordlist → never 429.
- **Impact:** Scraping of the user base by username; DB load from generateUsernames loops.
- **Evidence:**

```
auth.users.controller.ts:34-35 `@UseGuards(ThrottlerGuard) @SkipThrottle({ phone: true, auth: true })`
auth.users.controller.ts:85-90 `@Post('check-username') async checkUsername(@Body() body: CheckUsernameDto) { return this.usersService.checkUsername(body.username); }`
```
- **Suggested fix (NOT applied):** Add an IP-keyed @Throttle to check-username.

### 375. [LOW] Customers can search other users by e-mail substring, confirming e-mail→account mappings despite PII redaction

- **Where:** `backend/src/modules/users/users.service.ts:476`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** GET /users?search matches user.email ILIKE for customer callers too. redactUsersForViewer removes the email from the response, but the fact that a record matches tells the caller that e-mail belongs to that username/avatar.
- **How to reproduce:** GET /users?search=victim@gmail.com with a customer token → returns the matching profile.
- **Impact:** Indirect PII disclosure (e-mail ↔ identity linking) to any customer.
- **Evidence:**

```
users.service.ts:476-481 `if (search) { query.andWhere('(user.username ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` }); }`
users.controller.ts:203-204 `// Strip contact PII when one customer searches for another. return { ...result, items: redactUsersForViewer(result.items, currentUser) };`
```
- **Suggested fix (NOT applied):** Only include the email clause when currentUser.type is Staff.

### 376. [LOW] Splash waits a fixed 5 seconds before navigating, and asks for location permission before the customer has seen anything

- **Where:** `courtplusmobile/src/screens/Splash/Splash.component.tsx:36`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Navigation is gated on a hard-coded 5 s timer regardless of token state, and getLocationDetails() (which triggers the OS location prompt) runs on Splash for every launch, including before login; MobileController then requests location again just to derive the country code (device country needs no location permission).
- **How to reproduce:** Fresh install → 5 s logo, then location permission dialog on the login screen.
- **Impact:** Every cold start feels slow; location prompt appears with no context (lower grant rates, review-time scrutiny).
- **Evidence:**

```
Splash.component.tsx:36-39 `timerRef.current = setTimeout(() => { handleNavigation(); }, 5000);`
Splash.component.tsx:22-25 `useQuery({ queryKey: [queryKeys.getUserLocation], queryFn: () => getLocationDetails() });`
uselocation.ts:64-71 `const getDeviceCountryCode = async () => { const isGranted = await getLocationPermission(); if (isGranted) { const deviceCountry = await DeviceCountry.getCountryCode(TYPE_CONFIGURATION); ...`
```
- **Suggested fix (NOT applied):** Navigate as soon as the persisted store hydrates (≤1 s), request location on the Courts/Home screen with a rationale, and read the country code without a permission check.

### 377. [LOW] Forced logout in the API interceptor resolves with undefined, so callers throw raw 'Cannot read property data of undefined' messages

- **Where:** `courtplusmobile/src/apis/api.tsx:129`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** When the refresh token is rejected, handleLogout() (void) is returned instead of a rejection; every service then evaluates response.data.OK on undefined and the resulting TypeError text is shown in snackbars by screens that display error.message.
- **How to reproduce:** Revoke the session server-side, pull-to-refresh Followers → snackbar shows a JS TypeError.
- **Impact:** Untranslated developer error text flashes to the customer while being logged out.
- **Evidence:**

```
api.tsx:129-131 `if (status === 401 || status === 403) { return handleLogout(); }`
profile.service.ts:16-20 `const response = await axiosInstance.get<User & ApiResponse>(endPoints.profile); if (response.data.OK) {`
```
- **Suggested fix (NOT applied):** After handleLogout() return Promise.reject(errorResponse) with the INVALID_REFRESH_TOKEN message.

### 378. [LOW] Onboarding walkthrough shows the same image on all three steps

- **Where:** `courtplusmobile/src/screens/OnboardingFlow/Onboarding/Onboarding.component.tsx:18`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** All three steps reference Images.onboarding1; only the copy changes.
- **How to reproduce:** Navigate to the Onboarding screen and swipe.
- **Impact:** First impression looks unfinished.
- **Evidence:**

```
Onboarding.component.tsx:18 `image: Images.onboarding1,` :23 `image: Images.onboarding1,` :28 `image: Images.onboarding1,`
```
- **Suggested fix (NOT applied):** Add onboarding2/onboarding3 assets.

### 379. [LOW] OTP screen title says 'Account Login' during sign-up and shows the raw, un-normalised number

- **Where:** `courtplusmobile/src/screens/OnboardingFlow/OTPVerification/OTPVerification.component.tsx:44`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The heading is always auth.verificationOtpLogin ('Input OTP for Account Login') even when isLogin is false, and the displayed phoneNumber is the country code concatenated with whatever was typed (e.g. '+2001012345678' when the user kept the trunk 0), not the E.164 number the backend actually used.
- **How to reproduce:** Register with '01012345678' and +20 → OTP screen shows '+2001012345678' and 'Account Login'.
- **Impact:** Confusing copy for new users; number shown differs from the one that received the SMS.
- **Evidence:**

```
OTPVerification.component.tsx:44-46 `<CustomText text={t("auth.verificationOtpLogin")} ...`
OTPVerification.component.tsx:57-58 `<CustomText text={phoneNumber} ...`
Login.logic.ts:27 `phoneNumber: `${selectedCountryCode}${data.phoneNumber}`,`
```
- **Suggested fix (NOT applied):** Use a sign-up specific title and format the number with libphonenumber before display.

### 380. [LOW] Camera/gallery permission denial is silently swallowed in the avatar picker

- **Where:** `courtplusmobile/src/components/molecules/modals/ImagePickerModal/ImagePickerModal.logic.ts:23`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** react-native-image-picker resolves with { errorCode: 'permission' | 'camera_unavailable' } instead of throwing, so the try/catch + onPhotoError path never runs; the handler just returns null and nothing is shown.
- **How to reproduce:** Deny camera permission → Update Profile → camera icon → Camera → no feedback.
- **Impact:** Customers who denied camera access tap 'Camera' and nothing happens, with no hint to enable the permission.
- **Evidence:**

```
ImagePickerModal.logic.ts:23-26 `if (result?.assets?.[0]) { return onImageSelected(result.assets[0]); } return null;` — result.errorCode is never read; catch at :27-30 handles thrown errors only.
```
- **Suggested fix (NOT applied):** Check result.errorCode and show onPhotoError(result.errorCode) with a link to Settings.

### 381. [LOW] Auth tokens persisted in MMKV with a hard-coded encryption key shipped in the JS bundle

- **Where:** `courtplusmobile/src/utils/zustandStorage.ts:4`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The 30-day refresh token is stored via zustand persist in MMKV encrypted with a static key that any attacker with the bundle can read; Keychain/Keystore-backed storage is the platform expectation for session secrets.
- **How to reproduce:** Extract the app sandbox, decrypt MMKV with the key from the bundle.
- **Impact:** On rooted/jailbroken or backed-up devices the refresh token is trivially recoverable → account takeover for up to 30 days.
- **Evidence:**

```
zustandStorage.ts:4-7 `export const storage = new MMKV({ id: "storage", encryptionKey: "zD0It/sb|_=jN9;" });`
app.ts:113-118 `partialize: (state) => ({ firstVisit: state.firstVisit, userTokens: state.userTokens, ...`
```
- **Suggested fix (NOT applied):** Store the refresh token in react-native-keychain (or generate the MMKV key per install and keep it in Keychain).

### 382. [LOW] Terms of Use and How Court+ Works are rendered with unstyled raw <Text>

- **Where:** `courtplusmobile/src/screens/ProfileFlow/Terms/Terms.component.tsx:17`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Both legal/help screens use bare react-native Text (default 14 px system font, no colour/spacing) instead of CustomText, so headline and body look identical and do not follow the app typography or dark-theme colours.
- **How to reproduce:** Settings → Terms of use.
- **Impact:** Legal pages look broken/unfinished to reviewers and customers.
- **Evidence:**

```
Terms.component.tsx:17-18 `<Text>{t("settings.termsOfUseHeadline")}</Text> <Text>{t("settings.termsOfUseContent")}</Text>`
HowCourtWorks.component.tsx:18-19 `<Text>{t("settings.howCourtWorksHeadline")}</Text> <Text>{t("settings.howCourtWorksContent")}</Text>`
```
- **Suggested fix (NOT applied):** Use CustomText with headline/body fonts and paragraph spacing.

### 383. [LOW] Location permission purpose string is generic ('needs to access location')

- **Where:** `courtplusmobile/ios/CourtPlus/Info.plist:59`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** Apple requires purpose strings to explain why the data is needed; the current NSLocationWhenInUseUsageDescription gives no reason, a frequent App Review rejection cause (Guideline 5.1.1).
- **How to reproduce:** Trigger the location prompt on iOS.
- **Impact:** Possible App Review rejection; lower permission grant rate.
- **Evidence:**

```
Info.plist:59-60 `<key>NSLocationWhenInUseUsageDescription</key> <string>$(PRODUCT_NAME) needs to access location</string>`
```
- **Suggested fix (NOT applied):** Explain the use: 'Court+ uses your location to show courts and matches near you.' (EN + AR via InfoPlist.strings).

### 384. [LOW] Google sign-up keeps only the first two words of the display name

- **Where:** `backend/src/modules/auth/auth.service.ts:230`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** name.split(' ') destructures [firstName, lastName], so 'Mohamed Ali Hassan' becomes first 'Mohamed', last 'Ali' and the family name is dropped; single-word names get lastName undefined (feeds the 'undefined' display bug).
- **How to reproduce:** Google sign-in with a three-word display name → profile shows only two.
- **Impact:** Wrong names for Arabic users with multi-part names created via Google.
- **Evidence:**

```
auth.service.ts:230 `let [firstName, lastName] = name ? name.split(' ') : [email.split('@')[0]];`
```
- **Suggested fix (NOT applied):** firstName = parts[0]; lastName = parts.slice(1).join(' ') || null.

### 385. [LOW] Notification settings screen shows 'No notifications to show.' when preferences fail to load

- **Where:** `courtplusmobile/src/screens/ProfileFlow/Notifications/Notifications.component.tsx:62`
- **Status:** Reported by one auditor; the independent second-pass check did not run (session limit). Re-check before acting.
- **Problem:** The fallback when GET /users/me/preferences errors reuses the inbox empty-state copy (notifications.empty), which is wrong for a settings screen and hides the actual error.
- **How to reproduce:** Open Settings → Notifications while offline.
- **Impact:** Misleading message; customer thinks the settings are empty rather than temporarily unavailable.
- **Evidence:**

```
Notifications.component.tsx:62-69 `if (!notifications) { return ( <EmptyState image={Images.bell} title={t("notifications.empty")} ... /> ); }`
Notifications.logic.ts:13 `const { data, isLoading, isError, error } = useGetNotificationSettings();` (isError unused in the component)
```
- **Suggested fix (NOT applied):** Show the error message with a retry button.


---

## 14. What this register does not cover

Seven of the twenty planned audit areas never ran. The session limit was reached
while they were queued, so **no** findings exist for them here. They are not
clean; they are unexamined.

| Area not audited | What it would have covered |
|---|---|
| Internationalisation parity | Missing or wrong Arabic keys across dashboard and mobile, hardcoded English strings, RTL layout, number/date/currency formatting. Partial evidence exists: the mobile English and Arabic files both have 501 keys with one untranslated value, and several RTL layout breaks were found by hand and are listed in section 1. |
| Security, configuration and deployment | Helmet/CORS/rate limits, Swagger exposure, Docker and Caddy configuration, backup script, CI workflow, secrets handling, dependency CVEs, upload validation, webhook signature checks. |
| Marketing website | Contact/vendor-lead form submission and validation, SEO, legal text, accessibility, performance. Three website issues found by hand are in section 1. |
| Database schema and migrations | Entity-versus-migration drift, missing foreign keys and indexes, enum drift, numeric precision, unsafe migrations. |
| Mobile discovery: home, search, filters, bookmarks | Court visibility rules, distance and radius maths, sorting, pagination, filter correctness, media playback. |
| Ratings and reviews | Who may review, aggregate maths, moderation, privacy of reviewer data. |
| Community: posts, follows, blocks, reports | Authorisation on posts, feed visibility, block consequences, report handling. |

Re-running those seven is roughly two hours of audit time and should happen
before the hand-off is called complete.

### Verification gap

The plan was for every finding to face two independent reviewers trying to
refute it. That pass did not run. In practice this means:

- The **15 critical** items: 10 were re-checked by hand against the running
  system, the database or the Stripe API and are marked **Verified by hand**.
  The other 5 rest on one auditor's reading.
- The **370** high, medium and low items rest on one auditor's reading each.
  Expect a portion to be wrong or already mitigated elsewhere. Treat each as a
  lead to confirm, not a defect to patch blind.

---

## 15. Operational and business items

These are not code defects, so no auditor reports them, but each one blocks or
endangers a real launch. They carry over from the earlier readiness review and
were re-confirmed as still open.

| Item | Why it matters |
|---|---|
| **No database backups** | Every booking, payment and payout record exists in exactly one Docker volume on one EC2 instance. A disk failure ends the business. A backup script exists in the repository but is not installed as a cron job and no restore has ever been tested. |
| **All work is uncommitted** | 231 changed files, including six migrations and several new modules, exist only in the working tree on one laptop. Nothing is committed, pushed, reviewed or built by CI. |
| **No error tracking or alerting** | No Sentry, Datadog or OpenTelemetry anywhere. Nobody learns the site is down except a customer. |
| **No staging environment** | Every change is tested in production. |
| **Twilio is on trial, SES is in sandbox** | OTP messages and e-mail will not reach real customers at volume. |
| **Android release signing** | The release build type is signed with the public debug keystore; Google Play will refuse the upload. Version code is still 1. |
| **No Apple Developer account, no Sign in with Apple** | App Store guideline 4.8 requires Apple sign-in wherever Google sign-in is offered. The iOS app cannot ship without both. |
| **Logs are unstructured** | Console transport with no timestamps, request ids or per-environment levels; incident triage would be blind. |
| **Tokens are stored in localStorage** in both the dashboard and the ops console | Any cross-site scripting flaw becomes full account takeover of an ops administrator. |
| **No security headers** on the three single-page apps | The Vercel configurations set only a rewrite rule. |
| **Ops console has no robots.txt** | The administration console is indexable. |

---

## 16. What I would do first

Ordered by what stops money being lost or stops the launch.

1. **Decide the payment and payout rail.** The Stripe account is Czech and
   inactive, and Stripe will not onboard Saudi connected accounts from it. Until
   this is settled, no customer can be charged in production and no vendor can
   ever be paid. Everything else in the money layer is downstream of this
   decision.
2. **Install the backup cron and run one restore drill.** Nothing else matters
   until data loss is survivable.
3. **Fix the staff refresh-token query** (one missing column reference). It
   logs every vendor and ops administrator out every fifteen minutes and is a
   one-line class of fix.
4. **Fix the payout approval path.** As written, an approval sends the Stripe
   transfer, then throws, then refunds the vendor's balance: the vendor is paid
   twice, every time.
5. **Remove vendor access to the platform-wide customer block endpoint.**
6. **Fix the two mobile crashes and the double-charge path** on booking details
   and open matches.
7. **Commit everything and turn on continuous integration.**
8. **Re-run the seven missing audit areas**, then the adversarial verification
   pass over the whole register.

---

## 17. The critical fixes — what changed and how it was proven

Fixed 25 September 2026. Every claim below was verified against the running
backend, the local database or the Stripe API. Nothing here rests on a
compile succeeding.

### Money

**Approving a payout paid the vendor twice, every time.**
`approvePayout` is deliberately not transactional, yet it called
`runOnTransactionCommit`, which throws outside a transaction. The throw landed
in the catch, which refunded the vendor's balance *after* the transfer had
already left the platform. The hook call is now a plain emit; the payout is
claimed atomically (`pending -> processing` in one UPDATE) before the provider
is touched; Stripe is called with an idempotency key; and the compensating
refund only runs when the provider call itself failed. `rejectPayout` got the
same atomic claim so approve and reject can no longer race.

Proven: a 300 SAR payout was requested, approved and confirmed. The ledger
holds exactly one row (`payout_requested -300`), the balance stayed at 200, a
second approve returned `PAYOUT_NOT_PENDING`, and a second mark-sent returned
`PAYOUT_NOT_PROCESSING`.

**Vendors could never be paid at all.** The Stripe platform account is
registered in Czechia and Stripe refuses to create connected accounts for
venues in Saudi Arabia, the Gulf or Egypt from it; the account is also not
activated. That part is a business decision and no code can fix it. What code
could fix: there is now a working payout rail. Saving bank details switches the
tenant to a manual provider, ops approves the payout, sends the transfer, and
records it with `POST /payouts/:id/mark-sent`. The vendor dashboard has a bank
details form and the ops console has a **Mark sent** action.

Proven: bank details saved, account reported ready, 300 SAR requested,
approved, marked sent, shown as Completed in the vendor's payout history.

**Stripe onboarding could never succeed, and leaked an account on every try.**
`tenant_payout_settings.bankName` was `NOT NULL`, so the settings row failed to
save *after* the Stripe Express account had been created. The column is now
nullable (migration `1793000000000`), the row is written before the provider is
called, and the account id is stored as soon as it exists so a retry reuses it.
Provider errors now return a coded 400 instead of a bare 500.

Proven: onboarding returns `PAYOUT_COUNTRY_NOT_SUPPORTED` with no orphaned
account, and the settings row saves with a null `bankName`.

**An open match charged its organiser the whole court, then charged joiners
again on top.** The share was `total / (invited + 1)` — and an open match
usually has nobody invited, so the organiser's "share" was 100% and the hold
was zero, which also made Stripe capture immediately while every later path
still treated the payment as an uncaptured authorisation. Shares are now
computed from the seats on the court (`playersASide * 2`), the remainder lands
on the organiser so the parts always sum to the total, and a split with nobody
to split with is treated as a whole booking.

Proven: a 2-a-side open match on a 500 SAR court now authorises 500.00 with
`capture_method: manual`, charging the organiser 125.00 and holding 375.00.
Previously: 500.00 captured automatically, hold 0. Ten unit tests added.

**Split bookings settled from the hold never paid the vendor.**
`processPendingPayments` captured the money but never set the booking to
`COMPLETED` or emitted `PAYMENT_COMPLETED`, which is the only event that credits
vendor revenue — and the hourly reconciler only looks at completed bookings. It
now does both.

**Last-minute split matches were never settled at all.** Settlement ran only
from the 30-minute reminder, which is never scheduled for a match created
closer than that to kick-off, so the authorisation simply expired. Settlement
now also runs when the booking ends and from the expiry sweep, which awaits it
before releasing revenue.

**A second tap on "Pay your part" charged the card again.** The screen renders
from a snapshot and kept offering the button after payment; the API had no
guard. The API now refuses unless the participant is awaiting payment and has
no settled payment, and the app hides the button once the payment sheet
reports success.

Proven: calling the pay endpoint for an already-paid participant returns
`PARTICIPANT_ALREADY_PAID`.

### Security

**Any vendor could ban any customer from the entire marketplace.**
`PATCH /admin/users/:id/block` allowed vendor Owners and Admins and wrote the
global `users.blockedAt` with no tenant check, so a vendor could lock out a
competitor's customers. Blocking is now scoped: SuperAdmin still blocks
platform-wide, vendor staff write to a new `tenant_blocked_users` table, and a
vendor may only act on a customer who has actually booked with them. Booking
creation refuses a customer blocked by that venue with `BLOCKED_BY_VENUE`.

Proven: a vendor blocking their own customer leaves `users.blockedAt` null and
writes one scoped row; blocking a stranger returns 403 `NOT_ALLOWED`; the
blocked customer still signs in but cannot book at that venue; unblocking
restores booking.

### Sessions

**Every vendor and ops admin was logged out every 15 minutes.** The refresh
query joined `staff` on a `blockedAt` column that does not exist, so Postgres
rejected it and refresh always failed. The join condition is now built per user
type, and the session checks run before the token is dereferenced.

Proven: the old SQL still errors with `column user.blockedAt does not exist`;
`POST /auth/staff/refresh-token` now issues a new access token; the customer
path still filters blocked accounts.

### Crashes

**Booking details and the payment step crashed on any court without its own
location.** A court's location is optional and most have none, yet clients read
`court.location.name` directly. The API now falls back to the branch location
in both the list and single-court paths, and the four mobile call sites use
optional chaining with the same fallback.

Proven: a court with no location now returns its branch location, and every
booking in the list that previously returned null now carries one.

### Files changed

Backend: `auth.service.ts`, `admin.controller.ts`, `users.service.ts`,
`users.module.ts`, `bookings.service.ts`, `bookings.processor.ts`,
`slots.service.ts`, `booking.constants.ts`, `courts.service.ts`,
`payouts.service.ts`, `payouts.controller.ts`, `stripe-payout.provider.ts`,
`payout-provider.interface.ts`, `payout-provider.factory.ts`,
`payouts.module.ts`, `tenant-payout-settings.entity.ts`, `event.entity.ts`,
`error-codes.ts`, plus new files `tenant-blocked-user.entity.ts`,
`manual-payout.provider.ts`, `mark-payout-sent.dto.ts`,
`split-payment.spec.ts` and migration
`1793000000000-tenant-blocked-users-and-payout-fixes.ts`.

Dashboard: `PayoutsSection.js`, `payout.service.js`, `payout_action.js`,
`errorMessages.js`, `en.json`, `ar.json`.

Ops: `PayoutsPage.tsx`, `api/ops.ts`.

Mobile: `BookingDetails.component.tsx`, `BookingDetails.logic.ts`,
`CourtBookingCard.component.tsx`, `OpenMatchItem.component.tsx`,
`ConfirmMatch.component.tsx`, `ConfirmMatch.logic.ts`, `useStripePayment.ts`,
`en.json`, `ar.json`.

### Still not fixed by this pass

The two business blockers stand: the Stripe account must be activated for a
legal entity in a supported country before any live charge can be taken, and
the manual rail above is the interim answer for paying vendors. The 370
non-critical findings in sections 1–13 are untouched, and the seven audit areas
in section 14 remain unexamined.

---

## 18. Second pass — the high-severity items

The 62 findings labelled high were finally put through the adversarial
verification that the first run could not complete. Thirteen reviewers
re-read each one against the current tree.

| Verdict | Count |
|---|---:|
| Confirmed | 56 |
| Already fixed by the critical pass | 6 |
| Refuted | 0 |

None were refuted, but the reviewers corrected a lot of severities: of the 56
confirmed, only 31 were genuinely high, 1 was critical, 23 were medium and 1
low. Twenty of the 56 need a product decision rather than a bug fix.

### Fixed and verified in this pass

**Money**

- **Cancelling a booking could half-refund and then stick.** The cancel loop
  refunds each payment in turn. Stripe rejects a repeat cancel with
  `payment_intent_unexpected_state` and a repeat refund with
  `charge_already_refunded`; either threw, rolled the database back, and left
  the earlier refunds standing at Stripe while the booking stayed active and
  could never be cancelled again. Both are now treated as success when the
  intent really is settled, and still raised when money is genuinely still
  held. Five tests cover it. Confirmed live that Stripe returns exactly that
  error on a second cancel.
- **Releasing held revenue over-credited after a partial refund.** A refund
  before the booking ended already took its share out of the pending balance,
  yet the release still moved the full original hold into the available
  balance. It now releases only what remains held.
- **Refunding an unsettled split booking debited revenue the venue never
  received.** A split booking credits nothing until it completes, so
  refunding a participant pushed the balance negative for a venue that had
  earned nothing. Reversal is now capped at what the booking actually
  credited, with the ledger as the source of truth. Two tests added.
- **An organiser who listed themself as a participant was charged, then the
  booking failed to save.** The duplicate broke the unique participant index
  after the card had been charged, so nothing refunded it and Stripe retried
  for three days. The invitee list is now cleaned before any money is
  computed. Verified live: self is stripped and the per-seat share is right.

**Security and access**

- **Payout listings returned the requesting staffer's password hash** and the
  full tenant row to both the vendor dashboard and the ops console. Confirmed
  live, then restricted to safe columns and re-verified.
- **Courts had no role restriction.** Any staff member, including the lowest
  `User` role, could create, edit, delete and resubmit courts. Now Owner and
  Admin only, matching branches.
- **Closed, hidden or under-maintenance branches stayed bookable** through a
  direct court id, because the single-court query lacked the visibility
  filters the listing has. Verified live: closing a branch now returns 404 and
  refuses the booking; reopening restores it.

**Flows that were broken**

- **A customer was locked out of their own slot for ten minutes.** Closing the
  Stripe sheet left their own reservation in place, and the retry was refused
  as "already reserved". Their own hold now refreshes instead of blocking,
  while another customer is still refused. Both verified live.
- **Customers could join and pay for cancelled or finished matches.** The join
  endpoint only checked the `open` flag. It now requires the match to be
  pending and not yet finished. Verified live against a July match.
- **An Admin could create a branch and then never see it again**, because
  non-owner staff only see branches they are assigned to. The creator is now
  assigned on creation.
- **Changing a staff e-mail stored it as typed** while login lowercases, so a
  capitalised address locked the user out. Now normalised like every other
  e-mail field.
- **Reminders were sent in UTC with blank court and branch names**, because
  the job loaded the booking without its court relation.
- **The vendor's "New booking" modal treated taken slots as free.** It read
  `slot.isReserved`; the API returns `available`. Staff could double-book a
  court. Month navigation was also broken: it sent no court id and wrote a
  month response into the day slot list.
- **Open matches could not be created without picking a gender**, and there
  was no mixed option. Added, and it is now the default.
- **The "members need to be accepted" switch did the opposite of its label.**
  It was bound straight to auto-accept, so turning it on accepted everyone.

**Release and presentation**

- **Android release builds were signed with the public debug key.** Release
  signing now comes from properties that are never committed, and without them
  the artifact is left unsigned rather than looking shippable. Verified with
  gradle's signing report: the release variant no longer resolves to the debug
  store.
- **The booking screen showed a fixed "30 mins" and the hourly rate** whatever
  the customer picked. It now shows the selected duration and its real cost in
  the tenant's currency.
- **The dashboard fetched a locale file that does not exist** on every load,
  and showed the raw browser tag in the switcher.
- **Branch and customer money was labelled with a hard-coded dollar sign**
  while everything else was in the tenant's currency. The tenant's currency is
  now returned by the API for the dashboard to use.

### Still open after this pass

41 confirmed findings remain: 19 high, 21 medium, 1 low. Twenty of them are
marked as needing a product decision. The larger ones are features rather than
defects, and each needs a call from the product manager before it is built:

- Vendors have no staff management screen at all: invite, revoke, change role
  and unassign are implemented in the API and unreachable in the UI.
- Joining an open match is impossible from the app: "Book now" calls the pay
  endpoint instead of join, and nothing calls the approve-request endpoint.
- A cancelled or unpaid subscription never affects live courts or bookings, so
  a vendor keeps operating after month one.
- Checkout can create a second Stripe subscription for a tenant that already
  has one.
- Working hours that cross midnight label post-midnight slots with the
  previous day, so the app can book the wrong night.
- Split shares are still computed in three places; persisting the seat count
  on the booking would make them agree in every path.
- The activity log screen is a placeholder with hard-coded data, yet every
  booking notification routes to it.
- Deleting an account permanently burns its phone number and username, with no
  purge.

Test suite after this pass: **112 passing** (was 95 before any of this work).

---

## 19. Third pass — working down the confirmed list

After section 18 there were 41 confirmed findings left. This pass closed 17
more, leaving 20. Work that needed a product decision was left alone and is
listed at the end.

### Money and bookings

- **Split shares were computed three different ways** — once at creation from
  the invitee list, again in the pay endpoint from whoever was attached at
  that moment, and a third time at settlement from the participant count. Every
  join, decline or departure changed the denominator, so the amounts collected
  never added up to the court price. The seat count is now frozen on the
  booking when it is created (new `splitSeats` column, migration
  `1793000002000`, existing rows backfilled) and all three paths divide by it.
- **A participant who left froze settlement for everyone.** Their row stays on
  the booking as cancelled, so "has everyone paid?" could never be true again,
  the organiser's hold was never captured, and the venue was paid nothing for
  the whole booking. Cancelled participants are now excluded from both
  settlement checks.
- **Abandoned participant payment intents lived for ever.** The organiser's
  intent has always been scheduled for cancellation; a joiner's was not, so
  confirming an old sheet days later charged a seat the organiser had already
  covered, or paid for a cancelled booking. Participant intents are now
  scheduled for cancellation the same way.
- **An organiser who listed themself among the invitees** was charged, and then
  the booking failed to save on the unique participant index — after the money
  had moved, with nothing to refund it. The invitee list is now cleaned before
  any amount is computed. Verified live: the share came out right and the
  booking saved.
- **Adding a second branch charged the card with no warning.** Courts already
  showed the add-on price first; branches billed silently. The branch
  availability endpoint now returns the price impact and the form asks for
  confirmation. Verified live: it reports the real monthly delta.

### Access and data exposure

- **Customers were being sent the vendor's revenue and internal moderation
  data** on every court: total revenue, minutes booked, upcoming bookings, the
  rejection reason, and which ops admin reviewed it. Confirmed live, then
  replaced with an explicit customer column list. Verified after: customers see
  none of it, vendors still see all of it.
- **A join requester could approve themselves onto a match**, and someone who
  had left and been refunded could walk back in, because the check only
  rejected participants who were already ready. It now requires an outstanding
  invitation.
- **Changing your password left every other device signed in** with a 30-day
  refresh token. It now ends the other sessions and keeps the one you are
  using. Verified live with two sessions: the other one was rejected
  immediately, the current one kept working.
- **A logged-out phone kept receiving push notifications**, including for
  whoever signed in next on that device, because the push-token cache had no
  expiry and was never cleared. It now expires quickly and is cleared whenever
  sessions are revoked.

### Counters, jobs and e-mail

- **The staff booking-reminder e-mail crashed on render every time** and was
  never delivered, because optional fields were dereferenced without defaults.
- **Bookings made 15 to 60 minutes before kick-off never got their start and
  end jobs**, so they stayed "pending" through the game, sent no notifications
  and never released the venue's revenue.
- **The branch open-match counter was dead**: nothing incremented it, so it sat
  at zero, and the new decrement alone would have driven it negative. It is now
  incremented when an open match is created, decremented when one is cancelled
  or ends, and every branch counter decrement is floored at zero.
- **Payout approve, reject and mark-sent were not written to the audit log.**
  They now are, with a migration adding the log entity.

### Client apps

- Single-name users displayed as "Name undefined", and saving the profile then
  wrote the literal text "undefined" as the surname.
- Profile stats were hard-coded zeros. They now read the real booking count and
  minutes. One tile had no backing field at all and was reported as such rather
  than invented.
- The match invitation card showed the whole booking total instead of the
  invitee's own share.
- The payouts ledger showed "+0.00" rows for money that was actually on hold.
- The dashboard treated an expired access token as logged out, forcing a fresh
  login after any 15-minute break although a 30-day refresh token was stored.

### Still open: 20 findings

Almost all of what remains needs a product decision rather than a bug fix:

| Area | Decision needed |
|---|---|
| Staff management UI | The API is complete; the dashboard has no screen for invite, revoke, role change or unassign. |
| Joining an open match | The app's "Book now" calls the pay endpoint instead of join, and nothing calls the approve-request endpoint. Needs the intended flow confirmed. |
| Subscription lapse | A cancelled or unpaid subscription currently has no effect on live courts or bookings. What should happen to a venue mid-month? |
| Double subscription | Checkout can create a second Stripe subscription for a tenant that already has one. |
| Cross-midnight schedules | Post-midnight slots are labelled with the previous day, so the app can book the wrong night. |
| Login rate limiting | Keyed on e-mail alone, so anyone can lock a known vendor out of login for an hour. |
| Deleted accounts | Deleting burns the phone number and username for ever, with no purge. |
| Branch assignment | Only the branch endpoints respect it; courts and schedules still show Admin staff every branch. |
| Unsuspend requests | Ops can only approve, never deny, so a refused vendor stays in the inbox for ever. |
| Payout notifications | Nobody is told when a payout is requested, approved, rejected or paid. |
| Activity log screen | Placeholder with hard-coded data, yet every booking notification routes to it. |
| Sign in with Apple | Required by App Store guideline 4.8 before an iOS release. Needs an Apple developer account. |
| User blocking | The block API exists but nothing enforces it and the app has no button. |
| Time-slot selection | Picking two adjacent 30-minute chips books 30 minutes, not 60. |

---

## 20. Fourth pass — reviewing the fixes themselves

Fixing 47 defects in one day across a money layer is exactly how regressions
get introduced, so the whole day's diff went through the same treatment as the
original audit: three reviewers hunting for defects in the fixes, then one
independent verifier per claim, defaulting to "not real".

Twenty-four claims were raised, and the verifiers confirmed a serious set —
including two that would have lost real money. **Every confirmed regression was
caused by this day's own work.** They are listed here because the point of the
pass is that they were caught before anyone shipped them.

### Money regressions, both from the split-payment rework

- **An open match nobody joined collected nothing at all.** Sizing the
  organiser's share from the seat count made the Stripe intent a
  manual-capture authorisation for the whole court, which was right — but
  settlement still counted *unpaid participant rows*, and an empty seat has no
  row. With no joiners the list was empty, settlement returned early, and the
  authorisation simply expired at Stripe: the organiser paid nothing and the
  venue was paid nothing for a court blocked all evening. Settlement now counts
  unsold seats as unpaid. Five tests assert the collected total equals the
  court price for every mix of paid and unpaid seats.
- **A partly filled open match collected about half the court.** "Has everyone
  paid?" was judged on attached rows only, so the *first* joiner of a four-seat
  match satisfied it: the organiser's share was captured and Stripe released
  the rest of the hold, leaving nothing to charge the empty seats with. Both
  fully-paid checks are now seat-aware.
- **Cancelling a paid booking could be marked cancelled while the customer
  kept being charged.** Making the Stripe cancel idempotent was too permissive:
  it also swallowed the "this intent already succeeded" error, which is the
  case where the customer paid at the last second. The caller then marked the
  payment cancelled and the charge webhook became a no-op — charged, no
  booking, no refund. Only an already-*cancelled* intent is now treated as
  success; a succeeded or in-flight one still raises. Two tests pin this down.
- **A retried refund crashed the whole cancellation.** The idempotent refund
  returns nothing when Stripe reports the charge as already refunded, and the
  caller dereferenced it.
- **A paid seat was put back on sale.** Someone leaving a settled booking keeps
  no refund, yet their seat was freed, so the next joiner paid for the same
  seat again. A paid seat now stays taken. Open matches are also capped by
  their real seat count: a one-a-side match used to admit four players.

### Access and visibility regressions

- **Branches marked "occupied" disappeared from the app.** Hiding anything that
  was not `open` also hid a venue whose courts are simply all busy right now.
  Only closed and under-maintenance branches hide. Verified live across all
  four statuses.
- **The single-court endpoint still leaked** the vendor's revenue and the ops
  moderation trail; the column restriction had only been applied to the list.
  Verified clean afterwards.
- **The venue block was enforced only when creating a booking**, so a blocked
  customer could still walk in by joining someone else's open match at the same
  venue.
- **The vendor's blocked-customer filter still queried the platform-wide
  column** after blocking became venue-scoped, so the filter and the Unblock
  button disagreed with each other.

### Client regressions

- **Court search collapsed from 500 km to 5 km.** A default radius added
  earlier in the day was treated by the query as a deliberate choice, so every
  customer searched a five-kilometre circle and most saw nothing.
- **"Mixed" was added to a gender list that nothing rendered**, so the option
  still could not be picked; it is now offered in the open-match picker only,
  and not on sign-up.
- **The open-match time picker had no gap guard**, so the corrected duration
  formula would have booked a different window than the one selected.
- **The payout form let a vendor submit a request the API would reject** while
  a manual transfer was still processing.

### Where this leaves the work

| | Count |
|---|---:|
| Confirmed defects fixed | 47 |
| Regressions found in those fixes and fixed | 12 |
| Confirmed defects still open | 20 |
| Backend tests | 119 passing (95 before this work) |

The 20 open items are listed at the end of section 19. They need a product
decision, not a patch.

---

## 21. Fifth pass — the last 20

The remaining findings were mostly missing features and product calls rather
than defects. Nineteen are now built. Where the right behaviour was a judgement
call I picked the most defensible default, made it easy to change, and recorded
the choice here.

### Features that did not exist

- **Vendors can now manage their staff.** The API had invite, list
  invitations, revoke, change role and unassign; nothing in the dashboard
  called any of it, so a vendor could never add a colleague. There is now a
  Team page with its own route and sidebar entry, honouring the backend's own
  rules (the Owner cannot be modified or removed, nobody can act on
  themselves).
- **Customers can now join an open match.** "Book now" called the pay
  endpoint, which requires you to already be a participant, so a stranger
  always got a 404 — the whole open-match feature was unreachable. It now
  calls join and opens the payment sheet for the joiner's share.
- **Ops can now deny an unsuspend request.** Previously the only action was
  approve, so a vendor ops decided against sat in the queue for ever. Denying
  records the reason, tells the vendor, and leaves the suspension in place. The
  approve path was also made atomic: two admins clicking at once each sent the
  vendor a notification.
- **Payout notifications exist.** The events were already being emitted and
  nothing listened, so ops never learned a withdrawal had been requested and
  the vendor heard nothing when it was approved, rejected or paid. Verified
  live through request, approve and mark-sent.
- **The Activity Log screen shows real data.** It rendered one hard-coded item
  while every booking and payment notification routed the customer to it.

### Defects

- **Hours that cross midnight put slots on the wrong day.** A venue open
  18:00-02:00 produced slots after midnight labelled with the opening day, so
  the app booked the wrong night and those slots showed free even when taken,
  because the booking lookup never reached into the next morning. Slots now
  carry their own calendar date, the lookup window extends a day past the
  generated slots, and the vendor's booking modal keys slots by date so it
  cannot book the wrong night either.
- **Anyone could lock a vendor out of their own account.** The login and
  password-reset limits were keyed on the e-mail alone, so six requests from a
  stranger who merely knew the address blocked it for an hour. The key now
  includes the origin. The SMS code endpoint deliberately keeps the old
  phone-only key, because there the limit protects the victim's handset from
  being bombed from many addresses.
- **Deleting an account burned its phone number for ever.** Only `deletedAt`
  was set, while the phone, e-mail and username stayed under unique indexes —
  so the person could never sign up again and the username was gone for
  everyone. A daily job releases those identifiers once the recovery window
  passes, keeping the row so past bookings still resolve.
- **Blocking someone did nothing.** Blocks were recorded and never enforced
  anywhere. They now apply in both directions. Verified live: block, both
  sides disappear from each other, unblock, both return.
- **Checkout could sell a second subscription.** Our own table is only as
  fresh as the last webhook, so a vendor whose first checkout completed during
  a delay could subscribe again and pay twice every month. Checkout now asks
  Stripe first and adopts the existing subscription.
- **The Branch page showed counters that disagreed with reality** and could go
  negative; it now reads the live-computed figures the API already returns.

### Product decisions I made

| Question | What I chose | The alternative |
|---|---|---|
| What happens when a subscription lapses? | The venue disappears from customer discovery and stops taking NEW bookings; everything already paid for goes ahead, and the vendor's own dashboard keeps working so they can pay. Automatic and reversible the moment an invoice is paid, and deliberately separate from an ops ban so paying cannot lift one. | Cancel and refund the venue's future bookings, or do nothing until an ops admin intervenes. |
| How long before a deleted account's phone number is released? | 30 days, as a named constant. Inside that window "Start Fresh" still restores the account. | Release immediately, or never. |
| Does a slot's date mean its start or its end? | Its start, so a venue open "till midnight" keeps that slot on tonight. | Carry both bounds. |
| Should the login limit be per e-mail or per e-mail and origin? | Both. A distributed attack still gets one budget per source; a global per-identity cap would need a second, looser limiter and is left as a decision. | Keep per-e-mail and accept the lockout. |

### What is genuinely not done

- **Sign in with Apple** cannot be completed here. It needs an Apple developer
  account, a Firebase provider enabled, and native iOS configuration — none of
  which exist in this repository. App Store guideline 4.8 requires it before an
  iOS release that offers Google sign-in.
- **Branch assignment as an access boundary.** Today it filters the branch
  endpoints only; courts and schedules still show every branch to Admin staff.
  Whether assignment is meant to be a real boundary or just a convenience
  filter is a product decision that changes a lot of queries, so it is left for
  the product manager.
- **Committing the work.** The tree is still uncommitted.

Test suite: **127 passing**, up from 95 before any of this work.

---

## 22. Sixth pass — live testing on a real device (25 Sep 2026)

Everything in this section was found by the product owner driving the real
apps — backend, vendor dashboard and the Android build on a physical HONOR
DNY-NX9 — not by reading code. Each item was reproduced against the running
stack before it was touched, and re-verified against it afterwards.

### 22.1 Every court and branch statistic read zero

**Reported as:** "Total Income 0 / Minutes Booked 0 / Upcoming matches 0" on a
court that had a completed 500 SAR booking, and "Total Revenue $ 0" on its
branch.

**What was actually wrong — three separate defects:**

1. **`courts.totalBookings` was never maintained at all.** `StatsService`
   incremented the *branch* booking count on `BookingEventType.CREATED` but
   the court path only touched `minutesBooked` and `upcomingBookings`. The
   column sat at its `0` default for every court in the database forever.
   It is also what the mobile court page renders as "sessions", so that read
   `undefined sessions` (see 22.2).

2. **`CourtsService.decrement` had no floor.** `BranchesService.decrement`
   clamps with `GREATEST(col - n, 0)`; the court version was a plain
   `repository.decrement`. Any booking cancelled that had never been counted
   *in* drove the counter negative — `QA Branch 1` was sitting at
   `totalRevenue = -150.00` when this pass started.

3. **The counters have no reconciliation path.** They are maintained purely
   by event listeners, so every booking created while a listener was missing,
   failing or not yet deployed left the number permanently wrong. This is
   what the product owner actually hit: the data predated the working
   listeners, and nothing in the system could ever repair it.

**Fixed:**

- `stats.service.ts` — the court now counts `totalBookings` and
  `totalOpenBookings` on create, releases them on cancel, and releases the
  open-match counter on `ENDED` (mirroring the branch).
- `courts.service.ts` — `decrement` rewritten to `GREATEST(col - n, 0)`.
- New migration `1794000012000-reconcile-denormalized-counters` **SETs**
  every counter on courts, branches, tenants and users from the rows that own
  the truth (`bookings` + `payments`). Unlike the 2026-07 backfill, which
  adds and must never run twice, every statement here is idempotent, so it
  can be re-run whenever drift is suspected.

**Proven:** ran the migration against the live database. `ملاعب الشروق كرة`
went `0.00 / 0 / 0 / 0` → `750.00 SAR / 150 min / 3 upcoming / 3 bookings`;
its branch matched; `QA Branch 1`'s `-150.00` became `0.00`. Then created a
fresh booking end-to-end (POST /bookings → Stripe confirm → `charge.succeeded`
webhook → `create()`) and watched the counters move correctly on their own.

### 22.2 Court details showed "undefined sessions"

`CourtTabs` passes `sessions={court.totalBookings}`, but `totalBookings` was
not in `CUSTOMER_COURT_COLUMNS`, so the customer payload never carried it.
Added to the column list; `GET /courts/:id` now returns `totalBookings: 3`.

### 22.3 Pressing **Pay** flickered and hung with no message

**Reported as:** "the screen shakes, nothing appears, it just hangs."

**Root cause:** the participant picker let the same friend be added twice.
`CreateBookingDto` carried `@ArrayUnique()`, so the API answered `400 — All
participants's elements must be unique` *at the moment of payment*. The
backend log showed eight of them, one per tap.

The failure was invisible because of a second defect: `showSnackbar` was
frequently called with `(error as Error).message`, and the axios interceptor
rejects with a plain object rather than an `Error`. `showMessage({message:
undefined})` renders an **empty** bar — indistinguishable from the app
ignoring the tap.

**Fixed, at every layer so this class of bug cannot recur:**

- `SnackBar.utils.tsx` — a blank or non-string message now falls back to the
  localized generic error. No call site in the app can produce an empty
  snackbar any more.
- `BookingSummary.logic.ts` — the participant list is de-duplicated before it
  is priced *and* before it is sent, so the per-seat share and the payload
  agree; a falsy response is now reported instead of silently ignored; and
  the message is raised in `finally`, *after* the full-screen loader is torn
  down, so it is not hidden underneath it for its whole 3 s life.
- `errorMessages.ts` — new `getErrorText()` that copes with the interceptor's
  rejection shape instead of assuming an `Error`.
- `create-booking.dto.ts` — `@ArrayUnique()` dropped. A repeated friend is a
  client slip, not grounds for failing a payment.
- `bookings.service.ts` — `create()` now de-duplicates and strips self from
  the list (as `book()` already did) and logs when it does. This matters
  beyond the mobile bug: `create()` is also the staff entry point and is
  re-entered from the payment webhook, and a duplicate there violates the
  unique `(bookingId, userId)` index *after the card has been charged*.

**Proven:** the same request that returned 400 now returns 201.

### 22.4 Currency shown as `$`

`Users.js` rendered spending as `` `$${v}` `` and `Branches.js` as
`"$ " + totalRevenue`, while the rest of the product uses SAR. Four other
places hardcoded the literal string `SAR`, so Arabic never localized it.

All six now use `t("home.currency")` (`SAR` / `ر.س`). On mobile,
`AmountDisplay` no longer hardcodes `SAR` — it takes the court's currency and
falls back to the translation — and the Arabic value was shortened from
`ريال سعودي` to `ر.س` to match the dashboard.

### 22.5 The court's location pin did nothing

Requested: tapping it should open Google Maps.

Added `getMapsUrl()` / `openInMaps()` to the mobile helpers and made the
location row a button. The API returns position as **GeoJSON** — that is
`[longitude, latitude]`, not `[lat, lng]` — so the helper unpacks the order
explicitly; swapping them drops the pin in the wrong hemisphere. When a venue
has no coordinates on file it falls back to an address search rather than
doing nothing, and if there is no address either the user gets a message.

The `https://www.google.com/maps/search/?api=1&query=` form is deliberate: it
opens the Google Maps app on both Android and iOS when installed and the
browser when it is not, so no platform branch is needed.

### 22.6 Split payment hidden (product decision)

Requested: for now only the person booking pays, hide splitting across the
team.

Added `SPLIT_PAYMENT_ENABLED = false` in `utils/constants.ts`. The booking
summary now shows a single "Pay everything" row, and the payment type starts
on `WHOLE` — starting on `SPLIT` with the selector hidden would have created
half-paid bookings nobody could top up from the UI.

**Left alone deliberately:** the *open match* flow still uses `SPLIT`. An open
match is strangers buying individual seats; forcing it to `WHOLE` would mean
the organiser pays for everyone who joins. Flipping the flag back to `true`
restores the friends-booking split — the backend never stopped accepting and
settling `paymentType: "split"`.

### Verification

`npx tsc --noEmit` clean on backend and mobile; `npx jest` 127/127 passing;
`npm run build` clean on the dashboard; migration applied and the corrected
figures read back out of Postgres.

---

## 23. Seventh pass — the outbound-email audit (25 Sep 2026)

Triggered by a real incident: a vendor signed up as `princess.mmedia@gmai.com`
and no verification code arrived. Four investigation agents swept the signup
chain, the mail configuration, all 25 email templates and the OTP experience;
every finding was then handed to an independent verifier told to default to
"not real". **34 raised, 30 confirmed, 4 refuted.**

### 23.1 What actually happened in the reported incident

**The email was sent.** The domain is `gmai.com`, not `gmail.com` — a
registered typosquat domain, so Gmail's SMTP accepted the message and
delivered it to an inbox the vendor does not own.

Evidence: the `verifications` row was written at 19:54:54 and updated at
19:56:37 on resend, and `createVerification` is called from exactly one place
— `sendVerificationEmail`, immediately before the send. `Outbound email
failed` appears zero times in the whole log. `transporter.verify()` against
the configured credentials returns OK.

Reproduced deliberately afterwards: signing up as
`qa.strand.1@nonexistent-domain-qa.test` also logs a successful send. **SMTP
acceptance is not delivery** — that is the whole lesson of this incident, and
it was invisible because nothing logged either outcome.

### 23.2 A mistyped address stranded the vendor permanently — CRITICAL

Confirmed against live data: the vendor could not recover and gave up,
creating a second account 7.5 minutes later. The first Owner row and its
tenant are dead rows still holding the misspelled address.

There was no way out, by construction:

- `loginWithEmail` returns `{ requiresVerification: true }` and **no token**
  while `verifiedAt` is null.
- Every email-change endpoint sits behind `JwtAuthGuard`, so it is
  unreachable without that token.
- Signing up again with the same address throws `ACCOUNT_ALREADY_EXISTS`.
- Ops has no staff email edit and no staff delete.
- Resend only ever re-sent to the same wrong inbox.

**Fixed:** new `POST /auth/staff/change-unverified-email`. It takes the
original address, the signup password and the corrected address; it works
**only** on rows where `verifiedAt IS NULL`, deletes codes bound to the old
address before issuing a new one, and answers the same
`401 INVALID_CREDENTIALS` for "no such account", "already verified" and "wrong
password" alike so it cannot be used to enumerate vendor addresses. Throttled
on address **and** origin. The verification screen gained a "Not your email?
Change it" dialog.

Proven live: wrong password → 401; verified account → 401; correct password →
address updated, old code deleted, new code issued against the new address.

### 23.3 Signup could never report a failed send — HIGH

`signupWithEmail` emitted `AuthEvent.USER_CREATED` and returned. The only
sender was an `@OnEvent` listener, and `EventEmitter2.emit()` discards the
listener's promise — so `ServiceUnavailableException(EMAIL_SEND_FAILED)` could
never reach a response that had already been sent. Signup answered 201 with an
empty body whatever happened, and the dashboard navigated to the code screen
unconditionally and stated as fact that a code had been sent.

**Fixed:** the send moved into the request and is awaited; the listener was
removed so no second code is issued; signup now returns
`{ verificationSent: boolean }` and the dashboard warns when it is false. The
failure is deliberately **not** rethrown — the staff and tenant rows are
already committed, so a 503 would leave the vendor unable to retry.

### 23.4 A successful send was never logged — HIGH

`MailService` logged only failures, and nodemailer *resolves* when a server
refuses recipients — the refusals come back in `rejected`, which was
discarded. An undelivered email was therefore indistinguishable from one that
was never attempted, which is exactly why this incident could not be
diagnosed from the inside.

**Fixed:** every send logs driver, recipients and subject; a non-empty
`rejected` list is logged at error level and throws when every recipient was
refused; failures now name the recipients and subject.

### 23.5 Resend could destroy the code the user already had — MEDIUM

`createVerification` upserted the new hash **before** the email was sent, and
the upsert overwrites in place. A resend whose send then failed left the
account with no usable code at all — the single action offered to someone
waiting on a code could take away the code they had.

**Fixed:** code generation and persistence are split; the new code is written
only after the send resolves. Covered by `verification-resend.spec.ts`.

### 23.6 The code screen lied about the code — HIGH

"Court+ just sent you a **8**-Digit Code" against a 6-digit generator and a
6-box input. The field had no length rule either, so an incomplete entry was
posted, came back as "incorrect code", and burned one of only six attempts
before a one-hour lockout. The one-time code was also `console.log`ged.

**Fixed:** copy, field and backend all agree on 6 via a single `CODE_LENGTH`;
`required` + exact length on the field; the log removed; the whole screen
(including "Have an account? **Join Now**", which pointed at sign-in) moved
into `en.json`/`ar.json`; resend failures now show the real reason instead of
one flat message.

### 23.7 Every OTP email stated the wrong expiry — LOW

The TTL is 15 minutes. Two templates said 10 and one said 60.

**Fixed:** `VERIFICATION_CODE_TTL_MINUTES` is now the single source of truth,
passed into the templates as a prop so the copy cannot drift again.

### 23.8 Emails never used the configured logo — MEDIUM

`brand.ts` read `process.env.APP_LOGO_URL` at **import** time, before
ConfigModule loads `.env`, so it was always undefined and every email in the
product fell back to a placeholder wordmark despite `APP_LOGO_URL` being set
and `required()` in validation.

**Fixed:** resolved at render time via `getLogoUrl()`.

### Deliberately NOT changed

**Throttle keys on resend and verify-code.** The audit flagged that both are
keyed on the email alone with a one-hour block, letting anyone lock a vendor
out. That is true, but email-only keying is what stops a distributed attacker
brute-forcing a 6-digit code from rotating addresses, and what stops many
attackers bombing one victim's inbox — the customer `send-code` endpoint
carries an explicit comment saying exactly this. Adding the origin to the key
would trade a real attack for a nuisance one. The lockout pain is instead
reduced by the new length validation (no more wasted attempts) and by 23.2
(there is now a second route out).

### Still open — real, confirmed, not yet built

These are missing **features**, each needing a new template and wiring:

- **No booking confirmation email to the customer.** The venue gets one; the
  person who paid gets an in-app notification only, with nothing in their
  inbox to show at the gate.
- **No billing email at all.** A vendor whose subscription payment fails is
  never emailed; `SubscriptionEvents.PAYMENT_FAILED` and `CANCELLED` have no
  listener.
- **A failed payout tells the vendor nothing** — no email, no push, not even
  an in-app row: there is no `NotificationType.PAYOUT_FAILED`, and
  `'payout.failed'`'s only listener just writes a log line.
- Payout approved/rejected/completed emails no-op (no template mapped).
- `MailService` has no BCC, so every recipient of a multi-recipient email is
  exposed in the To header.
- `validation.ts` rejects an empty string for the "optional" mail/AWS vars, so
  the shipped `.env.example` cannot boot.

### Refuted by verification (4)

Omitting `SES_FROM_EMAIL`; the SESv2 credential-chain claim; "all eight
participant email templates are unreachable" (a second customer-creation path
does collect an email); and the ops super-admin invitation link (ops creates
admins directly, it does not invite them).

### Verification

`npx tsc --noEmit` clean on backend and mobile; `npx jest` **131/131**
(4 new); `npm run build` clean on the dashboard; the new endpoint exercised
live for all three refusal cases and the happy path; the rewritten screen
checked in the browser.
