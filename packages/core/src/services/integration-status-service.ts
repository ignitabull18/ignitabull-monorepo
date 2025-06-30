/**
 * Integration Status Service
 * Checks integration connection and sync status
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface IntegrationStatusInfo {
	hasConnection: boolean;
	isActiveConnection: boolean;
	lastSync?: string;
	hasAnyData: boolean;
}

export class IntegrationStatusService {
	private supabase: SupabaseClient;

	constructor() {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseKey) {
			throw new Error(
				"Missing Supabase configuration for integration status service",
			);
		}

		this.supabase = createClient(supabaseUrl, supabaseKey);
	}

	/**
	 * Get comprehensive integration status for an organization
	 */
	async getIntegrationStatus(
		organizationId: string,
	): Promise<IntegrationStatusInfo> {
		try {
			// Check for any integrations
			const { data: integrations, error: integrationsError } =
				await this.supabase
					.from("integrations")
					.select("id, status, last_sync")
					.eq("organization_id", organizationId);

			if (integrationsError) {
				console.error("Error checking integrations:", integrationsError);
				return {
					hasConnection: false,
					isActiveConnection: false,
					hasAnyData: false,
				};
			}

			const hasConnection = (integrations?.length || 0) > 0;
			const activeIntegration = integrations?.find(
				(integration) => integration.status === "active",
			);
			const isActiveConnection = !!activeIntegration;

			// Check for any synced data (metrics)
			const { data: metrics, error: metricsError } = await this.supabase
				.from("metrics")
				.select("id")
				.eq("organization_id", organizationId)
				.limit(1);

			const hasAnyData = !metricsError && (metrics?.length || 0) > 0;

			return {
				hasConnection,
				isActiveConnection,
				lastSync: activeIntegration?.last_sync,
				hasAnyData,
			};
		} catch (error) {
			console.error("Failed to get integration status:", error);
			return {
				hasConnection: false,
				isActiveConnection: false,
				hasAnyData: false,
			};
		}
	}
}

export const integrationStatusService = new IntegrationStatusService();
