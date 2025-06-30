/**
 * Protected Route Hook
 * Ensures user is authenticated before accessing protected routes
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../contexts/auth-context";

interface UseProtectedRouteOptions {
	redirectTo?: string;
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
	const { user, loading } = useAuth();
	const router = useRouter();
	const { redirectTo = "/auth/signin" } = options;

	useEffect(() => {
		if (!loading && !user) {
			router.push(redirectTo);
		}
	}, [user, loading, router, redirectTo]);

	return { user, loading };
}
