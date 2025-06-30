/**
 * Chart Wrapper Component
 * Consistent wrapper for all chart components with loading and error states
 */

"use client";

import { Download, MoreVertical, RefreshCw, Share2 } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartWrapperProps {
	title: string;
	description?: string;
	children: ReactNode;
	isLoading?: boolean;
	error?: string;
	onRefresh?: () => void;
	onExport?: () => void;
	onShare?: () => void;
	className?: string;
	headerActions?: ReactNode;
	height?: number;
}

export function ChartWrapper({
	title,
	description,
	children,
	isLoading = false,
	error,
	onRefresh,
	onExport,
	onShare,
	className,
	headerActions,
	height = 400,
}: ChartWrapperProps) {
	return (
		<Card className={cn("w-full", className)}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
				<div className="space-y-1">
					<CardTitle className="font-semibold text-lg">{title}</CardTitle>
					{description && (
						<CardDescription className="text-muted-foreground text-sm">
							{description}
						</CardDescription>
					)}
				</div>

				<div className="flex items-center space-x-2">
					{headerActions}

					{(onRefresh || onExport || onShare) && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon" className="h-8 w-8">
									<MoreVertical className="h-4 w-4" />
									<span className="sr-only">Chart options</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{onRefresh && (
									<DropdownMenuItem onClick={onRefresh}>
										<RefreshCw className="mr-2 h-4 w-4" />
										Refresh
									</DropdownMenuItem>
								)}
								{onExport && (
									<DropdownMenuItem onClick={onExport}>
										<Download className="mr-2 h-4 w-4" />
										Export
									</DropdownMenuItem>
								)}
								{onShare && (
									<DropdownMenuItem onClick={onShare}>
										<Share2 className="mr-2 h-4 w-4" />
										Share
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</CardHeader>

			<CardContent>
				{error ? (
					<Alert variant="destructive">
						<AlertDescription className="flex items-center justify-between">
							<span>{error}</span>
							{onRefresh && (
								<Button
									variant="outline"
									size="sm"
									onClick={onRefresh}
									className="ml-2"
								>
									<RefreshCw className="mr-1 h-3 w-3" />
									Retry
								</Button>
							)}
						</AlertDescription>
					</Alert>
				) : isLoading ? (
					<div className="space-y-4">
						<Skeleton className="h-6 w-1/3" />
						<Skeleton className={"w-full"} style={{ height: `${height}px` }} />
						<div className="flex space-x-2">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-16" />
						</div>
					</div>
				) : (
					<div style={{ height: `${height}px` }} className="w-full">
						{children}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// Preset chart wrapper variants for common chart types
export function LineChartWrapper({
	data,
	...props
}: ChartWrapperProps & { data?: any[] }) {
	return (
		<ChartWrapper {...props}>
			{/* Chart content will be passed as children */}
			{props.children}
		</ChartWrapper>
	);
}

export function BarChartWrapper({
	data,
	...props
}: ChartWrapperProps & { data?: any[] }) {
	return (
		<ChartWrapper {...props}>
			{/* Chart content will be passed as children */}
			{props.children}
		</ChartWrapper>
	);
}

export function PieChartWrapper({
	data,
	...props
}: ChartWrapperProps & { data?: any[] }) {
	return (
		<ChartWrapper height={300} {...props}>
			{/* Chart content will be passed as children */}
			{props.children}
		</ChartWrapper>
	);
}

export function AreaChartWrapper({
	data,
	...props
}: ChartWrapperProps & { data?: any[] }) {
	return (
		<ChartWrapper {...props}>
			{/* Chart content will be passed as children */}
			{props.children}
		</ChartWrapper>
	);
}
