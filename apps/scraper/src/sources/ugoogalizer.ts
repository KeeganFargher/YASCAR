import { GameTitle, ShiftCode, CODE_REGEX } from "@yascar/types";
import { SourceScraper } from "./types";

interface UgoogalizerCode {
  code: string;
  type: string;
  game: string;
  platform: string;
  reward: string;
  archived: string;
  expires: string;
  expired: boolean;
  link: string;
}

interface UgoogalizerResponse {
  meta: {
    version: string;
    generated: {
      human: string;
    };
  };
  codes: UgoogalizerCode[];
}

export class UgoogalizerScraper implements SourceScraper {
  readonly name = "ugoogalizer";
  readonly sourceURL =
    "https://raw.githubusercontent.com/ugoogalizer/autoshift-codes/main/shiftcodes.json";

  async scrape(): Promise<ShiftCode[]> {
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

      const json = (await response.json()) as UgoogalizerResponse;
      return this.processCodes(json.codes);
    } catch (error) {
      console.error(`[${this.name}] Error scraping ugoogalizer:`, error);
      throw error;
    }
  }

  private processCodes(rawCodes: UgoogalizerCode[]): ShiftCode[] {
    const codes: ShiftCode[] = [];
    let processedCount = 0;

    for (const raw of rawCodes) {
      // Validate code format first
      const cleanedCode = raw.code.trim().toUpperCase();
      if (!CODE_REGEX.test(cleanedCode)) continue;

      // Map game
      const game = this.mapGame(raw.game);
      if (!game) {
        console.log(`[ugoogalizer] Unknown game: ${raw.game}`);
        continue;
      }

      codes.push({
        code: cleanedCode,
        games: [game],
        source: raw.link || this.sourceURL,
        discoveredAt: raw.archived || new Date().toISOString(),
        expires: raw.expires !== "Unknown" ? raw.expires : undefined,
        reward: raw.reward,
        expired: raw.expired,
      });
      processedCount++;
    }

    console.log(`[${this.name}] Processed ${processedCount} codes`);
    return codes;
  }

  private mapGame(gameStr: string): GameTitle | undefined {
    const g = gameStr.trim();

    switch (g) {
      case "Borderlands 4":
        return GameTitle.BL4;
      case "Borderlands 3":
        return GameTitle.BL3;
      case "Borderlands 2":
        return GameTitle.BL2;
      case "Borderlands: Game of the Year Edition":
        return GameTitle.BL_GOTY;
      case "Borderlands The Pre-Sequel":
        return GameTitle.BL_TPS;
      case "Tiny Tina's Wonderlands":
        return GameTitle.WONDERLANDS;
      default:
        return undefined;
    }
  }
}
