/**
 * Centralized Error Handling Middleware
 * Provides consistent error handling across all API endpoints
 */

import type { NextFunction, Request, Response } from "express";

// Error types
export class ApiError extends Error {
	statusCode: number;
	isOperational: boolean;
	details?: any;

	constructor(
		message: string,
		statusCode = 500,
		isOperational = true,
		details?: any,
	) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends ApiError {
	constructor(message: string, details?: any) {
		super(message, 400, true, details);
		this.name = "ValidationError";
	}
}

export class NotFoundError extends ApiError {
	constructor(resource: string) {
		super(`${resource} not found`, 404, true);
		this.name = "NotFoundError";
	}
}

export class UnauthorizedError extends ApiError {
	constructor(message = "Unauthorized") {
		super(message, 401, true);
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends ApiError {
	constructor(message = "Forbidden") {
		super(message, 403, true);
		this.name = "ForbiddenError";
	}
}

export class ConflictError extends ApiError {
	constructor(message: string) {
		super(message, 409, true);
		this.name = "ConflictError";
	}
}

export class RateLimitError extends ApiError {
	constructor(message = "Too many requests") {
		super(message, 429, true);
		this.name = "RateLimitError";
	}
}

// Error response interface
interface ErrorResponse {
	error: string;
	message?: string;
	statusCode?: number;
	timestamp?: string;
	path?: string;
	method?: string;
	details?: any;
	stack?: string;
}

// Main error handler middleware
export const errorHandler = (
	err: Error | ApiError,
	req: Request,
	res: Response,
	_next: NextFunction,
) => {
	// Log error
	console.error(`❌ API Error [${req.method} ${req.path}]:`, {
		error: err.message,
		stack: err.stack,
		timestamp: new Date().toISOString(),
	});

	// Default error values
	let statusCode = 500;
	let message = "Internal server error";
	let details;

	// Handle specific error types
	if (err instanceof ApiError) {
		statusCode = err.statusCode;
		message = err.message;
		details = err.details;
	} else if (err.name === "ValidationError") {
		statusCode = 400;
		message = err.message;
	} else if (err.name === "CastError") {
		statusCode = 400;
		message = "Invalid ID format";
	} else if (err.name === "MongoError" && (err as any).code === 11000) {
		statusCode = 409;
		message = "Duplicate entry";
	} else if (err.message?.includes("ECONNREFUSED")) {
		statusCode = 503;
		message = "Service temporarily unavailable";
	}

	// Build error response
	const errorResponse: ErrorResponse = {
		error: message,
		message: err instanceof Error ? err.message : "Unknown error",
		statusCode,
		timestamp: new Date().toISOString(),
		path: req.path,
		method: req.method,
	};

	// Add details in development
	if (process.env.NODE_ENV === "development") {
		errorResponse.details = details;
		errorResponse.stack = err.stack;
	}

	// Send response
	res.status(statusCode).json(errorResponse);
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler =
	(fn: Function) => (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};

// Validation middleware factory
export const validateRequest = (schema: any) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		const { error } = schema.validate(req.body, { abortEarly: false });

		if (error) {
			const details = error.details.map((detail: any) => ({
				field: detail.path.join("."),
				message: detail.message,
			}));

			throw new ValidationError("Validation failed", details);
		}

		next();
	};
};

// Required fields validator
export const requireFields = (...fields: string[]) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		const missingFields = fields.filter((field) => !req.body[field]);

		if (missingFields.length > 0) {
			throw new ValidationError(
				`Missing required fields: ${missingFields.join(", ")}`,
				{ missingFields },
			);
		}

		next();
	};
};

// Query parameter validator
export const requireParams = (...params: string[]) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		const missingParams = params.filter((param) => !req.params[param]);

		if (missingParams.length > 0) {
			throw new ValidationError(
				`Missing required parameters: ${missingParams.join(", ")}`,
				{ missingParams },
			);
		}

		next();
	};
};

// Handle not found routes
export const notFound = (req: Request, _res: Response, _next: NextFunction) => {
	throw new NotFoundError(`Route ${req.originalUrl}`);
};

// Standard success response helper
export const successResponse = (res: Response, data: any, extra: any = {}) => {
	res.json({
		success: true,
		data,
		timestamp: new Date().toISOString(),
		...extra,
	});
};

// Standard error response helper (for manual error responses)
export const errorResponse = (
	res: Response,
	message: string,
	statusCode = 500,
	details?: any,
) => {
	const response: ErrorResponse = {
		error: message,
		statusCode,
		timestamp: new Date().toISOString(),
	};

	if (details && process.env.NODE_ENV === "development") {
		response.details = details;
	}

	res.status(statusCode).json(response);
};

// Health check response helper
export const healthCheckResponse = (
	res: Response,
	service: string,
	status = "healthy",
	details?: any,
) => {
	const isHealthy = status === "healthy";

	res.status(isHealthy ? 200 : 503).json({
		service,
		status,
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		...details,
	});
};

// Pagination helper
export interface PaginationParams {
	page?: number;
	limit?: number;
	sort?: string;
	order?: "asc" | "desc";
}

export const parsePagination = (query: any): PaginationParams => {
	return {
		page: Math.max(1, Number.parseInt(query.page) || 1),
		limit: Math.min(100, Math.max(1, Number.parseInt(query.limit) || 20)),
		sort: query.sort || "createdAt",
		order: query.order === "asc" ? "asc" : "desc",
	};
};

export const paginatedResponse = (
	res: Response,
	data: any[],
	total: number,
	params: PaginationParams,
) => {
	const { page = 1, limit = 20 } = params;
	const totalPages = Math.ceil(total / limit);

	res.json({
		success: true,
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		},
		timestamp: new Date().toISOString(),
	});
};
