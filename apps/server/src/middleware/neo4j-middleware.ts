/**
 * Neo4j Middleware
 * Express middleware for Neo4j connection management and request handling
 */

import type { NextFunction, Request, Response } from "express";
import { checkNeo4jHealth, getNeo4jService } from "../config/neo4j";

// Extend Request interface to include neo4j service
declare global {
	namespace Express {
		interface Request {
			neo4j?: ReturnType<typeof getNeo4jService>;
		}
	}
}

export interface Neo4jMiddlewareOptions {
	autoInitialize?: boolean;
	skipHealthCheck?: boolean;
	timeout?: number;
}

// Main Neo4j middleware
export function neo4jMiddleware(options: Neo4jMiddlewareOptions = {}) {
	const {
		autoInitialize = true,
		skipHealthCheck = false,
		timeout = 30000,
	} = options;

	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Skip middleware for health check endpoints to avoid circular dependency
			if (req.path === "/api/graph/health" || skipHealthCheck) {
				return next();
			}

			// Get Neo4j service instance
			const neo4jService = getNeo4jService();

			// Auto-initialize if requested
			if (autoInitialize) {
				const initPromise = neo4jService.initialize();

				// Apply timeout to initialization
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(
						() => reject(new Error("Neo4j initialization timeout")),
						timeout,
					);
				});

				try {
					await Promise.race([initPromise, timeoutPromise]);
				} catch (error) {
					console.error("Neo4j middleware initialization failed:", error);
					return res.status(503).json({
						success: false,
						error: "Graph database unavailable",
						message: "Neo4j connection could not be established",
					});
				}
			}

			// Attach service to request object
			req.neo4j = neo4jService;

			next();
		} catch (error) {
			console.error("Neo4j middleware error:", error);
			res.status(500).json({
				success: false,
				error: "Graph database error",
				message: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};
}

// Health check middleware - lighter version for health endpoints
export function neo4jHealthMiddleware() {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Just attach the service without initialization
			req.neo4j = getNeo4jService();
			next();
		} catch (error) {
			console.error("Neo4j health middleware error:", error);
			res.status(500).json({
				success: false,
				error: "Graph database service unavailable",
			});
		}
	};
}

// Connection validation middleware
export function validateNeo4jConnection() {
	return async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const health = await checkNeo4jHealth();

			if (health.status !== "healthy") {
				return res.status(503).json({
					success: false,
					error: "Graph database unhealthy",
					details: health,
				});
			}

			next();
		} catch (error) {
			console.error("Neo4j connection validation failed:", error);
			res.status(503).json({
				success: false,
				error: "Graph database connection validation failed",
				message: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};
}

// Query performance middleware
export function neo4jPerformanceMiddleware() {
	return (req: Request, res: Response, next: NextFunction) => {
		const startTime = Date.now();

		// Override the end method to capture response time
		const originalEnd = res.end;
		res.end = function (...args: any[]) {
			const duration = Date.now() - startTime;

			// Log slow queries (>5 seconds)
			if (duration > 5000) {
				console.warn(
					`Slow Neo4j query detected: ${req.method} ${req.path} took ${duration}ms`,
				);
			}

			// Add performance headers
			res.set("X-Neo4j-Response-Time", `${duration}ms`);

			// Call original end method
			originalEnd.apply(this, args);
		};

		next();
	};
}

// Error handling middleware specifically for Neo4j operations
export function neo4jErrorHandler() {
	return (error: any, req: Request, res: Response, next: NextFunction) => {
		// Check if this is a Neo4j-related error
		if (error.name === "Neo4jError" || error.message?.includes("Neo4j")) {
			console.error("Neo4j operation error:", {
				error: error.message,
				code: error.code,
				path: req.path,
				method: req.method,
				timestamp: new Date().toISOString(),
			});

			// Determine appropriate HTTP status code based on Neo4j error
			let statusCode = 500;

			if (error.code === "ServiceUnavailable") {
				statusCode = 503;
			} else if (error.code === "ClientError") {
				statusCode = 400;
			} else if (error.code === "TransientError") {
				statusCode = 503;
			}

			return res.status(statusCode).json({
				success: false,
				error: "Graph database operation failed",
				message: error.message,
				code: error.code,
			});
		}

		// If not a Neo4j error, pass to next error handler
		next(error);
	};
}

// Rate limiting middleware for Neo4j operations
export function neo4jRateLimit(
	options: {
		windowMs?: number;
		maxRequests?: number;
		skipSuccessfulGET?: boolean;
	} = {},
) {
	const {
		windowMs = 60000, // 1 minute
		maxRequests = 100,
		skipSuccessfulGET = true,
	} = options;

	const requestCounts = new Map<string, { count: number; resetTime: number }>();

	return (req: Request, res: Response, next: NextFunction) => {
		const clientId = req.ip || "unknown";
		const now = Date.now();

		// Clean up expired entries
		for (const [key, value] of requestCounts.entries()) {
			if (now > value.resetTime) {
				requestCounts.delete(key);
			}
		}

		const userRequests = requestCounts.get(clientId);

		if (!userRequests) {
			requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
			return next();
		}

		if (now > userRequests.resetTime) {
			requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
			return next();
		}

		if (userRequests.count >= maxRequests) {
			return res.status(429).json({
				success: false,
				error: "Rate limit exceeded for graph database operations",
				retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
			});
		}

		userRequests.count++;
		next();
	};
}

// Logging middleware for Neo4j operations
export function neo4jLoggingMiddleware(
	options: {
		logLevel?: "debug" | "info" | "warn" | "error";
		logQueries?: boolean;
		logResults?: boolean;
	} = {},
) {
	const { logLevel = "info", logQueries = false, logResults = false } = options;

	return (req: Request, res: Response, next: NextFunction) => {
		if (logLevel === "debug") {
			console.log(`Neo4j Request: ${req.method} ${req.path}`, {
				query: logQueries ? req.body : undefined,
				headers: req.headers,
				timestamp: new Date().toISOString(),
			});
		}

		if (logResults) {
			const originalJson = res.json;
			res.json = function (body: any) {
				if (logLevel === "debug") {
					console.log(`Neo4j Response: ${req.method} ${req.path}`, {
						status: res.statusCode,
						body: body,
						timestamp: new Date().toISOString(),
					});
				}
				return originalJson.call(this, body);
			};
		}

		next();
	};
}

// Development-only middleware for debugging
export function neo4jDebugMiddleware() {
	return (req: Request, res: Response, next: NextFunction) => {
		if (process.env.NODE_ENV !== "development") {
			return next();
		}

		// Add debug information to response headers
		res.set("X-Neo4j-Debug", "enabled");
		res.set("X-Neo4j-Path", req.path);
		res.set("X-Neo4j-Method", req.method);

		// Log request details
		console.debug("Neo4j Debug:", {
			path: req.path,
			method: req.method,
			query: req.query,
			body: req.body,
			timestamp: new Date().toISOString(),
		});

		next();
	};
}
