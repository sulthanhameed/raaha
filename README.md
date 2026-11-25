# Raaha — React, Express, Supabase

Raaha is a React/Vite restaurant site with an Express REST API, a Supabase Postgres/Auth database, optional Razorpay checkout and order emails. Order and table submissions are **requests pending restaurant review**, not accepted orders or confirmed bookings. A captured payment is not restaurant acceptance; if a paid request is rejected, staff must arrange a refund.

## Current state and launch blockers

The code and hosting packages are prepared locally. They have **not** been deployed or verified against the requested Supabase project `jrfmgqccicrpdtqztrpt`; no real payments or emails have been made. Supabase, Razorpay and SMTP credentials/settings must be configured on the appropriate hosts. The optional `.mcp.json` is read-only and needs separate authentication; it does not connect the application or apply migrations.

Before public use:

- Verify the sample catalog, 48 dish prices, availability, ingredients, restaurant address, phone and hours. The seeded data and imagery are representative, not verified business information. Update `src/data/menu.ts` business details and the `phoneConfirmed`/`hoursConfirmed` flags when verified, and maintain the live menu in Supabase.
- Establish a staffed review, contact, rejection, refund, moderation and privacy process. There is no staff dashboard, dispatch system, confirmed-booking workflow or live courier GPS. Restaurant staff use a restricted Supabase Dashboard account and the Razorpay Dashboard.
- Test the complete deployment with a separate Supabase staging project, Razorpay **test** keys and an authorized test mailbox. Review security, accessibility, taxes, delivery charges, consent, retention, backups and applicable business obligations. Do not make live charges or send test emails without permission.

## Architecture and repository layout

```text
React/Vite browser  -- HTTPS REST -->  Express API  -- Supabase APIs -->  Supabase Auth + Postgres
       |                                |                                   (RLS, transactional RPCs)
       |                                +-- Razorpay API + signed webhook
       |                                +-- SMTP email worker (durable outbox)
       +-- Razorpay Checkout / optional Turnstile in the browser
```

The browser uses explicit Express REST routes for catalog, profiles, orders, reservations, reviews, request tracking and payments. The Supabase browser SDK is used **only for Auth**, through Express's allowlisted Auth proxy; it never receives the service-role key. User JWTs are verified by Supabase Auth on the server. Normal user reads/writes use user-scoped Supabase clients and RLS; the service-only order RPC receives the **verified server-side user ID**, not a client-supplied owner. It validates the confirmed Auth email and locks/checks catalog prices, creates the pending order and queues both acknowledgement emails in one transaction. Direct browser calls to the old and new order-writing functions are revoked.

| Separate deliverable | Contents |
| --- | --- |
| `hosting-packages/raaha-frontend.zip` | React source, public assets, build config, Playwright configs/browser tests and frontend deployment files; build with your public settings. |
| `hosting-packages/raaha-backend.zip` | Independent Node/Express package, lockfile, tests, `.env.example` and backend Dockerfile. |
| `hosting-packages/raaha-database.zip` | Supabase config, migrations, embedded migration/RLS test scripts with their own lockfile, read-only MCP configuration and database setup guide. |
| `docs/PROJECT_PROMPT.md` | Consolidated reusable project brief, including the requested architecture and constraints. |

The source lives in three packages: `frontend/` (the React app and its browser suites), `backend/` (the Express API) and `database/` (Supabase migrations plus embedded-Postgres checks), with `deployment/` holding per-target hosting recipes. Regenerate the three source packages with `npm run package:hosting` (`./scripts/package-hosting.sh`) after changes; `hosting-packages/` is git-ignored because it is rebuilt from committed source. Every zip also contains `DEPLOYMENT_GUIDE.md` (a copy of this README) and `PROJECT_PROMPT.md`. Packages intentionally contain no real `.env` files, credentials, `node_modules`, `dist` or `.git` content. They are source packages, not preconfigured deployed sites.

## Repository layout

- `frontend/` — React + Vite + Tailwind application, the Playwright suites (`tests/`, `tests-backend/`, `tests-captcha/`), the three Playwright configs and the asset build checks (`scripts/check-*.mjs`).
- `backend/` — Express REST API: Auth proxy, catalog, orders, reservations, reviews, Razorpay order/verify/reconcile, webhook receiver and the SMTP worker; its unit tests run with `npm run test:server`.
- `database/` — Supabase migrations in `database/supabase/migrations`, CLI configuration (`database/supabase/config.toml`) and embedded-Postgres checks run by `npm run test:db`.
- `deployment/` — Docker/nginx hosting recipes per target; `scripts/package-hosting.sh` builds the three hosting zips from these packages.
- The root `package.json` is only an orchestrator: every script delegates with `npm --prefix <package>`, so the three packages stay independently installable and deployable.
- Source paths quoted in the motion and accessibility notes below are relative to `frontend/`.

## 1. Configure Supabase

The derived project URL is `https://jrfmgqccicrpdtqztrpt.supabase.co`, but it has not been authenticated or verified here.

1. Use a **separate staging project first**. For any existing project, inspect its schema and migration history, back up its data and resolve naming conflicts before applying anything. The initial migration creates tables, RLS, grants and functions; the second installs a representative catalog once; the third adds verified-account order, payment and notification records. Do not rewrite an applied migration or rerun the catalog seed against an existing production database.
2. Authenticate the Supabase CLI via its secure prompt, link the intended target and inspect the migration plan before applying it. Substitute your staging reference initially:

   ```sh
   npm --prefix database ci
   cd database
   npx supabase login
   npx supabase link --project-ref jrfmgqccicrpdtqztrpt
   npx supabase db push --remote --dry-run
   # Only after verifying the project, backup and migration list:
   npx supabase db push --remote
   cd ..
   ```

   Never share tokens, passwords or secret keys in chat or commit them. Do not use `--include-seed` for the catalog. For local development, Docker and `npx supabase start` provide a local stack; `npx supabase db reset` destroys and recreates **local** data only.
3. In **hosted Supabase Auth**, enable email/password signups and **email confirmation**, configure an appropriate production Auth email sender, set the frontend Site URL and add its exact redirect URL to the allowlist. The site passes the frontend origin/path as the confirmation redirect. With confirmation enabled, signup normally returns no session until the email link is opened. Enable anonymous sign-ins for guest table requests, guest profiles and reviews. `database/supabase/config.toml` affects the local stack, not hosted Auth settings. The database checks `email_confirmed_at`; disabling email confirmation in Supabase can cause unverified addresses to be treated as confirmed.
4. Configure Cloudflare Turnstile in hosted Auth if used, including its **secret only in Auth**; set the matching public site key on the frontend. The app challenges first guest sign-in and, separately, email signup/sign-in. Match hostnames, provider and secrets on both sides. Also configure Auth rate limits and monitoring: the database's per-user limits alone cannot prevent creation of many accounts.

Email/password accounts are stored in Supabase Auth; the app does not store passwords in its own tables. For an order, the server snapshots the account's confirmed email into `order_requests.customer_email`. Signing into an email account from an anonymous session creates a **separate identity**: prior guest profile, reviews and table requests are not automatically transferred. Anonymous sessions are not recoverable after clearing browser data or signing out.

### MCP

`.mcp.json` scopes the optional Supabase MCP endpoint to `jrfmgqccicrpdtqztrpt` with `read_only=true` and database/docs features. An MCP-compatible client must still authenticate independently; this configuration neither connects Arena nor authorizes writes. Even read-only access can expose private project data. Use a separately authorized write workflow for migrations.

## 2. Deploy the Express API

The `backend/` package requires Node 20+ (Node 22 recommended) and an **always-on** service: the same process serves the API, receives webhooks and runs the email worker. A static host or intermittent serverless function is insufficient for the worker. Copy `backend/.env.example` to an ignored `backend/.env` locally, or set values in the backend host's private runtime-secret manager:

| Variable | Purpose |
| --- | --- |
| `PORT`, `NODE_ENV` | Port and environment; server binds `0.0.0.0`. |
| `SUPABASE_URL` | Verified project URL; staging URL first. |
| `SUPABASE_PUBLISHABLE_KEY` | Public publishable/legacy anon key for Auth and RLS-scoped calls. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** service-role/secret key for the order RPC, payment records and email worker. Never expose it to the browser. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated **exact** HTTPS frontend origins, e.g. `https://www.example.com`. CORS is not a replacement for authorization. |
| `TRUST_PROXY_HOPS` | `0` by default; set only to the known number of trusted ingress proxies. Misconfiguration lets clients spoof IPs or causes shared rate limits. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Start with test-mode credentials and a separate webhook secret. All are backend runtime settings. |
| `RAZORPAY_ALLOW_LIVE` | Defaults to `false`; explicitly set `true` only after authorized live launch review. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Separate SMTP sender for **order** emails. The app requires implicit TLS when `SMTP_SECURE=true`, otherwise STARTTLS is required. Configure Supabase Auth's signup email sender separately. |
| `ORDER_NOTIFICATION_EMAIL` | Restaurant recipient; defaults to `sultham456@gmail.com`. |

The Arena Gmail connection is not an SMTP service for a deployed website. No Gmail action is used. The backend refuses new orders when order-email configuration is absent; table requests and reviews remain separate. Configuration presence is not proof that SMTP can actually deliver.

```sh
cd server
npm ci --omit=dev
npm start
# GET /api/health = process liveness; GET /api/config = settings present, not provider connectivity
```

Deploy behind HTTPS with outbound access to Supabase, Razorpay and the SMTP provider. Examples: `deployment/backend/Dockerfile`, plus frontend Nginx files. Inject secrets at runtime, never in Docker build arguments or images. Set the exact number of trusted proxies only for a secured ingress. API rate limiting is in-memory per process; add an appropriate shared edge/WAF limit, monitoring and abuse controls for production.

## 3. Deploy the React frontend

Copy `frontend/.env.example` to ignored `frontend/.env.local`, or set build variables at the frontend host:

- `VITE_API_BASE_URL=/api` for a same-origin reverse proxy, **or** the public HTTPS API URL ending in `/api`, e.g. `https://api.example.com/api`.
- `VITE_SUPABASE_PUBLISHABLE_KEY` is the public publishable/anon key for Auth through Express. `VITE_TURNSTILE_SITE_KEY` is optional and public.
- All `VITE_` values are embedded in browser assets. **Never put a Supabase service-role/secret key, Razorpay secret, SMTP password, database password or CAPTCHA secret there.**

```sh
npm --prefix frontend ci
npm --prefix frontend run build
# Publish the contents of frontend/dist/ to an HTTPS static host.
```

Hash routes work on ordinary static hosting. For `/api`, configure your frontend host to proxy that path to the Express service while preserving `/api`; `deployment/frontend/nginx.proxy.conf.example` illustrates a private upstream. The default `nginx.conf` is static-only and intentionally returns 503 for `/api` until a proxy is configured. For a separate public API host, set the Express CORS origin to the exact frontend origin. The browser must never call the sandbox's `localhost` or `127.0.0.1` for the backend. In local development, Vite proxies `/api` **server-side** to `DEV_API_PROXY_TARGET` (default `http://127.0.0.1:3001`). Set the backend's `NODE_ENV=development` locally, or include the exact local frontend origin in `CORS_ALLOWED_ORIGINS`; use `production` for deployment:

```sh
# Terminal 1: cd backend && npm ci && npm run dev
# Terminal 2: cd frontend && npm ci && npm run dev
```

With missing public configuration or an unreachable API, a clearly labelled sample menu is shown and online ordering is disabled. The project uses no ORM or direct browser database connection.

## 4. Razorpay, acknowledgement emails and operations

- Checkout requires a signed-in, confirmed email account. Customers choose **pay later** or **Razorpay** when enabled. The order request is saved first and stays `pending`; Razorpay charges only the validated **item subtotal**, not unconfirmed taxes or delivery charges. Final availability and extra charges require restaurant confirmation.
- Configure automatic capture as appropriate in Razorpay. Create a **test** webhook at `https://YOUR_API_HOST/api/payments/razorpay/webhook` for `payment.captured` and `order.paid`, using the configured webhook secret. The server verifies the raw-body webhook signature; checkout callbacks also require HMAC verification over the stored gateway order ID and payment ID. Both paths independently fetch the payment from Razorpay and compare captured status, amount, currency and order ID before recording `paid`. Authorized, failed, mismatched or unverified payments are not marked paid. Signed webhooks are idempotent; a temporarily unregistered gateway order returns a retryable response. A customer can check/reconcile a pending payment or retry the same Razorpay order from the request page.
- Order creation queues an acknowledgement for the customer's Auth email **and** a notification for `sultham456@gmail.com` (or the configured recipient). A captured payment queues an additional payment notice for each. These messages explicitly say the request is not accepted. SMTP acceptance is not guaranteed inbox delivery. Table-request and restaurant status-change notifications are not implemented.
- The persistent `order_email_jobs` outbox retries transient failures every five minutes, up to ten failed attempts; expired leases are recoverable after a restart. Delivery is **at least once**, not exactly once: a crash after SMTP accepts a message can cause a duplicate. Monitor pending, stale `sending` and `failed` jobs, SMTP provider logs and webhook failures; manually retry failed jobs only after checking for duplicate delivery. Do not rely on the UI alone as proof of delivery.
- Staff review `order_requests` and `order_request_items` in a restricted Supabase Dashboard and contact customers. Status values are `pending`, `contacted` and `closed`; status edits do not send acceptance messages or confirm delivery. `reservation_requests` are similarly reviewed manually. Moderators set `dish_reviews.status` to `published` or `hidden`.
- If a paid request cannot be accepted, an authorized staff member must initiate and track the refund in Razorpay, using the gateway payment ID in `payment_attempts`. After verifying the actual processed refund and amount, update the order's `payment_status` to `refunded` or `partially_refunded` and record private notes as appropriate. **Refund initiation, refund webhooks, refund emails and automatic database reconciliation are not implemented**; until staff update the status, the site may still show `paid`. Avoid duplicate refunds and handle disputes through the provider. Closed requests cannot start a new payment, but a payment already in progress can finish after closure and may require a refund.
- Only the most recent order is shown in the current account's request page. If an earlier payment is uncertain, contact the restaurant with the reference. The route/courier animation is illustrative, not live tracking. Hiding a request locally does not cancel or delete it.

Order, reservation and review retries use a random idempotency reference plus a fingerprint in the current tab. An uncertain submission must be retried with the **same** details; changing them requires an explicit duplicate warning. Closing the tab, clearing browser data or switching accounts can lose that protection. A payment interruption leaves the saved request visible; check its status before trying again. Concurrent gateway-order creation can leave an unused gateway order, but only the database-registered order is returned for payment; monitor provider and webhook errors.

## REST surface and data security

`GET /api/catalog`, `/api/config`, `/api/health`; `/api/profile`; `POST /api/orders` and `GET /api/orders/latest`; `POST /api/reservations`; `/api/reviews`; and `/api/payments/{create,verify,reconcile}` are the application routes. `/api/payments/razorpay/webhook` accepts signed raw Razorpay events. `/api/supabase/auth/v1/...` is a narrow Auth-only proxy; it does not forward Supabase REST tables. Protected routes require a bearer token validated by Supabase Auth; database RLS remains active for user reads and guest operations. The order-writing and payment/notification mutations are service-only. The publishable key is not a secret; public catalog and permitted guest RPCs can still be reached through Supabase's own Data API, so secure RLS, Auth CAPTCHA and per-user database limits remain necessary.

Keep the service role and provider credentials on the backend only, protect Dashboard access, enforce HTTPS and perform a security review including XSS, browser token storage, CSP, dependencies, backups, logging and retention. Do not log contact details, payment credentials or SMTP credentials. Restaurant-only notes and other users' requests are not exposed to a guest via RLS. Staff must handle deletion/retention requests; deleting an Auth user removes their profile but deliberately retains restaurant order and table requests without an owner.

## Category reveals and the category dishes page

Category rows on the home and menu pages stay artwork-only: clicking a plate reveals the category name and its total dish count, with a `View Menu` action directly below the count. `View Menu` opens the category's own dishes page (`#/dishes/<categoryId>`), a separate cream page with a card per dish (photograph, name and price) that opens the dish page, plus a back-to-menu link. On the home and menu pages no dish names or prices appear inside the rows; deep links (`#/menu/<categoryId>`) reveal their category row and scroll it into view, and the dishes page is one tap away.

Category plate artwork uses the category's dish photograph (`public/images/dish-cutouts/`, falling back to the full photograph if a cut-out fails); `scripts/check-cutouts.mjs`, wired into `npm run build`, verifies a cut-out exists for every menu item. `tests/menu-editorial.spec.ts` locks the reveal contract, the dishes-page round trip, geometry across viewports and keyboard flow; `tests/material-a11y.spec.ts` audits the dishes page for WCAG-tagged violations.

## Motion design and accessibility
## Home: classic section order

The home page carries no cinematic opening layer: it runs hero, marquee, story, categories, signatures, services, testimonials, visit and invitation, and `tests/home.spec.ts` locks that order. The reservation message field is free-form; no floor-plan or table-preference handoff exists.


Animation is decoration: it never moves a control, resizes a hit target, widens the page, or announces a value twice.

- Every surface has its own entrance signature instead of one shared fade-up. `src/cinematic-motion.css` §16 defines eight characters — `anim-letters` (eyebrows tighten their tracking), `anim-blur` (lead copy focus-pulls), `anim-kenburns` (photography exhales from a slight zoom), `anim-clip` (framed panels wipe open), `anim-veil` (full-bleed panels are uncovered top-down), `anim-tilt-rise` (quotes tip up off the table), `anim-slide-x` (list rows enter from the reading edge) and `anim-scale-settle` (tiles overshoot and settle) — each on its own `--ease-*` curve. All fill `backwards` only, so hover transforms own the element once the arrival finishes, and a tagged element outside the reveal machinery animates on mount through the `:not(.reveal *)` arm.
- Two signatures are shaped by layout safety: `slide-x-in` enters from the left, where overflow cannot widen an LTR document, and `letter-settle` starts *tighter* than the type scale. `anim-veil` replaces `anim-scale-settle` on panels flush with a 320px viewport, because a spring overshoot measurably widened the document there for one frame.
- The vocabulary runs about a fifth to a quarter slower than the first motion pass (shared reveal 1.15s, marquee 36s, route curtain 820ms, toast 720ms, cart flight 980ms with a 1150ms landing ring), which is also why the ring now outlives the flight it lands after.

- `src/cinematic-motion.css` holds the current layer; `motion.css`, `flavour-motion.css`, `spice-motion.css` and `material.css` hold the earlier ones. Every animation is declared **inside** `@media (prefers-reduced-motion: no-preference)`, so a reduced-motion visitor computes `animation-name: none` instead of a shortened animation. Purely decorative layers are also removed with `display: none`.
- Continuous loops (steam, banner glow, embers, ornaments, loading shimmer) stop when their own section scrolls away (`data-motion-paused="true"`, set by `usePauseOffscreen`) and when the visitor uses the footer's **Pause ambient motion** control (`html[data-ambient-motion="paused"]`, persisted in `localStorage`).
- Brief feedback triggered by a tap — the dish-to-cart flight and its landing ring, the press ripple, the route curtain — respects reduced motion but stays independent of the ambient pause.
- Pointer effects require `(hover: hover) and (pointer: fine)`: the banner light pool, the magnetic button glow, the card spotlight and the artwork lean. `src/utils/motionPrefs.ts` centralises those queries, and `subscribeMotionPreference` re-syncs live when a visitor changes their OS setting mid-session.
- Scroll-driven parallax uses native `animation-timeline: view()` behind `@supports`, animating the `translate`/`scale` properties so it composes with existing transforms and needs no scroll handler. It is applied only outside `overflow: hidden` ancestors: a clipped ancestor is its own scrollport and freezes a `view()` timeline, which was verified empirically before use.
- Counting numbers keep the final value in an `sr-only` node while the running digits stay `aria-hidden` (`CountUpValue`), so assistive technology never hears a burst of intermediate amounts.
- Decorative layers are `aria-hidden="true"` with `pointer-events: none`, are clipped by their own banner so they cannot cause horizontal scrolling, and remove their own DOM nodes when a flight, ripple or curtain finishes.

`tests/cinematic-motion.spec.ts` asserts each of those guarantees, including cleanup and the reduced-motion fallbacks, on both the desktop and mobile projects.

## Local checks

```sh
npm --prefix frontend ci
npm --prefix backend ci
npm --prefix database ci
npx --prefix frontend playwright install chromium   # once, if browser tests are needed
npm run typecheck                   # delegates to frontend
npm run test:db                     # embedded Postgres/RLS/migrations (database package)
npm run test:server                 # mocked API, payment, webhook and SMTP worker (backend)
npm run test:backend                # mocked REST/Auth/browser flows (frontend suites)
npm run test:captcha                # mocked Turnstile/Auth (frontend suites)
npm run test:e2e                    # offline responsive, motion graphics and accessibility
npm run build
npm --prefix frontend audit && npm --prefix backend audit && npm --prefix database audit
./scripts/package-hosting.sh
```

The browser test servers override frontend environment variables so they cannot accidentally submit to a developer's project. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium binary. Embedded database tests, mocks and automated accessibility checks do not replace a real staging integration or manual accessibility/security testing.
