import { LazyStore } from "@tauri-apps/plugin-store";
import { ShiftSession } from "@yascar/shift-client";
import {
  UserConfig,
  DEFAULT_CONFIG,
  RedeemedCodeRecord,
} from "@yascar/user-config";
import {
  getPassword,
  setPassword,
  deletePassword,
} from "tauri-plugin-keyring-api";

// LazyStore handles lazy loading automatically (for non-sensitive data)
const store = new LazyStore("yascar-data.json");

// Keyring configuration
const KEYRING_SERVICE = "com.yascar.desktop";
const KEYRING_SESSION_KEY = "shift-session";

// ─────────────────────────────────────────────────────────────
// Session Storage (Secure - uses OS Keychain)
// ─────────────────────────────────────────────────────────────

export async function saveSession(session: ShiftSession): Promise<void> {
  try {
    // Store session as JSON in the OS keychain
    await setPassword(
      KEYRING_SERVICE,
      KEYRING_SESSION_KEY,
      JSON.stringify(session)
    );
  } catch (error) {
    console.error("Failed to save session to keychain:", error);
    throw error;
  }
}

export async function loadSession(): Promise<ShiftSession | null> {
  try {
    const sessionJson = await getPassword(KEYRING_SERVICE, KEYRING_SESSION_KEY);

    if (!sessionJson) return null;

    const session: ShiftSession = JSON.parse(sessionJson);

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await clearSession();
      return null;
    }

    return session;
  } catch (error) {
    // If keychain access fails or no session exists, return null
    console.log("No session in keychain or access failed:", error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await deletePassword(KEYRING_SERVICE, KEYRING_SESSION_KEY);
  } catch (error) {
    // Ignore errors when deleting (might not exist)
    console.log("Failed to clear session from keychain:", error);
  }
}

// ─────────────────────────────────────────────────────────────
// User Config Storage
// ─────────────────────────────────────────────────────────────

export async function saveConfig(config: UserConfig): Promise<void> {
  await store.set("config", config);
  await store.save();
}

export async function loadConfig(): Promise<UserConfig> {
  const config = await store.get<UserConfig>("config");
  return config ?? DEFAULT_CONFIG;
}

// ─────────────────────────────────────────────────────────────
// Redeemed Codes Storage
// ─────────────────────────────────────────────────────────────

export async function getRedeemedCodes(): Promise<string[]> {
  return (await store.get<string[]>("redeemed")) ?? [];
}

export async function addRedeemedCode(code: string): Promise<void> {
  const existing = await getRedeemedCodes();
  if (!existing.includes(code)) {
    existing.push(code);
    await store.set("redeemed", existing);
    await store.save();
  }
}

export async function isCodeRedeemed(code: string): Promise<boolean> {
  const redeemed = await getRedeemedCodes();
  return redeemed.includes(code);
}

export async function getRedemptionHistory(): Promise<RedeemedCodeRecord[]> {
  return (await store.get<RedeemedCodeRecord[]>("history")) ?? [];
}

export async function addToHistory(record: RedeemedCodeRecord): Promise<void> {
  const history = await getRedemptionHistory();
  history.unshift(record);
  await store.set("history", history);
  await store.save();
  await addRedeemedCode(record.code);
}

export async function clearAllData(): Promise<void> {
  await store.clear();
  await store.save();
}

// ─────────────────────────────────────────────────────────────
// Failed Codes Storage (for tracking unsuccessful redemptions)
// ─────────────────────────────────────────────────────────────

export interface FailedCodeRecord {
  code: string;
  failedAt: string;
  reason: string;
  attemptCount: number;
}

export async function getFailedCodes(): Promise<FailedCodeRecord[]> {
  return (await store.get<FailedCodeRecord[]>("failedCodes")) ?? [];
}

export async function addFailedCode(
  code: string,
  reason: string
): Promise<void> {
  const existing = await getFailedCodes();
  const existingIndex = existing.findIndex((f) => f.code === code);

  if (existingIndex >= 0) {
    // Update existing record
    existing[existingIndex].failedAt = new Date().toISOString();
    existing[existingIndex].reason = reason;
    existing[existingIndex].attemptCount += 1;
  } else {
    // Add new record
    existing.push({
      code,
      failedAt: new Date().toISOString(),
      reason,
      attemptCount: 1,
    });
  }

  await store.set("failedCodes", existing);
  await store.save();
}

export async function isCodeFailed(code: string): Promise<boolean> {
  const failed = await getFailedCodes();
  return failed.some((f) => f.code === code);
}

export async function removeFailedCode(code: string): Promise<void> {
  const existing = await getFailedCodes();
  const filtered = existing.filter((f) => f.code !== code);
  await store.set("failedCodes", filtered);
  await store.save();
}

export async function clearFailedCodes(): Promise<void> {
  await store.delete("failedCodes");
  await store.save();
}

// ─────────────────────────────────────────────────────────────
// Setup Wizard State
// ─────────────────────────────────────────────────────────────

export async function hasCompletedSetup(): Promise<boolean> {
  return (await store.get<boolean>("setup_completed")) ?? false;
}

export async function setSetupCompleted(completed: boolean): Promise<void> {
  await store.set("setup_completed", completed);
  await store.save();
}

// ─────────────────────────────────────────────────────────────
// Auto-Redeem Schedule Storage
// ─────────────────────────────────────────────────────────────

export async function getNextAutoRedeemAt(): Promise<Date | null> {
  const isoString = await store.get<string>("nextAutoRedeemAt");
  return isoString ? new Date(isoString) : null;
}

export async function setNextAutoRedeemAt(date: Date | null): Promise<void> {
  if (date) {
    await store.set("nextAutoRedeemAt", date.toISOString());
  } else {
    await store.delete("nextAutoRedeemAt");
  }
  await store.save();
}
