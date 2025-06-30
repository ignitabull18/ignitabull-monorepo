/**
 * Circuit Breaker Pattern Implementation
 * Enterprise-grade circuit breaker for external service reliability
 */

export interface CircuitBreakerConfig {
	failureThreshold: number; // Number of failures before opening
	recoveryTimeout: number; // Time in ms before attempting recovery
	successThreshold: number; // Number of successes needed to close
	timeout: number; // Request timeout in ms
	name: string; // Circuit breaker name for monitoring
	onStateChange?: (state: CircuitBreakerState, error?: Error) => void;
	onFallback?: () => any;
	shouldSkip?: (error: Error) => boolean; // Skip certain errors
}

export enum CircuitBreakerState {
	CLOSED = "CLOSED", // Normal operation
	OPEN = "OPEN", // Blocking requests
	HALF_OPEN = "HALF_OPEN", // Testing recovery
}

export interface CircuitBreakerStats {
	state: CircuitBreakerState;
	failures: number;
	successes: number;
	lastFailureTime?: number;
	lastSuccessTime?: number;
	totalRequests: number;
	totalFailures: number;
	totalSuccesses: number;
	averageResponseTime: number;
}

export class CircuitBreakerError extends Error {
	constructor(
		public readonly circuitBreakerName: string,
		public readonly state: CircuitBreakerState,
		message?: string,
	) {
		super(message || `Circuit breaker '${circuitBreakerName}' is ${state}`);
		this.name = "CircuitBreakerError";
	}
}

export class CircuitBreaker {
	private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
	private failures = 0;
	private successes = 0;
	private lastFailureTime?: number;
	private lastSuccessTime?: number;
	private totalRequests = 0;
	private totalFailures = 0;
	private totalSuccesses = 0;
	private responseTimes: number[] = [];
	private nextAttempt?: number;

	constructor(private config: CircuitBreakerConfig) {}

	/**
	 * Execute a function with circuit breaker protection
	 */
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		const startTime = Date.now();
		this.totalRequests++;

		// Check if circuit breaker should block the request
		if (this.shouldBlock()) {
			const error = new CircuitBreakerError(
				this.config.name,
				this.state,
				`Circuit breaker is ${this.state}, request blocked`,
			);

			if (this.config.onFallback) {
				return this.config.onFallback();
			}

			throw error;
		}

		try {
			// Execute with timeout
			const result = await this.executeWithTimeout(fn);

			// Record success
			const responseTime = Date.now() - startTime;
			this.onSuccess(responseTime);

			return result;
		} catch (error) {
			// Record failure
			const responseTime = Date.now() - startTime;
			this.onFailure(error as Error, responseTime);
			throw error;
		}
	}

	/**
	 * Execute function with timeout
	 */
	private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
		return Promise.race([
			fn(),
			new Promise<never>((_, reject) =>
				setTimeout(
					() => reject(new Error("Circuit breaker timeout")),
					this.config.timeout,
				),
			),
		]);
	}

	/**
	 * Check if request should be blocked
	 */
	private shouldBlock(): boolean {
		const now = Date.now();

		switch (this.state) {
			case CircuitBreakerState.CLOSED:
				return false;

			case CircuitBreakerState.OPEN:
				if (this.nextAttempt && now >= this.nextAttempt) {
					this.setState(CircuitBreakerState.HALF_OPEN);
					return false;
				}
				return true;

			case CircuitBreakerState.HALF_OPEN:
				return false;

			default:
				return false;
		}
	}

	/**
	 * Handle successful execution
	 */
	private onSuccess(responseTime: number): void {
		this.successes++;
		this.totalSuccesses++;
		this.lastSuccessTime = Date.now();
		this.recordResponseTime(responseTime);

		if (this.state === CircuitBreakerState.HALF_OPEN) {
			if (this.successes >= this.config.successThreshold) {
				this.setState(CircuitBreakerState.CLOSED);
				this.reset();
			}
		} else if (this.state === CircuitBreakerState.CLOSED) {
			// Reset failure count on success
			this.failures = 0;
		}
	}

	/**
	 * Handle failed execution
	 */
	private onFailure(error: Error, responseTime: number): void {
		// Skip certain errors if configured
		if (this.config.shouldSkip?.(error)) {
			this.recordResponseTime(responseTime);
			return;
		}

		this.failures++;
		this.totalFailures++;
		this.lastFailureTime = Date.now();
		this.recordResponseTime(responseTime);

		if (this.state === CircuitBreakerState.CLOSED) {
			if (this.failures >= this.config.failureThreshold) {
				this.setState(CircuitBreakerState.OPEN);
				this.scheduleRecoveryAttempt();
			}
		} else if (this.state === CircuitBreakerState.HALF_OPEN) {
			this.setState(CircuitBreakerState.OPEN);
			this.scheduleRecoveryAttempt();
		}
	}

	/**
	 * Set circuit breaker state
	 */
	private setState(newState: CircuitBreakerState): void {
		const oldState = this.state;
		this.state = newState;

		if (this.config.onStateChange && oldState !== newState) {
			this.config.onStateChange(newState);
		}
	}

	/**
	 * Schedule recovery attempt
	 */
	private scheduleRecoveryAttempt(): void {
		this.nextAttempt = Date.now() + this.config.recoveryTimeout;
	}

	/**
	 * Reset circuit breaker counters
	 */
	private reset(): void {
		this.failures = 0;
		this.successes = 0;
	}

	/**
	 * Record response time for monitoring
	 */
	private recordResponseTime(responseTime: number): void {
		this.responseTimes.push(responseTime);

		// Keep only last 100 response times
		if (this.responseTimes.length > 100) {
			this.responseTimes.shift();
		}
	}

	/**
	 * Get current statistics
	 */
	getStats(): CircuitBreakerStats {
		const averageResponseTime =
			this.responseTimes.length > 0
				? this.responseTimes.reduce((sum, time) => sum + time, 0) /
					this.responseTimes.length
				: 0;

		return {
			state: this.state,
			failures: this.failures,
			successes: this.successes,
			lastFailureTime: this.lastFailureTime,
			lastSuccessTime: this.lastSuccessTime,
			totalRequests: this.totalRequests,
			totalFailures: this.totalFailures,
			totalSuccesses: this.totalSuccesses,
			averageResponseTime,
		};
	}

	/**
	 * Force state change (for testing/admin purposes)
	 */
	forceState(state: CircuitBreakerState): void {
		this.setState(state);
		if (state === CircuitBreakerState.CLOSED) {
			this.reset();
		}
	}

	/**
	 * Get current state
	 */
	getState(): CircuitBreakerState {
		return this.state;
	}

	/**
	 * Check if circuit breaker is healthy
	 */
	isHealthy(): boolean {
		return this.state === CircuitBreakerState.CLOSED;
	}
}

/**
 * Circuit Breaker Registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
	private static instance: CircuitBreakerRegistry;
	private breakers = new Map<string, CircuitBreaker>();

	static getInstance(): CircuitBreakerRegistry {
		if (!CircuitBreakerRegistry.instance) {
			CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
		}
		return CircuitBreakerRegistry.instance;
	}

	/**
	 * Create or get circuit breaker
	 */
	getOrCreate(
		name: string,
		config: Omit<CircuitBreakerConfig, "name">,
	): CircuitBreaker {
		if (!this.breakers.has(name)) {
			this.breakers.set(name, new CircuitBreaker({ ...config, name }));
		}
		return this.breakers.get(name)!;
	}

	/**
	 * Get existing circuit breaker
	 */
	get(name: string): CircuitBreaker | undefined {
		return this.breakers.get(name);
	}

	/**
	 * Get all circuit breakers
	 */
	getAll(): Map<string, CircuitBreaker> {
		return new Map(this.breakers);
	}

	/**
	 * Get stats for all circuit breakers
	 */
	getAllStats(): Record<string, CircuitBreakerStats> {
		const stats: Record<string, CircuitBreakerStats> = {};
		for (const [name, breaker] of this.breakers) {
			stats[name] = breaker.getStats();
		}
		return stats;
	}

	/**
	 * Remove circuit breaker
	 */
	remove(name: string): boolean {
		return this.breakers.delete(name);
	}

	/**
	 * Clear all circuit breakers
	 */
	clear(): void {
		this.breakers.clear();
	}

	/**
	 * Reset instance (for testing)
	 */
	static resetInstance(): void {
		CircuitBreakerRegistry.instance = undefined as any;
	}
}

/**
 * Predefined circuit breaker configurations
 */
export const CircuitBreakerPresets = {
	// For database connections
	database: {
		failureThreshold: 5,
		recoveryTimeout: 30000, // 30 seconds
		successThreshold: 2,
		timeout: 10000, // 10 seconds
		shouldSkip: (error: Error) => error.message.includes("validation"),
	},

	// For external APIs
	api: {
		failureThreshold: 3,
		recoveryTimeout: 60000, // 1 minute
		successThreshold: 3,
		timeout: 15000, // 15 seconds
		shouldSkip: (error: Error) => error.message.includes("authentication"),
	},

	// For email services
	email: {
		failureThreshold: 10,
		recoveryTimeout: 120000, // 2 minutes
		successThreshold: 5,
		timeout: 30000, // 30 seconds
		shouldSkip: (error: Error) => error.message.includes("invalid email"),
	},

	// For Amazon APIs
	amazon: {
		failureThreshold: 3,
		recoveryTimeout: 300000, // 5 minutes (API throttling)
		successThreshold: 2,
		timeout: 20000, // 20 seconds
		shouldSkip: (error: Error) =>
			error.message.includes("InvalidParameterValue") ||
			error.message.includes("authorization"),
	},

	// For file uploads
	upload: {
		failureThreshold: 2,
		recoveryTimeout: 60000, // 1 minute
		successThreshold: 1,
		timeout: 60000, // 1 minute for large files
		shouldSkip: (error: Error) => error.message.includes("file too large"),
	},
};

/**
 * Decorator for automatic circuit breaker protection
 */
export function withCircuitBreaker(
	name: string,
	config: Omit<CircuitBreakerConfig, "name">,
) {
	return <T extends (...args: any[]) => Promise<any>>(
		_target: any,
		_propertyKey: string,
		descriptor: TypedPropertyDescriptor<T>,
	) => {
		const originalMethod = descriptor.value!;
		const registry = CircuitBreakerRegistry.getInstance();

		descriptor.value = async function (this: any, ...args: any[]) {
			const breaker = registry.getOrCreate(name, config);
			return breaker.execute(() => originalMethod.apply(this, args));
		} as T;

		return descriptor;
	};
}

/**
 * Utility function to create a circuit breaker protected function
 */
export function createProtectedFunction<
	T extends (...args: any[]) => Promise<any>,
>(fn: T, name: string, config: Omit<CircuitBreakerConfig, "name">): T {
	const registry = CircuitBreakerRegistry.getInstance();
	const breaker = registry.getOrCreate(name, config);

	return (async (...args: any[]) => {
		return breaker.execute(() => fn(...args));
	}) as T;
}

export default CircuitBreaker;
