/**
 * Reset Password Page
 * Password reset form (accessed via email link)
 */

"use client";

import { validatePassword } from "@ignitabull/core/lib/auth";
import { ArrowRight, Eye, EyeOff, Lock, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	FormActions,
	FormInput,
	FormState,
} from "@/components/ui/form-components";
import { Progress } from "@/components/ui/progress";
import { useAuth, withPublicRoute } from "@/lib/auth-client";

function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { updatePassword, isLoading } = useAuth();

	const [formData, setFormData] = useState({
		password: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState<string>("");
	const [success, setSuccess] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	// Check for valid reset token
	useEffect(() => {
		const token = searchParams.get("token");
		const type = searchParams.get("type");

		if (!token || type !== "recovery") {
			setError(
				"Invalid or expired reset link. Please request a new password reset.",
			);
		}
	}, [searchParams]);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));

		// Clear errors when user starts typing
		if (error) setError("");
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const validateForm = () => {
		const errors: Record<string, string> = {};

		// Validate password
		const passwordValidation = validatePassword(formData.password);
		if (!passwordValidation.isValid) {
			errors.password = passwordValidation.errors[0];
		}

		// Validate password confirmation
		if (formData.password !== formData.confirmPassword) {
			errors.confirmPassword = "Passwords do not match";
		}

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const calculatePasswordStrength = (password: string): number => {
		let strength = 0;
		if (password.length >= 8) strength += 20;
		if (/[A-Z]/.test(password)) strength += 20;
		if (/[a-z]/.test(password)) strength += 20;
		if (/\d/.test(password)) strength += 20;
		if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength += 20;
		return strength;
	};

	const getPasswordStrengthColor = (strength: number): string => {
		if (strength < 40) return "bg-red-500";
		if (strength < 60) return "bg-yellow-500";
		if (strength < 80) return "bg-blue-500";
		return "bg-green-500";
	};

	const getPasswordStrengthText = (strength: number): string => {
		if (strength < 40) return "Weak";
		if (strength < 60) return "Fair";
		if (strength < 80) return "Good";
		return "Strong";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting || isLoading || !validateForm()) return;

		const token = searchParams.get("token");
		if (!token) {
			setError("Invalid reset link. Please request a new password reset.");
			return;
		}

		setIsSubmitting(true);
		setError("");
		setSuccess("");

		try {
			const { error: updateError } = await updatePassword({
				password: formData.password,
				confirmPassword: formData.confirmPassword,
			});

			if (updateError) {
				setError(updateError.message);
				return;
			}

			setSuccess("Your password has been successfully updated!");

			// Redirect to sign in page after a delay
			setTimeout(() => {
				router.push("/auth/signin?message=password-updated");
			}, 2000);
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
			console.error("Reset password error:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const passwordStrength = calculatePasswordStrength(formData.password);
	const isFormValid =
		formData.password &&
		formData.confirmPassword &&
		Object.keys(fieldErrors).length === 0;

	// If there's an error with the reset link, show error state
	if (error?.includes("Invalid or expired")) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<Link href="/" className="mb-8 inline-flex items-center space-x-2">
							<div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
								<Zap className="h-6 w-6 text-primary-foreground" />
							</div>
							<span className="font-bold text-2xl">Ignitabull</span>
						</Link>
						<h1 className="font-bold text-3xl tracking-tight">
							Reset Link Invalid
						</h1>
					</div>

					<Card>
						<CardContent className="pt-6">
							<FormState
								type="error"
								title="Invalid Reset Link"
								message={error}
								action={{
									label: "Request new reset link",
									onClick: () => router.push("/auth/forgot-password"),
								}}
							/>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
			<div className="w-full max-w-md space-y-8">
				{/* Header */}
				<div className="text-center">
					<Link href="/" className="mb-8 inline-flex items-center space-x-2">
						<div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
							<Zap className="h-6 w-6 text-primary-foreground" />
						</div>
						<span className="font-bold text-2xl">Ignitabull</span>
					</Link>
					<h1 className="font-bold text-3xl tracking-tight">
						Set new password
					</h1>
					<p className="mt-2 text-muted-foreground">
						Choose a strong password for your account
					</p>
				</div>

				{/* Reset Password Form */}
				<Card>
					<CardHeader className="space-y-1">
						<CardTitle className="text-center text-2xl">New password</CardTitle>
						<CardDescription className="text-center">
							Enter your new password below
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && !error.includes("Invalid or expired") && (
							<FormState
								type="error"
								title="Password update failed"
								message={error}
								className="mb-6"
							/>
						)}

						{success && (
							<FormState
								type="success"
								title="Password updated!"
								message={success}
								className="mb-6"
							/>
						)}

						{!success && (
							<form onSubmit={handleSubmit} className="space-y-4">
								<FormInput
									label="New Password"
									type={showPassword ? "text" : "password"}
									icon={<Lock className="h-4 w-4 text-muted-foreground" />}
									placeholder="Enter your new password"
									value={formData.password}
									onChange={(e) =>
										handleInputChange("password", e.target.value)
									}
									error={fieldErrors.password}
									suffix={
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="text-muted-foreground transition-colors hover:text-foreground"
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									}
									required
									autoComplete="new-password"
									disabled={isSubmitting || isLoading}
								/>

								{/* Password Strength Indicator */}
								{formData.password && (
									<div className="space-y-2">
										<div className="flex items-center justify-between text-xs">
											<span className="text-muted-foreground">
												Password strength:
											</span>
											<span
												className={`font-medium ${
													passwordStrength < 40
														? "text-red-600"
														: passwordStrength < 60
															? "text-yellow-600"
															: passwordStrength < 80
																? "text-blue-600"
																: "text-green-600"
												}`}
											>
												{getPasswordStrengthText(passwordStrength)}
											</span>
										</div>
										<Progress
											value={passwordStrength}
											className="h-2"
											style={{
												background: `linear-gradient(to right, ${getPasswordStrengthColor(passwordStrength)} ${passwordStrength}%, transparent ${passwordStrength}%)`,
											}}
										/>
									</div>
								)}

								<FormInput
									label="Confirm New Password"
									type={showConfirmPassword ? "text" : "password"}
									icon={<Lock className="h-4 w-4 text-muted-foreground" />}
									placeholder="Confirm your new password"
									value={formData.confirmPassword}
									onChange={(e) =>
										handleInputChange("confirmPassword", e.target.value)
									}
									error={fieldErrors.confirmPassword}
									suffix={
										<button
											type="button"
											onClick={() =>
												setShowConfirmPassword(!showConfirmPassword)
											}
											className="text-muted-foreground transition-colors hover:text-foreground"
										>
											{showConfirmPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									}
									required
									autoComplete="new-password"
									disabled={isSubmitting || isLoading}
								/>

								<FormActions className="pt-2">
									<Button
										type="submit"
										className="w-full"
										disabled={!isFormValid || isSubmitting || isLoading}
									>
										{isSubmitting || isLoading ? (
											<>
												<div className="mr-2 h-4 w-4 animate-spin rounded-full border-current border-b-2" />
												Updating password...
											</>
										) : (
											<>
												Update password
												<ArrowRight className="ml-2 h-4 w-4" />
											</>
										)}
									</Button>
								</FormActions>
							</form>
						)}

						{/* Back to Sign In */}
						<div className="mt-6 text-center">
							<Link
								href="/auth/signin"
								className="font-medium text-primary text-sm transition-colors hover:text-primary/80"
							>
								Back to sign in
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default withPublicRoute(ResetPasswordPage);
