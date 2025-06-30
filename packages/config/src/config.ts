/**
 * Configuration Manager
 * Centralized configuration with validation and type safety
 */

import { config as dotenvConfig } from "dotenv";
import type { z } from "zod";

import {
	type AIConfig,
	AIConfigSchema,
	type AmazonConfig,
	AmazonConfigSchema,
	type AnalyticsConfig,
	AnalyticsConfigSchema,
	type Config,
	ConfigSchema,
	type DatabaseConfig,
	DatabaseConfigSchema,
	type EmailConfig,
	EmailConfigSchema,
	type FeatureFlags,
	FeatureFlagsSchema,
	type SecurityConfig,
	SecurityConfigSchema,
	type ServerConfig,
	ServerConfigSchema,
} from "./schemas";

// Configuration error class
export class ConfigurationError extends Error {
	constructor(public errors: z.ZodError) {
		super("Configuration validation failed");
		this.name = "ConfigurationError";
	}
}

// Configuration manager class
export class ConfigManager {
	private static instance: ConfigManager;
	private config: Config | null = null;
	private isValidated = false;

	private constructor() {
		// Load environment variables
		dotenvConfig();
	}

	static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager();
		}
		return ConfigManager.instance;
	}

	/**
	 * Load and validate configuration
	 */
	load(): Config {
		if (this.config && this.isValidated) {
			return this.config;
		}

		try {
			// Parse configuration sections
			const serverConfig = this.parseServerConfig();
			const databaseConfig = this.parseDatabaseConfig();
			const emailConfig = this.parseEmailConfig();
			const amazonConfig = this.parseAmazonConfig();
			const analyticsConfig = this.parseAnalyticsConfig();
			const aiConfig = this.parseAIConfig();
			const securityConfig = this.parseSecurityConfig();
			const featureFlags = this.parseFeatureFlags();

			// Combine all configurations
			this.config = {
				server: serverConfig,
				database: databaseConfig,
				email: emailConfig,
				amazon: amazonConfig,
				analytics: analyticsConfig,
				ai: aiConfig,
				security: securityConfig,
				features: featureFlags,
			};

			// Validate complete configuration
			const result = ConfigSchema.safeParse(this.config);
			if (!result.success) {
				throw new ConfigurationError(result.error);
			}

			this.isValidated = true;
			return this.config;
		} catch (error) {
			if (error instanceof ConfigurationError) {
				console.error("Configuration validation errors:");
				error.errors.errors.forEach((err) => {
					console.error(`  - ${err.path.join(".")}: ${err.message}`);
				});
			}
			throw error;
		}
	}

	/**
	 * Get configuration (loads if not already loaded)
	 */
	get(): Config {
		if (!this.config || !this.isValidated) {
			return this.load();
		}
		return this.config;
	}

	/**
	 * Get server configuration
	 */
	getServer(): ServerConfig {
		return this.get().server;
	}

	/**
	 * Get database configuration
	 */
	getDatabase(): DatabaseConfig {
		return this.get().database;
	}

	/**
	 * Get email configuration
	 */
	getEmail(): EmailConfig {
		return this.get().email;
	}

	/**
	 * Get Amazon configuration
	 */
	getAmazon(): AmazonConfig {
		return this.get().amazon;
	}

	/**
	 * Get analytics configuration
	 */
	getAnalytics(): AnalyticsConfig {
		return this.get().analytics;
	}

	/**
	 * Get AI configuration
	 */
	getAI(): AIConfig {
		return this.get().ai;
	}

	/**
	 * Get security configuration
	 */
	getSecurity(): SecurityConfig {
		return this.get().security;
	}

	/**
	 * Get feature flags
	 */
	getFeatures(): FeatureFlags {
		return this.get().features;
	}

	/**
	 * Check if a feature is enabled
	 */
	isFeatureEnabled(feature: keyof FeatureFlags): boolean {
		return this.getFeatures()[feature] === true;
	}

	/**
	 * Get environment
	 */
	getEnvironment(): "development" | "staging" | "production" | "test" {
		return this.getServer().NODE_ENV;
	}

	/**
	 * Check if in production
	 */
	isProduction(): boolean {
		return this.getEnvironment() === "production";
	}

	/**
	 * Check if in development
	 */
	isDevelopment(): boolean {
		return this.getEnvironment() === "development";
	}

	/**
	 * Validate partial configuration
	 */
	validatePartial<T>(schema: z.ZodSchema<T>, data: unknown): T {
		const result = schema.safeParse(data);
		if (!result.success) {
			throw new ConfigurationError(result.error);
		}
		return result.data;
	}

	// Private parsing methods
	private parseServerConfig(): ServerConfig {
		return ServerConfigSchema.parse(process.env);
	}

	private parseDatabaseConfig(): DatabaseConfig {
		return DatabaseConfigSchema.parse(process.env);
	}

	private parseEmailConfig(): EmailConfig {
		return EmailConfigSchema.parse(process.env);
	}

	private parseAmazonConfig(): AmazonConfig {
		return AmazonConfigSchema.parse(process.env);
	}

	private parseAnalyticsConfig(): AnalyticsConfig {
		return AnalyticsConfigSchema.parse(process.env);
	}

	private parseAIConfig(): AIConfig {
		return AIConfigSchema.parse(process.env);
	}

	private parseSecurityConfig(): SecurityConfig {
		return SecurityConfigSchema.parse(process.env);
	}

	private parseFeatureFlags(): FeatureFlags {
		return FeatureFlagsSchema.parse(process.env);
	}

	/**
	 * Reset configuration (useful for testing)
	 */
	reset(): void {
		this.config = null;
		this.isValidated = false;
	}

	/**
	 * Get redacted configuration (for logging)
	 */
	getRedacted(): any {
		const config = this.get();
		const redactedConfig = JSON.parse(JSON.stringify(config));

		// Redact sensitive fields
		const sensitiveFields = [
			"database.SUPABASE_SERVICE_ROLE_KEY",
			"database.SUPABASE_JWT_SECRET",
			"database.NEO4J_PASSWORD",
			"email.RESEND_API_KEY",
			"amazon.AMAZON_SP_CLIENT_SECRET",
			"amazon.AMAZON_SP_REFRESH_TOKEN",
			"amazon.AMAZON_ADS_CLIENT_SECRET",
			"amazon.AMAZON_ADS_ACCESS_TOKEN",
			"amazon.AMAZON_ASSOCIATES_SECRET_KEY",
			"ai.OPENAI_API_KEY",
			"ai.ANTHROPIC_API_KEY",
			"ai.REPLICATE_API_TOKEN",
			"security.JWT_SECRET",
			"security.ENCRYPTION_KEY",
			"security.SESSION_SECRET",
			"security.CSRF_SECRET",
		];

		sensitiveFields.forEach((path) => {
			const parts = path.split(".");
			let obj = redactedConfig;
			for (let i = 0; i < parts.length - 1; i++) {
				if (obj[parts[i]]) {
					obj = obj[parts[i]];
				}
			}
			const lastPart = parts[parts.length - 1];
			if (obj[lastPart]) {
				obj[lastPart] = "[REDACTED]";
			}
		});

		return redactedConfig;
	}

	/**
	 * Cleanup resources - call on app shutdown
	 */
	cleanup(): void {
		this.config = null;
		this.isValidated = false;
	}

	/**
	 * Reset singleton instance (useful for testing)
	 */
	static resetInstance(): void {
		ConfigManager.instance = undefined as any;
	}
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();

// Export convenience functions
export const getConfig = () => configManager.get();
export const getServerConfig = () => configManager.getServer();
export const getDatabaseConfig = () => configManager.getDatabase();
export const getEmailConfig = () => configManager.getEmail();
export const getAmazonConfig = () => configManager.getAmazon();
export const getAnalyticsConfig = () => configManager.getAnalytics();
export const getAIConfig = () => configManager.getAI();
export const getSecurityConfig = () => configManager.getSecurity();
export const getFeatureFlags = () => configManager.getFeatures();
export const isFeatureEnabled = (feature: keyof FeatureFlags) =>
	configManager.isFeatureEnabled(feature);
export const isProduction = () => configManager.isProduction();
export const isDevelopment = () => configManager.isDevelopment();
