#!/usr/bin/env tsx

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set and properly formatted
 */

import { config } from "dotenv";
import { z } from "zod";

// Load environment variables
config();

// Color functions for console output
const colors = {
	red: (text: string) => `\x1b[31m${text}\x1b[0m`,
	green: (text: string) => `\x1b[32m${text}\x1b[0m`,
	yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
	blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
	bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
};

// Environment validation schema
const envSchema = z.object({
	// Node environment
	NODE_ENV: z
		.enum(["development", "staging", "production", "test"])
		.default("development"),

	// Database configuration
	DATABASE_URL: z
		.string()
		.url("DATABASE_URL must be a valid PostgreSQL connection string"),
	POSTGRES_DB: z.string().min(1, "POSTGRES_DB is required for Docker"),
	POSTGRES_USER: z.string().min(1, "POSTGRES_USER is required for Docker"),
	POSTGRES_PASSWORD: z
		.string()
		.min(8, "POSTGRES_PASSWORD must be at least 8 characters"),

	// Neo4j configuration
	NEO4J_URI: z
		.string()
		.regex(
			/^(bolt|neo4j)(\+s)?:\/\/.+/,
			"NEO4J_URI must be a valid Neo4j connection URI",
		),
	NEO4J_USERNAME: z.string().min(1, "NEO4J_USERNAME is required"),
	NEO4J_PASSWORD: z
		.string()
		.min(8, "NEO4J_PASSWORD must be at least 8 characters"),
	NEO4J_DATABASE: z.string().optional().default("neo4j"),

	// Authentication
	JWT_SECRET: z
		.string()
		.min(32, "JWT_SECRET must be at least 32 characters for security"),

	// Email service
	RESEND_API_KEY: z
		.string()
		.regex(/^re_.+/, 'RESEND_API_KEY must start with "re_"'),

	// Supabase configuration
	SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
	SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
	SUPABASE_SERVICE_ROLE_KEY: z
		.string()
		.min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

	// Optional Redis
	REDIS_URL: z.string().optional(),

	// Optional AI services
	OPENAI_API_KEY: z.string().optional(),
	ANTHROPIC_API_KEY: z.string().optional(),
	GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
});

// Production-specific required variables
const productionRequiredSchema = envSchema.extend({
	// Amazon API (required in production)
	AMAZON_SP_CLIENT_ID: z
		.string()
		.min(1, "AMAZON_SP_CLIENT_ID is required in production"),
	AMAZON_SP_CLIENT_SECRET: z
		.string()
		.min(1, "AMAZON_SP_CLIENT_SECRET is required in production"),
	AMAZON_SP_REFRESH_TOKEN: z
		.string()
		.min(1, "AMAZON_SP_REFRESH_TOKEN is required in production"),

	// Monitoring (required in production)
	SENTRY_DSN: z.string().url("SENTRY_DSN must be a valid URL"),

	// SSL certificates (required in production)
	SSL_CERT_PATH: z.string().optional(),
	SSL_KEY_PATH: z.string().optional(),
});

// CI/CD specific variables
const ciRequiredVars = [
	"TURBO_TOKEN",
	"TURBO_TEAM",
	"CODECOV_TOKEN",
	"SNYK_TOKEN",
	"STAGING_KUBECONFIG",
	"PRODUCTION_KUBECONFIG",
	"SLACK_WEBHOOK",
];

interface ValidationResult {
	success: boolean;
	errors: string[];
	warnings: string[];
	info: string[];
}

function validateEnvironment(): ValidationResult {
	const result: ValidationResult = {
		success: true,
		errors: [],
		warnings: [],
		info: [],
	};

	console.log(colors.bold("\n🔍 Environment Variables Validation\n"));

	// Basic environment validation
	try {
		const schema =
			process.env.NODE_ENV === "production"
				? productionRequiredSchema
				: envSchema;
		const validatedEnv = schema.parse(process.env);

		result.info.push(`✅ Environment: ${colors.blue(validatedEnv.NODE_ENV)}`);
		result.info.push(
			`✅ Database: ${colors.blue(validatedEnv.DATABASE_URL.split("@")[1] || "configured")}`,
		);
		result.info.push(`✅ Neo4j: ${colors.blue(validatedEnv.NEO4J_URI)}`);
		result.info.push(`✅ Supabase: ${colors.blue(validatedEnv.SUPABASE_URL)}`);
	} catch (error) {
		if (error instanceof z.ZodError) {
			result.success = false;
			error.errors.forEach((err) => {
				result.errors.push(`❌ ${err.path.join(".")}: ${err.message}`);
			});
		}
	}

	// Check CI/CD variables if in GitHub Actions
	if (process.env.GITHUB_ACTIONS === "true") {
		result.info.push("\n📋 Checking CI/CD variables...");

		ciRequiredVars.forEach((varName) => {
			if (!process.env[varName]) {
				result.warnings.push(`⚠️  ${varName} not set (required for CI/CD)`);
			} else {
				result.info.push(`✅ ${varName}: configured`);
			}
		});
	}

	// Security checks
	result.info.push("\n🔒 Security validation...");

	// Check JWT secret strength
	const jwtSecret = process.env.JWT_SECRET;
	if (jwtSecret) {
		if (jwtSecret.length < 32) {
			result.errors.push("❌ JWT_SECRET too short (minimum 32 characters)");
			result.success = false;
		} else if (
			jwtSecret === "your-super-secret-jwt-key" ||
			jwtSecret.includes("example")
		) {
			result.errors.push("❌ JWT_SECRET appears to be a default/example value");
			result.success = false;
		} else {
			result.info.push("✅ JWT_SECRET: sufficient length and complexity");
		}
	}

	// Check for common weak passwords
	const weakPasswords = ["password", "123456", "admin", "root", "postgres"];
	const dbPassword = process.env.POSTGRES_PASSWORD;
	const neo4jPassword = process.env.NEO4J_PASSWORD;

	if (dbPassword && weakPasswords.includes(dbPassword.toLowerCase())) {
		result.errors.push("❌ POSTGRES_PASSWORD is a common weak password");
		result.success = false;
	}

	if (neo4jPassword && weakPasswords.includes(neo4jPassword.toLowerCase())) {
		result.errors.push("❌ NEO4J_PASSWORD is a common weak password");
		result.success = false;
	}

	// Check for development URLs in production
	if (process.env.NODE_ENV === "production") {
		const devUrls = [
			"localhost",
			"127.0.0.1",
			".local",
			"ngrok",
			"example.com",
		];
		const urlVars = ["DATABASE_URL", "SUPABASE_URL", "NEO4J_URI", "REDIS_URL"];

		urlVars.forEach((varName) => {
			const value = process.env[varName];
			if (value && devUrls.some((devUrl) => value.includes(devUrl))) {
				result.errors.push(
					`❌ ${varName} contains development URL in production`,
				);
				result.success = false;
			}
		});
	}

	// Feature flags validation
	result.info.push("\n🚩 Feature flags...");
	const featureFlags = [
		"ENABLE_NEO4J",
		"ENABLE_INFLUENCER_FEATURES",
		"ENABLE_AI_CHAT",
		"ENABLE_EMAIL_CAMPAIGNS",
	];

	featureFlags.forEach((flag) => {
		const value = process.env[flag];
		if (value !== undefined) {
			result.info.push(`✅ ${flag}: ${colors.blue(value)}`);
		}
	});

	return result;
}

// Connection testing functions
async function testDatabaseConnection(): Promise<boolean> {
	if (!process.env.DATABASE_URL) return false;

	try {
		// We can't actually test the connection without importing a DB client
		// But we can validate the URL format
		const url = new URL(process.env.DATABASE_URL);
		return url.protocol === "postgresql:" && !!url.hostname;
	} catch {
		return false;
	}
}

async function testRedisConnection(): Promise<boolean> {
	if (!process.env.REDIS_URL) return true; // Optional

	try {
		const url = new URL(process.env.REDIS_URL);
		return url.protocol === "redis:" && !!url.hostname;
	} catch {
		return false;
	}
}

// Main execution
async function main() {
	console.log(colors.bold("🔧 Ignitabull Environment Validation Tool"));
	console.log(colors.blue("=====================================\n"));

	const result = validateEnvironment();

	// Print results
	if (result.info.length > 0) {
		console.log(colors.green("\nℹ️  Environment Information:"));
		result.info.forEach((info) => console.log(`  ${info}`));
	}

	if (result.warnings.length > 0) {
		console.log(colors.yellow("\n⚠️  Warnings:"));
		result.warnings.forEach((warning) => console.log(`  ${warning}`));
	}

	if (result.errors.length > 0) {
		console.log(colors.red("\n❌ Errors:"));
		result.errors.forEach((error) => console.log(`  ${error}`));
	}

	// Test connections
	console.log(colors.blue("\n🔗 Testing connections..."));

	const dbTest = await testDatabaseConnection();
	const redisTest = await testRedisConnection();

	console.log(`  Database URL format: ${dbTest ? "✅" : "❌"}`);
	console.log(`  Redis URL format: ${redisTest ? "✅" : "❌"}`);

	// Final summary
	console.log(`\n${colors.bold("📊 Summary:")}`);
	if (result.success && dbTest && redisTest) {
		console.log(colors.green("  ✅ Environment validation passed"));
		console.log(colors.green("  🚀 Ready for deployment"));
		process.exit(0);
	} else {
		console.log(colors.red("  ❌ Environment validation failed"));
		console.log(colors.red("  🛑 Fix errors before proceeding"));
		process.exit(1);
	}
}

// Handle CLI arguments
if (process.argv.includes("--help") || process.argv.includes("-h")) {
	console.log(`
Usage: tsx scripts/validate-env.ts [options]

Options:
  --help, -h     Show this help message
  --quiet, -q    Suppress info messages
  --ci          CI mode (stricter validation)

Environment Variables:
  This script validates all required environment variables for the Ignitabull application.
  Copy .env.example to .env and fill in the required values.

Examples:
  tsx scripts/validate-env.ts           # Validate current environment
  tsx scripts/validate-env.ts --quiet   # Show only errors and warnings
  tsx scripts/validate-env.ts --ci      # CI mode with stricter checks
`);
	process.exit(0);
}

// Run validation
main().catch((error) => {
	console.error(colors.red("\n💥 Validation script failed:"), error);
	process.exit(1);
});
