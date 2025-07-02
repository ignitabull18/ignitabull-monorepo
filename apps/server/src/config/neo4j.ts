/**
 * Neo4j Configuration
 * Configuration and connection management for Neo4j graph database
 */

import { Neo4jService } from "@ignitabull/core";
import type { Neo4jConnectionConfig } from "@ignitabull/core";

// Environment variables
const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || "neo4j";

if (!NEO4J_PASSWORD) {
	throw new Error("NEO4J_PASSWORD environment variable is required");
}

// Connection configuration
const neo4jConfig: Neo4jConnectionConfig = {
	uri: NEO4J_URI,
	username: NEO4J_USERNAME,
	password: NEO4J_PASSWORD,
	database: NEO4J_DATABASE,
	maxConnectionPoolSize: Number.parseInt(
		process.env.NEO4J_MAX_POOL_SIZE || "50",
	),
	maxTransactionRetryTime: Number.parseInt(
		process.env.NEO4J_MAX_RETRY_TIME || "30000",
	),
	connectionAcquisitionTimeout: Number.parseInt(
		process.env.NEO4J_CONNECTION_TIMEOUT || "60000",
	),
	disableLosslessIntegers: true,
	logging: {
		level:
			(process.env.NEO4J_LOG_LEVEL as "ERROR" | "WARN" | "INFO" | "DEBUG") ||
			"INFO",
		logger: (level: string, message: string) => {
			if (process.env.NODE_ENV !== "test") {
				console.log(`[Neo4j ${level}] ${message}`);
			}
		},
	},
};

// Global Neo4j service instance
let neo4jServiceInstance: Neo4jService | null = null;

export function getNeo4jService(): Neo4jService {
	if (!neo4jServiceInstance) {
		neo4jServiceInstance = new Neo4jService(neo4jConfig);
	}
	return neo4jServiceInstance;
}

export async function initializeNeo4j(): Promise<Neo4jService> {
	const service = getNeo4jService();
	await service.initialize();
	return service;
}

export async function closeNeo4j(): Promise<void> {
	if (neo4jServiceInstance) {
		await neo4jServiceInstance.close();
		neo4jServiceInstance = null;
	}
}

// Health check function
export async function checkNeo4jHealth(): Promise<{
	status: string;
	latency: number;
	nodes: number;
	relationships: number;
	error?: string;
}> {
	try {
		const service = getNeo4jService();

		// Ensure service is initialized
		if (!service) {
			throw new Error("Neo4j service not available");
		}

		// Try to initialize if not already done
		try {
			await service.initialize();
		} catch (initError) {
			// If initialization fails, return error status
			return {
				status: "unhealthy",
				latency: 0,
				nodes: 0,
				relationships: 0,
				error: `Initialization failed: ${initError.message}`,
			};
		}

		const healthResult = await service.healthCheck();
		return healthResult;
	} catch (error) {
		console.error("Neo4j health check failed:", error);
		return {
			status: "unhealthy",
			latency: 0,
			nodes: 0,
			relationships: 0,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

// Configuration validation
export function validateNeo4jConfig(): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!NEO4J_URI) {
		errors.push("NEO4J_URI environment variable is required");
	}

	if (!NEO4J_USERNAME) {
		errors.push("NEO4J_USERNAME environment variable is required");
	}

	if (!NEO4J_PASSWORD) {
		errors.push("NEO4J_PASSWORD environment variable is required");
	}

	// Validate URI format
	if (NEO4J_URI && !NEO4J_URI.match(/^(bolt|neo4j)(\+s)?:\/\/.+/)) {
		errors.push(
			"NEO4J_URI must be a valid Neo4j connection URI (bolt:// or neo4j://)",
		);
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

// Connection retry logic
export async function connectWithRetry(
	maxRetries = 3,
	delayMs = 5000,
): Promise<Neo4jService> {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			console.log(`🔄 Neo4j connection attempt ${attempt}/${maxRetries}`);
			const service = await initializeNeo4j();
			console.log("✅ Neo4j connected successfully");
			return service;
		} catch (error) {
			lastError = error as Error;
			console.error(
				`❌ Neo4j connection attempt ${attempt} failed:`,
				error.message,
			);

			if (attempt < maxRetries) {
				console.log(`⏳ Retrying in ${delayMs}ms...`);
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}
	}

	throw new Error(
		`Failed to connect to Neo4j after ${maxRetries} attempts. Last error: ${lastError?.message}`,
	);
}

// Export configuration for external use
export { neo4jConfig };

// Utility functions for common operations
export class Neo4jUtils {
	static async seedInitialData(service: Neo4jService): Promise<void> {
		console.log("🌱 Seeding initial Neo4j data...");

		try {
			// Create sample categories
			await service.runQuery(`
        MERGE (cat1:Category {categoryId: 'electronics', name: 'Electronics', level: 1})
        MERGE (cat2:Category {categoryId: 'home_kitchen', name: 'Home & Kitchen', level: 1})
        MERGE (cat3:Category {categoryId: 'sports', name: 'Sports & Outdoors', level: 1})
        MERGE (cat4:Category {categoryId: 'beauty', name: 'Beauty & Personal Care', level: 1})
      `);

			// Create sample keywords
			await service.runQuery(`
        MERGE (k1:Keyword {keyword: 'wireless headphones', searchVolume: 50000, difficulty: 65, intent: 'commercial'})
        MERGE (k2:Keyword {keyword: 'coffee maker', searchVolume: 30000, difficulty: 45, intent: 'commercial'})
        MERGE (k3:Keyword {keyword: 'yoga mat', searchVolume: 25000, difficulty: 40, intent: 'commercial'})
        MERGE (k4:Keyword {keyword: 'skincare routine', searchVolume: 40000, difficulty: 55, intent: 'informational'})
      `);

			console.log("✅ Initial Neo4j data seeded");
		} catch (error) {
			console.error("❌ Failed to seed initial data:", error);
			throw error;
		}
	}

	static async clearAllData(service: Neo4jService): Promise<void> {
		console.log("🗑️ Clearing all Neo4j data...");

		try {
			await service.runQuery("MATCH (n) DETACH DELETE n");
			console.log("✅ All Neo4j data cleared");
		} catch (error) {
			console.error("❌ Failed to clear data:", error);
			throw error;
		}
	}

	static async getDataSummary(service: Neo4jService): Promise<{
		totalNodes: number;
		totalRelationships: number;
		nodesByLabel: Record<string, number>;
		relationshipsByType: Record<string, number>;
	}> {
		try {
			// Get total counts
			const totalResult = await service.runQuery(`
        MATCH (n)
        OPTIONAL MATCH ()-[r]-()
        RETURN count(DISTINCT n) as totalNodes, count(DISTINCT r) as totalRelationships
      `);

			// Get nodes by label
			const labelResult = await service.runQuery(`
        MATCH (n)
        UNWIND labels(n) as label
        RETURN label, count(*) as count
        ORDER BY count DESC
      `);

			// Get relationships by type
			const relationshipResult = await service.runQuery(`
        MATCH ()-[r]-()
        RETURN type(r) as relType, count(*) as count
        ORDER BY count DESC
      `);

			const totalRecord = totalResult.records[0];
			const nodesByLabel: Record<string, number> = {};
			const relationshipsByType: Record<string, number> = {};

			labelResult.records.forEach((record) => {
				nodesByLabel[record.get("label")] = record.get("count").toNumber();
			});

			relationshipResult.records.forEach((record) => {
				relationshipsByType[record.get("relType")] = record
					.get("count")
					.toNumber();
			});

			return {
				totalNodes: totalRecord.get("totalNodes").toNumber(),
				totalRelationships: totalRecord.get("totalRelationships").toNumber(),
				nodesByLabel,
				relationshipsByType,
			};
		} catch (error) {
			console.error("Failed to get data summary:", error);
			throw error;
		}
	}
}
