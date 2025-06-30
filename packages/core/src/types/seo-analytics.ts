/**
 * SEO Analytics Types
 * TypeScript interfaces for SEO monitoring and insights
 */

export interface SEOMetrics {
	id: string;
	url: string;
	domain: string;
	title: string;
	metaDescription?: string;
	h1Tags: string[];
	h2Tags: string[];
	h3Tags: string[];
	imageCount: number;
	internalLinks: number;
	externalLinks: number;
	wordCount: number;
	readingTime: number;
	loadTime: number;
	mobileScore: number;
	desktopScore: number;
	seoScore: number;
	accessibilityScore: number;
	bestPracticesScore: number;
	performanceScore: number;
	crawlDate: Date;
	lastModified?: Date;
	canonical?: string;
	robots?: string;
	ogTitle?: string;
	ogDescription?: string;
	ogImage?: string;
	twitterCard?: string;
	schemaMarkup: SchemaMarkup[];
	issues: SEOIssue[];
	createdAt: Date;
	updatedAt: Date;
}

export interface SchemaMarkup {
	type: string;
	properties: Record<string, any>;
	isValid: boolean;
	warnings: string[];
}

export interface SEOIssue {
	id: string;
	type: "error" | "warning" | "info";
	category: "technical" | "content" | "meta" | "performance" | "accessibility";
	title: string;
	description: string;
	impact: "high" | "medium" | "low";
	suggestion: string;
	element?: string;
	selector?: string;
	priority: number;
	isFixed: boolean;
	fixedAt?: Date;
	createdAt: Date;
}

export interface KeywordRanking {
	id: string;
	keyword: string;
	url: string;
	domain: string;
	position: number;
	previousPosition?: number;
	searchVolume: number;
	difficulty: number;
	cpc: number;
	country: string;
	device: "desktop" | "mobile";
	searchEngine: "google" | "bing" | "yahoo";
	trackingDate: Date;
	positionHistory: PositionHistory[];
	features: SERPFeatures[];
	competitors: CompetitorRanking[];
	createdAt: Date;
	updatedAt: Date;
}

export interface PositionHistory {
	date: Date;
	position: number;
	url: string;
	features: string[];
}

export interface SERPFeatures {
	type:
		| "featured_snippet"
		| "people_also_ask"
		| "local_pack"
		| "image_pack"
		| "video"
		| "shopping"
		| "news";
	isPresent: boolean;
	position?: number;
	ownedByUs: boolean;
}

export interface CompetitorRanking {
	domain: string;
	url: string;
	position: number;
	title: string;
	description: string;
}

export interface BacklinkProfile {
	id: string;
	domain: string;
	totalBacklinks: number;
	totalReferringDomains: number;
	totalDoFollowLinks: number;
	totalNoFollowLinks: number;
	domainAuthority: number;
	pageAuthority: number;
	spamScore: number;
	topReferringDomains: ReferringDomain[];
	anchorTextDistribution: AnchorText[];
	linkTypes: LinkTypeDistribution;
	newLinks: BacklinkData[];
	lostLinks: BacklinkData[];
	lastUpdated: Date;
	createdAt: Date;
}

export interface ReferringDomain {
	domain: string;
	domainAuthority: number;
	backlinks: number;
	firstSeen: Date;
	lastSeen: Date;
	linkType: "dofollow" | "nofollow";
	country: string;
	language: string;
}

export interface AnchorText {
	text: string;
	count: number;
	percentage: number;
	type: "exact" | "partial" | "branded" | "generic" | "naked_url" | "image";
}

export interface LinkTypeDistribution {
	text: number;
	image: number;
	redirect: number;
	form: number;
	frame: number;
}

export interface BacklinkData {
	id: string;
	sourceUrl: string;
	targetUrl: string;
	sourceDomain: string;
	targetDomain: string;
	anchorText: string;
	linkType: "dofollow" | "nofollow";
	domainAuthority: number;
	pageAuthority: number;
	firstSeen: Date;
	lastSeen: Date;
	isActive: boolean;
	spamScore: number;
	country: string;
	language: string;
}

export interface TechnicalSEO {
	id: string;
	domain: string;
	crawlDate: Date;
	totalPages: number;
	indexablePages: number;
	nonIndexablePages: number;
	duplicatePages: number;
	brokenLinks: number;
	redirectChains: number;
	missingTitles: number;
	duplicateTitles: number;
	missingDescriptions: number;
	duplicateDescriptions: number;
	missingH1: number;
	multipleH1: number;
	largeImages: number;
	missingAltText: number;
	slowPages: number;
	mobileIssues: number;
	httpsIssues: number;
	sitemapStatus: SitemapStatus;
	robotsTxtStatus: RobotsTxtStatus;
	coreWebVitals: CoreWebVitals;
	securityHeaders: SecurityHeaders;
	structuredDataIssues: StructuredDataIssue[];
	crawlErrors: CrawlError[];
	createdAt: Date;
}

export interface SitemapStatus {
	exists: boolean;
	accessible: boolean;
	validXML: boolean;
	urlCount: number;
	lastModified?: Date;
	errors: string[];
}

export interface RobotsTxtStatus {
	exists: boolean;
	accessible: boolean;
	validFormat: boolean;
	blocksCriticalPages: boolean;
	allowsCrawling: boolean;
	errors: string[];
}

export interface CoreWebVitals {
	lcp: number; // Largest Contentful Paint
	fid: number; // First Input Delay
	cls: number; // Cumulative Layout Shift
	fcp: number; // First Contentful Paint
	ttfb: number; // Time to First Byte
	grade: "good" | "needs_improvement" | "poor";
	mobileScore: number;
	desktopScore: number;
}

export interface SecurityHeaders {
	hsts: boolean;
	csp: boolean;
	xFrameOptions: boolean;
	xContentTypeOptions: boolean;
	referrerPolicy: boolean;
	permissionsPolicy: boolean;
	score: number;
}

export interface StructuredDataIssue {
	type: string;
	url: string;
	issue: string;
	severity: "error" | "warning";
	count: number;
}

export interface CrawlError {
	url: string;
	statusCode: number;
	error: string;
	type: "4xx" | "5xx" | "timeout" | "dns" | "redirect";
	discoveredFrom: string[];
	firstSeen: Date;
	lastSeen: Date;
}

export interface ContentAnalysis {
	id: string;
	url: string;
	title: string;
	content: string;
	wordCount: number;
	readingTime: number;
	readabilityScore: number;
	keywordDensity: KeywordDensity[];
	topicRelevance: number;
	semanticKeywords: string[];
	entityMentions: EntityMention[];
	contentGaps: string[];
	competitorComparison: ContentComparison[];
	recommendations: ContentRecommendation[];
	sentiment: "positive" | "neutral" | "negative";
	language: string;
	publishDate?: Date;
	lastUpdated: Date;
	createdAt: Date;
}

export interface KeywordDensity {
	keyword: string;
	count: number;
	density: number;
	prominence: number;
	isOverOptimized: boolean;
}

export interface EntityMention {
	entity: string;
	type: "person" | "organization" | "location" | "product" | "concept";
	mentions: number;
	sentiment: number;
	relevance: number;
}

export interface ContentComparison {
	competitorUrl: string;
	competitorDomain: string;
	wordCount: number;
	topicCoverage: number;
	uniqueTopics: string[];
	missingTopics: string[];
	contentGap: number;
}

export interface ContentRecommendation {
	type: "keyword" | "topic" | "structure" | "length" | "readability";
	title: string;
	description: string;
	impact: "high" | "medium" | "low";
	effort: "low" | "medium" | "high";
	priority: number;
}

export interface SEOInsight {
	id: string;
	type: "opportunity" | "issue" | "trend" | "alert";
	category: "rankings" | "traffic" | "technical" | "content" | "backlinks";
	title: string;
	description: string;
	impact: "positive" | "negative" | "neutral";
	severity: "critical" | "high" | "medium" | "low";
	confidence: number;
	affectedUrls: string[];
	metrics: Record<string, number>;
	recommendations: string[];
	estimatedTrafficImpact: number;
	estimatedRankingImpact: number;
	autoGenerated: boolean;
	isRead: boolean;
	isDismissed: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface SEOReport {
	id: string;
	domain: string;
	reportType: "daily" | "weekly" | "monthly" | "custom";
	period: {
		startDate: Date;
		endDate: Date;
	};
	overallScore: number;
	previousScore?: number;
	summary: {
		totalPages: number;
		totalKeywords: number;
		averagePosition: number;
		organicTraffic: number;
		totalBacklinks: number;
		technicalIssues: number;
	};
	sections: {
		rankings: KeywordSummary;
		technical: TechnicalSummary;
		content: ContentSummary;
		backlinks: BacklinkSummary;
		competitors: CompetitorSummary;
	};
	insights: SEOInsight[];
	recommendations: ReportRecommendation[];
	generatedAt: Date;
	createdAt: Date;
}

export interface KeywordSummary {
	totalKeywords: number;
	averagePosition: number;
	positionImprovement: number;
	newRankings: number;
	lostRankings: number;
	topMovers: { keyword: string; change: number }[];
	topOpportunities: { keyword: string; potential: number }[];
}

export interface TechnicalSummary {
	overallHealth: number;
	totalIssues: number;
	newIssues: number;
	fixedIssues: number;
	criticalIssues: number;
	coreWebVitalsScore: number;
	mobileOptimization: number;
}

export interface ContentSummary {
	totalPages: number;
	optimizedPages: number;
	contentGaps: number;
	averageReadability: number;
	duplicateContent: number;
	thinContent: number;
}

export interface BacklinkSummary {
	totalBacklinks: number;
	newBacklinks: number;
	lostBacklinks: number;
	domainAuthority: number;
	spamScore: number;
	toxicLinks: number;
}

export interface CompetitorSummary {
	monitored: number;
	averageGap: number;
	opportunityKeywords: number;
	contentGaps: number;
	backlinkGaps: number;
}

export interface ReportRecommendation {
	priority: number;
	category: string;
	title: string;
	description: string;
	impact: "high" | "medium" | "low";
	effort: "low" | "medium" | "high";
	estimatedResults: string;
	actionItems: string[];
}

export interface SEOAudit {
	id: string;
	domain: string;
	auditType: "full" | "technical" | "content" | "competitive";
	status: "pending" | "running" | "completed" | "failed";
	progress: number;
	startedAt: Date;
	completedAt?: Date;
	results?: {
		overallScore: number;
		technicalScore: number;
		contentScore: number;
		backlinkScore: number;
		competitiveScore: number;
		issues: SEOIssue[];
		opportunities: SEOOpportunity[];
		metrics: Record<string, any>;
	};
	configuration: {
		crawlDepth: number;
		includeSubdomains: boolean;
		excludePatterns: string[];
		includePatterns: string[];
		crawlBudget: number;
		respectRobotsTxt: boolean;
	};
	error?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface SEOOpportunity {
	id: string;
	type: "keyword" | "content" | "technical" | "backlink";
	title: string;
	description: string;
	estimatedTraffic: number;
	estimatedValue: number;
	difficulty: number;
	timeToResult: number;
	requirements: string[];
	kpis: string[];
	isTracked: boolean;
	status: "new" | "in_progress" | "completed" | "dismissed";
	assignedTo?: string;
	dueDate?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface CompetitorAnalysis {
	id: string;
	domain: string;
	competitor: string;
	analysisDate: Date;
	metrics: {
		organicKeywords: number;
		organicTraffic: number;
		averagePosition: number;
		domainAuthority: number;
		totalBacklinks: number;
		contentPages: number;
	};
	keywordGaps: {
		opportunities: number;
		sharedKeywords: number;
		uniqueKeywords: number;
		avgPositionGap: number;
	};
	contentGaps: {
		missingTopics: string[];
		weakerContent: string[];
		contentVolume: number;
		updateFrequency: number;
	};
	backlinkGaps: {
		uniqueDomains: number;
		linkOpportunities: string[];
		avgDomainAuthority: number;
		linkBuildingPotential: number;
	};
	strengths: string[];
	weaknesses: string[];
	opportunities: string[];
	threats: string[];
	overallCompetitiveStrength: number;
	createdAt: Date;
}

// Database creation types
export interface CreateSEOMetrics
	extends Omit<SEOMetrics, "id" | "createdAt" | "updatedAt"> {}
export interface CreateKeywordRanking
	extends Omit<KeywordRanking, "id" | "createdAt" | "updatedAt"> {}
export interface CreateBacklinkProfile
	extends Omit<BacklinkProfile, "id" | "createdAt"> {}
export interface CreateTechnicalSEO
	extends Omit<TechnicalSEO, "id" | "createdAt"> {}
export interface CreateContentAnalysis
	extends Omit<ContentAnalysis, "id" | "createdAt"> {}
export interface CreateSEOInsight
	extends Omit<SEOInsight, "id" | "createdAt" | "updatedAt"> {}
export interface CreateSEOAudit
	extends Omit<SEOAudit, "id" | "createdAt" | "updatedAt"> {}

// Update types
export interface UpdateSEOMetrics
	extends Partial<Omit<CreateSEOMetrics, "url" | "domain">> {}
export interface UpdateKeywordRanking
	extends Partial<Omit<CreateKeywordRanking, "keyword" | "domain">> {}
export interface UpdateSEOInsight
	extends Partial<Omit<CreateSEOInsight, "type" | "category">> {}
export interface UpdateSEOAudit
	extends Partial<Omit<CreateSEOAudit, "domain">> {}

export default {
	SEOMetrics,
	KeywordRanking,
	BacklinkProfile,
	TechnicalSEO,
	ContentAnalysis,
	SEOInsight,
	SEOReport,
	SEOAudit,
	SEOOpportunity,
	CompetitorAnalysis,
};
