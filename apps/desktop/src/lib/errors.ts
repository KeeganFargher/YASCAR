/**
 * Custom error types for better error categorization and handling
 */

export enum ErrorType {
    NETWORK = 'NETWORK',
    API = 'API',
    AUTH = 'AUTH',
    PARSE = 'PARSE',
    TIMEOUT = 'TIMEOUT',
    RATE_LIMIT = 'RATE_LIMIT',
    UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
    readonly type: ErrorType;
    readonly statusCode?: number;
    readonly retryable: boolean;
    readonly userMessage: string;

    constructor(options: {
        type: ErrorType;
        message: string;
        userMessage?: string;
        statusCode?: number;
        retryable?: boolean;
        cause?: unknown;
    }) {
        super(options.message);
        this.name = 'AppError';
        this.type = options.type;
        this.statusCode = options.statusCode;
        this.retryable = options.retryable ?? false;
        this.userMessage = options.userMessage ?? this.getDefaultUserMessage();
        this.cause = options.cause;
    }

    private getDefaultUserMessage(): string {
        switch (this.type) {
            case ErrorType.NETWORK:
                return 'Unable to connect. Check your internet connection.';
            case ErrorType.API:
                return 'Server error. Please try again later.';
            case ErrorType.AUTH:
                return 'Authentication failed. Please log in again.';
            case ErrorType.PARSE:
                return 'Received invalid data from server.';
            case ErrorType.TIMEOUT:
                return 'Request timed out. Please try again.';
            case ErrorType.RATE_LIMIT:
                return 'Too many requests. Please wait a moment.';
            default:
                return 'An unexpected error occurred.';
        }
    }
}

/**
 * Check if an error is a network/connectivity error
 */
export function isNetworkError(error: unknown): boolean {
    if (error instanceof AppError && error.type === ErrorType.NETWORK) {
        return true;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return true;
    }
    const message = String(error).toLowerCase();
    return (
        message.includes('network') ||
        message.includes('failed to fetch') ||
        message.includes('net::') ||
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('timeout')
    );
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof AppError) {
        return error.retryable;
    }
    if (isNetworkError(error)) {
        return true;
    }
    return false;
}

/**
 * Get a user-friendly error message
 */
export function getUserMessage(error: unknown): string {
    if (error instanceof AppError) {
        return error.userMessage;
    }
    if (isNetworkError(error)) {
        return 'Unable to connect. Check your internet connection.';
    }
    if (error instanceof Error) {
        // Sanitize technical error messages
        const msg = error.message;
        if (msg.includes('HTTP 5')) {
            return 'Server error. Please try again later.';
        }
        if (msg.includes('HTTP 4')) {
            return 'Request failed. The resource may be unavailable.';
        }
        return msg;
    }
    return 'An unexpected error occurred.';
}

/**
 * Wrap an error with additional context
 */
export function wrapError(error: unknown, type: ErrorType, userMessage?: string): AppError {
    const message = error instanceof Error ? error.message : String(error);
    return new AppError({
        type,
        message,
        userMessage,
        retryable: type === ErrorType.NETWORK || type === ErrorType.TIMEOUT || type === ErrorType.RATE_LIMIT,
        cause: error,
    });
}
