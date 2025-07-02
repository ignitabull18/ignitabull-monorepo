/**
 * Protected Service Base Class
 * Base class for services with circuit breaker protection
 */
import type { CircuitBreakerConfig } from "../lib/circuit-breaker";
import { type CircuitBreaker, CircuitBreakerRegistry } from "../lib/circuit-breaker";
export declare abstract class ProtectedServiceBase {
    protected circuitBreaker: CircuitBreaker;
    protected registry: CircuitBreakerRegistry;
    constructor(serviceName: string, config?: Omit<CircuitBreakerConfig, "name">);
    /**
     * Execute operation with circuit breaker protection
     */
    protected executeProtected<T>(operation: () => Promise<T>): Promise<T>;
    /**
     * Get service health status
     */
    isHealthy(): boolean;
    /**
     * Get service statistics
     */
    getStats(): import("../lib/circuit-breaker").CircuitBreakerStats;
    /**
     * Force circuit breaker state (for admin/testing)
     */
    forceState(state: any): void;
}
export default ProtectedServiceBase;
//# sourceMappingURL=protected-service-base.d.ts.map