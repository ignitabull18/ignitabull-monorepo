/**
 * Base provider interfaces for Amazon APIs
 * Following AI SDK provider patterns
 */

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
} from "./advertising";
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
} from "./associates";
import type {
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
} from "./brand-analytics";
import type {
	DateRange,
	Dimensions,
	Filter,
	MoneyAmount,
	PaginationParams,
	ProductImage,
} from "./common";
import type {
	// AdvertisingConfig, // Reserved for future use
	// AssociatesConfig, // Reserved for future use
	// BaseAmazonConfig, // Reserved for future use
	// BrandAnalyticsConfig, // Reserved for future use
	// CacheConfig, // Reserved for future use
	// DSPConfig, // Reserved for future use
	// LoggerConfig, // Reserved for future use
	// RateLimitConfig, // Reserved for future use
	// RetryConfig, // Reserved for future use
	// SPAPIConfig, // Reserved for future use
} from "./config";
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
} from "./dsp";
import type {
	SPAPICatalogItem,
	SPAPICatalogResponse,
	SPAPIInventoryResponse,
	SPAPIOrder,
	SPAPIOrdersResponse,
	SPAPIReport,
	SPAPIReportsResponse,
} from "./sp-api";

/**
 * API response wrapper
 */
export interface APIResponse<T> {
	data: T;
	statusCode: number;
	statusText: string;
	headers: Record<string, string>;
}

/**
 * Request options
 */
export interface RequestOptions {
	timeout?: number;
	headers?: Record<string, string>;
	skipCache?: boolean;
	retries?: number;
}

/**
 * Base provider interface that all Amazon providers must implement
 * Similar to AI SDK provider pattern
 */
export interface BaseAmazonProvider {
	readonly providerId: string;
	readonly name: string;
	readonly version: string;

	/**
	 * Initialize the provider
	 */
	initialize(): Promise<void>;

	/**
	 * Test the connection and authentication
	 */
	healthCheck(): Promise<{ status: "healthy" | "unhealthy"; message?: string }>;

	/**
	 * Get current rate limit status
	 */
	getRateLimit(): Promise<{ remaining: number; resetTime: Date }>;
}

/**
 * Selling Partner API provider interface
 */
export interface SPAPIProvider extends BaseAmazonProvider {
	readonly providerId: "sp-api";

	// Orders API
	getOrders(params: {
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
	}): Promise<SPAPIOrdersResponse>;

	getOrder(orderId: string): Promise<SPAPIOrder>;

	// Catalog API
	getCatalogItem(
		asin: string,
		marketplaceIds: string[],
		params?: {
			includedData?: string[];
			locale?: string;
		},
	): Promise<SPAPICatalogItem>;

	searchCatalogItems(params: {
		keywords?: string;
		marketplaceIds: string[];
		includedData?: string[];
		brandNames?: string[];
		classificationIds?: string[];
		pageSize?: number;
		pageToken?: string;
		keywordsLocale?: string;
		locale?: string;
	}): Promise<SPAPICatalogResponse>;

	// Inventory API
	getInventorySummaries(params: {
		granularityType: "Marketplace";
		granularityId: string;
		marketplaceIds: string[];
		details?: boolean;
		startDateTime?: Date;
		sellerSkus?: string[];
		nextToken?: string;
		maxResultsPerPage?: number;
	}): Promise<SPAPIInventoryResponse>;

	// Reports API
	getReports(params?: {
		reportTypes?: string[];
		processingStatuses?: string[];
		marketplaceIds?: string[];
		pageSize?: number;
		createdSince?: Date;
		createdUntil?: Date;
		nextToken?: string;
	}): Promise<SPAPIReportsResponse>;

	createReport(params: {
		reportType: string;
		marketplaceIds: string[];
		dataStartTime?: Date;
		dataEndTime?: Date;
		reportOptions?: Record<string, string>;
	}): Promise<{ reportId: string }>;

	getReport(reportId: string): Promise<SPAPIReport>;
}

/**
 * Advertising API provider interface
 */
export interface AdvertisingProvider extends BaseAmazonProvider {
	readonly providerId: "advertising";

	// Profile management
	getProfiles(): Promise<AdvertisingProfile[]>;

	// Campaign management
	getCampaigns(params?: {
		stateFilter?: "enabled" | "paused" | "archived";
		campaignIdFilter?: string[];
		adGroupIdFilter?: string[];
		name?: string;
		campaignType?: "sponsoredProducts" | "sponsoredBrands" | "sponsoredDisplay";
		count?: number;
		startIndex?: number;
	}): Promise<AdvertisingCampaignResponse>;

	getCampaign(campaignId: string): Promise<AdvertisingCampaign>;
	createCampaign(campaign: CreateCampaignRequest): Promise<AdvertisingCampaign>;
	updateCampaign(
		campaignId: string,
		updates: UpdateCampaignRequest,
	): Promise<AdvertisingCampaign>;
	archiveCampaign(campaignId: string): Promise<{ success: boolean }>;

	// Ad Group management
	getAdGroups(params?: {
		campaignIdFilter?: string[];
		adGroupIdFilter?: string[];
		stateFilter?: "enabled" | "paused" | "archived";
		name?: string;
		count?: number;
		startIndex?: number;
	}): Promise<AdvertisingAdGroup[]>;

	createAdGroup(adGroup: CreateAdGroupRequest): Promise<AdvertisingAdGroup>;

	// Keyword management
	getKeywords(params?: {
		campaignIdFilter?: string[];
		adGroupIdFilter?: string[];
		keywordIdFilter?: string[];
		stateFilter?: "enabled" | "paused" | "archived";
		matchTypeFilter?: "exact" | "phrase" | "broad";
		keywordText?: string;
		count?: number;
		startIndex?: number;
	}): Promise<AdvertisingKeywordResponse>;

	createKeywords(
		keywords: CreateKeywordRequest[],
	): Promise<AdvertisingKeyword[]>;
	updateKeywords(
		keywords: Array<{
			keywordId: string;
			state?: "enabled" | "paused" | "archived";
			bid?: number;
		}>,
	): Promise<AdvertisingKeyword[]>;

	// Product Ads management
	getProductAds(params?: {
		campaignIdFilter?: string[];
		adGroupIdFilter?: string[];
		adIdFilter?: string[];
		stateFilter?: "enabled" | "paused" | "archived";
		asin?: string;
		sku?: string;
		count?: number;
		startIndex?: number;
	}): Promise<AdvertisingProductAd[]>;

	createProductAds(
		productAds: CreateProductAdRequest[],
	): Promise<AdvertisingProductAd[]>;

	// Reporting
	requestReport(reportRequest: ReportRequest): Promise<{ reportId: string }>;
	getReport(reportId: string): Promise<AdvertisingReport>;
	downloadReport(reportId: string): Promise<string>;

	// Performance helpers
	getCampaignPerformance(
		campaignId: string,
		dateRange: {
			startDate: Date;
			endDate: Date;
		},
	): Promise<any>;
}

/**
 * Associates API provider interface
 */
export interface AssociatesProvider extends BaseAmazonProvider {
	readonly providerId: "associates";

	// Product retrieval methods
	getItems(request: GetItemsRequest): Promise<AssociatesProductResponse>;
	getItem(asin: string, resources?: string[]): Promise<AssociatesProduct>;

	// Product search methods
	searchItems(request: SearchItemsRequest): Promise<AssociatesSearchResponse>;

	// Browse node methods
	getBrowseNodes(
		request: GetBrowseNodesRequest,
	): Promise<AssociatesBrowseNode[]>;
	getBrowseNode(browseNodeId: string): Promise<AssociatesBrowseNode>;

	// Variations methods
	getVariations(
		request: GetVariationsRequest,
	): Promise<AssociatesVariationsResponse>;

	// Convenience methods
	searchProductsByKeywords(
		keywords: string,
		options?: {
			searchIndex?: string;
			itemCount?: number;
			sortBy?: string;
			minPrice?: number;
			maxPrice?: number;
		},
	): Promise<AssociatesProduct[]>;

	searchProductsByCategory(
		browseNodeId: string,
		options?: {
			itemCount?: number;
			sortBy?: string;
		},
	): Promise<AssociatesProduct[]>;

	// Link generation methods (Note: PA-API 5.0 doesn't provide direct link generation)
	generateAffiliateLink(asin: string, customId?: string): string;
	generateSearchLink(keywords: string, customId?: string): string;
}

/**
 * Brand Analytics API provider interface
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
 * DSP API provider interface
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

// Type definitions for provider methods
export interface InventoryItem {
	asin: string;
	sellerSku: string;
	totalQuantity: number;
	inboundQuantity: number;
	availableQuantity: number;
	reservedQuantity: number;
	lastUpdated: Date;
}

export interface InventoryUpdate {
	sellerSku: string;
	quantity: number;
}

export interface Order {
	orderId: string;
	orderStatus: string;
	purchaseDate: Date;
	buyerEmail?: string;
	orderTotal: MoneyAmount;
	items: OrderItem[];
	shippingAddress?: Address;
}

export interface OrderItem {
	asin: string;
	sellerSku: string;
	title: string;
	quantity: number;
	price: MoneyAmount;
}

export interface OrderSearchParams extends PaginationParams {
	orderStatuses?: string[];
	marketplaceIds?: string[];
	fulfillmentChannels?: string[];
	paymentMethods?: string[];
	buyerEmail?: string;
	dateRange?: DateRange;
}

export interface OrderUpdate {
	orderStatus?: string;
	trackingNumber?: string;
	carrierCode?: string;
}

export interface Product {
	asin: string;
	title: string;
	description?: string;
	brand?: string;
	manufacturer?: string;
	price?: MoneyAmount;
	images?: ProductImage[];
	dimensions?: Dimensions;
	weight?: number;
	category?: string;
	salesRank?: number;
	reviews?: {
		rating: number;
		count: number;
	};
}

export interface ProductSearchParams extends PaginationParams {
	keywords?: string;
	category?: string;
	brand?: string;
	priceRange?: {
		min: number;
		max: number;
	};
	includeImages?: boolean;
}

export interface CompetitivePricing {
	asin: string;
	landedPrice?: MoneyAmount;
	listingPrice?: MoneyAmount;
	shipping?: MoneyAmount;
	competitorPrices?: Array<{
		condition: string;
		price: MoneyAmount;
		seller?: string;
	}>;
}

export interface PriceUpdate {
	asin: string;
	price: MoneyAmount;
}

// Advertising types
export interface Campaign {
	campaignId: string;
	name: string;
	campaignType: "sponsoredProducts" | "sponsoredBrands" | "sponsoredDisplay";
	targetingType: "manual" | "auto";
	state: "enabled" | "paused" | "archived";
	dailyBudget: MoneyAmount;
	startDate: Date;
	endDate?: Date;
	performance?: any; // CampaignPerformance type is from advertising.ts
}

export interface CampaignSearchParams extends PaginationParams {
	stateFilter?: string;
	campaignIdFilter?: string[];
	name?: string;
}

// CreateCampaignRequest is now imported from types/advertising.ts

export interface CampaignUpdate {
	name?: string;
	state?: "enabled" | "paused" | "archived";
	dailyBudget?: number;
	endDate?: Date;
}

export interface Keyword {
	keywordId: string;
	campaignId: string;
	keywordText: string;
	matchType: "exact" | "phrase" | "broad";
	state: "enabled" | "paused" | "archived";
	bid: MoneyAmount;
	performance?: KeywordPerformance;
}

// CreateKeywordRequest is now imported from types/advertising.ts

export interface KeywordUpdate {
	keywordId: string;
	state?: "enabled" | "paused" | "archived";
	bid?: number;
}

// CampaignPerformance is already exported from advertising.ts
// Import it instead of redefining
export interface KeywordPerformance {
	impressions: number;
	clicks: number;
	cost: MoneyAmount;
	sales: MoneyAmount;
	orders: number;
	ctr: number; // Click-through rate
	acos: number; // Advertising cost of sales
	roas: number; // Return on ad spend
	searchTerm?: string;
}

export interface ReportParams {
	reportType: "campaigns" | "keywords" | "searchTerms" | "productAds";
	dateRange: DateRange;
	metrics?: string[];
	filters?: Filter[];
}

export interface PerformanceReport {
	reportId: string;
	status: "pending" | "processing" | "completed" | "failed";
	downloadUrl?: string;
	createdDate: Date;
}

export interface ReportData {
	headers: string[];
	rows: (string | number)[][];
	totalRows: number;
}

// Associates API types
export interface AssociateProduct {
	asin: string;
	title: string;
	url: string;
	images?: ProductImage[];
	price?: MoneyAmount;
	availability?: string;
	prime?: boolean;
	rating?: number;
	reviewCount?: number;
	brand?: string;
	features?: string[];
}

export interface AssociateSearchParams {
	keywords?: string;
	searchIndex?: string;
	browseNodeId?: string;
	brand?: string;
	merchant?: string;
	condition?: "New" | "Used" | "Collectible" | "Refurbished";
	sortBy?: string;
	itemPage?: number;
	itemCount?: number;
}

export interface BrowseNode {
	id: string;
	name: string;
	contextFreeName?: string;
	hasChildren: boolean;
	children?: BrowseNode[];
	ancestors?: BrowseNode[];
}

export interface AffiliateLink {
	url: string;
	shortenedUrl?: string;
	asin?: string;
	trackingId: string;
	createdAt: Date;
}

export interface AffiliateLinkOptions {
	linkType?: "ProductUrl" | "AddToCart";
	trackingId?: string;
	customId?: string;
}

export interface CartItem {
	asin: string;
	quantity: number;
}

export interface AffiliateReportParams extends DateRange {
	trackingIds?: string[];
	eventTypes?: string[];
}

export interface AffiliateReport {
	trackingId: string;
	clicks: number;
	conversions: number;
	revenue: MoneyAmount;
	commissionRate: number;
	commissionEarned: MoneyAmount;
	period: DateRange;
}

// Additional shared types
export interface Address {
	name?: string;
	addressLine1: string;
	addressLine2?: string;
	addressLine3?: string;
	city: string;
	county?: string;
	district?: string;
	stateOrRegion: string;
	municipality?: string;
	postalCode: string;
	countryCode: string;
	phone?: string;
}

// Common types are now imported from types/common.ts
// - SuccessResponse
// - MoneyAmount
// - ProductImage
// - Dimensions
// - Filter

/**
 * Authentication configuration
 */
export interface AuthConfig {
	clientId: string;
	clientSecret: string;
	refreshToken?: string;
	accessToken?: string;
	region: string;
	marketplace?: string;
}

/**
 * Generic provider configuration
 */
export interface ProviderConfig {
	auth: AuthConfig;
	rateLimits?: {
		requestsPerSecond?: number;
		burstLimit?: number;
	};
	retries?: {
		maxRetries?: number;
		backoffMultiplier?: number;
	};
	cache?: {
		enabled?: boolean;
		ttl?: number;
	};
	timeout?: number;
	sandbox?: boolean;
}

// Re-export commonly used config types
// export type { RateLimitConfig } from "./config"; // Reserved for future use
