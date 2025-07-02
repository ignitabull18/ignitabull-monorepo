/**
 * Common types shared across all Amazon API providers
 */

/**
 * Amazon marketplace identifiers
 */
export type AmazonMarketplace =
	| "ATVPDKIKX0DER" // US
	| "A2EUQ1WTGCTBG2" // CA
	| "A1AM78C64UM0Y8" // MX
	| "A1PA6795UKMFR9" // DE
	| "A1RKKUPIHCS9HS" // ES
	| "A13V1IB3VIYZZH" // FR
	| "A21TJRUUN4KGV" // IN
	| "APJ6JRA9NG5V4" // IT
	| "A1805IZSGTT6HS" // NL
	| "A2Q3Y263D00KWC" // BR
	| "A1F83G8C2ARO7P" // UK
	| "A39IBJ37TRP1C6" // AU
	| "A1VC38T7YXB528"; // JP

/**
 * Standard Amazon API error response
 */
export interface AmazonAPIError {
	code: string;
	message: string;
	details?: string;
}

/**
 * Pagination parameters for Amazon APIs
 */
export interface PaginationParams {
	nextToken?: string;
	maxResultsPerPage?: number;
}

/**
 * Common date range filter
 */
export interface DateRange {
	startDate: Date;
	endDate: Date;
}

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
	requestsRemaining: number;
	resetTime: Date;
	retryAfter?: number;
}

/**
 * Base response wrapper for all Amazon API calls
 */
export interface AmazonResponse<T = unknown> {
	data: T;
	pagination?: {
		nextToken?: string;
		hasMore: boolean;
	};
	rateLimit?: RateLimitInfo;
	timestamp: Date;
}

/**
 * Standard success response
 */
export interface SuccessResponse {
	success: boolean;
	message?: string;
}

/**
 * Money amount representation
 */
export interface MoneyAmount {
	amount: number;
	currencyCode: string;
}

/**
 * Product dimensions
 */
export interface Dimensions {
	height?: number;
	length?: number;
	width?: number;
	weight?: number;
	unit: "inches" | "centimeters" | "pounds" | "kilograms";
}

/**
 * Image information
 */
export interface ProductImage {
	url: string;
	height?: number;
	width?: number;
	variant?:
		| "MAIN"
		| "PT01"
		| "PT02"
		| "PT03"
		| "PT04"
		| "PT05"
		| "PT06"
		| "PT07"
		| "PT08";
}

/**
 * Generic filter interface
 */
export interface Filter<T = string> {
	field: string;
	operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
	value: T | T[];
}

/**
 * API Request/Response Types for replacing any
 */
export interface ApiRequestOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	headers?: Record<string, string>;
	params?: Record<string, string | number | boolean>;
	body?: unknown;
	timeout?: number;
}

export interface ApiResponse<T = unknown> {
	data: T;
	status: number;
	headers: Record<string, string>;
	error?: AmazonAPIError;
}

/**
 * Analytics Types for replacing any
 */
export interface AnalyticsMetric {
	name: string;
	value: number;
	unit?: string;
	change?: number;
	changePercent?: number;
	trend?: "up" | "down" | "stable";
}

export interface AnalyticsPattern {
	type: string;
	confidence: number;
	description: string;
	impact: "high" | "medium" | "low";
	data: Record<string, unknown>;
}

export interface AnalyticsRecommendation {
	id: string;
	type: string;
	priority: "high" | "medium" | "low";
	title: string;
	description: string;
	impact: string;
	effort: "low" | "medium" | "high";
	metrics?: AnalyticsMetric[];
	actions?: string[];
}

/**
 * Campaign Types for replacing any
 */
export interface CampaignData {
	campaignId: string;
	name: string;
	type: string;
	status: "enabled" | "paused" | "archived";
	budget: number;
	spend: number;
	impressions: number;
	clicks: number;
	conversions: number;
	acos?: number;
	roas?: number;
	metadata?: Record<string, unknown>;
}

export interface HistoricalDataPoint {
	date: string;
	value: number;
	metadata?: Record<string, unknown>;
}

/**
 * Channel Attribution Types for replacing any
 */
export interface ChannelPattern {
	channel: string;
	touchpoints: number;
	conversionRate: number;
	revenue: number;
	cost: number;
	roi: number;
	patterns: Record<string, unknown>;
}

export interface AttributionModelData {
	modelType: "lastTouch" | "firstTouch" | "linear" | "timeDecay" | "dataDriver";
	channels: ChannelPattern[];
	totalConversions: number;
	totalRevenue: number;
	metadata?: Record<string, unknown>;
}

/**
 * Insights Types for replacing any
 */
export interface InsightData {
	type: string;
	category: string;
	severity: "critical" | "high" | "medium" | "low";
	title: string;
	description: string;
	impact: string;
	recommendations: string[];
	data: Record<string, unknown>;
	createdAt: string;
}

export interface PredictionResult {
	metric: string;
	predicted: number;
	confidence: number;
	range: {
		min: number;
		max: number;
	};
	factors: Array<{
		name: string;
		impact: number;
	}>;
}

/**
 * Type Guards
 */
export function isApiError(error: unknown): error is AmazonAPIError {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		"message" in error
	);
}

export function isAnalyticsMetric(obj: unknown): obj is AnalyticsMetric {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"name" in obj &&
		"value" in obj &&
		typeof (obj as AnalyticsMetric).name === "string" &&
		typeof (obj as AnalyticsMetric).value === "number"
	);
}

export function isCampaignData(obj: unknown): obj is CampaignData {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"campaignId" in obj &&
		"name" in obj &&
		"type" in obj &&
		"status" in obj
	);
}

/**
 * Generic Cache Type
 */
export interface CacheEntry<T> {
	value: T;
	expiresAt: number;
	key: string;
}

export type CacheStorage<T> = Map<string, CacheEntry<T>>;

/**
 * Dynamic Property Access
 */
export type DynamicObject<T = unknown> = Record<string, T>;

/**
 * Safe property access helper
 */
export function getProperty<T, K extends keyof T>(
	obj: T,
	key: K,
): T[K] | undefined {
	return obj[key];
}

export function hasProperty<T extends object, K extends PropertyKey>(
	obj: T,
	key: K,
): obj is T & Record<K, unknown> {
	return key in obj;
}

/**
 * Amazon API Credentials
 */
export interface AmazonCredentials {
	accessKeyId: string;
	secretAccessKey: string;
	sessionToken?: string;
	region: string;
	marketplace?: AmazonMarketplace;
	// OAuth credentials for Advertising API
	accessToken?: string;
	refreshToken?: string;
	clientId?: string;
	clientSecret?: string;
}
