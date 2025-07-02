"use client";

import { authService } from "@ignitabull/core/services/supabase-auth-service";
import { Avatar, AvatarFallback } from "@ignitabull/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ignitabull/ui/components/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-provider";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !user) {
			router.push("/auth/signin");
		}
	}, [user, isLoading, router]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-primary border-b-2" />
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
			.toUpperCase() ||
		user.email?.[0].toUpperCase() ||
		"U";

	const handleSignOut = async () => {
		await authService.signOut();
		router.push("/auth/signin");
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Top Navigation Bar */}
			<nav className="border-b bg-white shadow-sm">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 justify-between">
						<div className="flex items-center">
							<Link
								href="/dashboard"
								className="font-semibold text-gray-900 text-xl"
							>
								Ignitabull
							</Link>
						</div>

						<div className="flex items-center space-x-4">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
										<Avatar className="h-8 w-8">
											<AvatarFallback>{initials}</AvatarFallback>
										</Avatar>
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuLabel>
										<div className="flex flex-col">
											<span className="font-medium text-sm">
												{fullName || "User"}
											</span>
											<span className="text-gray-500 text-xs">
												{user.email}
											</span>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/profile">Profile</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/settings/integrations">Integrations</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleSignOut}>
										Sign out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{children}
			</main>
		</div>
	);
}
