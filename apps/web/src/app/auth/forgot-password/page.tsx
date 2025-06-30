/**
 * Forgot Password Page
 * Password reset request form
 */

"use client";

import { validateEmail } from "@ignitabull/core/lib/auth";
import { ArrowLeft, Mail, Send, Zap } from "lucide-react";
import Link from "next/link";
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
	FormInput,
	FormState,
} from "@/components/ui/form-components";
import { useAuth, withPublicRoute } from "@/lib/auth-client";

function ForgotPasswordPage() {
	const { resetPassword, isLoading } = useAuth();

	const [email, setEmail] = useState("");
	const [error, setError] = useState<string>("");
	const [success, setSuccess] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting || isLoading) return;

		if (!validateEmail(email)) {
			setError("Please enter a valid email address");
			return;
		}

		setIsSubmitting(true);
		setError("");
		setSuccess("");

		try {
			const { error: resetError } = await resetPassword({ email });

			if (resetError) {
				setError(resetError.message);
				return;
			}

			setSuccess(
				"Password reset instructions have been sent to your email address.",
			);
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
			console.error("Reset password error:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isFormValid = email && validateEmail(email);

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
						Reset your password
					</h1>
					<p className="mt-2 text-muted-foreground">
						Enter your email address and we'll send you a link to reset your
						password
					</p>
				</div>

				{/* Reset Password Form */}
				<Card>
					<CardHeader className="space-y-1">
						<CardTitle className="text-center text-2xl">
							Forgot password
						</CardTitle>
						<CardDescription className="text-center">
							We'll send you a secure link to reset your password
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<FormState
								type="error"
								title="Reset failed"
								message={error}
								action={{
									label: "Try again",
									onClick: () => setError(""),
								}}
								className="mb-6"
							/>
						)}

						{success && (
							<FormState
								type="success"
								title="Email sent!"
								message={success}
								action={{
									label: "Resend email",
									onClick: () => {
										setSuccess("");
										handleSubmit({
											preventDefault: () => {},
										} as React.FormEvent);
									},
								}}
								className="mb-6"
							/>
						)}

						{!success && (
							<form onSubmit={handleSubmit} className="space-y-4">
								<FormInput
									label="Email Address"
									type="email"
									icon={<Mail className="h-4 w-4 text-muted-foreground" />}
									placeholder="Enter your email address"
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
										if (error) setError("");
									}}
									required
									autoComplete="email"
									disabled={isSubmitting || isLoading}
									description="We'll send password reset instructions to this email"
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
												Sending...
											</>
										) : (
											<>
												<Send className="mr-2 h-4 w-4" />
												Send reset link
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
								className="inline-flex items-center font-medium text-primary text-sm transition-colors hover:text-primary/80"
							>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to sign in
							</Link>
						</div>
					</CardContent>
				</Card>

				{/* Help Text */}
				<div className="space-y-2 text-center text-muted-foreground text-sm">
					<p>
						Don't have an account?{" "}
						<Link
							href="/auth/signup"
							className="text-primary transition-colors hover:text-primary/80"
						>
							Sign up for free
						</Link>
					</p>
					<p>
						Having trouble?{" "}
						<Link
							href="/support"
							className="text-primary transition-colors hover:text-primary/80"
						>
							Contact support
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

export default withPublicRoute(ForgotPasswordPage);
