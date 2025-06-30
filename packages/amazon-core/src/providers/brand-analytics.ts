/**
 * Amazon Brand Analytics API provider implementation
 * Following AI SDK provider patterns
 */

import {
	AmazonAPIError,
	AmazonError,
	AmazonRateLimitError,
} from "../errors/base";
import { NetworkErrorFactory } from "../errors/network-errors";
import type {
	BrandAnalyticsConfig,
	BrandAnalyticsReport,
	BrandAnalyticsReportsResponse,
	BrandAnalyticsReportType,
	BrandHealthScore,
	BrandMetricsResponse,
	CompetitiveIntelligenceResponse,
	DemographicsRequest,
	DemographicsResponse,
	ItemComparisonRequest,
	ItemComparisonResponse,
	MarketBasketAnalysisRequest,
	MarketBasketAnalysisResponse,
	RepeatPurchaseRequest,
	RepeatPurchaseResponse,
	SearchTermInsight,
	SearchTermsReportRequest,
	SearchTermsReportResponse,
} from "../types/brand-analytics";
import type {
	APIResponse,
	BaseAmazonProvider,
	RequestOptions,
} from "../types/provider";
import { AdvertisingAuthProvider } from "../utils/auth"; // Brand Analytics uses same auth as Advertising
import { MemoryCache } from "../utils/cache";
import { createProviderLogger } from "../utils/logger";
import { RateLimiter } from "../utils/rate-limiter";
import { ExponentialBackoffStrategy, RetryExecutor } from "../utils/retry";

/**
 * Brand Analytics API endpoint configurations
 */
const BRAND_ANALYTICS_ENDPOINTS = {
	"us-east-1": "https://advertising-api.amazon.com",
	"us-west-2": "https://advertising-api.amazon.com",
	"eu-west-1": "https://advertising-api-eu.amazon.com",
	"eu-central-1": "https://advertising-api-eu.amazon.com",
	"ap-northeast-1": "https://advertising-api-fe.amazon.com",
} as const;

/**
 * Brand Analytics API rate limit configurations
 */
const BRAND_ANALYTICS_RATE_LIMITS = {
	"/insights/brandanalytics": { requestsPerSecond: 0.5, burstLimit: 10 },
	"/insights/searchterms": { requestsPerSecond: 0.5, burstLimit: 10 },
	"/insights/marketbasket": { requestsPerSecond: 0.5, burstLimit: 10 },
	"/insights/demographics": { requestsPerSecond: 0.5, burstLimit: 10 },
	"/insights/competition": { requestsPerSecond: 0.5, burstLimit: 10 },
} as const;

/**
 * Amazon Brand Analytics provider interface
 */
export interface BrandAnalyticsProvider extends BaseAmazonProvider {
	readonly providerId: "brand-analytics";

	// Search Terms Reports
	requestSearchTermsReport(
		request: SearchTermsReportRequest,
	): Promise<{ reportId: string }>;
	getSearchTermsReport(reportId: string): Promise<SearchTermsReportResponse>;

	// Market Basket Analysis
	requestMarketBasketAnalysis(
		request: MarketBasketAnalysisRequest,
	): Promise<{ reportId: string }>;
	getMarketBasketAnalysis(
		reportId: string,
	): Promise<MarketBasketAnalysisResponse>;

	// Item Comparison
	requestItemComparison(
		request: ItemComparisonRequest,
	): Promise<{ reportId: string }>;
	getItemComparison(reportId: string): Promise<ItemComparisonResponse>;

	// Demographics
	requestDemographics(
		request: DemographicsRequest,
	): Promise<{ reportId: string }>;
	getDemographics(reportId: string): Promise<DemographicsResponse>;

	// Repeat Purchase Analysis
	requestRepeatPurchaseAnalysis(
		request: RepeatPurchaseRequest,
	): Promise<{ reportId: string }>;
	getRepeatPurchaseAnalysis(reportId: string): Promise<RepeatPurchaseResponse>;

	// Brand Metrics and Health
	getBrandMetrics(
		brandName: string,
		marketplaceId: string,
	): Promise<BrandMetricsResponse>;
	getBrandHealthScore(
		brandName: string,
		marketplaceId: string,
	): Promise<BrandHealthScore>;

	// Competitive Intelligence
	getCompetitiveIntelligence(
		asin: string,
		marketplaceId: string,
	): Promise<CompetitiveIntelligenceResponse>;

	// Report Management
	getReports(filters?: {
		reportType?: BrandAnalyticsReportType;
		status?: string;
	}): Promise<BrandAnalyticsReportsResponse>;
	getReport(reportId: string): Promise<BrandAnalyticsReport>;

	// Insights and Analytics
	getSearchTermInsights(
		brandName: string,
		marketplaceId: string,
	): Promise<SearchTermInsight[]>;
	getTopSearchTerms(
		marketplaceId: string,
		limit?: number,
	): Promise<SearchTermInsight[]>;
}

/**
 * Amazon Brand Analytics provider implementation
 */
export class BrandAnalyticsProviderImpl
	implements BrandAnalyticsProvider, BaseAmazonProvider
{
	readonly providerId = "brand-analytics";
	readonly name = "Amazon Brand Analytics API";
	readonly version = "1.0";

	private readonly config: BrandAnalyticsConfig;
	private readonly authProvider: AdvertisingAuthProvider;
	private readonly retryExecutor: RetryExecutor;
	private readonly rateLimiters = new Map<string, RateLimiter>();
	private readonly cache: MemoryCache;
	private readonly logger = createProviderLogger("brand-analytics");
	private initialized = false;

	constructor(config: BrandAnalyticsConfig) {
		this.config = config;

		// Brand Analytics uses same auth as Advertising API
		this.authProvider = new AdvertisingAuthProvider({
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			refreshToken: config.refreshToken,
			profileId: config.advertisingAccountId,
			region: config.region,
			sandbox: config.sandbox,
		});

		// Initialize retry executor with conservative settings for Brand Analytics
		const retryStrategy = new ExponentialBackoffStrategy({
			maxRetries: config.retry?.maxRetries || 3,
			baseDelay: config.retry?.baseDelay || 2000,
			maxDelay: config.retry?.maxDelay || 30000,
			backoffMultiplier: 2,
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		});

		this.retryExecutor = new RetryExecutor(retryStrategy, config.retry!);

		// Initialize cache with longer TTL for Brand Analytics data
		this.cache = new MemoryCache({
			defaultTTL: 3600, // 1 hour default
			maxSize: 500,
		});

		this.logger.info("Brand Analytics provider initialized", {
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
				throw new AmazonError("Invalid Brand Analytics API credentials");
			}

			// Initialize rate limiters
			this.initializeRateLimiters();

			this.initialized = true;
			this.logger.info("Brand Analytics provider initialized successfully");
		} catch (error) {
			this.logger.error(
				"Failed to initialize Brand Analytics provider",
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
			// Test with a simple reports list request
			await this.getReports();
			return { status: "healthy" };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			return { status: "unhealthy", message };
		}
	}

	async getRateLimit(): Promise<{ remaining: number; resetTime: Date }> {
		const limiter = this.rateLimiters.get("/insights/brandanalytics");
		if (!limiter) {
			return { remaining: 10, resetTime: new Date() };
		}

		const status = limiter.getStatus();
		return {
			remaining: status.tokensRemaining,
			resetTime: new Date(Date.now() + status.estimatedWaitTime),
		};
	}

	// Search Terms Report methods
	async requestSearchTermsReport(
		request: SearchTermsReportRequest,
	): Promise<{ reportId: string }> {
		this.validateSearchTermsRequest(request);

		const response = await this.request<{ reportId: string }>(
			"/insights/brandanalytics/searchterms/report",
			"POST",
			request,
		);

		return response.data;
	}

	async getSearchTermsReport(
		reportId: string,
	): Promise<SearchTermsReportResponse> {
		if (!reportId) {
			throw new AmazonError("Report ID is required");
		}

		const response = await this.request<SearchTermsReportResponse>(
			`/insights/brandanalytics/searchterms/report/${reportId}`,
			"GET",
		);

		return response.data;
	}

	// Market Basket Analysis methods
	async requestMarketBasketAnalysis(
		request: MarketBasketAnalysisRequest,
	): Promise<{ reportId: string }> {
		this.validateMarketBasketRequest(request);

		const response = await this.request<{ reportId: string }>(
			"/insights/brandanalytics/marketbasket/report",
			"POST",
			request,
		);

		return response.data;
	}

	async getMarketBasketAnalysis(
		reportId: string,
	): Promise<MarketBasketAnalysisResponse> {
		if (!reportId) {
			throw new AmazonError("Report ID is required");
		}

		const response = await this.request<MarketBasketAnalysisResponse>(
			`/insights/brandanalytics/marketbasket/report/${reportId}`,
			"GET",
		);

		return response.data;
	}

	// Item Comparison methods
	async requestItemComparison(
		request: ItemComparisonRequest,
	): Promise<{ reportId: string }> {
		this.validateItemComparisonRequest(request);

		const response = await this.request<{ reportId: string }>(
			"/insights/brandanalytics/itemcomparison/report",
			"POST",
			request,
		);

		return response.data;
	}

	async getItemComparison(reportId: string): Promise<ItemComparisonResponse> {
		if (!reportId) {
			throw new AmazonError("Report ID is required");
		}

		const response = await this.request<ItemComparisonResponse>(
			`/insights/brandanalytics/itemcomparison/report/${reportId}`,
			"GET",
		);

		return response.data;
	}

	// Demographics methods
	async requestDemographics(
		request: DemographicsRequest,
	): Promise<{ reportId: string }> {
		this.validateDemographicsRequest(request);

		const response = await this.request<{ reportId: string }>(
			"/insights/brandanalytics/demographics/report",
			"POST",
			request,
		);

		return response.data;
	}

	async getDemographics(reportId: string): Promise<DemographicsResponse> {
		if (!reportId) {
			throw new AmazonError("Report ID is required");
		}

		const response = await this.request<DemographicsResponse>(
			`/insights/brandanalytics/demographics/report/${reportId}`,
			"GET",
		);

		return response.data;
	}

	// Repeat Purchase Analysis methods
	async requestRepeatPurchaseAnalysis(
		request: RepeatPurchaseRequest,
	): Promise<{ reportId: string }> {
		this.validateRepeatPurchaseRequest(request);

		const response = await this.request<{ reportId: string }>(
			"/insights/brandanalytics/repeatpurchase/report",
			"POST",
			request,
		);

		return response.data;
	}

	async getRepeatPurchaseAnalysis(
		reportId: string,
	): Promise<RepeatPurchaseResponse> {
		if (!reportId) {
			throw new AmazonError("Report ID is required");
		}

		const response = await this.request<RepeatPurchaseResponse>(
			`/insights/brandanalytics/repeatpurchase/report/${reportId}`,
			"GET",
		);

		return response.data;
	}

	// Brand Metrics methods
	async getBrandMetrics(
		brandName: string,
		marketplaceId: string,
	): Promise<BrandMetricsResponse> {
		if (!brandName || !marketplaceId) {
			throw new AmazonError("Brand name and marketplace ID are required");
		}

		const cacheKey = `brand-metrics:${brandName}:${marketplaceId}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as BrandMetricsResponse;
		}

		const response = await this.request<BrandMetricsResponse>(
			`/insights/brandanalytics/brandmetrics?brandName=${encodeURIComponent(brandName)}&marketplaceId=${marketplaceId}`,
			"GET",
		);

		await this.cache.set(cacheKey, response.data, 3600); // Cache for 1 hour
		return response.data;
	}

	async getBrandHealthScore(
		brandName: string,
		marketplaceId: string,
	): Promise<BrandHealthScore> {
		if (!brandName || !marketplaceId) {
			throw new AmazonError("Brand name and marketplace ID are required");
		}

		const cacheKey = `brand-health:${brandName}:${marketplaceId}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as BrandHealthScore;
		}

		const response = await this.request<BrandHealthScore>(
			`/insights/brandanalytics/brandhealth?brandName=${encodeURIComponent(brandName)}&marketplaceId=${marketplaceId}`,
			"GET",
		);

		await this.cache.set(cacheKey, response.data, 1800); // Cache for 30 minutes
		return response.data;
	}

	// Competitive Intelligence methods
	async getCompetitiveIntelligence(
		asin: string,
		marketplaceId: string,
	): Promise<CompetitiveIntelligenceResponse> {
		if (!asin || !marketplaceId) {
			throw new AmazonError("ASIN and marketplace ID are required");
		}

		const cacheKey = `competitive-intel:${asin}:${marketplaceId}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as CompetitiveIntelligenceResponse;
		}

		const response = await this.request<CompetitiveIntelligenceResponse>(
			`/insights/brandanalytics/competitive?asin=${asin}&marketplaceId=${marketplaceId}`,
			"GET",
		);

		await this.cache.set(cacheKey, response.data, 7200); // Cache for 2 hours
		return response.data;
	}

	// Report Management methods
	async getReports(filters?: {
		reportType?: BrandAnalyticsReportType;
		status?: string;
	}): Promise<BrandAnalyticsReportsResponse> {
		const queryParams = new URLSearchParams();

		if (filters?.reportType) {
			queryParams.append("reportType", filters.reportType);
		}
		if (filters?.status) {
			queryParams.append("status", filters.status);
		}

		const path = `/insights/brandanalytics/reports${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await this.request<BrandAnalyticsReportsResponse>(
			path,
			"GET",
		);

		return response.data;
	}

	async getReport(reportId: string): Promise<BrandAnalyticsReport> {
		if (!reportId) {
			throw new AmazonError("Report ID is required");
		}

		const response = await this.request<BrandAnalyticsReport>(
			`/insights/brandanalytics/reports/${reportId}`,
			"GET",
		);

		return response.data;
	}

	// Insights and Analytics methods
	async getSearchTermInsights(
		brandName: string,
		marketplaceId: string,
	): Promise<SearchTermInsight[]> {
		if (!brandName || !marketplaceId) {
			throw new AmazonError("Brand name and marketplace ID are required");
		}

		const cacheKey = `search-insights:${brandName}:${marketplaceId}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as SearchTermInsight[];
		}

		const response = await this.request<{ insights: SearchTermInsight[] }>(
			`/insights/brandanalytics/searchinsights?brandName=${encodeURIComponent(brandName)}&marketplaceId=${marketplaceId}`,
			"GET",
		);

		await this.cache.set(cacheKey, response.data.insights, 1800); // Cache for 30 minutes
		return response.data.insights;
	}

	async getTopSearchTerms(
		marketplaceId: string,
		limit = 50,
	): Promise<SearchTermInsight[]> {
		if (!marketplaceId) {
			throw new AmazonError("Marketplace ID is required");
		}

		const cacheKey = `top-search-terms:${marketplaceId}:${limit}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as SearchTermInsight[];
		}

		const response = await this.request<{ insights: SearchTermInsight[] }>(
			`/insights/brandanalytics/topsearchterms?marketplaceId=${marketplaceId}&limit=${limit}`,
			"GET",
		);

		await this.cache.set(cacheKey, response.data.insights, 3600); // Cache for 1 hour
		return response.data.insights;
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

			// Execute request with retry
			const response = await this.retryExecutor.execute(
				() => this.executeRequest<T>(path, method, body, options, requestId),
				{ operationName: `Brand Analytics ${method} ${path}`, requestId },
			);

			const duration = Date.now() - startTime;
			this.logger.logResponse(
				"brand-analytics",
				path,
				response.statusCode,
				duration,
				requestId,
			);

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.logResponse("brand-analytics", path, 0, duration, requestId, {
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
		const baseUrl = BRAND_ANALYTICS_ENDPOINTS[this.config.region];
		const url = `${baseUrl}${path}`;

		this.logger.logRequest("brand-analytics", path, method, requestId);

		try {
			// Get authentication headers
			const authHeaders = await this.authProvider.getAuthHeaders();

			const headers = {
				...authHeaders,
				"User-Agent": `Ignitabull Brand Analytics Client/${this.version}`,
				"Amazon-Advertising-API-ClientId": this.config.clientId,
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
					`Brand Analytics API request failed: ${response.statusText}`,
					response.status,
					responseText,
					{ provider: "brand-analytics", endpoint: path },
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

	// Private helper methods
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
		for (const [pattern, limiter] of this.rateLimiters) {
			if (path.includes(pattern)) {
				return limiter;
			}
		}
		return undefined;
	}

	private initializeRateLimiters(): void {
		for (const [endpoint, config] of Object.entries(
			BRAND_ANALYTICS_RATE_LIMITS,
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
		return `brand-analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// Validation methods
	private validateSearchTermsRequest(request: SearchTermsReportRequest): void {
		if (!request.reportDate || !request.marketplaceId) {
			throw new AmazonError("Report date and marketplace ID are required");
		}
	}

	private validateMarketBasketRequest(
		request: MarketBasketAnalysisRequest,
	): void {
		if (!request.reportDate || !request.marketplaceId || !request.asin) {
			throw new AmazonError(
				"Report date, marketplace ID, and ASIN are required",
			);
		}
	}

	private validateItemComparisonRequest(request: ItemComparisonRequest): void {
		if (!request.reportDate || !request.marketplaceId || !request.asin) {
			throw new AmazonError(
				"Report date, marketplace ID, and ASIN are required",
			);
		}
	}

	private validateDemographicsRequest(request: DemographicsRequest): void {
		if (!request.reportDate || !request.marketplaceId) {
			throw new AmazonError("Report date and marketplace ID are required");
		}
		if (!request.asin && !request.brandName && !request.categoryName) {
			throw new AmazonError(
				"Either ASIN, brand name, or category name is required",
			);
		}
	}

	private validateRepeatPurchaseRequest(request: RepeatPurchaseRequest): void {
		if (!request.reportDate || !request.marketplaceId || !request.timeFrame) {
			throw new AmazonError(
				"Report date, marketplace ID, and time frame are required",
			);
		}
	}
}

// Export the provider class with the interface name for consistency
export { BrandAnalyticsProviderImpl as BrandAnalyticsProvider };
