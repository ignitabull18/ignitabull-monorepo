/**
 * Visitor Tracking Dashboard
 * Real-time visitor behavior tracking and follow-up management
 */

"use client";

import {
	Activity,
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	Filter,
	Mail,
	MapPin,
	Monitor,
	Phone,
	Settings,
	Smartphone,
	Tablet,
	TrendingUp,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data - in real app, this would come from your API
const mockAnalytics = {
	totalSessions: 12847,
	uniqueVisitors: 8932,
	pageViews: 45621,
	averageSessionDuration: 245, // seconds
	bounceRate: 34.5,
	conversionRate: 3.2,
	leadConversionRate: 1.8,
};

const mockRealtimeData = [
	{ time: "12:00", sessions: 45, conversions: 2 },
	{ time: "12:15", sessions: 52, conversions: 3 },
	{ time: "12:30", sessions: 48, conversions: 1 },
	{ time: "12:45", sessions: 61, conversions: 4 },
	{ time: "13:00", sessions: 55, conversions: 2 },
	{ time: "13:15", sessions: 58, conversions: 3 },
	{ time: "13:30", sessions: 63, conversions: 5 },
];

const mockTopPages = [
	{ path: "/pricing", views: 2341, conversions: 45 },
	{ path: "/features", views: 1987, conversions: 32 },
	{ path: "/demo", views: 1654, conversions: 89 },
	{ path: "/about", views: 1432, conversions: 12 },
	{ path: "/contact", views: 1298, conversions: 67 },
];

const mockTrafficSources = [
	{ source: "Google Organic", sessions: 4521, conversions: 78 },
	{ source: "Direct", sessions: 3245, conversions: 45 },
	{ source: "Google Ads", sessions: 2987, conversions: 89 },
	{ source: "LinkedIn", sessions: 1654, conversions: 34 },
	{ source: "Twitter", sessions: 987, conversions: 12 },
];

const mockDeviceData = [
	{ device: "Desktop", percentage: 65, count: 5850 },
	{ device: "Mobile", percentage: 28, count: 2521 },
	{ device: "Tablet", percentage: 7, count: 630 },
];

const mockRecentLeads = [
	{
		id: "1",
		name: "Sarah Johnson",
		email: "sarah@techcorp.com",
		company: "TechCorp Inc.",
		score: 85,
		source: "Demo Request",
		status: "new",
		timeAgo: "5 minutes ago",
		pageViews: 12,
		timeOnSite: "8:45",
	},
	{
		id: "2",
		name: "Mike Chen",
		email: "mike@startup.io",
		company: "Startup.io",
		score: 72,
		source: "Contact Form",
		status: "contacted",
		timeAgo: "23 minutes ago",
		pageViews: 8,
		timeOnSite: "5:32",
	},
	{
		id: "3",
		name: "Lisa Rodriguez",
		email: "lisa@ecommerce.com",
		company: "E-commerce Plus",
		score: 91,
		source: "Trial Signup",
		status: "qualified",
		timeAgo: "1 hour ago",
		pageViews: 15,
		timeOnSite: "12:18",
	},
];

const mockFollowUpTasks = [
	{
		id: "1",
		type: "email",
		title: "Send welcome email to Sarah Johnson",
		priority: "high",
		status: "pending",
		dueDate: "Today, 3:00 PM",
		leadId: "1",
	},
	{
		id: "2",
		type: "call",
		title: "Follow up call with Mike Chen",
		priority: "medium",
		status: "in_progress",
		dueDate: "Tomorrow, 10:00 AM",
		leadId: "2",
	},
	{
		id: "3",
		type: "meeting",
		title: "Demo meeting with Lisa Rodriguez",
		priority: "high",
		status: "scheduled",
		dueDate: "Friday, 2:00 PM",
		leadId: "3",
	},
];

const _COLORS = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe"];

function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getStatusColor(status: string): string {
	switch (status) {
		case "new":
			return "bg-blue-100 text-blue-800";
		case "contacted":
			return "bg-yellow-100 text-yellow-800";
		case "qualified":
			return "bg-green-100 text-green-800";
		case "converted":
			return "bg-purple-100 text-purple-800";
		case "lost":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function getPriorityColor(priority: string): string {
	switch (priority) {
		case "urgent":
			return "bg-red-100 text-red-800";
		case "high":
			return "bg-orange-100 text-orange-800";
		case "medium":
			return "bg-yellow-100 text-yellow-800";
		case "low":
			return "bg-green-100 text-green-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function getTaskIcon(type: string) {
	switch (type) {
		case "email":
			return <Mail className="h-4 w-4" />;
		case "call":
			return <Phone className="h-4 w-4" />;
		case "meeting":
			return <Calendar className="h-4 w-4" />;
		default:
			return <Activity className="h-4 w-4" />;
	}
}

function getDeviceIcon(device: string) {
	switch (device) {
		case "Desktop":
			return <Monitor className="h-5 w-5" />;
		case "Mobile":
			return <Smartphone className="h-5 w-5" />;
		case "Tablet":
			return <Tablet className="h-5 w-5" />;
		default:
			return <Monitor className="h-5 w-5" />;
	}
}

export default function VisitorTrackingPage() {
	const [_timeRange, _setTimeRange] = useState("24h");
	const [activeTab, setActiveTab] = useState("overview");

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Visitor Tracking</h1>
					<p className="text-muted-foreground">
						Monitor visitor behavior and automate follow-ups
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<Filter className="mr-2 h-4 w-4" />
						Filter
					</Button>
					<Button variant="outline" size="sm">
						<Download className="mr-2 h-4 w-4" />
						Export
					</Button>
					<Button variant="outline" size="sm">
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</Button>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Total Sessions
								</p>
								<p className="font-bold text-2xl">
									{mockAnalytics.totalSessions.toLocaleString()}
								</p>
								<p className="mt-1 flex items-center text-green-600 text-xs">
									<TrendingUp className="mr-1 h-3 w-3" />
									+12.5% from yesterday
								</p>
							</div>
							<Activity className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Unique Visitors
								</p>
								<p className="font-bold text-2xl">
									{mockAnalytics.uniqueVisitors.toLocaleString()}
								</p>
								<p className="mt-1 flex items-center text-green-600 text-xs">
									<TrendingUp className="mr-1 h-3 w-3" />
									+8.2% from yesterday
								</p>
							</div>
							<Users className="h-8 w-8 text-purple-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Avg. Session Duration
								</p>
								<p className="font-bold text-2xl">
									{formatDuration(mockAnalytics.averageSessionDuration)}
								</p>
								<p className="mt-1 flex items-center text-green-600 text-xs">
									<TrendingUp className="mr-1 h-3 w-3" />
									+15.3% from yesterday
								</p>
							</div>
							<Clock className="h-8 w-8 text-orange-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Conversion Rate
								</p>
								<p className="font-bold text-2xl">
									{mockAnalytics.conversionRate}%
								</p>
								<p className="mt-1 flex items-center text-green-600 text-xs">
									<TrendingUp className="mr-1 h-3 w-3" />
									+0.8% from yesterday
								</p>
							</div>
							<TrendingUp className="h-8 w-8 text-green-600" />
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
					<TabsTrigger value="leads">Leads</TabsTrigger>
					<TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{/* Real-time Activity */}
						<Card>
							<CardHeader>
								<CardTitle>Real-time Activity</CardTitle>
								<CardDescription>
									Sessions and conversions over the last 2 hours
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={mockRealtimeData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="time" />
										<YAxis />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="sessions"
											stackId="1"
											stroke="#667eea"
											fill="#667eea"
											fillOpacity={0.3}
										/>
										<Area
											type="monotone"
											dataKey="conversions"
											stackId="2"
											stroke="#f093fb"
											fill="#f093fb"
											fillOpacity={0.6}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Device Breakdown */}
						<Card>
							<CardHeader>
								<CardTitle>Device Breakdown</CardTitle>
								<CardDescription>
									Visitor distribution by device type
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{mockDeviceData.map((device, _index) => (
										<div
											key={device.device}
											className="flex items-center justify-between"
										>
											<div className="flex items-center gap-3">
												{getDeviceIcon(device.device)}
												<div>
													<p className="font-medium">{device.device}</p>
													<p className="text-muted-foreground text-sm">
														{device.count.toLocaleString()} sessions
													</p>
												</div>
											</div>
											<div className="text-right">
												<p className="font-medium">{device.percentage}%</p>
												<Progress value={device.percentage} className="w-20" />
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Top Pages */}
						<Card>
							<CardHeader>
								<CardTitle>Top Pages</CardTitle>
								<CardDescription>
									Most visited pages and their conversion rates
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{mockTopPages.map((page, _index) => (
										<div
											key={page.path}
											className="flex items-center justify-between"
										>
											<div>
												<p className="font-medium">{page.path}</p>
												<p className="text-muted-foreground text-sm">
													{page.views.toLocaleString()} views
												</p>
											</div>
											<div className="text-right">
												<p className="font-medium">
													{page.conversions} conversions
												</p>
												<p className="text-muted-foreground text-sm">
													{((page.conversions / page.views) * 100).toFixed(1)}%
													CVR
												</p>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Traffic Sources */}
						<Card>
							<CardHeader>
								<CardTitle>Traffic Sources</CardTitle>
								<CardDescription>
									Where your visitors are coming from
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{mockTrafficSources.map((source, _index) => (
										<div
											key={source.source}
											className="flex items-center justify-between"
										>
											<div>
												<p className="font-medium">{source.source}</p>
												<p className="text-muted-foreground text-sm">
													{source.sessions.toLocaleString()} sessions
												</p>
											</div>
											<div className="text-right">
												<p className="font-medium">
													{source.conversions} conversions
												</p>
												<p className="text-muted-foreground text-sm">
													{(
														(source.conversions / source.sessions) *
														100
													).toFixed(1)}
													% CVR
												</p>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="leads" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Recent Leads</CardTitle>
							<CardDescription>
								Latest lead captures with scores and behavior data
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockRecentLeads.map((lead) => (
									<div
										key={lead.id}
										className="flex items-center justify-between rounded-lg border p-4"
									>
										<div className="flex items-center gap-4">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 font-semibold text-white">
												{lead.name
													.split(" ")
													.map((n) => n[0])
													.join("")}
											</div>
											<div>
												<p className="font-medium">{lead.name}</p>
												<p className="text-muted-foreground text-sm">
													{lead.email}
												</p>
												<p className="text-muted-foreground text-sm">
													{lead.company}
												</p>
											</div>
										</div>

										<div className="flex items-center gap-4">
											<div className="text-center">
												<p className="font-medium text-sm">Score</p>
												<div className="flex items-center gap-2">
													<Progress value={lead.score} className="w-16" />
													<span className="font-medium text-sm">
														{lead.score}
													</span>
												</div>
											</div>

											<div className="text-center">
												<p className="font-medium text-sm">Activity</p>
												<p className="text-muted-foreground text-sm">
													{lead.pageViews} pages
												</p>
												<p className="text-muted-foreground text-sm">
													{lead.timeOnSite}
												</p>
											</div>

											<div className="text-center">
												<p className="font-medium text-sm">Source</p>
												<p className="text-muted-foreground text-sm">
													{lead.source}
												</p>
												<p className="text-muted-foreground text-sm">
													{lead.timeAgo}
												</p>
											</div>

											<div>
												<Badge className={getStatusColor(lead.status)}>
													{lead.status}
												</Badge>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="follow-ups" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Automated Follow-ups</CardTitle>
							<CardDescription>
								Pending and scheduled follow-up tasks
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockFollowUpTasks.map((task) => (
									<div
										key={task.id}
										className="flex items-center justify-between rounded-lg border p-4"
									>
										<div className="flex items-center gap-4">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
												{getTaskIcon(task.type)}
											</div>
											<div>
												<p className="font-medium">{task.title}</p>
												<p className="text-muted-foreground text-sm">
													Due: {task.dueDate}
												</p>
											</div>
										</div>

										<div className="flex items-center gap-4">
											<Badge className={getPriorityColor(task.priority)}>
												{task.priority}
											</Badge>

											<div className="flex items-center gap-2">
												{task.status === "pending" && (
													<AlertCircle className="h-4 w-4 text-orange-500" />
												)}
												{task.status === "in_progress" && (
													<Clock className="h-4 w-4 text-blue-500" />
												)}
												{task.status === "completed" && (
													<CheckCircle className="h-4 w-4 text-green-500" />
												)}
												{task.status === "cancelled" && (
													<XCircle className="h-4 w-4 text-red-500" />
												)}
												<span className="text-sm capitalize">
													{task.status.replace("_", " ")}
												</span>
											</div>

											<Button variant="outline" size="sm">
												View
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
						{/* Conversion Funnel */}
						<Card>
							<CardHeader>
								<CardTitle>Conversion Funnel</CardTitle>
								<CardDescription>
									Visitor journey from landing to conversion
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">Visitors</span>
										<span className="text-sm">8,932 (100%)</span>
									</div>
									<Progress value={100} className="h-2" />

									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">
											Engaged (2+ pages)
										</span>
										<span className="text-sm">5,847 (65.5%)</span>
									</div>
									<Progress value={65.5} className="h-2" />

									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">
											Highly Engaged (5+ pages)
										</span>
										<span className="text-sm">2,156 (24.1%)</span>
									</div>
									<Progress value={24.1} className="h-2" />

									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">
											Form Interactions
										</span>
										<span className="text-sm">743 (8.3%)</span>
									</div>
									<Progress value={8.3} className="h-2" />

									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">Conversions</span>
										<span className="text-sm">287 (3.2%)</span>
									</div>
									<Progress value={3.2} className="h-2" />
								</div>
							</CardContent>
						</Card>

						{/* Geographic Distribution */}
						<Card>
							<CardHeader>
								<CardTitle>Geographic Distribution</CardTitle>
								<CardDescription>Visitor locations worldwide</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<MapPin className="h-4 w-4" />
											<span className="font-medium text-sm">United States</span>
										</div>
										<span className="text-sm">4,521 (50.6%)</span>
									</div>
									<Progress value={50.6} className="h-2" />

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<MapPin className="h-4 w-4" />
											<span className="font-medium text-sm">Canada</span>
										</div>
										<span className="text-sm">1,847 (20.7%)</span>
									</div>
									<Progress value={20.7} className="h-2" />

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<MapPin className="h-4 w-4" />
											<span className="font-medium text-sm">
												United Kingdom
											</span>
										</div>
										<span className="text-sm">1,156 (12.9%)</span>
									</div>
									<Progress value={12.9} className="h-2" />

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<MapPin className="h-4 w-4" />
											<span className="font-medium text-sm">Australia</span>
										</div>
										<span className="text-sm">743 (8.3%)</span>
									</div>
									<Progress value={8.3} className="h-2" />

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<MapPin className="h-4 w-4" />
											<span className="font-medium text-sm">Germany</span>
										</div>
										<span className="text-sm">665 (7.4%)</span>
									</div>
									<Progress value={7.4} className="h-2" />
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
