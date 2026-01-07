import { ShiftClient, ShiftSession } from '@yascar/shift-client';

// Singleton client instance
let client: ShiftClient | null = null;

export function getShiftClient(): ShiftClient {
    if (!client) {
        client = new ShiftClient();
    }
    return client;
}

export function setClientSession(session: ShiftSession): void {
    getShiftClient().setSession(session);
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

export { ShiftClient, ShiftSession };
