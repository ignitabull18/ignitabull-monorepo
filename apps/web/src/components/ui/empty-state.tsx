/**
 * Empty State Component
 * Reusable component for displaying empty states with actions
 */

"use client";

import {
	Database,
	FileText,
	type LucideIcon,
	RefreshCw,
	Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
		variant?: "default" | "outline" | "secondary";
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
	size?: "sm" | "md" | "lg";
}

export function EmptyState({
	icon: Icon = FileText,
	title,
	description,
	action,
	secondaryAction,
	className,
	size = "md",
}: EmptyStateProps) {
	const sizeClasses = {
		sm: {
			container: "py-8",
			icon: "h-8 w-8",
			title: "text-lg",
			description: "text-sm",
			spacing: "space-y-3",
		},
		md: {
			container: "py-12",
			icon: "h-12 w-12",
			title: "text-xl",
			description: "text-base",
			spacing: "space-y-4",
		},
		lg: {
			container: "py-16",
			icon: "h-16 w-16",
			title: "text-2xl",
			description: "text-lg",
			spacing: "space-y-6",
		},
	};

	const currentSize = sizeClasses[size];

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center text-center",
				currentSize.container,
				currentSize.spacing,
				className,
			)}
		>
			<div className={cn("rounded-full bg-muted p-4", size === "lg" && "p-6")}>
				<Icon className={cn(currentSize.icon, "text-muted-foreground")} />
			</div>

			<div className="space-y-2">
				<h3 className={cn("font-semibold text-foreground", currentSize.title)}>
					{title}
				</h3>
				<p
					className={cn(
						"max-w-md text-muted-foreground",
						currentSize.description,
					)}
				>
					{description}
				</p>
			</div>

			{(action || secondaryAction) && (
				<div className="flex flex-col gap-2 sm:flex-row">
					{action && (
						<Button
							onClick={action.onClick}
							variant={action.variant || "default"}
							size={size === "sm" ? "sm" : "default"}
						>
							{action.label}
						</Button>
					)}
					{secondaryAction && (
						<Button
							onClick={secondaryAction.onClick}
							variant="outline"
							size={size === "sm" ? "sm" : "default"}
						>
							{secondaryAction.label}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

// Preset empty state variants for common scenarios
export function NoDataEmptyState({
	entityName,
	onRefresh,
	onCreate,
	className,
}: {
	entityName: string;
	onRefresh?: () => void;
	onCreate?: () => void;
	className?: string;
}) {
	return (
		<EmptyState
			icon={Database}
			title={`No ${entityName} found`}
			description={`There are no ${entityName.toLowerCase()} to display. ${onCreate ? "Get started by creating your first one." : "Try refreshing or adjusting your filters."}`}
			action={
				onCreate
					? {
							label: `Create ${entityName}`,
							onClick: onCreate,
						}
					: undefined
			}
			secondaryAction={
				onRefresh
					? {
							label: "Refresh",
							onClick: onRefresh,
						}
					: undefined
			}
			className={className}
		/>
	);
}

export function SearchEmptyState({
	searchTerm,
	onClearSearch,
	onCreateNew,
	entityName = "items",
	className,
}: {
	searchTerm: string;
	onClearSearch: () => void;
	onCreateNew?: () => void;
	entityName?: string;
	className?: string;
}) {
	return (
		<EmptyState
			icon={Search}
			title="No results found"
			description={`No ${entityName} match "${searchTerm}". Try adjusting your search terms or create a new item.`}
			action={
				onCreateNew
					? {
							label: "Create New",
							onClick: onCreateNew,
						}
					: {
							label: "Clear Search",
							onClick: onClearSearch,
							variant: "outline",
						}
			}
			secondaryAction={
				onCreateNew
					? {
							label: "Clear Search",
							onClick: onClearSearch,
						}
					: undefined
			}
			className={className}
		/>
	);
}

export function LoadingEmptyState({
	title = "Loading...",
	description = "Please wait while we fetch your data.",
	className,
}: {
	title?: string;
	description?: string;
	className?: string;
}) {
	return (
		<EmptyState
			icon={RefreshCw}
			title={title}
			description={description}
			className={cn("animate-pulse", className)}
		/>
	);
}

export function ErrorEmptyState({
	title = "Something went wrong",
	description = "We encountered an error while loading your data.",
	onRetry,
	className,
}: {
	title?: string;
	description?: string;
	onRetry?: () => void;
	className?: string;
}) {
	return (
		<EmptyState
			icon={RefreshCw}
			title={title}
			description={description}
			action={
				onRetry
					? {
							label: "Try Again",
							onClick: onRetry,
						}
					: undefined
			}
			className={className}
		/>
	);
}

// Card wrapper for empty states
export function EmptyStateCard({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<Card className={cn("border-dashed", className)}>
			<CardContent className="p-0">{children}</CardContent>
		</Card>
	);
}
