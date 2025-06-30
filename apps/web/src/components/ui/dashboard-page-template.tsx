/**
 * Dashboard Page Template
 * Consistent layout template for dashboard pages with common patterns
 */

"use client";

import { Calendar, Filter, Plus, RefreshCw, Search, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface DashboardPageTemplateProps {
	title: string;
	description?: string;
	children: ReactNode;
	tabs?: {
		value: string;
		label: string;
		content: ReactNode;
		badge?: string;
	}[];
	actions?: {
		primary?: {
			label: string;
			onClick: () => void;
			icon?: ReactNode;
		};
		secondary?: {
			label: string;
			onClick: () => void;
			icon?: ReactNode;
		}[];
	};
	filters?: {
		search?: {
			placeholder: string;
			value: string;
			onChange: (value: string) => void;
		};
		dateRange?: {
			value: string;
			onChange: (value: string) => void;
			options: { label: string; value: string }[];
		};
		category?: {
			value: string;
			onChange: (value: string) => void;
			options: { label: string; value: string }[];
		};
		status?: {
			value: string;
			onChange: (value: string) => void;
			options: { label: string; value: string }[];
		};
		custom?: ReactNode;
	};
	stats?: {
		label: string;
		value: string | number;
		change?: {
			value: number;
			direction: "up" | "down" | "neutral";
			label: string;
		};
		icon?: ReactNode;
	}[];
	isLoading?: boolean;
	error?: string;
	onRefresh?: () => void;
}

export function DashboardPageTemplate({
	title,
	description,
	children,
	tabs,
	actions,
	filters,
	stats,
	isLoading = false,
	error,
	onRefresh,
}: DashboardPageTemplateProps) {
	const [_activeFilters, setActiveFilters] = useState<string[]>([]);

	const _clearFilter = (filterKey: string) => {
		// This would be handled by the parent component
		setActiveFilters((prev) => prev.filter((f) => f !== filterKey));
	};

	const hasActiveFilters =
		filters?.search?.value ||
		(filters?.dateRange?.value && filters.dateRange.value !== "all") ||
		(filters?.category?.value && filters.category.value !== "all") ||
		(filters?.status?.value && filters.status.value !== "all");

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">{title}</h1>
					{description && (
						<p className="mt-2 text-muted-foreground">{description}</p>
					)}
				</div>

				{(actions?.primary || actions?.secondary?.length || onRefresh) && (
					<div className="flex items-center space-x-2">
						{onRefresh && (
							<Button
								variant="outline"
								size="sm"
								onClick={onRefresh}
								disabled={isLoading}
							>
								<RefreshCw
									className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
								/>
								Refresh
							</Button>
						)}

						{actions?.secondary?.map((action, index) => (
							<Button
								key={index}
								variant="outline"
								size="sm"
								onClick={action.onClick}
							>
								{action.icon}
								{action.label}
							</Button>
						))}

						{actions?.primary && (
							<Button onClick={actions.primary.onClick}>
								{actions.primary.icon}
								{actions.primary.label}
							</Button>
						)}
					</div>
				)}
			</div>

			{/* Stats Cards */}
			{stats && stats.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{stats.map((stat, index) => (
						<Card key={index}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-muted-foreground text-sm">
									{stat.label}
								</CardTitle>
								{stat.icon}
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{stat.value}</div>
								{stat.change && (
									<div
										className={cn(
											"mt-1 flex items-center text-xs",
											stat.change.direction === "up" && "text-green-600",
											stat.change.direction === "down" && "text-red-600",
											stat.change.direction === "neutral" && "text-gray-600",
										)}
									>
										<span className="font-medium">
											{stat.change.direction === "up"
												? "+"
												: stat.change.direction === "down"
													? "-"
													: ""}
											{Math.abs(stat.change.value)}%
										</span>
										<span className="ml-1 text-muted-foreground">
											{stat.change.label}
										</span>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Filters */}
			{filters && (
				<Card>
					<CardContent className="pt-6">
						<div className="flex flex-wrap items-center gap-4">
							{/* Search */}
							{filters.search && (
								<div className="min-w-[200px] max-w-[400px] flex-1">
									<div className="relative">
										<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder={filters.search.placeholder}
											value={filters.search.value}
											onChange={(e) => filters.search?.onChange(e.target.value)}
											className="pl-10"
										/>
									</div>
								</div>
							)}

							{/* Date Range */}
							{filters.dateRange && (
								<Select
									value={filters.dateRange.value}
									onValueChange={filters.dateRange.onChange}
								>
									<SelectTrigger className="w-[140px]">
										<Calendar className="mr-2 h-4 w-4" />
										<SelectValue placeholder="Date range" />
									</SelectTrigger>
									<SelectContent>
										{filters.dateRange.options.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

							{/* Category */}
							{filters.category && (
								<Select
									value={filters.category.value}
									onValueChange={filters.category.onChange}
								>
									<SelectTrigger className="w-[140px]">
										<Filter className="mr-2 h-4 w-4" />
										<SelectValue placeholder="Category" />
									</SelectTrigger>
									<SelectContent>
										{filters.category.options.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

							{/* Status */}
							{filters.status && (
								<Select
									value={filters.status.value}
									onValueChange={filters.status.onChange}
								>
									<SelectTrigger className="w-[120px]">
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent>
										{filters.status.options.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

							{/* Custom Filters */}
							{filters.custom}

							{/* Clear Filters */}
							{hasActiveFilters && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										filters.search?.onChange("");
										filters.dateRange?.onChange("all");
										filters.category?.onChange("all");
										filters.status?.onChange("all");
									}}
								>
									<X className="mr-2 h-4 w-4" />
									Clear Filters
								</Button>
							)}
						</div>

						{/* Active Filter Tags */}
						{hasActiveFilters && (
							<div className="mt-4 flex flex-wrap gap-2">
								{filters.search?.value && (
									<Badge
										variant="secondary"
										className="flex items-center gap-1"
									>
										Search: {filters.search.value}
										<X
											className="h-3 w-3 cursor-pointer"
											onClick={() => filters.search?.onChange("")}
										/>
									</Badge>
								)}
								{filters.dateRange?.value &&
									filters.dateRange.value !== "all" && (
										<Badge
											variant="secondary"
											className="flex items-center gap-1"
										>
											{
												filters.dateRange.options.find(
													(o) => o.value === filters.dateRange?.value,
												)?.label
											}
											<X
												className="h-3 w-3 cursor-pointer"
												onClick={() => filters.dateRange?.onChange("all")}
											/>
										</Badge>
									)}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Error State */}
			{error && (
				<Card className="border-destructive">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-semibold text-destructive">Error</h3>
								<p className="mt-1 text-muted-foreground text-sm">{error}</p>
							</div>
							{onRefresh && (
								<Button variant="outline" size="sm" onClick={onRefresh}>
									<RefreshCw className="mr-2 h-4 w-4" />
									Retry
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Main Content */}
			{tabs ? (
				<Tabs defaultValue={tabs[0]?.value} className="space-y-6">
					<TabsList>
						{tabs.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="flex items-center gap-2"
							>
								{tab.label}
								{tab.badge && (
									<Badge variant="secondary" className="text-xs">
										{tab.badge}
									</Badge>
								)}
							</TabsTrigger>
						))}
					</TabsList>

					{tabs.map((tab) => (
						<TabsContent
							key={tab.value}
							value={tab.value}
							className="space-y-6"
						>
							{tab.content}
						</TabsContent>
					))}
				</Tabs>
			) : (
				children
			)}
		</div>
	);
}

// Preset page templates for common dashboard patterns
export function ListPageTemplate({
	title,
	description,
	items,
	renderItem,
	onCreateNew,
	searchPlaceholder = "Search...",
	emptyStateTitle = "No items found",
	emptyStateDescription = "Get started by creating your first item.",
	...props
}: Omit<DashboardPageTemplateProps, "children"> & {
	items: any[];
	renderItem: (item: any, index: number) => ReactNode;
	onCreateNew?: () => void;
	searchPlaceholder?: string;
	emptyStateTitle?: string;
	emptyStateDescription?: string;
}) {
	return (
		<DashboardPageTemplate
			title={title}
			description={description}
			actions={{
				primary: onCreateNew
					? {
							label: "Create New",
							onClick: onCreateNew,
							icon: <Plus className="mr-2 h-4 w-4" />,
						}
					: undefined,
			}}
			{...props}
		>
			<div className="space-y-4">
				{items.map((item, index) => renderItem(item, index))}

				{items.length === 0 && (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<div className="space-y-2 text-center">
								<h3 className="font-semibold">{emptyStateTitle}</h3>
								<p className="text-muted-foreground">{emptyStateDescription}</p>
								{onCreateNew && (
									<Button onClick={onCreateNew} className="mt-4">
										<Plus className="mr-2 h-4 w-4" />
										Create New
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</DashboardPageTemplate>
	);
}
