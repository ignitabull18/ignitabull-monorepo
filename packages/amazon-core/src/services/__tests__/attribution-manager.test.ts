/**
 * Attribution Manager tests
 */

import {
	beforeEach,
	describe,
	expect,
	it,
	type MockedFunction,
	vi,
} from "vitest";
import type { AttributionProvider } from "../../providers/attribution";
import type {
	AttributionCampaign,
	AttributionOptimizationSuggestion,
	AttributionReport,
	CreateAttributionCampaignRequest,
	CrossChannelAnalysis,
} from "../../types/attribution";
import {
	AttributionManager,
	type AttributionManagerConfig,
} from "../attribution-manager";

// Mock provider
const mockAttributionProvider = {
	getAttributionCampaigns: vi.fn(),
	createAttributionCampaign: vi.fn(),
	updateAttributionCampaign: vi.fn(),
	deleteAttributionCampaign: vi.fn(),
	getAttributionAudiences: vi.fn(),
	createAttributionAudience: vi.fn(),
	updateAttributionAudience: vi.fn(),
	deleteAttributionAudience: vi.fn(),
	getAttributionCreatives: vi.fn(),
	createAttributionCreative: vi.fn(),
	updateAttributionCreative: vi.fn(),
	deleteAttributionCreative: vi.fn(),
	generateAttributionReport: vi.fn(),
	getConversionData: vi.fn(),
	getCrossChannelAnalysis: vi.fn(),
	getOptimizationSuggestions: vi.fn(),
	performBulkOperation: vi.fn(),
	analyzeCustomerJourney: vi.fn(),
	measureIncrementalImpact: vi.fn(),
} as unknown as AttributionProvider;

describe("AttributionManager", () => {
	let attributionManager: AttributionManager;
	const config: AttributionManagerConfig = {
		defaultAttributionModel: "DATA_DRIVEN",
		optimizationThresholds: {
			minROAS: 3.0,
			minConversionRate: 2.0,
			maxCostPerClick: 5.0,
		},
		caching: {
			enabled: false, // Disable caching for tests
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		attributionManager = new AttributionManager(
			mockAttributionProvider,
			config,
		);
	});

	describe("getCampaignPerformanceDashboard", () => {
		it("should generate comprehensive campaign performance dashboard", async () => {
			const mockCampaigns: AttributionCampaign[] = [
				{
					campaignId: "camp-001",
					campaignName: "Search Campaign",
					advertiserId: "adv-001",
					advertiserName: "Test Advertiser",
					campaignType: "SEARCH",
					status: "ACTIVE",
					createdDate: "2024-01-01T00:00:00Z",
					lastModifiedDate: "2024-01-01T00:00:00Z",
					startDate: "2024-01-01",
					endDate: "2024-12-31",
					budget: 10000,
					dailyBudget: 100,
					targetingType: "KEYWORD",
					bidStrategy: "target_roas",
					performance: {
						impressions: 100000,
						clicks: 5000,
						spend: 2500,
						detailPageViews: 1500,
						purchases: 300,
						sales: 15000,
						unitsOrdered: 250,
						clickThroughRate: 5.0,
						costPerClick: 0.5,
						returnOnAdSpend: 6.0,
						attributionRate: 6.0,
					},
					products: [],
				},
				{
					campaignId: "camp-002",
					campaignName: "Display Campaign",
					advertiserId: "adv-001",
					advertiserName: "Test Advertiser",
					campaignType: "DISPLAY",
					status: "ACTIVE",
					createdDate: "2024-01-01T00:00:00Z",
					lastModifiedDate: "2024-01-01T00:00:00Z",
					startDate: "2024-01-01",
					endDate: "2024-12-31",
					budget: 5000,
					dailyBudget: 50,
					targetingType: "AUDIENCE",
					bidStrategy: "maximize_conversions",
					performance: {
						impressions: 200000,
						clicks: 2000,
						spend: 1000,
						detailPageViews: 800,
						purchases: 80,
						sales: 4000,
						unitsOrdered: 85,
						clickThroughRate: 1.0,
						costPerClick: 0.5,
						returnOnAdSpend: 4.0,
						attributionRate: 4.0,
					},
					products: [],
				},
			];

			const mockReports: AttributionReport[] = [
				{
					reportId: "rep-001",
					advertiserId: "adv-001",
					campaignId: "camp-001",
					productAsin: "B001234567",
					reportingPeriod: {
						startDate: "2024-01-01",
						endDate: "2024-01-31",
					},
					metrics: {
						totalClicks: 5000,
						totalDetailPageViews: 1500,
						totalPurchases: 300,
						totalSales: 15000,
						totalUnitsOrdered: 250,
						clickThroughRate: 5.0,
						detailPageViewRate: 30.0,
						purchaseRate: 20.0,
						averageOrderValue: 50.0,
						returnOnAdSpend: 6.0,
						costPerClick: 0.5,
						costPerDetailPageView: 1.67,
						costPerPurchase: 8.33,
					},
					breakdown: [
						{
							date: "2024-01-01",
							clicks: 200,
							detailPageViews: 60,
							purchases: 12,
							sales: 600,
							unitsOrdered: 10,
							newToBrandPurchases: 8,
							newToBrandSales: 400,
							newToBrandUnitsOrdered: 6,
							newToBrandPercentage: 66.7,
						},
					],
					generatedAt: "2024-01-31T00:00:00Z",
				},
				{
					reportId: "rep-002",
					advertiserId: "adv-001",
					campaignId: "camp-002",
					productAsin: "B001234567",
					reportingPeriod: {
						startDate: "2024-01-01",
						endDate: "2024-01-31",
					},
					metrics: {
						totalClicks: 2000,
						totalDetailPageViews: 800,
						totalPurchases: 80,
						totalSales: 4000,
						totalUnitsOrdered: 85,
						clickThroughRate: 1.0,
						detailPageViewRate: 40.0,
						purchaseRate: 10.0,
						averageOrderValue: 50.0,
						returnOnAdSpend: 4.0,
						costPerClick: 0.5,
						costPerDetailPageView: 1.25,
						costPerPurchase: 12.5,
					},
					breakdown: [
						{
							date: "2024-01-01",
							clicks: 80,
							detailPageViews: 32,
							purchases: 3,
							sales: 150,
							unitsOrdered: 3,
							newToBrandPurchases: 2,
							newToBrandSales: 100,
							newToBrandUnitsOrdered: 2,
							newToBrandPercentage: 66.7,
						},
					],
					generatedAt: "2024-01-31T00:00:00Z",
				},
			];

			(
				mockAttributionProvider.getAttributionCampaigns as MockedFunction<any>
			).mockResolvedValue(mockCampaigns);
			(mockAttributionProvider.generateAttributionReport as MockedFunction<any>)
				.mockResolvedValueOnce(mockReports[0])
				.mockResolvedValueOnce(mockReports[1]);

			const dashboard =
				await attributionManager.getCampaignPerformanceDashboard(
					"adv-001",
					"2024-01-01",
					"2024-01-31",
				);

			expect(dashboard.summary).toHaveLength(2);
			expect(dashboard.totals.totalSpend).toBe(3500); // 2500 + 1000
			expect(dashboard.totals.totalSales).toBe(19000); // 15000 + 4000
			expect(dashboard.totals.overallROAS).toBeCloseTo(5.43); // 19000 / 3500

			// Check top performer (Search campaign has higher ROAS)
			expect(dashboard.topPerformers[0].campaignId).toBe("camp-001");
			expect(dashboard.topPerformers[0].returnOnAdSpend).toBe(6.0);

			// Check summary structure
			const searchSummary = dashboard.summary.find(
				(s) => s.campaignId === "camp-001",
			);
			expect(searchSummary).toBeDefined();
			expect(searchSummary?.efficiency.score).toBeGreaterThan(0);
			expect(searchSummary?.efficiency.rank).toBeDefined();
			expect(searchSummary?.newToBrandPercentage).toBeGreaterThan(0);
		});

		it("should handle campaigns with no performance data", async () => {
			const mockCampaigns: AttributionCampaign[] = [
				{
					campaignId: "camp-003",
					campaignName: "New Campaign",
					advertiserId: "adv-001",
					advertiserName: "Test Advertiser",
					campaignType: "VIDEO",
					status: "DRAFT",
					createdDate: "2024-01-01T00:00:00Z",
					lastModifiedDate: "2024-01-01T00:00:00Z",
					startDate: "2024-01-01",
					targetingType: "DEMOGRAPHIC",
					bidStrategy: "target_cpa",
					performance: {
						impressions: 0,
						clicks: 0,
						spend: 0,
						detailPageViews: 0,
						purchases: 0,
						sales: 0,
						unitsOrdered: 0,
						clickThroughRate: 0,
						costPerClick: 0,
						returnOnAdSpend: 0,
						attributionRate: 0,
					},
					products: [],
				},
			];

			const mockReport: AttributionReport = {
				reportId: "rep-003",
				advertiserId: "adv-001",
				campaignId: "camp-003",
				productAsin: "B001234567",
				reportingPeriod: {
					startDate: "2024-01-01",
					endDate: "2024-01-31",
				},
				metrics: {
					totalClicks: 0,
					totalDetailPageViews: 0,
					totalPurchases: 0,
					totalSales: 0,
					totalUnitsOrdered: 0,
					clickThroughRate: 0,
					detailPageViewRate: 0,
					purchaseRate: 0,
					averageOrderValue: 0,
					returnOnAdSpend: 0,
				},
				breakdown: [],
				generatedAt: "2024-01-31T00:00:00Z",
			};

			(
				mockAttributionProvider.getAttributionCampaigns as MockedFunction<any>
			).mockResolvedValue(mockCampaigns);
			(
				mockAttributionProvider.generateAttributionReport as MockedFunction<any>
			).mockResolvedValue(mockReport);

			const dashboard =
				await attributionManager.getCampaignPerformanceDashboard(
					"adv-001",
					"2024-01-01",
					"2024-01-31",
				);

			expect(dashboard.summary).toHaveLength(1);
			expect(dashboard.totals.totalSpend).toBe(0);
			expect(dashboard.totals.totalSales).toBe(0);
			expect(dashboard.totals.overallROAS).toBe(0);

			const summary = dashboard.summary[0];
			expect(summary.efficiency.rank).toBe("POOR");
			expect(summary.efficiency.recommendations).toHaveLength.greaterThan(0);
		});
	});

	describe("generateCrossChannelInsights", () => {
		it("should analyze performance across multiple channels", async () => {
			const mockCampaigns: AttributionCampaign[] = [
				{
					campaignId: "camp-001",
					campaignName: "Search Campaign",
					advertiserId: "adv-001",
					advertiserName: "Test Advertiser",
					campaignType: "SEARCH",
					status: "ACTIVE",
					createdDate: "2024-01-01T00:00:00Z",
					lastModifiedDate: "2024-01-01T00:00:00Z",
					startDate: "2024-01-01",
					targetingType: "KEYWORD",
					bidStrategy: "target_roas",
					performance: {
						impressions: 100000,
						clicks: 5000,
						spend: 2000,
						detailPageViews: 1500,
						purchases: 300,
						sales: 12000,
						unitsOrdered: 250,
						clickThroughRate: 5.0,
						costPerClick: 0.4,
						returnOnAdSpend: 6.0,
						attributionRate: 6.0,
					},
					products: [],
				},
				{
					campaignId: "camp-002",
					campaignName: "Display Campaign",
					advertiserId: "adv-001",
					advertiserName: "Test Advertiser",
					campaignType: "DISPLAY",
					status: "ACTIVE",
					createdDate: "2024-01-01T00:00:00Z",
					lastModifiedDate: "2024-01-01T00:00:00Z",
					startDate: "2024-01-01",
					targetingType: "AUDIENCE",
					bidStrategy: "maximize_conversions",
					performance: {
						impressions: 200000,
						clicks: 2000,
						spend: 1000,
						detailPageViews: 800,
						purchases: 80,
						sales: 3200,
						unitsOrdered: 85,
						clickThroughRate: 1.0,
						costPerClick: 0.5,
						returnOnAdSpend: 3.2,
						attributionRate: 4.0,
					},
					products: [],
				},
				{
					campaignId: "camp-003",
					campaignName: "Video Campaign",
					advertiserId: "adv-001",
					advertiserName: "Test Advertiser",
					campaignType: "VIDEO",
					status: "ACTIVE",
					createdDate: "2024-01-01T00:00:00Z",
					lastModifiedDate: "2024-01-01T00:00:00Z",
					startDate: "2024-01-01",
					targetingType: "INTEREST",
					bidStrategy: "target_cpm",
					performance: {
						impressions: 500000,
						clicks: 1500,
						spend: 1500,
						detailPageViews: 600,
						purchases: 90,
						sales: 5400,
						unitsOrdered: 95,
						clickThroughRate: 0.3,
						costPerClick: 1.0,
						returnOnAdSpend: 3.6,
						attributionRate: 6.0,
					},
					products: [],
				},
			];

			const mockCrossChannelAnalysis: CrossChannelAnalysis = {
				analysisId: "analysis-001",
				advertiserId: "adv-001",
				reportingPeriod: {
					startDate: "2024-01-01",
					endDate: "2024-01-31",
				},
				channels: [],
				crossChannelMetrics: {
					totalReach: 750000,
					uniqueReach: 450000,
					frequencyDistribution: [
						{ frequency: 1, reach: 300000, percentage: 66.7 },
						{ frequency: 2, reach: 100000, percentage: 22.2 },
						{ frequency: 3, reach: 50000, percentage: 11.1 },
					],
					channelOverlap: [
						{
							channels: ["Search", "Display"],
							overlapReach: 75000,
							overlapPercentage: 16.7,
							incrementalReach: 375000,
						},
					],
					incrementalImpact: [],
				},
				customerJourney: {
					averageJourneyLength: 3.2,
					averageTimeLag: 72, // hours
					commonPaths: [
						{
							path: ["Search", "Display", "Purchase"],
							frequency: 150,
							conversionRate: 8.5,
							averageValue: 65,
						},
						{
							path: ["Video", "Search", "Purchase"],
							frequency: 120,
							conversionRate: 7.2,
							averageValue: 58,
						},
					],
					conversionFunnels: [],
					dropoffPoints: [],
				},
				recommendations: [],
			};

			(
				mockAttributionProvider.getAttributionCampaigns as MockedFunction<any>
			).mockResolvedValue(mockCampaigns);
			(
				mockAttributionProvider.getCrossChannelAnalysis as MockedFunction<any>
			).mockResolvedValue(mockCrossChannelAnalysis);

			const insights = await attributionManager.generateCrossChannelInsights(
				"adv-001",
				"2024-01-01",
				"2024-01-31",
			);

			expect(insights.totalCampaigns).toBe(3);
			expect(insights.totalSpend).toBe(4500); // 2000 + 1000 + 1500
			expect(insights.totalSales).toBe(20600); // 12000 + 3200 + 5400
			expect(insights.overallROAS).toBeCloseTo(4.58); // 20600 / 4500

			// Check channel breakdown
			expect(insights.channelBreakdown).toHaveLength(3);
			const searchChannel = insights.channelBreakdown.find(
				(ch) => ch.channel === "Search",
			);
			expect(searchChannel).toBeDefined();
			expect(searchChannel?.roas).toBe(6.0);
			expect(searchChannel?.contribution).toBeCloseTo(58.25); // (12000 / 20600) * 100

			// Check best performing channels
			expect(insights.bestPerformingChannels).toContain("Search");

			// Check customer journey insights
			expect(insights.customerJourneyInsights.averagePathLength).toBe(3.2);
			expect(insights.customerJourneyInsights.averageTimeLag).toBe(72);
			expect(insights.customerJourneyInsights.topConversionPaths).toHaveLength(
				2,
			);
			expect(insights.customerJourneyInsights.topConversionPaths[0]).toBe(
				"Search → Display → Purchase",
			);

			// Check recommendations
			expect(insights.recommendations).toHaveLength.greaterThan(0);
			const budgetShiftRec = insights.recommendations.find(
				(r) => r.type === "BUDGET_SHIFT",
			);
			expect(budgetShiftRec).toBeDefined();
			expect(budgetShiftRec?.description).toContain("Search");
		});

		it("should identify opportunity channels", async () => {
			const mockCampaigns: AttributionCampaign[] = [
				{
					campaignId: "camp-001",
					campaignName: "Search Campaign",
					advertiserId: "adv-001",
					advertiserName: "Test Advertiser",
					campaignType: "SEARCH",
					status: "ACTIVE",
					createdDate: "2024-01-01T00:00:00Z",
					lastModifiedDate: "2024-01-01T00:00:00Z",
					startDate: "2024-01-01",
					targetingType: "KEYWORD",
					bidStrategy: "target_roas",
					performance: {
						impressions: 10000,
						clicks: 500,
						spend: 200,
						detailPageViews: 150,
						purchases: 30,
						sales: 1500, // High ROAS but low spend/contribution
						unitsOrdered: 25,
						clickThroughRate: 5.0,
						costPerClick: 0.4,
						returnOnAdSpend: 7.5, // High ROAS
						attributionRate: 6.0,
					},
					products: [],
				},
			];

			const mockCrossChannelAnalysis: CrossChannelAnalysis = {
				analysisId: "analysis-002",
				advertiserId: "adv-001",
				reportingPeriod: {
					startDate: "2024-01-01",
					endDate: "2024-01-31",
				},
				channels: [],
				crossChannelMetrics: {
					totalReach: 10000,
					uniqueReach: 8000,
					frequencyDistribution: [],
					channelOverlap: [],
					incrementalImpact: [],
				},
				customerJourney: {
					averageJourneyLength: 1.5,
					averageTimeLag: 24,
					commonPaths: [],
					conversionFunnels: [],
					dropoffPoints: [],
				},
				recommendations: [],
			};

			(
				mockAttributionProvider.getAttributionCampaigns as MockedFunction<any>
			).mockResolvedValue(mockCampaigns);
			(
				mockAttributionProvider.getCrossChannelAnalysis as MockedFunction<any>
			).mockResolvedValue(mockCrossChannelAnalysis);

			const insights = await attributionManager.generateCrossChannelInsights(
				"adv-001",
				"2024-01-01",
				"2024-01-31",
			);

			// Search has high ROAS (7.5) but 100% contribution (only channel)
			// So it won't be identified as opportunity channel
			expect(insights.opportunityChannels).toHaveLength(0);

			// Check for channel expansion recommendation
			const channelExpansionRec = insights.recommendations.find(
				(r) => r.type === "CHANNEL_EXPANSION",
			);
			expect(channelExpansionRec).toBeDefined();
		});
	});

	describe("optimizeCampaignPerformance", () => {
		it("should provide comprehensive optimization analysis", async () => {
			const mockCampaigns: AttributionCampaign[] = [
				{
					campaignId: "camp-001",
					campaignName: "Test Campaign",
					advertiserId: "adv-001",
					advertiserName: "Test Advertiser",
					campaignType: "SEARCH",
					status: "ACTIVE",
					createdDate: "2024-01-01T00:00:00Z",
					lastModifiedDate: "2024-01-01T00:00:00Z",
					startDate: "2024-01-01",
					targetingType: "KEYWORD",
					bidStrategy: "target_roas",
					performance: {
						impressions: 100000,
						clicks: 2000,
						spend: 1000,
						detailPageViews: 800,
						purchases: 80,
						sales: 2400,
						unitsOrdered: 85,
						clickThroughRate: 2.0,
						costPerClick: 0.5,
						returnOnAdSpend: 2.4, // Below threshold
						attributionRate: 4.0,
					},
					products: [],
				},
			];

			const mockSuggestions: AttributionOptimizationSuggestion[] = [
				{
					suggestionId: "sug-001",
					campaignId: "camp-001",
					type: "TARGETING",
					priority: "HIGH",
					title: "Refine Keyword Targeting",
					description: "Remove broad match keywords with low conversion rates",
					currentPerformance: {
						metric: "conversion_rate",
						value: 4.0,
					},
					projectedImprovement: {
						metric: "ROAS",
						improvement: 25,
						confidence: 85,
					},
					implementation: {
						steps: [
							"Analyze keyword performance",
							"Pause low-performing keywords",
						],
						effort: "LOW",
						timeline: "2 days",
					},
					risks: [
						{
							risk: "Reduced traffic volume",
							probability: 0.3,
							impact: "Low reach decrease",
						},
					],
					createdAt: "2024-01-15T00:00:00Z",
					expiresAt: "2024-01-22T00:00:00Z",
				},
				{
					suggestionId: "sug-002",
					campaignId: "camp-001",
					type: "CREATIVE",
					priority: "MEDIUM",
					title: "Update Ad Creative",
					description:
						"Test new creative variations with stronger call-to-action",
					currentPerformance: {
						metric: "click_through_rate",
						value: 2.0,
					},
					projectedImprovement: {
						metric: "sales",
						improvement: 15,
						confidence: 70,
					},
					implementation: {
						steps: ["Design new creatives", "A/B test variations"],
						effort: "MEDIUM",
						timeline: "1 week",
					},
					risks: [
						{
							risk: "Creative fatigue",
							probability: 0.2,
							impact: "Temporary performance dip",
						},
					],
					createdAt: "2024-01-15T00:00:00Z",
					expiresAt: "2024-01-22T00:00:00Z",
				},
				{
					suggestionId: "sug-003",
					campaignId: "camp-001",
					type: "BUDGET",
					priority: "LOW",
					title: "Increase Daily Budget",
					description: "Campaign is budget-constrained during peak hours",
					currentPerformance: {
						metric: "impression_share",
						value: 65,
					},
					projectedImprovement: {
						metric: "efficiency",
						improvement: 10,
						confidence: 60,
					},
					implementation: {
						steps: ["Analyze hourly performance", "Increase budget gradually"],
						effort: "HIGH",
						timeline: "2 weeks",
					},
					risks: [
						{
							risk: "Increased costs without proportional returns",
							probability: 0.4,
							impact: "Budget overspend",
						},
					],
					createdAt: "2024-01-15T00:00:00Z",
					expiresAt: "2024-01-22T00:00:00Z",
				},
			];

			(
				mockAttributionProvider.getAttributionCampaigns as MockedFunction<any>
			).mockResolvedValue(mockCampaigns);
			(
				mockAttributionProvider.getOptimizationSuggestions as MockedFunction<any>
			).mockResolvedValue(mockSuggestions);

			const optimization =
				await attributionManager.optimizeCampaignPerformance("camp-001");

			expect(optimization.currentPerformance.campaignId).toBe("camp-001");
			expect(optimization.currentPerformance.returnOnAdSpend).toBe(2.4);
			expect(optimization.currentPerformance.efficiency.rank).toBe("POOR"); // Below thresholds

			expect(optimization.optimizationSuggestions).toHaveLength(3);

			// Check implementation plan categorization
			expect(optimization.implementationPlan.quickWins).toContain(
				"Refine Keyword Targeting",
			); // HIGH priority, LOW effort
			expect(optimization.implementationPlan.mediumTermActions).toContain(
				"Update Ad Creative",
			); // MEDIUM effort
			expect(optimization.implementationPlan.longTermStrategy).toContain(
				"Increase Daily Budget",
			); // HIGH effort

			// Check projected impact
			expect(optimization.projectedImpact.roasImprovement).toBe(25); // From targeting suggestion
			expect(optimization.projectedImpact.salesIncrease).toBe(15); // From creative suggestion
			expect(optimization.projectedImpact.efficiencyGain).toBe(10); // From budget suggestion
		});

		it("should handle campaign not found", async () => {
			(
				mockAttributionProvider.getAttributionCampaigns as MockedFunction<any>
			).mockResolvedValue([]);

			await expect(
				attributionManager.optimizeCampaignPerformance("nonexistent-campaign"),
			).rejects.toThrow("Campaign nonexistent-campaign not found");
		});
	});

	describe("createOptimizedCampaign", () => {
		it("should apply optimization logic to campaign creation", async () => {
			const request: CreateAttributionCampaignRequest = {
				campaignName: "Test Optimized Campaign",
				advertiserId: "adv-001",
				campaignType: "SEARCH",
				startDate: "2024-02-01",
				endDate: "2024-02-29",
				dailyBudget: 100,
				targetingType: "KEYWORD",
				bidStrategy: "manual_cpc",
				products: ["B001234567"],
			};

			const optimizationGoals = {
				primaryKPI: "ROAS" as const,
				budgetAllocation: "AGGRESSIVE" as const,
				targetAudience: "FOCUSED" as const,
			};

			const mockCreatedCampaign: AttributionCampaign = {
				campaignId: "camp-new-001",
				campaignName: request.campaignName,
				advertiserId: request.advertiserId,
				advertiserName: "Test Advertiser",
				campaignType: request.campaignType,
				status: "DRAFT",
				createdDate: "2024-02-01T00:00:00Z",
				lastModifiedDate: "2024-02-01T00:00:00Z",
				startDate: request.startDate,
				endDate: request.endDate,
				dailyBudget: 150, // Should be increased due to AGGRESSIVE allocation
				targetingType: request.targetingType,
				bidStrategy: "target_roas", // Should be changed due to ROAS primary KPI
				performance: {
					impressions: 0,
					clicks: 0,
					spend: 0,
					detailPageViews: 0,
					purchases: 0,
					sales: 0,
					unitsOrdered: 0,
					clickThroughRate: 0,
					costPerClick: 0,
					returnOnAdSpend: 0,
					attributionRate: 0,
				},
				products: [],
			};

			(
				mockAttributionProvider.createAttributionCampaign as MockedFunction<any>
			).mockResolvedValue(mockCreatedCampaign);

			const campaign = await attributionManager.createOptimizedCampaign(
				request,
				optimizationGoals,
			);

			expect(campaign.campaignId).toBe("camp-new-001");
			expect(campaign.dailyBudget).toBe(150); // Aggressive budget allocation
			expect(campaign.bidStrategy).toBe("target_roas"); // ROAS-optimized bidding

			// Verify the provider was called with optimized request
			expect(
				mockAttributionProvider.createAttributionCampaign,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					dailyBudget: 150, // 100 * 1.5 for aggressive
					bidStrategy: "target_roas", // Changed for ROAS optimization
				}),
			);
		});

		it("should apply conservative budget allocation", async () => {
			const request: CreateAttributionCampaignRequest = {
				campaignName: "Conservative Campaign",
				advertiserId: "adv-001",
				campaignType: "DISPLAY",
				startDate: "2024-02-01",
				dailyBudget: 100,
				targetingType: "AUDIENCE",
				bidStrategy: "manual_cpc",
				products: ["B001234567"],
			};

			const optimizationGoals = {
				primaryKPI: "EFFICIENCY" as const,
				budgetAllocation: "CONSERVATIVE" as const,
				targetAudience: "BROAD" as const,
			};

			const mockCreatedCampaign: AttributionCampaign = {
				campaignId: "camp-conservative-001",
				campaignName: request.campaignName,
				advertiserId: request.advertiserId,
				advertiserName: "Test Advertiser",
				campaignType: request.campaignType,
				status: "DRAFT",
				createdDate: "2024-02-01T00:00:00Z",
				lastModifiedDate: "2024-02-01T00:00:00Z",
				startDate: request.startDate,
				dailyBudget: 70, // Should be reduced due to CONSERVATIVE allocation
				targetingType: request.targetingType,
				bidStrategy: "target_cpa", // Should be changed due to EFFICIENCY primary KPI
				performance: {
					impressions: 0,
					clicks: 0,
					spend: 0,
					detailPageViews: 0,
					purchases: 0,
					sales: 0,
					unitsOrdered: 0,
					clickThroughRate: 0,
					costPerClick: 0,
					returnOnAdSpend: 0,
					attributionRate: 0,
				},
				products: [],
			};

			(
				mockAttributionProvider.createAttributionCampaign as MockedFunction<any>
			).mockResolvedValue(mockCreatedCampaign);

			const campaign = await attributionManager.createOptimizedCampaign(
				request,
				optimizationGoals,
			);

			expect(campaign.dailyBudget).toBe(70); // Conservative budget allocation
			expect(campaign.bidStrategy).toBe("target_cpa"); // Efficiency-optimized bidding

			// Verify the provider was called with optimized request
			expect(
				mockAttributionProvider.createAttributionCampaign,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					dailyBudget: 70, // 100 * 0.7 for conservative
					bidStrategy: "target_cpa", // Changed for efficiency optimization
				}),
			);
		});
	});
});
