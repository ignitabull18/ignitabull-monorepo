/**
 * Configuration types for Amazon API providers
 * Following AI SDK configuration patterns
 */

import type { AmazonMarketplace } from "./common";

/**
 * Base configuration shared by all Amazon providers
 */
export interface BaseAmazonConfig {
	marketplace: AmazonMarketplace;
	region: string;
	debug?: boolean;
	timeout?: number;
	retries?: number;
	retry?: RetryConfig;
	cache?: CacheConfig;
	rateLimit?: RateLimitConfig;
	logger?: LoggerConfig;
	sandbox?: boolean;
}

/**
 * SP-API specific configuration
 */
export interface SPAPIConfig extends BaseAmazonConfig {
	clientId: string;
	clientSecret: string;
	refreshToken: string;
	lwaClientId: string;
	lwaClientSecret: string;
	sellerId?: string;
	roleArn?: string;
	sandbox?: boolean;
}

/**
 * Advertising API specific configuration
 */
export interface AdvertisingConfig extends BaseAmazonConfig {
	clientId: string;
	clientSecret: string;
	refreshToken: string;
	profileId: string;
	apiVersion?: string;
	retry?: RetryConfig;
	cache?: CacheConfig;
	sandbox?: boolean;
}

/**
 * Associates API specific configuration
 */
export interface AssociatesConfig extends BaseAmazonConfig {
	accessKey: string;
	secretKey: string;
	partnerTag: string;
	partnerType: "Associates";
	host?: string;
	retry?: RetryConfig;
	cache?: CacheConfig;
}

/**
 * Brand Analytics API specific configuration
 */
export interface BrandAnalyticsConfig extends BaseAmazonConfig {
	clientId: string;
	clientSecret: string;
	refreshToken: string;
	advertisingAccountId: string;
	brandEntityId?: string;
	defaultMarketplaceId?: string;
	sandbox?: boolean;
}

/**
 * DSP API specific configuration
 */
export interface DSPConfig extends BaseAmazonConfig {
	clientId: string;
	clientSecret: string;
	refreshToken: string;
	advertiserId: string;
	sandbox?: boolean;
}

/**
 * Unified Amazon configuration
 * Contains all provider configurations
 */
export interface AmazonConfig {
	spApi?: SPAPIConfig;
	advertising?: AdvertisingConfig;
	associates?: AssociatesConfig;
	brandAnalytics?: BrandAnalyticsConfig;
	dsp?: DSPConfig;

	// Global settings
	global?: {
		debug?: boolean;
		timeout?: number;
		retries?: number;
		defaultMarketplace?: AmazonMarketplace;
		defaultRegion?: string;
	};
}

/**
 * Environment variable mapping for configuration
 */
export interface AmazonEnvConfig {
	// SP-API
	AMAZON_SP_CLIENT_ID?: string;
	AMAZON_SP_CLIENT_SECRET?: string;
	AMAZON_SP_REFRESH_TOKEN?: string;
	AMAZON_SP_LWA_CLIENT_ID?: string;
	AMAZON_SP_LWA_CLIENT_SECRET?: string;
	AMAZON_SP_SELLER_ID?: string;
	AMAZON_SP_REGION?: string;
	AMAZON_SP_MARKETPLACE?: string;

	// Advertising API
	AMAZON_ADS_CLIENT_ID?: string;
	AMAZON_ADS_CLIENT_SECRET?: string;
	AMAZON_ADS_REFRESH_TOKEN?: string;
	AMAZON_ADS_PROFILE_ID?: string;
	AMAZON_ADS_REGION?: string;

	// Associates API
	AMAZON_ASSOCIATES_ACCESS_KEY?: string;
	AMAZON_ASSOCIATES_SECRET_KEY?: string;
	AMAZON_ASSOCIATES_PARTNER_TAG?: string;
	AMAZON_ASSOCIATES_REGION?: string;
	AMAZON_ASSOCIATES_MARKETPLACE?: string;

	// Brand Analytics API
	AMAZON_BRAND_ANALYTICS_CLIENT_ID?: string;
	AMAZON_BRAND_ANALYTICS_CLIENT_SECRET?: string;
	AMAZON_BRAND_ANALYTICS_REFRESH_TOKEN?: string;
	AMAZON_BRAND_ANALYTICS_ADVERTISING_ACCOUNT_ID?: string;
	AMAZON_BRAND_ANALYTICS_BRAND_ENTITY_ID?: string;
	AMAZON_BRAND_ANALYTICS_REGION?: string;

	// DSP API
	AMAZON_DSP_CLIENT_ID?: string;
	AMAZON_DSP_CLIENT_SECRET?: string;
	AMAZON_DSP_REFRESH_TOKEN?: string;
	AMAZON_DSP_ADVERTISER_ID?: string;
	AMAZON_DSP_REGION?: string;
	AMAZON_DSP_SANDBOX?: string;

	// Global settings
	AMAZON_DEBUG?: string;
	AMAZON_TIMEOUT?: string;
	AMAZON_RETRIES?: string;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
	requestsPerSecond: number;
	burstLimit: number;
	backoffMultiplier: number;
	maxBackoffTime: number;
	jitter: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
	maxRetries: number;
	baseDelay: number;
	maxDelay: number;
	backoffMultiplier: number;
	retryableStatuses: number[];
	retryableErrors: string[];
}

/**
 * Cache configuration
 */
export interface CacheConfig {
	enabled: boolean;
	ttl: number; // Time to live in seconds
	maxSize: number; // Maximum cache size
	keyPrefix: string;
}

/**
 * Log levels
 */
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Logger configuration
 */
export interface LoggerConfig {
	level: LogLevel;
	enableConsole: boolean;
	enableFile: boolean;
	format: "json" | "pretty";
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
	enabled: boolean;
	level: "debug" | "info" | "warn" | "error";
	includeRequestBody: boolean;
	includeResponseBody: boolean;
	sanitizeCredentials: boolean;
}

/**
 * Advanced provider configuration
 */
export interface AdvancedConfig {
	rateLimit?: RateLimitConfig;
	retry?: RetryConfig;
	cache?: CacheConfig;
	logging?: LoggingConfig;
}

/**
 * Configuration validation schema keys
 */
export const CONFIG_SCHEMA_KEYS = {
	SP_API: [
		"clientId",
		"clientSecret",
		"refreshToken",
		"lwaClientId",
		"lwaClientSecret",
	],
	ADVERTISING: ["clientId", "clientSecret", "refreshToken", "profileId"],
	ASSOCIATES: ["accessKey", "secretKey", "partnerTag"],
	BRAND_ANALYTICS: [
		"clientId",
		"clientSecret",
		"refreshToken",
		"advertisingAccountId",
	],
	DSP: ["clientId", "clientSecret", "refreshToken", "advertiserId"],
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
	timeout: 30000, // 30 seconds
	retries: 3,
	debug: false,
	marketplace: "ATVPDKIKX0DER" as AmazonMarketplace, // US
	region: "us-east-1",

	rateLimit: {
		requestsPerSecond: 10,
		burstLimit: 20,
		backoffMultiplier: 2,
		maxBackoffTime: 60000,
		jitter: true,
	} as RateLimitConfig,

	retry: {
		maxRetries: 3,
		baseDelay: 1000,
		maxDelay: 30000,
		backoffMultiplier: 2,
		retryableStatuses: [429, 500, 502, 503, 504],
		retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
	} as RetryConfig,

	cache: {
		enabled: true,
		ttl: 300, // 5 minutes
		maxSize: 1000,
		keyPrefix: "amazon_api",
	} as CacheConfig,

	logging: {
		enabled: true,
		level: "info" as const,
		includeRequestBody: false,
		includeResponseBody: false,
		sanitizeCredentials: true,
	} as LoggingConfig,
} as const;
