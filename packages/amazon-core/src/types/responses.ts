/**
 * Response types for Amazon API providers
 * Following AI SDK response patterns
 */

import type { RateLimitInfo } from "./common";

/**
 * Base response wrapper following AI SDK patterns
 */
export interface BaseResponse<T = unknown> {
	data: T;
	success: boolean;
	timestamp: Date;
	requestId?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T = unknown> extends BaseResponse<T> {
	pagination: {
		nextToken?: string;
		hasMore: boolean;
		totalCount?: number;
		pageSize?: number;
	};
}

/**
 * Response with rate limit information
 */
export interface RateLimitedResponse<T = unknown> extends BaseResponse<T> {
	rateLimit: RateLimitInfo;
}

/**
 * Combined response with all metadata
 */
export interface AmazonAPIResponse<T = unknown> extends BaseResponse<T> {
	pagination?: {
		nextToken?: string;
		hasMore: boolean;
		totalCount?: number;
		pageSize?: number;
	};
	rateLimit?: RateLimitInfo;
	performance?: {
		duration: number;
		cached: boolean;
		retryCount: number;
	};
}

/**
 * Streaming response for real-time data
 * Following AI SDK streaming patterns
 */
export interface StreamResponse<T = unknown> {
	stream: ReadableStream<T>;
	headers: Record<string, string>;
	status: number;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
	error: {
		code: string;
		message: string;
		details?: unknown;
		requestId?: string;
	};
	success: false;
	timestamp: Date;
}

/**
 * Batch operation response
 */
export interface BatchResponse<T = unknown> {
	results: Array<{
		success: boolean;
		data?: T;
		error?: {
			code: string;
			message: string;
		};
	}>;
	summary: {
		total: number;
		successful: number;
		failed: number;
	};
	timestamp: Date;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
	status: "healthy" | "unhealthy" | "degraded";
	checks: Array<{
		name: string;
		status: "pass" | "fail" | "warn";
		message?: string;
		duration?: number;
	}>;
	timestamp: Date;
	uptime: number;
}

/**
 * Metrics response for monitoring
 */
export interface MetricsResponse {
	metrics: Array<{
		name: string;
		value: number;
		unit: string;
		timestamp: Date;
		labels?: Record<string, string>;
	}>;
	period: {
		start: Date;
		end: Date;
	};
}

/**
 * Generic operation result
 */
export interface OperationResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		retryable?: boolean;
	};
	metadata?: {
		duration: number;
		retryCount: number;
		cached: boolean;
	};
}

/**
 * File download response
 */
export interface DownloadResponse {
	content: Buffer | string;
	contentType: string;
	filename?: string;
	size: number;
	lastModified?: Date;
}

/**
 * Upload response
 */
export interface UploadResponse {
	success: boolean;
	fileId: string;
	url?: string;
	metadata?: {
		size: number;
		contentType: string;
		checksum?: string;
	};
}

/**
 * Async operation response (for long-running tasks)
 */
export interface AsyncOperationResponse {
	operationId: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress?: number; // 0-100
	estimatedCompletion?: Date;
	result?: unknown;
	error?: {
		code: string;
		message: string;
	};
}

/**
 * Response type helpers for type narrowing
 */
export type SuccessfulResponse<T> = BaseResponse<T> & { success: true };
export type FailureResponse = ErrorResponse & { success: false };

/**
 * Type guard functions
 */
export function isSuccessResponse<T>(
	response: BaseResponse<T> | ErrorResponse,
): response is SuccessfulResponse<T> {
	return response.success === true;
}

export function isErrorResponse(
	response: BaseResponse<unknown> | ErrorResponse,
): response is ErrorResponse {
	return response.success === false;
}

export function isPaginatedResponse<T>(
	response: BaseResponse<T>,
): response is PaginatedResponse<T> {
	return "pagination" in response;
}

export function isRateLimitedResponse<T>(
	response: BaseResponse<T>,
): response is RateLimitedResponse<T> {
	return "rateLimit" in response;
}

/**
 * Response builder utilities
 */
export class ResponseBuilder {
	static success<T>(
		data: T,
		metadata?: Partial<AmazonAPIResponse<T>>,
	): AmazonAPIResponse<T> {
		return {
			data,
			success: true,
			timestamp: new Date(),
			...metadata,
		};
	}

	static error(
		code: string,
		message: string,
		details?: unknown,
	): ErrorResponse {
		return {
			error: {
				code,
				message,
				details,
			},
			success: false,
			timestamp: new Date(),
		};
	}

	static paginated<T>(
		data: T,
		pagination: PaginatedResponse<T>["pagination"],
		metadata?: Partial<AmazonAPIResponse<T>>,
	): PaginatedResponse<T> {
		return {
			data,
			success: true,
			timestamp: new Date(),
			pagination,
			...metadata,
		};
	}

	static batch<T>(results: BatchResponse<T>["results"]): BatchResponse<T> {
		const summary = {
			total: results.length,
			successful: results.filter((r) => r.success).length,
			failed: results.filter((r) => !r.success).length,
		};

		return {
			results,
			summary,
			timestamp: new Date(),
		};
	}
}
