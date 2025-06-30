/**
 * Correlation ID Middleware
 * Adds correlation IDs to requests for distributed tracing
 */

import type { NextFunction, Request, Response } from "express";
import {
	createRequestLogger,
	Logger,
} from "../../../../packages/core/src/lib/logger";

// Extend Express Request interface
declare global {
	namespace Express {
		interface Request {
			correlationId: string;
			logger: Logger;
			setLogContext: (context: any) => void;
			clearLogContext: () => void;
		}
	}
}

export interface CorrelationConfig {
	headerName?: string;
	generateNew?: boolean;
	includeInResponse?: boolean;
	logIncoming?: boolean;
	logOutgoing?: boolean;
}

/**
 * Correlation ID middleware
 */
export function correlationMiddleware(config: CorrelationConfig = {}) {
	const {
		headerName = "x-correlation-id",
		generateNew = true,
		includeInResponse = true,
		logIncoming = true,
		logOutgoing = true,
	} = config;

	return (req: Request, res: Response, next: NextFunction) => {
		// Get or generate correlation ID
		let correlationId = req.headers[headerName] as string;

		if (!correlationId && generateNew) {
			correlationId = Logger.createCorrelationId();
		}

		if (!correlationId) {
			return next(new Error("No correlation ID provided"));
		}

		// Create request-scoped logger
		const { logger, setContext, clearContext } =
			createRequestLogger(correlationId);

		// Attach to request
		req.correlationId = correlationId;
		req.logger = logger;
		req.setLogContext = setContext;
		req.clearLogContext = clearContext;

		// Set initial context
		setContext({
			method: req.method,
			url: req.url,
			userAgent: req.headers["user-agent"],
			ip: req.ip || req.connection.remoteAddress,
			requestId: correlationId,
		});

		// Add correlation ID to response headers
		if (includeInResponse) {
			res.setHeader(headerName, correlationId);
		}

		// Log incoming request
		if (logIncoming) {
			req.logger.info("Incoming request", {
				correlationId,
				method: req.method,
				url: req.url,
				userAgent: req.headers["user-agent"],
				contentLength: req.headers["content-length"],
			});
		}

		// Track response
		const startTime = Date.now();

		// Override res.end to log outgoing response
		const originalEnd = res.end;
		res.end = function (...args: any[]) {
			const duration = Date.now() - startTime;

			if (logOutgoing) {
				req.logger.info("Outgoing response", {
					correlationId,
					statusCode: res.statusCode,
					duration,
					contentLength: res.get("content-length"),
				});
			}

			// Clean up correlation context
			clearContext();

			return originalEnd.apply(this, args);
		};

		next();
	};
}

/**
 * User context middleware (adds user info to correlation context)
 */
export function userContextMiddleware() {
	return (req: Request, _res: Response, next: NextFunction) => {
		if (req.setLogContext && (req as any).user) {
			const user = (req as any).user;
			req.setLogContext({
				userId: user.id,
				userEmail: user.email,
				organizationId: user.organizationId,
				userRole: user.role,
			});
		}
		next();
	};
}

/**
 * Error correlation middleware (adds correlation to error responses)
 */
export function errorCorrelationMiddleware() {
	return (error: any, req: Request, _res: Response, next: NextFunction) => {
		// Add correlation ID to error response
		if (req.correlationId) {
			error.correlationId = req.correlationId;

			// Log error with correlation
			if (req.logger) {
				req.logger.error("Request error", error, {
					correlationId: req.correlationId,
					method: req.method,
					url: req.url,
					statusCode: error.statusCode || 500,
				});
			}
		}

		next(error);
	};
}

/**
 * Performance tracking middleware
 */
export function performanceTrackingMiddleware() {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.logger) {
			return next();
		}

		const tracker = req.logger.createPerformanceTracker();

		// Add tracker to request
		(req as any).performanceTracker = tracker;

		// Override res.end to log performance
		const originalEnd = res.end;
		res.end = function (...args: any[]) {
			const _performance = tracker.getResult();

			req.logger.performance("Request completed", tracker, {
				correlationId: req.correlationId,
				method: req.method,
				url: req.url,
				statusCode: res.statusCode,
			});

			return originalEnd.apply(this, args);
		};

		next();
	};
}

/**
 * Database operation tracking middleware
 */
export function dbOperationMiddleware() {
	return (req: Request, _res: Response, next: NextFunction) => {
		if (!req.setLogContext) {
			return next();
		}

		// Track database operations
		const originalQuery = (req as any).query;
		if (originalQuery) {
			(req as any).query = function (...args: any[]) {
				const operationStart = Date.now();

				req.logger?.debug("Database operation started", {
					correlationId: req.correlationId,
					operation: "query",
				});

				const result = originalQuery.apply(this, args);

				if (result && typeof result.then === "function") {
					return result
						.then((data: any) => {
							req.logger?.debug("Database operation completed", {
								correlationId: req.correlationId,
								operation: "query",
								duration: Date.now() - operationStart,
								success: true,
							});
							return data;
						})
						.catch((error: any) => {
							req.logger?.error("Database operation failed", error, {
								correlationId: req.correlationId,
								operation: "query",
								duration: Date.now() - operationStart,
							});
							throw error;
						});
				}

				return result;
			};
		}

		next();
	};
}

/**
 * External API call tracking decorator
 */
export function trackExternalCall(serviceName: string) {
	return (
		_target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			const req = args.find((arg: any) => arg?.correlationId);

			if (req?.logger) {
				const tracker = req.logger.createPerformanceTracker();

				req.logger.debug("External API call started", {
					correlationId: req.correlationId,
					service: serviceName,
					operation: propertyKey,
				});

				try {
					const result = await originalMethod.apply(this, args);

					req.logger.performance("External API call completed", tracker, {
						correlationId: req.correlationId,
						service: serviceName,
						operation: propertyKey,
						success: true,
					});

					return result;
				} catch (error) {
					req.logger.error("External API call failed", error as Error, {
						correlationId: req.correlationId,
						service: serviceName,
						operation: propertyKey,
					});

					throw error;
				}
			}

			return originalMethod.apply(this, args);
		};

		return descriptor;
	};
}

/**
 * Middleware factory for custom correlation tracking
 */
export function createTrackingMiddleware(
	name: string,
	extractor: (req: Request) => any = () => ({}),
) {
	return (req: Request, _res: Response, next: NextFunction) => {
		if (req.setLogContext) {
			const data = extractor(req);
			req.setLogContext({
				[name]: data,
			});

			if (req.logger) {
				req.logger.debug(`${name} context added`, {
					correlationId: req.correlationId,
					[name]: data,
				});
			}
		}
		next();
	};
}

export default correlationMiddleware;
