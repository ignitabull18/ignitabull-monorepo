/**
 * Amazon Associates API (Product Advertising API) provider implementation
 * Following AI SDK provider patterns
 */

import {
	AmazonAPIError,
	AmazonError,
	AmazonRateLimitError,
} from "../errors/base";
import { NetworkErrorFactory } from "../errors/network-errors";
import type {
	AssociatesBrowseNode,
	AssociatesProduct,
	AssociatesProductResponse,
	AssociatesSearchResponse,
	AssociatesVariationsResponse,
	GetBrowseNodesRequest,
	GetItemsRequest,
	GetVariationsRequest,
	SearchItemsRequest,
} from "../types/associates";
import type {
	APIResponse,
	AssociatesConfig,
	BaseAmazonProvider,
	AssociatesProvider as IAssociatesProvider,
	RequestOptions,
} from "../types/provider";
import { AssociatesAuthProvider } from "../utils/auth";
import { MemoryCache } from "../utils/cache";
import { createProviderLogger } from "../utils/logger";
import { RateLimiter } from "../utils/rate-limiter";
import { ExponentialBackoffStrategy, RetryExecutor } from "../utils/retry";
import { ValidationUtils } from "../utils/validation";

/**
 * Associates API endpoint configurations
 */
const ASSOCIATES_API_ENDPOINTS = {
	"us-east-1": "https://webservices.amazon.com",
	"us-west-2": "https://webservices.amazon.com",
	"eu-west-1": "https://webservices.amazon.co.uk",
	"eu-central-1": "https://webservices.amazon.de",
	"ap-northeast-1": "https://webservices.amazon.co.jp",
} as const;

/**
 * Associates API rate limit configuration (very conservative due to TPS limits)
 */
const ASSOCIATES_API_RATE_LIMITS = {
	"/paapi5/getitems": { requestsPerSecond: 1, burstLimit: 10 },
	"/paapi5/searchitems": { requestsPerSecond: 1, burstLimit: 10 },
	"/paapi5/getbrowsenodes": { requestsPerSecond: 1, burstLimit: 10 },
	"/paapi5/getvariations": { requestsPerSecond: 1, burstLimit: 10 },
} as const;

/**
 * Amazon Associates API provider implementation
 */
export class AssociatesProvider
	implements IAssociatesProvider, BaseAmazonProvider
{
	readonly providerId = "associates";
	readonly name = "Amazon Associates API (PA-API 5.0)";
	readonly version = "5.0";

	private readonly config: AssociatesConfig;
	private readonly authProvider: AssociatesAuthProvider;
	private readonly retryExecutor: RetryExecutor;
	private readonly rateLimiters = new Map<string, RateLimiter>();
	private readonly cache: MemoryCache;
	private readonly logger = createProviderLogger("associates");
	private initialized = false;

	constructor(config: AssociatesConfig) {
		this.config = config;
		this.authProvider = new AssociatesAuthProvider(config);

		// Initialize retry executor with Associates API specific configuration (very conservative)
		const retryStrategy = new ExponentialBackoffStrategy({
			maxRetries: config.retry?.maxRetries || 2,
			baseDelay: config.retry?.baseDelay || 2000,
			maxDelay: config.retry?.maxDelay || 60000,
			backoffMultiplier: config.retry?.backoffMultiplier || 3,
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		});

		this.retryExecutor = new RetryExecutor(retryStrategy, config.retry!);

		// Initialize cache with longer TTL for Associates API
		this.cache = new MemoryCache({
			defaultTTL: config.cache?.defaultTTL || 1800, // 30 minutes
			maxSize: config.cache?.maxSize || 1000,
		});

		this.logger.info("Associates API provider initialized", {
			region: config.region,
			partnerTag: config.partnerTag,
		});
	}

	async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
			// Validate credentials
			const isValid = await this.authProvider.validateCredentials();
			if (!isValid) {
				throw new AmazonError("Invalid Associates API credentials");
			}

			// Initialize rate limiters for known endpoints
			this.initializeRateLimiters();

			this.initialized = true;
			this.logger.info("Associates API provider initialized successfully");
		} catch (error) {
			this.logger.error(
				"Failed to initialize Associates API provider",
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
			// Test with a simple GetItems request using a known ASIN
			await this.getItems({
				ItemIds: ["B00ZV9RDKK"], // Kindle Paperwhite (commonly available)
				Resources: ["ItemInfo.Title"],
			});
			return { status: "healthy" };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			return { status: "unhealthy", message };
		}
	}

	async getRateLimit(): Promise<{ remaining: number; resetTime: Date }> {
		// Get rate limit info for the most commonly used endpoint
		const limiter = this.rateLimiters.get("/paapi5/getitems");
		if (!limiter) {
			return { remaining: 10, resetTime: new Date() };
		}

		const status = limiter.getStatus();
		return {
			remaining: status.tokensRemaining,
			resetTime: new Date(Date.now() + status.estimatedWaitTime),
		};
	}

	// Product retrieval methods
	async getItems(request: GetItemsRequest): Promise<AssociatesProductResponse> {
		// Validate request
		if (!request.ItemIds || request.ItemIds.length === 0) {
			throw new AmazonError("ItemIds are required");
		}

		if (request.ItemIds.length > 10) {
			throw new AmazonError("Maximum 10 items allowed per request");
		}

		// Validate ASINs
		for (const itemId of request.ItemIds) {
			const validation = ValidationUtils.createAmazonSchema();
			const result = validation.asin?.custom?.(itemId);
			if (result && !result.isValid) {
				ValidationUtils.throwIfInvalid(result, `ASIN ${itemId}`);
			}
		}

		const requestBody = {
			PartnerTag: this.config.partnerTag,
			PartnerType: this.config.partnerType || "Associates",
			Marketplace: this.getMarketplace(),
			ItemIds: request.ItemIds,
			Resources: request.Resources || this.getDefaultResources(),
			ItemIdType: request.ItemIdType || "ASIN",
			Condition: request.Condition || "New",
			CurrencyOfPreference: request.CurrencyOfPreference,
			LanguagesOfPreference: request.LanguagesOfPreference,
			Merchant: request.Merchant,
		};

		const response = await this.request<AssociatesProductResponse>(
			"/paapi5/getitems",
			"POST",
			requestBody,
		);

		return response.data;
	}

	async getItem(
		asin: string,
		resources?: string[],
	): Promise<AssociatesProduct> {
		const response = await this.getItems({
			ItemIds: [asin],
			Resources: resources,
		});

		if (
			!response.ItemsResult?.Items ||
			response.ItemsResult.Items.length === 0
		) {
			throw new AmazonError(`Item not found: ${asin}`);
		}

		return response.ItemsResult.Items[0];
	}

	// Product search methods
	async searchItems(
		request: SearchItemsRequest,
	): Promise<AssociatesSearchResponse> {
		// Validate request
		if (!request.Keywords && !request.BrowseNodeId) {
			throw new AmazonError("Either Keywords or BrowseNodeId is required");
		}

		const requestBody = {
			PartnerTag: this.config.partnerTag,
			PartnerType: this.config.partnerType || "Associates",
			Marketplace: this.getMarketplace(),
			Keywords: request.Keywords,
			BrowseNodeId: request.BrowseNodeId,
			Resources: request.Resources || this.getDefaultSearchResources(),
			SearchIndex: request.SearchIndex || "All",
			ItemCount: Math.min(request.ItemCount || 10, 10), // Max 10 items
			ItemPage: request.ItemPage || 1,
			SortBy: request.SortBy,
			Brand: request.Brand,
			Condition: request.Condition || "New",
			DeliveryFlags: request.DeliveryFlags,
			MaxPrice: request.MaxPrice,
			MinPrice: request.MinPrice,
			MinReviewsRating: request.MinReviewsRating,
			MinSavingPercent: request.MinSavingPercent,
			OfferCount: request.OfferCount,
			CurrencyOfPreference: request.CurrencyOfPreference,
			LanguagesOfPreference: request.LanguagesOfPreference,
			Merchant: request.Merchant,
			Title: request.Title,
			Author: request.Author,
			Artist: request.Artist,
		};

		const response = await this.request<AssociatesSearchResponse>(
			"/paapi5/searchitems",
			"POST",
			requestBody,
		);

		return response.data;
	}

	// Browse node methods
	async getBrowseNodes(
		request: GetBrowseNodesRequest,
	): Promise<AssociatesBrowseNode[]> {
		if (!request.BrowseNodeIds || request.BrowseNodeIds.length === 0) {
			throw new AmazonError("BrowseNodeIds are required");
		}

		if (request.BrowseNodeIds.length > 10) {
			throw new AmazonError("Maximum 10 browse nodes allowed per request");
		}

		const requestBody = {
			PartnerTag: this.config.partnerTag,
			PartnerType: this.config.partnerType || "Associates",
			Marketplace: this.getMarketplace(),
			BrowseNodeIds: request.BrowseNodeIds,
			Resources: request.Resources || [
				"BrowseNodes.Ancestor",
				"BrowseNodes.Children",
			],
			LanguagesOfPreference: request.LanguagesOfPreference,
		};

		const response = await this.request<{
			BrowseNodesResult: { BrowseNodes: AssociatesBrowseNode[] };
		}>("/paapi5/getbrowsenodes", "POST", requestBody);

		return response.data.BrowseNodesResult?.BrowseNodes || [];
	}

	async getBrowseNode(browseNodeId: string): Promise<AssociatesBrowseNode> {
		const browseNodes = await this.getBrowseNodes({
			BrowseNodeIds: [browseNodeId],
		});

		if (browseNodes.length === 0) {
			throw new AmazonError(`Browse node not found: ${browseNodeId}`);
		}

		return browseNodes[0];
	}

	// Variations methods
	async getVariations(
		request: GetVariationsRequest,
	): Promise<AssociatesVariationsResponse> {
		if (!request.ASIN) {
			throw new AmazonError("ASIN is required for variations");
		}

		const requestBody = {
			PartnerTag: this.config.partnerTag,
			PartnerType: this.config.partnerType || "Associates",
			Marketplace: this.getMarketplace(),
			ASIN: request.ASIN,
			Resources: request.Resources || this.getDefaultVariationResources(),
			VariationCount: Math.min(request.VariationCount || 10, 10), // Max 10
			VariationPage: request.VariationPage || 1,
			CurrencyOfPreference: request.CurrencyOfPreference,
			LanguagesOfPreference: request.LanguagesOfPreference,
			Merchant: request.Merchant,
		};

		const response = await this.request<AssociatesVariationsResponse>(
			"/paapi5/getvariations",
			"POST",
			requestBody,
		);

		return response.data;
	}

	// Convenience methods
	async searchProductsByKeywords(
		keywords: string,
		options: {
			searchIndex?: string;
			itemCount?: number;
			sortBy?: string;
			minPrice?: number;
			maxPrice?: number;
		} = {},
	): Promise<AssociatesProduct[]> {
		const response = await this.searchItems({
			Keywords: keywords,
			SearchIndex: options.searchIndex,
			ItemCount: options.itemCount,
			SortBy: options.sortBy,
			MinPrice: options.minPrice,
			MaxPrice: options.maxPrice,
		});

		return response.SearchResult?.Items || [];
	}

	async searchProductsByCategory(
		browseNodeId: string,
		options: {
			itemCount?: number;
			sortBy?: string;
		} = {},
	): Promise<AssociatesProduct[]> {
		const response = await this.searchItems({
			BrowseNodeId: browseNodeId,
			ItemCount: options.itemCount,
			SortBy: options.sortBy,
		});

		return response.SearchResult?.Items || [];
	}

	// Generate affiliate links (Note: PA-API 5.0 doesn't provide direct link generation)
	generateAffiliateLink(asin: string, customId?: string): string {
		const baseUrl = this.getAffiliateBaseUrl();
		const tag = this.config.partnerTag;

		let url = `${baseUrl}/dp/${asin}?tag=${tag}`;

		if (customId) {
			url += `&ascsubtag=${encodeURIComponent(customId)}`;
		}

		return url;
	}

	generateSearchLink(keywords: string, customId?: string): string {
		const baseUrl = this.getAffiliateBaseUrl();
		const tag = this.config.partnerTag;

		let url = `${baseUrl}/s?k=${encodeURIComponent(keywords)}&tag=${tag}`;

		if (customId) {
			url += `&ascsubtag=${encodeURIComponent(customId)}`;
		}

		return url;
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
			// Apply rate limiting (very important for Associates API)
			await this.applyRateLimit(path);

			// Check cache first (for GET-like operations, though PA-API uses POST)
			if (!options.skipCache) {
				const cacheKey = this.generateCacheKey(path, body);
				const cached = await this.cache.get(cacheKey);
				if (cached) {
					this.logger.logCache("hit", cacheKey, "associates");
					return cached as APIResponse<T>;
				}
				this.logger.logCache("miss", cacheKey, "associates");
			}

			// Execute request with retry
			const response = await this.retryExecutor.execute(
				() => this.executeRequest<T>(path, method, body, options, requestId),
				{ operationName: `Associates ${method} ${path}`, requestId },
			);

			// Cache successful responses
			if (!options.skipCache && response.statusCode < 400) {
				const cacheKey = this.generateCacheKey(path, body);
				const ttl = this.getCacheTTL(path);
				await this.cache.set(cacheKey, response, ttl);
				this.logger.logCache("set", cacheKey, "associates");
			}

			const duration = Date.now() - startTime;
			this.logger.logResponse(
				"associates",
				path,
				response.statusCode,
				duration,
				requestId,
			);

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.logResponse("associates", path, 0, duration, requestId, {
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
		const baseUrl = ASSOCIATES_API_ENDPOINTS[this.config.region];
		const url = `${baseUrl}${path}`;

		this.logger.logRequest("associates", path, method, requestId);

		try {
			// Generate AWS Signature V4 authentication headers
			const authHeaders = await this.authProvider.signRequest(
				method,
				path,
				body,
				new Date(),
			);

			const headers = {
				...authHeaders,
				"User-Agent": `Ignitabull Associates API Client/${this.version}`,
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
					throw new AmazonRateLimitError(
						url,
						response.status,
						response.statusText,
						undefined, // Associates API doesn't provide retry-after
					);
				}

				// Associates API specific error handling
				if (
					response.status === 400 &&
					typeof data === "object" &&
					data !== null
				) {
					const errorData = data as any;
					if (errorData.__type && errorData.message) {
						throw new AmazonAPIError(
							`Associates API error: ${errorData.message}`,
							response.status,
							responseText,
							{
								provider: "associates",
								endpoint: path,
								errorType: errorData.__type,
							},
						);
					}
				}

				throw new AmazonAPIError(
					`Associates API request failed: ${response.statusText}`,
					response.status,
					responseText,
					{ provider: "associates", endpoint: path },
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
		return this.rateLimiters.get(path);
	}

	private initializeRateLimiters(): void {
		for (const [endpoint, config] of Object.entries(
			ASSOCIATES_API_RATE_LIMITS,
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
		return `associates-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateCacheKey(path: string, body?: any): string {
		const pathKey = path.replace(/[^a-zA-Z0-9]/g, "_");
		const bodyHash = body
			? Buffer.from(JSON.stringify(body)).toString("base64").slice(0, 8)
			: "";
		return `associates:${pathKey}:${bodyHash}`;
	}

	private getCacheTTL(path: string): number {
		// Associates API data is relatively stable, can cache longer
		if (path.includes("/getitems")) return 3600; // 1 hour
		if (path.includes("/searchitems")) return 1800; // 30 minutes
		if (path.includes("/getbrowsenodes")) return 7200; // 2 hours
		if (path.includes("/getvariations")) return 3600; // 1 hour
		return 1800; // Default 30 minutes
	}

	private getMarketplace(): string {
		// Map regions to marketplace domains
		const marketplaces = {
			"us-east-1": "www.amazon.com",
			"us-west-2": "www.amazon.com",
			"eu-west-1": "www.amazon.co.uk",
			"eu-central-1": "www.amazon.de",
			"ap-northeast-1": "www.amazon.co.jp",
		};
		return marketplaces[this.config.region] || "www.amazon.com";
	}

	private getAffiliateBaseUrl(): string {
		const marketplaces = {
			"us-east-1": "https://www.amazon.com",
			"us-west-2": "https://www.amazon.com",
			"eu-west-1": "https://www.amazon.co.uk",
			"eu-central-1": "https://www.amazon.de",
			"ap-northeast-1": "https://www.amazon.co.jp",
		};
		return marketplaces[this.config.region] || "https://www.amazon.com";
	}

	private getDefaultResources(): string[] {
		return [
			"ItemInfo.Title",
			"ItemInfo.Features",
			"ItemInfo.ProductInfo",
			"ItemInfo.TechnicalInfo",
			"ItemInfo.ManufactureInfo",
			"Images.Primary",
			"Images.Variants",
			"Offers.Listings",
			"Offers.Summaries",
			"BrowseNodeInfo.BrowseNodes",
		];
	}

	private getDefaultSearchResources(): string[] {
		return [
			"ItemInfo.Title",
			"ItemInfo.Features",
			"Images.Primary",
			"Offers.Listings",
			"Offers.Summaries",
		];
	}

	private getDefaultVariationResources(): string[] {
		return [
			"ItemInfo.Title",
			"ItemInfo.VariationSummary",
			"Images.Primary",
			"Offers.Listings",
			"Offers.Summaries",
		];
	}
}
