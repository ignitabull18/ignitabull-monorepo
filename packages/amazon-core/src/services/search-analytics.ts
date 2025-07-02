/**
 * Search Analytics Service
 * High-level service for search performance analytics and SEO insights
 */

import { AmazonServiceError } from "../errors/base";
import type { SearchPerformanceProvider } from "../providers/search-performance";
import type { SPAPIProvider } from "../providers/sp-api";
import type {
	CompetitorSearchAnalysis,
	KeywordRanking,
	LongTailOpportunity,
	SEORecommendation,
	SearchAnomaly,
	SearchPerformanceReport,
} from "../types/search-performance";
import { MemoryCache } from "../utils/cache";
import { createProviderLogger } from "../utils/logger";

/**
 * Search analytics configuration
 */
export interface SearchAnalyticsConfig {
	enableAutoTracking?: boolean;
	competitorTracking?: {
		enabled: boolean;
		maxCompetitors: number;
		updateFrequency: "DAILY" | "WEEKLY" | "MONTHLY";
	};
	alerting?: {
		enabled: boolean;
		thresholds: {
			rankingDrop: number;
			visibilityDrop: number;
			anomalyDetection: boolean;
		};
	};
	reporting?: {
		autoGenerate: boolean;
		frequency: "DAILY" | "WEEKLY" | "MONTHLY";
		includeCompetitors: boolean;
	};
}

/**
 * SEO action plan
 */
export interface SEOActionPlan {
	asin: string;
	productTitle: string;
	currentScore: number;
	targetScore: number;
	prioritizedActions: Array<{
		action: SEORecommendation;
		estimatedImpact: number;
		estimatedEffort: "LOW" | "MEDIUM" | "HIGH";
		timeline: string;
	}>;
	projectedResults: {
		visibilityIncrease: number;
		trafficIncrease: number;
		revenueIncrease: number;
	};
}

/**
 * Competitive landscape analysis
 */
export interface CompetitiveLandscape {
	marketplaceId: string;
	category: string;
	yourPosition: number;
	topCompetitors: Array<{
		asin: string;
		brand: string;
		visibilityScore: number;
		sharedKeywords: number;
		uniqueAdvantages: string[];
	}>;
	opportunities: {
		underservedKeywords: string[];
		contentGaps: string[];
		pricingOpportunities: string[];
	};
	threats: {
		risingCompetitors: string[];
		keywordLosses: string[];
		marketShifts: string[];
	};
}

/**
 * Search performance dashboard data
 */
export interface SearchDashboard {
	overview: {
		visibilityScore: number;
		visibilityTrend: "UP" | "DOWN" | "STABLE";
		totalImpressions: number;
		totalClicks: number;
		averageCTR: number;
		topKeywords: string[];
	};
	rankings: {
		improved: KeywordRanking[];
		declined: KeywordRanking[];
		new: KeywordRanking[];
		lost: KeywordRanking[];
	};
	opportunities: LongTailOpportunity[];
	anomalies: SearchAnomaly[];
	recommendations: SEORecommendation[];
}

/**
 * Search Analytics Service
 */
export class SearchAnalyticsService {
	private readonly logger = createProviderLogger("search-analytics-service");
	private readonly cache = new MemoryCache({
		enabled: true,
		ttl: 900,
		maxSize: 200,
		keyPrefix: "amazon_search_analytics",
	});
	private readonly config: SearchAnalyticsConfig;

	constructor(
		private readonly searchProvider: SearchPerformanceProvider,
		private readonly spApiProvider: SPAPIProvider,
		config: SearchAnalyticsConfig = {},
	) {
		this.config = {
			enableAutoTracking: true,
			competitorTracking: {
				enabled: true,
				maxCompetitors: 10,
				updateFrequency: "WEEKLY",
			},
			alerting: {
				enabled: true,
				thresholds: {
					rankingDrop: 5,
					visibilityDrop: 10,
					anomalyDetection: true,
				},
			},
			reporting: {
				autoGenerate: true,
				frequency: "WEEKLY",
				includeCompetitors: true,
			},
			...config,
		};

		this.logger.info("Search Analytics Service initialized", {
			config: this.config,
		});
	}

	/**
	 * Get comprehensive search dashboard
	 */
	async getSearchDashboard(
		asin: string,
		marketplaceId: string,
		dateRange?: { startDate: string; endDate: string },
	): Promise<SearchDashboard> {
		const cacheKey = `dashboard:${asin}:${marketplaceId}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as SearchDashboard;
		}

		try {
			const range = dateRange || this.getDefaultDateRange();

			// First fetch metrics and visibility
			const [visibility, metrics] = await Promise.all([
				this.searchProvider.getSearchVisibilityScore(asin, marketplaceId),
				this.searchProvider.getSearchQueryMetrics(asin, range, marketplaceId),
			]);

			// Then fetch the rest using metrics data
			const [rankings, opportunities, anomalies, recommendations] =
				await Promise.all([
					this.getKeywordRankingChanges(asin, marketplaceId),
					this.searchProvider.findLongTailOpportunities(
						(metrics as any[]).slice(0, 5).map((m: any) => m.query),
						marketplaceId,
					),
					this.searchProvider.detectSearchAnomalies(asin, range, marketplaceId),
					this.searchProvider.getSEORecommendations(asin, marketplaceId),
				]);

			const totalImpressions = metrics.reduce(
				(sum: number, m: any) => sum + m.impressions,
				0,
			);
			const totalClicks = metrics.reduce((sum, m: any) => sum + m.clicks, 0);

			const dashboard: SearchDashboard = {
				overview: {
					visibilityScore: visibility.overallScore,
					visibilityTrend: this.calculateTrend(visibility.overallScore),
					totalImpressions,
					totalClicks,
					averageCTR:
						totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
					topKeywords: metrics.slice(0, 5).map((m: any) => m.query),
				},
				rankings,
				opportunities: opportunities.slice(0, 10),
				anomalies,
				recommendations: recommendations.slice(0, 5),
			};

			await this.cache.set(cacheKey, dashboard, 1800); // Cache for 30 minutes
			return dashboard;
		} catch (error) {
			this.logger.error("Failed to generate search dashboard", error instanceof Error ? error : new Error(String(error)), { asin });
			throw new AmazonServiceError("Failed to generate search dashboard", {
				cause: { asin, originalError: error },
			});
		}
	}

	/**
	 * Generate SEO action plan
	 */
	async generateSEOActionPlan(
		asin: string,
		marketplaceId: string,
	): Promise<SEOActionPlan> {
		try {
			// Get product details
			const product = await this.spApiProvider.getCatalogItem(asin, [
				marketplaceId,
			]);

			// Get current quality score and recommendations
			const [qualityScore, recommendations] = await Promise.all([
				this.searchProvider.getListingQualityScore(asin, marketplaceId),
				this.searchProvider.getSEORecommendations(asin, marketplaceId),
			]);

			// Calculate estimated impact for each action
			const prioritizedActions = recommendations
				.map((rec) => ({
					action: rec,
					estimatedImpact: this.calculateActionImpact(rec),
					estimatedEffort:
						rec.implementation.difficulty === "EASY"
							? ("LOW" as const)
							: rec.implementation.difficulty === "MEDIUM"
								? ("MEDIUM" as const)
								: ("HIGH" as const),
					timeline: this.estimateTimeline(rec),
				}))
				.sort((a, b) => {
					// Sort by impact/effort ratio
					const ratioA =
						a.estimatedImpact /
						(a.estimatedEffort === "LOW"
							? 1
							: a.estimatedEffort === "MEDIUM"
								? 2
								: 3);
					const ratioB =
						b.estimatedImpact /
						(b.estimatedEffort === "LOW"
							? 1
							: b.estimatedEffort === "MEDIUM"
								? 2
								: 3);
					return ratioB - ratioA;
				});

			// Calculate projected results
			const totalVisibilityIncrease = recommendations.reduce(
				(sum, rec) => sum + rec.expectedImpact.visibilityIncrease,
				0,
			);
			const totalTrafficIncrease = recommendations.reduce(
				(sum, rec) => sum + rec.expectedImpact.trafficIncrease,
				0,
			);
			const totalConversionIncrease = recommendations.reduce(
				(sum, rec) => sum + rec.expectedImpact.conversionIncrease,
				0,
			);

			const projectedRevenueIncrease =
				(totalTrafficIncrease / 100) *
				(1 + totalConversionIncrease / 100) *
				100;

			const actionPlan: SEOActionPlan = {
				asin,
				productTitle: product.attributes?.title || "Unknown Product",
				currentScore: qualityScore.overallScore,
				targetScore: Math.min(
					qualityScore.overallScore + totalVisibilityIncrease,
					100,
				),
				prioritizedActions,
				projectedResults: {
					visibilityIncrease: totalVisibilityIncrease,
					trafficIncrease: totalTrafficIncrease,
					revenueIncrease: projectedRevenueIncrease,
				},
			};

			return actionPlan;
		} catch (error) {
			this.logger.error("Failed to generate SEO action plan", error instanceof Error ? error : new Error(String(error)), { asin });
			throw new AmazonServiceError("Failed to generate SEO action plan", {
				cause: { asin, originalError: error },
			});
		}
	}

	/**
	 * Analyze competitive landscape
	 */
	async analyzeCompetitiveLandscape(
		asin: string,
		category: string,
		marketplaceId: string,
	): Promise<CompetitiveLandscape> {
		try {
			// Get top competitors (would need category search API)
			const competitorAsins = await this.findTopCompetitors(
				asin,
				category,
				marketplaceId,
			);

			// Analyze each competitor
			const competitorAnalyses = await this.searchProvider.analyzeCompetitors(
				asin,
				competitorAsins,
				marketplaceId,
			);

			// Get visibility scores for all
			const visibilityScores = await Promise.all([
				this.searchProvider.getSearchVisibilityScore(asin, marketplaceId),
				...competitorAsins.map((compAsin) =>
					this.searchProvider.getSearchVisibilityScore(compAsin, marketplaceId),
				),
			]);

			const yourScore = visibilityScores[0];
			const competitorScores = visibilityScores.slice(1);

			// Build competitive landscape
			const landscape: CompetitiveLandscape = {
				marketplaceId,
				category,
				yourPosition:
					competitorScores.filter(
						(s) => s.overallScore > yourScore.overallScore,
					).length + 1,
				topCompetitors: competitorAnalyses.map((analysis, index) => ({
					asin: analysis.competitorAsin,
					brand: analysis.competitorBrand,
					visibilityScore: competitorScores[index].overallScore,
					sharedKeywords: analysis.sharedKeywords.length,
					uniqueAdvantages: this.identifyCompetitorAdvantages(analysis),
				})),
				opportunities: {
					underservedKeywords: await this.findUnderservedKeywords(
						asin,
						competitorAsins,
						marketplaceId,
					),
					contentGaps: this.identifyContentGaps(competitorAnalyses),
					pricingOpportunities: [], // Would need pricing data
				},
				threats: {
					risingCompetitors: competitorAnalyses
						.filter((a) => a.threatLevel === "HIGH")
						.map((a) => a.competitorBrand),
					keywordLosses: competitorAnalyses
						.flatMap((a) =>
							a.rankingComparison.filter((r) => r.advantage === "COMPETITOR"),
						)
						.map((r) => r.keyword),
					marketShifts: [], // Would need trend analysis
				},
			};

			return landscape;
		} catch (error) {
			this.logger.error("Failed to analyze competitive landscape", error instanceof Error ? error : new Error(String(error)), {
				asin,
				category,
			});
			throw new AmazonServiceError("Failed to analyze competitive landscape", {
				cause: { asin, category, originalError: error },
			});
		}
	}

	/**
	 * Track keyword performance over time
	 */
	async trackKeywordPerformance(
		asin: string,
		keywords: string[],
		marketplaceId: string,
	): Promise<Map<string, KeywordRanking[]>> {
		const trackingData = new Map<string, KeywordRanking[]>();

		try {
			// Get current rankings
			const currentRankings = await this.searchProvider.getKeywordRankings(
				asin,
				keywords,
				marketplaceId,
			);

			// Store in tracking system (would need persistent storage)
			for (const ranking of currentRankings) {
				const history = trackingData.get(ranking.keyword) || [];
				history.push(ranking);
				trackingData.set(ranking.keyword, history);
			}

			// Alert on significant changes
			if (this.config.alerting?.enabled) {
				await this.checkRankingAlerts(currentRankings);
			}

			return trackingData;
		} catch (error) {
			this.logger.error("Failed to track keyword performance", error instanceof Error ? error : new Error(String(error)), {
				asin,
				keywords,
			});
			throw new AmazonServiceError("Failed to track keyword performance", {
				cause: { asin, keywords, originalError: error },
			});
		}
	}

	/**
	 * Generate comprehensive search performance report
	 */
	async generateComprehensiveReport(
		asin: string,
		marketplaceId: string,
		dateRange: { startDate: string; endDate: string },
		includeCompetitors = true,
	): Promise<
		SearchPerformanceReport & { competitiveLandscape?: CompetitiveLandscape }
	> {
		try {
			// Generate base report
			const baseReport =
				await this.searchProvider.generateSearchPerformanceReport(
					asin,
					dateRange,
					marketplaceId,
				);

			// Get product details
			const product = await this.spApiProvider.getCatalogItem(asin, [
				marketplaceId,
			]);

			// Add competitive analysis if requested
			if (includeCompetitors && this.config.reporting?.includeCompetitors) {
				const landscape = await this.analyzeCompetitiveLandscape(
					asin,
					product.attributes?.category || "general",
					marketplaceId,
				);

				return {
					...baseReport,
					competitiveLandscape: landscape,
				};
			}

			return baseReport;
		} catch (error) {
			this.logger.error("Failed to generate comprehensive report", error instanceof Error ? error : new Error(String(error)), {
				asin,
			});
			throw new AmazonServiceError("Failed to generate comprehensive report", {
				cause: { asin, originalError: error },
			});
		}
	}

	/**
	 * Optimize for voice search
	 */
	async optimizeForVoiceSearch(
		asin: string,
		marketplaceId: string,
	): Promise<{
		currentOptimization: number;
		recommendations: string[];
		estimatedImpact: number;
	}> {
		try {
			const voiceOptimizations =
				await this.searchProvider.analyzeVoiceSearchOptimization(
					asin,
					marketplaceId,
				);

			const avgScore =
				voiceOptimizations.reduce(
					(sum, opt) => sum + opt.naturalLanguageScore,
					0,
				) / voiceOptimizations.length;

			const allRecommendations = voiceOptimizations.flatMap((opt) => [
				...opt.recommendations.questionPhrases,
				...opt.recommendations.featuredSnippetOptimization,
			]);

			return {
				currentOptimization: avgScore,
				recommendations: [...new Set(allRecommendations)].slice(0, 10),
				estimatedImpact: (100 - avgScore) * 0.15, // 15% of gap as potential impact
			};
		} catch (error) {
			this.logger.error("Failed to optimize for voice search", error instanceof Error ? error : new Error(String(error)), { asin });
			throw new AmazonServiceError("Failed to optimize for voice search", {
				cause: { asin, originalError: error },
			});
		}
	}

	// Private helper methods

	private getDefaultDateRange(): { startDate: string; endDate: string } {
		const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

		return {
			startDate: startDate.toISOString().split("T")[0],
			endDate: endDate.toISOString().split("T")[0],
		};
	}

	private calculateTrend(score: number): "UP" | "DOWN" | "STABLE" {
		// Would need historical data for real trend
		if (score > 75) return "UP";
		if (score < 60) return "DOWN";
		return "STABLE";
	}

	private async getKeywordRankingChanges(
		asin: string,
		marketplaceId: string,
	): Promise<{
		improved: KeywordRanking[];
		declined: KeywordRanking[];
		new: KeywordRanking[];
		lost: KeywordRanking[];
	}> {
		// Would need historical data - returning mock data
		const currentRankings = await this.searchProvider.getKeywordRankings(
			asin,
			["wireless earbuds", "bluetooth headphones"],
			marketplaceId,
		);

		return {
			improved: currentRankings.filter((r) => r.rankChange > 0),
			declined: currentRankings.filter((r) => r.rankChange < 0),
			new: [],
			lost: [],
		};
	}

	private calculateActionImpact(recommendation: SEORecommendation): number {
		const weights = {
			visibilityIncrease: 0.4,
			trafficIncrease: 0.4,
			conversionIncrease: 0.2,
		};

		return (
			recommendation.expectedImpact.visibilityIncrease *
				weights.visibilityIncrease +
			recommendation.expectedImpact.trafficIncrease * weights.trafficIncrease +
			recommendation.expectedImpact.conversionIncrease *
				weights.conversionIncrease
		);
	}

	private estimateTimeline(recommendation: SEORecommendation): string {
		const time = recommendation.implementation.timeRequired;
		const difficulty = recommendation.implementation.difficulty;

		if (difficulty === "EASY") return `1-2 days (${time})`;
		if (difficulty === "MEDIUM") return `3-5 days (${time})`;
		return `1-2 weeks (${time})`;
	}

	private async findTopCompetitors(
		_asin: string,
		_category: string,
		_marketplaceId: string,
	): Promise<string[]> {
		// Mock implementation - would need category search API
		return ["B002345678", "B003456789", "B004567890", "B005678901"];
	}

	private identifyCompetitorAdvantages(
		analysis: CompetitorSearchAnalysis,
	): string[] {
		const advantages: string[] = [];

		if (analysis.exclusiveKeywords.length > 5) {
			advantages.push("Strong keyword portfolio");
		}

		const winningKeywords = analysis.rankingComparison.filter(
			(r) => r.advantage === "COMPETITOR",
		).length;
		if (winningKeywords > analysis.rankingComparison.length / 2) {
			advantages.push("Superior ranking positions");
		}

		if (analysis.overlapScore < 50) {
			advantages.push("Unique market positioning");
		}

		return advantages;
	}

	private async findUnderservedKeywords(
		_asin: string,
		_competitorAsins: string[],
		_marketplaceId: string,
	): Promise<string[]> {
		// Would analyze competitor keywords to find gaps
		return ["long tail keyword 1", "niche keyword 2", "emerging trend keyword"];
	}

	private identifyContentGaps(analyses: CompetitorSearchAnalysis[]): string[] {
		const gaps: string[] = [];

		// Analyze exclusive keywords to identify content themes
		const allExclusiveKeywords = analyses.flatMap((a) => a.exclusiveKeywords);

		if (
			allExclusiveKeywords.some(
				(k) => k.includes("guide") || k.includes("how to"),
			)
		) {
			gaps.push("Educational content missing");
		}

		if (
			allExclusiveKeywords.some(
				(k) => k.includes("vs") || k.includes("compare"),
			)
		) {
			gaps.push("Comparison content needed");
		}

		if (
			allExclusiveKeywords.some(
				(k) => k.includes("review") || k.includes("best"),
			)
		) {
			gaps.push("Social proof content lacking");
		}

		return gaps;
	}

	private async checkRankingAlerts(rankings: KeywordRanking[]): Promise<void> {
		const threshold = this.config.alerting?.thresholds.rankingDrop || 5;

		for (const ranking of rankings) {
			if (ranking.rankChange < -threshold) {
				this.logger.warn("Significant ranking drop detected", {
					keyword: ranking.keyword,
					previousRank: ranking.previousRank,
					currentRank: ranking.currentRank,
					drop: -ranking.rankChange,
				});
				// Would send actual alert here
			}
		}
	}
}
