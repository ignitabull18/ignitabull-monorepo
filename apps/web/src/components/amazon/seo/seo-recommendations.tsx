import {
	CheckCircle2,
	Clock,
	FileText,
	Image,
	Tag,
	TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface RecommendationData {
	type:
		| "TITLE"
		| "BULLET_POINTS"
		| "DESCRIPTION"
		| "BACKEND_KEYWORDS"
		| "IMAGES"
		| "A_PLUS_CONTENT";
	priority: "HIGH" | "MEDIUM" | "LOW";
	recommendation: string;
	expectedImpact: {
		visibilityIncrease: number;
		trafficIncrease: number;
	};
}

interface SEORecommendationsProps {
	recommendations: RecommendationData[];
}

export function SEORecommendations({
	recommendations,
}: SEORecommendationsProps) {
	const getTypeIcon = (type: string) => {
		switch (type) {
			case "TITLE":
				return <FileText className="h-4 w-4" />;
			case "BACKEND_KEYWORDS":
				return <Tag className="h-4 w-4" />;
			case "IMAGES":
				return <Image className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "TITLE":
				return "Title Optimization";
			case "BACKEND_KEYWORDS":
				return "Backend Keywords";
			case "IMAGES":
				return "Image Optimization";
			case "BULLET_POINTS":
				return "Bullet Points";
			case "DESCRIPTION":
				return "Description";
			case "A_PLUS_CONTENT":
				return "A+ Content";
			default:
				return type;
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
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

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>SEO Recommendations</CardTitle>
				<CardDescription>
					Actionable improvements for your listing
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{recommendations.map((rec, index) => (
						<div key={index} className="space-y-3 rounded-lg border p-4">
							<div className="flex items-start justify-between gap-2">
								<div className="flex items-center gap-2">
									{getTypeIcon(rec.type)}
									<h4 className="font-medium">{getTypeLabel(rec.type)}</h4>
								</div>
								<Badge variant={getPriorityColor(rec.priority)}>
									{rec.priority}
								</Badge>
							</div>

							<p className="text-muted-foreground text-sm">
								{rec.recommendation}
							</p>

							<div className="flex items-center gap-4 text-sm">
								<div className="flex items-center gap-1">
									<TrendingUp className="h-3 w-3 text-green-500" />
									<span>
										+{rec.expectedImpact.visibilityIncrease}% visibility
									</span>
								</div>
								<div className="flex items-center gap-1">
									<TrendingUp className="h-3 w-3 text-blue-500" />
									<span>+{rec.expectedImpact.trafficIncrease}% traffic</span>
								</div>
							</div>

							<div className="flex items-center gap-2 pt-2">
								<Button size="sm" variant="outline">
									<Clock className="mr-1 h-3 w-3" />
									Schedule
								</Button>
								<Button size="sm">
									<CheckCircle2 className="mr-1 h-3 w-3" />
									Apply Now
								</Button>
							</div>
						</div>
					))}

					{recommendations.length === 0 && (
						<div className="py-8 text-center text-muted-foreground">
							No recommendations available
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
