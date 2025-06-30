import {
	AlertTriangle,
	Calendar,
	DollarSign,
	Eye,
	MousePointer,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface AnomalyData {
	type:
		| "TRAFFIC_DROP"
		| "RANKING_LOSS"
		| "CTR_DECLINE"
		| "COMPETITOR_SURGE"
		| "ALGORITHM_UPDATE";
	severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
	detectedDate: string;
	affectedKeywords: string[];
	impact: {
		impressionsChange: number;
		clicksChange: number;
		revenueChange: number;
	};
}

interface SearchAnomaliesProps {
	anomalies: AnomalyData[];
}

export function SearchAnomalies({ anomalies }: SearchAnomaliesProps) {
	const getTypeLabel = (type: string) => {
		switch (type) {
			case "TRAFFIC_DROP":
				return "Traffic Drop";
			case "RANKING_LOSS":
				return "Ranking Loss";
			case "CTR_DECLINE":
				return "CTR Decline";
			case "COMPETITOR_SURGE":
				return "Competitor Surge";
			case "ALGORITHM_UPDATE":
				return "Algorithm Update";
			default:
				return type;
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "CRITICAL":
				return "destructive";
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

	const getAlertVariant = (severity: string): "default" | "destructive" => {
		return severity === "CRITICAL" || severity === "HIGH"
			? "destructive"
			: "default";
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>Search Anomalies</CardTitle>
				<CardDescription>Recent performance issues detected</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{anomalies.map((anomaly, index) => (
						<Alert key={index} variant={getAlertVariant(anomaly.severity)}>
							<AlertTriangle className="h-4 w-4" />
							<AlertTitle className="flex items-center justify-between">
								<span>{getTypeLabel(anomaly.type)}</span>
								<div className="flex items-center gap-2">
									<Badge variant={getSeverityColor(anomaly.severity)}>
										{anomaly.severity}
									</Badge>
									<span className="flex items-center gap-1 text-muted-foreground text-xs">
										<Calendar className="h-3 w-3" />
										{formatDate(anomaly.detectedDate)}
									</span>
								</div>
							</AlertTitle>
							<AlertDescription className="mt-2 space-y-2">
								<div className="text-sm">
									Affected keywords: {anomaly.affectedKeywords.join(", ")}
								</div>

								<div className="mt-3 grid grid-cols-3 gap-4 text-sm">
									<div className="flex items-center gap-1">
										<Eye className="h-3 w-3 text-muted-foreground" />
										<span
											className={
												anomaly.impact.impressionsChange < 0
													? "text-red-600"
													: ""
											}
										>
											{anomaly.impact.impressionsChange > 0 ? "+" : ""}
											{anomaly.impact.impressionsChange}% impressions
										</span>
									</div>
									<div className="flex items-center gap-1">
										<MousePointer className="h-3 w-3 text-muted-foreground" />
										<span
											className={
												anomaly.impact.clicksChange < 0 ? "text-red-600" : ""
											}
										>
											{anomaly.impact.clicksChange > 0 ? "+" : ""}
											{anomaly.impact.clicksChange}% clicks
										</span>
									</div>
									<div className="flex items-center gap-1">
										<DollarSign className="h-3 w-3 text-muted-foreground" />
										<span
											className={
												anomaly.impact.revenueChange < 0 ? "text-red-600" : ""
											}
										>
											{anomaly.impact.revenueChange > 0 ? "+" : ""}
											{anomaly.impact.revenueChange}% revenue
										</span>
									</div>
								</div>
							</AlertDescription>
						</Alert>
					))}

					{anomalies.length === 0 && (
						<div className="py-8 text-center text-muted-foreground">
							No anomalies detected - all systems normal
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
