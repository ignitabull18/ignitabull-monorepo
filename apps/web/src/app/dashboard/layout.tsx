import {
	BarChart3,
	Brain,
	ChevronRight,
	LayoutDashboard,
	Package,
	Search,
	Settings,
} from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const navigation = [
		{ name: "Overview", href: "/dashboard", icon: LayoutDashboard },
		{ name: "Amazon SEO", href: "/dashboard/amazon/seo", icon: Search },
		{ name: "AI Insights", href: "/dashboard/amazon/insights", icon: Brain },
		{
			name: "Attribution",
			href: "/dashboard/amazon/attribution",
			icon: BarChart3,
		},
		{ name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
		{ name: "Products", href: "/dashboard/products", icon: Package },
		{ name: "Settings", href: "/dashboard/settings", icon: Settings },
	];

	return (
		<div className="flex h-screen bg-background">
			{/* Sidebar */}
			<div className="hidden lg:flex lg:flex-shrink-0">
				<div className="flex w-64 flex-col">
					<div className="flex flex-1 flex-col overflow-y-auto border-r bg-card">
						<div className="flex h-16 items-center border-b px-4">
							<h2 className="font-semibold text-lg">Ignitabull</h2>
						</div>
						<nav className="flex-1 space-y-1 px-2 py-4">
							{navigation.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.name}
										href={item.href}
										className="group flex items-center rounded-md px-2 py-2 font-medium text-sm hover:bg-accent hover:text-accent-foreground"
									>
										<Icon className="mr-3 h-5 w-5 flex-shrink-0" />
										{item.name}
										<ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100" />
									</Link>
								);
							})}
						</nav>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				<main className="flex-1 overflow-y-auto">{children}</main>
			</div>
		</div>
	);
}
