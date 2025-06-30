/**
 * Amazon Search Performance Analytics types
 * For analyzing search query performance and SEO insights
 */

/**
 * Search query performance metrics
 */
export interface SearchQueryMetrics {
	query: string;
	impressions: number;
	clicks: number;
	clickThroughRate: number;
	conversionRate: number;
	purchaseRate: number;
	revenue: number;
	unitsOrdered: number;
	averagePrice: number;
	searchFrequencyRank: number;
	relativeSearchVolume: number;
}

/**
 * Search term performance over time
 */
export interface SearchTermTrend {
	searchTerm: string;
	period: string; // YYYY-MM-DD
	metrics: SearchQueryMetrics;
	trendDirection: "RISING" | "FALLING" | "STABLE";
	growthRate: number; // Percentage change from previous period
	seasonalityIndex: number; // 0-1, where 1 is peak season
}

/**
 * Keyword ranking data
 */
export interface KeywordRanking {
	keyword: string;
	asin: string;
	currentRank: number;
	previousRank: number;
	rankChange: number;
	isOrganic: boolean;
	isSponsored: boolean;
	competitorCount: number;
	shareOfVoice: number; // Percentage of top positions
}

/**
 * Search visibility score
 */
export interface SearchVisibilityScore {
	overallScore: number; // 0-100
	components: {
		organicVisibility: number;
		sponsoredVisibility: number;
		brandedSearches: number;
		nonBrandedSearches: number;
		categoryVisibility: number;
	};
	benchmarks: {
		categoryAverage: number;
		topCompetitor: number;
		industryLeader: number;
	};
}

/**
 * Competitor search analysis
 */
export interface CompetitorSearchAnalysis {
	competitorAsin: string;
	competitorBrand: string;
	sharedKeywords: string[];
	exclusiveKeywords: string[];
	rankingComparison: {
		keyword: string;
		yourRank: number;
		competitorRank: number;
		advantage: "YOU" | "COMPETITOR" | "TIE";
	}[];
	overlapScore: number; // Percentage of keyword overlap
	threatLevel: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * Search intent analysis
 */
export interface SearchIntentAnalysis {
	query: string;
	primaryIntent:
		| "INFORMATIONAL"
		| "NAVIGATIONAL"
		| "TRANSACTIONAL"
		| "COMMERCIAL";
	intentConfidence: number;
	relatedIntents: Array<{
		intent: string;
		score: number;
	}>;
	suggestedOptimizations: string[];
}

/**
 * Long-tail keyword opportunities
 */
export interface LongTailOpportunity {
	keyword: string;
	searchVolume: number;
	competition: "HIGH" | "MEDIUM" | "LOW";
	currentRank?: number;
	estimatedTraffic: number;
	conversionPotential: number;
	relevanceScore: number;
	recommendedBid?: number;
}

/**
 * Search autocomplete analysis
 */
export interface AutocompleteAnalysis {
	seedTerm: string;
	suggestions: Array<{
		suggestion: string;
		position: number;
		searchVolume: number;
		yourVisibility: boolean;
	}>;
	brandPresence: number; // Percentage of suggestions with your brand
	opportunities: string[];
}

/**
 * Search Performance Report
 */
export interface SearchPerformanceReport {
	reportId: string;
	dateRange: {
		startDate: string;
		endDate: string;
	};
	summary: {
		totalImpressions: number;
		totalClicks: number;
		averageCTR: number;
		topSearchTerms: string[];
		searchVisibilityScore: number;
	};
	searchTerms: SearchQueryMetrics[];
	trends: SearchTermTrend[];
	rankings: KeywordRanking[];
	opportunities: LongTailOpportunity[];
}

/**
 * SEO recommendations
 */
export interface SEORecommendation {
	type:
		| "TITLE"
		| "BULLET_POINTS"
		| "DESCRIPTION"
		| "BACKEND_KEYWORDS"
		| "IMAGES"
		| "A_PLUS_CONTENT";
	priority: "HIGH" | "MEDIUM" | "LOW";
	currentState: string;
	recommendation: string;
	expectedImpact: {
		visibilityIncrease: number;
		trafficIncrease: number;
		conversionIncrease: number;
	};
	implementation: {
		difficulty: "EASY" | "MEDIUM" | "HARD";
		timeRequired: string;
		steps: string[];
	};
}

/**
 * Listing quality score
 */
export interface ListingQualityScore {
	asin: string;
	overallScore: number; // 0-100
	components: {
		titleOptimization: number;
		bulletPoints: number;
		productDescription: number;
		images: number;
		keywords: number;
		pricing: number;
		reviews: number;
	};
	competitiveAnalysis: {
		categoryAverageScore: number;
		topCompetitorScore: number;
		yourRank: number;
	};
	recommendations: SEORecommendation[];
}

/**
 * Search anomaly detection
 */
export interface SearchAnomaly {
	type:
		| "TRAFFIC_DROP"
		| "RANKING_LOSS"
		| "CTR_DECLINE"
		| "COMPETITOR_SURGE"
		| "ALGORITHM_UPDATE";
	severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
	detectedDate: string;
	affectedKeywords: string[];
	impact: {
		impressionsChange: number;
		clicksChange: number;
		revenueChange: number;
	};
	possibleCauses: string[];
	recommendedActions: string[];
}

/**
 * Voice search optimization
 */
export interface VoiceSearchOptimization {
	query: string;
	isVoiceOptimized: boolean;
	naturalLanguageScore: number;
	conversationalKeywords: string[];
	recommendations: {
		questionPhrases: string[];
		longFormAnswers: string[];
		featuredSnippetOptimization: string[];
	};
}

/**
 * Mobile search performance
 */
export interface MobileSearchPerformance {
	mobileImpressions: number;
	mobileClicks: number;
	mobileCTR: number;
	mobileConversionRate: number;
	mobileVsDesktopRatio: number;
	mobileSpecificIssues: string[];
	mobileOptimizations: string[];
}

/**
 * Search seasonality analysis
 */
export interface SearchSeasonalityAnalysis {
	keyword: string;
	seasonalPattern: "YEAR_ROUND" | "SEASONAL" | "TRENDING" | "DECLINING";
	peakMonths: string[];
	lowMonths: string[];
	yearOverYearGrowth: number;
	forecastedTrend: {
		nextMonth: number;
		nextQuarter: number;
		nextYear: number;
	};
	preparationRecommendations: string[];
}

/**
 * Brand search analysis
 */
export interface BrandSearchAnalysis {
	brandName: string;
	brandedSearchVolume: number;
	brandedVsNonBranded: {
		brandedPercentage: number;
		nonBrandedPercentage: number;
	};
	brandSentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
	competitorBrandSearches: Array<{
		competitor: string;
		searchVolume: number;
		yourVisibility: number;
	}>;
	brandProtection: {
		trademarkedTerms: string[];
		infringements: string[];
		recommendedActions: string[];
	};
}

/**
 * Search cannibalization analysis
 */
export interface SearchCannibalizationAnalysis {
	keyword: string;
	cannibalizedProducts: Array<{
		asin: string;
		title: string;
		rank: number;
		impressionShare: number;
	}>;
	impactAssessment: {
		revenueImpact: number;
		efficiencyLoss: number;
	};
	recommendations: string[];
}

/**
 * International search performance
 */
export interface InternationalSearchPerformance {
	marketplace: string;
	language: string;
	localizedKeywords: string[];
	performanceMetrics: SearchQueryMetrics;
	localizationScore: number;
	culturalRelevance: number;
	recommendations: {
		keywordLocalization: string[];
		contentAdaptation: string[];
		pricingStrategy: string[];
	};
}

/**
 * Search attribution model
 */
export interface SearchAttributionModel {
	attributionWindow: "1d" | "7d" | "14d" | "30d";
	touchpoints: Array<{
		searchTerm: string;
		timestamp: string;
		action: "IMPRESSION" | "CLICK" | "ADD_TO_CART" | "PURCHASE";
		value: number;
	}>;
	attributedRevenue: number;
	attributedUnits: number;
	pathAnalysis: {
		commonPaths: string[][];
		averagePathLength: number;
		timeToConversion: number;
	};
}

/**
 * Search performance configuration
 */
export interface SearchPerformanceConfig {
	trackingEnabled: boolean;
	updateFrequency: "REAL_TIME" | "HOURLY" | "DAILY" | "WEEKLY";
	competitorTracking: string[]; // ASINs to track
	keywordAlerts: {
		enabled: boolean;
		thresholds: {
			rankingDrop: number;
			trafficDrop: number;
			competitorGain: number;
		};
	};
	reportingPreferences: {
		includeCompetitors: boolean;
		includeSeasonality: boolean;
		includeVoiceSearch: boolean;
		includeMobileAnalysis: boolean;
	};
}
