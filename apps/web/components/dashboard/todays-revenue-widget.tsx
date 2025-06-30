"use client";

import {
	analyticsService,
	type MetricWithComparison,
} from "@ignitabull/core/services/analytics-service";
import {
	type IntegrationStatusInfo,
	integrationStatusService,
} from "@ignitabull/core/services/integration-status-service";
import { DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { KPICardWidget } from "./kpi-card-widget";

interface TodaysRevenueWidgetProps {
	organizationId?: string;
}

export function TodaysRevenueWidget({
	organizationId,
}: TodaysRevenueWidgetProps) {
	const [metric, setMetric] = useState<MetricWithComparison>({ value: 0 });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [integrationStatus, setIntegrationStatus] =
		useState<IntegrationStatusInfo | null>(null);

	useEffect(() => {
		if (organizationId) {
			loadTodaysRevenue();
		}
	}, [organizationId, loadTodaysRevenue]);

	const loadTodaysRevenue = async () => {
		if (!organizationId) return;

		setLoading(true);
		setError(null);

		try {
			// Check integration status first
			const status =
				await integrationStatusService.getIntegrationStatus(organizationId);
			setIntegrationStatus(status);

			const todaysMetric = await analyticsService.getTodayMetricWithComparison(
				organizationId,
				"revenue",
			);
			setMetric(todaysMetric);
		} catch (err: any) {
			setError(err.message || "Failed to load revenue data");
		} finally {
			setLoading(false);
		}
	};

	// Determine if we should show as empty and what message to use
	const getEmptyState = () => {
		if (!integrationStatus?.hasConnection) {
			return {
				showAsEmpty: true,
				message: "Connect Amazon account",
			};
		}
		if (
			integrationStatus?.isActiveConnection &&
			!integrationStatus?.hasAnyData
		) {
			return {
				showAsEmpty: true,
				message: "Data syncing...",
			};
		}
		return {
			showAsEmpty: false,
			message: "",
		};
	};

	const emptyState = getEmptyState();

	return (
		<KPICardWidget
			title="Today's Revenue"
			description="Revenue generated today"
			value={metric.value}
			previousValue={metric.previousValue}
			percentageChange={metric.percentageChange}
			currency={metric.currency}
			loading={loading}
			error={error}
			icon={<DollarSign className="h-4 w-4" />}
			showAsEmpty={emptyState.showAsEmpty}
			emptyStateMessage={emptyState.message}
		/>
	);
}
