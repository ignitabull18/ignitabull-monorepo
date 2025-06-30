import { Search, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface OpportunityData {
	keyword: string;
	searchVolume: number;
	competition: "HIGH" | "MEDIUM" | "LOW";
	estimatedTraffic: number;
	conversionPotential: number;
}

interface SearchOpportunitiesProps {
	opportunities: OpportunityData[];
}

export function SearchOpportunities({
	opportunities,
}: SearchOpportunitiesProps) {
	const getCompetitionColor = (competition: string) => {
		switch (competition) {
			case "LOW":
				return "bg-green-100 text-green-800";
			case "MEDIUM":
				return "bg-yellow-100 text-yellow-800";
			case "HIGH":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatNumber = (num: number) => {
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}K`;
		}
		return num.toString();
	};

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>Search Opportunities</CardTitle>
				<CardDescription>High-potential keywords to target</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{opportunities.map((opportunity, index) => (
						<div
							key={index}
							className="space-y-3 rounded-lg border p-4 transition-colors hover:bg-secondary/50"
						>
							<div className="flex items-start justify-between gap-2">
								<h4 className="flex-1 font-medium">{opportunity.keyword}</h4>
								<Badge
									variant="secondary"
									className={getCompetitionColor(opportunity.competition)}
								>
									{opportunity.competition}
								</Badge>
							</div>

							<div className="grid grid-cols-3 gap-4 text-sm">
								<div className="space-y-1">
									<div className="flex items-center gap-1 text-muted-foreground">
										<Search className="h-3 w-3" />
										<span>Volume</span>
									</div>
									<div className="font-semibold">
										{formatNumber(opportunity.searchVolume)}
									</div>
								</div>

								<div className="space-y-1">
									<div className="flex items-center gap-1 text-muted-foreground">
										<Users className="h-3 w-3" />
										<span>Traffic</span>
									</div>
									<div className="font-semibold">
										{formatNumber(opportunity.estimatedTraffic)}
									</div>
								</div>

								<div className="space-y-1">
									<div className="flex items-center gap-1 text-muted-foreground">
										<TrendingUp className="h-3 w-3" />
										<span>CVR</span>
									</div>
									<div className="font-semibold">
										{opportunity.conversionPotential.toFixed(1)}%
									</div>
								</div>
							</div>

							{/* Opportunity Score Bar */}
							<div className="space-y-1">
								<div className="flex justify-between text-muted-foreground text-xs">
									<span>Opportunity Score</span>
									<span>
										{Math.round(
											(opportunity.searchVolume *
												opportunity.conversionPotential) /
												1000,
										)}
									</span>
								</div>
								<div className="h-2 w-full rounded-full bg-secondary">
									<div
										className="h-2 rounded-full bg-primary transition-all"
										style={{
											width: `${Math.min(100, (opportunity.searchVolume * opportunity.conversionPotential) / 500)}%`,
										}}
									/>
								</div>
							</div>
						</div>
					))}

					{opportunities.length === 0 && (
						<div className="py-8 text-center text-muted-foreground">
							No opportunities found
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
