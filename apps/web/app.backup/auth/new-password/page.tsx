"use client";

import {
	authService,
	type NewPasswordData,
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
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPasswordPage() {
	const [formData, setFormData] = useState<NewPasswordData>({
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const { error } = await authService.updatePassword(formData);

			if (error) {
				setError(error.message);
			} else {
				router.push("/dashboard");
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
						Set new password
					</CardTitle>
					<CardDescription className="text-center">
						Enter your new password below
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
							<Label htmlFor="password">New Password</Label>
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

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								placeholder="••••••••"
								value={formData.confirmPassword}
								onChange={handleChange}
								required
								disabled={loading}
							/>
						</div>
					</CardContent>
					<CardFooter>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Updating password..." : "Update password"}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
