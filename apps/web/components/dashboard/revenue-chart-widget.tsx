"use client";

import { analyticsService } from "@ignitabull/core/services/analytics-service";
import {
	type IntegrationStatusInfo,
	integrationStatusService,
} from "@ignitabull/core/services/integration-status-service";
import { Alert, AlertDescription } from "@ignitabull/ui/components/alert";
import { Button } from "@ignitabull/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ignitabull/ui/components/card";
import { Skeleton } from "@ignitabull/ui/components/skeleton";
import { AlertCircle, Clock, RefreshCw, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface RevenueChartWidgetProps {
	organizationId?: string;
}

interface ChartDataPoint {
	date: string;
	revenue: number;
	formattedDate: string;
}

export function RevenueChartWidget({
	organizationId,
}: RevenueChartWidgetProps) {
	const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currency, setCurrency] = useState("USD");
	const [integrationStatus, setIntegrationStatus] =
		useState<IntegrationStatusInfo | null>(null);

	useEffect(() => {
		if (organizationId) {
			loadRevenueData();
		}
	}, [organizationId, loadRevenueData]);

	const loadRevenueData = async () => {
		if (!organizationId) return;

		setLoading(true);
		setError(null);

		try {
			// Check integration status first
			const status =
				await integrationStatusService.getIntegrationStatus(organizationId);
			setIntegrationStatus(status);

			// Get last 30 days of revenue data
			const endDate = new Date();
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - 30);

			const metrics = await analyticsService.getMetricsRange(
				organizationId,
				startDate,
				endDate,
				"revenue",
			);

			if (metrics.length === 0) {
				setChartData([]);
				return;
			}

			// Transform data for chart
			const transformedData = metrics.map((metric) => ({
				date: metric.date,
				revenue: Number.parseFloat(metric.value.toString()),
				formattedDate: new Date(metric.date).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
			}));

			setChartData(transformedData);
			setCurrency(metrics[0]?.currency || "USD");
		} catch (err: any) {
			setError(err.message || "Failed to load revenue data");
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(value);
	};

	const calculateTotalRevenue = () => {
		return chartData.reduce((sum, point) => sum + point.revenue, 0);
	};

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<div className="rounded border bg-white p-3 shadow-lg">
					<p className="font-medium text-sm">{label}</p>
					<p className="text-blue-600 text-sm">
						Revenue: {formatCurrency(payload[0].value)}
					</p>
				</div>
			);
		}
		return null;
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Revenue Trend</CardTitle>
					<CardDescription>
						Loading revenue data for the last 30 days...
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-64 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Revenue Trend</CardTitle>
					<CardDescription>Unable to load revenue data</CardDescription>
				</CardHeader>
				<CardContent>
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	if (chartData.length === 0) {
		// No connection case
		if (!integrationStatus?.hasConnection) {
			return (
				<Card>
					<CardHeader>
						<CardTitle>Revenue Trend</CardTitle>
						<CardDescription>Revenue over the last 30 days</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="py-8 text-center">
							<TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
							<p className="mt-2 text-gray-600 text-sm">
								No Amazon account connected
							</p>
							<p className="mt-1 text-gray-500 text-xs">
								Connect your Amazon Seller Central account to see revenue trends
							</p>
							<Button asChild className="mt-4" variant="outline">
								<Link href="/settings/integrations">Connect Account</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			);
		}

		// Connected but no data case
		if (
			integrationStatus?.isActiveConnection &&
			!integrationStatus?.hasAnyData
		) {
			return (
				<Card>
					<CardHeader>
						<CardTitle>Revenue Trend</CardTitle>
						<CardDescription>Revenue over the last 30 days</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="py-8 text-center">
							<Clock className="mx-auto h-12 w-12 text-blue-400" />
							<p className="mt-2 text-gray-600 text-sm">Your data is syncing</p>
							<p className="mt-1 text-gray-500 text-xs">
								Please check back in a few minutes while we process your Amazon
								data
							</p>
							<div className="mt-4 flex justify-center gap-3">
								<Button variant="outline" onClick={loadRevenueData}>
									<RefreshCw className="mr-2 h-4 w-4" />
									Check Again
								</Button>
								<Button asChild variant="outline">
									<Link href="/settings/integrations">Manage Integration</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			);
		}

		// Connected with data but no revenue in last 30 days
		return (
			<Card>
				<CardHeader>
					<CardTitle>Revenue Trend</CardTitle>
					<CardDescription>Revenue over the last 30 days</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="py-8 text-center">
						<TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
						<p className="mt-2 text-gray-600 text-sm">
							No revenue data for the last 30 days
						</p>
						<p className="mt-1 text-gray-500 text-xs">
							Your account is connected but no recent revenue data was found
						</p>
						<Button
							variant="outline"
							className="mt-4"
							onClick={loadRevenueData}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh Data
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Revenue Trend</CardTitle>
						<CardDescription>Revenue over the last 30 days</CardDescription>
					</div>
					<div className="text-right">
						<p className="font-bold text-2xl text-green-600">
							{formatCurrency(calculateTotalRevenue())}
						</p>
						<p className="text-gray-500 text-xs">Total Revenue</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={chartData}
							margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
						>
							<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
							<XAxis
								dataKey="formattedDate"
								tick={{ fontSize: 12 }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								tick={{ fontSize: 12 }}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => formatCurrency(value)}
							/>
							<Tooltip content={<CustomTooltip />} />
							<Line
								type="monotone"
								dataKey="revenue"
								stroke="#2563eb"
								strokeWidth={2}
								dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
								activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
				<div className="mt-4 flex items-center justify-between border-t pt-4">
					<div className="text-gray-600 text-sm">
						{chartData.length} days of data
					</div>
					<Button variant="outline" size="sm" onClick={loadRevenueData}>
						Refresh
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
