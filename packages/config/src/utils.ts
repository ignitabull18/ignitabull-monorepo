/**
 * Configuration Utilities
 * Helper functions for configuration management
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { config as dotenvConfig } from "dotenv";

/**
 * Load environment variables from .env files
 * Supports multiple environments and file hierarchy
 */
export function loadEnv(options?: {
	envDir?: string;
	override?: boolean;
}): void {
	const { envDir = process.cwd(), override = false } = options || {};
	const nodeEnv = process.env.NODE_ENV || "development";

	// Load files in order of priority (least to most specific)
	const envFiles = [
		".env", // Default
		".env.local", // Local overrides (not committed)
		`.env.${nodeEnv}`, // Environment specific
		`.env.${nodeEnv}.local`, // Environment specific local overrides
	];

	envFiles.forEach((file) => {
		const filePath = path.join(envDir, file);
		if (fs.existsSync(filePath)) {
			dotenvConfig({ path: filePath, override });
		}
	});
}

/**
 * Validate that required environment variables are set
 */
export function validateEnv(required: string[]): void {
	const missing: string[] = [];

	required.forEach((key) => {
		if (!process.env[key]) {
			missing.push(key);
		}
	});

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables:\n${missing.map((key) => `  - ${key}`).join("\n")}`,
		);
	}
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
	const value = process.env[key];
	if (value === undefined && fallback === undefined) {
		throw new Error(`Environment variable ${key} is not defined`);
	}
	return value || fallback!;
}

/**
 * Get boolean environment variable
 */
export function getBoolEnv(key: string, fallback = false): boolean {
	const value = process.env[key];
	if (value === undefined) return fallback;
	return value === "true" || value === "1";
}

/**
 * Get number environment variable
 */
export function getNumberEnv(key: string, fallback?: number): number {
	const value = process.env[key];
	if (value === undefined) {
		if (fallback === undefined) {
			throw new Error(`Environment variable ${key} is not defined`);
		}
		return fallback;
	}
	const num = Number(value);
	if (Number.isNaN(num)) {
		throw new Error(
			`Environment variable ${key} is not a valid number: ${value}`,
		);
	}
	return num;
}

/**
 * Get array environment variable (comma-separated)
 */
export function getArrayEnv(key: string, fallback: string[] = []): string[] {
	const value = process.env[key];
	if (!value) return fallback;
	return value
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * Get JSON environment variable
 */
export function getJsonEnv<T = any>(key: string, fallback?: T): T {
	const value = process.env[key];
	if (!value) {
		if (fallback === undefined) {
			throw new Error(`Environment variable ${key} is not defined`);
		}
		return fallback;
	}
	try {
		return JSON.parse(value);
	} catch (_error) {
		throw new Error(`Environment variable ${key} is not valid JSON: ${value}`);
	}
}

/**
 * Create environment variable template
 */
export function generateEnvTemplate(schema: Record<string, any>): string {
	const lines: string[] = [
		"# Ignitabull Environment Variables",
		"# Generated template - copy to .env and fill in values",
		"",
	];

	const processSchema = (obj: any, prefix = "") => {
		Object.entries(obj).forEach(([key, value]) => {
			if (typeof value === "object" && !Array.isArray(value)) {
				lines.push(
					`\n# ${key.charAt(0).toUpperCase() + key.slice(1)} Configuration`,
				);
				processSchema(value, prefix);
			} else if (key.endsWith("Schema")) {
				// Skip schema objects
				return;
			} else if (key !== "parse" && key !== "safeParse") {
				const envKey = key.toUpperCase();
				const defaultValue = typeof value === "string" ? value : "";
				const isRequired = !defaultValue;

				lines.push(`${isRequired ? "# Required" : "# Optional"}`);
				lines.push(`${envKey}=${defaultValue}`);
			}
		});
	};

	processSchema(schema);

	return lines.join("\n");
}

/**
 * Mask sensitive values for logging
 */
export function maskSensitive(value: string, showChars = 4): string {
	if (!value || value.length <= showChars * 2) {
		return "[REDACTED]";
	}
	const start = value.substring(0, showChars);
	const end = value.substring(value.length - showChars);
	return `${start}...${end}`;
}

/**
 * Deep freeze configuration object
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
	Object.freeze(obj);

	Object.getOwnPropertyNames(obj).forEach((prop) => {
		if (
			obj[prop as keyof T] !== null &&
			(typeof obj[prop as keyof T] === "object" ||
				typeof obj[prop as keyof T] === "function") &&
			!Object.isFrozen(obj[prop as keyof T])
		) {
			deepFreeze(obj[prop as keyof T] as any);
		}
	});

	return obj;
}

/**
 * Merge configurations with priority
 */
export function mergeConfigs<T extends object>(...configs: Partial<T>[]): T {
	return configs.reduce((merged, config) => {
		return { ...merged, ...config };
	}, {}) as T;
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
	return !!(
		process.env.CI ||
		process.env.CONTINUOUS_INTEGRATION ||
		process.env.GITHUB_ACTIONS ||
		process.env.GITLAB_CI ||
		process.env.CIRCLECI ||
		process.env.TRAVIS
	);
}

/**
 * Check if running in container
 */
export function isContainer(): boolean {
	return !!(
		process.env.KUBERNETES_SERVICE_HOST ||
		process.env.DOCKER_CONTAINER ||
		fs.existsSync("/.dockerenv")
	);
}
