/**
 * Protected Amazon Service
 * Amazon API service with circuit breaker protection
 */

import { CircuitBreakerPresets } from "../../../core/src/lib/circuit-breaker";
import { ProtectedServiceBase } from "../../../core/src/services/protected-service-base";
import type { AmazonCredentials, ApiResponse } from "../types";

export interface AmazonServiceConfig {
	credentials: AmazonCredentials;
	region: "NA" | "EU" | "FE";
	timeout?: number;
	retryAttempts?: number;
}

export class ProtectedAmazonService extends ProtectedServiceBase {
	private config: AmazonServiceConfig;

	constructor(config: AmazonServiceConfig) {
		super("amazon-api-service", {
			...CircuitBreakerPresets.amazon,
			timeout: config.timeout || 20000,
			onFallback: () => ({
				success: false,
				error: "Amazon API service temporarily unavailable",
				data: null,
			}),
			shouldSkip: (error: Error) => {
				// Skip client-side errors that don't indicate service issues
				return (
					error.message.includes("InvalidParameterValue") ||
					error.message.includes("InvalidParameterCombination") ||
					error.message.includes("MissingParameter") ||
					error.message.includes("authorization") ||
					error.message.includes("authentication") ||
					error.message.includes("validation")
				);
			},
		});

		this.config = config;
	}

	/**
	 * Execute Amazon API request with protection
	 */
	protected async makeApiRequest<T>(
		operation: () => Promise<T>,
		operationName: string,
	): Promise<ApiResponse<T>> {
		try {
			const result = await this.executeProtected(operation);
			return {
				success: true,
				data: result,
				metadata: {
					operation: operationName,
					timestamp: new Date().toISOString(),
					region: this.config.region,
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				data: null,
				metadata: {
					operation: operationName,
					timestamp: new Date().toISOString(),
					region: this.config.region,
				},
			};
		}
	}

	/**
	 * Get products with protection
	 */
	async getProducts(params: {
		keywords?: string;
		asin?: string;
		marketplace: string;
		includeAttributes?: string[];
	}): Promise<ApiResponse<any[]>> {
		return this.makeApiRequest(async () => {
			// Simulate Amazon SP-API call
			const queryParams = new URLSearchParams({
				marketplace: params.marketplace,
				...(params.keywords && { keywords: params.keywords }),
				...(params.asin && { asin: params.asin }),
				...(params.includeAttributes && {
					includeAttributes: params.includeAttributes.join(","),
				}),
			});

			// In real implementation, this would be actual Amazon API call
			const response = await fetch(
				`https://api.amazon.com/products?${queryParams}`,
				{
					headers: {
						Authorization: `Bearer ${this.config.credentials.accessToken}`,
						"Amazon-Advertising-API-ClientId": this.config.credentials.clientId,
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				throw new Error(
					`Amazon API error: ${response.status} ${response.statusText}`,
				);
			}

			return response.json();
		}, "getProducts");
	}

	/**
	 * Get campaigns with protection
	 */
	async getCampaigns(params: {
		portfolioId?: string;
		campaignType?: string;
		state?: string;
	}): Promise<ApiResponse<any[]>> {
		return this.makeApiRequest(async () => {
			const queryParams = new URLSearchParams({
				...(params.portfolioId && { portfolioId: params.portfolioId }),
				...(params.campaignType && { campaignType: params.campaignType }),
				...(params.state && { state: params.state }),
			});

			const response = await fetch(
				`https://advertising-api.amazon.com/v2/campaigns?${queryParams}`,
				{
					headers: {
						Authorization: `Bearer ${this.config.credentials.accessToken}`,
						"Amazon-Advertising-API-ClientId": this.config.credentials.clientId,
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				throw new Error(
					`Amazon Advertising API error: ${response.status} ${response.statusText}`,
				);
			}

			return response.json();
		}, "getCampaigns");
	}

	/**
	 * Create campaign with protection
	 */
	async createCampaign(campaignData: {
		name: string;
		campaignType: string;
		targetingType: string;
		state: string;
		dailyBudget: number;
		startDate: string;
		endDate?: string;
	}): Promise<ApiResponse<any>> {
		return this.makeApiRequest(async () => {
			const response = await fetch(
				"https://advertising-api.amazon.com/v2/campaigns",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.config.credentials.accessToken}`,
						"Amazon-Advertising-API-ClientId": this.config.credentials.clientId,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(campaignData),
				},
			);

			if (!response.ok) {
				throw new Error(
					`Amazon Advertising API error: ${response.status} ${response.statusText}`,
				);
			}

			return response.json();
		}, "createCampaign");
	}

	/**
	 * Get reports with protection
	 */
	async getReports(params: {
		reportType: string;
		timeUnit: string;
		startDate: string;
		endDate: string;
		metrics?: string[];
	}): Promise<ApiResponse<any>> {
		return this.makeApiRequest(async () => {
			const reportData = {
				reportType: params.reportType,
				timeUnit: params.timeUnit,
				reportDate: {
					startDate: params.startDate,
					endDate: params.endDate,
				},
				...(params.metrics && { metrics: params.metrics }),
			};

			const response = await fetch(
				"https://advertising-api.amazon.com/reporting/reports",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.config.credentials.accessToken}`,
						"Amazon-Advertising-API-ClientId": this.config.credentials.clientId,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(reportData),
				},
			);

			if (!response.ok) {
				throw new Error(
					`Amazon Reporting API error: ${response.status} ${response.statusText}`,
				);
			}

			return response.json();
		}, "getReports");
	}

	/**
	 * Test connection with protection
	 */
	async testConnection(): Promise<ApiResponse<{ status: string }>> {
		return this.makeApiRequest(async () => {
			const response = await fetch(
				"https://advertising-api.amazon.com/v2/profiles",
				{
					headers: {
						Authorization: `Bearer ${this.config.credentials.accessToken}`,
						"Amazon-Advertising-API-ClientId": this.config.credentials.clientId,
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				throw new Error(
					`Amazon API connection failed: ${response.status} ${response.statusText}`,
				);
			}

			const profiles = await response.json();
			return {
				status: "connected",
				profileCount: profiles.length,
			};
		}, "testConnection");
	}

	/**
	 * Refresh access token with protection
	 */
	async refreshToken(): Promise<
		ApiResponse<{ accessToken: string; expiresIn: number }>
	> {
		return this.makeApiRequest(async () => {
			const response = await fetch("https://api.amazon.com/auth/o2/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "refresh_token",
					client_id: this.config.credentials.clientId,
					client_secret: this.config.credentials.clientSecret,
					refresh_token: this.config.credentials.refreshToken,
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Token refresh failed: ${response.status} ${response.statusText}`,
				);
			}

			const tokenData = await response.json();

			// Update credentials
			this.config.credentials.accessToken = tokenData.access_token;

			return {
				accessToken: tokenData.access_token,
				expiresIn: tokenData.expires_in,
			};
		}, "refreshToken");
	}

	/**
	 * Get service health including circuit breaker status
	 */
	getHealthStatus() {
		const stats = this.getStats();
		return {
			healthy: this.isHealthy(),
			circuitBreakerState: stats.state,
			totalRequests: stats.totalRequests,
			successRate:
				stats.totalRequests > 0
					? (stats.totalSuccesses / stats.totalRequests) * 100
					: 100,
			averageResponseTime: stats.averageResponseTime,
			lastFailure: stats.lastFailureTime
				? new Date(stats.lastFailureTime)
				: null,
			lastSuccess: stats.lastSuccessTime
				? new Date(stats.lastSuccessTime)
				: null,
		};
	}
}

export default ProtectedAmazonService;
