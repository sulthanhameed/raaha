import { defineConfig } from "@playwright/test";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
export default defineConfig({
  testDir: "./tests-captcha",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 2,
  use: { baseURL: "http://127.0.0.1:5182", browserName: "chromium", reducedMotion: "reduce", launchOptions: executablePath ? { executablePath } : {} },
  projects: [
    { name: "mobile", use: { viewport: { width: 320, height: 700 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm run dev -- --host 0.0.0.0 --port 5182 --strictPort",
    env: { VITE_API_BASE_URL: "https://mock.raaha.test/api", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test", VITE_SUPABASE_ANON_KEY: "", VITE_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" },
    url: "http://127.0.0.1:5182",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
