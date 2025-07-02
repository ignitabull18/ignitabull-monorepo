/**
 * Base provider class for Amazon API providers
 * Provides common functionality like rate limiting, caching, and retry logic
 */

import type {
	CacheConfig,
	RateLimitConfig,
	RetryConfig,
} from "../types/config";
import type { BaseAmazonProvider } from "../types/provider";
import { MemoryCache } from "../utils/cache";
import { createProviderLogger } from "../utils/logger";
import { RateLimiter } from "../utils/rate-limiter";
import { ExponentialBackoffStrategy, RetryExecutor } from "../utils/retry";

export abstract class BaseProvider implements BaseAmazonProvider {
	abstract readonly providerId: string;
	abstract readonly name: string;
	abstract readonly version: string;

	protected readonly cache: MemoryCache;
	protected readonly rateLimiters = new Map<string, RateLimiter>();
	protected readonly retryExecutor: RetryExecutor;
	protected readonly logger: any;

	constructor(cacheConfig?: CacheConfig, retryConfig?: RetryConfig) {
		// Initialize cache
		this.cache = new MemoryCache(
			cacheConfig || {
				enabled: true,
				ttl: 300,
				maxSize: 1000,
				keyPrefix: "amazon_provider",
			},
		);

		// Initialize retry executor
		const strategy = new ExponentialBackoffStrategy(
			retryConfig || {
				maxRetries: 3,
				baseDelay: 1000,
				maxDelay: 30000,
				backoffMultiplier: 2,
				retryableStatuses: [429, 500, 502, 503, 504],
				retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
			},
		);

		this.retryExecutor = new RetryExecutor(
			strategy,
			retryConfig || {
				maxRetries: 3,
				baseDelay: 1000,
				maxDelay: 30000,
				backoffMultiplier: 2,
				retryableStatuses: [429, 500, 502, 503, 504],
				retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
			},
		);

		// Initialize logger after construction
		setTimeout(() => {
			(this as any).logger = createProviderLogger(this.providerId);
		}, 0);
	}

	abstract initialize(): Promise<void>;
	abstract healthCheck(): Promise<{
		status: "healthy" | "unhealthy";
		message?: string;
	}>;
	abstract getRateLimit(): Promise<{ remaining: number; resetTime: Date }>;

	/**
	 * Ensure rate limiting is applied for a specific endpoint
	 */
	protected async ensureRateLimit(
		endpoint: string,
		rateLimitConfig?: RateLimitConfig,
	): Promise<void> {
		if (!this.rateLimiters.has(endpoint)) {
			const config = rateLimitConfig || {
				requestsPerSecond: 1,
				burstLimit: 10,
				backoffMultiplier: 2,
				maxBackoffTime: 60000,
				jitter: true,
			};
			this.rateLimiters.set(endpoint, new RateLimiter(config));
		}

		const rateLimiter = this.rateLimiters.get(endpoint)!;
		await rateLimiter.waitForToken();
	}

	/**
	 * Clear cache entries matching a pattern
	 */
	protected clearCachePattern(pattern: string): void {
		this.cache.clearPattern(pattern);
	}

	/**
	 * Get from cache with fallback
	 */
	protected async getFromCache<T>(
		key: string,
		fetcher: () => Promise<T>,
		ttl?: number,
	): Promise<T> {
		const cached = (await this.cache.get(key)) as T | undefined;
		if (cached !== undefined) {
			return cached;
		}

		const result = await fetcher();
		await this.cache.set(key, result, ttl);
		return result;
	}

	/**
	 * Execute with retry logic
	 */
	protected async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
		return this.retryExecutor.execute(operation);
	}
}
