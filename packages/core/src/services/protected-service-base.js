/**
 * Protected Service Base Class
 * Base class for services with circuit breaker protection
 */
import { CircuitBreakerPresets, CircuitBreakerRegistry, } from "../lib/circuit-breaker";
export class ProtectedServiceBase {
    circuitBreaker;
    registry;
    constructor(serviceName, config = CircuitBreakerPresets.api) {
        this.registry = CircuitBreakerRegistry.getInstance();
        this.circuitBreaker = this.registry.getOrCreate(serviceName, config);
    }
    /**
     * Execute operation with circuit breaker protection
     */
    async executeProtected(operation) {
        return this.circuitBreaker.execute(operation);
    }
    /**
     * Get service health status
     */
    isHealthy() {
        return this.circuitBreaker.isHealthy();
    }
    /**
     * Get service statistics
     */
    getStats() {
        return this.circuitBreaker.getStats();
    }
    /**
     * Force circuit breaker state (for admin/testing)
     */
    forceState(state) {
        this.circuitBreaker.forceState(state);
    }
}
export default ProtectedServiceBase;
//# sourceMappingURL=protected-service-base.js.map