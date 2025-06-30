"use client";

import { authService } from "@ignitabull/core/services/supabase-auth-service";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@ignitabull/ui/components/avatar";
import { Button } from "@ignitabull/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ignitabull/ui/components/card";
import { Skeleton } from "@ignitabull/ui/components/skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";

export default function ProfilePage() {
	const { user, isLoading } = useAuth();
	const router = useRouter();
	const [signingOut, setSigningOut] = useState(false);

	useEffect(() => {
		if (!isLoading && !user) {
			router.push("/auth/signin");
		}
	}, [user, isLoading, router]);

	const handleSignOut = async () => {
		setSigningOut(true);
		const { error } = await authService.signOut();
		if (!error) {
			router.push("/auth/signin");
		}
		setSigningOut(false);
	};

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<Card>
					<CardHeader>
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent className="space-y-6">
						<Skeleton className="h-20 w-20 rounded-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const fullName = user.user_metadata?.full_name || "";
	const initials =
		fullName
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase() || user.email?.[0].toUpperCase();

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>
						Manage your account settings and preferences
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center space-x-4">
						<Avatar className="h-20 w-20">
							<AvatarImage src={user.user_metadata?.avatar_url} />
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<div>
							<h3 className="font-semibold text-lg">
								{user.user_metadata?.full_name || "User"}
							</h3>
							<p className="text-muted-foreground text-sm">{user.email}</p>
						</div>
					</div>

					<div className="space-y-4">
						<div>
							<h4 className="font-medium text-gray-500 text-sm">
								Organization
							</h4>
							<p className="mt-1">
								{user.user_metadata?.organization_name || "No organization"}
							</p>
						</div>

						<div>
							<h4 className="font-medium text-gray-500 text-sm">User ID</h4>
							<p className="mt-1 font-mono text-sm">{user.id}</p>
						</div>

						<div>
							<h4 className="font-medium text-gray-500 text-sm">
								Email Verified
							</h4>
							<p className="mt-1">{user.email_confirmed_at ? "Yes" : "No"}</p>
						</div>

						<div>
							<h4 className="font-medium text-gray-500 text-sm">
								Account Created
							</h4>
							<p className="mt-1">
								{new Date(user.created_at).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>
					</div>

					<div className="border-t pt-6">
						<Button
							variant="destructive"
							onClick={handleSignOut}
							disabled={signingOut}
						>
							{signingOut ? "Signing out..." : "Sign out"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
