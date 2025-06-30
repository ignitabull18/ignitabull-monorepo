/**
 * Supabase Authentication Service
 * Handles all authentication operations for the Ignitabull MVP
 *
 * @module supabase-auth-service
 */

import {
	createClient,
	type Session,
	type SupabaseClient,
	type User,
} from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Signup form data schema
 */
export const SignupSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	fullName: z.string().min(2, "Full name is required"),
	organizationName: z.string().min(2, "Organization name is required"),
});

export type SignupData = z.infer<typeof SignupSchema>;

/**
 * Login form data schema
 */
export const LoginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof LoginSchema>;

/**
 * Password reset request schema
 */
export const PasswordResetSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export type PasswordResetData = z.infer<typeof PasswordResetSchema>;

/**
 * New password schema
 */
export const NewPasswordSchema = z
	.object({
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export type NewPasswordData = z.infer<typeof NewPasswordSchema>;

/**
 * Authentication response type
 */
export interface AuthResponse {
	user: User | null;
	session: Session | null;
	error: Error | null;
}

/**
 * Supabase Authentication Service
 * Provides methods for user authentication and session management
 */
export class SupabaseAuthService {
	private supabase: SupabaseClient;

	constructor(supabaseUrl: string, supabaseAnonKey: string) {
		this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				autoRefreshToken: true,
				persistSession: true,
				detectSessionInUrl: true,
			},
		});
	}

	/**
	 * Sign up a new user and create their organization
	 * @param data - Signup form data
	 * @returns Authentication response with user and session
	 */
	async signUp(data: SignupData): Promise<AuthResponse> {
		try {
			const validatedData = SignupSchema.parse(data);

			const { data: authData, error } = await this.supabase.auth.signUp({
				email: validatedData.email,
				password: validatedData.password,
				options: {
					data: {
						full_name: validatedData.fullName,
						organization_name: validatedData.organizationName,
					},
				},
			});

			if (error) throw error;

			return {
				user: authData.user,
				session: authData.session,
				error: null,
			};
		} catch (error) {
			return {
				user: null,
				session: null,
				error: error as Error,
			};
		}
	}

	/**
	 * Sign in an existing user
	 * @param data - Login form data
	 * @returns Authentication response with user and session
	 */
	async signIn(data: LoginData): Promise<AuthResponse> {
		try {
			const validatedData = LoginSchema.parse(data);

			const { data: authData, error } =
				await this.supabase.auth.signInWithPassword({
					email: validatedData.email,
					password: validatedData.password,
				});

			if (error) throw error;

			return {
				user: authData.user,
				session: authData.session,
				error: null,
			};
		} catch (error) {
			return {
				user: null,
				session: null,
				error: error as Error,
			};
		}
	}

	/**
	 * Sign out the current user
	 * @returns Promise resolving to error if any
	 */
	async signOut(): Promise<{ error: Error | null }> {
		try {
			const { error } = await this.supabase.auth.signOut();
			if (error) throw error;
			return { error: null };
		} catch (error) {
			return { error: error as Error };
		}
	}

	/**
	 * Send password reset email
	 * @param data - Password reset form data
	 * @returns Promise resolving to error if any
	 */
	async resetPassword(
		data: PasswordResetData,
	): Promise<{ error: Error | null }> {
		try {
			const validatedData = PasswordResetSchema.parse(data);

			const { error } = await this.supabase.auth.resetPasswordForEmail(
				validatedData.email,
				{
					redirectTo: `${window.location.origin}/auth/reset-password`,
				},
			);

			if (error) throw error;
			return { error: null };
		} catch (error) {
			return { error: error as Error };
		}
	}

	/**
	 * Update user password
	 * @param data - New password data
	 * @returns Authentication response with updated user
	 */
	async updatePassword(data: NewPasswordData): Promise<AuthResponse> {
		try {
			const validatedData = NewPasswordSchema.parse(data);

			const { data: authData, error } = await this.supabase.auth.updateUser({
				password: validatedData.password,
			});

			if (error) throw error;

			return {
				user: authData.user,
				session: null,
				error: null,
			};
		} catch (error) {
			return {
				user: null,
				session: null,
				error: error as Error,
			};
		}
	}

	/**
	 * Get current session
	 * @returns Current session or null
	 */
	async getSession(): Promise<Session | null> {
		const {
			data: { session },
		} = await this.supabase.auth.getSession();
		return session;
	}

	/**
	 * Get current user
	 * @returns Current user or null
	 */
	async getUser(): Promise<User | null> {
		const {
			data: { user },
		} = await this.supabase.auth.getUser();
		return user;
	}

	/**
	 * Subscribe to auth state changes
	 * @param callback - Function to call on auth state change
	 * @returns Unsubscribe function
	 */
	onAuthStateChange(
		callback: (event: string, session: Session | null) => void,
	) {
		const {
			data: { subscription },
		} = this.supabase.auth.onAuthStateChange(callback);
		return () => subscription.unsubscribe();
	}

	/**
	 * Verify email with OTP
	 * @param email - User email
	 * @param token - OTP token
	 * @returns Authentication response
	 */
	async verifyOtp(email: string, token: string): Promise<AuthResponse> {
		try {
			const { data, error } = await this.supabase.auth.verifyOtp({
				email,
				token,
				type: "email",
			});

			if (error) throw error;

			return {
				user: data.user,
				session: data.session,
				error: null,
			};
		} catch (error) {
			return {
				user: null,
				session: null,
				error: error as Error,
			};
		}
	}

	/**
	 * Get the Supabase client instance
	 * @returns Supabase client
	 */
	getClient(): SupabaseClient {
		return this.supabase;
	}
}

// Initialize and export a singleton instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		"Supabase URL and Anon Key must be defined in environment variables",
	);
}

export const authService = new SupabaseAuthService(
	supabaseUrl,
	supabaseAnonKey,
);
