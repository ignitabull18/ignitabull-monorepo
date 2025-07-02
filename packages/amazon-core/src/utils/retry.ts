/**
 * Retry utilities for Amazon API integrations
 * Following AI SDK retry patterns
 */

import { ErrorUtils } from "../errors/base";
import { NetworkUtils } from "../errors/network-errors";
import type { RetryConfig } from "../types/config";

/**
 * Retry strategy interface
 */
export interface RetryStrategy {
	shouldRetry(attempt: number, error: unknown): boolean;
	getDelay(attempt: number, error: unknown): number;
}

/**
 * Exponential backoff retry strategy
 */
export class ExponentialBackoffStrategy implements RetryStrategy {
	constructor(private readonly config: RetryConfig) {}

	shouldRetry(attempt: number, error: unknown): boolean {
		if (attempt >= this.config.maxRetries) {
			return false;
		}

		// Check if error is retryable
		if (!this.isRetryableError(error)) {
			return false;
		}

		return true;
	}

	getDelay(attempt: number, error: unknown): number {
		const baseDelay = this.config.baseDelay;
		const backoffMultiplier = this.config.backoffMultiplier;
		const maxDelay = this.config.maxDelay;

		// Calculate exponential backoff delay
		let delay = baseDelay * backoffMultiplier ** attempt;

		// Cap at max delay
		delay = Math.min(delay, maxDelay);

		// Add jitter to avoid thundering herd
		const jitter = delay * 0.1 * Math.random();
		delay += jitter;

		// Check for retry-after header in rate limit errors
		const retryAfter = this.getRetryAfterDelay(error);
		if (retryAfter > 0) {
			delay = Math.max(delay, retryAfter);
		}

		return Math.floor(delay);
	}

	private isRetryableError(error: unknown): boolean {
		// Use existing error utilities
		if (ErrorUtils.isRetryable(error) || NetworkUtils.isRetryable(error)) {
			return true;
		}

		// Check for specific HTTP status codes
		if (error && typeof error === "object" && "statusCode" in error) {
			const statusCode = error.statusCode as number;
			return this.config.retryableStatuses.includes(statusCode);
		}

		// Check for specific error codes
		if (error && typeof error === "object" && "code" in error) {
			const code = String(error.code);
			return this.config.retryableErrors.includes(code);
		}

		return false;
	}

	private getRetryAfterDelay(error: unknown): number {
		if (error && typeof error === "object") {
			const err = error as any;

			// Check for retry-after in error object
			if (err.retryAfter && typeof err.retryAfter === "number") {
				return err.retryAfter * 1000; // Convert to milliseconds
			}

			// Check for retry-after in response headers
			if (err.responseHeaders?.["retry-after"]) {
				const retryAfter = Number.parseInt(err.responseHeaders["retry-after"]);
				return Number.isNaN(retryAfter) ? 0 : retryAfter * 1000;
			}
		}

		return 0;
	}
}

/**
 * Linear backoff retry strategy
 */
export class LinearBackoffStrategy implements RetryStrategy {
	constructor(private readonly config: RetryConfig) {}

	shouldRetry(attempt: number, error: unknown): boolean {
		return attempt < this.config.maxRetries && ErrorUtils.isRetryable(error);
	}

	getDelay(attempt: number, _error: unknown): number {
		const baseDelay = this.config.baseDelay;
		const delay = baseDelay * (attempt + 1);

		// Add jitter
		const jitter = delay * 0.1 * Math.random();
		return Math.floor(delay + jitter);
	}
}

/**
 * Fixed delay retry strategy
 */
export class FixedDelayStrategy implements RetryStrategy {
	constructor(
		private readonly config: RetryConfig,
		private readonly fixedDelay: number = 1000,
	) {}

	shouldRetry(attempt: number, error: unknown): boolean {
		return attempt < this.config.maxRetries && ErrorUtils.isRetryable(error);
	}

	getDelay(_attempt: number, _error: unknown): number {
		return this.fixedDelay;
	}
}

/**
 * Retry executor with configurable strategies
 */
export class RetryExecutor {
	constructor(
		private readonly strategy: RetryStrategy,
		private readonly config: RetryConfig,
	) {}

	/**
	 * Execute a function with retry logic
	 */
	async execute<T>(
		fn: () => Promise<T>,
		context?: { operationName?: string; requestId?: string },
	): Promise<T> {
		let lastError: unknown;
		let attempt = 0;

		while (attempt <= this.config.maxRetries) {
			try {
				const result = await fn();

				// Log successful retry if it's not the first attempt
				if (attempt > 0 && context?.operationName) {
					console.log(
						`Operation ${context.operationName} succeeded after ${attempt} retries`,
					);
				}

				return result;
			} catch (error) {
				lastError = error;

				// Check if we should retry
				if (!this.strategy.shouldRetry(attempt, error)) {
					break;
				}

				// Calculate delay
				const delay = this.strategy.getDelay(attempt, error);

				// Log retry attempt
				if (context?.operationName) {
					console.log(
						`Operation ${context.operationName} failed (attempt ${attempt + 1}/${this.config.maxRetries + 1}), retrying in ${delay}ms:`,
						ErrorUtils.getMessage(error),
					);
				}

				// Wait before retrying
				if (delay > 0) {
					await this.sleep(delay);
				}

				attempt++;
			}
		}

		// All retries exhausted, throw last error
		throw lastError;
	}

	/**
	 * Execute multiple functions with retry logic in parallel
	 */
	async executeParallel<T>(
		fns: Array<() => Promise<T>>,
		options: {
			maxConcurrency?: number;
			failFast?: boolean;
			context?: { operationName?: string };
		} = {},
	): Promise<T[]> {
		const { maxConcurrency = 5, failFast = true } = options;

		const executeWithRetry = (fn: () => Promise<T>, index: number) =>
			this.execute(fn, {
				operationName: `${options.context?.operationName || "parallel"}-${index}`,
			});

		if (maxConcurrency >= fns.length) {
			// Execute all in parallel
			if (failFast) {
				return Promise.all(fns.map(executeWithRetry));
			}
			const results = await Promise.allSettled(fns.map(executeWithRetry));
			return results.map((result, index) => {
				if (result.status === "rejected") {
					throw new Error(`Operation ${index} failed: ${result.reason}`);
				}
				return result.value;
			});
		}
		// Execute with concurrency limit
		const results: T[] = [];
		const executing: Promise<void>[] = [];

		for (let i = 0; i < fns.length; i++) {
			const fn = fns[i];
			if (!fn) continue;
			const promise = executeWithRetry(fn, i).then(
				(result) => {
					results[i] = result;
				},
				(error) => {
					if (failFast) {
						throw error;
					}
					results[i] = error;
				},
			);

			executing.push(promise);

			if (executing.length >= maxConcurrency) {
				await Promise.race(executing);
				executing.splice(
					executing.findIndex((p) => p === promise),
					1,
				);
			}
		}

		await Promise.all(executing);
		return results;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Retry decorator for class methods
 */
export function withRetry(
	strategy: RetryStrategy,
	config: RetryConfig,
	context?: { operationName?: string },
) {
	return (
		_target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => {
		const originalMethod = descriptor.value;
		const executor = new RetryExecutor(strategy, config);

		descriptor.value = async function (...args: any[]) {
			return executor.execute(() => originalMethod.apply(this, args), {
				operationName: context?.operationName || propertyKey,
				requestId: args.find((arg) => arg?.requestId)?.requestId,
			});
		};

		return descriptor;
	};
}

/**
 * Alias for RetryExecutor for backward compatibility
 */
export class RetryHandler extends RetryExecutor {}

/**
 * Retry manager for different Amazon APIs
 */
export class RetryManager {
	private strategies = new Map<string, RetryStrategy>();
	private executors = new Map<string, RetryExecutor>();

	/**
	 * Register a retry strategy for a specific API or operation
	 */
	registerStrategy(
		key: string,
		strategy: RetryStrategy,
		config: RetryConfig,
	): void {
		this.strategies.set(key, strategy);
		this.executors.set(key, new RetryExecutor(strategy, config));
	}

	/**
	 * Get retry executor for a specific key
	 */
	getExecutor(key: string): RetryExecutor | undefined {
		return this.executors.get(key);
	}

	/**
	 * Execute with retry using a specific strategy
	 */
	async execute<T>(
		key: string,
		fn: () => Promise<T>,
		context?: { operationName?: string; requestId?: string },
	): Promise<T> {
		const executor = this.getExecutor(key);
		if (!executor) {
			throw new Error(`No retry strategy registered for key: ${key}`);
		}
		return executor.execute(fn, context);
	}

	/**
	 * Create default retry managers for Amazon APIs
	 */
	static createDefault(): RetryManager {
		const manager = new RetryManager();

		// SP-API retry strategy (more conservative due to rate limits)
		const spApiConfig: RetryConfig = {
			maxRetries: 3,
			baseDelay: 1000,
			maxDelay: 30000,
			backoffMultiplier: 2,
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		};
		manager.registerStrategy(
			"sp-api",
			new ExponentialBackoffStrategy(spApiConfig),
			spApiConfig,
		);

		// Advertising API retry strategy
		const advertisingConfig: RetryConfig = {
			maxRetries: 5,
			baseDelay: 500,
			maxDelay: 15000,
			backoffMultiplier: 1.5,
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		};
		manager.registerStrategy(
			"advertising",
			new ExponentialBackoffStrategy(advertisingConfig),
			advertisingConfig,
		);

		// Associates API retry strategy (very conservative due to TPS limits)
		const associatesConfig: RetryConfig = {
			maxRetries: 2,
			baseDelay: 2000,
			maxDelay: 60000,
			backoffMultiplier: 3,
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		};
		manager.registerStrategy(
			"associates",
			new ExponentialBackoffStrategy(associatesConfig),
			associatesConfig,
		);

		return manager;
	}
}

/**
 * Retry utilities
 */
export class RetryUtils {
	/**
	 * Simple retry function with exponential backoff
	 */
	static async retry<T>(
		fn: () => Promise<T>,
		options: {
			maxRetries?: number;
			baseDelay?: number;
			maxDelay?: number;
			backoffMultiplier?: number;
		} = {},
	): Promise<T> {
		const config: RetryConfig = {
			maxRetries: options.maxRetries ?? 3,
			baseDelay: options.baseDelay ?? 1000,
			maxDelay: options.maxDelay ?? 30000,
			backoffMultiplier: options.backoffMultiplier ?? 2,
			retryableStatuses: [429, 500, 502, 503, 504],
			retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"],
		};

		const strategy = new ExponentialBackoffStrategy(config);
		const executor = new RetryExecutor(strategy, config);

		return executor.execute(fn);
	}

	/**
	 * Retry with custom predicate
	 */
	static async retryWithPredicate<T>(
		fn: () => Promise<T>,
		shouldRetry: (error: unknown, attempt: number) => boolean,
		options: {
			maxRetries?: number;
			getDelay?: (attempt: number) => number;
		} = {},
	): Promise<T> {
		const maxRetries = options.maxRetries ?? 3;
		const getDelay = options.getDelay ?? ((attempt) => 2 ** attempt * 1000);

		let lastError: unknown;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error;

				if (attempt === maxRetries || !shouldRetry(error, attempt)) {
					break;
				}

				const delay = getDelay(attempt);
				if (delay > 0) {
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		throw lastError;
	}
}
