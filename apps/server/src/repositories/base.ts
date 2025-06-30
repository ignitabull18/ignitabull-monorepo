/**
 * Base Repository Abstract Class
 * Provides common functionality for all repository classes
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "../middleware/error-handler";
import type { Database } from "../types/database";

export interface PaginationOptions {
	page?: number;
	limit?: number;
	orderBy?: string;
	orderDirection?: "asc" | "desc";
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface QueryFilters {
	[key: string]: any;
}

export abstract class BaseRepository<T> {
	protected supabase: SupabaseClient<Database>;
	protected tableName: string;

	constructor(tableName: string) {
		const supabaseUrl = process.env.SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (!supabaseUrl || !supabaseKey) {
			throw new Error("Missing Supabase configuration");
		}

		this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
		this.tableName = tableName;
	}

	// Common CRUD operations

	/**
	 * Create a new record
	 */
	protected async create<CreateType>(data: CreateType): Promise<T> {
		const { data: result, error } = await this.supabase
			.from(this.tableName)
			.insert(data as any)
			.select()
			.single();

		if (error) {
			throw new ApiError(
				`Failed to create ${this.tableName}: ${error.message}`,
				400,
			);
		}

		return result as T;
	}

	/**
	 * Create multiple records
	 */
	protected async createMany<CreateType>(data: CreateType[]): Promise<T[]> {
		const { data: results, error } = await this.supabase
			.from(this.tableName)
			.insert(data as any)
			.select();

		if (error) {
			throw new ApiError(
				`Failed to create multiple ${this.tableName}: ${error.message}`,
				400,
			);
		}

		return results as T[];
	}

	/**
	 * Find a record by ID
	 */
	protected async findById(id: string): Promise<T | null> {
		const { data, error } = await this.supabase
			.from(this.tableName)
			.select()
			.eq("id", id)
			.single();

		if (error && error.code !== "PGRST116") {
			// PGRST116 = no rows returned
			throw new ApiError(
				`Failed to find ${this.tableName}: ${error.message}`,
				400,
			);
		}

		return data as T | null;
	}

	/**
	 * Find a single record by filters
	 */
	protected async findOne(filters: QueryFilters): Promise<T | null> {
		let query = this.supabase.from(this.tableName).select();

		// Apply filters
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined) {
				query = query.eq(key, value);
			}
		});

		const { data, error } = await query.single();

		if (error && error.code !== "PGRST116") {
			throw new ApiError(
				`Failed to find ${this.tableName}: ${error.message}`,
				400,
			);
		}

		return data as T | null;
	}

	/**
	 * Find multiple records by filters
	 */
	protected async findMany(filters: QueryFilters = {}): Promise<T[]> {
		let query = this.supabase.from(this.tableName).select();

		// Apply filters
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined) {
				if (Array.isArray(value)) {
					query = query.in(key, value);
				} else {
					query = query.eq(key, value);
				}
			}
		});

		const { data, error } = await query;

		if (error) {
			throw new ApiError(
				`Failed to find ${this.tableName}: ${error.message}`,
				400,
			);
		}

		return data as T[];
	}

	/**
	 * Find records with pagination
	 */
	protected async findPaginated(
		filters: QueryFilters = {},
		options: PaginationOptions = {},
	): Promise<PaginatedResult<T>> {
		const {
			page = 1,
			limit = 20,
			orderBy = "created_at",
			orderDirection = "desc",
		} = options;

		const offset = (page - 1) * limit;

		// Build query
		let query = this.supabase
			.from(this.tableName)
			.select("*", { count: "exact" });

		// Apply filters
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined) {
				if (Array.isArray(value)) {
					query = query.in(key, value);
				} else {
					query = query.eq(key, value);
				}
			}
		});

		// Apply ordering and pagination
		query = query
			.order(orderBy, { ascending: orderDirection === "asc" })
			.range(offset, offset + limit - 1);

		const { data, error, count } = await query;

		if (error) {
			throw new ApiError(
				`Failed to find ${this.tableName}: ${error.message}`,
				400,
			);
		}

		const total = count || 0;
		const totalPages = Math.ceil(total / limit);

		return {
			data: data as T[],
			total,
			page,
			limit,
			totalPages,
		};
	}

	/**
	 * Update a record by ID
	 */
	protected async update(id: string, data: Partial<T>): Promise<T> {
		const updateData = {
			...data,
			updated_at: new Date().toISOString(),
		};

		const { data: result, error } = await this.supabase
			.from(this.tableName)
			.update(updateData)
			.eq("id", id)
			.select()
			.single();

		if (error) {
			throw new ApiError(
				`Failed to update ${this.tableName}: ${error.message}`,
				400,
			);
		}

		return result as T;
	}

	/**
	 * Update multiple records
	 */
	protected async updateMany(
		filters: QueryFilters,
		data: Partial<T>,
	): Promise<T[]> {
		const updateData = {
			...data,
			updated_at: new Date().toISOString(),
		};

		let query = this.supabase.from(this.tableName).update(updateData);

		// Apply filters
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined) {
				query = query.eq(key, value);
			}
		});

		const { data: results, error } = await query.select();

		if (error) {
			throw new ApiError(
				`Failed to update ${this.tableName}: ${error.message}`,
				400,
			);
		}

		return results as T[];
	}

	/**
	 * Delete a record by ID
	 */
	protected async delete(id: string): Promise<void> {
		const { error } = await this.supabase
			.from(this.tableName)
			.delete()
			.eq("id", id);

		if (error) {
			throw new ApiError(
				`Failed to delete ${this.tableName}: ${error.message}`,
				400,
			);
		}
	}

	/**
	 * Delete multiple records
	 */
	protected async deleteMany(filters: QueryFilters): Promise<void> {
		let query = this.supabase.from(this.tableName).delete();

		// Apply filters
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined) {
				if (Array.isArray(value)) {
					query = query.in(key, value);
				} else {
					query = query.eq(key, value);
				}
			}
		});

		const { error } = await query;

		if (error) {
			throw new ApiError(
				`Failed to delete ${this.tableName}: ${error.message}`,
				400,
			);
		}
	}

	/**
	 * Count records
	 */
	protected async count(filters: QueryFilters = {}): Promise<number> {
		let query = this.supabase
			.from(this.tableName)
			.select("*", { count: "exact", head: true });

		// Apply filters
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined) {
				query = query.eq(key, value);
			}
		});

		const { count, error } = await query;

		if (error) {
			throw new ApiError(
				`Failed to count ${this.tableName}: ${error.message}`,
				400,
			);
		}

		return count || 0;
	}

	/**
	 * Check if a record exists
	 */
	protected async exists(filters: QueryFilters): Promise<boolean> {
		const count = await this.count(filters);
		return count > 0;
	}

	/**
	 * Perform a raw query
	 */
	protected async raw<R = any>(query: string, params?: any[]): Promise<R[]> {
		const { data, error } = await this.supabase.rpc("exec_sql", {
			query,
			params: params || [],
		});

		if (error) {
			throw new ApiError(`Failed to execute raw query: ${error.message}`, 400);
		}

		return data as R[];
	}

	/**
	 * Begin a transaction (Note: Supabase doesn't support transactions directly)
	 * This is a placeholder for transaction-like behavior
	 */
	protected async transaction<R>(
		callback: (client: SupabaseClient<Database>) => Promise<R>,
	): Promise<R> {
		try {
			return await callback(this.supabase);
		} catch (error) {
			throw new ApiError(
				`Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				400,
			);
		}
	}

	/**
	 * Bulk upsert operation
	 */
	protected async upsert<UpsertType>(
		data: UpsertType | UpsertType[],
		options?: { onConflict?: string },
	): Promise<T[]> {
		const { data: results, error } = await this.supabase
			.from(this.tableName)
			.upsert(data as any, options)
			.select();

		if (error) {
			throw new ApiError(
				`Failed to upsert ${this.tableName}: ${error.message}`,
				400,
			);
		}

		return results as T[];
	}
}
