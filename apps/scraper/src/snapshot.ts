import { ShiftCode, DbShiftCode, ApiResponse } from "@yascar/types";
import { Env } from "./aggregator";

/**
 * Snapshot active codes from D1 to R2 as JSON
 * This creates the public API endpoint file
 */
export async function snapshotToR2(env: Env): Promise<{ count: number }> {
    console.log("[snapshot] Starting R2 snapshot...");

    // Query all non-expired codes, sorted by discovery date
    const { results } = await env.DB.prepare(
        `SELECT * FROM shift_codes 
     WHERE expired = 0 
     ORDER BY discovered_at DESC`
    ).all<DbShiftCode>();

    // Transform DB rows to API format
    const codes: ShiftCode[] = results.map((row) => ({
        code: row.code,
        games: JSON.parse(row.games),
        discoveredAt: row.discovered_at,
        expires: row.expires ?? undefined,
        source: row.source,
        reward: row.reward ?? undefined,
        expired: row.expired === 1,
    }));

    // Build API response
    const response: ApiResponse = {
        meta: {
            version: "1.0.0",
            generated: new Date().toISOString(),
            count: codes.length,
            filters: {
                since: null,
                game: null,
                platform: null,
                includeExpired: false,
            },
        },
        codes,
    };

    // Write to R2
    await env.SHIFT_CODES_BUCKET.put(
        "shift-codes.json",
        JSON.stringify(response),
        {
            httpMetadata: {
                contentType: "application/json",
            },
        }
    );

    console.log(`[snapshot] Wrote ${codes.length} codes to R2`);

    return { count: codes.length };
}

/**
 * Purge Cloudflare cache for the shift codes endpoint
 */
export async function purgeCache(env: Env): Promise<void> {
    if (!env.CLOUDFLARE_ZONE_ID || !env.CLOUDFLARE_API_TOKEN) {
        console.log("[snapshot] Cache purge skipped - no credentials");
        return;
    }

    try {
        await fetch(
            `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ purge_everything: true }),
            }
        );
        console.log("[snapshot] Cache purged");
    } catch (error) {
        console.error("[snapshot] Cache purge failed:", error);
    }
}
