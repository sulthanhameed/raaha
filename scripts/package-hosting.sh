#!/bin/sh
# Build three source hosting packages from the monorepo packages without
# copying local environment files, credentials, dependencies, databases or
# generated build directories.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OUT="$ROOT/hosting-packages"
TMP=$(mktemp -d "${TMPDIR:-/tmp}/raaha-hosting.XXXXXX")
trap 'rm -rf "$TMP"' EXIT HUP INT TERM
mkdir -p "$OUT" "$TMP/frontend/scripts" "$TMP/frontend/deployment/frontend" "$TMP/backend" "$TMP/database/supabase" "$TMP/database/scripts"

cp "$ROOT/frontend/package.json" "$ROOT/frontend/package-lock.json" "$ROOT/frontend/index.html" "$ROOT/frontend/vite.config.ts" "$ROOT/frontend/tsconfig.json" "$ROOT/frontend/.env.example" "$TMP/frontend/"
cp -R "$ROOT/frontend/src" "$ROOT/frontend/public" "$TMP/frontend/"
cp "$ROOT/frontend/playwright.config.ts" "$ROOT/frontend/playwright.backend.config.ts" "$ROOT/frontend/playwright.captcha.config.ts" "$TMP/frontend/"
cp -R "$ROOT/frontend/tests" "$ROOT/frontend/tests-backend" "$ROOT/frontend/tests-captcha" "$TMP/frontend/"
cp "$ROOT/deployment/frontend/Dockerfile" "$ROOT/deployment/frontend/nginx.conf" "$ROOT/deployment/frontend/nginx.proxy.conf.example" "$ROOT/deployment/frontend/README.md" "$TMP/frontend/deployment/frontend/"
cp "$ROOT/deployment/frontend/README.md" "$TMP/frontend/README.md"

cp "$ROOT/backend/package.json" "$ROOT/backend/package-lock.json" "$ROOT/backend/.env.example" "$TMP/backend/"
cp -R "$ROOT/backend/src" "$ROOT/backend/tests" "$TMP/backend/"
cp "$ROOT/deployment/backend/Dockerfile" "$TMP/backend/Dockerfile"
cp "$ROOT/deployment/backend/README.md" "$TMP/backend/README.md"

cp "$ROOT/database/package.json" "$ROOT/database/package-lock.json" "$TMP/database/"
cp "$ROOT/database/supabase/config.toml" "$ROOT/database/supabase/.gitignore" "$TMP/database/supabase/"
cp -R "$ROOT/database/supabase/migrations" "$TMP/database/supabase/"
cp "$ROOT/database/scripts/test-supabase.mjs" "$ROOT/database/scripts/test-orders-payments.mjs" "$TMP/database/scripts/"
if [ -f "$ROOT/.mcp.json" ]; then cp "$ROOT/.mcp.json" "$TMP/database/.mcp.json"; fi
cp "$ROOT/database/README.md" "$TMP/database/README.md"

for part in frontend backend database; do
  cp "$ROOT/README.md" "$TMP/$part/DEPLOYMENT_GUIDE.md"
  cp "$ROOT/docs/PROJECT_PROMPT.md" "$TMP/$part/PROJECT_PROMPT.md"
  archive="$OUT/raaha-$part.zip"
  rm -f "$archive"
  (cd "$TMP/$part" && zip -q -r "$archive" .)
  echo "Created $archive"
done
