/**
 * Database types for Amazon Advanced APIs
 * These types correspond to the Supabase tables created in the migration
 */

export interface AmazonBrandAnalytics {
	id: string;
	organization_id: string;
	integration_id: string;
	report_type:
		| "market_basket"
		| "search_query_performance"
		| "repeat_purchase"
		| "demographics"
		| "traffic_by_page"
		| "item_comparison"
		| "alternate_purchase";
	marketplace_id: string;
	report_date: string; // Date as ISO string
	data: Record<string, any>;
	processed_at: string;
	insights: Record<string, any>;
	created_at: string;
	updated_at: string;
}

export interface AmazonDSPCampaign {
	id: string;
	organization_id: string;
	integration_id: string;
	campaign_id: string;
	advertiser_id: string;
	name: string;
	campaign_type:
		| "STANDARD_DISPLAY"
		| "VIDEO"
		| "AUDIO"
		| "MOBILE_APP"
		| "CROSS_DEVICE";
	status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
	budget_type?: "LIFETIME" | "DAILY";
	budget_amount?: number;
	currency: string;
	bid_strategy?: "CPC" | "CPM" | "VCPM" | "AUTOMATIC";
	targeting: Record<string, any>;
	audiences: any[];
	optimization_goal?:
		| "REACH"
		| "CONVERSIONS"
		| "VIEWABILITY"
		| "BRAND_AWARENESS"
		| "PURCHASE_RATE";
	kpi_goal: Record<string, any>;
	creatives: any[];
	start_date?: string;
	end_date?: string;
	external_data: Record<string, any>;
	created_at: string;
	updated_at: string;
}

export interface AmazonDSPPerformance {
	id: string;
	dsp_campaign_id: string;
	date: string;
	hour?: number;
	impressions: number;
	clicks: number;
	cost: number;
	conversions: number;
	viewable_impressions: number;
	ctr?: number;
	cvr?: number;
	cpc?: number;
	cpm?: number;
	vcpm?: number;
	roas?: number;
	reach: number;
	frequency: number;
	attributed_sales_14d?: number;
	attributed_units_14d?: number;
	attributed_conversions_14d?: number;
	created_at: string;
}

export interface AmazonSearchPerformance {
	id: string;
	organization_id: string;
	integration_id: string;
	asin: string;
	marketplace_id: string;
	date: string;
	search_query: string;
	impressions: number;
	clicks: number;
	click_through_rate?: number;
	conversion_rate?: number;
	purchase_rate?: number;
	revenue?: number;
	units_ordered: number;
	average_price?: number;
	search_frequency_rank?: number;
	relative_search_volume?: number;
	created_at: string;
}

export interface AmazonKeywordRanking {
	id: string;
	organization_id: string;
	integration_id: string;
	asin: string;
	keyword: string;
	marketplace_id: string;
	current_rank?: number;
	previous_rank?: number;
	rank_change?: number;
	is_organic: boolean;
	is_sponsored: boolean;
	competitor_count?: number;
	share_of_voice?: number;
	tracked_at: string;
	created_at: string;
	updated_at: string;
}

export interface AmazonListingQuality {
	id: string;
	organization_id: string;
	integration_id: string;
	asin: string;
	marketplace_id: string;
	overall_score?: number;
	title_score?: number;
	bullet_points_score?: number;
	description_score?: number;
	images_score?: number;
	keywords_score?: number;
	pricing_score?: number;
	reviews_score?: number;
	missing_keywords?: string[];
	keyword_density: Record<string, any>;
	content_gaps?: string[];
	category_average_score?: number;
	top_competitor_score?: number;
	market_position?: number;
	recommendations: any[];
	analyzed_at: string;
	created_at: string;
	updated_at: string;
}

export interface AmazonCompetitorTracking {
	id: string;
	organization_id: string;
	integration_id: string;
	our_asin: string;
	competitor_asin: string;
	marketplace_id: string;
	competitor_brand?: string;
	competitor_title?: string;
	shared_keywords?: string[];
	exclusive_keywords?: string[];
	overlap_score?: number;
	visibility_score_ours?: number;
	visibility_score_theirs?: number;
	threat_level?: "HIGH" | "MEDIUM" | "LOW";
	threat_reasons?: string[];
	our_price?: number;
	their_price?: number;
	price_difference_percent?: number;
	our_rating?: number;
	their_rating?: number;
	our_review_count?: number;
	their_review_count?: number;
	tracked_at: string;
	created_at: string;
	updated_at: string;
}

export interface AmazonSearchAnomaly {
	id: string;
	organization_id: string;
	integration_id: string;
	asin: string;
	marketplace_id: string;
	anomaly_type:
		| "TRAFFIC_DROP"
		| "RANKING_LOSS"
		| "CTR_DECLINE"
		| "COMPETITOR_SURGE"
		| "ALGORITHM_UPDATE"
		| "SEASONAL_SHIFT";
	severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
	detected_date: string;
	affected_keywords?: string[];
	impressions_change?: number;
	clicks_change?: number;
	revenue_change?: number;
	ranking_change?: number;
	possible_causes?: string[];
	recommended_actions?: string[];
	status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED";
	resolved_at?: string;
	resolution_notes?: string;
	created_at: string;
	updated_at: string;
}

export interface AmazonCampaignOptimization {
	id: string;
	organization_id: string;
	integration_id: string;
	campaign_id: string;
	campaign_type: string;
	optimization_type:
		| "BID_ADJUSTMENT"
		| "KEYWORD_HARVESTING"
		| "NEGATIVE_KEYWORDS"
		| "BUDGET_REALLOCATION"
		| "TARGETING_REFINEMENT"
		| "CREATIVE_REFRESH";
	current_metrics: Record<string, any>;
	recommendation: Record<string, any>;
	expected_impact: Record<string, any>;
	confidence_score?: number;
	status: "PENDING" | "APPROVED" | "APPLIED" | "REJECTED" | "REVERTED";
	applied_at?: string;
	applied_by?: string;
	actual_impact: Record<string, any>;
	success_metric?: number;
	created_at: string;
	updated_at: string;
}

export interface AmazonBrandIntelligenceReport {
	id: string;
	organization_id: string;
	integration_id: string;
	brand_name: string;
	marketplace_id: string;
	report_period: "WEEKLY" | "MONTHLY" | "QUARTERLY";
	period_start: string;
	period_end: string;
	market_share?: number;
	market_share_trend?: "GROWING" | "STABLE" | "DECLINING";
	top_competitors: any[];
	competitive_advantages?: string[];
	competitive_weaknesses?: string[];
	customer_segments: any[];
	purchase_patterns: Record<string, any>;
	brand_loyalty_score?: number;
	trending_keywords?: string[];
	emerging_categories?: string[];
	seasonal_patterns: Record<string, any>;
	growth_opportunities: any[];
	risk_factors: any[];
	action_items: any[];
	generated_at: string;
	created_at: string;
	updated_at: string;
}

// Helper types for database operations

export type CreateAmazonBrandAnalytics = Omit<
	AmazonBrandAnalytics,
	"id" | "created_at" | "updated_at"
>;
export type UpdateAmazonBrandAnalytics = Partial<
	Omit<AmazonBrandAnalytics, "id" | "created_at" | "updated_at">
>;

export type CreateAmazonDSPCampaign = Omit<
	AmazonDSPCampaign,
	"id" | "created_at" | "updated_at"
>;
export type UpdateAmazonDSPCampaign = Partial<
	Omit<AmazonDSPCampaign, "id" | "created_at" | "updated_at">
>;

export type CreateAmazonSearchPerformance = Omit<
	AmazonSearchPerformance,
	"id" | "created_at"
>;
export type UpdateAmazonSearchPerformance = Partial<
	Omit<AmazonSearchPerformance, "id" | "created_at">
>;

export type CreateAmazonKeywordRanking = Omit<
	AmazonKeywordRanking,
	"id" | "created_at" | "updated_at"
>;
export type UpdateAmazonKeywordRanking = Partial<
	Omit<AmazonKeywordRanking, "id" | "created_at" | "updated_at">
>;

export type CreateAmazonListingQuality = Omit<
	AmazonListingQuality,
	"id" | "created_at" | "updated_at" | "overall_score"
>;
export type UpdateAmazonListingQuality = Partial<
	Omit<
		AmazonListingQuality,
		"id" | "created_at" | "updated_at" | "overall_score"
	>
>;

export type CreateAmazonCompetitorTracking = Omit<
	AmazonCompetitorTracking,
	"id" | "created_at" | "updated_at"
>;
export type UpdateAmazonCompetitorTracking = Partial<
	Omit<AmazonCompetitorTracking, "id" | "created_at" | "updated_at">
>;

export type CreateAmazonSearchAnomaly = Omit<
	AmazonSearchAnomaly,
	"id" | "created_at" | "updated_at"
>;
export type UpdateAmazonSearchAnomaly = Partial<
	Omit<AmazonSearchAnomaly, "id" | "created_at" | "updated_at">
>;

export type CreateAmazonCampaignOptimization = Omit<
	AmazonCampaignOptimization,
	"id" | "created_at" | "updated_at"
>;
export type UpdateAmazonCampaignOptimization = Partial<
	Omit<AmazonCampaignOptimization, "id" | "created_at" | "updated_at">
>;

export type CreateAmazonBrandIntelligenceReport = Omit<
	AmazonBrandIntelligenceReport,
	"id" | "created_at" | "updated_at"
>;
export type UpdateAmazonBrandIntelligenceReport = Partial<
	Omit<AmazonBrandIntelligenceReport, "id" | "created_at" | "updated_at">
>;
