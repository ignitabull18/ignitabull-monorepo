/**
 * SEO Repository
 * Database operations for SEO analytics and monitoring
 */

import { createClient } from "@supabase/supabase-js";
import type {
	ContentAnalysis,
	CreateKeywordRanking,
	CreateSEOAudit,
	CreateSEOInsight,
	CreateSEOMetrics,
	KeywordRanking,
	SEOAudit,
	SEOInsight,
	SEOMetrics,
	SEOOpportunity,
	TechnicalSEO,
	UpdateKeywordRanking,
	UpdateSEOAudit,
	UpdateSEOInsight,
	UpdateSEOMetrics,
} from "../../../packages/core/src/types/seo-analytics";

export class SEORepository {
	private supabase: ReturnType<typeof createClient>;

	constructor() {
		const supabaseUrl = process.env.SUPABASE_URL!;
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
		this.supabase = createClient(supabaseUrl, supabaseKey);
	}

	// SEO Metrics Management
	async createSEOMetrics(data: CreateSEOMetrics): Promise<SEOMetrics> {
		const { data: metrics, error } = await this.supabase
			.from("seo_metrics")
			.insert({
				...data,
				h1_tags: data.h1Tags,
				h2_tags: data.h2Tags,
				h3_tags: data.h3Tags,
				image_count: data.imageCount,
				internal_links: data.internalLinks,
				external_links: data.externalLinks,
				word_count: data.wordCount,
				reading_time: data.readingTime,
				load_time: data.loadTime,
				mobile_score: data.mobileScore,
				desktop_score: data.desktopScore,
				seo_score: data.seoScore,
				accessibility_score: data.accessibilityScore,
				best_practices_score: data.bestPracticesScore,
				performance_score: data.performanceScore,
				crawl_date: data.crawlDate.toISOString(),
				last_modified: data.lastModified?.toISOString(),
				meta_description: data.metaDescription,
				og_title: data.ogTitle,
				og_description: data.ogDescription,
				og_image: data.ogImage,
				twitter_card: data.twitterCard,
				schema_markup: data.schemaMarkup,
				issues: data.issues,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create SEO metrics: ${error.message}`);
		}

		return this.transformSEOMetricsFromDB(metrics);
	}

	async updateSEOMetrics(
		id: string,
		updates: UpdateSEOMetrics,
	): Promise<SEOMetrics | null> {
		const updateData: any = { ...updates };

		// Transform field names for database
		if (updates.h1Tags) updateData.h1_tags = updates.h1Tags;
		if (updates.h2Tags) updateData.h2_tags = updates.h2Tags;
		if (updates.h3Tags) updateData.h3_tags = updates.h3Tags;
		if (updates.imageCount) updateData.image_count = updates.imageCount;
		if (updates.internalLinks)
			updateData.internal_links = updates.internalLinks;
		if (updates.externalLinks)
			updateData.external_links = updates.externalLinks;
		if (updates.wordCount) updateData.word_count = updates.wordCount;
		if (updates.readingTime) updateData.reading_time = updates.readingTime;
		if (updates.loadTime) updateData.load_time = updates.loadTime;
		if (updates.mobileScore) updateData.mobile_score = updates.mobileScore;
		if (updates.desktopScore) updateData.desktop_score = updates.desktopScore;
		if (updates.seoScore) updateData.seo_score = updates.seoScore;
		if (updates.accessibilityScore)
			updateData.accessibility_score = updates.accessibilityScore;
		if (updates.bestPracticesScore)
			updateData.best_practices_score = updates.bestPracticesScore;
		if (updates.performanceScore)
			updateData.performance_score = updates.performanceScore;
		if (updates.crawlDate)
			updateData.crawl_date = updates.crawlDate.toISOString();
		if (updates.lastModified)
			updateData.last_modified = updates.lastModified.toISOString();
		if (updates.metaDescription)
			updateData.meta_description = updates.metaDescription;
		if (updates.ogTitle) updateData.og_title = updates.ogTitle;
		if (updates.ogDescription)
			updateData.og_description = updates.ogDescription;
		if (updates.ogImage) updateData.og_image = updates.ogImage;
		if (updates.twitterCard) updateData.twitter_card = updates.twitterCard;
		if (updates.schemaMarkup) updateData.schema_markup = updates.schemaMarkup;

		// Remove original camelCase fields
		delete updateData.h1Tags;
		delete updateData.h2Tags;
		delete updateData.h3Tags;
		delete updateData.imageCount;
		delete updateData.internalLinks;
		delete updateData.externalLinks;
		delete updateData.wordCount;
		delete updateData.readingTime;
		delete updateData.loadTime;
		delete updateData.mobileScore;
		delete updateData.desktopScore;
		delete updateData.seoScore;
		delete updateData.accessibilityScore;
		delete updateData.bestPracticesScore;
		delete updateData.performanceScore;
		delete updateData.crawlDate;
		delete updateData.lastModified;
		delete updateData.metaDescription;
		delete updateData.ogTitle;
		delete updateData.ogDescription;
		delete updateData.ogImage;
		delete updateData.twitterCard;
		delete updateData.schemaMarkup;

		const { data: metrics, error } = await this.supabase
			.from("seo_metrics")
			.update({ ...updateData, updated_at: new Date().toISOString() })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Failed to update SEO metrics:", error);
			return null;
		}

		return this.transformSEOMetricsFromDB(metrics);
	}

	async getSEOMetrics(id: string): Promise<SEOMetrics | null> {
		const { data: metrics, error } = await this.supabase
			.from("seo_metrics")
			.select("*")
			.eq("id", id)
			.single();

		if (error || !metrics) {
			return null;
		}

		return this.transformSEOMetricsFromDB(metrics);
	}

	async getSEOMetricsByDomain(domain: string): Promise<SEOMetrics[]> {
		const { data: metrics, error } = await this.supabase
			.from("seo_metrics")
			.select("*")
			.eq("domain", domain)
			.order("crawl_date", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch SEO metrics: ${error.message}`);
		}

		return (metrics || []).map(this.transformSEOMetricsFromDB);
	}

	async getSEOMetricsByUrl(url: string): Promise<SEOMetrics[]> {
		const { data: metrics, error } = await this.supabase
			.from("seo_metrics")
			.select("*")
			.eq("url", url)
			.order("crawl_date", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch SEO metrics: ${error.message}`);
		}

		return (metrics || []).map(this.transformSEOMetricsFromDB);
	}

	// Keyword Ranking Management
	async createKeywordRanking(
		data: CreateKeywordRanking,
	): Promise<KeywordRanking> {
		const { data: ranking, error } = await this.supabase
			.from("keyword_rankings")
			.insert({
				...data,
				previous_position: data.previousPosition,
				search_volume: data.searchVolume,
				search_engine: data.searchEngine,
				tracking_date: data.trackingDate.toISOString(),
				position_history: data.positionHistory,
				serp_features: data.features,
				competitor_rankings: data.competitors,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create keyword ranking: ${error.message}`);
		}

		return this.transformKeywordRankingFromDB(ranking);
	}

	async updateKeywordRanking(
		id: string,
		updates: UpdateKeywordRanking,
	): Promise<KeywordRanking | null> {
		const updateData: any = { ...updates };

		// Transform field names for database
		if (updates.previousPosition !== undefined)
			updateData.previous_position = updates.previousPosition;
		if (updates.searchVolume) updateData.search_volume = updates.searchVolume;
		if (updates.searchEngine) updateData.search_engine = updates.searchEngine;
		if (updates.trackingDate)
			updateData.tracking_date = updates.trackingDate.toISOString();
		if (updates.positionHistory)
			updateData.position_history = updates.positionHistory;
		if (updates.features) updateData.serp_features = updates.features;
		if (updates.competitors)
			updateData.competitor_rankings = updates.competitors;

		// Remove original camelCase fields
		delete updateData.previousPosition;
		delete updateData.searchVolume;
		delete updateData.searchEngine;
		delete updateData.trackingDate;
		delete updateData.positionHistory;
		delete updateData.features;
		delete updateData.competitors;

		const { data: ranking, error } = await this.supabase
			.from("keyword_rankings")
			.update({ ...updateData, updated_at: new Date().toISOString() })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Failed to update keyword ranking:", error);
			return null;
		}

		return this.transformKeywordRankingFromDB(ranking);
	}

	async getKeywordRankings(domain: string): Promise<KeywordRanking[]> {
		const { data: rankings, error } = await this.supabase
			.from("keyword_rankings")
			.select("*")
			.eq("domain", domain)
			.order("tracking_date", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch keyword rankings: ${error.message}`);
		}

		return (rankings || []).map(this.transformKeywordRankingFromDB);
	}

	async getKeywordRankingHistory(
		keyword: string,
		domain: string,
		days = 30,
	): Promise<KeywordRanking[]> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const { data: rankings, error } = await this.supabase
			.from("keyword_rankings")
			.select("*")
			.eq("keyword", keyword)
			.eq("domain", domain)
			.gte("tracking_date", startDate.toISOString())
			.order("tracking_date", { ascending: true });

		if (error) {
			throw new Error(
				`Failed to fetch keyword ranking history: ${error.message}`,
			);
		}

		return (rankings || []).map(this.transformKeywordRankingFromDB);
	}

	// Technical SEO Management
	async createTechnicalSEO(data: TechnicalSEO): Promise<TechnicalSEO> {
		const { data: technical, error } = await this.supabase
			.from("technical_seo")
			.insert({
				...data,
				crawl_date: data.crawlDate.toISOString(),
				total_pages: data.totalPages,
				indexable_pages: data.indexablePages,
				non_indexable_pages: data.nonIndexablePages,
				duplicate_pages: data.duplicatePages,
				broken_links: data.brokenLinks,
				redirect_chains: data.redirectChains,
				missing_titles: data.missingTitles,
				duplicate_titles: data.duplicateTitles,
				missing_descriptions: data.missingDescriptions,
				duplicate_descriptions: data.duplicateDescriptions,
				missing_h1: data.missingH1,
				multiple_h1: data.multipleH1,
				large_images: data.largeImages,
				missing_alt_text: data.missingAltText,
				slow_pages: data.slowPages,
				mobile_issues: data.mobileIssues,
				https_issues: data.httpsIssues,
				sitemap_status: data.sitemapStatus,
				robots_txt_status: data.robotsTxtStatus,
				core_web_vitals: data.coreWebVitals,
				security_headers: data.securityHeaders,
				structured_data_issues: data.structuredDataIssues,
				crawl_errors: data.crawlErrors,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create technical SEO: ${error.message}`);
		}

		return this.transformTechnicalSEOFromDB(technical);
	}

	async getTechnicalSEO(domain: string): Promise<TechnicalSEO | null> {
		const { data: technical, error } = await this.supabase
			.from("technical_seo")
			.select("*")
			.eq("domain", domain)
			.order("crawl_date", { ascending: false })
			.limit(1)
			.single();

		if (error || !technical) {
			return null;
		}

		return this.transformTechnicalSEOFromDB(technical);
	}

	// Content Analysis Management
	async createContentAnalysis(data: ContentAnalysis): Promise<ContentAnalysis> {
		const { data: analysis, error } = await this.supabase
			.from("content_analysis")
			.insert({
				...data,
				word_count: data.wordCount,
				reading_time: data.readingTime,
				readability_score: data.readabilityScore,
				keyword_density: data.keywordDensity,
				topic_relevance: data.topicRelevance,
				semantic_keywords: data.semanticKeywords,
				entity_mentions: data.entityMentions,
				content_gaps: data.contentGaps,
				competitor_comparison: data.competitorComparison,
				last_updated: data.lastUpdated.toISOString(),
				publish_date: data.publishDate?.toISOString(),
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create content analysis: ${error.message}`);
		}

		return this.transformContentAnalysisFromDB(analysis);
	}

	async getContentAnalysis(url: string): Promise<ContentAnalysis | null> {
		const { data: analysis, error } = await this.supabase
			.from("content_analysis")
			.select("*")
			.eq("url", url)
			.order("last_updated", { ascending: false })
			.limit(1)
			.single();

		if (error || !analysis) {
			return null;
		}

		return this.transformContentAnalysisFromDB(analysis);
	}

	// SEO Insights Management
	async createSEOInsight(data: CreateSEOInsight): Promise<SEOInsight> {
		const { data: insight, error } = await this.supabase
			.from("seo_insights")
			.insert({
				...data,
				affected_urls: data.affectedUrls,
				estimated_traffic_impact: data.estimatedTrafficImpact,
				estimated_ranking_impact: data.estimatedRankingImpact,
				auto_generated: data.autoGenerated,
				is_read: data.isRead,
				is_dismissed: data.isDismissed,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create SEO insight: ${error.message}`);
		}

		return this.transformSEOInsightFromDB(insight);
	}

	async updateSEOInsight(
		id: string,
		updates: UpdateSEOInsight,
	): Promise<SEOInsight | null> {
		const updateData: any = { ...updates };

		// Transform field names for database
		if (updates.affectedUrls) updateData.affected_urls = updates.affectedUrls;
		if (updates.estimatedTrafficImpact !== undefined)
			updateData.estimated_traffic_impact = updates.estimatedTrafficImpact;
		if (updates.estimatedRankingImpact !== undefined)
			updateData.estimated_ranking_impact = updates.estimatedRankingImpact;
		if (updates.autoGenerated !== undefined)
			updateData.auto_generated = updates.autoGenerated;
		if (updates.isRead !== undefined) updateData.is_read = updates.isRead;
		if (updates.isDismissed !== undefined)
			updateData.is_dismissed = updates.isDismissed;

		// Remove original camelCase fields
		delete updateData.affectedUrls;
		delete updateData.estimatedTrafficImpact;
		delete updateData.estimatedRankingImpact;
		delete updateData.autoGenerated;
		delete updateData.isRead;
		delete updateData.isDismissed;

		const { data: insight, error } = await this.supabase
			.from("seo_insights")
			.update({ ...updateData, updated_at: new Date().toISOString() })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Failed to update SEO insight:", error);
			return null;
		}

		return this.transformSEOInsightFromDB(insight);
	}

	async getSEOInsights(
		domain?: string,
		category?: string,
		isRead?: boolean,
	): Promise<SEOInsight[]> {
		let query = this.supabase.from("seo_insights").select("*");

		if (domain) {
			// Filter by domain in affected URLs
			query = query.contains("affected_urls", [domain]);
		}

		if (category) {
			query = query.eq("category", category);
		}

		if (isRead !== undefined) {
			query = query.eq("is_read", isRead);
		}

		const { data: insights, error } = await query.order("created_at", {
			ascending: false,
		});

		if (error) {
			throw new Error(`Failed to fetch SEO insights: ${error.message}`);
		}

		return (insights || []).map(this.transformSEOInsightFromDB);
	}

	// SEO Audit Management
	async createSEOAudit(data: CreateSEOAudit): Promise<SEOAudit> {
		const { data: audit, error } = await this.supabase
			.from("seo_audits")
			.insert({
				...data,
				audit_type: data.auditType,
				started_at: data.startedAt.toISOString(),
				completed_at: data.completedAt?.toISOString(),
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create SEO audit: ${error.message}`);
		}

		return this.transformSEOAuditFromDB(audit);
	}

	async updateSEOAudit(
		id: string,
		updates: UpdateSEOAudit,
	): Promise<SEOAudit | null> {
		const updateData: any = { ...updates };

		// Transform field names for database
		if (updates.auditType) updateData.audit_type = updates.auditType;
		if (updates.startedAt)
			updateData.started_at = updates.startedAt.toISOString();
		if (updates.completedAt)
			updateData.completed_at = updates.completedAt.toISOString();

		// Remove original camelCase fields
		delete updateData.auditType;
		delete updateData.startedAt;
		delete updateData.completedAt;

		const { data: audit, error } = await this.supabase
			.from("seo_audits")
			.update({ ...updateData, updated_at: new Date().toISOString() })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Failed to update SEO audit:", error);
			return null;
		}

		return this.transformSEOAuditFromDB(audit);
	}

	async getSEOAudit(id: string): Promise<SEOAudit | null> {
		const { data: audit, error } = await this.supabase
			.from("seo_audits")
			.select("*")
			.eq("id", id)
			.single();

		if (error || !audit) {
			return null;
		}

		return this.transformSEOAuditFromDB(audit);
	}

	async getSEOAudits(domain: string): Promise<SEOAudit[]> {
		const { data: audits, error } = await this.supabase
			.from("seo_audits")
			.select("*")
			.eq("domain", domain)
			.order("started_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch SEO audits: ${error.message}`);
		}

		return (audits || []).map(this.transformSEOAuditFromDB);
	}

	// SEO Opportunities Management
	async createSEOOpportunity(
		data: Omit<SEOOpportunity, "id" | "createdAt" | "updatedAt">,
	): Promise<SEOOpportunity> {
		const { data: opportunity, error } = await this.supabase
			.from("seo_opportunities")
			.insert({
				...data,
				estimated_traffic: data.estimatedTraffic,
				estimated_value: data.estimatedValue,
				time_to_result: data.timeToResult,
				is_tracked: data.isTracked,
				assigned_to: data.assignedTo,
				due_date: data.dueDate?.toISOString(),
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create SEO opportunity: ${error.message}`);
		}

		return this.transformSEOOpportunityFromDB(opportunity);
	}

	async getSEOOpportunities(status?: string): Promise<SEOOpportunity[]> {
		let query = this.supabase.from("seo_opportunities").select("*");

		if (status) {
			query = query.eq("status", status);
		}

		const { data: opportunities, error } = await query.order(
			"estimated_value",
			{ ascending: false },
		);

		if (error) {
			throw new Error(`Failed to fetch SEO opportunities: ${error.message}`);
		}

		return (opportunities || []).map(this.transformSEOOpportunityFromDB);
	}

	// Analytics Queries
	async getDomainSummary(domain: string): Promise<{
		totalPages: number;
		averageSEOScore: number;
		totalKeywords: number;
		averagePosition: number;
		totalIssues: number;
		opportunitiesCount: number;
	}> {
		const [metricsResult, rankingsResult, insightsResult, opportunitiesResult] =
			await Promise.all([
				this.supabase
					.from("seo_metrics")
					.select("seo_score")
					.eq("domain", domain),
				this.supabase
					.from("keyword_rankings")
					.select("position")
					.eq("domain", domain),
				this.supabase
					.from("seo_insights")
					.select("id")
					.eq("type", "issue")
					.contains("affected_urls", [domain]),
				this.supabase
					.from("seo_opportunities")
					.select("id")
					.eq("status", "new"),
			]);

		const metrics = metricsResult.data || [];
		const rankings = rankingsResult.data || [];
		const issues = insightsResult.data || [];
		const opportunities = opportunitiesResult.data || [];

		return {
			totalPages: metrics.length,
			averageSEOScore:
				metrics.length > 0
					? metrics.reduce((sum, m) => sum + (m.seo_score || 0), 0) /
						metrics.length
					: 0,
			totalKeywords: rankings.length,
			averagePosition:
				rankings.length > 0
					? rankings.reduce((sum, r) => sum + r.position, 0) / rankings.length
					: 0,
			totalIssues: issues.length,
			opportunitiesCount: opportunities.length,
		};
	}

	async getPerformanceTrends(
		domain: string,
		days = 30,
	): Promise<{
		seoScoreTrend: Array<{ date: string; score: number }>;
		rankingsTrend: Array<{ date: string; averagePosition: number }>;
		issuesTrend: Array<{ date: string; count: number }>;
	}> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		// SEO Score Trend
		const { data: seoData } = await this.supabase
			.from("seo_metrics")
			.select("crawl_date, seo_score")
			.eq("domain", domain)
			.gte("crawl_date", startDate.toISOString())
			.order("crawl_date", { ascending: true });

		// Rankings Trend
		const { data: rankingsData } = await this.supabase
			.from("keyword_rankings")
			.select("tracking_date, position")
			.eq("domain", domain)
			.gte("tracking_date", startDate.toISOString())
			.order("tracking_date", { ascending: true });

		// Issues Trend
		const { data: issuesData } = await this.supabase
			.from("seo_insights")
			.select("created_at")
			.eq("type", "issue")
			.contains("affected_urls", [domain])
			.gte("created_at", startDate.toISOString())
			.order("created_at", { ascending: true });

		// Process trends
		const seoScoreTrend = this.groupByDate(
			seoData || [],
			"crawl_date",
			"seo_score",
		);
		const rankingsTrend = this.groupByDate(
			rankingsData || [],
			"tracking_date",
			"position",
		);
		const issuesTrend = this.countByDate(issuesData || [], "created_at");

		return {
			seoScoreTrend,
			rankingsTrend: rankingsTrend.map((item) => ({
				date: item.date,
				averagePosition: item.score,
			})),
			issuesTrend,
		};
	}

	// Utility Methods
	private groupByDate(
		data: any[],
		dateField: string,
		valueField: string,
	): Array<{ date: string; score: number }> {
		const grouped = data.reduce(
			(acc, item) => {
				const date = new Date(item[dateField]).toISOString().split("T")[0];
				if (!acc[date]) {
					acc[date] = { sum: 0, count: 0 };
				}
				acc[date].sum += item[valueField] || 0;
				acc[date].count += 1;
				return acc;
			},
			{} as Record<string, { sum: number; count: number }>,
		);

		return Object.entries(grouped).map(([date, data]) => ({
			date,
			score: data.count > 0 ? data.sum / data.count : 0,
		}));
	}

	private countByDate(
		data: any[],
		dateField: string,
	): Array<{ date: string; count: number }> {
		const counted = data.reduce(
			(acc, item) => {
				const date = new Date(item[dateField]).toISOString().split("T")[0];
				acc[date] = (acc[date] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		return Object.entries(counted).map(([date, count]) => ({ date, count }));
	}

	// Transform functions to convert database fields to TypeScript interfaces
	private transformSEOMetricsFromDB(data: any): SEOMetrics {
		return {
			id: data.id,
			url: data.url,
			domain: data.domain,
			title: data.title,
			metaDescription: data.meta_description,
			h1Tags: data.h1_tags || [],
			h2Tags: data.h2_tags || [],
			h3Tags: data.h3_tags || [],
			imageCount: data.image_count || 0,
			internalLinks: data.internal_links || 0,
			externalLinks: data.external_links || 0,
			wordCount: data.word_count || 0,
			readingTime: data.reading_time || 0,
			loadTime: data.load_time || 0,
			mobileScore: data.mobile_score || 0,
			desktopScore: data.desktop_score || 0,
			seoScore: data.seo_score || 0,
			accessibilityScore: data.accessibility_score || 0,
			bestPracticesScore: data.best_practices_score || 0,
			performanceScore: data.performance_score || 0,
			crawlDate: new Date(data.crawl_date),
			lastModified: data.last_modified
				? new Date(data.last_modified)
				: undefined,
			canonical: data.canonical,
			robots: data.robots,
			ogTitle: data.og_title,
			ogDescription: data.og_description,
			ogImage: data.og_image,
			twitterCard: data.twitter_card,
			schemaMarkup: data.schema_markup || [],
			issues: data.issues || [],
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}

	private transformKeywordRankingFromDB(data: any): KeywordRanking {
		return {
			id: data.id,
			keyword: data.keyword,
			url: data.url,
			domain: data.domain,
			position: data.position,
			previousPosition: data.previous_position,
			searchVolume: data.search_volume || 0,
			difficulty: data.difficulty || 0,
			cpc: data.cpc || 0,
			country: data.country,
			device: data.device,
			searchEngine: data.search_engine,
			trackingDate: new Date(data.tracking_date),
			positionHistory: data.position_history || [],
			features: data.serp_features || [],
			competitors: data.competitor_rankings || [],
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}

	private transformTechnicalSEOFromDB(data: any): TechnicalSEO {
		return {
			id: data.id,
			domain: data.domain,
			crawlDate: new Date(data.crawl_date),
			totalPages: data.total_pages || 0,
			indexablePages: data.indexable_pages || 0,
			nonIndexablePages: data.non_indexable_pages || 0,
			duplicatePages: data.duplicate_pages || 0,
			brokenLinks: data.broken_links || 0,
			redirectChains: data.redirect_chains || 0,
			missingTitles: data.missing_titles || 0,
			duplicateTitles: data.duplicate_titles || 0,
			missingDescriptions: data.missing_descriptions || 0,
			duplicateDescriptions: data.duplicate_descriptions || 0,
			missingH1: data.missing_h1 || 0,
			multipleH1: data.multiple_h1 || 0,
			largeImages: data.large_images || 0,
			missingAltText: data.missing_alt_text || 0,
			slowPages: data.slow_pages || 0,
			mobileIssues: data.mobile_issues || 0,
			httpsIssues: data.https_issues || 0,
			sitemapStatus: data.sitemap_status || {},
			robotsTxtStatus: data.robots_txt_status || {},
			coreWebVitals: data.core_web_vitals || {},
			securityHeaders: data.security_headers || {},
			structuredDataIssues: data.structured_data_issues || [],
			crawlErrors: data.crawl_errors || [],
			createdAt: new Date(data.created_at),
		};
	}

	private transformContentAnalysisFromDB(data: any): ContentAnalysis {
		return {
			id: data.id,
			url: data.url,
			title: data.title,
			content: data.content,
			wordCount: data.word_count || 0,
			readingTime: data.reading_time || 0,
			readabilityScore: data.readability_score || 0,
			keywordDensity: data.keyword_density || [],
			topicRelevance: data.topic_relevance || 0,
			semanticKeywords: data.semantic_keywords || [],
			entityMentions: data.entity_mentions || [],
			contentGaps: data.content_gaps || [],
			competitorComparison: data.competitor_comparison || [],
			recommendations: data.recommendations || [],
			sentiment: data.sentiment || "neutral",
			language: data.language || "en",
			publishDate: data.publish_date ? new Date(data.publish_date) : undefined,
			lastUpdated: new Date(data.last_updated),
			createdAt: new Date(data.created_at),
		};
	}

	private transformSEOInsightFromDB(data: any): SEOInsight {
		return {
			id: data.id,
			type: data.type,
			category: data.category,
			title: data.title,
			description: data.description,
			impact: data.impact,
			severity: data.severity,
			confidence: data.confidence,
			affectedUrls: data.affected_urls || [],
			metrics: data.metrics || {},
			recommendations: data.recommendations || [],
			estimatedTrafficImpact: data.estimated_traffic_impact || 0,
			estimatedRankingImpact: data.estimated_ranking_impact || 0,
			autoGenerated: data.auto_generated || false,
			isRead: data.is_read || false,
			isDismissed: data.is_dismissed || false,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}

	private transformSEOAuditFromDB(data: any): SEOAudit {
		return {
			id: data.id,
			domain: data.domain,
			auditType: data.audit_type,
			status: data.status,
			progress: data.progress || 0,
			startedAt: new Date(data.started_at),
			completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
			results: data.results,
			configuration: data.configuration || {},
			error: data.error,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}

	private transformSEOOpportunityFromDB(data: any): SEOOpportunity {
		return {
			id: data.id,
			type: data.type,
			title: data.title,
			description: data.description,
			estimatedTraffic: data.estimated_traffic || 0,
			estimatedValue: data.estimated_value || 0,
			difficulty: data.difficulty || 0,
			timeToResult: data.time_to_result || 0,
			requirements: data.requirements || [],
			kpis: data.kpis || [],
			isTracked: data.is_tracked || false,
			status: data.status,
			assignedTo: data.assigned_to,
			dueDate: data.due_date ? new Date(data.due_date) : undefined,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}
}

export default SEORepository;
