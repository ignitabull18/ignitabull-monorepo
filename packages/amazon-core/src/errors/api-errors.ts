/**
 * API-specific error classes for Amazon integrations
 */

import { AmazonAPIError } from "./base";

/**
 * SP-API specific errors
 */
export class SPAPIError extends AmazonAPIError {
	constructor(
		message: string,
		options: {
			code?: string;
			statusCode?: number;
			requestId?: string;
			retryable?: boolean;
			cause?: unknown;
		} = {},
	) {
		super(message, {
			...options,
			provider: "sp-api",
			code: options.code ?? "SP_API_ERROR",
		});
	}
}

/**
 * SP-API rate limit error
 */
export class SPAPIRateLimitError extends SPAPIError {
	readonly retryAfter?: number;

	constructor(message: string, retryAfter?: number, requestId?: string) {
		super(message, {
			code: "SP_API_RATE_LIMIT",
			statusCode: 429,
			requestId,
			retryable: true,
		});
		this.retryAfter = retryAfter;
	}
}

/**
 * SP-API quota exceeded error
 */
export class SPAPIQuotaExceededError extends SPAPIError {
	constructor(message: string, requestId?: string) {
		super(message, {
			code: "SP_API_QUOTA_EXCEEDED",
			statusCode: 403,
			requestId,
			retryable: false,
		});
	}
}

/**
 * Advertising API specific errors
 */
export class AdvertisingAPIError extends AmazonAPIError {
	constructor(
		message: string,
		options: {
			code?: string;
			statusCode?: number;
			requestId?: string;
			retryable?: boolean;
			cause?: unknown;
		} = {},
	) {
		super(message, {
			...options,
			provider: "advertising",
			code: options.code ?? "ADVERTISING_API_ERROR",
		});
	}
}

/**
 * Advertising API invalid profile error
 */
export class AdvertisingAPIInvalidProfileError extends AdvertisingAPIError {
	constructor(profileId: string, requestId?: string) {
		super(`Invalid profile ID: ${profileId}`, {
			code: "ADVERTISING_INVALID_PROFILE",
			statusCode: 400,
			requestId,
			retryable: false,
		});
	}
}

/**
 * Advertising API insufficient permissions error
 */
export class AdvertisingAPIPermissionError extends AdvertisingAPIError {
	constructor(message: string, requestId?: string) {
		super(message, {
			code: "ADVERTISING_PERMISSION_ERROR",
			statusCode: 403,
			requestId,
			retryable: false,
		});
	}
}

/**
 * Associates API specific errors
 */
export class AssociatesAPIError extends AmazonAPIError {
	constructor(
		message: string,
		options: {
			code?: string;
			statusCode?: number;
			requestId?: string;
			retryable?: boolean;
			cause?: unknown;
		} = {},
	) {
		super(message, {
			...options,
			provider: "associates",
			code: options.code ?? "ASSOCIATES_API_ERROR",
		});
	}
}

/**
 * Associates API rate limit error (TPS exceeded)
 */
export class AssociatesAPITPSError extends AssociatesAPIError {
	constructor(message: string, requestId?: string) {
		super(message, {
			code: "ASSOCIATES_TPS_EXCEEDED",
			statusCode: 429,
			requestId,
			retryable: true,
		});
	}
}

/**
 * Associates API invalid partner tag error
 */
export class AssociatesAPIInvalidPartnerError extends AssociatesAPIError {
	constructor(partnerTag: string, requestId?: string) {
		super(`Invalid partner tag: ${partnerTag}`, {
			code: "ASSOCIATES_INVALID_PARTNER",
			statusCode: 400,
			requestId,
			retryable: false,
		});
	}
}

/**
 * Associates API revenue requirement error
 */
export class AssociatesAPIRevenueError extends AssociatesAPIError {
	constructor(message: string, requestId?: string) {
		super(message, {
			code: "ASSOCIATES_REVENUE_REQUIREMENT",
			statusCode: 403,
			requestId,
			retryable: false,
		});
	}
}

/**
 * Product not found error (common across APIs)
 */
export class ProductNotFoundError extends AmazonAPIError {
	readonly asin: string;

	constructor(asin: string, provider: string, requestId?: string) {
		super(`Product not found: ${asin}`, {
			code: "PRODUCT_NOT_FOUND",
			provider,
			statusCode: 404,
			requestId,
			retryable: false,
		});
		this.asin = asin;
	}
}

/**
 * Order not found error
 */
export class OrderNotFoundError extends SPAPIError {
	readonly orderId: string;

	constructor(orderId: string, requestId?: string) {
		super(`Order not found: ${orderId}`, {
			code: "ORDER_NOT_FOUND",
			statusCode: 404,
			requestId,
			retryable: false,
		});
		this.orderId = orderId;
	}
}

/**
 * Campaign not found error
 */
export class CampaignNotFoundError extends AdvertisingAPIError {
	readonly campaignId: string;

	constructor(campaignId: string, requestId?: string) {
		super(`Campaign not found: ${campaignId}`, {
			code: "CAMPAIGN_NOT_FOUND",
			statusCode: 404,
			requestId,
			retryable: false,
		});
		this.campaignId = campaignId;
	}
}

/**
 * Invalid marketplace error
 */
export class InvalidMarketplaceError extends AmazonAPIError {
	readonly marketplace: string;

	constructor(marketplace: string, provider: string, requestId?: string) {
		super(`Invalid marketplace: ${marketplace}`, {
			code: "INVALID_MARKETPLACE",
			provider,
			statusCode: 400,
			requestId,
			retryable: false,
		});
		this.marketplace = marketplace;
	}
}

/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends AmazonAPIError {
	constructor(provider: string, message?: string, requestId?: string) {
		super(message ?? `${provider} service is temporarily unavailable`, {
			code: "SERVICE_UNAVAILABLE",
			provider,
			statusCode: 503,
			requestId,
			retryable: true,
		});
	}
}

/**
 * Error factory for API-specific errors
 */
export class APIErrorFactory {
	/**
	 * Create SP-API error from response
	 */
	static spapi(
		code: string,
		message: string,
		statusCode?: number,
		requestId?: string,
	): SPAPIError {
		// Handle specific SP-API error codes
		switch (code) {
			case "QuotaExceeded":
				return new SPAPIQuotaExceededError(message, requestId);
			case "Throttled":
				return new SPAPIRateLimitError(message, undefined, requestId);
			default:
				return new SPAPIError(message, {
					code,
					statusCode,
					requestId,
					retryable: statusCode ? statusCode >= 500 : false,
				});
		}
	}

	/**
	 * Create Advertising API error from response
	 */
	static advertising(
		code: string,
		message: string,
		statusCode?: number,
		requestId?: string,
	): AdvertisingAPIError {
		// Handle specific Advertising API error codes
		switch (code) {
			case "INVALID_PROFILE":
				return new AdvertisingAPIInvalidProfileError(message, requestId);
			case "UNAUTHORIZED":
				return new AdvertisingAPIPermissionError(message, requestId);
			default:
				return new AdvertisingAPIError(message, {
					code,
					statusCode,
					requestId,
					retryable: statusCode ? statusCode >= 500 : false,
				});
		}
	}

	/**
	 * Create Associates API error from response
	 */
	static associates(
		code: string,
		message: string,
		statusCode?: number,
		requestId?: string,
	): AssociatesAPIError {
		// Handle specific Associates API error codes
		switch (code) {
			case "TooManyRequests":
				return new AssociatesAPITPSError(message, requestId);
			case "InvalidPartnerTag":
				return new AssociatesAPIInvalidPartnerError(message, requestId);
			case "InsufficientRevenue":
				return new AssociatesAPIRevenueError(message, requestId);
			default:
				return new AssociatesAPIError(message, {
					code,
					statusCode,
					requestId,
					retryable: statusCode ? statusCode >= 500 : false,
				});
		}
	}

	/**
	 * Create error from HTTP response
	 */
	static fromResponse(
		provider: string,
		response: {
			status: number;
			statusText: string;
			data?: any;
		},
		requestId?: string,
	): AmazonAPIError {
		const { status, statusText, data } = response;
		const message = data?.message || data?.error?.message || statusText;
		const code = data?.code || data?.error?.code || `HTTP_${status}`;

		switch (provider) {
			case "sp-api":
				return APIErrorFactory.spapi(code, message, status, requestId);
			case "advertising":
				return APIErrorFactory.advertising(code, message, status, requestId);
			case "associates":
				return APIErrorFactory.associates(code, message, status, requestId);
			default:
				return new AmazonAPIError(message, {
					code,
					provider,
					statusCode: status,
					requestId,
					retryable: status >= 500,
				});
		}
	}
}
