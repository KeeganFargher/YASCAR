import { ScrapedCodeBatch } from "@yascar/types";
import { Env } from "./aggregator";
import { runAllScrapers } from "./orchestrator";
import { handleQueue } from "./queue-handler";
import { snapshotToR2, purgeCache } from "./snapshot";

export { Env };

/**
 * Cron identifiers
 */
const CRON_SNAPSHOT = "*/15 * * * *";
const CRON_SCRAPE = "*/2 * * * *";

export default {
    /**
     * Cron trigger handler
     */
    async scheduled(
        event: ScheduledEvent,
        env: Env,
        ctx: ExecutionContext
    ): Promise<void> {
        console.log(`[cron] Triggered: ${event.cron}`);

        switch (event.cron) {
            case CRON_SNAPSHOT:
                await snapshotToR2(env);
                ctx.waitUntil(purgeCache(env));
                break;

            case CRON_SCRAPE:
                await runAllScrapers(env);
                break;

            default:
                console.warn(`[cron] Unknown trigger: ${event.cron}`);
        }
    },

    /**
     * Queue consumer handler
     */
    async queue(
        batch: MessageBatch<ScrapedCodeBatch>,
        env: Env
    ): Promise<void> {
        await handleQueue(batch, env);
    },
};
