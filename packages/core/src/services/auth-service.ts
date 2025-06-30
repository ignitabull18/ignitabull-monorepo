/**
 * Authentication Service
 * Handles all authentication operations with Supabase
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
	type AuthError,
	AuthManager,
	type AuthSession,
	AuthStorage,
	type AuthUser,
	type CreateOrganizationData,
	getAuthErrorMessage,
	type Organization,
	type ResetPasswordData,
	type SignInData,
	type SignUpData,
	type UpdatePasswordData,
	type UpdateProfileData,
	validateEmail,
	validateName,
	validateOrganizationSlug,
	validatePassword,
} from "../lib/auth";
import type { Database } from "../types/database";

export class AuthService {
	private supabase: SupabaseClient<Database>;
	private authManager: AuthManager;

	constructor(supabaseUrl: string, supabaseKey: string) {
		this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
		this.authManager = AuthManager.getInstance();

		// Set up auth state change listener
		this.supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_IN" && session) {
				this.handleAuthSession(session);
			} else if (event === "SIGNED_OUT") {
				this.authManager.clearSession();
				AuthStorage.clearSession();
			} else if (event === "TOKEN_REFRESHED" && session) {
				this.handleAuthSession(session);
			}
		});

		// Initialize session from storage
		this.initializeFromStorage();
	}

	private async initializeFromStorage(): Promise<void> {
		try {
			const {
				data: { session },
				error,
			} = await this.supabase.auth.getSession();

			if (error) {
				console.error("Failed to get session:", error);
				return;
			}

			if (session) {
				await this.handleAuthSession(session);
			} else {
				// Check for stored session
				const storedSession = AuthStorage.getSession();
				if (storedSession) {
					this.authManager.setSession(storedSession);
				}
			}
		} catch (error) {
			console.error("Failed to initialize auth from storage:", error);
		}
	}

	private async handleAuthSession(session: {
		user: { id: string };
		access_token: string;
		refresh_token: string;
		expires_at?: number;
	}): Promise<void> {
		try {
			// Get user profile data
			const { data: userData, error: userError } = await this.supabase
				.from("users")
				.select("*")
				.eq("id", session.user.id)
				.single();

			if (userError || !userData) {
				console.error("Failed to get user data:", userError);
				return;
			}

			const authSession: AuthSession = {
				user: userData,
				accessToken: session.access_token,
				refreshToken: session.refresh_token,
				expiresAt: new Date(session.expires_at! * 1000).getTime(),
			};

			this.authManager.setSession(authSession);
			AuthStorage.setSession(authSession);
		} catch (error) {
			console.error("Failed to handle auth session:", error);
		}
	}

	// Authentication methods
	async signUp(
		data: SignUpData,
	): Promise<{ user: AuthUser | null; error: AuthError | null }> {
		try {
			// Validate input data
			if (!validateEmail(data.email)) {
				return {
					user: null,
					error: {
						code: "invalid_email",
						message: "Please enter a valid email address",
					},
				};
			}

			const passwordValidation = validatePassword(data.password);
			if (!passwordValidation.isValid) {
				return {
					user: null,
					error: {
						code: "weak_password",
						message: passwordValidation.errors[0],
					},
				};
			}

			if (!validateName(data.firstName) || !validateName(data.lastName)) {
				return {
					user: null,
					error: {
						code: "invalid_name",
						message: "Please enter valid first and last names",
					},
				};
			}

			// Sign up with Supabase Auth
			const { data: authData, error: authError } =
				await this.supabase.auth.signUp({
					email: data.email,
					password: data.password,
					options: {
						data: {
							first_name: data.firstName,
							last_name: data.lastName,
							organization_name: data.organizationName,
						},
					},
				});

			if (authError) {
				return {
					user: null,
					error: {
						code: authError.message,
						message: getAuthErrorMessage(authError),
						details: authError,
					},
				};
			}

			if (!authData.user) {
				return {
					user: null,
					error: { code: "signup_failed", message: "Failed to create account" },
				};
			}

			// Create user profile (handled by database trigger)
			// The user profile will be created automatically by the trigger
			// when the auth.users record is created

			return { user: null, error: null }; // User will be null until email is confirmed
		} catch (error) {
			console.error("Sign up error:", error);
			return {
				user: null,
				error: {
					code: "unexpected_error",
					message: getAuthErrorMessage(error),
					details: error,
				},
			};
		}
	}

	async signIn(
		data: SignInData,
	): Promise<{ user: AuthUser | null; error: AuthError | null }> {
		try {
			if (!validateEmail(data.email)) {
				return {
					user: null,
					error: {
						code: "invalid_email",
						message: "Please enter a valid email address",
					},
				};
			}

			const { data: authData, error: authError } =
				await this.supabase.auth.signInWithPassword({
					email: data.email,
					password: data.password,
				});

			if (authError) {
				return {
					user: null,
					error: {
						code: authError.message,
						message: getAuthErrorMessage(authError),
						details: authError,
					},
				};
			}

			if (!authData.user) {
				return {
					user: null,
					error: { code: "signin_failed", message: "Failed to sign in" },
				};
			}

			// Store remember me preference
			AuthStorage.setRememberMe(data.rememberMe || false);

			// Session will be handled by the auth state change listener
			return { user: null, error: null }; // User will be set by the listener
		} catch (error) {
			console.error("Sign in error:", error);
			return {
				user: null,
				error: {
					code: "unexpected_error",
					message: getAuthErrorMessage(error),
					details: error,
				},
			};
		}
	}

	async signOut(): Promise<{ error: AuthError | null }> {
		try {
			const { error } = await this.supabase.auth.signOut();

			// Clear local storage regardless of Supabase response
			this.authManager.clearSession();
			AuthStorage.clearSession();

			if (error) {
				console.error("Sign out error:", error);
				return {
					error: {
						code: error.message,
						message: getAuthErrorMessage(error),
						details: error,
					},
				};
			}

			return { error: null };
		} catch (error) {
			console.error("Sign out error:", error);
			return {
				error: {
					code: "unexpected_error",
					message: getAuthErrorMessage(error),
					details: error,
				},
			};
		}
	}

	async resetPassword(
		data: ResetPasswordData,
	): Promise<{ error: AuthError | null }> {
		try {
			if (!validateEmail(data.email)) {
				return {
					error: {
						code: "invalid_email",
						message: "Please enter a valid email address",
					},
				};
			}

			const { error } = await this.supabase.auth.resetPasswordForEmail(
				data.email,
				{
					redirectTo: `${window.location.origin}/auth/reset-password`,
				},
			);

			if (error) {
				return {
					error: {
						code: error.message,
						message: getAuthErrorMessage(error),
						details: error,
					},
				};
			}

			return { error: null };
		} catch (error) {
			console.error("Reset password error:", error);
			return {
				error: {
					code: "unexpected_error",
					message: getAuthErrorMessage(error),
					details: error,
				},
			};
		}
	}

	async updatePassword(
		data: UpdatePasswordData,
	): Promise<{ error: AuthError | null }> {
		try {
			if (data.password !== data.confirmPassword) {
				return {
					error: {
						code: "passwords_mismatch",
						message: "Passwords do not match",
					},
				};
			}

			const passwordValidation = validatePassword(data.password);
			if (!passwordValidation.isValid) {
				return {
					error: {
						code: "weak_password",
						message: passwordValidation.errors[0],
					},
				};
			}

			const { error } = await this.supabase.auth.updateUser({
				password: data.password,
			});

			if (error) {
				return {
					error: {
						code: error.message,
						message: getAuthErrorMessage(error),
						details: error,
					},
				};
			}

			return { error: null };
		} catch (error) {
			console.error("Update password error:", error);
			return {
				error: {
					code: "unexpected_error",
					message: getAuthErrorMessage(error),
					details: error,
				},
			};
		}
	}

	async updateProfile(
		data: UpdateProfileData,
	): Promise<{ user: AuthUser | null; error: AuthError | null }> {
		try {
			const currentUser = this.authManager.getUser();
			if (!currentUser) {
				return {
					user: null,
					error: { code: "not_authenticated", message: "Not authenticated" },
				};
			}

			// Validate names if provided
			if (data.firstName && !validateName(data.firstName)) {
				return {
					user: null,
					error: {
						code: "invalid_name",
						message: "Please enter a valid first name",
					},
				};
			}

			if (data.lastName && !validateName(data.lastName)) {
				return {
					user: null,
					error: {
						code: "invalid_name",
						message: "Please enter a valid last name",
					},
				};
			}

			// Update user profile in database
			const updateData: Record<string, string | Date> = {};
			if (data.firstName !== undefined) updateData.first_name = data.firstName;
			if (data.lastName !== undefined) updateData.last_name = data.lastName;
			if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
			if (data.timezone !== undefined) updateData.timezone = data.timezone;
			updateData.updated_at = new Date().toISOString();

			const { data: userData, error: updateError } = await this.supabase
				.from("users")
				.update(updateData)
				.eq("id", currentUser.id)
				.select()
				.single();

			if (updateError || !userData) {
				return {
					user: null,
					error: {
						code: "update_failed",
						message: "Failed to update profile",
						details: updateError,
					},
				};
			}

			// Update the session with new user data
			const currentSession = this.authManager.getSession();
			if (currentSession) {
				const updatedSession: AuthSession = {
					...currentSession,
					user: userData,
				};
				this.authManager.setSession(updatedSession);
				AuthStorage.setSession(updatedSession);
			}

			return { user: userData, error: null };
		} catch (error) {
			console.error("Update profile error:", error);
			return {
				user: null,
				error: {
					code: "unexpected_error",
					message: getAuthErrorMessage(error),
					details: error,
				},
			};
		}
	}

	// Organization management
	async createOrganization(
		data: CreateOrganizationData,
	): Promise<{ organization: Organization | null; error: AuthError | null }> {
		try {
			const currentUser = this.authManager.getUser();
			if (!currentUser) {
				return {
					organization: null,
					error: { code: "not_authenticated", message: "Not authenticated" },
				};
			}

			if (!validateOrganizationSlug(data.slug)) {
				return {
					organization: null,
					error: {
						code: "invalid_slug",
						message:
							"Organization slug must be 3-50 characters and contain only lowercase letters, numbers, and hyphens",
					},
				};
			}

			// Check if slug is available
			const { data: existingOrg } = await this.supabase
				.from("organizations")
				.select("slug")
				.eq("slug", data.slug)
				.single();

			if (existingOrg) {
				return {
					organization: null,
					error: {
						code: "slug_taken",
						message: "This organization name is already taken",
					},
				};
			}

			// Create organization
			const { data: orgData, error: orgError } = await this.supabase
				.from("organizations")
				.insert({
					name: data.name,
					slug: data.slug,
					description: data.description,
					website: data.website,
					industry: data.industry,
					owner_id: currentUser.id,
				})
				.select()
				.single();

			if (orgError || !orgData) {
				return {
					organization: null,
					error: {
						code: "creation_failed",
						message: "Failed to create organization",
						details: orgError,
					},
				};
			}

			// Update user's current organization
			await this.supabase
				.from("users")
				.update({
					current_organization_id: orgData.id,
					updated_at: new Date().toISOString(),
				})
				.eq("id", currentUser.id);

			return { organization: orgData, error: null };
		} catch (error) {
			console.error("Create organization error:", error);
			return {
				organization: null,
				error: {
					code: "unexpected_error",
					message: getAuthErrorMessage(error),
					details: error,
				},
			};
		}
	}

	// Utility methods
	getCurrentUser(): AuthUser | null {
		return this.authManager.getUser();
	}

	getCurrentSession(): AuthSession | null {
		return this.authManager.getSession();
	}

	isAuthenticated(): boolean {
		return this.authManager.isAuthenticated();
	}

	addEventListener(handler: (event: any) => void): () => void {
		return this.authManager.addEventListener(handler);
	}

	async refreshSession(): Promise<AuthSession | null> {
		try {
			const { data, error } = await this.supabase.auth.refreshSession();

			if (error || !data.session) {
				this.authManager.clearSession();
				AuthStorage.clearSession();
				return null;
			}

			await this.handleAuthSession(data.session);
			return this.authManager.getSession();
		} catch (error) {
			console.error("Refresh session error:", error);
			this.authManager.clearSession();
			AuthStorage.clearSession();
			return null;
		}
	}
}
