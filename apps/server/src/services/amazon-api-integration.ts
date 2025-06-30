/**
 * Amazon API Integration Service
 * Orchestrates all Amazon API data flow and provides unified access to Amazon features
 */

import type {
	AdvertisingProvider,
	AttributionProvider,
	BrandAnalyticsProvider,
	DSPProvider,
	SearchPerformanceProvider,
} from "@ignitabull/amazon-core";
import { AmazonRepository } from "./amazon-repository";

export interface AmazonIntegrationConfig {
	organization_id: string;
	integration_id: string;
	supabase_url: string;
	supabase_key: string;
	providers: {
		attribution?: AttributionProvider;
		searchPerformance?: SearchPerformanceProvider;
		brandAnalytics?: BrandAnalyticsProvider;
		advertising?: AdvertisingProvider;
		dsp?: DSPProvider;
	};
}

export interface AmazonDashboardData {
	summary: {
		total_campaigns: number;
		active_campaigns: number;
		total_spend: number;
		total_sales: number;
		overall_roas: number;
		pending_insights: number;
		critical_insights: number;
		opportunities_count: number;
	};
	topProducts: Array<{
		asin: string;
		marketplace_id: string;
		total_revenue: number;
		total_clicks: number;
		total_conversions: number;
		average_ctr: number;
		quality_score: number;
	}>;
	criticalInsights: Array<{
		id: string;
		type: string;
		priority: string;
		title: string;
		description: string;
		impact_metric: string;
		percentage_change: number;
	}>;
	recentAnomalies: Array<{
		id: string;
		asin: string;
		anomaly_type: string;
		severity: string;
		detected_date: string;
		description: string;
	}>;
}

export interface ProductAnalysisData {
	asin: string;
	marketplace_id: string;
	searchPerformance: {
		totalImpressions: number;
		totalClicks: number;
		avgCTR: number;
		topQueries: string[];
		trends: Array<{
			date: string;
			impressions: number;
			clicks: number;
			revenue: number;
			ctr: number;
		}>;
	};
	listingQuality: {
		overall_score: number;
		title_score?: number;
		bullet_points_score?: number;
		description_score?: number;
		images_score?: number;
		keywords_score?: number;
		pricing_score?: number;
		reviews_score?: number;
		recommendations: Array<Record<string, any>>;
	} | null;
	competitors: Array<{
		competitor_asin: string;
		competitor_brand: string;
		threat_level: string;
		overlap_score: number;
		price_difference_percent: number;
	}>;
	insights: Array<{
		type: string;
		category: string;
		priority: string;
		title: string;
		description: string;
		impact_metric: string;
		percentage_change: number;
		recommendations: Array<Record<string, any>>;
	}>;
	keywordRankings: Array<{
		keyword: string;
		current_rank: number;
		previous_rank: number;
		rank_change: number;
		is_organic: boolean;
		is_sponsored: boolean;
	}>;
}

export class AmazonAPIIntegration {
	private repository: AmazonRepository;
	private config: AmazonIntegrationConfig;

	constructor(config: AmazonIntegrationConfig) {
		this.config = config;
		this.repository = new AmazonRepository(
			config.supabase_url,
			config.supabase_key,
		);
	}

	// Dashboard Data Aggregation
	async getDashboardData(): Promise<AmazonDashboardData> {
		const [summary, topProducts, criticalInsights, recentAnomalies] =
			await Promise.all([
				this.repository.getDashboardSummary(this.config.organization_id),
				this.repository.getTopPerformingProducts(
					this.config.organization_id,
					5,
				),
				this.repository.getHighPriorityInsights(this.config.organization_id),
				this.repository.getOpenAnomalies(this.config.organization_id),
			]);

		return {
			summary,
			topProducts,
			criticalInsights: criticalInsights.slice(0, 10).map((insight) => ({
				id: insight.id,
				type: insight.type,
				priority: insight.priority,
				title: insight.title,
				description: insight.description,
				impact_metric: insight.impact_metric,
				percentage_change: insight.percentage_change,
			})),
			recentAnomalies: recentAnomalies.slice(0, 5).map((anomaly) => ({
				id: anomaly.id,
				asin: anomaly.asin,
				anomaly_type: anomaly.anomaly_type,
				severity: anomaly.severity,
				detected_date: anomaly.detected_date,
				description: `${anomaly.anomaly_type.replace("_", " ")} detected for ${anomaly.asin}`,
			})),
		};
	}

	// Product Analysis
	async analyzeProduct(
		asin: string,
		marketplaceId: string,
	): Promise<ProductAnalysisData> {
		const [
			searchSummary,
			performanceTrends,
			listingQuality,
			competitors,
			insights,
			keywordRankings,
		] = await Promise.all([
			this.repository.getSearchPerformanceSummary(asin, marketplaceId),
			this.repository.getPerformanceTrends(
				this.config.organization_id,
				asin,
				marketplaceId,
			),
			this.repository.getListingQuality(asin, marketplaceId),
			this.repository.getCompetitorAnalysis(asin, marketplaceId),
			this.repository.getAIInsights(this.config.organization_id, {
				asin,
				marketplace_id: marketplaceId,
				active_only: true,
			}),
			this.repository.getKeywordRankings(asin, marketplaceId),
		]);

		return {
			asin,
			marketplace_id: marketplaceId,
			searchPerformance: {
				totalImpressions: searchSummary.totalImpressions,
				totalClicks: searchSummary.totalClicks,
				avgCTR: searchSummary.avgCTR,
				topQueries: searchSummary.topQueries,
				trends: performanceTrends,
			},
			listingQuality,
			competitors: competitors.slice(0, 10).map((comp) => ({
				competitor_asin: comp.competitor_asin,
				competitor_brand: comp.competitor_brand || "Unknown",
				threat_level: comp.threat_level,
				overlap_score: comp.overlap_score || 0,
				price_difference_percent: comp.price_difference_percent || 0,
			})),
			insights: insights.slice(0, 20).map((insight) => ({
				type: insight.type,
				category: insight.category,
				priority: insight.priority,
				title: insight.title,
				description: insight.description,
				impact_metric: insight.impact_metric,
				percentage_change: insight.percentage_change,
				recommendations: insight.recommendations,
			})),
			keywordRankings: keywordRankings.slice(0, 50).map((ranking) => ({
				keyword: ranking.keyword,
				current_rank: ranking.current_rank || 0,
				previous_rank: ranking.previous_rank || 0,
				rank_change: ranking.rank_change || 0,
				is_organic: ranking.is_organic,
				is_sponsored: ranking.is_sponsored,
			})),
		};
	}

	// Data Synchronization Methods
	async syncSearchPerformanceData(
		asin: string,
		marketplaceId: string,
	): Promise<void> {
		if (!this.config.providers.searchPerformance) {
			throw new Error("Search Performance provider not configured");
		}

		const dateRange = {
			startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0],
			endDate: new Date().toISOString().split("T")[0],
		};

		try {
			// Fetch search metrics from the provider
			const searchMetrics =
				await this.config.providers.searchPerformance.getSearchQueryMetrics(
					asin,
					dateRange,
					marketplaceId,
				);

			// Transform and store the data
			const searchPerformanceData = searchMetrics.map((metric) => ({
				organization_id: this.config.organization_id,
				integration_id: this.config.integration_id,
				asin,
				marketplace_id: marketplaceId,
				date: new Date().toISOString().split("T")[0], // This would come from the metric
				search_query: metric.query,
				impressions: metric.impressions,
				clicks: metric.clicks,
				click_through_rate: metric.clickThroughRate,
				conversion_rate: metric.conversionRate,
				purchase_rate: metric.purchaseRate,
				revenue: metric.revenue,
				units_ordered: metric.unitsOrdered,
				average_price: metric.averagePrice,
				search_frequency_rank: metric.searchFrequencyRank,
				relative_search_volume: metric.relativeSearchVolume,
			}));

			await this.repository.storeSearchPerformance(searchPerformanceData);

			// Fetch and store keyword rankings
			const keywordRankings =
				await this.config.providers.searchPerformance.getKeywordRankings(
					asin,
					dateRange,
					marketplaceId,
				);

			const keywordData = keywordRankings.map((ranking) => ({
				organization_id: this.config.organization_id,
				integration_id: this.config.integration_id,
				asin: ranking.asin,
				keyword: ranking.keyword,
				marketplace_id: marketplaceId,
				current_rank: ranking.currentRank,
				previous_rank: ranking.previousRank,
				rank_change: ranking.rankChange,
				is_organic: ranking.isOrganic,
				is_sponsored: ranking.isSponsored,
				competitor_count: ranking.competitorCount,
				share_of_voice: ranking.shareOfVoice,
				tracked_at: new Date().toISOString(),
			}));

			await this.repository.storeKeywordRankings(keywordData);

			// Fetch and store listing quality
			const listingQuality =
				await this.config.providers.searchPerformance.getListingQualityScore(
					asin,
					marketplaceId,
				);

			await this.repository.upsertListingQuality({
				organization_id: this.config.organization_id,
				integration_id: this.config.integration_id,
				asin: listingQuality.asin,
				marketplace_id: marketplaceId,
				overall_score: listingQuality.overallScore,
				title_score: listingQuality.components.titleOptimization,
				bullet_points_score: listingQuality.components.bulletPoints,
				description_score: listingQuality.components.productDescription,
				images_score: listingQuality.components.images,
				keywords_score: listingQuality.components.keywords,
				pricing_score: listingQuality.components.pricing,
				reviews_score: listingQuality.components.reviews,
				missing_keywords: [], // Would extract from recommendations
				keyword_density: {},
				content_gaps: [],
				category_average_score:
					listingQuality.competitiveAnalysis?.categoryAverageScore,
				top_competitor_score:
					listingQuality.competitiveAnalysis?.topCompetitorScore,
				market_position: listingQuality.competitiveAnalysis?.yourRank,
				recommendations: listingQuality.recommendations || [],
				analyzed_at: new Date().toISOString(),
			});

			console.log(`Search performance data synced successfully for ${asin}`);
		} catch (error) {
			console.error(
				`Failed to sync search performance data for ${asin}:`,
				error,
			);
			throw error;
		}
	}

	async syncAttributionData(advertiserId: string): Promise<void> {
		if (!this.config.providers.attribution) {
			throw new Error("Attribution provider not configured");
		}

		try {
			// Fetch attribution campaigns
			const campaigns =
				await this.config.providers.attribution.getAttributionCampaigns(
					advertiserId,
				);

			// Store campaigns in database
			for (const campaign of campaigns) {
				await this.repository.createAttributionCampaign({
					organization_id: this.config.organization_id,
					integration_id: this.config.integration_id,
					campaign_id: campaign.campaignId,
					advertiser_id: campaign.advertiserId,
					advertiser_name: campaign.advertiserName,
					campaign_name: campaign.campaignName,
					campaign_type: campaign.campaignType,
					status: campaign.status,
					budget: campaign.budget,
					daily_budget: campaign.dailyBudget,
					start_date: campaign.startDate,
					end_date: campaign.endDate,
					targeting_type: campaign.targetingType,
					bid_strategy: campaign.bidStrategy,
					products: [], // Would extract from campaign.products
					external_data: {},
				});

				// Update performance metrics
				await this.repository.updateAttributionCampaignPerformance(
					campaign.campaignId,
					{
						impressions: campaign.performance.impressions,
						clicks: campaign.performance.clicks,
						spend: campaign.performance.spend,
						detail_page_views: campaign.performance.detailPageViews,
						purchases: campaign.performance.purchases,
						sales: campaign.performance.sales,
						units_ordered: campaign.performance.unitsOrdered,
						click_through_rate: campaign.performance.clickThroughRate,
						cost_per_click: campaign.performance.costPerClick,
						return_on_ad_spend: campaign.performance.returnOnAdSpend,
						attribution_rate: campaign.performance.attributionRate,
					},
				);
			}

			console.log(
				`Attribution data synced successfully for advertiser ${advertiserId}`,
			);
		} catch (error) {
			console.error(
				`Failed to sync attribution data for ${advertiserId}:`,
				error,
			);
			throw error;
		}
	}

	async syncBrandAnalyticsData(marketplaceId: string): Promise<void> {
		if (!this.config.providers.brandAnalytics) {
			throw new Error("Brand Analytics provider not configured");
		}

		const dateRange = {
			startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0],
			endDate: new Date().toISOString().split("T")[0],
		};

		try {
			// Fetch different types of brand analytics reports
			const reportTypes = [
				"market_basket",
				"search_query_performance",
				"repeat_purchase",
			];

			for (const reportType of reportTypes) {
				let reportData: any;

				switch (reportType) {
					case "market_basket":
						reportData =
							await this.config.providers.brandAnalytics.getMarketBasketAnalysis(
								marketplaceId,
								dateRange,
							);
						break;
					case "search_query_performance":
						reportData =
							await this.config.providers.brandAnalytics.getSearchQueryPerformance(
								marketplaceId,
								dateRange,
							);
						break;
					case "repeat_purchase":
						reportData =
							await this.config.providers.brandAnalytics.getRepeatPurchaseBehavior(
								marketplaceId,
								dateRange,
							);
						break;
				}

				if (reportData) {
					await this.repository.storeBrandAnalytics({
						organization_id: this.config.organization_id,
						integration_id: this.config.integration_id,
						report_type: reportType,
						marketplace_id: marketplaceId,
						report_date: dateRange.endDate,
						data: reportData,
						insights: {}, // Would process insights from raw data
					});
				}
			}

			console.log(
				`Brand analytics data synced successfully for marketplace ${marketplaceId}`,
			);
		} catch (error) {
			console.error(
				`Failed to sync brand analytics data for ${marketplaceId}:`,
				error,
			);
			throw error;
		}
	}

	// AI Insights Generation
	async generateAIInsights(
		asin?: string,
		marketplaceId?: string,
	): Promise<void> {
		try {
			// This would integrate with the AI Insights Engine
			// For now, we'll generate some mock insights based on the data

			const insights = [];

			if (asin && marketplaceId) {
				// Generate product-specific insights
				const searchSummary = await this.repository.getSearchPerformanceSummary(
					asin,
					marketplaceId,
				);
				const listingQuality = await this.repository.getListingQuality(
					asin,
					marketplaceId,
				);

				// Low CTR insight
				if (
					searchSummary.avgCTR < 2.0 &&
					searchSummary.totalImpressions > 1000
				) {
					insights.push({
						organization_id: this.config.organization_id,
						integration_id: this.config.integration_id,
						insight_id: `low-ctr-${asin}-${Date.now()}`,
						asin,
						marketplace_id: marketplaceId,
						type: "OPPORTUNITY",
						category: "SEARCH_PERFORMANCE",
						priority: "HIGH",
						title: "Low Click-Through Rate on High-Traffic Keywords",
						description: `Your product has ${searchSummary.totalImpressions} impressions but only ${searchSummary.avgCTR.toFixed(2)}% CTR. Optimizing titles and images could significantly increase traffic.`,
						impact_metric: "clicks",
						current_value: searchSummary.totalClicks,
						potential_value: Math.round(searchSummary.totalClicks * 2.5),
						percentage_change: 150,
						evidence: {
							dataPoints: [
								{
									source: "search_performance",
									metric: "ctr",
									value: `${searchSummary.avgCTR.toFixed(2)}%`,
								},
								{
									source: "search_performance",
									metric: "impressions",
									value: searchSummary.totalImpressions,
								},
							],
							confidence: 0.85,
						},
						recommendations: [
							{
								action: "Optimize product title with high-performing keywords",
								expectedResult: "Increase CTR by 2-3x",
								effort: "LOW",
								timeframe: "1-2 days",
							},
							{
								action: "Update main product image to be more appealing",
								expectedResult: "Improve visual click appeal",
								effort: "MEDIUM",
								timeframe: "1 week",
							},
						],
						related_asins: [asin],
						expires_at: new Date(
							Date.now() + 7 * 24 * 60 * 60 * 1000,
						).toISOString(), // 7 days
					});
				}

				// Low quality score insight
				if (listingQuality && listingQuality.overall_score < 70) {
					insights.push({
						organization_id: this.config.organization_id,
						integration_id: this.config.integration_id,
						insight_id: `low-quality-${asin}-${Date.now()}`,
						asin,
						marketplace_id: marketplaceId,
						type: "RECOMMENDATION",
						category: "LISTING_OPTIMIZATION",
						priority: "MEDIUM",
						title: "Listing Quality Below Optimal",
						description: `Your listing quality score is ${listingQuality.overall_score}/100. Improving key components could boost visibility and conversions.`,
						impact_metric: "conversion_rate",
						current_value: 5.2,
						potential_value: 7.8,
						percentage_change: 50,
						evidence: {
							dataPoints: [
								{
									source: "listing_analysis",
									metric: "overall_score",
									value: `${listingQuality.overall_score}/100`,
								},
								{
									source: "category_benchmark",
									metric: "avg_score",
									value: "74/100",
								},
							],
							confidence: 0.9,
						},
						recommendations: listingQuality.recommendations || [],
						related_asins: [asin],
						expires_at: new Date(
							Date.now() + 14 * 24 * 60 * 60 * 1000,
						).toISOString(), // 14 days
					});
				}
			}

			// Store the generated insights
			if (insights.length > 0) {
				await this.repository.storeAIInsights(insights);
				console.log(`Generated ${insights.length} AI insights`);
			}
		} catch (error) {
			console.error("Failed to generate AI insights:", error);
			throw error;
		}
	}

	// Optimization and Maintenance
	async runAnomalyDetection(): Promise<void> {
		try {
			await this.repository.runAnomalyDetection(this.config.organization_id);
			console.log("Anomaly detection completed successfully");
		} catch (error) {
			console.error("Failed to run anomaly detection:", error);
			throw error;
		}
	}

	async cleanupExpiredData(): Promise<void> {
		try {
			await this.repository.cleanupExpiredData();
			console.log("Expired data cleanup completed successfully");
		} catch (error) {
			console.error("Failed to cleanup expired data:", error);
			throw error;
		}
	}

	// Full sync operation
	async performFullSync(params: {
		asin?: string;
		marketplaceId?: string;
		advertiserId?: string;
	}): Promise<void> {
		console.log("Starting full Amazon data sync...");

		try {
			const operations = [];

			if (params.asin && params.marketplaceId) {
				operations.push(
					this.syncSearchPerformanceData(params.asin, params.marketplaceId),
				);
			}

			if (params.advertiserId) {
				operations.push(this.syncAttributionData(params.advertiserId));
			}

			if (params.marketplaceId) {
				operations.push(this.syncBrandAnalyticsData(params.marketplaceId));
			}

			// Run all sync operations in parallel
			await Promise.all(operations);

			// Generate insights after data sync
			await this.generateAIInsights(params.asin, params.marketplaceId);

			// Run anomaly detection
			await this.runAnomalyDetection();

			console.log("Full Amazon data sync completed successfully");
		} catch (error) {
			console.error("Full sync failed:", error);
			throw error;
		}
	}

	// Health check
	async healthCheck(): Promise<{
		status: "healthy" | "degraded" | "unhealthy";
		providers: Record<string, boolean>;
		lastSync: string | null;
	}> {
		const providerStatus: Record<string, boolean> = {};

		// Check each provider's health
		for (const [name, provider] of Object.entries(this.config.providers)) {
			if (provider) {
				try {
					await provider.healthCheck();
					providerStatus[name] = true;
				} catch {
					providerStatus[name] = false;
				}
			}
		}

		const healthyProviders =
			Object.values(providerStatus).filter(Boolean).length;
		const totalProviders = Object.keys(providerStatus).length;

		let status: "healthy" | "degraded" | "unhealthy";
		if (healthyProviders === totalProviders) {
			status = "healthy";
		} else if (healthyProviders > 0) {
			status = "degraded";
		} else {
			status = "unhealthy";
		}

		return {
			status,
			providers: providerStatus,
			lastSync: null, // Would track last successful sync timestamp
		};
	}
}
