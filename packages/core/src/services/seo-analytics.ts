/**
 * SEO Analytics Service
 * Core service for SEO monitoring, analysis, and automated insights
 */

import type {
	BacklinkProfile,
	ContentAnalysis,
	CoreWebVitals,
	KeywordRanking,
	SchemaMarkup,
	SEOAudit,
	SEOInsight,
	SEOIssue,
	SEOOpportunity,
	TechnicalSEO,
} from "../types/seo-analytics";

export interface SEOAnalysisConfig {
	domain: string;
	crawlDepth: number;
	maxPages: number;
	includeSubdomains: boolean;
	respectRobotsTxt: boolean;
	userAgent: string;
	timeout: number;
	concurrency: number;
	delays: {
		minDelay: number;
		maxDelay: number;
	};
}

export interface CrawlResult {
	url: string;
	statusCode: number;
	content: string;
	headers: Record<string, string>;
	loadTime: number;
	size: number;
	links: {
		internal: string[];
		external: string[];
	};
	images: {
		src: string;
		alt?: string;
		width?: number;
		height?: number;
	}[];
	error?: string;
}

export interface PageAnalysis {
	url: string;
	title?: string;
	metaDescription?: string;
	h1Tags: string[];
	h2Tags: string[];
	h3Tags: string[];
	content: string;
	wordCount: number;
	readingTime: number;
	canonical?: string;
	robots?: string;
	openGraph: Record<string, string>;
	twitterCard: Record<string, string>;
	schemaMarkup: SchemaMarkup[];
	issues: SEOIssue[];
}

export class SEOAnalyticsService {
	private config: SEOAnalysisConfig;
	private isInitialized = false;
	private crawlQueue: string[] = [];
	private crawledUrls: Set<string> = new Set();
	private results: Map<string, CrawlResult> = new Map();

	constructor(config: SEOAnalysisConfig) {
		this.config = config;
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		try {
			console.log("🔍 Initializing SEO Analytics Service");
			this.isInitialized = true;
		} catch (error) {
			console.error("❌ Failed to initialize SEO Analytics Service:", error);
			throw error;
		}
	}

	// Page Analysis
	async analyzePage(url: string): Promise<PageAnalysis> {
		try {
			const crawlResult = await this.crawlPage(url);
			if (crawlResult.error) {
				throw new Error(`Failed to crawl ${url}: ${crawlResult.error}`);
			}

			return this.extractPageData(crawlResult);
		} catch (error) {
			console.error(`Failed to analyze page ${url}:`, error);
			throw error;
		}
	}

	async crawlWebsite(startUrl: string): Promise<Map<string, PageAnalysis>> {
		this.crawlQueue = [startUrl];
		this.crawledUrls.clear();
		this.results.clear();

		const analyses = new Map<string, PageAnalysis>();

		while (
			this.crawlQueue.length > 0 &&
			this.crawledUrls.size < this.config.maxPages
		) {
			const batch = this.crawlQueue.splice(0, this.config.concurrency);
			const crawlPromises = batch.map((url) => this.crawlPage(url));

			const results = await Promise.allSettled(crawlPromises);

			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				const url = batch[i];

				if (result.status === "fulfilled" && !result.value.error) {
					this.results.set(url, result.value);
					const analysis = this.extractPageData(result.value);
					analyses.set(url, analysis);

					// Add internal links to queue
					this.addLinksToQueue(result.value.links.internal);
				}
			}

			// Add delay between batches
			if (this.crawlQueue.length > 0) {
				await this.delay(this.config.delays.minDelay);
			}
		}

		return analyses;
	}

	// Technical SEO Analysis
	async analyzeTechnicalSEO(domain: string): Promise<TechnicalSEO> {
		const crawlResults = await this.crawlWebsite(`https://${domain}`);

		const analysis: TechnicalSEO = {
			id: this.generateId(),
			domain,
			crawlDate: new Date(),
			totalPages: crawlResults.size,
			indexablePages: 0,
			nonIndexablePages: 0,
			duplicatePages: 0,
			brokenLinks: 0,
			redirectChains: 0,
			missingTitles: 0,
			duplicateTitles: 0,
			missingDescriptions: 0,
			duplicateDescriptions: 0,
			missingH1: 0,
			multipleH1: 0,
			largeImages: 0,
			missingAltText: 0,
			slowPages: 0,
			mobileIssues: 0,
			httpsIssues: 0,
			sitemapStatus: await this.checkSitemap(domain),
			robotsTxtStatus: await this.checkRobotsTxt(domain),
			coreWebVitals: await this.analyzeCoreWebVitals(domain),
			securityHeaders: await this.analyzeSecurityHeaders(domain),
			structuredDataIssues: [],
			crawlErrors: [],
			createdAt: new Date(),
		};

		// Analyze each page
		const titles = new Set<string>();
		const descriptions = new Set<string>();
		const duplicateTitles = new Set<string>();
		const duplicateDescriptions = new Set<string>();

		for (const [url, pageAnalysis] of crawlResults) {
			// Title analysis
			if (!pageAnalysis.title) {
				analysis.missingTitles++;
			} else {
				if (titles.has(pageAnalysis.title)) {
					duplicateTitles.add(pageAnalysis.title);
					analysis.duplicateTitles++;
				}
				titles.add(pageAnalysis.title);
			}

			// Meta description analysis
			if (!pageAnalysis.metaDescription) {
				analysis.missingDescriptions++;
			} else {
				if (descriptions.has(pageAnalysis.metaDescription)) {
					duplicateDescriptions.add(pageAnalysis.metaDescription);
					analysis.duplicateDescriptions++;
				}
				descriptions.add(pageAnalysis.metaDescription);
			}

			// H1 analysis
			if (pageAnalysis.h1Tags.length === 0) {
				analysis.missingH1++;
			} else if (pageAnalysis.h1Tags.length > 1) {
				analysis.multipleH1++;
			}

			// Check if page is indexable
			if (this.isPageIndexable(pageAnalysis)) {
				analysis.indexablePages++;
			} else {
				analysis.nonIndexablePages++;
			}

			// Check for HTTPS issues
			if (!url.startsWith("https://")) {
				analysis.httpsIssues++;
			}
		}

		return analysis;
	}

	// Content Analysis
	async analyzeContent(
		url: string,
		targetKeywords: string[] = [],
	): Promise<ContentAnalysis> {
		const pageAnalysis = await this.analyzePage(url);

		const analysis: ContentAnalysis = {
			id: this.generateId(),
			url,
			title: pageAnalysis.title || "",
			content: pageAnalysis.content,
			wordCount: pageAnalysis.wordCount,
			readingTime: pageAnalysis.readingTime,
			readabilityScore: this.calculateReadabilityScore(pageAnalysis.content),
			keywordDensity: this.analyzeKeywordDensity(
				pageAnalysis.content,
				targetKeywords,
			),
			topicRelevance: this.analyzeTopicRelevance(
				pageAnalysis.content,
				targetKeywords,
			),
			semanticKeywords: this.extractSemanticKeywords(pageAnalysis.content),
			entityMentions: this.extractEntityMentions(pageAnalysis.content),
			contentGaps: await this.identifyContentGaps(
				pageAnalysis.content,
				targetKeywords,
			),
			competitorComparison: [], // Would be populated with competitor data
			recommendations: this.generateContentRecommendations(pageAnalysis),
			sentiment: this.analyzeSentiment(pageAnalysis.content),
			language: this.detectLanguage(pageAnalysis.content),
			lastUpdated: new Date(),
			createdAt: new Date(),
		};

		return analysis;
	}

	// Keyword Tracking
	async trackKeywordRankings(
		keywords: string[],
		domain: string,
	): Promise<KeywordRanking[]> {
		const rankings: KeywordRanking[] = [];

		for (const keyword of keywords) {
			try {
				const ranking = await this.checkKeywordRanking(keyword, domain);
				rankings.push(ranking);
			} catch (error) {
				console.error(`Failed to track keyword '${keyword}':`, error);
			}
		}

		return rankings;
	}

	// Backlink Analysis
	async analyzeBacklinks(domain: string): Promise<BacklinkProfile> {
		// This would integrate with backlink APIs like Ahrefs, SEMrush, or Majestic
		// For now, returning mock data structure
		return {
			id: this.generateId(),
			domain,
			totalBacklinks: 0,
			totalReferringDomains: 0,
			totalDoFollowLinks: 0,
			totalNoFollowLinks: 0,
			domainAuthority: 0,
			pageAuthority: 0,
			spamScore: 0,
			topReferringDomains: [],
			anchorTextDistribution: [],
			linkTypes: {
				text: 0,
				image: 0,
				redirect: 0,
				form: 0,
				frame: 0,
			},
			newLinks: [],
			lostLinks: [],
			lastUpdated: new Date(),
			createdAt: new Date(),
		};
	}

	// Automated Insights
	async generateInsights(domain: string): Promise<SEOInsight[]> {
		const insights: SEOInsight[] = [];

		try {
			const technicalAnalysis = await this.analyzeTechnicalSEO(domain);
			const crawlResults = await this.crawlWebsite(`https://${domain}`);

			// Technical insights
			if (technicalAnalysis.missingTitles > 0) {
				insights.push({
					id: this.generateId(),
					type: "issue",
					category: "technical",
					title: "Missing Page Titles",
					description: `${technicalAnalysis.missingTitles} pages are missing title tags`,
					impact: "negative",
					severity: "high",
					confidence: 1.0,
					affectedUrls: [],
					metrics: { count: technicalAnalysis.missingTitles },
					recommendations: [
						"Add unique, descriptive title tags to all pages",
						"Keep titles between 50-60 characters",
						"Include target keywords naturally",
					],
					estimatedTrafficImpact: technicalAnalysis.missingTitles * -5,
					estimatedRankingImpact: -10,
					autoGenerated: true,
					isRead: false,
					isDismissed: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}

			if (technicalAnalysis.duplicateTitles > 0) {
				insights.push({
					id: this.generateId(),
					type: "issue",
					category: "technical",
					title: "Duplicate Page Titles",
					description: `${technicalAnalysis.duplicateTitles} pages have duplicate title tags`,
					impact: "negative",
					severity: "medium",
					confidence: 1.0,
					affectedUrls: [],
					metrics: { count: technicalAnalysis.duplicateTitles },
					recommendations: [
						"Create unique title tags for each page",
						"Ensure titles accurately describe page content",
						"Use variations of target keywords",
					],
					estimatedTrafficImpact: technicalAnalysis.duplicateTitles * -3,
					estimatedRankingImpact: -5,
					autoGenerated: true,
					isRead: false,
					isDismissed: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}

			// Core Web Vitals insights
			if (technicalAnalysis.coreWebVitals.grade === "poor") {
				insights.push({
					id: this.generateId(),
					type: "issue",
					category: "technical",
					title: "Poor Core Web Vitals",
					description:
						"Site has poor Core Web Vitals scores affecting user experience",
					impact: "negative",
					severity: "critical",
					confidence: 0.9,
					affectedUrls: [],
					metrics: {
						lcp: technicalAnalysis.coreWebVitals.lcp,
						fid: technicalAnalysis.coreWebVitals.fid,
						cls: technicalAnalysis.coreWebVitals.cls,
					},
					recommendations: [
						"Optimize images and reduce file sizes",
						"Implement lazy loading for images",
						"Minimize JavaScript execution time",
						"Use efficient cache policies",
						"Optimize server response times",
					],
					estimatedTrafficImpact: -20,
					estimatedRankingImpact: -15,
					autoGenerated: true,
					isRead: false,
					isDismissed: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}

			// Content opportunities
			const avgWordCount =
				Array.from(crawlResults.values()).reduce(
					(sum, analysis) => sum + analysis.wordCount,
					0,
				) / crawlResults.size;

			if (avgWordCount < 300) {
				insights.push({
					id: this.generateId(),
					type: "opportunity",
					category: "content",
					title: "Thin Content Detected",
					description: `Average page content is ${Math.round(avgWordCount)} words, which may be too short for good rankings`,
					impact: "positive",
					severity: "medium",
					confidence: 0.8,
					affectedUrls: [],
					metrics: { avgWordCount },
					recommendations: [
						"Expand content to at least 300-500 words per page",
						"Add detailed product descriptions",
						"Include helpful tips and guides",
						"Add FAQ sections",
					],
					estimatedTrafficImpact: 15,
					estimatedRankingImpact: 10,
					autoGenerated: true,
					isRead: false,
					isDismissed: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		} catch (error) {
			console.error("Failed to generate insights:", error);
		}

		return insights;
	}

	// SEO Audit
	async runFullAudit(domain: string): Promise<SEOAudit> {
		const audit: SEOAudit = {
			id: this.generateId(),
			domain,
			auditType: "full",
			status: "running",
			progress: 0,
			startedAt: new Date(),
			configuration: {
				crawlDepth: this.config.crawlDepth,
				includeSubdomains: this.config.includeSubdomains,
				excludePatterns: [],
				includePatterns: [],
				crawlBudget: this.config.maxPages,
				respectRobotsTxt: this.config.respectRobotsTxt,
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		try {
			// Run technical analysis
			audit.progress = 25;
			const technicalAnalysis = await this.analyzeTechnicalSEO(domain);

			// Run content analysis
			audit.progress = 50;
			const crawlResults = await this.crawlWebsite(`https://${domain}`);

			// Run backlink analysis
			audit.progress = 75;
			const backlinkProfile = await this.analyzeBacklinks(domain);

			// Generate insights
			audit.progress = 90;
			const insights = await this.generateInsights(domain);

			// Calculate scores
			const technicalScore = this.calculateTechnicalScore(technicalAnalysis);
			const contentScore = this.calculateContentScore(crawlResults);
			const backlinkScore = this.calculateBacklinkScore(backlinkProfile);
			const overallScore = Math.round(
				(technicalScore + contentScore + backlinkScore) / 3,
			);

			audit.results = {
				overallScore,
				technicalScore,
				contentScore,
				backlinkScore,
				competitiveScore: 0, // Would be calculated with competitor data
				issues: insights
					.filter((i) => i.type === "issue")
					.map(this.convertInsightToIssue),
				opportunities: insights
					.filter((i) => i.type === "opportunity")
					.map(this.convertInsightToOpportunity),
				metrics: {
					totalPages: technicalAnalysis.totalPages,
					technicalIssues:
						technicalAnalysis.missingTitles + technicalAnalysis.duplicateTitles,
					averageWordCount:
						Array.from(crawlResults.values()).reduce(
							(sum, analysis) => sum + analysis.wordCount,
							0,
						) / crawlResults.size,
					coreWebVitalsScore: technicalAnalysis.coreWebVitals.desktopScore,
				},
			};

			audit.status = "completed";
			audit.progress = 100;
			audit.completedAt = new Date();
		} catch (error) {
			audit.status = "failed";
			audit.error = error instanceof Error ? error.message : "Unknown error";
			console.error("SEO audit failed:", error);
		}

		audit.updatedAt = new Date();
		return audit;
	}

	// Private Helper Methods
	private async crawlPage(url: string): Promise<CrawlResult> {
		if (this.crawledUrls.has(url)) {
			return this.results.get(url)!;
		}

		this.crawledUrls.add(url);

		try {
			const startTime = Date.now();

			// Simulate web crawling - in real implementation, use Puppeteer or similar
			const response = await fetch(url, {
				headers: {
					"User-Agent": this.config.userAgent,
				},
			});

			const loadTime = Date.now() - startTime;
			const content = await response.text();
			const size = new Blob([content]).size;

			const result: CrawlResult = {
				url,
				statusCode: response.status,
				content,
				headers: Object.fromEntries([...(response.headers as any)]),
				loadTime,
				size,
				links: this.extractLinks(content, url),
				images: this.extractImages(content),
			};

			if (!response.ok) {
				result.error = `HTTP ${response.status}: ${response.statusText}`;
			}

			return result;
		} catch (error) {
			return {
				url,
				statusCode: 0,
				content: "",
				headers: {},
				loadTime: 0,
				size: 0,
				links: { internal: [], external: [] },
				images: [],
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private extractPageData(crawlResult: CrawlResult): PageAnalysis {
		const { content, url } = crawlResult;

		// Simple HTML parsing - in real implementation, use proper DOM parser
		const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
		const title = titleMatch ? titleMatch[1].trim() : undefined;

		const metaDescMatch = content.match(
			/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
		);
		const metaDescription = metaDescMatch ? metaDescMatch[1] : undefined;

		const h1Tags = this.extractTags(content, "h1");
		const h2Tags = this.extractTags(content, "h2");
		const h3Tags = this.extractTags(content, "h3");

		const textContent = this.extractTextContent(content);
		const wordCount = this.countWords(textContent);
		const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

		const canonical = this.extractCanonical(content);
		const robots = this.extractRobots(content);
		const openGraph = this.extractOpenGraph(content);
		const twitterCard = this.extractTwitterCard(content);
		const schemaMarkup = this.extractSchemaMarkup(content);

		const pageAnalysis: PageAnalysis = {
			url,
			title,
			metaDescription,
			h1Tags,
			h2Tags,
			h3Tags,
			content: textContent,
			wordCount,
			readingTime,
			canonical,
			robots,
			openGraph,
			twitterCard,
			schemaMarkup,
			issues: [],
		};

		const issues = this.identifyPageIssues(pageAnalysis);

		return {
			url,
			title,
			metaDescription,
			h1Tags,
			h2Tags,
			h3Tags,
			content: textContent,
			wordCount,
			readingTime,
			canonical,
			robots,
			openGraph,
			twitterCard,
			schemaMarkup,
			issues,
		};
	}

	private extractLinks(
		content: string,
		baseUrl: string,
	): { internal: string[]; external: string[] } {
		const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
		const links = { internal: [] as string[], external: [] as string[] };
		let match;

		const baseDomain = new URL(baseUrl).hostname;

		while ((match = linkPattern.exec(content)) !== null) {
			const href = match[1];

			try {
				const url = new URL(href, baseUrl);
				if (url.hostname === baseDomain) {
					links.internal.push(url.href);
				} else {
					links.external.push(url.href);
				}
			} catch {
				// Invalid URL, skip
			}
		}

		return links;
	}

	private extractImages(
		content: string,
	): Array<{ src: string; alt?: string; width?: number; height?: number }> {
		const imgPattern = /<img[^>]*>/gi;
		const images: Array<{
			src: string;
			alt?: string;
			width?: number;
			height?: number;
		}> = [];
		let match;

		while ((match = imgPattern.exec(content)) !== null) {
			const imgTag = match[0];

			const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
			const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
			const widthMatch = imgTag.match(/width=["']?([0-9]+)["']?/i);
			const heightMatch = imgTag.match(/height=["']?([0-9]+)["']?/i);

			if (srcMatch) {
				images.push({
					src: srcMatch[1],
					alt: altMatch ? altMatch[1] : undefined,
					width: widthMatch ? Number.parseInt(widthMatch[1]) : undefined,
					height: heightMatch ? Number.parseInt(heightMatch[1]) : undefined,
				});
			}
		}

		return images;
	}

	private extractTags(content: string, tagName: string): string[] {
		const pattern = new RegExp(`<${tagName}[^>]*>([^<]+)<\/${tagName}>`, "gi");
		const tags: string[] = [];
		let match;

		while ((match = pattern.exec(content)) !== null) {
			tags.push(match[1].trim());
		}

		return tags;
	}

	private extractTextContent(html: string): string {
		// Remove script and style elements
		let text = html.replace(
			/<(script|style)[^>]*>[\s\S]*?<\/(script|style)>/gi,
			"",
		);
		// Remove HTML tags
		text = text.replace(/<[^>]*>/g, " ");
		// Clean up whitespace
		text = text.replace(/\s+/g, " ").trim();
		return text;
	}

	private countWords(text: string): number {
		return text.split(/\s+/).filter((word) => word.length > 0).length;
	}

	private extractCanonical(content: string): string | undefined {
		const match = content.match(
			/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
		);
		return match ? match[1] : undefined;
	}

	private extractRobots(content: string): string | undefined {
		const match = content.match(
			/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i,
		);
		return match ? match[1] : undefined;
	}

	private extractOpenGraph(content: string): Record<string, string> {
		const pattern =
			/<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
		const og: Record<string, string> = {};
		let match;

		while ((match = pattern.exec(content)) !== null) {
			og[match[1]] = match[2];
		}

		return og;
	}

	private extractTwitterCard(content: string): Record<string, string> {
		const pattern =
			/<meta[^>]*name=["']twitter:([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
		const twitter: Record<string, string> = {};
		let match;

		while ((match = pattern.exec(content)) !== null) {
			twitter[match[1]] = match[2];
		}

		return twitter;
	}

	private extractSchemaMarkup(content: string): SchemaMarkup[] {
		const pattern =
			/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
		const schemas: SchemaMarkup[] = [];
		let match;

		while ((match = pattern.exec(content)) !== null) {
			try {
				const data = JSON.parse(match[1]);
				schemas.push({
					type: data["@type"] || "Unknown",
					properties: data,
					isValid: true,
					warnings: [],
				});
			} catch {
				schemas.push({
					type: "Invalid",
					properties: {},
					isValid: false,
					warnings: ["Invalid JSON-LD syntax"],
				});
			}
		}

		return schemas;
	}

	private identifyPageIssues(analysis: PageAnalysis): SEOIssue[] {
		const issues: SEOIssue[] = [];

		// Title issues
		if (!analysis.title) {
			issues.push({
				id: this.generateId(),
				type: "error",
				category: "meta",
				title: "Missing Title Tag",
				description: "Page is missing a title tag",
				impact: "high",
				suggestion:
					"Add a unique, descriptive title tag between 50-60 characters",
				priority: 10,
				isFixed: false,
				createdAt: new Date(),
			});
		} else if (analysis.title.length < 30) {
			issues.push({
				id: this.generateId(),
				type: "warning",
				category: "meta",
				title: "Short Title Tag",
				description: `Title tag is only ${analysis.title.length} characters`,
				impact: "medium",
				suggestion: "Expand title to 50-60 characters for better visibility",
				priority: 6,
				isFixed: false,
				createdAt: new Date(),
			});
		} else if (analysis.title.length > 60) {
			issues.push({
				id: this.generateId(),
				type: "warning",
				category: "meta",
				title: "Long Title Tag",
				description: `Title tag is ${analysis.title.length} characters, may be truncated`,
				impact: "medium",
				suggestion: "Shorten title to under 60 characters",
				priority: 6,
				isFixed: false,
				createdAt: new Date(),
			});
		}

		// Meta description issues
		if (!analysis.metaDescription) {
			issues.push({
				id: this.generateId(),
				type: "warning",
				category: "meta",
				title: "Missing Meta Description",
				description: "Page is missing a meta description",
				impact: "medium",
				suggestion:
					"Add a compelling meta description between 150-160 characters",
				priority: 7,
				isFixed: false,
				createdAt: new Date(),
			});
		}

		// H1 issues
		if (analysis.h1Tags.length === 0) {
			issues.push({
				id: this.generateId(),
				type: "error",
				category: "content",
				title: "Missing H1 Tag",
				description: "Page is missing an H1 heading",
				impact: "high",
				suggestion: "Add a single, descriptive H1 tag to the page",
				priority: 9,
				isFixed: false,
				createdAt: new Date(),
			});
		} else if (analysis.h1Tags.length > 1) {
			issues.push({
				id: this.generateId(),
				type: "warning",
				category: "content",
				title: "Multiple H1 Tags",
				description: `Page has ${analysis.h1Tags.length} H1 tags`,
				impact: "medium",
				suggestion: "Use only one H1 tag per page",
				priority: 5,
				isFixed: false,
				createdAt: new Date(),
			});
		}

		// Content length issues
		if (analysis.wordCount < 300) {
			issues.push({
				id: this.generateId(),
				type: "warning",
				category: "content",
				title: "Thin Content",
				description: `Page has only ${analysis.wordCount} words`,
				impact: "medium",
				suggestion: "Expand content to at least 300 words for better rankings",
				priority: 6,
				isFixed: false,
				createdAt: new Date(),
			});
		}

		return issues;
	}

	// Additional helper methods would go here...
	private addLinksToQueue(links: string[]): void {
		for (const link of links) {
			if (!this.crawledUrls.has(link) && !this.crawlQueue.includes(link)) {
				// Check depth and domain restrictions
				if (this.shouldCrawlUrl(link)) {
					this.crawlQueue.push(link);
				}
			}
		}
	}

	private shouldCrawlUrl(url: string): boolean {
		try {
			const urlObj = new URL(url);
			const baseDomain = new URL(`https://${this.config.domain}`).hostname;

			if (!this.config.includeSubdomains && urlObj.hostname !== baseDomain) {
				return false;
			}

			if (
				this.config.includeSubdomains &&
				!urlObj.hostname.endsWith(baseDomain)
			) {
				return false;
			}

			return true;
		} catch {
			return false;
		}
	}

	private isPageIndexable(analysis: PageAnalysis): boolean {
		if (analysis.robots?.includes("noindex")) return false;
		// Add more indexability checks
		return true;
	}

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private generateId(): string {
		return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Placeholder methods for advanced features
	private async checkSitemap(_domain: string): Promise<any> {
		// Implementation would check sitemap.xml
		return {
			exists: true,
			accessible: true,
			validXML: true,
			urlCount: 0,
			errors: [],
		};
	}

	private async checkRobotsTxt(_domain: string): Promise<any> {
		// Implementation would check robots.txt
		return {
			exists: true,
			accessible: true,
			validFormat: true,
			blocksCriticalPages: false,
			allowsCrawling: true,
			errors: [],
		};
	}

	private async analyzeCoreWebVitals(_domain: string): Promise<CoreWebVitals> {
		// Implementation would use PageSpeed Insights API
		return {
			lcp: 2.5,
			fid: 100,
			cls: 0.1,
			fcp: 1.8,
			ttfb: 600,
			grade: "good",
			mobileScore: 85,
			desktopScore: 90,
		};
	}

	private async analyzeSecurityHeaders(_domain: string): Promise<any> {
		// Implementation would check security headers
		return {
			hsts: true,
			csp: false,
			xFrameOptions: true,
			xContentTypeOptions: true,
			referrerPolicy: true,
			permissionsPolicy: false,
			score: 75,
		};
	}

	private async checkKeywordRanking(
		keyword: string,
		domain: string,
	): Promise<KeywordRanking> {
		// Implementation would use SERP APIs
		return {
			id: this.generateId(),
			keyword,
			url: `https://${domain}`,
			domain,
			position: 0,
			searchVolume: 0,
			difficulty: 0,
			cpc: 0,
			country: "US",
			device: "desktop",
			searchEngine: "google",
			trackingDate: new Date(),
			positionHistory: [],
			features: [],
			competitors: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}

	private calculateReadabilityScore(content: string): number {
		// Simplified Flesch reading ease calculation
		const sentences = content.split(/[.!?]+/).length;
		const words = content.split(/\s+/).length;
		const syllables = this.countSyllables(content);

		if (sentences === 0 || words === 0) return 0;

		const score =
			206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
		return Math.max(0, Math.min(100, score));
	}

	private countSyllables(text: string): number {
		// Simplified syllable counting
		return text
			.toLowerCase()
			.split(/\s+/)
			.reduce((count, word) => {
				return count + Math.max(1, word.replace(/[^aeiou]/g, "").length);
			}, 0);
	}

	private analyzeKeywordDensity(_content: string, _keywords: string[]): any[] {
		// Implementation would analyze keyword density
		return [];
	}

	private analyzeTopicRelevance(_content: string, _keywords: string[]): number {
		// Implementation would analyze topic relevance
		return 0;
	}

	private extractSemanticKeywords(_content: string): string[] {
		// Implementation would extract semantic keywords
		return [];
	}

	private extractEntityMentions(_content: string): any[] {
		// Implementation would extract entity mentions
		return [];
	}

	private async identifyContentGaps(
		_content: string,
		_keywords: string[],
	): Promise<string[]> {
		// Implementation would identify content gaps
		return [];
	}

	private generateContentRecommendations(_analysis: PageAnalysis): any[] {
		// Implementation would generate content recommendations
		return [];
	}

	private analyzeSentiment(
		_content: string,
	): "positive" | "neutral" | "negative" {
		// Implementation would analyze sentiment
		return "neutral";
	}

	private detectLanguage(_content: string): string {
		// Implementation would detect language
		return "en";
	}

	private calculateTechnicalScore(analysis: TechnicalSEO): number {
		let score = 100;

		// Deduct points for issues
		score -= Math.min(30, analysis.missingTitles * 2);
		score -= Math.min(20, analysis.duplicateTitles * 1);
		score -= Math.min(15, analysis.missingDescriptions * 1);
		score -= Math.min(20, analysis.missingH1 * 2);
		score -= Math.min(10, analysis.multipleH1 * 1);

		// Core Web Vitals impact
		if (analysis.coreWebVitals.grade === "poor") score -= 20;
		else if (analysis.coreWebVitals.grade === "needs_improvement") score -= 10;

		return Math.max(0, score);
	}

	private calculateContentScore(
		crawlResults: Map<string, PageAnalysis>,
	): number {
		if (crawlResults.size === 0) return 0;

		let totalScore = 0;

		for (const analysis of crawlResults.values()) {
			let pageScore = 100;

			// Word count scoring
			if (analysis.wordCount < 300) pageScore -= 20;
			else if (analysis.wordCount > 2000) pageScore += 10;

			// Structure scoring
			if (analysis.h2Tags.length === 0) pageScore -= 10;
			if (analysis.h3Tags.length === 0) pageScore -= 5;

			totalScore += pageScore;
		}

		return Math.round(totalScore / crawlResults.size);
	}

	private calculateBacklinkScore(profile: BacklinkProfile): number {
		// Basic scoring based on backlink profile
		let score = 50; // Base score

		score += Math.min(30, profile.domainAuthority);
		score += Math.min(20, Math.log10(profile.totalBacklinks + 1) * 5);

		return Math.min(100, score);
	}

	private convertInsightToIssue(insight: SEOInsight): SEOIssue {
		return {
			id: insight.id,
			type:
				insight.severity === "critical"
					? "error"
					: insight.severity === "high"
						? "error"
						: "warning",
			category: insight.category as any,
			title: insight.title,
			description: insight.description,
			impact:
				insight.severity === "critical"
					? "high"
					: insight.severity === "high"
						? "high"
						: "medium",
			suggestion: insight.recommendations[0] || "",
			priority:
				insight.severity === "critical"
					? 10
					: insight.severity === "high"
						? 8
						: 6,
			isFixed: false,
			createdAt: insight.createdAt,
		};
	}

	private convertInsightToOpportunity(insight: SEOInsight): SEOOpportunity {
		return {
			id: insight.id,
			type: "technical",
			title: insight.title,
			description: insight.description,
			estimatedTraffic: Math.max(0, insight.estimatedTrafficImpact),
			estimatedValue: Math.max(0, insight.estimatedTrafficImpact * 2),
			difficulty: 50, // Default difficulty
			timeToResult: 30, // 30 days default
			requirements: insight.recommendations,
			kpis: ["Traffic", "Rankings"],
			isTracked: false,
			status: "new",
			createdAt: insight.createdAt,
			updatedAt: insight.updatedAt,
		};
	}
}

export default SEOAnalyticsService;
