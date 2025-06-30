/**
 * Amazon Repository Service
 * Handles all database operations for Amazon advanced API data
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import type {
	AmazonBrandAnalytics,
	AmazonBrandIntelligenceReport,
	AmazonCampaignOptimization,
	AmazonCompetitorTracking,
	AmazonDSPCampaign,
	AmazonDSPPerformance,
	AmazonKeywordRanking,
	AmazonListingQuality,
	AmazonSearchAnomaly,
	AmazonSearchPerformance,
	CreateAmazonBrandAnalytics,
	CreateAmazonBrandIntelligenceReport,
	CreateAmazonCampaignOptimization,
	CreateAmazonCompetitorTracking,
	CreateAmazonDSPCampaign,
	CreateAmazonKeywordRanking,
	CreateAmazonListingQuality,
	CreateAmazonSearchAnomaly,
	CreateAmazonSearchPerformance,
	UpdateAmazonSearchAnomaly,
} from "../types/amazon-db";

// Additional types for new Attribution and AI features
export interface AmazonAttributionCampaign {
	id: string;
	organization_id: string;
	integration_id: string;
	campaign_id: string;
	advertiser_id: string;
	advertiser_name?: string;
	campaign_name: string;
	campaign_type: string;
	status: string;
	budget?: number;
	daily_budget?: number;
	currency: string;
	start_date?: string;
	end_date?: string;
	targeting_type: string;
	bid_strategy: string;
	impressions: number;
	clicks: number;
	spend: number;
	detail_page_views: number;
	purchases: number;
	sales: number;
	units_ordered: number;
	click_through_rate: number;
	cost_per_click: number;
	return_on_ad_spend: number;
	attribution_rate: number;
	products: string[];
	audiences: string[];
	creatives: string[];
	external_data: Record<string, any>;
	created_at: string;
	updated_at: string;
}

export interface AmazonAIInsight {
	id: string;
	organization_id: string;
	integration_id: string;
	insight_id: string;
	asin?: string;
	marketplace_id?: string;
	type: string;
	category: string;
	priority: string;
	title: string;
	description: string;
	impact_metric: string;
	current_value: number;
	potential_value: number;
	percentage_change: number;
	evidence: Record<string, any>;
	confidence: number;
	recommendations: Array<Record<string, any>>;
	related_asins: string[];
	expires_at: string;
	created_at: string;
}

export interface CreateAmazonAttributionCampaign {
	organization_id: string;
	integration_id: string;
	campaign_id: string;
	advertiser_id: string;
	advertiser_name?: string;
	campaign_name: string;
	campaign_type: string;
	status: string;
	budget?: number;
	daily_budget?: number;
	start_date?: string;
	end_date?: string;
	targeting_type: string;
	bid_strategy: string;
	products?: string[];
	audiences?: string[];
	creatives?: string[];
	external_data?: Record<string, any>;
}

export interface CreateAmazonAIInsight {
	organization_id: string;
	integration_id: string;
	insight_id: string;
	asin?: string;
	marketplace_id?: string;
	type: string;
	category: string;
	priority: string;
	title: string;
	description: string;
	impact_metric: string;
	current_value: number;
	potential_value: number;
	percentage_change: number;
	evidence: Record<string, any>;
	confidence: number;
	recommendations: Array<Record<string, any>>;
	related_asins?: string[];
	expires_at: string;
}

export class AmazonRepository {
	private supabase: SupabaseClient;

	constructor(supabaseUrl: string, supabaseKey: string) {
		this.supabase = createClient(supabaseUrl, supabaseKey);
	}

	// Brand Analytics
	async upsertBrandAnalytics(
		data: CreateAmazonBrandAnalytics,
	): Promise<AmazonBrandAnalytics> {
		const { data: result, error } = await this.supabase
			.from("amazon_brand_analytics")
			.upsert(data, {
				onConflict: "integration_id,report_type,marketplace_id,report_date",
			})
			.select()
			.single();

		if (error) throw error;
		return result;
	}

	async getBrandAnalytics(
		integrationId: string,
		reportType: string,
		startDate: string,
		endDate: string,
	): Promise<AmazonBrandAnalytics[]> {
		const { data, error } = await this.supabase
			.from("amazon_brand_analytics")
			.select("*")
			.eq("integration_id", integrationId)
			.eq("report_type", reportType)
			.gte("report_date", startDate)
			.lte("report_date", endDate)
			.order("report_date", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	// DSP Campaigns
	async upsertDSPCampaign(
		data: CreateAmazonDSPCampaign,
	): Promise<AmazonDSPCampaign> {
		const { data: result, error } = await this.supabase
			.from("amazon_dsp_campaigns")
			.upsert(data, {
				onConflict: "integration_id,campaign_id",
			})
			.select()
			.single();

		if (error) throw error;
		return result;
	}

	async getDSPCampaigns(
		integrationId: string,
		status?: string,
	): Promise<AmazonDSPCampaign[]> {
		let query = this.supabase
			.from("amazon_dsp_campaigns")
			.select("*")
			.eq("integration_id", integrationId);

		if (status) {
			query = query.eq("status", status);
		}

		const { data, error } = await query.order("created_at", {
			ascending: false,
		});

		if (error) throw error;
		return data || [];
	}

	async storeDSPPerformance(
		data: Omit<AmazonDSPPerformance, "id" | "created_at">,
	): Promise<void> {
		const { error } = await this.supabase
			.from("amazon_dsp_performance")
			.upsert(data, {
				onConflict: "dsp_campaign_id,date,hour",
			});

		if (error) throw error;
	}

	async getDSPPerformance(
		campaignId: string,
		startDate: string,
		endDate: string,
	): Promise<AmazonDSPPerformance[]> {
		const { data, error } = await this.supabase
			.from("amazon_dsp_performance")
			.select("*")
			.eq("dsp_campaign_id", campaignId)
			.gte("date", startDate)
			.lte("date", endDate)
			.order("date", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	// Search Performance
	async storeSearchPerformance(
		data: CreateAmazonSearchPerformance[],
	): Promise<void> {
		const { error } = await this.supabase
			.from("amazon_search_performance")
			.upsert(data, {
				onConflict: "integration_id,asin,marketplace_id,date,search_query",
			});

		if (error) throw error;
	}

	async getSearchPerformance(
		asin: string,
		marketplaceId: string,
		startDate: string,
		endDate: string,
	): Promise<AmazonSearchPerformance[]> {
		const { data, error } = await this.supabase
			.from("amazon_search_performance")
			.select("*")
			.eq("asin", asin)
			.eq("marketplace_id", marketplaceId)
			.gte("date", startDate)
			.lte("date", endDate)
			.order("impressions", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	async getTopSearchQueries(
		asin: string,
		marketplaceId: string,
		limit = 20,
	): Promise<AmazonSearchPerformance[]> {
		const { data, error } = await this.supabase
			.from("amazon_search_performance")
			.select("*")
			.eq("asin", asin)
			.eq("marketplace_id", marketplaceId)
			.order("impressions", { ascending: false })
			.limit(limit);

		if (error) throw error;
		return data || [];
	}

	// Keyword Rankings
	async storeKeywordRankings(
		data: CreateAmazonKeywordRanking[],
	): Promise<void> {
		const { error } = await this.supabase
			.from("amazon_keyword_rankings")
			.upsert(data, {
				onConflict: "integration_id,asin,keyword,marketplace_id,tracked_at",
			});

		if (error) throw error;
	}

	async getKeywordRankings(
		asin: string,
		marketplaceId: string,
		keywords?: string[],
	): Promise<AmazonKeywordRanking[]> {
		let query = this.supabase
			.from("amazon_keyword_rankings")
			.select("*")
			.eq("asin", asin)
			.eq("marketplace_id", marketplaceId);

		if (keywords && keywords.length > 0) {
			query = query.in("keyword", keywords);
		}

		const { data, error } = await query
			.order("tracked_at", { ascending: false })
			.order("current_rank", { ascending: true });

		if (error) throw error;
		return data || [];
	}

	async getKeywordRankingChanges(
		integrationId: string,
		changeThreshold = 5,
	): Promise<AmazonKeywordRanking[]> {
		const { data, error } = await this.supabase
			.from("amazon_keyword_rankings")
			.select("*")
			.eq("integration_id", integrationId)
			.or(
				`rank_change.gt.${changeThreshold},rank_change.lt.${-changeThreshold}`,
			)
			.order("tracked_at", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	// Listing Quality
	async upsertListingQuality(
		data: CreateAmazonListingQuality,
	): Promise<AmazonListingQuality> {
		const { data: result, error } = await this.supabase
			.from("amazon_listing_quality")
			.upsert(data, {
				onConflict: "integration_id,asin,marketplace_id",
			})
			.select()
			.single();

		if (error) throw error;
		return result;
	}

	async getListingQuality(
		asin: string,
		marketplaceId: string,
	): Promise<AmazonListingQuality | null> {
		const { data, error } = await this.supabase
			.from("amazon_listing_quality")
			.select("*")
			.eq("asin", asin)
			.eq("marketplace_id", marketplaceId)
			.single();

		if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows returned"
		return data;
	}

	async getLowQualityListings(
		organizationId: string,
		scoreThreshold = 70,
	): Promise<AmazonListingQuality[]> {
		const { data, error } = await this.supabase
			.from("amazon_listing_quality")
			.select("*")
			.eq("organization_id", organizationId)
			.lt("overall_score", scoreThreshold)
			.order("overall_score", { ascending: true });

		if (error) throw error;
		return data || [];
	}

	// Competitor Tracking
	async storeCompetitorTracking(
		data: CreateAmazonCompetitorTracking[],
	): Promise<void> {
		const { error } = await this.supabase
			.from("amazon_competitor_tracking")
			.upsert(data, {
				onConflict:
					"integration_id,our_asin,competitor_asin,marketplace_id,tracked_at",
			});

		if (error) throw error;
	}

	async getCompetitorAnalysis(
		asin: string,
		marketplaceId: string,
	): Promise<AmazonCompetitorTracking[]> {
		const { data, error } = await this.supabase
			.from("amazon_competitor_tracking")
			.select("*")
			.eq("our_asin", asin)
			.eq("marketplace_id", marketplaceId)
			.order("threat_level", { ascending: false })
			.order("visibility_score_theirs", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	async getTopCompetitors(
		organizationId: string,
		limit = 10,
	): Promise<AmazonCompetitorTracking[]> {
		const { data, error } = await this.supabase
			.from("amazon_competitor_tracking")
			.select("*")
			.eq("organization_id", organizationId)
			.eq("threat_level", "HIGH")
			.order("tracked_at", { ascending: false })
			.limit(limit);

		if (error) throw error;
		return data || [];
	}

	// Search Anomalies
	async createSearchAnomaly(
		data: CreateAmazonSearchAnomaly,
	): Promise<AmazonSearchAnomaly> {
		const { data: result, error } = await this.supabase
			.from("amazon_search_anomalies")
			.insert(data)
			.select()
			.single();

		if (error) throw error;
		return result;
	}

	async getOpenAnomalies(
		organizationId: string,
	): Promise<AmazonSearchAnomaly[]> {
		const { data, error } = await this.supabase
			.from("amazon_search_anomalies")
			.select("*")
			.eq("organization_id", organizationId)
			.eq("status", "OPEN")
			.order("severity", { ascending: false })
			.order("detected_date", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	async updateAnomalyStatus(
		anomalyId: string,
		update: UpdateAmazonSearchAnomaly,
	): Promise<AmazonSearchAnomaly> {
		const { data, error } = await this.supabase
			.from("amazon_search_anomalies")
			.update(update)
			.eq("id", anomalyId)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	// Campaign Optimization
	async createOptimizationSuggestion(
		data: CreateAmazonCampaignOptimization,
	): Promise<AmazonCampaignOptimization> {
		const { data: result, error } = await this.supabase
			.from("amazon_campaign_optimization")
			.insert(data)
			.select()
			.single();

		if (error) throw error;
		return result;
	}

	async getPendingOptimizations(
		organizationId: string,
	): Promise<AmazonCampaignOptimization[]> {
		const { data, error } = await this.supabase
			.from("amazon_campaign_optimization")
			.select("*")
			.eq("organization_id", organizationId)
			.eq("status", "PENDING")
			.order("confidence_score", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	async applyOptimization(
		optimizationId: string,
		appliedBy: string,
	): Promise<AmazonCampaignOptimization> {
		const { data, error } = await this.supabase
			.from("amazon_campaign_optimization")
			.update({
				status: "APPLIED",
				applied_at: new Date().toISOString(),
				applied_by: appliedBy,
			})
			.eq("id", optimizationId)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	// Brand Intelligence Reports
	async createBrandIntelligenceReport(
		data: CreateAmazonBrandIntelligenceReport,
	): Promise<AmazonBrandIntelligenceReport> {
		const { data: result, error } = await this.supabase
			.from("amazon_brand_intelligence_reports")
			.upsert(data, {
				onConflict:
					"integration_id,brand_name,marketplace_id,period_start,period_end",
			})
			.select()
			.single();

		if (error) throw error;
		return result;
	}

	async getLatestBrandIntelligenceReport(
		brandName: string,
		marketplaceId: string,
	): Promise<AmazonBrandIntelligenceReport | null> {
		const { data, error } = await this.supabase
			.from("amazon_brand_intelligence_reports")
			.select("*")
			.eq("brand_name", brandName)
			.eq("marketplace_id", marketplaceId)
			.order("period_end", { ascending: false })
			.limit(1)
			.single();

		if (error && error.code !== "PGRST116") throw error;
		return data;
	}

	// Attribution Campaigns
	async createAttributionCampaign(
		data: CreateAmazonAttributionCampaign,
	): Promise<AmazonAttributionCampaign> {
		const { data: result, error } = await this.supabase
			.from("amazon_attribution_campaigns")
			.insert({
				organization_id: data.organization_id,
				integration_id: data.integration_id,
				campaign_id: data.campaign_id,
				advertiser_id: data.advertiser_id,
				advertiser_name: data.advertiser_name,
				campaign_name: data.campaign_name,
				campaign_type: data.campaign_type,
				status: data.status,
				budget: data.budget,
				daily_budget: data.daily_budget,
				start_date: data.start_date,
				end_date: data.end_date,
				targeting_type: data.targeting_type,
				bid_strategy: data.bid_strategy,
				products: data.products || [],
				audiences: data.audiences || [],
				creatives: data.creatives || [],
				external_data: data.external_data || {},
			})
			.select()
			.single();

		if (error) throw error;
		return result;
	}

	async getAttributionCampaigns(
		organizationId: string,
		filters?: {
			status?: string;
			campaign_type?: string;
			advertiser_id?: string;
		},
	): Promise<AmazonAttributionCampaign[]> {
		let query = this.supabase
			.from("amazon_attribution_campaigns")
			.select("*")
			.eq("organization_id", organizationId)
			.order("created_at", { ascending: false });

		if (filters?.status) {
			query = query.eq("status", filters.status);
		}
		if (filters?.campaign_type) {
			query = query.eq("campaign_type", filters.campaign_type);
		}
		if (filters?.advertiser_id) {
			query = query.eq("advertiser_id", filters.advertiser_id);
		}

		const { data, error } = await query;

		if (error) throw error;
		return data || [];
	}

	async updateAttributionCampaignPerformance(
		campaignId: string,
		performance: {
			impressions?: number;
			clicks?: number;
			spend?: number;
			detail_page_views?: number;
			purchases?: number;
			sales?: number;
			units_ordered?: number;
			click_through_rate?: number;
			cost_per_click?: number;
			return_on_ad_spend?: number;
			attribution_rate?: number;
		},
	): Promise<void> {
		const { error } = await this.supabase
			.from("amazon_attribution_campaigns")
			.update({
				...performance,
				updated_at: new Date().toISOString(),
			})
			.eq("campaign_id", campaignId);

		if (error) throw error;
	}

	// AI Insights
	async storeAIInsights(data: CreateAmazonAIInsight[]): Promise<void> {
		const { error } = await this.supabase.from("amazon_ai_insights").upsert(
			data.map((insight) => ({
				organization_id: insight.organization_id,
				integration_id: insight.integration_id,
				insight_id: insight.insight_id,
				asin: insight.asin,
				marketplace_id: insight.marketplace_id,
				type: insight.type,
				category: insight.category,
				priority: insight.priority,
				title: insight.title,
				description: insight.description,
				impact_metric: insight.impact_metric,
				current_value: insight.current_value,
				potential_value: insight.potential_value,
				percentage_change: insight.percentage_change,
				evidence: insight.evidence,
				confidence: insight.confidence,
				recommendations: insight.recommendations,
				related_asins: insight.related_asins || [],
				expires_at: insight.expires_at,
			})),
			{
				onConflict: "integration_id,insight_id",
			},
		);

		if (error) throw error;
	}

	async getAIInsights(
		organizationId: string,
		filters?: {
			asin?: string;
			marketplace_id?: string;
			type?: string;
			category?: string;
			priority?: string;
			active_only?: boolean;
		},
	): Promise<AmazonAIInsight[]> {
		let query = this.supabase
			.from("amazon_ai_insights")
			.select("*")
			.eq("organization_id", organizationId)
			.order("created_at", { ascending: false });

		if (filters?.asin) {
			query = query.eq("asin", filters.asin);
		}
		if (filters?.marketplace_id) {
			query = query.eq("marketplace_id", filters.marketplace_id);
		}
		if (filters?.type) {
			query = query.eq("type", filters.type);
		}
		if (filters?.category) {
			query = query.eq("category", filters.category);
		}
		if (filters?.priority) {
			query = query.eq("priority", filters.priority);
		}
		if (filters?.active_only !== false) {
			query = query.gt("expires_at", new Date().toISOString());
		}

		const { data, error } = await query;

		if (error) throw error;
		return data || [];
	}

	async getHighPriorityInsights(
		organizationId: string,
	): Promise<AmazonAIInsight[]> {
		const { data, error } = await this.supabase
			.from("amazon_ai_insights")
			.select("*")
			.eq("organization_id", organizationId)
			.in("priority", ["CRITICAL", "HIGH"])
			.gt("expires_at", new Date().toISOString())
			.order("priority", { ascending: false })
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	// Dashboard Analytics
	async getDashboardSummary(organizationId: string): Promise<{
		total_campaigns: number;
		active_campaigns: number;
		total_spend: number;
		total_sales: number;
		overall_roas: number;
		pending_insights: number;
		critical_insights: number;
		opportunities_count: number;
	}> {
		// Get campaign summary
		const { data: campaignSummary, error: campaignError } = await this.supabase
			.from("amazon_attribution_campaigns")
			.select("status, spend, sales")
			.eq("organization_id", organizationId);

		if (campaignError) throw campaignError;

		// Get insights summary
		const { data: insightsSummary, error: insightsError } = await this.supabase
			.from("amazon_ai_insights")
			.select("priority, type")
			.eq("organization_id", organizationId)
			.gt("expires_at", new Date().toISOString());

		if (insightsError) throw insightsError;

		const totalCampaigns = campaignSummary?.length || 0;
		const activeCampaigns =
			campaignSummary?.filter((c) => c.status === "ACTIVE").length || 0;
		const totalSpend =
			campaignSummary?.reduce((sum, c) => sum + (c.spend || 0), 0) || 0;
		const totalSales =
			campaignSummary?.reduce((sum, c) => sum + (c.sales || 0), 0) || 0;
		const overallRoas = totalSpend > 0 ? totalSales / totalSpend : 0;

		const criticalInsights =
			insightsSummary?.filter(
				(i) => i.priority === "CRITICAL" || i.priority === "HIGH",
			).length || 0;
		const opportunities =
			insightsSummary?.filter((i) => i.type === "OPPORTUNITY").length || 0;

		return {
			total_campaigns: totalCampaigns,
			active_campaigns: activeCampaigns,
			total_spend: totalSpend,
			total_sales: totalSales,
			overall_roas: overallRoas,
			pending_insights: insightsSummary?.length || 0,
			critical_insights: criticalInsights,
			opportunities_count: opportunities,
		};
	}

	async getTopPerformingProducts(
		organizationId: string,
		limit = 10,
	): Promise<
		Array<{
			asin: string;
			marketplace_id: string;
			total_revenue: number;
			total_clicks: number;
			total_conversions: number;
			average_ctr: number;
			quality_score: number;
		}>
	> {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const { data, error } = await this.supabase
			.from("amazon_search_performance")
			.select(
				"asin, marketplace_id, revenue, clicks, units_ordered, click_through_rate",
			)
			.eq("organization_id", organizationId)
			.gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

		if (error) throw error;

		// Aggregate by ASIN
		const aggregated = (data || []).reduce(
			(acc, item) => {
				const key = `${item.asin}-${item.marketplace_id}`;
				if (!acc[key]) {
					acc[key] = {
						asin: item.asin,
						marketplace_id: item.marketplace_id,
						total_revenue: 0,
						total_clicks: 0,
						total_conversions: 0,
						ctr_sum: 0,
						count: 0,
					};
				}

				acc[key].total_revenue += item.revenue || 0;
				acc[key].total_clicks += item.clicks || 0;
				acc[key].total_conversions += item.units_ordered || 0;
				acc[key].ctr_sum += item.click_through_rate || 0;
				acc[key].count += 1;

				return acc;
			},
			{} as Record<string, any>,
		);

		// Get quality scores
		const asins = Object.values(aggregated).map((item: any) => item.asin);
		let qualityData: any[] = [];

		if (asins.length > 0) {
			const { data: qData, error: qualityError } = await this.supabase
				.from("amazon_listing_quality")
				.select("asin, overall_score")
				.eq("organization_id", organizationId)
				.in("asin", asins);

			if (qualityError) throw qualityError;
			qualityData = qData || [];
		}

		const qualityMap = qualityData.reduce(
			(acc, item) => {
				acc[item.asin] = item.overall_score || 0;
				return acc;
			},
			{} as Record<string, number>,
		);

		return Object.values(aggregated)
			.map((item: any) => ({
				asin: item.asin,
				marketplace_id: item.marketplace_id,
				total_revenue: item.total_revenue,
				total_clicks: item.total_clicks,
				total_conversions: item.total_conversions,
				average_ctr: item.count > 0 ? item.ctr_sum / item.count : 0,
				quality_score: qualityMap[item.asin] || 0,
			}))
			.sort((a, b) => b.total_revenue - a.total_revenue)
			.slice(0, limit);
	}

	async getPerformanceTrends(
		organizationId: string,
		asin: string,
		marketplaceId: string,
		days = 30,
	): Promise<
		Array<{
			date: string;
			impressions: number;
			clicks: number;
			revenue: number;
			ctr: number;
		}>
	> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const { data, error } = await this.supabase
			.from("amazon_search_performance")
			.select("date, impressions, clicks, revenue, click_through_rate")
			.eq("organization_id", organizationId)
			.eq("asin", asin)
			.eq("marketplace_id", marketplaceId)
			.gte("date", startDate.toISOString().split("T")[0])
			.order("date", { ascending: true });

		if (error) throw error;

		// Aggregate by date
		const aggregated = (data || []).reduce(
			(acc, item) => {
				if (!acc[item.date]) {
					acc[item.date] = {
						date: item.date,
						impressions: 0,
						clicks: 0,
						revenue: 0,
						ctr_sum: 0,
						count: 0,
					};
				}

				acc[item.date].impressions += item.impressions || 0;
				acc[item.date].clicks += item.clicks || 0;
				acc[item.date].revenue += item.revenue || 0;
				acc[item.date].ctr_sum += item.click_through_rate || 0;
				acc[item.date].count += 1;

				return acc;
			},
			{} as Record<string, any>,
		);

		return Object.values(aggregated).map((item: any) => ({
			date: item.date,
			impressions: item.impressions,
			clicks: item.clicks,
			revenue: item.revenue,
			ctr: item.count > 0 ? item.ctr_sum / item.count : 0,
		}));
	}

	// Cross-channel Analysis
	async generateCrossChannelAnalysis(
		advertiserId: string,
		startDate: string,
		endDate: string,
	): Promise<{
		total_campaigns: number;
		total_spend: number;
		total_sales: number;
		overall_roas: number;
		channel_breakdown: Record<string, any>[];
	}> {
		const { data, error } = await this.supabase.rpc(
			"generate_cross_channel_analysis",
			{
				p_advertiser_id: advertiserId,
				p_start_date: startDate,
				p_end_date: endDate,
			},
		);

		if (error) throw error;
		return (
			data?.[0] || {
				total_campaigns: 0,
				total_spend: 0,
				total_sales: 0,
				overall_roas: 0,
				channel_breakdown: [],
			}
		);
	}

	// Utility methods

	async runAnomalyDetection(_organizationId: string): Promise<void> {
		// This would call the detect_search_anomalies() function in the database
		const { error } = await this.supabase.rpc("detect_search_anomalies");

		if (error) throw error;
	}

	async cleanupExpiredData(): Promise<void> {
		// This would typically be called by a scheduled job
		const { error } = await this.supabase.rpc("cleanup_expired_amazon_data");

		if (error) throw error;
	}

	async getSearchPerformanceSummary(
		asin: string,
		marketplaceId: string,
		days = 30,
	): Promise<{
		totalImpressions: number;
		totalClicks: number;
		avgCTR: number;
		topQueries: string[];
	}> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const { data, error } = await this.supabase
			.from("amazon_search_performance")
			.select("impressions, clicks, search_query")
			.eq("asin", asin)
			.eq("marketplace_id", marketplaceId)
			.gte("date", startDate.toISOString().split("T")[0]);

		if (error) throw error;

		const totalImpressions =
			data?.reduce((sum, row) => sum + row.impressions, 0) || 0;
		const totalClicks = data?.reduce((sum, row) => sum + row.clicks, 0) || 0;
		const avgCTR =
			totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

		// Get top queries by impressions
		const queryMap = new Map<string, number>();
		data?.forEach((row) => {
			queryMap.set(
				row.search_query,
				(queryMap.get(row.search_query) || 0) + row.impressions,
			);
		});

		const topQueries = Array.from(queryMap.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map((entry) => entry[0]);

		return {
			totalImpressions,
			totalClicks,
			avgCTR,
			topQueries,
		};
	}
}
