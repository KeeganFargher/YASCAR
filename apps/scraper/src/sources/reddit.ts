import {
    GameTitle,
    Platform,
    ScrapedCodeBatch,
    ShiftCode,
    CODE_REGEX,
} from "@yascar/types";
import { SourceScraper } from "./types";

interface RedditPost {
    kind: string;
    data: {
        title: string;
        selftext: string;
        created_utc: number;
        permalink: string;
        url: string;
    };
}

interface RedditListing {
    kind: "Listing";
    data: {
        children: RedditPost[];
    };
}

export class RedditScraper implements SourceScraper {
    readonly name = "reddit";
    readonly sourceURL = "https://www.reddit.com/r/Borderlandsshiftcodes.json?limit=500";

    async scrape(): Promise<ShiftCode[]> {
        console.log(`[${this.name}] Fetching ${this.sourceURL}`);

        try {
            const response = await fetch(this.sourceURL, {
                headers: {
                    "User-Agent": "YASCAR/1.0 (Shift Code Aggregator)"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const json = await response.json() as RedditListing;
            return this.processPosts(json.data.children);

        } catch (error) {
            console.error(`[${this.name}] Error scraping reddit:`, error);
            throw error;
        }
    }

    private processPosts(posts: RedditPost[]): ShiftCode[] {
        const codes: ShiftCode[] = [];
        // Global regex to find codes in text. 
        const extractionRegex = /[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}/gi;

        let processedCount = 0;
        let skippedCount = 0;

        for (const post of posts) {
            if (post.kind !== "t3") continue;

            const { title, selftext, created_utc, permalink } = post.data;

            // Find games from title
            let games = this.detectGame(title);
            if (!games) {
                // Fallback to Universal if game not detected, as requested by user
                console.log(`[reddit] Post '${title.substring(0, 30)}...' has no game in title, defaulting to Universal`);
                games = [GameTitle.BL4, GameTitle.BL3, GameTitle.BL2, GameTitle.WONDERLANDS];
            }

            const fullText = `${title}\n${selftext}`;
            const matches = fullText.match(extractionRegex);

            if (!matches) {
                // If it's a valid game post but no code found, log it (might be a false negative or just discussion)
                // console.log(`[reddit] Skipped post '${title}': No code pattern found`);
                continue;
            }

            const uniqueCodes = [...new Set(matches.map(c => c.toUpperCase()))];
            const sourceUrl = `https://www.reddit.com${permalink}`;
            const discoveredAt = new Date(created_utc * 1000).toISOString();

            // Try to extract expiration (very basic heuristic)
            let expires: string | undefined;
            const expMatch = /Exp(?:ires)?\.?\s*([A-Za-z0-9\s,.]+)/i.exec(selftext);
            if (expMatch) {
                expires = expMatch[1].trim();
            }

            for (const code of uniqueCodes) {
                codes.push({
                    code,
                    games, // Use the array of games detected
                    source: sourceUrl,
                    discoveredAt,
                    expires,
                    // Reward is hard to extract cleanly from unstructured reddit text
                    // We could try to use the title without the [Tag] part as description
                });
            }
            processedCount++;
        }

        console.log(`[reddit] Parsed ${processedCount} posts, skipped ${skippedCount} (game not detected). Found ${codes.length} codes.`);
        return codes;
    }

    private detectGame(title: string): GameTitle[] | undefined {
        const t = title.toUpperCase();

        // Handle explicit games
        if (t.includes("BL4") || t.includes("BORDERLANDS 4")) return [GameTitle.BL4];
        if (t.includes("BL3") || t.includes("BORDERLANDS 3")) return [GameTitle.BL3];
        if (t.includes("BL2") || t.includes("BORDERLANDS 2")) return [GameTitle.BL2];
        if (t.includes("TTW") || t.includes("WONDERLANDS")) return [GameTitle.WONDERLANDS];
        if (t.includes("TPS") || t.includes("PRE-SEQUEL")) return [GameTitle.BL_TPS];
        if (t.includes("GOTY")) return [GameTitle.BL_GOTY];

        // Handle multi-game keywords
        if (t.includes("MULTI") || t.includes("UNIVERSAL") || t.includes("ALL GAMES")) {
            // "Universal" usually applies to the main 3-4 games
            return [GameTitle.BL4, GameTitle.BL3, GameTitle.BL2, GameTitle.WONDERLANDS];
        }

        return undefined;
    }
}
