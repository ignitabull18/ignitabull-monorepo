"use client";

import {
	AlertTriangle,
	ArrowRight,
	BarChart3,
	Brain,
	DollarSign,
	Eye,
	Lightbulb,
	RefreshCw,
	Sparkles,
	Target,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
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

// Mock data types matching our AI engine
interface AIInsight {
	id: string;
	type:
		| "OPPORTUNITY"
		| "RISK"
		| "TREND"
		| "ANOMALY"
		| "RECOMMENDATION"
		| "PREDICTION";
	category: string;
	priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
	title: string;
	description: string;
	impact: {
		metric: string;
		currentValue: number;
		potentialValue: number;
		percentageChange: number;
	};
	evidence: {
		dataPoints: Array<{
			source: string;
			metric: string;
			value: string | number;
		}>;
		confidence: number;
	};
	recommendations: Array<{
		action: string;
		expectedResult: string;
		effort: "LOW" | "MEDIUM" | "HIGH";
		timeframe: string;
	}>;
	relatedASINs: string[];
	createdAt: string;
}

interface MarketOpportunity {
	opportunityType: string;
	marketSize: number;
	competitionLevel: "LOW" | "MEDIUM" | "HIGH";
	profitPotential: number;
	timeToMarket: string;
	actionPlan: Array<{
		step: number;
		action: string;
		timeline: string;
	}>;
}

export default function AIInsightsDashboard() {
	const [asin, setAsin] = useState("");
	const [marketplace, setMarketplace] = useState("ATVPDKIKX0DER");
	const [loading, setLoading] = useState(false);
	const [insights, setInsights] = useState<AIInsight[]>([]);
	const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const generateInsights = async () => {
		if (!asin) return;

		setLoading(true);
		try {
			// Mock AI insights data
			const mockInsights: AIInsight[] = [
				{
					id: "1",
					type: "OPPORTUNITY",
					category: "SEARCH_PERFORMANCE",
					priority: "HIGH",
					title: "Low CTR on High-Traffic Keywords",
					description:
						"3 keywords are generating significant impressions but low clicks",
					impact: {
						metric: "clicks",
						currentValue: 150,
						potentialValue: 450,
						percentageChange: 200,
					},
					evidence: {
						dataPoints: [
							{
								source: "search_performance",
								metric: "ctr",
								value: "bluetooth headphones: 0.5%",
							},
							{
								source: "search_performance",
								metric: "impressions",
								value: 15000,
							},
						],
						confidence: 0.9,
					},
					recommendations: [
						{
							action: "Optimize title to include keywords prominently",
							expectedResult: "Increase CTR by 2-3x",
							effort: "LOW",
							timeframe: "1-2 days",
						},
						{
							action: "Test new main image with keyword relevance",
							expectedResult: "Improve visual appeal",
							effort: "MEDIUM",
							timeframe: "1 week",
						},
					],
					relatedASINs: [asin],
					createdAt: new Date().toISOString(),
				},
				{
					id: "2",
					type: "TREND",
					category: "MARKET_TRENDS",
					priority: "MEDIUM",
					title: "Emerging Keyword Opportunities",
					description: "New search trends detected in your category",
					impact: {
						metric: "market_share",
						currentValue: 5,
						potentialValue: 12,
						percentageChange: 140,
					},
					evidence: {
						dataPoints: [
							{
								source: "trend_analysis",
								metric: "search_growth",
								value: "+45% monthly",
							},
							{ source: "competition", metric: "difficulty", value: "LOW" },
						],
						confidence: 0.8,
					},
					recommendations: [
						{
							action: "Create content targeting emerging keywords",
							expectedResult: "Capture early market share",
							effort: "MEDIUM",
							timeframe: "2-3 weeks",
						},
					],
					relatedASINs: [asin],
					createdAt: new Date().toISOString(),
				},
				{
					id: "3",
					type: "RISK",
					category: "COMPETITOR_ACTIVITY",
					priority: "HIGH",
					title: "Competitor Price War Detected",
					description: "2 major competitors have reduced prices by 15-20%",
					impact: {
						metric: "sales",
						currentValue: 1000,
						potentialValue: 700,
						percentageChange: -30,
					},
					evidence: {
						dataPoints: [
							{
								source: "price_monitoring",
								metric: "competitor_price",
								value: "$79.99 → $64.99",
							},
							{ source: "market_share", metric: "share_loss", value: "-3%" },
						],
						confidence: 0.95,
					},
					recommendations: [
						{
							action: "Implement dynamic pricing strategy",
							expectedResult: "Maintain competitive position",
							effort: "LOW",
							timeframe: "Immediate",
						},
						{
							action: "Enhance value proposition messaging",
							expectedResult: "Justify premium pricing",
							effort: "MEDIUM",
							timeframe: "1 week",
						},
					],
					relatedASINs: [asin],
					createdAt: new Date().toISOString(),
				},
				{
					id: "4",
					type: "RECOMMENDATION",
					category: "LISTING_OPTIMIZATION",
					priority: "MEDIUM",
					title: "Listing Quality Score Below Optimal",
					description:
						"Your listing scores 68/100, with title optimization being the weakest area",
					impact: {
						metric: "conversion_rate",
						currentValue: 5.2,
						potentialValue: 7.8,
						percentageChange: 50,
					},
					evidence: {
						dataPoints: [
							{
								source: "listing_analysis",
								metric: "title_score",
								value: "55/100",
							},
							{
								source: "category_benchmark",
								metric: "avg_score",
								value: "74/100",
							},
						],
						confidence: 0.85,
					},
					recommendations: [
						{
							action: 'Add "Wireless" and "Noise Cancelling" to title',
							expectedResult: "+25% visibility improvement",
							effort: "LOW",
							timeframe: "10 minutes",
						},
					],
					relatedASINs: [asin],
					createdAt: new Date().toISOString(),
				},
			];

			const mockOpportunities: MarketOpportunity[] = [
				{
					opportunityType: "UNTAPPED_KEYWORD",
					marketSize: 60000,
					competitionLevel: "LOW",
					profitPotential: 15000,
					timeToMarket: "2-4 weeks",
					actionPlan: [
						{
							step: 1,
							action: "Research and validate keyword opportunity",
							timeline: "3 days",
						},
						{
							step: 2,
							action: "Create optimized listing variation",
							timeline: "1 week",
						},
						{
							step: 3,
							action: "Launch targeted advertising campaign",
							timeline: "1 day",
						},
					],
				},
			];

			setInsights(mockInsights);
			setOpportunities(mockOpportunities);
		} catch (error) {
			console.error("Failed to generate insights:", error);
		} finally {
			setLoading(false);
		}
	};

	const getTypeIcon = (type: AIInsight["type"]) => {
		switch (type) {
			case "OPPORTUNITY":
				return <TrendingUp className="h-4 w-4 text-green-500" />;
			case "RISK":
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			case "TREND":
				return <BarChart3 className="h-4 w-4 text-blue-500" />;
			case "RECOMMENDATION":
				return <Lightbulb className="h-4 w-4 text-yellow-500" />;
			case "PREDICTION":
				return <Eye className="h-4 w-4 text-purple-500" />;
			default:
				return <Sparkles className="h-4 w-4 text-gray-500" />;
		}
	};

	const getPriorityColor = (priority: AIInsight["priority"]) => {
		switch (priority) {
			case "CRITICAL":
				return "bg-red-100 text-red-800";
			case "HIGH":
				return "bg-orange-100 text-orange-800";
			case "MEDIUM":
				return "bg-yellow-100 text-yellow-800";
			case "LOW":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const filteredInsights = selectedCategory
		? insights.filter((insight) => insight.category === selectedCategory)
		: insights;

	const categories = Array.from(new Set(insights.map((i) => i.category)));

	return (
		<div className="container mx-auto space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-3xl tracking-tight">
						<Brain className="h-8 w-8 text-primary" />
						AI-Powered Insights
					</h1>
					<p className="text-muted-foreground">
						Get intelligent recommendations and market insights powered by AI
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

					<Button onClick={generateInsights} disabled={loading || !asin}>
						{loading ? (
							<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Sparkles className="mr-2 h-4 w-4" />
						)}
						Generate Insights
					</Button>
				</div>
			</div>

			{/* Summary Cards */}
			{insights.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Insights
							</CardTitle>
							<Brain className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{insights.length}</div>
							<p className="text-muted-foreground text-xs">
								AI-generated recommendations
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								High Priority
							</CardTitle>
							<AlertTriangle className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{
									insights.filter(
										(i) => i.priority === "HIGH" || i.priority === "CRITICAL",
									).length
								}
							</div>
							<p className="text-muted-foreground text-xs">
								Require immediate attention
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Opportunities
							</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{insights.filter((i) => i.type === "OPPORTUNITY").length}
							</div>
							<p className="text-muted-foreground text-xs">
								Growth opportunities identified
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Potential Impact
							</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								+
								{Math.round(
									insights.reduce(
										(sum, i) => sum + i.impact.percentageChange,
										0,
									) / insights.length,
								)}
								%
							</div>
							<p className="text-muted-foreground text-xs">
								Average improvement potential
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Category Filter */}
			{categories.length > 0 && (
				<div className="flex flex-wrap gap-2">
					<Button
						variant={selectedCategory === null ? "default" : "outline"}
						size="sm"
						onClick={() => setSelectedCategory(null)}
					>
						All Categories
					</Button>
					{categories.map((category) => (
						<Button
							key={category}
							variant={selectedCategory === category ? "default" : "outline"}
							size="sm"
							onClick={() => setSelectedCategory(category)}
						>
							{category.replace(/_/g, " ")}
						</Button>
					))}
				</div>
			)}

			{/* Insights Grid */}
			<div className="grid gap-6 lg:grid-cols-2">
				{filteredInsights.map((insight) => (
					<Card key={insight.id} className="h-full">
						<CardHeader>
							<div className="flex items-start justify-between gap-2">
								<div className="flex items-center gap-2">
									{getTypeIcon(insight.type)}
									<CardTitle className="text-lg">{insight.title}</CardTitle>
								</div>
								<Badge className={getPriorityColor(insight.priority)}>
									{insight.priority}
								</Badge>
							</div>
							<CardDescription>{insight.description}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Impact Metrics */}
							<div className="rounded-lg bg-muted p-3">
								<div className="mb-2 font-medium text-sm">Expected Impact</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-sm">
										{insight.impact.metric}
									</span>
									<div className="text-right">
										<div className="font-semibold text-sm">
											{insight.impact.currentValue} →{" "}
											{insight.impact.potentialValue}
										</div>
										<div
											className={`text-xs ${
												insight.impact.percentageChange > 0
													? "text-green-600"
													: "text-red-600"
											}`}
										>
											{insight.impact.percentageChange > 0 ? "+" : ""}
											{insight.impact.percentageChange}%
										</div>
									</div>
								</div>
							</div>

							{/* Evidence */}
							<div>
								<div className="mb-2 font-medium text-sm">Evidence</div>
								<div className="space-y-1">
									{insight.evidence.dataPoints
										.slice(0, 2)
										.map((point, index) => (
											<div
												key={index}
												className="text-muted-foreground text-xs"
											>
												{point.metric}: {point.value}
											</div>
										))}
								</div>
								<div className="mt-1 text-muted-foreground text-xs">
									Confidence: {Math.round(insight.evidence.confidence * 100)}%
								</div>
							</div>

							{/* Recommendations */}
							<div>
								<div className="mb-2 font-medium text-sm">
									Recommended Actions
								</div>
								<div className="space-y-2">
									{insight.recommendations.slice(0, 2).map((rec, index) => (
										<div key={index} className="rounded border p-2 text-sm">
											<div className="font-medium">{rec.action}</div>
											<div className="mt-1 text-muted-foreground text-xs">
												{rec.expectedResult} • {rec.effort} effort •{" "}
												{rec.timeframe}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Action Button */}
							<Button className="w-full" variant="outline">
								View Details
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Market Opportunities */}
			{opportunities.length > 0 && (
				<div>
					<h2 className="mb-4 font-semibold text-2xl">Market Opportunities</h2>
					<div className="grid gap-4 md:grid-cols-2">
						{opportunities.map((opportunity, index) => (
							<Card key={index}>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Target className="h-5 w-5" />
										{opportunity.opportunityType.replace(/_/g, " ")}
									</CardTitle>
									<CardDescription>
										Market size: {opportunity.marketSize.toLocaleString()} •
										Competition: {opportunity.competitionLevel}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div className="flex justify-between text-sm">
											<span>Profit Potential:</span>
											<span className="font-semibold">
												${opportunity.profitPotential.toLocaleString()}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span>Time to Market:</span>
											<span className="font-semibold">
												{opportunity.timeToMarket}
											</span>
										</div>

										<div>
											<div className="mb-2 font-medium text-sm">
												Action Plan
											</div>
											<div className="space-y-2">
												{opportunity.actionPlan.map((step) => (
													<div
														key={step.step}
														className="flex items-start gap-2 text-sm"
													>
														<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
															{step.step}
														</div>
														<div className="flex-1">
															<div>{step.action}</div>
															<div className="text-muted-foreground text-xs">
																{step.timeline}
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}

			{/* Empty State */}
			{insights.length === 0 && !loading && (
				<div className="py-12 text-center">
					<Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="mb-2 font-semibold text-lg">
						No Insights Generated Yet
					</h3>
					<p className="mb-4 text-muted-foreground">
						Enter an ASIN and click "Generate Insights" to get AI-powered
						recommendations
					</p>
				</div>
			)}
		</div>
	);
}
