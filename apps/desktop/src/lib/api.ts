// @ts-ignore
import { fetch } from '@tauri-apps/plugin-http';
import { ApiResponse, ShiftCode, GameTitle } from '@yascar/types';
import { getRedeemedCodes, getFailedCodes, FailedCodeRecord } from './store';

const API_URL = 'https://shift.keeganfargher.co.za/shift-codes.json';

/**
 * Fetch all available shift codes from the API
 */
export async function fetchShiftCodes(): Promise<ShiftCode[]> {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch codes: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    return data.codes;
}

export interface CodesFetchResult {
    available: ShiftCode[];
    failed: (ShiftCode & { failedReason: string; attemptCount: number })[];
    redeemed: ShiftCode[];
}

/**
 * Fetch codes filtered by user's game preferences, with status tracking
 */
export async function fetchAvailableCodes(games: GameTitle[]): Promise<CodesFetchResult> {
    const [allCodes, redeemedCodes, failedCodes] = await Promise.all([
        fetchShiftCodes(),
        getRedeemedCodes(),
        getFailedCodes(),
    ]);

    const redeemedSet = new Set(redeemedCodes);
    const failedMap = new Map(failedCodes.map(f => [f.code, f]));

    const result: CodesFetchResult = {
        available: [],
        failed: [],
        redeemed: [],
    };

    for (const code of allCodes) {
        // Skip expired codes
        if (code.expired) {
            continue;
        }

        // Filter by user's selected games
        const hasMatchingGame = code.games.some(game =>
            games.includes(game as GameTitle)
        );
        if (!hasMatchingGame) {
            continue;
        }

        // Categorize the code
        if (redeemedSet.has(code.code)) {
            result.redeemed.push(code);
        } else if (failedMap.has(code.code)) {
            const failedRecord = failedMap.get(code.code)!;
            result.failed.push({
                ...code,
                failedReason: failedRecord.reason,
                attemptCount: failedRecord.attemptCount,
            });
        } else {
            result.available.push(code);
        }
    }

    return result;
}

