/**
 * Unified Campaign Manager tests
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
import type { DSPProvider } from "../../providers/dsp";
import type {
	CampaignSearchFilters,
	CreateUnifiedCampaignRequest,
	UnifiedCampaign,
} from "../campaign-manager";
import { CampaignManager } from "../campaign-manager";

// Mock providers
const mockAdvertisingProvider: AdvertisingProvider = {
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

const mockDSPProvider: DSPProvider = {
	providerId: "dsp",
	name: "Amazon DSP API",
	version: "3.0",
	initialize: vi.fn(),
	healthCheck: vi.fn(),
	getRateLimit: vi.fn(),
	getCampaigns: vi.fn(),
	getCampaign: vi.fn(),
	createCampaign: vi.fn(),
	updateCampaign: vi.fn(),
	archiveCampaign: vi.fn(),
	getLineItems: vi.fn(),
	getLineItem: vi.fn(),
	createLineItem: vi.fn(),
	updateLineItem: vi.fn(),
	getCreatives: vi.fn(),
	getCreative: vi.fn(),
	createCreative: vi.fn(),
	updateCreative: vi.fn(),
	getAudiences: vi.fn(),
	getAudience: vi.fn(),
	createAudience: vi.fn(),
	updateAudience: vi.fn(),
	requestReport: vi.fn(),
	getReport: vi.fn(),
	getReports: vi.fn(),
	downloadReport: vi.fn(),
	getCampaignPerformance: vi.fn(),
	getLineItemPerformance: vi.fn(),
} as unknown as DSPProvider;

describe("CampaignManager", () => {
	let manager: CampaignManager;

	beforeEach(() => {
		vi.clearAllMocks();
		manager = new CampaignManager(mockAdvertisingProvider, mockDSPProvider);
	});

	describe("initialization", () => {
		it("should initialize with both providers", () => {
			expect(
				() => new CampaignManager(mockAdvertisingProvider, mockDSPProvider),
			).not.toThrow();
		});

		it("should initialize with only advertising provider", () => {
			expect(() => new CampaignManager(mockAdvertisingProvider)).not.toThrow();
		});

		it("should initialize with only DSP provider", () => {
			expect(
				() => new CampaignManager(undefined, mockDSPProvider),
			).not.toThrow();
		});

		it("should throw error if no providers configured", () => {
			expect(() => new CampaignManager()).toThrow(
				"At least one advertising provider must be configured",
			);
		});
	});

	describe("getAllCampaigns", () => {
		it("should fetch campaigns from both providers", async () => {
			const mockAdvertisingCampaigns = {
				campaigns: [
					{
						campaignId: "ad-123",
						name: "Test Ad Campaign",
						campaignType: "sponsoredProducts",
						targetingType: "manual",
						state: "enabled",
						dailyBudget: 100,
						currency: "USD",
						startDate: "2024-01-01",
						creationDate: "2024-01-01T00:00:00Z",
						lastUpdatedDate: "2024-01-01T00:00:00Z",
					},
				],
				totalCount: 1,
			};

			const mockDSPCampaigns = {
				campaigns: [
					{
						campaignId: "dsp-456",
						name: "Test DSP Campaign",
						advertiserId: "test-advertiser",
						type: "DISPLAY",
						status: "ACTIVE",
						bidStrategy: "AUTO",
						optimizationGoal: "REACH",
						budget: { type: "DAILY", amount: 200, currency: "USD" },
						schedule: { startDate: "2024-01-01", timezone: "UTC" },
						targeting: {},
						createdDate: "2024-01-01T00:00:00Z",
						lastModifiedDate: "2024-01-01T00:00:00Z",
					},
				],
				totalCount: 1,
			};

			(
				mockAdvertisingProvider.getCampaigns as MockedFunction<any>
			).mockResolvedValue(mockAdvertisingCampaigns);
			(mockDSPProvider.getCampaigns as MockedFunction<any>).mockResolvedValue(
				mockDSPCampaigns,
			);

			const campaigns = await manager.getAllCampaigns();

			expect(campaigns).toHaveLength(2);
			expect(campaigns[0].platform).toBe("ADVERTISING");
			expect(campaigns[0].type).toBe("SPONSORED_PRODUCTS");
			expect(campaigns[1].platform).toBe("DSP");
			expect(campaigns[1].type).toBe("DSP_DISPLAY");
		});

		it("should apply filters correctly", async () => {
			const mockCampaigns = {
				campaigns: [
					{
						campaignId: "ad-123",
						name: "Test Campaign",
						campaignType: "sponsoredProducts",
						targetingType: "manual",
						state: "enabled",
						dailyBudget: 100,
						currency: "USD",
						startDate: "2024-01-01",
						creationDate: "2024-01-01T00:00:00Z",
						lastUpdatedDate: "2024-01-01T00:00:00Z",
					},
				],
				totalCount: 1,
			};

			(
				mockAdvertisingProvider.getCampaigns as MockedFunction<any>
			).mockResolvedValue(mockCampaigns);
			(mockDSPProvider.getCampaigns as MockedFunction<any>).mockResolvedValue({
				campaigns: [],
				totalCount: 0,
			});

			const filters: CampaignSearchFilters = {
				platforms: ["ADVERTISING"],
				types: ["SPONSORED_PRODUCTS"],
				statuses: ["ACTIVE"],
			};

			const campaigns = await manager.getAllCampaigns(filters);

			expect(campaigns).toHaveLength(1);
			expect(mockDSPProvider.getCampaigns).not.toHaveBeenCalled();
		});

		it("should cache results", async () => {
			const mockCampaigns = { campaigns: [], totalCount: 0 };
			(
				mockAdvertisingProvider.getCampaigns as MockedFunction<any>
			).mockResolvedValue(mockCampaigns);
			(mockDSPProvider.getCampaigns as MockedFunction<any>).mockResolvedValue(
				mockCampaigns,
			);

			// First call
			await manager.getAllCampaigns();
			expect(mockAdvertisingProvider.getCampaigns).toHaveBeenCalledTimes(1);

			// Second call (should use cache)
			await manager.getAllCampaigns();
			expect(mockAdvertisingProvider.getCampaigns).toHaveBeenCalledTimes(1);
		});
	});

	describe("getCampaign", () => {
		it("should find campaign in advertising provider", async () => {
			const mockCampaign = {
				campaignId: "ad-123",
				name: "Test Campaign",
				campaignType: "sponsoredProducts",
				targetingType: "manual",
				state: "enabled",
				dailyBudget: 100,
				currency: "USD",
				startDate: "2024-01-01",
				creationDate: "2024-01-01T00:00:00Z",
				lastUpdatedDate: "2024-01-01T00:00:00Z",
			};

			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockResolvedValue(mockCampaign);
			(mockDSPProvider.getCampaign as MockedFunction<any>).mockRejectedValue(
				new Error("Not found"),
			);

			const campaign = await manager.getCampaign("ad-123");

			expect(campaign).toBeDefined();
			expect(campaign?.platform).toBe("ADVERTISING");
			expect(campaign?.campaignId).toBe("ad-123");
		});

		it("should find campaign in DSP provider", async () => {
			const mockCampaign = {
				campaignId: "dsp-456",
				name: "Test DSP Campaign",
				advertiserId: "test-advertiser",
				type: "DISPLAY",
				status: "ACTIVE",
				bidStrategy: "AUTO",
				optimizationGoal: "REACH",
				budget: { type: "DAILY", amount: 200, currency: "USD" },
				schedule: { startDate: "2024-01-01", timezone: "UTC" },
				targeting: {},
				createdDate: "2024-01-01T00:00:00Z",
				lastModifiedDate: "2024-01-01T00:00:00Z",
			};

			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockRejectedValue(new Error("Not found"));
			(mockDSPProvider.getCampaign as MockedFunction<any>).mockResolvedValue(
				mockCampaign,
			);

			const campaign = await manager.getCampaign("dsp-456");

			expect(campaign).toBeDefined();
			expect(campaign?.platform).toBe("DSP");
			expect(campaign?.campaignId).toBe("dsp-456");
		});

		it("should return null if campaign not found", async () => {
			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockRejectedValue(new Error("Not found"));
			(mockDSPProvider.getCampaign as MockedFunction<any>).mockRejectedValue(
				new Error("Not found"),
			);

			const campaign = await manager.getCampaign("unknown-123");

			expect(campaign).toBeNull();
		});
	});

	describe("createCampaign", () => {
		it("should create advertising campaign", async () => {
			const request: CreateUnifiedCampaignRequest = {
				platform: "ADVERTISING",
				type: "SPONSORED_PRODUCTS",
				name: "New Ad Campaign",
				budget: { type: "DAILY", amount: 100, currency: "USD" },
				bidStrategy: "AUTO",
				schedule: { startDate: "2024-01-01", timezone: "UTC" },
			};

			const mockCreated = {
				campaignId: "ad-new",
				name: "New Ad Campaign",
				campaignType: "sponsoredProducts",
				targetingType: "manual",
				state: "enabled",
				dailyBudget: 100,
				currency: "USD",
				startDate: "2024-01-01",
				creationDate: "2024-01-01T00:00:00Z",
				lastUpdatedDate: "2024-01-01T00:00:00Z",
			};

			(
				mockAdvertisingProvider.createCampaign as MockedFunction<any>
			).mockResolvedValue(mockCreated);

			const campaign = await manager.createCampaign(request);

			expect(campaign.campaignId).toBe("ad-new");
			expect(campaign.platform).toBe("ADVERTISING");
			expect(mockAdvertisingProvider.createCampaign).toHaveBeenCalled();
		});

		it("should create DSP campaign", async () => {
			const request: CreateUnifiedCampaignRequest = {
				platform: "DSP",
				type: "DSP_DISPLAY",
				name: "New DSP Campaign",
				budget: { type: "DAILY", amount: 200, currency: "USD" },
				bidStrategy: "AUTO",
				schedule: { startDate: "2024-01-01", timezone: "UTC" },
				dspOptions: {
					optimizationGoal: "REACH",
					frequencyCap: { impressions: 5, period: "DAY" },
				},
			};

			const mockCreated = {
				campaignId: "dsp-new",
				name: "New DSP Campaign",
				advertiserId: "test-advertiser",
				type: "DISPLAY",
				status: "ACTIVE",
				bidStrategy: "AUTO",
				optimizationGoal: "REACH",
				budget: { type: "DAILY", amount: 200, currency: "USD" },
				schedule: { startDate: "2024-01-01", timezone: "UTC" },
				targeting: {},
				createdDate: "2024-01-01T00:00:00Z",
				lastModifiedDate: "2024-01-01T00:00:00Z",
			};

			(mockDSPProvider.createCampaign as MockedFunction<any>).mockResolvedValue(
				mockCreated,
			);

			const campaign = await manager.createCampaign(request);

			expect(campaign.campaignId).toBe("dsp-new");
			expect(campaign.platform).toBe("DSP");
			expect(mockDSPProvider.createCampaign).toHaveBeenCalled();
		});
	});

	describe("updateCampaign", () => {
		it("should update campaign status", async () => {
			// First, mock getting the campaign to determine platform
			const mockCampaign = {
				campaignId: "ad-123",
				name: "Test Campaign",
				campaignType: "sponsoredProducts",
				targetingType: "manual",
				state: "enabled",
				dailyBudget: 100,
				currency: "USD",
				startDate: "2024-01-01",
				creationDate: "2024-01-01T00:00:00Z",
				lastUpdatedDate: "2024-01-01T00:00:00Z",
			};

			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockResolvedValue(mockCampaign);
			(
				mockAdvertisingProvider.updateCampaign as MockedFunction<any>
			).mockResolvedValue({
				...mockCampaign,
				state: "paused",
			});

			const updated = await manager.updateCampaign("ad-123", {
				status: "PAUSED",
			});

			expect(updated.status).toBe("PAUSED");
			expect(mockAdvertisingProvider.updateCampaign).toHaveBeenCalledWith(
				"ad-123",
				expect.objectContaining({ state: "paused" }),
			);
		});
	});

	describe("bulkOperation", () => {
		it("should perform bulk pause operation", async () => {
			const campaignIds = ["ad-123", "dsp-456"];

			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockResolvedValueOnce({
				campaignId: "ad-123",
				campaignType: "sponsoredProducts",
				state: "enabled",
				dailyBudget: 100,
			});
			(
				mockDSPProvider.getCampaign as MockedFunction<any>
			).mockResolvedValueOnce({
				campaignId: "dsp-456",
				type: "DISPLAY",
				status: "ACTIVE",
				budget: { type: "DAILY", amount: 200, currency: "USD" },
			});

			(
				mockAdvertisingProvider.updateCampaign as MockedFunction<any>
			).mockResolvedValue({});
			(mockDSPProvider.updateCampaign as MockedFunction<any>).mockResolvedValue(
				{},
			);

			const result = await manager.bulkOperation({
				campaignIds,
				operation: "PAUSE",
			});

			expect(result.successful).toHaveLength(2);
			expect(result.failed).toHaveLength(0);
		});

		it("should handle failures in bulk operations", async () => {
			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockRejectedValue(new Error("Not found"));
			(mockDSPProvider.getCampaign as MockedFunction<any>).mockRejectedValue(
				new Error("Not found"),
			);

			const result = await manager.bulkOperation({
				campaignIds: ["unknown-123"],
				operation: "PAUSE",
			});

			expect(result.successful).toHaveLength(0);
			expect(result.failed).toHaveLength(1);
			expect(result.failed[0].error).toContain("Campaign not found");
		});
	});

	describe("getCampaignPerformance", () => {
		it("should get advertising campaign performance", async () => {
			const mockPerformance = {
				impressions: 10000,
				clicks: 500,
				cost: 250,
				sales: 1000,
				orders: 20,
				ctr: 5.0,
				acos: 25.0,
				roas: 4.0,
			};

			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockResolvedValue({
				campaignId: "ad-123",
				campaignType: "sponsoredProducts",
			});
			(
				mockAdvertisingProvider.getCampaignPerformance as MockedFunction<any>
			).mockResolvedValue(mockPerformance);

			const performance = await manager.getCampaignPerformance("ad-123", {
				startDate: "2024-01-01",
				endDate: "2024-01-31",
			});

			expect(performance.impressions).toBe(10000);
			expect(performance.acos).toBe(25.0);
			expect(performance.roas).toBe(4.0);
		});

		it("should get DSP campaign performance", async () => {
			const mockPerformance = {
				impressions: 50000,
				clicks: 1000,
				spend: 500,
				ctr: 2.0,
				cpc: 0.5,
				cpm: 10.0,
				viewableImpressions: 45000,
				viewabilityRate: 90.0,
			};

			(mockDSPProvider.getCampaign as MockedFunction<any>).mockResolvedValue({
				campaignId: "dsp-456",
				type: "DISPLAY",
			});
			(
				mockDSPProvider.getCampaignPerformance as MockedFunction<any>
			).mockResolvedValue(mockPerformance);

			const performance = await manager.getCampaignPerformance(
				"dsp-456",
				{
					startDate: "2024-01-01",
					endDate: "2024-01-31",
				},
				"DSP",
			);

			expect(performance.impressions).toBe(50000);
			expect(performance.viewableImpressions).toBe(45000);
			expect(performance.cpm).toBe(10.0);
		});
	});

	describe("getOptimizationSuggestions", () => {
		it("should generate optimization suggestions for high ACOS", async () => {
			const mockCampaign: UnifiedCampaign = {
				campaignId: "ad-123",
				platform: "ADVERTISING",
				type: "SPONSORED_PRODUCTS",
				name: "Test Campaign",
				status: "ACTIVE",
				budget: { type: "DAILY", amount: 100, currency: "USD" },
				bidStrategy: "AUTO",
				targeting: {},
				schedule: { startDate: "2024-01-01", timezone: "UTC" },
				performance: {
					impressions: 10000,
					clicks: 500,
					spend: 300,
					sales: 600,
					orders: 10,
					ctr: 5.0,
					cpc: 0.6,
					cpm: 30.0,
					acos: 50.0, // High ACOS
					roas: 2.0,
				},
				createdDate: "2024-01-01T00:00:00Z",
				lastModifiedDate: "2024-01-01T00:00:00Z",
				metadata: { originalCampaign: {} as any },
			};

			const mockCampaigns = { campaigns: [], totalCount: 0 };
			(
				mockAdvertisingProvider.getCampaigns as MockedFunction<any>
			).mockResolvedValue(mockCampaigns);
			(mockDSPProvider.getCampaigns as MockedFunction<any>).mockResolvedValue(
				mockCampaigns,
			);
			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockResolvedValue(mockCampaign.metadata.originalCampaign);

			const suggestions = await manager.getOptimizationSuggestions(["ad-123"]);

			expect(suggestions).toHaveLength(2); // ACOS and ROAS suggestions
			expect(suggestions[0].type).toBe("BID");
			expect(suggestions[0].priority).toBe("HIGH");
			expect(suggestions[0].description).toContain("High ACOS detected");
		});

		it("should generate suggestions for low budget utilization", async () => {
			const mockCampaign: UnifiedCampaign = {
				campaignId: "ad-123",
				platform: "ADVERTISING",
				type: "SPONSORED_PRODUCTS",
				name: "Test Campaign",
				status: "ACTIVE",
				budget: { type: "DAILY", amount: 100, currency: "USD" },
				bidStrategy: "AUTO",
				targeting: {},
				schedule: { startDate: "2024-01-01", timezone: "UTC" },
				performance: {
					impressions: 5000,
					clicks: 100,
					spend: 25, // Low spend vs budget
					sales: 200,
					orders: 5,
					ctr: 2.0,
					cpc: 0.25,
					cpm: 5.0,
					acos: 12.5,
					roas: 8.0,
				},
				createdDate: "2024-01-01T00:00:00Z",
				lastModifiedDate: "2024-01-01T00:00:00Z",
				metadata: { originalCampaign: {} as any },
			};

			const mockCampaigns = { campaigns: [], totalCount: 0 };
			(
				mockAdvertisingProvider.getCampaigns as MockedFunction<any>
			).mockResolvedValue(mockCampaigns);
			(mockDSPProvider.getCampaigns as MockedFunction<any>).mockResolvedValue(
				mockCampaigns,
			);
			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockResolvedValue(mockCampaign.metadata.originalCampaign);

			const suggestions = await manager.getOptimizationSuggestions(["ad-123"]);

			expect(suggestions.some((s) => s.type === "BUDGET")).toBe(true);
			const budgetSuggestion = suggestions.find((s) => s.type === "BUDGET");
			expect(budgetSuggestion?.description).toContain("Low budget utilization");
		});
	});

	describe("getCampaignInsights", () => {
		it("should generate campaign insights with recommendations", async () => {
			const mockCampaign = {
				campaignId: "ad-123",
				campaignType: "sponsoredProducts",
				state: "enabled",
				dailyBudget: 100,
			};

			const mockPerformance = {
				impressions: 10000,
				clicks: 40, // Low CTR
				cost: 200,
				sales: 400,
				orders: 10,
				ctr: 0.4, // Below 0.5%
				acos: 50.0, // Above 30%
				roas: 2.0,
				conversions: 10,
				conversionRate: 25.0,
			};

			(
				mockAdvertisingProvider.getCampaign as MockedFunction<any>
			).mockResolvedValue(mockCampaign);
			(
				mockAdvertisingProvider.getCampaignPerformance as MockedFunction<any>
			).mockResolvedValue(mockPerformance);

			const insights = await manager.getCampaignInsights("ad-123");

			expect(insights.campaign).toBeDefined();
			expect(insights.performance).toBeDefined();
			expect(insights.trends).toBeDefined();
			expect(insights.recommendations).toHaveLength(2); // Low CTR and High ACOS
			expect(insights.recommendations[0]).toContain("Low CTR");
			expect(insights.recommendations[1]).toContain("High ACOS");
		});
	});

	describe("error handling", () => {
		it("should handle provider not configured errors", async () => {
			const managerWithoutDSP = new CampaignManager(mockAdvertisingProvider);

			await expect(
				managerWithoutDSP.createCampaign({
					platform: "DSP",
					type: "DSP_DISPLAY",
					name: "Test",
					budget: { type: "DAILY", amount: 100, currency: "USD" },
					bidStrategy: "AUTO",
					schedule: { startDate: "2024-01-01", timezone: "UTC" },
				}),
			).rejects.toThrow("DSP provider not configured");
		});

		it("should handle invalid platform errors", async () => {
			await expect(
				manager.createCampaign({
					platform: "INVALID" as any,
					type: "SPONSORED_PRODUCTS",
					name: "Test",
					budget: { type: "DAILY", amount: 100, currency: "USD" },
					bidStrategy: "AUTO",
					schedule: { startDate: "2024-01-01", timezone: "UTC" },
				}),
			).rejects.toThrow("Invalid platform");
		});
	});
});
