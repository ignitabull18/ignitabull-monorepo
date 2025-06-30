"use client";

import {
	Activity,
	ArrowRight,
	Calendar,
	ChevronRight,
	DollarSign,
	RefreshCw,
	Target,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttributionCampaign {
	campaignId: string;
	campaignName: string;
	campaignType: string;
	status: string;
	spend: number;
	impressions: number;
	clicks: number;
	detailPageViews: number;
	purchases: number;
	sales: number;
	returnOnAdSpend: number;
	clickThroughRate: number;
	conversionRate: number;
	efficiency: {
		score: number;
		rank: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
	};
}

interface CrossChannelInsights {
	totalCampaigns: number;
	totalSpend: number;
	totalSales: number;
	overallROAS: number;
	channelBreakdown: {
		channel: string;
		spend: number;
		sales: number;
		roas: number;
		contribution: number;
	}[];
	bestPerformingChannels: string[];
	recommendations: {
		type: string;
		priority: string;
		description: string;
		expectedImpact: number;
	}[];
	customerJourneyInsights: {
		averagePathLength: number;
		averageTimeLag: number;
		topConversionPaths: string[];
	};
}

export default function AttributionDashboard() {
	const [loading, setLoading] = useState(false);
	const [campaigns, setCampaigns] = useState<AttributionCampaign[]>([]);
	const [crossChannelData, setCrossChannelData] =
		useState<CrossChannelInsights | null>(null);
	const [dateRange, setDateRange] = useState({
		startDate: "2024-01-01",
		endDate: "2024-01-31",
	});
	const [_advertiserId, _setAdvertiserId] = useState(
		"amzn1.application-oa2-client.12345",
	);

	const loadDashboardData = async () => {
		setLoading(true);
		try {
			// Mock data for attribution campaigns
			const mockCampaigns: AttributionCampaign[] = [
				{
					campaignId: "camp-001",
					campaignName: "Google Ads - Search",
					campaignType: "SEARCH",
					status: "ACTIVE",
					spend: 2500,
					impressions: 125000,
					clicks: 3750,
					detailPageViews: 1875,
					purchases: 188,
					sales: 14100,
					returnOnAdSpend: 5.64,
					clickThroughRate: 3.0,
					conversionRate: 10.0,
					efficiency: { score: 85, rank: "EXCELLENT" },
				},
				{
					campaignId: "camp-002",
					campaignName: "Facebook Display",
					campaignType: "DISPLAY",
					status: "ACTIVE",
					spend: 1800,
					impressions: 450000,
					clicks: 2250,
					detailPageViews: 1125,
					purchases: 90,
					sales: 5400,
					returnOnAdSpend: 3.0,
					clickThroughRate: 0.5,
					conversionRate: 8.0,
					efficiency: { score: 65, rank: "GOOD" },
				},
				{
					campaignId: "camp-003",
					campaignName: "YouTube Video",
					campaignType: "VIDEO",
					status: "ACTIVE",
					spend: 3200,
					impressions: 800000,
					clicks: 4800,
					detailPageViews: 1920,
					purchases: 154,
					sales: 9240,
					returnOnAdSpend: 2.89,
					clickThroughRate: 0.6,
					conversionRate: 8.0,
					efficiency: { score: 58, rank: "AVERAGE" },
				},
				{
					campaignId: "camp-004",
					campaignName: "Instagram Influencer",
					campaignType: "INFLUENCER",
					status: "ACTIVE",
					spend: 1200,
					impressions: 180000,
					clicks: 1800,
					detailPageViews: 720,
					purchases: 36,
					sales: 1800,
					returnOnAdSpend: 1.5,
					clickThroughRate: 1.0,
					conversionRate: 5.0,
					efficiency: { score: 35, rank: "POOR" },
				},
			];

			setCampaigns(mockCampaigns);

			// Mock cross-channel insights
			const mockCrossChannel: CrossChannelInsights = {
				totalCampaigns: 4,
				totalSpend: 8700,
				totalSales: 30540,
				overallROAS: 3.51,
				channelBreakdown: [
					{
						channel: "Search",
						spend: 2500,
						sales: 14100,
						roas: 5.64,
						contribution: 46.2,
					},
					{
						channel: "Video",
						spend: 3200,
						sales: 9240,
						roas: 2.89,
						contribution: 30.3,
					},
					{
						channel: "Display",
						spend: 1800,
						sales: 5400,
						roas: 3.0,
						contribution: 17.7,
					},
					{
						channel: "Influencer",
						spend: 1200,
						sales: 1800,
						roas: 1.5,
						contribution: 5.9,
					},
				],
				bestPerformingChannels: ["Search", "Display"],
				recommendations: [
					{
						type: "BUDGET_SHIFT",
						priority: "HIGH",
						description:
							"Increase Search budget by 25% due to superior ROAS of 5.64x",
						expectedImpact: 18,
					},
					{
						type: "CHANNEL_OPTIMIZATION",
						priority: "MEDIUM",
						description: "Optimize Video creative assets to improve 2.89x ROAS",
						expectedImpact: 12,
					},
					{
						type: "PAUSE_UNDERPERFORMER",
						priority: "HIGH",
						description:
							"Consider pausing Influencer campaign (1.5x ROAS below target)",
						expectedImpact: -15,
					},
				],
				customerJourneyInsights: {
					averagePathLength: 2.8,
					averageTimeLag: 48,
					topConversionPaths: [
						"Search → Purchase",
						"Video → Search → Purchase",
						"Display → Search → Purchase",
					],
				},
			};

			setCrossChannelData(mockCrossChannel);
		} catch (error) {
			console.error("Failed to load attribution data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDashboardData();
	}, [loadDashboardData]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-green-100 text-green-800";
			case "PAUSED":
				return "bg-yellow-100 text-yellow-800";
			case "ARCHIVED":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-blue-100 text-blue-800";
		}
	};

	const getEfficiencyColor = (rank: string) => {
		switch (rank) {
			case "EXCELLENT":
				return "text-green-600";
			case "GOOD":
				return "text-blue-600";
			case "AVERAGE":
				return "text-yellow-600";
			case "POOR":
				return "text-red-600";
			default:
				return "text-gray-600";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "HIGH":
				return "bg-red-100 text-red-800";
			case "MEDIUM":
				return "bg-yellow-100 text-yellow-800";
			case "LOW":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="container mx-auto space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-3xl tracking-tight">
						<Activity className="h-8 w-8 text-primary" />
						Attribution Analytics
					</h1>
					<p className="text-muted-foreground">
						Track off-Amazon marketing campaigns and their impact on Amazon
						sales
					</p>
				</div>

				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<Label htmlFor="startDate">From</Label>
						<Input
							id="startDate"
							type="date"
							value={dateRange.startDate}
							onChange={(e) =>
								setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
							}
							className="w-40"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Label htmlFor="endDate">To</Label>
						<Input
							id="endDate"
							type="date"
							value={dateRange.endDate}
							onChange={(e) =>
								setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
							}
							className="w-40"
						/>
					</div>

					<Button onClick={loadDashboardData} disabled={loading}>
						{loading ? (
							<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="mr-2 h-4 w-4" />
						)}
						Refresh
					</Button>
				</div>
			</div>

			{/* Summary Cards */}
			{crossChannelData && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Total Spend</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								${crossChannelData.totalSpend.toLocaleString()}
							</div>
							<p className="text-muted-foreground text-xs">
								Across {crossChannelData.totalCampaigns} campaigns
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Attributed Sales
							</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								${crossChannelData.totalSales.toLocaleString()}
							</div>
							<p className="text-muted-foreground text-xs">
								Revenue attributed to campaigns
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Overall ROAS
							</CardTitle>
							<Target className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{crossChannelData.overallROAS.toFixed(2)}x
							</div>
							<p className="text-muted-foreground text-xs">
								Return on advertising spend
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Journey Length
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{crossChannelData.customerJourneyInsights.averagePathLength}
							</div>
							<p className="text-muted-foreground text-xs">
								Avg touchpoints to conversion
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			<Tabs defaultValue="campaigns" className="space-y-4">
				<TabsList>
					<TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
					<TabsTrigger value="channels">Cross-Channel Analysis</TabsTrigger>
					<TabsTrigger value="journey">Customer Journey</TabsTrigger>
				</TabsList>

				<TabsContent value="campaigns" className="space-y-4">
					{/* Campaign Performance Table */}
					<Card>
						<CardHeader>
							<CardTitle>Campaign Performance</CardTitle>
							<CardDescription>
								Performance metrics for all attribution campaigns
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{campaigns.map((campaign) => (
									<div
										key={campaign.campaignId}
										className="rounded-lg border p-4"
									>
										<div className="mb-3 flex items-center justify-between">
											<div className="flex items-center gap-3">
												<h3 className="font-semibold">
													{campaign.campaignName}
												</h3>
												<Badge className={getStatusColor(campaign.status)}>
													{campaign.status}
												</Badge>
												<Badge variant="outline">{campaign.campaignType}</Badge>
											</div>
											<div
												className={`font-medium text-sm ${getEfficiencyColor(campaign.efficiency.rank)}`}
											>
												{campaign.efficiency.rank} ({campaign.efficiency.score}
												/100)
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4 lg:grid-cols-7">
											<div>
												<div className="text-muted-foreground">Spend</div>
												<div className="font-medium">
													${campaign.spend.toLocaleString()}
												</div>
											</div>
											<div>
												<div className="text-muted-foreground">Impressions</div>
												<div className="font-medium">
													{campaign.impressions.toLocaleString()}
												</div>
											</div>
											<div>
												<div className="text-muted-foreground">Clicks</div>
												<div className="font-medium">
													{campaign.clicks.toLocaleString()}
												</div>
											</div>
											<div>
												<div className="text-muted-foreground">DPVs</div>
												<div className="font-medium">
													{campaign.detailPageViews.toLocaleString()}
												</div>
											</div>
											<div>
												<div className="text-muted-foreground">Purchases</div>
												<div className="font-medium">{campaign.purchases}</div>
											</div>
											<div>
												<div className="text-muted-foreground">Sales</div>
												<div className="font-medium">
													${campaign.sales.toLocaleString()}
												</div>
											</div>
											<div>
												<div className="text-muted-foreground">ROAS</div>
												<div className="font-medium text-green-600">
													{campaign.returnOnAdSpend.toFixed(2)}x
												</div>
											</div>
										</div>

										<div className="mt-3 flex items-center justify-between border-t pt-3">
											<div className="flex items-center gap-4 text-muted-foreground text-sm">
												<span>
													CTR: {campaign.clickThroughRate.toFixed(1)}%
												</span>
												<span>CVR: {campaign.conversionRate.toFixed(1)}%</span>
											</div>
											<Button variant="outline" size="sm">
												View Details
												<ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="channels" className="space-y-4">
					{crossChannelData && (
						<>
							{/* Channel Breakdown */}
							<Card>
								<CardHeader>
									<CardTitle>Channel Performance Breakdown</CardTitle>
									<CardDescription>
										Performance by advertising channel
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{crossChannelData.channelBreakdown.map((channel) => (
											<div
												key={channel.channel}
												className="flex items-center justify-between rounded-lg border p-3"
											>
												<div className="flex items-center gap-3">
													<div className="font-medium">{channel.channel}</div>
													{crossChannelData.bestPerformingChannels.includes(
														channel.channel,
													) && (
														<Badge className="bg-green-100 text-green-800">
															Top Performer
														</Badge>
													)}
												</div>
												<div className="flex items-center gap-6 text-sm">
													<div>
														<div className="text-muted-foreground">Spend</div>
														<div className="font-medium">
															${channel.spend.toLocaleString()}
														</div>
													</div>
													<div>
														<div className="text-muted-foreground">Sales</div>
														<div className="font-medium">
															${channel.sales.toLocaleString()}
														</div>
													</div>
													<div>
														<div className="text-muted-foreground">ROAS</div>
														<div className="font-medium text-green-600">
															{channel.roas.toFixed(2)}x
														</div>
													</div>
													<div>
														<div className="text-muted-foreground">Share</div>
														<div className="font-medium">
															{channel.contribution.toFixed(1)}%
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							{/* Recommendations */}
							<Card>
								<CardHeader>
									<CardTitle>Optimization Recommendations</CardTitle>
									<CardDescription>
										AI-powered suggestions to improve cross-channel performance
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{crossChannelData.recommendations.map((rec, index) => (
											<div
												key={index}
												className="flex items-start gap-3 rounded-lg border p-3"
											>
												<Zap className="mt-0.5 h-5 w-5 text-yellow-500" />
												<div className="flex-1">
													<div className="mb-1 flex items-center gap-2">
														<Badge className={getPriorityColor(rec.priority)}>
															{rec.priority}
														</Badge>
														<span className="text-muted-foreground text-sm">
															{rec.type.replace("_", " ")}
														</span>
													</div>
													<p className="text-sm">{rec.description}</p>
													<div className="mt-1 text-muted-foreground text-xs">
														Expected impact: {rec.expectedImpact > 0 ? "+" : ""}
														{rec.expectedImpact}% performance change
													</div>
												</div>
												<Button variant="outline" size="sm">
													Apply
												</Button>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</>
					)}
				</TabsContent>

				<TabsContent value="journey" className="space-y-4">
					{crossChannelData && (
						<>
							{/* Customer Journey Insights */}
							<div className="grid gap-4 md:grid-cols-3">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="font-medium text-sm">
											Avg Path Length
										</CardTitle>
										<Activity className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="font-bold text-2xl">
											{
												crossChannelData.customerJourneyInsights
													.averagePathLength
											}
										</div>
										<p className="text-muted-foreground text-xs">
											Touchpoints before purchase
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="font-medium text-sm">
											Time to Convert
										</CardTitle>
										<Calendar className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="font-bold text-2xl">
											{crossChannelData.customerJourneyInsights.averageTimeLag}h
										</div>
										<p className="text-muted-foreground text-xs">
											Average time lag
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="font-medium text-sm">
											Top Paths
										</CardTitle>
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="font-bold text-2xl">
											{
												crossChannelData.customerJourneyInsights
													.topConversionPaths.length
											}
										</div>
										<p className="text-muted-foreground text-xs">
											Conversion paths identified
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Top Conversion Paths */}
							<Card>
								<CardHeader>
									<CardTitle>Top Conversion Paths</CardTitle>
									<CardDescription>
										Most common customer journeys leading to purchase
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{crossChannelData.customerJourneyInsights.topConversionPaths.map(
											(path, index) => (
												<div
													key={index}
													className="flex items-center gap-3 rounded-lg border p-3"
												>
													<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
														{index + 1}
													</div>
													<div className="flex-1 font-medium">{path}</div>
													<div className="text-muted-foreground text-sm">
														{Math.round(Math.random() * 20 + 10)}% of
														conversions
													</div>
												</div>
											),
										)}
									</div>
								</CardContent>
							</Card>
						</>
					)}
				</TabsContent>
			</Tabs>

			{/* Empty State */}
			{campaigns.length === 0 && !loading && (
				<div className="py-12 text-center">
					<Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="mb-2 font-semibold text-lg">
						No Attribution Data Available
					</h3>
					<p className="mb-4 text-muted-foreground">
						Set up attribution campaigns to track off-Amazon marketing
						performance
					</p>
					<Button>Create Attribution Campaign</Button>
				</div>
			)}
		</div>
	);
}
