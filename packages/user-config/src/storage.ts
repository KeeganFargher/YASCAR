import {
    UserConfig,
    StoredConfig,
    ConfigStorage,
    RedeemedCodesStorage,
    RedeemedCodeRecord,
    DEFAULT_CONFIG,
} from "./types";

const CONFIG_KEY = "yascar-config";
const REDEEMED_KEY = "yascar-redeemed";
const HISTORY_KEY = "yascar-history";

/**
 * In-memory storage implementation (for testing or fallback)
 */
export class MemoryConfigStorage implements ConfigStorage {
    private config: UserConfig | null = null;

    async load(): Promise<UserConfig | null> {
        return this.config;
    }

    async save(config: UserConfig): Promise<void> {
        this.config = config;
    }

    async clear(): Promise<void> {
        this.config = null;
    }
}

/**
 * JSON file-based storage (for Node.js / Tauri)
 * Uses a simple JSON file in the app data directory
 */
export class FileConfigStorage implements ConfigStorage {
    constructor(private filePath: string) { }

    async load(): Promise<UserConfig | null> {
        try {
            const fs = await import("fs/promises");
            const data = await fs.readFile(this.filePath, "utf-8");
            const stored: StoredConfig = JSON.parse(data);
            return stored.config;
        } catch {
            return null;
        }
    }

    async save(config: UserConfig): Promise<void> {
        const fs = await import("fs/promises");
        const path = await import("path");

        // Ensure directory exists
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });

        const stored: StoredConfig = {
            config,
            updatedAt: new Date().toISOString(),
        };
        await fs.writeFile(this.filePath, JSON.stringify(stored, null, 2));
    }

    async clear(): Promise<void> {
        try {
            const fs = await import("fs/promises");
            await fs.unlink(this.filePath);
        } catch {
            // File doesn't exist, that's fine
        }
    }
}

/**
 * In-memory redeemed codes storage
 */
export class MemoryRedeemedStorage implements RedeemedCodesStorage {
    private redeemed = new Set<string>();
    private history: RedeemedCodeRecord[] = [];

    async getRedeemed(): Promise<string[]> {
        return Array.from(this.redeemed);
    }

    async addRedeemed(codes: string[]): Promise<void> {
        codes.forEach((c) => this.redeemed.add(c));
    }

    async wasRedeemed(code: string): Promise<boolean> {
        return this.redeemed.has(code);
    }

    async getHistory(): Promise<RedeemedCodeRecord[]> {
        return this.history;
    }

    async addToHistory(record: RedeemedCodeRecord): Promise<void> {
        this.history.push(record);
        this.redeemed.add(record.code);
    }

    async clear(): Promise<void> {
        this.redeemed.clear();
        this.history = [];
    }
}

/**
 * File-based redeemed codes storage
 */
export class FileRedeemedStorage implements RedeemedCodesStorage {
    constructor(
        private redeemedPath: string,
        private historyPath: string
    ) { }

    async getRedeemed(): Promise<string[]> {
        try {
            const fs = await import("fs/promises");
            const data = await fs.readFile(this.redeemedPath, "utf-8");
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    async addRedeemed(codes: string[]): Promise<void> {
        const existing = await this.getRedeemed();
        const merged = [...new Set([...existing, ...codes])];
        const fs = await import("fs/promises");
        const path = await import("path");
        await fs.mkdir(path.dirname(this.redeemedPath), { recursive: true });
        await fs.writeFile(this.redeemedPath, JSON.stringify(merged));
    }

    async wasRedeemed(code: string): Promise<boolean> {
        const redeemed = await this.getRedeemed();
        return redeemed.includes(code);
    }

    async getHistory(): Promise<RedeemedCodeRecord[]> {
        try {
            const fs = await import("fs/promises");
            const data = await fs.readFile(this.historyPath, "utf-8");
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    async addToHistory(record: RedeemedCodeRecord): Promise<void> {
        const history = await this.getHistory();
        history.push(record);
        const fs = await import("fs/promises");
        const path = await import("path");
        await fs.mkdir(path.dirname(this.historyPath), { recursive: true });
        await fs.writeFile(this.historyPath, JSON.stringify(history, null, 2));
        await this.addRedeemed([record.code]);
    }

    async clear(): Promise<void> {
        const fs = await import("fs/promises");
        try {
            await fs.unlink(this.redeemedPath);
            await fs.unlink(this.historyPath);
        } catch {
            // Files don't exist
        }
    }
}
