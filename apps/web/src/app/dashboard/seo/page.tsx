/**
 * SEO Dashboard
 * Comprehensive SEO monitoring and insights dashboard
 */

"use client";

import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	BarChart3,
	CheckCircle,
	Clock,
	Download,
	Eye,
	Globe,
	Lightbulb,
	Minus,
	Monitor,
	Plus,
	Search,
	Settings,
	Shield,
	Smartphone,
	Target,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data - in real app, this would come from your SEO API
const mockSEOOverview = {
	overallScore: 78,
	previousScore: 74,
	totalPages: 45,
	indexedPages: 42,
	totalKeywords: 127,
	averagePosition: 15.2,
	organicTraffic: 12847,
	technicalIssues: 8,
	contentOpportunities: 12,
	backlinkOpportunities: 6,
};

const mockKeywordData = [
	{
		keyword: "amazon optimization",
		position: 12,
		previousPosition: 15,
		searchVolume: 2400,
		difficulty: 65,
		url: "/features/optimization",
		trend: "up",
	},
	{
		keyword: "amazon seller tools",
		position: 8,
		previousPosition: 8,
		searchVolume: 1800,
		difficulty: 58,
		url: "/features",
		trend: "stable",
	},
	{
		keyword: "amazon analytics platform",
		position: 15,
		previousPosition: 12,
		searchVolume: 1200,
		difficulty: 72,
		url: "/",
		trend: "down",
	},
	{
		keyword: "amazon competitor analysis",
		position: 11,
		previousPosition: 18,
		searchVolume: 950,
		difficulty: 68,
		url: "/features/competitor-analysis",
		trend: "up",
	},
	{
		keyword: "amazon keyword tracking",
		position: 6,
		previousPosition: 9,
		searchVolume: 880,
		difficulty: 55,
		url: "/features/keyword-tracking",
		trend: "up",
	},
];

const mockRankingTrends = [
	{ date: "2025-06-01", avgPosition: 18.2, keywords: 115 },
	{ date: "2025-06-08", avgPosition: 17.8, keywords: 118 },
	{ date: "2025-06-15", avgPosition: 16.9, keywords: 122 },
	{ date: "2025-06-22", avgPosition: 15.8, keywords: 125 },
	{ date: "2025-06-29", avgPosition: 15.2, keywords: 127 },
];

const mockTechnicalIssues = [
	{
		id: "1",
		type: "error",
		category: "meta",
		title: "Missing Meta Descriptions",
		description: "3 pages are missing meta descriptions",
		pages: 3,
		impact: "medium",
		priority: 7,
	},
	{
		id: "2",
		type: "warning",
		category: "performance",
		title: "Slow Loading Pages",
		description: "2 pages have load times over 3 seconds",
		pages: 2,
		impact: "high",
		priority: 9,
	},
	{
		id: "3",
		type: "warning",
		category: "mobile",
		title: "Mobile Optimization Issues",
		description: "1 page has mobile usability problems",
		pages: 1,
		impact: "medium",
		priority: 6,
	},
	{
		id: "4",
		type: "info",
		category: "content",
		title: "Thin Content",
		description: "2 pages have less than 300 words",
		pages: 2,
		impact: "low",
		priority: 4,
	},
];

const mockContentOpportunities = [
	{
		id: "1",
		type: "keyword",
		title: 'Target "Amazon PPC Optimization"',
		description: "High-value keyword with 3,200 monthly searches",
		estimatedTraffic: 150,
		difficulty: 65,
		timeToResult: 45,
		status: "new",
	},
	{
		id: "2",
		type: "content",
		title: "Expand Amazon Seller Guide",
		description: "Current guide is 500 words, expand to 1,500+",
		estimatedTraffic: 200,
		difficulty: 40,
		timeToResult: 30,
		status: "in_progress",
	},
	{
		id: "3",
		type: "technical",
		title: "Implement Schema Markup",
		description: "Add structured data for better SERP features",
		estimatedTraffic: 75,
		difficulty: 30,
		timeToResult: 14,
		status: "new",
	},
	{
		id: "4",
		type: "backlink",
		title: "Guest Post on Amazon Blogs",
		description: "Target high-authority Amazon seller blogs",
		estimatedTraffic: 100,
		difficulty: 70,
		timeToResult: 60,
		status: "new",
	},
];

const mockPagePerformance = [
	{
		url: "/",
		title: "Ignitabull - AI-Powered Amazon Optimization",
		seoScore: 85,
		traffic: 3245,
		keywords: 12,
		issues: 1,
		loadTime: 1.8,
	},
	{
		url: "/features",
		title: "Features - Amazon Optimization Tools",
		seoScore: 78,
		traffic: 1987,
		keywords: 8,
		issues: 2,
		loadTime: 2.1,
	},
	{
		url: "/pricing",
		title: "Pricing Plans for Amazon Sellers",
		seoScore: 75,
		traffic: 1654,
		keywords: 6,
		issues: 1,
		loadTime: 1.9,
	},
	{
		url: "/blog",
		title: "Amazon Seller Blog and Guides",
		seoScore: 82,
		traffic: 2134,
		keywords: 15,
		issues: 0,
		loadTime: 1.6,
	},
	{
		url: "/contact",
		title: "Contact Ignitabull Support",
		seoScore: 68,
		traffic: 543,
		keywords: 3,
		issues: 3,
		loadTime: 2.4,
	},
];

const mockCoreWebVitals = {
	lcp: 2.1, // Largest Contentful Paint
	fid: 85, // First Input Delay
	cls: 0.08, // Cumulative Layout Shift
	grade: "good" as const,
};

const _COLORS = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe"];

function getTrendIcon(trend: string) {
	switch (trend) {
		case "up":
			return <ArrowUpRight className="h-4 w-4 text-green-500" />;
		case "down":
			return <ArrowDownRight className="h-4 w-4 text-red-500" />;
		default:
			return <Minus className="h-4 w-4 text-gray-400" />;
	}
}

function getIssueIcon(type: string) {
	switch (type) {
		case "error":
			return <AlertTriangle className="h-4 w-4 text-red-500" />;
		case "warning":
			return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
		default:
			return <AlertTriangle className="h-4 w-4 text-blue-500" />;
	}
}

function getImpactColor(impact: string): string {
	switch (impact) {
		case "high":
			return "bg-red-100 text-red-800";
		case "medium":
			return "bg-yellow-100 text-yellow-800";
		case "low":
			return "bg-green-100 text-green-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function getStatusColor(status: string): string {
	switch (status) {
		case "new":
			return "bg-blue-100 text-blue-800";
		case "in_progress":
			return "bg-yellow-100 text-yellow-800";
		case "completed":
			return "bg-green-100 text-green-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function getDifficultyColor(difficulty: number): string {
	if (difficulty >= 70) return "text-red-600";
	if (difficulty >= 50) return "text-yellow-600";
	return "text-green-600";
}

function getCoreWebVitalGrade(
	metric: string,
	value: number,
): { grade: string; color: string } {
	switch (metric) {
		case "lcp":
			if (value <= 2.5) return { grade: "Good", color: "text-green-600" };
			if (value <= 4.0)
				return { grade: "Needs Improvement", color: "text-yellow-600" };
			return { grade: "Poor", color: "text-red-600" };
		case "fid":
			if (value <= 100) return { grade: "Good", color: "text-green-600" };
			if (value <= 300)
				return { grade: "Needs Improvement", color: "text-yellow-600" };
			return { grade: "Poor", color: "text-red-600" };
		case "cls":
			if (value <= 0.1) return { grade: "Good", color: "text-green-600" };
			if (value <= 0.25)
				return { grade: "Needs Improvement", color: "text-yellow-600" };
			return { grade: "Poor", color: "text-red-600" };
		default:
			return { grade: "Unknown", color: "text-gray-600" };
	}
}

export default function SEODashboard() {
	const [activeTab, setActiveTab] = useState("overview");
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">SEO Dashboard</h1>
					<p className="text-muted-foreground">
						Monitor your website's search performance and optimization
						opportunities
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Add Keywords
					</Button>
					<Button variant="outline" size="sm">
						<Download className="mr-2 h-4 w-4" />
						Export Report
					</Button>
					<Button variant="outline" size="sm">
						<Settings className="mr-2 h-4 w-4" />
						Configure
					</Button>
				</div>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									SEO Score
								</p>
								<div className="flex items-center gap-2">
									<p className="font-bold text-2xl">
										{mockSEOOverview.overallScore}
									</p>
									<Badge variant="secondary" className="text-green-600">
										+
										{mockSEOOverview.overallScore -
											mockSEOOverview.previousScore}
									</Badge>
								</div>
								<Progress
									value={mockSEOOverview.overallScore}
									className="mt-2"
								/>
							</div>
							<Target className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Avg. Position
								</p>
								<p className="font-bold text-2xl">
									{mockSEOOverview.averagePosition}
								</p>
								<p className="mt-1 flex items-center text-green-600 text-xs">
									<TrendingUp className="mr-1 h-3 w-3" />
									Improved by 2.3 positions
								</p>
							</div>
							<BarChart3 className="h-8 w-8 text-purple-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Organic Traffic
								</p>
								<p className="font-bold text-2xl">
									{mockSEOOverview.organicTraffic.toLocaleString()}
								</p>
								<p className="mt-1 flex items-center text-green-600 text-xs">
									<TrendingUp className="mr-1 h-3 w-3" />
									+18.5% this month
								</p>
							</div>
							<Users className="h-8 w-8 text-green-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Total Keywords
								</p>
								<p className="font-bold text-2xl">
									{mockSEOOverview.totalKeywords}
								</p>
								<p className="mt-1 flex items-center text-blue-600 text-xs">
									<Plus className="mr-1 h-3 w-3" />5 new this week
								</p>
							</div>
							<Search className="h-8 w-8 text-orange-600" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-4"
			>
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="keywords">Keywords</TabsTrigger>
					<TabsTrigger value="technical">Technical SEO</TabsTrigger>
					<TabsTrigger value="content">Content</TabsTrigger>
					<TabsTrigger value="performance">Performance</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{/* Ranking Trends */}
						<Card>
							<CardHeader>
								<CardTitle>Ranking Trends</CardTitle>
								<CardDescription>
									Average keyword position over time
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={mockRankingTrends}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" />
										<YAxis domain={["dataMin - 2", "dataMax + 2"]} />
										<Tooltip />
										<Line
											type="monotone"
											dataKey="avgPosition"
											stroke="#667eea"
											strokeWidth={2}
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Core Web Vitals */}
						<Card>
							<CardHeader>
								<CardTitle>Core Web Vitals</CardTitle>
								<CardDescription>
									Essential user experience metrics
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">Largest Contentful Paint</p>
											<p className="text-muted-foreground text-sm">
												{mockCoreWebVitals.lcp}s
											</p>
										</div>
										<Badge
											className={
												getCoreWebVitalGrade("lcp", mockCoreWebVitals.lcp).color
											}
										>
											{getCoreWebVitalGrade("lcp", mockCoreWebVitals.lcp).grade}
										</Badge>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">First Input Delay</p>
											<p className="text-muted-foreground text-sm">
												{mockCoreWebVitals.fid}ms
											</p>
										</div>
										<Badge
											className={
												getCoreWebVitalGrade("fid", mockCoreWebVitals.fid).color
											}
										>
											{getCoreWebVitalGrade("fid", mockCoreWebVitals.fid).grade}
										</Badge>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">Cumulative Layout Shift</p>
											<p className="text-muted-foreground text-sm">
												{mockCoreWebVitals.cls}
											</p>
										</div>
										<Badge
											className={
												getCoreWebVitalGrade("cls", mockCoreWebVitals.cls).color
											}
										>
											{getCoreWebVitalGrade("cls", mockCoreWebVitals.cls).grade}
										</Badge>
									</div>

									<div className="mt-4 rounded-lg bg-green-50 p-4">
										<div className="flex items-center gap-2">
											<CheckCircle className="h-5 w-5 text-green-600" />
											<span className="font-medium text-green-900">
												Overall Grade: Good
											</span>
										</div>
										<p className="mt-1 text-green-700 text-sm">
											Your site meets Core Web Vitals thresholds for good user
											experience.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Technical Issues Summary */}
						<Card>
							<CardHeader>
								<CardTitle>Technical Issues</CardTitle>
								<CardDescription>Issues that need attention</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{mockTechnicalIssues.slice(0, 4).map((issue) => (
										<div
											key={issue.id}
											className="flex items-center justify-between"
										>
											<div className="flex items-center gap-3">
												{getIssueIcon(issue.type)}
												<div>
													<p className="font-medium text-sm">{issue.title}</p>
													<p className="text-muted-foreground text-sm">
														{issue.pages} pages affected
													</p>
												</div>
											</div>
											<Badge className={getImpactColor(issue.impact)}>
												{issue.impact}
											</Badge>
										</div>
									))}
									<Button variant="outline" className="mt-4 w-full">
										View All Issues
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Content Opportunities */}
						<Card>
							<CardHeader>
								<CardTitle>Content Opportunities</CardTitle>
								<CardDescription>
									Growth opportunities identified
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{mockContentOpportunities.slice(0, 3).map((opportunity) => (
										<div key={opportunity.id} className="rounded-lg border p-4">
											<div className="mb-2 flex items-center justify-between">
												<h4 className="font-medium">{opportunity.title}</h4>
												<Badge className={getStatusColor(opportunity.status)}>
													{opportunity.status.replace("_", " ")}
												</Badge>
											</div>
											<p className="mb-2 text-muted-foreground text-sm">
												{opportunity.description}
											</p>
											<div className="flex items-center gap-4 text-sm">
												<span className="flex items-center gap-1">
													<TrendingUp className="h-3 w-3" />+
													{opportunity.estimatedTraffic} traffic
												</span>
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{opportunity.timeToResult} days
												</span>
												<span
													className={`font-medium ${getDifficultyColor(opportunity.difficulty)}`}
												>
													{opportunity.difficulty}% difficulty
												</span>
											</div>
										</div>
									))}
									<Button variant="outline" className="w-full">
										View All Opportunities
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="keywords" className="space-y-4">
					<div className="mb-4 flex items-center gap-4">
						<div className="relative max-w-sm flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input
								placeholder="Search keywords..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Keywords
						</Button>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Keyword Rankings</CardTitle>
							<CardDescription>
								Track your keyword performance and trends
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockKeywordData.map((keyword, index) => (
									<div
										key={index}
										className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<h4 className="font-medium">{keyword.keyword}</h4>
												{getTrendIcon(keyword.trend)}
											</div>
											<p className="text-muted-foreground text-sm">
												{keyword.url}
											</p>
										</div>

										<div className="flex items-center gap-6 text-sm">
											<div className="text-center">
												<p className="font-medium">{keyword.position}</p>
												<p className="text-muted-foreground">Position</p>
											</div>

											<div className="text-center">
												<p className="font-medium">
													{keyword.searchVolume.toLocaleString()}
												</p>
												<p className="text-muted-foreground">Volume</p>
											</div>

											<div className="text-center">
												<p
													className={`font-medium ${getDifficultyColor(keyword.difficulty)}`}
												>
													{keyword.difficulty}%
												</p>
												<p className="text-muted-foreground">Difficulty</p>
											</div>

											<div className="text-center">
												<p
													className={
														keyword.trend === "up"
															? "text-green-600"
															: keyword.trend === "down"
																? "text-red-600"
																: "text-gray-600"
													}
												>
													{keyword.previousPosition > keyword.position
														? `+${keyword.previousPosition - keyword.position}`
														: keyword.previousPosition < keyword.position
															? `-${keyword.position - keyword.previousPosition}`
															: "0"}
												</p>
												<p className="text-muted-foreground">Change</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="technical" className="space-y-4">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Technical Issues</CardTitle>
								<CardDescription>
									Critical technical SEO problems
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{mockTechnicalIssues.map((issue) => (
										<div
											key={issue.id}
											className="flex items-start gap-3 rounded-lg border p-4"
										>
											{getIssueIcon(issue.type)}
											<div className="flex-1">
												<div className="mb-1 flex items-center justify-between">
													<h4 className="font-medium">{issue.title}</h4>
													<Badge className={getImpactColor(issue.impact)}>
														{issue.impact}
													</Badge>
												</div>
												<p className="mb-2 text-muted-foreground text-sm">
													{issue.description}
												</p>
												<div className="flex items-center gap-4 text-sm">
													<span>{issue.pages} pages</span>
													<span>Priority: {issue.priority}/10</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Technical Health</CardTitle>
								<CardDescription>Overall technical SEO status</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Globe className="h-5 w-5 text-green-600" />
											<span>HTTPS Enabled</span>
										</div>
										<CheckCircle className="h-5 w-5 text-green-600" />
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Smartphone className="h-5 w-5 text-green-600" />
											<span>Mobile Friendly</span>
										</div>
										<CheckCircle className="h-5 w-5 text-green-600" />
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Monitor className="h-5 w-5 text-yellow-600" />
											<span>Page Speed</span>
										</div>
										<AlertTriangle className="h-5 w-5 text-yellow-600" />
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Shield className="h-5 w-5 text-green-600" />
											<span>Security Headers</span>
										</div>
										<CheckCircle className="h-5 w-5 text-green-600" />
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Search className="h-5 w-5 text-green-600" />
											<span>XML Sitemap</span>
										</div>
										<CheckCircle className="h-5 w-5 text-green-600" />
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Eye className="h-5 w-5 text-green-600" />
											<span>Robots.txt</span>
										</div>
										<CheckCircle className="h-5 w-5 text-green-600" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="content" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Content Opportunities</CardTitle>
							<CardDescription>
								Improve your content for better rankings
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockContentOpportunities.map((opportunity) => (
									<div key={opportunity.id} className="rounded-lg border p-4">
										<div className="mb-3 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Lightbulb className="h-5 w-5 text-yellow-500" />
												<h4 className="font-medium">{opportunity.title}</h4>
											</div>
											<Badge className={getStatusColor(opportunity.status)}>
												{opportunity.status.replace("_", " ")}
											</Badge>
										</div>

										<p className="mb-3 text-muted-foreground text-sm">
											{opportunity.description}
										</p>

										<div className="grid grid-cols-3 gap-4 text-sm">
											<div>
												<p className="font-medium text-green-600">
													+{opportunity.estimatedTraffic}
												</p>
												<p className="text-muted-foreground">Est. Traffic</p>
											</div>
											<div>
												<p
													className={`font-medium ${getDifficultyColor(opportunity.difficulty)}`}
												>
													{opportunity.difficulty}%
												</p>
												<p className="text-muted-foreground">Difficulty</p>
											</div>
											<div>
												<p className="font-medium">
													{opportunity.timeToResult} days
												</p>
												<p className="text-muted-foreground">Time to Result</p>
											</div>
										</div>

										<div className="mt-4 flex gap-2">
											<Button variant="outline" size="sm">
												View Details
											</Button>
											{opportunity.status === "new" && (
												<Button size="sm">Start Working</Button>
											)}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="performance" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Page Performance</CardTitle>
							<CardDescription>
								SEO performance by individual pages
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockPagePerformance.map((page, index) => (
									<div
										key={index}
										className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
									>
										<div className="flex-1">
											<h4 className="font-medium">{page.title}</h4>
											<p className="text-muted-foreground text-sm">
												{page.url}
											</p>
										</div>

										<div className="flex items-center gap-6 text-sm">
											<div className="text-center">
												<div className="flex items-center gap-2">
													<span className="font-medium">{page.seoScore}</span>
													<Progress value={page.seoScore} className="w-16" />
												</div>
												<p className="mt-1 text-muted-foreground">SEO Score</p>
											</div>

											<div className="text-center">
												<p className="font-medium">
													{page.traffic.toLocaleString()}
												</p>
												<p className="text-muted-foreground">Traffic</p>
											</div>

											<div className="text-center">
												<p className="font-medium">{page.keywords}</p>
												<p className="text-muted-foreground">Keywords</p>
											</div>

											<div className="text-center">
												<p
													className={`font-medium ${page.issues > 0 ? "text-red-600" : "text-green-600"}`}
												>
													{page.issues}
												</p>
												<p className="text-muted-foreground">Issues</p>
											</div>

											<div className="text-center">
												<p
													className={`font-medium ${
														page.loadTime < 2
															? "text-green-600"
															: page.loadTime < 3
																? "text-yellow-600"
																: "text-red-600"
													}`}
												>
													{page.loadTime}s
												</p>
												<p className="text-muted-foreground">Load Time</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
