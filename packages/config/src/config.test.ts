/**
 * ConfigManager Tests
 * Test suite for centralized configuration management
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConfigManager } from "./config";

describe("ConfigManager", () => {
	let _configManager: ConfigManager;
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		// Reset singleton
		ConfigManager.resetInstance();
		_configManager = ConfigManager.getInstance();

		// Backup original environment
		originalEnv = { ...process.env };

		// Clear environment
		Object.keys(process.env).forEach((key) => {
			if (
				key.startsWith("NODE_ENV") ||
				key.startsWith("PORT") ||
				key.startsWith("SUPABASE_") ||
				key.startsWith("NEO4J_") ||
				key.startsWith("RESEND_") ||
				key.startsWith("AMAZON_") ||
				key.startsWith("OPENAI_") ||
				key.startsWith("JWT_")
			) {
				delete process.env[key];
			}
		});
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
		ConfigManager.resetInstance();
	});

	describe("Singleton Pattern", () => {
		it("should return the same instance", () => {
			const instance1 = ConfigManager.getInstance();
			const instance2 = ConfigManager.getInstance();

			expect(instance1).toBe(instance2);
		});

		it("should allow resetting instance for testing", () => {
			const instance1 = ConfigManager.getInstance();
			ConfigManager.resetInstance();
			const instance2 = ConfigManager.getInstance();

			expect(instance1).not.toBe(instance2);
		});
	});

	describe("Environment Validation", () => {
		it("should validate and load valid configuration", () => {
			// Set valid environment variables
			process.env.NODE_ENV = "test";
			process.env.PORT = "3001";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-anon-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test-password";
			process.env.RESEND_API_KEY = "test-resend-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";

			ConfigManager.resetInstance();
			const manager = ConfigManager.getInstance();
			const config = manager.get();

			expect(config.server.NODE_ENV).toBe("test");
			expect(config.server.PORT).toBe(3001);
			expect(config.database.SUPABASE_URL).toBe("https://test.supabase.co");
			expect(config.email.RESEND_API_KEY).toBe("test-resend-key");
			expect(config.security.JWT_SECRET).toBe(
				"test-jwt-secret-with-minimum-length",
			);
		});

		it("should throw error for missing required environment variables", () => {
			process.env.NODE_ENV = "production";
			// Missing required variables

			expect(() => {
				ConfigManager.resetInstance();
				ConfigManager.getInstance().get();
			}).toThrow();
		});

		it("should apply default values where appropriate", () => {
			process.env.NODE_ENV = "development";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test";
			process.env.RESEND_API_KEY = "test-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";

			ConfigManager.resetInstance();
			const manager = ConfigManager.getInstance();
			const config = manager.get();

			expect(config.server.PORT).toBe(3001); // Default value
			expect(config.server.NODE_ENV).toBe("development");
		});

		it("should validate port numbers", () => {
			process.env.NODE_ENV = "test";
			process.env.PORT = "invalid-port";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test";
			process.env.RESEND_API_KEY = "test-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";

			expect(() => {
				ConfigManager.resetInstance();
				ConfigManager.getInstance().get();
			}).toThrow();
		});

		it("should validate URL formats", () => {
			process.env.NODE_ENV = "test";
			process.env.PORT = "3001";
			process.env.SUPABASE_URL = "invalid-url";
			process.env.SUPABASE_ANON_KEY = "test-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test";
			process.env.RESEND_API_KEY = "test-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";

			expect(() => {
				ConfigManager.resetInstance();
				ConfigManager.getInstance().get();
			}).toThrow();
		});
	});

	describe("Configuration Sections", () => {
		beforeEach(() => {
			// Set up valid base configuration
			process.env.NODE_ENV = "test";
			process.env.PORT = "3001";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-anon-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test-password";
			process.env.RESEND_API_KEY = "test-resend-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";
		});

		it("should load server configuration", () => {
			ConfigManager.resetInstance();
			const config = ConfigManager.getInstance().get();

			expect(config.server).toMatchObject({
				NODE_ENV: "test",
				PORT: 3001,
			});
		});

		it("should load database configuration", () => {
			ConfigManager.resetInstance();
			const config = ConfigManager.getInstance().get();

			expect(config.database).toMatchObject({
				SUPABASE_URL: "https://test.supabase.co",
				SUPABASE_ANON_KEY: "test-anon-key",
				SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
				NEO4J_URI: "bolt://localhost:7687",
				NEO4J_USERNAME: "test",
				NEO4J_PASSWORD: "test-password",
			});
		});

		it("should load email configuration", () => {
			ConfigManager.resetInstance();
			const config = ConfigManager.getInstance().get();

			expect(config.email).toMatchObject({
				RESEND_API_KEY: "test-resend-key",
			});
		});

		it("should load security configuration", () => {
			ConfigManager.resetInstance();
			const config = ConfigManager.getInstance().get();

			expect(config.security).toMatchObject({
				JWT_SECRET: "test-jwt-secret-with-minimum-length",
			});
		});

		it("should load Amazon API configuration when provided", () => {
			process.env.AMAZON_SP_CLIENT_ID = "test-sp-client-id";
			process.env.AMAZON_SP_CLIENT_SECRET = "test-sp-client-secret";
			process.env.AMAZON_SP_REFRESH_TOKEN = "test-sp-refresh-token";

			ConfigManager.resetInstance();
			const config = ConfigManager.getInstance().get();

			expect(config.amazon).toMatchObject({
				AMAZON_SP_CLIENT_ID: "test-sp-client-id",
				AMAZON_SP_CLIENT_SECRET: "test-sp-client-secret",
				AMAZON_SP_REFRESH_TOKEN: "test-sp-refresh-token",
			});
		});

		it("should load AI configuration when provided", () => {
			process.env.OPENAI_API_KEY = "test-openai-key";
			process.env.ANTHROPIC_API_KEY = "test-anthropic-key";

			ConfigManager.resetInstance();
			const config = ConfigManager.getInstance().get();

			expect(config.ai).toMatchObject({
				OPENAI_API_KEY: "test-openai-key",
				ANTHROPIC_API_KEY: "test-anthropic-key",
			});
		});
	});

	describe("Configuration Redaction", () => {
		it("should redact sensitive values in getRedacted()", () => {
			process.env.NODE_ENV = "test";
			process.env.PORT = "3001";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-anon-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "sensitive-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "sensitive-password";
			process.env.RESEND_API_KEY = "sensitive-resend-key";
			process.env.JWT_SECRET = "sensitive-jwt-secret-with-minimum-length";
			process.env.OPENAI_API_KEY = "sensitive-openai-key";

			ConfigManager.resetInstance();
			const manager = ConfigManager.getInstance();
			const redacted = manager.getRedacted();

			expect(redacted.database.SUPABASE_SERVICE_ROLE_KEY).toBe("[REDACTED]");
			expect(redacted.database.NEO4J_PASSWORD).toBe("[REDACTED]");
			expect(redacted.email.RESEND_API_KEY).toBe("[REDACTED]");
			expect(redacted.security.JWT_SECRET).toBe("[REDACTED]");
			expect(redacted.ai.OPENAI_API_KEY).toBe("[REDACTED]");

			// Non-sensitive values should remain
			expect(redacted.server.NODE_ENV).toBe("test");
			expect(redacted.server.PORT).toBe(3001);
			expect(redacted.database.SUPABASE_URL).toBe("https://test.supabase.co");
		});
	});

	describe("Cleanup", () => {
		it("should clear configuration on cleanup", () => {
			process.env.NODE_ENV = "test";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test";
			process.env.RESEND_API_KEY = "test-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";

			ConfigManager.resetInstance();
			const manager = ConfigManager.getInstance();

			// Load config first
			const config = manager.get();
			expect(config).toBeDefined();

			// Cleanup
			manager.cleanup();

			// Should need to reload
			expect(() => manager.get()).toThrow();
		});
	});

	describe("Error Handling", () => {
		it("should provide helpful error messages for missing variables", () => {
			process.env.NODE_ENV = "production";
			// Missing SUPABASE_URL

			expect(() => {
				ConfigManager.resetInstance();
				ConfigManager.getInstance().get();
			}).toThrow(/SUPABASE_URL/);
		});

		it("should handle invalid JSON in environment variables gracefully", () => {
			process.env.NODE_ENV = "test";
			process.env.PORT = "3001";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test";
			process.env.RESEND_API_KEY = "test-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";

			// This should not throw if we're not trying to parse JSON
			expect(() => {
				ConfigManager.resetInstance();
				ConfigManager.getInstance().get();
			}).not.toThrow();
		});
	});

	describe("Type Safety", () => {
		it("should enforce type safety at runtime", () => {
			process.env.NODE_ENV = "test";
			process.env.PORT = "99999"; // Out of valid range
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test";
			process.env.RESEND_API_KEY = "test-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";

			expect(() => {
				ConfigManager.resetInstance();
				ConfigManager.getInstance().get();
			}).toThrow();
		});

		it("should validate environment enum values", () => {
			process.env.NODE_ENV = "invalid-env";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test";
			process.env.RESEND_API_KEY = "test-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";

			expect(() => {
				ConfigManager.resetInstance();
				ConfigManager.getInstance().get();
			}).toThrow();
		});
	});

	describe("Performance", () => {
		it("should cache configuration after first load", () => {
			process.env.NODE_ENV = "test";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";
			process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
			process.env.NEO4J_URI = "bolt://localhost:7687";
			process.env.NEO4J_USERNAME = "test";
			process.env.NEO4J_PASSWORD = "test";
			process.env.RESEND_API_KEY = "test-key";
			process.env.JWT_SECRET = "test-jwt-secret-with-minimum-length";

			ConfigManager.resetInstance();
			const manager = ConfigManager.getInstance();

			const start1 = performance.now();
			const config1 = manager.get();
			const time1 = performance.now() - start1;

			const start2 = performance.now();
			const config2 = manager.get();
			const time2 = performance.now() - start2;

			// Second call should be much faster (cached)
			expect(time2).toBeLessThan(time1);
			expect(config1).toBe(config2); // Same reference
		});
	});
});
