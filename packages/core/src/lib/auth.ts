/**
 * Authentication utilities and types
 * Core authentication logic shared across the application
 */

import type { Database } from "../types/database";

export type AuthUser = Database["public"]["Tables"]["users"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type AuthSession = {
	user: AuthUser;
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
};

export interface AuthError {
	code: string;
	message: string;
	details?: any;
}

export interface SignUpData {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	organizationName?: string;
}

export interface SignInData {
	email: string;
	password: string;
	rememberMe?: boolean;
}

export interface ResetPasswordData {
	email: string;
}

export interface UpdatePasswordData {
	password: string;
	confirmPassword: string;
}

export interface UpdateProfileData {
	firstName?: string;
	lastName?: string;
	avatarUrl?: string;
	timezone?: string;
}

// Auth event types
export type AuthEventType =
	| "SIGNED_IN"
	| "SIGNED_OUT"
	| "TOKEN_REFRESHED"
	| "USER_UPDATED"
	| "PASSWORD_RECOVERY";

export interface AuthEvent {
	type: AuthEventType;
	user?: AuthUser;
	session?: AuthSession;
	error?: AuthError;
}

export type AuthEventHandler = (event: AuthEvent) => void;

// Organization and team management
export interface CreateOrganizationData {
	name: string;
	slug: string;
	description?: string;
	website?: string;
	industry?: string;
}

export interface InviteUserData {
	email: string;
	role: "admin" | "member" | "viewer";
	organizationId: string;
}

// Session management utilities
export class AuthManager {
	private static instance: AuthManager;
	private eventHandlers: AuthEventHandler[] = [];
	private currentSession: AuthSession | null = null;

	static getInstance(): AuthManager {
		if (!AuthManager.instance) {
			AuthManager.instance = new AuthManager();
		}
		return AuthManager.instance;
	}

	// Event handling
	addEventListener(handler: AuthEventHandler): () => void {
		this.eventHandlers.push(handler);
		return () => {
			const index = this.eventHandlers.indexOf(handler);
			if (index > -1) {
				this.eventHandlers.splice(index, 1);
			}
		};
	}

	private emit(event: AuthEvent): void {
		this.eventHandlers.forEach((handler) => {
			try {
				handler(event);
			} catch (error) {
				console.error("Auth event handler error:", error);
			}
		});
	}

	// Session management
	setSession(session: AuthSession | null): void {
		this.currentSession = session;
		if (session) {
			this.emit({ type: "SIGNED_IN", user: session.user, session });
		} else {
			this.emit({ type: "SIGNED_OUT" });
		}
	}

	getSession(): AuthSession | null {
		return this.currentSession;
	}

	getUser(): AuthUser | null {
		return this.currentSession?.user || null;
	}

	isAuthenticated(): boolean {
		if (!this.currentSession) return false;
		return Date.now() < this.currentSession.expiresAt;
	}

	// Token management
	async refreshSession(): Promise<AuthSession | null> {
		if (!this.currentSession?.refreshToken) {
			return null;
		}

		try {
			// This would be implemented by the specific auth provider
			// For now, return the current session
			this.emit({ type: "TOKEN_REFRESHED", session: this.currentSession });
			return this.currentSession;
		} catch (error) {
			console.error("Failed to refresh session:", error);
			this.setSession(null);
			return null;
		}
	}

	// Clear session data
	clearSession(): void {
		this.currentSession = null;
		this.emit({ type: "SIGNED_OUT" });
	}

	// Cleanup resources - call on app shutdown
	cleanup(): void {
		this.eventHandlers = [];
		this.currentSession = null;
	}

	// Reset singleton instance (useful for testing)
	static resetInstance(): void {
		AuthManager.instance = undefined as any;
	}
}

// Validation utilities
export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function validatePassword(password: string): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (password.length < 8) {
		errors.push("Password must be at least 8 characters long");
	}

	if (!/[A-Z]/.test(password)) {
		errors.push("Password must contain at least one uppercase letter");
	}

	if (!/[a-z]/.test(password)) {
		errors.push("Password must contain at least one lowercase letter");
	}

	if (!/\d/.test(password)) {
		errors.push("Password must contain at least one number");
	}

	if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
		errors.push("Password must contain at least one special character");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

export function validateName(name: string): boolean {
	return name.trim().length >= 2 && name.trim().length <= 50;
}

export function validateOrganizationSlug(slug: string): boolean {
	const slugRegex = /^[a-z0-9-]+$/;
	return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

// Error handling utilities
export function getAuthErrorMessage(error: any): string {
	if (typeof error === "string") return error;

	if (error?.message) return error.message;

	// Common Supabase auth error codes
	switch (error?.error_description || error?.code) {
		case "email_not_confirmed":
			return "Please check your email and click the confirmation link";
		case "invalid_credentials":
			return "Invalid email or password";
		case "email_already_exists":
			return "An account with this email already exists";
		case "weak_password":
			return "Password is too weak. Please choose a stronger password";
		case "signup_disabled":
			return "New user signups are currently disabled";
		case "email_address_not_authorized":
			return "This email address is not authorized to sign up";
		case "too_many_requests":
			return "Too many requests. Please try again later";
		default:
			return "An unexpected error occurred. Please try again";
	}
}

// Storage utilities for client-side session persistence
export const AuthStorage = {
	getSession(): AuthSession | null {
		if (typeof window === "undefined") return null;

		try {
			const stored = localStorage.getItem("auth_session");
			if (!stored) return null;

			const session = JSON.parse(stored) as AuthSession;

			// Check if session is expired
			if (Date.now() >= session.expiresAt) {
				this.clearSession();
				return null;
			}

			return session;
		} catch (error) {
			console.error("Failed to get stored session:", error);
			this.clearSession();
			return null;
		}
	},

	setSession(session: AuthSession | null): void {
		if (typeof window === "undefined") return;

		try {
			if (session) {
				localStorage.setItem("auth_session", JSON.stringify(session));
			} else {
				localStorage.removeItem("auth_session");
			}
		} catch (error) {
			console.error("Failed to store session:", error);
		}
	},

	clearSession(): void {
		if (typeof window === "undefined") return;

		try {
			localStorage.removeItem("auth_session");
			localStorage.removeItem("auth_remember_me");
		} catch (error) {
			console.error("Failed to clear stored session:", error);
		}
	},

	setRememberMe(remember: boolean): void {
		if (typeof window === "undefined") return;

		try {
			if (remember) {
				localStorage.setItem("auth_remember_me", "true");
			} else {
				localStorage.removeItem("auth_remember_me");
			}
		} catch (error) {
			console.error("Failed to store remember me preference:", error);
		}
	},

	getRememberMe(): boolean {
		if (typeof window === "undefined") return false;

		try {
			return localStorage.getItem("auth_remember_me") === "true";
		} catch (_error) {
			return false;
		}
	},
};

// Route protection utilities
export interface RouteProtectionConfig {
	requireAuth?: boolean;
	requireOrganization?: boolean;
	allowedRoles?: string[];
	redirectTo?: string;
}

export function checkRouteAccess(
	user: AuthUser | null,
	config: RouteProtectionConfig,
): { allowed: boolean; redirectTo?: string } {
	// Public routes
	if (!config.requireAuth) {
		return { allowed: true };
	}

	// Require authentication
	if (!user) {
		return {
			allowed: false,
			redirectTo: config.redirectTo || "/auth/signin",
		};
	}

	// Require organization membership
	if (config.requireOrganization && !user.current_organization_id) {
		return {
			allowed: false,
			redirectTo: "/onboarding/organization",
		};
	}

	// Check role-based access
	if (config.allowedRoles && config.allowedRoles.length > 0) {
		const userRole = user.role;
		if (!userRole || !config.allowedRoles.includes(userRole)) {
			return {
				allowed: false,
				redirectTo: "/dashboard",
			};
		}
	}

	return { allowed: true };
}
