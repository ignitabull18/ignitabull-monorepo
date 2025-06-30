/**
 * Influencer Marketing Dashboard
 * Comprehensive CRM for managing influencer relationships and campaigns
 */

"use client";

import {
	Award,
	Calendar,
	Camera,
	Clock,
	DollarSign,
	Download,
	Eye,
	Facebook,
	FileText,
	Filter,
	Instagram,
	Mail,
	MessageCircle,
	Plus,
	Search,
	Settings,
	Star,
	Target,
	TrendingUp,
	Twitter,
	UserPlus,
	Users,
	XCircle,
	Youtube,
} from "lucide-react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data - in real app, this would come from your influencer API
const mockInfluencerOverview = {
	totalInfluencers: 127,
	activePartners: 34,
	activeCampaigns: 8,
	totalReach: 2500000,
	avgEngagementRate: 4.2,
	totalSpent: 85000,
	estimatedROI: 3.8,
	newInquiries: 12,
};

const mockInfluencers = [
	{
		id: "1",
		name: "Sarah Johnson",
		handle: "@sarahjohnson_beauty",
		email: "sarah@example.com",
		platforms: ["instagram", "tiktok"],
		category: "beauty",
		tier: "micro",
		followers: 45000,
		engagementRate: 4.8,
		location: "Los Angeles, CA",
		rate: 450,
		status: "partner",
		lastCampaign: "2025-06-15",
		relationshipScore: 85,
		tags: ["skincare", "makeup", "lifestyle"],
	},
	{
		id: "2",
		name: "Mike Chen",
		handle: "@mikechentech",
		email: "mike@example.com",
		platforms: ["youtube", "tiktok"],
		category: "tech",
		tier: "mid",
		followers: 125000,
		engagementRate: 3.9,
		location: "Toronto, CA",
		rate: 1200,
		status: "engaged",
		lastCampaign: "2025-06-20",
		relationshipScore: 72,
		tags: ["gadgets", "reviews", "productivity"],
	},
	{
		id: "3",
		name: "Emma Rodriguez",
		handle: "@emmafit",
		email: "emma@example.com",
		platforms: ["instagram", "youtube"],
		category: "fitness",
		tier: "mid",
		followers: 89000,
		engagementRate: 5.2,
		location: "Miami, FL",
		rate: 750,
		status: "prospect",
		lastCampaign: null,
		relationshipScore: 45,
		tags: ["fitness", "nutrition", "wellness"],
	},
	{
		id: "4",
		name: "David Kim",
		handle: "@davidfoodie",
		email: "david@example.com",
		platforms: ["instagram", "tiktok"],
		category: "food",
		tier: "micro",
		followers: 38000,
		engagementRate: 6.1,
		location: "Seattle, WA",
		rate: 325,
		status: "contacted",
		lastCampaign: null,
		relationshipScore: 58,
		tags: ["cooking", "recipes", "restaurants"],
	},
];

const mockCampaigns = [
	{
		id: "1",
		name: "Summer Skincare Launch",
		status: "active",
		type: "product_launch",
		startDate: "2025-07-01",
		endDate: "2025-07-31",
		budget: 15000,
		spent: 8500,
		participants: 5,
		totalReach: 425000,
		totalEngagements: 18750,
		roi: 2.8,
	},
	{
		id: "2",
		name: "Back to School Tech",
		status: "recruiting",
		type: "brand_awareness",
		startDate: "2025-08-01",
		endDate: "2025-08-31",
		budget: 25000,
		spent: 0,
		participants: 0,
		totalReach: 0,
		totalEngagements: 0,
		roi: 0,
	},
	{
		id: "3",
		name: "Holiday Fitness Challenge",
		status: "planning",
		type: "ugc_collection",
		startDate: "2025-11-01",
		endDate: "2025-12-31",
		budget: 12000,
		spent: 0,
		participants: 0,
		totalReach: 0,
		totalEngagements: 0,
		roi: 0,
	},
];

const mockOutreach = [
	{
		id: "1",
		influencerId: "3",
		influencerName: "Emma Rodriguez",
		type: "cold_outreach",
		subject: "Partnership Opportunity with Ignitabull",
		status: "sent",
		sentDate: "2025-06-25",
		opened: true,
		replied: false,
		outcome: "no_response",
	},
	{
		id: "2",
		influencerId: "4",
		influencerName: "David Kim",
		type: "campaign_invitation",
		subject: "Summer Campaign Invitation",
		status: "replied",
		sentDate: "2025-06-22",
		opened: true,
		replied: true,
		outcome: "interested",
	},
	{
		id: "3",
		influencerId: "1",
		influencerName: "Sarah Johnson",
		type: "follow_up",
		subject: "Re: Next Campaign Opportunity",
		status: "sent",
		sentDate: "2025-06-28",
		opened: false,
		replied: false,
		outcome: "no_response",
	},
];

const mockPerformanceData = [
	{ month: "Jan", reach: 800000, engagements: 35000, spend: 12000, roi: 2.1 },
	{ month: "Feb", reach: 950000, engagements: 42000, spend: 15000, roi: 2.4 },
	{ month: "Mar", reach: 1200000, engagements: 55000, spend: 18000, roi: 2.8 },
	{ month: "Apr", reach: 1400000, engagements: 68000, spend: 22000, roi: 3.1 },
	{ month: "May", reach: 1800000, engagements: 82000, spend: 25000, roi: 3.6 },
	{ month: "Jun", reach: 2200000, engagements: 95000, spend: 28000, roi: 3.9 },
];

const mockTierDistribution = [
	{ name: "Nano (1K-10K)", value: 35, count: 45, color: "#8884d8" },
	{ name: "Micro (10K-100K)", value: 40, count: 51, color: "#82ca9d" },
	{ name: "Mid (100K-1M)", value: 20, count: 25, color: "#ffc658" },
	{ name: "Macro (1M+)", value: 5, count: 6, color: "#ff7c7c" },
];

const _COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"];

function getPlatformIcon(platform: string) {
	switch (platform) {
		case "instagram":
			return <Instagram className="h-4 w-4" />;
		case "youtube":
			return <Youtube className="h-4 w-4" />;
		case "tiktok":
			return <Camera className="h-4 w-4" />;
		case "twitter":
			return <Twitter className="h-4 w-4" />;
		case "facebook":
			return <Facebook className="h-4 w-4" />;
		default:
			return <Users className="h-4 w-4" />;
	}
}

function getStatusColor(status: string): string {
	switch (status) {
		case "partner":
			return "bg-green-100 text-green-800";
		case "engaged":
			return "bg-blue-100 text-blue-800";
		case "contacted":
			return "bg-yellow-100 text-yellow-800";
		case "prospect":
			return "bg-gray-100 text-gray-800";
		case "inactive":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function getCampaignStatusColor(status: string): string {
	switch (status) {
		case "active":
			return "bg-green-100 text-green-800";
		case "recruiting":
			return "bg-blue-100 text-blue-800";
		case "planning":
			return "bg-yellow-100 text-yellow-800";
		case "completed":
			return "bg-gray-100 text-gray-800";
		case "paused":
			return "bg-orange-100 text-orange-800";
		case "cancelled":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function getOutreachStatusIcon(status: string) {
	switch (status) {
		case "sent":
			return <Mail className="h-4 w-4 text-blue-500" />;
		case "opened":
			return <Eye className="h-4 w-4 text-green-500" />;
		case "replied":
			return <MessageCircle className="h-4 w-4 text-purple-500" />;
		case "failed":
			return <XCircle className="h-4 w-4 text-red-500" />;
		default:
			return <Clock className="h-4 w-4 text-gray-400" />;
	}
}

function getTierColor(tier: string): string {
	switch (tier) {
		case "nano":
			return "text-purple-600";
		case "micro":
			return "text-blue-600";
		case "mid":
			return "text-green-600";
		case "macro":
			return "text-orange-600";
		case "mega":
			return "text-red-600";
		default:
			return "text-gray-600";
	}
}

export default function InfluencerDashboard() {
	const [activeTab, setActiveTab] = useState("overview");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [tierFilter, setTierFilter] = useState("all");

	const filteredInfluencers = mockInfluencers.filter((influencer) => {
		const matchesSearch =
			!searchQuery ||
			influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			influencer.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
			influencer.category.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || influencer.status === statusFilter;
		const matchesTier = tierFilter === "all" || influencer.tier === tierFilter;

		return matchesSearch && matchesStatus && matchesTier;
	});

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Influencer Marketing</h1>
					<p className="text-muted-foreground">
						Manage relationships, campaigns, and performance
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Add Influencer
					</Button>
					<Button variant="outline" size="sm">
						<Calendar className="mr-2 h-4 w-4" />
						New Campaign
					</Button>
					<Button variant="outline" size="sm">
						<Download className="mr-2 h-4 w-4" />
						Export Report
					</Button>
					<Button variant="outline" size="sm">
						<Settings className="mr-2 h-4 w-4" />
						Settings
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
									Total Influencers
								</p>
								<div className="flex items-center gap-2">
									<p className="font-bold text-2xl">
										{mockInfluencerOverview.totalInfluencers}
									</p>
									<Badge variant="secondary" className="text-green-600">
										+{mockInfluencerOverview.newInquiries} new
									</Badge>
								</div>
								<p className="mt-1 flex items-center text-green-600 text-xs">
									<TrendingUp className="mr-1 h-3 w-3" />
									+12% this month
								</p>
							</div>
							<Users className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Active Partners
								</p>
								<p className="font-bold text-2xl">
									{mockInfluencerOverview.activePartners}
								</p>
								<p className="mt-1 flex items-center text-blue-600 text-xs">
									<UserPlus className="mr-1 h-3 w-3" />5 new partnerships
								</p>
							</div>
							<Award className="h-8 w-8 text-purple-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Total Reach
								</p>
								<p className="font-bold text-2xl">
									{(mockInfluencerOverview.totalReach / 1000000).toFixed(1)}M
								</p>
								<p className="mt-1 flex items-center text-green-600 text-xs">
									<TrendingUp className="mr-1 h-3 w-3" />
									+28% reach growth
								</p>
							</div>
							<Target className="h-8 w-8 text-green-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Estimated ROI
								</p>
								<p className="font-bold text-2xl">
									{mockInfluencerOverview.estimatedROI}x
								</p>
								<p className="mt-1 flex items-center text-green-600 text-xs">
									<DollarSign className="mr-1 h-3 w-3" />
									+0.6x improvement
								</p>
							</div>
							<TrendingUp className="h-8 w-8 text-orange-600" />
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
					<TabsTrigger value="influencers">Influencers</TabsTrigger>
					<TabsTrigger value="campaigns">Campaigns</TabsTrigger>
					<TabsTrigger value="outreach">Outreach</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{/* Performance Trends */}
						<Card>
							<CardHeader>
								<CardTitle>Performance Trends</CardTitle>
								<CardDescription>
									Monthly reach, engagement, and ROI
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={mockPerformanceData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis yAxisId="left" />
										<YAxis yAxisId="right" orientation="right" />
										<Tooltip />
										<Legend />
										<Line
											yAxisId="left"
											type="monotone"
											dataKey="reach"
											stroke="#8884d8"
											strokeWidth={2}
											name="Reach"
										/>
										<Line
											yAxisId="left"
											type="monotone"
											dataKey="engagements"
											stroke="#82ca9d"
											strokeWidth={2}
											name="Engagements"
										/>
										<Line
											yAxisId="right"
											type="monotone"
											dataKey="roi"
											stroke="#ffc658"
											strokeWidth={2}
											name="ROI"
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Influencer Tier Distribution */}
						<Card>
							<CardHeader>
								<CardTitle>Influencer Tier Distribution</CardTitle>
								<CardDescription>
									Breakdown by follower count tiers
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={mockTierDistribution}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={5}
											dataKey="value"
										>
											{mockTierDistribution.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip
											formatter={(value) => [`${value}%`, "Percentage"]}
										/>
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Active Campaigns Overview */}
						<Card>
							<CardHeader>
								<CardTitle>Active Campaigns</CardTitle>
								<CardDescription>Current campaign performance</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{mockCampaigns
										.filter((c) => c.status === "active")
										.map((campaign) => (
											<div
												key={campaign.id}
												className="flex items-center justify-between rounded-lg border p-4"
											>
												<div>
													<h4 className="font-medium">{campaign.name}</h4>
													<p className="text-muted-foreground text-sm">
														{campaign.participants} participants
													</p>
												</div>
												<div className="text-right">
													<p className="font-medium">{campaign.roi}x ROI</p>
													<p className="text-muted-foreground text-sm">
														${campaign.spent.toLocaleString()} / $
														{campaign.budget.toLocaleString()}
													</p>
												</div>
											</div>
										))}
								</div>
							</CardContent>
						</Card>

						{/* Top Performing Influencers */}
						<Card>
							<CardHeader>
								<CardTitle>Top Performers</CardTitle>
								<CardDescription>
									Highest relationship scores this month
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{mockInfluencers
										.sort((a, b) => b.relationshipScore - a.relationshipScore)
										.slice(0, 4)
										.map((influencer) => (
											<div
												key={influencer.id}
												className="flex items-center justify-between"
											>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 to-pink-400 font-medium text-white">
														{influencer.name.charAt(0)}
													</div>
													<div>
														<p className="font-medium">{influencer.name}</p>
														<p className="text-muted-foreground text-sm">
															{influencer.handle}
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="font-medium">
														{influencer.relationshipScore}/100
													</p>
													<div className="mt-1 flex items-center gap-1">
														{influencer.platforms.map((platform) => (
															<div
																key={platform}
																className="text-muted-foreground"
															>
																{getPlatformIcon(platform)}
															</div>
														))}
													</div>
												</div>
											</div>
										))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="influencers" className="space-y-4">
					{/* Filters */}
					<div className="mb-4 flex items-center gap-4">
						<div className="relative max-w-sm flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input
								placeholder="Search influencers..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="partner">Partner</SelectItem>
								<SelectItem value="engaged">Engaged</SelectItem>
								<SelectItem value="contacted">Contacted</SelectItem>
								<SelectItem value="prospect">Prospect</SelectItem>
							</SelectContent>
						</Select>
						<Select value={tierFilter} onValueChange={setTierFilter}>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Tier" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Tiers</SelectItem>
								<SelectItem value="nano">Nano</SelectItem>
								<SelectItem value="micro">Micro</SelectItem>
								<SelectItem value="mid">Mid-tier</SelectItem>
								<SelectItem value="macro">Macro</SelectItem>
							</SelectContent>
						</Select>
						<Button variant="outline" size="sm">
							<Filter className="mr-2 h-4 w-4" />
							More Filters
						</Button>
					</div>

					{/* Influencers List */}
					<Card>
						<CardHeader>
							<CardTitle>Influencer Database</CardTitle>
							<CardDescription>
								Manage your influencer relationships and partnerships
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{filteredInfluencers.map((influencer) => (
									<div
										key={influencer.id}
										className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
									>
										<div className="flex items-center gap-4">
											<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 to-pink-400 font-medium text-white">
												{influencer.name.charAt(0)}
											</div>
											<div>
												<div className="flex items-center gap-2">
													<h4 className="font-medium">{influencer.name}</h4>
													<Badge className={getStatusColor(influencer.status)}>
														{influencer.status}
													</Badge>
												</div>
												<p className="text-muted-foreground text-sm">
													{influencer.handle}
												</p>
												<div className="mt-1 flex items-center gap-2">
													<span className="text-muted-foreground text-xs">
														{influencer.category}
													</span>
													<span className="text-muted-foreground text-xs">
														•
													</span>
													<span className="text-muted-foreground text-xs">
														{influencer.location}
													</span>
												</div>
											</div>
										</div>

										<div className="flex items-center gap-8 text-sm">
											<div className="text-center">
												<p className="font-medium">
													{(influencer.followers / 1000).toFixed(0)}K
												</p>
												<p className="text-muted-foreground">Followers</p>
											</div>

											<div className="text-center">
												<p className="font-medium">
													{influencer.engagementRate}%
												</p>
												<p className="text-muted-foreground">Engagement</p>
											</div>

											<div className="text-center">
												<p
													className={`font-medium ${getTierColor(influencer.tier)}`}
												>
													{influencer.tier}
												</p>
												<p className="text-muted-foreground">Tier</p>
											</div>

											<div className="text-center">
												<p className="font-medium">${influencer.rate}</p>
												<p className="text-muted-foreground">Rate</p>
											</div>

											<div className="text-center">
												<div className="flex items-center gap-1">
													<Star className="h-3 w-3 fill-current text-yellow-500" />
													<span className="font-medium">
														{influencer.relationshipScore}
													</span>
												</div>
												<p className="text-muted-foreground">Score</p>
											</div>

											<div className="flex items-center gap-1">
												{influencer.platforms.map((platform) => (
													<div key={platform} className="text-muted-foreground">
														{getPlatformIcon(platform)}
													</div>
												))}
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="campaigns" className="space-y-4">
					<div className="mb-4 flex items-center justify-between">
						<div className="relative max-w-sm flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input placeholder="Search campaigns..." className="pl-10" />
						</div>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							New Campaign
						</Button>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Campaign Management</CardTitle>
							<CardDescription>
								Track and manage your influencer campaigns
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockCampaigns.map((campaign) => (
									<div key={campaign.id} className="rounded-lg border p-6">
										<div className="mb-4 flex items-center justify-between">
											<div className="flex items-center gap-3">
												<h4 className="font-medium text-lg">{campaign.name}</h4>
												<Badge
													className={getCampaignStatusColor(campaign.status)}
												>
													{campaign.status}
												</Badge>
											</div>
											<div className="text-right">
												<p className="text-muted-foreground text-sm">
													{campaign.startDate} - {campaign.endDate}
												</p>
											</div>
										</div>

										<div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
											<div>
												<p className="text-muted-foreground text-sm">Budget</p>
												<p className="font-medium">
													${campaign.budget.toLocaleString()}
												</p>
												<Progress
													value={(campaign.spent / campaign.budget) * 100}
													className="mt-1"
												/>
											</div>

											<div>
												<p className="text-muted-foreground text-sm">
													Participants
												</p>
												<p className="font-medium">{campaign.participants}</p>
												<p className="text-muted-foreground text-xs">
													influencers
												</p>
											</div>

											<div>
												<p className="text-muted-foreground text-sm">
													Total Reach
												</p>
												<p className="font-medium">
													{(campaign.totalReach / 1000).toFixed(0)}K
												</p>
												<p className="text-muted-foreground text-xs">
													impressions
												</p>
											</div>

											<div>
												<p className="text-muted-foreground text-sm">ROI</p>
												<p className="font-medium">{campaign.roi}x</p>
												<p className="text-green-600 text-xs">return</p>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<Button variant="outline" size="sm">
												<Eye className="mr-2 h-4 w-4" />
												View Details
											</Button>
											<Button variant="outline" size="sm">
												<FileText className="mr-2 h-4 w-4" />
												Reports
											</Button>
											{campaign.status === "recruiting" && (
												<Button variant="outline" size="sm">
													<UserPlus className="mr-2 h-4 w-4" />
													Add Influencers
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="outreach" className="space-y-4">
					<div className="mb-4 flex items-center justify-between">
						<div className="relative max-w-sm flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input placeholder="Search outreach..." className="pl-10" />
						</div>
						<Button>
							<Mail className="mr-2 h-4 w-4" />
							New Outreach
						</Button>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Outreach Management</CardTitle>
							<CardDescription>
								Track communications and follow-ups
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockOutreach.map((outreach) => (
									<div
										key={outreach.id}
										className="flex items-center justify-between rounded-lg border p-4"
									>
										<div className="flex items-center gap-4">
											{getOutreachStatusIcon(outreach.status)}
											<div>
												<h4 className="font-medium">{outreach.subject}</h4>
												<p className="text-muted-foreground text-sm">
													To: {outreach.influencerName}
												</p>
												<p className="text-muted-foreground text-xs">
													{outreach.type.replace("_", " ")} • Sent{" "}
													{outreach.sentDate}
												</p>
											</div>
										</div>

										<div className="flex items-center gap-4 text-sm">
											<div className="text-center">
												<div className="flex items-center gap-1">
													{outreach.opened ? (
														<Eye className="h-3 w-3 text-green-500" />
													) : (
														<Eye className="h-3 w-3 text-gray-400" />
													)}
													<span
														className={
															outreach.opened
																? "text-green-600"
																: "text-gray-400"
														}
													>
														Opened
													</span>
												</div>
											</div>

											<div className="text-center">
												<div className="flex items-center gap-1">
													{outreach.replied ? (
														<MessageCircle className="h-3 w-3 text-purple-500" />
													) : (
														<MessageCircle className="h-3 w-3 text-gray-400" />
													)}
													<span
														className={
															outreach.replied
																? "text-purple-600"
																: "text-gray-400"
														}
													>
														Replied
													</span>
												</div>
											</div>

											<Badge variant="outline">
												{outreach.outcome.replace("_", " ")}
											</Badge>

											<Button variant="outline" size="sm">
												Follow Up
											</Button>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-4">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{/* ROI Analysis */}
						<Card>
							<CardHeader>
								<CardTitle>ROI Analysis</CardTitle>
								<CardDescription>Return on investment trends</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={mockPerformanceData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="roi"
											stroke="#8884d8"
											fill="#8884d8"
											fillOpacity={0.3}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Engagement vs Spend */}
						<Card>
							<CardHeader>
								<CardTitle>Engagement vs Spend</CardTitle>
								<CardDescription>Cost effectiveness analysis</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={mockPerformanceData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis yAxisId="left" />
										<YAxis yAxisId="right" orientation="right" />
										<Tooltip />
										<Legend />
										<Bar
											yAxisId="left"
											dataKey="engagements"
											fill="#82ca9d"
											name="Engagements"
										/>
										<Bar
											yAxisId="right"
											dataKey="spend"
											fill="#ffc658"
											name="Spend ($)"
										/>
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Platform Performance */}
						<Card>
							<CardHeader>
								<CardTitle>Platform Performance</CardTitle>
								<CardDescription>
									Performance breakdown by social platform
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{[
										{
											platform: "Instagram",
											reach: 1200000,
											engagement: 4.8,
											cost: 45000,
											roi: 3.2,
											color: "bg-pink-500",
										},
										{
											platform: "TikTok",
											reach: 800000,
											engagement: 6.2,
											cost: 25000,
											roi: 4.1,
											color: "bg-black",
										},
										{
											platform: "YouTube",
											reach: 600000,
											engagement: 3.1,
											cost: 35000,
											roi: 2.8,
											color: "bg-red-500",
										},
										{
											platform: "Twitter",
											reach: 300000,
											engagement: 2.9,
											cost: 15000,
											roi: 2.1,
											color: "bg-blue-500",
										},
									].map((platform) => (
										<div
											key={platform.platform}
											className="flex items-center justify-between rounded-lg border p-4"
										>
											<div className="flex items-center gap-3">
												<div
													className={`h-3 w-3 rounded-full ${platform.color}`}
												/>
												<span className="font-medium">{platform.platform}</span>
											</div>

											<div className="grid grid-cols-4 gap-8 text-sm">
												<div className="text-center">
													<p className="font-medium">
														{(platform.reach / 1000000).toFixed(1)}M
													</p>
													<p className="text-muted-foreground">Reach</p>
												</div>
												<div className="text-center">
													<p className="font-medium">{platform.engagement}%</p>
													<p className="text-muted-foreground">Engagement</p>
												</div>
												<div className="text-center">
													<p className="font-medium">
														${(platform.cost / 1000).toFixed(0)}K
													</p>
													<p className="text-muted-foreground">Spend</p>
												</div>
												<div className="text-center">
													<p className="font-medium">{platform.roi}x</p>
													<p className="text-muted-foreground">ROI</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Campaign Success Rate */}
						<Card>
							<CardHeader>
								<CardTitle>Campaign Success Metrics</CardTitle>
								<CardDescription>Key performance indicators</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									<div>
										<div className="mb-2 flex items-center justify-between">
											<span className="font-medium text-sm">
												Campaign Completion Rate
											</span>
											<span className="text-muted-foreground text-sm">87%</span>
										</div>
										<Progress value={87} className="h-2" />
									</div>

									<div>
										<div className="mb-2 flex items-center justify-between">
											<span className="font-medium text-sm">
												Influencer Response Rate
											</span>
											<span className="text-muted-foreground text-sm">64%</span>
										</div>
										<Progress value={64} className="h-2" />
									</div>

									<div>
										<div className="mb-2 flex items-center justify-between">
											<span className="font-medium text-sm">
												Content Approval Rate
											</span>
											<span className="text-muted-foreground text-sm">92%</span>
										</div>
										<Progress value={92} className="h-2" />
									</div>

									<div>
										<div className="mb-2 flex items-center justify-between">
											<span className="font-medium text-sm">
												On-time Delivery
											</span>
											<span className="text-muted-foreground text-sm">78%</span>
										</div>
										<Progress value={78} className="h-2" />
									</div>

									<div>
										<div className="mb-2 flex items-center justify-between">
											<span className="font-medium text-sm">
												Partnership Renewal
											</span>
											<span className="text-muted-foreground text-sm">71%</span>
										</div>
										<Progress value={71} className="h-2" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
