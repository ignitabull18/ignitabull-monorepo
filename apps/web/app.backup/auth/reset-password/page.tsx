"use client";

import { authService } from "@ignitabull/core/services/supabase-auth-service";
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
import { useState } from "react";

export default function ResetPasswordPage() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const { error } = await authService.resetPassword({ email });

			if (error) {
				setError(error.message);
			} else {
				setSuccess(true);
			}
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1">
						<CardTitle className="text-center font-bold text-2xl">
							Check your email
						</CardTitle>
						<CardDescription className="text-center">
							We've sent a password reset link to {email}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Alert>
							<AlertDescription>
								If you don't see the email, check your spam folder. The link
								will expire in 1 hour.
							</AlertDescription>
						</Alert>
					</CardContent>
					<CardFooter>
						<Link href="/auth/signin" className="w-full">
							<Button variant="outline" className="w-full">
								Back to sign in
							</Button>
						</Link>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-center font-bold text-2xl">
						Reset password
					</CardTitle>
					<CardDescription className="text-center">
						Enter your email address and we'll send you a reset link
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
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={loading}
							/>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4">
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Sending..." : "Send reset link"}
						</Button>
						<Link
							href="/auth/signin"
							className="text-center text-gray-600 text-sm hover:underline"
						>
							Back to sign in
						</Link>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
