// @ts-ignore
import { fetch } from '@tauri-apps/plugin-http';
import { ApiResponse, ShiftCode, GameTitle, SHIFT_CODES_API_URL } from '@yascar/types';
import { getRedeemedCodes, getFailedCodes, FailedCodeRecord } from './store';
import { AppError, ErrorType, getUserMessage } from './errors';
import { withRetry } from './retry';
import { useAppStore } from '../stores/useAppStore';
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Fetch all available shift codes from the API with retry logic
 */
export async function fetchShiftCodes(): Promise<ShiftCode[]> {
    // Check network status first
    if (!useAppStore.getState().isOnline) {
        throw new AppError({
            type: ErrorType.NETWORK,
            message: 'No internet connection',
            userMessage: 'You appear to be offline. Check your internet connection.',
            retryable: true,
        });
    }

    return withRetry(
        async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            try {
                const response = await fetch(SHIFT_CODES_API_URL, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                    },
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorType = response.status >= 500 ? ErrorType.API : ErrorType.NETWORK;
                    const retryable = response.status >= 500 || response.status === 429;

                    throw new AppError({
                        type: errorType,
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        statusCode: response.status,
                        retryable,
                        userMessage: getHttpErrorMessage(response.status),
                    });
                }

                let data: ApiResponse;
                try {
                    data = await response.json();
                } catch (parseError) {
                    throw new AppError({
                        type: ErrorType.PARSE,
                        message: 'Failed to parse API response',
                        userMessage: 'Received invalid data from server. Please try again.',
                        retryable: false,
                        cause: parseError,
                    });
                }

                if (!data.codes || !Array.isArray(data.codes)) {
                    throw new AppError({
                        type: ErrorType.PARSE,
                        message: 'Invalid API response structure',
                        userMessage: 'Received unexpected data format from server.',
                        retryable: false,
                    });
                }

                return data.codes;
            } catch (error) {
                clearTimeout(timeoutId);

                // Handle abort/timeout
                if (error instanceof Error && error.name === 'AbortError') {
                    throw new AppError({
                        type: ErrorType.TIMEOUT,
                        message: 'Request timed out',
                        userMessage: 'Request timed out. Please check your connection and try again.',
                        retryable: true,
                    });
                }

                // Re-throw AppErrors as-is
                if (error instanceof AppError) {
                    throw error;
                }

                // Wrap unknown errors
                throw new AppError({
                    type: ErrorType.NETWORK,
                    message: error instanceof Error ? error.message : String(error),
                    userMessage: 'Unable to connect to the server. Please check your internet connection.',
                    retryable: true,
                    cause: error,
                });
            }
        },
        {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 5000,
            onRetry: (attempt, error, nextDelay) => {
                console.log(`[API] Retry ${attempt}/3 after error:`, getUserMessage(error), `(next retry in ${Math.round(nextDelay)}ms)`);
            },
        }
    );
}

/**
 * Get user-friendly message for HTTP status codes
 */
function getHttpErrorMessage(status: number): string {
    switch (status) {
        case 400:
            return 'Invalid request. Please try again.';
        case 401:
        case 403:
            return 'Access denied. Please log in again.';
        case 404:
            return 'Shift codes data not found. The server may be updating.';
        case 429:
            return 'Too many requests. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
        case 504:
            return 'Server is temporarily unavailable. Please try again later.';
        default:
            return `Server error (${status}). Please try again later.`;
    }
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

