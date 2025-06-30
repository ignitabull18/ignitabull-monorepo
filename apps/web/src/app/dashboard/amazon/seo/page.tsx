"use client";

import { useState } from "react";
import { CompetitorAnalysis } from "@/components/amazon/seo/competitor-analysis";
import { KeywordRankings } from "@/components/amazon/seo/keyword-rankings";
import { SearchAnomalies } from "@/components/amazon/seo/search-anomalies";
import { SearchOpportunities } from "@/components/amazon/seo/search-opportunities";
import { SEOOverview } from "@/components/amazon/seo/seo-overview";
import { SEORecommendations } from "@/components/amazon/seo/seo-recommendations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function AmazonSEODashboard() {
	const [asin, setAsin] = useState("");
	const [marketplace, setMarketplace] = useState("ATVPDKIKX0DER"); // US marketplace
	const [loading, setLoading] = useState(false);
	const [dashboardData, setDashboardData] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	const loadDashboard = async () => {
		if (!asin) {
			setError("Please enter an ASIN");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// In a real app, this would call the API
			// const response = await fetch(`/api/amazon/seo/dashboard?asin=${asin}&marketplace=${marketplace}`)
			// const data = await response.json()

			// Mock data for now
			const mockData = {
				overview: {
					visibilityScore: 75,
					visibilityTrend: "UP",
					totalImpressions: 125000,
					totalClicks: 3750,
					averageCTR: 3.0,
					topKeywords: [
						"wireless earbuds",
						"bluetooth headphones",
						"noise cancelling earbuds",
					],
				},
				rankings: {
					improved: [
						{
							keyword: "wireless earbuds",
							currentRank: 5,
							previousRank: 8,
							rankChange: 3,
						},
						{
							keyword: "bluetooth audio",
							currentRank: 12,
							previousRank: 18,
							rankChange: 6,
						},
					],
					declined: [
						{
							keyword: "premium headphones",
							currentRank: 15,
							previousRank: 10,
							rankChange: -5,
						},
					],
					new: [
						{
							keyword: "sports earbuds",
							currentRank: 22,
							previousRank: 0,
							rankChange: 22,
						},
					],
					lost: [],
				},
				opportunities: [
					{
						keyword: "wireless earbuds for running",
						searchVolume: 5000,
						competition: "MEDIUM",
						estimatedTraffic: 500,
						conversionPotential: 8.5,
					},
					{
						keyword: "noise cancelling earbuds under $100",
						searchVolume: 3000,
						competition: "LOW",
						estimatedTraffic: 450,
						conversionPotential: 12.0,
					},
				],
				anomalies: [
					{
						type: "RANKING_LOSS",
						severity: "HIGH",
						detectedDate: "2024-01-15",
						affectedKeywords: ["premium headphones"],
						impact: {
							impressionsChange: -35,
							clicksChange: -40,
							revenueChange: -25,
						},
					},
				],
				recommendations: [
					{
						type: "TITLE",
						priority: "HIGH",
						recommendation:
							'Add "Wireless" and "Noise Cancelling" to product title',
						expectedImpact: {
							visibilityIncrease: 25,
							trafficIncrease: 20,
						},
					},
					{
						type: "BACKEND_KEYWORDS",
						priority: "MEDIUM",
						recommendation:
							"Optimize backend keywords with long-tail variations",
						expectedImpact: {
							visibilityIncrease: 15,
							trafficIncrease: 12,
						},
					},
				],
				competitors: [
					{
						asin: "B002345678",
						brand: "CompetitorA",
						visibilityScore: 82,
						sharedKeywords: 15,
						threatLevel: "HIGH",
					},
					{
						asin: "B003456789",
						brand: "CompetitorB",
						visibilityScore: 68,
						sharedKeywords: 12,
						threatLevel: "MEDIUM",
					},
				],
			};

			setDashboardData(mockData);
		} catch (_err) {
			setError("Failed to load dashboard data");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Amazon SEO Dashboard
					</h1>
					<p className="text-muted-foreground">
						Track search performance and optimize your Amazon listings
					</p>
				</div>

				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<Label htmlFor="asin">ASIN</Label>
						<Input
							id="asin"
							placeholder="B001234567"
							value={asin}
							onChange={(e) => setAsin(e.target.value)}
							className="w-32"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Label htmlFor="marketplace">Marketplace</Label>
						<select
							id="marketplace"
							value={marketplace}
							onChange={(e) => setMarketplace(e.target.value)}
							className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="ATVPDKIKX0DER">US</option>
							<option value="A1F83G8C2ARO7P">UK</option>
							<option value="A1PA6795UKMFR9">DE</option>
							<option value="A1VC38T7YXB528">JP</option>
						</select>
					</div>

					<Button onClick={loadDashboard} disabled={loading}>
						{loading ? "Loading..." : "Load Dashboard"}
					</Button>
				</div>
			</div>

			{error && (
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<p className="text-destructive">{error}</p>
					</CardContent>
				</Card>
			)}

			{loading && (
				<div className="space-y-6">
					<Skeleton className="h-32" />
					<Skeleton className="h-64" />
					<Skeleton className="h-64" />
				</div>
			)}

			{dashboardData && !loading && (
				<>
					{/* Overview Section */}
					<SEOOverview data={dashboardData.overview} />

					{/* Main Grid */}
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Keyword Rankings */}
						<KeywordRankings rankings={dashboardData.rankings} />

						{/* Search Opportunities */}
						<SearchOpportunities opportunities={dashboardData.opportunities} />
					</div>

					{/* Competitor Analysis */}
					<CompetitorAnalysis competitors={dashboardData.competitors} />

					{/* Bottom Grid */}
					<div className="grid gap-6 lg:grid-cols-2">
						{/* SEO Recommendations */}
						<SEORecommendations
							recommendations={dashboardData.recommendations}
						/>

						{/* Search Anomalies */}
						<SearchAnomalies anomalies={dashboardData.anomalies} />
					</div>
				</>
			)}
		</div>
	);
}
