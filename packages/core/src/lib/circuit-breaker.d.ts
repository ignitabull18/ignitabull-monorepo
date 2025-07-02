/**
 * Circuit Breaker Pattern Implementation
 * Enterprise-grade circuit breaker for external service reliability
 */
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    successThreshold: number;
    timeout: number;
    name: string;
    onStateChange?: (state: CircuitBreakerState, error?: Error) => void;
    onFallback?: () => any;
    shouldSkip?: (error: Error) => boolean;
}
export declare enum CircuitBreakerState {
    CLOSED = "CLOSED",// Normal operation
    OPEN = "OPEN",// Blocking requests
    HALF_OPEN = "HALF_OPEN"
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
export declare class CircuitBreakerError extends Error {
    readonly circuitBreakerName: string;
    readonly state: CircuitBreakerState;
    constructor(circuitBreakerName: string, state: CircuitBreakerState, message?: string);
}
export declare class CircuitBreaker {
    private config;
    private state;
    private failures;
    private successes;
    private lastFailureTime?;
    private lastSuccessTime?;
    private totalRequests;
    private totalFailures;
    private totalSuccesses;
    private responseTimes;
    private nextAttempt?;
    constructor(config: CircuitBreakerConfig);
    /**
     * Execute a function with circuit breaker protection
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Execute function with timeout
     */
    private executeWithTimeout;
    /**
     * Check if request should be blocked
     */
    private shouldBlock;
    /**
     * Handle successful execution
     */
    private onSuccess;
    /**
     * Handle failed execution
     */
    private onFailure;
    /**
     * Set circuit breaker state
     */
    private setState;
    /**
     * Schedule recovery attempt
     */
    private scheduleRecoveryAttempt;
    /**
     * Reset circuit breaker counters
     */
    private reset;
    /**
     * Record response time for monitoring
     */
    private recordResponseTime;
    /**
     * Get current statistics
     */
    getStats(): CircuitBreakerStats;
    /**
     * Force state change (for testing/admin purposes)
     */
    forceState(state: CircuitBreakerState): void;
    /**
     * Get current state
     */
    getState(): CircuitBreakerState;
    /**
     * Check if circuit breaker is healthy
     */
    isHealthy(): boolean;
}
/**
 * Circuit Breaker Registry for managing multiple circuit breakers
 */
export declare class CircuitBreakerRegistry {
    private static instance;
    private breakers;
    static getInstance(): CircuitBreakerRegistry;
    /**
     * Create or get circuit breaker
     */
    getOrCreate(name: string, config: Omit<CircuitBreakerConfig, "name">): CircuitBreaker;
    /**
     * Get existing circuit breaker
     */
    get(name: string): CircuitBreaker | undefined;
    /**
     * Get all circuit breakers
     */
    getAll(): Map<string, CircuitBreaker>;
    /**
     * Get stats for all circuit breakers
     */
    getAllStats(): Record<string, CircuitBreakerStats>;
    /**
     * Remove circuit breaker
     */
    remove(name: string): boolean;
    /**
     * Clear all circuit breakers
     */
    clear(): void;
    /**
     * Reset instance (for testing)
     */
    static resetInstance(): void;
}
/**
 * Predefined circuit breaker configurations
 */
export declare const CircuitBreakerPresets: {
    database: {
        failureThreshold: number;
        recoveryTimeout: number;
        successThreshold: number;
        timeout: number;
        shouldSkip: (error: Error) => boolean;
    };
    api: {
        failureThreshold: number;
        recoveryTimeout: number;
        successThreshold: number;
        timeout: number;
        shouldSkip: (error: Error) => boolean;
    };
    email: {
        failureThreshold: number;
        recoveryTimeout: number;
        successThreshold: number;
        timeout: number;
        shouldSkip: (error: Error) => boolean;
    };
    amazon: {
        failureThreshold: number;
        recoveryTimeout: number;
        successThreshold: number;
        timeout: number;
        shouldSkip: (error: Error) => boolean;
    };
    upload: {
        failureThreshold: number;
        recoveryTimeout: number;
        successThreshold: number;
        timeout: number;
        shouldSkip: (error: Error) => boolean;
    };
};
/**
 * Decorator for automatic circuit breaker protection
 */
export declare function withCircuitBreaker(name: string, config: Omit<CircuitBreakerConfig, "name">): <T extends (...args: any[]) => Promise<any>>(_target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
/**
 * Utility function to create a circuit breaker protected function
 */
export declare function createProtectedFunction<T extends (...args: any[]) => Promise<any>>(fn: T, name: string, config: Omit<CircuitBreakerConfig, "name">): T;
export default CircuitBreaker;
//# sourceMappingURL=circuit-breaker.d.ts.map