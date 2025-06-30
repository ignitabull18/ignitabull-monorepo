/**
 * Protected Service Base Class
 * Base class for services with circuit breaker protection
 */

import type { CircuitBreakerConfig } from "../lib/circuit-breaker";
import {
	type CircuitBreaker,
	CircuitBreakerPresets,
	CircuitBreakerRegistry,
} from "../lib/circuit-breaker";

export abstract class ProtectedServiceBase {
	protected circuitBreaker: CircuitBreaker;
	protected registry: CircuitBreakerRegistry;

	constructor(
		serviceName: string,
		config: Omit<CircuitBreakerConfig, "name"> = CircuitBreakerPresets.api,
	) {
		this.registry = CircuitBreakerRegistry.getInstance();
		this.circuitBreaker = this.registry.getOrCreate(serviceName, config);
	}

	/**
	 * Execute operation with circuit breaker protection
	 */
	protected async executeProtected<T>(operation: () => Promise<T>): Promise<T> {
		return this.circuitBreaker.execute(operation);
	}

	/**
	 * Get service health status
	 */
	isHealthy(): boolean {
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
	forceState(state: any): void {
		this.circuitBreaker.forceState(state);
	}
}

export default ProtectedServiceBase;
