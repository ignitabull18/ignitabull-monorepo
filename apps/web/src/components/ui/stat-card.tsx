/**
 * Stat Card Component
 * Reusable card component for displaying statistics and metrics
 */

"use client";

import { type LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface StatCardProps {
	title: string;
	value: string | number;
	description?: string;
	icon?: LucideIcon;
	trend?: {
		value: number;
		label: string;
		direction: "up" | "down" | "neutral";
	};
	progress?: {
		value: number;
		max?: number;
		label?: string;
	};
	badge?: {
		text: string;
		variant?: "default" | "secondary" | "destructive" | "outline";
	};
	className?: string;
	onClick?: () => void;
}

export function StatCard({
	title,
	value,
	description,
	icon: Icon,
	trend,
	progress,
	badge,
	className,
	onClick,
}: StatCardProps) {
	const formatValue = (val: string | number) => {
		if (typeof val === "number") {
			if (val >= 1000000) {
				return `${(val / 1000000).toFixed(1)}M`;
			}
			if (val >= 1000) {
				return `${(val / 1000).toFixed(1)}K`;
			}
			return val.toLocaleString();
		}
		return val;
	};

	const getTrendIcon = (direction: "up" | "down" | "neutral") => {
		switch (direction) {
			case "up":
				return <TrendingUp className="h-3 w-3" />;
			case "down":
				return <TrendingDown className="h-3 w-3" />;
			default:
				return <Minus className="h-3 w-3" />;
		}
	};

	const getTrendColor = (direction: "up" | "down" | "neutral") => {
		switch (direction) {
			case "up":
				return "text-green-600";
			case "down":
				return "text-red-600";
			default:
				return "text-gray-600";
		}
	};

	return (
		<Card
			className={cn(
				"transition-all duration-200",
				onClick && "cursor-pointer hover:shadow-md",
				className,
			)}
			onClick={onClick}
		>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-muted-foreground text-sm">
					{title}
				</CardTitle>
				{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<div className="font-bold text-2xl">{formatValue(value)}</div>
							{badge && (
								<Badge variant={badge.variant || "secondary"}>
									{badge.text}
								</Badge>
							)}
						</div>

						{trend && (
							<div
								className={cn(
									"mt-1 flex items-center gap-1 text-xs",
									getTrendColor(trend.direction),
								)}
							>
								{getTrendIcon(trend.direction)}
								<span className="font-medium">
									{trend.direction === "up"
										? "+"
										: trend.direction === "down"
											? "-"
											: ""}
									{Math.abs(trend.value)}
									{trend.value.toString().includes(".") ? "" : "%"}
								</span>
								<span className="text-muted-foreground">{trend.label}</span>
							</div>
						)}

						{description && !trend && (
							<p className="mt-1 text-muted-foreground text-xs">
								{description}
							</p>
						)}
					</div>
				</div>

				{progress && (
					<div className="mt-4">
						<div className="mb-1 flex items-center justify-between text-xs">
							{progress.label && (
								<span className="text-muted-foreground">{progress.label}</span>
							)}
							<span className="font-medium">
								{progress.value}
								{progress.max && `/${progress.max}`}
							</span>
						</div>
						<Progress
							value={
								progress.max
									? (progress.value / progress.max) * 100
									: progress.value
							}
							className="h-2"
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// Preset stat card variants for common use cases
export function MetricCard({
	metric,
	className,
}: {
	metric: {
		label: string;
		value: string | number;
		change?: number;
		changeLabel?: string;
		icon?: LucideIcon;
	};
	className?: string;
}) {
	return (
		<StatCard
			title={metric.label}
			value={metric.value}
			icon={metric.icon}
			trend={
				metric.change !== undefined
					? {
							value: Math.abs(metric.change),
							label: metric.changeLabel || "vs last period",
							direction:
								metric.change > 0
									? "up"
									: metric.change < 0
										? "down"
										: "neutral",
						}
					: undefined
			}
			className={className}
		/>
	);
}

export function ProgressCard({
	title,
	current,
	target,
	label,
	icon,
	className,
}: {
	title: string;
	current: number;
	target: number;
	label?: string;
	icon?: LucideIcon;
	className?: string;
}) {
	const percentage = (current / target) * 100;

	return (
		<StatCard
			title={title}
			value={current}
			icon={icon}
			progress={{
				value: current,
				max: target,
				label: label || `${Math.round(percentage)}% of target`,
			}}
			className={className}
		/>
	);
}

export function ComparisonCard({
	title,
	primary,
	secondary,
	icon,
	className,
}: {
	title: string;
	primary: { label: string; value: string | number };
	secondary: { label: string; value: string | number };
	icon?: LucideIcon;
	className?: string;
}) {
	return (
		<Card className={className}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-muted-foreground text-sm">
					{title}
				</CardTitle>
				{icon && <icon className="h-4 w-4 text-muted-foreground" />}
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div>
						<div className="text-muted-foreground text-xs">{primary.label}</div>
						<div className="font-bold text-2xl">{primary.value}</div>
					</div>
					<div>
						<div className="text-muted-foreground text-xs">
							{secondary.label}
						</div>
						<div className="font-semibold text-lg text-muted-foreground">
							{secondary.value}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
