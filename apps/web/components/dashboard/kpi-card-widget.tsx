"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ignitabull/ui/components/card";
import { Skeleton } from "@ignitabull/ui/components/skeleton";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardWidgetProps {
	title: string;
	description: string;
	value: number | string;
	previousValue?: number;
	percentageChange?: number;
	currency?: string;
	loading?: boolean;
	error?: string;
	icon?: React.ReactNode;
	valueFormatter?: (value: number | string) => string;
	emptyStateMessage?: string;
	showAsEmpty?: boolean;
}

export function KPICardWidget({
	title,
	description,
	value,
	previousValue,
	percentageChange,
	currency,
	loading = false,
	error,
	icon,
	valueFormatter,
	emptyStateMessage,
	showAsEmpty = false,
}: KPICardWidgetProps) {
	const formatValue = (val: number | string): string => {
		if (valueFormatter) {
			return valueFormatter(val);
		}

		if (typeof val === "string") {
			return val;
		}

		if (currency) {
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: currency,
				minimumFractionDigits: 0,
				maximumFractionDigits: 2,
			}).format(val);
		}

		return new Intl.NumberFormat("en-US").format(val);
	};

	const getTrendIcon = () => {
		if (percentageChange === undefined || percentageChange === 0) {
			return <Minus className="h-4 w-4 text-gray-400" />;
		}
		if (percentageChange > 0) {
			return <TrendingUp className="h-4 w-4 text-green-500" />;
		}
		return <TrendingDown className="h-4 w-4 text-red-500" />;
	};

	const getTrendColor = () => {
		if (percentageChange === undefined || percentageChange === 0) {
			return "text-gray-600";
		}
		return percentageChange > 0 ? "text-green-600" : "text-red-600";
	};

	const formatPercentage = (percentage: number): string => {
		const formatted = Math.abs(percentage).toFixed(1);
		return `${percentage > 0 ? "+" : "-"}${formatted}%`;
	};

	if (loading) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">
						<Skeleton className="h-4 w-24" />
					</CardTitle>
					{icon && <div className="opacity-50">{icon}</div>}
				</CardHeader>
				<CardContent>
					<Skeleton className="mb-2 h-8 w-20" />
					<Skeleton className="h-4 w-16" />
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">{title}</CardTitle>
					{icon && <div className="opacity-50">{icon}</div>}
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl text-gray-400">--</div>
					<p className="text-red-600 text-xs">{error}</p>
				</CardContent>
			</Card>
		);
	}

	if (showAsEmpty) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">{title}</CardTitle>
					{icon && <div className="opacity-50">{icon}</div>}
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl text-gray-400">--</div>
					<p className="text-muted-foreground text-xs">
						{emptyStateMessage || "No data available"}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">{title}</CardTitle>
				{icon && <div className="text-muted-foreground">{icon}</div>}
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">{formatValue(value)}</div>
				<div className="flex items-center space-x-2 text-xs">
					{percentageChange !== undefined && (
						<>
							<div className="flex items-center space-x-1">
								{getTrendIcon()}
								<span className={cn("font-medium", getTrendColor())}>
									{formatPercentage(percentageChange)}
								</span>
							</div>
							<span className="text-muted-foreground">vs yesterday</span>
						</>
					)}
					{percentageChange === undefined && (
						<p className="text-muted-foreground">{description}</p>
					)}
				</div>
				{previousValue !== undefined && (
					<p className="mt-1 text-muted-foreground text-xs">
						Previous: {formatValue(previousValue)}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
