/**
 * Configuration Package Exports
 * Centralized configuration management for Ignitabull
 */

// Export configuration manager and utilities
export {
	ConfigManager,
	ConfigurationError,
	configManager,
	getAIConfig,
	getAmazonConfig,
	getAnalyticsConfig,
	getConfig,
	getDatabaseConfig,
	getEmailConfig,
	getFeatureFlags,
	getSecurityConfig,
	getServerConfig,
	isDevelopment,
	isFeatureEnabled,
	isProduction,
} from "./config";
// Re-export commonly used types
export type {
	AIConfig,
	AmazonConfig,
	AnalyticsConfig,
	Config,
	DatabaseConfig,
	EmailConfig,
	Environment,
	FeatureFlags,
	SecurityConfig,
	ServerConfig,
} from "./schemas";
// Export schemas and types
export * from "./schemas";
// Export environment helpers
export { loadEnv, validateEnv } from "./utils";
