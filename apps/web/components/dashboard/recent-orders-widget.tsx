"use client";

import {
	type AmazonOrder,
	amazonService,
} from "@ignitabull/core/services/amazon-sp-api-service";
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
import { AlertCircle, Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RecentOrdersWidgetProps {
	organizationId?: string;
}

export function RecentOrdersWidget({
	organizationId,
}: RecentOrdersWidgetProps) {
	const [orders, setOrders] = useState<AmazonOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		if (organizationId) {
			loadOrders();
		}
	}, [organizationId, loadOrders]);

	const loadOrders = async () => {
		if (!organizationId) return;

		setLoading(true);
		setError(null);

		try {
			// Check if Amazon is connected
			const status = await amazonService.getIntegrationStatus(organizationId);
			setConnected(status.connected);

			if (status.connected) {
				// Fetch recent orders
				const { orders: fetchedOrders, error: ordersError } =
					await amazonService.fetchRecentOrders(organizationId, 10);

				if (ordersError) {
					setError(ordersError.message);
				} else if (fetchedOrders) {
					setOrders(fetchedOrders);
				}
			}
		} catch (err: any) {
			setError(err.message || "Failed to load orders");
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (order: AmazonOrder) => {
		if (!order.OrderTotal) return "N/A";
		return `${order.OrderTotal.CurrencyCode} ${order.OrderTotal.Amount}`;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Orders</CardTitle>
					<CardDescription>
						Loading your latest Amazon orders...
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex items-center justify-between">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-4 w-20" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!connected) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Orders</CardTitle>
					<CardDescription>
						Connect your Amazon account to see orders
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="py-8 text-center">
						<Package className="mx-auto h-12 w-12 text-gray-400" />
						<p className="mt-2 text-gray-600 text-sm">
							No Amazon account connected
						</p>
						<Button asChild className="mt-4">
							<Link href="/settings/integrations">Connect Amazon Account</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Orders</CardTitle>
					<CardDescription>Unable to load orders</CardDescription>
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

	if (orders.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Orders</CardTitle>
					<CardDescription>No recent orders found</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="py-8 text-center">
						<Package className="mx-auto h-12 w-12 text-gray-400" />
						<p className="mt-2 text-gray-600 text-sm">
							No orders in the last 7 days
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Orders</CardTitle>
				<CardDescription>Your latest Amazon orders</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="pb-2 text-left font-medium text-gray-700">
										Order ID
									</th>
									<th className="pb-2 text-left font-medium text-gray-700">
										Date
									</th>
									<th className="pb-2 text-right font-medium text-gray-700">
										Total
									</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{orders.map((order) => (
									<tr key={order.AmazonOrderId} className="hover:bg-gray-50">
										<td className="py-2">
											<span className="font-mono text-xs">
												{order.AmazonOrderId}
											</span>
										</td>
										<td className="py-2">{formatDate(order.PurchaseDate)}</td>
										<td className="py-2 text-right font-medium">
											{formatCurrency(order)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="text-center">
						<Button variant="outline" size="sm" asChild>
							<Link href="/orders">View All Orders</Link>
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
