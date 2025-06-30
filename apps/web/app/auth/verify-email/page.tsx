"use client";

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
import { Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
	const searchParams = useSearchParams();
	const email = searchParams.get("email");

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
						<Mail className="h-6 w-6 text-green-600" />
					</div>
					<CardTitle className="mt-4 font-bold text-2xl">
						Check your email
					</CardTitle>
					<CardDescription>
						We've sent a verification link to{" "}
						<span className="font-medium text-gray-900">
							{email || "your email"}
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertDescription>
							Please check your email and click the verification link to
							activate your account. The link will expire in 24 hours.
						</AlertDescription>
					</Alert>

					<div className="mt-6 space-y-4">
						<p className="text-gray-600 text-sm">
							Didn't receive the email? Check your spam folder or request a new
							verification link.
						</p>
					</div>
				</CardContent>
				<CardFooter className="flex flex-col space-y-4">
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
