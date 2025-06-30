/**
 * AI Insights Engine tests
 */

import {
	beforeEach,
	describe,
	expect,
	it,
	type MockedFunction,
	vi,
} from "vitest";
import type { AdvertisingProvider } from "../../providers/advertising";
import type { BrandAnalyticsProvider } from "../../providers/brand-analytics";
import type { DSPProvider } from "../../providers/dsp";
import type { SearchPerformanceProvider } from "../../providers/search-performance";
import {
	AIInsightsEngine,
	type PredictiveAnalytics,
} from "../ai-insights-engine";

// Mock providers
const mockSearchProvider = {
	providerId: "search-performance",
	name: "Search Performance Analytics",
	version: "1.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
	getSearchQueryMetrics: vi.fn(),
	getKeywordRankings: vi.fn(),
	getListingQualityScore: vi.fn(),
	analyzeCompetitors: vi.fn(),
} as unknown as SearchPerformanceProvider;

const mockBrandAnalyticsProvider = {
	providerId: "brand-analytics",
	name: "Amazon Brand Analytics API",
	version: "1.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
	getMarketBasketAnalysis: vi.fn(),
	getSearchQueryPerformance: vi.fn(),
	getRepeatPurchaseBehavior: vi.fn(),
} as unknown as BrandAnalyticsProvider;

const mockAdvertisingProvider = {
	providerId: "advertising",
	name: "Amazon Advertising API",
	version: "3.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
} as unknown as AdvertisingProvider;

const mockDSPProvider = {
	providerId: "dsp",
	name: "Amazon DSP API",
	version: "1.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
} as unknown as DSPProvider;

describe("AIInsightsEngine", () => {
	let aiEngine: AIInsightsEngine;

	beforeEach(() => {
		vi.clearAllMocks();
		aiEngine = new AIInsightsEngine(
			mockSearchProvider,
			mockBrandAnalyticsProvider,
			mockAdvertisingProvider,
			mockDSPProvider,
		);
	});

	describe("generateProductInsights", () => {
		it("should generate comprehensive insights for a product", async () => {
			// Mock search metrics data
			const mockSearchMetrics = [
				{
					query: "wireless earbuds",
					impressions: 10000,
					clicks: 300,
					clickThroughRate: 3.0,
					conversionRate: 8.5,
					purchaseRate: 7.2,
					revenue: 15000,
					unitsOrdered: 150,
					averagePrice: 100,
					searchFrequencyRank: 152,
					relativeSearchVolume: 0.85,
				},
				{
					query: "bluetooth headphones",
					impressions: 5000,
					clicks: 25, // Very low CTR
					clickThroughRate: 0.5,
					conversionRate: 5.0,
					purchaseRate: 4.0,
					revenue: 2500,
					unitsOrdered: 25,
					averagePrice: 100,
					searchFrequencyRank: 287,
					relativeSearchVolume: 0.72,
				},
			];

			const mockRankings = [
				{
					keyword: "wireless earbuds",
					asin: "B001234567",
					currentRank: 5,
					previousRank: 10,
					rankChange: 5, // Rising keyword
					isOrganic: true,
					isSponsored: false,
					competitorCount: 15,
					shareOfVoice: 12,
				},
			];

			const mockListingQuality = {
				asin: "B001234567",
				overallScore: 65, // Below optimal
				components: {
					titleOptimization: 60,
					bulletPoints: 70,
					productDescription: 65,
					images: 80,
					keywords: 55,
					pricing: 75,
					reviews: 85,
				},
				competitiveAnalysis: {
					categoryAverageScore: 72,
					topCompetitorScore: 88,
					yourRank: 4,
				},
				recommendations: [
					{
						type: "TITLE" as const,
						priority: "HIGH" as const,
						currentState: "Missing keywords",
						recommendation: "Add wireless and bluetooth to title",
						expectedImpact: {
							visibilityIncrease: 25,
							trafficIncrease: 20,
							conversionIncrease: 5,
						},
						implementation: {
							difficulty: "EASY" as const,
							timeRequired: "10 minutes",
							steps: ["Edit listing"],
						},
					},
				],
			};

			const mockCompetitors = [
				{
					competitorAsin: "B002345678",
					competitorBrand: "CompetitorA",
					sharedKeywords: ["wireless earbuds", "bluetooth"],
					exclusiveKeywords: ["premium audio", "hi-fi earbuds"],
					rankingComparison: [],
					overlapScore: 65,
					threatLevel: "HIGH" as const,
				},
			];

			// Setup mocks
			(
				mockSearchProvider.getSearchQueryMetrics as MockedFunction<any>
			).mockResolvedValue(mockSearchMetrics);
			(
				mockSearchProvider.getKeywordRankings as MockedFunction<any>
			).mockResolvedValue(mockRankings);
			(
				mockSearchProvider.getListingQualityScore as MockedFunction<any>
			).mockResolvedValue(mockListingQuality);
			(
				mockSearchProvider.analyzeCompetitors as MockedFunction<any>
			).mockResolvedValue(mockCompetitors);

			const insights = await aiEngine.generateProductInsights(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			expect(insights).toHaveLength.greaterThan(0);

			// Check for low CTR insight
			const lowCTRInsight = insights.find((i) => i.title.includes("Low CTR"));
			expect(lowCTRInsight).toBeDefined();
			expect(lowCTRInsight?.type).toBe("OPPORTUNITY");
			expect(lowCTRInsight?.category).toBe("SEARCH_PERFORMANCE");
			expect(lowCTRInsight?.priority).toBe("HIGH");

			// Check for rising keywords insight
			const risingKeywordsInsight = insights.find((i) =>
				i.title.includes("Gaining Momentum"),
			);
			expect(risingKeywordsInsight).toBeDefined();
			expect(risingKeywordsInsight?.type).toBe("TREND");

			// Check for listing quality insight
			const listingQualityInsight = insights.find((i) =>
				i.title.includes("Listing Quality"),
			);
			expect(listingQualityInsight).toBeDefined();
			expect(listingQualityInsight?.category).toBe("LISTING_OPTIMIZATION");

			// Check for competitor threat insight
			const competitorInsight = insights.find((i) =>
				i.title.includes("Competitors"),
			);
			expect(competitorInsight).toBeDefined();
			expect(competitorInsight?.type).toBe("RISK");
			expect(competitorInsight?.category).toBe("COMPETITOR_ACTIVITY");

			// Verify insight structure
			insights.forEach((insight) => {
				expect(insight).toHaveProperty("id");
				expect(insight).toHaveProperty("type");
				expect(insight).toHaveProperty("category");
				expect(insight).toHaveProperty("priority");
				expect(insight).toHaveProperty("title");
				expect(insight).toHaveProperty("description");
				expect(insight).toHaveProperty("impact");
				expect(insight).toHaveProperty("evidence");
				expect(insight).toHaveProperty("recommendations");
				expect(insight).toHaveProperty("relatedASINs");
				expect(insight).toHaveProperty("createdAt");
				expect(insight).toHaveProperty("expiresAt");
			});
		});

		it("should cache insights for the configured duration", async () => {
			// Setup basic mocks
			(
				mockSearchProvider.getSearchQueryMetrics as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockSearchProvider.getKeywordRankings as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockSearchProvider.getListingQualityScore as MockedFunction<any>
			).mockResolvedValue({
				overallScore: 80,
				components: {},
				recommendations: [],
			});
			(
				mockSearchProvider.analyzeCompetitors as MockedFunction<any>
			).mockResolvedValue([]);

			// First call
			await aiEngine.generateProductInsights("B001234567", "ATVPDKIKX0DER");

			// Second call (should use cache)
			const start = Date.now();
			await aiEngine.generateProductInsights("B001234567", "ATVPDKIKX0DER");
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(10); // Should be fast due to cache
			expect(mockSearchProvider.getSearchQueryMetrics).toHaveBeenCalledTimes(1);
		});
	});

	describe("identifyMarketOpportunities", () => {
		it("should identify untapped keyword opportunities", async () => {
			const mockMarketBasket = [];
			const mockSearchQueries = [
				{
					searchQuery: "wireless earbuds for running",
					impressions: 8000,
					clicks: 120,
					clickShare: 2, // Low competition
					searchFrequencyRank: 456,
					conversionRate: 6.5,
				},
				{
					searchQuery: "waterproof bluetooth earbuds",
					impressions: 5000,
					clicks: 75,
					clickShare: 1.5, // Very low competition
					searchFrequencyRank: 789,
					conversionRate: 7.2,
				},
			];
			const mockRepeatPurchase = [];

			(
				mockBrandAnalyticsProvider.getMarketBasketAnalysis as MockedFunction<any>
			).mockResolvedValue(mockMarketBasket);
			(
				mockBrandAnalyticsProvider.getSearchQueryPerformance as MockedFunction<any>
			).mockResolvedValue(mockSearchQueries);
			(
				mockBrandAnalyticsProvider.getRepeatPurchaseBehavior as MockedFunction<any>
			).mockResolvedValue(mockRepeatPurchase);

			const opportunities = await aiEngine.identifyMarketOpportunities(
				"Electronics",
				"ATVPDKIKX0DER",
			);

			expect(opportunities).toHaveLength.greaterThan(0);

			const untappedOpportunity = opportunities.find(
				(o) => o.opportunityType === "UNTAPPED_KEYWORD",
			);
			expect(untappedOpportunity).toBeDefined();
			expect(untappedOpportunity?.competitionLevel).toBe("LOW");
			expect(untappedOpportunity?.actionPlan).toHaveLength.greaterThan(0);
			expect(untappedOpportunity?.riskAssessment).toBeDefined();
		});

		it("should provide actionable implementation plans", async () => {
			(
				mockBrandAnalyticsProvider.getMarketBasketAnalysis as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockBrandAnalyticsProvider.getSearchQueryPerformance as MockedFunction<any>
			).mockResolvedValue([
				{
					searchQuery: "budget wireless earbuds",
					impressions: 6000,
					clicks: 90,
					clickShare: 1.8,
					searchFrequencyRank: 567,
					conversionRate: 5.5,
				},
			]);
			(
				mockBrandAnalyticsProvider.getRepeatPurchaseBehavior as MockedFunction<any>
			).mockResolvedValue([]);

			const opportunities = await aiEngine.identifyMarketOpportunities(
				"Electronics",
				"ATVPDKIKX0DER",
			);

			expect(opportunities[0].actionPlan).toHaveLength.greaterThan(0);
			expect(opportunities[0].actionPlan[0]).toHaveProperty("step");
			expect(opportunities[0].actionPlan[0]).toHaveProperty("action");
			expect(opportunities[0].actionPlan[0]).toHaveProperty("timeline");
			expect(opportunities[0].actionPlan[0]).toHaveProperty("resources");
		});
	});

	describe("generatePredictiveAnalytics", () => {
		it("should generate sales forecast with confidence intervals", async () => {
			const prediction = await aiEngine.generatePredictiveAnalytics(
				"B001234567",
				"SALES_FORECAST",
				"ATVPDKIKX0DER",
			);

			expect(prediction.predictionType).toBe("SALES_FORECAST");
			expect(prediction.timeframe).toBe("30 days");
			expect(prediction.predictions).toHaveLength(30);
			expect(prediction.accuracy).toBeGreaterThan(0.7);

			// Check prediction structure
			prediction.predictions.forEach((pred) => {
				expect(pred).toHaveProperty("date");
				expect(pred).toHaveProperty("predictedValue");
				expect(pred).toHaveProperty("confidenceInterval");
				expect(pred.confidenceInterval).toHaveProperty("lower");
				expect(pred.confidenceInterval).toHaveProperty("upper");
				expect(pred).toHaveProperty("probability");
			});

			// Check factors
			expect(prediction.factors).toHaveLength.greaterThan(0);
			prediction.factors.forEach((factor) => {
				expect(factor).toHaveProperty("factor");
				expect(factor).toHaveProperty("impact");
				expect(factor).toHaveProperty("direction");
				expect(["POSITIVE", "NEGATIVE"]).toContain(factor.direction);
			});
		});

		it("should handle different prediction types", async () => {
			const types: Array<PredictiveAnalytics["predictionType"]> = [
				"SALES_FORECAST",
				"RANKING_FORECAST",
				"TREND_FORECAST",
				"DEMAND_FORECAST",
			];

			for (const type of types) {
				const prediction = await aiEngine.generatePredictiveAnalytics(
					"B001234567",
					type,
					"ATVPDKIKX0DER",
				);

				expect(prediction.predictionType).toBe(type);
				expect(prediction).toHaveProperty("timeframe");
				expect(prediction).toHaveProperty("predictions");
				expect(prediction).toHaveProperty("factors");
				expect(prediction).toHaveProperty("accuracy");
				expect(prediction).toHaveProperty("lastUpdated");
			}
		});
	});

	describe("generateStrategicRecommendations", () => {
		it("should generate strategic recommendations based on business context", async () => {
			const recommendations = await aiEngine.generateStrategicRecommendations(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			expect(recommendations).toHaveLength.greaterThan(0);

			recommendations.forEach((rec) => {
				expect(rec).toHaveProperty("strategy");
				expect(rec).toHaveProperty("objective");
				expect(rec).toHaveProperty("currentState");
				expect(rec).toHaveProperty("targetState");
				expect(rec).toHaveProperty("implementation");
				expect(rec).toHaveProperty("risks");

				// Check implementation structure
				expect(rec.implementation).toHaveProperty("phases");
				expect(rec.implementation).toHaveProperty("totalInvestment");
				expect(rec.implementation).toHaveProperty("expectedROI");
				expect(rec.implementation).toHaveProperty("paybackPeriod");

				// Check phases structure
				if (rec.implementation.phases.length > 0) {
					rec.implementation.phases.forEach((phase) => {
						expect(phase).toHaveProperty("phase");
						expect(phase).toHaveProperty("name");
						expect(phase).toHaveProperty("duration");
						expect(phase).toHaveProperty("actions");
						expect(phase).toHaveProperty("milestones");
					});
				}
			});
		});

		it("should provide risk assessment for each strategy", async () => {
			const recommendations = await aiEngine.generateStrategicRecommendations(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			recommendations.forEach((rec) => {
				expect(Array.isArray(rec.risks)).toBe(true);

				rec.risks.forEach((risk) => {
					expect(risk).toHaveProperty("risk");
					expect(risk).toHaveProperty("likelihood");
					expect(risk).toHaveProperty("impact");
					expect(risk).toHaveProperty("mitigation");
					expect(["LOW", "MEDIUM", "HIGH"]).toContain(risk.likelihood);
					expect(["LOW", "MEDIUM", "HIGH"]).toContain(risk.impact);
				});
			});
		});
	});

	describe("custom rules", () => {
		it("should apply custom insight rules", async () => {
			const customEngine = new AIInsightsEngine(
				mockSearchProvider,
				mockBrandAnalyticsProvider,
				mockAdvertisingProvider,
				mockDSPProvider,
				{
					customRules: [
						{
							name: "high-inventory-alert",
							condition: (data) => data.searchMetrics.length > 0,
							insight: (_data) => ({
								type: "RECOMMENDATION" as const,
								category: "INVENTORY_MANAGEMENT" as const,
								priority: "MEDIUM" as const,
								title: "Custom Inventory Alert",
								description: "Custom rule triggered",
								impact: {
									metric: "inventory_turnover",
									currentValue: 4,
									potentialValue: 6,
									percentageChange: 50,
								},
								evidence: {
									dataPoints: [
										{
											source: "custom_rule",
											metric: "inventory",
											value: "high",
										},
									],
									confidence: 0.8,
								},
								recommendations: [
									{
										action: "Reduce inventory levels",
										expectedResult: "Improve cash flow",
										effort: "LOW" as const,
										timeframe: "1 week",
									},
								],
								relatedASINs: ["B001234567"],
							}),
						},
					],
				},
			);

			// Setup basic mocks
			(
				mockSearchProvider.getSearchQueryMetrics as MockedFunction<any>
			).mockResolvedValue([{ query: "test", impressions: 1000 }]);
			(
				mockSearchProvider.getKeywordRankings as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockSearchProvider.getListingQualityScore as MockedFunction<any>
			).mockResolvedValue({
				overallScore: 80,
				components: {},
				recommendations: [],
			});
			(
				mockSearchProvider.analyzeCompetitors as MockedFunction<any>
			).mockResolvedValue([]);

			const insights = await customEngine.generateProductInsights(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			const customInsight = insights.find(
				(i) => i.title === "Custom Inventory Alert",
			);
			expect(customInsight).toBeDefined();
			expect(customInsight?.category).toBe("INVENTORY_MANAGEMENT");
		});
	});

	describe("error handling", () => {
		it("should handle provider errors gracefully", async () => {
			(
				mockSearchProvider.getSearchQueryMetrics as MockedFunction<any>
			).mockRejectedValue(new Error("API Error"));

			await expect(
				aiEngine.generateProductInsights("B001234567", "ATVPDKIKX0DER"),
			).rejects.toThrow("API Error");
		});
	});

	describe("configuration", () => {
		it("should respect configuration limits", async () => {
			const limitedEngine = new AIInsightsEngine(
				mockSearchProvider,
				mockBrandAnalyticsProvider,
				mockAdvertisingProvider,
				mockDSPProvider,
				{
					maxInsightsPerCategory: 2,
					confidenceThreshold: 0.9,
				},
			);

			// Setup mocks to generate multiple insights
			(
				mockSearchProvider.getSearchQueryMetrics as MockedFunction<any>
			).mockResolvedValue([
				{
					query: "test1",
					impressions: 5000,
					clicks: 25,
					clickThroughRate: 0.5,
				},
				{
					query: "test2",
					impressions: 6000,
					clicks: 30,
					clickThroughRate: 0.5,
				},
				{
					query: "test3",
					impressions: 7000,
					clicks: 35,
					clickThroughRate: 0.5,
				},
			]);
			(
				mockSearchProvider.getKeywordRankings as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockSearchProvider.getListingQualityScore as MockedFunction<any>
			).mockResolvedValue({
				overallScore: 80,
				components: {},
				recommendations: [],
			});
			(
				mockSearchProvider.analyzeCompetitors as MockedFunction<any>
			).mockResolvedValue([]);

			const insights = await limitedEngine.generateProductInsights(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			// Count insights per category
			const _categorycounts = new Map<string, number>();
			insights.forEach((insight) => {
				categoryounts.set(
					insight.category,
					(categoryounts.get(insight.category) || 0) + 1,
				);
			});

			// Each category should have at most 2 insights
			categoryounts.forEach((count) => {
				expect(count).toBeLessThanOrEqual(2);
			});
		});
	});
});
