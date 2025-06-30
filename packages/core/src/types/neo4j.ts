/**
 * Neo4j Types
 * Type definitions for Neo4j graph database operations
 */

// Node Types
export interface GraphNode {
	identity: string;
	labels: string[];
	properties: Record<string, any>;
}

export interface GraphRelationship {
	identity: string;
	type: string;
	start: string;
	end: string;
	properties: Record<string, any>;
}

export interface GraphPath {
	start: GraphNode;
	end: GraphNode;
	segments: GraphPathSegment[];
	length: number;
}

export interface GraphPathSegment {
	start: GraphNode;
	relationship: GraphRelationship;
	end: GraphNode;
}

// Amazon Business Entities
export interface ProductNode extends GraphNode {
	labels: ["Product"];
	properties: {
		asin: string;
		title: string;
		category: string;
		brand?: string;
		price?: number;
		rating?: number;
		salesRank?: number;
		createdAt: string;
		updatedAt: string;
	};
}

export interface CustomerNode extends GraphNode {
	labels: ["Customer"];
	properties: {
		customerId: string;
		segment?: string;
		location?: string;
		totalOrders?: number;
		totalSpent?: number;
		avgOrderValue?: number;
		createdAt: string;
		updatedAt: string;
	};
}

export interface KeywordNode extends GraphNode {
	labels: ["Keyword"];
	properties: {
		keyword: string;
		searchVolume?: number;
		difficulty?: number;
		cpc?: number;
		intent: "informational" | "navigational" | "transactional" | "commercial";
		createdAt: string;
		updatedAt: string;
	};
}

export interface CompetitorNode extends GraphNode {
	labels: ["Competitor"];
	properties: {
		asin: string;
		brand: string;
		title: string;
		category: string;
		price: number;
		rating: number;
		salesRank: number;
		marketShare?: number;
		createdAt: string;
		updatedAt: string;
	};
}

export interface CategoryNode extends GraphNode {
	labels: ["Category"];
	properties: {
		categoryId: string;
		name: string;
		level: number;
		parentCategoryId?: string;
		totalProducts?: number;
		avgPrice?: number;
		createdAt: string;
		updatedAt: string;
	};
}

export interface InfluencerNode extends GraphNode {
	labels: ["Influencer"];
	properties: {
		influencerId: string;
		name: string;
		handle: string;
		platform: string;
		followers: number;
		engagementRate: number;
		category: string;
		tier: string;
		createdAt: string;
		updatedAt: string;
	};
}

export interface CampaignNode extends GraphNode {
	labels: ["Campaign"];
	properties: {
		campaignId: string;
		name: string;
		type: string;
		status: string;
		budget: number;
		startDate: string;
		endDate: string;
		createdAt: string;
		updatedAt: string;
	};
}

// Relationship Types
export interface PurchasedRelationship extends GraphRelationship {
	type: "PURCHASED";
	properties: {
		orderId: string;
		quantity: number;
		price: number;
		date: string;
		rating?: number;
		review?: string;
	};
}

export interface ViewedRelationship extends GraphRelationship {
	type: "VIEWED";
	properties: {
		sessionId: string;
		duration: number;
		date: string;
		source?: string;
	};
}

export interface RanksForRelationship extends GraphRelationship {
	type: "RANKS_FOR";
	properties: {
		position: number;
		page: number;
		date: string;
		searchVolume?: number;
	};
}

export interface CompetesWithRelationship extends GraphRelationship {
	type: "COMPETES_WITH";
	properties: {
		competitionScore: number;
		priceRatio: number;
		marketShareDiff: number;
		date: string;
	};
}

export interface BelongsToRelationship extends GraphRelationship {
	type: "BELONGS_TO";
	properties: {
		relevanceScore?: number;
		date: string;
	};
}

export interface SimilarToRelationship extends GraphRelationship {
	type: "SIMILAR_TO";
	properties: {
		similarityScore: number;
		commonFeatures: string[];
		date: string;
	};
}

export interface PromotesRelationship extends GraphRelationship {
	type: "PROMOTES";
	properties: {
		campaignId: string;
		rate: number;
		deliverables: string[];
		startDate: string;
		endDate: string;
		performance?: {
			reach: number;
			engagements: number;
			conversions: number;
			revenue: number;
		};
	};
}

export interface TargetsRelationship extends GraphRelationship {
	type: "TARGETS";
	properties: {
		relevanceScore: number;
		conversionRate?: number;
		cost?: number;
		date: string;
	};
}

// Query Result Types
export interface Neo4jQueryResult {
	records: Neo4jRecord[];
	summary: Neo4jResultSummary;
}

export interface Neo4jRecord {
	keys: string[];
	length: number;
	_fields: any[];
	_fieldLookup: Record<string, number>;
}

export interface Neo4jResultSummary {
	query: {
		text: string;
		parameters: Record<string, any>;
	};
	queryType: string;
	counters: Neo4jQueryCounters;
	plan?: Neo4jQueryPlan;
	profile?: Neo4jQueryProfile;
	notifications: Neo4jNotification[];
	resultAvailableAfter: number;
	resultConsumedAfter: number;
}

export interface Neo4jQueryCounters {
	nodesCreated: number;
	nodesDeleted: number;
	relationshipsCreated: number;
	relationshipsDeleted: number;
	propertiesSet: number;
	labelsAdded: number;
	labelsRemoved: number;
	indexesAdded: number;
	indexesRemoved: number;
	constraintsAdded: number;
	constraintsRemoved: number;
	containsUpdates: boolean;
	containsSystemUpdates: boolean;
	systemUpdates: number;
}

export interface Neo4jQueryPlan {
	operatorType: string;
	identifiers: string[];
	arguments: Record<string, any>;
	children: Neo4jQueryPlan[];
}

export interface Neo4jQueryProfile extends Neo4jQueryPlan {
	dbHits: number;
	rows: number;
	time: number;
}

export interface Neo4jNotification {
	code: string;
	title: string;
	description: string;
	severity: "WARNING" | "INFORMATION";
	position?: {
		offset: number;
		line: number;
		column: number;
	};
}

// Connection Configuration
export interface Neo4jConnectionConfig {
	uri: string;
	username: string;
	password: string;
	database?: string;
	maxConnectionPoolSize?: number;
	maxTransactionRetryTime?: number;
	connectionAcquisitionTimeout?: number;
	disableLosslessIntegers?: boolean;
	logging?: {
		level: "ERROR" | "WARN" | "INFO" | "DEBUG";
		logger?: (level: string, message: string) => void;
	};
}

// Service Types
export interface GraphAnalysisResult {
	nodes: GraphNode[];
	relationships: GraphRelationship[];
	paths: GraphPath[];
	metrics: GraphMetrics;
}

export interface GraphMetrics {
	nodeCount: number;
	relationshipCount: number;
	averageDegree: number;
	density: number;
	diameter?: number;
	clustering?: number;
}

// Recommendation Types
export interface ProductRecommendation {
	product: ProductNode;
	score: number;
	reasons: string[];
	relatedProducts: ProductNode[];
	targetKeywords: KeywordNode[];
}

export interface CustomerInsight {
	customer: CustomerNode;
	behaviorPattern: string;
	preferences: string[];
	predictedActions: PredictedAction[];
	segmentRecommendations: string[];
}

export interface PredictedAction {
	action: "purchase" | "view" | "search" | "abandon";
	probability: number;
	timeframe: string;
	products: string[]; // ASINs
}

export interface CompetitiveAnalysis {
	competitor: CompetitorNode;
	competitionLevel: "high" | "medium" | "low";
	advantages: string[];
	disadvantages: string[];
	opportunities: string[];
	threats: string[];
	sharedCustomers: CustomerNode[];
	marketOverlap: number;
}

// Query Builder Types
export interface CypherQuery {
	query: string;
	parameters: Record<string, any>;
}

export interface QueryBuilder {
	match(pattern: string): QueryBuilder;
	where(condition: string): QueryBuilder;
	create(pattern: string): QueryBuilder;
	merge(pattern: string): QueryBuilder;
	set(properties: string): QueryBuilder;
	delete(items: string): QueryBuilder;
	return(items: string): QueryBuilder;
	orderBy(items: string): QueryBuilder;
	limit(count: number): QueryBuilder;
	skip(count: number): QueryBuilder;
	with(items: string): QueryBuilder;
	build(): CypherQuery;
}

// Analytics Types
export interface NetworkAnalysis {
	centralityMetrics: {
		betweenness: Record<string, number>;
		closeness: Record<string, number>;
		degree: Record<string, number>;
		eigenvector: Record<string, number>;
		pagerank: Record<string, number>;
	};
	communities: Community[];
	influentialNodes: GraphNode[];
	bridgeNodes: GraphNode[];
	clusters: Cluster[];
}

export interface Community {
	id: string;
	nodes: GraphNode[];
	cohesion: number;
	size: number;
	density: number;
	characteristics: string[];
}

export interface Cluster {
	id: string;
	nodes: GraphNode[];
	centroid: GraphNode;
	diameter: number;
	avgDistance: number;
	compactness: number;
}

// Temporal Analysis
export interface TemporalAnalysis {
	timeframe: {
		start: Date;
		end: Date;
	};
	trends: Trend[];
	seasonality: SeasonalPattern[];
	anomalies: Anomaly[];
	predictions: Prediction[];
}

export interface Trend {
	metric: string;
	direction: "increasing" | "decreasing" | "stable";
	magnitude: number;
	confidence: number;
	timepoints: TimePoint[];
}

export interface SeasonalPattern {
	pattern: string;
	cycle: "daily" | "weekly" | "monthly" | "yearly";
	amplitude: number;
	phase: number;
	confidence: number;
}

export interface Anomaly {
	timestamp: Date;
	metric: string;
	expectedValue: number;
	actualValue: number;
	severity: "low" | "medium" | "high";
	description: string;
}

export interface Prediction {
	metric: string;
	timeframe: string;
	predictedValue: number;
	confidence: number;
	factors: string[];
}

export interface TimePoint {
	timestamp: Date;
	value: number;
}

// Real-time Types
export interface GraphEvent {
	id: string;
	type:
		| "node_created"
		| "node_updated"
		| "node_deleted"
		| "relationship_created"
		| "relationship_updated"
		| "relationship_deleted";
	timestamp: Date;
	data: GraphNode | GraphRelationship;
	metadata?: Record<string, any>;
}

export interface GraphSubscription {
	id: string;
	pattern: string;
	callback: (event: GraphEvent) => void;
	filters?: GraphEventFilter[];
}

export interface GraphEventFilter {
	field: string;
	operator: "equals" | "contains" | "greater_than" | "less_than" | "exists";
	value: any;
}
