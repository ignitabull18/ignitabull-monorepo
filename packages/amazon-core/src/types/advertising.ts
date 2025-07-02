/**
 * Amazon Advertising API specific types and interfaces
 */

/**
 * Advertising Profile interfaces
 */
export interface AdvertisingProfile {
	profileId: string;
	countryCode: string;
	currencyCode: string;
	dailyBudget?: number;
	timezone: string;
	accountInfo?: {
		marketplaceStringId: string;
		id: string;
		type: "seller" | "vendor";
		name?: string;
		subType?: string;
		validPaymentMethod?: boolean;
	};
}

/**
 * Campaign interfaces
 */
export interface AdvertisingCampaign {
	campaignId: string;
	name: string;
	campaignType: "sponsoredProducts" | "sponsoredBrands" | "sponsoredDisplay";
	targetingType: "manual" | "auto";
	state: "enabled" | "paused" | "archived";
	dailyBudget: number;
	startDate: string;
	endDate?: string;
	premiumBidAdjustment?: boolean;
	portfolio?: {
		portfolioId: string;
		name: string;
	};
	tags?: Record<string, string>;
	bidding?: {
		strategy: "legacyForSales" | "autoForSales" | "manual";
		adjustments?: Array<{
			predicate: string;
			percentage: number;
		}>;
	};
	servingStatus?: string;
	creationDate?: string;
	lastUpdatedDate?: string;
}

export interface CreateCampaignRequest {
	name: string;
	campaignType: "sponsoredProducts" | "sponsoredBrands" | "sponsoredDisplay";
	targetingType: "manual" | "auto";
	state?: "enabled" | "paused";
	dailyBudget: number;
	startDate: string;
	endDate?: string;
	premiumBidAdjustment?: boolean;
	portfolioId?: string;
	tags?: Record<string, string>;
	bidding?: {
		strategy: "legacyForSales" | "autoForSales" | "manual";
		adjustments?: Array<{
			predicate: string;
			percentage: number;
		}>;
	};
}

export interface UpdateCampaignRequest {
	name?: string;
	state?: "enabled" | "paused" | "archived";
	dailyBudget?: number;
	endDate?: string;
	premiumBidAdjustment?: boolean;
	portfolioId?: string;
	tags?: Record<string, string>;
	bidding?: {
		strategy: "legacyForSales" | "autoForSales" | "manual";
		adjustments?: Array<{
			predicate: string;
			percentage: number;
		}>;
	};
}

export interface AdvertisingCampaignResponse {
	campaigns: AdvertisingCampaign[];
	totalCount: number;
}

/**
 * Ad Group interfaces
 */
export interface AdvertisingAdGroup {
	adGroupId: string;
	name: string;
	campaignId: string;
	defaultBid: number;
	state: "enabled" | "paused" | "archived";
	servingStatus?: string;
	creationDate?: string;
	lastUpdatedDate?: string;
	tags?: Record<string, string>;
}

export interface CreateAdGroupRequest {
	name: string;
	campaignId: string;
	defaultBid: number;
	state?: "enabled" | "paused";
	tags?: Record<string, string>;
}

/**
 * Keyword interfaces
 */
export interface AdvertisingKeyword {
	keywordId: string;
	adGroupId: string;
	campaignId: string;
	keywordText: string;
	nativeLanguageKeyword?: string;
	matchType: "exact" | "phrase" | "broad";
	state: "enabled" | "paused" | "archived";
	bid?: number;
	servingStatus?: string;
	creationDate?: string;
	lastUpdatedDate?: string;
}

export interface CreateKeywordRequest {
	keywordText: string;
	campaignId: string;
	adGroupId: string;
	matchType: "exact" | "phrase" | "broad";
	state?: "enabled" | "paused";
	bid?: number;
}

export interface AdvertisingKeywordResponse {
	keywords: AdvertisingKeyword[];
	totalCount: number;
}

/**
 * Product Ad interfaces
 */
export interface AdvertisingProductAd {
	adId: string;
	campaignId: string;
	adGroupId: string;
	sku?: string;
	asin?: string;
	state: "enabled" | "paused" | "archived";
	servingStatus?: string;
	creationDate?: string;
	lastUpdatedDate?: string;
}

export interface CreateProductAdRequest {
	campaignId: string;
	adGroupId: string;
	sku?: string;
	asin?: string;
	state?: "enabled" | "paused";
}

/**
 * Negative Keyword interfaces
 */
export interface AdvertisingNegativeKeyword {
	keywordId: string;
	adGroupId?: string;
	campaignId: string;
	keywordText: string;
	matchType: "negativeExact" | "negativePhrase";
	state: "enabled" | "paused" | "archived";
	servingStatus?: string;
	creationDate?: string;
	lastUpdatedDate?: string;
}

/**
 * Portfolio interfaces
 */
export interface AdvertisingPortfolio {
	portfolioId: string;
	name: string;
	policy: "dateRange" | "monthlyRecurring";
	state: "enabled" | "paused" | "archived";
	inBudget?: boolean;
	creationDate?: string;
	lastUpdatedDate?: string;
	servingStatus?: string;
	budget?: {
		amount: number;
		currencyCode: string;
		policy: "dateRange" | "monthlyRecurring";
		startDate?: string;
		endDate?: string;
	};
}

/**
 * Targeting interfaces
 */
export interface AdvertisingTarget {
	targetId: string;
	adGroupId: string;
	campaignId: string;
	state: "enabled" | "paused" | "archived";
	expression: Array<{
		type:
			| "asinCategorySameAs"
			| "asinBrandSameAs"
			| "asinPriceLessThan"
			| "asinPriceBetween"
			| "asinPriceGreaterThan"
			| "asinReviewRatingLessThan"
			| "asinReviewRatingBetween"
			| "asinReviewRatingGreaterThan"
			| "asinSameAs"
			| "queryBroadMatches"
			| "queryExactMatches"
			| "queryPhraseMatches";
		value?: string | number;
	}>;
	expressionType: "manual" | "auto";
	bid?: number;
	servingStatus?: string;
	creationDate?: string;
	lastUpdatedDate?: string;
}

/**
 * Report interfaces
 */
export interface AdvertisingReport {
	reportId: string;
	recordType:
		| "campaigns"
		| "adGroups"
		| "keywords"
		| "productAds"
		| "targets"
		| "asins"
		| "searchTerms";
	status: "IN_PROGRESS" | "SUCCESS" | "FAILURE";
	statusDetails?: string;
	location?: string;
	fileSize?: number;
	creationDate: string;
	requestTime?: string;
	dataStartTime?: string;
	dataEndTime?: string;
	profile?: {
		profileId: string;
	};
}

export interface ReportRequest {
	recordType:
		| "campaigns"
		| "adGroups"
		| "keywords"
		| "productAds"
		| "targets"
		| "asins"
		| "searchTerms";
	reportDate: string;
	metrics?: string;
	segment?: "query" | "placement";
	creativeType?: string;
	format?: "GZIP_JSON";
	groupBy?: string[];
	timeUnit?: "DAILY" | "WEEKLY" | "MONTHLY";
	filters?: Array<{
		field: string;
		values: string[];
	}>;
}

/**
 * Performance metrics interfaces
 */
export interface AdvertisingMetrics {
	impressions: number;
	clicks: number;
	cost: number;
	sales: number;
	orders: number;
	units: number;
	conversions: number;
	ctr: number; // Click-through rate
	cpc: number; // Cost per click
	cpm: number; // Cost per mille (thousand impressions)
	acos: number; // Advertising cost of sales
	roas: number; // Return on ad spend
	cr: number; // Conversion rate
}

export interface CampaignMetrics extends AdvertisingMetrics {
	campaignId: string;
	campaignName: string;
	campaignType: string;
	targetingType: string;
	campaignStatus: string;
	campaignBudget: number;
	campaignBudgetType: string;
}

export interface AdGroupMetrics extends AdvertisingMetrics {
	adGroupId: string;
	adGroupName: string;
	campaignId: string;
	campaignName: string;
	defaultBid: number;
}

export interface KeywordMetrics extends AdvertisingMetrics {
	keywordId: string;
	keywordText: string;
	matchType: string;
	adGroupId: string;
	adGroupName: string;
	campaignId: string;
	campaignName: string;
	bid: number;
	searchTerm?: string;
}

export interface ProductAdMetrics extends AdvertisingMetrics {
	adId: string;
	sku?: string;
	asin?: string;
	adGroupId: string;
	adGroupName: string;
	campaignId: string;
	campaignName: string;
}

/**
 * Search Term Report interfaces
 */
export interface SearchTermReport {
	campaignId: string;
	campaignName: string;
	adGroupId: string;
	adGroupName: string;
	keywordId?: string;
	keywordText?: string;
	matchType?: string;
	searchTerm: string;
	targetId?: string;
	impressions: number;
	clicks: number;
	cost: number;
	sales: number;
	orders: number;
	units: number;
	acos: number;
	roas: number;
	ctr: number;
	cpc: number;
	cr: number;
}

/**
 * ASIN Report interfaces
 */
export interface ASINReport {
	campaignId: string;
	campaignName: string;
	adGroupId: string;
	adGroupName: string;
	asin: string;
	sku?: string;
	currency: string;
	impressions: number;
	clicks: number;
	cost: number;
	sales: number;
	orders: number;
	units: number;
	acos: number;
	roas: number;
	ctr: number;
	cpc: number;
	cr: number;
}

/**
 * Bid Recommendation interfaces
 */
export interface BidRecommendation {
	keywordText: string;
	matchType: "exact" | "phrase" | "broad";
	adGroupId: string;
	suggestedBid: {
		rangeStart: number;
		rangeEnd: number;
		suggested: number;
	};
}

export interface BidRecommendationRequest {
	adGroupId: string;
	keywords: Array<{
		keywordText: string;
		matchType: "exact" | "phrase" | "broad";
	}>;
}

/**
 * Keyword Suggestion interfaces
 */
export interface KeywordSuggestion {
	keywordText: string;
	matchType: "exact" | "phrase" | "broad";
	bid: number;
	state: "enabled";
}

export interface KeywordSuggestionRequest {
	adGroupId: string;
	maxNumSuggestions?: number;
	suggestBids?: "yes" | "no";
	adStateFilter?: "enabled";
}

/**
 * Snapshot interfaces
 */
export interface AdvertisingSnapshot {
	snapshotId: string;
	recordType:
		| "campaigns"
		| "adGroups"
		| "keywords"
		| "productAds"
		| "portfolios";
	status: "IN_PROGRESS" | "SUCCESS" | "FAILURE";
	statusDetails?: string;
	location?: string;
	fileSize?: number;
	creationDate: string;
}

export interface SnapshotRequest {
	recordType:
		| "campaigns"
		| "adGroups"
		| "keywords"
		| "productAds"
		| "portfolios";
	stateFilter?: "enabled" | "paused" | "archived";
	campaignType?: "sponsoredProducts" | "sponsoredBrands" | "sponsoredDisplay";
}

/**
 * Bulk Operations interfaces
 */
export interface BulkOperation {
	requestId: string;
	recordType: "campaigns" | "adGroups" | "keywords" | "productAds";
	operation: "CREATE" | "UPDATE" | "DELETE";
	status: "IN_PROGRESS" | "SUCCESS" | "FAILURE";
	statusDetails?: string;
	location?: string;
	fileSize?: number;
	creationDate: string;
}

/**
 * Common response wrapper
 */
export interface AdvertisingResponse<T> {
	data?: T;
	errors?: Array<{
		code: string;
		message: string;
		details?: string;
	}>;
}

/**
 * Error response
 */
export interface AdvertisingError {
	code: string;
	message: string;
	details?: string;
}

/**
 * Campaign Type enum
 */
export type AdvertisingCampaignType =
	| "sponsoredProducts"
	| "sponsoredBrands"
	| "sponsoredDisplay";

/**
 * Campaign Performance interface
 */
export interface CampaignPerformance {
	campaignId: string;
	impressions: number;
	clicks: number;
	cost: number;
	sales: number;
	orders: number;
	ctr: number; // Click-through rate
	cpc: number; // Cost per click
	acos: number; // Advertising cost of sales
	roas: number; // Return on ad spend
	conversionRate: number;
	period: {
		startDate: string;
		endDate: string;
	};
}
