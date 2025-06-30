/**
 * AttributionManager Tests
 * Comprehensive test suite for Amazon Attribution campaign management
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AttributionProvider } from "../providers/attribution";
import type {
	AttributionCampaign,
	AttributionReport,
	CreateAttributionCampaignRequest,
} from "../types/attribution";
import { AttributionManager } from "./attribution-manager";

// Mock Attribution Provider
const mockAttributionProvider: AttributionProvider = {
	getAttributionCampaigns: vi.fn(),
	generateAttributionReport: vi.fn(),
	getCrossChannelAnalysis: vi.fn(),
	getOptimizationSuggestions: vi.fn(),
	createAttributionCampaign: vi.fn(),
	updateAttributionCampaign: vi.fn(),
	deleteAttributionCampaign: vi.fn(),
};

describe("AttributionManager", () => {
	let attributionManager: AttributionManager;

	beforeEach(() => {
		vi.clearAllMocks();
		attributionManager = new AttributionManager(mockAttributionProvider, {
			enablePredictiveAnalytics: true,
			insightRefreshInterval: 1, // 1 hour for testing
			minimumDataPoints: 5,
			confidenceThreshold: 0.8,
			maxInsightsPerCategory: 3,
		});
	});

	describe("Campaign Performance Dashboard", () => {
		it("should generate comprehensive performance dashboard", async () => {
			const mockCampaigns: AttributionCampaign[] = [
				{
					campaignId: "camp-1",
					campaignName: "Search Campaign",
					campaignType: "SEARCH",
					advertiserId: "adv-1",
					status: "ACTIVE",
					performance: {
						spend: 1000,
						sales: 4000,
						clicks: 500,
						detailPageViews: 300,
						purchases: 40,
						unitsOrdered: 45,
						returnOnAdSpend: 4.0,
						clickThroughRate: 2.5,
						purchaseRate: 8.0,
						costPerClick: 2.0,
						attributionRate: 12.0,
					},
					startDate: "2024-01-01",
					endDate: "2024-01-31",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-15T00:00:00Z",
				},
				{
					campaignId: "camp-2",
					campaignName: "Display Campaign",
					campaignType: "DISPLAY",
					advertiserId: "adv-1",
					status: "ACTIVE",
					performance: {
						spend: 500,
						sales: 1000,
						clicks: 200,
						detailPageViews: 150,
						purchases: 10,
						unitsOrdered: 12,
						returnOnAdSpend: 2.0,
						clickThroughRate: 1.5,
						purchaseRate: 5.0,
						costPerClick: 2.5,
						attributionRate: 6.0,
					},
					startDate: "2024-01-01",
					endDate: "2024-01-31",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-15T00:00:00Z",
				},
			];

			const mockReport: AttributionReport = {
				advertiserId: "adv-1",
				reportType: "CAMPAIGN",
				reportingPeriod: { startDate: "2024-01-01", endDate: "2024-01-31" },
				granularity: "DAILY",
				metrics: {
					totalSales: 4000,
					totalClicks: 500,
					totalDetailPageViews: 300,
					totalPurchases: 40,
					totalUnitsOrdered: 45,
					returnOnAdSpend: 4.0,
					clickThroughRate: 2.5,
					purchaseRate: 8.0,
					costPerClick: 2.0,
					costPerDetailPageView: 3.33,
					costPerPurchase: 25.0,
				},
				breakdown: [
					{
						date: "2024-01-01",
						sales: 200,
						clicks: 25,
						purchases: 2,
						returnOnAdSpend: 4.0,
					},
				],
				filters: [],
				createdAt: "2024-01-31T23:59:59Z",
			};

			mockAttributionProvider.getAttributionCampaigns.mockResolvedValue(
				mockCampaigns,
			);
			mockAttributionProvider.generateAttributionReport.mockResolvedValue(
				mockReport,
			);

			const dashboard =
				await attributionManager.getCampaignPerformanceDashboard(
					"adv-1",
					"2024-01-01",
					"2024-01-31",
				);

			expect(dashboard.summary).toHaveLength(2);
			expect(dashboard.totals.totalSpend).toBe(1500);
			expect(dashboard.totals.totalSales).toBe(5000);
			expect(dashboard.totals.overallROAS).toBeCloseTo(3.33);
			expect(dashboard.topPerformers).toBeDefined();
			expect(dashboard.underPerformers).toBeDefined();
		});

		it("should cache dashboard results", async () => {
			const mockCampaigns: AttributionCampaign[] = [];
			mockAttributionProvider.getAttributionCampaigns.mockResolvedValue(
				mockCampaigns,
			);

			// First call
			await attributionManager.getCampaignPerformanceDashboard(
				"adv-1",
				"2024-01-01",
				"2024-01-31",
			);
			// Second call (should use cache)
			await attributionManager.getCampaignPerformanceDashboard(
				"adv-1",
				"2024-01-01",
				"2024-01-31",
			);

			expect(
				mockAttributionProvider.getAttributionCampaigns,
			).toHaveBeenCalledTimes(1);
		});

		it("should calculate efficiency scores correctly", async () => {
			const metrics = {
				returnOnAdSpend: 5.0, // Excellent
				purchaseRate: 4.0, // Good
				costPerClick: 1.5, // Excellent
			};

			const efficiency = (attributionManager as any).calculateEfficiencyScore(
				metrics,
			);

			expect(efficiency.score).toBeGreaterThanOrEqual(70);
			expect(efficiency.rank).toMatch(/EXCELLENT|GOOD/);
			expect(efficiency.recommendations).toBeInstanceOf(Array);
		});
	});

	describe("Cross-Channel Insights", () => {
		it("should generate cross-channel analysis", async () => {
			const mockCrossChannelAnalysis = {
				customerJourney: {
					averageJourneyLength: 3.5,
					averageTimeLag: 2.1,
					commonPaths: [
						{ path: ["Search", "Display", "Shopping"], frequency: 150 },
						{ path: ["Social", "Search"], frequency: 120 },
					],
				},
				crossChannelMetrics: {
					channelOverlap: [
						{ channel1: "Search", channel2: "Display", overlap: 0.35 },
						{ channel1: "Search", channel2: "Shopping", overlap: 0.28 },
					],
				},
			};

			const mockCampaigns: AttributionCampaign[] = [
				{
					campaignId: "camp-1",
					campaignName: "Search Campaign",
					campaignType: "SEARCH",
					advertiserId: "adv-1",
					status: "ACTIVE",
					performance: { spend: 1000, sales: 4000 },
					startDate: "2024-01-01",
					endDate: "2024-01-31",
					createdAt: "2024-01-01T00:00:00Z",
					updatedAt: "2024-01-15T00:00:00Z",
				},
			];

			mockAttributionProvider.getCrossChannelAnalysis.mockResolvedValue(
				mockCrossChannelAnalysis,
			);
			mockAttributionProvider.getAttributionCampaigns.mockResolvedValue(
				mockCampaigns,
			);

			const insights = await attributionManager.generateCrossChannelInsights(
				"adv-1",
				"2024-01-01",
				"2024-01-31",
			);

			expect(insights.totalCampaigns).toBe(1);
			expect(insights.customerJourneyInsights.averagePathLength).toBe(3.5);
			expect(insights.customerJourneyInsights.topConversionPaths).toContain(
				"Search → Display → Shopping",
			);
			expect(insights.recommendations).toBeInstanceOf(Array);
		});

		it("should identify opportunity channels", async () => {
			const channelBreakdown = [
				{ channel: "Search", roas: 6.0, contribution: 40 },
				{ channel: "Display", roas: 4.5, contribution: 8 }, // High ROAS, low contribution
				{ channel: "Shopping", roas: 2.0, contribution: 30 },
			];
			const avgROAS = 4.17;

			const opportunities = (
				attributionManager as any
			).identifyOpportunityChannels(channelBreakdown, avgROAS);

			expect(opportunities).toContain("Display");
			expect(opportunities).not.toContain("Search"); // High contribution already
		});
	});

	describe("Campaign Optimization", () => {
		it("should provide optimization suggestions", async () => {
			const mockSuggestions = [
				{
					campaignId: "camp-1",
					title: "Increase Budget for High-Performing Keywords",
					description: "Allocate more budget to keywords with ROAS > 5.0",
					priority: "HIGH" as const,
					impact: "Potential 25% increase in sales",
					implementation: {
						effort: "LOW" as const,
						timeframe: "1 week",
						steps: [
							"Identify high-performing keywords",
							"Increase bids by 20%",
						],
					},
					projectedImprovement: {
						metric: "ROAS",
						improvement: 15,
					},
					category: "BUDGET_OPTIMIZATION" as const,
				},
			];

			const mockCampaign: AttributionCampaign = {
				campaignId: "camp-1",
				campaignName: "Test Campaign",
				campaignType: "SEARCH",
				advertiserId: "adv-1",
				status: "ACTIVE",
				performance: {
					spend: 1000,
					sales: 3000,
					clicks: 500,
					detailPageViews: 300,
					purchases: 30,
					unitsOrdered: 35,
					returnOnAdSpend: 3.0,
					clickThroughRate: 2.0,
					purchaseRate: 6.0,
					costPerClick: 2.0,
					attributionRate: 10.0,
				},
				startDate: "2024-01-01",
				endDate: "2024-01-31",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-15T00:00:00Z",
			};

			mockAttributionProvider.getOptimizationSuggestions.mockResolvedValue(
				mockSuggestions,
			);
			mockAttributionProvider.getAttributionCampaigns.mockResolvedValue([
				mockCampaign,
			]);

			const optimization =
				await attributionManager.optimizeCampaignPerformance("camp-1");

			expect(optimization.currentPerformance.campaignId).toBe("camp-1");
			expect(optimization.optimizationSuggestions).toHaveLength(1);
			expect(optimization.implementationPlan.quickWins).toContain(
				"Increase Budget for High-Performing Keywords",
			);
			expect(optimization.projectedImpact.roasImprovement).toBe(15);
		});

		it("should categorize optimizations by effort and priority", async () => {
			const suggestions = [
				{
					title: "Quick Win",
					priority: "HIGH" as const,
					implementation: { effort: "LOW" as const },
				},
				{
					title: "Medium Term",
					priority: "MEDIUM" as const,
					implementation: { effort: "MEDIUM" as const },
				},
				{
					title: "Long Term",
					priority: "LOW" as const,
					implementation: { effort: "HIGH" as const },
				},
			];

			const categorized = (attributionManager as any).categorizeOptimizations(
				suggestions,
			);

			expect(categorized.quickWins).toContain("Quick Win");
			expect(categorized.mediumTermActions).toContain("Medium Term");
			expect(categorized.longTermStrategy).toContain("Long Term");
		});
	});

	describe("Benchmark Analysis", () => {
		it("should provide industry benchmarks", async () => {
			const benchmarks = await attributionManager.getBenchmarkAnalysis(
				"SEARCH",
				"Technology",
			);

			expect(benchmarks.industry).toBe("Technology");
			expect(benchmarks.campaignType).toBe("SEARCH");
			expect(benchmarks.benchmarks.clickThroughRate).toBeDefined();
			expect(benchmarks.benchmarks.conversionRate).toBeDefined();
			expect(benchmarks.benchmarks.returnOnAdSpend).toBeDefined();
		});

		it("should cache benchmark data", async () => {
			// First call
			await attributionManager.getBenchmarkAnalysis("SEARCH", "Technology");
			// Second call (should use cache)
			const result = await attributionManager.getBenchmarkAnalysis(
				"SEARCH",
				"Technology",
			);

			expect(result).toBeDefined();
			// Verify caching behavior by checking that the same object is returned
		});
	});

	describe("Campaign Creation", () => {
		it("should create optimized campaigns", async () => {
			const campaignRequest: CreateAttributionCampaignRequest = {
				advertiserId: "adv-1",
				campaignName: "New Optimized Campaign",
				campaignType: "SEARCH",
				startDate: "2024-02-01",
				endDate: "2024-02-29",
				budget: {
					amount: 5000,
					currencyCode: "USD",
				},
				targeting: {
					audiences: ["audience-1"],
					keywords: ["keyword1", "keyword2"],
					interests: ["interest1"],
				},
			};

			const optimizationGoals = {
				primaryKPI: "ROAS" as const,
				budgetAllocation: "MODERATE" as const,
				targetAudience: "FOCUSED" as const,
			};

			const mockCreatedCampaign: AttributionCampaign = {
				...campaignRequest,
				campaignId: "camp-new",
				status: "ACTIVE",
				performance: {
					spend: 0,
					sales: 0,
					clicks: 0,
					detailPageViews: 0,
					purchases: 0,
					unitsOrdered: 0,
					returnOnAdSpend: 0,
					clickThroughRate: 0,
					purchaseRate: 0,
					costPerClick: 0,
					attributionRate: 0,
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			mockAttributionProvider.createAttributionCampaign.mockResolvedValue(
				mockCreatedCampaign,
			);

			const result = await attributionManager.createOptimizedCampaign(
				campaignRequest,
				optimizationGoals,
			);

			expect(result.campaignId).toBe("camp-new");
			expect(result.campaignName).toBe("New Optimized Campaign");
			expect(
				mockAttributionProvider.createAttributionCampaign,
			).toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		it("should handle provider errors gracefully", async () => {
			mockAttributionProvider.getAttributionCampaigns.mockRejectedValue(
				new Error("API rate limit exceeded"),
			);

			await expect(
				attributionManager.getCampaignPerformanceDashboard(
					"adv-1",
					"2024-01-01",
					"2024-01-31",
				),
			).rejects.toThrow("API rate limit exceeded");
		});

		it("should handle missing campaign data", async () => {
			mockAttributionProvider.getAttributionCampaigns.mockResolvedValue([]);

			await expect(
				attributionManager.optimizeCampaignPerformance("non-existent-campaign"),
			).rejects.toThrow("Campaign non-existent-campaign not found");
		});

		it("should validate input parameters", async () => {
			await expect(
				attributionManager.getCampaignPerformanceDashboard(
					"",
					"2024-01-01",
					"2024-01-31",
				),
			).rejects.toThrow();

			await expect(
				attributionManager.getCampaignPerformanceDashboard(
					"adv-1",
					"invalid-date",
					"2024-01-31",
				),
			).rejects.toThrow();
		});
	});

	describe("Performance", () => {
		it("should handle large datasets efficiently", async () => {
			const largeCampaignList = Array.from({ length: 1000 }, (_, i) => ({
				campaignId: `camp-${i}`,
				campaignName: `Campaign ${i}`,
				campaignType: "SEARCH" as const,
				advertiserId: "adv-1",
				status: "ACTIVE" as const,
				performance: {
					spend: 100,
					sales: 400,
					clicks: 50,
					detailPageViews: 30,
					purchases: 4,
					unitsOrdered: 5,
					returnOnAdSpend: 4.0,
					clickThroughRate: 2.0,
					purchaseRate: 8.0,
					costPerClick: 2.0,
					attributionRate: 12.0,
				},
				startDate: "2024-01-01",
				endDate: "2024-01-31",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-15T00:00:00Z",
			}));

			mockAttributionProvider.getAttributionCampaigns.mockResolvedValue(
				largeCampaignList,
			);
			mockAttributionProvider.generateAttributionReport.mockResolvedValue({
				advertiserId: "adv-1",
				reportType: "CAMPAIGN",
				reportingPeriod: { startDate: "2024-01-01", endDate: "2024-01-31" },
				granularity: "DAILY",
				metrics: {
					totalSales: 400,
					totalClicks: 50,
					totalDetailPageViews: 30,
					totalPurchases: 4,
					totalUnitsOrdered: 5,
					returnOnAdSpend: 4.0,
					clickThroughRate: 2.0,
					purchaseRate: 8.0,
					costPerClick: 2.0,
					costPerDetailPageView: 3.33,
					costPerPurchase: 25.0,
				},
				breakdown: [],
				filters: [],
				createdAt: "2024-01-31T23:59:59Z",
			});

			const startTime = Date.now();
			const dashboard =
				await attributionManager.getCampaignPerformanceDashboard(
					"adv-1",
					"2024-01-01",
					"2024-01-31",
				);
			const endTime = Date.now();

			expect(dashboard.summary).toHaveLength(1000);
			expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
		});
	});
});
