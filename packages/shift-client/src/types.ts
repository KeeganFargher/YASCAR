import { GameTitle, Platform } from "@yascar/types";

/**
 * SHiFT API base URL
 */
export const SHIFT_BASE_URL = "https://shift.gearboxsoftware.com";

/**
 * Game title to SHiFT API code mapping
 */
export const GAME_CODES: Record<GameTitle, string> = {
    [GameTitle.BL_GOTY]: "mopane",
    [GameTitle.BL2]: "willow2",
    [GameTitle.BL_TPS]: "cork",
    [GameTitle.BL3]: "oak",
    [GameTitle.BL4]: "oak2",
    [GameTitle.WONDERLANDS]: "daffodil",
};

/**
 * Platform to SHiFT API service mapping
 */
export const PLATFORM_CODES: Record<string, string> = {
    steam: "steam",
    xbox: "xboxlive",
    playstation: "psn",
    epic: "epic",
    nintendo: "nintendo",
};

/**
 * Authenticated session with SHiFT
 */
export interface ShiftSession {
    /** Cookie key-value pairs */
    cookies: Record<string, string>;
    /** When the session was created */
    createdAt: string;
    /** When the session expires (approximate) */
    expiresAt: string;
}

/**
 * Result of a login attempt
 */
export interface LoginResult {
    success: boolean;
    session?: ShiftSession;
    error?: string;
}

/**
 * Form data for redeeming a code
 */
export interface RedemptionForm {
    game: string;
    platform: string;
    service: string;
    title: string;
    code: string;
    check: string;
    token: string;
}

/**
 * Result of checking a code's validity
 */
export interface CodeCheckResult {
    valid: boolean;
    forms?: RedemptionForm[];
    reason?: string;
}

/**
 * Result of a redemption attempt
 */
export interface RedemptionResult {
    success: boolean;
    code: string;
    game?: string;
    platform?: string;
    reason?: string;
}

/**
 * Rate limiting configuration
 */
export interface ThrottleConfig {
    /** Delay between requests in ms */
    requestDelay: number;
    /** Delay after hitting rate limit in ms */
    rateLimitDelay: number;
}

export const DEFAULT_THROTTLE: ThrottleConfig = {
    requestDelay: 3000,
    rateLimitDelay: 30000,
};
