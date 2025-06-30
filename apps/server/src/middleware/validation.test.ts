/**
 * Request Validation Tests
 * Comprehensive test suite for request validation middleware
 */

import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError } from "./error-handler";
import {
	AmazonSchemas,
	AuthSchemas,
	CommonSchemas,
	IntegrationSchemas,
	OrganizationSchemas,
	Sanitizers,
	ValidationHelpers,
	ValidationPresets,
	validate,
} from "./validation";

// Mock Express objects
function createMockRequest(overrides: Partial<Request> = {}): Request {
	return {
		body: {},
		query: {},
		params: {},
		headers: {},
		...overrides,
	} as Request;
}

function createMockResponse(): Response {
	return {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as Response;
}

describe("Request Validation Middleware", () => {
	let req: Request;
	let res: Response;
	let next: NextFunction;

	beforeEach(() => {
		req = createMockRequest();
		res = createMockResponse();
		next = vi.fn();
	});

	describe("Basic Validation", () => {
		it("should pass validation with valid data", async () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			});

			req.body = { name: "John", age: 30 };

			const middleware = validate({ body: schema });
			await middleware(req, res, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.body).toEqual({ name: "John", age: 30 });
		});

		it("should fail validation with invalid data", async () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			});

			req.body = { name: "John", age: "invalid" };

			const middleware = validate({ body: schema });
			await middleware(req, res, next);

			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			const error = next.mock.calls[0][0] as ApiError;
			expect(error.code).toBe("VALIDATION_ERROR");
			expect(error.statusCode).toBe(400);
		});

		it("should validate query parameters", async () => {
			const schema = z.object({
				page: z.string().transform((val) => Number.parseInt(val)),
				limit: z.string().transform((val) => Number.parseInt(val)),
			});

			req.query = { page: "1", limit: "10" };

			const middleware = validate({ query: schema });
			await middleware(req, res, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.query).toEqual({ page: 1, limit: 10 });
		});

		it("should validate URL parameters", async () => {
			const schema = z.object({
				id: z.string().uuid(),
			});

			req.params = { id: "123e4567-e89b-12d3-a456-426614174000" };

			const middleware = validate({ params: schema });
			await middleware(req, res, next);

			expect(next).toHaveBeenCalledWith();
		});

		it("should validate headers", async () => {
			const schema = z.object({
				"content-type": z.string(),
				authorization: z.string(),
			});

			req.headers = {
				"content-type": "application/json",
				authorization: "Bearer token",
			};

			const middleware = validate({ headers: schema });
			await middleware(req, res, next);

			expect(next).toHaveBeenCalledWith();
		});
	});

	describe("Common Schemas", () => {
		describe("ID validation", () => {
			it("should validate UUID format", () => {
				const validUuid = "123e4567-e89b-12d3-a456-426614174000";
				expect(() => CommonSchemas.id.parse(validUuid)).not.toThrow();
			});

			it("should reject invalid UUID format", () => {
				expect(() => CommonSchemas.id.parse("invalid-uuid")).toThrow();
			});
		});

		describe("Email validation", () => {
			it("should validate correct email format", () => {
				expect(() =>
					CommonSchemas.email.parse("test@example.com"),
				).not.toThrow();
			});

			it("should reject invalid email format", () => {
				expect(() => CommonSchemas.email.parse("invalid-email")).toThrow();
			});
		});

		describe("Password validation", () => {
			it("should validate strong password", () => {
				const strongPassword = "StrongPass123!";
				expect(() =>
					CommonSchemas.password.parse(strongPassword),
				).not.toThrow();
			});

			it("should reject weak passwords", () => {
				expect(() => CommonSchemas.password.parse("weak")).toThrow();
				expect(() => CommonSchemas.password.parse("nouppercase123!")).toThrow();
				expect(() => CommonSchemas.password.parse("NOLOWERCASE123!")).toThrow();
				expect(() => CommonSchemas.password.parse("NoNumbers!")).toThrow();
				expect(() =>
					CommonSchemas.password.parse("NoSpecialChars123"),
				).toThrow();
			});
		});

		describe("Pagination validation", () => {
			it("should apply default values", () => {
				const result = CommonSchemas.pagination.parse({});
				expect(result.page).toBe(1);
				expect(result.limit).toBe(10);
				expect(result.sortOrder).toBe("desc");
			});

			it("should transform string values to numbers", () => {
				const result = CommonSchemas.pagination.parse({
					page: "2",
					limit: "25",
				});
				expect(result.page).toBe(2);
				expect(result.limit).toBe(25);
			});

			it("should validate limits", () => {
				expect(() => CommonSchemas.pagination.parse({ page: "0" })).toThrow();
				expect(() =>
					CommonSchemas.pagination.parse({ limit: "101" }),
				).toThrow();
			});
		});

		describe("Date range validation", () => {
			it("should validate correct date range", () => {
				const dateRange = {
					startDate: "2023-01-01T00:00:00Z",
					endDate: "2023-12-31T23:59:59Z",
				};
				expect(() => CommonSchemas.dateRange.parse(dateRange)).not.toThrow();
			});

			it("should reject invalid date range", () => {
				const invalidRange = {
					startDate: "2023-12-31T23:59:59Z",
					endDate: "2023-01-01T00:00:00Z",
				};
				expect(() => CommonSchemas.dateRange.parse(invalidRange)).toThrow();
			});
		});
	});

	describe("Authentication Schemas", () => {
		describe("Sign up validation", () => {
			it("should validate complete sign up data", () => {
				const signUpData = {
					email: "test@example.com",
					password: "StrongPass123!",
					firstName: "John",
					lastName: "Doe",
					acceptTerms: true,
				};
				expect(() => AuthSchemas.signUp.parse(signUpData)).not.toThrow();
			});

			it("should require terms acceptance", () => {
				const signUpData = {
					email: "test@example.com",
					password: "StrongPass123!",
					firstName: "John",
					lastName: "Doe",
					acceptTerms: false,
				};
				expect(() => AuthSchemas.signUp.parse(signUpData)).toThrow();
			});

			it("should allow optional organization name", () => {
				const signUpData = {
					email: "test@example.com",
					password: "StrongPass123!",
					firstName: "John",
					lastName: "Doe",
					organizationName: "Test Corp",
					acceptTerms: true,
				};
				expect(() => AuthSchemas.signUp.parse(signUpData)).not.toThrow();
			});
		});

		describe("Sign in validation", () => {
			it("should validate sign in data", () => {
				const signInData = {
					email: "test@example.com",
					password: "password123",
				};
				expect(() => AuthSchemas.signIn.parse(signInData)).not.toThrow();
			});

			it("should require both email and password", () => {
				expect(() =>
					AuthSchemas.signIn.parse({ email: "test@example.com" }),
				).toThrow();
				expect(() =>
					AuthSchemas.signIn.parse({ password: "password" }),
				).toThrow();
			});
		});
	});

	describe("Amazon Schemas", () => {
		describe("Product search validation", () => {
			it("should validate product search parameters", () => {
				const searchData = {
					query: "wireless headphones",
					marketplace: "ATVPDKIKX0DER",
					page: "1",
					limit: "20",
				};
				expect(() =>
					AmazonSchemas.productSearch.parse(searchData),
				).not.toThrow();
			});

			it("should require search query", () => {
				expect(() => AmazonSchemas.productSearch.parse({})).toThrow();
				expect(() =>
					AmazonSchemas.productSearch.parse({ query: "" }),
				).toThrow();
			});
		});

		describe("Campaign creation validation", () => {
			it("should validate campaign data", () => {
				const campaignData = {
					name: "Test Campaign",
					campaignType: "SPONSORED_PRODUCTS",
					targetingType: "MANUAL",
					state: "ENABLED",
					dailyBudget: 100,
					startDate: "2023-01-01T00:00:00Z",
				};
				expect(() =>
					AmazonSchemas.campaignCreate.parse(campaignData),
				).not.toThrow();
			});

			it("should validate date ordering", () => {
				const invalidCampaign = {
					name: "Test Campaign",
					campaignType: "SPONSORED_PRODUCTS",
					targetingType: "MANUAL",
					dailyBudget: 100,
					startDate: "2023-12-31T00:00:00Z",
					endDate: "2023-01-01T00:00:00Z",
				};
				expect(() =>
					AmazonSchemas.campaignCreate.parse(invalidCampaign),
				).toThrow();
			});

			it("should validate minimum budget", () => {
				const lowBudgetCampaign = {
					name: "Test Campaign",
					campaignType: "SPONSORED_PRODUCTS",
					targetingType: "MANUAL",
					dailyBudget: 0.5,
					startDate: "2023-01-01T00:00:00Z",
				};
				expect(() =>
					AmazonSchemas.campaignCreate.parse(lowBudgetCampaign),
				).toThrow();
			});
		});

		describe("Keyword creation validation", () => {
			it("should validate keyword data", () => {
				const keywordData = {
					campaignId: "123e4567-e89b-12d3-a456-426614174000",
					keywords: [
						{
							keywordText: "wireless headphones",
							matchType: "EXACT",
							bid: 1.5,
						},
					],
				};
				expect(() =>
					AmazonSchemas.keywordCreate.parse(keywordData),
				).not.toThrow();
			});

			it("should require at least one keyword", () => {
				const noKeywords = {
					campaignId: "123e4567-e89b-12d3-a456-426614174000",
					keywords: [],
				};
				expect(() => AmazonSchemas.keywordCreate.parse(noKeywords)).toThrow();
			});

			it("should validate minimum bid", () => {
				const lowBidKeyword = {
					campaignId: "123e4567-e89b-12d3-a456-426614174000",
					keywords: [
						{
							keywordText: "test",
							matchType: "EXACT",
							bid: 0.01,
						},
					],
				};
				expect(() =>
					AmazonSchemas.keywordCreate.parse(lowBidKeyword),
				).toThrow();
			});
		});
	});

	describe("Organization Schemas", () => {
		it("should validate organization creation", () => {
			const orgData = {
				name: "Test Organization",
				description: "A test organization",
				website: "https://example.com",
				industry: "Technology",
			};
			expect(() => OrganizationSchemas.create.parse(orgData)).not.toThrow();
		});

		it("should validate user invitation", () => {
			const inviteData = {
				email: "user@example.com",
				role: "MEMBER",
				message: "Welcome to our organization!",
			};
			expect(() =>
				OrganizationSchemas.inviteUser.parse(inviteData),
			).not.toThrow();
		});
	});

	describe("Integration Schemas", () => {
		it("should validate Amazon SP integration", () => {
			const integrationData = {
				clientId: "test-client-id",
				clientSecret: "test-client-secret",
				refreshToken: "test-refresh-token",
				marketplaceIds: ["ATVPDKIKX0DER"],
				region: "NA",
			};
			expect(() =>
				IntegrationSchemas.amazonSP.parse(integrationData),
			).not.toThrow();
		});

		it("should require at least one marketplace", () => {
			const noMarketplaces = {
				clientId: "test-client-id",
				clientSecret: "test-client-secret",
				refreshToken: "test-refresh-token",
				marketplaceIds: [],
				region: "NA",
			};
			expect(() => IntegrationSchemas.amazonSP.parse(noMarketplaces)).toThrow();
		});
	});

	describe("Validation Presets", () => {
		it("should provide auth validation presets", async () => {
			req.body = {
				email: "test@example.com",
				password: "StrongPass123!",
				firstName: "John",
				lastName: "Doe",
				acceptTerms: true,
			};

			await ValidationPresets.auth.signUp(req, res, next);
			expect(next).toHaveBeenCalledWith();
		});

		it("should provide pagination validation preset", async () => {
			req.query = { page: "2", limit: "25" };

			await ValidationPresets.query.pagination(req, res, next);
			expect(next).toHaveBeenCalledWith();
			expect(req.query.page).toBe(2);
			expect(req.query.limit).toBe(25);
		});

		it("should provide ID parameter validation", async () => {
			req.params = { id: "123e4567-e89b-12d3-a456-426614174000" };

			await ValidationPresets.params.id(req, res, next);
			expect(next).toHaveBeenCalledWith();
		});
	});

	describe("Sanitizers", () => {
		it("should strip HTML tags", () => {
			const input = "<p>Hello <strong>world</strong>!</p>";
			const expected = "Hello world!";
			expect(Sanitizers.stripHtml(input)).toBe(expected);
		});

		it("should normalize email addresses", () => {
			const input = "  Test@EXAMPLE.COM  ";
			const expected = "test@example.com";
			expect(Sanitizers.normalizeEmail(input)).toBe(expected);
		});

		it("should normalize strings", () => {
			const input = "  Hello    world  ";
			const expected = "Hello world";
			expect(Sanitizers.normalizeString(input)).toBe(expected);
		});

		it("should sanitize filenames", () => {
			const input = "my file<name>.txt";
			const expected = "my_file_name_.txt";
			expect(Sanitizers.sanitizeFilename(input)).toBe(expected);
		});
	});

	describe("Validation Helpers", () => {
		it("should create array schema with limits", () => {
			const schema = ValidationHelpers.createArraySchema(z.string(), 2, 5);

			expect(() => schema.parse(["a", "b"])).not.toThrow();
			expect(() => schema.parse(["a"])).toThrow(); // Too few
			expect(() => schema.parse(["a", "b", "c", "d", "e", "f"])).toThrow(); // Too many
		});

		it("should create optional string schema", () => {
			const schema = ValidationHelpers.createOptionalStringSchema(10);

			expect(() => schema.parse(undefined)).not.toThrow();
			expect(() => schema.parse("short")).not.toThrow();
			expect(() => schema.parse("this is too long")).toThrow();
		});

		it("should create enum from array", () => {
			const schema = ValidationHelpers.createEnumFromArray([
				"red",
				"green",
				"blue",
			] as const);

			expect(() => schema.parse("red")).not.toThrow();
			expect(() => schema.parse("yellow")).toThrow();
		});
	});

	describe("Error Handling", () => {
		it("should format validation errors correctly", async () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
				email: z.string().email(),
			});

			req.body = {
				name: 123, // Wrong type
				age: "invalid", // Wrong type
				email: "invalid-email", // Invalid format
			};

			const middleware = validate({ body: schema });
			await middleware(req, res, next);

			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			const error = next.mock.calls[0][0] as ApiError;
			expect(error.details.errors).toHaveLength(3);
			expect(error.details.errors[0]).toMatchObject({
				field: "name",
				code: "invalid_type",
				message: expect.any(String),
			});
		});

		it("should support custom error messages", async () => {
			const schema = z.object({
				name: z.string(),
			});

			req.body = { name: 123 };

			const middleware = validate({
				body: schema,
				customErrorMessage: "Custom validation failed",
			});
			await middleware(req, res, next);

			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			const error = next.mock.calls[0][0] as ApiError;
			expect(error.message).toBe("Custom validation failed");
		});

		it("should support custom error message functions", async () => {
			const schema = z.object({
				name: z.string(),
			});

			req.body = { name: 123 };

			const middleware = validate({
				body: schema,
				customErrorMessage: (zodError) =>
					`Found ${zodError.errors.length} validation errors`,
			});
			await middleware(req, res, next);

			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			const error = next.mock.calls[0][0] as ApiError;
			expect(error.message).toBe("Found 1 validation errors");
		});
	});

	describe("Multiple Validation Types", () => {
		it("should validate multiple request parts simultaneously", async () => {
			const middleware = validate({
				params: z.object({ id: z.string().uuid() }),
				query: z.object({ include: z.string().optional() }),
				body: z.object({ name: z.string() }),
			});

			req.params = { id: "123e4567-e89b-12d3-a456-426614174000" };
			req.query = { include: "details" };
			req.body = { name: "Test" };

			await middleware(req, res, next);
			expect(next).toHaveBeenCalledWith();
		});

		it("should collect errors from all validation types", async () => {
			const middleware = validate({
				params: z.object({ id: z.string().uuid() }),
				body: z.object({ name: z.string() }),
			});

			req.params = { id: "invalid-uuid" };
			req.body = { name: 123 };

			await middleware(req, res, next);

			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			const error = next.mock.calls[0][0] as ApiError;
			expect(error.details.errors).toHaveLength(2);
		});
	});
});
