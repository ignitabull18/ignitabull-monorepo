/**
 * Authentication Context Provider
 * Manages authentication state and provides auth methods throughout the app
 */

import type { Session, User } from "@supabase/supabase-js";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
	type LoginData,
	type SignupData,
	SupabaseAuthService,
} from "../services/supabase-auth-service";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signUp: (data: SignupData) => Promise<{ error: Error | null }>;
	signIn: (data: LoginData) => Promise<{ error: Error | null }>;
	signOut: () => Promise<{ error: Error | null }>;
	resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: React.ReactNode;
	supabaseUrl: string;
	supabaseAnonKey: string;
}

export function AuthProvider({
	children,
	supabaseUrl,
	supabaseAnonKey,
}: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const [authService] = useState(
		() => new SupabaseAuthService(supabaseUrl, supabaseAnonKey),
	);

	useEffect(() => {
		// Get initial session
		authService.getSession().then((session) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		// Subscribe to auth changes
		const unsubscribe = authService.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return unsubscribe;
	}, [authService]);

	const signUp = async (data: SignupData) => {
		const { error } = await authService.signUp(data);
		return { error };
	};

	const signIn = async (data: LoginData) => {
		const { error } = await authService.signIn(data);
		return { error };
	};

	const signOut = async () => {
		const { error } = await authService.signOut();
		return { error };
	};

	const resetPassword = async (email: string) => {
		const { error } = await authService.resetPassword({ email });
		return { error };
	};

	const value = {
		user,
		session,
		loading,
		signUp,
		signIn,
		signOut,
		resetPassword,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
