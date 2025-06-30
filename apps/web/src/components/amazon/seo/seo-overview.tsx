import {
	BarChart3,
	Eye,
	MousePointer,
	Target,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SEOOverviewProps {
	data: {
		visibilityScore: number;
		visibilityTrend: "UP" | "DOWN" | "STABLE";
		totalImpressions: number;
		totalClicks: number;
		averageCTR: number;
		topKeywords: string[];
	};
}

export function SEOOverview({ data }: SEOOverviewProps) {
	const getTrendIcon = (trend: string) => {
		switch (trend) {
			case "UP":
				return <TrendingUp className="h-4 w-4 text-green-500" />;
			case "DOWN":
				return <TrendingDown className="h-4 w-4 text-red-500" />;
			default:
				return <BarChart3 className="h-4 w-4 text-gray-500" />;
		}
	};

	const formatNumber = (num: number) => {
		if (num >= 1000000) {
			return `${(num / 1000000).toFixed(1)}M`;
		}
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}K`;
		}
		return num.toString();
	};

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{/* Visibility Score */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">
						Search Visibility Score
					</CardTitle>
					<Target className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="flex items-baseline gap-2">
						<div className="font-bold text-2xl">{data.visibilityScore}</div>
						<div className="flex items-center text-muted-foreground text-xs">
							{getTrendIcon(data.visibilityTrend)}
							<span className="ml-1">{data.visibilityTrend}</span>
						</div>
					</div>
					<div className="mt-2 h-2 w-full rounded-full bg-secondary">
						<div
							className="h-2 rounded-full bg-primary transition-all"
							style={{ width: `${data.visibilityScore}%` }}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Impressions */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">
						Total Impressions
					</CardTitle>
					<Eye className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{formatNumber(data.totalImpressions)}
					</div>
					<p className="text-muted-foreground text-xs">Last 30 days</p>
				</CardContent>
			</Card>

			{/* Clicks */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Clicks</CardTitle>
					<MousePointer className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{formatNumber(data.totalClicks)}
					</div>
					<p className="text-muted-foreground text-xs">Last 30 days</p>
				</CardContent>
			</Card>

			{/* CTR */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Average CTR</CardTitle>
					<BarChart3 className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{data.averageCTR.toFixed(1)}%
					</div>
					<p className="text-muted-foreground text-xs">Click-through rate</p>
				</CardContent>
			</Card>

			{/* Top Keywords */}
			<Card className="md:col-span-2 lg:col-span-4">
				<CardHeader>
					<CardTitle className="font-medium text-sm">
						Top Search Keywords
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{data.topKeywords.map((keyword, index) => (
							<div
								key={index}
								className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm"
							>
								{keyword}
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
