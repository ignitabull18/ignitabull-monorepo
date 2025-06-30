/**
 * SEO Analytics API
 * RESTful endpoints for SEO monitoring and insights
 */

import type { Request, Response } from "express";
import { SEOAnalyticsService } from "../../../../packages/core/src/services/seo-analytics";
import SEORepository from "../../services/seo-repository";

const repository = new SEORepository();

// Get SEO overview for a domain
export async function getSEOOverview(req: Request, res: Response) {
	try {
		const { domain } = req.params;

		if (!domain) {
			return res.status(400).json({
				error: "Domain is required",
			});
		}

		const summary = await repository.getDomainSummary(domain);
		const trends = await repository.getPerformanceTrends(domain, 30);

		res.json({
			success: true,
			data: {
				summary,
				trends,
			},
		});
	} catch (error) {
		console.error("SEO overview API error:", error);
		res.status(500).json({
			error: "Failed to fetch SEO overview",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Run SEO audit for a domain
export async function runSEOAudit(req: Request, res: Response) {
	try {
		const { domain } = req.body;

		if (!domain) {
			return res.status(400).json({
				error: "Domain is required",
			});
		}

		const config = {
			domain,
			crawlDepth: req.body.crawlDepth || 3,
			maxPages: req.body.maxPages || 100,
			includeSubdomains: req.body.includeSubdomains || false,
			respectRobotsTxt: req.body.respectRobotsTxt || true,
			userAgent: req.body.userAgent || "Ignitabull-SEO-Bot/1.0",
			timeout: req.body.timeout || 30000,
			concurrency: req.body.concurrency || 5,
			delays: {
				minDelay: req.body.minDelay || 1000,
				maxDelay: req.body.maxDelay || 3000,
			},
		};

		const seoService = new SEOAnalyticsService(config);
		await seoService.initialize();

		// Run full audit
		const audit = await seoService.runFullAudit(domain);

		// Save audit to database
		const savedAudit = await repository.createSEOAudit({
			domain: audit.domain,
			auditType: audit.auditType,
			status: audit.status,
			progress: audit.progress,
			startedAt: audit.startedAt,
			completedAt: audit.completedAt,
			results: audit.results,
			configuration: audit.configuration,
			error: audit.error,
		});

		res.json({
			success: true,
			data: savedAudit,
		});
	} catch (error) {
		console.error("SEO audit API error:", error);
		res.status(500).json({
			error: "Failed to run SEO audit",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get SEO audit status
export async function getAuditStatus(req: Request, res: Response) {
	try {
		const { auditId } = req.params;

		if (!auditId) {
			return res.status(400).json({
				error: "Audit ID is required",
			});
		}

		const audit = await repository.getSEOAudit(auditId);

		if (!audit) {
			return res.status(404).json({
				error: "Audit not found",
			});
		}

		res.json({
			success: true,
			data: audit,
		});
	} catch (error) {
		console.error("Get audit status API error:", error);
		res.status(500).json({
			error: "Failed to fetch audit status",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get all audits for a domain
export async function getDomainAudits(req: Request, res: Response) {
	try {
		const { domain } = req.params;

		if (!domain) {
			return res.status(400).json({
				error: "Domain is required",
			});
		}

		const audits = await repository.getSEOAudits(domain);

		res.json({
			success: true,
			data: audits,
		});
	} catch (error) {
		console.error("Get domain audits API error:", error);
		res.status(500).json({
			error: "Failed to fetch domain audits",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Analyze single page
export async function analyzePage(req: Request, res: Response) {
	try {
		const { url } = req.body;

		if (!url) {
			return res.status(400).json({
				error: "URL is required",
			});
		}

		// Extract domain from URL
		const urlObj = new URL(url);
		const domain = urlObj.hostname;

		const config = {
			domain,
			crawlDepth: 1,
			maxPages: 1,
			includeSubdomains: false,
			respectRobotsTxt: true,
			userAgent: "Ignitabull-SEO-Bot/1.0",
			timeout: 30000,
			concurrency: 1,
			delays: { minDelay: 0, maxDelay: 0 },
		};

		const seoService = new SEOAnalyticsService(config);
		await seoService.initialize();

		const analysis = await seoService.analyzePage(url);

		// Save metrics to database
		const metrics = await repository.createSEOMetrics({
			url: analysis.url,
			domain,
			title: analysis.title,
			metaDescription: analysis.metaDescription,
			h1Tags: analysis.h1Tags,
			h2Tags: analysis.h2Tags,
			h3Tags: analysis.h3Tags,
			imageCount: 0, // Would be extracted from analysis
			internalLinks: 0, // Would be extracted from analysis
			externalLinks: 0, // Would be extracted from analysis
			wordCount: analysis.wordCount,
			readingTime: analysis.readingTime,
			loadTime: 0, // Would be measured
			mobileScore: 0, // Would be calculated
			desktopScore: 0, // Would be calculated
			seoScore:
				analysis.issues.length === 0
					? 100
					: Math.max(0, 100 - analysis.issues.length * 10),
			accessibilityScore: 0, // Would be calculated
			bestPracticesScore: 0, // Would be calculated
			performanceScore: 0, // Would be calculated
			crawlDate: new Date(),
			canonical: analysis.canonical,
			robots: analysis.robots,
			ogTitle: analysis.openGraph.title,
			ogDescription: analysis.openGraph.description,
			ogImage: analysis.openGraph.image,
			twitterCard: analysis.twitterCard.card,
			schemaMarkup: analysis.schemaMarkup,
			issues: analysis.issues,
		});

		res.json({
			success: true,
			data: {
				analysis,
				metrics,
			},
		});
	} catch (error) {
		console.error("Analyze page API error:", error);
		res.status(500).json({
			error: "Failed to analyze page",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get keyword rankings for a domain
export async function getKeywordRankings(req: Request, res: Response) {
	try {
		const { domain } = req.params;
		const { keyword, startDate, endDate, limit = 50, offset = 0 } = req.query;

		if (!domain) {
			return res.status(400).json({
				error: "Domain is required",
			});
		}

		let rankings;

		if (keyword) {
			// Get history for specific keyword
			const days =
				startDate && endDate
					? Math.floor(
							(new Date(endDate as string).getTime() -
								new Date(startDate as string).getTime()) /
								(1000 * 60 * 60 * 24),
						)
					: 30;
			rankings = await repository.getKeywordRankingHistory(
				keyword as string,
				domain,
				days,
			);
		} else {
			// Get all rankings for domain
			rankings = await repository.getKeywordRankings(domain);
		}

		// Apply pagination
		const limitNum = Number.parseInt(limit as string);
		const offsetNum = Number.parseInt(offset as string);
		const paginatedRankings = rankings.slice(offsetNum, offsetNum + limitNum);

		res.json({
			success: true,
			data: paginatedRankings,
			pagination: {
				total: rankings.length,
				limit: limitNum,
				offset: offsetNum,
				hasMore: offsetNum + limitNum < rankings.length,
			},
		});
	} catch (error) {
		console.error("Get keyword rankings API error:", error);
		res.status(500).json({
			error: "Failed to fetch keyword rankings",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Track new keywords
export async function trackKeywords(req: Request, res: Response) {
	try {
		const { domain, keywords } = req.body;

		if (!domain || !keywords || !Array.isArray(keywords)) {
			return res.status(400).json({
				error: "Domain and keywords array are required",
			});
		}

		const config = {
			domain,
			crawlDepth: 1,
			maxPages: 1,
			includeSubdomains: false,
			respectRobotsTxt: true,
			userAgent: "Ignitabull-SEO-Bot/1.0",
			timeout: 30000,
			concurrency: 1,
			delays: { minDelay: 1000, maxDelay: 2000 },
		};

		const seoService = new SEOAnalyticsService(config);
		await seoService.initialize();

		const rankings = await seoService.trackKeywordRankings(keywords, domain);

		// Save rankings to database
		const savedRankings = [];
		for (const ranking of rankings) {
			const saved = await repository.createKeywordRanking({
				keyword: ranking.keyword,
				url: ranking.url,
				domain: ranking.domain,
				position: ranking.position,
				previousPosition: ranking.previousPosition,
				searchVolume: ranking.searchVolume,
				difficulty: ranking.difficulty,
				cpc: ranking.cpc,
				country: ranking.country,
				device: ranking.device,
				searchEngine: ranking.searchEngine,
				trackingDate: ranking.trackingDate,
				positionHistory: ranking.positionHistory,
				features: ranking.features,
				competitors: ranking.competitors,
			});
			savedRankings.push(saved);
		}

		res.json({
			success: true,
			data: savedRankings,
		});
	} catch (error) {
		console.error("Track keywords API error:", error);
		res.status(500).json({
			error: "Failed to track keywords",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get SEO insights
export async function getSEOInsights(req: Request, res: Response) {
	try {
		const { domain, category, isRead } = req.query;

		const insights = await repository.getSEOInsights(
			domain as string,
			category as string,
			isRead !== undefined ? isRead === "true" : undefined,
		);

		res.json({
			success: true,
			data: insights,
		});
	} catch (error) {
		console.error("Get SEO insights API error:", error);
		res.status(500).json({
			error: "Failed to fetch SEO insights",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Generate insights for a domain
export async function generateInsights(req: Request, res: Response) {
	try {
		const { domain } = req.body;

		if (!domain) {
			return res.status(400).json({
				error: "Domain is required",
			});
		}

		const config = {
			domain,
			crawlDepth: 2,
			maxPages: 50,
			includeSubdomains: false,
			respectRobotsTxt: true,
			userAgent: "Ignitabull-SEO-Bot/1.0",
			timeout: 30000,
			concurrency: 3,
			delays: { minDelay: 1000, maxDelay: 2000 },
		};

		const seoService = new SEOAnalyticsService(config);
		await seoService.initialize();

		const insights = await seoService.generateInsights(domain);

		// Save insights to database
		const savedInsights = [];
		for (const insight of insights) {
			const saved = await repository.createSEOInsight({
				type: insight.type,
				category: insight.category,
				title: insight.title,
				description: insight.description,
				impact: insight.impact,
				severity: insight.severity,
				confidence: insight.confidence,
				affectedUrls: insight.affectedUrls,
				metrics: insight.metrics,
				recommendations: insight.recommendations,
				estimatedTrafficImpact: insight.estimatedTrafficImpact,
				estimatedRankingImpact: insight.estimatedRankingImpact,
				autoGenerated: insight.autoGenerated,
				isRead: insight.isRead,
				isDismissed: insight.isDismissed,
			});
			savedInsights.push(saved);
		}

		res.json({
			success: true,
			data: savedInsights,
		});
	} catch (error) {
		console.error("Generate insights API error:", error);
		res.status(500).json({
			error: "Failed to generate insights",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Mark insight as read
export async function markInsightRead(req: Request, res: Response) {
	try {
		const { insightId } = req.params;
		const { isRead = true } = req.body;

		if (!insightId) {
			return res.status(400).json({
				error: "Insight ID is required",
			});
		}

		const updatedInsight = await repository.updateSEOInsight(insightId, {
			isRead,
		});

		if (!updatedInsight) {
			return res.status(404).json({
				error: "Insight not found",
			});
		}

		res.json({
			success: true,
			data: updatedInsight,
		});
	} catch (error) {
		console.error("Mark insight read API error:", error);
		res.status(500).json({
			error: "Failed to mark insight as read",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Dismiss insight
export async function dismissInsight(req: Request, res: Response) {
	try {
		const { insightId } = req.params;

		if (!insightId) {
			return res.status(400).json({
				error: "Insight ID is required",
			});
		}

		const updatedInsight = await repository.updateSEOInsight(insightId, {
			isDismissed: true,
		});

		if (!updatedInsight) {
			return res.status(404).json({
				error: "Insight not found",
			});
		}

		res.json({
			success: true,
			data: updatedInsight,
		});
	} catch (error) {
		console.error("Dismiss insight API error:", error);
		res.status(500).json({
			error: "Failed to dismiss insight",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get SEO opportunities
export async function getSEOOpportunities(req: Request, res: Response) {
	try {
		const { status } = req.query;

		const opportunities = await repository.getSEOOpportunities(
			status as string,
		);

		res.json({
			success: true,
			data: opportunities,
		});
	} catch (error) {
		console.error("Get SEO opportunities API error:", error);
		res.status(500).json({
			error: "Failed to fetch SEO opportunities",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Create SEO opportunity
export async function createSEOOpportunity(req: Request, res: Response) {
	try {
		const {
			type,
			title,
			description,
			estimatedTraffic,
			estimatedValue,
			difficulty,
			timeToResult,
			requirements,
			kpis,
			assignedTo,
			dueDate,
		} = req.body;

		if (!type || !title || !description) {
			return res.status(400).json({
				error: "Type, title, and description are required",
			});
		}

		const opportunity = await repository.createSEOOpportunity({
			type,
			title,
			description,
			estimatedTraffic: estimatedTraffic || 0,
			estimatedValue: estimatedValue || 0,
			difficulty: difficulty || 50,
			timeToResult: timeToResult || 30,
			requirements: requirements || [],
			kpis: kpis || [],
			isTracked: false,
			status: "new",
			assignedTo,
			dueDate: dueDate ? new Date(dueDate) : undefined,
		});

		res.json({
			success: true,
			data: opportunity,
		});
	} catch (error) {
		console.error("Create SEO opportunity API error:", error);
		res.status(500).json({
			error: "Failed to create SEO opportunity",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get page metrics
export async function getPageMetrics(req: Request, res: Response) {
	try {
		const { domain, url } = req.query;

		if (!domain && !url) {
			return res.status(400).json({
				error: "Either domain or URL is required",
			});
		}

		let metrics;
		if (url) {
			metrics = await repository.getSEOMetricsByUrl(url as string);
		} else {
			metrics = await repository.getSEOMetricsByDomain(domain as string);
		}

		res.json({
			success: true,
			data: metrics,
		});
	} catch (error) {
		console.error("Get page metrics API error:", error);
		res.status(500).json({
			error: "Failed to fetch page metrics",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Health check endpoint
export async function healthCheck(_req: Request, res: Response) {
	try {
		// Simple health check - could be expanded to check database connections, etc.
		res.json({
			success: true,
			status: "healthy",
			timestamp: new Date().toISOString(),
			service: "seo-analytics",
		});
	} catch (error) {
		console.error("SEO health check error:", error);
		res.status(500).json({
			success: false,
			status: "unhealthy",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
