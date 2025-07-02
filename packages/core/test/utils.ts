/**
 * Test utilities for core package
 */

import { vi } from "vitest";

/**
 * Create mock visitor session
 */
export function createMockVisitorSession(overrides = {}) {
	return {
		id: "test-session-id",
		sessionId: "session_123",
		userId: "test-user-id",
		anonymousId: "anon_123",
		ipAddress: "127.0.0.1",
		userAgent: "Mozilla/5.0 (Test)",
		referrer: "https://google.com",
		utmSource: "google",
		utmMedium: "organic",
		country: "US",
		region: "CA",
		city: "San Francisco",
		deviceType: "desktop" as const,
		browserName: "Chrome",
		osName: "macOS",
		isBot: false,
		startTime: new Date(),
		endTime: null,
		duration: null,
		pageViews: 1,
		bounceRate: 0,
		isReturning: false,
		lastActiveAt: new Date(),
		timezone: "UTC",
		language: "en",
		screenResolution: "1920x1080",
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

/**
 * Mock timer helpers
 */
export function advanceTime(ms: number) {
	vi.advanceTimersByTime(ms);
}

/**
 * Create error for testing
 */
export function createMockError(message = "Test error", code = "TEST_ERROR") {
	const error = new Error(message);
	(error as any).code = code;
	return error;
}

/**
 * Mock console methods for specific tests
 */
export function mockConsole() {
	const originalError = console.error;
	const originalWarn = console.warn;
	const originalLog = console.log;

	console.error = vi.fn();
	console.warn = vi.fn();
	console.log = vi.fn();

	return {
		restore: () => {
			console.error = originalError;
			console.warn = originalWarn;
			console.log = originalLog;
		},
		error: console.error as any,
		warn: console.warn as any,
		log: console.log as any,
	};
}

/**
 * Create mock user for testing
 */
export function createMockUser(overrides: any = {}): any {
	return {
		id: "test-user-id",
		email: "test@example.com",
		first_name: "Test",
		last_name: "User",
		avatar_url: null,
		timezone: "UTC",
		current_organization_id: "test-org-id",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		...overrides,
	};
}

/**
 * Create mock auth session for testing
 */
export function createMockSession(userOverrides: any = {}): any {
	return {
		user: createMockUser(userOverrides),
		accessToken: "test-access-token",
		refreshToken: "test-refresh-token",
		expiresAt: Date.now() + 3600000, // 1 hour from now
	};
}

/**
 * Create mock organization
 */
export function createMockOrganization(overrides = {}) {
	return {
		id: "test-org-id",
		name: "Test Organization",
		slug: "test-org",
		description: "Test organization for testing",
		website: "https://test.com",
		industry: "Technology",
		owner_id: "test-user-id",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		...overrides,
	};
}

/**
 * Create mock Supabase single response
 */
export function createMockSupabaseSingleResponse<T>(data: T, error = null) {
	return {
		data,
		error,
		status: error ? 400 : 200,
		statusText: error ? "Bad Request" : "OK",
	};
}
