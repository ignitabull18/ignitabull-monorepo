"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ignitabull/ui/components/card";
import { useEffect } from "react";
import { RecentOrdersWidget } from "@/components/dashboard/recent-orders-widget";
import { RevenueChartWidget } from "@/components/dashboard/revenue-chart-widget";
import { TodaysOrdersWidget } from "@/components/dashboard/todays-orders-widget";
import { TodaysRevenueWidget } from "@/components/dashboard/todays-revenue-widget";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useAuth } from "@/lib/auth-provider";

export default function DashboardPage() {
	const { user } = useAuth();
	const { isOnboardingComplete, isChecking, redirectToOnboarding } =
		useOnboarding();
	const fullName = user?.user_metadata?.full_name || "there";
	const organizationId = user?.user_metadata?.organization_id;

	useEffect(() => {
		if (!isChecking && !isOnboardingComplete) {
			redirectToOnboarding();
		}
	}, [isChecking, isOnboardingComplete, redirectToOnboarding]);

	// Show loading while checking onboarding status
	if (isChecking) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	// This will redirect before rendering if onboarding isn't complete
	if (!isOnboardingComplete) {
		return null;
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="font-bold text-3xl text-gray-900">Dashboard</h1>
				<p className="mt-1 text-gray-500 text-sm">
					Welcome back, {fullName}! Here's your business overview.
				</p>
			</div>

			{/* Responsive Grid Layout */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* Welcome Widget */}
				<Card className="md:col-span-2 lg:col-span-1">
					<CardHeader>
						<CardTitle>Welcome to Ignitabull</CardTitle>
						<CardDescription>
							Your comprehensive Amazon business intelligence platform
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<p className="font-medium text-lg">Hello, {fullName}!</p>
							<p className="text-gray-600 text-sm">
								Organization:{" "}
								{user?.user_metadata?.organization_name || "No organization"}
							</p>
							<p className="text-gray-600 text-sm">
								Get started by connecting your Amazon Seller account to see your
								business data.
							</p>
						</div>
					</CardContent>
				</Card>

				{/* KPI Widgets */}
				<TodaysRevenueWidget organizationId={organizationId} />

				<TodaysOrdersWidget organizationId={organizationId} />

				{/* Revenue Chart Widget - spans full width */}
				<div className="md:col-span-2 lg:col-span-3">
					<RevenueChartWidget organizationId={organizationId} />
				</div>

				{/* Recent Orders Widget - spans full width */}
				<div className="md:col-span-2 lg:col-span-3">
					<RecentOrdersWidget organizationId={organizationId} />
				</div>
			</div>
		</div>
	);
}
