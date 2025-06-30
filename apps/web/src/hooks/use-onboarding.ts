"use client";

import { onboardingService } from "@ignitabull/core/services/onboarding-service";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";

interface UseOnboardingReturn {
	isOnboardingComplete: boolean;
	isChecking: boolean;
	redirectToOnboarding: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
	const { user, isLoading: authLoading } = useAuth();
	const router = useRouter();
	const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		async function checkOnboardingStatus() {
			if (authLoading || !user) {
				setIsChecking(false);
				return;
			}

			const organizationId = user.user_metadata?.organization_id;
			if (!organizationId) {
				setIsOnboardingComplete(false);
				setIsChecking(false);
				return;
			}

			try {
				const hasCompleted =
					await onboardingService.isOnboardingComplete(organizationId);
				setIsOnboardingComplete(hasCompleted);
			} catch (error) {
				console.error("Failed to check onboarding status:", error);
				setIsOnboardingComplete(false);
			} finally {
				setIsChecking(false);
			}
		}

		checkOnboardingStatus();
	}, [user, authLoading]);

	const redirectToOnboarding = () => {
		if (!isOnboardingComplete) {
			router.push("/welcome");
		}
	};

	return {
		isOnboardingComplete,
		isChecking,
		redirectToOnboarding,
	};
}
