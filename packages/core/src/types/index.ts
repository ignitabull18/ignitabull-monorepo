/**
 * Core Types
 * Centralized type exports for the core package
 */

// Email types
export * from "./email";
// Influencer marketing types
export * from "./influencer-marketing";
// Neo4j types
export * from "./neo4j";
// SEO analytics types
export * from "./seo-analytics";
// Visitor tracking types
export * from "./visitor-tracking";

// Common utility types
export interface PaginationParams {
	page?: number;
	limit?: number;
	sort?: string;
	order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
	timestamp?: string;
}

export interface QueryFilters {
	[key: string]: any;
}

export interface TimeRange {
	start: Date;
	end: Date;
}

export interface DateRange {
	from: Date | string;
	to: Date | string;
}

// Common status types
export type Status = "active" | "inactive" | "pending" | "archived";
export type Priority = "low" | "medium" | "high" | "urgent";

// Metadata types
export interface Metadata {
	[key: string]: any;
}

export interface Timestamps {
	createdAt: Date;
	updatedAt: Date;
}

export interface SoftDelete extends Timestamps {
	deletedAt?: Date | null;
}

// User and organization types
export interface BaseUser {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	avatarUrl?: string;
	role?: string;
}

export interface BaseOrganization {
	id: string;
	name: string;
	slug: string;
	description?: string;
	website?: string;
	industry?: string;
	ownerId: string;
}

// Analytics types
export interface MetricValue {
	value: number;
	change?: number;
	changePercent?: number;
	trend?: "up" | "down" | "stable";
}

export interface ChartDataPoint {
	label: string;
	value: number;
	[key: string]: any;
}

export interface TimeSeriesData {
	timestamp: Date | string;
	value: number;
	[key: string]: any;
}

// Error types
export interface ValidationError {
	field: string;
	message: string;
	code?: string;
}

export interface ApiError {
	code: string;
	message: string;
	details?: any;
	statusCode?: number;
}

// File types
export interface FileUpload {
	filename: string;
	mimetype: string;
	size: number;
	url: string;
	metadata?: Metadata;
}

// Notification types
export interface Notification {
	id: string;
	type: "info" | "success" | "warning" | "error";
	title: string;
	message: string;
	read: boolean;
	createdAt: Date;
	metadata?: Metadata;
}

// Activity log types
export interface ActivityLog {
	id: string;
	userId: string;
	action: string;
	entity: string;
	entityId: string;
	metadata?: Metadata;
	ipAddress?: string;
	userAgent?: string;
	createdAt: Date;
}

// Export helper types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Utility type helpers
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
	T,
	Exclude<keyof T, Keys>
> &
	{
		[K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
	}[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
	T,
	Exclude<keyof T, Keys>
> &
	{
		[K in Keys]-?: Required<Pick<T, K>> &
			Partial<Record<Exclude<Keys, K>, undefined>>;
	}[Keys];
