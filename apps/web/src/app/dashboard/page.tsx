import {
	ArrowRight,
	BarChart3,
	DollarSign,
	Package,
	Search,
	Target,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
	const stats = [
		{
			title: "Total Products",
			value: "124",
			change: "+12%",
			icon: Package,
			trend: "up",
		},
		{
			title: "Search Visibility",
			value: "72%",
			change: "+5.2%",
			icon: Search,
			trend: "up",
		},
		{
			title: "Monthly Revenue",
			value: "$45.2K",
			change: "+18%",
			icon: DollarSign,
			trend: "up",
		},
		{
			title: "Active Campaigns",
			value: "8",
			change: "+2",
			icon: Target,
			trend: "up",
		},
	];

	const quickActions = [
		{
			title: "Amazon SEO Dashboard",
			description: "Track search performance and optimize listings",
			href: "/dashboard/amazon/seo",
			icon: Search,
		},
		{
			title: "Campaign Manager",
			description: "Manage advertising campaigns across platforms",
			href: "/dashboard/campaigns",
			icon: Target,
		},
		{
			title: "Brand Analytics",
			description: "Deep insights into brand performance",
			href: "/dashboard/brand",
			icon: BarChart3,
		},
		{
			title: "Customer Insights",
			description: "Understand your customer behavior",
			href: "/dashboard/customers",
			icon: Users,
		},
	];

	return (
		<div className="container mx-auto space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground">
					Welcome back! Here's an overview of your e-commerce performance.
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat, index) => {
					const Icon = stat.icon;
					return (
						<Card key={index}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									{stat.title}
								</CardTitle>
								<Icon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{stat.value}</div>
								<p className="text-muted-foreground text-xs">
									<span
										className={
											stat.trend === "up" ? "text-green-500" : "text-red-500"
										}
									>
										{stat.change}
									</span>{" "}
									from last month
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Quick Actions */}
			<div>
				<h2 className="mb-4 font-semibold text-2xl">Quick Actions</h2>
				<div className="grid gap-4 md:grid-cols-2">
					{quickActions.map((action, index) => {
						const Icon = action.icon;
						return (
							<Card
								key={index}
								className="transition-colors hover:border-primary/50"
							>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="rounded-lg bg-primary/10 p-2">
												<Icon className="h-5 w-5 text-primary" />
											</div>
											<div>
												<CardTitle className="text-lg">
													{action.title}
												</CardTitle>
												<CardDescription className="mt-1">
													{action.description}
												</CardDescription>
											</div>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<Link href={action.href}>
										<Button variant="ghost" className="w-full justify-between">
											Open Dashboard
											<ArrowRight className="h-4 w-4" />
										</Button>
									</Link>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>
						Your latest updates and notifications
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center gap-4 text-sm">
							<div className="rounded-full bg-green-100 p-2">
								<TrendingUp className="h-4 w-4 text-green-600" />
							</div>
							<div className="flex-1">
								<p className="font-medium">Keyword ranking improved</p>
								<p className="text-muted-foreground">
									"wireless earbuds" moved up 3 positions
								</p>
							</div>
							<span className="text-muted-foreground">2 hours ago</span>
						</div>
						<div className="flex items-center gap-4 text-sm">
							<div className="rounded-full bg-blue-100 p-2">
								<Target className="h-4 w-4 text-blue-600" />
							</div>
							<div className="flex-1">
								<p className="font-medium">Campaign optimization complete</p>
								<p className="text-muted-foreground">ACOS improved by 15%</p>
							</div>
							<span className="text-muted-foreground">5 hours ago</span>
						</div>
						<div className="flex items-center gap-4 text-sm">
							<div className="rounded-full bg-yellow-100 p-2">
								<Search className="h-4 w-4 text-yellow-600" />
							</div>
							<div className="flex-1">
								<p className="font-medium">New SEO opportunities found</p>
								<p className="text-muted-foreground">
									5 high-potential keywords identified
								</p>
							</div>
							<span className="text-muted-foreground">1 day ago</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
