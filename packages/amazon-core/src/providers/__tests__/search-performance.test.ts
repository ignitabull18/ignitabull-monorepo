/**
 * Search Performance Provider tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AmazonAPIError } from "../../errors/api";
import type { AuthConfig, ProviderConfig } from "../../types/provider";
import {
	createSearchPerformanceProvider,
	type SearchPerformanceProvider,
} from "../search-performance";

describe("SearchPerformanceProvider", () => {
	let provider: SearchPerformanceProvider;
	const config: ProviderConfig & { auth: AuthConfig } = {
		providerId: "search-performance",
		name: "Amazon Search Performance Analytics",
		version: "1.0",
		auth: {
			type: "oauth",
			clientId: "test-client",
			clientSecret: "test-secret",
			refreshToken: "test-refresh",
		},
		rateLimit: {
			maxRequests: 10,
			windowMs: 1000,
		},
		retry: {
			maxRetries: 3,
			baseDelay: 100,
			maxDelay: 1000,
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		provider = createSearchPerformanceProvider(config);
	});

	describe("initialization", () => {
		it("should initialize provider", async () => {
			await provider.initialize();
			const health = await provider.healthCheck();
			expect(health).toBe(true);
		});

		it("should return provider metadata", () => {
			expect(provider.providerId).toBe("search-performance");
			expect(provider.name).toBe("Amazon Search Performance Analytics");
			expect(provider.version).toBe("1.0");
		});

		it("should return rate limit config", () => {
			const rateLimit = provider.getRateLimit();
			expect(rateLimit.maxRequests).toBe(10);
			expect(rateLimit.windowMs).toBe(1000);
		});
	});

	describe("getSearchQueryMetrics", () => {
		it("should return search query metrics", async () => {
			const metrics = await provider.getSearchQueryMetrics(
				"B001234567",
				{ startDate: "2024-01-01", endDate: "2024-01-31" },
				"ATVPDKIKX0DER",
			);

			expect(metrics).toHaveLength(3);
			expect(metrics[0]).toHaveProperty("query");
			expect(metrics[0]).toHaveProperty("impressions");
			expect(metrics[0]).toHaveProperty("clicks");
			expect(metrics[0]).toHaveProperty("clickThroughRate");
			expect(metrics[0]).toHaveProperty("conversionRate");
			expect(metrics[0]).toHaveProperty("revenue");
			expect(metrics[0]).toHaveProperty("searchFrequencyRank");
		});

		it("should cache search query metrics", async () => {
			// First call
			const metrics1 = await provider.getSearchQueryMetrics(
				"B001234567",
				{ startDate: "2024-01-01", endDate: "2024-01-31" },
				"ATVPDKIKX0DER",
			);

			// Second call (should use cache)
			const start = Date.now();
			const metrics2 = await provider.getSearchQueryMetrics(
				"B001234567",
				{ startDate: "2024-01-01", endDate: "2024-01-31" },
				"ATVPDKIKX0DER",
			);
			const duration = Date.now() - start;

			expect(metrics2).toEqual(metrics1);
			expect(duration).toBeLessThan(50); // Should be fast due to cache
		});
	});

	describe("getSearchTermTrends", () => {
		it("should return search term trends", async () => {
			const trends = await provider.getSearchTermTrends(
				["wireless earbuds", "bluetooth headphones"],
				"2024-01",
				"ATVPDKIKX0DER",
			);

			expect(trends).toHaveLength(2);
			expect(trends[0]).toHaveProperty("searchTerm");
			expect(trends[0]).toHaveProperty("period");
			expect(trends[0]).toHaveProperty("metrics");
			expect(trends[0]).toHaveProperty("trendDirection");
			expect(trends[0]).toHaveProperty("growthRate");
			expect(trends[0]).toHaveProperty("seasonalityIndex");
		});

		it("should calculate trend direction correctly", async () => {
			const trends = await provider.getSearchTermTrends(
				["test keyword"],
				"2024-01",
				"ATVPDKIKX0DER",
			);

			expect(["RISING", "FALLING", "STABLE"]).toContain(
				trends[0].trendDirection,
			);
		});
	});

	describe("getKeywordRankings", () => {
		it("should return keyword rankings", async () => {
			const rankings = await provider.getKeywordRankings(
				"B001234567",
				["wireless earbuds", "bluetooth headphones", "noise cancelling"],
				"ATVPDKIKX0DER",
			);

			expect(rankings).toHaveLength(3);
			rankings.forEach((ranking) => {
				expect(ranking).toHaveProperty("keyword");
				expect(ranking).toHaveProperty("asin");
				expect(ranking).toHaveProperty("currentRank");
				expect(ranking).toHaveProperty("previousRank");
				expect(ranking).toHaveProperty("rankChange");
				expect(ranking).toHaveProperty("isOrganic");
				expect(ranking).toHaveProperty("isSponsored");
				expect(ranking).toHaveProperty("competitorCount");
				expect(ranking).toHaveProperty("shareOfVoice");
			});
		});

		it("should calculate rank changes correctly", async () => {
			const rankings = await provider.getKeywordRankings(
				"B001234567",
				["test keyword"],
				"ATVPDKIKX0DER",
			);

			const ranking = rankings[0];
			expect(ranking.rankChange).toBe(
				ranking.previousRank - ranking.currentRank,
			);
		});
	});

	describe("getSearchVisibilityScore", () => {
		it("should return search visibility score", async () => {
			const score = await provider.getSearchVisibilityScore(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			expect(score.overallScore).toBeGreaterThanOrEqual(0);
			expect(score.overallScore).toBeLessThanOrEqual(100);
			expect(score.components).toHaveProperty("organicVisibility");
			expect(score.components).toHaveProperty("sponsoredVisibility");
			expect(score.components).toHaveProperty("brandedSearches");
			expect(score.components).toHaveProperty("nonBrandedSearches");
			expect(score.components).toHaveProperty("categoryVisibility");
			expect(score.benchmarks).toHaveProperty("categoryAverage");
			expect(score.benchmarks).toHaveProperty("topCompetitor");
			expect(score.benchmarks).toHaveProperty("industryLeader");
		});

		it("should cache visibility scores", async () => {
			// First call
			await provider.getSearchVisibilityScore("B001234567", "ATVPDKIKX0DER");

			// Second call (should use cache)
			const start = Date.now();
			await provider.getSearchVisibilityScore("B001234567", "ATVPDKIKX0DER");
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(10);
		});
	});

	describe("analyzeCompetitors", () => {
		it("should analyze competitor search performance", async () => {
			const analyses = await provider.analyzeCompetitors(
				"B001234567",
				["B002345678", "B003456789"],
				"ATVPDKIKX0DER",
			);

			expect(analyses).toHaveLength(2);
			analyses.forEach((analysis) => {
				expect(analysis).toHaveProperty("competitorAsin");
				expect(analysis).toHaveProperty("competitorBrand");
				expect(analysis).toHaveProperty("sharedKeywords");
				expect(analysis).toHaveProperty("exclusiveKeywords");
				expect(analysis).toHaveProperty("rankingComparison");
				expect(analysis).toHaveProperty("overlapScore");
				expect(analysis).toHaveProperty("threatLevel");
			});
		});

		it("should identify keyword advantages correctly", async () => {
			const analyses = await provider.analyzeCompetitors(
				"B001234567",
				["B002345678"],
				"ATVPDKIKX0DER",
			);

			const comparison = analyses[0].rankingComparison[0];
			if (comparison.yourRank < comparison.competitorRank) {
				expect(comparison.advantage).toBe("YOU");
			} else if (comparison.yourRank > comparison.competitorRank) {
				expect(comparison.advantage).toBe("COMPETITOR");
			}
		});
	});

	describe("analyzeSearchIntent", () => {
		it("should analyze search intent", async () => {
			const intents = await provider.analyzeSearchIntent(
				["best wireless earbuds", "cheap bluetooth headphones", "Sony vs Bose"],
				"ATVPDKIKX0DER",
			);

			expect(intents).toHaveLength(3);
			intents.forEach((intent) => {
				expect(intent).toHaveProperty("query");
				expect(intent).toHaveProperty("primaryIntent");
				expect(intent).toHaveProperty("intentConfidence");
				expect(intent).toHaveProperty("relatedIntents");
				expect(intent).toHaveProperty("suggestedOptimizations");
			});
		});

		it("should identify transactional intent correctly", async () => {
			const intents = await provider.analyzeSearchIntent(
				["cheap wireless earbuds", "best price headphones"],
				"ATVPDKIKX0DER",
			);

			intents.forEach((intent) => {
				expect(intent.primaryIntent).toBe("TRANSACTIONAL");
			});
		});
	});

	describe("findLongTailOpportunities", () => {
		it("should find long-tail keyword opportunities", async () => {
			const opportunities = await provider.findLongTailOpportunities(
				["wireless earbuds"],
				"ATVPDKIKX0DER",
			);

			expect(opportunities.length).toBeGreaterThan(0);
			opportunities.forEach((opp) => {
				expect(opp).toHaveProperty("keyword");
				expect(opp).toHaveProperty("searchVolume");
				expect(opp).toHaveProperty("competition");
				expect(opp).toHaveProperty("estimatedTraffic");
				expect(opp).toHaveProperty("conversionPotential");
				expect(opp).toHaveProperty("relevanceScore");
			});
		});

		it("should sort opportunities by score", async () => {
			const opportunities = await provider.findLongTailOpportunities(
				["headphones"],
				"ATVPDKIKX0DER",
			);

			// Verify descending order by opportunity score
			for (let i = 1; i < opportunities.length; i++) {
				const scoreA =
					(opportunities[i - 1].searchVolume *
						opportunities[i - 1].conversionPotential) /
					(opportunities[i - 1].competition === "HIGH"
						? 3
						: opportunities[i - 1].competition === "MEDIUM"
							? 2
							: 1);
				const scoreB =
					(opportunities[i].searchVolume *
						opportunities[i].conversionPotential) /
					(opportunities[i].competition === "HIGH"
						? 3
						: opportunities[i].competition === "MEDIUM"
							? 2
							: 1);
				expect(scoreA).toBeGreaterThanOrEqual(scoreB);
			}
		});
	});

	describe("analyzeAutocomplete", () => {
		it("should analyze autocomplete suggestions", async () => {
			const analyses = await provider.analyzeAutocomplete(
				["wireless", "bluetooth"],
				"ATVPDKIKX0DER",
			);

			expect(analyses).toHaveLength(2);
			analyses.forEach((analysis) => {
				expect(analysis).toHaveProperty("seedTerm");
				expect(analysis).toHaveProperty("suggestions");
				expect(analysis).toHaveProperty("brandPresence");
				expect(analysis).toHaveProperty("opportunities");
				expect(analysis.suggestions.length).toBeGreaterThan(0);
			});
		});
	});

	describe("generateSearchPerformanceReport", () => {
		it("should generate comprehensive search performance report", async () => {
			const report = await provider.generateSearchPerformanceReport(
				"B001234567",
				{ startDate: "2024-01-01", endDate: "2024-01-31" },
				"ATVPDKIKX0DER",
			);

			expect(report).toHaveProperty("reportId");
			expect(report).toHaveProperty("dateRange");
			expect(report).toHaveProperty("summary");
			expect(report.summary).toHaveProperty("totalImpressions");
			expect(report.summary).toHaveProperty("totalClicks");
			expect(report.summary).toHaveProperty("averageCTR");
			expect(report.summary).toHaveProperty("topSearchTerms");
			expect(report.summary).toHaveProperty("searchVisibilityScore");
			expect(report).toHaveProperty("searchTerms");
			expect(report).toHaveProperty("rankings");
		});
	});

	describe("getSEORecommendations", () => {
		it("should return SEO recommendations", async () => {
			const recommendations = await provider.getSEORecommendations(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			expect(recommendations.length).toBeGreaterThan(0);
			recommendations.forEach((rec) => {
				expect(rec).toHaveProperty("type");
				expect(rec).toHaveProperty("priority");
				expect(rec).toHaveProperty("currentState");
				expect(rec).toHaveProperty("recommendation");
				expect(rec).toHaveProperty("expectedImpact");
				expect(rec).toHaveProperty("implementation");
			});
		});

		it("should prioritize recommendations correctly", async () => {
			const recommendations = await provider.getSEORecommendations(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			const priorities = recommendations.map((r) => r.priority);
			expect(priorities).toContain("HIGH");
			expect(priorities).toContain("MEDIUM");
		});
	});

	describe("getListingQualityScore", () => {
		it("should return listing quality score", async () => {
			const score = await provider.getListingQualityScore(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			expect(score.asin).toBe("B001234567");
			expect(score.overallScore).toBeGreaterThanOrEqual(0);
			expect(score.overallScore).toBeLessThanOrEqual(100);
			expect(score.components).toHaveProperty("titleOptimization");
			expect(score.components).toHaveProperty("bulletPoints");
			expect(score.components).toHaveProperty("images");
			expect(score.competitiveAnalysis).toHaveProperty("categoryAverageScore");
			expect(score.recommendations.length).toBeGreaterThan(0);
		});
	});

	describe("detectSearchAnomalies", () => {
		it("should detect search anomalies", async () => {
			const anomalies = await provider.detectSearchAnomalies(
				"B001234567",
				{ startDate: "2024-01-01", endDate: "2024-01-31" },
				"ATVPDKIKX0DER",
			);

			expect(anomalies.length).toBeGreaterThan(0);
			anomalies.forEach((anomaly) => {
				expect(anomaly).toHaveProperty("type");
				expect(anomaly).toHaveProperty("severity");
				expect(anomaly).toHaveProperty("detectedDate");
				expect(anomaly).toHaveProperty("affectedKeywords");
				expect(anomaly).toHaveProperty("impact");
				expect(anomaly).toHaveProperty("possibleCauses");
				expect(anomaly).toHaveProperty("recommendedActions");
			});
		});
	});

	describe("analyzeVoiceSearchOptimization", () => {
		it("should analyze voice search optimization", async () => {
			const optimizations = await provider.analyzeVoiceSearchOptimization(
				"B001234567",
				"ATVPDKIKX0DER",
			);

			expect(optimizations.length).toBeGreaterThan(0);
			optimizations.forEach((opt) => {
				expect(opt).toHaveProperty("query");
				expect(opt).toHaveProperty("isVoiceOptimized");
				expect(opt).toHaveProperty("naturalLanguageScore");
				expect(opt).toHaveProperty("conversationalKeywords");
				expect(opt).toHaveProperty("recommendations");
			});
		});
	});

	describe("getMobileSearchPerformance", () => {
		it("should return mobile search performance", async () => {
			const performance = await provider.getMobileSearchPerformance(
				"B001234567",
				{ startDate: "2024-01-01", endDate: "2024-01-31" },
				"ATVPDKIKX0DER",
			);

			expect(performance).toHaveProperty("mobileImpressions");
			expect(performance).toHaveProperty("mobileClicks");
			expect(performance).toHaveProperty("mobileCTR");
			expect(performance).toHaveProperty("mobileConversionRate");
			expect(performance).toHaveProperty("mobileVsDesktopRatio");
			expect(performance).toHaveProperty("mobileSpecificIssues");
			expect(performance).toHaveProperty("mobileOptimizations");
		});
	});

	describe("analyzeSeasonality", () => {
		it("should analyze keyword seasonality", async () => {
			const analyses = await provider.analyzeSeasonality(
				["christmas gift earbuds", "summer headphones"],
				"ATVPDKIKX0DER",
			);

			expect(analyses).toHaveLength(2);
			analyses.forEach((analysis) => {
				expect(analysis).toHaveProperty("keyword");
				expect(analysis).toHaveProperty("seasonalPattern");
				expect(analysis).toHaveProperty("peakMonths");
				expect(analysis).toHaveProperty("lowMonths");
				expect(analysis).toHaveProperty("yearOverYearGrowth");
				expect(analysis).toHaveProperty("forecastedTrend");
				expect(analysis).toHaveProperty("preparationRecommendations");
			});
		});
	});

	describe("analyzeBrandSearch", () => {
		it("should analyze brand search performance", async () => {
			const analysis = await provider.analyzeBrandSearch(
				"TestBrand",
				"ATVPDKIKX0DER",
			);

			expect(analysis.brandName).toBe("TestBrand");
			expect(analysis).toHaveProperty("brandedSearchVolume");
			expect(analysis).toHaveProperty("brandedVsNonBranded");
			expect(analysis).toHaveProperty("brandSentiment");
			expect(analysis).toHaveProperty("competitorBrandSearches");
			expect(analysis).toHaveProperty("brandProtection");
		});
	});

	describe("detectCannibalization", () => {
		it("should detect search cannibalization", async () => {
			const analyses = await provider.detectCannibalization(
				["wireless earbuds"],
				"ATVPDKIKX0DER",
			);

			expect(analyses.length).toBeGreaterThan(0);
			analyses.forEach((analysis) => {
				expect(analysis).toHaveProperty("keyword");
				expect(analysis).toHaveProperty("cannibalizedProducts");
				expect(analysis).toHaveProperty("impactAssessment");
				expect(analysis).toHaveProperty("recommendations");
			});
		});
	});

	describe("getInternationalPerformance", () => {
		it("should return international search performance", async () => {
			const performances = await provider.getInternationalPerformance(
				"B001234567",
				["US", "UK", "DE", "JP"],
			);

			expect(performances).toHaveLength(4);
			performances.forEach((perf) => {
				expect(perf).toHaveProperty("marketplace");
				expect(perf).toHaveProperty("language");
				expect(perf).toHaveProperty("localizedKeywords");
				expect(perf).toHaveProperty("performanceMetrics");
				expect(perf).toHaveProperty("localizationScore");
				expect(perf).toHaveProperty("culturalRelevance");
				expect(perf).toHaveProperty("recommendations");
			});
		});

		it("should provide localized keywords for each marketplace", async () => {
			const performances = await provider.getInternationalPerformance(
				"B001234567",
				["US", "DE"],
			);

			const usPerf = performances.find((p) => p.marketplace === "US");
			const dePerf = performances.find((p) => p.marketplace === "DE");

			expect(usPerf?.language).toBe("en-US");
			expect(dePerf?.language).toBe("de-DE");
			expect(dePerf?.localizedKeywords[0]).toContain("kopfhörer");
		});
	});

	describe("getSearchAttribution", () => {
		it("should return search attribution model", async () => {
			const attribution = await provider.getSearchAttribution(
				"B001234567",
				"7d",
				"ATVPDKIKX0DER",
			);

			expect(attribution.attributionWindow).toBe("7d");
			expect(attribution).toHaveProperty("touchpoints");
			expect(attribution).toHaveProperty("attributedRevenue");
			expect(attribution).toHaveProperty("attributedUnits");
			expect(attribution).toHaveProperty("pathAnalysis");
			expect(attribution.touchpoints.length).toBeGreaterThan(0);
		});

		it("should track complete customer journey", async () => {
			const attribution = await provider.getSearchAttribution(
				"B001234567",
				"14d",
				"ATVPDKIKX0DER",
			);

			const actions = attribution.touchpoints.map((t) => t.action);
			expect(actions).toContain("IMPRESSION");
			expect(actions).toContain("CLICK");
			expect(actions).toContain("PURCHASE");
		});
	});

	describe("configuration", () => {
		it("should update and retrieve configuration", async () => {
			const newConfig = {
				trackingEnabled: false,
				updateFrequency: "HOURLY" as const,
				competitorTracking: ["B002345678", "B003456789"],
			};

			await provider.updateConfig(newConfig);
			const config = await provider.getConfig();

			expect(config.trackingEnabled).toBe(false);
			expect(config.updateFrequency).toBe("HOURLY");
			expect(config.competitorTracking).toEqual(["B002345678", "B003456789"]);
		});
	});

	describe("error handling", () => {
		it("should handle API errors gracefully", async () => {
			// Force an error by using invalid data
			const invalidProvider = createSearchPerformanceProvider({
				...config,
				retry: { maxRetries: 0, baseDelay: 0, maxDelay: 0 },
			});

			// Mock to force error
			vi.spyOn(Math, "random").mockReturnValueOnce(0.01); // Force error condition

			await expect(
				invalidProvider.getSearchQueryMetrics(
					"INVALID",
					{ startDate: "", endDate: "" },
					"",
				),
			).rejects.toThrow(AmazonAPIError);
		});
	});

	describe("rate limiting", () => {
		it("should respect rate limits", async () => {
			const promises = [];
			const startTime = Date.now();

			// Try to make 15 requests (more than the limit of 10)
			for (let i = 0; i < 15; i++) {
				promises.push(
					provider.getKeywordRankings(`B00${i}`, ["test"], "ATVPDKIKX0DER"),
				);
			}

			await Promise.all(promises);
			const duration = Date.now() - startTime;

			// Should take more than 1 second due to rate limiting
			expect(duration).toBeGreaterThan(1000);
		});
	});
});
