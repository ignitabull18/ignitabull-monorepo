import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface RankingData {
	keyword: string;
	currentRank: number;
	previousRank: number;
	rankChange: number;
}

interface KeywordRankingsProps {
	rankings: {
		improved: RankingData[];
		declined: RankingData[];
		new: RankingData[];
		lost: RankingData[];
	};
}

export function KeywordRankings({ rankings }: KeywordRankingsProps) {
	const getRankChangeIcon = (change: number) => {
		if (change > 0) {
			return <ArrowUp className="h-4 w-4 text-green-500" />;
		}
		if (change < 0) {
			return <ArrowDown className="h-4 w-4 text-red-500" />;
		}
		return <Minus className="h-4 w-4 text-gray-500" />;
	};

	const RankingItem = ({
		item,
		isNew = false,
	}: {
		item: RankingData;
		isNew?: boolean;
	}) => (
		<div className="flex items-center justify-between border-b py-2 last:border-0">
			<div className="flex-1">
				<div className="font-medium">{item.keyword}</div>
				<div className="text-muted-foreground text-sm">
					{isNew ? "New ranking" : `Was rank ${item.previousRank}`}
				</div>
			</div>
			<div className="flex items-center gap-3">
				<div className="text-right">
					<div className="font-semibold">#{item.currentRank}</div>
				</div>
				<div className="flex items-center gap-1">
					{getRankChangeIcon(item.rankChange)}
					<span
						className={`font-medium text-sm ${
							item.rankChange > 0
								? "text-green-500"
								: item.rankChange < 0
									? "text-red-500"
									: "text-gray-500"
						}`}
					>
						{Math.abs(item.rankChange)}
					</span>
				</div>
			</div>
		</div>
	);

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>Keyword Rankings</CardTitle>
				<CardDescription>Track your keyword position changes</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Improved Rankings */}
				{rankings.improved.length > 0 && (
					<div>
						<h4 className="mb-2 font-semibold text-green-600 text-sm">
							Improved Rankings
						</h4>
						<div className="space-y-1">
							{rankings.improved.map((item, index) => (
								<RankingItem key={index} item={item} />
							))}
						</div>
					</div>
				)}

				{/* Declined Rankings */}
				{rankings.declined.length > 0 && (
					<div>
						<h4 className="mb-2 font-semibold text-red-600 text-sm">
							Declined Rankings
						</h4>
						<div className="space-y-1">
							{rankings.declined.map((item, index) => (
								<RankingItem key={index} item={item} />
							))}
						</div>
					</div>
				)}

				{/* New Rankings */}
				{rankings.new.length > 0 && (
					<div>
						<h4 className="mb-2 font-semibold text-blue-600 text-sm">
							New Rankings
						</h4>
						<div className="space-y-1">
							{rankings.new.map((item, index) => (
								<RankingItem key={index} item={item} isNew />
							))}
						</div>
					</div>
				)}

				{/* Lost Rankings */}
				{rankings.lost.length > 0 && (
					<div>
						<h4 className="mb-2 font-semibold text-gray-600 text-sm">
							Lost Rankings
						</h4>
						<div className="space-y-1">
							{rankings.lost.map((item, index) => (
								<RankingItem key={index} item={item} />
							))}
						</div>
					</div>
				)}

				{/* Empty State */}
				{Object.values(rankings).every((arr) => arr.length === 0) && (
					<div className="py-8 text-center text-muted-foreground">
						No ranking changes detected
					</div>
				)}
			</CardContent>
		</Card>
	);
}
