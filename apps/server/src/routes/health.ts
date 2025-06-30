/**
 * Health Check Routes with OpenAPI Documentation
 */

import { Router } from "express";
import {
	createHealthCheckEndpoint,
	createLivenessCheck,
	createReadinessCheck,
} from "../middleware/health-check";

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Get comprehensive system health status
 *     description: Returns detailed health information for all system components
 *     responses:
 *       200:
 *         description: System is healthy or degraded but operational
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               status: "healthy"
 *               timestamp: "2023-01-01T00:00:00Z"
 *               uptime: 3600000
 *               version: "1.0.0"
 *               environment: "production"
 *               services:
 *                 - name: "database"
 *                   status: "healthy"
 *                   responseTime: 45
 *                   lastCheck: "2023-01-01T00:00:00Z"
 *                 - name: "external_apis"
 *                   status: "healthy"
 *                   responseTime: 120
 *                   lastCheck: "2023-01-01T00:00:00Z"
 *               circuitBreakers:
 *                 - name: "email-service"
 *                   state: "CLOSED"
 *                   successRate: 99.5
 *                   totalRequests: 1000
 *                   averageResponseTime: 85
 *               system:
 *                 memory:
 *                   used: 536870912
 *                   total: 1073741824
 *                   percentage: 50.0
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               status: "unhealthy"
 *               timestamp: "2023-01-01T00:00:00Z"
 *               uptime: 3600000
 *               version: "1.0.0"
 *               environment: "production"
 *               services:
 *                 - name: "database"
 *                   status: "unhealthy"
 *                   responseTime: null
 *                   lastCheck: "2023-01-01T00:00:00Z"
 *                   details:
 *                     error: "Connection timeout"
 *     security: []
 */
router.get("/", createHealthCheckEndpoint());

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Kubernetes readiness probe
 *     description: Simple readiness check for Kubernetes deployment
 *     responses:
 *       200:
 *         description: Service is ready to receive traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *             example:
 *               status: "ready"
 *       503:
 *         description: Service is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 reason:
 *                   type: string
 *             example:
 *               status: "not ready"
 *               reason: "unhealthy services"
 *     security: []
 */
router.get("/ready", createReadinessCheck());

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     tags: [Health]
 *     summary: Kubernetes liveness probe
 *     description: Simple liveness check for Kubernetes deployment
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *             example:
 *               status: "alive"
 *               timestamp: "2023-01-01T00:00:00Z"
 *               uptime: 3600
 *     security: []
 */
router.get("/live", createLivenessCheck());

/**
 * @swagger
 * /api/health/version:
 *   get:
 *     tags: [Health]
 *     summary: Get application version information
 *     description: Returns version and build information
 *     responses:
 *       200:
 *         description: Version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   description: Application version
 *                 buildDate:
 *                   type: string
 *                   format: date-time
 *                   description: Build timestamp
 *                 commitHash:
 *                   type: string
 *                   description: Git commit hash
 *                 environment:
 *                   type: string
 *                   description: Environment name
 *             example:
 *               version: "1.0.0"
 *               buildDate: "2023-01-01T00:00:00Z"
 *               commitHash: "abc123def456"
 *               environment: "production"
 *     security: []
 */
router.get("/version", (_req, res) => {
	res.json({
		version: process.env.npm_package_version || "1.0.0",
		buildDate: process.env.BUILD_DATE || new Date().toISOString(),
		commitHash: process.env.COMMIT_HASH || "unknown",
		environment: process.env.NODE_ENV || "development",
	});
});

export default router;
