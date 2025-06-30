/**
 * Loading Skeleton Components
 * Consistent loading states for dashboard components
 */

"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
	className?: string;
}

// Basic skeleton variants
export function StatCardSkeleton({ className }: LoadingSkeletonProps) {
	return (
		<Card className={className}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-4" />
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-3 w-32" />
				</div>
			</CardContent>
		</Card>
	);
}

export function ChartSkeleton({
	className,
	height = 400,
}: LoadingSkeletonProps & { height?: number }) {
	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
					<Skeleton className="h-8 w-8" />
				</div>
			</CardHeader>
			<CardContent>
				<Skeleton className="w-full" style={{ height: `${height}px` }} />
			</CardContent>
		</Card>
	);
}

export function DataTableSkeleton({
	className,
	rows = 5,
	columns = 4,
}: LoadingSkeletonProps & { rows?: number; columns?: number }) {
	return (
		<div className={cn("space-y-4", className)}>
			{/* Toolbar */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-9 w-64" />
				<div className="flex space-x-2">
					<Skeleton className="h-9 w-20" />
					<Skeleton className="h-9 w-24" />
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<div className="border-b bg-muted/50 p-4">
					<div className="flex space-x-4">
						{Array.from({ length: columns }).map((_, i) => (
							<Skeleton key={i} className="h-4 w-24" />
						))}
					</div>
				</div>
				<div className="divide-y">
					{Array.from({ length: rows }).map((_, i) => (
						<div key={i} className="flex space-x-4 p-4">
							{Array.from({ length: columns }).map((_, j) => (
								<Skeleton key={j} className="h-4 w-20" />
							))}
						</div>
					))}
				</div>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-40" />
				<div className="flex space-x-2">
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
				</div>
			</div>
		</div>
	);
}

// Complex dashboard skeletons
export function DashboardOverviewSkeleton({ className }: LoadingSkeletonProps) {
	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-96" />
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<StatCardSkeleton key={i} />
				))}
			</div>

			{/* Charts Grid */}
			<div className="grid gap-6 md:grid-cols-2">
				<ChartSkeleton />
				<ChartSkeleton />
			</div>

			{/* Data Table */}
			<DataTableSkeleton />
		</div>
	);
}

export function ProductListSkeleton({
	className,
	items = 8,
}: LoadingSkeletonProps & { items?: number }) {
	return (
		<div className={cn("space-y-4", className)}>
			{Array.from({ length: items }).map((_, i) => (
				<Card key={i}>
					<CardContent className="p-6">
						<div className="flex items-start space-x-4">
							<Skeleton className="h-20 w-20 rounded-md" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
								<div className="flex items-center space-x-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-4 w-24" />
								</div>
							</div>
							<div className="space-y-2">
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-4 w-12" />
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function InfluencerCardSkeleton({ className }: LoadingSkeletonProps) {
	return (
		<Card className={className}>
			<CardContent className="p-6">
				<div className="flex items-start space-x-4">
					<Skeleton className="h-16 w-16 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-24" />
						<div className="flex items-center space-x-2">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-4 w-16" />
						</div>
					</div>
					<Skeleton className="h-8 w-20" />
				</div>
				<div className="mt-4 grid grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="space-y-1 text-center">
							<Skeleton className="mx-auto h-6 w-12" />
							<Skeleton className="mx-auto h-3 w-16" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export function CampaignCardSkeleton({ className }: LoadingSkeletonProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-6 w-16" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Skeleton className="h-3 w-16" />
							<Skeleton className="h-4 w-20" />
						</div>
						<div className="space-y-1">
							<Skeleton className="h-3 w-12" />
							<Skeleton className="h-4 w-16" />
						</div>
					</div>
					<Skeleton className="h-2 w-full" />
					<div className="flex items-center space-x-2">
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-8 w-16" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Page-level skeletons
export function PageHeaderSkeleton({ className }: LoadingSkeletonProps) {
	return (
		<div className={cn("space-y-4 pb-6", className)}>
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
				</div>
				<div className="flex space-x-2">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-32" />
				</div>
			</div>
		</div>
	);
}

export function TabsSkeleton({
	className,
	tabCount = 4,
}: LoadingSkeletonProps & { tabCount?: number }) {
	return (
		<div className={cn("space-y-4", className)}>
			<div className="flex space-x-1 border-b">
				{Array.from({ length: tabCount }).map((_, i) => (
					<Skeleton key={i} className="h-9 w-24" />
				))}
			</div>
			<div className="space-y-4">
				<DashboardOverviewSkeleton />
			</div>
		</div>
	);
}
