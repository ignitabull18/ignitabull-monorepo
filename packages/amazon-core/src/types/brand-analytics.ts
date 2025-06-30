/**
 * Amazon Brand Analytics API specific types and interfaces
 */

/**
 * Brand Analytics API request interfaces
 */
export interface SearchTermsReportRequest {
  reportDate: string
  traficSource: 'AMAZON_SEARCH' | 'EXTERNAL_SEARCH'
  aggregatedByASIN?: boolean
  aggregatedByParent?: boolean
  marketplaceId: string
  brandName?: string
  categoryName?: string
  departmentName?: string
}

export interface MarketBasketAnalysisRequest {
  reportDate: string
  marketplaceId: string
  asin: string
  purchaseType?: 'FIRST_TIME' | 'REPEAT'
}

export interface ItemComparisonRequest {
  reportDate: string
  marketplaceId: string
  asin: string
  competitorASINs?: string[]
}

export interface DemographicsRequest {
  reportDate: string
  marketplaceId: string
  asin?: string
  brandName?: string
  categoryName?: string
}

export interface RepeatPurchaseRequest {
  reportDate: string
  marketplaceId: string
  asin?: string
  brandName?: string
  timeFrame: '30_DAYS' | '60_DAYS' | '90_DAYS' | '1_YEAR'
}

/**
 * Search Terms Report interfaces
 */
export interface SearchTermsReportItem {
  searchTerm: string
  searchFrequencyRank: number
  clickShareTop3: number
  clickShareTop3Brands: string[]
  conversionShareTop3: number
  conversionShareTop3Brands: string[]
  searchVolume?: number
  ctr?: number
  conversionRate?: number
  asin?: string
  parentASIN?: string
  brandName?: string
  productTitle?: string
}

export interface SearchTermsReportResponse {
  reportId: string
  reportType: 'SEARCH_TERMS'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reportDate: string
  marketplaceId: string
  dataAvailability: {
    fromDate: string
    toDate: string
  }
  searchTerms: SearchTermsReportItem[]
  totalSearchTerms: number
  pagination?: {
    nextToken?: string
    hasMore: boolean
  }
}

/**
 * Market Basket Analysis interfaces
 */
export interface MarketBasketItem {
  asin: string
  productTitle: string
  brandName: string
  category: string
  combinationFrequency: number
  combinationIndex: number
  averageUnitsPerOrder: number
  glanceViews?: number
  purchaseRate?: number
}

export interface MarketBasketAnalysisResponse {
  reportId: string
  reportType: 'MARKET_BASKET'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reportDate: string
  marketplaceId: string
  baseASIN: string
  baseProductTitle: string
  baseBrandName: string
  frequentlyBoughtTogether: MarketBasketItem[]
  alternativesPurchased: MarketBasketItem[]
  complementaryProducts: MarketBasketItem[]
  totalCombinations: number
}

/**
 * Item Comparison interfaces
 */
export interface ComparisonMetric {
  asin: string
  productTitle: string
  brandName: string
  glanceViews: number
  glanceViewsShare: number
  purchases: number
  purchaseShare: number
  revenue: number
  revenueShare: number
  averageSellingPrice: number
  unitsPerPurchase: number
  conversionRate: number
  customerRating?: number
  reviewCount?: number
}

export interface ItemComparisonResponse {
  reportId: string
  reportType: 'ITEM_COMPARISON'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reportDate: string
  marketplaceId: string
  comparisonMetrics: ComparisonMetric[]
  benchmarkASIN: string
  totalCompetitors: number
  marketPosition: {
    rank: number
    percentile: number
  }
}

/**
 * Demographics interfaces
 */
export interface DemographicSegment {
  segmentType: 'AGE' | 'GENDER' | 'INCOME' | 'EDUCATION' | 'MARITAL_STATUS' | 'HOUSEHOLD_SIZE'
  segmentValue: string
  percentage: number
  indexVsAverage: number
  orderCount: number
  revenue: number
  averageOrderValue: number
}

export interface DemographicsResponse {
  reportId: string
  reportType: 'DEMOGRAPHICS'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reportDate: string
  marketplaceId: string
  entityType: 'ASIN' | 'BRAND' | 'CATEGORY'
  entityValue: string
  demographics: {
    age: DemographicSegment[]
    gender: DemographicSegment[]
    income: DemographicSegment[]
    education: DemographicSegment[]
    maritalStatus: DemographicSegment[]
    householdSize: DemographicSegment[]
  }
  totalCustomers: number
  dataConfidenceLevel: number
}

/**
 * Repeat Purchase interfaces
 */
export interface RepeatPurchaseMetric {
  timeFrame: string
  repeatPurchaseRate: number
  averageTimeBetweenPurchases: number
  customerRetentionRate: number
  customerLifetimeValue: number
  repeatCustomers: number
  newCustomers: number
  churnRate: number
  reactivationRate: number
}

export interface RepeatPurchaseResponse {
  reportId: string
  reportType: 'REPEAT_PURCHASE'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reportDate: string
  marketplaceId: string
  entityType: 'ASIN' | 'BRAND'
  entityValue: string
  metrics: RepeatPurchaseMetric[]
  cohortAnalysis?: {
    cohorts: Array<{
      cohortMonth: string
      customerCount: number
      retentionRates: number[]
    }>
  }
}

/**
 * Brand Metrics interfaces
 */
export interface BrandMetric {
  brandName: string
  marketplaceId: string
  reportDate: string
  brandAwareness: {
    assistedAwareness: number
    unaided Awareness: number
    brandRecall: number
    brandRecognition: number
  }
  brandPerception: {
    brandLoyalty: number
    brandTrust: number
    brandQuality: number
    brandValue: number
    netPromoterScore: number
  }
  brandPerformance: {
    marketShare: number
    brandGrowthRate: number
    customerAcquisitionRate: number
    customerRetentionRate: number
  }
  competitivePosition: {
    rank: number
    percentile: number
    gapToLeader: number
  }
}

export interface BrandMetricsResponse {
  reportId: string
  reportType: 'BRAND_METRICS'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reportDate: string
  marketplaceId: string
  brandMetrics: BrandMetric[]
  industryBenchmarks: {
    averageBrandAwareness: number
    averageBrandLoyalty: number
    averageMarketShare: number
  }
}

/**
 * Competitive Intelligence interfaces
 */
export interface CompetitorInsight {
  competitorBrand: string
  competitorASIN: string
  competitorProduct: string
  sharedCustomerPercentage: number
  customerMigrationRate: number
  priceCompetitiveness: number
  featureComparison: {
    feature: string
    yourProduct: string
    competitor: string
    advantage: 'YOURS' | 'COMPETITOR' | 'NEUTRAL'
  }[]
  reviewSentiment: {
    positive: number
    neutral: number
    negative: number
    averageRating: number
  }
}

export interface CompetitiveIntelligenceResponse {
  reportId: string
  reportType: 'COMPETITIVE_INTELLIGENCE'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reportDate: string
  marketplaceId: string
  baseASIN: string
  baseProduct: string
  baseBrand: string
  competitors: CompetitorInsight[]
  marketPosition: {
    overallRank: number
    strengthsCount: number
    weaknessesCount: number
    opportunitiesCount: number
    threatsCount: number
  }
}

/**
 * Report status and management interfaces
 */
export interface BrandAnalyticsReport {
  reportId: string
  reportType: 'SEARCH_TERMS' | 'MARKET_BASKET' | 'ITEM_COMPARISON' | 'DEMOGRAPHICS' | 'REPEAT_PURCHASE' | 'BRAND_METRICS' | 'COMPETITIVE_INTELLIGENCE'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  requestDate: string
  completionDate?: string
  reportDate: string
  marketplaceId: string
  downloadUrl?: string
  fileSize?: number
  recordCount?: number
  errorMessage?: string
}

export interface BrandAnalyticsReportsResponse {
  reports: BrandAnalyticsReport[]
  totalReports: number
  pagination?: {
    nextToken?: string
    hasMore: boolean
  }
}

/**
 * Common enums and constants
 */
export type BrandAnalyticsReportType = 
  | 'SEARCH_TERMS' 
  | 'MARKET_BASKET' 
  | 'ITEM_COMPARISON' 
  | 'DEMOGRAPHICS' 
  | 'REPEAT_PURCHASE'
  | 'BRAND_METRICS'
  | 'COMPETITIVE_INTELLIGENCE'

export type BrandAnalyticsStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type TrafficSource = 'AMAZON_SEARCH' | 'EXTERNAL_SEARCH'

export type PurchaseType = 'FIRST_TIME' | 'REPEAT'

export type TimeFrame = '30_DAYS' | '60_DAYS' | '90_DAYS' | '1_YEAR'

export type EntityType = 'ASIN' | 'BRAND' | 'CATEGORY'

export type DemographicType = 'AGE' | 'GENDER' | 'INCOME' | 'EDUCATION' | 'MARITAL_STATUS' | 'HOUSEHOLD_SIZE'

/**
 * Configuration interfaces
 */
export interface BrandAnalyticsConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  region: 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'eu-central-1' | 'ap-northeast-1'
  advertisingAccountId: string
  brandEntityId?: string
  defaultMarketplaceId?: string
  sandbox?: boolean
  timeout?: number
  retry?: {
    maxRetries: number
    baseDelay: number
    maxDelay: number
  }
}

/**
 * Error interfaces
 */
export interface BrandAnalyticsError {
  code: string
  message: string
  details?: string
  reportId?: string
  requestId?: string
}

/**
 * Helper interfaces for data aggregation
 */
export interface SearchTermInsight {
  searchTerm: string
  totalSearchVolume: number
  myBrandShare: number
  competitorShare: number
  opportunityScore: number
  suggestedActions: string[]
  trendDirection: 'UP' | 'DOWN' | 'STABLE'
  seasonality?: {
    peakMonths: string[]
    lowMonths: string[]
  }
}

export interface BrandHealthScore {
  overallScore: number
  components: {
    awareness: number
    consideration: number
    conversion: number
    loyalty: number
    advocacy: number
  }
  benchmarkComparison: {
    vsCategory: number
    vsCompetitors: number
    vsPrevious Period: number
  }
  actionableInsights: string[]
}