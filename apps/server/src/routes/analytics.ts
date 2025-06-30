/**
 * Analytics API Routes
 * Handles data aggregation and analytics operations
 */

import { analyticsService } from "@ignitabull/core/services/analytics-service";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate } from "../middleware/authenticate";
import { validateRequest } from "../middleware/validate-request";

const router = Router();

// Validation schemas
const aggregateDailySchema = z.object({
	body: z.object({
		organizationId: z.string().uuid(),
		date: z.string().datetime().optional(),
	}),
});

const aggregateRangeSchema = z.object({
	body: z.object({
		organizationId: z.string().uuid(),
		days: z.number().min(1).max(90).default(30),
	}),
});

const getMetricsSchema = z.object({
	query: z.object({
		organizationId: z.string().uuid(),
		startDate: z.string().datetime(),
		endDate: z.string().datetime(),
		metricType: z.enum(["revenue", "orders"]),
	}),
});

/**
 * @swagger
 * /api/analytics/aggregate/daily:
 *   post:
 *     tags: [Analytics]
 *     summary: Aggregate daily metrics for an organization
 *     description: Fetches order data and calculates daily metrics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId]
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 description: Organization ID
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date to aggregate (defaults to today)
 *     responses:
 *       200:
 *         description: Aggregation completed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
	"/aggregate/daily",
	authenticate,
	validateRequest(aggregateDailySchema),
	asyncHandler(async (req, res) => {
		const { organizationId, date } = req.body;
		const targetDate = date ? new Date(date) : new Date();

		const { success, error } = await analyticsService.aggregateDailyMetrics(
			organizationId,
			targetDate,
		);

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		res.json({
			success,
			message: "Daily metrics aggregated successfully",
			date: targetDate.toISOString().split("T")[0],
		});
	}),
);

/**
 * @swagger
 * /api/analytics/aggregate/range:
 *   post:
 *     tags: [Analytics]
 *     summary: Aggregate metrics for a date range
 *     description: Aggregates metrics for multiple days
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId]
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 description: Organization ID
 *               days:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 90
 *                 default: 30
 *                 description: Number of days to aggregate
 *     responses:
 *       200:
 *         description: Aggregation completed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
	"/aggregate/range",
	authenticate,
	validateRequest(aggregateRangeSchema),
	asyncHandler(async (req, res) => {
		const { organizationId, days } = req.body;

		const { success, error } = await analyticsService.aggregateRecentMetrics(
			organizationId,
			days,
		);

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		res.json({
			success,
			message: `Metrics aggregated for the last ${days} days`,
			days,
		});
	}),
);

/**
 * @swagger
 * /api/analytics/metrics:
 *   get:
 *     tags: [Analytics]
 *     summary: Get metrics for a date range
 *     description: Retrieves aggregated metrics for visualization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: metricType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [revenue, orders]
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       value:
 *                         type: number
 *                       currency:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
	"/metrics",
	authenticate,
	validateRequest(getMetricsSchema),
	asyncHandler(async (req, res) => {
		const { organizationId, startDate, endDate, metricType } = req.query as any;

		const metrics = await analyticsService.getMetricsRange(
			organizationId,
			new Date(startDate),
			new Date(endDate),
			metricType,
		);

		res.json({ metrics });
	}),
);

/**
 * @swagger
 * /api/analytics/metrics/today:
 *   get:
 *     tags: [Analytics]
 *     summary: Get today's metric with comparison
 *     description: Retrieves today's metric value with percentage change from yesterday
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: metricType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [revenue, orders]
 *     responses:
 *       200:
 *         description: Metric retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 value:
 *                   type: number
 *                 previousValue:
 *                   type: number
 *                 percentageChange:
 *                   type: number
 *                 currency:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
	"/metrics/today",
	authenticate,
	asyncHandler(async (req, res) => {
		const { organizationId, metricType } = req.query as any;

		if (!organizationId || !metricType) {
			return res.status(400).json({ error: "Missing required parameters" });
		}

		const metric = await analyticsService.getTodayMetricWithComparison(
			organizationId,
			metricType as "revenue" | "orders",
		);

		res.json(metric);
	}),
);

export { router as analyticsRouter };
