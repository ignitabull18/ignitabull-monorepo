/**
 * Amazon Sponsored Display Advanced Features
 * Enhanced types for Sponsored Display campaigns
 */

import type { MoneyAmount } from "./common";

/**
 * Sponsored Display targeting types
 */
export type SponsoredDisplayTargetingType =
	| "CONTEXTUAL"
	| "AUDIENCES"
	| "VIEWS_REMARKETING"
	| "PRODUCT_TARGETING";

/**
 * Audience types for Sponsored Display
 */
export type SponsoredDisplayAudienceType =
	| "AMAZON_AUDIENCES" // Pre-built Amazon audiences
	| "REMARKETING" // Your brand's audiences
	| "LOOKALIKE" // Lookalike audiences
	| "CUSTOM"; // Custom audiences

/**
 * Creative types for Sponsored Display
 */
export type SponsoredDisplayCreativeType =
	| "STANDARD"
	| "VIDEO"
	| "CUSTOM_IMAGE"
	| "BRAND_LOGO"
	| "LIFESTYLE_IMAGE";

/**
 * Optimization goals
 */
export type SponsoredDisplayOptimizationGoal =
	| "CONVERSIONS"
	| "REACH"
	| "PAGE_VISITS"
	| "BRAND_AWARENESS"
	| "VIDEO_VIEWS";

/**
 * Advanced audience targeting
 */
export interface SponsoredDisplayAudienceTargeting {
	audienceType: SponsoredDisplayAudienceType;
	audienceId?: string;

	// Amazon Audiences
	amazonAudiences?: {
		inMarket?: string[]; // In-market audiences
		lifestyle?: string[]; // Lifestyle audiences
		interests?: string[]; // Interest audiences
		lifeEvents?: string[]; // Life events audiences
	};

	// Remarketing
	remarketing?: {
		lookbackWindow: number; // Days
		includeViewers: boolean;
		includePurchasers: boolean;
		excludePurchasers: boolean;
		asinList?: string[];
		brandList?: string[];
		categoryList?: string[];
	};

	// Lookalike
	lookalike?: {
		seedAudienceId: string;
		similarity: "NARROW" | "BALANCED" | "BROAD";
		targetCountries?: string[];
	};

	// Custom audiences
	custom?: {
		audienceName: string;
		rules: Array<{
			field: string;
			operator:
				| "EQUALS"
				| "NOT_EQUALS"
				| "CONTAINS"
				| "NOT_CONTAINS"
				| "IN"
				| "NOT_IN";
			values: string[];
		}>;
	};
}

/**
 * Contextual targeting options
 */
export interface SponsoredDisplayContextualTargeting {
	// Product targeting
	products?: {
		asins?: string[];
		categories?: string[];
		brands?: string[];
		priceRange?: {
			min: number;
			max: number;
		};
		starRating?: {
			min: number;
			max: number;
		};
	};

	// Category targeting
	categories?: {
		include: string[];
		exclude?: string[];
		refinements?: Record<string, string[]>;
	};

	// Competitor targeting
	competitors?: {
		competitorAsins?: string[];
		competitorBrands?: string[];
		targetSimilarProducts: boolean;
	};
}

/**
 * Creative assets for Sponsored Display
 */
export interface SponsoredDisplayCreativeAssets {
	type: SponsoredDisplayCreativeType;

	// Standard creative
	standard?: {
		headline: string;
		brandLogo?: string;
		customImage?: string;
		brandName: string;
	};

	// Video creative
	video?: {
		videoUrl: string;
		thumbnailUrl: string;
		duration: number;
		aspectRatio: "16:9" | "9:16" | "1:1";
		callToAction?: string;
	};

	// Custom images
	customImages?: Array<{
		imageUrl: string;
		size: string;
		altText?: string;
	}>;

	// Lifestyle images
	lifestyleImages?: Array<{
		imageUrl: string;
		productPosition: { x: number; y: number };
		caption?: string;
	}>;
}

/**
 * Enhanced Sponsored Display campaign
 */
export interface EnhancedSponsoredDisplayCampaign {
	campaignId: string;
	name: string;
	campaignType: "sponsoredDisplay";
	state: "enabled" | "paused" | "archived";

	// Enhanced targeting
	targetingType: SponsoredDisplayTargetingType;
	audienceTargeting?: SponsoredDisplayAudienceTargeting;
	contextualTargeting?: SponsoredDisplayContextualTargeting;

	// Budget and bidding
	budget: {
		budgetType: "daily" | "lifetime";
		budget: MoneyAmount;
		endDate?: string;
	};

	bidding: {
		strategy:
			| "LEGACY_FOR_SALES"
			| "AUTO_FOR_SALES"
			| "MANUAL"
			| "ENHANCED_AUTO";
		optimizationGoal: SponsoredDisplayOptimizationGoal;
		bidOptimization?: {
			enabled: boolean;
			targetAcos?: number;
			targetRoas?: number;
		};
	};

	// Creative configuration
	creative: {
		assets: SponsoredDisplayCreativeAssets;
		landingPage: "DETAIL_PAGE" | "STORE" | "CUSTOM_URL";
		customUrl?: string;
	};

	// Advanced settings
	settings: {
		frequencyCap?: {
			impressions: number;
			period: "DAY" | "WEEK" | "MONTH";
		};
		dayparting?: Array<{
			dayOfWeek: number;
			startHour: number;
			endHour: number;
			bidAdjustment?: number;
		}>;
		deviceTargeting?: {
			desktop: boolean;
			mobile: boolean;
			tablet: boolean;
			tv?: boolean;
		};
		placementOptimization?: {
			productPages: boolean;
			searchResults: boolean;
			offAmazon: boolean;
			amazonHomepage?: boolean;
		};
	};

	// Performance tracking
	performanceGoals?: {
		targetCtr?: number;
		targetCvr?: number;
		targetCpc?: number;
		budgetUtilization?: number;
	};

	createdDate: string;
	lastUpdatedDate: string;
}

/**
 * Sponsored Display ad group
 */
export interface SponsoredDisplayAdGroup {
	adGroupId: string;
	campaignId: string;
	name: string;
	state: "enabled" | "paused" | "archived";
	defaultBid: MoneyAmount;

	// Targeting refinements
	targetingRefinements?: {
		ageRange?: { min: number; max: number };
		gender?: "MALE" | "FEMALE" | "UNKNOWN";
		household?: {
			income?: "LOW" | "MEDIUM" | "HIGH";
			size?: "1" | "2" | "3" | "4+";
			presence_of_children?: boolean;
		};
		geographic?: {
			include?: string[]; // ZIP codes, cities, regions
			exclude?: string[];
			radius?: {
				center: { lat: number; lon: number };
				distance: number;
				unit: "MILES" | "KILOMETERS";
			};
		};
	};

	// Negative targeting
	negativeTargeting?: {
		asins?: string[];
		brands?: string[];
		categories?: string[];
	};
}

/**
 * Sponsored Display metrics
 */
export interface SponsoredDisplayMetrics {
	// Standard metrics
	impressions: number;
	clicks: number;
	cost: MoneyAmount;
	ctr: number;
	cpc: MoneyAmount;

	// Display-specific metrics
	viewableImpressions: number;
	viewabilityRate: number;
	vctr: number; // Viewable CTR

	// Conversion metrics
	purchases: number;
	purchasesNewToBrand: number;
	sales: MoneyAmount;
	salesNewToBrand: MoneyAmount;
	acos: number;
	roas: number;

	// Brand metrics
	detailPageViews: number;
	detailPageViewRate: number;
	brandSearches: number;
	brandSearchRate: number;

	// Video metrics (if applicable)
	videoViews?: number;
	videoCompletions?: number;
	videoCompletionRate?: number;
	videoFirstQuartileViews?: number;
	videoMidpointViews?: number;
	videoThirdQuartileViews?: number;

	// Attribution metrics
	attributedConversions14d: number;
	attributedSales14d: MoneyAmount;
	attributedUnitsOrdered14d: number;
}

/**
 * Sponsored Display report types
 */
export type SponsoredDisplayReportType =
	| "CAMPAIGN_PERFORMANCE"
	| "ADGROUP_PERFORMANCE"
	| "TARGETING_PERFORMANCE"
	| "CREATIVE_PERFORMANCE"
	| "AUDIENCE_PERFORMANCE"
	| "PLACEMENT_PERFORMANCE"
	| "PRODUCT_TARGETING"
	| "PURCHASED_PRODUCT";

/**
 * Enhanced report request for Sponsored Display
 */
export interface SponsoredDisplayReportRequest {
	reportType: SponsoredDisplayReportType;
	startDate: string;
	endDate: string;

	metrics: Array<keyof SponsoredDisplayMetrics>;

	dimensions?: Array<
		| "DATE"
		| "CAMPAIGN"
		| "AD_GROUP"
		| "TARGETING"
		| "CREATIVE"
		| "PLACEMENT"
		| "DEVICE"
		| "AUDIENCE_TYPE"
		| "PRODUCT"
	>;

	filters?: {
		campaignIds?: string[];
		adGroupIds?: string[];
		targetingTypes?: SponsoredDisplayTargetingType[];
		creativeTypes?: SponsoredDisplayCreativeType[];
	};

	segment?: "PLACEMENT" | "DEVICE" | "AGE" | "GENDER";
}

/**
 * Bulk operations for Sponsored Display
 */
export interface SponsoredDisplayBulkOperation {
	operationType: "CREATE" | "UPDATE" | "DELETE";
	recordType:
		| "CAMPAIGN"
		| "AD_GROUP"
		| "TARGET"
		| "NEGATIVE_TARGET"
		| "CREATIVE";

	campaign?: Partial<EnhancedSponsoredDisplayCampaign>;
	adGroup?: Partial<SponsoredDisplayAdGroup>;
	target?: {
		adGroupId: string;
		targetType: "ASIN" | "CATEGORY" | "AUDIENCE" | "CONTEXTUAL";
		value: string;
		bid?: MoneyAmount;
	};
	negativeTarget?: {
		adGroupId: string;
		targetType: "ASIN" | "BRAND" | "CATEGORY";
		value: string;
	};
	creative?: {
		adGroupId: string;
		assets: SponsoredDisplayCreativeAssets;
	};
}

/**
 * Sponsored Display optimization suggestions
 */
export interface SponsoredDisplayOptimizationSuggestion {
	suggestionType:
		| "AUDIENCE_EXPANSION"
		| "CREATIVE_REFRESH"
		| "BID_OPTIMIZATION"
		| "TARGETING_REFINEMENT"
		| "BUDGET_INCREASE"
		| "PLACEMENT_ADJUSTMENT";

	priority: "HIGH" | "MEDIUM" | "LOW";

	description: string;

	recommendation: {
		action: string;
		expectedImpact: {
			metric: string;
			currentValue: number;
			projectedValue: number;
			percentageChange: number;
		};
		implementation?: any; // Specific implementation details
	};

	rationale: string[];
}
