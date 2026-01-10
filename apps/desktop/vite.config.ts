import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

/** ESM-compatible __dirname equivalent */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  /**
   * Determines if we're in test mode (running web-based e2e tests).
   * In test mode, Tauri plugins are replaced with browser-compatible mocks.
   */
  const isTestMode = mode === "test";

  return {
    plugins: [
      react(),
      /**
       * Sentry Vite plugin uploads source maps during CI builds.
       * Requires SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT env vars.
       * Only runs when auth token is available (typically in CI).
       */
      sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        disable: !env.SENTRY_AUTH_TOKEN,
      }),
    ],
    // Prevent vite from obscuring rust errors
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
    },
    envPrefix: ["VITE_", "TAURI_"],
    build: {
      target: "esnext",
      minify: !env.TAURI_DEBUG ? "esbuild" : false,
      // Always generate source maps for Sentry error debugging
      sourcemap: true,
    },
    /**
     * In test mode, redirect Tauri plugin imports to our mock implementations.
     * This allows the React app to run in a browser without Tauri.
     */
    resolve: isTestMode
      ? {
          alias: {
            "@tauri-apps/plugin-store": path.resolve(
              __dirname,
              "src/mocks/tauri/store.ts"
            ),
            "@tauri-apps/plugin-http": path.resolve(
              __dirname,
              "src/mocks/tauri/http.ts"
            ),
            "tauri-plugin-keyring-api": path.resolve(
              __dirname,
              "src/mocks/tauri/keyring.ts"
            ),
            "@tauri-apps/plugin-autostart": path.resolve(
              __dirname,
              "src/mocks/tauri/autostart.ts"
            ),
            "@tauri-apps/plugin-notification": path.resolve(
              __dirname,
              "src/mocks/tauri/notification.ts"
            ),
            "@tauri-apps/plugin-dialog": path.resolve(
              __dirname,
              "src/mocks/tauri/dialog.ts"
            ),
            "@tauri-apps/plugin-process": path.resolve(
              __dirname,
              "src/mocks/tauri/process.ts"
            ),
            "@tauri-apps/plugin-updater": path.resolve(
              __dirname,
              "src/mocks/tauri/updater.ts"
            ),
            "@tauri-apps/api": path.resolve(
              __dirname,
              "src/mocks/tauri/core.ts"
            ),
          },
        }
      : undefined,
    /**
     * In test mode, force Vite to re-bundle packages that depend on Tauri APIs
     * so our aliases are applied correctly.
     */
    optimizeDeps: isTestMode
      ? {
          include: ["tauri-plugin-keyring-api"],
          esbuildOptions: {
            // Force esbuild to use our aliases
            plugins: [],
          },
        }
      : undefined,
    /**
     * Define global constants for conditional code.
     */
    define: {
      __IS_TEST_MODE__: JSON.stringify(isTestMode),
    },
  };
});
