/**
 * Server Entry Point
 * Main Express server with all integrations and middleware
 */

import { createClient } from "@supabase/supabase-js";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
// Import API routes
import * as graphAnalytics from "./api/graph/analytics";
import * as influencerMarketing from "./api/influencer-marketing/analytics";
import * as seoAnalytics from "./api/seo/analytics";
import * as visitorTracking from "./api/visitor-tracking/analytics";
import {
	closeNeo4j,
	initializeNeo4j,
	validateNeo4jConfig,
} from "./config/neo4j";
import {
	neo4jDebugMiddleware,
	neo4jErrorHandler,
	neo4jHealthMiddleware,
	neo4jLoggingMiddleware,
	neo4jMiddleware,
	neo4jPerformanceMiddleware,
} from "./middleware/neo4j-middleware";
import { analyticsRouter } from "./routes/analytics";
import { cronRouter } from "./routes/cron";

const app = express();
const PORT = process.env.PORT || 3001;

// Environment validation
const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
	console.error("❌ Missing required environment variables:", missingEnvVars);
	process.exit(1);
}

// Validate Neo4j configuration
const neo4jValidation = validateNeo4jConfig();
if (!neo4jValidation.valid) {
	console.warn("⚠️ Neo4j configuration issues:", neo4jValidation.errors);
	console.warn("Neo4j features will be disabled");
}

// Initialize Supabase client
const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Core middleware
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'"],
				imgSrc: ["'self'", "data:", "https:"],
			},
		},
	}),
);

app.use(compression());

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:3000",
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	}),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
	windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
	max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
	message: {
		error: "Too many requests from this IP, please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

app.use("/api/", limiter);

// Request logging
app.use((req, _res, next) => {
	console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
	next();
});

// Health check endpoint (before Neo4j middleware)
app.get("/health", async (_req, res) => {
	try {
		// Basic health check
		const health = {
			status: "healthy",
			timestamp: new Date().toISOString(),
			services: {
				server: "healthy",
				supabase: "unknown",
				neo4j: "unknown",
			},
		};

		// Check Supabase connection
		try {
			const { error } = await supabase.from("users").select("count").limit(1);
			health.services.supabase = error ? "unhealthy" : "healthy";
		} catch (_error) {
			health.services.supabase = "unhealthy";
		}

		// Check Neo4j connection (only if configured)
		if (neo4jValidation.valid) {
			try {
				const { checkNeo4jHealth } = await import("./config/neo4j");
				const neo4jHealth = await checkNeo4jHealth();
				health.services.neo4j = neo4jHealth.status;
			} catch (_error) {
				health.services.neo4j = "unhealthy";
			}
		} else {
			health.services.neo4j = "disabled";
		}

		// Determine overall status
		const allHealthy = Object.values(health.services).every(
			(status) => status === "healthy" || status === "disabled",
		);

		if (!allHealthy) {
			health.status = "degraded";
		}

		res.status(allHealthy ? 200 : 503).json(health);
	} catch (error) {
		console.error("Health check error:", error);
		res.status(500).json({
			status: "unhealthy",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// Neo4j middleware (conditional based on configuration)
if (neo4jValidation.valid && process.env.ENABLE_NEO4J !== "false") {
	console.log("🔗 Enabling Neo4j middleware");

	// Neo4j-specific middleware
	app.use("/api/graph", neo4jPerformanceMiddleware());
	app.use("/api/graph", neo4jLoggingMiddleware({ logLevel: "info" }));

	if (process.env.NODE_ENV === "development") {
		app.use("/api/graph", neo4jDebugMiddleware());
	}

	// Health check endpoints with lighter middleware
	app.use("/api/graph/health", neo4jHealthMiddleware());

	// Main Neo4j middleware for all other graph endpoints
	app.use(
		"/api/graph",
		neo4jMiddleware({
			autoInitialize: true,
			timeout: 30000,
		}),
	);

	// Graph Analytics API Routes
	app.get("/api/graph/health", graphAnalytics.getGraphHealth);
	app.get("/api/graph/summary", graphAnalytics.getGraphSummary);

	// Product management
	app.post("/api/graph/products", graphAnalytics.createProduct);
	app.get("/api/graph/products/:asin", graphAnalytics.getProduct);
	app.put("/api/graph/products/:asin", graphAnalytics.updateProduct);

	// Customer management
	app.post("/api/graph/customers", graphAnalytics.createCustomer);
	app.post("/api/graph/purchases", graphAnalytics.recordPurchase);
	app.get(
		"/api/graph/customers/:customerId/insights",
		graphAnalytics.getCustomerInsights,
	);

	// Keyword and SEO
	app.post("/api/graph/keywords", graphAnalytics.createKeyword);
	app.post("/api/graph/product-keywords", graphAnalytics.linkProductToKeyword);

	// Competitor analysis
	app.post("/api/graph/competitors", graphAnalytics.createCompetitor);
	app.post("/api/graph/competitor-links", graphAnalytics.linkCompetitors);
	app.get(
		"/api/graph/products/:asin/competitors",
		graphAnalytics.getCompetitiveAnalysis,
	);

	// Recommendations and analytics
	app.get(
		"/api/graph/products/:asin/recommendations",
		graphAnalytics.getProductRecommendations,
	);
	app.get("/api/graph/network-analysis", graphAnalytics.performNetworkAnalysis);

	// Custom queries and data management
	app.post("/api/graph/query", graphAnalytics.runCustomQuery);
	app.post("/api/graph/seed-data", graphAnalytics.seedInitialData);

	if (process.env.NODE_ENV !== "production") {
		app.delete("/api/graph/clear-data", graphAnalytics.clearAllData);
	}

	// Neo4j error handling
	app.use("/api/graph", neo4jErrorHandler());
} else {
	console.log(
		"⚠️ Neo4j middleware disabled due to configuration issues or ENABLE_NEO4J=false",
	);

	// Provide disabled endpoints that return appropriate responses
	app.use("/api/graph/*", (_req, res) => {
		res.status(503).json({
			success: false,
			error: "Graph database features are currently disabled",
			message: "Neo4j is not configured or has been disabled",
		});
	});
}

// Visitor Tracking API Routes
app.get("/api/visitor-tracking/overview", visitorTracking.getVisitorOverview);
app.post("/api/visitor-tracking/sessions", visitorTracking.createSession);
app.post("/api/visitor-tracking/page-views", visitorTracking.trackPageView);
app.post(
	"/api/visitor-tracking/interactions",
	visitorTracking.trackInteraction,
);
app.post("/api/visitor-tracking/leads", visitorTracking.createLead);
app.get("/api/visitor-tracking/leads", visitorTracking.getLeads);
app.get("/api/visitor-tracking/analytics", visitorTracking.getVisitorAnalytics);
app.post(
	"/api/visitor-tracking/follow-up-rules",
	visitorTracking.createFollowUpRule,
);
app.get(
	"/api/visitor-tracking/follow-up-rules",
	visitorTracking.getFollowUpRules,
);
app.post(
	"/api/visitor-tracking/send-follow-up",
	visitorTracking.sendFollowUpEmail,
);

// SEO Analytics API Routes
app.get("/api/seo/overview/:domain", seoAnalytics.getSEOOverview);
app.post("/api/seo/audit", seoAnalytics.runSEOAudit);
app.get("/api/seo/audit/:auditId", seoAnalytics.getAuditStatus);
app.get("/api/seo/audits/:domain", seoAnalytics.getDomainAudits);
app.post("/api/seo/analyze-page", seoAnalytics.analyzePage);
app.get("/api/seo/keywords/:domain", seoAnalytics.getKeywordRankings);
app.post("/api/seo/track-keywords", seoAnalytics.trackKeywords);
app.get("/api/seo/insights", seoAnalytics.getSEOInsights);
app.post("/api/seo/generate-insights", seoAnalytics.generateInsights);
app.patch("/api/seo/insights/:insightId/read", seoAnalytics.markInsightRead);
app.patch("/api/seo/insights/:insightId/dismiss", seoAnalytics.dismissInsight);
app.get("/api/seo/opportunities", seoAnalytics.getSEOOpportunities);
app.post("/api/seo/opportunities", seoAnalytics.createSEOOpportunity);
app.get("/api/seo/metrics", seoAnalytics.getPageMetrics);
app.get("/api/seo/health", seoAnalytics.healthCheck);

// Analytics API Routes
app.use("/api/analytics", analyticsRouter);

// Cron Job Routes
app.use("/api/cron", cronRouter);

// Influencer Marketing API Routes
app.get(
	"/api/influencer-marketing/overview",
	influencerMarketing.getInfluencerOverview,
);
app.post(
	"/api/influencer-marketing/influencers",
	influencerMarketing.createInfluencerProfile,
);
app.get(
	"/api/influencer-marketing/influencers",
	influencerMarketing.getInfluencerProfiles,
);
app.get(
	"/api/influencer-marketing/influencers/:influencerId",
	influencerMarketing.getInfluencerProfile,
);
app.put(
	"/api/influencer-marketing/influencers/:influencerId",
	influencerMarketing.updateInfluencerProfile,
);
app.post(
	"/api/influencer-marketing/discover",
	influencerMarketing.discoverInfluencers,
);
app.get(
	"/api/influencer-marketing/influencers/:influencerId/analytics",
	influencerMarketing.analyzeInfluencer,
);

app.post(
	"/api/influencer-marketing/campaigns",
	influencerMarketing.createInfluencerCampaign,
);
app.get(
	"/api/influencer-marketing/campaigns",
	influencerMarketing.getInfluencerCampaigns,
);
app.get(
	"/api/influencer-marketing/campaigns/:campaignId",
	influencerMarketing.getInfluencerCampaign,
);
app.post(
	"/api/influencer-marketing/campaigns/:campaignId/participants",
	influencerMarketing.addCampaignParticipant,
);
app.get(
	"/api/influencer-marketing/campaigns/:campaignId/brief",
	influencerMarketing.generateCampaignBrief,
);
app.get(
	"/api/influencer-marketing/campaigns/:campaignId/roi",
	influencerMarketing.calculateCampaignROI,
);

app.post(
	"/api/influencer-marketing/outreach",
	influencerMarketing.createInfluencerOutreach,
);
app.get(
	"/api/influencer-marketing/outreach",
	influencerMarketing.getInfluencerOutreach,
);
app.put(
	"/api/influencer-marketing/outreach/:outreachId",
	influencerMarketing.updateInfluencerOutreach,
);
app.post(
	"/api/influencer-marketing/outreach/predict-success",
	influencerMarketing.predictOutreachSuccess,
);

app.post(
	"/api/influencer-marketing/reports",
	influencerMarketing.generatePerformanceReport,
);
app.get(
	"/api/influencer-marketing/top-performers",
	influencerMarketing.getTopPerformingInfluencers,
);
app.get(
	"/api/influencer-marketing/influencers/:influencerId/relationship-score",
	influencerMarketing.calculateRelationshipScore,
);
app.get("/api/influencer-marketing/health", influencerMarketing.healthCheck);

// Generic API health check
app.get("/api/health", (_req, res) => {
	res.json({
		success: true,
		status: "healthy",
		timestamp: new Date().toISOString(),
		service: "ignitabull-server",
	});
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
	res.status(404).json({
		success: false,
		error: "API endpoint not found",
		path: req.path,
	});
});

// Global error handler
app.use(
	(
		error: any,
		req: express.Request,
		res: express.Response,
		_next: express.NextFunction,
	) => {
		console.error("Global error handler:", {
			error: error.message,
			stack: error.stack,
			path: req.path,
			method: req.method,
			timestamp: new Date().toISOString(),
		});

		res.status(error.statusCode || 500).json({
			success: false,
			error: "Internal server error",
			message:
				process.env.NODE_ENV === "development"
					? error.message
					: "Something went wrong",
		});
	},
);

// Graceful shutdown handling
async function gracefulShutdown(signal: string) {
	console.log(`\n${signal} received. Starting graceful shutdown...`);

	try {
		// Close Neo4j connection if it was initialized
		if (neo4jValidation.valid) {
			await closeNeo4j();
			console.log("✅ Neo4j connection closed");
		}

		console.log("✅ Graceful shutdown completed");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error during graceful shutdown:", error);
		process.exit(1);
	}
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
async function startServer() {
	try {
		// Initialize Neo4j if configured
		if (neo4jValidation.valid && process.env.ENABLE_NEO4J !== "false") {
			try {
				console.log("🔗 Initializing Neo4j connection...");
				await initializeNeo4j();
				console.log("✅ Neo4j connection established");
			} catch (error) {
				console.warn(
					"⚠️ Neo4j initialization failed, continuing without graph features:",
					error.message,
				);
			}
		}

		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
			console.log(`📊 Health check: http://localhost:${PORT}/health`);
			console.log(`🔗 API docs: http://localhost:${PORT}/api/health`);

			if (neo4jValidation.valid && process.env.ENABLE_NEO4J !== "false") {
				console.log(
					`📈 Graph analytics: http://localhost:${PORT}/api/graph/health`,
				);
			}
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error);
		process.exit(1);
	}
}

startServer();
