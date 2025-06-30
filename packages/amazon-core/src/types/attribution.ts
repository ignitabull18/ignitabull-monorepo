/**
 * Amazon Attribution API Types
 * For tracking off-Amazon marketing campaigns and their impact on Amazon sales
 */

export interface AttributionReport {
	reportId: string;
	advertiserId: string;
	campaignId: string;
	adGroupId?: string;
	creativeId?: string;
	productAsin: string;
	reportingPeriod: {
		startDate: string;
		endDate: string;
	};
	metrics: AttributionMetrics;
	breakdown: AttributionBreakdown[];
	generatedAt: string;
}

export interface AttributionMetrics {
	totalClicks: number;
	totalDetailPageViews: number;
	totalPurchases: number;
	totalSales: number;
	totalUnitsOrdered: number;
	clickThroughRate: number;
	detailPageViewRate: number;
	purchaseRate: number;
	averageOrderValue: number;
	returnOnAdSpend: number;
	costPerClick?: number;
	costPerDetailPageView?: number;
	costPerPurchase?: number;
}

export interface AttributionBreakdown {
	date: string;
	clicks: number;
	detailPageViews: number;
	purchases: number;
	sales: number;
	unitsOrdered: number;
	newToBrandPurchases: number;
	newToBrandSales: number;
	newToBrandUnitsOrdered: number;
	newToBrandPercentage: number;
}

export interface AttributionCampaign {
	campaignId: string;
	campaignName: string;
	advertiserId: string;
	advertiserName: string;
	campaignType: AttributionCampaignType;
	status: AttributionCampaignStatus;
	createdDate: string;
	lastModifiedDate: string;
	startDate: string;
	endDate?: string;
	budget?: number;
	dailyBudget?: number;
	targetingType: string;
	bidStrategy: string;
	performance: AttributionCampaignPerformance;
	products: AttributionProduct[];
}

export interface AttributionCampaignPerformance {
	impressions: number;
	clicks: number;
	spend: number;
	detailPageViews: number;
	purchases: number;
	sales: number;
	unitsOrdered: number;
	clickThroughRate: number;
	costPerClick: number;
	returnOnAdSpend: number;
	attributionRate: number;
}

export interface AttributionProduct {
	asin: string;
	title: string;
	category: string;
	price: number;
	isEligible: boolean;
	attributionMetrics: {
		clicks: number;
		detailPageViews: number;
		purchases: number;
		sales: number;
		unitsOrdered: number;
		conversionRate: number;
	};
}

export interface AttributionAudience {
	audienceId: string;
	audienceName: string;
	description: string;
	audienceType: AttributionAudienceType;
	size: number;
	status: "ACTIVE" | "PAUSED" | "ARCHIVED";
	createdDate: string;
	targetingCriteria: {
		demographics?: DemographicCriteria;
		interests?: InterestCriteria[];
		behaviors?: BehaviorCriteria[];
		customCriteria?: CustomCriteria[];
	};
	performance: {
		reach: number;
		engagement: number;
		clickThroughRate: number;
		conversionRate: number;
		costPerEngagement: number;
	};
}

export interface DemographicCriteria {
	ageRange?: {
		min: number;
		max: number;
	};
	gender?: "MALE" | "FEMALE" | "ALL";
	location?: {
		countries?: string[];
		states?: string[];
		cities?: string[];
		zipcodes?: string[];
	};
	income?: {
		min?: number;
		max?: number;
	};
	education?: string[];
	maritalStatus?: string[];
}

export interface InterestCriteria {
	category: string;
	subcategory?: string;
	keywords: string[];
	excludeKeywords?: string[];
	affinityScore?: number;
}

export interface BehaviorCriteria {
	purchaseBehavior: {
		categories: string[];
		frequency: "FREQUENT" | "OCCASIONAL" | "RARE";
		recency: "RECENT" | "MODERATE" | "DISTANT";
		value: "HIGH" | "MEDIUM" | "LOW";
	};
	searchBehavior: {
		keywords: string[];
		intent: "RESEARCH" | "PURCHASE" | "COMPARISON";
		deviceUsage: "MOBILE" | "DESKTOP" | "TABLET" | "ALL";
	};
}

export interface CustomCriteria {
	name: string;
	description: string;
	rules: {
		field: string;
		operator:
			| "EQUALS"
			| "CONTAINS"
			| "GREATER_THAN"
			| "LESS_THAN"
			| "IN"
			| "NOT_IN";
		value: string | number | string[];
	}[];
}

export interface AttributionCreative {
	creativeId: string;
	creativeName: string;
	campaignId: string;
	creativeType: AttributionCreativeType;
	format: CreativeFormat;
	status: "ACTIVE" | "PAUSED" | "ARCHIVED";
	assets: CreativeAsset[];
	targeting: CreativeTargeting;
	performance: CreativePerformance;
	createdDate: string;
	lastModifiedDate: string;
}

export interface CreativeAsset {
	assetId: string;
	assetType: "IMAGE" | "VIDEO" | "TEXT" | "LOGO";
	url?: string;
	content?: string;
	dimensions?: {
		width: number;
		height: number;
	};
	fileSize?: number;
	duration?: number; // for video assets
}

export interface CreativeTargeting {
	placements: string[];
	devices: string[];
	operatingSystems?: string[];
	browsers?: string[];
	timeSlots?: string[];
	frequency?: {
		impressionsPerDay: number;
		impressionsPerWeek: number;
	};
}

export interface CreativePerformance {
	impressions: number;
	clicks: number;
	clickThroughRate: number;
	viewThroughRate: number;
	engagementRate: number;
	costPerClick: number;
	costPerImpression: number;
	qualityScore: number;
	relevanceScore: number;
}

export interface AttributionConversion {
	conversionId: string;
	campaignId: string;
	adGroupId?: string;
	creativeId?: string;
	productAsin: string;
	customerId: string;
	conversionType: AttributionConversionType;
	conversionValue: number;
	conversionDate: string;
	clickDate: string;
	viewDate?: string;
	timeLag: number; // hours between click and conversion
	touchpoints: AttributionTouchpoint[];
	attribution: {
		model: AttributionModel;
		creditAssignment: TouchpointCredit[];
	};
}

export interface AttributionTouchpoint {
	touchpointId: string;
	campaignId: string;
	creativeId: string;
	touchpointType: "CLICK" | "VIEW" | "ENGAGEMENT";
	timestamp: string;
	placement: string;
	device: string;
	position: number; // position in customer journey
}

export interface TouchpointCredit {
	touchpointId: string;
	creditPercentage: number;
	creditValue: number;
	model: AttributionModel;
}

export interface CrossChannelAnalysis {
	analysisId: string;
	advertiserId: string;
	reportingPeriod: {
		startDate: string;
		endDate: string;
	};
	channels: ChannelPerformance[];
	crossChannelMetrics: {
		totalReach: number;
		uniqueReach: number;
		frequencyDistribution: FrequencyBucket[];
		channelOverlap: ChannelOverlap[];
		incrementalImpact: IncrementalImpact[];
	};
	customerJourney: JourneyAnalysis;
	recommendations: CrossChannelRecommendation[];
}

export interface ChannelPerformance {
	channelName: string;
	channelType:
		| "SEARCH"
		| "DISPLAY"
		| "VIDEO"
		| "SOCIAL"
		| "STREAMING_TV"
		| "AUDIO"
		| "EMAIL";
	spend: number;
	impressions: number;
	clicks: number;
	detailPageViews: number;
	purchases: number;
	sales: number;
	unitsOrdered: number;
	newToBrandPercentage: number;
	customerLTV: number;
	efficiency: {
		costPerClick: number;
		costPerDetailPageView: number;
		costPerPurchase: number;
		returnOnAdSpend: number;
	};
}

export interface FrequencyBucket {
	frequency: number;
	reach: number;
	percentage: number;
}

export interface ChannelOverlap {
	channels: string[];
	overlapReach: number;
	overlapPercentage: number;
	incrementalReach: number;
}

export interface IncrementalImpact {
	testChannel: string;
	controlGroup: "EXPOSED" | "HOLDOUT";
	incrementalSales: number;
	incrementalUnits: number;
	incrementalPercentage: number;
	confidence: number;
	significance: number;
}

export interface JourneyAnalysis {
	averageJourneyLength: number;
	averageTimeLag: number;
	commonPaths: JourneyPath[];
	conversionFunnels: ConversionFunnel[];
	dropoffPoints: DropoffPoint[];
}

export interface JourneyPath {
	path: string[];
	frequency: number;
	conversionRate: number;
	averageValue: number;
}

export interface ConversionFunnel {
	stage: string;
	visitors: number;
	conversionRate: number;
	dropoffRate: number;
}

export interface DropoffPoint {
	stage: string;
	dropoffRate: number;
	reasons: string[];
	recommendations: string[];
}

export interface CrossChannelRecommendation {
	type:
		| "BUDGET_REALLOCATION"
		| "FREQUENCY_OPTIMIZATION"
		| "AUDIENCE_EXPANSION"
		| "CREATIVE_OPTIMIZATION";
	priority: "HIGH" | "MEDIUM" | "LOW";
	description: string;
	expectedImpact: {
		metric: string;
		improvement: number;
		confidence: number;
	};
	implementation: {
		effort: "LOW" | "MEDIUM" | "HIGH";
		timeline: string;
		requirements: string[];
	};
}

// Enums and Union Types
export type AttributionCampaignType =
	| "SEARCH"
	| "DISPLAY"
	| "VIDEO"
	| "SHOPPING"
	| "SOCIAL"
	| "STREAMING_TV"
	| "AUDIO"
	| "EMAIL"
	| "AFFILIATE"
	| "INFLUENCER";

export type AttributionCampaignStatus =
	| "ACTIVE"
	| "PAUSED"
	| "COMPLETED"
	| "ARCHIVED"
	| "DRAFT";

export type AttributionAudienceType =
	| "DEMOGRAPHIC"
	| "INTEREST"
	| "BEHAVIORAL"
	| "LOOKALIKE"
	| "CUSTOM"
	| "RETARGETING";

export type AttributionCreativeType =
	| "BANNER"
	| "VIDEO"
	| "NATIVE"
	| "SEARCH_AD"
	| "SOCIAL_POST"
	| "EMAIL"
	| "STREAMING_TV_AD"
	| "AUDIO_AD";

export type CreativeFormat =
	| "DISPLAY_BANNER"
	| "VIDEO_INSTREAM"
	| "VIDEO_OUTSTREAM"
	| "NATIVE_ARTICLE"
	| "NATIVE_FEED"
	| "SEARCH_TEXT"
	| "SEARCH_SHOPPING"
	| "SOCIAL_IMAGE"
	| "SOCIAL_VIDEO"
	| "SOCIAL_CAROUSEL"
	| "EMAIL_HTML"
	| "EMAIL_TEXT";

export type AttributionConversionType =
	| "PURCHASE"
	| "ADD_TO_CART"
	| "DETAIL_PAGE_VIEW"
	| "BRAND_SEARCH"
	| "SUBSCRIPTION"
	| "LEAD_GENERATION"
	| "APP_INSTALL"
	| "VIDEO_VIEW"
	| "ENGAGEMENT";

export type AttributionModel =
	| "FIRST_TOUCH"
	| "LAST_TOUCH"
	| "LINEAR"
	| "TIME_DECAY"
	| "POSITION_BASED"
	| "DATA_DRIVEN"
	| "ALGORITHMIC";

// Request/Response Types
export interface CreateAttributionCampaignRequest {
	campaignName: string;
	advertiserId: string;
	campaignType: AttributionCampaignType;
	startDate: string;
	endDate?: string;
	budget?: number;
	dailyBudget?: number;
	targetingType: string;
	bidStrategy: string;
	products: string[]; // ASINs
	audiences?: string[]; // audience IDs
	creatives?: string[]; // creative IDs
}

export interface UpdateAttributionCampaignRequest {
	campaignId: string;
	campaignName?: string;
	status?: AttributionCampaignStatus;
	budget?: number;
	dailyBudget?: number;
	endDate?: string;
	bidStrategy?: string;
	targetingType?: string;
}

export interface AttributionReportRequest {
	advertiserId: string;
	reportType:
		| "CAMPAIGN"
		| "PRODUCT"
		| "CREATIVE"
		| "AUDIENCE"
		| "CROSS_CHANNEL";
	reportingPeriod: {
		startDate: string;
		endDate: string;
	};
	granularity: "DAILY" | "WEEKLY" | "MONTHLY";
	groupBy?: string[];
	filters?: AttributionFilter[];
	metrics?: string[];
}

export interface AttributionFilter {
	field: string;
	operator:
		| "EQUALS"
		| "NOT_EQUALS"
		| "CONTAINS"
		| "NOT_CONTAINS"
		| "GREATER_THAN"
		| "LESS_THAN"
		| "IN"
		| "NOT_IN";
	value: string | number | string[];
}

export interface BulkAttributionOperationRequest {
	operationType: "CREATE" | "UPDATE" | "DELETE" | "PAUSE" | "RESUME";
	entityType: "CAMPAIGN" | "CREATIVE" | "AUDIENCE";
	entities: Array<{
		entityId?: string;
		data?: any;
	}>;
	validateOnly?: boolean;
}

export interface AttributionOptimizationSuggestion {
	suggestionId: string;
	campaignId: string;
	type: "BUDGET" | "TARGETING" | "CREATIVE" | "BIDDING" | "FREQUENCY";
	priority: "HIGH" | "MEDIUM" | "LOW";
	title: string;
	description: string;
	currentPerformance: {
		metric: string;
		value: number;
	};
	projectedImprovement: {
		metric: string;
		improvement: number;
		confidence: number;
	};
	implementation: {
		steps: string[];
		effort: "LOW" | "MEDIUM" | "HIGH";
		timeline: string;
		cost?: number;
	};
	risks: {
		risk: string;
		probability: number;
		impact: string;
	}[];
	createdAt: string;
	expiresAt: string;
}

// Configuration Types
export interface AttributionProviderConfig {
	apiUrl: string;
	apiVersion: string;
	region: string;
	advertiserId: string;
	accessToken: string;
	refreshToken?: string;
	clientId: string;
	clientSecret: string;
	rateLimits: {
		requestsPerSecond: number;
		requestsPerDay: number;
		burstLimit: number;
	};
	retryConfig: {
		maxRetries: number;
		backoffMultiplier: number;
		maxBackoffTime: number;
	};
	caching: {
		enabled: boolean;
		ttl: number;
		maxSize: number;
	};
}
