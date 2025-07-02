/**
 * Circuit Breaker Pattern Implementation
 * Enterprise-grade circuit breaker for external service reliability
 */
export var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "CLOSED";
    CircuitBreakerState["OPEN"] = "OPEN";
    CircuitBreakerState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitBreakerState || (CircuitBreakerState = {}));
export class CircuitBreakerError extends Error {
    circuitBreakerName;
    state;
    constructor(circuitBreakerName, state, message) {
        super(message || `Circuit breaker '${circuitBreakerName}' is ${state}`);
        this.circuitBreakerName = circuitBreakerName;
        this.state = state;
        this.name = "CircuitBreakerError";
    }
}
export class CircuitBreaker {
    config;
    state = CircuitBreakerState.CLOSED;
    failures = 0;
    successes = 0;
    lastFailureTime;
    lastSuccessTime;
    totalRequests = 0;
    totalFailures = 0;
    totalSuccesses = 0;
    responseTimes = [];
    nextAttempt;
    constructor(config) {
        this.config = config;
    }
    /**
     * Execute a function with circuit breaker protection
     */
    async execute(fn) {
        const startTime = Date.now();
        this.totalRequests++;
        // Check if circuit breaker should block the request
        if (this.shouldBlock()) {
            const error = new CircuitBreakerError(this.config.name, this.state, `Circuit breaker is ${this.state}, request blocked`);
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
        }
        catch (error) {
            // Record failure
            const responseTime = Date.now() - startTime;
            this.onFailure(error, responseTime);
            throw error;
        }
    }
    /**
     * Execute function with timeout
     */
    async executeWithTimeout(fn) {
        return Promise.race([
            fn(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Circuit breaker timeout")), this.config.timeout)),
        ]);
    }
    /**
     * Check if request should be blocked
     */
    shouldBlock() {
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
    onSuccess(responseTime) {
        this.successes++;
        this.totalSuccesses++;
        this.lastSuccessTime = Date.now();
        this.recordResponseTime(responseTime);
        if (this.state === CircuitBreakerState.HALF_OPEN) {
            if (this.successes >= this.config.successThreshold) {
                this.setState(CircuitBreakerState.CLOSED);
                this.reset();
            }
        }
        else if (this.state === CircuitBreakerState.CLOSED) {
            // Reset failure count on success
            this.failures = 0;
        }
    }
    /**
     * Handle failed execution
     */
    onFailure(error, responseTime) {
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
        }
        else if (this.state === CircuitBreakerState.HALF_OPEN) {
            this.setState(CircuitBreakerState.OPEN);
            this.scheduleRecoveryAttempt();
        }
    }
    /**
     * Set circuit breaker state
     */
    setState(newState) {
        const oldState = this.state;
        this.state = newState;
        if (this.config.onStateChange && oldState !== newState) {
            this.config.onStateChange(newState);
        }
    }
    /**
     * Schedule recovery attempt
     */
    scheduleRecoveryAttempt() {
        this.nextAttempt = Date.now() + this.config.recoveryTimeout;
    }
    /**
     * Reset circuit breaker counters
     */
    reset() {
        this.failures = 0;
        this.successes = 0;
    }
    /**
     * Record response time for monitoring
     */
    recordResponseTime(responseTime) {
        this.responseTimes.push(responseTime);
        // Keep only last 100 response times
        if (this.responseTimes.length > 100) {
            this.responseTimes.shift();
        }
    }
    /**
     * Get current statistics
     */
    getStats() {
        const averageResponseTime = this.responseTimes.length > 0
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
    forceState(state) {
        this.setState(state);
        if (state === CircuitBreakerState.CLOSED) {
            this.reset();
        }
    }
    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
    /**
     * Check if circuit breaker is healthy
     */
    isHealthy() {
        return this.state === CircuitBreakerState.CLOSED;
    }
}
/**
 * Circuit Breaker Registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
    static instance;
    breakers = new Map();
    static getInstance() {
        if (!CircuitBreakerRegistry.instance) {
            CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
        }
        return CircuitBreakerRegistry.instance;
    }
    /**
     * Create or get circuit breaker
     */
    getOrCreate(name, config) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker({ ...config, name }));
        }
        return this.breakers.get(name);
    }
    /**
     * Get existing circuit breaker
     */
    get(name) {
        return this.breakers.get(name);
    }
    /**
     * Get all circuit breakers
     */
    getAll() {
        return new Map(this.breakers);
    }
    /**
     * Get stats for all circuit breakers
     */
    getAllStats() {
        const stats = {};
        for (const [name, breaker] of this.breakers) {
            stats[name] = breaker.getStats();
        }
        return stats;
    }
    /**
     * Remove circuit breaker
     */
    remove(name) {
        return this.breakers.delete(name);
    }
    /**
     * Clear all circuit breakers
     */
    clear() {
        this.breakers.clear();
    }
    /**
     * Reset instance (for testing)
     */
    static resetInstance() {
        CircuitBreakerRegistry.instance = undefined;
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
        shouldSkip: (error) => error.message.includes("validation"),
    },
    // For external APIs
    api: {
        failureThreshold: 3,
        recoveryTimeout: 60000, // 1 minute
        successThreshold: 3,
        timeout: 15000, // 15 seconds
        shouldSkip: (error) => error.message.includes("authentication"),
    },
    // For email services
    email: {
        failureThreshold: 10,
        recoveryTimeout: 120000, // 2 minutes
        successThreshold: 5,
        timeout: 30000, // 30 seconds
        shouldSkip: (error) => error.message.includes("invalid email"),
    },
    // For Amazon APIs
    amazon: {
        failureThreshold: 3,
        recoveryTimeout: 300000, // 5 minutes (API throttling)
        successThreshold: 2,
        timeout: 20000, // 20 seconds
        shouldSkip: (error) => error.message.includes("InvalidParameterValue") ||
            error.message.includes("authorization"),
    },
    // For file uploads
    upload: {
        failureThreshold: 2,
        recoveryTimeout: 60000, // 1 minute
        successThreshold: 1,
        timeout: 60000, // 1 minute for large files
        shouldSkip: (error) => error.message.includes("file too large"),
    },
};
/**
 * Decorator for automatic circuit breaker protection
 */
export function withCircuitBreaker(name, config) {
    return (_target, _propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        const registry = CircuitBreakerRegistry.getInstance();
        descriptor.value = async function (...args) {
            const breaker = registry.getOrCreate(name, config);
            return breaker.execute(() => originalMethod.apply(this, args));
        };
        return descriptor;
    };
}
/**
 * Utility function to create a circuit breaker protected function
 */
export function createProtectedFunction(fn, name, config) {
    const registry = CircuitBreakerRegistry.getInstance();
    const breaker = registry.getOrCreate(name, config);
    return (async (...args) => {
        return breaker.execute(() => fn(...args));
    });
}
export default CircuitBreaker;
//# sourceMappingURL=circuit-breaker.js.map