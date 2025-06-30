/**
 * Network and HTTP error classes for Amazon API integrations
 */

import { AmazonError } from "./base";

/**
 * Base network error
 */
export class AmazonNetworkError extends AmazonError {
	readonly requestUrl?: string;
	readonly method?: string;
	readonly timeout?: number;

	constructor(
		message: string,
		options: {
			code?: string;
			requestUrl?: string;
			method?: string;
			timeout?: number;
			retryable?: boolean;
			cause?: unknown;
		} = {},
	) {
		super(message, {
			code: options.code ?? "AMAZON_NETWORK_ERROR",
			cause: options.cause,
			retryable: options.retryable ?? true,
		});

		this.requestUrl = options.requestUrl;
		this.method = options.method;
		this.timeout = options.timeout;
	}

	toJSON() {
		return {
			...super.toJSON(),
			requestUrl: this.requestUrl,
			method: this.method,
			timeout: this.timeout,
		};
	}
}

/**
 * Connection timeout error
 */
export class ConnectionTimeoutError extends AmazonNetworkError {
	constructor(requestUrl: string, timeout: number, method?: string) {
		super(
			`Request timed out after ${timeout}ms: ${method || "GET"} ${requestUrl}`,
			{
				code: "CONNECTION_TIMEOUT",
				requestUrl,
				method,
				timeout,
				retryable: true,
			},
		);
	}
}

/**
 * Connection refused error
 */
export class ConnectionRefusedError extends AmazonNetworkError {
	constructor(requestUrl: string, method?: string) {
		super(`Connection refused: ${method || "GET"} ${requestUrl}`, {
			code: "CONNECTION_REFUSED",
			requestUrl,
			method,
			retryable: true,
		});
	}
}

/**
 * DNS resolution error
 */
export class DNSError extends AmazonNetworkError {
	readonly hostname: string;

	constructor(hostname: string, requestUrl: string, method?: string) {
		super(
			`DNS resolution failed for ${hostname}: ${method || "GET"} ${requestUrl}`,
			{
				code: "DNS_ERROR",
				requestUrl,
				method,
				retryable: true,
			},
		);
		this.hostname = hostname;
	}
}

/**
 * SSL/TLS certificate error
 */
export class SSLError extends AmazonNetworkError {
	constructor(requestUrl: string, method?: string, cause?: unknown) {
		super(`SSL/TLS certificate error: ${method || "GET"} ${requestUrl}`, {
			code: "SSL_ERROR",
			requestUrl,
			method,
			retryable: false,
			cause,
		});
	}
}

/**
 * HTTP error (4xx, 5xx status codes)
 */
export class HTTPError extends AmazonNetworkError {
	readonly statusCode: number;
	readonly statusText: string;
	readonly responseBody?: string;
	readonly responseHeaders?: Record<string, string>;

	constructor(
		statusCode: number,
		statusText: string,
		requestUrl: string,
		options: {
			method?: string;
			responseBody?: string;
			responseHeaders?: Record<string, string>;
			retryable?: boolean;
		} = {},
	) {
		const isRetryable =
			options.retryable ?? (statusCode >= 500 || statusCode === 429);

		super(
			`HTTP ${statusCode} ${statusText}: ${options.method || "GET"} ${requestUrl}`,
			{
				code: `HTTP_${statusCode}`,
				requestUrl,
				method: options.method,
				retryable: isRetryable,
			},
		);

		this.statusCode = statusCode;
		this.statusText = statusText;
		this.responseBody = options.responseBody;
		this.responseHeaders = options.responseHeaders;
	}

	toJSON() {
		return {
			...super.toJSON(),
			statusCode: this.statusCode,
			statusText: this.statusText,
			responseBody: this.responseBody,
			responseHeaders: this.responseHeaders,
		};
	}

	/**
	 * Check if this is a client error (4xx)
	 */
	isClientError(): boolean {
		return this.statusCode >= 400 && this.statusCode < 500;
	}

	/**
	 * Check if this is a server error (5xx)
	 */
	isServerError(): boolean {
		return this.statusCode >= 500;
	}

	/**
	 * Check if this is a rate limit error
	 */
	isRateLimit(): boolean {
		return this.statusCode === 429;
	}
}

/**
 * Request body too large error
 */
export class RequestTooLargeError extends HTTPError {
	readonly maxSize: number;

	constructor(requestUrl: string, maxSize: number, method?: string) {
		super(413, "Request Entity Too Large", requestUrl, {
			method,
			retryable: false,
		});
		this.maxSize = maxSize;
	}
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends HTTPError {
	readonly retryAfter?: number;
	readonly limit?: number;
	readonly remaining?: number;
	readonly resetTime?: Date;

	constructor(
		requestUrl: string,
		options: {
			method?: string;
			retryAfter?: number;
			limit?: number;
			remaining?: number;
			resetTime?: Date;
			responseHeaders?: Record<string, string>;
		} = {},
	) {
		super(429, "Too Many Requests", requestUrl, {
			method: options.method,
			responseHeaders: options.responseHeaders,
			retryable: true,
		});

		this.retryAfter = options.retryAfter;
		this.limit = options.limit;
		this.remaining = options.remaining;
		this.resetTime = options.resetTime;
	}

	toJSON() {
		return {
			...super.toJSON(),
			retryAfter: this.retryAfter,
			limit: this.limit,
			remaining: this.remaining,
			resetTime: this.resetTime?.toISOString(),
		};
	}
}

/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends HTTPError {
	readonly retryAfter?: number;

	constructor(
		requestUrl: string,
		options: {
			method?: string;
			retryAfter?: number;
			responseHeaders?: Record<string, string>;
		} = {},
	) {
		super(503, "Service Unavailable", requestUrl, {
			method: options.method,
			responseHeaders: options.responseHeaders,
			retryable: true,
		});

		this.retryAfter = options.retryAfter;
	}
}

/**
 * Network error factory
 */
export class NetworkErrorFactory {
	/**
	 * Create error from fetch/axios error
	 */
	static fromError(
		error: unknown,
		requestUrl: string,
		method?: string,
	): AmazonNetworkError {
		if (error && typeof error === "object") {
			const err = error as any;

			// Handle different error types
			if (err.code === "ECONNREFUSED") {
				return new ConnectionRefusedError(requestUrl, method);
			}

			if (err.code === "ETIMEDOUT" || err.code === "ESOCKETTIMEDOUT") {
				const timeout = err.timeout || 30000;
				return new ConnectionTimeoutError(requestUrl, timeout, method);
			}

			if (err.code === "ENOTFOUND" || err.code === "EAI_NODATA") {
				const hostname = err.hostname || new URL(requestUrl).hostname;
				return new DNSError(hostname, requestUrl, method);
			}

			if (
				err.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
				err.code === "SELF_SIGNED_CERT_IN_CHAIN"
			) {
				return new SSLError(requestUrl, method, error);
			}

			// Handle HTTP response errors
			if (err.response && typeof err.response.status === "number") {
				const { status, statusText, data, headers } = err.response;

				if (status === 429) {
					const retryAfter = headers["retry-after"]
						? Number.parseInt(headers["retry-after"])
						: undefined;
					const limit = headers["x-ratelimit-limit"]
						? Number.parseInt(headers["x-ratelimit-limit"])
						: undefined;
					const remaining = headers["x-ratelimit-remaining"]
						? Number.parseInt(headers["x-ratelimit-remaining"])
						: undefined;
					const resetTime = headers["x-ratelimit-reset"]
						? new Date(Number.parseInt(headers["x-ratelimit-reset"]) * 1000)
						: undefined;

					return new RateLimitError(requestUrl, {
						method,
						retryAfter,
						limit,
						remaining,
						resetTime,
						responseHeaders: headers,
					});
				}

				if (status === 503) {
					const retryAfter = headers["retry-after"]
						? Number.parseInt(headers["retry-after"])
						: undefined;

					return new ServiceUnavailableError(requestUrl, {
						method,
						retryAfter,
						responseHeaders: headers,
					});
				}

				if (status === 413) {
					const maxSize = 1024 * 1024; // Default 1MB, could parse from error
					return new RequestTooLargeError(requestUrl, maxSize, method);
				}

				return new HTTPError(status, statusText || "Unknown", requestUrl, {
					method,
					responseBody: typeof data === "string" ? data : JSON.stringify(data),
					responseHeaders: headers,
				});
			}
		}

		// Fallback to generic network error
		const message = error instanceof Error ? error.message : String(error);
		return new AmazonNetworkError(message, {
			requestUrl,
			method,
			cause: error,
		});
	}

	/**
	 * Create timeout error
	 */
	static timeout(
		requestUrl: string,
		timeout: number,
		method?: string,
	): ConnectionTimeoutError {
		return new ConnectionTimeoutError(requestUrl, timeout, method);
	}

	/**
	 * Create rate limit error
	 */
	static rateLimit(
		requestUrl: string,
		retryAfter?: number,
		method?: string,
	): RateLimitError {
		return new RateLimitError(requestUrl, {
			method,
			retryAfter,
		});
	}

	/**
	 * Create service unavailable error
	 */
	static serviceUnavailable(
		requestUrl: string,
		retryAfter?: number,
		method?: string,
	): ServiceUnavailableError {
		return new ServiceUnavailableError(requestUrl, {
			method,
			retryAfter,
		});
	}
}

/**
 * Network utilities
 */
export class NetworkUtils {
	/**
	 * Check if error is retryable based on type
	 */
	static isRetryable(error: unknown): boolean {
		if (error instanceof AmazonNetworkError) {
			return error.retryable;
		}

		// Check for specific error codes that indicate retryable issues
		if (error && typeof error === "object") {
			const err = error as any;
			const retryableCodes = [
				"ECONNRESET",
				"ECONNREFUSED",
				"ETIMEDOUT",
				"ESOCKETTIMEDOUT",
				"ENOTFOUND",
			];

			if (retryableCodes.includes(err.code)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Extract retry-after value from headers
	 */
	static getRetryAfter(headers: Record<string, string>): number | undefined {
		const retryAfter = headers["retry-after"] || headers["Retry-After"];
		if (!retryAfter) return undefined;

		const seconds = Number.parseInt(retryAfter);
		return Number.isNaN(seconds) ? undefined : seconds * 1000; // Convert to milliseconds
	}

	/**
	 * Extract rate limit info from headers
	 */
	static getRateLimitInfo(headers: Record<string, string>) {
		return {
			limit: headers["x-ratelimit-limit"]
				? Number.parseInt(headers["x-ratelimit-limit"])
				: undefined,
			remaining: headers["x-ratelimit-remaining"]
				? Number.parseInt(headers["x-ratelimit-remaining"])
				: undefined,
			resetTime: headers["x-ratelimit-reset"]
				? new Date(Number.parseInt(headers["x-ratelimit-reset"]) * 1000)
				: undefined,
			retryAfter: NetworkUtils.getRetryAfter(headers),
		};
	}
}
