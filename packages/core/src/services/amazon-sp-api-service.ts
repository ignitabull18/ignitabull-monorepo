/**
 * Amazon Selling Partner API Service
 * Handles authentication and data fetching from Amazon SP-API
 */

import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Amazon OAuth credentials schema
 */
const AmazonCredentialsSchema = z.object({
	refreshToken: z.string(),
	lwaClientId: z.string(),
	lwaClientSecret: z.string(),
	sellerId: z.string(),
	marketplaceId: z.string(),
	awsAccessKeyId: z.string(),
	awsSecretAccessKey: z.string(),
	roleArn: z.string(),
});

export type AmazonCredentials = z.infer<typeof AmazonCredentialsSchema>;

/**
 * Amazon order schema
 */
export interface AmazonOrder {
	AmazonOrderId: string;
	PurchaseDate: string;
	OrderTotal?: {
		CurrencyCode: string;
		Amount: string;
	};
	OrderStatus: string;
	FulfillmentChannel: string;
}

/**
 * Integration status
 */
export interface IntegrationStatus {
	connected: boolean;
	lastSync?: Date;
	error?: string;
}

/**
 * Encryption helper for storing sensitive credentials
 */
class CredentialEncryption {
	private algorithm = "aes-256-gcm";
	private secretKey: Buffer;

	constructor(secret: string) {
		this.secretKey = crypto.scryptSync(secret, "salt", 32);
	}

	encrypt(text: string): string {
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

		let encrypted = cipher.update(text, "utf8", "hex");
		encrypted += cipher.final("hex");

		const authTag = cipher.getAuthTag();

		return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
	}

	decrypt(encryptedData: string): string {
		const parts = encryptedData.split(":");
		const iv = Buffer.from(parts[0], "hex");
		const authTag = Buffer.from(parts[1], "hex");
		const encrypted = parts[2];

		const decipher = crypto.createDecipheriv(
			this.algorithm,
			this.secretKey,
			iv,
		);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(encrypted, "hex", "utf8");
		decrypted += decipher.final("utf8");

		return decrypted;
	}
}

/**
 * Amazon SP-API Service
 * Provides methods for Amazon seller integration
 */
export class AmazonSPAPIService {
	private supabase: SupabaseClient;
	private encryptor: CredentialEncryption;
	private baseUrl = "https://sellingpartnerapi-na.amazon.com";

	constructor(
		supabaseUrl: string,
		supabaseKey: string,
		encryptionSecret: string,
	) {
		this.supabase = createClient(supabaseUrl, supabaseKey);
		this.encryptor = new CredentialEncryption(encryptionSecret);
	}

	/**
	 * Get OAuth authorization URL for Amazon
	 * @param organizationId - Organization ID
	 * @param redirectUri - OAuth redirect URI
	 * @returns Authorization URL
	 */
	getAuthorizationUrl(organizationId: string, redirectUri: string): string {
		const state = Buffer.from(JSON.stringify({ organizationId })).toString(
			"base64",
		);
		const params = new URLSearchParams({
			application_id: process.env.AMAZON_APP_ID || "",
			state,
			redirect_uri: redirectUri,
		});

		return `https://sellercentral.amazon.com/apps/authorize/consent?${params.toString()}`;
	}

	/**
	 * Complete OAuth flow and store credentials
	 * @param organizationId - Organization ID
	 * @param code - Authorization code from Amazon
	 * @param credentials - Amazon SP-API credentials
	 * @returns Success or error
	 */
	async connectAccount(
		organizationId: string,
		_code: string,
		credentials: AmazonCredentials,
	): Promise<{ error: Error | null }> {
		try {
			const validatedCreds = AmazonCredentialsSchema.parse(credentials);

			// Encrypt sensitive credentials
			const encryptedCredentials = {
				refreshToken: this.encryptor.encrypt(validatedCreds.refreshToken),
				lwaClientId: validatedCreds.lwaClientId,
				lwaClientSecret: this.encryptor.encrypt(validatedCreds.lwaClientSecret),
				sellerId: validatedCreds.sellerId,
				marketplaceId: validatedCreds.marketplaceId,
				awsAccessKeyId: this.encryptor.encrypt(validatedCreds.awsAccessKeyId),
				awsSecretAccessKey: this.encryptor.encrypt(
					validatedCreds.awsSecretAccessKey,
				),
				roleArn: validatedCreds.roleArn,
			};

			// Store in integrations table
			const { error } = await this.supabase.from("integrations").upsert(
				{
					organization_id: organizationId,
					platform: "amazon",
					name: `Amazon Seller - ${validatedCreds.sellerId}`,
					credentials: encryptedCredentials,
					status: "active",
					settings: {
						marketplaceId: validatedCreds.marketplaceId,
						sellerId: validatedCreds.sellerId,
					},
					last_sync_at: new Date().toISOString(),
				},
				{
					onConflict: "organization_id,platform,name",
				},
			);

			if (error) throw error;

			return { error: null };
		} catch (error) {
			return { error: error as Error };
		}
	}

	/**
	 * Disconnect Amazon account
	 * @param organizationId - Organization ID
	 * @returns Success or error
	 */
	async disconnectAccount(
		organizationId: string,
	): Promise<{ error: Error | null }> {
		try {
			const { error } = await this.supabase
				.from("integrations")
				.delete()
				.eq("organization_id", organizationId)
				.eq("platform", "amazon");

			if (error) throw error;

			return { error: null };
		} catch (error) {
			return { error: error as Error };
		}
	}

	/**
	 * Get integration status
	 * @param organizationId - Organization ID
	 * @returns Integration status
	 */
	async getIntegrationStatus(
		organizationId: string,
	): Promise<IntegrationStatus> {
		try {
			const { data, error } = await this.supabase
				.from("integrations")
				.select("status, last_sync_at")
				.eq("organization_id", organizationId)
				.eq("platform", "amazon")
				.single();

			if (error || !data) {
				return { connected: false };
			}

			return {
				connected: data.status === "active",
				lastSync: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
			};
		} catch (error) {
			return {
				connected: false,
				error: (error as Error).message,
			};
		}
	}

	/**
	 * Get stored credentials for an organization
	 * @param organizationId - Organization ID
	 * @returns Decrypted credentials or null
	 */
	private async getCredentials(
		organizationId: string,
	): Promise<AmazonCredentials | null> {
		try {
			const { data, error } = await this.supabase
				.from("integrations")
				.select("credentials")
				.eq("organization_id", organizationId)
				.eq("platform", "amazon")
				.eq("status", "active")
				.single();

			if (error || !data) return null;

			// Decrypt credentials
			const creds = data.credentials as any;
			return {
				refreshToken: this.encryptor.decrypt(creds.refreshToken),
				lwaClientId: creds.lwaClientId,
				lwaClientSecret: this.encryptor.decrypt(creds.lwaClientSecret),
				sellerId: creds.sellerId,
				marketplaceId: creds.marketplaceId,
				awsAccessKeyId: this.encryptor.decrypt(creds.awsAccessKeyId),
				awsSecretAccessKey: this.encryptor.decrypt(creds.awsSecretAccessKey),
				roleArn: creds.roleArn,
			};
		} catch (error) {
			console.error("Failed to get credentials:", error);
			return null;
		}
	}

	/**
	 * Get access token using refresh token
	 * @param credentials - Amazon credentials
	 * @returns Access token or null
	 */
	private async getAccessToken(
		credentials: AmazonCredentials,
	): Promise<string | null> {
		try {
			const response = await fetch("https://api.amazon.com/auth/o2/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "refresh_token",
					refresh_token: credentials.refreshToken,
					client_id: credentials.lwaClientId,
					client_secret: credentials.lwaClientSecret,
				}),
			});

			if (!response.ok) {
				throw new Error(`Token refresh failed: ${response.statusText}`);
			}

			const data = await response.json();
			return data.access_token;
		} catch (error) {
			console.error("Failed to get access token:", error);
			return null;
		}
	}

	/**
	 * Fetch orders from Amazon SP-API
	 * @param organizationId - Organization ID
	 * @param startDate - Start date for orders
	 * @param endDate - End date for orders
	 * @returns List of orders or error
	 */
	async fetchOrders(
		organizationId: string,
		startDate: Date,
		endDate: Date,
	): Promise<{ orders: AmazonOrder[] | null; error: Error | null }> {
		try {
			const credentials = await this.getCredentials(organizationId);
			if (!credentials) {
				return {
					orders: null,
					error: new Error("Amazon account not connected"),
				};
			}

			const accessToken = await this.getAccessToken(credentials);
			if (!accessToken) {
				return {
					orders: null,
					error: new Error("Failed to authenticate with Amazon"),
				};
			}

			// Note: This is a simplified implementation
			// In production, you would need to:
			// 1. Sign the request with AWS Signature V4
			// 2. Handle pagination
			// 3. Handle rate limiting
			// 4. Use the correct endpoint based on marketplace

			const params = new URLSearchParams({
				CreatedAfter: startDate.toISOString(),
				CreatedBefore: endDate.toISOString(),
				MarketplaceIds: credentials.marketplaceId,
			});

			const response = await fetch(
				`${this.baseUrl}/orders/v0/orders?${params.toString()}`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"x-amz-access-token": accessToken,
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch orders: ${response.statusText}`);
			}

			const data = await response.json();

			// Update last sync time
			await this.supabase
				.from("integrations")
				.update({ last_sync_at: new Date().toISOString() })
				.eq("organization_id", organizationId)
				.eq("platform", "amazon");

			return {
				orders: data.payload?.Orders || [],
				error: null,
			};
		} catch (error) {
			return {
				orders: null,
				error: error as Error,
			};
		}
	}

	/**
	 * Fetch recent orders (last 7 days)
	 * @param organizationId - Organization ID
	 * @param limit - Maximum number of orders to return
	 * @returns Recent orders
	 */
	async fetchRecentOrders(
		organizationId: string,
		limit = 10,
	): Promise<{ orders: AmazonOrder[] | null; error: Error | null }> {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 7);

		const result = await this.fetchOrders(organizationId, startDate, endDate);

		if (result.orders && result.orders.length > limit) {
			result.orders = result.orders.slice(0, limit);
		}

		return result;
	}
}

// Initialize and export a singleton instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const encryptionSecret =
	process.env.ENCRYPTION_SECRET || "default-secret-change-in-production";

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		"Supabase URL and Anon Key must be defined in environment variables",
	);
}

export const amazonService = new AmazonSPAPIService(
	supabaseUrl,
	supabaseAnonKey,
	encryptionSecret,
);
