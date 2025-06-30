/**
 * Dashboard Layout Component
 * Main layout wrapper for dashboard pages with sidebar navigation
 */

"use client";

import {
	Activity,
	BarChart3,
	Bell,
	ChevronDown,
	Eye,
	Globe,
	Home,
	Lightbulb,
	LogOut,
	Mail,
	Menu,
	PieChart,
	Search,
	Settings,
	ShoppingCart,
	Target,
	TrendingUp,
	User,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

interface NavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	badge?: string;
	description?: string;
	submenu?: NavItem[];
}

const navigation: NavItem[] = [
	{
		label: "Overview",
		href: "/dashboard",
		icon: Home,
		description: "Main dashboard overview",
	},
	{
		label: "Amazon Analytics",
		href: "/dashboard/amazon",
		icon: BarChart3,
		description: "Amazon marketplace insights",
		submenu: [
			{
				label: "Products",
				href: "/dashboard/amazon/products",
				icon: ShoppingCart,
				description: "Product performance and optimization",
			},
			{
				label: "Keywords",
				href: "/dashboard/amazon/keywords",
				icon: Search,
				description: "Keyword tracking and research",
			},
			{
				label: "Competitors",
				href: "/dashboard/amazon/competitors",
				icon: Target,
				description: "Competitive analysis and monitoring",
			},
			{
				label: "Advertising",
				href: "/dashboard/amazon/advertising",
				icon: TrendingUp,
				description: "PPC campaigns and ad performance",
			},
		],
	},
	{
		label: "SEO Analytics",
		href: "/dashboard/seo",
		icon: Globe,
		description: "Search engine optimization insights",
	},
	{
		label: "Influencer Marketing",
		href: "/dashboard/influencers",
		icon: Users,
		description: "Influencer CRM and campaign management",
	},
	{
		label: "Visitor Tracking",
		href: "/dashboard/visitors",
		icon: Eye,
		description: "Website visitor analytics and tracking",
	},
	{
		label: "Email Marketing",
		href: "/dashboard/email",
		icon: Mail,
		description: "Email campaigns and automation",
	},
	{
		label: "AI Insights",
		href: "/dashboard/insights",
		icon: Lightbulb,
		description: "AI-powered business insights",
		badge: "New",
	},
	{
		label: "Reports",
		href: "/dashboard/reports",
		icon: PieChart,
		description: "Custom reports and analytics",
	},
];

const bottomNavigation: NavItem[] = [
	{
		label: "Settings",
		href: "/dashboard/settings",
		icon: Settings,
		description: "Account and application settings",
	},
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [expandedItems, setExpandedItems] = useState<string[]>([]);
	const pathname = usePathname();

	// Auto-expand menu items if current path matches
	useEffect(() => {
		const currentExpandedItems: string[] = [];
		navigation.forEach((item) => {
			if (item.submenu?.some((subItem) => pathname === subItem.href)) {
				currentExpandedItems.push(item.href);
			}
		});
		setExpandedItems(currentExpandedItems);
	}, [pathname]);

	const toggleExpanded = (href: string) => {
		setExpandedItems((prev) =>
			prev.includes(href)
				? prev.filter((item) => item !== href)
				: [...prev, href],
		);
	};

	const isActive = (href: string) => {
		if (href === "/dashboard") {
			return pathname === "/dashboard";
		}
		return pathname.startsWith(href);
	};

	const NavItems = ({
		items,
		isSubmenu = false,
	}: {
		items: NavItem[];
		isSubmenu?: boolean;
	}) => (
		<ul className={cn("space-y-1", isSubmenu && "mt-2 ml-4")}>
			{items.map((item) => (
				<li key={item.href}>
					<div>
						{item.submenu ? (
							<button
								onClick={() => toggleExpanded(item.href)}
								className={cn(
									"flex w-full items-center justify-between rounded-md px-3 py-2 font-medium text-sm transition-colors",
									isActive(item.href)
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<div className="flex items-center">
									<item.icon className="mr-3 h-4 w-4" />
									{item.label}
									{item.badge && (
										<Badge variant="secondary" className="ml-2 text-xs">
											{item.badge}
										</Badge>
									)}
								</div>
								<ChevronDown
									className={cn(
										"h-4 w-4 transition-transform",
										expandedItems.includes(item.href) && "rotate-180",
									)}
								/>
							</button>
						) : (
							<Link
								href={item.href}
								onClick={() => setSidebarOpen(false)}
								className={cn(
									"flex items-center rounded-md px-3 py-2 font-medium text-sm transition-colors",
									isActive(item.href)
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
									isSubmenu && "pl-6 text-xs",
								)}
							>
								<item.icon
									className={cn("mr-3 h-4 w-4", isSubmenu && "h-3 w-3")}
								/>
								{item.label}
								{item.badge && (
									<Badge variant="secondary" className="ml-2 text-xs">
										{item.badge}
									</Badge>
								)}
							</Link>
						)}
					</div>

					{item.submenu && expandedItems.includes(item.href) && (
						<NavItems items={item.submenu} isSubmenu={true} />
					)}
				</li>
			))}
		</ul>
	);

	const SidebarContent = () => (
		<div className="flex h-full flex-col">
			{/* Logo */}
			<div className="flex h-16 items-center border-b px-6">
				<Link href="/dashboard" className="flex items-center space-x-2">
					<div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
						<Zap className="h-5 w-5 text-primary-foreground" />
					</div>
					<span className="font-semibold text-lg">Ignitabull</span>
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
				<NavItems items={navigation} />
			</nav>

			{/* Bottom Navigation */}
			<div className="border-t px-4 py-4">
				<NavItems items={bottomNavigation} />
			</div>
		</div>
	);

	return (
		<div className="flex h-screen bg-background">
			{/* Desktop Sidebar */}
			<div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
				<div className="flex flex-grow flex-col border-r bg-card">
					<SidebarContent />
				</div>
			</div>

			{/* Mobile Sidebar */}
			<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<SheetContent side="left" className="w-64 p-0">
					<SidebarContent />
				</SheetContent>
			</Sheet>

			{/* Main Content */}
			<div className="flex flex-1 flex-col lg:pl-64">
				{/* Top Header */}
				<header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
					<div className="flex items-center">
						{/* Mobile Menu Button */}
						<Sheet>
							<SheetTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="lg:hidden"
									onClick={() => setSidebarOpen(true)}
								>
									<Menu className="h-4 w-4" />
									<span className="sr-only">Open sidebar</span>
								</Button>
							</SheetTrigger>
						</Sheet>

						{/* Page Title */}
						<div className="ml-4 lg:ml-0">
							<h1 className="font-semibold text-lg">
								{navigation.find(
									(item) =>
										item.href === pathname ||
										item.submenu?.some((sub) => sub.href === pathname),
								)?.label || "Dashboard"}
							</h1>
						</div>
					</div>

					{/* Header Actions */}
					<div className="flex items-center space-x-4">
						{/* Notifications */}
						<Button variant="outline" size="icon" className="relative">
							<Bell className="h-4 w-4" />
							<Badge
								variant="destructive"
								className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center p-0 text-xs"
							>
								3
							</Badge>
							<span className="sr-only">Notifications</span>
						</Button>

						{/* User Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
									<User className="h-4 w-4" />
									<span className="sr-only">User menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>
									<div className="flex items-center space-x-2">
										<Avatar className="h-8 w-8">
											<AvatarImage src="/placeholder-avatar.jpg" />
											<AvatarFallback>JD</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium text-sm">John Doe</p>
											<p className="text-muted-foreground text-xs">
												john@example.com
											</p>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<User className="mr-2 h-4 w-4" />
									Profile
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Settings className="mr-2 h-4 w-4" />
									Settings
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Activity className="mr-2 h-4 w-4" />
									Activity
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="text-red-600">
									<LogOut className="mr-2 h-4 w-4" />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				{/* Main Content Area */}
				<main className="flex-1 overflow-y-auto">{children}</main>
			</div>
		</div>
	);
}
