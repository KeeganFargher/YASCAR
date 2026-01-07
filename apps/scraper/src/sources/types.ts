import { ShiftCode, GameTitle, Platform } from "@yascar/types";

/**
 * Common interface for all source scrapers
 */
export interface SourceScraper {
    /** Unique identifier for this source */
    readonly name: string;

    /** Scrape the source and return discovered codes */
    scrape(): Promise<ShiftCode[]>;
}

/**
 * Configuration for scraping a webpage with tables
 */
export interface WebpageConfig {
    game: GameTitle;
    sourceURL: string;
    /** Ordered list of platform mappings for tables on the page */
    platformOrderedTables: (Platform | "discard")[];
}

/**
 * Result of a scrape operation
 */
export interface ScrapeResult {
    success: boolean;
    source: string;
    codes: ShiftCode[];
    error?: string;
    duration: number;
}
