import * as cheerio from "cheerio";
import {
    SHIFT_BASE_URL,
    GAME_CODES,
    PLATFORM_CODES,
    ShiftSession,
    LoginResult,
    CodeCheckResult,
    RedemptionResult,
    RedemptionForm,
    ThrottleConfig,
    ShiftClientConfig,
    DEFAULT_THROTTLE,
} from "./types";

/**
 * Default headers for SHiFT requests
 */
const DEFAULT_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
};

/**
 * SHiFT Client for authentication and code redemption
 */
export class ShiftClient {
    private session: ShiftSession | null = null;
    private lastRequestTime = 0;
    private throttle: ThrottleConfig;
    private fetch: typeof fetch;

    constructor(config: ShiftClientConfig | ThrottleConfig = {}) { // Backward compatibility
        if ('requestDelay' in config) {
            this.throttle = config;
            this.fetch = globalThis.fetch;
        } else {
            this.throttle = config.throttle || DEFAULT_THROTTLE;
            this.fetch = config.fetch || globalThis.fetch;
        }
    }

    /**
     * Set an existing session (e.g., loaded from storage)
     */
    setSession(session: ShiftSession): void {
        this.session = session;
    }

    /**
     * Get the current session
     */
    getSession(): ShiftSession | null {
        return this.session;
    }

    /**
     * Check if we have a valid session
     */
    isAuthenticated(): boolean {
        if (!this.session) return false;
        return new Date(this.session.expiresAt) > new Date();
    }

    /**
     * Wait to avoid rate limiting
     */
    private async waitForThrottle(): Promise<void> {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.throttle.requestDelay) {
            await this.sleep(this.throttle.requestDelay - elapsed);
        }
        this.lastRequestTime = Date.now();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Convert session cookies to header string
     */
    private getCookieString(): string {
        if (!this.session) return "";
        return Object.entries(this.session.cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
    }

    /**
     * Parse Set-Cookie headers into cookie object
     */
    private parseCookies(
        headers: Headers,
        existing: Record<string, string> = {}
    ): Record<string, string> {
        const cookies = { ...existing };
        const setCookie = headers.get("set-cookie");
        if (setCookie) {
            // Handle multiple cookies (may be comma-separated or multiple headers)
            const cookieParts = setCookie.split(/,(?=[^;]*=)/);
            for (const part of cookieParts) {
                const [nameValue] = part.split(";");
                const [name, value] = nameValue.split("=");
                if (name && value) {
                    cookies[name.trim()] = value.trim();
                }
            }
        }
        return cookies;
    }

    /**
     * Login to SHiFT with email and password
     */
    async login(email: string, password: string): Promise<LoginResult> {
        try {
            // Step 1: Get the home page to get CSRF tokens and initial cookies
            const homeResponse = await this.fetch(`${SHIFT_BASE_URL}/home`, {
                headers: DEFAULT_HEADERS,
            });

            if (!homeResponse.ok) {
                return { success: false, error: `Failed to load login page: ${homeResponse.status}` };
            }

            let cookies = this.parseCookies(homeResponse.headers);
            const homeHtml = await homeResponse.text();

            // Extract CSRF tokens
            const $ = cheerio.load(homeHtml);
            const csrfToken = $('meta[name="csrf-token"]').attr("content");
            const formToken = $('input[name="authenticity_token"]').attr("value");

            if (!csrfToken || !formToken) {
                return { success: false, error: "Could not extract authentication tokens" };
            }

            // Step 2: Submit login form
            const formData = new URLSearchParams({
                utf8: "✓",
                authenticity_token: formToken,
                "user[email]": email,
                "user[password]": password,
                commit: "SIGN IN",
            });

            const loginResponse = await this.fetch(`${SHIFT_BASE_URL}/sessions`, {
                method: "POST",
                headers: {
                    ...DEFAULT_HEADERS,
                    "Content-Type": "application/x-www-form-urlencoded",
                    Cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; "),
                    Origin: SHIFT_BASE_URL,
                    Referer: `${SHIFT_BASE_URL}/home`,
                },
                body: formData,
                redirect: "manual",
            });

            cookies = this.parseCookies(loginResponse.headers, cookies);

            // Check for successful redirect to /account (standard fetch behavior)
            if (
                loginResponse.status === 302 &&
                loginResponse.headers.get("location")?.includes("/account")
            ) {
                const session: ShiftSession = {
                    cookies,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                };
                this.session = session;
                return { success: true, session };
            }

            // Handle 200 response - could be error page or success if redirect was followed
            if (loginResponse.status === 200) {
                const body = await loginResponse.text();

                // Check for login failures
                if (body.includes("Invalid email or password")) {
                    return { success: false, error: "Invalid email or password" };
                }

                // Check for success indicators (Tauri HTTP plugin may auto-follow redirects)
                // These indicate we're on the account/rewards page after successful login
                if (
                    body.includes("Sign Out") ||
                    body.includes("My Rewards") ||
                    body.includes('href="/account"') ||
                    body.includes("CODE HISTORY") ||
                    body.includes("ACCOUNT DETAILS")
                ) {
                    const session: ShiftSession = {
                        cookies,
                        createdAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    };
                    this.session = session;
                    return { success: true, session };
                }
            }

            return { success: false, error: `Login failed with status ${loginResponse.status}` };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    /**
     * Check if a code is valid and get redemption forms
     */
    async checkCode(code: string): Promise<CodeCheckResult> {
        if (!this.isAuthenticated()) {
            return { valid: false, reason: "Not authenticated" };
        }

        await this.waitForThrottle();

        try {
            const response = await this.fetch(
                `${SHIFT_BASE_URL}/entitlement_offer_codes?code=${code}`,
                {
                    headers: {
                        ...DEFAULT_HEADERS,
                        Cookie: this.getCookieString(),
                        Accept: "*/*",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                }
            );

            if (response.status === 429) {
                await this.sleep(this.throttle.rateLimitDelay);
                return this.checkCode(code); // Retry
            }

            if (!response.ok) {
                return { valid: false, reason: `HTTP ${response.status}` };
            }

            const html = await response.text();

            if (html.includes("This is not a valid SHiFT code")) {
                return { valid: false, reason: "Invalid code" };
            }

            if (html.includes("This SHiFT code has already been redeemed")) {
                return { valid: false, reason: "Already redeemed" };
            }

            if (html.includes("expired") || html.includes("no longer valid")) {
                return { valid: false, reason: "Code expired" };
            }

            // Parse redemption forms
            const forms = this.parseRedemptionForms(html);
            return { valid: true, forms };
        } catch (error) {
            return { valid: false, reason: String(error) };
        }
    }

    /**
     * Parse HTML to extract redemption forms
     */
    private parseRedemptionForms(html: string): RedemptionForm[] {
        const $ = cheerio.load(html);
        const forms: RedemptionForm[] = [];

        $("form.new_archway_code_redemption").each((_, form) => {
            const $form = $(form);
            const service = $form.find('input[name="archway_code_redemption[service]"]').val() as string;
            const title = $form.find('input[name="archway_code_redemption[title]"]').val() as string;
            const code = $form.find('input[name="archway_code_redemption[code]"]').val() as string;
            const check = $form.find('input[name="archway_code_redemption[check]"]').val() as string;
            const token = $form.find('input[name="authenticity_token"]').val() as string;

            if (service && title && code && check && token) {
                // Find game name from title code
                const game = Object.entries(GAME_CODES).find(([_, v]) => v === title)?.[0] || title;
                // Find platform name from service code
                const platform = Object.entries(PLATFORM_CODES).find(([_, v]) => v === service)?.[0] || service;

                forms.push({ game, platform, service, title, code, check, token });
            }
        });

        return forms;
    }

    /**
     * Redeem a code using a specific form
     */
    async redeemCode(form: RedemptionForm): Promise<RedemptionResult> {
        if (!this.isAuthenticated()) {
            return { success: false, code: form.code, reason: "Not authenticated" };
        }

        await this.waitForThrottle();

        try {
            const formData = new URLSearchParams({
                utf8: "✓",
                authenticity_token: form.token,
                "archway_code_redemption[code]": form.code,
                "archway_code_redemption[check]": form.check,
                "archway_code_redemption[service]": form.service,
                "archway_code_redemption[title]": form.title,
                commit: `Redeem for ${form.platform}`,
            });

            const response = await this.fetch(`${SHIFT_BASE_URL}/code_redemptions`, {
                method: "POST",
                headers: {
                    ...DEFAULT_HEADERS,
                    Cookie: this.getCookieString(),
                    "Content-Type": "application/x-www-form-urlencoded",
                    Origin: SHIFT_BASE_URL,
                    Referer: `${SHIFT_BASE_URL}/rewards`,
                },
                body: formData,
                redirect: "manual",
            });

            if (response.status === 429) {
                await this.sleep(this.throttle.rateLimitDelay);
                return this.redeemCode(form); // Retry
            }

            // 302 redirect to /rewards or /code_redemptions indicates success
            if (response.status === 302) {
                const location = response.headers.get("location") || "";
                if (location.includes("/rewards") || location.includes("/code_redemptions/")) {
                    return {
                        success: true,
                        code: form.code,
                        game: form.game,
                        platform: form.platform,
                    };
                }
            }

            const html = await response.text();

            if (html.includes("already been redeemed")) {
                return { success: false, code: form.code, reason: "Already redeemed" };
            }

            if (html.includes("expired") || html.includes("no longer valid")) {
                return { success: false, code: form.code, reason: "Code expired" };
            }

            if (html.includes("My Rewards") || response.status === 200) {
                return { success: true, code: form.code, game: form.game, platform: form.platform };
            }

            return { success: false, code: form.code, reason: "Unknown error" };
        } catch (error) {
            return { success: false, code: form.code, reason: String(error) };
        }
    }
}
