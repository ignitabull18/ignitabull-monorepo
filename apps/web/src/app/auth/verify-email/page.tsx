/**
 * Email Verification Page
 * Shown after user signs up, waiting for email verification
 */

"use client";

import { ArrowLeft, Mail, RefreshCw, Zap } from "lucide-react";
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
import { FormState } from "@/components/ui/form-components";
import { useAuth, withPublicRoute } from "@/lib/auth-client";

function VerifyEmailPage() {
	const _router = useRouter();
	const searchParams = useSearchParams();
	const { resetPassword, isLoading } = useAuth();

	const [email, setEmail] = useState("");
	const [isResending, setIsResending] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);
	const [resendError, setResendError] = useState("");
	const [countdown, setCountdown] = useState(0);

	useEffect(() => {
		// Get email from URL params
		const emailParam = searchParams.get("email");
		if (emailParam) {
			setEmail(decodeURIComponent(emailParam));
		}
	}, [searchParams]);

	useEffect(() => {
		// Countdown timer for resend button
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	const handleResendEmail = async () => {
		if (isResending || countdown > 0 || !email) return;

		setIsResending(true);
		setResendError("");
		setResendSuccess(false);

		try {
			// Use the reset password function to resend verification email
			// In a real implementation, you'd have a separate resend verification endpoint
			const { error } = await resetPassword({ email });

			if (error) {
				setResendError(error.message);
				return;
			}

			setResendSuccess(true);
			setCountdown(60); // 60 second cooldown
		} catch (err) {
			setResendError("Failed to resend verification email. Please try again.");
			console.error("Resend email error:", err);
		} finally {
			setIsResending(false);
		}
	};

	const maskEmail = (email: string) => {
		if (!email) return "";
		const [username, domain] = email.split("@");
		if (!username || !domain) return email;

		const maskedUsername =
			username.length > 2
				? username[0] +
					"*".repeat(username.length - 2) +
					username[username.length - 1]
				: username;

		return `${maskedUsername}@${domain}`;
	};

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
					<div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<Mail className="h-8 w-8 text-primary" />
					</div>
					<h1 className="font-bold text-3xl tracking-tight">
						Check your email
					</h1>
					<p className="mt-2 text-muted-foreground">
						We've sent a verification link to your email address
					</p>
				</div>

				{/* Verification Instructions */}
				<Card>
					<CardHeader className="space-y-1">
						<CardTitle className="text-center text-xl">
							Verify your email
						</CardTitle>
						<CardDescription className="text-center">
							Click the link in the email to verify your account
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Email Display */}
						{email && (
							<div className="text-center">
								<p className="mb-1 text-muted-foreground text-sm">
									Verification email sent to:
								</p>
								<p className="font-medium">{maskEmail(email)}</p>
							</div>
						)}

						{/* Resend Success */}
						{resendSuccess && (
							<FormState
								type="success"
								title="Email sent!"
								message="A new verification email has been sent to your inbox."
							/>
						)}

						{/* Resend Error */}
						{resendError && (
							<FormState
								type="error"
								title="Failed to resend"
								message={resendError}
								action={{
									label: "Try again",
									onClick: () => setResendError(""),
								}}
							/>
						)}

						{/* Instructions */}
						<div className="space-y-4 text-muted-foreground text-sm">
							<div className="rounded-lg bg-muted/50 p-4">
								<h3 className="mb-2 font-medium text-foreground">
									What to do next:
								</h3>
								<ol className="list-inside list-decimal space-y-1">
									<li>Check your email inbox (and spam folder)</li>
									<li>Look for an email from Ignitabull</li>
									<li>Click the verification link in the email</li>
									<li>You'll be redirected to sign in</li>
								</ol>
							</div>
						</div>

						{/* Resend Button */}
						<div className="space-y-4 text-center">
							<p className="text-muted-foreground text-sm">
								Didn't receive the email?
							</p>

							<Button
								variant="outline"
								onClick={handleResendEmail}
								disabled={isResending || countdown > 0 || !email}
								className="w-full"
							>
								{isResending ? (
									<>
										<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
										Sending...
									</>
								) : countdown > 0 ? (
									<>
										<RefreshCw className="mr-2 h-4 w-4" />
										Resend in {countdown}s
									</>
								) : (
									<>
										<RefreshCw className="mr-2 h-4 w-4" />
										Resend verification email
									</>
								)}
							</Button>
						</div>

						{/* Help Text */}
						<div className="space-y-2 text-center text-muted-foreground text-xs">
							<p>
								Still having trouble? Check your spam folder or{" "}
								<Link
									href="/support"
									className="text-primary hover:text-primary/80"
								>
									contact support
								</Link>
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Navigation */}
				<div className="space-y-4 text-center">
					<Link
						href="/auth/signin"
						className="inline-flex items-center font-medium text-primary text-sm transition-colors hover:text-primary/80"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to sign in
					</Link>

					<div className="text-muted-foreground text-sm">
						<span>Want to use a different email? </span>
						<Link
							href="/auth/signup"
							className="text-primary transition-colors hover:text-primary/80"
						>
							Sign up again
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default withPublicRoute(VerifyEmailPage);
