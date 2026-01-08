import { GameTitle, Platform } from "@yascar/types";

/**
 * User preferences for code redemption
 */
export interface UserConfig {
    /** Games to redeem codes for */
    games: GameTitle[];
    /** Platforms to redeem for */
    platforms: Platform[];
    /** Enable automatic redemption */
    autoRedeem: boolean;
    /** Check interval in minutes (for auto-redeem) */
    checkIntervalMinutes: number;
    /** Skip codes expiring within N days */
    skipExpiringWithinDays: number;
    /** Request throttle mode */
    throttleMode: "conservative" | "moderate" | "aggressive";
    /** Start application on system boot */
    startOnBoot: boolean;
    /** Send notifications on auto-redeem events */
    notifyOnAutoRedeem: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: UserConfig = {
    games: [
        GameTitle.BL_GOTY,
        GameTitle.BL2,
        GameTitle.BL_TPS,
        GameTitle.BL3,
        GameTitle.WONDERLANDS,
        GameTitle.BL4,
    ],
    platforms: [Platform.UNIVERSAL],
    autoRedeem: true,
    checkIntervalMinutes: 60,
    skipExpiringWithinDays: 3,
    throttleMode: "conservative",
    startOnBoot: false,
    notifyOnAutoRedeem: false,
};

/**
 * Stored data structure (includes metadata)
 */
export interface StoredConfig {
    config: UserConfig;
    updatedAt: string;
}

/**
 * Abstract storage interface
 * Implementations can be Tauri keychain, localStorage, file-based, etc.
 */
export interface ConfigStorage {
    /** Load config from storage */
    load(): Promise<UserConfig | null>;
    /** Save config to storage */
    save(config: UserConfig): Promise<void>;
    /** Clear stored config */
    clear(): Promise<void>;
}

/**
 * Redeemed code record for tracking
 */
export interface RedeemedCodeRecord {
    code: string;
    redeemedAt: string;
    game: string;
    platform: string;
    success: boolean;
}

/**
 * Failed code record for tracking unsuccessful redemption attempts
 */
export interface FailedCodeRecord {
    code: string;
    failedAt: string;
    reason: string;
    attemptCount: number;
}

/**
 * Storage for tracking redeemed codes
 */
export interface RedeemedCodesStorage {
    /** Get all redeemed codes */
    getRedeemed(): Promise<string[]>;
    /** Add codes to redeemed list */
    addRedeemed(codes: string[]): Promise<void>;
    /** Check if a code was already redeemed */
    wasRedeemed(code: string): Promise<boolean>;
    /** Get full redemption history */
    getHistory(): Promise<RedeemedCodeRecord[]>;
    /** Add to history */
    addToHistory(record: RedeemedCodeRecord): Promise<void>;
    /** Clear all data */
    clear(): Promise<void>;
}
