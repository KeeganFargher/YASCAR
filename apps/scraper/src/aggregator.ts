import { ScrapedCodeBatch, LIMITS } from "@yascar/types";

export interface Env {
    DB: D1Database;
    SHIFT_CODES_BUCKET: R2Bucket;
    CODES_QUEUE: Queue<ScrapedCodeBatch>;
    CLOUDFLARE_ZONE_ID?: string;
    CLOUDFLARE_API_TOKEN?: string;
}

/**
 * Process a batch of codes from the queue and insert into D1
 * Uses INSERT OR IGNORE to handle deduplication at the database level
 */
export async function processCodeBatch(
    batch: ScrapedCodeBatch,
    env: Env
): Promise<{ inserted: number; skipped: number }> {
    let inserted = 0;
    let skipped = 0;

    // Defensive: limit batch size
    const codes = batch.codes.slice(0, LIMITS.MAX_QUEUE_BATCH_SIZE);

    if (batch.codes.length > LIMITS.MAX_QUEUE_BATCH_SIZE) {
        console.warn(
            `[aggregator] Batch from ${batch.source} truncated: ${batch.codes.length} -> ${codes.length}`
        );
    }

    for (const code of codes) {
        try {
            const result = await env.DB.prepare(
                `INSERT OR IGNORE INTO shift_codes 
         (code, games, discovered_at, expires, source, reward, expired)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
                .bind(
                    code.code,
                    JSON.stringify(code.games),
                    code.discoveredAt,
                    code.expires ?? null,
                    code.source,
                    code.reward ?? null,
                    code.expired ? 1 : 0
                )
                .run();

            if (result.meta.changes > 0) {
                inserted++;
            } else {
                skipped++;
            }
        } catch (error) {
            console.error(`[aggregator] Failed to insert ${code.code}:`, error);
            skipped++;
        }
    }

    console.log(
        `[aggregator] Processed ${batch.source}: ${inserted} inserted, ${skipped} skipped`
    );

    return { inserted, skipped };
}

/**
 * Update games array for an existing code (merge)
 */
export async function updateCodeGames(
    code: string,
    newGames: string[],
    env: Env
): Promise<void> {
    // Get existing games
    const existing = await env.DB.prepare(
        "SELECT games FROM shift_codes WHERE code = ?"
    )
        .bind(code)
        .first<{ games: string }>();

    if (!existing) return;

    const existingGames: string[] = JSON.parse(existing.games);
    const mergedGames = [...new Set([...existingGames, ...newGames])];

    await env.DB.prepare("UPDATE shift_codes SET games = ? WHERE code = ?")
        .bind(JSON.stringify(mergedGames), code)
        .run();
}
