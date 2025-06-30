/**
 * Unified Amazon service layer
 * Orchestrates all Amazon API providers following AI SDK service patterns
 */

import { AmazonServiceError } from "../errors/base";
import { AdvertisingProvider } from "../providers/advertising";
import { AssociatesProvider } from "../providers/associates";
import { BrandAnalyticsProvider } from "../providers/brand-analytics";
import { DSPProvider } from "../providers/dsp";

import { SPAPIProvider } from "../providers/sp-api";
import type { AdvertisingCampaign } from "../types/advertising";
import type {
	AssociatesProduct,
	AssociatesSearchResponse,
} from "../types/associates";
import type {
	BrandHealthScore,
	SearchTermInsight,
} from "../types/brand-analytics";
import type {
	AdvertisingConfig,
	AssociatesConfig,
	BaseAmazonConfig,
	BrandAnalyticsConfig,
	DSPConfig,
	SPAPIConfig,
} from "../types/config";
import type { SPAPICatalogItem } from "../types/sp-api";
import { MemoryCache } from "../utils/cache";
import { ConfigManager, ConfigUtils } from "../utils/config";
import { createProviderLogger } from "../utils/logger";
import { BrandIntelligenceService } from "./brand-intelligence";
import { CampaignManager } from "./campaign-manager";

/**
 * Amazon service configuration
 */
export interface AmazonServiceConfig {
	spApi?: SPAPIConfig;
	advertising?: AdvertisingConfig;
	associates?: AssociatesConfig;
	brandAnalytics?: BrandAnalyticsConfig;
	dsp?: DSPConfig;
	enabledProviders?: (
		| "sp-api"
		| "advertising"
		| "associates"
		| "brand-analytics"
		| "dsp"
	)[];
	globalConfig?: Partial<BaseAmazonConfig>;
	campaignManager?: {
		enableAutoOptimization?: boolean;
		optimizationThresholds?: {
			minImpressions?: number;
			minDaysActive?: number;
			acosTarget?: number;
			roasTarget?: number;
		};
	};
}

/**
 * Provider health status
 */
export interface ProviderHealth {
	providerId: string;
	status: "healthy" | "unhealthy" | "disabled";
	message?: string;
	lastChecked: Date;
	responseTime?: number;
}

/**
 * Service health summary
 */
export interface ServiceHealth {
	status: "healthy" | "degraded" | "unhealthy";
	providers: ProviderHealth[];
	lastChecked: Date;
}

/**
 * Cross-provider data correlation interfaces
 */
export interface ProductInsights {
	asin: string;
	// SP-API data
	spApiData?: {
		catalogInfo?: SPAPICatalogItem;
		inventoryStatus?: "inStock" | "outOfStock" | "limited";
		pricing?: {
			amount: number;
			currency: string;
		};
	};
	// Advertising data
	advertisingData?: {
		campaigns?: AdvertisingCampaign[];
		isAdvertised: boolean;
		performance?: {
			impressions: number;
			clicks: number;
			sales: number;
			acos: number;
		};
	};
	// Associates data
	associatesData?: {
		productInfo?: AssociatesProduct;
		affiliateLink?: string;
		rating?: number;
		reviewCount?: number;
	};
	// Brand Analytics data
	brandAnalyticsData?: {
		brandHealthScore?: BrandHealthScore;
		searchTermInsights?: SearchTermInsight[];
		competitivePosition?: {
			rank: number;
			marketShare: number;
			threats: string[];
			opportunities: string[];
		};
	};
	lastUpdated: Date;
}

export interface MarketplaceInsights {
	marketplaceId: string;
	// SP-API insights
	orderMetrics?: {
		totalOrders: number;
		revenue: number;
		averageOrderValue: number;
		topSellingProducts: string[];
	};
	// Advertising insights
	advertisingMetrics?: {
		totalSpend: number;
		totalSales: number;
		roas: number;
		topPerformingCampaigns: string[];
	};
	// Associates insights
	affiliateMetrics?: {
		clickThroughRate: number;
		conversionRate: number;
		topProducts: string[];
	};
	// Brand Analytics insights
	brandInsights?: {
		overallBrandHealth: number;
		topSearchTerms: string[];
		marketPosition: number;
		competitiveThreat: "HIGH" | "MEDIUM" | "LOW";
		growthOpportunities: string[];
	};
	lastUpdated: Date;
}

/**
 * Unified Amazon service
 */
export class AmazonService {
	private readonly logger = createProviderLogger("amazon-service");
	private readonly cache = new MemoryCache({ defaultTTL: 300, maxSize: 2000 });
	private readonly configManager = ConfigManager.getInstance();

	private spApiProvider?: SPAPIProvider;
	private advertisingProvider?: AdvertisingProvider;
	private associatesProvider?: AssociatesProvider;
	private brandAnalyticsProvider?: BrandAnalyticsProvider;
	private dspProvider?: DSPProvider;
	private brandIntelligenceService?: BrandIntelligenceService;
	private campaignManager?: CampaignManager;

	private initialized = false;
	private enabledProviders: Set<string> = new Set();

	constructor(private readonly config: AmazonServiceConfig) {
		this.logger.info("Amazon service initializing", {
			enabledProviders: config.enabledProviders || [
				"sp-api",
				"advertising",
				"associates",
				"brand-analytics",
			],
		});
	}

	/**
	 * Initialize all configured providers
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
			const providers = this.config.enabledProviders || [
				"sp-api",
				"advertising",
				"associates",
				"brand-analytics",
			];

			// Initialize SP-API provider
			if (providers.includes("sp-api") && this.config.spApi) {
				const spApiConfig = ConfigUtils.merge(
					this.config.spApi,
					this.config.globalConfig || {},
				);
				this.spApiProvider = new SPAPIProvider(spApiConfig);
				await this.spApiProvider.initialize();
				this.enabledProviders.add("sp-api");
				this.logger.info("SP-API provider initialized");
			}

			// Initialize Advertising provider
			if (providers.includes("advertising") && this.config.advertising) {
				const advertisingConfig = ConfigUtils.merge(
					this.config.advertising,
					this.config.globalConfig || {},
				);
				this.advertisingProvider = new AdvertisingProvider(advertisingConfig);
				await this.advertisingProvider.initialize();
				this.enabledProviders.add("advertising");
				this.logger.info("Advertising provider initialized");
			}

			// Initialize Associates provider
			if (providers.includes("associates") && this.config.associates) {
				const associatesConfig = ConfigUtils.merge(
					this.config.associates,
					this.config.globalConfig || {},
				);
				this.associatesProvider = new AssociatesProvider(associatesConfig);
				await this.associatesProvider.initialize();
				this.enabledProviders.add("associates");
				this.logger.info("Associates provider initialized");
			}

			// Initialize Brand Analytics provider
			if (providers.includes("brand-analytics") && this.config.brandAnalytics) {
				const brandAnalyticsConfig = ConfigUtils.merge(
					this.config.brandAnalytics,
					this.config.globalConfig || {},
				);
				this.brandAnalyticsProvider = new BrandAnalyticsProvider(
					brandAnalyticsConfig,
				);
				await this.brandAnalyticsProvider.initialize();
				this.enabledProviders.add("brand-analytics");
				this.logger.info("Brand Analytics provider initialized");

				// Initialize Brand Intelligence service
				this.brandIntelligenceService = new BrandIntelligenceService(
					this.brandAnalyticsProvider,
					{
						cacheInsights: true,
						insightsTTL: 1800,
						enablePredictiveAnalytics: true,
					},
				);
				this.logger.info("Brand Intelligence service initialized");
			}

			// Initialize DSP provider
			if (providers.includes("dsp") && this.config.dsp) {
				const dspConfig = ConfigUtils.merge(
					this.config.dsp,
					this.config.globalConfig || {},
				);
				this.dspProvider = new DSPProvider(dspConfig);
				await this.dspProvider.initialize();
				this.enabledProviders.add("dsp");
				this.logger.info("DSP provider initialized");
			}

			// Initialize Campaign Manager if we have advertising providers
			if (this.advertisingProvider || this.dspProvider) {
				this.campaignManager = new CampaignManager(
					this.advertisingProvider,
					this.dspProvider,
					this.config.campaignManager,
				);
				this.logger.info("Campaign Manager initialized");
			}

			if (this.enabledProviders.size === 0) {
				throw new AmazonServiceError("No providers configured or enabled");
			}

			this.initialized = true;
			this.logger.info("Amazon service initialized successfully", {
				enabledProviders: Array.from(this.enabledProviders),
			});
		} catch (error) {
			this.logger.error("Failed to initialize Amazon service", error as Error);
			throw error;
		}
	}

	/**
	 * Get service health status
	 */
	async getHealthStatus(): Promise<ServiceHealth> {
		const providers: ProviderHealth[] = [];
		let healthyCount = 0;

		// Check SP-API health
		if (this.spApiProvider) {
			const startTime = Date.now();
			const health = await this.spApiProvider.healthCheck();
			const responseTime = Date.now() - startTime;

			providers.push({
				providerId: "sp-api",
				status: health.status,
				message: health.message,
				lastChecked: new Date(),
				responseTime,
			});

			if (health.status === "healthy") healthyCount++;
		}

		// Check Advertising API health
		if (this.advertisingProvider) {
			const startTime = Date.now();
			const health = await this.advertisingProvider.healthCheck();
			const responseTime = Date.now() - startTime;

			providers.push({
				providerId: "advertising",
				status: health.status,
				message: health.message,
				lastChecked: new Date(),
				responseTime,
			});

			if (health.status === "healthy") healthyCount++;
		}

		// Check Associates API health
		if (this.associatesProvider) {
			const startTime = Date.now();
			const health = await this.associatesProvider.healthCheck();
			const responseTime = Date.now() - startTime;

			providers.push({
				providerId: "associates",
				status: health.status,
				message: health.message,
				lastChecked: new Date(),
				responseTime,
			});

			if (health.status === "healthy") healthyCount++;
		}

		// Check Brand Analytics API health
		if (this.brandAnalyticsProvider) {
			const startTime = Date.now();
			const health = await this.brandAnalyticsProvider.healthCheck();
			const responseTime = Date.now() - startTime;

			providers.push({
				providerId: "brand-analytics",
				status: health.status,
				message: health.message,
				lastChecked: new Date(),
				responseTime,
			});

			if (health.status === "healthy") healthyCount++;
		}

		// Check DSP API health
		if (this.dspProvider) {
			const startTime = Date.now();
			const health = await this.dspProvider.healthCheck();
			const responseTime = Date.now() - startTime;

			providers.push({
				providerId: "dsp",
				status: health.status,
				message: health.message,
				lastChecked: new Date(),
				responseTime,
			});

			if (health.status === "healthy") healthyCount++;
		}

		// Determine overall status
		let overallStatus: "healthy" | "degraded" | "unhealthy";
		if (healthyCount === providers.length) {
			overallStatus = "healthy";
		} else if (healthyCount > 0) {
			overallStatus = "degraded";
		} else {
			overallStatus = "unhealthy";
		}

		return {
			status: overallStatus,
			providers,
			lastChecked: new Date(),
		};
	}

	/**
	 * Get comprehensive product insights by ASIN
	 */
	async getProductInsights(asin: string): Promise<ProductInsights> {
		await this.ensureInitialized();

		const cacheKey = `product-insights:${asin}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as ProductInsights;
		}

		const insights: ProductInsights = {
			asin,
			lastUpdated: new Date(),
		};

		// Collect data from all available providers in parallel
		const promises: Promise<void>[] = [];

		// SP-API data
		if (this.spApiProvider) {
			promises.push(
				this.collectSPAPIData(asin, insights).catch((error) => {
					this.logger.warn(
						"Failed to collect SP-API data for product insights",
						{ asin, error },
					);
				}),
			);
		}

		// Advertising data
		if (this.advertisingProvider) {
			promises.push(
				this.collectAdvertisingData(asin, insights).catch((error) => {
					this.logger.warn(
						"Failed to collect Advertising data for product insights",
						{ asin, error },
					);
				}),
			);
		}

		// Associates data
		if (this.associatesProvider) {
			promises.push(
				this.collectAssociatesData(asin, insights).catch((error) => {
					this.logger.warn(
						"Failed to collect Associates data for product insights",
						{ asin, error },
					);
				}),
			);
		}

		// Brand Analytics data
		if (this.brandAnalyticsProvider) {
			promises.push(
				this.collectBrandAnalyticsData(asin, insights).catch((error) => {
					this.logger.warn(
						"Failed to collect Brand Analytics data for product insights",
						{ asin, error },
					);
				}),
			);
		}

		await Promise.all(promises);

		// Cache the insights for 10 minutes
		await this.cache.set(cacheKey, insights, 600);

		return insights;
	}

	/**
	 * Get marketplace insights
	 */
	async getMarketplaceInsights(
		marketplaceId: string,
	): Promise<MarketplaceInsights> {
		await this.ensureInitialized();

		const cacheKey = `marketplace-insights:${marketplaceId}`;
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return cached as MarketplaceInsights;
		}

		const insights: MarketplaceInsights = {
			marketplaceId,
			lastUpdated: new Date(),
		};

		// Collect data from all available providers
		const promises: Promise<void>[] = [];

		// SP-API marketplace data
		if (this.spApiProvider) {
			promises.push(
				this.collectMarketplaceSPAPIData(marketplaceId, insights).catch(
					(error) => {
						this.logger.warn("Failed to collect SP-API marketplace data", {
							marketplaceId,
							error,
						});
					},
				),
			);
		}

		// Advertising marketplace data
		if (this.advertisingProvider) {
			promises.push(
				this.collectMarketplaceAdvertisingData(marketplaceId, insights).catch(
					(error) => {
						this.logger.warn("Failed to collect Advertising marketplace data", {
							marketplaceId,
							error,
						});
					},
				),
			);
		}

		await Promise.all(promises);

		// Cache insights for 30 minutes
		await this.cache.set(cacheKey, insights, 1800);

		return insights;
	}

	/**
	 * Search products across all providers
	 */
	async searchProducts(query: {
		keywords?: string;
		asin?: string;
		category?: string;
		includeInventory?: boolean;
		includeAdvertising?: boolean;
		includeAssociates?: boolean;
		includeBrandAnalytics?: boolean;
	}): Promise<{
		results: Array<{
			asin: string;
			title?: string;
			spApiData?: any;
			advertisingData?: any;
			associatesData?: any;
			brandAnalyticsData?: any;
		}>;
		totalCount: number;
		sources: string[];
	}> {
		await this.ensureInitialized();

		const results = new Map<string, any>();
		const sources: string[] = [];

		// Search via Associates API (primary for product discovery)
		if (this.associatesProvider && query.includeAssociates !== false) {
			try {
				let searchResponse: AssociatesSearchResponse;

				if (query.keywords) {
					searchResponse = await this.associatesProvider.searchItems({
						Keywords: query.keywords,
						ItemCount: 10,
					});
				} else if (query.category) {
					searchResponse = await this.associatesProvider.searchItems({
						BrowseNodeId: query.category,
						ItemCount: 10,
					});
				} else {
					throw new Error(
						"Keywords or category required for Associates search",
					);
				}

				if (searchResponse.SearchResult?.Items) {
					for (const item of searchResponse.SearchResult.Items) {
						if (item.ASIN) {
							results.set(item.ASIN, {
								asin: item.ASIN,
								title: item.ItemInfo?.Title?.DisplayValue,
								associatesData: item,
							});
						}
					}
					sources.push("associates");
				}
			} catch (error) {
				this.logger.warn("Associates search failed", { query, error });
			}
		}

		// Enhance with SP-API data
		if (this.spApiProvider && query.includeInventory) {
			try {
				for (const [asin, result] of results) {
					try {
						const catalogItem = await this.spApiProvider.getCatalogItem(
							asin,
							[query.category || "ATVPDKIKX0DER"], // Default to US marketplace
						);
						result.spApiData = catalogItem;
					} catch (error) {
						this.logger.debug("Failed to get SP-API data for ASIN", {
							asin,
							error,
						});
					}
				}
				sources.push("sp-api");
			} catch (error) {
				this.logger.warn("SP-API enhancement failed", { error });
			}
		}

		// Enhance with Advertising data
		if (this.advertisingProvider && query.includeAdvertising) {
			try {
				// Note: This would require a way to search campaigns by ASIN
				// For now, we'll skip this as it requires more complex logic
				sources.push("advertising");
			} catch (error) {
				this.logger.warn("Advertising enhancement failed", { error });
			}
		}

		return {
			results: Array.from(results.values()),
			totalCount: results.size,
			sources,
		};
	}

	/**
	 * Get provider-specific client for direct access
	 */
	getProvider<
		T extends "sp-api" | "advertising" | "associates" | "brand-analytics",
	>(
		providerId: T,
	): T extends "sp-api"
		? SPAPIProvider | undefined
		: T extends "advertising"
			? AdvertisingProvider | undefined
			: T extends "associates"
				? AssociatesProvider | undefined
				: BrandAnalyticsProvider | undefined {
		switch (providerId) {
			case "sp-api":
				return this.spApiProvider as any;
			case "advertising":
				return this.advertisingProvider as any;
			case "associates":
				return this.associatesProvider as any;
			case "brand-analytics":
				return this.brandAnalyticsProvider as any;
			default:
				return undefined;
		}
	}

	/**
	 * Get enabled providers list
	 */
	getEnabledProviders(): string[] {
		return Array.from(this.enabledProviders);
	}

	/**
	 * Check if a specific provider is enabled
	 */
	isProviderEnabled(providerId: string): boolean {
		return this.enabledProviders.has(providerId);
	}

	// Private helper methods

	private async ensureInitialized(): Promise<void> {
		if (!this.initialized) {
			await this.initialize();
		}
	}

	private async collectSPAPIData(
		asin: string,
		insights: ProductInsights,
	): Promise<void> {
		if (!this.spApiProvider) return;

		try {
			// Get catalog information
			const catalogItem = await this.spApiProvider.getCatalogItem(
				asin,
				["ATVPDKIKX0DER"], // US marketplace
				{ includedData: ["summaries", "identifiers", "images"] },
			);

			insights.spApiData = {
				catalogInfo: catalogItem,
				inventoryStatus: "inStock", // This would need actual inventory check
			};
		} catch (error) {
			this.logger.debug("Failed to collect SP-API data", { asin, error });
		}
	}

	private async collectAdvertisingData(
		asin: string,
		insights: ProductInsights,
	): Promise<void> {
		if (!this.advertisingProvider) return;

		try {
			// Note: This would require searching for product ads by ASIN
			// The Advertising API doesn't have a direct ASIN lookup for performance data
			// This would need to be implemented based on campaign/ad group structure

			insights.advertisingData = {
				campaigns: [],
				isAdvertised: false,
				performance: {
					impressions: 0,
					clicks: 0,
					sales: 0,
					acos: 0,
				},
			};
		} catch (error) {
			this.logger.debug("Failed to collect Advertising data", { asin, error });
		}
	}

	private async collectAssociatesData(
		asin: string,
		insights: ProductInsights,
	): Promise<void> {
		if (!this.associatesProvider) return;

		try {
			const product = await this.associatesProvider.getItem(asin, [
				"ItemInfo.Title",
				"ItemInfo.Features",
				"Images.Primary",
				"Offers.Listings",
				"CustomerReviews.Count",
				"CustomerReviews.StarRating",
			]);

			const affiliateLink = this.associatesProvider.generateAffiliateLink(asin);

			insights.associatesData = {
				productInfo: product,
				affiliateLink,
				rating: product.CustomerReviews?.StarRating?.Value,
				reviewCount: product.CustomerReviews?.Count,
			};
		} catch (error) {
			this.logger.debug("Failed to collect Associates data", { asin, error });
		}
	}

	private async collectMarketplaceSPAPIData(
		marketplaceId: string,
		insights: MarketplaceInsights,
	): Promise<void> {
		if (!this.spApiProvider) return;

		try {
			// Get recent orders for metrics
			const endDate = new Date();
			const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

			const ordersResponse = await this.spApiProvider.getOrders({
				marketplaceIds: [marketplaceId],
				createdAfter: startDate,
				createdBefore: endDate,
				maxResultsPerPage: 50,
			});

			const orders = ordersResponse.payload.Orders || [];
			const totalOrders = orders.length;
			const revenue = orders.reduce((sum, order) => {
				return sum + (Number.parseFloat(order.OrderTotal?.Amount || "0") || 0);
			}, 0);

			insights.orderMetrics = {
				totalOrders,
				revenue,
				averageOrderValue: totalOrders > 0 ? revenue / totalOrders : 0,
				topSellingProducts: [], // Would need order items data
			};
		} catch (error) {
			this.logger.debug("Failed to collect marketplace SP-API data", {
				marketplaceId,
				error,
			});
		}
	}

	private async collectMarketplaceAdvertisingData(
		marketplaceId: string,
		insights: MarketplaceInsights,
	): Promise<void> {
		if (!this.advertisingProvider) return;

		try {
			// Get campaigns for advertising metrics
			const campaignsResponse = await this.advertisingProvider.getCampaigns({
				stateFilter: "enabled",
				count: 50,
			});

			// Note: This would need performance data aggregation
			// For now, we'll set placeholder values
			insights.advertisingMetrics = {
				totalSpend: 0,
				totalSales: 0,
				roas: 0,
				topPerformingCampaigns: campaignsResponse.campaigns.map(
					(c) => c.campaignId,
				),
			};
		} catch (error) {
			this.logger.debug("Failed to collect marketplace Advertising data", {
				marketplaceId,
				error,
			});
		}
	}

	private async collectBrandAnalyticsData(
		asin: string,
		insights: ProductInsights,
	): Promise<void> {
		if (!this.brandAnalyticsProvider) return;

		try {
			// Get competitive intelligence for the ASIN
			const competitiveIntel =
				await this.brandAnalyticsProvider.getCompetitiveIntelligence(
					asin,
					"ATVPDKIKX0DER", // Default to US marketplace
				);

			insights.brandAnalyticsData = {
				competitivePosition: {
					rank: competitiveIntel.marketPosition?.rank || 0,
					marketShare: competitiveIntel.marketPosition?.marketShare || 0,
					threats: competitiveIntel.threats?.map((t) => t.description) || [],
					opportunities:
						competitiveIntel.opportunities?.map((o) => o.description) || [],
				},
			};
		} catch (error) {
			this.logger.debug("Failed to collect Brand Analytics data", {
				asin,
				error,
			});
		}
	}

	/**
	 * Get Brand Intelligence Service for advanced analytics
	 */
	getBrandIntelligenceService(): BrandIntelligenceService | undefined {
		return this.brandIntelligenceService;
	}

	/**
	 * Generate comprehensive brand intelligence report
	 */
	async generateBrandIntelligenceReport(
		brandName: string,
		marketplaceId: string,
	) {
		if (!this.brandIntelligenceService) {
			throw new AmazonServiceError(
				"Brand Intelligence service not available. Enable brand-analytics provider.",
			);
		}

		return this.brandIntelligenceService.generateBrandIntelligenceReport(
			brandName,
			marketplaceId,
		);
	}

	/**
	 * Get brand health score for a specific brand
	 */
	async getBrandHealthScore(
		brandName: string,
		marketplaceId: string,
	): Promise<BrandHealthScore | undefined> {
		if (!this.brandAnalyticsProvider) {
			this.logger.warn(
				"Brand Analytics provider not available for brand health score",
			);
			return undefined;
		}

		try {
			return await this.brandAnalyticsProvider.getBrandHealthScore(
				brandName,
				marketplaceId,
			);
		} catch (error) {
			this.logger.warn("Failed to get brand health score", {
				brandName,
				marketplaceId,
				error,
			});
			return undefined;
		}
	}

	/**
	 * Get search term insights for a brand
	 */
	async getSearchTermInsights(
		brandName: string,
		marketplaceId: string,
	): Promise<SearchTermInsight[]> {
		if (!this.brandAnalyticsProvider) {
			this.logger.warn(
				"Brand Analytics provider not available for search term insights",
			);
			return [];
		}

		try {
			return await this.brandAnalyticsProvider.getSearchTermInsights(
				brandName,
				marketplaceId,
			);
		} catch (error) {
			this.logger.warn("Failed to get search term insights", {
				brandName,
				marketplaceId,
				error,
			});
			return [];
		}
	}

	/**
	 * Get Campaign Manager for unified campaign management
	 */
	getCampaignManager(): CampaignManager | undefined {
		return this.campaignManager;
	}

	/**
	 * Get all campaigns across advertising platforms
	 */
	async getAllCampaigns(filters?: any) {
		if (!this.campaignManager) {
			throw new AmazonServiceError(
				"Campaign Manager not available. Enable advertising or DSP provider.",
			);
		}

		return this.campaignManager.getAllCampaigns(filters);
	}

	/**
	 * Create a unified campaign
	 */
	async createCampaign(request: any) {
		if (!this.campaignManager) {
			throw new AmazonServiceError(
				"Campaign Manager not available. Enable advertising or DSP provider.",
			);
		}

		return this.campaignManager.createCampaign(request);
	}

	/**
	 * Get campaign optimization suggestions
	 */
	async getCampaignOptimizations(campaignIds?: string[]) {
		if (!this.campaignManager) {
			throw new AmazonServiceError(
				"Campaign Manager not available. Enable advertising or DSP provider.",
			);
		}

		return this.campaignManager.getOptimizationSuggestions(campaignIds);
	}
}
