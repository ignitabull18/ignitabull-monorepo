/**
 * Sign In Page
 * User authentication sign in form
 */

"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail, Zap } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useAuth, withPublicRoute } from "@/lib/auth-client";

function SignInPage() {
	const router = useRouter();
	const { signIn, isLoading } = useAuth();

	const [formData, setFormData] = useState({
		email: "",
		password: "",
		rememberMe: false,
	});
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (error) setError(""); // Clear error when user starts typing
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting || isLoading) return;

		setIsSubmitting(true);
		setError("");

		try {
			const { error: signInError } = await signIn({
				email: formData.email,
				password: formData.password,
				rememberMe: formData.rememberMe,
			});

			if (signInError) {
				setError(signInError.message);
				return;
			}

			// Redirect will be handled by auth state change
			router.push("/dashboard");
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
			console.error("Sign in error:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isFormValid = formData.email && formData.password;

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
					<h1 className="font-bold text-3xl tracking-tight">Welcome back</h1>
					<p className="mt-2 text-muted-foreground">
						Sign in to your account to continue
					</p>
				</div>

				{/* Sign In Form */}
				<Card>
					<CardHeader className="space-y-1">
						<CardTitle className="text-center text-2xl">Sign in</CardTitle>
						<CardDescription className="text-center">
							Enter your email and password to access your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<FormState
								type="error"
								title="Sign in failed"
								message={error}
								className="mb-6"
							/>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							<FormInput
								label="Email"
								type="email"
								icon={<Mail className="h-4 w-4 text-muted-foreground" />}
								placeholder="Enter your email"
								value={formData.email}
								onChange={(e) => handleInputChange("email", e.target.value)}
								required
								autoComplete="email"
								disabled={isSubmitting || isLoading}
							/>

							<FormInput
								label="Password"
								type={showPassword ? "text" : "password"}
								icon={<Lock className="h-4 w-4 text-muted-foreground" />}
								placeholder="Enter your password"
								value={formData.password}
								onChange={(e) => handleInputChange("password", e.target.value)}
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
								autoComplete="current-password"
								disabled={isSubmitting || isLoading}
							/>

							<div className="flex items-center justify-between">
								<FormCheckbox
									label="Remember me"
									checked={formData.rememberMe}
									onCheckedChange={(checked) =>
										handleInputChange("rememberMe", checked)
									}
									className="flex-1"
								/>
								<Link
									href="/auth/forgot-password"
									className="text-primary text-sm transition-colors hover:text-primary/80"
								>
									Forgot password?
								</Link>
							</div>

							<FormActions className="pt-2">
								<Button
									type="submit"
									className="w-full"
									disabled={!isFormValid || isSubmitting || isLoading}
								>
									{isSubmitting || isLoading ? (
										<>
											<div className="mr-2 h-4 w-4 animate-spin rounded-full border-current border-b-2" />
											Signing in...
										</>
									) : (
										<>
											Sign in
											<ArrowRight className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>
							</FormActions>
						</form>

						<Separator className="my-6" />

						{/* Sign Up Link */}
						<div className="text-center text-sm">
							<span className="text-muted-foreground">
								Don't have an account?{" "}
							</span>
							<Link
								href="/auth/signup"
								className="font-medium text-primary transition-colors hover:text-primary/80"
							>
								Sign up for free
							</Link>
						</div>
					</CardContent>
				</Card>

				{/* Footer */}
				<div className="text-center text-muted-foreground text-sm">
					<p>
						By signing in, you agree to our{" "}
						<Link
							href="/terms"
							className="text-primary transition-colors hover:text-primary/80"
						>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link
							href="/privacy"
							className="text-primary transition-colors hover:text-primary/80"
						>
							Privacy Policy
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

export default withPublicRoute(SignInPage);
