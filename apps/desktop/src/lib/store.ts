import { LazyStore } from '@tauri-apps/plugin-store';
import { ShiftSession } from '@yascar/shift-client';
import { UserConfig, DEFAULT_CONFIG, RedeemedCodeRecord } from '@yascar/user-config';

// LazyStore handles lazy loading automatically
const store = new LazyStore('yascar-data.json');

// ─────────────────────────────────────────────────────────────
// Session Storage
// ─────────────────────────────────────────────────────────────

export async function saveSession(session: ShiftSession): Promise<void> {
    await store.set('session', session);
    await store.save();
}

export async function loadSession(): Promise<ShiftSession | null> {
    const session = await store.get<ShiftSession>('session');

    if (!session) return null;

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
        await clearSession();
        return null;
    }

    return session;
}

export async function clearSession(): Promise<void> {
    await store.delete('session');
    await store.save();
}

// ─────────────────────────────────────────────────────────────
// User Config Storage
// ─────────────────────────────────────────────────────────────

export async function saveConfig(config: UserConfig): Promise<void> {
    await store.set('config', config);
    await store.save();
}

export async function loadConfig(): Promise<UserConfig> {
    const config = await store.get<UserConfig>('config');
    return config ?? DEFAULT_CONFIG;
}

// ─────────────────────────────────────────────────────────────
// Redeemed Codes Storage
// ─────────────────────────────────────────────────────────────

export async function getRedeemedCodes(): Promise<string[]> {
    return (await store.get<string[]>('redeemed')) ?? [];
}

export async function addRedeemedCode(code: string): Promise<void> {
    const existing = await getRedeemedCodes();
    if (!existing.includes(code)) {
        existing.push(code);
        await store.set('redeemed', existing);
        await store.save();
    }
}

export async function getRedemptionHistory(): Promise<RedeemedCodeRecord[]> {
    return (await store.get<RedeemedCodeRecord[]>('history')) ?? [];
}

export async function addToHistory(record: RedeemedCodeRecord): Promise<void> {
    const history = await getRedemptionHistory();
    history.unshift(record);
    await store.set('history', history);
    await store.save();
    await addRedeemedCode(record.code);
}

export async function clearAllData(): Promise<void> {
    await store.clear();
    await store.save();
}
