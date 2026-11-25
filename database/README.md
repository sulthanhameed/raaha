# Supabase database package

The intended project reference is `jrfmgqccicrpdtqztrpt`. This package contains versioned migrations and an optional read-only `.mcp.json`; neither connects or deploys itself. Do not put credentials into these files.

1. Test in a separate staging project. Before applying to any existing project, inspect its schema and migration history, resolve conflicts, and back up existing data. The migration names create tables, functions and RLS; the catalog seed contains representative, **unverified** dishes and prices.
2. Install or run Supabase CLI v3, authenticate using its secure prompt, link the intended project, inspect a dry run, and only then apply:

   ```sh
   npx supabase@3.2.0 login
   npx supabase@3.2.0 link --project-ref jrfmgqccicrpdtqztrpt
   npx supabase@3.2.0 db push --remote --dry-run
   npx supabase@3.2.0 db push --remote
   ```

   Use your staging project reference first. Never rerun or rewrite an applied migration; use new migrations or authorized edits. Do not use `--include-seed` for the catalog.
3. In hosted Auth, enable email/password signup **and email confirmation**, configure a production Auth email sender, set the frontend Site URL and allowed redirect URL, and enable anonymous sign-ins for table requests/reviews. Local `config.toml` does not change hosted Auth. Enable matching CAPTCHA settings in both Auth and the frontend if used.
4. Configure the separate Express backend with the project URL, publishable key and server-only service-role key. Give the frontend only the publishable key. Use RLS and restricted Dashboard access. The service-only order RPC checks the verified Auth user, snapshots catalog prices and atomically queues email jobs; clients cannot invoke it directly.

`.mcp.json` requests a project-scoped, read-only Supabase MCP server. A compatible tool must separately authenticate; the configuration does not establish an Arena connection, apply migrations or authorize writes. Read-only access can still expose private data.

### Embedded migration checks

This package ships `package.json`, `package-lock.json` and `scripts/`, so the migration, RLS, order, payment and notification checks can run without the frontend source:

```sh
npm ci
npm test        # runs both scripts against embedded Postgres (PGlite); no network or credentials
npm run push:dry-run   # after login/link, against YOUR chosen project
```

These checks run the real migration SQL against an in-process Postgres with a small `auth.uid()` shim. They validate schema, policies and transactional behaviour, but they are **not** an integration test against a real Supabase project and cannot detect hosted Auth, email or network configuration problems.

See the main `README.md` for the end-to-end deployment, notifications, webhook, manual refunds, monitoring, RLS and privacy guidance.
