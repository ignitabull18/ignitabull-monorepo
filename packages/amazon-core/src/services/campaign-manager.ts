/**
 * Unified Campaign Management System
 * Orchestrates campaigns across all Amazon advertising platforms
 * Following AI SDK service patterns
 */

import { AmazonServiceError } from "../errors/base";
import type { AdvertisingProvider } from "../providers/advertising";
import type { DSPProvider } from "../providers/dsp";
import type {
	AdvertisingCampaign,
	AdvertisingCampaignType,
	CampaignPerformance,
	CreateCampaignRequest,
	UpdateCampaignRequest,
} from "../types/advertising";
import type {
	CreateDSPCampaignRequest,
	DSPCampaign,
	DSPCampaignType,
	DSPPerformanceMetrics,
	UpdateDSPCampaignRequest,
} from "../types/dsp";
import { MemoryCache } from "../utils/cache";
import { createProviderLogger } from "../utils/logger";

/**
 * Unified campaign types across all platforms
 */
export type UnifiedCampaignType =
	| "SPONSORED_PRODUCTS"
	| "SPONSORED_BRANDS"
	| "SPONSORED_DISPLAY"
	| "DSP_DISPLAY"
	| "DSP_VIDEO"
	| "DSP_AUDIO"
	| "DSP_OTT";

export type UnifiedCampaignStatus =
	| "ACTIVE"
	| "PAUSED"
	| "ARCHIVED"
	| "PENDING"
	| "REJECTED";

export type UnifiedBidStrategy =
	| "AUTO"
	| "MANUAL"
	| "TARGET_CPA"
	| "TARGET_ROAS"
	| "DYNAMIC";

/**
 * Unified campaign interface
 */
export interface UnifiedCampaign {
	campaignId: string;
	platform: "ADVERTISING" | "DSP";
	type: UnifiedCampaignType;
	name: string;
	status: UnifiedCampaignStatus;
	budget: {
		type: "DAILY" | "LIFETIME";
		amount: number;
		currency: string;
	};
	bidStrategy: UnifiedBidStrategy;
	targeting: {
		type?: "MANUAL" | "AUTO";
		keywords?: string[];
		asins?: string[];
		audiences?: string[];
		demographics?: any;
		geographic?: any;
		contextual?: any;
	};
	schedule: {
		startDate: string;
		endDate?: string;
		timezone: string;
	};
	performance?: UnifiedCampaignPerformance;
	createdDate: string;
	lastModifiedDate: string;
	metadata: {
		originalCampaign: AdvertisingCampaign | DSPCampaign;
	};
}

/**
 * Unified campaign performance metrics
 */
export interface UnifiedCampaignPerformance {
	impressions: number;
	clicks: number;
	spend: number;
	sales: number;
	orders: number;
	ctr: number;
	cpc: number;
	cpm: number;
	acos: number;
	roas: number;
	conversionRate?: number;
	viewableImpressions?: number;
	videoCompletions?: number;
	brandAwarenessLift?: number;
}

/**
 * Campaign creation request
 */
export interface CreateUnifiedCampaignRequest {
	platform: "ADVERTISING" | "DSP";
	type: UnifiedCampaignType;
	name: string;
	budget: UnifiedCampaign["budget"];
	bidStrategy: UnifiedBidStrategy;
	targeting?: UnifiedCampaign["targeting"];
	schedule: UnifiedCampaign["schedule"];
	// Platform-specific options
	advertisingOptions?: {
		profileId?: string;
		portfolioId?: string;
		placementBidAdjustments?: Record<string, number>;
	};
	dspOptions?: {
		optimizationGoal?:
			| "REACH"
			| "IMPRESSIONS"
			| "CLICKS"
			| "CONVERSIONS"
			| "VIDEO_VIEWS";
		frequencyCap?: {
			impressions: number;
			period: "HOUR" | "DAY" | "WEEK" | "MONTH" | "LIFETIME";
		};
	};
}

/**
 * Campaign update request
 */
export interface UpdateUnifiedCampaignRequest {
	name?: string;
	status?: UnifiedCampaignStatus;
	budget?: Partial<UnifiedCampaign["budget"]>;
	bidStrategy?: UnifiedBidStrategy;
	targeting?: Partial<UnifiedCampaign["targeting"]>;
	schedule?: Partial<UnifiedCampaign["schedule"]>;
}

/**
 * Campaign search filters
 */
export interface CampaignSearchFilters {
	platforms?: ("ADVERTISING" | "DSP")[];
	types?: UnifiedCampaignType[];
	statuses?: UnifiedCampaignStatus[];
	budgetRange?: {
		min?: number;
		max?: number;
	};
	performanceFilters?: {
		minImpressions?: number;
		minClicks?: number;
		maxAcos?: number;
		minRoas?: number;
	};
	dateRange?: {
		startDate: string;
		endDate: string;
	};
	searchTerm?: string;
}

/**
 * Bulk operation request
 */
export interface BulkCampaignOperationRequest {
	campaignIds: string[];
	operation: "PAUSE" | "ACTIVATE" | "ARCHIVE" | "UPDATE_BUDGET" | "UPDATE_BID";
	params?: {
		budget?: number;
		bid?: number;
	};
}

/**
 * Campaign optimization suggestion
 */
export interface CampaignOptimizationSuggestion {
	campaignId: string;
	type: "BUDGET" | "BID" | "KEYWORD" | "TARGETING" | "CREATIVE";
	priority: "HIGH" | "MEDIUM" | "LOW";
	description: string;
	recommendation: string;
	estimatedImpact: {
		metric: string;
		currentValue: number;
		projectedValue: number;
		percentageChange: number;
	};
	implementationAction?: () => Promise<void>;
}

/**
 * Campaign management configuration
 */
export interface CampaignManagerConfig {
	enableAutoOptimization?: boolean;
	optimizationThresholds?: {
		minImpressions?: number;
		minDaysActive?: number;
		acosTarget?: number;
		roasTarget?: number;
	};
	cacheTTL?: number;
	syncInterval?: number;
}

/**
 * Unified Campaign Management Service
 */
export class CampaignManager {
	private readonly logger = createProviderLogger("campaign-manager");
	private readonly cache = new MemoryCache({
		enabled: true,
		ttl: 300,
		maxSize: 1000,
		keyPrefix: "amazon_campaign",
	});
	private readonly config: CampaignManagerConfig;

	constructor(
		private readonly advertisingProvider?: AdvertisingProvider,
		private readonly dspProvider?: DSPProvider,
		config: CampaignManagerConfig = {},
	) {
		this.config = {
			enableAutoOptimization: false,
			optimizationThresholds: {
				minImpressions: 1000,
				minDaysActive: 7,
				acosTarget: 30,
				roasTarget: 3,
			},
			cacheTTL: 300,
			syncInterval: 3600,
			...config,
		};

		if (!advertisingProvider && !dspProvider) {
			throw new AmazonServiceError(
				"At least one advertising provider must be configured",
			);
		}

		this.logger.info("Campaign Manager initialized", {
			hasAdvertising: !!advertisingProvider,
			hasDSP: !!dspProvider,
			config: this.config,
		});
	}

	/**
	 * Get all campaigns across platforms
	 */
	async getAllCampaigns(
		filters?: CampaignSearchFilters,
	): Promise<UnifiedCampaign[]> {
		const cacheKey = `all-campaigns:${JSON.stringify(filters || {})}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as UnifiedCampaign[];
		}

		const campaigns: UnifiedCampaign[] = [];

		// Fetch from Advertising API
		if (
			this.advertisingProvider &&
			(!filters?.platforms || filters.platforms.includes("ADVERTISING"))
		) {
			try {
				const advertisingCampaigns =
					await this.fetchAdvertisingCampaigns(filters);
				campaigns.push(...advertisingCampaigns);
			} catch (error) {
				this.logger.warn("Failed to fetch Advertising campaigns", { error });
			}
		}

		// Fetch from DSP
		if (
			this.dspProvider &&
			(!filters?.platforms || filters.platforms.includes("DSP"))
		) {
			try {
				const dspCampaigns = await this.fetchDSPCampaigns(filters);
				campaigns.push(...dspCampaigns);
			} catch (error) {
				this.logger.warn("Failed to fetch DSP campaigns", { error });
			}
		}

		// Apply additional filters
		const filteredCampaigns = this.applyFilters(campaigns, filters);

		// Cache results
		await this.cache.set(cacheKey, filteredCampaigns, this.config.cacheTTL);

		return filteredCampaigns;
	}

	/**
	 * Get single campaign by ID
	 */
	async getCampaign(
		campaignId: string,
		platform?: "ADVERTISING" | "DSP",
	): Promise<UnifiedCampaign | null> {
		const cacheKey = `campaign:${campaignId}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as UnifiedCampaign;
		}

		// Try Advertising API first if no platform specified
		if (this.advertisingProvider && (!platform || platform === "ADVERTISING")) {
			try {
				const campaign = await this.advertisingProvider.getCampaign(campaignId);
				const unified = this.convertAdvertisingToUnified(campaign);
				await this.cache.set(cacheKey, unified, this.config.cacheTTL);
				return unified;
			} catch (_error) {
				this.logger.debug("Campaign not found in Advertising API", {
					campaignId,
				});
			}
		}

		// Try DSP
		if (this.dspProvider && (!platform || platform === "DSP")) {
			try {
				const campaign = await this.dspProvider.getCampaign(campaignId);
				const unified = this.convertDSPToUnified(campaign);
				await this.cache.set(cacheKey, unified, this.config.cacheTTL);
				return unified;
			} catch (_error) {
				this.logger.debug("Campaign not found in DSP", { campaignId });
			}
		}

		return null;
	}

	/**
	 * Create new campaign
	 */
	async createCampaign(
		request: CreateUnifiedCampaignRequest,
	): Promise<UnifiedCampaign> {
		this.logger.info("Creating campaign", { request });

		if (request.platform === "ADVERTISING") {
			if (!this.advertisingProvider) {
				throw new AmazonServiceError("Advertising provider not configured");
			}

			const advertisingRequest = this.convertToAdvertisingRequest(request);
			const campaign =
				await this.advertisingProvider.createCampaign(advertisingRequest);
			return this.convertAdvertisingToUnified(campaign);
		}
		if (request.platform === "DSP") {
			if (!this.dspProvider) {
				throw new AmazonServiceError("DSP provider not configured");
			}

			const dspRequest = this.convertToDSPRequest(request);
			const campaign = await this.dspProvider.createCampaign(dspRequest);
			return this.convertDSPToUnified(campaign);
		}

		throw new AmazonServiceError(`Invalid platform: ${request.platform}`);
	}

	/**
	 * Update campaign
	 */
	async updateCampaign(
		campaignId: string,
		updates: UpdateUnifiedCampaignRequest,
		platform?: "ADVERTISING" | "DSP",
	): Promise<UnifiedCampaign> {
		// Determine platform if not specified
		if (!platform) {
			const campaign = await this.getCampaign(campaignId);
			if (!campaign) {
				throw new AmazonServiceError(`Campaign not found: ${campaignId}`);
			}
			platform = campaign.platform;
		}

		// Clear cache
		await this.cache.delete(`campaign:${campaignId}`);

		if (platform === "ADVERTISING") {
			if (!this.advertisingProvider) {
				throw new AmazonServiceError("Advertising provider not configured");
			}

			const advertisingUpdates = this.convertToAdvertisingUpdate(updates);
			const campaign = await this.advertisingProvider.updateCampaign(
				campaignId,
				advertisingUpdates,
			);
			return this.convertAdvertisingToUnified(campaign);
		}
		if (platform === "DSP") {
			if (!this.dspProvider) {
				throw new AmazonServiceError("DSP provider not configured");
			}

			const dspUpdates = this.convertToDSPUpdate(updates);
			const campaign = await this.dspProvider.updateCampaign(
				campaignId,
				dspUpdates,
			);
			return this.convertDSPToUnified(campaign);
		}

		throw new AmazonServiceError(`Invalid platform: ${platform}`);
	}

	/**
	 * Archive/delete campaign
	 */
	async archiveCampaign(
		campaignId: string,
		platform?: "ADVERTISING" | "DSP",
	): Promise<{ success: boolean }> {
		// Determine platform if not specified
		if (!platform) {
			const campaign = await this.getCampaign(campaignId);
			if (!campaign) {
				throw new AmazonServiceError(`Campaign not found: ${campaignId}`);
			}
			platform = campaign.platform;
		}

		// Clear cache
		await this.cache.delete(`campaign:${campaignId}`);

		if (platform === "ADVERTISING") {
			if (!this.advertisingProvider) {
				throw new AmazonServiceError("Advertising provider not configured");
			}
			return this.advertisingProvider.archiveCampaign(campaignId);
		}
		if (platform === "DSP") {
			if (!this.dspProvider) {
				throw new AmazonServiceError("DSP provider not configured");
			}
			return this.dspProvider.archiveCampaign(campaignId);
		}

		throw new AmazonServiceError(`Invalid platform: ${platform}`);
	}

	/**
	 * Get campaign performance
	 */
	async getCampaignPerformance(
		campaignId: string,
		dateRange: { startDate: string; endDate: string },
		platform?: "ADVERTISING" | "DSP",
	): Promise<UnifiedCampaignPerformance> {
		const cacheKey = `performance:${campaignId}:${dateRange.startDate}:${dateRange.endDate}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as UnifiedCampaignPerformance;
		}

		// Determine platform if not specified
		if (!platform) {
			const campaign = await this.getCampaign(campaignId);
			if (!campaign) {
				throw new AmazonServiceError(`Campaign not found: ${campaignId}`);
			}
			platform = campaign.platform;
		}

		let performance: UnifiedCampaignPerformance;

		if (platform === "ADVERTISING") {
			if (!this.advertisingProvider) {
				throw new AmazonServiceError("Advertising provider not configured");
			}

			const advertisingPerf =
				await this.advertisingProvider.getCampaignPerformance(campaignId, {
					startDate: new Date(dateRange.startDate),
					endDate: new Date(dateRange.endDate),
				});
			performance = this.convertAdvertisingPerformance(advertisingPerf);
		} else if (platform === "DSP") {
			if (!this.dspProvider) {
				throw new AmazonServiceError("DSP provider not configured");
			}

			const dspPerf = await this.dspProvider.getCampaignPerformance(
				campaignId,
				dateRange.startDate,
				dateRange.endDate,
			);
			performance = this.convertDSPPerformance(dspPerf);
		} else {
			throw new AmazonServiceError(`Invalid platform: ${platform}`);
		}

		await this.cache.set(cacheKey, performance, 300); // Cache for 5 minutes
		return performance;
	}

	/**
	 * Bulk operations on campaigns
	 */
	async bulkOperation(request: BulkCampaignOperationRequest): Promise<{
		successful: string[];
		failed: Array<{ campaignId: string; error: string }>;
	}> {
		const results = {
			successful: [] as string[],
			failed: [] as Array<{ campaignId: string; error: string }>,
		};

		for (const campaignId of request.campaignIds) {
			try {
				switch (request.operation) {
					case "PAUSE":
						await this.updateCampaign(campaignId, { status: "PAUSED" });
						break;
					case "ACTIVATE":
						await this.updateCampaign(campaignId, { status: "ACTIVE" });
						break;
					case "ARCHIVE":
						await this.archiveCampaign(campaignId);
						break;
					case "UPDATE_BUDGET":
						if (!request.params?.budget) {
							throw new Error("Budget parameter required");
						}
						await this.updateCampaign(campaignId, {
							budget: { amount: request.params.budget },
						});
						break;
					case "UPDATE_BID":
						// This would need platform-specific handling
						throw new Error("Bid updates not yet implemented");
				}
				results.successful.push(campaignId);
			} catch (error) {
				results.failed.push({
					campaignId,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		return results;
	}

	/**
	 * Get optimization suggestions for campaigns
	 */
	async getOptimizationSuggestions(
		campaignIds?: string[],
	): Promise<CampaignOptimizationSuggestion[]> {
		const suggestions: CampaignOptimizationSuggestion[] = [];

		// Get all campaigns if none specified
		const campaigns = campaignIds
			? await Promise.all(campaignIds.map((id) => this.getCampaign(id)))
			: await this.getAllCampaigns();

		for (const campaign of campaigns) {
			if (!campaign || !campaign.performance) continue;

			// Check ACOS optimization
			if (
				campaign.performance.acos >
				(this.config.optimizationThresholds?.acosTarget || 30)
			) {
				suggestions.push({
					campaignId: campaign.campaignId,
					type: "BID",
					priority: "HIGH",
					description: `High ACOS detected (${campaign.performance.acos.toFixed(1)}%)`,
					recommendation: "Consider lowering bids or improving targeting",
					estimatedImpact: {
						metric: "ACOS",
						currentValue: campaign.performance.acos,
						projectedValue:
							this.config.optimizationThresholds?.acosTarget || 30,
						percentageChange: -(
							((campaign.performance.acos -
								(this.config.optimizationThresholds?.acosTarget || 30)) /
								campaign.performance.acos) *
							100
						),
					},
				});
			}

			// Check ROAS optimization
			if (
				campaign.performance.roas <
				(this.config.optimizationThresholds?.roasTarget || 3)
			) {
				suggestions.push({
					campaignId: campaign.campaignId,
					type: "TARGETING",
					priority: "MEDIUM",
					description: `Low ROAS detected (${campaign.performance.roas.toFixed(2)})`,
					recommendation: "Review targeting and add negative keywords",
					estimatedImpact: {
						metric: "ROAS",
						currentValue: campaign.performance.roas,
						projectedValue: this.config.optimizationThresholds?.roasTarget || 3,
						percentageChange:
							(((this.config.optimizationThresholds?.roasTarget || 3) -
								campaign.performance.roas) /
								campaign.performance.roas) *
							100,
					},
				});
			}

			// Check budget utilization
			const budgetUtilization =
				campaign.performance.spend / campaign.budget.amount;
			if (budgetUtilization < 0.5) {
				suggestions.push({
					campaignId: campaign.campaignId,
					type: "BUDGET",
					priority: "LOW",
					description: `Low budget utilization (${(budgetUtilization * 100).toFixed(0)}%)`,
					recommendation: "Consider increasing bids or expanding targeting",
					estimatedImpact: {
						metric: "IMPRESSIONS",
						currentValue: campaign.performance.impressions,
						projectedValue: campaign.performance.impressions * 2,
						percentageChange: 100,
					},
				});
			}
		}

		return suggestions;
	}

	/**
	 * Get campaign insights and analytics
	 */
	async getCampaignInsights(campaignId: string): Promise<{
		campaign: UnifiedCampaign;
		performance: UnifiedCampaignPerformance;
		trends: {
			impressionsTrend: "UP" | "DOWN" | "STABLE";
			clicksTrend: "UP" | "DOWN" | "STABLE";
			acosTrend: "UP" | "DOWN" | "STABLE";
		};
		recommendations: string[];
		competitors?: Array<{
			campaignType: string;
			avgCPC: number;
			avgAcos: number;
		}>;
	}> {
		const campaign = await this.getCampaign(campaignId);
		if (!campaign) {
			throw new AmazonServiceError(`Campaign not found: ${campaignId}`);
		}

		// Get current performance
		const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
		const performance = await this.getCampaignPerformance(campaignId, {
			startDate: startDate.toISOString().split("T")[0],
			endDate: endDate.toISOString().split("T")[0],
		});

		// Calculate trends (simplified - would need historical data)
		const trends = {
			impressionsTrend: "STABLE" as const,
			clicksTrend: "STABLE" as const,
			acosTrend: performance.acos > 30 ? ("UP" as const) : ("STABLE" as const),
		};

		// Generate recommendations
		const recommendations: string[] = [];
		if (performance.ctr < 0.5) {
			recommendations.push(
				"Low CTR - Consider improving ad creative or targeting",
			);
		}
		if (performance.acos > 30) {
			recommendations.push(
				"High ACOS - Review keyword bids and add negative keywords",
			);
		}
		if (performance.conversionRate && performance.conversionRate < 5) {
			recommendations.push(
				"Low conversion rate - Optimize product listing and pricing",
			);
		}

		return {
			campaign,
			performance,
			trends,
			recommendations,
		};
	}

	// Private helper methods

	private async fetchAdvertisingCampaigns(
		filters?: CampaignSearchFilters,
	): Promise<UnifiedCampaign[]> {
		if (!this.advertisingProvider) return [];

		const response = await this.advertisingProvider.getCampaigns({
			stateFilter: filters?.statuses?.[0] as any,
			campaignType: this.mapToAdvertisingType(filters?.types?.[0]),
		});

		return response.campaigns.map((campaign) =>
			this.convertAdvertisingToUnified(campaign),
		);
	}

	private async fetchDSPCampaigns(
		filters?: CampaignSearchFilters,
	): Promise<UnifiedCampaign[]> {
		if (!this.dspProvider) return [];

		const response = await this.dspProvider.getCampaigns({
			statuses: filters?.statuses as any[],
			campaignTypes: this.mapToDSPTypes(filters?.types),
		});

		return response.campaigns.map((campaign) =>
			this.convertDSPToUnified(campaign),
		);
	}

	private applyFilters(
		campaigns: UnifiedCampaign[],
		filters?: CampaignSearchFilters,
	): UnifiedCampaign[] {
		if (!filters) return campaigns;

		return campaigns.filter((campaign) => {
			// Type filter
			if (filters.types && !filters.types.includes(campaign.type)) {
				return false;
			}

			// Status filter
			if (filters.statuses && !filters.statuses.includes(campaign.status)) {
				return false;
			}

			// Budget filter
			if (filters.budgetRange) {
				if (
					filters.budgetRange.min &&
					campaign.budget.amount < filters.budgetRange.min
				) {
					return false;
				}
				if (
					filters.budgetRange.max &&
					campaign.budget.amount > filters.budgetRange.max
				) {
					return false;
				}
			}

			// Performance filters
			if (filters.performanceFilters && campaign.performance) {
				const perf = filters.performanceFilters;
				if (
					perf.minImpressions &&
					campaign.performance.impressions < perf.minImpressions
				) {
					return false;
				}
				if (perf.minClicks && campaign.performance.clicks < perf.minClicks) {
					return false;
				}
				if (perf.maxAcos && campaign.performance.acos > perf.maxAcos) {
					return false;
				}
				if (perf.minRoas && campaign.performance.roas < perf.minRoas) {
					return false;
				}
			}

			// Search term filter
			if (filters.searchTerm) {
				const searchLower = filters.searchTerm.toLowerCase();
				if (!campaign.name.toLowerCase().includes(searchLower)) {
					return false;
				}
			}

			return true;
		});
	}

	private convertAdvertisingToUnified(
		campaign: AdvertisingCampaign,
	): UnifiedCampaign {
		return {
			campaignId: campaign.campaignId,
			platform: "ADVERTISING",
			type: this.mapAdvertisingTypeToUnified(campaign.campaignType),
			name: campaign.name,
			status: campaign.state.toUpperCase() as UnifiedCampaignStatus,
			budget: {
				type: "DAILY",
				amount: campaign.dailyBudget,
				currency: "USD", // Advertising API doesn't provide currency
			},
			bidStrategy: campaign.bidding?.strategy === "manual" ? "MANUAL" : "AUTO",
			targeting: {
				type: campaign.targetingType === "manual" ? "MANUAL" : "AUTO",
				keywords: [], // Would need to fetch separately
				asins: [], // Would need to fetch separately
			},
			schedule: {
				startDate: campaign.startDate
					? new Date(campaign.startDate).toISOString().split("T")[0]
					: "",
				endDate: campaign.endDate
					? new Date(campaign.endDate).toISOString().split("T")[0]
					: "",
				timezone: "UTC",
			},
			performance: undefined, // Performance is fetched separately
			createdDate: campaign.creationDate || "",
			lastModifiedDate: campaign.lastUpdatedDate || "",
			metadata: {
				originalCampaign: campaign,
			},
		};
	}

	private convertDSPToUnified(campaign: DSPCampaign): UnifiedCampaign {
		return {
			campaignId: campaign.campaignId,
			platform: "DSP",
			type: this.mapDSPTypeToUnified(campaign.type),
			name: campaign.name,
			status: campaign.status as UnifiedCampaignStatus,
			budget: campaign.budget,
			bidStrategy: campaign.bidStrategy as UnifiedBidStrategy,
			targeting: {
				audiences: campaign.targeting.audience?.includeAudiences,
				demographics: campaign.targeting.demographic,
				geographic: campaign.targeting.geographic,
				contextual: campaign.targeting.contextual,
			},
			schedule: campaign.schedule,
			createdDate: campaign.createdDate,
			lastModifiedDate: campaign.lastModifiedDate,
			metadata: {
				originalCampaign: campaign,
			},
		};
	}

	private convertAdvertisingPerformance(
		perf: CampaignPerformance,
	): UnifiedCampaignPerformance {
		return {
			impressions: perf.impressions,
			clicks: perf.clicks,
			spend: perf.cost,
			sales: perf.sales,
			orders: perf.orders,
			ctr: perf.ctr,
			cpc: perf.cost / perf.clicks,
			cpm: (perf.cost / perf.impressions) * 1000,
			acos: perf.acos,
			roas: perf.roas,
		};
	}

	private convertDSPPerformance(
		perf: DSPPerformanceMetrics,
	): UnifiedCampaignPerformance {
		return {
			impressions: perf.impressions,
			clicks: perf.clicks,
			spend: perf.spend,
			sales: 0, // DSP doesn't directly track sales
			orders: 0,
			ctr: perf.ctr,
			cpc: perf.cpc,
			cpm: perf.cpm,
			acos: 0, // Not applicable for DSP
			roas: perf.roas || 0,
			conversionRate: perf.conversionRate,
			viewableImpressions: perf.viewableImpressions,
			videoCompletions: perf.videoCompletions,
			brandAwarenessLift: perf.brandAwarenessLift,
		};
	}

	private convertToAdvertisingRequest(
		request: CreateUnifiedCampaignRequest,
	): CreateCampaignRequest {
		return {
			name: request.name,
			campaignType: this.mapUnifiedToAdvertisingType(request.type),
			targetingType: request.targeting?.type === "MANUAL" ? "manual" : "auto",
			state: "enabled",
			dailyBudget: request.budget.amount,
			startDate:
				request.schedule.startDate || new Date().toISOString().split("T")[0],
			endDate: request.schedule.endDate || undefined,
			bidding: {
				strategy:
					request.bidStrategy === "MANUAL"
						? "manual"
						: request.bidStrategy === "AUTO"
							? "autoForSales"
							: "legacyForSales",
				adjustments: request.advertisingOptions?.placementBidAdjustments
					? Object.entries(
							request.advertisingOptions.placementBidAdjustments,
						).map(([placement, percentage]) => ({
							predicate: placement,
							percentage,
						}))
					: undefined,
			},
			portfolioId: request.advertisingOptions?.portfolioId,
		};
	}

	private convertToDSPRequest(
		request: CreateUnifiedCampaignRequest,
	): CreateDSPCampaignRequest {
		return {
			name: request.name,
			type: this.mapUnifiedToDSPType(request.type),
			bidStrategy: request.bidStrategy as any,
			optimizationGoal: request.dspOptions?.optimizationGoal || "REACH",
			budget: request.budget,
			schedule: request.schedule,
			targeting: {
				audience: request.targeting?.audiences
					? {
							includeAudiences: request.targeting.audiences,
						}
					: undefined,
				demographic: request.targeting?.demographics,
				geographic: request.targeting?.geographic,
				contextual: request.targeting?.contextual,
			},
			frequencyCap: request.dspOptions?.frequencyCap,
		};
	}

	private convertToAdvertisingUpdate(
		updates: UpdateUnifiedCampaignRequest,
	): UpdateCampaignRequest {
		return {
			name: updates.name,
			state: updates.status?.toLowerCase() as any,
			dailyBudget: updates.budget?.amount,
			endDate: updates.schedule?.endDate || undefined,
			bidding: updates.bidStrategy
				? {
						strategy: updates.bidStrategy as any,
					}
				: undefined,
		};
	}

	private convertToDSPUpdate(
		updates: UpdateUnifiedCampaignRequest,
	): UpdateDSPCampaignRequest {
		return {
			name: updates.name,
			status: updates.status as any,
			budget: updates.budget,
			schedule: updates.schedule,
			targeting: updates.targeting as any,
		};
	}

	private mapAdvertisingTypeToUnified(
		type: AdvertisingCampaignType,
	): UnifiedCampaignType {
		switch (type) {
			case "sponsoredProducts":
				return "SPONSORED_PRODUCTS";
			case "sponsoredBrands":
				return "SPONSORED_BRANDS";
			case "sponsoredDisplay":
				return "SPONSORED_DISPLAY";
			default:
				return "SPONSORED_PRODUCTS";
		}
	}

	private mapDSPTypeToUnified(type: DSPCampaignType): UnifiedCampaignType {
		switch (type) {
			case "DISPLAY":
				return "DSP_DISPLAY";
			case "VIDEO":
				return "DSP_VIDEO";
			case "AUDIO":
				return "DSP_AUDIO";
			case "OTT":
				return "DSP_OTT";
			default:
				return "DSP_DISPLAY";
		}
	}

	private mapUnifiedToAdvertisingType(
		type: UnifiedCampaignType,
	): AdvertisingCampaignType {
		switch (type) {
			case "SPONSORED_PRODUCTS":
				return "sponsoredProducts";
			case "SPONSORED_BRANDS":
				return "sponsoredBrands";
			case "SPONSORED_DISPLAY":
				return "sponsoredDisplay";
			default:
				throw new Error(`Cannot map ${type} to Advertising campaign type`);
		}
	}

	private mapUnifiedToDSPType(type: UnifiedCampaignType): DSPCampaignType {
		switch (type) {
			case "DSP_DISPLAY":
				return "DISPLAY";
			case "DSP_VIDEO":
				return "VIDEO";
			case "DSP_AUDIO":
				return "AUDIO";
			case "DSP_OTT":
				return "OTT";
			default:
				throw new Error(`Cannot map ${type} to DSP campaign type`);
		}
	}

	private mapToAdvertisingType(
		type?: UnifiedCampaignType,
	): AdvertisingCampaignType | undefined {
		if (!type) return undefined;
		try {
			return this.mapUnifiedToAdvertisingType(type);
		} catch {
			return undefined;
		}
	}

	private mapToDSPTypes(types?: UnifiedCampaignType[]): DSPCampaignType[] {
		if (!types) return [];
		return types
			.map((type) => {
				try {
					return this.mapUnifiedToDSPType(type);
				} catch {
					return null;
				}
			})
			.filter((type): type is DSPCampaignType => type !== null);
	}
}
