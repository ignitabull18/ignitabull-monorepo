/**
 * Enterprise API Rate Limiting Middleware
 * Advanced rate limiting with multiple algorithms and storage backends
 */

import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./error-handler";

export interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
	algorithm:
		| "fixed-window"
		| "sliding-window"
		| "token-bucket"
		| "leaky-bucket";
	skipSuccessfulRequests?: boolean;
	skipFailedRequests?: boolean;
	keyGenerator?: (req: Request) => string;
	onLimitReached?: (req: Request, res: Response) => void;
	store?: RateLimitStore;
	headers?: boolean; // Include rate limit headers
	standardHeaders?: boolean; // Use standard X-RateLimit headers
	legacyHeaders?: boolean; // Use legacy X-Rate-Limit headers
	message?: string | ((req: Request) => string);
	statusCode?: number;
	skipIf?: (req: Request) => boolean;
	tiers?: RateLimitTier[];
}

export interface RateLimitTier {
	name: string;
	condition: (req: Request) => boolean;
	windowMs: number;
	maxRequests: number;
	priority: number;
}

export interface RateLimitStore {
	get(key: string): Promise<RateLimitRecord | null>;
	set(key: string, record: RateLimitRecord, ttl: number): Promise<void>;
	increment(key: string, ttl: number): Promise<RateLimitRecord>;
	delete(key: string): Promise<void>;
	clear(): Promise<void>;
}

export interface RateLimitRecord {
	count: number;
	resetTime: number;
	tokens?: number; // For token bucket
	lastUpdate?: number; // For leaky bucket
}

export interface RateLimitInfo {
	limit: number;
	remaining: number;
	resetTime: Date;
	retryAfter?: number;
}

/**
 * In-memory rate limit store
 */
export class MemoryRateLimitStore implements RateLimitStore {
	private store = new Map<string, RateLimitRecord>();
	private timers = new Map<string, NodeJS.Timeout>();

	async get(key: string): Promise<RateLimitRecord | null> {
		return this.store.get(key) || null;
	}

	async set(key: string, record: RateLimitRecord, ttl: number): Promise<void> {
		this.store.set(key, record);

		// Clear existing timer
		const existingTimer = this.timers.get(key);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// Set expiry timer
		const timer = setTimeout(() => {
			this.store.delete(key);
			this.timers.delete(key);
		}, ttl);

		this.timers.set(key, timer);
	}

	async increment(key: string, ttl: number): Promise<RateLimitRecord> {
		const existing = this.store.get(key);
		const now = Date.now();

		if (!existing) {
			const record: RateLimitRecord = {
				count: 1,
				resetTime: now + ttl,
			};
			await this.set(key, record, ttl);
			return record;
		}

		existing.count++;
		await this.set(key, existing, existing.resetTime - now);
		return existing;
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
		const timer = this.timers.get(key);
		if (timer) {
			clearTimeout(timer);
			this.timers.delete(key);
		}
	}

	async clear(): Promise<void> {
		this.store.clear();
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear();
	}

	// Cleanup method for shutdown
	cleanup(): void {
		this.clear();
	}
}

/**
 * Redis rate limit store
 */
export class RedisRateLimitStore implements RateLimitStore {
	constructor(private redis: any) {}

	async get(key: string): Promise<RateLimitRecord | null> {
		try {
			const data = await this.redis.get(key);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error("Redis rate limit get error:", error);
			return null;
		}
	}

	async set(key: string, record: RateLimitRecord, ttl: number): Promise<void> {
		try {
			await this.redis.setex(
				key,
				Math.ceil(ttl / 1000),
				JSON.stringify(record),
			);
		} catch (error) {
			console.error("Redis rate limit set error:", error);
		}
	}

	async increment(key: string, ttl: number): Promise<RateLimitRecord> {
		try {
			const multi = this.redis.multi();
			multi.incr(key);
			multi.expire(key, Math.ceil(ttl / 1000));
			const results = await multi.exec();

			const count = results[0][1];
			const now = Date.now();

			return {
				count,
				resetTime: now + ttl,
			};
		} catch (error) {
			console.error("Redis rate limit increment error:", error);
			return { count: 0, resetTime: Date.now() + ttl };
		}
	}

	async delete(key: string): Promise<void> {
		try {
			await this.redis.del(key);
		} catch (error) {
			console.error("Redis rate limit delete error:", error);
		}
	}

	async clear(): Promise<void> {
		try {
			// This is dangerous in production - implement pattern-based deletion
			const keys = await this.redis.keys("rate-limit:*");
			if (keys.length > 0) {
				await this.redis.del(...keys);
			}
		} catch (error) {
			console.error("Redis rate limit clear error:", error);
		}
	}
}

/**
 * Rate limiting algorithms
 */
export class RateLimitAlgorithms {
	/**
	 * Fixed window algorithm
	 */
	static async fixedWindow(
		key: string,
		config: RateLimitConfig,
		store: RateLimitStore,
	): Promise<RateLimitInfo> {
		const now = Date.now();
		const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
		const windowKey = `${key}:${windowStart}`;

		const record = await store.increment(windowKey, config.windowMs);

		return {
			limit: config.maxRequests,
			remaining: Math.max(0, config.maxRequests - record.count),
			resetTime: new Date(record.resetTime),
			retryAfter:
				record.count > config.maxRequests
					? Math.ceil((record.resetTime - now) / 1000)
					: undefined,
		};
	}

	/**
	 * Sliding window algorithm
	 */
	static async slidingWindow(
		key: string,
		config: RateLimitConfig,
		store: RateLimitStore,
	): Promise<RateLimitInfo> {
		const now = Date.now();
		const _windowStart = now - config.windowMs;

		// This is a simplified version - production would use sorted sets in Redis
		const record = (await store.get(key)) || {
			count: 0,
			resetTime: now + config.windowMs,
		};

		// Reset if window has passed
		if (record.resetTime <= now) {
			record.count = 0;
			record.resetTime = now + config.windowMs;
		}

		record.count++;
		await store.set(key, record, config.windowMs);

		return {
			limit: config.maxRequests,
			remaining: Math.max(0, config.maxRequests - record.count),
			resetTime: new Date(record.resetTime),
			retryAfter:
				record.count > config.maxRequests
					? Math.ceil((record.resetTime - now) / 1000)
					: undefined,
		};
	}

	/**
	 * Token bucket algorithm
	 */
	static async tokenBucket(
		key: string,
		config: RateLimitConfig,
		store: RateLimitStore,
	): Promise<RateLimitInfo> {
		const now = Date.now();
		const refillRate = config.maxRequests / config.windowMs; // tokens per ms

		let record = await store.get(key);

		if (!record) {
			record = {
				count: 0,
				tokens: config.maxRequests,
				lastUpdate: now,
				resetTime: now + config.windowMs,
			};
		}

		// Refill tokens
		const timePassed = now - (record.lastUpdate || now);
		const tokensToAdd = Math.floor(timePassed * refillRate);
		record.tokens = Math.min(
			config.maxRequests,
			(record.tokens || 0) + tokensToAdd,
		);
		record.lastUpdate = now;

		// Consume token
		if (record.tokens > 0) {
			record.tokens--;
			record.count++;
		}

		await store.set(key, record, config.windowMs);

		return {
			limit: config.maxRequests,
			remaining: record.tokens,
			resetTime: new Date(now + config.windowMs),
			retryAfter: record.tokens === 0 ? Math.ceil(1 / refillRate) : undefined,
		};
	}

	/**
	 * Leaky bucket algorithm
	 */
	static async leakyBucket(
		key: string,
		config: RateLimitConfig,
		store: RateLimitStore,
	): Promise<RateLimitInfo> {
		const now = Date.now();
		const leakRate = config.maxRequests / config.windowMs; // requests per ms

		let record = await store.get(key);

		if (!record) {
			record = {
				count: 1,
				lastUpdate: now,
				resetTime: now + config.windowMs,
			};
		} else {
			// Leak requests
			const timePassed = now - (record.lastUpdate || now);
			const leaked = Math.floor(timePassed * leakRate);
			record.count = Math.max(0, record.count - leaked);
			record.count++;
			record.lastUpdate = now;
		}

		await store.set(key, record, config.windowMs);

		return {
			limit: config.maxRequests,
			remaining: Math.max(0, config.maxRequests - record.count),
			resetTime: new Date(now + config.windowMs),
			retryAfter:
				record.count > config.maxRequests
					? Math.ceil(record.count / leakRate)
					: undefined,
		};
	}
}

/**
 * Default key generator
 */
function defaultKeyGenerator(req: Request): string {
	// Use IP address with X-Forwarded-For support
	const forwarded = req.headers["x-forwarded-for"] as string;
	const ip = forwarded
		? forwarded.split(",")[0].trim()
		: req.ip || req.connection.remoteAddress;
	return `rate-limit:${ip}`;
}

/**
 * Default message generator
 */
function defaultMessage(_req: Request): string {
	return "Too many requests, please try again later.";
}

/**
 * Create rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
	const {
		windowMs,
		maxRequests,
		algorithm = "fixed-window",
		skipSuccessfulRequests = false,
		skipFailedRequests = false,
		keyGenerator = defaultKeyGenerator,
		onLimitReached,
		store = new MemoryRateLimitStore(),
		headers = true,
		standardHeaders = true,
		legacyHeaders = false,
		message = defaultMessage,
		statusCode = 429,
		skipIf,
		tiers,
	} = config;

	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Skip if condition is met
			if (skipIf?.(req)) {
				return next();
			}

			// Determine which tier to use
			let activeConfig = config;
			if (tiers) {
				const applicableTiers = tiers
					.filter((tier) => tier.condition(req))
					.sort((a, b) => a.priority - b.priority);

				if (applicableTiers.length > 0) {
					const tier = applicableTiers[0];
					activeConfig = {
						...config,
						windowMs: tier.windowMs,
						maxRequests: tier.maxRequests,
					};
				}
			}

			const key = keyGenerator(req);

			// Apply rate limiting algorithm
			let rateLimitInfo: RateLimitInfo;

			switch (algorithm) {
				case "sliding-window":
					rateLimitInfo = await RateLimitAlgorithms.slidingWindow(
						key,
						activeConfig,
						store,
					);
					break;
				case "token-bucket":
					rateLimitInfo = await RateLimitAlgorithms.tokenBucket(
						key,
						activeConfig,
						store,
					);
					break;
				case "leaky-bucket":
					rateLimitInfo = await RateLimitAlgorithms.leakyBucket(
						key,
						activeConfig,
						store,
					);
					break;
				default:
					rateLimitInfo = await RateLimitAlgorithms.fixedWindow(
						key,
						activeConfig,
						store,
					);
			}

			// Add headers
			if (headers) {
				if (standardHeaders) {
					res.set({
						"X-RateLimit-Limit": rateLimitInfo.limit.toString(),
						"X-RateLimit-Remaining": rateLimitInfo.remaining.toString(),
						"X-RateLimit-Reset": Math.ceil(
							rateLimitInfo.resetTime.getTime() / 1000,
						).toString(),
					});
				}

				if (legacyHeaders) {
					res.set({
						"X-Rate-Limit-Limit": rateLimitInfo.limit.toString(),
						"X-Rate-Limit-Remaining": rateLimitInfo.remaining.toString(),
						"X-Rate-Limit-Reset": Math.ceil(
							rateLimitInfo.resetTime.getTime() / 1000,
						).toString(),
					});
				}

				if (rateLimitInfo.retryAfter) {
					res.set("Retry-After", rateLimitInfo.retryAfter.toString());
				}
			}

			// Check if limit exceeded
			if (rateLimitInfo.remaining < 0) {
				if (onLimitReached) {
					onLimitReached(req, res);
				}

				const errorMessage =
					typeof message === "function" ? message(req) : message;

				throw new ApiError("RATE_LIMIT_EXCEEDED", errorMessage, statusCode, {
					limit: rateLimitInfo.limit,
					remaining: rateLimitInfo.remaining,
					resetTime: rateLimitInfo.resetTime,
					retryAfter: rateLimitInfo.retryAfter,
				});
			}
			// Store rate limit info for later use
			(req as any).rateLimit = rateLimitInfo;

			next();
		} catch (error) {
			next(error);
		}
	};
}

/**
 * Preset configurations
 */
export const RateLimitPresets = {
	// Strict limits for authentication endpoints
	auth: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 5,
		algorithm: "sliding-window" as const,
		message: "Too many authentication attempts, please try again later.",
		tiers: [
			{
				name: "authenticated",
				condition: (req: Request) => !!(req as any).user,
				windowMs: 15 * 60 * 1000,
				maxRequests: 10, // Higher limit for authenticated users
				priority: 1,
			},
		],
	},

	// Standard API limits
	api: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 100,
		algorithm: "token-bucket" as const,
		skipSuccessfulRequests: false,
		skipFailedRequests: false,
	},

	// Upload limits
	upload: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 10,
		algorithm: "leaky-bucket" as const,
		message: "Upload rate limit exceeded, please wait before uploading again.",
	},

	// Search limits
	search: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 30,
		algorithm: "fixed-window" as const,
	},
};

/**
 * Global rate limiter with multiple tiers
 */
export function createTieredRateLimit() {
	return createRateLimit({
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 60, // Default: 1 request per second
		algorithm: "token-bucket",
		tiers: [
			{
				name: "premium",
				condition: (req: Request) => (req as any).user?.tier === "premium",
				windowMs: 60 * 1000,
				maxRequests: 1000, // Premium: ~16 requests per second
				priority: 1,
			},
			{
				name: "authenticated",
				condition: (req: Request) => !!(req as any).user,
				windowMs: 60 * 1000,
				maxRequests: 300, // Authenticated: 5 requests per second
				priority: 2,
			},
			{
				name: "anonymous",
				condition: () => true,
				windowMs: 60 * 1000,
				maxRequests: 60, // Anonymous: 1 request per second
				priority: 3,
			},
		],
	});
}
