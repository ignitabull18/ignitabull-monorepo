/**
 * Influencer Marketing API
 * RESTful endpoints for influencer CRM and campaign management
 */

import type { Request, Response } from "express";
import { InfluencerMarketingService } from "../../../../packages/core/src/services/influencer-marketing";
import InfluencerRepository from "../../services/influencer-repository";

const repository = new InfluencerRepository();
const marketingService = new InfluencerMarketingService({
	domain: "ignitabull.com",
	crawlDepth: 2,
	maxPages: 50,
	includeSubdomains: false,
	respectRobotsTxt: true,
	userAgent: "Ignitabull-Influencer-Bot/1.0",
	timeout: 30000,
	concurrency: 3,
	delays: { minDelay: 1000, maxDelay: 2000 },
});

// Influencer Profile Management

// Get influencer overview/dashboard data
export async function getInfluencerOverview(req: Request, res: Response) {
	try {
		const filters = {
			status: req.query.status as string,
			category: req.query.category as string,
			tier: req.query.tier as string,
			limit: Number.parseInt(req.query.limit as string) || 50,
			offset: Number.parseInt(req.query.offset as string) || 0,
		};

		const [influencers, analytics] = await Promise.all([
			repository.getInfluencerProfiles(filters),
			// Mock analytics - in real app, this would calculate actual metrics
			Promise.resolve({
				totalInfluencers: 127,
				activePartners: 34,
				activeCampaigns: 8,
				totalReach: 2500000,
				avgEngagementRate: 4.2,
				totalSpent: 85000,
				estimatedROI: 3.8,
				newInquiries: 12,
			}),
		]);

		res.json({
			success: true,
			data: {
				overview: analytics,
				influencers: influencers.slice(0, 10), // Return first 10 for overview
				totalCount: influencers.length,
			},
		});
	} catch (error) {
		console.error("Influencer overview API error:", error);
		res.status(500).json({
			error: "Failed to fetch influencer overview",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Create new influencer profile
export async function createInfluencerProfile(req: Request, res: Response) {
	try {
		const {
			name,
			handle,
			email,
			phone,
			platforms,
			category,
			tier,
			location,
			demographics,
			rates,
			notes,
			tags,
		} = req.body;

		if (!name || !handle || !category) {
			return res.status(400).json({
				error: "Name, handle, and category are required",
			});
		}

		const influencer = await repository.createInfluencerProfile({
			name,
			handle,
			email,
			phone,
			platforms: platforms || [],
			category,
			tier: tier || "micro",
			location: location || {},
			demographics: demographics || {},
			rates,
			notes,
			tags: tags || [],
		});

		res.status(201).json({
			success: true,
			data: influencer,
		});
	} catch (error) {
		console.error("Create influencer profile API error:", error);
		res.status(500).json({
			error: "Failed to create influencer profile",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get influencer profiles with filtering and search
export async function getInfluencerProfiles(req: Request, res: Response) {
	try {
		const filters = {
			status: req.query.status as string,
			category: req.query.category as string,
			tier: req.query.tier as string,
			platforms: req.query.platforms
				? ((req.query.platforms as string).split(",") as any)
				: undefined,
			tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
			search: req.query.search as string,
			limit: Number.parseInt(req.query.limit as string) || 50,
			offset: Number.parseInt(req.query.offset as string) || 0,
		};

		const influencers = await repository.getInfluencerProfiles(filters);

		res.json({
			success: true,
			data: influencers,
			pagination: {
				total: influencers.length,
				limit: filters.limit,
				offset: filters.offset,
				hasMore: influencers.length === filters.limit,
			},
		});
	} catch (error) {
		console.error("Get influencer profiles API error:", error);
		res.status(500).json({
			error: "Failed to fetch influencer profiles",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get single influencer profile
export async function getInfluencerProfile(req: Request, res: Response) {
	try {
		const { influencerId } = req.params;

		if (!influencerId) {
			return res.status(400).json({
				error: "Influencer ID is required",
			});
		}

		const influencer = await repository.getInfluencerProfile(influencerId);

		if (!influencer) {
			return res.status(404).json({
				error: "Influencer not found",
			});
		}

		// Get additional analytics for this influencer
		const analytics = await repository.getInfluencerAnalytics(
			influencerId,
			new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
			new Date(),
		);

		res.json({
			success: true,
			data: {
				...influencer,
				analytics,
			},
		});
	} catch (error) {
		console.error("Get influencer profile API error:", error);
		res.status(500).json({
			error: "Failed to fetch influencer profile",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Update influencer profile
export async function updateInfluencerProfile(req: Request, res: Response) {
	try {
		const { influencerId } = req.params;
		const updates = req.body;

		if (!influencerId) {
			return res.status(400).json({
				error: "Influencer ID is required",
			});
		}

		const updatedInfluencer = await repository.updateInfluencerProfile(
			influencerId,
			updates,
		);

		if (!updatedInfluencer) {
			return res.status(404).json({
				error: "Influencer not found",
			});
		}

		res.json({
			success: true,
			data: updatedInfluencer,
		});
	} catch (error) {
		console.error("Update influencer profile API error:", error);
		res.status(500).json({
			error: "Failed to update influencer profile",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Discover new influencers
export async function discoverInfluencers(req: Request, res: Response) {
	try {
		const {
			platforms,
			categories,
			followerRange,
			engagementRange,
			location,
			keywords,
			excludeKeywords,
		} = req.body;

		if (!platforms || !categories || !keywords) {
			return res.status(400).json({
				error: "Platforms, categories, and keywords are required",
			});
		}

		await marketingService.initialize();

		const discoveryConfig = {
			platforms: platforms || ["instagram"],
			categories: categories || ["beauty"],
			followerRange: followerRange || { min: 1000, max: 100000 },
			engagementRange: engagementRange || { min: 0.02, max: 0.15 },
			location,
			keywords,
			excludeKeywords,
		};

		const discoveredInfluencers =
			await marketingService.discoverInfluencers(discoveryConfig);

		res.json({
			success: true,
			data: discoveredInfluencers,
		});
	} catch (error) {
		console.error("Discover influencers API error:", error);
		res.status(500).json({
			error: "Failed to discover influencers",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Analyze influencer performance
export async function analyzeInfluencer(req: Request, res: Response) {
	try {
		const { influencerId } = req.params;

		if (!influencerId) {
			return res.status(400).json({
				error: "Influencer ID is required",
			});
		}

		await marketingService.initialize();
		const analytics = await marketingService.analyzeInfluencer(influencerId);

		res.json({
			success: true,
			data: analytics,
		});
	} catch (error) {
		console.error("Analyze influencer API error:", error);
		res.status(500).json({
			error: "Failed to analyze influencer",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Campaign Management

// Create new campaign
export async function createInfluencerCampaign(req: Request, res: Response) {
	try {
		const {
			name,
			description,
			type,
			objectives,
			budget,
			timeline,
			targetAudience,
			deliverables,
			notes,
			tags,
		} = req.body;

		if (!name || !description || !type) {
			return res.status(400).json({
				error: "Name, description, and type are required",
			});
		}

		const campaign = await repository.createInfluencerCampaign({
			name,
			description,
			type,
			objectives: objectives || [],
			budget: budget || { total: 0, allocated: 0, spent: 0, currency: "USD" },
			timeline: timeline || {
				startDate: new Date(),
				endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			},
			targetAudience: targetAudience || {
				demographics: [],
				interests: [],
				locations: [],
				platforms: [],
			},
			deliverables: deliverables || [],
			notes,
			tags: tags || [],
		});

		res.status(201).json({
			success: true,
			data: campaign,
		});
	} catch (error) {
		console.error("Create influencer campaign API error:", error);
		res.status(500).json({
			error: "Failed to create influencer campaign",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get campaigns
export async function getInfluencerCampaigns(req: Request, res: Response) {
	try {
		const filters = {
			status: req.query.status as string,
			type: req.query.type as string,
			createdBy: req.query.createdBy as string,
			search: req.query.search as string,
			limit: Number.parseInt(req.query.limit as string) || 50,
			offset: Number.parseInt(req.query.offset as string) || 0,
		};

		const campaigns = await repository.getInfluencerCampaigns(filters);

		res.json({
			success: true,
			data: campaigns,
		});
	} catch (error) {
		console.error("Get influencer campaigns API error:", error);
		res.status(500).json({
			error: "Failed to fetch influencer campaigns",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get single campaign
export async function getInfluencerCampaign(req: Request, res: Response) {
	try {
		const { campaignId } = req.params;

		if (!campaignId) {
			return res.status(400).json({
				error: "Campaign ID is required",
			});
		}

		const campaign = await repository.getInfluencerCampaign(campaignId);

		if (!campaign) {
			return res.status(404).json({
				error: "Campaign not found",
			});
		}

		// Get campaign analytics
		const analytics = await repository.getCampaignAnalytics(campaignId);

		res.json({
			success: true,
			data: {
				...campaign,
				analytics,
			},
		});
	} catch (error) {
		console.error("Get influencer campaign API error:", error);
		res.status(500).json({
			error: "Failed to fetch influencer campaign",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Add participant to campaign
export async function addCampaignParticipant(req: Request, res: Response) {
	try {
		const { campaignId } = req.params;
		const { influencerId, agreedRate } = req.body;

		if (!campaignId || !influencerId) {
			return res.status(400).json({
				error: "Campaign ID and Influencer ID are required",
			});
		}

		const participant = await repository.addCampaignParticipant(
			campaignId,
			influencerId,
			agreedRate || 0,
		);

		res.status(201).json({
			success: true,
			data: participant,
		});
	} catch (error) {
		console.error("Add campaign participant API error:", error);
		res.status(500).json({
			error: "Failed to add campaign participant",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Generate campaign brief
export async function generateCampaignBrief(req: Request, res: Response) {
	try {
		const { campaignId } = req.params;

		if (!campaignId) {
			return res.status(400).json({
				error: "Campaign ID is required",
			});
		}

		const campaign = await repository.getInfluencerCampaign(campaignId);

		if (!campaign) {
			return res.status(404).json({
				error: "Campaign not found",
			});
		}

		await marketingService.initialize();
		const brief = await marketingService.createCampaignBrief(campaign);

		res.json({
			success: true,
			data: brief,
		});
	} catch (error) {
		console.error("Generate campaign brief API error:", error);
		res.status(500).json({
			error: "Failed to generate campaign brief",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Calculate campaign ROI
export async function calculateCampaignROI(req: Request, res: Response) {
	try {
		const { campaignId } = req.params;

		if (!campaignId) {
			return res.status(400).json({
				error: "Campaign ID is required",
			});
		}

		await marketingService.initialize();
		const roi = await marketingService.calculateCampaignROI(campaignId);

		res.json({
			success: true,
			data: roi,
		});
	} catch (error) {
		console.error("Calculate campaign ROI API error:", error);
		res.status(500).json({
			error: "Failed to calculate campaign ROI",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Outreach Management

// Create outreach
export async function createInfluencerOutreach(req: Request, res: Response) {
	try {
		const {
			influencerId,
			campaignId,
			type,
			subject,
			message,
			template,
			personalizations,
			scheduledAt,
		} = req.body;

		if (!influencerId || !type || !subject || !message) {
			return res.status(400).json({
				error: "Influencer ID, type, subject, and message are required",
			});
		}

		const outreach = await repository.createInfluencerOutreach({
			influencerId,
			campaignId,
			type,
			subject,
			message,
			template,
			personalizations: personalizations || {},
			scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
		});

		res.status(201).json({
			success: true,
			data: outreach,
		});
	} catch (error) {
		console.error("Create influencer outreach API error:", error);
		res.status(500).json({
			error: "Failed to create influencer outreach",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get outreach messages
export async function getInfluencerOutreach(req: Request, res: Response) {
	try {
		const filters = {
			influencerId: req.query.influencerId as string,
			campaignId: req.query.campaignId as string,
			status: req.query.status as string,
			type: req.query.type as string,
			limit: Number.parseInt(req.query.limit as string) || 50,
			offset: Number.parseInt(req.query.offset as string) || 0,
		};

		const outreach = await repository.getInfluencerOutreach(filters);

		res.json({
			success: true,
			data: outreach,
		});
	} catch (error) {
		console.error("Get influencer outreach API error:", error);
		res.status(500).json({
			error: "Failed to fetch influencer outreach",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Update outreach status
export async function updateInfluencerOutreach(req: Request, res: Response) {
	try {
		const { outreachId } = req.params;
		const updates = req.body;

		if (!outreachId) {
			return res.status(400).json({
				error: "Outreach ID is required",
			});
		}

		const updatedOutreach = await repository.updateInfluencerOutreach(
			outreachId,
			updates,
		);

		if (!updatedOutreach) {
			return res.status(404).json({
				error: "Outreach not found",
			});
		}

		res.json({
			success: true,
			data: updatedOutreach,
		});
	} catch (error) {
		console.error("Update influencer outreach API error:", error);
		res.status(500).json({
			error: "Failed to update influencer outreach",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Predict outreach success
export async function predictOutreachSuccess(req: Request, res: Response) {
	try {
		const { influencerId } = req.body;

		if (!influencerId) {
			return res.status(400).json({
				error: "Influencer ID is required",
			});
		}

		const influencer = await repository.getInfluencerProfile(influencerId);

		if (!influencer) {
			return res.status(404).json({
				error: "Influencer not found",
			});
		}

		await marketingService.initialize();
		const prediction = await marketingService.predictOutreachSuccess(
			req.body,
			influencer,
		);

		res.json({
			success: true,
			data: prediction,
		});
	} catch (error) {
		console.error("Predict outreach success API error:", error);
		res.status(500).json({
			error: "Failed to predict outreach success",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Performance Analytics

// Generate performance report
export async function generatePerformanceReport(req: Request, res: Response) {
	try {
		const { startDate, endDate, campaignIds, influencerIds, platforms } =
			req.query;

		if (!startDate || !endDate) {
			return res.status(400).json({
				error: "Start date and end date are required",
			});
		}

		const filters = {
			campaignIds: campaignIds ? (campaignIds as string).split(",") : undefined,
			influencerIds: influencerIds
				? (influencerIds as string).split(",")
				: undefined,
			platforms: platforms
				? ((platforms as string).split(",") as any)
				: undefined,
		};

		await marketingService.initialize();
		const report = await marketingService.generatePerformanceReport(
			new Date(startDate as string),
			new Date(endDate as string),
			filters,
		);

		res.json({
			success: true,
			data: report,
		});
	} catch (error) {
		console.error("Generate performance report API error:", error);
		res.status(500).json({
			error: "Failed to generate performance report",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get top performing influencers
export async function getTopPerformingInfluencers(req: Request, res: Response) {
	try {
		const limit = Number.parseInt(req.query.limit as string) || 10;
		const startDate = req.query.startDate as string;
		const endDate = req.query.endDate as string;

		if (!startDate || !endDate) {
			return res.status(400).json({
				error: "Start date and end date are required",
			});
		}

		const topPerformers = await repository.getTopPerformingInfluencers(limit, {
			startDate: new Date(startDate),
			endDate: new Date(endDate),
		});

		res.json({
			success: true,
			data: topPerformers,
		});
	} catch (error) {
		console.error("Get top performing influencers API error:", error);
		res.status(500).json({
			error: "Failed to fetch top performing influencers",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Calculate relationship score
export async function calculateRelationshipScore(req: Request, res: Response) {
	try {
		const { influencerId } = req.params;

		if (!influencerId) {
			return res.status(400).json({
				error: "Influencer ID is required",
			});
		}

		await marketingService.initialize();
		const score =
			await marketingService.calculateRelationshipScore(influencerId);

		res.json({
			success: true,
			data: { relationshipScore: score },
		});
	} catch (error) {
		console.error("Calculate relationship score API error:", error);
		res.status(500).json({
			error: "Failed to calculate relationship score",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Health check endpoint
export async function healthCheck(_req: Request, res: Response) {
	try {
		res.json({
			success: true,
			status: "healthy",
			timestamp: new Date().toISOString(),
			service: "influencer-marketing",
		});
	} catch (error) {
		console.error("Influencer marketing health check error:", error);
		res.status(500).json({
			success: false,
			status: "unhealthy",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
