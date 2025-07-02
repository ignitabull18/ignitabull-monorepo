/**
 * Amazon SP-API provider implementation
 * Following AI SDK provider patterns
 */

import { SPAPIError, SPAPIRateLimitError } from "../errors/api-errors";
import { AmazonConfigError } from "../errors/base";
import { NetworkErrorFactory } from "../errors/network-errors";
import type { SPAPIConfig } from "../types/config";
import type {
	APIResponse,
	SPAPIProvider as ISPAPIProvider,
	RequestOptions,
} from "../types/provider";
import type {
	SPAPICatalogItem,
	SPAPICatalogResponse,
	SPAPIInventoryResponse,
	SPAPIOrder,
	SPAPIOrdersResponse,
	SPAPIReport,
	SPAPIReportsResponse,
} from "../types/sp-api";
import { SPAPIAuthProvider } from "../utils/auth";
import { MemoryCache } from "../utils/cache";
import { createProviderLogger } from "../utils/logger";
import { RateLimiter } from "../utils/rate-limiter";
import { ExponentialBackoffStrategy, RetryExecutor } from "../utils/retry";
import { RequestValidator, ValidationUtils } from "../utils/validation";

/**
 * SP-API endpoint configurations
 */
const SP_API_ENDPOINTS = {
	"us-east-1": "https://sellingpartnerapi-na.amazon.com",
	"us-west-2": "https://sellingpartnerapi-na.amazon.com",
	"eu-west-1": "https://sellingpartnerapi-eu.amazon.com",
	"eu-central-1": "https://sellingpartnerapi-eu.amazon.com",
	"ap-northeast-1": "https://sellingpartnerapi-fe.amazon.com",
} as const;

/**
 * SP-API rate limit configurations by endpoint
 */
const SP_API_RATE_LIMITS = {
	"/orders/v0/orders": { requestsPerSecond: 0.5, burstLimit: 30 },
	"/catalog/v0/items": { requestsPerSecond: 2, burstLimit: 10 },
	"/fba/inventory/v1/summaries": { requestsPerSecond: 2, burstLimit: 30 },
	"/reports/2021-06-30/reports": { requestsPerSecond: 0.0222, burstLimit: 15 },
	"/listings/2021-08-01/items": { requestsPerSecond: 5, burstLimit: 10 },
} as const;

/**
 * Amazon SP-API provider implementation
 */
export class SPAPIProvider implements ISPAPIProvider {
	readonly providerId = "sp-api";
	readonly name = "Amazon Selling Partner API";
	readonly version = "2021-06-30";

	private readonly config: SPAPIConfig;
	private readonly authProvider: SPAPIAuthProvider;
	private readonly retryExecutor: RetryExecutor;
	private readonly rateLimiters = new Map<string, RateLimiter>();
	private readonly cache: MemoryCache;
	private readonly logger = createProviderLogger("sp-api");
	private initialized = false;

	constructor(config: SPAPIConfig) {
		this.config = config;
		this.authProvider = new SPAPIAuthProvider(config);

		// Initialize retry executor with SP-API specific configuration
		const retryStrategy = new ExponentialBackoffStrategy({
			maxRetries: config.retry?.maxRetries || 3,
			baseDelay: config.retry?.baseDelay || 1000,
			maxDelay: config.retry?.maxDelay || 30000,
			backoffMultiplier: config.retry?.backoffMultiplier || 2,
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		});

		this.retryExecutor = new RetryExecutor(retryStrategy, config.retry!);

		// Initialize cache
		this.cache = new MemoryCache({
			enabled: true,
			ttl: config.cache?.ttl || 300,
			maxSize: config.cache?.maxSize || 1000,
			keyPrefix: "amazon_sp_api",
		});

		this.logger.info("SP-API provider initialized", {
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
				throw new AmazonConfigError("Invalid SP-API credentials");
			}

			// Initialize rate limiters for known endpoints
			this.initializeRateLimiters();

			this.initialized = true;
			this.logger.info("SP-API provider initialized successfully");
		} catch (error) {
			this.logger.error("Failed to initialize SP-API provider", error as Error);
			throw error;
		}
	}

	async healthCheck(): Promise<{
		status: "healthy" | "unhealthy";
		message?: string;
	}> {
		try {
			// Test with a simple request that requires minimal permissions
			await this.request(
				"/orders/v0/marketplaces",
				"GET",
				{},
				{
					skipCache: true,
					timeout: 5000,
				},
			);

			return { status: "healthy" };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			return { status: "unhealthy", message };
		}
	}

	async getRateLimit(): Promise<{ remaining: number; resetTime: Date }> {
		// Get rate limit info for the most commonly used endpoint
		const limiter = this.rateLimiters.get("/orders/v0/orders");
		if (!limiter) {
			return { remaining: 100, resetTime: new Date() };
		}

		const status = limiter.getStatus();
		return {
			remaining: status.tokensRemaining,
			resetTime: new Date(Date.now() + status.estimatedWaitTime),
		};
	}

	// Orders API methods
	async getOrders(params: {
		marketplaceIds: string[];
		createdAfter?: Date;
		createdBefore?: Date;
		lastUpdatedAfter?: Date;
		lastUpdatedBefore?: Date;
		orderStatuses?: string[];
		fulfillmentChannels?: string[];
		paymentMethods?: string[];
		buyerEmail?: string;
		sellerOrderId?: string;
		maxResultsPerPage?: number;
		nextToken?: string;
	}): Promise<SPAPIOrdersResponse> {
		// Validate parameters
		const validation = RequestValidator.validateSPAPIRequest(
			"/orders/v0/orders",
			{
				MarketplaceIds: params.marketplaceIds,
				CreatedAfter: params.createdAfter,
				CreatedBefore: params.createdBefore,
			},
		);
		ValidationUtils.throwIfInvalid(validation, "getOrders parameters");
		ValidationUtils.logWarnings(validation, this.logger);

		const queryParams = new URLSearchParams();
		queryParams.append("MarketplaceIds", params.marketplaceIds.join(","));

		if (params.createdAfter) {
			queryParams.append("CreatedAfter", params.createdAfter.toISOString());
		}
		if (params.createdBefore) {
			queryParams.append("CreatedBefore", params.createdBefore.toISOString());
		}
		if (params.lastUpdatedAfter) {
			queryParams.append(
				"LastUpdatedAfter",
				params.lastUpdatedAfter.toISOString(),
			);
		}
		if (params.lastUpdatedBefore) {
			queryParams.append(
				"LastUpdatedBefore",
				params.lastUpdatedBefore.toISOString(),
			);
		}
		if (params.orderStatuses?.length) {
			queryParams.append("OrderStatuses", params.orderStatuses.join(","));
		}
		if (params.fulfillmentChannels?.length) {
			queryParams.append(
				"FulfillmentChannels",
				params.fulfillmentChannels.join(","),
			);
		}
		if (params.paymentMethods?.length) {
			queryParams.append("PaymentMethods", params.paymentMethods.join(","));
		}
		if (params.buyerEmail) {
			queryParams.append("BuyerEmail", params.buyerEmail);
		}
		if (params.sellerOrderId) {
			queryParams.append("SellerOrderId", params.sellerOrderId);
		}
		if (params.maxResultsPerPage) {
			queryParams.append(
				"MaxResultsPerPage",
				params.maxResultsPerPage.toString(),
			);
		}
		if (params.nextToken) {
			queryParams.append("NextToken", params.nextToken);
		}

		const response = await this.request<SPAPIOrdersResponse>(
			`/orders/v0/orders?${queryParams.toString()}`,
			"GET",
		);

		return response.data;
	}

	async getOrder(orderId: string): Promise<SPAPIOrder> {
		if (!orderId) {
			throw new SPAPIError("Order ID is required", {
				code: "INVALID_ORDER_ID",
				retryable: false,
			});
		}

		const response = await this.request<{ payload: SPAPIOrder }>(
			`/orders/v0/orders/${orderId}`,
			"GET",
		);

		return response.data.payload;
	}

	// Catalog API methods
	async getCatalogItem(
		asin: string,
		marketplaceIds: string[],
		params?: {
			includedData?: string[];
			locale?: string;
		},
	): Promise<SPAPICatalogItem> {
		const validation = RequestValidator.validateSPAPIRequest(
			"/catalog/v0/items",
			{
				asin,
				MarketplaceIds: marketplaceIds,
			},
		);
		ValidationUtils.throwIfInvalid(validation, "getCatalogItem parameters");

		const queryParams = new URLSearchParams();
		queryParams.append("MarketplaceIds", marketplaceIds.join(","));

		if (params?.includedData?.length) {
			queryParams.append("includedData", params.includedData.join(","));
		}
		if (params?.locale) {
			queryParams.append("locale", params.locale);
		}

		const response = await this.request<{ payload: SPAPICatalogItem }>(
			`/catalog/2022-04-01/items/${asin}?${queryParams.toString()}`,
			"GET",
		);

		return response.data.payload;
	}

	async searchCatalogItems(params: {
		keywords?: string;
		marketplaceIds: string[];
		includedData?: string[];
		brandNames?: string[];
		classificationIds?: string[];
		pageSize?: number;
		pageToken?: string;
		keywordsLocale?: string;
		locale?: string;
	}): Promise<SPAPICatalogResponse> {
		const queryParams = new URLSearchParams();
		queryParams.append("marketplaceIds", params.marketplaceIds.join(","));

		if (params.keywords) {
			queryParams.append("keywords", params.keywords);
		}
		if (params.includedData?.length) {
			queryParams.append("includedData", params.includedData.join(","));
		}
		if (params.brandNames?.length) {
			queryParams.append("brandNames", params.brandNames.join(","));
		}
		if (params.classificationIds?.length) {
			queryParams.append(
				"classificationIds",
				params.classificationIds.join(","),
			);
		}
		if (params.pageSize) {
			queryParams.append("pageSize", params.pageSize.toString());
		}
		if (params.pageToken) {
			queryParams.append("pageToken", params.pageToken);
		}
		if (params.keywordsLocale) {
			queryParams.append("keywordsLocale", params.keywordsLocale);
		}
		if (params.locale) {
			queryParams.append("locale", params.locale);
		}

		const response = await this.request<SPAPICatalogResponse>(
			`/catalog/2022-04-01/items?${queryParams.toString()}`,
			"GET",
		);

		return response.data;
	}

	// Inventory API methods
	async getInventorySummaries(params: {
		granularityType: "Marketplace";
		granularityId: string;
		marketplaceIds: string[];
		details?: boolean;
		startDateTime?: Date;
		sellerSkus?: string[];
		nextToken?: string;
		maxResultsPerPage?: number;
	}): Promise<SPAPIInventoryResponse> {
		const queryParams = new URLSearchParams();
		queryParams.append("granularityType", params.granularityType);
		queryParams.append("granularityId", params.granularityId);
		queryParams.append("marketplaceIds", params.marketplaceIds.join(","));

		if (params.details !== undefined) {
			queryParams.append("details", params.details.toString());
		}
		if (params.startDateTime) {
			queryParams.append("startDateTime", params.startDateTime.toISOString());
		}
		if (params.sellerSkus?.length) {
			queryParams.append("sellerSkus", params.sellerSkus.join(","));
		}
		if (params.nextToken) {
			queryParams.append("nextToken", params.nextToken);
		}
		if (params.maxResultsPerPage) {
			queryParams.append(
				"maxResultsPerPage",
				params.maxResultsPerPage.toString(),
			);
		}

		const response = await this.request<SPAPIInventoryResponse>(
			`/fba/inventory/v1/summaries?${queryParams.toString()}`,
			"GET",
		);

		return response.data;
	}

	// Reports API methods
	async getReports(params?: {
		reportTypes?: string[];
		processingStatuses?: string[];
		marketplaceIds?: string[];
		pageSize?: number;
		createdSince?: Date;
		createdUntil?: Date;
		nextToken?: string;
	}): Promise<SPAPIReportsResponse> {
		const queryParams = new URLSearchParams();

		if (params?.reportTypes?.length) {
			queryParams.append("reportTypes", params.reportTypes.join(","));
		}
		if (params?.processingStatuses?.length) {
			queryParams.append(
				"processingStatuses",
				params.processingStatuses.join(","),
			);
		}
		if (params?.marketplaceIds?.length) {
			queryParams.append("marketplaceIds", params.marketplaceIds.join(","));
		}
		if (params?.pageSize) {
			queryParams.append("pageSize", params.pageSize.toString());
		}
		if (params?.createdSince) {
			queryParams.append("createdSince", params.createdSince.toISOString());
		}
		if (params?.createdUntil) {
			queryParams.append("createdUntil", params.createdUntil.toISOString());
		}
		if (params?.nextToken) {
			queryParams.append("nextToken", params.nextToken);
		}

		const response = await this.request<SPAPIReportsResponse>(
			`/reports/2021-06-30/reports?${queryParams.toString()}`,
			"GET",
		);

		return response.data;
	}

	async createReport(params: {
		reportType: string;
		marketplaceIds: string[];
		dataStartTime?: Date;
		dataEndTime?: Date;
		reportOptions?: Record<string, string>;
	}): Promise<{ reportId: string }> {
		const body = {
			reportType: params.reportType,
			marketplaceIds: params.marketplaceIds,
			...(params.dataStartTime && {
				dataStartTime: params.dataStartTime.toISOString(),
			}),
			...(params.dataEndTime && {
				dataEndTime: params.dataEndTime.toISOString(),
			}),
			...(params.reportOptions && { reportOptions: params.reportOptions }),
		};

		const response = await this.request<{ reportId: string }>(
			"/reports/2021-06-30/reports",
			"POST",
			body,
		);

		return response.data;
	}

	async getReport(reportId: string): Promise<SPAPIReport> {
		if (!reportId) {
			throw new SPAPIError("Report ID is required", {
				code: "INVALID_REPORT_ID",
				retryable: false,
			});
		}

		const response = await this.request<SPAPIReport>(
			`/reports/2021-06-30/reports/${reportId}`,
			"GET",
		);

		return response.data;
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
					this.logger.logCache("hit", cacheKey, "sp-api");
					return cached as APIResponse<T>;
				}
				this.logger.logCache("miss", cacheKey, "sp-api");
			}

			// Execute request with retry
			const response = await this.retryExecutor.execute(
				() => this.executeRequest<T>(path, method, body, options, requestId),
				{ operationName: `SP-API ${method} ${path}`, requestId },
			);

			// Cache successful GET responses
			if (method === "GET" && !options.skipCache && response.statusCode < 400) {
				const cacheKey = this.generateCacheKey(path, body);
				const ttl = this.getCacheTTL(path);
				await this.cache.set(cacheKey, response, ttl);
				this.logger.logCache("set", cacheKey, "sp-api");
			}

			const duration = Date.now() - startTime;
			this.logger.logResponse(
				"sp-api",
				path,
				response.statusCode,
				duration,
				requestId,
			);

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.logResponse("sp-api", path, 0, duration, requestId, {
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
		const baseUrl =
			SP_API_ENDPOINTS[this.config.region as keyof typeof SP_API_ENDPOINTS] ||
			SP_API_ENDPOINTS["us-east-1"];
		const url = `${baseUrl}${path}`;

		this.logger.logRequest("sp-api", path, method, requestId);

		try {
			// Get authentication headers
			const authHeaders = await this.authProvider.getAuthHeaders();

			const headers = {
				...authHeaders,
				"User-Agent": `Ignitabull SP-API Client/${this.version}`,
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
					throw new SPAPIRateLimitError(
						`Rate limit exceeded: ${response.statusText}`,
						retryAfter ? Number.parseInt(retryAfter) : undefined,
						requestId,
					);
				}

				throw new SPAPIError(`SP-API request failed: ${response.statusText}`, {
					code: `HTTP_${response.status}`,
					statusCode: response.status,
					requestId,
					retryable: response.status >= 500,
				});
			}

			return {
				data,
				statusCode: response.status,
				statusText: response.statusText,
				headers: {},
			};
		} catch (error) {
			if (error instanceof SPAPIError) {
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
			if (path.startsWith(pattern.split("?")[0])) {
				return limiter;
			}
		}
		return undefined;
	}

	private initializeRateLimiters(): void {
		for (const [endpoint, config] of Object.entries(SP_API_RATE_LIMITS)) {
			this.rateLimiters.set(
				endpoint,
				new RateLimiter({
					requestsPerSecond: config.requestsPerSecond,
					burstLimit: config.burstLimit,
					backoffMultiplier: 2,
					maxBackoffTime: 60000,
					jitter: true,
				}),
			);
		}
	}

	private generateRequestId(): string {
		return `sp-api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateCacheKey(path: string, body?: any): string {
		const pathKey = path.replace(/[^a-zA-Z0-9]/g, "_");
		const bodyHash = body
			? Buffer.from(JSON.stringify(body)).toString("base64").slice(0, 8)
			: "";
		return `sp-api:${pathKey}:${bodyHash}`;
	}

	private getCacheTTL(path: string): number {
		// Different cache TTLs based on data type
		if (path.includes("/orders/")) return 300; // 5 minutes
		if (path.includes("/catalog/")) return 3600; // 1 hour
		if (path.includes("/inventory/")) return 600; // 10 minutes
		if (path.includes("/reports/")) return 1800; // 30 minutes
		return 300; // Default 5 minutes
	}
}
