/**
 * Amazon Advertising API provider implementation
 * Following AI SDK provider patterns
 */

import {
	AmazonAPIError,
	AmazonError,
	AmazonRateLimitError,
} from "../errors/base";
import { NetworkErrorFactory } from "../errors/network-errors";
import type {
	AdvertisingAdGroup,
	AdvertisingCampaign,
	AdvertisingCampaignResponse,
	AdvertisingKeyword,
	AdvertisingKeywordResponse,
	AdvertisingProductAd,
	AdvertisingProfile,
	AdvertisingReport,
	CreateAdGroupRequest,
	CreateCampaignRequest,
	CreateKeywordRequest,
	CreateProductAdRequest,
	ReportRequest,
	UpdateCampaignRequest,
} from "../types/advertising";
import type {
	AdvertisingConfig,
	APIResponse,
	BaseAmazonProvider,
	AdvertisingProvider as IAdvertisingProvider,
	RequestOptions,
} from "../types/provider";
import { AdvertisingAuthProvider } from "../utils/auth";
import { MemoryCache } from "../utils/cache";
import { createProviderLogger } from "../utils/logger";
import { RateLimiter } from "../utils/rate-limiter";
import { ExponentialBackoffStrategy, RetryExecutor } from "../utils/retry";

/**
 * Advertising API endpoint configurations
 */
const ADVERTISING_API_ENDPOINTS = {
	"us-east-1": "https://advertising-api.amazon.com",
	"us-west-2": "https://advertising-api.amazon.com",
	"eu-west-1": "https://advertising-api-eu.amazon.com",
	"eu-central-1": "https://advertising-api-eu.amazon.com",
	"ap-northeast-1": "https://advertising-api-fe.amazon.com",
} as const;

/**
 * Advertising API rate limit configurations by endpoint type
 */
const ADVERTISING_API_RATE_LIMITS = {
	"/campaigns": { requestsPerSecond: 2, burstLimit: 100 },
	"/adGroups": { requestsPerSecond: 2, burstLimit: 100 },
	"/keywords": { requestsPerSecond: 2, burstLimit: 100 },
	"/productAds": { requestsPerSecond: 2, burstLimit: 100 },
	"/reports": { requestsPerSecond: 0.5, burstLimit: 50 },
	"/profiles": { requestsPerSecond: 1, burstLimit: 10 },
} as const;

/**
 * Amazon Advertising API provider implementation
 */
export class AdvertisingProvider
	implements IAdvertisingProvider, BaseAmazonProvider
{
	readonly providerId = "advertising";
	readonly name = "Amazon Advertising API";
	readonly version = "3.0";

	private readonly config: AdvertisingConfig;
	private readonly authProvider: AdvertisingAuthProvider;
	private readonly retryExecutor: RetryExecutor;
	private readonly rateLimiters = new Map<string, RateLimiter>();
	private readonly cache: MemoryCache;
	private readonly logger = createProviderLogger("advertising");
	private initialized = false;

	constructor(config: AdvertisingConfig) {
		this.config = config;
		this.authProvider = new AdvertisingAuthProvider(config);

		// Initialize retry executor with Advertising API specific configuration
		const retryStrategy = new ExponentialBackoffStrategy({
			maxRetries: config.retry?.maxRetries || 5,
			baseDelay: config.retry?.baseDelay || 500,
			maxDelay: config.retry?.maxDelay || 15000,
			backoffMultiplier: config.retry?.backoffMultiplier || 1.5,
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		});

		this.retryExecutor = new RetryExecutor(retryStrategy, config.retry!);

		// Initialize cache
		this.cache = new MemoryCache({
			defaultTTL: config.cache?.defaultTTL || 300,
			maxSize: config.cache?.maxSize || 1000,
		});

		this.logger.info("Advertising API provider initialized", {
			region: config.region,
			sandbox: config.sandbox,
		});
	}

	async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
			// Validate credentials
			const isValid = await this.authProvider.validateCredentials();
			if (!isValid) {
				throw new AmazonError("Invalid Advertising API credentials");
			}

			// Initialize rate limiters for known endpoints
			this.initializeRateLimiters();

			this.initialized = true;
			this.logger.info("Advertising API provider initialized successfully");
		} catch (error) {
			this.logger.error(
				"Failed to initialize Advertising API provider",
				error as Error,
			);
			throw error;
		}
	}

	async healthCheck(): Promise<{
		status: "healthy" | "unhealthy";
		message?: string;
	}> {
		try {
			// Test with a simple profiles request
			await this.getProfiles();
			return { status: "healthy" };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			return { status: "unhealthy", message };
		}
	}

	async getRateLimit(): Promise<{ remaining: number; resetTime: Date }> {
		// Get rate limit info for the most commonly used endpoint
		const limiter = this.rateLimiters.get("/campaigns");
		if (!limiter) {
			return { remaining: 100, resetTime: new Date() };
		}

		const status = limiter.getStatus();
		return {
			remaining: status.tokensRemaining,
			resetTime: new Date(Date.now() + status.estimatedWaitTime),
		};
	}

	// Profile management
	async getProfiles(): Promise<AdvertisingProfile[]> {
		const response = await this.request<AdvertisingProfile[]>(
			"/v2/profiles",
			"GET",
		);
		return response.data;
	}

	// Campaign management
	async getCampaigns(params?: {
		stateFilter?: "enabled" | "paused" | "archived";
		campaignIdFilter?: string[];
		adGroupIdFilter?: string[];
		name?: string;
		campaignType?: "sponsoredProducts" | "sponsoredBrands" | "sponsoredDisplay";
		count?: number;
		startIndex?: number;
	}): Promise<AdvertisingCampaignResponse> {
		const queryParams = new URLSearchParams();

		if (params?.stateFilter) {
			queryParams.append("stateFilter", params.stateFilter);
		}
		if (params?.campaignIdFilter?.length) {
			queryParams.append("campaignIdFilter", params.campaignIdFilter.join(","));
		}
		if (params?.adGroupIdFilter?.length) {
			queryParams.append("adGroupIdFilter", params.adGroupIdFilter.join(","));
		}
		if (params?.name) {
			queryParams.append("name", params.name);
		}
		if (params?.campaignType) {
			queryParams.append("campaignType", params.campaignType);
		}
		if (params?.count) {
			queryParams.append("count", params.count.toString());
		}
		if (params?.startIndex) {
			queryParams.append("startIndex", params.startIndex.toString());
		}

		const path = `/v2/sp/campaigns${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await this.request<AdvertisingCampaign[]>(path, "GET");

		return {
			campaigns: response.data,
			totalCount: response.data.length, // Note: API doesn't provide total count directly
		};
	}

	async getCampaign(campaignId: string): Promise<AdvertisingCampaign> {
		if (!campaignId) {
			throw new AmazonError("Campaign ID is required");
		}

		const response = await this.request<AdvertisingCampaign>(
			`/v2/sp/campaigns/${campaignId}`,
			"GET",
		);

		return response.data;
	}

	async createCampaign(
		campaign: CreateCampaignRequest,
	): Promise<AdvertisingCampaign> {
		// Validate campaign data
		if (!campaign.name || !campaign.campaignType || !campaign.targetingType) {
			throw new AmazonError(
				"Campaign name, type, and targeting type are required",
			);
		}

		const response = await this.request<AdvertisingCampaign>(
			"/v2/sp/campaigns",
			"POST",
			campaign,
		);

		return response.data;
	}

	async updateCampaign(
		campaignId: string,
		updates: UpdateCampaignRequest,
	): Promise<AdvertisingCampaign> {
		if (!campaignId) {
			throw new AmazonError("Campaign ID is required");
		}

		const response = await this.request<AdvertisingCampaign>(
			`/v2/sp/campaigns/${campaignId}`,
			"PUT",
			updates,
		);

		return response.data;
	}

	async archiveCampaign(campaignId: string): Promise<{ success: boolean }> {
		if (!campaignId) {
			throw new AmazonError("Campaign ID is required");
		}

		await this.updateCampaign(campaignId, { state: "archived" });
		return { success: true };
	}

	// Ad Group management
	async getAdGroups(params?: {
		campaignIdFilter?: string[];
		adGroupIdFilter?: string[];
		stateFilter?: "enabled" | "paused" | "archived";
		name?: string;
		count?: number;
		startIndex?: number;
	}): Promise<AdvertisingAdGroup[]> {
		const queryParams = new URLSearchParams();

		if (params?.campaignIdFilter?.length) {
			queryParams.append("campaignIdFilter", params.campaignIdFilter.join(","));
		}
		if (params?.adGroupIdFilter?.length) {
			queryParams.append("adGroupIdFilter", params.adGroupIdFilter.join(","));
		}
		if (params?.stateFilter) {
			queryParams.append("stateFilter", params.stateFilter);
		}
		if (params?.name) {
			queryParams.append("name", params.name);
		}
		if (params?.count) {
			queryParams.append("count", params.count.toString());
		}
		if (params?.startIndex) {
			queryParams.append("startIndex", params.startIndex.toString());
		}

		const path = `/v2/sp/adGroups${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await this.request<AdvertisingAdGroup[]>(path, "GET");

		return response.data;
	}

	async createAdGroup(
		adGroup: CreateAdGroupRequest,
	): Promise<AdvertisingAdGroup> {
		if (!adGroup.name || !adGroup.campaignId || !adGroup.defaultBid) {
			throw new AmazonError(
				"Ad group name, campaign ID, and default bid are required",
			);
		}

		const response = await this.request<AdvertisingAdGroup>(
			"/v2/sp/adGroups",
			"POST",
			adGroup,
		);

		return response.data;
	}

	// Keyword management
	async getKeywords(params?: {
		campaignIdFilter?: string[];
		adGroupIdFilter?: string[];
		keywordIdFilter?: string[];
		stateFilter?: "enabled" | "paused" | "archived";
		matchTypeFilter?: "exact" | "phrase" | "broad";
		keywordText?: string;
		count?: number;
		startIndex?: number;
	}): Promise<AdvertisingKeywordResponse> {
		const queryParams = new URLSearchParams();

		if (params?.campaignIdFilter?.length) {
			queryParams.append("campaignIdFilter", params.campaignIdFilter.join(","));
		}
		if (params?.adGroupIdFilter?.length) {
			queryParams.append("adGroupIdFilter", params.adGroupIdFilter.join(","));
		}
		if (params?.keywordIdFilter?.length) {
			queryParams.append("keywordIdFilter", params.keywordIdFilter.join(","));
		}
		if (params?.stateFilter) {
			queryParams.append("stateFilter", params.stateFilter);
		}
		if (params?.matchTypeFilter) {
			queryParams.append("matchTypeFilter", params.matchTypeFilter);
		}
		if (params?.keywordText) {
			queryParams.append("keywordText", params.keywordText);
		}
		if (params?.count) {
			queryParams.append("count", params.count.toString());
		}
		if (params?.startIndex) {
			queryParams.append("startIndex", params.startIndex.toString());
		}

		const path = `/v2/sp/keywords${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await this.request<AdvertisingKeyword[]>(path, "GET");

		return {
			keywords: response.data,
			totalCount: response.data.length,
		};
	}

	async createKeywords(
		keywords: CreateKeywordRequest[],
	): Promise<AdvertisingKeyword[]> {
		if (!keywords.length) {
			throw new AmazonError("At least one keyword is required");
		}

		// Validate keywords
		for (const keyword of keywords) {
			if (!keyword.keywordText || !keyword.campaignId || !keyword.adGroupId) {
				throw new AmazonError(
					"Keyword text, campaign ID, and ad group ID are required",
				);
			}
		}

		const response = await this.request<AdvertisingKeyword[]>(
			"/v2/sp/keywords",
			"POST",
			keywords,
		);

		return response.data;
	}

	async updateKeywords(
		keywords: Array<{
			keywordId: string;
			state?: "enabled" | "paused" | "archived";
			bid?: number;
		}>,
	): Promise<AdvertisingKeyword[]> {
		if (!keywords.length) {
			throw new AmazonError("At least one keyword update is required");
		}

		const response = await this.request<AdvertisingKeyword[]>(
			"/v2/sp/keywords",
			"PUT",
			keywords,
		);

		return response.data;
	}

	// Product Ads management
	async getProductAds(params?: {
		campaignIdFilter?: string[];
		adGroupIdFilter?: string[];
		adIdFilter?: string[];
		stateFilter?: "enabled" | "paused" | "archived";
		asin?: string;
		sku?: string;
		count?: number;
		startIndex?: number;
	}): Promise<AdvertisingProductAd[]> {
		const queryParams = new URLSearchParams();

		if (params?.campaignIdFilter?.length) {
			queryParams.append("campaignIdFilter", params.campaignIdFilter.join(","));
		}
		if (params?.adGroupIdFilter?.length) {
			queryParams.append("adGroupIdFilter", params.adGroupIdFilter.join(","));
		}
		if (params?.adIdFilter?.length) {
			queryParams.append("adIdFilter", params.adIdFilter.join(","));
		}
		if (params?.stateFilter) {
			queryParams.append("stateFilter", params.stateFilter);
		}
		if (params?.asin) {
			queryParams.append("asin", params.asin);
		}
		if (params?.sku) {
			queryParams.append("sku", params.sku);
		}
		if (params?.count) {
			queryParams.append("count", params.count.toString());
		}
		if (params?.startIndex) {
			queryParams.append("startIndex", params.startIndex.toString());
		}

		const path = `/v2/sp/productAds${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await this.request<AdvertisingProductAd[]>(path, "GET");

		return response.data;
	}

	async createProductAds(
		productAds: CreateProductAdRequest[],
	): Promise<AdvertisingProductAd[]> {
		if (!productAds.length) {
			throw new AmazonError("At least one product ad is required");
		}

		// Validate product ads
		for (const ad of productAds) {
			if (!ad.campaignId || !ad.adGroupId || (!ad.asin && !ad.sku)) {
				throw new AmazonError(
					"Campaign ID, ad group ID, and either ASIN or SKU are required",
				);
			}
		}

		const response = await this.request<AdvertisingProductAd[]>(
			"/v2/sp/productAds",
			"POST",
			productAds,
		);

		return response.data;
	}

	// Reporting
	async requestReport(
		reportRequest: ReportRequest,
	): Promise<{ reportId: string }> {
		// Validate report request
		if (!reportRequest.recordType || !reportRequest.reportDate) {
			throw new AmazonError("Record type and report date are required");
		}

		const response = await this.request<{ reportId: string }>(
			"/v2/reports",
			"POST",
			reportRequest,
		);

		return response.data;
	}

	async getReport(reportId: string): Promise<AdvertisingReport> {
		if (!reportId) {
			throw new AmazonError("Report ID is required");
		}

		const response = await this.request<AdvertisingReport>(
			`/v2/reports/${reportId}`,
			"GET",
		);

		return response.data;
	}

	async downloadReport(reportId: string): Promise<string> {
		const report = await this.getReport(reportId);

		if (report.status !== "SUCCESS" || !report.location) {
			throw new AmazonError(
				"Report is not ready for download or failed to generate",
			);
		}

		// Download the report data
		const response = await fetch(report.location);
		if (!response.ok) {
			throw new AmazonError("Failed to download report data");
		}

		return response.text();
	}

	// Performance metrics helpers
	async getCampaignPerformance(
		_campaignId: string,
		dateRange: {
			startDate: Date;
			endDate: Date;
		},
	): Promise<any> {
		const reportRequest: ReportRequest = {
			recordType: "campaigns",
			reportDate: dateRange.startDate.toISOString().split("T")[0],
			metrics:
				"campaignName,campaignId,impressions,clicks,cost,sales,orders,acos,roas",
		};

		const { reportId } = await this.requestReport(reportRequest);

		// Note: In a real implementation, you would poll for report completion
		// This is a simplified version
		return this.getReport(reportId);
	}

	// Core request method
	private async request<T>(
		path: string,
		method: string,
		body?: any,
		options: RequestOptions = {},
	): Promise<APIResponse<T>> {
		await this.ensureInitialized();

		const requestId = this.generateRequestId();
		const startTime = Date.now();

		try {
			// Apply rate limiting
			await this.applyRateLimit(path);

			// Check cache first (for GET requests)
			if (method === "GET" && !options.skipCache) {
				const cacheKey = this.generateCacheKey(path, body);
				const cached = await this.cache.get(cacheKey);
				if (cached) {
					this.logger.logCache("hit", cacheKey, "advertising");
					return cached as APIResponse<T>;
				}
				this.logger.logCache("miss", cacheKey, "advertising");
			}

			// Execute request with retry
			const response = await this.retryExecutor.execute(
				() => this.executeRequest<T>(path, method, body, options, requestId),
				{ operationName: `Advertising ${method} ${path}`, requestId },
			);

			// Cache successful GET responses
			if (method === "GET" && !options.skipCache && response.statusCode < 400) {
				const cacheKey = this.generateCacheKey(path, body);
				const ttl = this.getCacheTTL(path);
				await this.cache.set(cacheKey, response, ttl);
				this.logger.logCache("set", cacheKey, "advertising");
			}

			const duration = Date.now() - startTime;
			this.logger.logResponse(
				"advertising",
				path,
				response.statusCode,
				duration,
				requestId,
			);

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.logResponse("advertising", path, 0, duration, requestId, {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	private async executeRequest<T>(
		path: string,
		method: string,
		body?: any,
		options: RequestOptions = {},
		requestId?: string,
	): Promise<APIResponse<T>> {
		const baseUrl = ADVERTISING_API_ENDPOINTS[this.config.region];
		const url = `${baseUrl}${path}`;

		this.logger.logRequest("advertising", path, method, requestId);

		try {
			// Get authentication headers
			const authHeaders = await this.authProvider.getAuthHeaders();

			const headers = {
				...authHeaders,
				"User-Agent": `Ignitabull Advertising API Client/${this.version}`,
				...(body && { "Content-Type": "application/json" }),
				...options.headers,
			};

			const fetchOptions: RequestInit = {
				method,
				headers,
				signal: options.timeout
					? AbortSignal.timeout(options.timeout)
					: undefined,
				...(body && { body: JSON.stringify(body) }),
			};

			const response = await fetch(url, fetchOptions);

			// Parse response
			let data: T;
			const responseText = await response.text();

			try {
				data = responseText ? JSON.parse(responseText) : null;
			} catch {
				data = responseText as unknown as T;
			}

			// Handle errors
			if (!response.ok) {
				if (response.status === 429) {
					const retryAfter = response.headers.get("retry-after");
					throw new AmazonRateLimitError(
						url,
						response.status,
						response.statusText,
						retryAfter ? Number.parseInt(retryAfter) : undefined,
					);
				}

				throw new AmazonAPIError(
					`Advertising API request failed: ${response.statusText}`,
					response.status,
					responseText,
					{ provider: "advertising", endpoint: path },
				);
			}

			return {
				data,
				statusCode: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
			};
		} catch (error) {
			if (error instanceof AmazonError) {
				throw error;
			}

			// Convert network errors
			throw NetworkErrorFactory.fromError(error, url, method);
		}
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.initialized) {
			await this.initialize();
		}
	}

	private async applyRateLimit(path: string): Promise<void> {
		const limiter = this.getRateLimiter(path);
		if (limiter) {
			await limiter.waitForToken();
		}
	}

	private getRateLimiter(path: string): RateLimiter | undefined {
		// Find the most specific rate limiter for the path
		for (const [pattern, limiter] of this.rateLimiters) {
			if (path.includes(pattern)) {
				return limiter;
			}
		}
		return undefined;
	}

	private initializeRateLimiters(): void {
		for (const [endpoint, config] of Object.entries(
			ADVERTISING_API_RATE_LIMITS,
		)) {
			this.rateLimiters.set(
				endpoint,
				new RateLimiter({
					requestsPerSecond: config.requestsPerSecond,
					burstLimit: config.burstLimit,
					jitter: true,
				}),
			);
		}
	}

	private generateRequestId(): string {
		return `advertising-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateCacheKey(path: string, body?: any): string {
		const pathKey = path.replace(/[^a-zA-Z0-9]/g, "_");
		const bodyHash = body
			? Buffer.from(JSON.stringify(body)).toString("base64").slice(0, 8)
			: "";
		return `advertising:${pathKey}:${bodyHash}`;
	}

	private getCacheTTL(path: string): number {
		// Different cache TTLs based on data type
		if (path.includes("/campaigns")) return 600; // 10 minutes
		if (path.includes("/adGroups")) return 600; // 10 minutes
		if (path.includes("/keywords")) return 300; // 5 minutes
		if (path.includes("/productAds")) return 300; // 5 minutes
		if (path.includes("/reports")) return 1800; // 30 minutes
		if (path.includes("/profiles")) return 3600; // 1 hour
		return 300; // Default 5 minutes
	}
}
