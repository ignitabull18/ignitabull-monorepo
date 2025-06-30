/**
 * Global test setup
 * Configures environment and mocks for all tests
 */

import { vi } from "vitest";

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
process.env.NEO4J_URI = "bolt://localhost:7687";
process.env.NEO4J_USERNAME = "test";
process.env.NEO4J_PASSWORD = "test";
process.env.RESEND_API_KEY = "test-resend-key";
process.env.JWT_SECRET = "test-jwt-secret";

// Mock timers
vi.useFakeTimers();

// Mock fetch globally
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = vi.fn();
console.warn = vi.fn();

// Restore console for specific tests that need it
export const restoreConsole = () => {
	console.error = originalConsoleError;
	console.warn = originalConsoleWarn;
};

// Mock Supabase client
vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn(() => ({
		auth: {
			signUp: vi.fn(),
			signInWithPassword: vi.fn(),
			signOut: vi.fn(),
			getUser: vi.fn(),
			onAuthStateChange: vi.fn(),
			resetPasswordForEmail: vi.fn(),
			updateUser: vi.fn(),
		},
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn(),
			maybeSingle: vi.fn(),
		})),
	})),
}));

// Mock Neo4j driver
vi.mock("neo4j-driver", () => ({
	driver: vi.fn(() => ({
		session: vi.fn(() => ({
			run: vi.fn(),
			close: vi.fn(),
		})),
		close: vi.fn(),
	})),
	auth: {
		basic: vi.fn(),
	},
}));

// Cleanup after each test
afterEach(() => {
	vi.clearAllMocks();
	vi.clearAllTimers();
});

// Cleanup after all tests
afterAll(() => {
	vi.useRealTimers();
	restoreConsole();
});
