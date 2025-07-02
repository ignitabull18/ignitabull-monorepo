"use client";

import { onboardingService } from "@ignitabull/core/services/onboarding-service";
import {
	authService,
	type LoginData,
} from "@ignitabull/core/services/supabase-auth-service";
import { Alert, AlertDescription } from "@ignitabull/ui/components/alert";
import { Button } from "@ignitabull/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@ignitabull/ui/components/card";
import { Input } from "@ignitabull/ui/components/input";
import { Label } from "@ignitabull/ui/components/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
	const [formData, setFormData] = useState<LoginData>({
		email: "",
		password: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const { error, data } = await authService.signIn(formData);

			if (error) {
				setError(error.message);
			} else if (data?.user) {
				// Check if user has completed onboarding
				const organizationId = data.user.user_metadata?.organization_id;
				if (organizationId) {
					const hasCompletedOnboarding =
						await onboardingService.isOnboardingComplete(organizationId);
					const redirectUrl = onboardingService.getOnboardingRedirectUrl(
						hasCompletedOnboarding,
					);
					router.push(redirectUrl);
				} else {
					router.push("/welcome");
				}
			}
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-center font-bold text-2xl">
						Welcome back
					</CardTitle>
					<CardDescription className="text-center">
						Sign in to your account to continue
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="you@example.com"
								value={formData.email}
								onChange={handleChange}
								required
								disabled={loading}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Password</Label>
								<Link
									href="/auth/reset-password"
									className="text-primary text-sm hover:underline"
								>
									Forgot password?
								</Link>
							</div>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="••••••••"
								value={formData.password}
								onChange={handleChange}
								required
								disabled={loading}
							/>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4">
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Signing in..." : "Sign in"}
						</Button>
						<p className="text-center text-gray-600 text-sm">
							Don't have an account?{" "}
							<Link
								href="/auth/signup"
								className="font-medium text-primary hover:underline"
							>
								Sign up
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
