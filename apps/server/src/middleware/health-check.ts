/**
 * Health Check Middleware
 * Provides comprehensive application health monitoring
 */

import type { NextFunction, Request, Response } from "express";
import { CircuitBreakerRegistry } from "@ignitabull/core";

export interface HealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	timestamp: string;
	uptime: number;
	version?: string;
	environment?: string;
	services: ServiceHealth[];
	circuitBreakers: CircuitBreakerHealth[];
	system: SystemHealth;
}

export interface ServiceHealth {
	name: string;
	status: "healthy" | "degraded" | "unhealthy";
	responseTime?: number;
	lastCheck: string;
	details?: Record<string, any>;
}

export interface CircuitBreakerHealth {
	name: string;
	state: string;
	successRate: number;
	totalRequests: number;
	averageResponseTime: number;
	lastFailure?: string;
	lastSuccess?: string;
}

export interface SystemHealth {
	memory: {
		used: number;
		total: number;
		percentage: number;
	};
	cpu?: {
		percentage: number;
	};
	disk?: {
		used: number;
		total: number;
		percentage: number;
	};
}

export class HealthChecker {
	private checks: Map<string, () => Promise<ServiceHealth>> = new Map();
	private startTime = Date.now();

	/**
	 * Register a health check
	 */
	register(name: string, check: () => Promise<ServiceHealth>): void {
		this.checks.set(name, check);
	}

	/**
	 * Unregister a health check
	 */
	unregister(name: string): boolean {
		return this.checks.delete(name);
	}

	/**
	 * Run all health checks
	 */
	async runChecks(): Promise<HealthStatus> {
		const serviceChecks = await Promise.allSettled(
			Array.from(this.checks.entries()).map(async ([name, check]) => {
				try {
					return await Promise.race([
						check(),
						new Promise<ServiceHealth>((_, reject) =>
							setTimeout(() => reject(new Error("Health check timeout")), 5000),
						),
					]);
				} catch (error) {
					return {
						name,
						status: "unhealthy" as const,
						lastCheck: new Date().toISOString(),
						details: {
							error: error instanceof Error ? error.message : "Unknown error",
						},
					};
				}
			}),
		);

		const services: ServiceHealth[] = serviceChecks.map((result, index) => {
			if (result.status === "fulfilled") {
				return result.value;
			}
			const [name] = Array.from(this.checks.keys())[index];
			return {
				name,
				status: "unhealthy" as const,
				lastCheck: new Date().toISOString(),
				details: {
					error: result.reason?.message || "Health check failed",
				},
			};
		});

		// Get circuit breaker health
		const circuitBreakers = this.getCircuitBreakerHealth();

		// Get system health
		const system = this.getSystemHealth();

		// Determine overall status
		const status = this.determineOverallStatus(services, circuitBreakers);

		return {
			status,
			timestamp: new Date().toISOString(),
			uptime: Date.now() - this.startTime,
			version: process.env.npm_package_version,
			environment: process.env.NODE_ENV || "unknown",
			services,
			circuitBreakers,
			system,
		};
	}

	/**
	 * Get circuit breaker health status
	 */
	private getCircuitBreakerHealth(): CircuitBreakerHealth[] {
		const registry = CircuitBreakerRegistry.getInstance();
		const allStats = registry.getAllStats();

		return Object.entries(allStats).map(([name, stats]) => ({
			name,
			state: stats.state,
			successRate:
				stats.totalRequests > 0
					? (stats.totalSuccesses / stats.totalRequests) * 100
					: 100,
			totalRequests: stats.totalRequests,
			averageResponseTime: stats.averageResponseTime,
			lastFailure: stats.lastFailureTime
				? new Date(stats.lastFailureTime).toISOString()
				: undefined,
			lastSuccess: stats.lastSuccessTime
				? new Date(stats.lastSuccessTime).toISOString()
				: undefined,
		}));
	}

	/**
	 * Get system health metrics
	 */
	private getSystemHealth(): SystemHealth {
		const memUsage = process.memoryUsage();

		return {
			memory: {
				used: memUsage.heapUsed,
				total: memUsage.heapTotal,
				percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
			},
		};
	}

	/**
	 * Determine overall health status
	 */
	private determineOverallStatus(
		services: ServiceHealth[],
		circuitBreakers: CircuitBreakerHealth[],
	): "healthy" | "degraded" | "unhealthy" {
		const unhealthyServices = services.filter(
			(s) => s.status === "unhealthy",
		).length;
		const degradedServices = services.filter(
			(s) => s.status === "degraded",
		).length;
		const openCircuitBreakers = circuitBreakers.filter(
			(cb) => cb.state === "OPEN",
		).length;

		if (unhealthyServices > 0 || openCircuitBreakers > 0) {
			return "unhealthy";
		}

		if (degradedServices > 0) {
			return "degraded";
		}

		return "healthy";
	}
}

// Global health checker instance
const globalHealthChecker = new HealthChecker();

/**
 * Default health checks
 */
export const DefaultHealthChecks = {
	database: async (): Promise<ServiceHealth> => {
		const startTime = Date.now();
		try {
			// Simple database connection check
			// This would be replaced with actual database ping
			await new Promise((resolve) => setTimeout(resolve, 10));

			return {
				name: "database",
				status: "healthy",
				responseTime: Date.now() - startTime,
				lastCheck: new Date().toISOString(),
				details: {
					connection: "active",
				},
			};
		} catch (error) {
			return {
				name: "database",
				status: "unhealthy",
				responseTime: Date.now() - startTime,
				lastCheck: new Date().toISOString(),
				details: {
					error: error instanceof Error ? error.message : "Unknown error",
				},
			};
		}
	},

	external_apis: async (): Promise<ServiceHealth> => {
		const startTime = Date.now();
		try {
			// Check external API connectivity
			const checks = await Promise.allSettled([
				// Amazon API check would go here
				Promise.resolve({ service: "amazon", status: "ok" }),
				// Email service check would go here
				Promise.resolve({ service: "email", status: "ok" }),
			]);

			const failures = checks.filter((c) => c.status === "rejected").length;

			return {
				name: "external_apis",
				status:
					failures === 0
						? "healthy"
						: failures < checks.length
							? "degraded"
							: "unhealthy",
				responseTime: Date.now() - startTime,
				lastCheck: new Date().toISOString(),
				details: {
					total: checks.length,
					successful: checks.length - failures,
					failed: failures,
				},
			};
		} catch (error) {
			return {
				name: "external_apis",
				status: "unhealthy",
				responseTime: Date.now() - startTime,
				lastCheck: new Date().toISOString(),
				details: {
					error: error instanceof Error ? error.message : "Unknown error",
				},
			};
		}
	},

	memory: async (): Promise<ServiceHealth> => {
		const memUsage = process.memoryUsage();
		const memoryPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

		let status: "healthy" | "degraded" | "unhealthy" = "healthy";
		if (memoryPercentage > 90) {
			status = "unhealthy";
		} else if (memoryPercentage > 80) {
			status = "degraded";
		}

		return {
			name: "memory",
			status,
			lastCheck: new Date().toISOString(),
			details: {
				heapUsed: memUsage.heapUsed,
				heapTotal: memUsage.heapTotal,
				percentage: memoryPercentage,
				external: memUsage.external,
				rss: memUsage.rss,
			},
		};
	},
};

/**
 * Initialize default health checks
 */
export function initializeHealthChecks(): void {
	globalHealthChecker.register("database", DefaultHealthChecks.database);
	globalHealthChecker.register(
		"external_apis",
		DefaultHealthChecks.external_apis,
	);
	globalHealthChecker.register("memory", DefaultHealthChecks.memory);
}

/**
 * Health check endpoint middleware
 */
export function createHealthCheckEndpoint() {
	return async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const health = await globalHealthChecker.runChecks();

			// Set status code based on health
			let statusCode = 200;
			if (health.status === "degraded") {
				statusCode = 200; // Still operational
			} else if (health.status === "unhealthy") {
				statusCode = 503; // Service unavailable
			}

			res.status(statusCode).json(health);
		} catch (error) {
			next(error);
		}
	};
}

/**
 * Simple readiness check (for Kubernetes readiness probe)
 */
export function createReadinessCheck() {
	return async (_req: Request, res: Response, _next: NextFunction) => {
		try {
			const health = await globalHealthChecker.runChecks();

			if (health.status === "unhealthy") {
				res
					.status(503)
					.json({ status: "not ready", reason: "unhealthy services" });
			} else {
				res.status(200).json({ status: "ready" });
			}
		} catch (_error) {
			res
				.status(503)
				.json({ status: "not ready", reason: "health check failed" });
		}
	};
}

/**
 * Simple liveness check (for Kubernetes liveness probe)
 */
export function createLivenessCheck() {
	return (_req: Request, res: Response) => {
		// Basic liveness check - just confirm the process is running
		res.status(200).json({
			status: "alive",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
		});
	};
}

export { globalHealthChecker as healthChecker };
export default createHealthCheckEndpoint;
