import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), viteSingleFile()],
    server: {
      host: "0.0.0.0", allowedHosts: [".e2b.app"],
      // This target is used by Vite, never by the user's browser.
      proxy: { "/api": { target: env.DEV_API_PROXY_TARGET || "http://127.0.0.1:3001", changeOrigin: true } },
    },
    preview: { host: "0.0.0.0", allowedHosts: [".e2b.app"] },
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  };
});
