import { ScrapedCodeBatch, LIMITS } from "@yascar/types";
import { Env, processCodeBatch } from "./aggregator";

/**
 * Handle incoming queue messages
 */
export async function handleQueue(
    batch: MessageBatch<ScrapedCodeBatch>,
    env: Env
): Promise<void> {
    console.log(`[queue] Processing ${batch.messages.length} messages`);

    for (const message of batch.messages) {
        await processMessage(message, env);
    }
}

/**
 * Process a single queue message
 */
async function processMessage(
    message: Message<ScrapedCodeBatch>,
    env: Env
): Promise<void> {
    const { source, codes } = message.body;

    // Defensive: reject suspiciously large batches
    if (codes.length > LIMITS.MAX_CODES_PER_SCRAPE) {
        console.error(
            `[queue] Rejecting batch from ${source}: ${codes.length} codes exceeds limit`
        );
        message.ack(); // Don't retry bad data
        return;
    }

    try {
        await processCodeBatch(message.body, env);
        message.ack();
    } catch (error) {
        console.error(`[queue] Failed to process batch from ${source}:`, error);
        message.retry();
    }
}
