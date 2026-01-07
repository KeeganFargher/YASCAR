import { ShiftCode, GameTitle, Platform, CODE_REGEX } from "@yascar/types";
import { SourceScraper, WebpageConfig } from "./types";
import { sanitizeBatch, isReasonableHtmlSize } from "./validation";

/**
 * MentalMars scraper - scrapes shift codes from mentalmars.com
 * 
 * This site has dedicated pages for each Borderlands game with tables
 * containing shift codes.
 */
export class MentalMarsScraper implements SourceScraper {
    readonly name = "mentalmars";

    private readonly pages: WebpageConfig[] = [
        {
            game: GameTitle.BL4,
            sourceURL: "https://mentalmars.com/game-news/borderlands-4-shift-codes/",
            platformOrderedTables: [Platform.UNIVERSAL, Platform.UNIVERSAL],
        },
        {
            game: GameTitle.BL_GOTY,
            sourceURL: "https://mentalmars.com/game-news/borderlands-golden-keys/",
            platformOrderedTables: [Platform.UNIVERSAL, Platform.UNIVERSAL],
        },
        {
            game: GameTitle.BL2,
            sourceURL: "https://mentalmars.com/game-news/borderlands-2-golden-keys/",
            platformOrderedTables: [
                Platform.UNIVERSAL,
                Platform.UNIVERSAL,
                Platform.PC,
                Platform.XBOX,
                Platform.PLAYSTATION,
                Platform.UNIVERSAL,
                "discard",
            ],
        },
        {
            game: GameTitle.BL3,
            sourceURL: "https://mentalmars.com/game-news/borderlands-3-golden-keys/",
            platformOrderedTables: [
                Platform.UNIVERSAL,
                "discard",
                Platform.UNIVERSAL,
                Platform.UNIVERSAL,
                Platform.UNIVERSAL,
                "discard",
                "discard",
                "discard",
                "discard",
            ],
        },
        {
            game: GameTitle.BL_TPS,
            sourceURL: "https://mentalmars.com/game-news/bltps-golden-keys/",
            platformOrderedTables: [
                Platform.UNIVERSAL,
                Platform.UNIVERSAL,
                Platform.PC,
                Platform.PLAYSTATION,
                Platform.XBOX,
                "discard",
            ],
        },
        {
            game: GameTitle.WONDERLANDS,
            sourceURL: "https://mentalmars.com/game-news/tiny-tinas-wonderlands-shift-codes/",
            platformOrderedTables: [Platform.UNIVERSAL, Platform.UNIVERSAL],
        },
    ];

    async scrape(): Promise<ShiftCode[]> {
        const allCodes: ShiftCode[] = [];

        for (const page of this.pages) {
            try {
                const codes = await this.scrapePage(page);
                allCodes.push(...codes);
                console.log(`[${this.name}] ${page.game}: found ${codes.length} codes`);
            } catch (error) {
                console.error(`[${this.name}] Error scraping ${page.game}:`, error);
                // Continue with other pages even if one fails
            }
        }

        // Deduplicate and validate
        return sanitizeBatch(this.deduplicateCodes(allCodes), this.name);
    }

    private async scrapePage(config: WebpageConfig): Promise<ShiftCode[]> {
        console.log(`[mentalmars] Fetching ${config.sourceURL}`);
        const response = await fetch(config.sourceURL, {
            cf: { cacheTtl: 300 },
            headers: {
                "User-Agent": "YASCAR/1.0 (Shift Code Aggregator)",
            },
        });

        console.log(`[mentalmars] Response status: ${response.status}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        console.log(`[mentalmars] HTML received, length: ${html.length}`);

        // Defensive: check response size
        if (!isReasonableHtmlSize(html.length)) {
            throw new Error(`Response too large: ${html.length} bytes`);
        }

        return this.extractCodesFromHtml(html, config);
    }

    private extractCodesFromHtml(html: string, config: WebpageConfig): ShiftCode[] {
        const codes: ShiftCode[] = [];
        const tables = this.extractTables(html);
        console.log(`[mentalmars] Found ${tables.length} tables in HTML`);

        for (let i = 0; i < tables.length && i < config.platformOrderedTables.length; i++) {
            const platform = config.platformOrderedTables[i];
            if (platform === "discard") continue;

            const tableCodes = this.extractCodesFromTable(tables[i], config, platform);
            console.log(`[mentalmars] Table ${i} (${platform}): found ${tableCodes.length} codes`);
            codes.push(...tableCodes);
        }

        return codes;
    }

    private extractTables(html: string): string[] {
        const tables: string[] = [];
        const tableRegex = /<figure[^>]*>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>[\s\S]*?<\/figure>/gi;

        let match;
        while ((match = tableRegex.exec(html)) !== null) {
            tables.push(match[1]);
        }

        if (tables.length === 0) {
            console.warn("[mentalmars] No tables found matching regex!");
        }

        return tables;
    }

    private extractCodesFromTable(
        tableContent: string,
        config: WebpageConfig,
        _platform: Platform
    ): ShiftCode[] {
        const codes: ShiftCode[] = [];

        // Dynamic Column Mapping
        let rewardIdx = 0;
        let codeIdx = 2; // Default for 3-col layout
        let expiresIdx = 1; // Default for 3-col layout

        // Try to identify columns from headers
        const headerMatch = /<thead[^>]*>[\s\S]*?<tr[^>]*>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/i.exec(tableContent);
        if (headerMatch) {
            const headerRow = headerMatch[1];
            const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
            let thMatch;
            let colIdx = 0;

            while ((thMatch = thRegex.exec(headerRow)) !== null) {
                const headerText = thMatch[1].toLowerCase();
                if (headerText.includes("reward")) rewardIdx = colIdx;
                else if (headerText.includes("code")) codeIdx = colIdx;
                else if (headerText.includes("expire")) expiresIdx = colIdx;
                colIdx++;
            }
            console.log(`[mentalmars] Mapped columns: Reward=${rewardIdx}, Code=${codeIdx}, Expires=${expiresIdx}`);
        } else {
            // Fallback heuristic based on column count
            // If we didn't match thead (some tables might lack it or regex fail), check row length
            const firstRowMatch = /<tr[^>]*>([\s\S]*?)<\/tr>/i.exec(tableContent); // Just grab first row for check?
            // Actually, safest to default to standard layout or check per row, but header parsing is best.
        }

        // Match table rows (non-greedy) - skip thead if we regexed it separately? 
        // No, simplest is to iterate tbody rows
        const tbodyMatch = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(tableContent);
        const rowsContent = tbodyMatch ? tbodyMatch[1] : tableContent;

        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        const colRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        const codeRegex = /[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}/i;

        let rowMatch;
        while ((rowMatch = rowRegex.exec(rowsContent)) !== null) {
            const rowContent = rowMatch[1];
            const cols: string[] = [];

            let colMatch;
            while ((colMatch = colRegex.exec(rowContent)) !== null) {
                cols.push(colMatch[1]);
            }

            // Safety check
            if (cols.length < 3) continue;

            // If we have >= 4 columns and didn't map headers, assume new layout (Reward, Source, Code, Expires)
            if (!headerMatch && cols.length >= 4) {
                // Heuristic: Code usually at 2, Expires at 3
                codeIdx = 2;
                expiresIdx = 3;
            }

            // Check if code exists at expected index
            if (!cols[codeIdx]) continue;

            let codeMatch = codeRegex.exec(cols[codeIdx]);
            if (!codeMatch) continue;

            const code = codeMatch[0].toUpperCase();
            if (!CODE_REGEX.test(code)) continue;

            // Extract metadata
            const reward = cols[rewardIdx] ? cols[rewardIdx].replace(/<[^>]*>/g, "").trim() : undefined;
            const expires = cols[expiresIdx] ? cols[expiresIdx].replace(/<[^>]*>/g, "").trim() : undefined;

            codes.push({
                code,
                games: [config.game],
                discoveredAt: new Date().toISOString(),
                source: config.sourceURL,
                reward: reward || undefined,
                expires: expires || undefined
            });
        }

        return codes;
    }

    private deduplicateCodes(codes: ShiftCode[]): ShiftCode[] {
        const codeMap = new Map<string, ShiftCode>();

        for (const code of codes) {
            const existing = codeMap.get(code.code);
            if (existing) {
                // Merge games arrays
                const games = new Set([...existing.games, ...code.games]);
                existing.games = Array.from(games);
            } else {
                codeMap.set(code.code, { ...code });
            }
        }

        return Array.from(codeMap.values());
    }
}

export const mentalmars = new MentalMarsScraper();
