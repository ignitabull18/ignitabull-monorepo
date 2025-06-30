"use client";

import { Button } from "@ignitabull/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ignitabull/ui/components/card";
import {
	ArrowRight,
	BarChart3,
	CheckCircle,
	Settings,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useAuth } from "@/lib/auth-provider";

export default function WelcomePage() {
	const { user, isLoading } = useAuth();
	const { isOnboardingComplete, isChecking } = useOnboarding();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !user) {
			router.push("/auth/signin");
		}
	}, [user, isLoading, router]);

	useEffect(() => {
		// If user has completed onboarding, redirect to dashboard
		if (!isChecking && isOnboardingComplete) {
			router.push("/dashboard");
		}
	}, [isChecking, isOnboardingComplete, router]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const fullName = user?.user_metadata?.full_name || "there";
	const organizationName =
		user?.user_metadata?.organization_name || "your organization";

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
			<div className="mx-auto max-w-4xl px-4 py-12">
				<div className="space-y-8 text-center">
					{/* Hero Section */}
					<div className="space-y-4">
						<h1 className="font-bold text-4xl text-gray-900">
							Welcome to Ignitabull, {fullName}! 🎉
						</h1>
						<p className="mx-auto max-w-2xl text-gray-600 text-xl">
							Your comprehensive Amazon business intelligence platform is ready
							to help {organizationName} grow. Let's get you set up in just one
							simple step.
						</p>
					</div>

					{/* Main Onboarding Card */}
					<Card className="mx-auto max-w-2xl border-2 border-blue-200 shadow-lg">
						<CardHeader className="space-y-4 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
								<Settings className="h-8 w-8 text-blue-600" />
							</div>
							<CardTitle className="text-2xl">
								Connect Your Amazon Account
							</CardTitle>
							<CardDescription className="text-base">
								To unlock the power of Ignitabull, we need to connect to your
								Amazon Seller Central account. This will allow us to import your
								sales data and provide powerful analytics.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Benefits List */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="flex items-start space-x-3">
									<CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
									<div>
										<h4 className="font-medium text-gray-900">
											Sales Analytics
										</h4>
										<p className="text-gray-600 text-sm">
											Track revenue, orders, and trends
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
									<div>
										<h4 className="font-medium text-gray-900">
											Performance Insights
										</h4>
										<p className="text-gray-600 text-sm">
											Monitor product performance metrics
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
									<div>
										<h4 className="font-medium text-gray-900">
											Automated Reports
										</h4>
										<p className="text-gray-600 text-sm">
											Daily data sync and processing
										</p>
									</div>
								</div>
								<div className="flex items-start space-x-3">
									<CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
									<div>
										<h4 className="font-medium text-gray-900">
											Secure & Private
										</h4>
										<p className="text-gray-600 text-sm">
											Enterprise-grade security
										</p>
									</div>
								</div>
							</div>

							{/* CTA Button */}
							<div className="pt-4 text-center">
								<Link href="/settings/integrations">
									<Button size="lg" className="px-8 py-3 text-lg">
										Connect Your Amazon Account
										<ArrowRight className="ml-2 h-5 w-5" />
									</Button>
								</Link>
							</div>

							{/* Security Note */}
							<div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500 text-sm">
								<p>
									🔒 <strong>Secure Connection:</strong> We use Amazon's
									official SP-API with encrypted credential storage. Your data
									is protected with bank-level security.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Preview Cards */}
					<div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
						<Card className="text-center">
							<CardHeader>
								<BarChart3 className="mx-auto h-8 w-8 text-blue-600" />
								<CardTitle className="text-lg">Revenue Dashboard</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600 text-sm">
									Visualize your sales performance with interactive charts and
									KPI cards
								</p>
							</CardContent>
						</Card>

						<Card className="text-center">
							<CardHeader>
								<TrendingUp className="mx-auto h-8 w-8 text-green-600" />
								<CardTitle className="text-lg">Analytics Engine</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600 text-sm">
									Advanced data processing and trend analysis for strategic
									insights
								</p>
							</CardContent>
						</Card>

						<Card className="text-center">
							<CardHeader>
								<Settings className="mx-auto h-8 w-8 text-purple-600" />
								<CardTitle className="text-lg">Automation</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600 text-sm">
									Automated daily reports and data synchronization
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Skip Option */}
					<div className="pt-8">
						<Link
							href="/dashboard"
							className="text-gray-500 text-sm underline hover:text-gray-700"
						>
							Skip for now (you can connect later in Settings)
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
