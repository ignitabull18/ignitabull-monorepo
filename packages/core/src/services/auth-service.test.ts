/**
 * AuthService Tests
 * Comprehensive test suite for authentication service
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockOrganization,
	createMockSession,
	createMockSupabaseSingleResponse,
	createMockUser,
} from "../../../test/utils";
import type {
	CreateOrganizationData,
	SignInData,
	SignUpData,
	UpdateProfileData,
} from "../lib/auth";
import { AuthService } from "./auth-service";

// Mock Supabase client
const mockSupabaseClient = {
	auth: {
		signUp: vi.fn(),
		signInWithPassword: vi.fn(),
		signOut: vi.fn(),
		getUser: vi.fn(),
		onAuthStateChange: vi.fn(),
		resetPasswordForEmail: vi.fn(),
		updateUser: vi.fn(),
	},
	from: vi.fn(() => ({
		select: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi.fn(),
	})),
};

vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn(() => mockSupabaseClient),
}));

describe("AuthService", () => {
	let authService: AuthService;
	let mockAuthManager: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock AuthManager
		mockAuthManager = {
			getUser: vi.fn(),
			getSession: vi.fn(),
			setSession: vi.fn(),
			clearSession: vi.fn(),
			addEventListener: vi.fn(() => vi.fn()), // Returns unsubscribe function
		};

		authService = new AuthService(mockAuthManager);
	});

	describe("signUp", () => {
		it("should successfully create a new user account", async () => {
			const signUpData: SignUpData = {
				email: "test@example.com",
				password: "Password123!",
				firstName: "Test",
				lastName: "User",
				organizationName: "Test Org",
			};

			const mockAuthData = {
				user: { id: "test-user-id", email: "test@example.com" },
				session: null,
			};

			mockSupabaseClient.auth.signUp.mockResolvedValue({
				data: mockAuthData,
				error: null,
			});

			const result = await authService.signUp(signUpData);

			expect(result.error).toBeNull();
			expect(result.user).toBeNull(); // User is null until email confirmed
			expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
				email: signUpData.email,
				password: signUpData.password,
				options: {
					data: {
						first_name: signUpData.firstName,
						last_name: signUpData.lastName,
						organization_name: signUpData.organizationName,
					},
				},
			});
		});

		it("should return error for invalid email", async () => {
			const signUpData: SignUpData = {
				email: "invalid-email",
				password: "Password123!",
				firstName: "Test",
				lastName: "User",
			};

			const result = await authService.signUp(signUpData);

			expect(result.error).toEqual({
				code: "invalid_email",
				message: "Please enter a valid email address",
			});
			expect(result.user).toBeNull();
			expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
		});

		it("should return error for weak password", async () => {
			const signUpData: SignUpData = {
				email: "test@example.com",
				password: "123", // Weak password
				firstName: "Test",
				lastName: "User",
			};

			const result = await authService.signUp(signUpData);

			expect(result.error?.code).toBe("weak_password");
			expect(result.user).toBeNull();
			expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
		});

		it("should handle Supabase auth errors", async () => {
			const signUpData: SignUpData = {
				email: "test@example.com",
				password: "Password123!",
				firstName: "Test",
				lastName: "User",
			};

			const authError = { message: "Email already exists" };
			mockSupabaseClient.auth.signUp.mockResolvedValue({
				data: null,
				error: authError,
			});

			const result = await authService.signUp(signUpData);

			expect(result.error).toEqual({
				code: authError.message,
				message: authError.message,
				details: authError,
			});
			expect(result.user).toBeNull();
		});
	});

	describe("signIn", () => {
		it("should successfully sign in a user", async () => {
			const signInData: SignInData = {
				email: "test@example.com",
				password: "Password123!",
				rememberMe: true,
			};

			const mockAuthData = {
				user: { id: "test-user-id", email: "test@example.com" },
				session: { access_token: "token", refresh_token: "refresh" },
			};

			mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
				data: mockAuthData,
				error: null,
			});

			const result = await authService.signIn(signInData);

			expect(result.error).toBeNull();
			expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
				email: signInData.email,
				password: signInData.password,
			});
		});

		it("should return error for invalid credentials", async () => {
			const signInData: SignInData = {
				email: "test@example.com",
				password: "wrongpassword",
			};

			const authError = { message: "Invalid credentials" };
			mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
				data: null,
				error: authError,
			});

			const result = await authService.signIn(signInData);

			expect(result.error).toEqual({
				code: authError.message,
				message: authError.message,
				details: authError,
			});
		});
	});

	describe("signOut", () => {
		it("should successfully sign out", async () => {
			mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

			const result = await authService.signOut();

			expect(result.error).toBeNull();
			expect(mockAuthManager.clearSession).toHaveBeenCalled();
			expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
		});

		it("should handle sign out errors gracefully", async () => {
			const authError = { message: "Sign out failed" };
			mockSupabaseClient.auth.signOut.mockResolvedValue({ error: authError });

			const result = await authService.signOut();

			expect(result.error).toEqual({
				code: authError.message,
				message: authError.message,
				details: authError,
			});
			// Should still clear local session even if Supabase fails
			expect(mockAuthManager.clearSession).toHaveBeenCalled();
		});
	});

	describe("updateProfile", () => {
		it("should successfully update user profile", async () => {
			const mockUser = createMockUser();
			const updateData: UpdateProfileData = {
				firstName: "Updated",
				lastName: "Name",
				timezone: "PST",
			};

			mockAuthManager.getUser.mockReturnValue(mockUser);
			mockAuthManager.getSession.mockReturnValue(createMockSession());

			const mockUpdatedUser = {
				...mockUser,
				first_name: "Updated",
				last_name: "Name",
			};
			const mockFromChain = {
				update: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi
					.fn()
					.mockResolvedValue(createMockSupabaseSingleResponse(mockUpdatedUser)),
			};

			mockSupabaseClient.from.mockReturnValue(mockFromChain);

			const result = await authService.updateProfile(updateData);

			expect(result.error).toBeNull();
			expect(result.user).toEqual(mockUpdatedUser);
			expect(mockAuthManager.setSession).toHaveBeenCalled();
			expect(mockFromChain.update).toHaveBeenCalledWith({
				first_name: "Updated",
				last_name: "Name",
				timezone: "PST",
				updated_at: expect.any(String),
			});
		});

		it("should return error when user not authenticated", async () => {
			mockAuthManager.getUser.mockReturnValue(null);

			const result = await authService.updateProfile({ firstName: "Test" });

			expect(result.error).toEqual({
				code: "not_authenticated",
				message: "Not authenticated",
			});
			expect(result.user).toBeNull();
		});
	});

	describe("createOrganization", () => {
		it("should successfully create an organization", async () => {
			const mockUser = createMockUser();
			const orgData: CreateOrganizationData = {
				name: "Test Organization",
				slug: "test-org",
				description: "Test description",
				website: "https://test.com",
				industry: "Technology",
			};

			mockAuthManager.getUser.mockReturnValue(mockUser);

			const mockOrganization = createMockOrganization(orgData);
			const mockFromChain = {
				select: vi.fn().mockReturnThis(),
				insert: vi.fn().mockReturnThis(),
				update: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn(),
			};

			// Mock slug availability check (no existing org)
			mockFromChain.single.mockResolvedValueOnce({ data: null, error: null });
			// Mock organization creation
			mockFromChain.single.mockResolvedValueOnce(
				createMockSupabaseSingleResponse(mockOrganization),
			);

			mockSupabaseClient.from.mockReturnValue(mockFromChain);

			const result = await authService.createOrganization(orgData);

			expect(result.error).toBeNull();
			expect(result.organization).toEqual(mockOrganization);
			expect(mockFromChain.insert).toHaveBeenCalledWith({
				name: orgData.name,
				slug: orgData.slug,
				description: orgData.description,
				website: orgData.website,
				industry: orgData.industry,
				owner_id: mockUser.id,
			});
		});

		it("should return error for invalid slug", async () => {
			const mockUser = createMockUser();
			mockAuthManager.getUser.mockReturnValue(mockUser);

			const orgData: CreateOrganizationData = {
				name: "Test Organization",
				slug: "ab", // Too short
				description: "Test description",
			};

			const result = await authService.createOrganization(orgData);

			expect(result.error?.code).toBe("invalid_slug");
			expect(result.organization).toBeNull();
		});

		it("should return error when slug is taken", async () => {
			const mockUser = createMockUser();
			mockAuthManager.getUser.mockReturnValue(mockUser);

			const orgData: CreateOrganizationData = {
				name: "Test Organization",
				slug: "test-org",
			};

			const mockFromChain = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi
					.fn()
					.mockResolvedValue({ data: { slug: "test-org" }, error: null }),
			};

			mockSupabaseClient.from.mockReturnValue(mockFromChain);

			const result = await authService.createOrganization(orgData);

			expect(result.error).toEqual({
				code: "slug_taken",
				message: "This organization name is already taken",
			});
			expect(result.organization).toBeNull();
		});
	});

	describe("getCurrentUser", () => {
		it("should return current user from auth manager", () => {
			const mockUser = createMockUser();
			mockAuthManager.getUser.mockReturnValue(mockUser);

			const result = authService.getCurrentUser();

			expect(result).toEqual(mockUser);
			expect(mockAuthManager.getUser).toHaveBeenCalled();
		});

		it("should return null when no user is authenticated", () => {
			mockAuthManager.getUser.mockReturnValue(null);

			const result = authService.getCurrentUser();

			expect(result).toBeNull();
		});
	});

	describe("isAuthenticated", () => {
		it("should return true when user is authenticated", () => {
			const mockUser = createMockUser();
			mockAuthManager.getUser.mockReturnValue(mockUser);

			const result = authService.isAuthenticated();

			expect(result).toBe(true);
		});

		it("should return false when user is not authenticated", () => {
			mockAuthManager.getUser.mockReturnValue(null);

			const result = authService.isAuthenticated();

			expect(result).toBe(false);
		});
	});
});
