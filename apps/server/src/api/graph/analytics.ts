/**
 * Graph Analytics API
 * RESTful endpoints for Neo4j graph database operations and analytics
 */

import type { Request, Response } from "express";
import {
	checkNeo4jHealth,
	getNeo4jService,
	Neo4jUtils,
} from "../../config/neo4j";

// Health and Status Endpoints

export async function getGraphHealth(_req: Request, res: Response) {
	try {
		const health = await checkNeo4jHealth();

		const statusCode = health.status === "healthy" ? 200 : 503;

		res.status(statusCode).json({
			success: health.status === "healthy",
			data: health,
		});
	} catch (error) {
		console.error("Graph health check API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to check graph database health",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function getGraphSummary(_req: Request, res: Response) {
	try {
		const service = getNeo4jService();
		await service.initialize();

		const summary = await Neo4jUtils.getDataSummary(service);

		res.json({
			success: true,
			data: summary,
		});
	} catch (error) {
		console.error("Graph summary API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get graph summary",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Product Management Endpoints

export async function createProduct(req: Request, res: Response) {
	try {
		const { asin, title, category, brand, price, rating, salesRank } = req.body;

		if (!asin || !title || !category) {
			return res.status(400).json({
				success: false,
				error: "ASIN, title, and category are required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const product = await service.createProduct({
			asin,
			title,
			category,
			brand,
			price,
			rating,
			salesRank,
		});

		res.status(201).json({
			success: true,
			data: product,
		});
	} catch (error) {
		console.error("Create product API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create product",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function getProduct(req: Request, res: Response) {
	try {
		const { asin } = req.params;

		if (!asin) {
			return res.status(400).json({
				success: false,
				error: "ASIN is required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const product = await service.getProduct(asin);

		if (!product) {
			return res.status(404).json({
				success: false,
				error: "Product not found",
			});
		}

		res.json({
			success: true,
			data: product,
		});
	} catch (error) {
		console.error("Get product API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get product",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function updateProduct(req: Request, res: Response) {
	try {
		const { asin } = req.params;
		const updates = req.body;

		if (!asin) {
			return res.status(400).json({
				success: false,
				error: "ASIN is required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const product = await service.updateProduct(asin, updates);

		if (!product) {
			return res.status(404).json({
				success: false,
				error: "Product not found",
			});
		}

		res.json({
			success: true,
			data: product,
		});
	} catch (error) {
		console.error("Update product API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to update product",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Customer Management Endpoints

export async function createCustomer(req: Request, res: Response) {
	try {
		const {
			customerId,
			segment,
			location,
			totalOrders,
			totalSpent,
			avgOrderValue,
		} = req.body;

		if (!customerId) {
			return res.status(400).json({
				success: false,
				error: "Customer ID is required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const customer = await service.createCustomer({
			customerId,
			segment,
			location,
			totalOrders,
			totalSpent,
			avgOrderValue,
		});

		res.status(201).json({
			success: true,
			data: customer,
		});
	} catch (error) {
		console.error("Create customer API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create customer",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function recordPurchase(req: Request, res: Response) {
	try {
		const { customerId, asin, orderId, quantity, price, rating, review } =
			req.body;

		if (!customerId || !asin || !orderId || !quantity || !price) {
			return res.status(400).json({
				success: false,
				error: "Customer ID, ASIN, order ID, quantity, and price are required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		await service.recordPurchase(customerId, asin, {
			orderId,
			quantity,
			price,
			rating,
			review,
		});

		res.status(201).json({
			success: true,
			message: "Purchase recorded successfully",
		});
	} catch (error) {
		console.error("Record purchase API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to record purchase",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function getCustomerInsights(req: Request, res: Response) {
	try {
		const { customerId } = req.params;

		if (!customerId) {
			return res.status(400).json({
				success: false,
				error: "Customer ID is required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const insights = await service.getCustomerInsights(customerId);

		if (!insights) {
			return res.status(404).json({
				success: false,
				error: "Customer not found",
			});
		}

		res.json({
			success: true,
			data: insights,
		});
	} catch (error) {
		console.error("Get customer insights API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get customer insights",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Keyword and SEO Endpoints

export async function createKeyword(req: Request, res: Response) {
	try {
		const { keyword, searchVolume, difficulty, cpc, intent } = req.body;

		if (!keyword || !intent) {
			return res.status(400).json({
				success: false,
				error: "Keyword and intent are required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const keywordNode = await service.createKeyword({
			keyword,
			searchVolume,
			difficulty,
			cpc,
			intent,
		});

		res.status(201).json({
			success: true,
			data: keywordNode,
		});
	} catch (error) {
		console.error("Create keyword API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create keyword",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function linkProductToKeyword(req: Request, res: Response) {
	try {
		const { asin, keyword, position, searchVolume } = req.body;

		if (!asin || !keyword || position === undefined) {
			return res.status(400).json({
				success: false,
				error: "ASIN, keyword, and position are required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		await service.linkProductToKeyword(asin, keyword, position, searchVolume);

		res.status(201).json({
			success: true,
			message: "Product linked to keyword successfully",
		});
	} catch (error) {
		console.error("Link product to keyword API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to link product to keyword",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Competitor Analysis Endpoints

export async function createCompetitor(req: Request, res: Response) {
	try {
		const {
			asin,
			brand,
			title,
			category,
			price,
			rating,
			salesRank,
			marketShare,
		} = req.body;

		if (!asin || !brand || !title || !category) {
			return res.status(400).json({
				success: false,
				error: "ASIN, brand, title, and category are required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const competitor = await service.createCompetitor({
			asin,
			brand,
			title,
			category,
			price,
			rating,
			salesRank,
			marketShare,
		});

		res.status(201).json({
			success: true,
			data: competitor,
		});
	} catch (error) {
		console.error("Create competitor API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create competitor",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function linkCompetitors(req: Request, res: Response) {
	try {
		const { asin1, asin2, competitionScore, priceRatio, marketShareDiff } =
			req.body;

		if (!asin1 || !asin2 || competitionScore === undefined) {
			return res.status(400).json({
				success: false,
				error: "Both ASINs and competition score are required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		await service.linkCompetitors(asin1, asin2, {
			competitionScore,
			priceRatio,
			marketShareDiff,
		});

		res.status(201).json({
			success: true,
			message: "Competitors linked successfully",
		});
	} catch (error) {
		console.error("Link competitors API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to link competitors",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function getCompetitiveAnalysis(req: Request, res: Response) {
	try {
		const { asin } = req.params;

		if (!asin) {
			return res.status(400).json({
				success: false,
				error: "ASIN is required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const analysis = await service.getCompetitiveAnalysis(asin);

		res.json({
			success: true,
			data: analysis,
		});
	} catch (error) {
		console.error("Get competitive analysis API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get competitive analysis",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Recommendation Endpoints

export async function getProductRecommendations(req: Request, res: Response) {
	try {
		const { asin } = req.params;
		const limit = Number.parseInt(req.query.limit as string) || 10;

		if (!asin) {
			return res.status(400).json({
				success: false,
				error: "ASIN is required",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const recommendations = await service.getProductRecommendations(
			asin,
			limit,
		);

		res.json({
			success: true,
			data: recommendations,
		});
	} catch (error) {
		console.error("Get product recommendations API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get product recommendations",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Network Analysis Endpoints

export async function performNetworkAnalysis(req: Request, res: Response) {
	try {
		const nodeType = (req.query.nodeType as string) || "Product";
		const limit = Number.parseInt(req.query.limit as string) || 1000;

		const service = getNeo4jService();
		await service.initialize();

		const analysis = await service.performNetworkAnalysis(nodeType, limit);

		res.json({
			success: true,
			data: analysis,
		});
	} catch (error) {
		console.error("Network analysis API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to perform network analysis",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Custom Query Endpoint

export async function runCustomQuery(req: Request, res: Response) {
	try {
		const { query, parameters } = req.body;

		if (!query) {
			return res.status(400).json({
				success: false,
				error: "Query is required",
			});
		}

		// Security check - only allow read queries for this endpoint
		const queryLower = query.toLowerCase().trim();
		const writeOperations = [
			"create",
			"merge",
			"set",
			"delete",
			"remove",
			"drop",
		];

		if (writeOperations.some((op) => queryLower.includes(op))) {
			return res.status(403).json({
				success: false,
				error: "Write operations are not allowed through this endpoint",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		const result = await service.runQuery(query, parameters || {});

		// Transform result to JSON-serializable format
		const records = result.records.map((record) => {
			const data: any = {};
			record.keys.forEach((key, _index) => {
				const value = record.get(key);

				// Handle Neo4j-specific types
				if (value && typeof value === "object") {
					if (value.constructor.name === "Node") {
						data[key] = {
							identity: value.identity.toString(),
							labels: value.labels,
							properties: value.properties,
						};
					} else if (value.constructor.name === "Relationship") {
						data[key] = {
							identity: value.identity.toString(),
							type: value.type,
							start: value.start.toString(),
							end: value.end.toString(),
							properties: value.properties,
						};
					} else if (value.constructor.name === "Path") {
						data[key] = {
							start: {
								identity: value.start.identity.toString(),
								labels: value.start.labels,
								properties: value.start.properties,
							},
							end: {
								identity: value.end.identity.toString(),
								labels: value.end.labels,
								properties: value.end.properties,
							},
							length: value.length,
						};
					} else {
						data[key] = value;
					}
				} else {
					data[key] = value;
				}
			});
			return data;
		});

		res.json({
			success: true,
			data: {
				records,
				summary: {
					resultAvailableAfter: result.summary.resultAvailableAfter,
					resultConsumedAfter: result.summary.resultConsumedAfter,
					queryType: result.summary.queryType,
				},
			},
		});
	} catch (error) {
		console.error("Custom query API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to execute query",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Data Management Endpoints

export async function seedInitialData(_req: Request, res: Response) {
	try {
		const service = getNeo4jService();
		await service.initialize();

		await Neo4jUtils.seedInitialData(service);

		res.json({
			success: true,
			message: "Initial data seeded successfully",
		});
	} catch (error) {
		console.error("Seed initial data API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to seed initial data",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export async function clearAllData(_req: Request, res: Response) {
	try {
		// Security check - only allow in development/test environments
		if (process.env.NODE_ENV === "production") {
			return res.status(403).json({
				success: false,
				error: "Data clearing is not allowed in production",
			});
		}

		const service = getNeo4jService();
		await service.initialize();

		await Neo4jUtils.clearAllData(service);

		res.json({
			success: true,
			message: "All data cleared successfully",
		});
	} catch (error) {
		console.error("Clear data API error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to clear data",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
