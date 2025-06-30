#!/usr/bin/env bun

/**
 * Environment Variable Validation Script
 *
 * This script validates that all required environment variables are set
 * and have the correct format.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import * as dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
	dotenv.config({ path: envPath });
} else {
	console.log(
		chalk.yellow(
			"⚠️  No .env.local file found. Using system environment variables.",
		),
	);
}

// Define environment variable schema
const envSchema = z.object({
	// Required Database
	DATABASE_URL: z.string().url().startsWith("postgresql://"),
	DIRECT_URL: z.string().url().startsWith("postgresql://"),

	// Required Supabase
	NEXT_PUBLIC_SUPABASE_URL: z.string().url().includes(".supabase.co"),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

	// Required AI
	GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(20),

	// Optional but validated if present
	NEO4J_URI: z.string().startsWith("neo4j://").optional(),
	NEO4J_USER: z.string().optional(),
	NEO4J_PASSWORD: z.string().optional(),

	STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
	STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
	NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),

	SENDGRID_API_KEY: z.string().min(20).optional(),
	SENTRY_DSN: z.string().url().includes("sentry.io").optional(),

	JWT_SECRET: z.string().min(32).optional(),
	ENCRYPTION_KEY: z.string().length(32).optional(),
});

// Feature flag schema
const featureFlagSchema = z.object({
	ENABLE_NEO4J: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
	ENABLE_INFLUENCER_FEATURES: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
	ENABLE_AI_CHAT: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
	ENABLE_EMAIL_CAMPAIGNS: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
});

// Validate environment variables
console.log(chalk.blue("🔍 Validating environment variables...\n"));

let hasErrors = false;

// Check required variables
try {
	const env = envSchema.parse(process.env);
	console.log(chalk.green("✅ All required environment variables are set"));

	// Check optional integrations
	if (env.NEO4J_URI) {
		if (!env.NEO4J_USER || !env.NEO4J_PASSWORD) {
			console.log(
				chalk.yellow("⚠️  Neo4j URI is set but missing username or password"),
			);
		} else {
			console.log(chalk.green("✅ Neo4j configuration complete"));
		}
	}

	if (env.STRIPE_SECRET_KEY) {
		if (!env.STRIPE_WEBHOOK_SECRET || !env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
			console.log(
				chalk.yellow(
					"⚠️  Stripe secret key is set but missing webhook secret or publishable key",
				),
			);
		} else {
			console.log(chalk.green("✅ Stripe configuration complete"));
		}
	}
} catch (error) {
	hasErrors = true;
	if (error instanceof z.ZodError) {
		console.log(chalk.red("❌ Environment variable validation failed:\n"));
		error.errors.forEach((err) => {
			console.log(chalk.red(`   - ${err.path.join(".")}: ${err.message}`));
		});
	}
}

// Check feature flags
console.log(chalk.blue("\n🚩 Checking feature flags...\n"));
try {
	const flags = featureFlagSchema.parse(process.env);
	console.log(chalk.gray("Feature flags:"));
	console.log(
		chalk.gray(
			`   - Neo4j: ${flags.ENABLE_NEO4J ?? "not set (defaults to false)"}`,
		),
	);
	console.log(
		chalk.gray(
			`   - Influencer Features: ${flags.ENABLE_INFLUENCER_FEATURES ?? "not set (defaults to false)"}`,
		),
	);
	console.log(
		chalk.gray(
			`   - AI Chat: ${flags.ENABLE_AI_CHAT ?? "not set (defaults to true)"}`,
		),
	);
	console.log(
		chalk.gray(
			`   - Email Campaigns: ${flags.ENABLE_EMAIL_CAMPAIGNS ?? "not set (defaults to true)"}`,
		),
	);
} catch (_error) {
	console.log(chalk.yellow("⚠️  Invalid feature flag format"));
}

// Test database connection
console.log(chalk.blue("\n🔌 Testing database connection...\n"));
try {
	const { Client } = await import("pg");
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
	});

	await client.connect();
	await client.query("SELECT 1");
	await client.end();

	console.log(chalk.green("✅ Database connection successful"));
} catch (error) {
	hasErrors = true;
	console.log(chalk.red("❌ Database connection failed:"), error.message);
}

// Summary
console.log(chalk.blue("\n📊 Summary\n"));
if (hasErrors) {
	console.log(
		chalk.red("❌ Environment validation failed. Please fix the errors above."),
	);
	process.exit(1);
} else {
	console.log(chalk.green("✅ Environment is properly configured!"));
	console.log(chalk.gray("\nNext steps:"));
	console.log(chalk.gray("1. Run `bun dev` to start the development server"));
	console.log(
		chalk.gray("2. Run `bunx supabase start` to start local Supabase"),
	);
	console.log(
		chalk.gray("3. Run `bunx supabase db reset` to apply migrations"),
	);
}
