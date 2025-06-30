/**
 * Amazon DSP (Demand Side Platform) API provider implementation
 * Following AI SDK provider patterns
 */

import {
	AmazonAPIError,
	AmazonError,
	AmazonRateLimitError,
} from "../errors/base";
import { NetworkErrorFactory } from "../errors/network-errors";
import type {
	CreateDSPAudienceRequest,
	CreateDSPCampaignRequest,
	CreateDSPCreativeRequest,
	CreateDSPLineItemRequest,
	DSPAudience,
	DSPAudiencesResponse,
	DSPCampaign,
	DSPCampaignStatus,
	DSPCampaignsResponse,
	DSPCampaignType,
	DSPConfig,
	DSPCreative,
	DSPCreativesResponse,
	DSPLineItem,
	DSPLineItemsResponse,
	DSPPerformanceMetrics,
	DSPReportRequest,
	DSPReportResponse,
	DSPReportsResponse,
	DSPReportType,
	UpdateDSPCampaignRequest,
} from "../types/dsp";
import type {
	APIResponse,
	BaseAmazonProvider,
	RequestOptions,
} from "../types/provider";
import { AdvertisingAuthProvider } from "../utils/auth"; // DSP uses same auth as Advertising
import { MemoryCache } from "../utils/cache";
import { createProviderLogger } from "../utils/logger";
import { RateLimiter } from "../utils/rate-limiter";
import { ExponentialBackoffStrategy, RetryExecutor } from "../utils/retry";

/**
 * DSP API endpoint configurations
 */
const DSP_ENDPOINTS = {
	"us-east-1": "https://advertising-api.amazon.com",
	"us-west-2": "https://advertising-api.amazon.com",
	"eu-west-1": "https://advertising-api-eu.amazon.com",
	"eu-central-1": "https://advertising-api-eu.amazon.com",
	"ap-northeast-1": "https://advertising-api-fe.amazon.com",
} as const;

/**
 * DSP API rate limit configurations
 */
const DSP_RATE_LIMITS = {
	"/dsp/campaigns": { requestsPerSecond: 1, burstLimit: 10 },
	"/dsp/lineItems": { requestsPerSecond: 1, burstLimit: 10 },
	"/dsp/creatives": { requestsPerSecond: 0.5, burstLimit: 5 },
	"/dsp/audiences": { requestsPerSecond: 0.5, burstLimit: 5 },
	"/dsp/reports": { requestsPerSecond: 0.1, burstLimit: 2 },
} as const;

/**
 * Amazon DSP provider interface
 */
export interface DSPProvider extends BaseAmazonProvider {
	readonly providerId: "dsp";

	// Campaign management
	getCampaigns(params?: {
		campaignIds?: string[];
		campaignTypes?: DSPCampaignType[];
		statuses?: DSPCampaignStatus[];
		startIndex?: number;
		count?: number;
	}): Promise<DSPCampaignsResponse>;

	getCampaign(campaignId: string): Promise<DSPCampaign>;
	createCampaign(campaign: CreateDSPCampaignRequest): Promise<DSPCampaign>;
	updateCampaign(
		campaignId: string,
		updates: UpdateDSPCampaignRequest,
	): Promise<DSPCampaign>;
	archiveCampaign(campaignId: string): Promise<{ success: boolean }>;

	// Line Item management
	getLineItems(params?: {
		campaignIds?: string[];
		lineItemIds?: string[];
		startIndex?: number;
		count?: number;
	}): Promise<DSPLineItemsResponse>;

	getLineItem(lineItemId: string): Promise<DSPLineItem>;
	createLineItem(lineItem: CreateDSPLineItemRequest): Promise<DSPLineItem>;
	updateLineItem(
		lineItemId: string,
		updates: Partial<CreateDSPLineItemRequest>,
	): Promise<DSPLineItem>;

	// Creative management
	getCreatives(params?: {
		creativeIds?: string[];
		campaignIds?: string[];
		startIndex?: number;
		count?: number;
	}): Promise<DSPCreativesResponse>;

	getCreative(creativeId: string): Promise<DSPCreative>;
	createCreative(creative: CreateDSPCreativeRequest): Promise<DSPCreative>;
	updateCreative(
		creativeId: string,
		updates: Partial<CreateDSPCreativeRequest>,
	): Promise<DSPCreative>;

	// Audience management
	getAudiences(params?: {
		audienceIds?: string[];
		startIndex?: number;
		count?: number;
	}): Promise<DSPAudiencesResponse>;

	getAudience(audienceId: string): Promise<DSPAudience>;
	createAudience(audience: CreateDSPAudienceRequest): Promise<DSPAudience>;
	updateAudience(
		audienceId: string,
		updates: Partial<CreateDSPAudienceRequest>,
	): Promise<DSPAudience>;

	// Reporting
	requestReport(reportRequest: DSPReportRequest): Promise<{ reportId: string }>;
	getReport(reportId: string): Promise<DSPReportResponse>;
	getReports(params?: {
		reportTypes?: DSPReportType[];
		startIndex?: number;
		count?: number;
	}): Promise<DSPReportsResponse>;
	downloadReport(reportId: string): Promise<string>;

	// Performance analytics
	getCampaignPerformance(
		campaignId: string,
		startDate: string,
		endDate: string,
	): Promise<DSPPerformanceMetrics>;
	getLineItemPerformance(
		lineItemId: string,
		startDate: string,
		endDate: string,
	): Promise<DSPPerformanceMetrics>;
}

/**
 * Amazon DSP provider implementation
 */
export class DSPProviderImpl implements DSPProvider, BaseAmazonProvider {
	readonly providerId = "dsp";
	readonly name = "Amazon DSP API";
	readonly version = "3.0";

	private readonly config: DSPConfig;
	private readonly authProvider: AdvertisingAuthProvider;
	private readonly retryExecutor: RetryExecutor;
	private readonly rateLimiters = new Map<string, RateLimiter>();
	private readonly cache: MemoryCache;
	private readonly logger = createProviderLogger("dsp");
	private initialized = false;

	constructor(config: DSPConfig) {
		this.config = config;

		// DSP uses same auth as Advertising API
		this.authProvider = new AdvertisingAuthProvider({
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			refreshToken: config.refreshToken,
			profileId: config.advertiserId,
			region: config.region,
			sandbox: config.sandbox,
		});

		// Initialize retry executor with conservative settings for DSP
		const retryStrategy = new ExponentialBackoffStrategy({
			maxRetries: 3,
			baseDelay: 3000,
			maxDelay: 60000,
			backoffMultiplier: 2,
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		});

		this.retryExecutor = new RetryExecutor(retryStrategy, {
			maxRetries: 3,
			baseDelay: 3000,
			maxDelay: 60000,
		});

		// Initialize cache with longer TTL for DSP data
		this.cache = new MemoryCache({
			defaultTTL: 1800, // 30 minutes default
			maxSize: 1000,
		});

		this.logger.info("DSP provider initialized", {
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
				throw new AmazonError("Invalid DSP API credentials");
			}

			// Initialize rate limiters
			this.initializeRateLimiters();

			this.initialized = true;
			this.logger.info("DSP provider initialized successfully");
		} catch (error) {
			this.logger.error("Failed to initialize DSP provider", error as Error);
			throw error;
		}
	}

	async healthCheck(): Promise<{
		status: "healthy" | "unhealthy";
		message?: string;
	}> {
		try {
			// Test with a simple campaigns list request
			await this.getCampaigns({ count: 1 });
			return { status: "healthy" };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			return { status: "unhealthy", message };
		}
	}

	async getRateLimit(): Promise<{ remaining: number; resetTime: Date }> {
		const limiter = this.rateLimiters.get("/dsp/campaigns");
		if (!limiter) {
			return { remaining: 10, resetTime: new Date() };
		}

		const status = limiter.getStatus();
		return {
			remaining: status.tokensRemaining,
			resetTime: new Date(Date.now() + status.estimatedWaitTime),
		};
	}

	// Campaign management methods
	async getCampaigns(
		params: {
			campaignIds?: string[];
			campaignTypes?: DSPCampaignType[];
			statuses?: DSPCampaignStatus[];
			startIndex?: number;
			count?: number;
		} = {},
	): Promise<DSPCampaignsResponse> {
		const queryParams = new URLSearchParams();

		if (params.campaignIds?.length) {
			queryParams.append("campaignIdFilter", params.campaignIds.join(","));
		}
		if (params.campaignTypes?.length) {
			queryParams.append("campaignTypeFilter", params.campaignTypes.join(","));
		}
		if (params.statuses?.length) {
			queryParams.append("stateFilter", params.statuses.join(","));
		}
		if (params.startIndex !== undefined) {
			queryParams.append("startIndex", params.startIndex.toString());
		}
		if (params.count !== undefined) {
			queryParams.append("count", params.count.toString());
		}

		const response = await this.request<DSPCampaignsResponse>(
			`/dsp/campaigns${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
			"GET",
		);

		return response.data;
	}

	async getCampaign(campaignId: string): Promise<DSPCampaign> {
		if (!campaignId) {
			throw new AmazonError("Campaign ID is required");
		}

		const response = await this.request<DSPCampaign>(
			`/dsp/campaigns/${campaignId}`,
			"GET",
		);

		return response.data;
	}

	async createCampaign(
		campaign: CreateDSPCampaignRequest,
	): Promise<DSPCampaign> {
		this.validateCampaignRequest(campaign);

		const response = await this.request<DSPCampaign>(
			"/dsp/campaigns",
			"POST",
			campaign,
		);

		return response.data;
	}

	async updateCampaign(
		campaignId: string,
		updates: UpdateDSPCampaignRequest,
	): Promise<DSPCampaign> {
		if (!campaignId) {
			throw new AmazonError("Campaign ID is required");
		}

		const response = await this.request<DSPCampaign>(
			`/dsp/campaigns/${campaignId}`,
			"PUT",
			updates,
		);

		return response.data;
	}

	async archiveCampaign(campaignId: string): Promise<{ success: boolean }> {
		if (!campaignId) {
			throw new AmazonError("Campaign ID is required");
		}

		const response = await this.request<{ success: boolean }>(
			`/dsp/campaigns/${campaignId}`,
			"DELETE",
		);

		return response.data;
	}

	// Line Item management methods
	async getLineItems(
		params: {
			campaignIds?: string[];
			lineItemIds?: string[];
			startIndex?: number;
			count?: number;
		} = {},
	): Promise<DSPLineItemsResponse> {
		const queryParams = new URLSearchParams();

		if (params.campaignIds?.length) {
			queryParams.append("campaignIdFilter", params.campaignIds.join(","));
		}
		if (params.lineItemIds?.length) {
			queryParams.append("lineItemIdFilter", params.lineItemIds.join(","));
		}
		if (params.startIndex !== undefined) {
			queryParams.append("startIndex", params.startIndex.toString());
		}
		if (params.count !== undefined) {
			queryParams.append("count", params.count.toString());
		}

		const response = await this.request<DSPLineItemsResponse>(
			`/dsp/lineItems${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
			"GET",
		);

		return response.data;
	}

	async getLineItem(lineItemId: string): Promise<DSPLineItem> {
		if (!lineItemId) {
			throw new AmazonError("Line Item ID is required");
		}

		const response = await this.request<DSPLineItem>(
			`/dsp/lineItems/${lineItemId}`,
			"GET",
		);

		return response.data;
	}

	async createLineItem(
		lineItem: CreateDSPLineItemRequest,
	): Promise<DSPLineItem> {
		this.validateLineItemRequest(lineItem);

		const response = await this.request<DSPLineItem>(
			"/dsp/lineItems",
			"POST",
			lineItem,
		);

		return response.data;
	}

	async updateLineItem(
		lineItemId: string,
		updates: Partial<CreateDSPLineItemRequest>,
	): Promise<DSPLineItem> {
		if (!lineItemId) {
			throw new AmazonError("Line Item ID is required");
		}

		const response = await this.request<DSPLineItem>(
			`/dsp/lineItems/${lineItemId}`,
			"PUT",
			updates,
		);

		return response.data;
	}

	// Creative management methods
	async getCreatives(
		params: {
			creativeIds?: string[];
			campaignIds?: string[];
			startIndex?: number;
			count?: number;
		} = {},
	): Promise<DSPCreativesResponse> {
		const queryParams = new URLSearchParams();

		if (params.creativeIds?.length) {
			queryParams.append("creativeIdFilter", params.creativeIds.join(","));
		}
		if (params.campaignIds?.length) {
			queryParams.append("campaignIdFilter", params.campaignIds.join(","));
		}
		if (params.startIndex !== undefined) {
			queryParams.append("startIndex", params.startIndex.toString());
		}
		if (params.count !== undefined) {
			queryParams.append("count", params.count.toString());
		}

		const response = await this.request<DSPCreativesResponse>(
			`/dsp/creatives${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
			"GET",
		);

		return response.data;
	}

	async getCreative(creativeId: string): Promise<DSPCreative> {
		if (!creativeId) {
			throw new AmazonError("Creative ID is required");
		}

		const response = await this.request<DSPCreative>(
			`/dsp/creatives/${creativeId}`,
			"GET",
		);

		return response.data;
	}

	async createCreative(
		creative: CreateDSPCreativeRequest,
	): Promise<DSPCreative> {
		this.validateCreativeRequest(creative);

		const response = await this.request<DSPCreative>(
			"/dsp/creatives",
			"POST",
			creative,
		);

		return response.data;
	}

	async updateCreative(
		creativeId: string,
		updates: Partial<CreateDSPCreativeRequest>,
	): Promise<DSPCreative> {
		if (!creativeId) {
			throw new AmazonError("Creative ID is required");
		}

		const response = await this.request<DSPCreative>(
			`/dsp/creatives/${creativeId}`,
			"PUT",
			updates,
		);

		return response.data;
	}

	// Audience management methods
	async getAudiences(
		params: {
			audienceIds?: string[];
			startIndex?: number;
			count?: number;
		} = {},
	): Promise<DSPAudiencesResponse> {
		const queryParams = new URLSearchParams();

		if (params.audienceIds?.length) {
			queryParams.append("audienceIdFilter", params.audienceIds.join(","));
		}
		if (params.startIndex !== undefined) {
			queryParams.append("startIndex", params.startIndex.toString());
		}
		if (params.count !== undefined) {
			queryParams.append("count", params.count.toString());
		}

		const response = await this.request<DSPAudiencesResponse>(
			`/dsp/audiences${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
			"GET",
		);

		return response.data;
	}

	async getAudience(audienceId: string): Promise<DSPAudience> {
		if (!audienceId) {
			throw new AmazonError("Audience ID is required");
		}

		const response = await this.request<DSPAudience>(
			`/dsp/audiences/${audienceId}`,
			"GET",
		);

		return response.data;
	}

	async createAudience(
		audience: CreateDSPAudienceRequest,
	): Promise<DSPAudience> {
		this.validateAudienceRequest(audience);

		const response = await this.request<DSPAudience>(
			"/dsp/audiences",
			"POST",
			audience,
		);

		return response.data;
	}

	async updateAudience(
		audienceId: string,
		updates: Partial<CreateDSPAudienceRequest>,
	): Promise<DSPAudience> {
		if (!audienceId) {
			throw new AmazonError("Audience ID is required");
		}

		const response = await this.request<DSPAudience>(
			`/dsp/audiences/${audienceId}`,
			"PUT",
			updates,
		);

		return response.data;
	}

	// Reporting methods
	async requestReport(
		reportRequest: DSPReportRequest,
	): Promise<{ reportId: string }> {
		this.validateReportRequest(reportRequest);

		const response = await this.request<{ reportId: string }>(
			"/dsp/reports",
			"POST",
			reportRequest,
		);

		return response.data;
	}

	async getReport(reportId: string): Promise<DSPReportResponse> {
		if (!reportId) {
			throw new AmazonError("Report ID is required");
		}

		const response = await this.request<DSPReportResponse>(
			`/dsp/reports/${reportId}`,
			"GET",
		);

		return response.data;
	}

	async getReports(
		params: {
			reportTypes?: DSPReportType[];
			startIndex?: number;
			count?: number;
		} = {},
	): Promise<DSPReportsResponse> {
		const queryParams = new URLSearchParams();

		if (params.reportTypes?.length) {
			queryParams.append("reportTypeFilter", params.reportTypes.join(","));
		}
		if (params.startIndex !== undefined) {
			queryParams.append("startIndex", params.startIndex.toString());
		}
		if (params.count !== undefined) {
			queryParams.append("count", params.count.toString());
		}

		const response = await this.request<DSPReportsResponse>(
			`/dsp/reports${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
			"GET",
		);

		return response.data;
	}

	async downloadReport(reportId: string): Promise<string> {
		if (!reportId) {
			throw new AmazonError("Report ID is required");
		}

		const response = await this.request<string>(
			`/dsp/reports/${reportId}/download`,
			"GET",
		);

		return response.data;
	}

	// Performance analytics methods
	async getCampaignPerformance(
		campaignId: string,
		startDate: string,
		endDate: string,
	): Promise<DSPPerformanceMetrics> {
		if (!campaignId || !startDate || !endDate) {
			throw new AmazonError(
				"Campaign ID, start date, and end date are required",
			);
		}

		const reportRequest: DSPReportRequest = {
			reportType: "CAMPAIGN_PERFORMANCE",
			startDate,
			endDate,
			dimensions: ["CAMPAIGN"],
			metrics: ["IMPRESSIONS", "CLICKS", "SPEND", "CTR", "CPC", "CPM"],
			filters: [{ dimension: "CAMPAIGN", values: [campaignId] }],
		};

		const { reportId } = await this.requestReport(reportRequest);

		// Poll for report completion
		let report = await this.getReport(reportId);
		while (report.status === "PENDING" || report.status === "IN_PROGRESS") {
			await new Promise((resolve) => setTimeout(resolve, 5000));
			report = await this.getReport(reportId);
		}

		if (report.status !== "SUCCESS" || !report.reportData) {
			throw new AmazonError("Failed to generate campaign performance report");
		}

		// Parse performance metrics from report data
		const data = report.reportData.rows[0] || [];
		return this.parsePerformanceMetrics(data, report.reportData.headers);
	}

	async getLineItemPerformance(
		lineItemId: string,
		startDate: string,
		endDate: string,
	): Promise<DSPPerformanceMetrics> {
		if (!lineItemId || !startDate || !endDate) {
			throw new AmazonError(
				"Line Item ID, start date, and end date are required",
			);
		}

		const reportRequest: DSPReportRequest = {
			reportType: "LINE_ITEM_PERFORMANCE",
			startDate,
			endDate,
			dimensions: ["LINE_ITEM"],
			metrics: ["IMPRESSIONS", "CLICKS", "SPEND", "CTR", "CPC", "CPM"],
			filters: [{ dimension: "LINE_ITEM", values: [lineItemId] }],
		};

		const { reportId } = await this.requestReport(reportRequest);

		// Poll for report completion
		let report = await this.getReport(reportId);
		while (report.status === "PENDING" || report.status === "IN_PROGRESS") {
			await new Promise((resolve) => setTimeout(resolve, 5000));
			report = await this.getReport(reportId);
		}

		if (report.status !== "SUCCESS" || !report.reportData) {
			throw new AmazonError("Failed to generate line item performance report");
		}

		// Parse performance metrics from report data
		const data = report.reportData.rows[0] || [];
		return this.parsePerformanceMetrics(data, report.reportData.headers);
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
				{ operationName: `DSP ${method} ${path}`, requestId },
			);

			const duration = Date.now() - startTime;
			this.logger.logResponse(
				"dsp",
				path,
				response.statusCode,
				duration,
				requestId,
			);

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.logResponse("dsp", path, 0, duration, requestId, {
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
		const baseUrl = DSP_ENDPOINTS[this.config.region];
		const url = `${baseUrl}${path}`;

		this.logger.logRequest("dsp", path, method, requestId);

		try {
			// Get authentication headers
			const authHeaders = await this.authProvider.getAuthHeaders();

			const headers = {
				...authHeaders,
				"User-Agent": `Ignitabull DSP Client/${this.version}`,
				"Amazon-Advertising-API-ClientId": this.config.clientId,
				"Amazon-Advertising-API-Scope": this.config.advertiserId,
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
					`DSP API request failed: ${response.statusText}`,
					response.status,
					responseText,
					{ provider: "dsp", endpoint: path },
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
		for (const [endpoint, config] of Object.entries(DSP_RATE_LIMITS)) {
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
		return `dsp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private parsePerformanceMetrics(
		data: Array<string | number>,
		headers: string[],
	): DSPPerformanceMetrics {
		const metrics: DSPPerformanceMetrics = {
			impressions: 0,
			clicks: 0,
			spend: 0,
			ctr: 0,
			cpc: 0,
			cpm: 0,
		};

		headers.forEach((header, index) => {
			const value =
				typeof data[index] === "number"
					? (data[index] as number)
					: Number.parseFloat(data[index] as string) || 0;

			switch (header.toLowerCase()) {
				case "impressions":
					metrics.impressions = value;
					break;
				case "clicks":
					metrics.clicks = value;
					break;
				case "spend":
					metrics.spend = value;
					break;
				case "ctr":
					metrics.ctr = value;
					break;
				case "cpc":
					metrics.cpc = value;
					break;
				case "cpm":
					metrics.cpm = value;
					break;
				case "conversions":
					metrics.conversions = value;
					break;
				case "conversion_rate":
					metrics.conversionRate = value;
					break;
				case "cpa":
					metrics.cpa = value;
					break;
				case "roas":
					metrics.roas = value;
					break;
			}
		});

		return metrics;
	}

	// Validation methods
	private validateCampaignRequest(request: CreateDSPCampaignRequest): void {
		if (
			!request.name ||
			!request.type ||
			!request.budget ||
			!request.schedule
		) {
			throw new AmazonError(
				"Name, type, budget, and schedule are required for campaign creation",
			);
		}
	}

	private validateLineItemRequest(request: CreateDSPLineItemRequest): void {
		if (
			!request.campaignId ||
			!request.name ||
			!request.budget ||
			!request.bidding
		) {
			throw new AmazonError(
				"Campaign ID, name, budget, and bidding are required for line item creation",
			);
		}
	}

	private validateCreativeRequest(request: CreateDSPCreativeRequest): void {
		if (
			!request.name ||
			!request.type ||
			!request.format ||
			!request.assets?.length
		) {
			throw new AmazonError(
				"Name, type, format, and assets are required for creative creation",
			);
		}
	}

	private validateAudienceRequest(request: CreateDSPAudienceRequest): void {
		if (!request.name || !request.type || !request.definition) {
			throw new AmazonError(
				"Name, type, and definition are required for audience creation",
			);
		}
	}

	private validateReportRequest(request: DSPReportRequest): void {
		if (
			!request.reportType ||
			!request.startDate ||
			!request.endDate ||
			!request.dimensions?.length ||
			!request.metrics?.length
		) {
			throw new AmazonError(
				"Report type, date range, dimensions, and metrics are required",
			);
		}
	}
}

// Export the provider class with the interface name for consistency
export { DSPProviderImpl as DSPProvider };
