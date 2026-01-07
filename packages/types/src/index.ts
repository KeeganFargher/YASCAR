/**
 * Supported Borderlands games
 */
export enum GameTitle {
    BL_GOTY = "Borderlands: Game of the Year Edition",
    BL2 = "Borderlands 2",
    BL3 = "Borderlands 3",
    BL4 = "Borderlands 4",
    BL_TPS = "Borderlands: The Pre-Sequel",
    WONDERLANDS = "Tiny Tina's Wonderlands",
}

/**
 * Supported platforms for shift codes
 */
export enum Platform {
    UNIVERSAL = "universal",
    PC = "pc",
    XBOX = "xbox",
    PLAYSTATION = "playstation",
}

/**
 * A SHiFT code with metadata
 */
export interface ShiftCode {
    /** The actual 25-character code (format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX) */
    code: string;
    /** Games this code is valid for */
    games: GameTitle[];
    /** ISO timestamp when the code was first discovered */
    discoveredAt: string;
    /** ISO timestamp or description of when the code expires */
    expires?: string;
    /** URL where the code was found */
    source: string;
    /** Description of what the code rewards */
    reward?: string;
    /** Whether the code has been marked as expired */
    expired?: boolean;
}

/**
 * API response format for the shift codes endpoint
 */
export interface ApiResponse {
    meta: {
        version: string;
        generated: string;
        count: number;
        filters: {
            since: string | null;
            game: string | null;
            platform: string | null;
            includeExpired: boolean;
        };
    };
    codes: ShiftCode[];
}

/**
 * Regex pattern for validating SHiFT codes
 */
export const CODE_REGEX = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

/**
 * Defensive limits to prevent abuse
 */
export const LIMITS = {
    /** Maximum codes allowed per scrape batch */
    MAX_CODES_PER_SCRAPE: 1_000,
    /** Expected code length (XXXXX-XXXXX-XXXXX-XXXXX-XXXXX) */
    CODE_LENGTH: 29,
    /** Maximum batch size for queue processing */
    MAX_QUEUE_BATCH_SIZE: 1_000,
    /** Maximum HTML response size to process (15MB) */
    MAX_HTML_SIZE: 15 * 1024 * 1024,
} as const;

/**
 * A batch of scraped codes to be sent to the queue
 */
export interface ScrapedCodeBatch {
    /** Source identifier (e.g., "mentalmars", "orcicorn") */
    source: string;
    /** ISO timestamp when the scrape occurred */
    scrapedAt: string;
    /** The scraped codes */
    codes: ShiftCode[];
}

/**
 * Database row format for D1 storage
 */
export interface DbShiftCode {
    code: string;
    games: string; // JSON string
    discovered_at: string;
    expires: string | null;
    source: string;
    reward: string | null;
    expired: number;
    updated_at: string;
}
