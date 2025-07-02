/**
 * Circuit Breaker Tests
 * Comprehensive test suite for circuit breaker pattern implementation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { advanceTime } from "../../test/utils";
import {
	CircuitBreaker,
	CircuitBreakerError,
	CircuitBreakerPresets,
	CircuitBreakerRegistry,
	CircuitBreakerState,
	createProtectedFunction,
	withCircuitBreaker,
} from "./circuit-breaker";

describe("CircuitBreaker", () => {
	let circuitBreaker: CircuitBreaker;
	let mockFunction: vi.Mock;
	let onStateChange: vi.Mock;
	let onFallback: vi.Mock;

	beforeEach(() => {
		vi.useFakeTimers();
		mockFunction = vi.fn();
		onStateChange = vi.fn();
		onFallback = vi.fn().mockReturnValue("fallback-result");

		circuitBreaker = new CircuitBreaker({
			failureThreshold: 3,
			recoveryTimeout: 60000,
			successThreshold: 2,
			timeout: 5000,
			name: "test-breaker",
			onStateChange,
			onFallback,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		CircuitBreakerRegistry.resetInstance();
	});

	describe("Closed State (Normal Operation)", () => {
		it("should execute function successfully in closed state", async () => {
			mockFunction.mockResolvedValue("success");

			const result = await circuitBreaker.execute(mockFunction);

			expect(result).toBe("success");
			expect(mockFunction).toHaveBeenCalledOnce();
			expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
		});

		it("should track successful executions", async () => {
			mockFunction.mockResolvedValue("success");

			await circuitBreaker.execute(mockFunction);
			await circuitBreaker.execute(mockFunction);

			const stats = circuitBreaker.getStats();
			expect(stats.totalSuccesses).toBe(2);
			expect(stats.totalRequests).toBe(2);
			expect(stats.state).toBe(CircuitBreakerState.CLOSED);
		});

		it("should reset failure count on success", async () => {
			mockFunction
				.mockRejectedValueOnce(new Error("failure 1"))
				.mockRejectedValueOnce(new Error("failure 2"))
				.mockResolvedValueOnce("success");

			try {
				await circuitBreaker.execute(mockFunction);
			} catch {}
			try {
				await circuitBreaker.execute(mockFunction);
			} catch {}
			await circuitBreaker.execute(mockFunction);

			const stats = circuitBreaker.getStats();
			expect(stats.failures).toBe(0); // Reset after success
			expect(stats.totalFailures).toBe(2);
			expect(stats.totalSuccesses).toBe(1);
		});

		it("should transition to open state after threshold failures", async () => {
			mockFunction.mockRejectedValue(new Error("test error"));

			// Execute 3 times to reach failure threshold
			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockFunction);
				} catch {}
			}

			expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
			expect(onStateChange).toHaveBeenCalledWith(CircuitBreakerState.OPEN);
		});
	});

	describe("Open State (Blocking Requests)", () => {
		beforeEach(async () => {
			// Force circuit breaker to open state
			mockFunction.mockRejectedValue(new Error("test error"));
			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockFunction);
				} catch {}
			}
			vi.clearAllMocks();
		});

		it("should block requests in open state", async () => {
			await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow(
				CircuitBreakerError,
			);
			expect(mockFunction).not.toHaveBeenCalled();
		});

		it("should return fallback result when available", async () => {
			const result = await circuitBreaker.execute(mockFunction);
			expect(result).toBe("fallback-result");
			expect(onFallback).toHaveBeenCalled();
			expect(mockFunction).not.toHaveBeenCalled();
		});

		it("should transition to half-open after recovery timeout", async () => {
			mockFunction.mockResolvedValue("success");

			// Advance time to trigger recovery
			advanceTime(60000);

			await circuitBreaker.execute(mockFunction);

			expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
			expect(mockFunction).toHaveBeenCalled();
		});

		it("should not allow requests before recovery timeout", async () => {
			// Advance time but not enough for recovery
			advanceTime(30000);

			await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow(
				CircuitBreakerError,
			);
			expect(mockFunction).not.toHaveBeenCalled();
		});
	});

	describe("Half-Open State (Testing Recovery)", () => {
		beforeEach(async () => {
			// Force to open state then advance time for half-open
			mockFunction.mockRejectedValue(new Error("test error"));
			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockFunction);
				} catch {}
			}
			advanceTime(60000);
			vi.clearAllMocks();
		});

		it("should transition to closed after successful threshold", async () => {
			mockFunction.mockResolvedValue("success");

			// Execute 2 successful requests (successThreshold = 2)
			await circuitBreaker.execute(mockFunction);
			await circuitBreaker.execute(mockFunction);

			expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
			expect(onStateChange).toHaveBeenCalledWith(CircuitBreakerState.CLOSED);
		});

		it("should transition back to open on failure", async () => {
			mockFunction.mockRejectedValue(new Error("test error"));

			try {
				await circuitBreaker.execute(mockFunction);
			} catch {}

			expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
			expect(onStateChange).toHaveBeenCalledWith(CircuitBreakerState.OPEN);
		});

		it("should allow requests in half-open state", async () => {
			mockFunction.mockResolvedValue("success");

			const result = await circuitBreaker.execute(mockFunction);

			expect(result).toBe("success");
			expect(mockFunction).toHaveBeenCalled();
		});
	});

	describe("Timeout Handling", () => {
		it("should timeout long-running requests", async () => {
			mockFunction.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 10000)),
			);

			await expect(circuitBreaker.execute(mockFunction)).rejects.toThrow(
				"Circuit breaker timeout",
			);
		});

		it("should handle timeout as failure", async () => {
			mockFunction.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 10000)),
			);

			for (let i = 0; i < 3; i++) {
				try {
					await circuitBreaker.execute(mockFunction);
				} catch {}
			}

			expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
		});
	});

	describe("Error Skipping", () => {
		it("should skip certain errors when configured", async () => {
			const skipBreaker = new CircuitBreaker({
				failureThreshold: 2,
				recoveryTimeout: 60000,
				successThreshold: 2,
				timeout: 5000,
				name: "skip-breaker",
				shouldSkip: (error) => error.message.includes("skip"),
			});

			mockFunction
				.mockRejectedValueOnce(new Error("skip this error"))
				.mockRejectedValueOnce(new Error("skip this error"))
				.mockRejectedValueOnce(new Error("skip this error"));

			for (let i = 0; i < 3; i++) {
				try {
					await skipBreaker.execute(mockFunction);
				} catch {}
			}

			// Should still be closed because errors were skipped
			expect(skipBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
		});

		it("should not skip errors that do not match condition", async () => {
			const skipBreaker = new CircuitBreaker({
				failureThreshold: 2,
				recoveryTimeout: 60000,
				successThreshold: 2,
				timeout: 5000,
				name: "skip-breaker",
				shouldSkip: (error) => error.message.includes("skip"),
			});

			mockFunction.mockRejectedValue(new Error("do not skip"));

			for (let i = 0; i < 2; i++) {
				try {
					await skipBreaker.execute(mockFunction);
				} catch {}
			}

			expect(skipBreaker.getState()).toBe(CircuitBreakerState.OPEN);
		});
	});

	describe("Statistics", () => {
		it("should track comprehensive statistics", async () => {
			mockFunction
				.mockResolvedValueOnce("success1")
				.mockRejectedValueOnce(new Error("failure1"))
				.mockResolvedValueOnce("success2");

			await circuitBreaker.execute(mockFunction);
			try {
				await circuitBreaker.execute(mockFunction);
			} catch {}
			await circuitBreaker.execute(mockFunction);

			const stats = circuitBreaker.getStats();
			expect(stats.totalRequests).toBe(3);
			expect(stats.totalSuccesses).toBe(2);
			expect(stats.totalFailures).toBe(1);
			expect(stats.lastSuccessTime).toBeTruthy();
			expect(stats.lastFailureTime).toBeTruthy();
			expect(stats.averageResponseTime).toBeGreaterThan(0);
		});

		it("should track response times", async () => {
			mockFunction.mockImplementation(
				() =>
					new Promise((resolve) => setTimeout(() => resolve("success"), 100)),
			);

			await circuitBreaker.execute(mockFunction);
			advanceTime(100);

			const stats = circuitBreaker.getStats();
			expect(stats.averageResponseTime).toBeGreaterThan(0);
		});
	});

	describe("Manual Control", () => {
		it("should allow forcing state changes", () => {
			circuitBreaker.forceState(CircuitBreakerState.OPEN);
			expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

			circuitBreaker.forceState(CircuitBreakerState.CLOSED);
			expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
		});

		it("should reset counters when forced to closed", async () => {
			// Generate some failures
			mockFunction.mockRejectedValue(new Error("test"));
			try {
				await circuitBreaker.execute(mockFunction);
			} catch {}

			circuitBreaker.forceState(CircuitBreakerState.CLOSED);

			const stats = circuitBreaker.getStats();
			expect(stats.failures).toBe(0);
			expect(stats.successes).toBe(0);
		});

		it("should check health status", async () => {
			expect(circuitBreaker.isHealthy()).toBe(true);

			// Force to open state
			circuitBreaker.forceState(CircuitBreakerState.OPEN);
			expect(circuitBreaker.isHealthy()).toBe(false);

			// Back to closed
			circuitBreaker.forceState(CircuitBreakerState.CLOSED);
			expect(circuitBreaker.isHealthy()).toBe(true);
		});
	});
});

describe("CircuitBreakerRegistry", () => {
	let registry: CircuitBreakerRegistry;

	beforeEach(() => {
		CircuitBreakerRegistry.resetInstance();
		registry = CircuitBreakerRegistry.getInstance();
	});

	afterEach(() => {
		CircuitBreakerRegistry.resetInstance();
	});

	it("should be a singleton", () => {
		const registry1 = CircuitBreakerRegistry.getInstance();
		const registry2 = CircuitBreakerRegistry.getInstance();
		expect(registry1).toBe(registry2);
	});

	it("should create and manage circuit breakers", () => {
		const breaker1 = registry.getOrCreate("test1", CircuitBreakerPresets.api);
		const breaker2 = registry.getOrCreate(
			"test2",
			CircuitBreakerPresets.database,
		);

		expect(breaker1).toBeInstanceOf(CircuitBreaker);
		expect(breaker2).toBeInstanceOf(CircuitBreaker);
		expect(breaker1).not.toBe(breaker2);
	});

	it("should return existing circuit breaker on subsequent calls", () => {
		const breaker1 = registry.getOrCreate("test", CircuitBreakerPresets.api);
		const breaker2 = registry.getOrCreate(
			"test",
			CircuitBreakerPresets.database,
		);

		expect(breaker1).toBe(breaker2);
	});

	it("should get existing circuit breaker", () => {
		registry.getOrCreate("test", CircuitBreakerPresets.api);
		const breaker = registry.get("test");

		expect(breaker).toBeInstanceOf(CircuitBreaker);
	});

	it("should return undefined for non-existent circuit breaker", () => {
		const breaker = registry.get("non-existent");
		expect(breaker).toBeUndefined();
	});

	it("should get all circuit breakers", () => {
		registry.getOrCreate("test1", CircuitBreakerPresets.api);
		registry.getOrCreate("test2", CircuitBreakerPresets.database);

		const all = registry.getAll();
		expect(all.size).toBe(2);
		expect(all.has("test1")).toBe(true);
		expect(all.has("test2")).toBe(true);
	});

	it("should get stats for all circuit breakers", () => {
		registry.getOrCreate("test1", CircuitBreakerPresets.api);
		registry.getOrCreate("test2", CircuitBreakerPresets.database);

		const stats = registry.getAllStats();
		expect(Object.keys(stats)).toEqual(["test1", "test2"]);
		expect(stats.test1.state).toBe(CircuitBreakerState.CLOSED);
		expect(stats.test2.state).toBe(CircuitBreakerState.CLOSED);
	});

	it("should remove circuit breaker", () => {
		registry.getOrCreate("test", CircuitBreakerPresets.api);
		expect(registry.get("test")).toBeDefined();

		const removed = registry.remove("test");
		expect(removed).toBe(true);
		expect(registry.get("test")).toBeUndefined();
	});

	it("should return false when removing non-existent breaker", () => {
		const removed = registry.remove("non-existent");
		expect(removed).toBe(false);
	});

	it("should clear all circuit breakers", () => {
		registry.getOrCreate("test1", CircuitBreakerPresets.api);
		registry.getOrCreate("test2", CircuitBreakerPresets.database);

		registry.clear();
		expect(registry.getAll().size).toBe(0);
	});
});

describe("Circuit Breaker Presets", () => {
	it("should provide database preset configuration", () => {
		const config = CircuitBreakerPresets.database;

		expect(config.failureThreshold).toBe(5);
		expect(config.recoveryTimeout).toBe(30000);
		expect(config.successThreshold).toBe(2);
		expect(config.timeout).toBe(10000);
		expect(config.shouldSkip).toBeDefined();
	});

	it("should provide API preset configuration", () => {
		const config = CircuitBreakerPresets.api;

		expect(config.failureThreshold).toBe(3);
		expect(config.recoveryTimeout).toBe(60000);
		expect(config.successThreshold).toBe(3);
		expect(config.timeout).toBe(15000);
	});

	it("should provide email preset configuration", () => {
		const config = CircuitBreakerPresets.email;

		expect(config.failureThreshold).toBe(10);
		expect(config.recoveryTimeout).toBe(120000);
		expect(config.successThreshold).toBe(5);
		expect(config.timeout).toBe(30000);
	});

	it("should provide Amazon preset configuration", () => {
		const config = CircuitBreakerPresets.amazon;

		expect(config.failureThreshold).toBe(3);
		expect(config.recoveryTimeout).toBe(300000);
		expect(config.successThreshold).toBe(2);
		expect(config.timeout).toBe(20000);
		expect(config.shouldSkip).toBeDefined();
	});

	it("should skip validation errors in database preset", () => {
		const config = CircuitBreakerPresets.database;
		const validationError = new Error("validation failed");
		const networkError = new Error("network timeout");

		expect(config.shouldSkip?.(validationError)).toBe(true);
		expect(config.shouldSkip?.(networkError)).toBe(false);
	});

	it("should skip authorization errors in Amazon preset", () => {
		const config = CircuitBreakerPresets.amazon;
		const authError = new Error("authorization failed");
		const paramError = new Error("InvalidParameterValue");
		const networkError = new Error("network timeout");

		expect(config.shouldSkip?.(authError)).toBe(true);
		expect(config.shouldSkip?.(paramError)).toBe(true);
		expect(config.shouldSkip?.(networkError)).toBe(false);
	});
});

describe("Circuit Breaker Decorator", () => {
	class TestService {
		constructor(public mockFn = vi.fn()) {}

		@withCircuitBreaker("test-decorator", CircuitBreakerPresets.api)
		async testMethod(value: string): Promise<string> {
			return this.mockFn(value);
		}
	}

	beforeEach(() => {
		CircuitBreakerRegistry.resetInstance();
	});

	afterEach(() => {
		CircuitBreakerRegistry.resetInstance();
	});

	it("should protect method with circuit breaker", async () => {
		const service = new TestService();
		service.mockFn.mockResolvedValue("success");

		const result = await service.testMethod("test");

		expect(result).toBe("success");
		expect(service.mockFn).toHaveBeenCalledWith("test");
	});

	it("should register circuit breaker in registry", async () => {
		const service = new TestService();
		service.mockFn.mockResolvedValue("success");

		await service.testMethod("test");

		const registry = CircuitBreakerRegistry.getInstance();
		const breaker = registry.get("test-decorator");
		expect(breaker).toBeDefined();
	});

	it("should handle failures and open circuit", async () => {
		const service = new TestService();
		service.mockFn.mockRejectedValue(new Error("test error"));

		// Execute enough times to open circuit
		for (let i = 0; i < 3; i++) {
			try {
				await service.testMethod("test");
			} catch {}
		}

		const registry = CircuitBreakerRegistry.getInstance();
		const breaker = registry.get("test-decorator");
		expect(breaker?.getState()).toBe(CircuitBreakerState.OPEN);
	});
});

describe("Protected Function Utility", () => {
	beforeEach(() => {
		CircuitBreakerRegistry.resetInstance();
	});

	afterEach(() => {
		CircuitBreakerRegistry.resetInstance();
	});

	it("should create protected function", async () => {
		const mockFn = vi.fn().mockResolvedValue("success");
		const protectedFn = createProtectedFunction(
			mockFn,
			"test-util",
			CircuitBreakerPresets.api,
		);

		const result = await protectedFn("test");

		expect(result).toBe("success");
		expect(mockFn).toHaveBeenCalledWith("test");
	});

	it("should register circuit breaker for protected function", async () => {
		const mockFn = vi.fn().mockResolvedValue("success");
		const protectedFn = createProtectedFunction(
			mockFn,
			"test-util",
			CircuitBreakerPresets.api,
		);

		await protectedFn("test");

		const registry = CircuitBreakerRegistry.getInstance();
		const breaker = registry.get("test-util");
		expect(breaker).toBeDefined();
	});

	it("should protect function from failures", async () => {
		const mockFn = vi.fn().mockRejectedValue(new Error("test error"));
		const protectedFn = createProtectedFunction(
			mockFn,
			"test-util",
			CircuitBreakerPresets.api,
		);

		// Execute enough times to open circuit
		for (let i = 0; i < 3; i++) {
			try {
				await protectedFn("test");
			} catch {}
		}

		const registry = CircuitBreakerRegistry.getInstance();
		const breaker = registry.get("test-util");
		expect(breaker?.getState()).toBe(CircuitBreakerState.OPEN);
	});
});
