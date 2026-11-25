# Frontend hosting package

This is the React/Vite source, not a preconfigured production build. The backend and Supabase migrations are provided separately. Node 20+ is required; Node 22 is recommended.

1. Copy `.env.example` to `.env.local` (or set the same values in your host's build settings). Set `VITE_API_BASE_URL` to your **public HTTPS Express API URL ending in `/api`**, for example `https://api.example.com/api`, or to `/api` if your frontend host reverse-proxies that path to Express. Set `VITE_SUPABASE_PUBLISHABLE_KEY` to the project's public publishable/anon key. Optionally set the Turnstile public site key after configuring Supabase Auth.
2. Run `npm ci` and `npm run build`; publish the contents of `dist/` on an HTTPS static host. The build embeds `VITE_` variables: **never use a service-role key, database password, Razorpay secret or SMTP password in them**.
3. In the Express server, set `CORS_ALLOWED_ORIGINS` to the exact frontend origin, e.g. `https://www.example.com`, and configure all server-side secrets on the backend host. Confirm the browser sends requests to Express, not `localhost`.
4. For an optional static container, from this package's root run `docker build -f deployment/frontend/Dockerfile --build-arg VITE_API_BASE_URL=https://api.example.com/api --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY -t raaha-frontend .`; serve port 8080 behind HTTPS. `deployment/frontend/nginx.conf` is static-only. For `/api` same-origin hosting, replace it with `nginx.proxy.conf.example` and point its upstream to the **private** backend service; adjust trusted proxy settings and HTTPS termination.

### Checks bundled with this package

```sh
npm ci
npx playwright install chromium   # once, for browser tests
npm run typecheck
npm run build                     # also verifies dish cutouts, table scenes and hotspots
npm run test:e2e                  # offline responsive, motion and accessibility tests
npm run test:backend              # REST/Auth/payment flows against an in-test mocked API
npm run test:captcha              # Turnstile flows against a mocked challenge
```

All three Playwright configs start their own Vite server and override `VITE_API_BASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_TURNSTILE_SITE_KEY`, so they cannot accidentally submit to a real project. They prove browser behaviour only — they do not contact Supabase, Razorpay, SMTP or a real backend. Embedded database/RLS checks ship in the separate database package; Express API tests ship in the backend package.

Unconfigured builds intentionally show a representative menu and disable ordering. Verify all seeded prices, availability and business details before accepting requests. An order and any online payment remain pending restaurant review; route tracking is a simulation.

See the main repository's `README.md` for Supabase, Razorpay, SMTP, webhook, operations and staging-test instructions. Do not upload real `.env.local` files with this package.
