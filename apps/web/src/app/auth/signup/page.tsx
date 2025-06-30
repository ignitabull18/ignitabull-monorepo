/**
 * Sign Up Page
 * User registration form with organization creation
 */

"use client";

import {
	validateEmail,
	validateName,
	validatePassword,
} from "@ignitabull/core/lib/auth";
import {
	ArrowRight,
	Building,
	Eye,
	EyeOff,
	Lock,
	Mail,
	User,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
	FormCheckbox,
	FormInput,
	FormState,
} from "@/components/ui/form-components";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth, withPublicRoute } from "@/lib/auth-client";

function SignUpPage() {
	const router = useRouter();
	const { signUp, isLoading } = useAuth();

	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
		organizationName: "",
		agreeToTerms: false,
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState<string>("");
	const [success, setSuccess] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));

		// Clear errors when user starts typing
		if (error) setError("");
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const validateForm = () => {
		const errors: Record<string, string> = {};

		// Validate names
		if (!validateName(formData.firstName)) {
			errors.firstName = "First name must be 2-50 characters";
		}
		if (!validateName(formData.lastName)) {
			errors.lastName = "Last name must be 2-50 characters";
		}

		// Validate email
		if (!validateEmail(formData.email)) {
			errors.email = "Please enter a valid email address";
		}

		// Validate password
		const passwordValidation = validatePassword(formData.password);
		if (!passwordValidation.isValid) {
			errors.password = passwordValidation.errors[0];
		}

		// Validate password confirmation
		if (formData.password !== formData.confirmPassword) {
			errors.confirmPassword = "Passwords do not match";
		}

		// Validate terms agreement
		if (!formData.agreeToTerms) {
			errors.agreeToTerms = "You must agree to the terms and conditions";
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

		setIsSubmitting(true);
		setError("");
		setSuccess("");

		try {
			const { error: signUpError } = await signUp({
				email: formData.email,
				password: formData.password,
				firstName: formData.firstName,
				lastName: formData.lastName,
				organizationName: formData.organizationName || undefined,
			});

			if (signUpError) {
				setError(signUpError.message);
				return;
			}

			setSuccess(
				"Account created successfully! Please check your email to verify your account.",
			);

			// Redirect to email verification page after a delay
			setTimeout(() => {
				router.push(
					`/auth/verify-email?email=${encodeURIComponent(formData.email)}`,
				);
			}, 2000);
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
			console.error("Sign up error:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const passwordStrength = calculatePasswordStrength(formData.password);
	const isFormValid =
		formData.firstName &&
		formData.lastName &&
		formData.email &&
		formData.password &&
		formData.confirmPassword &&
		formData.agreeToTerms &&
		Object.keys(fieldErrors).length === 0;

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
						Create your account
					</h1>
					<p className="mt-2 text-muted-foreground">
						Get started with Ignitabull and grow your Amazon business
					</p>
				</div>

				{/* Sign Up Form */}
				<Card>
					<CardHeader className="space-y-1">
						<CardTitle className="text-center text-2xl">Sign up</CardTitle>
						<CardDescription className="text-center">
							Create your account to get started
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<FormState
								type="error"
								title="Registration failed"
								message={error}
								className="mb-6"
							/>
						)}

						{success && (
							<FormState
								type="success"
								title="Account created!"
								message={success}
								className="mb-6"
							/>
						)}

						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Personal Information */}
							<div className="space-y-4">
								<h3 className="font-medium text-foreground text-sm">
									Personal Information
								</h3>

								<div className="grid grid-cols-2 gap-4">
									<FormInput
										label="First Name"
										icon={<User className="h-4 w-4 text-muted-foreground" />}
										placeholder="John"
										value={formData.firstName}
										onChange={(e) =>
											handleInputChange("firstName", e.target.value)
										}
										error={fieldErrors.firstName}
										required
										autoComplete="given-name"
										disabled={isSubmitting || isLoading}
									/>

									<FormInput
										label="Last Name"
										icon={<User className="h-4 w-4 text-muted-foreground" />}
										placeholder="Doe"
										value={formData.lastName}
										onChange={(e) =>
											handleInputChange("lastName", e.target.value)
										}
										error={fieldErrors.lastName}
										required
										autoComplete="family-name"
										disabled={isSubmitting || isLoading}
									/>
								</div>

								<FormInput
									label="Email Address"
									type="email"
									icon={<Mail className="h-4 w-4 text-muted-foreground" />}
									placeholder="john@example.com"
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									error={fieldErrors.email}
									required
									autoComplete="email"
									disabled={isSubmitting || isLoading}
								/>
							</div>

							{/* Password Section */}
							<div className="space-y-4">
								<h3 className="font-medium text-foreground text-sm">
									Security
								</h3>

								<FormInput
									label="Password"
									type={showPassword ? "text" : "password"}
									icon={<Lock className="h-4 w-4 text-muted-foreground" />}
									placeholder="Create a strong password"
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
									label="Confirm Password"
									type={showConfirmPassword ? "text" : "password"}
									icon={<Lock className="h-4 w-4 text-muted-foreground" />}
									placeholder="Confirm your password"
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
							</div>

							{/* Organization (Optional) */}
							<div className="space-y-4">
								<h3 className="font-medium text-foreground text-sm">
									Organization (Optional)
								</h3>

								<FormInput
									label="Company Name"
									icon={<Building className="h-4 w-4 text-muted-foreground" />}
									placeholder="Your company name"
									value={formData.organizationName}
									onChange={(e) =>
										handleInputChange("organizationName", e.target.value)
									}
									description="You can create or join an organization later"
									autoComplete="organization"
									disabled={isSubmitting || isLoading}
								/>
							</div>

							{/* Terms Agreement */}
							<FormCheckbox
								label="I agree to the Terms of Service and Privacy Policy"
								checked={formData.agreeToTerms}
								onCheckedChange={(checked) =>
									handleInputChange("agreeToTerms", checked)
								}
								error={fieldErrors.agreeToTerms}
								description={
									<span className="text-xs">
										By checking this box, you agree to our{" "}
										<Link
											href="/terms"
											className="text-primary hover:text-primary/80"
										>
											Terms of Service
										</Link>{" "}
										and{" "}
										<Link
											href="/privacy"
											className="text-primary hover:text-primary/80"
										>
											Privacy Policy
										</Link>
									</span>
								}
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
											Creating account...
										</>
									) : (
										<>
											Create account
											<ArrowRight className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>
							</FormActions>
						</form>

						<Separator className="my-6" />

						{/* Sign In Link */}
						<div className="text-center text-sm">
							<span className="text-muted-foreground">
								Already have an account?{" "}
							</span>
							<Link
								href="/auth/signin"
								className="font-medium text-primary transition-colors hover:text-primary/80"
							>
								Sign in
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default withPublicRoute(SignUpPage);
