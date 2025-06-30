/**
 * Search Analytics Service tests
 */

import {
	beforeEach,
	describe,
	expect,
	it,
	type MockedFunction,
	vi,
} from "vitest";
import type { SearchPerformanceProvider } from "../../providers/search-performance";
import type { SPAPIProvider } from "../../providers/sp-api";
import { SearchAnalyticsService } from "../search-analytics";

// Mock providers
const mockSearchProvider = {
	providerId: "search-performance",
	name: "Search Performance Analytics",
	version: "1.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
	getSearchQueryMetrics: vi.fn(),
	getSearchTermTrends: vi.fn(),
	getKeywordRankings: vi.fn(),
	getSearchVisibilityScore: vi.fn(),
	analyzeCompetitors: vi.fn(),
	analyzeSearchIntent: vi.fn(),
	findLongTailOpportunities: vi.fn(),
	analyzeAutocomplete: vi.fn(),
	generateSearchPerformanceReport: vi.fn(),
	getSEORecommendations: vi.fn(),
	getListingQualityScore: vi.fn(),
	detectSearchAnomalies: vi.fn(),
	analyzeVoiceSearchOptimization: vi.fn(),
	getMobileSearchPerformance: vi.fn(),
	analyzeSeasonality: vi.fn(),
	analyzeBrandSearch: vi.fn(),
	detectCannibalization: vi.fn(),
	getInternationalPerformance: vi.fn(),
	getSearchAttribution: vi.fn(),
	updateConfig: vi.fn(),
	getConfig: vi.fn(),
} as unknown as SearchPerformanceProvider;

const mockSpApiProvider = {
	providerId: "sp-api",
	name: "SP-API",
	version: "1.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
	getProduct: vi.fn(),
} as unknown as SPAPIProvider;

describe("SearchAnalyticsService", () => {
	let service: SearchAnalyticsService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new SearchAnalyticsService(mockSearchProvider, mockSpApiProvider);
	});

	describe("getSearchDashboard", () => {
		it("should generate comprehensive search dashboard", async () => {
			// Mock data
			const mockVisibility = {
				overallScore: 75,
				components: {
					organicVisibility: 72,
					sponsoredVisibility: 78,
					brandedSearches: 85,
					nonBrandedSearches: 68,
					categoryVisibility: 70,
				},
				benchmarks: {
					categoryAverage: 65,
					topCompetitor: 82,
					industryLeader: 90,
				},
			};

			const mockMetrics = [
				{
					query: "wireless earbuds",
					impressions: 50000,
					clicks: 1500,
					clickThroughRate: 3.0,
					conversionRate: 8.5,
					purchaseRate: 7.2,
					revenue: 45000,
					unitsOrdered: 450,
					averagePrice: 100,
					searchFrequencyRank: 152,
					relativeSearchVolume: 0.85,
				},
				{
					query: "bluetooth headphones",
					impressions: 35000,
					clicks: 875,
					clickThroughRate: 2.5,
					conversionRate: 7.0,
					purchaseRate: 6.1,
					revenue: 26250,
					unitsOrdered: 262,
					averagePrice: 100.19,
					searchFrequencyRank: 287,
					relativeSearchVolume: 0.72,
				},
			];

			const mockRankings = [
				{
					keyword: "wireless earbuds",
					asin: "B001234567",
					currentRank: 5,
					previousRank: 8,
					rankChange: 3,
					isOrganic: true,
					isSponsored: false,
					competitorCount: 15,
					shareOfVoice: 12,
				},
			];

			const mockOpportunities = [
				{
					keyword: "best wireless earbuds",
					searchVolume: 5000,
					competition: "MEDIUM" as const,
					estimatedTraffic: 500,
					conversionPotential: 8,
					relevanceScore: 0.9,
				},
			];

			const mockAnomalies = [
				{
					type: "RANKING_LOSS" as const,
					severity: "HIGH" as const,
					detectedDate: "2024-01-15",
					affectedKeywords: ["wireless earbuds"],
					impact: {
						impressionsChange: -35,
						clicksChange: -40,
						revenueChange: -25,
					},
					possibleCauses: ["New competitor"],
					recommendedActions: ["Increase advertising"],
				},
			];

			const mockRecommendations = [
				{
					type: "TITLE" as const,
					priority: "HIGH" as const,
					currentState: "Missing keywords",
					recommendation: "Add wireless to title",
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
			];

			(
				mockSearchProvider.getSearchVisibilityScore as MockedFunction<any>
			).mockResolvedValue(mockVisibility);
			(
				mockSearchProvider.getSearchQueryMetrics as MockedFunction<any>
			).mockResolvedValue(mockMetrics);
			(
				mockSearchProvider.getKeywordRankings as MockedFunction<any>
			).mockResolvedValue(mockRankings);
			(
				mockSearchProvider.findLongTailOpportunities as MockedFunction<any>
			).mockResolvedValue(mockOpportunities);
			(
				mockSearchProvider.detectSearchAnomalies as MockedFunction<any>
			).mockResolvedValue(mockAnomalies);
			(
				mockSearchProvider.getSEORecommendations as MockedFunction<any>
			).mockResolvedValue(mockRecommendations);

			const dashboard = await service.getSearchDashboard(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			expect(dashboard.overview.visibilityScore).toBe(75);
			expect(dashboard.overview.totalImpressions).toBe(85000);
			expect(dashboard.overview.totalClicks).toBe(2375);
			expect(dashboard.overview.averageCTR).toBeCloseTo(2.79, 1);
			expect(dashboard.overview.topKeywords).toEqual([
				"wireless earbuds",
				"bluetooth headphones",
			]);
			expect(dashboard.rankings.improved).toHaveLength(1);
			expect(dashboard.opportunities).toHaveLength(1);
			expect(dashboard.anomalies).toHaveLength(1);
			expect(dashboard.recommendations).toHaveLength(1);
		});

		it("should cache dashboard data", async () => {
			const mockData = {
				overallScore: 75,
				components: {},
				benchmarks: {},
			};

			(
				mockSearchProvider.getSearchVisibilityScore as MockedFunction<any>
			).mockResolvedValue(mockData);
			(
				mockSearchProvider.getSearchQueryMetrics as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockSearchProvider.getKeywordRankings as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockSearchProvider.findLongTailOpportunities as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockSearchProvider.detectSearchAnomalies as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockSearchProvider.getSEORecommendations as MockedFunction<any>
			).mockResolvedValue([]);

			// First call
			await service.getSearchDashboard("B001234567", "ATVPDKIKX0DER");

			// Second call (should use cache)
			const start = Date.now();
			await service.getSearchDashboard("B001234567", "ATVPDKIKX0DER");
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(10);
			expect(mockSearchProvider.getSearchVisibilityScore).toHaveBeenCalledTimes(
				1,
			);
		});
	});

	describe("generateSEOActionPlan", () => {
		it("should generate prioritized SEO action plan", async () => {
			const mockProduct = {
				asin: "B001234567",
				title: "Premium Earbuds",
				brand: "TestBrand",
				category: "Electronics",
				price: { amount: 99.99, currency: "USD" },
			};

			const mockQualityScore = {
				asin: "B001234567",
				overallScore: 70,
				components: {},
				competitiveAnalysis: {},
				recommendations: [],
			};

			const mockRecommendations = [
				{
					type: "TITLE" as const,
					priority: "HIGH" as const,
					currentState: "Missing keywords",
					recommendation: "Add wireless",
					expectedImpact: {
						visibilityIncrease: 25,
						trafficIncrease: 20,
						conversionIncrease: 5,
					},
					implementation: {
						difficulty: "EASY" as const,
						timeRequired: "10 minutes",
						steps: [],
					},
				},
				{
					type: "A_PLUS_CONTENT" as const,
					priority: "LOW" as const,
					currentState: "No A+ content",
					recommendation: "Create A+ content",
					expectedImpact: {
						visibilityIncrease: 10,
						trafficIncrease: 8,
						conversionIncrease: 12,
					},
					implementation: {
						difficulty: "HARD" as const,
						timeRequired: "3 hours",
						steps: [],
					},
				},
			];

			(mockSpApiProvider.getProduct as MockedFunction<any>).mockResolvedValue(
				mockProduct,
			);
			(
				mockSearchProvider.getListingQualityScore as MockedFunction<any>
			).mockResolvedValue(mockQualityScore);
			(
				mockSearchProvider.getSEORecommendations as MockedFunction<any>
			).mockResolvedValue(mockRecommendations);

			const actionPlan = await service.generateSEOActionPlan(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			expect(actionPlan.asin).toBe("B001234567");
			expect(actionPlan.productTitle).toBe("Premium Earbuds");
			expect(actionPlan.currentScore).toBe(70);
			expect(actionPlan.targetScore).toBe(95); // 70 + 25
			expect(actionPlan.prioritizedActions).toHaveLength(2);

			// Verify actions are sorted by impact/effort ratio
			const firstAction = actionPlan.prioritizedActions[0];
			expect(firstAction.action.type).toBe("TITLE"); // Higher ratio: 25/1 vs 10/3

			expect(actionPlan.projectedResults.visibilityIncrease).toBe(35);
			expect(actionPlan.projectedResults.trafficIncrease).toBe(28);
		});
	});

	describe("analyzeCompetitiveLandscape", () => {
		it("should analyze competitive landscape", async () => {
			const mockCompetitorAnalyses = [
				{
					competitorAsin: "B002345678",
					competitorBrand: "CompetitorA",
					sharedKeywords: ["wireless earbuds", "bluetooth"],
					exclusiveKeywords: ["premium audio"],
					rankingComparison: [
						{
							keyword: "wireless earbuds",
							yourRank: 5,
							competitorRank: 3,
							advantage: "COMPETITOR" as const,
						},
					],
					overlapScore: 65,
					threatLevel: "HIGH" as const,
				},
			];

			const mockYourScore = {
				overallScore: 75,
				components: {},
				benchmarks: {},
			};

			const mockCompetitorScore = {
				overallScore: 82,
				components: {},
				benchmarks: {},
			};

			(
				mockSearchProvider.analyzeCompetitors as MockedFunction<any>
			).mockResolvedValue(mockCompetitorAnalyses);
			(mockSearchProvider.getSearchVisibilityScore as MockedFunction<any>)
				.mockResolvedValueOnce(mockYourScore)
				.mockResolvedValueOnce(mockCompetitorScore);

			const landscape = await service.analyzeCompetitiveLandscape(
				"B001234567",
				"Electronics",
				"ATVPDKIKX0DER",
			);

			expect(landscape.marketplaceId).toBe("ATVPDKIKX0DER");
			expect(landscape.category).toBe("Electronics");
			expect(landscape.yourPosition).toBe(2); // One competitor with higher score
			expect(landscape.topCompetitors).toHaveLength(1);
			expect(landscape.topCompetitors[0].brand).toBe("CompetitorA");
			expect(landscape.topCompetitors[0].visibilityScore).toBe(82);
			expect(landscape.threats.risingCompetitors).toContain("CompetitorA");
			expect(landscape.threats.keywordLosses).toContain("wireless earbuds");
		});
	});

	describe("trackKeywordPerformance", () => {
		it("should track keyword performance over time", async () => {
			const mockRankings = [
				{
					keyword: "wireless earbuds",
					asin: "B001234567",
					currentRank: 5,
					previousRank: 8,
					rankChange: 3,
					isOrganic: true,
					isSponsored: false,
					competitorCount: 15,
					shareOfVoice: 12,
				},
				{
					keyword: "bluetooth headphones",
					asin: "B001234567",
					currentRank: 10,
					previousRank: 7,
					rankChange: -3,
					isOrganic: true,
					isSponsored: true,
					competitorCount: 20,
					shareOfVoice: 8,
				},
			];

			(
				mockSearchProvider.getKeywordRankings as MockedFunction<any>
			).mockResolvedValue(mockRankings);

			const trackingData = await service.trackKeywordPerformance(
				"B001234567",
				["wireless earbuds", "bluetooth headphones"],
				"ATVPDKIKX0DER",
			);

			expect(trackingData.size).toBe(2);
			expect(trackingData.get("wireless earbuds")).toHaveLength(1);
			expect(trackingData.get("bluetooth headphones")).toHaveLength(1);
		});
	});

	describe("generateComprehensiveReport", () => {
		it("should generate comprehensive report with competitive analysis", async () => {
			const mockBaseReport = {
				reportId: "report-123",
				dateRange: { startDate: "2024-01-01", endDate: "2024-01-31" },
				summary: {
					totalImpressions: 100000,
					totalClicks: 3000,
					averageCTR: 3.0,
					topSearchTerms: ["wireless earbuds"],
					searchVisibilityScore: 75,
				},
				searchTerms: [],
				trends: [],
				rankings: [],
				opportunities: [],
			};

			const mockProduct = {
				asin: "B001234567",
				title: "Premium Earbuds",
				brand: "TestBrand",
				category: "Electronics",
				price: { amount: 99.99, currency: "USD" },
			};

			(
				mockSearchProvider.generateSearchPerformanceReport as MockedFunction<any>
			).mockResolvedValue(mockBaseReport);
			(mockSpApiProvider.getProduct as MockedFunction<any>).mockResolvedValue(
				mockProduct,
			);
			(
				mockSearchProvider.analyzeCompetitors as MockedFunction<any>
			).mockResolvedValue([]);
			(
				mockSearchProvider.getSearchVisibilityScore as MockedFunction<any>
			).mockResolvedValue({ overallScore: 75, components: {}, benchmarks: {} });

			const report = await service.generateComprehensiveReport(
				"B001234567",
				"ATVPDKIKX0DER",
				{ startDate: "2024-01-01", endDate: "2024-01-31" },
				true,
			);

			expect(report.reportId).toBe("report-123");
			expect(report.summary.totalImpressions).toBe(100000);
			expect(report).toHaveProperty("competitiveLandscape");
		});
	});

	describe("optimizeForVoiceSearch", () => {
		it("should analyze and optimize for voice search", async () => {
			const mockVoiceOptimizations = [
				{
					query: "Alexa, order wireless earbuds",
					isVoiceOptimized: false,
					naturalLanguageScore: 65,
					conversationalKeywords: ["order", "buy"],
					recommendations: {
						questionPhrases: [
							"What are the best wireless earbuds?",
							"Which earbuds have noise cancelling?",
						],
						longFormAnswers: [],
						featuredSnippetOptimization: [
							"Add FAQ section",
							"Include conversational phrases",
						],
					},
				},
				{
					query: "best bluetooth headphones for running",
					isVoiceOptimized: true,
					naturalLanguageScore: 85,
					conversationalKeywords: ["best", "for running"],
					recommendations: {
						questionPhrases: [],
						longFormAnswers: [],
						featuredSnippetOptimization: [],
					},
				},
			];

			(
				mockSearchProvider.analyzeVoiceSearchOptimization as MockedFunction<any>
			).mockResolvedValue(mockVoiceOptimizations);

			const result = await service.optimizeForVoiceSearch(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			expect(result.currentOptimization).toBe(75); // Average of 65 and 85
			expect(result.recommendations).toContain(
				"What are the best wireless earbuds?",
			);
			expect(result.recommendations).toContain("Add FAQ section");
			expect(result.estimatedImpact).toBe(3.75); // (100-75) * 0.15
		});
	});

	describe("error handling", () => {
		it("should handle provider errors gracefully", async () => {
			(
				mockSearchProvider.getSearchVisibilityScore as MockedFunction<any>
			).mockRejectedValue(new Error("API Error"));

			await expect(
				service.getSearchDashboard("B001234567", "ATVPDKIKX0DER"),
			).rejects.toThrow("Failed to generate search dashboard");
		});
	});
});
