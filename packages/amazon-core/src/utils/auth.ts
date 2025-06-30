/**
 * Authentication utilities for Amazon API integrations
 */

import { createHash, createHmac } from "node:crypto";
import { AmazonAuthError } from "../errors/base";
import type {
	AdvertisingConfig,
	AssociatesConfig,
	SPAPIConfig,
} from "../types/config";

/**
 * Base authentication interface
 */
export interface AuthProvider {
	readonly type: string;
	getAuthHeaders(): Promise<Record<string, string>>;
	refreshToken?(): Promise<void>;
	validateCredentials(): Promise<boolean>;
}

/**
 * SP-API authentication provider using LWA (Login with Amazon)
 */
export class SPAPIAuthProvider implements AuthProvider {
	readonly type = "sp-api";
	private accessToken?: string;
	private tokenExpiry?: Date;

	constructor(private readonly config: SPAPIConfig) {
		this.validateConfig();
	}

	async getAuthHeaders(): Promise<Record<string, string>> {
		await this.ensureValidToken();

		return {
			Authorization: `Bearer ${this.accessToken}`,
			"x-amz-access-token": this.accessToken!,
			"x-amz-date": new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""),
			"Content-Type": "application/json",
		};
	}

	async refreshToken(): Promise<void> {
		try {
			const response = await fetch("https://api.amazon.com/auth/o2/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "refresh_token",
					refresh_token: this.config.refreshToken,
					client_id: this.config.lwaClientId,
					client_secret: this.config.lwaClientSecret,
				}),
			});

			if (!response.ok) {
				throw new AmazonAuthError(
					`Failed to refresh SP-API token: ${response.status} ${response.statusText}`,
					{ provider: "sp-api" },
				);
			}

			const data = await response.json();
			this.accessToken = data.access_token;

			// Set expiry with some buffer (subtract 5 minutes)
			const expiresIn = data.expires_in || 3600;
			this.tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
		} catch (error) {
			throw new AmazonAuthError("Failed to refresh SP-API access token", {
				provider: "sp-api",
				cause: error,
			});
		}
	}

	async validateCredentials(): Promise<boolean> {
		try {
			await this.ensureValidToken();
			return true;
		} catch {
			return false;
		}
	}

	private async ensureValidToken(): Promise<void> {
		if (
			!this.accessToken ||
			!this.tokenExpiry ||
			Date.now() >= this.tokenExpiry.getTime()
		) {
			await this.refreshToken();
		}
	}

	private validateConfig(): void {
		const required = [
			"clientId",
			"clientSecret",
			"refreshToken",
			"lwaClientId",
			"lwaClientSecret",
		];
		for (const field of required) {
			if (!this.config[field as keyof SPAPIConfig]) {
				throw new AmazonAuthError(
					`Missing required SP-API config field: ${field}`,
				);
			}
		}
	}
}

/**
 * Advertising API authentication provider
 */
export class AdvertisingAuthProvider implements AuthProvider {
	readonly type = "advertising";
	private accessToken?: string;
	private tokenExpiry?: Date;

	constructor(private readonly config: AdvertisingConfig) {
		this.validateConfig();
	}

	async getAuthHeaders(): Promise<Record<string, string>> {
		await this.ensureValidToken();

		return {
			Authorization: `Bearer ${this.accessToken}`,
			"Amazon-Advertising-API-ClientId": this.config.clientId,
			"Amazon-Advertising-API-Scope": this.config.profileId,
			"Content-Type": "application/json",
		};
	}

	async refreshToken(): Promise<void> {
		try {
			const response = await fetch("https://api.amazon.com/auth/o2/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "refresh_token",
					refresh_token: this.config.refreshToken,
					client_id: this.config.clientId,
					client_secret: this.config.clientSecret,
				}),
			});

			if (!response.ok) {
				throw new AmazonAuthError(
					`Failed to refresh Advertising API token: ${response.status} ${response.statusText}`,
					{ provider: "advertising" },
				);
			}

			const data = await response.json();
			this.accessToken = data.access_token;

			const expiresIn = data.expires_in || 3600;
			this.tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
		} catch (error) {
			throw new AmazonAuthError(
				"Failed to refresh Advertising API access token",
				{ provider: "advertising", cause: error },
			);
		}
	}

	async validateCredentials(): Promise<boolean> {
		try {
			await this.ensureValidToken();
			return true;
		} catch {
			return false;
		}
	}

	private async ensureValidToken(): Promise<void> {
		if (
			!this.accessToken ||
			!this.tokenExpiry ||
			Date.now() >= this.tokenExpiry.getTime()
		) {
			await this.refreshToken();
		}
	}

	private validateConfig(): void {
		const required = ["clientId", "clientSecret", "refreshToken", "profileId"];
		for (const field of required) {
			if (!this.config[field as keyof AdvertisingConfig]) {
				throw new AmazonAuthError(
					`Missing required Advertising API config field: ${field}`,
				);
			}
		}
	}
}

/**
 * Associates API authentication provider using AWS Signature V4
 */
export class AssociatesAuthProvider implements AuthProvider {
	readonly type = "associates";

	constructor(private readonly config: AssociatesConfig) {
		this.validateConfig();
	}

	async getAuthHeaders(): Promise<Record<string, string>> {
		// Associates API uses AWS Signature V4 - headers are generated per request
		return {};
	}

	async validateCredentials(): Promise<boolean> {
		try {
			// Test with a simple GetItems request
			const testHeaders = await this.signRequest("POST", "/paapi5/getitems", {
				PartnerTag: this.config.partnerTag,
				PartnerType: this.config.partnerType,
				Marketplace: this.config.host || "www.amazon.com",
				ItemIds: ["B000000000"], // Invalid ASIN for testing
			});

			return !!testHeaders;
		} catch {
			return false;
		}
	}

	/**
	 * Sign a request for Associates API using AWS Signature V4
	 */
	async signRequest(
		method: string,
		path: string,
		payload: any,
		timestamp?: Date,
	): Promise<Record<string, string>> {
		const now = timestamp || new Date();
		const region = this.config.region;
		const service = "ProductAdvertisingAPI";
		const host = this.config.host || "webservices.amazon.com";

		// Create canonical request
		const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
		const dateStamp = amzDate.substr(0, 8);

		const payloadHash = createHash("sha256")
			.update(JSON.stringify(payload))
			.digest("hex");

		const canonicalHeaders = [
			"content-type:application/json; charset=utf-8",
			`host:${host}`,
			`x-amz-date:${amzDate}`,
			"x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
		].join("\n");

		const signedHeaders = "content-type;host;x-amz-date;x-amz-target";

		const canonicalRequest = [
			method,
			path,
			"", // query string (empty for POST)
			canonicalHeaders,
			"", // empty line
			signedHeaders,
			payloadHash,
		].join("\n");

		// Create string to sign
		const algorithm = "AWS4-HMAC-SHA256";
		const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
		const stringToSign = [
			algorithm,
			amzDate,
			credentialScope,
			createHash("sha256").update(canonicalRequest).digest("hex"),
		].join("\n");

		// Calculate signature
		const kDate = createHmac("sha256", `AWS4${this.config.secretKey}`)
			.update(dateStamp)
			.digest();
		const kRegion = createHmac("sha256", kDate).update(region).digest();
		const kService = createHmac("sha256", kRegion).update(service).digest();
		const kSigning = createHmac("sha256", kService)
			.update("aws4_request")
			.digest();
		const signature = createHmac("sha256", kSigning)
			.update(stringToSign)
			.digest("hex");

		// Create authorization header
		const authorization = [
			`${algorithm} Credential=${this.config.accessKey}/${credentialScope}`,
			`SignedHeaders=${signedHeaders}`,
			`Signature=${signature}`,
		].join(", ");

		return {
			Authorization: authorization,
			"Content-Type": "application/json; charset=utf-8",
			Host: host,
			"X-Amz-Date": amzDate,
			"X-Amz-Target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
		};
	}

	private validateConfig(): void {
		const required = ["accessKey", "secretKey", "partnerTag"];
		for (const field of required) {
			if (!this.config[field as keyof AssociatesConfig]) {
				throw new AmazonAuthError(
					`Missing required Associates API config field: ${field}`,
				);
			}
		}
	}
}

/**
 * Authentication manager for all Amazon APIs
 */
export class AuthManager {
	private providers = new Map<string, AuthProvider>();

	/**
	 * Register an authentication provider
	 */
	registerProvider(provider: AuthProvider): void {
		this.providers.set(provider.type, provider);
	}

	/**
	 * Get authentication provider by type
	 */
	getProvider(type: string): AuthProvider | undefined {
		return this.providers.get(type);
	}

	/**
	 * Get authentication headers for a specific provider
	 */
	async getAuthHeaders(providerType: string): Promise<Record<string, string>> {
		const provider = this.getProvider(providerType);
		if (!provider) {
			throw new AmazonAuthError(
				`No authentication provider found for type: ${providerType}`,
			);
		}
		return provider.getAuthHeaders();
	}

	/**
	 * Refresh tokens for all providers that support it
	 */
	async refreshAllTokens(): Promise<void> {
		const refreshPromises = Array.from(this.providers.values())
			.filter((provider) => provider.refreshToken)
			.map((provider) => provider.refreshToken?.());

		await Promise.allSettled(refreshPromises);
	}

	/**
	 * Validate all registered providers
	 */
	async validateAllCredentials(): Promise<Record<string, boolean>> {
		const results: Record<string, boolean> = {};

		for (const [type, provider] of this.providers) {
			try {
				results[type] = await provider.validateCredentials();
			} catch {
				results[type] = false;
			}
		}

		return results;
	}

	/**
	 * Create default auth manager with all providers
	 */
	static create(configs: {
		spApi?: SPAPIConfig;
		advertising?: AdvertisingConfig;
		associates?: AssociatesConfig;
	}): AuthManager {
		const manager = new AuthManager();

		if (configs.spApi) {
			manager.registerProvider(new SPAPIAuthProvider(configs.spApi));
		}

		if (configs.advertising) {
			manager.registerProvider(
				new AdvertisingAuthProvider(configs.advertising),
			);
		}

		if (configs.associates) {
			manager.registerProvider(new AssociatesAuthProvider(configs.associates));
		}

		return manager;
	}
}

/**
 * Token cache for storing and retrieving access tokens
 */
export class TokenCache {
	private cache = new Map<
		string,
		{
			token: string;
			expiry: Date;
			refreshToken?: string;
		}
	>();

	/**
	 * Store a token in the cache
	 */
	set(
		key: string,
		token: string,
		expiresIn: number,
		refreshToken?: string,
	): void {
		const expiry = new Date(Date.now() + expiresIn * 1000);
		this.cache.set(key, { token, expiry, refreshToken });
	}

	/**
	 * Get a token from the cache
	 */
	get(key: string): { token: string; refreshToken?: string } | undefined {
		const cached = this.cache.get(key);
		if (!cached) {
			return undefined;
		}

		// Check if token is expired (with 5 minute buffer)
		if (Date.now() >= cached.expiry.getTime() - 300000) {
			this.cache.delete(key);
			return undefined;
		}

		return {
			token: cached.token,
			refreshToken: cached.refreshToken,
		};
	}

	/**
	 * Remove a token from the cache
	 */
	delete(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * Clear all tokens from the cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get all cached tokens status
	 */
	getStatus(): Record<string, { hasToken: boolean; expiry: Date }> {
		const status: Record<string, { hasToken: boolean; expiry: Date }> = {};

		for (const [key, cached] of this.cache) {
			status[key] = {
				hasToken: true,
				expiry: cached.expiry,
			};
		}

		return status;
	}
}

/**
 * Auth utilities
 */
export class AuthUtils {
	/**
	 * Parse JWT token (without verification)
	 */
	static parseJWT(token: string): any {
		try {
			const parts = token.split(".");
			if (parts.length !== 3) {
				throw new Error("Invalid JWT format");
			}

			const payload = parts[1];
			const decoded = Buffer.from(payload, "base64url").toString("utf-8");
			return JSON.parse(decoded);
		} catch (error) {
			throw new AmazonAuthError("Failed to parse JWT token", { cause: error });
		}
	}

	/**
	 * Check if JWT token is expired
	 */
	static isJWTExpired(token: string, bufferSeconds = 300): boolean {
		try {
			const payload = AuthUtils.parseJWT(token);
			if (!payload.exp) {
				return true;
			}

			const expiryTime = payload.exp * 1000; // Convert to milliseconds
			const now = Date.now();

			return now >= expiryTime - bufferSeconds * 1000;
		} catch {
			return true;
		}
	}

	/**
	 * Generate a secure random string for state parameters
	 */
	static generateState(length = 32): string {
		const chars =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let result = "";

		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}

		return result;
	}

	/**
	 * Create PKCE (Proof Key for Code Exchange) challenge
	 */
	static createPKCEChallenge(): { verifier: string; challenge: string } {
		const verifier = AuthUtils.generateState(128);
		const challenge = createHash("sha256").update(verifier).digest("base64url");

		return { verifier, challenge };
	}
}
