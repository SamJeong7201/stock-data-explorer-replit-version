import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/**
 * PORT — required in Replit (injected automatically).
 * Falls back to 5173 (Vite's default) so the build works
 * anywhere else (Vercel CI, local VS Code, etc.).
 */
const port = Number(process.env["PORT"] ?? 5173);

/**
 * BASE_PATH — Replit path-based routing prefix (e.g. "/stock-tracker").
 * On Vercel and standard hosts the app is always at "/", so we default
 * to "/" when the variable is not set. This prevents build failures
 * outside of Replit.
 */
const basePath = process.env["BASE_PATH"] ?? "/";

/**
 * Only load Replit-specific dev plugins when running inside a Repl.
 * This keeps the production build and Vercel CI completely clean.
 */
const isReplit = Boolean(process.env["REPL_ID"]);

const replitPlugins = isReplit
  ? await Promise.all([
      import("@replit/vite-plugin-runtime-error-modal").then((m) =>
        m.default(),
      ),
      import("@replit/vite-plugin-cartographer").then((m) =>
        m.cartographer({
          root: path.resolve(import.meta.dirname, ".."),
        }),
      ),
      import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
    ])
  : [];

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "attached_assets",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
