/**
 * Next.js Middleware
 * Handles authentication, redirects, and route protection
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
	"/",
	"/auth/signin",
	"/auth/signup",
	"/auth/forgot-password",
	"/auth/reset-password",
	"/auth/verify-email",
	"/privacy",
	"/terms",
	"/support",
	"/contact",
	"/about",
	"/pricing",
	"/features",
	"/blog",
	"/api/health",
];

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/onboarding", "/settings", "/profile"];

// Routes that require organization membership
const organizationRoutes = ["/dashboard", "/api/dashboard"];

// Admin-only routes
const adminRoutes = ["/admin"];

function isPublicRoute(pathname: string): boolean {
	return publicRoutes.some((route) => {
		if (route === "/") return pathname === "/";
		return pathname.startsWith(route);
	});
}

function isProtectedRoute(pathname: string): boolean {
	return protectedRoutes.some((route) => pathname.startsWith(route));
}

function isOrganizationRoute(pathname: string): boolean {
	return organizationRoutes.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
	return adminRoutes.some((route) => pathname.startsWith(route));
}

function isApiRoute(pathname: string): boolean {
	return pathname.startsWith("/api/");
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip middleware for static files and Next.js internals
	if (
		pathname.startsWith("/_next/") ||
		pathname.startsWith("/favicon.ico") ||
		pathname.startsWith("/images/") ||
		pathname.startsWith("/icons/") ||
		pathname.includes(".")
	) {
		return NextResponse.next();
	}

	// Allow public routes
	if (isPublicRoute(pathname)) {
		// If user is authenticated and trying to access auth pages, redirect to dashboard
		if (pathname.startsWith("/auth/")) {
			const token = request.cookies.get("sb-access-token")?.value;
			if (token) {
				return NextResponse.redirect(new URL("/dashboard", request.url));
			}
		}
		return NextResponse.next();
	}

	// Handle API routes separately
	if (isApiRoute(pathname)) {
		// For API routes, we'll let the individual endpoints handle auth
		// You could add additional API-specific middleware here
		return NextResponse.next();
	}

	// Get auth tokens from cookies
	const accessToken = request.cookies.get("sb-access-token")?.value;
	const _refreshToken = request.cookies.get("sb-refresh-token")?.value;

	// Check if user is authenticated
	if (!accessToken) {
		// Redirect to sign in page for protected routes
		if (isProtectedRoute(pathname)) {
			const signInUrl = new URL("/auth/signin", request.url);
			signInUrl.searchParams.set("redirect", pathname);
			return NextResponse.redirect(signInUrl);
		}
		return NextResponse.next();
	}

	// At this point, user has an access token
	try {
		// In a real implementation, you would verify the token here
		// For now, we'll assume the token is valid if it exists

		// Check organization membership for organization routes
		if (isOrganizationRoute(pathname)) {
			// You would check if user has an organization here
			// For now, redirect to onboarding if no organization
			const hasOrganization = request.cookies.get("user-organization")?.value;

			if (!hasOrganization && !pathname.startsWith("/onboarding")) {
				return NextResponse.redirect(
					new URL("/onboarding/organization", request.url),
				);
			}
		}

		// Check admin access for admin routes
		if (isAdminRoute(pathname)) {
			const userRole = request.cookies.get("user-role")?.value;

			if (userRole !== "admin") {
				return NextResponse.redirect(new URL("/dashboard", request.url));
			}
		}

		// Special handling for root path when authenticated
		if (pathname === "/") {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}

		return NextResponse.next();
	} catch (error) {
		console.error("Middleware auth error:", error);

		// If token verification fails, clear cookies and redirect to sign in
		const response = NextResponse.redirect(
			new URL("/auth/signin", request.url),
		);
		response.cookies.delete("sb-access-token");
		response.cookies.delete("sb-refresh-token");
		response.cookies.delete("user-organization");
		response.cookies.delete("user-role");

		return response;
	}
}

// Configure which paths the middleware runs on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder files
		 */
		"/((?!_next/static|_next/image|favicon.ico|images|icons|.*\\..*$).*)",
	],
};
