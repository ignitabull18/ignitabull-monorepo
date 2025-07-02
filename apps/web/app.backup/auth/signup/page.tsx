"use client";

import {
	authService,
	type SignupData,
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

export default function SignUpPage() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		firstName: "",
		lastName: "",
		organizationName: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			// Combine firstName and lastName into fullName
			const signupData: SignupData = {
				email: formData.email,
				password: formData.password,
				fullName: `${formData.firstName} ${formData.lastName}`.trim(),
				organizationName: formData.organizationName,
			};

			const { error } = await authService.signUp(signupData);

			if (error) {
				setError(error.message);
			} else {
				// Show success message for email confirmation
				router.push(
					`/auth/verify-email?email=${encodeURIComponent(formData.email)}`,
				);
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
						Create an account
					</CardTitle>
					<CardDescription className="text-center">
						Enter your details to get started with Ignitabull
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name</Label>
								<Input
									id="firstName"
									name="firstName"
									type="text"
									placeholder="John"
									value={formData.firstName}
									onChange={handleChange}
									required
									disabled={loading}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								<Input
									id="lastName"
									name="lastName"
									type="text"
									placeholder="Doe"
									value={formData.lastName}
									onChange={handleChange}
									required
									disabled={loading}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="organizationName">Organization Name</Label>
							<Input
								id="organizationName"
								name="organizationName"
								type="text"
								placeholder="Acme Inc."
								value={formData.organizationName}
								onChange={handleChange}
								required
								disabled={loading}
							/>
						</div>

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
							<Label htmlFor="password">Password</Label>
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
							{loading ? "Creating account..." : "Sign up"}
						</Button>
						<p className="text-center text-gray-600 text-sm">
							Already have an account?{" "}
							<Link
								href="/auth/signin"
								className="font-medium text-primary hover:underline"
							>
								Sign in
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
