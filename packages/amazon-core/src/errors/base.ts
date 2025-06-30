/**
 * Base error classes for Amazon API integrations
 * Following AI SDK error patterns
 */

/**
 * Base error class for all Amazon API errors
 * Similar to AI SDK error structure
 */
export abstract class AmazonError extends Error {
	readonly name: string;
	readonly code: string;
	readonly cause?: unknown;
	readonly retryable: boolean;
	readonly timestamp: Date;

	constructor(
		message: string,
		options: {
			code: string;
			cause?: unknown;
			retryable?: boolean;
		},
	) {
		super(message);
		this.name = this.constructor.name;
		this.code = options.code;
		this.cause = options.cause;
		this.retryable = options.retryable ?? false;
		this.timestamp = new Date();

		// Maintain proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Convert error to JSON representation
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			retryable: this.retryable,
			timestamp: this.timestamp.toISOString(),
			stack: this.stack,
			...(this.cause && { cause: this.cause }),
		};
	}

	/**
	 * Check if error is retryable
	 */
	isRetryable(): boolean {
		return this.retryable;
	}

	/**
	 * Get error details for logging
	 */
	getDetails() {
		return {
			code: this.code,
			message: this.message,
			retryable: this.retryable,
			timestamp: this.timestamp,
			cause: this.cause,
		};
	}
}

/**
 * Configuration error
 */
export class AmazonConfigError extends AmazonError {
	constructor(
		message: string,
		options: { field?: string; cause?: unknown } = {},
	) {
		super(message, {
			code: "AMAZON_CONFIG_ERROR",
			cause: options.cause,
			retryable: false,
		});
	}
}

/**
 * Authentication error
 */
export class AmazonAuthError extends AmazonError {
	constructor(
		message: string,
		options: { provider?: string; cause?: unknown } = {},
	) {
		super(message, {
			code: "AMAZON_AUTH_ERROR",
			cause: options.cause,
			retryable: false,
		});
	}
}

/**
 * Generic Amazon API error
 */
export class AmazonAPIError extends AmazonError {
	readonly statusCode?: number;
	readonly requestId?: string;
	readonly provider: string;

	constructor(
		message: string,
		options: {
			code: string;
			provider: string;
			statusCode?: number;
			requestId?: string;
			retryable?: boolean;
			cause?: unknown;
		},
	) {
		super(message, {
			code: options.code,
			cause: options.cause,
			retryable: options.retryable ?? false,
		});

		this.statusCode = options.statusCode;
		this.requestId = options.requestId;
		this.provider = options.provider;
	}

	toJSON() {
		return {
			...super.toJSON(),
			statusCode: this.statusCode,
			requestId: this.requestId,
			provider: this.provider,
		};
	}
}

/**
 * Error type guards
 */
export function isAmazonError(error: unknown): error is AmazonError {
	return error instanceof AmazonError;
}

export function isAmazonConfigError(
	error: unknown,
): error is AmazonConfigError {
	return error instanceof AmazonConfigError;
}

export function isAmazonAuthError(error: unknown): error is AmazonAuthError {
	return error instanceof AmazonAuthError;
}

export function isAmazonAPIError(error: unknown): error is AmazonAPIError {
	return error instanceof AmazonAPIError;
}

/**
 * Service-level error for Amazon service orchestration issues
 */
export class AmazonServiceError extends AmazonError {
	readonly service?: string;
	readonly providers?: string[];

	constructor(
		message: string,
		options: {
			code?: string;
			service?: string;
			providers?: string[];
			retryable?: boolean;
			cause?: unknown;
		} = {},
	) {
		super(message, {
			code: options.code ?? "AMAZON_SERVICE_ERROR",
			cause: options.cause,
			retryable: options.retryable ?? false,
		});

		this.service = options.service;
		this.providers = options.providers;
	}

	toJSON() {
		return {
			...super.toJSON(),
			service: this.service,
			providers: this.providers,
		};
	}
}

/**
 * Error factory for creating specific error types
 */
export class AmazonErrorFactory {
	static config(
		message: string,
		field?: string,
		cause?: unknown,
	): AmazonConfigError {
		return new AmazonConfigError(message, { field, cause });
	}

	static auth(
		message: string,
		provider?: string,
		cause?: unknown,
	): AmazonAuthError {
		return new AmazonAuthError(message, { provider, cause });
	}

	static api(
		message: string,
		provider: string,
		options: {
			code?: string;
			statusCode?: number;
			requestId?: string;
			retryable?: boolean;
			cause?: unknown;
		} = {},
	): AmazonAPIError {
		return new AmazonAPIError(message, {
			code: options.code ?? "AMAZON_API_ERROR",
			provider,
			statusCode: options.statusCode,
			requestId: options.requestId,
			retryable: options.retryable,
			cause: options.cause,
		});
	}
}

/**
 * Error utilities
 */
export class ErrorUtils {
	/**
	 * Check if an error should be retried
	 */
	static isRetryable(error: unknown): boolean {
		if (isAmazonError(error)) {
			return error.isRetryable();
		}

		// Check for network errors that are typically retryable
		if (error instanceof Error) {
			const retryableMessages = [
				"ECONNRESET",
				"ETIMEDOUT",
				"ENOTFOUND",
				"ECONNREFUSED",
				"Network Error",
			];
			return retryableMessages.some((msg) => error.message.includes(msg));
		}

		return false;
	}

	/**
	 * Extract error message from various error types
	 */
	static getMessage(error: unknown): string {
		if (error instanceof Error) {
			return error.message;
		}
		if (typeof error === "string") {
			return error;
		}
		if (error && typeof error === "object" && "message" in error) {
			return String(error.message);
		}
		return "Unknown error occurred";
	}

	/**
	 * Extract error code from various error types
	 */
	static getCode(error: unknown): string {
		if (isAmazonError(error)) {
			return error.code;
		}
		if (error && typeof error === "object" && "code" in error) {
			return String(error.code);
		}
		return "UNKNOWN_ERROR";
	}

	/**
	 * Create a sanitized error for client consumption
	 */
	static sanitize(error: unknown): {
		message: string;
		code: string;
		retryable: boolean;
	} {
		return {
			message: ErrorUtils.getMessage(error),
			code: ErrorUtils.getCode(error),
			retryable: ErrorUtils.isRetryable(error),
		};
	}
}
