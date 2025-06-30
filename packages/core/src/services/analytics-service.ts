/**
 * Analytics Service
 * Handles data aggregation and metric calculations for business insights
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { type AmazonOrder, amazonService } from "./amazon-sp-api-service";

/**
 * Daily metrics schema
 */
const DailyMetricsSchema = z.object({
	date: z.date(),
	revenue: z.number(),
	orders: z.number(),
	averageOrderValue: z.number(),
	currency: z.string().default("USD"),
});

export type DailyMetrics = z.infer<typeof DailyMetricsSchema>;

/**
 * Metric value with comparison
 */
export interface MetricWithComparison {
	value: number;
	previousValue?: number;
	percentageChange?: number;
	currency?: string;
}

/**
 * Analytics Service
 * Provides methods for data aggregation and insights
 */
export class AnalyticsService {
	private supabase: SupabaseClient;

	constructor(supabaseUrl: string, supabaseKey: string) {
		this.supabase = createClient(supabaseUrl, supabaseKey);
	}

	/**
	 * Aggregate daily metrics for an organization
	 * @param organizationId - Organization ID
	 * @param date - Date to aggregate metrics for
	 * @returns Success or error
	 */
	async aggregateDailyMetrics(
		organizationId: string,
		date: Date,
	): Promise<{ success: boolean; error: Error | null }> {
		try {
			// Set date boundaries for the day
			const startDate = new Date(date);
			startDate.setHours(0, 0, 0, 0);

			const endDate = new Date(date);
			endDate.setHours(23, 59, 59, 999);

			// Fetch orders for the day
			const { orders, error: ordersError } = await amazonService.fetchOrders(
				organizationId,
				startDate,
				endDate,
			);

			if (ordersError) {
				throw ordersError;
			}

			if (!orders || orders.length === 0) {
				// Store zero metrics for the day
				await this.storeMetrics(organizationId, date, {
					revenue: 0,
					orders: 0,
					averageOrderValue: 0,
					currency: "USD",
				});
				return { success: true, error: null };
			}

			// Calculate metrics
			const metrics = this.calculateMetricsFromOrders(orders);

			// Store in database
			await this.storeMetrics(organizationId, date, metrics);

			return { success: true, error: null };
		} catch (error) {
			return { success: false, error: error as Error };
		}
	}

	/**
	 * Calculate metrics from orders
	 * @param orders - Array of Amazon orders
	 * @returns Calculated metrics
	 */
	private calculateMetricsFromOrders(
		orders: AmazonOrder[],
	): Omit<DailyMetrics, "date"> {
		let totalRevenue = 0;
		let orderCount = 0;
		let currency = "USD";

		for (const order of orders) {
			// Only count completed orders
			if (order.OrderStatus === "Shipped" || order.OrderStatus === "Pending") {
				orderCount++;

				if (order.OrderTotal) {
					totalRevenue += Number.parseFloat(order.OrderTotal.Amount);
					currency = order.OrderTotal.CurrencyCode;
				}
			}
		}

		const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

		return {
			revenue: totalRevenue,
			orders: orderCount,
			averageOrderValue: averageOrderValue,
			currency,
		};
	}

	/**
	 * Store metrics in database
	 * @param organizationId - Organization ID
	 * @param date - Date of metrics
	 * @param metrics - Calculated metrics
	 */
	private async storeMetrics(
		organizationId: string,
		date: Date,
		metrics: Omit<DailyMetrics, "date">,
	): Promise<void> {
		// Get integration ID for Amazon
		const { data: integration } = await this.supabase
			.from("integrations")
			.select("id")
			.eq("organization_id", organizationId)
			.eq("platform", "amazon")
			.single();

		if (!integration) {
			throw new Error("Amazon integration not found");
		}

		// Upsert revenue metric
		await this.supabase.from("metrics").upsert(
			{
				organization_id: organizationId,
				integration_id: integration.id,
				metric_type: "revenue",
				date: date.toISOString().split("T")[0],
				value: metrics.revenue,
				currency: metrics.currency,
				metadata: { source: "amazon_orders" },
			},
			{
				onConflict: "organization_id,integration_id,metric_type,date",
			},
		);

		// Upsert orders metric
		await this.supabase.from("metrics").upsert(
			{
				organization_id: organizationId,
				integration_id: integration.id,
				metric_type: "orders",
				date: date.toISOString().split("T")[0],
				value: metrics.orders,
				currency: metrics.currency,
				metadata: {
					source: "amazon_orders",
					average_order_value: metrics.averageOrderValue,
				},
			},
			{
				onConflict: "organization_id,integration_id,metric_type,date",
			},
		);
	}

	/**
	 * Get metrics for a date range
	 * @param organizationId - Organization ID
	 * @param startDate - Start date
	 * @param endDate - End date
	 * @param metricType - Type of metric to fetch
	 * @returns Array of metrics
	 */
	async getMetricsRange(
		organizationId: string,
		startDate: Date,
		endDate: Date,
		metricType: "revenue" | "orders",
	): Promise<Array<{ date: string; value: number; currency: string }>> {
		try {
			const { data, error } = await this.supabase
				.from("metrics")
				.select("date, value, currency")
				.eq("organization_id", organizationId)
				.eq("metric_type", metricType)
				.gte("date", startDate.toISOString().split("T")[0])
				.lte("date", endDate.toISOString().split("T")[0])
				.order("date", { ascending: true });

			if (error) throw error;

			return data || [];
		} catch (error) {
			console.error("Failed to fetch metrics:", error);
			return [];
		}
	}

	/**
	 * Get today's metric with comparison to yesterday
	 * @param organizationId - Organization ID
	 * @param metricType - Type of metric
	 * @returns Metric with comparison
	 */
	async getTodayMetricWithComparison(
		organizationId: string,
		metricType: "revenue" | "orders",
	): Promise<MetricWithComparison> {
		try {
			const today = new Date();
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			// Fetch today and yesterday metrics
			const { data, error } = await this.supabase
				.from("metrics")
				.select("date, value, currency")
				.eq("organization_id", organizationId)
				.eq("metric_type", metricType)
				.in("date", [
					today.toISOString().split("T")[0],
					yesterday.toISOString().split("T")[0],
				])
				.order("date", { ascending: false });

			if (error) throw error;

			const todayMetric = data?.find(
				(m) => m.date === today.toISOString().split("T")[0],
			);
			const yesterdayMetric = data?.find(
				(m) => m.date === yesterday.toISOString().split("T")[0],
			);

			const value = todayMetric?.value || 0;
			const previousValue = yesterdayMetric?.value || 0;

			let percentageChange = 0;
			if (previousValue > 0) {
				percentageChange = ((value - previousValue) / previousValue) * 100;
			}

			return {
				value,
				previousValue,
				percentageChange,
				currency: todayMetric?.currency || "USD",
			};
		} catch (error) {
			console.error("Failed to fetch today metric:", error);
			return { value: 0 };
		}
	}

	/**
	 * Aggregate metrics for multiple days
	 * @param organizationId - Organization ID
	 * @param days - Number of days to aggregate
	 * @returns Success or error
	 */
	async aggregateRecentMetrics(
		organizationId: string,
		days = 30,
	): Promise<{ success: boolean; error: Error | null }> {
		try {
			const today = new Date();

			for (let i = 0; i < days; i++) {
				const date = new Date(today);
				date.setDate(date.getDate() - i);

				await this.aggregateDailyMetrics(organizationId, date);
			}

			return { success: true, error: null };
		} catch (error) {
			return { success: false, error: error as Error };
		}
	}
}

// Initialize and export a singleton instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		"Supabase URL and Anon Key must be defined in environment variables",
	);
}

export const analyticsService = new AnalyticsService(
	supabaseUrl,
	supabaseAnonKey,
);
