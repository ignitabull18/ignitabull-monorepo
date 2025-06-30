/**
 * Configuration Schemas
 * Zod schemas for validating environment variables
 */

import { z } from "zod";

// Environment enum
export const EnvironmentSchema = z.enum([
	"development",
	"staging",
	"production",
	"test",
]);
export type Environment = z.infer<typeof EnvironmentSchema>;

// Server configuration schema
export const ServerConfigSchema = z.object({
	NODE_ENV: EnvironmentSchema.default("development"),
	PORT: z
		.string()
		.transform(Number)
		.pipe(z.number().min(1).max(65535))
		.default("3001"),
	CORS_ORIGIN: z.string().url().optional().default("http://localhost:3000"),
	RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"), // 15 minutes
	RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),
	API_KEY: z.string().optional(),
	LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

// Database configuration schema
export const DatabaseConfigSchema = z.object({
	// Supabase
	SUPABASE_URL: z.string().url(),
	SUPABASE_ANON_KEY: z.string(),
	SUPABASE_SERVICE_ROLE_KEY: z.string(),
	SUPABASE_JWT_SECRET: z.string().optional(),

	// Neo4j (optional)
	NEO4J_URI: z.string().optional().default("bolt://localhost:7687"),
	NEO4J_USERNAME: z.string().optional().default("neo4j"),
	NEO4J_PASSWORD: z.string().optional(),
	NEO4J_DATABASE: z.string().optional().default("neo4j"),
	NEO4J_MAX_POOL_SIZE: z.string().transform(Number).optional().default("50"),
	NEO4J_MAX_RETRY_TIME: z
		.string()
		.transform(Number)
		.optional()
		.default("30000"),
	NEO4J_CONNECTION_TIMEOUT: z
		.string()
		.transform(Number)
		.optional()
		.default("60000"),
	NEO4J_LOG_LEVEL: z
		.enum(["error", "warn", "info", "debug"])
		.optional()
		.default("info"),
	ENABLE_NEO4J: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("false"),
});

// Email configuration schema
export const EmailConfigSchema = z.object({
	RESEND_API_KEY: z.string(),
	EMAIL_FROM_ADDRESS: z.string().email().default("noreply@ignitabull.com"),
	EMAIL_FROM_NAME: z.string().default("Ignitabull"),
	EMAIL_REPLY_TO: z.string().email().optional(),
	EMAIL_PROVIDER: z.enum(["resend", "sendgrid", "ses"]).default("resend"),
	EMAIL_MAX_RETRIES: z.string().transform(Number).default("3"),
	EMAIL_TIMEOUT: z.string().transform(Number).default("30000"),
});

// Amazon API configuration schema
export const AmazonConfigSchema = z.object({
	// SP-API
	AMAZON_SP_CLIENT_ID: z.string().optional(),
	AMAZON_SP_CLIENT_SECRET: z.string().optional(),
	AMAZON_SP_REFRESH_TOKEN: z.string().optional(),
	AMAZON_SP_REGION: z.enum(["na", "eu", "fe"]).optional().default("na"),
	AMAZON_SP_SANDBOX: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("false"),

	// Advertising API
	AMAZON_ADS_CLIENT_ID: z.string().optional(),
	AMAZON_ADS_CLIENT_SECRET: z.string().optional(),
	AMAZON_ADS_ACCESS_TOKEN: z.string().optional(),
	AMAZON_ADS_PROFILE_ID: z.string().optional(),

	// Associates API
	AMAZON_ASSOCIATES_ACCESS_KEY: z.string().optional(),
	AMAZON_ASSOCIATES_SECRET_KEY: z.string().optional(),
	AMAZON_ASSOCIATES_PARTNER_TAG: z.string().optional(),
	AMAZON_ASSOCIATES_REGION: z.string().optional().default("us-east-1"),

	// Common
	AMAZON_MARKETPLACE_ID: z.string().optional().default("ATVPDKIKX0DER"), // US marketplace
	AMAZON_API_RATE_LIMIT: z.string().transform(Number).optional().default("10"),
	AMAZON_API_CACHE_TTL: z.string().transform(Number).optional().default("300"), // 5 minutes
});

// Analytics configuration schema
export const AnalyticsConfigSchema = z.object({
	// Plausible
	NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
	PLAUSIBLE_API_KEY: z.string().optional(),

	// PostHog
	NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
	NEXT_PUBLIC_POSTHOG_HOST: z
		.string()
		.url()
		.optional()
		.default("https://app.posthog.com"),

	// Google Analytics
	NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
});

// AI/ML configuration schema
export const AIConfigSchema = z.object({
	OPENAI_API_KEY: z.string().optional(),
	OPENAI_ORG_ID: z.string().optional(),
	OPENAI_MODEL: z.string().optional().default("gpt-4-turbo-preview"),

	ANTHROPIC_API_KEY: z.string().optional(),
	ANTHROPIC_MODEL: z.string().optional().default("claude-3-opus-20240229"),

	REPLICATE_API_TOKEN: z.string().optional(),

	AI_MAX_TOKENS: z.string().transform(Number).optional().default("4000"),
	AI_TEMPERATURE: z.string().transform(Number).optional().default("0.7"),
	AI_TIMEOUT: z.string().transform(Number).optional().default("60000"),
});

// Security configuration schema
export const SecurityConfigSchema = z.object({
	JWT_SECRET: z.string().min(32),
	JWT_EXPIRES_IN: z.string().optional().default("7d"),

	ENCRYPTION_KEY: z.string().min(32).optional(),

	SESSION_SECRET: z.string().min(32).optional(),
	SESSION_MAX_AGE: z.string().transform(Number).optional().default("604800"), // 7 days

	CSRF_SECRET: z.string().min(32).optional(),

	ALLOWED_ORIGINS: z
		.string()
		.transform((val) => val.split(","))
		.optional(),
	ALLOWED_HOSTS: z
		.string()
		.transform((val) => val.split(","))
		.optional(),
});

// Feature flags schema
export const FeatureFlagsSchema = z.object({
	FEATURE_NEO4J: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("false"),
	FEATURE_AI_INSIGHTS: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("true"),
	FEATURE_VISITOR_TRACKING: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("true"),
	FEATURE_EMAIL_AUTOMATION: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("true"),
	FEATURE_INFLUENCER_CRM: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("true"),
	FEATURE_SEO_ANALYTICS: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("true"),
	FEATURE_AMAZON_APIS: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("true"),
	FEATURE_CAMPAIGN_MANAGER: z
		.string()
		.transform((val) => val === "true")
		.optional()
		.default("true"),
});

// Complete configuration schema
export const ConfigSchema = z.object({
	server: ServerConfigSchema,
	database: DatabaseConfigSchema,
	email: EmailConfigSchema,
	amazon: AmazonConfigSchema,
	analytics: AnalyticsConfigSchema,
	ai: AIConfigSchema,
	security: SecurityConfigSchema,
	features: FeatureFlagsSchema,
});

export type Config = z.infer<typeof ConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type EmailConfig = z.infer<typeof EmailConfigSchema>;
export type AmazonConfig = z.infer<typeof AmazonConfigSchema>;
export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>;
export type AIConfig = z.infer<typeof AIConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
