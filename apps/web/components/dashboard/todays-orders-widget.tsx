"use client";

import {
	analyticsService,
	type MetricWithComparison,
} from "@ignitabull/core/services/analytics-service";
import {
	type IntegrationStatusInfo,
	integrationStatusService,
} from "@ignitabull/core/services/integration-status-service";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { KPICardWidget } from "./kpi-card-widget";

interface TodaysOrdersWidgetProps {
	organizationId?: string;
}

export function TodaysOrdersWidget({
	organizationId,
}: TodaysOrdersWidgetProps) {
	const [metric, setMetric] = useState<MetricWithComparison>({ value: 0 });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [integrationStatus, setIntegrationStatus] =
		useState<IntegrationStatusInfo | null>(null);

	useEffect(() => {
		if (organizationId) {
			loadTodaysOrders();
		}
	}, [organizationId, loadTodaysOrders]);

	const loadTodaysOrders = async () => {
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
				"orders",
			);
			setMetric(todaysMetric);
		} catch (err: any) {
			setError(err.message || "Failed to load orders data");
		} finally {
			setLoading(false);
		}
	};

	const formatOrderCount = (value: number | string): string => {
		const num = typeof value === "string" ? Number.parseFloat(value) : value;
		return `${Math.floor(num)} orders`;
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
			title="Today's Orders"
			description="Orders placed today"
			value={metric.value}
			previousValue={metric.previousValue}
			percentageChange={metric.percentageChange}
			loading={loading}
			error={error}
			icon={<ShoppingCart className="h-4 w-4" />}
			valueFormatter={formatOrderCount}
			showAsEmpty={emptyState.showAsEmpty}
			emptyStateMessage={emptyState.message}
		/>
	);
}
