import { ShiftCode, CODE_REGEX, LIMITS } from "@yascar/types";

/**
 * Validates a single shift code format
 */
export function isValidCode(code: string): boolean {
    if (!code || typeof code !== "string") return false;
    if (code.length !== LIMITS.CODE_LENGTH) return false;
    return CODE_REGEX.test(code);
}

/**
 * Sanitizes and validates a batch of codes
 * Returns only valid codes, up to the maximum limit
 */
export function sanitizeBatch(codes: ShiftCode[], source: string): ShiftCode[] {
    const seen = new Set<string>();
    const valid: ShiftCode[] = [];

    for (const code of codes) {
        // Stop if we've hit the limit
        if (valid.length >= LIMITS.MAX_CODES_PER_SCRAPE) {
            console.warn(
                `[${source}] Batch limit reached (${LIMITS.MAX_CODES_PER_SCRAPE}), truncating`
            );
            break;
        }

        // Skip invalid codes
        if (!isValidCode(code.code)) {
            console.warn(`[${source}] Invalid code format: ${code.code}`);
            continue;
        }

        // Skip duplicates within this batch
        if (seen.has(code.code)) {
            continue;
        }
        seen.add(code.code);

        // Ensure required fields
        if (!code.games || code.games.length === 0) {
            console.warn(`[${source}] Code missing games: ${code.code}`);
            continue;
        }

        valid.push({
            code: code.code.toUpperCase(),
            games: code.games,
            discoveredAt: code.discoveredAt || new Date().toISOString(),
            source: code.source || source,
            expires: code.expires,
            reward: code.reward,
            expired: code.expired ?? false,
        });
    }

    return valid;
}

/**
 * Checks if a batch size is reasonable
 * Returns false for suspiciously large batches
 */
export function isReasonableBatchSize(count: number): boolean {
    return count > 0 && count <= LIMITS.MAX_CODES_PER_SCRAPE;
}

/**
 * Checks if HTML response size is reasonable
 */
export function isReasonableHtmlSize(size: number): boolean {
    return size > 0 && size <= LIMITS.MAX_HTML_SIZE;
}
