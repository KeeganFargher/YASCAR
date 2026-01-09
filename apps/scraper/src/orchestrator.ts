import { ScrapedCodeBatch } from "@yascar/types";
import { MentalMarsScraper } from "./sources/mentalmars";
import { RedditScraper } from "./sources/reddit";
import { XSmashScraper } from "./sources/xsmash";
import { UgoogalizerScraper } from "./sources/ugoogalizer";
import { Env } from "./aggregator";
import { SourceScraper } from "./sources/types";

/**
 * Registered scrapers
 */
const scrapers: SourceScraper[] = [
  new MentalMarsScraper(),
  new RedditScraper(),
  new XSmashScraper(),
  new UgoogalizerScraper(),
];

/**
 * Run all registered scrapers and queue their results
 */
export async function runAllScrapers(env: Env): Promise<void> {
  console.log(
    `[orchestrator] Starting scrape run with ${scrapers.length} sources`
  );

  const results = await Promise.allSettled(
    scrapers.map((scraper) => runScraper(scraper, env))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(
    `[orchestrator] Scrape complete: ${succeeded} succeeded, ${failed} failed`
  );
}

/**
 * Run a single scraper and queue its results
 */
async function runScraper(scraper: SourceScraper, env: Env): Promise<void> {
  const startTime = Date.now();
  console.log(`[orchestrator] Running ${scraper.name}...`);

  let totalCodes = 0;
  const { onBatch, flush } = createBufferedSender(env, scraper.name);

  try {
    await scraper.scrape(async (codes) => {
      totalCodes += codes.length;
      await onBatch(codes);
    });

    // Flush any remaining codes
    await flush();

    const duration = Date.now() - startTime;
    console.log(
      `[orchestrator] ${scraper.name}: queued ${totalCodes} codes in ${duration} ms`
    );
  } catch (err: any) {
    console.error(
      `[orchestrator] FAILED to run ${scraper.name}: ${err.message} `,
      err
    );
    throw err;
  }
}

/**
 * Creates a buffered sender for queueing codes
 */
function createBufferedSender(env: Env, source: string) {
  const BUFFER_SIZE = 20;
  let buffer: import("@yascar/types").ShiftCode[] = [];

  const sendBuffer = async () => {
    if (buffer.length === 0) return;

    const batch: ScrapedCodeBatch = {
      source,
      scrapedAt: new Date().toISOString(),
      codes: [...buffer],
    };

    console.log(
      `[orchestrator] Sending batch of ${buffer.length} codes from ${source}...`
    );
    await env.CODES_QUEUE.send(batch);
    buffer = [];
  };

  return {
    onBatch: async (codes: import("@yascar/types").ShiftCode[]) => {
      buffer.push(...codes);
      if (buffer.length >= BUFFER_SIZE) {
        await sendBuffer();
      }
    },
    flush: sendBuffer,
  };
}
