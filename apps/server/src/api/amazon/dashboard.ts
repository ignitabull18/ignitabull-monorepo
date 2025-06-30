/**
 * Amazon Dashboard API Route
 * Provides unified access to Amazon data for dashboard display
 */

import type { Request, Response } from "express";
import { AmazonAPIIntegration } from "../services/amazon-api-integration";

export async function getAmazonDashboard(req: Request, res: Response) {
	try {
		const { organization_id, integration_id } = req.query;

		if (!organization_id || !integration_id) {
			return res.status(400).json({
				error:
					"Missing required parameters: organization_id and integration_id",
			});
		}

		// Initialize the Amazon integration
		const integration = new AmazonAPIIntegration({
			organization_id: organization_id as string,
			integration_id: integration_id as string,
			supabase_url: process.env.SUPABASE_URL!,
			supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
			providers: {}, // Would be configured with actual providers
		});

		// Get dashboard data
		const dashboardData = await integration.getDashboardData();

		res.json({
			success: true,
			data: dashboardData,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Amazon dashboard API error:", error);
		res.status(500).json({
			error: "Failed to fetch Amazon dashboard data",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function analyzeProduct(req: Request, res: Response) {
	try {
		const { organization_id, integration_id, asin, marketplace_id } = req.query;

		if (!organization_id || !integration_id || !asin || !marketplace_id) {
			return res.status(400).json({
				error:
					"Missing required parameters: organization_id, integration_id, asin, marketplace_id",
			});
		}

		const integration = new AmazonAPIIntegration({
			organization_id: organization_id as string,
			integration_id: integration_id as string,
			supabase_url: process.env.SUPABASE_URL!,
			supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
			providers: {},
		});

		const analysisData = await integration.analyzeProduct(
			asin as string,
			marketplace_id as string,
		);

		res.json({
			success: true,
			data: analysisData,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Product analysis API error:", error);
		res.status(500).json({
			error: "Failed to analyze product",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function syncAmazonData(req: Request, res: Response) {
	try {
		const { organization_id, integration_id } = req.body;
		const { asin, marketplace_id, advertiser_id } = req.body;

		if (!organization_id || !integration_id) {
			return res.status(400).json({
				error:
					"Missing required parameters: organization_id and integration_id",
			});
		}

		const integration = new AmazonAPIIntegration({
			organization_id,
			integration_id,
			supabase_url: process.env.SUPABASE_URL!,
			supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
			providers: {}, // Would configure actual providers
		});

		// Perform full sync
		await integration.performFullSync({
			asin,
			marketplaceId: marketplace_id,
			advertiserId: advertiser_id,
		});

		res.json({
			success: true,
			message: "Amazon data sync completed successfully",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Amazon sync API error:", error);
		res.status(500).json({
			error: "Failed to sync Amazon data",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function getHealthStatus(req: Request, res: Response) {
	try {
		const { organization_id, integration_id } = req.query;

		if (!organization_id || !integration_id) {
			return res.status(400).json({
				error:
					"Missing required parameters: organization_id and integration_id",
			});
		}

		const integration = new AmazonAPIIntegration({
			organization_id: organization_id as string,
			integration_id: integration_id as string,
			supabase_url: process.env.SUPABASE_URL!,
			supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
			providers: {},
		});

		const healthStatus = await integration.healthCheck();

		res.json({
			success: true,
			data: healthStatus,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Health check API error:", error);
		res.status(500).json({
			error: "Failed to check health status",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
