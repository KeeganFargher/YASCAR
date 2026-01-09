import { GameTitle, ShiftCode, CODE_REGEX } from "@yascar/types";
import { SourceScraper } from "./types";

export class XSmashScraper implements SourceScraper {
  readonly name = "xsmash";
  readonly sourceURL = "https://xsmashx88x.github.io/Shift-Codes/";

  async scrape(onBatch: import("./types").BatchCallback): Promise<void> {
    console.log(`[${this.name}] Fetching ${this.sourceURL}`);

    try {
      const response = await fetch(this.sourceURL, {
        headers: {
          "User-Agent": "YASCAR/1.0 (Shift Code Aggregator)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const codes = this.extractCodes(html);

      if (codes.length > 0) {
        await onBatch(codes);
        console.log(`[${this.name}] Streamed ${codes.length} codes`);
      }
    } catch (error) {
      console.error(`[${this.name}] Error scraping xsmash:`, error);
      throw error;
    }
  }

  private extractCodes(html: string): ShiftCode[] {
    const codes: ShiftCode[] = [];

    // Regex to find code boxes and extract the code ID
    // <div class="code-box " id="active-0" data-code-id="3SRBB-9FWSJ-KRJBK-BBBT3-JXRCW"
    const boxRegex =
      /data-code-id="([A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5})"/gi;

    let match;
    while ((match = boxRegex.exec(html)) !== null) {
      const code = match[1].toUpperCase();

      // We assume Universal for now as identifying specific games from the HTML structure
      // via simple regex is error-prone, and the user prefers grabbing all keys.
      // This site focuses heavily on BL4/New codes anyway.
      const games = [
        GameTitle.BL4,
        GameTitle.BL3,
        GameTitle.BL2,
        GameTitle.WONDERLANDS,
      ];

      // Try to find context for expiration if possible, but the DOM structure is
      // separate ("expire-date" div is later in the box).
      // Without a DOM parser, associating 'expire-date' to this specific code match is
      // tricky unless we parse the whole box content.
      // For now, we omit expiration to be safe rather than attributing wrong dates.

      codes.push({
        code,
        games,
        source: this.sourceURL,
        discoveredAt: new Date().toISOString(),
        // expires: undefined
      });
    }

    console.log(`[${this.name}] Found ${codes.length} codes`);
    return codes;
  }
}
