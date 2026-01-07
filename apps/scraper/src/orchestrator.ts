import { ScrapedCodeBatch } from "@yascar/types";
import { MentalMarsScraper } from "./sources/mentalmars";
import { RedditScraper } from "./sources/reddit";
import { OrcicornScraper } from "./sources/orcicorn";
import { Env } from "./aggregator";
import { SourceScraper } from "./sources/types";

/**
 * Registered scrapers
 */
const scrapers: SourceScraper[] = [
    new MentalMarsScraper(),
    new RedditScraper(),
    // new OrcicornScraper()
];

/**
 * Run all registered scrapers and queue their results
 */
export async function runAllScrapers(env: Env): Promise<void> {
    console.log(`[orchestrator] Starting scrape run with ${scrapers.length} sources`);

    const results = await Promise.allSettled(
        scrapers.map((scraper) => runScraper(scraper, env))
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`[orchestrator] Scrape complete: ${succeeded} succeeded, ${failed} failed`);
}

/**
 * Run a single scraper and queue its results
 */
async function runScraper(
    scraper: SourceScraper,
    env: Env
): Promise<void> {
    const startTime = Date.now();

    console.log(`[orchestrator] Running ${scraper.name}...`);

    try {
        const codes = await scraper.scrape();

        if (codes.length === 0) {
            console.log(`[orchestrator] ${scraper.name}: no codes found`);
            return;
        }

        const batch: ScrapedCodeBatch = {
            source: scraper.name,
            scrapedAt: new Date().toISOString(),
            codes,
        };

        console.log(`[orchestrator] Sending ${codes.length} codes from ${scraper.name} to queue...`);

        await env.CODES_QUEUE.send(batch);

        const duration = Date.now() - startTime;
        console.log(
            `[orchestrator] ${scraper.name}: queued ${codes.length} codes in ${duration} ms`
        );
    } catch (err: any) {
        console.error(`[orchestrator] FAILED to run ${scraper.name}: ${err.message} `, err);
        throw err;
    }
}
