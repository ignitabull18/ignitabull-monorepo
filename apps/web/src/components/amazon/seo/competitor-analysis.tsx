import { AlertTriangle, Building2, Share2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface CompetitorData {
	asin: string;
	brand: string;
	visibilityScore: number;
	sharedKeywords: number;
	threatLevel: "HIGH" | "MEDIUM" | "LOW";
}

interface CompetitorAnalysisProps {
	competitors: CompetitorData[];
}

export function CompetitorAnalysis({ competitors }: CompetitorAnalysisProps) {
	const getThreatColor = (threat: string) => {
		switch (threat) {
			case "HIGH":
				return "destructive";
			case "MEDIUM":
				return "warning";
			case "LOW":
				return "secondary";
			default:
				return "secondary";
		}
	};

	const getThreatIcon = (threat: string) => {
		switch (threat) {
			case "HIGH":
				return "text-red-500";
			case "MEDIUM":
				return "text-yellow-500";
			case "LOW":
				return "text-green-500";
			default:
				return "text-gray-500";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Competitor Analysis</CardTitle>
				<CardDescription>
					Monitor your top competitors and their search visibility
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{competitors.map((competitor, index) => (
						<div
							key={index}
							className="space-y-3 rounded-lg border p-4 transition-colors hover:border-primary/50"
						>
							<div className="flex items-start justify-between">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<Building2 className="h-4 w-4 text-muted-foreground" />
										<h4 className="font-semibold">{competitor.brand}</h4>
									</div>
									<p className="text-muted-foreground text-xs">
										{competitor.asin}
									</p>
								</div>
								<Badge variant={getThreatColor(competitor.threatLevel)}>
									<AlertTriangle
										className={`mr-1 h-3 w-3 ${getThreatIcon(competitor.threatLevel)}`}
									/>
									{competitor.threatLevel}
								</Badge>
							</div>

							<div className="space-y-3">
								{/* Visibility Score */}
								<div className="space-y-1">
									<div className="flex items-center justify-between text-sm">
										<span className="flex items-center gap-1 text-muted-foreground">
											<Target className="h-3 w-3" />
											Visibility Score
										</span>
										<span className="font-semibold">
											{competitor.visibilityScore}
										</span>
									</div>
									<div className="h-2 w-full rounded-full bg-secondary">
										<div
											className="h-2 rounded-full bg-primary transition-all"
											style={{ width: `${competitor.visibilityScore}%` }}
										/>
									</div>
								</div>

								{/* Shared Keywords */}
								<div className="flex items-center justify-between text-sm">
									<span className="flex items-center gap-1 text-muted-foreground">
										<Share2 className="h-3 w-3" />
										Shared Keywords
									</span>
									<span className="font-semibold">
										{competitor.sharedKeywords}
									</span>
								</div>
							</div>

							{/* Action Button */}
							<button className="w-full text-primary text-sm hover:underline">
								View Details →
							</button>
						</div>
					))}
				</div>

				{competitors.length === 0 && (
					<div className="py-8 text-center text-muted-foreground">
						No competitors analyzed yet
					</div>
				)}
			</CardContent>
		</Card>
	);
}
