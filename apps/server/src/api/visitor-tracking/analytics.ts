/**
 * Visitor Tracking API
 * RESTful endpoints for website visitor analytics and CRM
 */

import type { Request, Response } from "express";
import { VisitorTrackingService } from "@ignitabull/core";
import AutomatedFollowUpService from "../../services/automated-follow-up";
import VisitorTrackingRepository from "../../services/visitor-tracking-repository";

const repository = new VisitorTrackingRepository();
const followUpService = new AutomatedFollowUpService();
const trackingService = new VisitorTrackingService({
	domain: "ignitabull.com",
	crawlDepth: 2,
	maxPages: 50,
	includeSubdomains: false,
	respectRobotsTxt: true,
	userAgent: "Ignitabull-Visitor-Bot/1.0",
	timeout: 30000,
	concurrency: 3,
	delays: { minDelay: 1000, maxDelay: 2000 },
});

// Get visitor overview dashboard data
export async function getVisitorOverview(_req: Request, res: Response) {
	try {
		const [
			totalVisitors,
			uniqueVisitors,
			activeSessions,
			conversionRate,
			recentActivity,
		] = await Promise.all([
			repository.getTotalVisitorsCount(),
			repository.getUniqueVisitorsCount(),
			repository.getActiveSessionsCount(),
			repository.getConversionRate(),
			repository.getRecentActivity(),
		]);

		res.json({
			success: true,
			data: {
				totalVisitors,
				uniqueVisitors,
				activeSessions,
				conversionRate,
				recentActivity,
			},
		});
	} catch (error) {
		console.error("Failed to get visitor overview:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get visitor overview",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get visitor analytics
export async function getVisitorAnalytics(req: Request, res: Response) {
	try {
		const { startDate, endDate, groupBy = "day" } = req.query;

		const analytics = await repository.getVisitorAnalytics({
			startDate: startDate ? new Date(startDate as string) : undefined,
			endDate: endDate ? new Date(endDate as string) : undefined,
			groupBy: groupBy as "hour" | "day" | "week" | "month",
		});

		res.json({
			success: true,
			data: analytics,
		});
	} catch (error) {
		console.error("Failed to get visitor analytics:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get analytics",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Create visitor session
export async function createSession(req: Request, res: Response) {
	try {
		const {
			visitorId,
			ipAddress,
			userAgent,
			referrer,
			utmSource,
			utmMedium,
			utmCampaign,
		} = req.body;

		const session = await repository.createSession({
			visitorId,
			ipAddress,
			userAgent,
			referrer,
			utmSource,
			utmMedium,
			utmCampaign,
		});

		res.status(201).json({
			success: true,
			data: session,
		});
	} catch (error) {
		console.error("Failed to create session:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create session",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Track page view
export async function trackPageView(req: Request, res: Response) {
	try {
		const { sessionId, pageUrl, pageTitle, duration } = req.body;

		const pageView = await repository.trackPageView({
			sessionId,
			pageUrl,
			pageTitle,
			duration,
		});

		res.status(201).json({
			success: true,
			data: pageView,
		});
	} catch (error) {
		console.error("Failed to track page view:", error);
		res.status(500).json({
			success: false,
			error: "Failed to track page view",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Track interaction
export async function trackInteraction(req: Request, res: Response) {
	try {
		const { sessionId, type, element, metadata } = req.body;

		const interaction = await repository.trackInteraction({
			sessionId,
			type,
			element,
			metadata,
		});

		res.status(201).json({
			success: true,
			data: interaction,
		});
	} catch (error) {
		console.error("Failed to track interaction:", error);
		res.status(500).json({
			success: false,
			error: "Failed to track interaction",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Create lead
export async function createLead(req: Request, res: Response) {
	try {
		const {
			sessionId,
			email,
			firstName,
			lastName,
			phone,
			company,
			source,
			metadata,
		} = req.body;

		// Create lead
		const lead = await repository.createLead({
			sessionId,
			email,
			firstName,
			lastName,
			phone,
			company,
			source,
			metadata,
		});

		// Check for follow-up rules
		const followUpRules = await repository.getFollowUpRules();
		const applicableRules = followUpRules.filter((rule) => {
			if (rule.triggerType !== "lead_capture") return false;

			// Check conditions
			if (rule.conditions.source && rule.conditions.source !== source) {
				return false;
			}

			// Add more condition checks as needed

			return true;
		});

		// Schedule follow-ups
		for (const rule of applicableRules) {
			await followUpService.scheduleFollowUp({
				leadId: lead.id,
				ruleId: rule.id,
				scheduledFor: new Date(Date.now() + rule.delayMinutes * 60 * 1000),
			});
		}

		res.status(201).json({
			success: true,
			data: lead,
		});
	} catch (error) {
		console.error("Failed to create lead:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create lead",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get leads
export async function getLeads(req: Request, res: Response) {
	try {
		const { status, source, page = 1, limit = 20 } = req.query;

		const leads = await repository.getLeads({
			status: status as any,
			source: source as string,
			page: Number(page),
			limit: Number(limit),
		});

		res.json({
			success: true,
			data: leads,
		});
	} catch (error) {
		console.error("Failed to get leads:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get leads",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Update lead
export async function updateLead(req: Request, res: Response) {
	try {
		const { leadId } = req.params;
		const updates = req.body;

		const lead = await repository.updateLead(leadId, updates);

		res.json({
			success: true,
			data: lead,
		});
	} catch (error) {
		console.error("Failed to update lead:", error);
		res.status(500).json({
			success: false,
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
		console.error("Failed to get follow-up rules:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get follow-up rules",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Create follow-up rule
export async function createFollowUpRule(req: Request, res: Response) {
	try {
		const {
			name,
			triggerType,
			conditions,
			action,
			delayMinutes,
			isActive = true,
		} = req.body;

		const rule = await repository.createFollowUpRule({
			name,
			triggerType,
			conditions,
			action,
			delayMinutes,
			isActive,
		});

		res.status(201).json({
			success: true,
			data: rule,
		});
	} catch (error) {
		console.error("Failed to create follow-up rule:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create follow-up rule",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Send follow-up email
export async function sendFollowUpEmail(req: Request, res: Response) {
	try {
		const { leadId, templateId, customData } = req.body;

		const result = await followUpService.sendFollowUpEmail({
			leadId,
			templateId,
			customData,
		});

		res.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Failed to send follow-up email:", error);
		res.status(500).json({
			success: false,
			error: "Failed to send follow-up email",
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
		console.error("Failed to get visitor segments:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get visitor segments",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get session insights
export async function getSessionInsights(req: Request, res: Response) {
	try {
		const { sessionId } = req.params;

		const insights = await repository.getSessionInsights(sessionId);

		res.json({
			success: true,
			data: insights,
		});
	} catch (error) {
		console.error("Failed to get session insights:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get session insights",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// End session
export async function endSession(req: Request, res: Response) {
	try {
		const { sessionId } = req.params;

		const session = await repository.endSession(sessionId);

		// Check for follow-up rules based on session behavior
		const sessionData = await repository.getSessionData(sessionId);
		const followUpRules = await repository.getFollowUpRules();

		const applicableRules = followUpRules.filter((rule) => {
			if (rule.triggerType !== "session_behavior") return false;

			// Check conditions based on session data
			if (
				rule.conditions.minDuration &&
				sessionData.duration < rule.conditions.minDuration
			) {
				return false;
			}

			if (
				rule.conditions.minPageViews &&
				sessionData.pageViewsCount < rule.conditions.minPageViews
			) {
				return false;
			}

			return true;
		});

		// Schedule follow-ups if visitor has lead info
		if (sessionData.leadId) {
			for (const rule of applicableRules) {
				await followUpService.scheduleFollowUp({
					leadId: sessionData.leadId,
					ruleId: rule.id,
					scheduledFor: new Date(Date.now() + rule.delayMinutes * 60 * 1000),
				});
			}
		}

		res.json({
			success: true,
			data: session,
		});
	} catch (error) {
		console.error("Failed to end session:", error);
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