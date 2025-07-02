/**
 * Amazon DSP (Demand Side Platform) API types
 * Following AI SDK patterns for consistency
 */

// DSPConfig is now imported from types/config.ts

/**
 * DSP Campaign types
 */
export type DSPCampaignType = "DISPLAY" | "VIDEO" | "AUDIO" | "OTT" | "MOBILE";
export type DSPCampaignStatus =
	| "ACTIVE"
	| "PAUSED"
	| "ARCHIVED"
	| "PENDING"
	| "REJECTED";
export type DSPBidStrategy = "AUTO" | "MANUAL" | "TARGET_CPA" | "TARGET_ROAS";
export type DSPOptimizationGoal =
	| "REACH"
	| "IMPRESSIONS"
	| "CLICKS"
	| "CONVERSIONS"
	| "VIDEO_VIEWS";

/**
 * DSP Creative types
 */
export type DSPCreativeType =
	| "DISPLAY_BANNER"
	| "VIDEO"
	| "AUDIO"
	| "RICH_MEDIA";
export type DSPCreativeFormat =
	| "BANNER"
	| "INTERSTITIAL"
	| "NATIVE"
	| "VIDEO_INSTREAM"
	| "VIDEO_OUTSTREAM";
export type DSPCreativeStatus =
	| "ACTIVE"
	| "INACTIVE"
	| "PENDING_REVIEW"
	| "REJECTED";

/**
 * DSP Audience types
 */
export type DSPAudienceType =
	| "CUSTOM"
	| "LOOKALIKE"
	| "AMAZON_AUDIENCES"
	| "DEMOGRAPHIC"
	| "BEHAVIORAL";
export type DSPAudienceStatus = "ACTIVE" | "INACTIVE" | "BUILDING" | "READY";

/**
 * DSP Targeting types
 */
export interface DSPGeographicTargeting {
	countries?: string[];
	regions?: string[];
	metros?: string[];
	postalCodes?: string[];
	excludeCountries?: string[];
	excludeRegions?: string[];
}

export interface DSPDemographicTargeting {
	ageRanges?: Array<{
		min: number;
		max: number;
	}>;
	genders?: ("MALE" | "FEMALE" | "UNKNOWN")[];
	householdIncomes?: ("LOW" | "MEDIUM" | "HIGH")[];
	education?: ("HIGH_SCHOOL" | "COLLEGE" | "GRADUATE")[];
}

export interface DSPDeviceTargeting {
	deviceTypes?: ("DESKTOP" | "MOBILE" | "TABLET" | "TV" | "GAMING_CONSOLE")[];
	operatingSystems?: ("IOS" | "ANDROID" | "WINDOWS" | "MACOS" | "TVOS")[];
	browsers?: string[];
	connectionTypes?: ("WIFI" | "CELLULAR" | "BROADBAND")[];
}

export interface DSPContextualTargeting {
	categories?: string[];
	keywords?: string[];
	topics?: string[];
	excludeCategories?: string[];
	excludeKeywords?: string[];
}

export interface DSPAudienceTargeting {
	includeAudiences?: string[];
	excludeAudiences?: string[];
	customAudiences?: string[];
	lookalikeSeed?: string[];
}

/**
 * DSP Campaign interface
 */
export interface DSPCampaign {
	campaignId: string;
	name: string;
	advertiserId: string;
	type: DSPCampaignType;
	status: DSPCampaignStatus;
	bidStrategy: DSPBidStrategy;
	optimizationGoal: DSPOptimizationGoal;
	budget: {
		type: "DAILY" | "LIFETIME";
		amount: number;
		currency: string;
		pacing?: "STANDARD" | "ACCELERATED";
	};
	schedule: {
		startDate: string;
		endDate?: string;
		timezone: string;
		dayParting?: Array<{
			dayOfWeek: number;
			startHour: number;
			endHour: number;
		}>;
	};
	targeting: {
		geographic?: DSPGeographicTargeting;
		demographic?: DSPDemographicTargeting;
		device?: DSPDeviceTargeting;
		contextual?: DSPContextualTargeting;
		audience?: DSPAudienceTargeting;
	};
	frequencyCap?: {
		impressions: number;
		period: "HOUR" | "DAY" | "WEEK" | "MONTH" | "LIFETIME";
	};
	createdDate: string;
	lastModifiedDate: string;
}

/**
 * DSP Line Item interface
 */
export interface DSPLineItem {
	lineItemId: string;
	campaignId: string;
	name: string;
	status: DSPCampaignStatus;
	type: "STANDARD" | "PREFERRED_DEAL" | "PRIVATE_AUCTION";
	budget: {
		amount: number;
		currency: string;
	};
	bidding: {
		strategy: DSPBidStrategy;
		maxBid?: number;
		targetCPA?: number;
		targetROAS?: number;
	};
	inventory: {
		supply: ("AMAZON_O_AND_O" | "AMAZON_PUBLISHER_SERVICES" | "THIRD_PARTY")[];
		placements?: string[];
		apps?: string[];
		websites?: string[];
		excludePlacements?: string[];
	};
	createdDate: string;
	lastModifiedDate: string;
}

/**
 * DSP Creative interface
 */
export interface DSPCreative {
	creativeId: string;
	name: string;
	advertiserId: string;
	type: DSPCreativeType;
	format: DSPCreativeFormat;
	status: DSPCreativeStatus;
	dimensions: {
		width: number;
		height: number;
	};
	assets: Array<{
		type: "IMAGE" | "VIDEO" | "AUDIO" | "HTML";
		url: string;
		duration?: number;
		size?: number;
		mimeType: string;
	}>;
	clickThroughUrl?: string;
	impressionTrackingUrls?: string[];
	viewabilityTrackingUrls?: string[];
	createdDate: string;
	lastModifiedDate: string;
}

/**
 * DSP Audience interface
 */
export interface DSPAudience {
	audienceId: string;
	name: string;
	advertiserId: string;
	type: DSPAudienceType;
	status: DSPAudienceStatus;
	size?: number;
	description?: string;
	definition: {
		rules?: Array<{
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
		pixelIds?: string[];
		conversionEvents?: string[];
		lookalikeConfig?: {
			seedAudienceId: string;
			similarity: "NARROW" | "BALANCED" | "BROAD";
			targetCountries: string[];
		};
	};
	retentionPeriod?: number;
	createdDate: string;
	lastModifiedDate: string;
}

/**
 * DSP Report types
 */
export type DSPReportType =
	| "CAMPAIGN_PERFORMANCE"
	| "LINE_ITEM_PERFORMANCE"
	| "CREATIVE_PERFORMANCE"
	| "AUDIENCE_PERFORMANCE"
	| "INVENTORY_PERFORMANCE"
	| "CONVERSION_ATTRIBUTION"
	| "BRAND_METRICS"
	| "VIEWABILITY";

export type DSPReportDimension =
	| "CAMPAIGN"
	| "LINE_ITEM"
	| "CREATIVE"
	| "AUDIENCE"
	| "PLACEMENT"
	| "DEVICE"
	| "GEOGRAPHY"
	| "DATE"
	| "HOUR"
	| "AGE"
	| "GENDER";

export type DSPReportMetric =
	| "IMPRESSIONS"
	| "CLICKS"
	| "SPEND"
	| "CTR"
	| "CPC"
	| "CPM"
	| "CONVERSIONS"
	| "CONVERSION_RATE"
	| "CPA"
	| "ROAS"
	| "VIEWABLE_IMPRESSIONS"
	| "VIEWABILITY_RATE"
	| "VIDEO_COMPLETIONS"
	| "VIDEO_COMPLETION_RATE"
	| "BRAND_AWARENESS_LIFT"
	| "PURCHASE_INTENT_LIFT";

/**
 * DSP Report request interface
 */
export interface DSPReportRequest {
	reportType: DSPReportType;
	startDate: string;
	endDate: string;
	dimensions: DSPReportDimension[];
	metrics: DSPReportMetric[];
	filters?: Array<{
		dimension: DSPReportDimension;
		values: string[];
	}>;
	timeZone?: string;
	format?: "JSON" | "CSV";
}

/**
 * DSP Report response interface
 */
export interface DSPReportResponse {
	reportId: string;
	status: "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED";
	downloadUrl?: string;
	expirationDate?: string;
	reportData?: {
		headers: string[];
		rows: Array<Array<string | number>>;
		totalRows: number;
	};
	requestedDate: string;
	completedDate?: string;
}

/**
 * DSP Performance metrics interface
 */
export interface DSPPerformanceMetrics {
	impressions: number;
	clicks: number;
	spend: number;
	ctr: number;
	cpc: number;
	cpm: number;
	conversions?: number;
	conversionRate?: number;
	cpa?: number;
	roas?: number;
	viewableImpressions?: number;
	viewabilityRate?: number;
	videoCompletions?: number;
	videoCompletionRate?: number;
	brandAwarenessLift?: number;
	purchaseIntentLift?: number;
}

/**
 * DSP Campaign creation request
 */
export interface CreateDSPCampaignRequest {
	name: string;
	type: DSPCampaignType;
	bidStrategy: DSPBidStrategy;
	optimizationGoal: DSPOptimizationGoal;
	budget: DSPCampaign["budget"];
	schedule: DSPCampaign["schedule"];
	targeting?: DSPCampaign["targeting"];
	frequencyCap?: DSPCampaign["frequencyCap"];
}

/**
 * DSP Campaign update request
 */
export interface UpdateDSPCampaignRequest {
	name?: string;
	status?: DSPCampaignStatus;
	budget?: Partial<DSPCampaign["budget"]>;
	schedule?: Partial<DSPCampaign["schedule"]>;
	targeting?: Partial<DSPCampaign["targeting"]>;
	frequencyCap?: DSPCampaign["frequencyCap"];
}

/**
 * DSP Line Item creation request
 */
export interface CreateDSPLineItemRequest {
	campaignId: string;
	name: string;
	type: DSPLineItem["type"];
	budget: DSPLineItem["budget"];
	bidding: DSPLineItem["bidding"];
	inventory: DSPLineItem["inventory"];
}

/**
 * DSP Creative upload request
 */
export interface CreateDSPCreativeRequest {
	name: string;
	type: DSPCreativeType;
	format: DSPCreativeFormat;
	dimensions: DSPCreative["dimensions"];
	assets: DSPCreative["assets"];
	clickThroughUrl?: string;
	impressionTrackingUrls?: string[];
}

/**
 * DSP Audience creation request
 */
export interface CreateDSPAudienceRequest {
	name: string;
	type: DSPAudienceType;
	description?: string;
	definition: DSPAudience["definition"];
	retentionPeriod?: number;
}

/**
 * DSP API responses
 */
export interface DSPCampaignsResponse {
	campaigns: DSPCampaign[];
	totalCount: number;
	nextToken?: string;
}

export interface DSPLineItemsResponse {
	lineItems: DSPLineItem[];
	totalCount: number;
	nextToken?: string;
}

export interface DSPCreativesResponse {
	creatives: DSPCreative[];
	totalCount: number;
	nextToken?: string;
}

export interface DSPAudiencesResponse {
	audiences: DSPAudience[];
	totalCount: number;
	nextToken?: string;
}

export interface DSPReportsResponse {
	reports: DSPReportResponse[];
	totalCount: number;
	nextToken?: string;
}

/**
 * DSP Error types
 */
export interface DSPError {
	code: string;
	message: string;
	details?: Record<string, any>;
}

export interface DSPErrorResponse {
	errors: DSPError[];
	requestId: string;
}
