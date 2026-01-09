import { create } from "zustand";
import { ShiftSession } from "@yascar/shift-client";
import { ShiftCode, SHIFT_CODES_API_URL } from "@yascar/types";
import { saveSession, clearAllData, loadSession } from "../lib/store";
import {
  setClientSession,
  clearClientSession,
  getShiftClient,
} from "../lib/shift";
import { fetch } from "@tauri-apps/plugin-http";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface RedemptionProgress {
  current: number;
  total: number;
  currentCode?: string;
  status: "idle" | "checking" | "redeeming" | "done" | "error";
  results: RedemptionResult[];
}

export interface RedemptionResult {
  code: string;
  success: boolean;
  message: string;
}

export interface AppError {
  message: string;
  retryable: boolean;
}

interface AppState {
  // ─────────────────────────────────────────────────────────────
  // Authentication
  // ─────────────────────────────────────────────────────────────
  session: ShiftSession | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  initSession: () => Promise<void>;
  login: (session: ShiftSession) => Promise<void>;
  logout: () => Promise<void>;

  // ─────────────────────────────────────────────────────────────
  // Redemption Progress
  // ─────────────────────────────────────────────────────────────
  redemptionProgress: RedemptionProgress;
  setRedemptionProgress: (progress: RedemptionProgress) => void;
  resetRedemptionProgress: () => void;
  isRedemptionInProgress: () => boolean;

  // Auto-redeem scheduling
  nextAutoRedeemAt: Date | null;
  setNextAutoRedeemAt: (date: Date | null) => void;

  // ─────────────────────────────────────────────────────────────
  // Network Status
  // ─────────────────────────────────────────────────────────────
  isOnline: boolean;
  setOnline: (online: boolean) => void;
  checkConnectivity: () => Promise<boolean>;

  // ─────────────────────────────────────────────────────────────
  // Global Error
  // ─────────────────────────────────────────────────────────────
  globalError: AppError | null;
  setGlobalError: (error: AppError | null) => void;
}

const initialRedemptionProgress: RedemptionProgress = {
  current: 0,
  total: 0,
  status: "idle",
  results: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  // ─────────────────────────────────────────────────────────────
  // Authentication
  // ─────────────────────────────────────────────────────────────
  session: null,
  isAuthenticated: false,
  isAuthLoading: true,

  initSession: async () => {
    try {
      const session = await loadSession();
      if (session) {
        setClientSession(session);
        set({ session, isAuthenticated: true });
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      set({ isAuthLoading: false });
    }
  },

  login: async (session: ShiftSession) => {
    try {
      await saveSession(session);
      setClientSession(session);
      set({ session, isAuthenticated: true });
    } catch (error) {
      console.error("Failed to save session:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await clearAllData();
      clearClientSession();
      set({
        session: null,
        isAuthenticated: false,
        redemptionProgress: initialRedemptionProgress,
      });
    } catch (error) {
      console.error("Failed to clear data:", error);
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────────────
  // Redemption Progress
  // ─────────────────────────────────────────────────────────────
  redemptionProgress: initialRedemptionProgress,

  setRedemptionProgress: (progress) => {
    set({ redemptionProgress: progress });
  },

  resetRedemptionProgress: () => {
    set({ redemptionProgress: initialRedemptionProgress });
  },

  isRedemptionInProgress: () => {
    const { status } = get().redemptionProgress;
    return status === "checking" || status === "redeeming";
  },

  // Auto-redeem scheduling
  nextAutoRedeemAt: null,

  setNextAutoRedeemAt: (date) => {
    set({ nextAutoRedeemAt: date });
  },

  // ─────────────────────────────────────────────────────────────
  // Network Status
  // ─────────────────────────────────────────────────────────────
  isOnline: true,

  setOnline: (online) => {
    const prev = get().isOnline;
    if (prev !== online) {
      console.log(`[Network] Status changed: ${online ? "ONLINE" : "OFFLINE"}`);
      set({ isOnline: online });
    }
  },

  checkConnectivity: async () => {
    try {
      const response = await fetch(SHIFT_CODES_API_URL, { method: "HEAD" });
      const online = response.ok;
      get().setOnline(online);
      return online;
    } catch (error) {
      console.log("[Network] Connectivity check failed:", error);
      get().setOnline(false);
      return false;
    }
  },

  // ─────────────────────────────────────────────────────────────
  // Global Error
  // ─────────────────────────────────────────────────────────────
  globalError: null,

  setGlobalError: (error) => {
    set({ globalError: error });
  },
}));

// ─────────────────────────────────────────────────────────────
// Selectors (for convenience)
// ─────────────────────────────────────────────────────────────

export const selectIsAuthenticated = (state: AppState) => state.isAuthenticated;
export const selectIsAuthLoading = (state: AppState) => state.isAuthLoading;
export const selectRedemptionProgress = (state: AppState) =>
  state.redemptionProgress;
export const selectIsOnline = (state: AppState) => state.isOnline;
export const selectGlobalError = (state: AppState) => state.globalError;
export const selectNextAutoRedeemAt = (state: AppState) =>
  state.nextAutoRedeemAt;

// ─────────────────────────────────────────────────────────────
// Network status initialization with browser events
// ─────────────────────────────────────────────────────────────

if (typeof window !== "undefined") {
  // Initialize with browser's online state
  useAppStore.getState().setOnline(navigator.onLine);

  // Listen for browser online/offline events
  window.addEventListener("online", () =>
    useAppStore.getState().setOnline(true)
  );
  window.addEventListener("offline", () =>
    useAppStore.getState().setOnline(false)
  );

  // Periodic connectivity check (every 60 seconds)
  setInterval(() => {
    useAppStore.getState().checkConnectivity();
  }, 60000);
}
