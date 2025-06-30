/**
 * Rate limiting utilities for Amazon API integrations
 */

import type { RateLimitConfig } from "../types/config";

/**
 * Token bucket rate limiter implementation
 */
export class RateLimiter {
	private tokens: number;
	private lastRefill: number;
	private readonly config: RateLimitConfig;

	constructor(config: RateLimitConfig) {
		this.config = config;
		this.tokens = config.burstLimit;
		this.lastRefill = Date.now();
	}

	/**
	 * Attempt to consume a token
	 * Returns true if request is allowed, false if rate limited
	 */
	async consume(): Promise<boolean> {
		this.refillTokens();

		if (this.tokens >= 1) {
			this.tokens -= 1;
			return true;
		}

		return false;
	}

	/**
	 * Wait until a token is available
	 */
	async waitForToken(): Promise<void> {
		while (!(await this.consume())) {
			const waitTime = this.getWaitTime();
			await this.sleep(waitTime);
		}
	}

	/**
	 * Get estimated wait time until next token is available
	 */
	getWaitTime(): number {
		if (this.tokens >= 1) {
			return 0;
		}

		// Calculate time until next token refill
		const timeSinceRefill = Date.now() - this.lastRefill;
		const refillInterval = 1000 / this.config.requestsPerSecond;
		const timeUntilNextToken =
			refillInterval - (timeSinceRefill % refillInterval);

		if (this.config.jitter) {
			// Add jitter to avoid thundering herd
			const jitterAmount = timeUntilNextToken * 0.1; // 10% jitter
			return timeUntilNextToken + Math.random() * jitterAmount;
		}

		return timeUntilNextToken;
	}

	/**
	 * Get current rate limit status
	 */
	getStatus() {
		this.refillTokens();
		return {
			tokensRemaining: Math.floor(this.tokens),
			maxTokens: this.config.burstLimit,
			refillRate: this.config.requestsPerSecond,
			estimatedWaitTime: this.getWaitTime(),
		};
	}

	/**
	 * Reset the rate limiter
	 */
	reset(): void {
		this.tokens = this.config.burstLimit;
		this.lastRefill = Date.now();
	}

	private refillTokens(): void {
		const now = Date.now();
		const timePassed = now - this.lastRefill;
		const tokensToAdd = (timePassed / 1000) * this.config.requestsPerSecond;

		this.tokens = Math.min(this.config.burstLimit, this.tokens + tokensToAdd);
		this.lastRefill = now;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Distributed rate limiter for multiple instances
 */
export class DistributedRateLimiter {
	private localLimiter: RateLimiter;
	private readonly key: string;
	private readonly storage: RateLimitStorage;

	constructor(key: string, config: RateLimitConfig, storage: RateLimitStorage) {
		this.key = key;
		this.localLimiter = new RateLimiter(config);
		this.storage = storage;
	}

	async consume(): Promise<boolean> {
		// First check local rate limiter
		if (!(await this.localLimiter.consume())) {
			return false;
		}

		// Then check distributed storage
		try {
			const allowed = await this.storage.consume(this.key);
			if (!allowed) {
				// Refund the local token since distributed limit was hit
				this.localLimiter.tokens += 1;
				return false;
			}
			return true;
		} catch (error) {
			// If storage is unavailable, fall back to local limiter
			console.warn("Distributed rate limiter storage error:", error);
			return true;
		}
	}

	async waitForToken(): Promise<void> {
		while (!(await this.consume())) {
			const waitTime = this.localLimiter.getWaitTime();
			await new Promise((resolve) => setTimeout(resolve, waitTime));
		}
	}
}

/**
 * Interface for rate limit storage backends
 */
export interface RateLimitStorage {
	consume(key: string): Promise<boolean>;
	getStatus(key: string): Promise<{ remaining: number; resetTime: Date }>;
	reset(key: string): Promise<void>;
}

/**
 * In-memory rate limit storage (for single instance)
 */
export class MemoryRateLimitStorage implements RateLimitStorage {
	private limiters = new Map<string, RateLimiter>();
	private readonly defaultConfig: RateLimitConfig;

	constructor(defaultConfig: RateLimitConfig) {
		this.defaultConfig = defaultConfig;
	}

	async consume(key: string): Promise<boolean> {
		let limiter = this.limiters.get(key);
		if (!limiter) {
			limiter = new RateLimiter(this.defaultConfig);
			this.limiters.set(key, limiter);
		}
		return limiter.consume();
	}

	async getStatus(
		key: string,
	): Promise<{ remaining: number; resetTime: Date }> {
		const limiter = this.limiters.get(key);
		if (!limiter) {
			return {
				remaining: this.defaultConfig.burstLimit,
				resetTime: new Date(Date.now() + 1000),
			};
		}

		const status = limiter.getStatus();
		return {
			remaining: status.tokensRemaining,
			resetTime: new Date(Date.now() + status.estimatedWaitTime),
		};
	}

	async reset(key: string): Promise<void> {
		const limiter = this.limiters.get(key);
		if (limiter) {
			limiter.reset();
		}
	}
}

/**
 * Redis-backed rate limit storage (for distributed systems)
 */
export class RedisRateLimitStorage implements RateLimitStorage {
	private readonly redis: any; // Redis client type
	private readonly config: RateLimitConfig;

	constructor(redis: any, config: RateLimitConfig) {
		this.redis = redis;
		this.config = config;
	}

	async consume(key: string): Promise<boolean> {
		const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      
      local current = redis.call('GET', key)
      if current == false then
        redis.call('SET', key, 1)
        redis.call('EXPIRE', key, window)
        return 1
      end
      
      current = tonumber(current)
      if current < limit then
        redis.call('INCR', key)
        return 1
      end
      
      return 0
    `;

		const result = await this.redis.eval(
			script,
			1,
			key,
			this.config.burstLimit,
			Math.ceil(this.config.burstLimit / this.config.requestsPerSecond),
			Math.floor(Date.now() / 1000),
		);

		return result === 1;
	}

	async getStatus(
		key: string,
	): Promise<{ remaining: number; resetTime: Date }> {
		const [current, ttl] = await Promise.all([
			this.redis.get(key),
			this.redis.ttl(key),
		]);

		const used = current ? Number.parseInt(current) : 0;
		const remaining = Math.max(0, this.config.burstLimit - used);
		const resetTime = new Date(Date.now() + ttl * 1000);

		return { remaining, resetTime };
	}

	async reset(key: string): Promise<void> {
		await this.redis.del(key);
	}
}

/**
 * Rate limiter manager for multiple APIs
 */
export class RateLimiterManager {
	private limiters = new Map<string, RateLimiter>();
	private readonly storage?: RateLimitStorage;

	constructor(storage?: RateLimitStorage) {
		this.storage = storage;
	}

	/**
	 * Get or create a rate limiter for a specific key
	 */
	getLimiter(key: string, config: RateLimitConfig): RateLimiter {
		let limiter = this.limiters.get(key);
		if (!limiter) {
			limiter = this.storage
				? new DistributedRateLimiter(key, config, this.storage)
				: new RateLimiter(config);
			this.limiters.set(key, limiter);
		}
		return limiter;
	}

	/**
	 * Create rate limiter key for API endpoint
	 */
	static createKey(
		provider: string,
		endpoint: string,
		userId?: string,
	): string {
		const parts = [provider, endpoint];
		if (userId) {
			parts.push(userId);
		}
		return parts.join(":");
	}

	/**
	 * Get rate limiter for Amazon SP-API
	 */
	getSPAPILimiter(endpoint: string, config: RateLimitConfig): RateLimiter {
		const key = RateLimiterManager.createKey("sp-api", endpoint);
		return this.getLimiter(key, config);
	}

	/**
	 * Get rate limiter for Amazon Advertising API
	 */
	getAdvertisingLimiter(
		endpoint: string,
		config: RateLimitConfig,
	): RateLimiter {
		const key = RateLimiterManager.createKey("advertising", endpoint);
		return this.getLimiter(key, config);
	}

	/**
	 * Get rate limiter for Amazon Associates API
	 */
	getAssociatesLimiter(endpoint: string, config: RateLimitConfig): RateLimiter {
		const key = RateLimiterManager.createKey("associates", endpoint);
		return this.getLimiter(key, config);
	}

	/**
	 * Reset all rate limiters
	 */
	resetAll(): void {
		this.limiters.forEach((limiter) => {
			if ("reset" in limiter) {
				limiter.reset();
			}
		});
	}

	/**
	 * Get status of all rate limiters
	 */
	getAllStatus(): Record<string, any> {
		const status: Record<string, any> = {};
		this.limiters.forEach((limiter, key) => {
			if ("getStatus" in limiter) {
				status[key] = limiter.getStatus();
			}
		});
		return status;
	}
}
