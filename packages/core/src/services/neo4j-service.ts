/**
 * Neo4j Service
 * Core service for Neo4j graph database operations and Amazon business intelligence
 */

import neo4j, {
	type Driver,
	type Node,
	type Result,
	type Session,
} from "neo4j-driver";
import type {
	CompetitiveAnalysis,
	CompetitorNode,
	CustomerInsight,
	CustomerNode,
	CypherQuery,
	GraphNode,
	KeywordNode,
	Neo4jConnectionConfig,
	NetworkAnalysis,
	ProductNode,
	ProductRecommendation,
} from "../types/neo4j";

export class Neo4jService {
	private driver: Driver | null = null;
	private isInitialized = false;
	private config: Neo4jConnectionConfig;

	constructor(config: Neo4jConnectionConfig) {
		this.config = config;
	}

	async initialize(): Promise<void> {
		if (this.isInitialized && this.driver) return;

		try {
			console.log("🔗 Initializing Neo4j connection");

			this.driver = neo4j.driver(
				this.config.uri,
				neo4j.auth.basic(this.config.username, this.config.password),
				{
					maxConnectionPoolSize: this.config.maxConnectionPoolSize || 50,
					maxTransactionRetryTime: this.config.maxTransactionRetryTime || 30000,
					connectionAcquisitionTimeout:
						this.config.connectionAcquisitionTimeout || 60000,
					disableLosslessIntegers: this.config.disableLosslessIntegers || true,
					logging: (this.config.logging || {
						level: "info",
						logger: (level: any, message: string) =>
							console.log(`[Neo4j ${level}] ${message}`),
					}) as any,
				},
			);

			// Verify connectivity
			await this.driver.verifyConnectivity();

			// Create indexes and constraints
			await this.createIndexesAndConstraints();

			this.isInitialized = true;
			console.log("✅ Neo4j connection established");
		} catch (error) {
			console.error("❌ Failed to initialize Neo4j connection:", error);
			throw error;
		}
	}

	async close(): Promise<void> {
		if (this.driver) {
			await this.driver.close();
			this.driver = null;
			this.isInitialized = false;
			console.log("🔌 Neo4j connection closed");
		}
	}

	private async createIndexesAndConstraints(): Promise<void> {
		const session = this.getSession();

		try {
			const constraints = [
				// Unique constraints
				"CREATE CONSTRAINT product_asin_unique IF NOT EXISTS FOR (p:Product) REQUIRE p.asin IS UNIQUE",
				"CREATE CONSTRAINT customer_id_unique IF NOT EXISTS FOR (c:Customer) REQUIRE c.customerId IS UNIQUE",
				"CREATE CONSTRAINT keyword_text_unique IF NOT EXISTS FOR (k:Keyword) REQUIRE k.keyword IS UNIQUE",
				"CREATE CONSTRAINT category_id_unique IF NOT EXISTS FOR (cat:Category) REQUIRE cat.categoryId IS UNIQUE",
				"CREATE CONSTRAINT influencer_id_unique IF NOT EXISTS FOR (i:Influencer) REQUIRE i.influencerId IS UNIQUE",
				"CREATE CONSTRAINT campaign_id_unique IF NOT EXISTS FOR (camp:Campaign) REQUIRE camp.campaignId IS UNIQUE",

				// Property existence constraints
				"CREATE CONSTRAINT product_asin_exists IF NOT EXISTS FOR (p:Product) REQUIRE p.asin IS NOT NULL",
				"CREATE CONSTRAINT customer_id_exists IF NOT EXISTS FOR (c:Customer) REQUIRE c.customerId IS NOT NULL",
				"CREATE CONSTRAINT keyword_text_exists IF NOT EXISTS FOR (k:Keyword) REQUIRE k.keyword IS NOT NULL",
			];

			const indexes = [
				// Performance indexes
				"CREATE INDEX product_category_idx IF NOT EXISTS FOR (p:Product) ON (p.category)",
				"CREATE INDEX product_brand_idx IF NOT EXISTS FOR (p:Product) ON (p.brand)",
				"CREATE INDEX product_price_idx IF NOT EXISTS FOR (p:Product) ON (p.price)",
				"CREATE INDEX product_rating_idx IF NOT EXISTS FOR (p:Product) ON (p.rating)",
				"CREATE INDEX product_sales_rank_idx IF NOT EXISTS FOR (p:Product) ON (p.salesRank)",
				"CREATE INDEX customer_segment_idx IF NOT EXISTS FOR (c:Customer) ON (c.segment)",
				"CREATE INDEX customer_location_idx IF NOT EXISTS FOR (c:Customer) ON (c.location)",
				"CREATE INDEX keyword_volume_idx IF NOT EXISTS FOR (k:Keyword) ON (k.searchVolume)",
				"CREATE INDEX keyword_intent_idx IF NOT EXISTS FOR (k:Keyword) ON (k.intent)",
				"CREATE INDEX influencer_platform_idx IF NOT EXISTS FOR (i:Influencer) ON (i.platform)",
				"CREATE INDEX influencer_tier_idx IF NOT EXISTS FOR (i:Influencer) ON (i.tier)",
				"CREATE INDEX campaign_status_idx IF NOT EXISTS FOR (camp:Campaign) ON (camp.status)",

				// Composite indexes
				"CREATE INDEX product_category_brand_idx IF NOT EXISTS FOR (p:Product) ON (p.category, p.brand)",
				"CREATE INDEX customer_segment_location_idx IF NOT EXISTS FOR (c:Customer) ON (c.segment, c.location)",

				// Full-text search indexes
				'CALL db.index.fulltext.createNodeIndex("productSearch", ["Product"], ["title", "brand"]) IF NOT EXISTS',
				'CALL db.index.fulltext.createNodeIndex("keywordSearch", ["Keyword"], ["keyword"]) IF NOT EXISTS',
			];

			// Execute constraints first
			for (const constraint of constraints) {
				try {
					await session.run(constraint);
				} catch (error) {
					// Ignore errors for existing constraints
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					if (!errorMessage.includes("already exists")) {
						console.warn(`Warning creating constraint: ${errorMessage}`);
					}
				}
			}

			// Then execute indexes
			for (const index of indexes) {
				try {
					await session.run(index);
				} catch (error) {
					// Ignore errors for existing indexes
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					if (
						!errorMessage.includes("already exists") &&
						!errorMessage.includes("An equivalent index already exists")
					) {
						console.warn(`Warning creating index: ${errorMessage}`);
					}
				}
			}

			console.log("✅ Neo4j indexes and constraints created");
		} finally {
			await session.close();
		}
	}

	private getSession(): Session {
		if (!this.driver) {
			throw new Error("Neo4j driver not initialized");
		}
		return this.driver.session({ database: this.config.database });
	}

	// Core Query Methods
	async runQuery(
		query: string,
		parameters: any = {},
	): Promise<Result> {
		const session = this.getSession();

		try {
			return await session.run(query, parameters);
		} finally {
			await session.close();
		}
	}

	async runCypherQuery(cypherQuery: CypherQuery): Promise<Result> {
		return this.runQuery(cypherQuery.query, cypherQuery.parameters as any);
	}

	// Product Management
	async createProduct(
		product: Omit<ProductNode["properties"], "createdAt" | "updatedAt">,
	): Promise<ProductNode> {
		const query = `
      CREATE (p:Product {
        asin: $asin,
        title: $title,
        category: $category,
        brand: $brand,
        price: $price,
        rating: $rating,
        salesRank: $salesRank,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN p
    `;

		const result = await this.runQuery(query, product);
		return this.nodeToProductNode(result.records[0].get("p"));
	}

	async getProduct(asin: string): Promise<ProductNode | null> {
		const query = `
      MATCH (p:Product {asin: $asin})
      RETURN p
    `;

		const result = await this.runQuery(query, { asin });

		if (result.records.length === 0) {
			return null;
		}

		return this.nodeToProductNode(result.records[0].get("p"));
	}

	async updateProduct(
		asin: string,
		updates: Partial<ProductNode["properties"]>,
	): Promise<ProductNode | null> {
		const setClause = Object.keys(updates)
			.map((key) => `p.${key} = $${key}`)
			.join(", ");

		const query = `
      MATCH (p:Product {asin: $asin})
      SET ${setClause}, p.updatedAt = datetime()
      RETURN p
    `;

		const result = await this.runQuery(query, { asin, ...updates });

		if (result.records.length === 0) {
			return null;
		}

		return this.nodeToProductNode(result.records[0].get("p"));
	}

	// Customer Management
	async createCustomer(
		customer: Omit<CustomerNode["properties"], "createdAt" | "updatedAt">,
	): Promise<CustomerNode> {
		const query = `
      CREATE (c:Customer {
        customerId: $customerId,
        segment: $segment,
        location: $location,
        totalOrders: $totalOrders,
        totalSpent: $totalSpent,
        avgOrderValue: $avgOrderValue,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN c
    `;

		const result = await this.runQuery(query, customer);
		return this.nodeToCustomerNode(result.records[0].get("c"));
	}

	async recordPurchase(
		customerId: string,
		asin: string,
		purchaseData: {
			orderId: string;
			quantity: number;
			price: number;
			rating?: number;
			review?: string;
		},
	): Promise<void> {
		const query = `
      MATCH (c:Customer {customerId: $customerId})
      MATCH (p:Product {asin: $asin})
      CREATE (c)-[r:PURCHASED {
        orderId: $orderId,
        quantity: $quantity,
        price: $price,
        date: datetime(),
        rating: $rating,
        review: $review
      }]->(p)
      RETURN r
    `;

		await this.runQuery(query, {
			customerId,
			asin,
			...purchaseData,
		});
	}

	// Keyword and SEO Management
	async createKeyword(
		keyword: Omit<KeywordNode["properties"], "createdAt" | "updatedAt">,
	): Promise<KeywordNode> {
		const query = `
      MERGE (k:Keyword {keyword: $keyword})
      ON CREATE SET 
        k.searchVolume = $searchVolume,
        k.difficulty = $difficulty,
        k.cpc = $cpc,
        k.intent = $intent,
        k.createdAt = datetime(),
        k.updatedAt = datetime()
      ON MATCH SET
        k.searchVolume = $searchVolume,
        k.difficulty = $difficulty,
        k.cpc = $cpc,
        k.intent = $intent,
        k.updatedAt = datetime()
      RETURN k
    `;

		const result = await this.runQuery(query, keyword);
		return this.nodeToKeywordNode(result.records[0].get("k"));
	}

	async linkProductToKeyword(
		asin: string,
		keyword: string,
		position: number,
		searchVolume?: number,
	): Promise<void> {
		const query = `
      MATCH (p:Product {asin: $asin})
      MATCH (k:Keyword {keyword: $keyword})
      MERGE (p)-[r:RANKS_FOR]->(k)
      SET r.position = $position,
          r.page = CASE WHEN $position <= 10 THEN 1 
                        WHEN $position <= 20 THEN 2 
                        ELSE 3 END,
          r.date = datetime(),
          r.searchVolume = $searchVolume
      RETURN r
    `;

		await this.runQuery(query, { asin, keyword, position, searchVolume });
	}

	// Competitor Analysis
	async createCompetitor(
		competitor: Omit<CompetitorNode["properties"], "createdAt" | "updatedAt">,
	): Promise<CompetitorNode> {
		const query = `
      CREATE (comp:Competitor {
        asin: $asin,
        brand: $brand,
        title: $title,
        category: $category,
        price: $price,
        rating: $rating,
        salesRank: $salesRank,
        marketShare: $marketShare,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN comp
    `;

		const result = await this.runQuery(query, competitor);
		return this.nodeToCompetitorNode(result.records[0].get("comp"));
	}

	async linkCompetitors(
		asin1: string,
		asin2: string,
		competitionData: {
			competitionScore: number;
			priceRatio: number;
			marketShareDiff: number;
		},
	): Promise<void> {
		const query = `
      MATCH (p1:Product {asin: $asin1})
      MATCH (p2:Product {asin: $asin2})
      MERGE (p1)-[r:COMPETES_WITH]->(p2)
      SET r.competitionScore = $competitionScore,
          r.priceRatio = $priceRatio,
          r.marketShareDiff = $marketShareDiff,
          r.date = datetime()
      RETURN r
    `;

		await this.runQuery(query, { asin1, asin2, ...competitionData });
	}

	// Advanced Analytics
	async getProductRecommendations(
		asin: string,
		limit = 10,
	): Promise<ProductRecommendation[]> {
		const query = `
      MATCH (p:Product {asin: $asin})
      MATCH (p)<-[:PURCHASED]-(c:Customer)-[:PURCHASED]->(rec:Product)
      WHERE rec.asin <> p.asin
      WITH rec, count(c) as sharedCustomers, 
           collect(DISTINCT c.segment) as customerSegments
      MATCH (rec)-[:RANKS_FOR]->(k:Keyword)
      WITH rec, sharedCustomers, customerSegments, collect(k) as keywords
      RETURN rec, sharedCustomers, customerSegments, keywords
      ORDER BY sharedCustomers DESC
      LIMIT $limit
    `;

		const result = await this.runQuery(query, { asin, limit });

		return result.records.map((record) => ({
			product: this.nodeToProductNode(record.get("rec")),
			score: record.get("sharedCustomers").toNumber(),
			reasons: [`${record.get("sharedCustomers")} shared customers`],
			relatedProducts: [],
			targetKeywords: record
				.get("keywords")
				.map((k: Node) => this.nodeToKeywordNode(k)),
		}));
	}

	async getCustomerInsights(
		customerId: string,
	): Promise<CustomerInsight | null> {
		const query = `
      MATCH (c:Customer {customerId: $customerId})
      OPTIONAL MATCH (c)-[p:PURCHASED]->(prod:Product)
      WITH c, collect(prod) as purchasedProducts, collect(p) as purchases
      OPTIONAL MATCH (c)-[:VIEWED]->(viewedProd:Product)
      WITH c, purchasedProducts, purchases, collect(viewedProd) as viewedProducts
      RETURN c, purchasedProducts, purchases, viewedProducts
    `;

		const result = await this.runQuery(query, { customerId });

		if (result.records.length === 0) {
			return null;
		}

		const record = result.records[0];
		const customer = this.nodeToCustomerNode(record.get("c"));
		const purchasedProducts = record
			.get("purchasedProducts")
			.map((p: Node) => this.nodeToProductNode(p));
		const purchases = record.get("purchases");

		// Analyze behavior patterns
		const behaviorPattern = this.analyzeBehaviorPattern(
			purchases,
			purchasedProducts,
		);
		const preferences = this.extractPreferences(purchasedProducts);

		return {
			customer,
			behaviorPattern,
			preferences,
			predictedActions: [], // Would implement ML predictions
			segmentRecommendations: [],
		};
	}

	async getCompetitiveAnalysis(asin: string): Promise<CompetitiveAnalysis[]> {
		const query = `
      MATCH (p:Product {asin: $asin})
      MATCH (p)-[r:COMPETES_WITH]->(comp:Product)
      OPTIONAL MATCH (p)<-[:PURCHASED]-(sharedCustomer:Customer)-[:PURCHASED]->(comp)
      WITH comp, r, collect(DISTINCT sharedCustomer) as sharedCustomers
      RETURN comp, r, sharedCustomers
      ORDER BY r.competitionScore DESC
    `;

		const result = await this.runQuery(query, { asin });

		return result.records.map((record) => {
			const competitor = this.nodeToCompetitorNode(record.get("comp"));
			const relationship = record.get("r");
			const sharedCustomers = record
				.get("sharedCustomers")
				.map((c: Node) => this.nodeToCustomerNode(c));

			return {
				competitor,
				competitionLevel: this.getCompetitionLevel(
					relationship.properties.competitionScore,
				),
				advantages: this.calculateAdvantages(relationship),
				disadvantages: this.calculateDisadvantages(relationship),
				opportunities: [],
				threats: [],
				sharedCustomers,
				marketOverlap: sharedCustomers.length,
			};
		});
	}

	async performNetworkAnalysis(
		nodeType = "Product",
		limit = 1000,
	): Promise<NetworkAnalysis> {
		const query = `
      MATCH (n:${nodeType})
      OPTIONAL MATCH (n)-[r]-(connected)
      WITH n, count(r) as degree
      ORDER BY degree DESC
      LIMIT $limit
      RETURN collect({node: n, degree: degree}) as nodes
    `;

		const result = await this.runQuery(query, { limit });
		const nodes = result.records[0].get("nodes");

		// Calculate centrality metrics (simplified implementation)
		const centralityMetrics: any = {
			betweenness: {},
			closeness: {},
			degree: {},
			eigenvector: {},
			pagerank: {},
		};

		nodes.forEach((nodeData: any) => {
			const nodeId = nodeData.node.identity.toString();
			centralityMetrics.degree[nodeId] = nodeData.degree;
		});

		return {
			centralityMetrics,
			communities: [],
			influentialNodes: nodes
				.slice(0, 10)
				.map((n: any) => this.nodeToGraphNode(n.node)),
			bridgeNodes: [],
			clusters: [],
		};
	}

	// Utility Methods
	private nodeToGraphNode(node: Node): GraphNode {
		return {
			identity: node.identity.toString(),
			labels: node.labels,
			properties: node.properties,
		};
	}

	private nodeToProductNode(node: Node): ProductNode {
		return {
			identity: node.identity.toString(),
			labels: ["Product"],
			properties: {
				asin: node.properties.asin,
				title: node.properties.title,
				category: node.properties.category,
				brand: node.properties.brand,
				price: node.properties.price,
				rating: node.properties.rating,
				salesRank: node.properties.salesRank,
				createdAt: node.properties.createdAt,
				updatedAt: node.properties.updatedAt,
			},
		};
	}

	private nodeToCompetitorNode(node: Node): CompetitorNode {
		return {
			identity: node.identity.toString(),
			labels: ["Competitor"],
			properties: {
				asin: node.properties.asin,
				brand: node.properties.brand,
				title: node.properties.title,
				category: node.properties.category,
				price: node.properties.price,
				rating: node.properties.rating,
				salesRank: node.properties.salesRank,
				marketShare: node.properties.marketShare,
				createdAt: node.properties.createdAt,
				updatedAt: node.properties.updatedAt,
			},
		};
	}

	private nodeToCustomerNode(node: Node): CustomerNode {
		return {
			identity: node.identity.toString(),
			labels: ["Customer"],
			properties: {
				customerId: node.properties.customerId,
				segment: node.properties.segment,
				location: node.properties.location,
				totalOrders: node.properties.totalOrders,
				totalSpent: node.properties.totalSpent,
				avgOrderValue: node.properties.avgOrderValue,
				createdAt: node.properties.createdAt,
				updatedAt: node.properties.updatedAt,
			},
		};
	}

	private nodeToKeywordNode(node: Node): KeywordNode {
		return {
			identity: node.identity.toString(),
			labels: ["Keyword"],
			properties: {
				keyword: node.properties.keyword,
				searchVolume: node.properties.searchVolume,
				difficulty: node.properties.difficulty,
				cpc: node.properties.cpc,
				intent: node.properties.intent,
				createdAt: node.properties.createdAt,
				updatedAt: node.properties.updatedAt,
			},
		};
	}


	private analyzeBehaviorPattern(
		purchases: any[],
		products: ProductNode[],
	): string {
		if (purchases.length === 0) return "No purchase history";

		const avgOrderValue =
			purchases.reduce((sum, p) => sum + p.properties.price, 0) /
			purchases.length;
		const categories = [...new Set(products.map((p) => p.properties.category))];

		if (avgOrderValue > 100 && categories.length <= 2) {
			return "High-value focused buyer";
		}
		if (purchases.length > 10 && avgOrderValue < 50) {
			return "Frequent bargain hunter";
		}
		if (categories.length > 5) {
			return "Diverse category explorer";
		}
		return "Regular customer";
	}

	private extractPreferences(products: ProductNode[]): string[] {
		const categories = products.map((p) => p.properties.category);
		const brands = products.map((p) => p.properties.brand).filter(Boolean);

		const categoryCount: any = {};
		categories.forEach((cat) => {
			categoryCount[cat] = (categoryCount[cat] || 0) + 1;
		});

		const brandCount: any = {};
		brands.forEach((brand) => {
			if (brand) {
				brandCount[brand] = (brandCount[brand] || 0) + 1;
			}
		});

		const topCategories = Object.entries(categoryCount)
			.sort(([, a], [, b]) => (b as number) - (a as number))
			.slice(0, 3)
			.map(([cat]) => cat);

		const topBrands = Object.entries(brandCount)
			.sort(([, a], [, b]) => (b as number) - (a as number))
			.slice(0, 2)
			.map(([brand]) => brand);

		return [...topCategories, ...topBrands];
	}

	private getCompetitionLevel(score: number): "high" | "medium" | "low" {
		if (score >= 80) return "high";
		if (score >= 50) return "medium";
		return "low";
	}

	private calculateAdvantages(relationship: any): string[] {
		const advantages = [];
		const props = relationship.properties;

		if (props.priceRatio < 0.8) {
			advantages.push("Lower price point");
		}
		if (props.marketShareDiff > 0.1) {
			advantages.push("Higher market share");
		}

		return advantages;
	}

	private calculateDisadvantages(relationship: any): string[] {
		const disadvantages = [];
		const props = relationship.properties;

		if (props.priceRatio > 1.2) {
			disadvantages.push("Higher price point");
		}
		if (props.marketShareDiff < -0.1) {
			disadvantages.push("Lower market share");
		}

		return disadvantages;
	}

	// Health Check
	async healthCheck(): Promise<{
		status: string;
		latency: number;
		nodes: number;
		relationships: number;
	}> {
		const start = Date.now();

		try {
			const result = await this.runQuery(`
        MATCH (n)
        OPTIONAL MATCH ()-[r]-()
        RETURN count(DISTINCT n) as nodes, count(DISTINCT r) as relationships
      `);

			const latency = Date.now() - start;
			const record = result.records[0];

			return {
				status: "healthy",
				latency,
				nodes: record.get("nodes").toNumber(),
				relationships: record.get("relationships").toNumber(),
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			throw new Error(`Neo4j health check failed: ${errorMessage}`);
		}
	}
}
