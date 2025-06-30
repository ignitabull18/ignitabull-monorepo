/**
 * Cron Job Routes
 * Handles scheduled background tasks
 */

import { analyticsService } from "@ignitabull/core/services/analytics-service";
import { createClient } from "@supabase/supabase-js";
import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";

const router = Router();

// Simple API key middleware for cron jobs
function validateCronKey(req: any, res: any, next: any) {
	const cronKey = req.headers["x-cron-key"];
	const expectedKey = process.env.CRON_SECRET_KEY || "dev-cron-key";

	if (!cronKey || cronKey !== expectedKey) {
		return res.status(401).json({ error: "Invalid cron key" });
	}

	next();
}

/**
 * @swagger
 * /api/cron/aggregate-daily-metrics:
 *   post:
 *     tags: [Cron Jobs]
 *     summary: Aggregate daily metrics for all organizations
 *     description: Background job to process daily metrics for all active organizations
 *     security:
 *       - cronKey: []
 *     responses:
 *       200:
 *         description: Aggregation completed successfully
 *       401:
 *         description: Invalid cron key
 */
router.post(
	"/aggregate-daily-metrics",
	validateCronKey,
	asyncHandler(async (_req, res) => {
		const supabase = createClient(
			process.env.SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!,
		);

		try {
			// Get all organizations with active Amazon integrations
			const { data: integrations, error } = await supabase
				.from("integrations")
				.select("organization_id")
				.eq("platform", "amazon")
				.eq("status", "active");

			if (error) throw error;

			const results = [];
			const targetDate = new Date();

			// Process each organization
			for (const integration of integrations || []) {
				try {
					const { success, error } =
						await analyticsService.aggregateDailyMetrics(
							integration.organization_id,
							targetDate,
						);

					results.push({
						organizationId: integration.organization_id,
						success,
						error: error?.message,
					});
				} catch (err: any) {
					results.push({
						organizationId: integration.organization_id,
						success: false,
						error: err.message,
					});
				}
			}

			const successCount = results.filter((r) => r.success).length;
			const totalCount = results.length;

			res.json({
				success: true,
				message: `Processed ${successCount}/${totalCount} organizations`,
				date: targetDate.toISOString().split("T")[0],
				results,
			});
		} catch (error: any) {
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	}),
);

export { router as cronRouter };
