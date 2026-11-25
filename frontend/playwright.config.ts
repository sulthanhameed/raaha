import { defineConfig } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 2,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5179",
    browserName: "chromium",
    reducedMotion: "reduce",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 320, height: 700 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm run dev -- --host 0.0.0.0 --port 5179 --strictPort",
    url: "http://127.0.0.1:5179",
    // Never run offline tests against a developer's .env.local project.
    env: { VITE_API_BASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "", VITE_SUPABASE_ANON_KEY: "", VITE_TURNSTILE_SITE_KEY: "" },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
