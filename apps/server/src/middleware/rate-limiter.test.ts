/**
 * Rate Limiter Tests
 * Comprehensive test suite for API rate limiting middleware
 */

import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { advanceTime, runAllTimers } from "../../../../test/utils";
import {
	createRateLimit,
	createTieredRateLimit,
	MemoryRateLimitStore,
	RateLimitAlgorithms,
	RateLimitPresets,
} from "./rate-limiter";

// Mock Express objects
function createMockRequest(overrides: Partial<Request> = {}): Request {
	return {
		ip: "127.0.0.1",
		headers: {},
		connection: { remoteAddress: "127.0.0.1" },
		...overrides,
	} as Request;
}

function createMockResponse(): Response {
	const res = {
		set: vi.fn(),
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	};
	return res as unknown as Response;
}

describe("Rate Limiter", () => {
	let store: MemoryRateLimitStore;
	let req: Request;
	let res: Response;
	let next: NextFunction;

	beforeEach(() => {
		vi.useFakeTimers();
		store = new MemoryRateLimitStore();
		req = createMockRequest();
		res = createMockResponse();
		next = vi.fn();
	});

	afterEach(() => {
		vi.useRealTimers();
		store.cleanup();
	});

	describe("MemoryRateLimitStore", () => {
		it("should store and retrieve records", async () => {
			const record = { count: 1, resetTime: Date.now() + 60000 };

			await store.set("test-key", record, 60000);
			const retrieved = await store.get("test-key");

			expect(retrieved).toEqual(record);
		});

		it("should increment counts", async () => {
			const result1 = await store.increment("test-key", 60000);
			expect(result1.count).toBe(1);

			const result2 = await store.increment("test-key", 60000);
			expect(result2.count).toBe(2);
		});

		it("should auto-expire records", async () => {
			await store.set(
				"test-key",
				{ count: 1, resetTime: Date.now() + 1000 },
				1000,
			);

			let record = await store.get("test-key");
			expect(record).toBeTruthy();

			advanceTime(1100);
			runAllTimers();

			record = await store.get("test-key");
			expect(record).toBeNull();
		});

		it("should delete records", async () => {
			await store.set(
				"test-key",
				{ count: 1, resetTime: Date.now() + 60000 },
				60000,
			);

			let record = await store.get("test-key");
			expect(record).toBeTruthy();

			await store.delete("test-key");
			record = await store.get("test-key");
			expect(record).toBeNull();
		});

		it("should clear all records", async () => {
			await store.set(
				"key1",
				{ count: 1, resetTime: Date.now() + 60000 },
				60000,
			);
			await store.set(
				"key2",
				{ count: 1, resetTime: Date.now() + 60000 },
				60000,
			);

			await store.clear();

			expect(await store.get("key1")).toBeNull();
			expect(await store.get("key2")).toBeNull();
		});
	});

	describe("Rate Limit Algorithms", () => {
		describe("Fixed Window", () => {
			it("should allow requests within limit", async () => {
				const config = {
					windowMs: 60000,
					maxRequests: 10,
					algorithm: "fixed-window" as const,
				};

				const info1 = await RateLimitAlgorithms.fixedWindow(
					"test-key",
					config,
					store,
				);
				expect(info1.remaining).toBe(9);
				expect(info1.limit).toBe(10);

				const info2 = await RateLimitAlgorithms.fixedWindow(
					"test-key",
					config,
					store,
				);
				expect(info2.remaining).toBe(8);
			});

			it("should block requests when limit exceeded", async () => {
				const config = {
					windowMs: 60000,
					maxRequests: 2,
					algorithm: "fixed-window" as const,
				};

				await RateLimitAlgorithms.fixedWindow("test-key", config, store);
				await RateLimitAlgorithms.fixedWindow("test-key", config, store);
				const info = await RateLimitAlgorithms.fixedWindow(
					"test-key",
					config,
					store,
				);

				expect(info.remaining).toBe(0);
				expect(info.retryAfter).toBeGreaterThan(0);
			});

			it("should reset counts after window expires", async () => {
				const config = {
					windowMs: 1000,
					maxRequests: 2,
					algorithm: "fixed-window" as const,
				};

				await RateLimitAlgorithms.fixedWindow("test-key", config, store);
				await RateLimitAlgorithms.fixedWindow("test-key", config, store);

				// Move to next window
				advanceTime(1100);

				const info = await RateLimitAlgorithms.fixedWindow(
					"test-key",
					config,
					store,
				);
				expect(info.remaining).toBe(1); // Should be reset
			});
		});

		describe("Token Bucket", () => {
			it("should consume tokens on requests", async () => {
				const config = {
					windowMs: 60000,
					maxRequests: 10,
					algorithm: "token-bucket" as const,
				};

				const info1 = await RateLimitAlgorithms.tokenBucket(
					"test-key",
					config,
					store,
				);
				expect(info1.remaining).toBe(9);

				const info2 = await RateLimitAlgorithms.tokenBucket(
					"test-key",
					config,
					store,
				);
				expect(info2.remaining).toBe(8);
			});

			it("should refill tokens over time", async () => {
				const config = {
					windowMs: 10000,
					maxRequests: 10,
					algorithm: "token-bucket" as const,
				};

				// Consume all tokens
				for (let i = 0; i < 10; i++) {
					await RateLimitAlgorithms.tokenBucket("test-key", config, store);
				}

				let info = await RateLimitAlgorithms.tokenBucket(
					"test-key",
					config,
					store,
				);
				expect(info.remaining).toBe(0);

				// Wait for refill (half the window)
				advanceTime(5000);

				info = await RateLimitAlgorithms.tokenBucket("test-key", config, store);
				expect(info.remaining).toBeGreaterThan(0);
			});
		});
	});

	describe("Rate Limit Middleware", () => {
		it("should allow requests within limit", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 10,
				algorithm: "fixed-window",
				store,
			});

			await limiter(req, res, next);

			expect(next).toHaveBeenCalledWith();
			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-RateLimit-Limit": "10",
					"X-RateLimit-Remaining": "9",
				}),
			);
		});

		it("should block requests when limit exceeded", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 1,
				algorithm: "fixed-window",
				store,
				message: "Rate limit exceeded",
			});

			// First request should pass
			await limiter(req, res, next);
			expect(next).toHaveBeenCalledWith();

			// Reset mocks
			vi.clearAllMocks();

			// Second request should be blocked
			await limiter(req, res, next);
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					code: "RATE_LIMIT_EXCEEDED",
					message: "Rate limit exceeded",
					statusCode: 429,
				}),
			);
		});

		it("should use custom key generator", async () => {
			const keyGenerator = vi.fn(() => "custom-key");
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 10,
				algorithm: "fixed-window",
				store,
				keyGenerator,
			});

			await limiter(req, res, next);

			expect(keyGenerator).toHaveBeenCalledWith(req);
		});

		it("should skip requests when skipIf condition is met", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 1,
				algorithm: "fixed-window",
				store,
				skipIf: (req) => req.ip === "127.0.0.1",
			});

			await limiter(req, res, next);
			await limiter(req, res, next); // Should still pass

			expect(next).toHaveBeenCalledTimes(2);
			expect(next).toHaveBeenNthCalledWith(1);
			expect(next).toHaveBeenNthCalledWith(2);
		});

		it("should call onLimitReached callback", async () => {
			const onLimitReached = vi.fn();
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 1,
				algorithm: "fixed-window",
				store,
				onLimitReached,
			});

			await limiter(req, res, next); // First request
			await limiter(req, res, next); // Second request (blocked)

			expect(onLimitReached).toHaveBeenCalledWith(req, res);
		});

		it("should use custom message function", async () => {
			const messageFunc = vi.fn(() => "Custom rate limit message");
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 1,
				algorithm: "fixed-window",
				store,
				message: messageFunc,
			});

			await limiter(req, res, next); // First request
			await limiter(req, res, next); // Second request (blocked)

			expect(messageFunc).toHaveBeenCalledWith(req);
			expect(next).toHaveBeenLastCalledWith(
				expect.objectContaining({
					message: "Custom rate limit message",
				}),
			);
		});

		it("should handle X-Forwarded-For header", async () => {
			const reqWithForwarded = createMockRequest({
				headers: { "x-forwarded-for": "192.168.1.100, 10.0.0.1" },
				ip: "127.0.0.1",
			});

			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 10,
				algorithm: "fixed-window",
				store,
			});

			await limiter(reqWithForwarded, res, next);

			// Should use the first IP from X-Forwarded-For
			expect(next).toHaveBeenCalledWith();
		});
	});

	describe("Tiered Rate Limiting", () => {
		it("should apply different limits based on user tier", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 10, // Default limit
				algorithm: "fixed-window",
				store,
				tiers: [
					{
						name: "premium",
						condition: (req) => (req as any).user?.tier === "premium",
						windowMs: 60000,
						maxRequests: 100,
						priority: 1,
					},
					{
						name: "authenticated",
						condition: (req) => !!(req as any).user,
						windowMs: 60000,
						maxRequests: 50,
						priority: 2,
					},
				],
			});

			// Test premium user
			const premiumReq = createMockRequest({
				user: { tier: "premium" },
			} as any);
			await limiter(premiumReq, res, next);
			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-RateLimit-Limit": "100",
				}),
			);

			vi.clearAllMocks();

			// Test authenticated user
			const authReq = createMockRequest({ user: { tier: "basic" } } as any);
			await limiter(authReq, res, next);
			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-RateLimit-Limit": "50",
				}),
			);

			vi.clearAllMocks();

			// Test anonymous user
			const anonReq = createMockRequest();
			await limiter(anonReq, res, next);
			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-RateLimit-Limit": "10",
				}),
			);
		});

		it("should use priority to determine tier precedence", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 10,
				algorithm: "fixed-window",
				store,
				tiers: [
					{
						name: "special",
						condition: (req) => (req as any).user?.special === true,
						windowMs: 60000,
						maxRequests: 200,
						priority: 1, // Higher priority
					},
					{
						name: "premium",
						condition: (req) => (req as any).user?.tier === "premium",
						windowMs: 60000,
						maxRequests: 100,
						priority: 2, // Lower priority
					},
				],
			});

			// User that matches both conditions
			const specialPremiumReq = createMockRequest({
				user: { tier: "premium", special: true },
			} as any);

			await limiter(specialPremiumReq, res, next);

			// Should use the higher priority tier (special)
			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-RateLimit-Limit": "200",
				}),
			);
		});
	});

	describe("Rate Limit Presets", () => {
		it("should provide auth preset with strict limits", () => {
			const authConfig = RateLimitPresets.auth;

			expect(authConfig.windowMs).toBe(15 * 60 * 1000); // 15 minutes
			expect(authConfig.maxRequests).toBe(5);
			expect(authConfig.algorithm).toBe("sliding-window");
			expect(authConfig.tiers).toBeDefined();
		});

		it("should provide API preset with moderate limits", () => {
			const apiConfig = RateLimitPresets.api;

			expect(apiConfig.windowMs).toBe(60 * 1000); // 1 minute
			expect(apiConfig.maxRequests).toBe(100);
			expect(apiConfig.algorithm).toBe("token-bucket");
		});

		it("should provide upload preset with restrictive limits", () => {
			const uploadConfig = RateLimitPresets.upload;

			expect(uploadConfig.windowMs).toBe(60 * 1000); // 1 minute
			expect(uploadConfig.maxRequests).toBe(10);
			expect(uploadConfig.algorithm).toBe("leaky-bucket");
		});
	});

	describe("Global Tiered Rate Limiter", () => {
		it("should create tiered rate limiter with default tiers", async () => {
			const limiter = createTieredRateLimit();

			// Test anonymous user (lowest tier)
			const anonReq = createMockRequest();
			await limiter(anonReq, res, next);
			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-RateLimit-Limit": "60",
				}),
			);

			vi.clearAllMocks();

			// Test authenticated user
			const authReq = createMockRequest({ user: { id: "123" } } as any);
			await limiter(authReq, res, next);
			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-RateLimit-Limit": "300",
				}),
			);

			vi.clearAllMocks();

			// Test premium user
			const premiumReq = createMockRequest({
				user: { tier: "premium" },
			} as any);
			await limiter(premiumReq, res, next);
			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-RateLimit-Limit": "1000",
				}),
			);
		});
	});

	describe("Header Configuration", () => {
		it("should include standard headers by default", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 10,
				algorithm: "fixed-window",
				store,
			});

			await limiter(req, res, next);

			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-RateLimit-Limit": "10",
					"X-RateLimit-Remaining": "9",
					"X-RateLimit-Reset": expect.any(String),
				}),
			);
		});

		it("should include legacy headers when enabled", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 10,
				algorithm: "fixed-window",
				store,
				legacyHeaders: true,
			});

			await limiter(req, res, next);

			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"X-Rate-Limit-Limit": "10",
					"X-Rate-Limit-Remaining": "9",
					"X-Rate-Limit-Reset": expect.any(String),
				}),
			);
		});

		it("should not include headers when disabled", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 10,
				algorithm: "fixed-window",
				store,
				headers: false,
			});

			await limiter(req, res, next);

			expect(res.set).not.toHaveBeenCalled();
		});

		it("should include Retry-After header when rate limited", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 1,
				algorithm: "fixed-window",
				store,
			});

			await limiter(req, res, next); // First request

			vi.clearAllMocks();

			await limiter(req, res, next); // Second request (blocked)

			expect(res.set).toHaveBeenCalledWith(
				expect.objectContaining({
					"Retry-After": expect.any(String),
				}),
			);
		});
	});

	describe("Error Handling", () => {
		it("should handle store errors gracefully", async () => {
			const errorStore = {
				get: vi.fn().mockRejectedValue(new Error("Store error")),
				set: vi.fn(),
				increment: vi.fn(),
				delete: vi.fn(),
				clear: vi.fn(),
			};

			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 10,
				algorithm: "fixed-window",
				store: errorStore,
			});

			await limiter(req, res, next);

			expect(next).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe("Performance", () => {
		it("should handle concurrent requests efficiently", async () => {
			const limiter = createRateLimit({
				windowMs: 60000,
				maxRequests: 100,
				algorithm: "fixed-window",
				store,
			});

			const requests = Array.from({ length: 50 }, () =>
				limiter(createMockRequest(), createMockResponse(), vi.fn()),
			);

			const startTime = Date.now();
			await Promise.all(requests);
			const endTime = Date.now();

			expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
		});
	});
});
