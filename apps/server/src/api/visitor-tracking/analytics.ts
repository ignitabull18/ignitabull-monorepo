/**
 * Visitor Tracking Analytics API
 * RESTful endpoints for visitor analytics and follow-up management
 */

import type { Request, Response } from "express";
import AutomatedFollowUpService from "../../services/automated-follow-up";
import VisitorTrackingRepository from "../../services/visitor-tracking-repository";

const repository = new VisitorTrackingRepository();
const followUpService = new AutomatedFollowUpService();

// Get visitor analytics for a date range
export async function getAnalytics(req: Request, res: Response) {
	try {
		const { startDate, endDate } = req.query;

		if (!startDate || !endDate) {
			return res.status(400).json({
				error: "Start date and end date are required",
			});
		}

		const start = new Date(startDate as string);
		const end = new Date(endDate as string);

		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
			return res.status(400).json({
				error: "Invalid date format",
			});
		}

		const analytics = await repository.getVisitorAnalytics(start, end);

		res.json({
			success: true,
			data: analytics,
			dateRange: { startDate: start, endDate: end },
		});
	} catch (error) {
		console.error("Analytics API error:", error);
		res.status(500).json({
			error: "Failed to fetch analytics",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Create a new visitor session
export async function createSession(req: Request, res: Response) {
	try {
		const { sessionId, userId, ipAddress, userAgent, referrer, utm, url } =
			req.body;

		if (!sessionId || !ipAddress || !userAgent) {
			return res.status(400).json({
				error: "Session ID, IP address, and user agent are required",
			});
		}

		const _context = {
			ip: ipAddress,
			userAgent,
			url: url || req.get("Referer") || "",
			referrer,
			utm,
		};

		// This would use the actual tracking service
		// For now, create session directly via repository
		const sessionData = {
			sessionId,
			userId,
			anonymousId: userId
				? undefined
				: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			ipAddress,
			userAgent,
			referrer,
			utmSource: utm?.source,
			utmMedium: utm?.medium,
			utmCampaign: utm?.campaign,
			utmTerm: utm?.term,
			utmContent: utm?.content,
			deviceType: "desktop" as const, // Would parse from user agent
			isBot: false, // Would detect from user agent
			startTime: new Date(),
			pageViews: 0,
			isReturning: false, // Would check based on IP/user
			lastActiveAt: new Date(),
		};

		const session = await repository.createSession(sessionData);

		res.json({
			success: true,
			data: session,
		});
	} catch (error) {
		console.error("Create session API error:", error);
		res.status(500).json({
			error: "Failed to create session",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Track a page view
export async function trackPageView(req: Request, res: Response) {
	try {
		const { sessionId, url, path, title, referrer } = req.body;

		if (!sessionId || !url || !path) {
			return res.status(400).json({
				error: "Session ID, URL, and path are required",
			});
		}

		// Get session to validate it exists
		const session = await repository.getSession(sessionId);
		if (!session) {
			return res.status(404).json({
				error: "Session not found",
			});
		}

		const pageViewData = {
			sessionId,
			userId: session.userId,
			url,
			path,
			title,
			referrer,
			timestamp: new Date(),
			exitPage: false,
			entryPage: session.pageViews === 0,
			hasForm: false, // Would detect from page content
			hasVideo: false, // Would detect from page content
		};

		const pageView = await repository.createPageView(pageViewData);

		// Update session page view count
		await repository.updateSession(sessionId, {
			pageViews: session.pageViews + 1,
			lastActiveAt: new Date(),
		});

		res.json({
			success: true,
			data: pageView,
		});
	} catch (error) {
		console.error("Track page view API error:", error);
		res.status(500).json({
			error: "Failed to track page view",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Track a visitor interaction
export async function trackInteraction(req: Request, res: Response) {
	try {
		const {
			sessionId,
			type,
			element,
			elementId,
			elementClass,
			value,
			url,
			coordinates,
		} = req.body;

		if (!sessionId || !type || !url) {
			return res.status(400).json({
				error: "Session ID, type, and URL are required",
			});
		}

		const validTypes = [
			"click",
			"form_submit",
			"download",
			"video_play",
			"scroll",
			"hover",
			"search",
			"share",
			"comment",
		];
		if (!validTypes.includes(type)) {
			return res.status(400).json({
				error: `Invalid interaction type. Must be one of: ${validTypes.join(", ")}`,
			});
		}

		// Get session to validate it exists
		const session = await repository.getSession(sessionId);
		if (!session) {
			return res.status(404).json({
				error: "Session not found",
			});
		}

		const interactionData = {
			sessionId,
			userId: session.userId,
			type,
			element,
			elementId,
			elementClass,
			value,
			url,
			timestamp: new Date(),
			coordinates,
		};

		const interaction = await repository.createInteraction(interactionData);

		res.json({
			success: true,
			data: interaction,
		});
	} catch (error) {
		console.error("Track interaction API error:", error);
		res.status(500).json({
			error: "Failed to track interaction",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Create a lead from form submission
export async function createLead(req: Request, res: Response) {
	try {
		const {
			sessionId,
			email,
			firstName,
			lastName,
			company,
			phone,
			jobTitle,
			industry,
			source,
			medium,
			campaign,
			formUrl,
			formType,
			customFields,
		} = req.body;

		if (!sessionId || !formUrl) {
			return res.status(400).json({
				error: "Session ID and form URL are required",
			});
		}

		// Get session to validate it exists and calculate score
		const session = await repository.getSession(sessionId);
		if (!session) {
			return res.status(404).json({
				error: "Session not found",
			});
		}

		// Calculate lead score based on session behavior
		let leadScore = 50; // Base score
		leadScore += Math.min(session.pageViews * 2, 20); // Up to 20 points for page views
		if (session.duration) {
			leadScore += Math.min((session.duration / 60000) * 5, 30); // Up to 30 points for time on site
		}
		if (company) leadScore += 10;
		if (phone) leadScore += 5;
		if (session.utmSource === "google") leadScore += 10;

		leadScore = Math.min(Math.max(leadScore, 0), 100); // Clamp between 0-100

		const leadData = {
			sessionId,
			userId: session.userId,
			email,
			firstName,
			lastName,
			company,
			phone,
			jobTitle,
			industry,
			leadScore,
			source: source || session.utmSource || "direct",
			medium: medium || session.utmMedium,
			campaign: campaign || session.utmCampaign,
			formUrl,
			formType: formType || "contact",
			status: "new" as const,
			customFields,
		};

		const lead = await repository.createLead(leadData);

		// Process automated follow-ups
		await followUpService.processNewLead(lead);

		res.json({
			success: true,
			data: lead,
		});
	} catch (error) {
		console.error("Create lead API error:", error);
		res.status(500).json({
			error: "Failed to create lead",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get leads with filtering and pagination
export async function getLeads(req: Request, res: Response) {
	try {
		const {
			status,
			source,
			startDate,
			endDate,
			minScore,
			maxScore,
			page = 1,
			limit = 50,
		} = req.query;

		let leads;

		if (status) {
			leads = await repository.getLeadsByStatus(status as string);
		} else if (startDate && endDate) {
			const start = new Date(startDate as string);
			const end = new Date(endDate as string);
			leads = await repository.getLeadsInRange(start, end);
		} else {
			// Get recent leads (last 30 days)
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			leads = await repository.getLeadsInRange(thirtyDaysAgo, new Date());
		}

		// Apply additional filters
		if (source) {
			leads = leads.filter((lead) => lead.source === source);
		}

		if (minScore || maxScore) {
			leads = leads.filter((lead) => {
				if (minScore && lead.leadScore < Number.parseInt(minScore as string))
					return false;
				if (maxScore && lead.leadScore > Number.parseInt(maxScore as string))
					return false;
				return true;
			});
		}

		// Pagination
		const pageNum = Number.parseInt(page as string);
		const limitNum = Number.parseInt(limit as string);
		const startIndex = (pageNum - 1) * limitNum;
		const paginatedLeads = leads.slice(startIndex, startIndex + limitNum);

		res.json({
			success: true,
			data: paginatedLeads,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total: leads.length,
				totalPages: Math.ceil(leads.length / limitNum),
			},
		});
	} catch (error) {
		console.error("Get leads API error:", error);
		res.status(500).json({
			error: "Failed to fetch leads",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Update a lead
export async function updateLead(req: Request, res: Response) {
	try {
		const { leadId } = req.params;
		const updates = req.body;

		if (!leadId) {
			return res.status(400).json({
				error: "Lead ID is required",
			});
		}

		const updatedLead = await repository.updateLead(leadId, updates);

		if (!updatedLead) {
			return res.status(404).json({
				error: "Lead not found",
			});
		}

		res.json({
			success: true,
			data: updatedLead,
		});
	} catch (error) {
		console.error("Update lead API error:", error);
		res.status(500).json({
			error: "Failed to update lead",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get follow-up rules
export async function getFollowUpRules(_req: Request, res: Response) {
	try {
		const rules = await repository.getFollowUpRules();

		res.json({
			success: true,
			data: rules,
		});
	} catch (error) {
		console.error("Get follow-up rules API error:", error);
		res.status(500).json({
			error: "Failed to fetch follow-up rules",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Create a follow-up rule
export async function createFollowUpRule(req: Request, res: Response) {
	try {
		const {
			name,
			description,
			isActive = true,
			priority = 1,
			triggers,
			conditions = [],
			actions,
			delay = 0,
			maxExecutions,
		} = req.body;

		if (!name || !triggers || !actions) {
			return res.status(400).json({
				error: "Name, triggers, and actions are required",
			});
		}

		if (!Array.isArray(triggers) || !Array.isArray(actions)) {
			return res.status(400).json({
				error: "Triggers and actions must be arrays",
			});
		}

		const ruleData = {
			name,
			description,
			isActive,
			priority,
			triggers,
			conditions,
			actions,
			delay,
			maxExecutions,
		};

		const rule = await repository.createFollowUpRule(ruleData);

		res.json({
			success: true,
			data: rule,
		});
	} catch (error) {
		console.error("Create follow-up rule API error:", error);
		res.status(500).json({
			error: "Failed to create follow-up rule",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get visitor segments
export async function getVisitorSegments(_req: Request, res: Response) {
	try {
		const segments = await repository.getVisitorSegments();

		res.json({
			success: true,
			data: segments,
		});
	} catch (error) {
		console.error("Get visitor segments API error:", error);
		res.status(500).json({
			error: "Failed to fetch visitor segments",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get session insights
export async function getSessionInsights(req: Request, res: Response) {
	try {
		const { sessionId } = req.params;

		if (!sessionId) {
			return res.status(400).json({
				error: "Session ID is required",
			});
		}

		const insights = await repository.getSessionInsights(sessionId);

		res.json({
			success: true,
			data: insights,
		});
	} catch (error) {
		console.error("Get session insights API error:", error);
		res.status(500).json({
			error: "Failed to fetch session insights",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// End a visitor session
export async function endSession(req: Request, res: Response) {
	try {
		const { sessionId } = req.params;

		if (!sessionId) {
			return res.status(400).json({
				error: "Session ID is required",
			});
		}

		const session = await repository.getSession(sessionId);
		if (!session) {
			return res.status(404).json({
				error: "Session not found",
			});
		}

		const endTime = new Date();
		const duration = endTime.getTime() - session.startTime.getTime();

		const updatedSession = await repository.updateSession(sessionId, {
			endTime,
			duration,
			bounceRate: session.pageViews <= 1 ? 100 : 0,
		});

		res.json({
			success: true,
			data: updatedSession,
		});
	} catch (error) {
		console.error("End session API error:", error);
		res.status(500).json({
			error: "Failed to end session",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Health check endpoint
export async function healthCheck(_req: Request, res: Response) {
	try {
		const activeSessionsCount = await repository.getActiveSessionsCount();

		res.json({
			success: true,
			status: "healthy",
			data: {
				activeSessions: activeSessionsCount,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("Visitor tracking health check error:", error);
		res.status(500).json({
			success: false,
			status: "unhealthy",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
