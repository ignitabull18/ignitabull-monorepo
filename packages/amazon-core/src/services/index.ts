/**
 * Amazon Core Services
 * High-level service orchestration layer
 */

export type {
	AIInsight,
	AIInsightsConfig,
	InsightCategory,
	InsightPriority,
	InsightType,
	MarketOpportunity,
	PredictiveAnalytics,
	StrategicRecommendation,
} from "./ai-insights-engine";
export { AIInsightsEngine } from "./ai-insights-engine";
export type {
	AmazonServiceConfig,
	MarketplaceInsights,
	ProductInsights,
	ProviderHealth,
	ServiceHealth,
} from "./amazon-service";
export { AmazonService } from "./amazon-service";
export type {
	AttributionBenchmarks,
	AttributionManagerConfig,
	CampaignPerformanceSummary,
	CrossChannelInsights,
} from "./attribution-manager";
export { AttributionManager } from "./attribution-manager";
export type {
	BrandIntelligenceConfig,
	BrandIntelligenceReport,
	CompetitiveInsights,
	CustomerBehaviorInsights,
	MarketTrendsInsights,
	SearchDiscoveryInsights,
} from "./brand-intelligence";
export { BrandIntelligenceService } from "./brand-intelligence";
export type {
	BulkCampaignOperationRequest,
	CampaignManagerConfig,
	CampaignOptimizationSuggestion,
	CampaignSearchFilters,
	CreateUnifiedCampaignRequest,
	UnifiedBidStrategy,
	UnifiedCampaign,
	UnifiedCampaignPerformance,
	UnifiedCampaignStatus,
	UnifiedCampaignType,
	UpdateUnifiedCampaignRequest,
} from "./campaign-manager";
export { CampaignManager } from "./campaign-manager";
export type {
	CompetitiveLandscape,
	SEOActionPlan,
	SearchAnalyticsConfig,
	SearchDashboard,
} from "./search-analytics";
export { SearchAnalyticsService } from "./search-analytics";
export type {
	CreateSponsoredDisplayCampaignRequest,
	CreativePerformanceAnalysis,
	SponsoredDisplayAudienceInsights,
	SponsoredDisplayManagerConfig,
} from "./sponsored-display-manager";
export { SponsoredDisplayManager } from "./sponsored-display-manager";
