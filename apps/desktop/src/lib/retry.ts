/**
 * Retry utilities with exponential backoff
 */

import { AppError, ErrorType, isRetryableError } from './errors';

export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts?: number;
    /** Initial delay in ms before first retry (default: 1000) */
    initialDelay?: number;
    /** Maximum delay in ms between retries (default: 10000) */
    maxDelay?: number;
    /** Multiplier for exponential backoff (default: 2) */
    backoffFactor?: number;
    /** Optional callback when a retry happens */
    onRetry?: (attempt: number, error: unknown, nextDelay: number) => void;
    /** Custom function to determine if error is retryable */
    isRetryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'isRetryable'>> = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
};

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const { maxAttempts, initialDelay, maxDelay, backoffFactor, onRetry, isRetryable } = config;

    let lastError: unknown;
    let currentDelay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if we should retry
            const shouldRetry = isRetryable ? isRetryable(error) : isRetryableError(error);

            if (!shouldRetry || attempt === maxAttempts) {
                throw error;
            }

            // Calculate next delay with jitter
            const jitter = Math.random() * 0.3 * currentDelay;
            const delay = Math.min(currentDelay + jitter, maxDelay);

            // Notify about retry
            if (onRetry) {
                onRetry(attempt, error, delay);
            }

            console.log(`[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms...`);

            // Wait before retry
            await sleep(delay);

            // Increase delay for next attempt
            currentDelay = Math.min(currentDelay * backoffFactor, maxDelay);
        }
    }

    throw lastError;
}

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit & { timeout?: number },
    customFetch?: typeof fetch
): Promise<Response> {
    const { timeout = 30000, ...fetchInit } = init || {};
    const fetchFn = customFetch || globalThis.fetch;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetchFn(input, {
            ...fetchInit,
            signal: controller.signal,
        });
        return response;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new AppError({
                type: ErrorType.TIMEOUT,
                message: `Request timed out after ${timeout}ms`,
                userMessage: 'Request timed out. Please try again.',
                retryable: true,
            });
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
