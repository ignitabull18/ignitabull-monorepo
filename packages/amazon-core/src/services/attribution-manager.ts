/**
 * Attribution Manager Service
 * High-level service for managing Amazon Attribution campaigns and analyzing cross-channel performance
 */

import type { AttributionProvider } from "../providers/attribution";
import type {
	AttributionCampaign,
	AttributionCampaignType,
	AttributionModel,
	AttributionOptimizationSuggestion,
	AttributionReportRequest,
	CreateAttributionCampaignRequest,
	CrossChannelAnalysis,
} from "../types/attribution";
import type {
	AnalyticsRecommendation,
	CacheEntry,
	ChannelPattern,
} from "../types/common";
import { MemoryCache } from "../utils/cache";

export interface AttributionManagerConfig {
	defaultAttributionModel?: AttributionModel;
	optimizationThresholds?: {
		minROAS: number;
		minConversionRate: number;
		maxCostPerClick: number;
	};
	reportingDefaults?: {
		granularity: "DAILY" | "WEEKLY" | "MONTHLY";
		metrics: string[];
	};
	caching?: {
		enabled: boolean;
		ttl: number;
	};
}

export interface CampaignPerformanceSummary {
	campaignId: string;
	campaignName: string;
	campaignType: AttributionCampaignType;
	status: string;
	spend: number;
	impressions: number;
	clicks: number;
	detailPageViews: number;
	purchases: number;
	sales: number;
	unitsOrdered: number;
	returnOnAdSpend: number;
	clickThroughRate: number;
	conversionRate: number;
	costPerClick: number;
	costPerDetailPageView: number;
	costPerPurchase: number;
	newToBrandPercentage: number;
	efficiency: {
		score: number;
		rank: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
		recommendations: string[];
	};
	trends: {
		spendTrend: number;
		salesTrend: number;
		roasTrend: number;
		period: string;
	};
}

export interface CrossChannelInsights {
	totalCampaigns: number;
	totalSpend: number;
	totalSales: number;
	overallROAS: number;
	channelBreakdown: {
		channel: string;
		spend: number;
		sales: number;
		roas: number;
		contribution: number;
	}[];
	bestPerformingChannels: string[];
	underPerformingChannels: string[];
	opportunityChannels: string[];
	recommendations: {
		type:
			| "BUDGET_SHIFT"
			| "CHANNEL_EXPANSION"
			| "FREQUENCY_OPTIMIZATION"
			| "CREATIVE_REFRESH";
		priority: "HIGH" | "MEDIUM" | "LOW";
		description: string;
		expectedImpact: number;
		implementation: string;
	}[];
	customerJourneyInsights: {
		averagePathLength: number;
		averageTimeLag: number;
		topConversionPaths: string[];
		channelInteractionPatterns: ChannelPattern[];
	};
}

export interface AttributionBenchmarks {
	industry: string;
	campaignType: AttributionCampaignType;
	benchmarks: {
		clickThroughRate: { min: number; avg: number; max: number };
		conversionRate: { min: number; avg: number; max: number };
		costPerClick: { min: number; avg: number; max: number };
		returnOnAdSpend: { min: number; avg: number; max: number };
		detailPageViewRate: { min: number; avg: number; max: number };
	};
	performanceRanking: {
		yourRank: number;
		totalCompetitors: number;
		percentile: number;
	};
}

export class AttributionManager {
	private attributionProvider: AttributionProvider;
	private config: AttributionManagerConfig;
	private cache: MemoryCache<CacheEntry<unknown>>;

	constructor(
		attributionProvider: AttributionProvider,
		config: AttributionManagerConfig = {},
	) {
		this.attributionProvider = attributionProvider;
		this.config = {
			defaultAttributionModel: "DATA_DRIVEN",
			optimizationThresholds: {
				minROAS: 3.0,
				minConversionRate: 2.0,
				maxCostPerClick: 5.0,
			},
			reportingDefaults: {
				granularity: "DAILY",
				metrics: [
					"clicks",
					"detailPageViews",
					"purchases",
					"sales",
					"unitsOrdered",
				],
			},
			caching: {
				enabled: true,
				ttl: 300000, // 5 minutes
			},
			...config,
		};

		this.cache = new MemoryCache<CacheEntry<unknown>>({
			maxSize: 500,
			ttl: this.config.caching?.ttl || 300000,
			enabled: this.config.caching?.enabled ?? true,
		});
	}

	async getCampaignPerformanceDashboard(
		advertiserId: string,
		startDate: string,
		endDate: string,
	): Promise<{
		summary: CampaignPerformanceSummary[];
		totals: {
			totalSpend: number;
			totalSales: number;
			totalClicks: number;
			overallROAS: number;
		};
		topPerformers: CampaignPerformanceSummary[];
		underPerformers: CampaignPerformanceSummary[];
	}> {
		const cacheKey = `dashboard:${advertiserId}:${startDate}:${endDate}`;

		return this.cache.get(cacheKey, async () => {
			const campaigns =
				await this.attributionProvider.getAttributionCampaigns(advertiserId);

			const performanceSummaries: CampaignPerformanceSummary[] = [];
			let totalSpend = 0;
			let totalSales = 0;
			let totalClicks = 0;

			for (const campaign of campaigns) {
				const reportRequest: AttributionReportRequest = {
					advertiserId,
					reportType: "CAMPAIGN",
					reportingPeriod: { startDate, endDate },
					granularity: "DAILY",
					filters: [
						{
							field: "campaignId",
							operator: "EQUALS",
							value: campaign.campaignId,
						},
					],
				};

				const report =
					await this.attributionProvider.generateAttributionReport(
						reportRequest,
					);

				const summary: CampaignPerformanceSummary = {
					campaignId: campaign.campaignId,
					campaignName: campaign.campaignName,
					campaignType: campaign.campaignType,
					status: campaign.status,
					spend:
						report.metrics.totalSales > 0
							? report.metrics.totalSales / report.metrics.returnOnAdSpend
							: 0,
					impressions: 0, // Would come from display/video metrics
					clicks: report.metrics.totalClicks,
					detailPageViews: report.metrics.totalDetailPageViews,
					purchases: report.metrics.totalPurchases,
					sales: report.metrics.totalSales,
					unitsOrdered: report.metrics.totalUnitsOrdered,
					returnOnAdSpend: report.metrics.returnOnAdSpend,
					clickThroughRate: report.metrics.clickThroughRate,
					conversionRate: report.metrics.purchaseRate,
					costPerClick: report.metrics.costPerClick || 0,
					costPerDetailPageView: report.metrics.costPerDetailPageView || 0,
					costPerPurchase: report.metrics.costPerPurchase || 0,
					newToBrandPercentage: this.calculateNewToBrandPercentage(
						report.breakdown,
					),
					efficiency: this.calculateEfficiencyScore(report.metrics),
					trends: this.calculateTrends(report.breakdown),
				};

				performanceSummaries.push(summary);
				totalSpend += summary.spend;
				totalSales += summary.sales;
				totalClicks += summary.clicks;
			}

			const overallROAS = totalSpend > 0 ? totalSales / totalSpend : 0;

			// Sort by ROAS for top/bottom performers
			const sortedByROAS = [...performanceSummaries].sort(
				(a, b) => b.returnOnAdSpend - a.returnOnAdSpend,
			);

			return {
				summary: performanceSummaries,
				totals: {
					totalSpend,
					totalSales,
					totalClicks,
					overallROAS,
				},
				topPerformers: sortedByROAS.slice(0, 5),
				underPerformers: sortedByROAS.slice(-3).reverse(),
			};
		});
	}

	async generateCrossChannelInsights(
		advertiserId: string,
		startDate: string,
		endDate: string,
	): Promise<CrossChannelInsights> {
		const cacheKey = `cross-channel:${advertiserId}:${startDate}:${endDate}`;

		return this.cache.get(cacheKey, async () => {
			const crossChannelAnalysis =
				await this.attributionProvider.getCrossChannelAnalysis(
					advertiserId,
					startDate,
					endDate,
				);

			const campaigns =
				await this.attributionProvider.getAttributionCampaigns(advertiserId);

			let totalSpend = 0;
			let totalSales = 0;

			const channelPerformance = new Map<
				string,
				{ spend: number; sales: number; campaigns: number }
			>();

			// Aggregate by channel type
			for (const campaign of campaigns) {
				const channelType = this.mapCampaignTypeToChannel(
					campaign.campaignType,
				);
				const current = channelPerformance.get(channelType) || {
					spend: 0,
					sales: 0,
					campaigns: 0,
				};

				current.spend += campaign.performance.spend;
				current.sales += campaign.performance.sales;
				current.campaigns += 1;

				channelPerformance.set(channelType, current);

				totalSpend += campaign.performance.spend;
				totalSales += campaign.performance.sales;
			}

			const channelBreakdown = Array.from(channelPerformance.entries()).map(
				([channel, data]) => ({
					channel,
					spend: data.spend,
					sales: data.sales,
					roas: data.spend > 0 ? data.sales / data.spend : 0,
					contribution: totalSales > 0 ? (data.sales / totalSales) * 100 : 0,
				}),
			);

			// Sort channels by ROAS
			const sortedChannels = channelBreakdown.sort((a, b) => b.roas - a.roas);

			const overallROAS = totalSpend > 0 ? totalSales / totalSpend : 0;
			const avgROAS =
				channelBreakdown.reduce((sum, ch) => sum + ch.roas, 0) /
				channelBreakdown.length;

			return {
				totalCampaigns: campaigns.length,
				totalSpend,
				totalSales,
				overallROAS,
				channelBreakdown,
				bestPerformingChannels: sortedChannels
					.slice(0, 3)
					.map((ch) => ch.channel),
				underPerformingChannels: sortedChannels
					.filter((ch) => ch.roas < avgROAS * 0.7)
					.map((ch) => ch.channel),
				opportunityChannels: this.identifyOpportunityChannels(
					channelBreakdown,
					avgROAS,
				),
				recommendations: this.generateCrossChannelRecommendations(
					channelBreakdown,
					crossChannelAnalysis,
				),
				customerJourneyInsights: {
					averagePathLength:
						crossChannelAnalysis.customerJourney.averageJourneyLength,
					averageTimeLag: crossChannelAnalysis.customerJourney.averageTimeLag,
					topConversionPaths: crossChannelAnalysis.customerJourney.commonPaths
						.slice(0, 5)
						.map((p) => p.path.join(" → ")),
					channelInteractionPatterns:
						crossChannelAnalysis.crossChannelMetrics.channelOverlap,
				},
			};
		});
	}

	async optimizeCampaignPerformance(campaignId: string): Promise<{
		currentPerformance: CampaignPerformanceSummary;
		optimizationSuggestions: AttributionOptimizationSuggestion[];
		implementationPlan: {
			quickWins: string[];
			mediumTermActions: string[];
			longTermStrategy: string[];
		};
		projectedImpact: {
			roasImprovement: number;
			salesIncrease: number;
			efficiencyGain: number;
		};
	}> {
		const cacheKey = `optimize:${campaignId}`;

		return this.cache.get(cacheKey, async () => {
			const suggestions =
				await this.attributionProvider.getOptimizationSuggestions(campaignId);

			// Get current performance
			const campaigns = await this.attributionProvider.getAttributionCampaigns(
				"",
				[{ field: "campaignId", operator: "EQUALS", value: campaignId }],
			);

			if (campaigns.length === 0) {
				throw new Error(`Campaign ${campaignId} not found`);
			}

			const campaign = campaigns[0];
			const currentPerformance: CampaignPerformanceSummary = {
				campaignId: campaign.campaignId,
				campaignName: campaign.campaignName,
				campaignType: campaign.campaignType,
				status: campaign.status,
				spend: campaign.performance.spend,
				impressions: campaign.performance.impressions,
				clicks: campaign.performance.clicks,
				detailPageViews: campaign.performance.detailPageViews,
				purchases: campaign.performance.purchases,
				sales: campaign.performance.sales,
				unitsOrdered: campaign.performance.unitsOrdered,
				returnOnAdSpend: campaign.performance.returnOnAdSpend,
				clickThroughRate: campaign.performance.clickThroughRate,
				conversionRate: campaign.performance.attributionRate,
				costPerClick: campaign.performance.costPerClick,
				costPerDetailPageView: 0,
				costPerPurchase: 0,
				newToBrandPercentage: 0,
				efficiency: this.calculateEfficiencyScore(campaign.performance),
				trends: {
					spendTrend: 0,
					salesTrend: 0,
					roasTrend: 0,
					period: "7d",
				},
			};

			const implementationPlan = this.categorizeOptimizations(suggestions);
			const projectedImpact = this.calculateProjectedImpact(
				suggestions,
				currentPerformance,
			);

			return {
				currentPerformance,
				optimizationSuggestions: suggestions,
				implementationPlan,
				projectedImpact,
			};
		});
	}

	async getBenchmarkAnalysis(
		campaignType: AttributionCampaignType,
		industry = "General",
	): Promise<AttributionBenchmarks> {
		const cacheKey = `benchmarks:${campaignType}:${industry}`;

		return this.cache.get(
			cacheKey,
			async () => {
				// In a real implementation, this would fetch from a benchmarks service
				const benchmarks: AttributionBenchmarks = {
					industry,
					campaignType,
					benchmarks: {
						clickThroughRate: { min: 0.5, avg: 2.1, max: 5.8 },
						conversionRate: { min: 1.2, avg: 3.4, max: 8.1 },
						costPerClick: { min: 0.25, avg: 1.85, max: 6.5 },
						returnOnAdSpend: { min: 2.0, avg: 4.2, max: 12.5 },
						detailPageViewRate: { min: 8.5, avg: 15.2, max: 28.7 },
					},
					performanceRanking: {
						yourRank: 0, // Would be calculated based on actual performance
						totalCompetitors: 0,
						percentile: 0,
					},
				};

				return benchmarks;
			},
			3600000,
		); // Cache for 1 hour
	}

	async createOptimizedCampaign(
		request: CreateAttributionCampaignRequest,
		optimizationGoals: {
			primaryKPI: "ROAS" | "SALES" | "EFFICIENCY" | "REACH";
			budgetAllocation: "AGGRESSIVE" | "MODERATE" | "CONSERVATIVE";
			targetAudience: "BROAD" | "FOCUSED" | "LOOKALIKE";
		},
	): Promise<AttributionCampaign> {
		// Apply optimization logic to the campaign request
		const optimizedRequest = this.applyOptimizationToRequest(
			request,
			optimizationGoals,
		);

		return await this.attributionProvider.createAttributionCampaign(
			optimizedRequest,
		);
	}

	private calculateNewToBrandPercentage(
		breakdown: Array<{
			purchases: number;
			newToBrandPurchases?: number;
		}>,
	): number {
		if (breakdown.length === 0) return 0;

		const totalPurchases = breakdown.reduce(
			(sum, day) => sum + day.purchases,
			0,
		);
		const newToBrandPurchases = breakdown.reduce(
			(sum, day) => sum + (day.newToBrandPurchases || 0),
			0,
		);

		return totalPurchases > 0
			? (newToBrandPurchases / totalPurchases) * 100
			: 0;
	}

	private calculateEfficiencyScore(metrics: {
		returnOnAdSpend: number;
		purchaseRate?: number;
		costPerClick?: number;
	}): {
		score: number;
		rank: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
		recommendations: string[];
	} {
		const thresholds = this.config.optimizationThresholds!;
		let score = 0;
		const recommendations: string[] = [];

		// ROAS component (40% weight)
		if (metrics.returnOnAdSpend >= thresholds.minROAS * 1.5) {
			score += 40;
		} else if (metrics.returnOnAdSpend >= thresholds.minROAS) {
			score += 25;
			recommendations.push("Consider increasing ROAS to exceed 4.5x");
		} else {
			score += 10;
			recommendations.push(
				"ROAS is below target - optimize targeting and creatives",
			);
		}

		// Conversion rate component (30% weight)
		const conversionRate = metrics.purchaseRate || 0;
		if (conversionRate >= thresholds.minConversionRate * 2) {
			score += 30;
		} else if (conversionRate >= thresholds.minConversionRate) {
			score += 20;
			recommendations.push(
				"Improve conversion rate through better landing pages",
			);
		} else {
			score += 5;
			recommendations.push(
				"Low conversion rate - review target audience and messaging",
			);
		}

		// Cost efficiency component (30% weight)
		const cpc = metrics.costPerClick || 0;
		if (cpc <= thresholds.maxCostPerClick * 0.5) {
			score += 30;
		} else if (cpc <= thresholds.maxCostPerClick) {
			score += 20;
			recommendations.push(
				"Monitor cost per click - consider bid optimization",
			);
		} else {
			score += 5;
			recommendations.push("High cost per click - review bidding strategy");
		}

		let rank: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
		if (score >= 80) rank = "EXCELLENT";
		else if (score >= 60) rank = "GOOD";
		else if (score >= 40) rank = "AVERAGE";
		else rank = "POOR";

		return { score, rank, recommendations };
	}

	private calculateTrends(
		breakdown: Array<{
			sales: number;
			returnOnAdSpend?: number;
		}>,
	): {
		spendTrend: number;
		salesTrend: number;
		roasTrend: number;
		period: string;
	} {
		if (breakdown.length < 2) {
			return { spendTrend: 0, salesTrend: 0, roasTrend: 0, period: "7d" };
		}

		const recent = breakdown.slice(-7); // Last 7 days
		const previous = breakdown.slice(-14, -7); // Previous 7 days

		const recentSpend = recent.reduce(
			(sum, day) => sum + day.sales / (day.returnOnAdSpend || 1),
			0,
		);
		const previousSpend = previous.reduce(
			(sum, day) => sum + day.sales / (day.returnOnAdSpend || 1),
			0,
		);

		const recentSales = recent.reduce((sum, day) => sum + day.sales, 0);
		const previousSales = previous.reduce((sum, day) => sum + day.sales, 0);

		const recentROAS = recentSpend > 0 ? recentSales / recentSpend : 0;
		const previousROAS = previousSpend > 0 ? previousSales / previousSpend : 0;

		return {
			spendTrend:
				previousSpend > 0
					? ((recentSpend - previousSpend) / previousSpend) * 100
					: 0,
			salesTrend:
				previousSales > 0
					? ((recentSales - previousSales) / previousSales) * 100
					: 0,
			roasTrend:
				previousROAS > 0
					? ((recentROAS - previousROAS) / previousROAS) * 100
					: 0,
			period: "7d",
		};
	}

	private mapCampaignTypeToChannel(
		campaignType: AttributionCampaignType,
	): string {
		const mapping: Record<AttributionCampaignType, string> = {
			SEARCH: "Search",
			DISPLAY: "Display",
			VIDEO: "Video",
			SHOPPING: "Shopping",
			SOCIAL: "Social Media",
			STREAMING_TV: "Connected TV",
			AUDIO: "Audio/Podcast",
			EMAIL: "Email",
			AFFILIATE: "Affiliate",
			INFLUENCER: "Influencer",
		};
		return mapping[campaignType] || campaignType;
	}

	private identifyOpportunityChannels(
		channelBreakdown: Array<{
			channel: string;
			roas: number;
			contribution: number;
		}>,
		avgROAS: number,
	): string[] {
		return channelBreakdown
			.filter(
				(channel) => channel.roas > avgROAS && channel.contribution < 15, // Low contribution but good ROAS
			)
			.map((channel) => channel.channel);
	}

	private generateCrossChannelRecommendations(
		channelBreakdown: Array<{
			channel: string;
			roas: number;
			contribution: number;
		}>,
		_crossChannelAnalysis: CrossChannelAnalysis,
	): AnalyticsRecommendation[] {
		const recommendations: AnalyticsRecommendation[] = [];

		// Budget reallocation recommendation
		const topChannel = channelBreakdown.reduce((best, current) =>
			current.roas > best.roas ? current : best,
		);

		if (topChannel.roas > 5.0 && topChannel.contribution < 30) {
			recommendations.push({
				type: "BUDGET_SHIFT",
				priority: "HIGH",
				description: `Increase budget allocation to ${topChannel.channel} (+25%) due to strong ROAS of ${topChannel.roas.toFixed(2)}x`,
				expectedImpact: 15,
				implementation:
					"Shift budget from underperforming channels over 2 weeks",
			});
		}

		// Channel expansion recommendation
		const missingChannels = [
			"Connected TV",
			"Audio/Podcast",
			"Influencer",
		].filter(
			(channel) => !channelBreakdown.some((cb) => cb.channel === channel),
		);

		if (missingChannels.length > 0) {
			recommendations.push({
				type: "CHANNEL_EXPANSION",
				priority: "MEDIUM",
				description: `Explore ${missingChannels[0]} to diversify channel mix and reach new audiences`,
				expectedImpact: 10,
				implementation: "Start with 10% budget allocation test campaign",
			});
		}

		return recommendations;
	}

	private categorizeOptimizations(
		suggestions: AttributionOptimizationSuggestion[],
	): {
		quickWins: string[];
		mediumTermActions: string[];
		longTermStrategy: string[];
	} {
		const quickWins: string[] = [];
		const mediumTermActions: string[] = [];
		const longTermStrategy: string[] = [];

		suggestions.forEach((suggestion) => {
			if (
				suggestion.implementation.effort === "LOW" &&
				suggestion.priority === "HIGH"
			) {
				quickWins.push(suggestion.title);
			} else if (suggestion.implementation.effort === "MEDIUM") {
				mediumTermActions.push(suggestion.title);
			} else {
				longTermStrategy.push(suggestion.title);
			}
		});

		return { quickWins, mediumTermActions, longTermStrategy };
	}

	private calculateProjectedImpact(
		suggestions: AttributionOptimizationSuggestion[],
		_currentPerformance: CampaignPerformanceSummary,
	): {
		roasImprovement: number;
		salesIncrease: number;
		efficiencyGain: number;
	} {
		let totalROASImprovement = 0;
		let totalSalesIncrease = 0;
		let totalEfficiencyGain = 0;

		suggestions.forEach((suggestion) => {
			if (suggestion.projectedImprovement.metric === "ROAS") {
				totalROASImprovement += suggestion.projectedImprovement.improvement;
			} else if (suggestion.projectedImprovement.metric === "sales") {
				totalSalesIncrease += suggestion.projectedImprovement.improvement;
			} else if (suggestion.projectedImprovement.metric === "efficiency") {
				totalEfficiencyGain += suggestion.projectedImprovement.improvement;
			}
		});

		return {
			roasImprovement: Math.min(totalROASImprovement, 50), // Cap at 50%
			salesIncrease: Math.min(totalSalesIncrease, 30), // Cap at 30%
			efficiencyGain: Math.min(totalEfficiencyGain, 25), // Cap at 25%
		};
	}

	private applyOptimizationToRequest(
		request: CreateAttributionCampaignRequest,
		goals: any,
	): CreateAttributionCampaignRequest {
		const optimizedRequest = { ...request };

		// Apply budget optimization based on goals
		if (
			goals.budgetAllocation === "AGGRESSIVE" &&
			optimizedRequest.dailyBudget
		) {
			optimizedRequest.dailyBudget *= 1.5;
		} else if (
			goals.budgetAllocation === "CONSERVATIVE" &&
			optimizedRequest.dailyBudget
		) {
			optimizedRequest.dailyBudget *= 0.7;
		}

		// Apply bidding strategy based on primary KPI
		if (goals.primaryKPI === "ROAS") {
			optimizedRequest.bidStrategy = "target_roas";
		} else if (goals.primaryKPI === "SALES") {
			optimizedRequest.bidStrategy = "maximize_conversions";
		} else if (goals.primaryKPI === "EFFICIENCY") {
			optimizedRequest.bidStrategy = "target_cpa";
		}

		return optimizedRequest;
	}
}
