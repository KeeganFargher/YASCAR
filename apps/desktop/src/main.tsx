import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

/**
 * Initialize Sentry for error tracking and performance monitoring.
 * The DSN is injected at build time via environment variables.
 * Session replay captures user interactions leading up to errors.
 */
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.DEV ? "development" : "production",
  enabled: !!import.meta.env.VITE_SENTRY_DSN, // Only enable if DSN is provided
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  /** Sample rate for performance monitoring (10% of transactions) */
  tracesSampleRate: 0.1,
  /** Sample rate for session replays in normal sessions */
  replaysSessionSampleRate: 0.1,
  /** Always capture session replays when an error occurs */
  replaysOnErrorSampleRate: 1.0,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
