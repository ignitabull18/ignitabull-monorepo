/**
 * Onboarding Service
 * Manages user onboarding flow and completion status
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class OnboardingService {
	private supabase: SupabaseClient;

	constructor() {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseKey) {
			throw new Error("Missing Supabase configuration for onboarding service");
		}

		this.supabase = createClient(supabaseUrl, supabaseKey);
	}

	/**
	 * Check if a user has completed onboarding
	 * A user is considered onboarded if they have at least one active integration
	 */
	async isOnboardingComplete(organizationId: string): Promise<boolean> {
		try {
			const { data, error } = await this.supabase
				.from("integrations")
				.select("id")
				.eq("organization_id", organizationId)
				.eq("status", "active")
				.limit(1);

			if (error) {
				console.error("Error checking onboarding status:", error);
				return false;
			}

			return (data?.length || 0) > 0;
		} catch (error) {
			console.error("Failed to check onboarding status:", error);
			return false;
		}
	}

	/**
	 * Get the next step URL for onboarding
	 * Returns the URL the user should be redirected to
	 */
	getOnboardingRedirectUrl(hasCompletedOnboarding: boolean): string {
		if (hasCompletedOnboarding) {
			return "/dashboard";
		}
		return "/welcome";
	}
}

export const onboardingService = new OnboardingService();
