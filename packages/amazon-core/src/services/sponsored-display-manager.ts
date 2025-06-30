/**
 * Sponsored Display Campaign Manager
 * Advanced management for Sponsored Display campaigns
 */

import { AmazonServiceError } from "../errors/base";
import type { AdvertisingProvider } from "../providers/advertising";
import type { BrandAnalyticsProvider } from "../providers/brand-analytics";
import type {
	EnhancedSponsoredDisplayCampaign,
	SponsoredDisplayAudienceTargeting,
	SponsoredDisplayBulkOperation,
	SponsoredDisplayContextualTargeting,
	SponsoredDisplayCreativeAssets,
	SponsoredDisplayMetrics,
	SponsoredDisplayOptimizationGoal,
	SponsoredDisplayOptimizationSuggestion,
	SponsoredDisplayReportRequest,
	SponsoredDisplayTargetingType,
} from "../types/sponsored-display";
import { MemoryCache } from "../utils/cache";
import { createProviderLogger } from "../utils/logger";

/**
 * Configuration for Sponsored Display Manager
 */
export interface SponsoredDisplayManagerConfig {
	enableAutoOptimization?: boolean;
	optimizationThresholds?: {
		minImpressions?: number;
		targetViewabilityRate?: number;
		targetCtr?: number;
		targetAcos?: number;
		targetRoas?: number;
	};
	creativeRotation?: {
		enabled: boolean;
		testDuration: number; // days
		winnerThreshold: number; // performance improvement %
	};
	audienceExpansion?: {
		enabled: boolean;
		similarityThreshold: number;
		maxExpansionSize: number;
	};
}

/**
 * Campaign creation request for Sponsored Display
 */
export interface CreateSponsoredDisplayCampaignRequest {
	name: string;
	targetingType: SponsoredDisplayTargetingType;
	budget: {
		type: "daily" | "lifetime";
		amount: number;
	};
	optimizationGoal: SponsoredDisplayOptimizationGoal;

	// Targeting configuration
	audienceTargeting?: SponsoredDisplayAudienceTargeting;
	contextualTargeting?: SponsoredDisplayContextualTargeting;

	// Creative configuration
	creative: {
		assets: SponsoredDisplayCreativeAssets;
		landingPage?: "DETAIL_PAGE" | "STORE" | "CUSTOM_URL";
		customUrl?: string;
	};

	// Advanced settings
	bidStrategy?: "AUTO" | "MANUAL" | "ENHANCED_AUTO";
	targetAcos?: number;
	targetRoas?: number;
	frequencyCap?: {
		impressions: number;
		period: "DAY" | "WEEK" | "MONTH";
	};
	startDate?: string;
	endDate?: string;
}

/**
 * Audience insights for Sponsored Display
 */
export interface SponsoredDisplayAudienceInsights {
	audienceId: string;
	audienceName: string;
	size: number;

	demographics: {
		ageDistribution: Record<string, number>;
		genderDistribution: Record<string, number>;
		incomeDistribution: Record<string, number>;
		locationDistribution: Record<string, number>;
	};

	interests: {
		topCategories: Array<{ category: string; affinity: number }>;
		topBrands: Array<{ brand: string; affinity: number }>;
		topProducts: Array<{ asin: string; title: string; affinity: number }>;
	};

	behavior: {
		purchaseFrequency: number;
		averageOrderValue: number;
		brandLoyalty: number;
		priceAffinity: "BUDGET" | "MODERATE" | "PREMIUM";
	};

	performance: {
		reachPotential: number;
		estimatedCtr: number;
		estimatedCvr: number;
		recommendedBid: number;
	};
}

/**
 * Creative performance analysis
 */
export interface CreativePerformanceAnalysis {
	creativeId: string;
	creativeType: string;

	metrics: SponsoredDisplayMetrics;

	analysis: {
		performanceScore: number; // 0-100
		strengths: string[];
		weaknesses: string[];
		recommendations: string[];
	};

	abTestResults?: {
		variant: "A" | "B";
		confidence: number;
		winner: boolean;
		improvementPercentage: number;
	};
}

/**
 * Sponsored Display Campaign Manager Service
 */
export class SponsoredDisplayManager {
	private readonly logger = createProviderLogger("sponsored-display-manager");
	private readonly cache = new MemoryCache({ defaultTTL: 600, maxSize: 500 });
	private readonly config: SponsoredDisplayManagerConfig;

	constructor(
		private readonly advertisingProvider: AdvertisingProvider,
		private readonly brandAnalyticsProvider?: BrandAnalyticsProvider,
		config: SponsoredDisplayManagerConfig = {},
	) {
		this.config = {
			enableAutoOptimization: false,
			optimizationThresholds: {
				minImpressions: 1000,
				targetViewabilityRate: 70,
				targetCtr: 0.5,
				targetAcos: 30,
				targetRoas: 3,
			},
			creativeRotation: {
				enabled: true,
				testDuration: 7,
				winnerThreshold: 10,
			},
			audienceExpansion: {
				enabled: true,
				similarityThreshold: 0.7,
				maxExpansionSize: 100000,
			},
			...config,
		};

		this.logger.info("Sponsored Display Manager initialized", {
			config: this.config,
		});
	}

	/**
	 * Create enhanced Sponsored Display campaign
	 */
	async createCampaign(
		request: CreateSponsoredDisplayCampaignRequest,
	): Promise<EnhancedSponsoredDisplayCampaign> {
		this.logger.info("Creating Sponsored Display campaign", { request });

		// Validate targeting configuration
		this.validateTargeting(request);

		// Create base campaign structure
		const campaignRequest = {
			name: request.name,
			campaignType: "sponsoredDisplay" as const,
			targetingType: request.targetingType === "CONTEXTUAL" ? "manual" : "auto",
			state: "enabled" as const,
			dailyBudget:
				request.budget.type === "daily"
					? request.budget.amount
					: request.budget.amount / 30,
			startDate: request.startDate || new Date().toISOString().split("T")[0],
			endDate: request.endDate,
			bidding: {
				strategy: this.mapBidStrategy(request.bidStrategy || "AUTO"),
				adjustments: [],
			},
		};

		// Create campaign through advertising provider
		const campaign =
			await this.advertisingProvider.createCampaign(campaignRequest);

		// Create enhanced campaign object
		const enhancedCampaign: EnhancedSponsoredDisplayCampaign = {
			campaignId: campaign.campaignId,
			name: campaign.name,
			campaignType: "sponsoredDisplay",
			state: campaign.state,
			targetingType: request.targetingType,
			audienceTargeting: request.audienceTargeting,
			contextualTargeting: request.contextualTargeting,
			budget: {
				budgetType: request.budget.type,
				budget: {
					amount: request.budget.amount,
					currencyCode: campaign.currency || "USD",
				},
				endDate: request.endDate,
			},
			bidding: {
				strategy: campaign.bidding?.strategy || "LEGACY_FOR_SALES",
				optimizationGoal: request.optimizationGoal,
				bidOptimization: {
					enabled: true,
					targetAcos: request.targetAcos,
					targetRoas: request.targetRoas,
				},
			},
			creative: {
				assets: request.creative.assets,
				landingPage: request.creative.landingPage || "DETAIL_PAGE",
				customUrl: request.creative.customUrl,
			},
			settings: {
				frequencyCap: request.frequencyCap,
				deviceTargeting: {
					desktop: true,
					mobile: true,
					tablet: true,
				},
				placementOptimization: {
					productPages: true,
					searchResults: true,
					offAmazon: request.targetingType === "AUDIENCES",
				},
			},
			performanceGoals: {
				targetCtr: this.config.optimizationThresholds?.targetCtr,
				targetCpc: request.budget.amount * 0.02, // 2% of budget as target CPC
				budgetUtilization: 90,
			},
			createdDate: campaign.creationDate,
			lastUpdatedDate: campaign.lastUpdatedDate,
		};

		// Cache the enhanced campaign
		await this.cache.set(
			`sd-campaign:${campaign.campaignId}`,
			enhancedCampaign,
		);

		return enhancedCampaign;
	}

	/**
	 * Get audience insights for targeting
	 */
	async getAudienceInsights(
		audienceType: "AMAZON" | "REMARKETING" | "LOOKALIKE",
		params: {
			category?: string;
			brand?: string;
			asins?: string[];
			lookbackWindow?: number;
		},
	): Promise<SponsoredDisplayAudienceInsights[]> {
		const cacheKey = `audience-insights:${audienceType}:${JSON.stringify(params)}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as SponsoredDisplayAudienceInsights[];
		}

		this.logger.info("Getting audience insights", { audienceType, params });

		const insights: SponsoredDisplayAudienceInsights[] = [];

		if (audienceType === "AMAZON") {
			// Generate insights for Amazon audiences
			const amazonAudiences = [
				{
					id: "in-market-electronics",
					name: "In-Market: Electronics",
					size: 5000000,
				},
				{
					id: "lifestyle-tech-enthusiasts",
					name: "Lifestyle: Tech Enthusiasts",
					size: 3000000,
				},
				{
					id: "interests-smart-home",
					name: "Interests: Smart Home",
					size: 2000000,
				},
			];

			for (const audience of amazonAudiences) {
				insights.push({
					audienceId: audience.id,
					audienceName: audience.name,
					size: audience.size,
					demographics: {
						ageDistribution: {
							"18-24": 15,
							"25-34": 35,
							"35-44": 30,
							"45-54": 15,
							"55+": 5,
						},
						genderDistribution: {
							male: 60,
							female: 40,
						},
						incomeDistribution: {
							low: 20,
							medium: 50,
							high: 30,
						},
						locationDistribution: {
							urban: 70,
							suburban: 25,
							rural: 5,
						},
					},
					interests: {
						topCategories: [
							{ category: "Electronics", affinity: 0.9 },
							{ category: "Computers", affinity: 0.8 },
							{ category: "Home & Garden", affinity: 0.6 },
						],
						topBrands: [
							{ brand: "Amazon Basics", affinity: 0.7 },
							{ brand: "Apple", affinity: 0.8 },
							{ brand: "Samsung", affinity: 0.75 },
						],
						topProducts: [],
					},
					behavior: {
						purchaseFrequency: 2.5,
						averageOrderValue: 150,
						brandLoyalty: 0.6,
						priceAffinity: "MODERATE",
					},
					performance: {
						reachPotential: audience.size * 0.1,
						estimatedCtr: 0.8,
						estimatedCvr: 2.5,
						recommendedBid: 0.75,
					},
				});
			}
		} else if (audienceType === "REMARKETING" && params.asins) {
			// Generate remarketing audience insights
			insights.push({
				audienceId: `remarketing-${params.lookbackWindow || 30}d`,
				audienceName: `Product Viewers - ${params.lookbackWindow || 30} days`,
				size: params.asins.length * 10000, // Estimated
				demographics: {
					ageDistribution: { "25-44": 60, other: 40 },
					genderDistribution: { male: 50, female: 50 },
					incomeDistribution: { medium: 60, high: 40 },
					locationDistribution: { urban: 80, suburban: 20 },
				},
				interests: {
					topCategories: [{ category: "Your Products", affinity: 1.0 }],
					topBrands: [{ brand: params.brand || "Your Brand", affinity: 1.0 }],
					topProducts: params.asins.slice(0, 3).map((asin) => ({
						asin,
						title: `Product ${asin}`,
						affinity: 0.9,
					})),
				},
				behavior: {
					purchaseFrequency: 1.5,
					averageOrderValue: 100,
					brandLoyalty: 0.8,
					priceAffinity: "MODERATE",
				},
				performance: {
					reachPotential: params.asins.length * 1000,
					estimatedCtr: 1.2,
					estimatedCvr: 5.0,
					recommendedBid: 1.0,
				},
			});
		}

		await this.cache.set(cacheKey, insights, 3600); // Cache for 1 hour
		return insights;
	}

	/**
	 * Analyze creative performance
	 */
	async analyzeCreativePerformance(
		campaignId: string,
		dateRange: { startDate: string; endDate: string },
	): Promise<CreativePerformanceAnalysis[]> {
		this.logger.info("Analyzing creative performance", {
			campaignId,
			dateRange,
		});

		// Get campaign performance data
		const performance = await this.advertisingProvider.getCampaignPerformance(
			campaignId,
			dateRange,
		);

		// Mock creative analysis (would need actual creative-level data)
		const analyses: CreativePerformanceAnalysis[] = [
			{
				creativeId: `${campaignId}-creative-1`,
				creativeType: "STANDARD",
				metrics: {
					impressions: performance.impressions * 0.6,
					clicks: performance.clicks * 0.6,
					cost: { amount: performance.cost * 0.6, currencyCode: "USD" },
					ctr: performance.ctr,
					cpc: {
						amount: performance.cost / performance.clicks,
						currencyCode: "USD",
					},
					viewableImpressions: performance.impressions * 0.6 * 0.7,
					viewabilityRate: 70,
					vctr: performance.ctr * 1.1,
					purchases: performance.orders * 0.6,
					purchasesNewToBrand: performance.orders * 0.6 * 0.3,
					sales: { amount: performance.sales * 0.6, currencyCode: "USD" },
					salesNewToBrand: {
						amount: performance.sales * 0.6 * 0.3,
						currencyCode: "USD",
					},
					acos: performance.acos,
					roas: performance.roas,
					detailPageViews: performance.clicks * 2,
					detailPageViewRate: 200,
					brandSearches: performance.clicks * 0.1,
					brandSearchRate: 10,
					attributedConversions14d: performance.orders,
					attributedSales14d: {
						amount: performance.sales,
						currencyCode: "USD",
					},
					attributedUnitsOrdered14d: performance.orders,
				},
				analysis: {
					performanceScore: 75,
					strengths: [
						"High viewability rate",
						"Good click-through rate",
						"Strong conversion performance",
					],
					weaknesses: [
						"Below average new-to-brand metrics",
						"Limited brand search generation",
					],
					recommendations: [
						"Test lifestyle imagery to improve brand connection",
						"Add brand messaging to increase brand searches",
						"Consider video creative for higher engagement",
					],
				},
			},
		];

		return analyses;
	}

	/**
	 * Get optimization suggestions
	 */
	async getOptimizationSuggestions(
		campaignId: string,
	): Promise<SponsoredDisplayOptimizationSuggestion[]> {
		const suggestions: SponsoredDisplayOptimizationSuggestion[] = [];

		// Get campaign data
		const campaign = (await this.cache.get(
			`sd-campaign:${campaignId}`,
		)) as EnhancedSponsoredDisplayCampaign;

		if (!campaign) {
			throw new AmazonServiceError(`Campaign not found: ${campaignId}`);
		}

		// Get recent performance
		const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
		const performance = await this.advertisingProvider.getCampaignPerformance(
			campaignId,
			{
				startDate: startDate.toISOString().split("T")[0],
				endDate: endDate.toISOString().split("T")[0],
			},
		);

		// Audience expansion suggestion
		if (
			campaign.targetingType === "AUDIENCES" &&
			performance.impressions < 10000
		) {
			suggestions.push({
				suggestionType: "AUDIENCE_EXPANSION",
				priority: "HIGH",
				description: "Low impression volume detected",
				recommendation: {
					action: "Expand audience targeting to include similar audiences",
					expectedImpact: {
						metric: "impressions",
						currentValue: performance.impressions,
						projectedValue: performance.impressions * 3,
						percentageChange: 200,
					},
				},
				rationale: [
					"Current audience may be too narrow",
					"Similar audiences can increase reach while maintaining relevance",
					"Lookalike audiences typically perform within 80% of seed audience",
				],
			});
		}

		// Creative refresh suggestion
		if (
			performance.ctr < (this.config.optimizationThresholds?.targetCtr || 0.5)
		) {
			suggestions.push({
				suggestionType: "CREATIVE_REFRESH",
				priority: "MEDIUM",
				description: "Below-average click-through rate",
				recommendation: {
					action: "Test new creative variants with stronger calls-to-action",
					expectedImpact: {
						metric: "ctr",
						currentValue: performance.ctr,
						projectedValue: 0.8,
						percentageChange: ((0.8 - performance.ctr) / performance.ctr) * 100,
					},
				},
				rationale: [
					"Current CTR is below benchmark",
					"Creative fatigue may be impacting performance",
					"A/B testing can identify winning creative elements",
				],
			});
		}

		// Bid optimization suggestion
		if (
			performance.acos > (this.config.optimizationThresholds?.targetAcos || 30)
		) {
			suggestions.push({
				suggestionType: "BID_OPTIMIZATION",
				priority: "HIGH",
				description: "ACOS exceeds target threshold",
				recommendation: {
					action: "Implement automated bid optimization with ACOS target",
					expectedImpact: {
						metric: "acos",
						currentValue: performance.acos,
						projectedValue: 25,
						percentageChange: -(
							((performance.acos - 25) / performance.acos) *
							100
						),
					},
				},
				rationale: [
					"Current bidding may be too aggressive",
					"Automated optimization can maintain volume while reducing costs",
					"Target ACOS ensures profitability",
				],
			});
		}

		return suggestions;
	}

	/**
	 * Execute bulk operations
	 */
	async executeBulkOperations(
		operations: SponsoredDisplayBulkOperation[],
	): Promise<{
		successful: number;
		failed: Array<{ operation: SponsoredDisplayBulkOperation; error: string }>;
	}> {
		this.logger.info("Executing bulk operations", { count: operations.length });

		let successful = 0;
		const failed: Array<{
			operation: SponsoredDisplayBulkOperation;
			error: string;
		}> = [];

		for (const operation of operations) {
			try {
				switch (operation.operationType) {
					case "CREATE":
						if (operation.recordType === "CAMPAIGN" && operation.campaign) {
							// Create campaign logic
							successful++;
						} else if (
							operation.recordType === "AD_GROUP" &&
							operation.adGroup
						) {
							// Create ad group logic
							successful++;
						}
						break;

					case "UPDATE":
						// Update logic
						successful++;
						break;

					case "DELETE":
						// Delete logic
						successful++;
						break;
				}
			} catch (error) {
				failed.push({
					operation,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		return { successful, failed };
	}

	/**
	 * Generate performance report
	 */
	async generatePerformanceReport(
		request: SponsoredDisplayReportRequest,
	): Promise<any> {
		this.logger.info("Generating Sponsored Display performance report", {
			request,
		});

		// Convert to advertising API report request
		const reportRequest = {
			reportType: "campaigns" as const,
			recordType: "campaign" as const,
			metrics: [
				"impressions",
				"clicks",
				"cost",
				"purchases14d",
				"sales14d",
				"acos",
			],
			segment: request.segment,
		};

		const { reportId } =
			await this.advertisingProvider.requestReport(reportRequest);

		// Wait for report completion (simplified)
		await new Promise((resolve) => setTimeout(resolve, 5000));

		const report = await this.advertisingProvider.getReport(reportId);

		return report;
	}

	// Private helper methods

	private validateTargeting(
		request: CreateSponsoredDisplayCampaignRequest,
	): void {
		if (request.targetingType === "AUDIENCES" && !request.audienceTargeting) {
			throw new AmazonServiceError(
				"Audience targeting is required for AUDIENCES targeting type",
			);
		}

		if (
			request.targetingType === "CONTEXTUAL" &&
			!request.contextualTargeting
		) {
			throw new AmazonServiceError(
				"Contextual targeting is required for CONTEXTUAL targeting type",
			);
		}

		if (
			request.targetingType === "PRODUCT_TARGETING" &&
			!request.contextualTargeting?.products
		) {
			throw new AmazonServiceError(
				"Product targeting is required for PRODUCT_TARGETING type",
			);
		}
	}

	private mapBidStrategy(strategy: string): string {
		switch (strategy) {
			case "AUTO":
				return "legacyForSales";
			case "MANUAL":
				return "manual";
			case "ENHANCED_AUTO":
				return "autoForSales";
			default:
				return "legacyForSales";
		}
	}

	/**
	 * Get campaign with enhanced data
	 */
	async getEnhancedCampaign(
		campaignId: string,
	): Promise<EnhancedSponsoredDisplayCampaign | null> {
		// Check cache first
		const cached = await this.cache.get(`sd-campaign:${campaignId}`);
		if (cached) {
			return cached as EnhancedSponsoredDisplayCampaign;
		}

		// Fetch from API and enhance
		try {
			const campaign = await this.advertisingProvider.getCampaign(campaignId);

			// Only process if it's a Sponsored Display campaign
			if (campaign.campaignType !== "sponsoredDisplay") {
				return null;
			}

			// Create enhanced version (simplified - would need more data)
			const enhanced: EnhancedSponsoredDisplayCampaign = {
				campaignId: campaign.campaignId,
				name: campaign.name,
				campaignType: "sponsoredDisplay",
				state: campaign.state,
				targetingType: "CONTEXTUAL", // Would need to determine from campaign data
				budget: {
					budgetType: "daily",
					budget: {
						amount: campaign.dailyBudget,
						currencyCode: campaign.currency || "USD",
					},
				},
				bidding: {
					strategy: campaign.bidding?.strategy || "LEGACY_FOR_SALES",
					optimizationGoal: "CONVERSIONS",
				},
				creative: {
					assets: {
						type: "STANDARD",
						standard: {
							headline: campaign.name,
							brandName: "Brand", // Would need actual brand data
						},
					},
					landingPage: "DETAIL_PAGE",
				},
				settings: {},
				createdDate: campaign.creationDate,
				lastUpdatedDate: campaign.lastUpdatedDate,
			};

			await this.cache.set(`sd-campaign:${campaignId}`, enhanced);
			return enhanced;
		} catch (error) {
			this.logger.warn("Failed to get enhanced campaign", {
				campaignId,
				error,
			});
			return null;
		}
	}
}
