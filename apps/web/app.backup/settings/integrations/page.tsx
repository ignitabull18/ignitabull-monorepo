"use client";

import {
	amazonService,
	type IntegrationStatus,
} from "@ignitabull/core/services/amazon-sp-api-service";
import { analyticsService } from "@ignitabull/core/services/analytics-service";
import { Alert, AlertDescription } from "@ignitabull/ui/components/alert";
import { Badge } from "@ignitabull/ui/components/badge";
import { Button } from "@ignitabull/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ignitabull/ui/components/card";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";

export default function IntegrationsPage() {
	const { user, isLoading: authLoading } = useAuth();
	const router = useRouter();
	const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>(
		{ connected: false },
	);
	const [loading, setLoading] = useState(true);
	const [connecting, setConnecting] = useState(false);
	const [disconnecting, setDisconnecting] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

	useEffect(() => {
		if (!authLoading && !user) {
			router.push("/auth/signin");
		}
	}, [user, authLoading, router]);

	useEffect(() => {
		if (user) {
			loadIntegrationStatus();
		}
	}, [user, loadIntegrationStatus]);

	const loadIntegrationStatus = async () => {
		if (!user?.user_metadata?.organization_id) return;

		setLoading(true);
		try {
			const status = await amazonService.getIntegrationStatus(
				user.user_metadata.organization_id,
			);
			setIntegrationStatus(status);
		} catch (_err) {
			// Integration status check failed - service will handle error state
		} finally {
			setLoading(false);
		}
	};

	const handleConnectAmazon = async () => {
		if (!user?.user_metadata?.organization_id) return;

		setConnecting(true);
		setError(null);

		try {
			// In a real implementation, this would:
			// 1. Redirect to Amazon OAuth
			// 2. Handle the callback
			// 3. Store the credentials

			const redirectUri = `${window.location.origin}/api/auth/amazon/callback`;
			const authUrl = amazonService.getAuthorizationUrl(
				user.user_metadata.organization_id,
				redirectUri,
			);

			// For demo purposes, we'll just show a message
			setError(`Amazon OAuth flow would redirect to: ${authUrl}`);

			// In production:
			// window.location.href = authUrl
		} catch (err: any) {
			setError(err.message || "Failed to connect Amazon account");
		} finally {
			setConnecting(false);
		}
	};

	const handleDisconnectAmazon = async () => {
		if (!user?.user_metadata?.organization_id) return;

		setDisconnecting(true);
		setError(null);

		try {
			const { error } = await amazonService.disconnectAccount(
				user.user_metadata.organization_id,
			);
			if (error) throw error;

			await loadIntegrationStatus();
		} catch (err: any) {
			setError(err.message || "Failed to disconnect Amazon account");
		} finally {
			setDisconnecting(false);
		}
	};

	const handleSyncNow = async () => {
		if (!user?.user_metadata?.organization_id) return;

		setSyncing(true);
		setError(null);
		setSyncSuccess(null);

		try {
			// Trigger aggregation for recent metrics (last 30 days)
			const { success, error } = await analyticsService.aggregateRecentMetrics(
				user.user_metadata.organization_id,
				30,
			);

			if (error) throw error;

			if (success) {
				setSyncSuccess(
					"Data sync completed successfully! Your dashboard will update shortly.",
				);
				await loadIntegrationStatus();
			} else {
				throw new Error("Sync completed but with some issues");
			}
		} catch (err: any) {
			setError(err.message || "Failed to sync data");
		} finally {
			setSyncing(false);
		}
	};

	if (authLoading || loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<div className="space-y-6">
				{/* Page Header */}
				<div>
					<h1 className="font-bold text-3xl text-gray-900">Integrations</h1>
					<p className="mt-1 text-gray-500 text-sm">
						Connect your accounts to import data into Ignitabull
					</p>
				</div>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{syncSuccess && (
					<Alert>
						<AlertDescription>{syncSuccess}</AlertDescription>
					</Alert>
				)}

				{/* Amazon Integration Card */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Amazon Seller Central</CardTitle>
								<CardDescription>
									Connect your Amazon Seller account to sync orders, products,
									and analytics
								</CardDescription>
							</div>
							<Badge
								variant={integrationStatus.connected ? "default" : "secondary"}
							>
								{integrationStatus.connected ? (
									<>
										<CheckCircle className="mr-1 h-4 w-4" />
										Connected
									</>
								) : (
									<>
										<XCircle className="mr-1 h-4 w-4" />
										Not Connected
									</>
								)}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{integrationStatus.connected ? (
								<>
									<div className="text-gray-600 text-sm">
										<p>Your Amazon account is connected and syncing data.</p>
										{integrationStatus.lastSync && (
											<p className="mt-1">
												Last synced:{" "}
												{new Date(integrationStatus.lastSync).toLocaleString()}
											</p>
										)}
									</div>
									<div className="flex gap-3">
										<Button onClick={handleSyncNow} disabled={syncing}>
											{syncing ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Syncing...
												</>
											) : (
												"Sync Now"
											)}
										</Button>
										<Button
											variant="destructive"
											onClick={handleDisconnectAmazon}
											disabled={disconnecting}
										>
											{disconnecting ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Disconnecting...
												</>
											) : (
												"Disconnect Account"
											)}
										</Button>
									</div>
								</>
							) : (
								<>
									<div className="text-gray-600 text-sm">
										<p>Connect your Amazon Seller Central account to:</p>
										<ul className="mt-2 list-inside list-disc space-y-1">
											<li>Import orders and sales data</li>
											<li>Track inventory levels</li>
											<li>Monitor product performance</li>
											<li>Analyze customer metrics</li>
										</ul>
									</div>
									<Button onClick={handleConnectAmazon} disabled={connecting}>
										{connecting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Connecting...
											</>
										) : (
											"Connect Amazon Account"
										)}
									</Button>
								</>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Future integrations placeholder */}
				<Card className="opacity-50">
					<CardHeader>
						<CardTitle>More Integrations Coming Soon</CardTitle>
						<CardDescription>
							We're working on adding support for Shopify, eBay, and Walmart
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		</div>
	);
}
