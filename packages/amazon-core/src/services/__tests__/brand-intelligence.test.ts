/**
 * Brand Intelligence Service integration tests
 */

import {
	beforeEach,
	describe,
	expect,
	it,
	type MockedFunction,
	vi,
} from "vitest";
import type { BrandAnalyticsProvider } from "../../providers/brand-analytics";
import { BrandIntelligenceService } from "../brand-intelligence";

// Mock the provider
const mockBrandAnalyticsProvider: BrandAnalyticsProvider = {
	providerId: "brand-analytics",
	name: "Amazon Brand Analytics API",
	version: "1.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
	requestSearchTermsReport: vi.fn(),
	getSearchTermsReport: vi.fn(),
	requestMarketBasketAnalysis: vi.fn(),
	getMarketBasketAnalysis: vi.fn(),
	requestItemComparison: vi.fn(),
	getItemComparison: vi.fn(),
	requestDemographics: vi.fn(),
	getDemographics: vi.fn(),
	requestRepeatPurchaseAnalysis: vi.fn(),
	getRepeatPurchaseAnalysis: vi.fn(),
	getBrandMetrics: vi.fn(),
	getBrandHealthScore: vi.fn(),
	getCompetitiveIntelligence: vi.fn(),
	getReports: vi.fn(),
	getReport: vi.fn(),
	getSearchTermInsights: vi.fn(),
	getTopSearchTerms: vi.fn(),
};

describe("BrandIntelligenceService", () => {
	let service: BrandIntelligenceService;
	const testBrandName = "TestBrand";
	const testMarketplaceId = "ATVPDKIKX0DER";

	beforeEach(() => {
		vi.clearAllMocks();
		service = new BrandIntelligenceService(mockBrandAnalyticsProvider, {
			cacheInsights: false, // Disable cache for testing
		});
	});

	describe("generateBrandIntelligenceReport", () => {
		it("should generate comprehensive brand intelligence report", async () => {
			// Mock provider responses
			const mockBrandHealthScore = {
				brandName: testBrandName,
				marketplaceId: testMarketplaceId,
				overallScore: 78,
				components: {
					awareness: 82,
					consideration: 75,
					purchase: 80,
					loyalty: 73,
					advocacy: 77,
				},
				benchmarks: {
					categoryAverage: 65,
					topPerformers: 85,
				},
				recommendations: [
					"Improve customer loyalty programs",
					"Increase brand awareness campaigns",
				],
			};

			const mockBrandMetrics = {
				brandMetrics: [
					{
						brandName: testBrandName,
						marketplaceId: testMarketplaceId,
						brandPerformance: {
							marketShare: 12.5,
							brandGrowthRate: 8.3,
							customerAcquisitionRate: 15.2,
						},
						competitivePosition: {
							rank: 3,
							categoryLeader: "CompetitorA",
							marketShareGap: -5.2,
						},
					},
				],
			};

			const mockSearchTermInsights = [
				{
					searchTerm: "premium headphones",
					totalSearchVolume: 125000,
					myBrandShare: 15.5,
					competitorShare: 45.2,
					opportunityScore: 78,
					trendDirection: "UP" as const,
					seasonality: {
						peakMonths: ["November", "December"],
						variance: 35,
					},
				},
			];

			(
				mockBrandAnalyticsProvider.getBrandHealthScore as MockedFunction<any>
			).mockResolvedValue(mockBrandHealthScore);
			(
				mockBrandAnalyticsProvider.getBrandMetrics as MockedFunction<any>
			).mockResolvedValue(mockBrandMetrics);
			(
				mockBrandAnalyticsProvider.getSearchTermInsights as MockedFunction<any>
			).mockResolvedValue(mockSearchTermInsights);

			const report = await service.generateBrandIntelligenceReport(
				testBrandName,
				testMarketplaceId,
			);

			expect(report).toBeDefined();
			expect(report.brandName).toBe(testBrandName);
			expect(report.marketplaceId).toBe(testMarketplaceId);
			expect(report.overallHealthScore).toBe(78);
			expect(report.competitive).toBeDefined();
			expect(report.customerBehavior).toBeDefined();
			expect(report.searchDiscovery).toBeDefined();
			expect(report.marketTrends).toBeDefined();
			expect(report.actionablePriorities).toBeDefined();
			expect(report.keyMetrics).toBeDefined();

			// Verify provider methods were called
			expect(
				mockBrandAnalyticsProvider.getBrandHealthScore,
			).toHaveBeenCalledWith(testBrandName, testMarketplaceId);
			expect(mockBrandAnalyticsProvider.getBrandMetrics).toHaveBeenCalledWith(
				testBrandName,
				testMarketplaceId,
			);
			expect(
				mockBrandAnalyticsProvider.getSearchTermInsights,
			).toHaveBeenCalledWith(testBrandName, testMarketplaceId);
		});

		it("should handle provider errors gracefully", async () => {
			(
				mockBrandAnalyticsProvider.getBrandHealthScore as MockedFunction<any>
			).mockRejectedValue(new Error("Provider error"));

			await expect(
				service.generateBrandIntelligenceReport(
					testBrandName,
					testMarketplaceId,
				),
			).rejects.toThrow("Failed to generate brand intelligence report");
		});
	});

	describe("getCompetitivePositioning", () => {
		it("should return competitive insights", async () => {
			const mockBrandMetrics = {
				brandMetrics: [
					{
						brandName: testBrandName,
						marketplaceId: testMarketplaceId,
						brandPerformance: {
							marketShare: 12.5,
							brandGrowthRate: 8.3,
						},
						competitivePosition: {
							rank: 3,
							categoryLeader: "CompetitorA",
						},
					},
				],
			};

			(
				mockBrandAnalyticsProvider.getBrandMetrics as MockedFunction<any>
			).mockResolvedValue(mockBrandMetrics);

			const insights = await service.getCompetitivePositioning(
				testBrandName,
				testMarketplaceId,
			);

			expect(insights).toBeDefined();
			expect(insights.brandPosition).toBeDefined();
			expect(insights.topCompetitors).toBeDefined();
			expect(insights.marketOpportunities).toBeDefined();
			expect(insights.threatAssessment).toBeDefined();
		});
	});

	describe("getCustomerBehaviorAnalysis", () => {
		it("should return customer behavior insights", async () => {
			const insights = await service.getCustomerBehaviorAnalysis(
				testBrandName,
				testMarketplaceId,
			);

			expect(insights).toBeDefined();
			expect(insights.purchasePatterns).toBeDefined();
			expect(insights.demographics).toBeDefined();
			expect(insights.loyaltyMetrics).toBeDefined();
			expect(insights.crossSellOpportunities).toBeDefined();
			expect(insights.purchasePatterns.averageOrderValue).toBeGreaterThan(0);
		});
	});

	describe("getSearchDiscoveryAnalysis", () => {
		it("should return search discovery insights", async () => {
			const mockSearchTermInsights = [
				{
					searchTerm: "wireless earbuds",
					totalSearchVolume: 85000,
					myBrandShare: 12.3,
					competitorShare: 55.7,
					opportunityScore: 65,
					trendDirection: "STABLE" as const,
					seasonality: {
						peakMonths: ["December"],
						variance: 20,
					},
				},
			];

			(
				mockBrandAnalyticsProvider.getSearchTermInsights as MockedFunction<any>
			).mockResolvedValue(mockSearchTermInsights);

			const insights = await service.getSearchDiscoveryAnalysis(
				testBrandName,
				testMarketplaceId,
			);

			expect(insights).toBeDefined();
			expect(insights.topSearchTerms).toBeDefined();
			expect(insights.keywordGaps).toBeDefined();
			expect(insights.seasonalTrends).toBeDefined();
			expect(insights.voiceSearchInsights).toBeDefined();
			expect(insights.topSearchTerms).toHaveLength(1);
			expect(insights.topSearchTerms[0].searchTerm).toBe("wireless earbuds");
		});
	});

	describe("getMarketTrendsAnalysis", () => {
		it("should return market trends insights", async () => {
			const insights = await service.getMarketTrendsAnalysis(
				testBrandName,
				testMarketplaceId,
			);

			expect(insights).toBeDefined();
			expect(insights.categoryTrends).toBeDefined();
			expect(insights.emergingOpportunities).toBeDefined();
			expect(insights.threatAlert).toBeDefined();
			expect(insights.seasonalForecasts).toBeDefined();
			expect(insights.categoryTrends[0].growthRate).toBeGreaterThan(0);
		});
	});

	describe("caching behavior", () => {
		it("should cache results when caching is enabled", async () => {
			const serviceWithCache = new BrandIntelligenceService(
				mockBrandAnalyticsProvider,
				{
					cacheInsights: true,
					insightsTTL: 1800,
				},
			);

			const mockBrandMetrics = {
				brandMetrics: [
					{
						brandName: testBrandName,
						marketplaceId: testMarketplaceId,
						brandPerformance: { marketShare: 12.5, brandGrowthRate: 8.3 },
						competitivePosition: { rank: 3 },
					},
				],
			};

			(
				mockBrandAnalyticsProvider.getBrandMetrics as MockedFunction<any>
			).mockResolvedValue(mockBrandMetrics);

			// First call
			await serviceWithCache.getCompetitivePositioning(
				testBrandName,
				testMarketplaceId,
			);

			// Second call (should use cache)
			await serviceWithCache.getCompetitivePositioning(
				testBrandName,
				testMarketplaceId,
			);

			// Provider should only be called once due to caching
			expect(mockBrandAnalyticsProvider.getBrandMetrics).toHaveBeenCalledTimes(
				1,
			);
		});
	});

	describe("error handling", () => {
		it("should handle missing required parameters", async () => {
			await expect(
				service.generateBrandIntelligenceReport("", testMarketplaceId),
			).rejects.toThrow();

			await expect(
				service.generateBrandIntelligenceReport(testBrandName, ""),
			).rejects.toThrow();
		});

		it("should handle provider failures gracefully", async () => {
			(
				mockBrandAnalyticsProvider.getSearchTermInsights as MockedFunction<any>
			).mockRejectedValue(new Error("Network error"));

			await expect(
				service.getSearchDiscoveryAnalysis(testBrandName, testMarketplaceId),
			).rejects.toThrow("Search discovery analysis failed");
		});
	});
});
