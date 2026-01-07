# YASCAR - Agent Guide

> **Y**et **A**nother **S**hift **C**ode **A**utomatic **R**edeemer

This document provides comprehensive context for AI agents working on the YASCAR codebase. It describes the architecture, conventions, and critical implementation details needed to effectively contribute to this project.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Architecture Deep Dive](#architecture-deep-dive)
- [Packages](#packages)
- [Applications](#applications)
- [Data Flow](#data-flow)
- [Development Guidelines](#development-guidelines)
- [Common Tasks](#common-tasks)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)

---

## Project Overview

YASCAR is a monorepo for automatically scraping, storing, and redeeming SHiFT codes for Borderlands games. The project uses a queue-based architecture with Cloudflare infrastructure as the backend and a Tauri desktop application for user-facing code redemption.

### Supported Games

| Game | Enum Value | SHiFT API Code |
|------|------------|----------------|
| Borderlands 4 | `BL4` | `archway` |
| Borderlands: Game of the Year Edition | `BL_GOTY` | `mopane` |
| Borderlands 2 | `BL2` | `willow2` |
| Borderlands: The Pre-Sequel | `BL_TPS` | `cork` |
| Borderlands 3 | `BL3` | `oak` |
| Tiny Tina's Wonderlands | `WONDERLANDS` | `daffodil` |

### Supported Platforms

- **Universal** (cross-platform codes)
- **PC** (Steam, Epic)
- **Xbox**
- **PlayStation**
- **Nintendo** (limited support)

---

## Repository Structure

```
YASCAR/
├── apps/
│   ├── desktop/          # Tauri + React desktop application
│   ├── scraper/          # Cloudflare Worker for code scraping
│   └── web/              # Marketing landing page (React + Vite)
├── packages/
│   ├── shift-client/     # SHiFT API authentication & redemption
│   ├── types/            # Shared TypeScript types & enums
│   └── user-config/      # User preferences & storage abstractions
├── scripts/              # Build and deployment scripts
├── package.json          # Monorepo root configuration
├── tsconfig.base.json    # Shared TypeScript config
└── README.md             # Project documentation
```

### Workspace Overview

This is an **npm workspaces** monorepo. All packages are under `apps/*` and `packages/*`.

| Workspace | Package Name | Purpose |
|-----------|--------------|---------|
| `apps/desktop` | `@yascar/desktop` | User-facing Tauri application |
| `apps/scraper` | `@yascar/scraper` | Cloudflare Worker for scraping & data aggregation |
| `apps/web` | `@yascar/web` | Marketing landing page |
| `packages/types` | `@yascar/types` | Shared types, enums, and constants |
| `packages/shift-client` | `@yascar/shift-client` | SHiFT authentication and code redemption |
| `packages/user-config` | `@yascar/user-config` | User preferences and storage interfaces |

---

## Architecture Deep Dive

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Cloudflare)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐   │
│   │   Scrapers   │───▶│  Queue (CF)   │───▶│   D1 Database    │   │
│   │ (mentalmars) │    │               │    │ (source of truth)│   │
│   └──────────────┘    └───────────────┘    └────────┬─────────┘   │
│                                                      │              │
│                                                      ▼              │
│                                            ┌──────────────────┐    │
│                                            │  R2 Bucket       │    │
│                                            │  (JSON snapshot) │    │
│                                            └────────┬─────────┘    │
│                                                      │              │
└──────────────────────────────────────────────────────┼──────────────┘
                                                       │
                              Public API (codes.json)  │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐   │
│   │ Desktop App  │───▶│ shift.gearbox │───▶│   User Account   │   │
│   │   (Tauri)    │    │  software.com │    │   (Redemption)   │   │
│   └──────────────┘    └───────────────┘    └──────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Cron Schedule

The scraper runs on Cloudflare's cron triggers:

| Schedule | Purpose |
|----------|---------|
| `*/30 * * * *` | Scrape all sources every 30 minutes |
| `*/15 * * * *` | Snapshot D1 to R2 every 15 minutes |

---

## Packages

### `@yascar/types`

**Location:** `packages/types/src/index.ts`

The shared type definitions used across all workspaces.

#### Key Exports

```typescript
// Enums
export enum GameTitle {
    BL_GOTY = "Borderlands: Game of the Year Edition",
    BL2 = "Borderlands 2",
    BL3 = "Borderlands 3",
    BL_TPS = "Borderlands: The Pre-Sequel",
    WONDERLANDS = "Tiny Tina's Wonderlands",
}

export enum Platform {
    UNIVERSAL = "universal",
    PC = "pc",
    XBOX = "xbox",
    PLAYSTATION = "playstation",
}

// Interfaces
export interface ShiftCode {
    code: string;           // XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
    games: GameTitle[];
    discoveredAt: string;   // ISO timestamp
    expires?: string;       // ISO timestamp or description
    source: string;         // URL where found
    reward?: string;
    expired?: boolean;
}

// Constants
export const CODE_REGEX = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

export const LIMITS = {
    MAX_CODES_PER_SCRAPE: 500,
    CODE_LENGTH: 29,
    MAX_QUEUE_BATCH_SIZE: 100,
    MAX_HTML_SIZE: 5 * 1024 * 1024, // 5MB
};
```

---

### `@yascar/shift-client`

**Location:** `packages/shift-client/`

The SHiFT API client for authentication and code redemption.

#### Core Class: `ShiftClient`

```typescript
class ShiftClient {
    // Session Management
    setSession(session: ShiftSession): void
    getSession(): ShiftSession | null
    isAuthenticated(): boolean

    // Authentication
    async login(email: string, password: string): Promise<LoginResult>

    // Code Operations
    async checkCode(code: string): Promise<CodeCheckResult>
    async redeemCode(form: RedemptionForm): Promise<RedemptionResult>
}
```

#### Authentication Flow

1. **GET** `shift.gearboxsoftware.com/home` - Extract CSRF tokens and cookies
2. **POST** `shift.gearboxsoftware.com/sessions` - Submit login form
3. Check for 302 redirect to `/account` (success indicator)
4. Store session cookies with expiration (1 year)

#### Code Redemption Flow

1. **Check Code:** `GET /entitlement_offer_codes?code={CODE}`
   - Parse response for validity
   - Extract redemption forms (one per game/platform combo)
2. **Redeem:** `POST /code_redemptions` with form data
   - Handle rate limiting (HTTP 429)
   - Verify success via redirect or response parsing

#### Rate Limiting

```typescript
export const DEFAULT_THROTTLE: ThrottleConfig = {
    requestDelay: 3000,     // 3 seconds between requests
    rateLimitDelay: 30000,  // 30 seconds after 429
};
```

⚠️ **Critical:** Always respect rate limits. The SHiFT API will block aggressive clients.

---

### `@yascar/user-config`

**Location:** `packages/user-config/`

User preferences and storage abstractions.

#### UserConfig Interface

```typescript
export interface UserConfig {
    games: GameTitle[];                    // Games to redeem for
    platforms: Platform[];                 // Platforms to target
    autoRedeem: boolean;                   // Enable auto-redemption
    checkIntervalMinutes: number;          // Auto-check interval
    skipExpiringWithinDays: number;        // Skip soon-expiring codes
    throttleMode: "conservative" | "moderate" | "aggressive";
}

export const DEFAULT_CONFIG: UserConfig = {
    games: [GameTitle.BL3, GameTitle.WONDERLANDS],
    platforms: [Platform.UNIVERSAL],
    autoRedeem: false,
    checkIntervalMinutes: 60,
    skipExpiringWithinDays: 3,
    throttleMode: "conservative",
};
```

#### Storage Interfaces

The package defines abstract interfaces that can be implemented for different environments:

- `ConfigStorage` - For user preferences
- `RedeemedCodesStorage` - For tracking redeemed codes

---

## Applications

### `@yascar/scraper`

**Location:** `apps/scraper/`
**Stack:** Cloudflare Workers + D1 + R2 + Queues

#### Entry Point: `src/index.ts`

Handles three types of triggers:
- **HTTP requests** - Health checks, manual triggers
- **Cron triggers** - Scheduled scraping and snapshots
- **Queue messages** - Processing scraped code batches

#### Database Schema

```sql
CREATE TABLE IF NOT EXISTS shift_codes (
  code TEXT PRIMARY KEY,
  games TEXT NOT NULL,          -- JSON array
  discovered_at TEXT NOT NULL,  -- ISO timestamp
  expires TEXT,                 -- ISO timestamp or description
  source TEXT NOT NULL,         -- URL origin
  reward TEXT,
  expired INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

#### Source Scrapers

Located in `src/sources/`. Each scraper implements:

```typescript
interface SourceScraper {
    name: string;
    scrape(): Promise<ShiftCode[]>;
}
```

**Currently implemented:**
- `mentalmars.ts` - Scrapes mentalmars.com
- `reddit.ts` - Scrapes r/Borderlandsshiftcodes
- `xsmash.ts` - Scrapes xsmashx88x.github.io

**Adding new scrapers:**
1. Create file in `src/sources/`
2. Implement `SourceScraper` interface
3. Register in `src/orchestrator.ts`

#### Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Worker entry point, request routing |
| `src/orchestrator.ts` | Runs all scrapers, manages batching |
| `src/aggregator.ts` | Processes queue messages, inserts to D1 |
| `src/queue-handler.ts` | Queue consumer implementation |
| `src/snapshot.ts` | Generates R2 JSON snapshots |
| `src/sources/` | Individual scraper implementations |
| `schema.sql` | D1 database schema |
| `wrangler.toml` | Cloudflare Worker configuration |

---

### `@yascar/desktop`

**Location:** `apps/desktop/`
**Stack:** Tauri v2 + React + Vite + Tailwind CSS

A Borderlands-themed desktop application for authenticating with SHiFT and redeeming codes.

#### Application Structure

```
apps/desktop/
├── src/
│   ├── App.tsx              # Main application with routing
│   ├── main.tsx             # React entry point
│   ├── index.css            # Global styles (Tailwind + custom)
│   ├── components/
│   │   └── Layout.tsx       # Main layout with navigation
│   ├── pages/
│   │   ├── LoginPage.tsx    # SHiFT authentication
│   │   ├── DashboardPage.tsx # Available codes display
│   │   ├── SettingsPage.tsx # User preferences
│   │   └── LogPage.tsx      # Redemption history
│   └── lib/
│       ├── store.ts         # Tauri persistent storage
│       └── shift.ts         # SHiFT client wrapper
├── src-tauri/
│   ├── src/main.rs          # Rust backend
│   ├── tauri.conf.json      # Tauri configuration
│   └── Cargo.toml           # Rust dependencies
└── tailwind.config.js       # Borderlands theme colors
```

#### Tailwind Theme

Custom Borderlands color palette:

```javascript
colors: {
    'bl-black': '#0d0d0d',
    'bl-dark': '#1a1a1a',
    'bl-gray': '#2d2d2d',
    'bl-yellow': '#f7c948',
    'bl-gold': '#d4a520',
    'bl-orange': '#e67e22',
    'bl-red': '#c0392b',
    'bl-green': '#27ae60',
    'bl-blue': '#3498db',
}
```

#### Storage Layer

Uses Tauri's `@tauri-apps/plugin-store` for encrypted local storage:

```typescript
// Session management
saveSession(session: ShiftSession): Promise<void>
loadSession(): Promise<ShiftSession | null>
clearSession(): Promise<void>

// Configuration
saveConfig(config: UserConfig): Promise<void>
loadConfig(): Promise<UserConfig>

// Redemption tracking
getRedeemedCodes(): Promise<string[]>
addRedeemedCode(code: string): Promise<void>
getRedemptionHistory(): Promise<RedeemedCodeRecord[]>
addToHistory(record: RedeemedCodeRecord): Promise<void>
```

#### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login | N/A (shown when unauthenticated) | SHiFT email/password login |
| Dashboard | `/` | View available codes, trigger redemption |
| Settings | `/settings` | Configure games, platforms, auto-redeem |
| Log | `/log` | View redemption history |

---

### `@yascar/web`

**Location:** `apps/web/`
**Stack:** React + Vite

A simple marketing landing page. Lower priority than other apps.

---

## Data Flow

### Scraping Pipeline

```
1. Cron trigger fires (every 4 hours)
         │
         ▼
2. Orchestrator runs all scrapers in parallel
         │
         ▼
3. Each scraper fetches HTML from source site
         │
         ▼
4. HTML is parsed for shift codes (regex + validation)
         │
         ▼
5. Codes are batched into ScrapedCodeBatch
         │
         ▼
6. Batch is sent to Cloudflare Queue
         │
         ▼
7. Queue consumer (aggregator) processes messages
         │
         ▼
8. INSERT OR IGNORE into D1 (deduplication at DB level)
         │
         ▼
9. Snapshot cron creates public JSON in R2 (every 15 min)
```

### Redemption Pipeline (Desktop App)

```
1. User logs into SHiFT via desktop app
         │
         ▼
2. Session stored securely in Tauri store
         │
         ▼
3. App fetches codes from R2 public API
         │
         ▼
4. User selects codes or enables auto-redeem
         │
         ▼
5. For each code:
   a. Check code validity (GET /entitlement_offer_codes)
   b. Parse redemption forms
   c. Submit redemption (POST /code_redemptions)
   d. Handle rate limiting
   e. Log result
         │
         ▼
6. Update local redeemed codes list
```

---

## Development Guidelines

### Code Style

- **TypeScript:** Strict mode enabled
- **Formatting:** Let IDE handle formatting
- **Imports:** Use `@yascar/*` workspace imports
- **Error Handling:** Always wrap external API calls in try/catch
- **Logging:** Use `console.log` with prefixes (e.g., `[scraper]`, `[orchestrator]`)

### Adding a New Scraper

1. Create `apps/scraper/src/sources/your-source.ts`:

```typescript
import { ShiftCode } from "@yascar/types";
import { SourceScraper, WebpageConfig } from "./types";
import { sanitizeBatch, isReasonableHtmlSize } from "./validation";

export class YourSourceScraper implements SourceScraper {
    readonly name = "your-source";

    async scrape(): Promise<ShiftCode[]> {
        // Implementation
        return sanitizeBatch(codes, this.name);
    }
}

export const yourSource = new YourSourceScraper();
```

2. Register in `apps/scraper/src/sources/index.ts`
3. Add to scrapers array in `apps/scraper/src/orchestrator.ts`

### Adding a Desktop Feature

1. If adding a new page, create in `apps/desktop/src/pages/`
2. Add route in `App.tsx`
3. Add navigation link in `components/Layout.tsx`
4. Use existing theme classes from `tailwind.config.js`

### Package Dependencies

When adding dependencies:
- **Shared types/utilities:** Add to `packages/*`
- **App-specific:** Add to the specific `apps/*` workspace
- **Never** add app-specific deps to root `package.json`

---

## Common Tasks

### Running Locally

```bash
# Install all dependencies
npm install

# Build shared packages first
npm run build -w @yascar/types
npm run build -w @yascar/shift-client
npm run build -w @yascar/user-config

# Run scraper locally (needs wrangler login)
npm run dev:scraper

# Run desktop app
npm run dev:desktop

# Run web landing page
npm run dev:web
```

### Database Operations

```bash
# Create D1 database (one-time)
npx wrangler d1 create yascar-codes

# Apply schema
npx wrangler d1 execute yascar-codes --file=apps/scraper/schema.sql --local

# Query local database
npx wrangler d1 execute yascar-codes --local --command "SELECT * FROM shift_codes LIMIT 10"
```

### Deploying

```bash
# Deploy scraper to Cloudflare
cd apps/scraper
npx wrangler deploy

# Build desktop app
cd apps/desktop
npm run tauri build
```

---

## Testing Strategy

### Unit Tests

- Validators in `packages/`
- Individual scrapers
- Storage abstractions

### Integration Tests

- Scraper end-to-end (mock HTTP responses)
- Desktop app flow (mock SHiFT API)

### Manual Testing

- **Scraper:** Use wrangler dev with `--local` flag
- **Desktop:** Run `npm run dev:desktop`
- **SHiFT API:** Use test account (never share credentials)

---

## Deployment

### Cloudflare (Scraper)

| Resource | Binding | Purpose |
|----------|---------|---------|
| D1 Database | `DB` | Primary code storage |
| R2 Bucket | `SHIFT_CODES_BUCKET` | Public JSON API |
| Queue | `CODES_QUEUE` | Async code processing |

### Desktop Distribution

- **Windows:** MSI/NSIS installer via Tauri
- **macOS:** DMG/App bundle
- **Linux:** AppImage/deb

---

## Security Considerations

### Credential Storage

- **Desktop:** Session cookies stored in Tauri's encrypted store
- **Never:** Log or expose session cookies
- **Never:** Commit credentials to git

### Rate Limiting

⚠️ **Critical:** The SHiFT API will block clients that make too many requests.

| Mode | Request Delay | Rate Limit Backoff |
|------|---------------|-------------------|
| Conservative | 5s | 60s |
| Moderate | 3s | 30s |
| Aggressive | 1s | 15s |

**Recommended:** Always use "conservative" mode for automated redemption.

### Scraper Defenses

- HTML size limits (5MB max)
- Batch size limits (100 codes max)
- Code format validation
- Source URL validation

---

## API Reference

### Public Codes API

**Endpoint:** `https://<R2_PUBLIC_URL>/codes.json`

**Response Format:**

```json
{
  "meta": {
    "version": "1.0.0",
    "generated": "2026-01-07T12:00:00Z",
    "count": 42,
    "filters": {
      "since": null,
      "game": null,
      "platform": null,
      "includeExpired": false
    }
  },
  "codes": [
    {
      "code": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
      "games": ["Borderlands 3"],
      "discoveredAt": "2026-01-07T10:00:00Z",
      "expires": "2026-01-14T00:00:00Z",
      "source": "https://mentalmars.com/...",
      "reward": "3 Golden Keys",
      "expired": false
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Login fails | Invalid credentials or CSRF expired | Retry login, check session flow |
| No codes found | Source website changed format | Update scraper regex/selectors |
| Rate limited | Too many requests | Increase throttle delay |
| D1 errors | Schema mismatch | Re-apply schema.sql |
| Tauri build fails | Missing Rust deps | Run `cargo install tauri-cli` |

### Debug Logging

Enable verbose logging:

```typescript
// Scraper
console.log(`[scraper:${source}] Fetching...`);

// Desktop
console.log('[store] Loading session...');
```

---

## Future Roadmap

- [ ] Additional scraper sources (orcicorn, twitter, etc.)
- [ ] Push notifications for new codes
- [ ] Browser extension
- [ ] Mobile app (iOS/Android)
- [ ] Code expiration prediction (ML)
- [ ] Multi-account support

---

## Contributing

1. Check existing issues/discussions
2. Create feature branch from `main`
3. Follow code style guidelines
4. Add tests for new functionality
5. Update this document if architecture changes
6. Submit PR with clear description

---

*Last updated: 2026-01-07*
