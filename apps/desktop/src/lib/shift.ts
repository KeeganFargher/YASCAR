// @ts-ignore
import { fetch } from '@tauri-apps/plugin-http';
import { ShiftClient } from '@yascar/shift-client';
import type { ShiftSession } from '@yascar/shift-client';

// Singleton client instance
let client: ShiftClient | null = null;

export function getShiftClient(): ShiftClient {
    if (!client) {
        client = new ShiftClient({ fetch });
    }
    return client;
}

export function setClientSession(session: ShiftSession): void {
    getShiftClient().setSession(session);
}

export function clearClientSession(): void {
    client = null;
}

export async function loginToShift(
    email: string,
    password: string
): Promise<{ success: boolean; session?: ShiftSession; error?: string }> {
    const result = await getShiftClient().login(email, password);
    return result;
}

export function isClientAuthenticated(): boolean {
    return getShiftClient().isAuthenticated();
}

export { ShiftClient };
export type { ShiftSession };
