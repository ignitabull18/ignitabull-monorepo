/**
 * Caching utilities for Amazon API integrations
 * Following AI SDK caching patterns
 */

import type { CacheConfig } from "../types/config";

/**
 * Cache interface for consistent caching across providers
 */
export interface Cache<T = any> {
	get(key: string): Promise<T | undefined>;
	set(key: string, value: T, ttl?: number): Promise<void>;
	delete(key: string): Promise<boolean>;
	clear(): Promise<void>;
	has(key: string): Promise<boolean>;
	size(): Promise<number>;
	keys(): Promise<string[]>;
}

/**
 * In-memory cache implementation
 */
export class MemoryCache<T = any> implements Cache<T> {
	private store = new Map<string, { value: T; expires: number }>();
	private readonly config: CacheConfig;
	private cleanupTimer?: NodeJS.Timeout;

	constructor(config: CacheConfig = { defaultTTL: 300, maxSize: 1000 }) {
		this.config = config;

		// Cleanup expired entries periodically
		if (config.cleanupInterval) {
			this.cleanupTimer = setInterval(
				() => this.cleanup(),
				config.cleanupInterval * 1000,
			);
		}
	}

	async get(key: string): Promise<T | undefined> {
		const entry = this.store.get(key);

		if (!entry) {
			return undefined;
		}

		// Check if expired
		if (Date.now() > entry.expires) {
			this.store.delete(key);
			return undefined;
		}

		return entry.value;
	}

	async set(key: string, value: T, ttl?: number): Promise<void> {
		// Apply size limit
		if (this.config.maxSize && this.store.size >= this.config.maxSize) {
			// Remove oldest entry (LRU-style)
			const firstKey = this.store.keys().next().value;
			if (firstKey) {
				this.store.delete(firstKey);
			}
		}

		const expiry = Date.now() + (ttl || this.config.defaultTTL) * 1000;
		this.store.set(key, { value, expires: expiry });
	}

	async delete(key: string): Promise<boolean> {
		return this.store.delete(key);
	}

	async clear(): Promise<void> {
		this.store.clear();
	}

	async has(key: string): Promise<boolean> {
		const entry = this.store.get(key);
		if (!entry) return false;

		if (Date.now() > entry.expires) {
			this.store.delete(key);
			return false;
		}

		return true;
	}

	async size(): Promise<number> {
		this.cleanup();
		return this.store.size;
	}

	async keys(): Promise<string[]> {
		this.cleanup();
		return Array.from(this.store.keys());
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.store) {
			if (now > entry.expires) {
				this.store.delete(key);
			}
		}
	}

	/**
	 * Destroy the cache and cleanup resources
	 */
	destroy(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = undefined;
		}
		this.store.clear();
	}
}

/**
 * Redis cache implementation
 */
export class RedisCache<T = any> implements Cache<T> {
	private readonly redis: any; // Redis client type
	private readonly keyPrefix: string;

	constructor(redis: any, keyPrefix = "amazon:") {
		this.redis = redis;
		this.keyPrefix = keyPrefix;
	}

	private getKey(key: string): string {
		return `${this.keyPrefix}${key}`;
	}

	async get(key: string): Promise<T | undefined> {
		try {
			const value = await this.redis.get(this.getKey(key));
			return value ? JSON.parse(value) : undefined;
		} catch (error) {
			console.warn("Redis cache get error:", error);
			return undefined;
		}
	}

	async set(key: string, value: T, ttl?: number): Promise<void> {
		try {
			const serialized = JSON.stringify(value);
			if (ttl) {
				await this.redis.setex(this.getKey(key), ttl, serialized);
			} else {
				await this.redis.set(this.getKey(key), serialized);
			}
		} catch (error) {
			console.warn("Redis cache set error:", error);
		}
	}

	async delete(key: string): Promise<boolean> {
		try {
			const result = await this.redis.del(this.getKey(key));
			return result > 0;
		} catch (error) {
			console.warn("Redis cache delete error:", error);
			return false;
		}
	}

	async clear(): Promise<void> {
		try {
			const keys = await this.redis.keys(`${this.keyPrefix}*`);
			if (keys.length > 0) {
				await this.redis.del(...keys);
			}
		} catch (error) {
			console.warn("Redis cache clear error:", error);
		}
	}

	async has(key: string): Promise<boolean> {
		try {
			const exists = await this.redis.exists(this.getKey(key));
			return exists > 0;
		} catch (error) {
			console.warn("Redis cache has error:", error);
			return false;
		}
	}

	async size(): Promise<number> {
		try {
			const keys = await this.redis.keys(`${this.keyPrefix}*`);
			return keys.length;
		} catch (error) {
			console.warn("Redis cache size error:", error);
			return 0;
		}
	}

	async keys(): Promise<string[]> {
		try {
			const keys = await this.redis.keys(`${this.keyPrefix}*`);
			return keys.map((key: string) => key.replace(this.keyPrefix, ""));
		} catch (error) {
			console.warn("Redis cache keys error:", error);
			return [];
		}
	}
}

/**
 * Multi-level cache with L1 (memory) and L2 (persistent) layers
 */
export class MultiLevelCache<T = any> implements Cache<T> {
	private readonly l1Cache: MemoryCache<T>;
	private readonly l2Cache: Cache<T>;
	private readonly config: {
		l1TTL: number;
		l2TTL: number;
		syncToL2: boolean;
	};

	constructor(
		l2Cache: Cache<T>,
		config: {
			l1TTL?: number;
			l2TTL?: number;
			syncToL2?: boolean;
			l1MaxSize?: number;
		} = {},
	) {
		this.l1Cache = new MemoryCache<T>({
			defaultTTL: config.l1TTL || 60,
			maxSize: config.l1MaxSize || 500,
		});
		this.l2Cache = l2Cache;
		this.config = {
			l1TTL: config.l1TTL || 60,
			l2TTL: config.l2TTL || 3600,
			syncToL2: config.syncToL2 ?? true,
		};
	}

	async get(key: string): Promise<T | undefined> {
		// Try L1 cache first
		let value = await this.l1Cache.get(key);
		if (value !== undefined) {
			return value;
		}

		// Fall back to L2 cache
		value = await this.l2Cache.get(key);
		if (value !== undefined) {
			// Populate L1 cache
			await this.l1Cache.set(key, value, this.config.l1TTL);
		}

		return value;
	}

	async set(key: string, value: T, ttl?: number): Promise<void> {
		// Set in L1 cache
		await this.l1Cache.set(key, value, ttl || this.config.l1TTL);

		// Optionally set in L2 cache
		if (this.config.syncToL2) {
			await this.l2Cache.set(key, value, ttl || this.config.l2TTL);
		}
	}

	async delete(key: string): Promise<boolean> {
		const [l1Result, l2Result] = await Promise.all([
			this.l1Cache.delete(key),
			this.l2Cache.delete(key),
		]);
		return l1Result || l2Result;
	}

	async clear(): Promise<void> {
		await Promise.all([this.l1Cache.clear(), this.l2Cache.clear()]);
	}

	async has(key: string): Promise<boolean> {
		if (await this.l1Cache.has(key)) {
			return true;
		}
		return this.l2Cache.has(key);
	}

	async size(): Promise<number> {
		// Return L2 cache size as it's the canonical source
		return this.l2Cache.size();
	}

	async keys(): Promise<string[]> {
		return this.l2Cache.keys();
	}
}

/**
 * Cache key builder for consistent key generation
 */
export class CacheKeyBuilder {
	private readonly prefix: string;
	private readonly separator: string;

	constructor(prefix = "amazon", separator = ":") {
		this.prefix = prefix;
		this.separator = separator;
	}

	/**
	 * Build cache key from components
	 */
	build(...components: (string | number | undefined)[]): string {
		const parts = [this.prefix, ...components.filter((c) => c !== undefined)];
		return parts.join(this.separator);
	}

	/**
	 * Build key for API response
	 */
	apiResponse(
		provider: string,
		endpoint: string,
		params?: Record<string, any>,
	): string {
		const paramHash = params ? this.hashParams(params) : undefined;
		return this.build("api", provider, endpoint, paramHash);
	}

	/**
	 * Build key for user-specific data
	 */
	userSpecific(userId: string, dataType: string, identifier?: string): string {
		return this.build("user", userId, dataType, identifier);
	}

	/**
	 * Build key for temporary data
	 */
	temporary(type: string, identifier: string): string {
		return this.build("temp", type, identifier, Date.now().toString());
	}

	/**
	 * Build key for rate limiting
	 */
	rateLimit(provider: string, endpoint: string, userId?: string): string {
		return this.build("rate", provider, endpoint, userId);
	}

	/**
	 * Hash parameters for consistent cache keys
	 */
	private hashParams(params: Record<string, any>): string {
		const sorted = Object.keys(params)
			.sort()
			.reduce(
				(acc, key) => {
					acc[key] = params[key];
					return acc;
				},
				{} as Record<string, any>,
			);

		return Buffer.from(JSON.stringify(sorted))
			.toString("base64")
			.replace(/[+/=]/g, "")
			.substring(0, 8);
	}
}

/**
 * Cache manager for different Amazon APIs
 */
export class CacheManager {
	private caches = new Map<string, Cache>();
	private readonly keyBuilder: CacheKeyBuilder;

	constructor() {
		this.keyBuilder = new CacheKeyBuilder();
	}

	/**
	 * Register a cache instance
	 */
	register(name: string, cache: Cache): void {
		this.caches.set(name, cache);
	}

	/**
	 * Get cache instance by name
	 */
	getCache(name: string): Cache | undefined {
		return this.caches.get(name);
	}

	/**
	 * Get or create default cache
	 */
	getDefaultCache(): Cache {
		let cache = this.caches.get("default");
		if (!cache) {
			cache = new MemoryCache();
			this.caches.set("default", cache);
		}
		return cache;
	}

	/**
	 * Cache API response with automatic key generation
	 */
	async cacheApiResponse<T>(
		provider: string,
		endpoint: string,
		params: Record<string, any>,
		data: T,
		ttl?: number,
	): Promise<void> {
		const cache = this.getDefaultCache();
		const key = this.keyBuilder.apiResponse(provider, endpoint, params);
		await cache.set(key, data, ttl);
	}

	/**
	 * Get cached API response
	 */
	async getCachedApiResponse<T>(
		provider: string,
		endpoint: string,
		params: Record<string, any>,
	): Promise<T | undefined> {
		const cache = this.getDefaultCache();
		const key = this.keyBuilder.apiResponse(provider, endpoint, params);
		return cache.get(key);
	}

	/**
	 * Create default cache configuration
	 */
	static createDefault(
		options: {
			useRedis?: boolean;
			redisClient?: any;
			memoryMaxSize?: number;
			defaultTTL?: number;
		} = {},
	): CacheManager {
		const manager = new CacheManager();

		if (options.useRedis && options.redisClient) {
			// Use multi-level cache with Redis as L2
			const redisCache = new RedisCache(options.redisClient);
			const multiCache = new MultiLevelCache(redisCache, {
				l1MaxSize: options.memoryMaxSize || 500,
				l1TTL: 60,
				l2TTL: options.defaultTTL || 3600,
			});
			manager.register("default", multiCache);
		} else {
			// Use memory cache only
			const memoryCache = new MemoryCache({
				maxSize: options.memoryMaxSize || 1000,
				defaultTTL: options.defaultTTL || 300,
				cleanupInterval: 60,
			});
			manager.register("default", memoryCache);
		}

		return manager;
	}
}

/**
 * Cache utilities
 */
export class CacheUtils {
	/**
	 * Generate consistent cache key from object
	 */
	static keyFromObject(obj: Record<string, any>): string {
		const sorted = Object.keys(obj)
			.sort()
			.reduce(
				(acc, key) => {
					acc[key] = obj[key];
					return acc;
				},
				{} as Record<string, any>,
			);

		return Buffer.from(JSON.stringify(sorted))
			.toString("base64")
			.replace(/[+/=]/g, "");
	}

	/**
	 * Calculate TTL based on data freshness requirements
	 */
	static calculateTTL(
		dataType: "real-time" | "frequent" | "daily" | "static",
	): number {
		switch (dataType) {
			case "real-time":
				return 30; // 30 seconds
			case "frequent":
				return 300; // 5 minutes
			case "daily":
				return 3600; // 1 hour
			case "static":
				return 86400; // 24 hours
			default:
				return 300;
		}
	}

	/**
	 * Check if cache hit rate is healthy
	 */
	static isHealthyHitRate(hits: number, misses: number): boolean {
		const total = hits + misses;
		if (total === 0) return true;

		const hitRate = hits / total;
		return hitRate >= 0.7; // 70% hit rate threshold
	}
}
