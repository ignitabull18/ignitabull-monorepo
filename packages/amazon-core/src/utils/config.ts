/**
 * Configuration utilities for Amazon API integrations
 * Following AI SDK configuration patterns
 */

import type {
	AdvertisingConfig,
	AssociatesConfig,
	BaseAmazonConfig,
	CacheConfig,
	LoggerConfig,
	RateLimitConfig,
	RetryConfig,
	SPAPIConfig,
} from "../types/config";

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Environment variable loader
 */
export class EnvironmentLoader {
	/**
	 * Load configuration from environment variables
	 */
	static loadSPAPIConfig(): Partial<SPAPIConfig> {
		return {
			clientId: process.env.AMAZON_SP_CLIENT_ID,
			clientSecret: process.env.AMAZON_SP_CLIENT_SECRET,
			refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN,
			lwaClientId: process.env.AMAZON_LWA_CLIENT_ID,
			lwaClientSecret: process.env.AMAZON_LWA_CLIENT_SECRET,
			region: (process.env.AMAZON_SP_REGION as any) || "us-east-1",
			sandbox: process.env.AMAZON_SP_SANDBOX === "true",
		};
	}

	static loadAdvertisingConfig(): Partial<AdvertisingConfig> {
		return {
			clientId: process.env.AMAZON_ADV_CLIENT_ID,
			clientSecret: process.env.AMAZON_ADV_CLIENT_SECRET,
			refreshToken: process.env.AMAZON_ADV_REFRESH_TOKEN,
			profileId: process.env.AMAZON_ADV_PROFILE_ID,
			region: (process.env.AMAZON_ADV_REGION as any) || "us-east-1",
			sandbox: process.env.AMAZON_ADV_SANDBOX === "true",
		};
	}

	static loadAssociatesConfig(): Partial<AssociatesConfig> {
		return {
			accessKey: process.env.AMAZON_ASSOCIATES_ACCESS_KEY,
			secretKey: process.env.AMAZON_ASSOCIATES_SECRET_KEY,
			partnerTag: process.env.AMAZON_ASSOCIATES_PARTNER_TAG,
			partnerType:
				(process.env.AMAZON_ASSOCIATES_PARTNER_TYPE as any) || "Associates",
			region: (process.env.AMAZON_ASSOCIATES_REGION as any) || "us-east-1",
			host: process.env.AMAZON_ASSOCIATES_HOST || "webservices.amazon.com",
		};
	}

	static loadRetryConfig(): RetryConfig {
		return {
			maxRetries: Number.parseInt(process.env.AMAZON_MAX_RETRIES || "3"),
			baseDelay: Number.parseInt(process.env.AMAZON_BASE_DELAY || "1000"),
			maxDelay: Number.parseInt(process.env.AMAZON_MAX_DELAY || "30000"),
			backoffMultiplier: Number.parseFloat(
				process.env.AMAZON_BACKOFF_MULTIPLIER || "2",
			),
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		};
	}

	static loadRateLimitConfig(): RateLimitConfig {
		return {
			requestsPerSecond: Number.parseFloat(
				process.env.AMAZON_REQUESTS_PER_SECOND || "1",
			),
			burstLimit: Number.parseInt(process.env.AMAZON_BURST_LIMIT || "10"),
			jitter: process.env.AMAZON_RATE_LIMIT_JITTER !== "false",
			backoffMultiplier: Number.parseFloat(
				process.env.AMAZON_BACKOFF_MULTIPLIER || "2",
			),
			maxBackoffTime: Number.parseInt(
				process.env.AMAZON_MAX_BACKOFF_TIME || "60000",
			),
		};
	}

	static loadCacheConfig(): CacheConfig {
		return {
			enabled: process.env.AMAZON_CACHE_ENABLED !== "false",
			ttl: Number.parseInt(process.env.AMAZON_CACHE_TTL || "300"),
			maxSize: Number.parseInt(process.env.AMAZON_CACHE_MAX_SIZE || "1000"),
			keyPrefix: process.env.AMAZON_CACHE_PREFIX || "amazon_api",
		};
	}

	static loadLoggerConfig(): LoggerConfig {
		return {
			level: (process.env.LOG_LEVEL as any) || "info",
			enableConsole: process.env.LOG_CONSOLE !== "false",
			enableFile: process.env.LOG_FILE === "true",
			format: (process.env.LOG_FORMAT as any) || "json",
		};
	}
}

/**
 * Configuration validator
 */
export class ConfigValidator {
	/**
	 * Validate SP-API configuration
	 */
	static validateSPAPIConfig(
		config: Partial<SPAPIConfig>,
	): ConfigValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Required fields
		const required = [
			"clientId",
			"clientSecret",
			"refreshToken",
			"lwaClientId",
			"lwaClientSecret",
		];
		for (const field of required) {
			if (!config[field as keyof SPAPIConfig]) {
				errors.push(`Missing required SP-API field: ${field}`);
			}
		}

		// Validate region
		const validRegions = [
			"us-east-1",
			"us-west-2",
			"eu-west-1",
			"eu-central-1",
			"ap-northeast-1",
		];
		if (config.region && !validRegions.includes(config.region)) {
			warnings.push(`Unknown SP-API region: ${config.region}`);
		}

		// Check sandbox mode
		if (config.sandbox) {
			warnings.push("SP-API is configured for sandbox mode");
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Validate Advertising API configuration
	 */
	static validateAdvertisingConfig(
		config: Partial<AdvertisingConfig>,
	): ConfigValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Required fields
		const required = ["clientId", "clientSecret", "refreshToken", "profileId"];
		for (const field of required) {
			if (!config[field as keyof AdvertisingConfig]) {
				errors.push(`Missing required Advertising API field: ${field}`);
			}
		}

		// Validate region
		const validRegions = [
			"us-east-1",
			"us-west-2",
			"eu-west-1",
			"eu-central-1",
			"ap-northeast-1",
		];
		if (config.region && !validRegions.includes(config.region)) {
			warnings.push(`Unknown Advertising API region: ${config.region}`);
		}

		// Check sandbox mode
		if (config.sandbox) {
			warnings.push("Advertising API is configured for sandbox mode");
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Validate Associates API configuration
	 */
	static validateAssociatesConfig(
		config: Partial<AssociatesConfig>,
	): ConfigValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Required fields
		const required = ["accessKey", "secretKey", "partnerTag"];
		for (const field of required) {
			if (!config[field as keyof AssociatesConfig]) {
				errors.push(`Missing required Associates API field: ${field}`);
			}
		}

		// Validate partner tag format
		if (config.partnerTag && !/^[a-zA-Z0-9_-]{1,20}$/.test(config.partnerTag)) {
			errors.push("Invalid partner tag format");
		}

		// Validate access key format
		if (config.accessKey && !/^[A-Z0-9]{20}$/.test(config.accessKey)) {
			warnings.push("Access key format looks incorrect");
		}

		// Validate partner type
		const validPartnerTypes = ["Associates"];
		if (config.partnerType && !validPartnerTypes.includes(config.partnerType)) {
			warnings.push(`Unknown partner type: ${config.partnerType}`);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Validate retry configuration
	 */
	static validateRetryConfig(config: RetryConfig): ConfigValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (config.maxRetries < 0 || config.maxRetries > 10) {
			warnings.push("Max retries should be between 0 and 10");
		}

		if (config.baseDelay < 100 || config.baseDelay > 10000) {
			warnings.push("Base delay should be between 100ms and 10s");
		}

		if (config.maxDelay < config.baseDelay) {
			errors.push("Max delay must be greater than base delay");
		}

		if (config.backoffMultiplier < 1 || config.backoffMultiplier > 10) {
			warnings.push("Backoff multiplier should be between 1 and 10");
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Validate rate limit configuration
	 */
	static validateRateLimitConfig(
		config: RateLimitConfig,
	): ConfigValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (config.requestsPerSecond <= 0) {
			errors.push("Requests per second must be positive");
		}

		if (config.requestsPerSecond > 100) {
			warnings.push("High requests per second may violate API limits");
		}

		if (config.burstLimit <= 0) {
			errors.push("Burst limit must be positive");
		}

		if (config.burstLimit < config.requestsPerSecond) {
			warnings.push(
				"Burst limit should be at least as high as requests per second",
			);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}
}

/**
 * Configuration builder for fluent configuration creation
 */
export class ConfigBuilder {
	private config: Partial<BaseAmazonConfig> = {};

	/**
	 * Set base configuration
	 */
	withBaseConfig(baseConfig: Partial<BaseAmazonConfig>): this {
		this.config = { ...this.config, ...baseConfig };
		return this;
	}

	/**
	 * Set timeout
	 */
	withTimeout(timeout: number): this {
		this.config.timeout = timeout;
		return this;
	}

	/**
	 * Set retry configuration
	 */
	withRetry(retryConfig: RetryConfig): this {
		this.config.retry = retryConfig;
		return this;
	}

	/**
	 * Set rate limit configuration
	 */
	withRateLimit(rateLimitConfig: RateLimitConfig): this {
		this.config.rateLimit = rateLimitConfig;
		return this;
	}

	/**
	 * Set cache configuration
	 */
	withCache(cacheConfig: CacheConfig): this {
		this.config.cache = cacheConfig;
		return this;
	}

	/**
	 * Set logger configuration
	 */
	withLogger(loggerConfig: LoggerConfig): this {
		this.config.logger = loggerConfig;
		return this;
	}

	/**
	 * Enable debug mode
	 */
	withDebug(debug = true): this {
		this.config.debug = debug;
		return this;
	}

	/**
	 * Enable sandbox mode
	 */
	withSandbox(sandbox = true): this {
		this.config.sandbox = sandbox;
		return this;
	}

	/**
	 * Build SP-API configuration
	 */
	buildSPAPIConfig(overrides?: Partial<SPAPIConfig>): SPAPIConfig {
		const envConfig = EnvironmentLoader.loadSPAPIConfig();
		const config = {
			...this.config,
			...envConfig,
			...overrides,
		} as SPAPIConfig;

		const validation = ConfigValidator.validateSPAPIConfig(config);
		if (!validation.isValid) {
			throw new Error(
				`Invalid SP-API configuration: ${validation.errors.join(", ")}`,
			);
		}

		return config;
	}

	/**
	 * Build Advertising API configuration
	 */
	buildAdvertisingConfig(
		overrides?: Partial<AdvertisingConfig>,
	): AdvertisingConfig {
		const envConfig = EnvironmentLoader.loadAdvertisingConfig();
		const config = {
			...this.config,
			...envConfig,
			...overrides,
		} as AdvertisingConfig;

		const validation = ConfigValidator.validateAdvertisingConfig(config);
		if (!validation.isValid) {
			throw new Error(
				`Invalid Advertising API configuration: ${validation.errors.join(", ")}`,
			);
		}

		return config;
	}

	/**
	 * Build Associates API configuration
	 */
	buildAssociatesConfig(
		overrides?: Partial<AssociatesConfig>,
	): AssociatesConfig {
		const envConfig = EnvironmentLoader.loadAssociatesConfig();
		const config = {
			...this.config,
			...envConfig,
			...overrides,
		} as AssociatesConfig;

		const validation = ConfigValidator.validateAssociatesConfig(config);
		if (!validation.isValid) {
			throw new Error(
				`Invalid Associates API configuration: ${validation.errors.join(", ")}`,
			);
		}

		return config;
	}
}

/**
 * Configuration manager for all Amazon APIs
 */
export class ConfigManager {
	private configs = new Map<string, any>();
	private static instance: ConfigManager;

	static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager();
		}
		return ConfigManager.instance;
	}

	/**
	 * Register a configuration
	 */
	register<T>(key: string, config: T): void {
		this.configs.set(key, config);
	}

	/**
	 * Get a configuration
	 */
	get<T>(key: string): T | undefined {
		return this.configs.get(key);
	}

	/**
	 * Check if configuration exists
	 */
	has(key: string): boolean {
		return this.configs.has(key);
	}

	/**
	 * Clear all configurations
	 */
	clear(): void {
		this.configs.clear();
	}

	/**
	 * Cleanup resources - call on app shutdown
	 */
	cleanup(): void {
		this.clear();
	}

	/**
	 * Reset singleton instance (useful for testing)
	 */
	static resetInstance(): void {
		ConfigManager.instance = undefined as any;
	}

	/**
	 * Validate all registered configurations
	 */
	validateAll(): Record<string, ConfigValidationResult> {
		const results: Record<string, ConfigValidationResult> = {};

		for (const [key, config] of this.configs) {
			try {
				if (key.includes("sp-api")) {
					results[key] = ConfigValidator.validateSPAPIConfig(config);
				} else if (key.includes("advertising")) {
					results[key] = ConfigValidator.validateAdvertisingConfig(config);
				} else if (key.includes("associates")) {
					results[key] = ConfigValidator.validateAssociatesConfig(config);
				} else if (key.includes("retry")) {
					results[key] = ConfigValidator.validateRetryConfig(config);
				} else if (key.includes("rate-limit")) {
					results[key] = ConfigValidator.validateRateLimitConfig(config);
				}
			} catch (error) {
				results[key] = {
					isValid: false,
					errors: [error instanceof Error ? error.message : String(error)],
					warnings: [],
				};
			}
		}

		return results;
	}

	/**
	 * Load default configurations from environment
	 */
	loadDefaults(): void {
		try {
			this.register("sp-api", EnvironmentLoader.loadSPAPIConfig());
			this.register("advertising", EnvironmentLoader.loadAdvertisingConfig());
			this.register("associates", EnvironmentLoader.loadAssociatesConfig());
			this.register("retry", EnvironmentLoader.loadRetryConfig());
			this.register("rate-limit", EnvironmentLoader.loadRateLimitConfig());
			this.register("cache", EnvironmentLoader.loadCacheConfig());
			this.register("logger", EnvironmentLoader.loadLoggerConfig());
		} catch (error) {
			console.warn("Failed to load some default configurations:", error);
		}
	}
}

/**
 * Configuration utilities
 */
export class ConfigUtils {
	/**
	 * Merge configurations with precedence
	 */
	static merge<T extends Record<string, any>>(
		base: T,
		...overrides: Partial<T>[]
	): T {
		return Object.assign({}, base, ...overrides);
	}

	/**
	 * Deep merge configurations
	 */
	static deepMerge<T extends Record<string, any>>(
		base: T,
		override: Partial<T>,
	): T {
		const result = { ...base };

		for (const key in override) {
			const value = override[key];
			if (value !== undefined) {
				if (
					typeof value === "object" &&
					!Array.isArray(value) &&
					value !== null
				) {
					result[key] = ConfigUtils.deepMerge(
						result[key] || {},
						value,
					) as T[Extract<keyof T, string>];
				} else {
					result[key] = value as T[Extract<keyof T, string>];
				}
			}
		}

		return result;
	}

	/**
	 * Create configuration from environment with defaults
	 */
	static fromEnvironment<T extends Record<string, any>>(
		loader: () => Partial<T>,
		defaults: T,
		validator?: (config: T) => ConfigValidationResult,
	): T {
		const envConfig = loader();
		const config = ConfigUtils.merge(defaults, envConfig);

		if (validator) {
			const validation = validator(config);
			if (!validation.isValid) {
				throw new Error(
					`Configuration validation failed: ${validation.errors.join(", ")}`,
				);
			}

			if (validation.warnings.length > 0) {
				console.warn("Configuration warnings:", validation.warnings);
			}
		}

		return config;
	}

	/**
	 * Redact sensitive configuration values for logging
	 */
	static redact<T extends Record<string, any>>(config: T): T {
		const sensitiveKeys = [
			"secret",
			"key",
			"token",
			"password",
			"credential",
			"auth",
		];

		const redacted = { ...config };

		for (const key in redacted) {
			const value = redacted[key];
			if (typeof value === "string") {
				const lowerKey = key.toLowerCase();
				if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
					redacted[key] = (
						value.length > 0 ? "***REDACTED***" : value
					) as T[Extract<keyof T, string>];
				}
			} else if (typeof value === "object" && value !== null) {
				redacted[key] = ConfigUtils.redact(value) as T[Extract<
					keyof T,
					string
				>];
			}
		}

		return redacted;
	}

	/**
	 * Create default configuration builder
	 */
	static createBuilder(): ConfigBuilder {
		return new ConfigBuilder()
			.withTimeout(30000)
			.withRetry(EnvironmentLoader.loadRetryConfig())
			.withRateLimit(EnvironmentLoader.loadRateLimitConfig())
			.withCache(EnvironmentLoader.loadCacheConfig())
			.withLogger(EnvironmentLoader.loadLoggerConfig())
			.withDebug(process.env.NODE_ENV === "development");
	}
}
