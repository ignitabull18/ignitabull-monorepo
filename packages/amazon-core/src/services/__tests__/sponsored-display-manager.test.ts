/**
 * Sponsored Display Manager tests
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
import type { CreateSponsoredDisplayCampaignRequest } from "../sponsored-display-manager";
import { SponsoredDisplayManager } from "../sponsored-display-manager";

// Mock providers
const mockAdvertisingProvider = {
	providerId: "advertising",
	name: "Amazon Advertising API",
	version: "3.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
	getProfiles: vi.fn(),
	getCampaigns: vi.fn(),
	getCampaign: vi.fn(),
	createCampaign: vi.fn(),
	updateCampaign: vi.fn(),
	archiveCampaign: vi.fn(),
	getAdGroups: vi.fn(),
	createAdGroup: vi.fn(),
	getKeywords: vi.fn(),
	createKeywords: vi.fn(),
	updateKeywords: vi.fn(),
	getProductAds: vi.fn(),
	createProductAds: vi.fn(),
	requestReport: vi.fn(),
	getReport: vi.fn(),
	downloadReport: vi.fn(),
	getCampaignPerformance: vi.fn(),
} as unknown as AdvertisingProvider;

const mockBrandAnalyticsProvider = {
	providerId: "brand-analytics",
	name: "Amazon Brand Analytics API",
	version: "1.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
} as unknown as BrandAnalyticsProvider;

describe("SponsoredDisplayManager", () => {
	let manager: SponsoredDisplayManager;

	beforeEach(() => {
		vi.clearAllMocks();
		manager = new SponsoredDisplayManager(
			mockAdvertisingProvider,
			mockBrandAnalyticsProvider,
		);
	});

	describe("createCampaign", () => {
		it("should create enhanced Sponsored Display campaign with audience targeting", async () => {
			const request: CreateSponsoredDisplayCampaignRequest = {
				name: "Test SD Campaign",
				targetingType: "AUDIENCES",
				budget: {
					type: "daily",
					amount: 100,
				},
				optimizationGoal: "CONVERSIONS",
				audienceTargeting: {
					audienceType: "AMAZON_AUDIENCES",
					amazonAudiences: {
						inMarket: ["electronics"],
						lifestyle: ["tech-enthusiasts"],
					},
				},
				creative: {
					assets: {
						type: "STANDARD",
						standard: {
							headline: "Amazing Product",
							brandName: "Test Brand",
						},
					},
				},
			};

			const mockCreatedCampaign = {
				campaignId: "sd-123",
				name: "Test SD Campaign",
				campaignType: "sponsoredDisplay",
				targetingType: "auto",
				state: "enabled",
				dailyBudget: 100,
				currency: "USD",
				startDate: "2024-01-01",
				creationDate: "2024-01-01T00:00:00Z",
				lastUpdatedDate: "2024-01-01T00:00:00Z",
				bidding: {
					strategy: "legacyForSales",
				},
			};

			(
				mockAdvertisingProvider.createCampaign as MockedFunction<any>
			).mockResolvedValue(mockCreatedCampaign);

			const campaign = await manager.createCampaign(request);

			expect(campaign.campaignId).toBe("sd-123");
			expect(campaign.targetingType).toBe("AUDIENCES");
			expect(campaign.audienceTargeting).toEqual(request.audienceTargeting);
			expect(campaign.creative.assets).toEqual(request.creative.assets);
			expect(campaign.settings.placementOptimization?.offAmazon).toBe(true);
		});

		it("should create campaign with contextual targeting", async () => {
			const request: CreateSponsoredDisplayCampaignRequest = {
				name: "Test Contextual Campaign",
				targetingType: "CONTEXTUAL",
				budget: {
					type: "daily",
					amount: 50,
				},
				optimizationGoal: "REACH",
				contextualTargeting: {
					products: {
						asins: ["B001234567", "B002345678"],
						categories: ["Electronics"],
					},
				},
				creative: {
					assets: {
						type: "VIDEO",
						video: {
							videoUrl: "https://example.com/video.mp4",
							thumbnailUrl: "https://example.com/thumb.jpg",
							duration: 30,
							aspectRatio: "16:9",
						},
					},
				},
			};

			const mockCreatedCampaign = {
				campaignId: "sd-456",
				name: "Test Contextual Campaign",
				campaignType: "sponsoredDisplay",
				targetingType: "manual",
				state: "enabled",
				dailyBudget: 50,
				currency: "USD",
				startDate: "2024-01-01",
				creationDate: "2024-01-01T00:00:00Z",
				lastUpdatedDate: "2024-01-01T00:00:00Z",
			};

			(
				mockAdvertisingProvider.createCampaign as MockedFunction<any>
			).mockResolvedValue(mockCreatedCampaign);

			const campaign = await manager.createCampaign(request);

			expect(campaign.targetingType).toBe("CONTEXTUAL");
			expect(campaign.contextualTargeting).toEqual(request.contextualTargeting);
			expect(campaign.creative.assets.type).toBe("VIDEO");
		});

		it("should validate targeting configuration", async () => {
			const invalidRequest: CreateSponsoredDisplayCampaignRequest = {
				name: "Invalid Campaign",
				targetingType: "AUDIENCES",
				budget: { type: "daily", amount: 100 },
				optimizationGoal: "CONVERSIONS",
				// Missing audienceTargeting
				creative: {
					assets: {
						type: "STANDARD",
						standard: { headline: "Test", brandName: "Brand" },
					},
				},
			};

			await expect(manager.createCampaign(invalidRequest)).rejects.toThrow(
				"Audience targeting is required",
			);
		});
	});

	describe("getAudienceInsights", () => {
		it("should return Amazon audience insights", async () => {
			const insights = await manager.getAudienceInsights("AMAZON", {
				category: "Electronics",
			});

			expect(insights.length).toBeGreaterThan(0);
			expect(insights[0]).toHaveProperty("audienceId");
			expect(insights[0]).toHaveProperty("demographics");
			expect(insights[0]).toHaveProperty("interests");
			expect(insights[0]).toHaveProperty("behavior");
			expect(insights[0]).toHaveProperty("performance");
		});

		it("should return remarketing audience insights", async () => {
			const insights = await manager.getAudienceInsights("REMARKETING", {
				asins: ["B001234567", "B002345678"],
				lookbackWindow: 30,
			});

			expect(insights.length).toBe(1);
			expect(insights[0].audienceName).toContain("Product Viewers - 30 days");
			expect(insights[0].behavior.brandLoyalty).toBe(0.8);
			expect(insights[0].performance.estimatedCvr).toBe(5.0);
		});

		it("should cache audience insights", async () => {
			// First call
			await manager.getAudienceInsights("AMAZON", { category: "Electronics" });

			// Second call (should use cache)
			const start = Date.now();
			await manager.getAudienceInsights("AMAZON", { category: "Electronics" });
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(10); // Should be fast due to cache
		});
	});

	describe("analyzeCreativePerformance", () => {
		it("should analyze creative performance with recommendations", async () => {
			const mockPerformance = {
				impressions: 10000,
				clicks: 80,
				cost: 100,
				sales: 500,
				orders: 10,
				ctr: 0.8,
				acos: 20,
				roas: 5,
			};

			(
				mockAdvertisingProvider.getCampaignPerformance as MockedFunction<any>
			).mockResolvedValue(mockPerformance);

			const analyses = await manager.analyzeCreativePerformance("sd-123", {
				startDate: "2024-01-01",
				endDate: "2024-01-07",
			});

			expect(analyses).toHaveLength(1);
			expect(analyses[0].analysis.performanceScore).toBe(75);
			expect(analyses[0].analysis.strengths).toContain("High viewability rate");
			expect(analyses[0].analysis.recommendations).toContain(
				"Test lifestyle imagery to improve brand connection",
			);
		});
	});

	describe("getOptimizationSuggestions", () => {
		it("should suggest audience expansion for low impressions", async () => {
			const _mockCampaign = {
				campaignId: "sd-123",
				targetingType: "AUDIENCES",
				audienceTargeting: {
					audienceType: "AMAZON_AUDIENCES",
				},
			};

			const mockPerformance = {
				impressions: 5000, // Low impressions
				clicks: 25,
				cost: 50,
				sales: 100,
				orders: 2,
				ctr: 0.5,
				acos: 50,
				roas: 2,
			};

			(
				mockAdvertisingProvider.getCampaignPerformance as MockedFunction<any>
			).mockResolvedValue(mockPerformance);

			const suggestions = await manager.getOptimizationSuggestions("sd-123");

			const audienceSuggestion = suggestions.find(
				(s) => s.suggestionType === "AUDIENCE_EXPANSION",
			);
			expect(audienceSuggestion).toBeDefined();
			expect(audienceSuggestion?.priority).toBe("HIGH");
			expect(
				audienceSuggestion?.recommendation.expectedImpact.percentageChange,
			).toBe(200);
		});

		it("should suggest creative refresh for low CTR", async () => {
			const mockPerformance = {
				impressions: 20000,
				clicks: 60, // Low CTR (0.3%)
				cost: 100,
				sales: 200,
				orders: 4,
				ctr: 0.3,
				acos: 50,
				roas: 2,
			};

			(
				mockAdvertisingProvider.getCampaignPerformance as MockedFunction<any>
			).mockResolvedValue(mockPerformance);

			const suggestions = await manager.getOptimizationSuggestions("sd-123");

			const creativeSuggestion = suggestions.find(
				(s) => s.suggestionType === "CREATIVE_REFRESH",
			);
			expect(creativeSuggestion).toBeDefined();
			expect(creativeSuggestion?.priority).toBe("MEDIUM");
			expect(creativeSuggestion?.description).toContain(
				"Below-average click-through rate",
			);
		});

		it("should suggest bid optimization for high ACOS", async () => {
			const mockPerformance = {
				impressions: 20000,
				clicks: 200,
				cost: 300,
				sales: 600,
				orders: 10,
				ctr: 1.0,
				acos: 50, // High ACOS
				roas: 2,
			};

			(
				mockAdvertisingProvider.getCampaignPerformance as MockedFunction<any>
			).mockResolvedValue(mockPerformance);

			const suggestions = await manager.getOptimizationSuggestions("sd-123");

			const bidSuggestion = suggestions.find(
				(s) => s.suggestionType === "BID_OPTIMIZATION",
			);
			expect(bidSuggestion).toBeDefined();
			expect(bidSuggestion?.priority).toBe("HIGH");
			expect(bidSuggestion?.recommendation.action).toContain(
				"automated bid optimization",
			);
		});
	});

	describe("executeBulkOperations", () => {
		it("should execute bulk operations successfully", async () => {
			const operations = [
				{
					operationType: "CREATE" as const,
					recordType: "CAMPAIGN" as const,
					campaign: {
						name: "Bulk Campaign 1",
					},
				},
				{
					operationType: "UPDATE" as const,
					recordType: "AD_GROUP" as const,
					adGroup: {
						adGroupId: "ag-123",
						defaultBid: { amount: 1.5, currencyCode: "USD" },
					},
				},
			];

			const result = await manager.executeBulkOperations(operations);

			expect(result.successful).toBe(2);
			expect(result.failed).toHaveLength(0);
		});

		it("should handle failed operations", async () => {
			const operations = [
				{
					operationType: "CREATE" as const,
					recordType: "INVALID" as any,
					campaign: {},
				},
			];

			const result = await manager.executeBulkOperations(operations);

			expect(result.successful).toBe(0);
			expect(result.failed).toHaveLength(1);
		});
	});

	describe("generatePerformanceReport", () => {
		it("should generate performance report", async () => {
			const mockReportId = { reportId: "report-123" };
			const mockReport = {
				reportId: "report-123",
				status: "SUCCESS",
				downloadUrl: "https://example.com/report.json",
			};

			(
				mockAdvertisingProvider.requestReport as MockedFunction<any>
			).mockResolvedValue(mockReportId);
			(
				mockAdvertisingProvider.getReport as MockedFunction<any>
			).mockResolvedValue(mockReport);

			const report = await manager.generatePerformanceReport({
				reportType: "CAMPAIGN_PERFORMANCE",
				startDate: "2024-01-01",
				endDate: "2024-01-31",
				metrics: ["impressions", "clicks", "ctr", "acos"],
				dimensions: ["DATE", "CAMPAIGN"],
			});

			expect(report.reportId).toBe("report-123");
			expect(mockAdvertisingProvider.requestReport).toHaveBeenCalled();
		});
	});

	describe("getEnhancedCampaign", () => {
		it("should return enhanced campaign data", async () => {
			const mockCampaign = {
				campaignId: "sd-123",
				name: "Test Campaign",
				campaignType: "sponsoredDisplay",
				targetingType: "manual",
				state: "enabled",
				dailyBudget: 100,
				currency: "USD",
				creationDate: "2024-01-01T00:00:00Z",
				lastUpdatedDate: "2024-01-01T00:00:00Z",
				bidding: {
					strategy: "legacyForSales",
				},
			};

			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockResolvedValue(mockCampaign);

			const enhanced = await manager.getEnhancedCampaign("sd-123");

			expect(enhanced).toBeDefined();
			expect(enhanced?.campaignId).toBe("sd-123");
			expect(enhanced?.targetingType).toBe("CONTEXTUAL");
			expect(enhanced?.creative).toBeDefined();
		});

		it("should return null for non-SD campaigns", async () => {
			const mockCampaign = {
				campaignId: "sp-123",
				campaignType: "sponsoredProducts",
			};

			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockResolvedValue(mockCampaign);

			const enhanced = await manager.getEnhancedCampaign("sp-123");

			expect(enhanced).toBeNull();
		});
	});
});
