/**
 * Request Validation Middleware
 * Enterprise-grade request validation with Zod schemas
 */

import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema, z } from "zod";
import { ApiError } from "./error-handler";

export interface ValidationConfig {
	body?: ZodSchema<any>;
	query?: ZodSchema<any>;
	params?: ZodSchema<any>;
	headers?: ZodSchema<any>;
	stripUnknown?: boolean;
	allowUnknown?: boolean;
	customErrorMessage?: string | ((error: ZodError) => string);
}

export interface ValidationError {
	field: string;
	code: string;
	message: string;
	received?: any;
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
	// Basic types
	id: z.string().uuid("Invalid UUID format"),
	email: z.string().email("Invalid email format"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),

	// Pagination
	pagination: z.object({
		page: z
			.string()
			.optional()
			.transform((val) => (val ? Number.parseInt(val) : 1))
			.pipe(z.number().min(1, "Page must be at least 1")),
		limit: z
			.string()
			.optional()
			.transform((val) => (val ? Number.parseInt(val) : 10))
			.pipe(z.number().min(1).max(100, "Limit must be between 1 and 100")),
		sortBy: z.string().optional(),
		sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
	}),

	// Date ranges
	dateRange: z
		.object({
			startDate: z.string().datetime("Invalid start date format"),
			endDate: z.string().datetime("Invalid end date format"),
		})
		.refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
			message: "Start date must be before or equal to end date",
			path: ["startDate"],
		}),

	// Search
	search: z.object({
		q: z
			.string()
			.min(1, "Search query cannot be empty")
			.max(100, "Search query too long"),
		filters: z.record(z.string()).optional(),
	}),

	// File upload
	fileUpload: z.object({
		filename: z.string().min(1, "Filename is required"),
		size: z.number().max(10 * 1024 * 1024, "File size cannot exceed 10MB"),
		mimetype: z
			.string()
			.regex(/^(image|application|text)\//, "Invalid file type"),
	}),
};

/**
 * Authentication schemas
 */
export const AuthSchemas = {
	signUp: z.object({
		email: CommonSchemas.email,
		password: CommonSchemas.password,
		firstName: z
			.string()
			.min(1, "First name is required")
			.max(50, "First name too long"),
		lastName: z
			.string()
			.min(1, "Last name is required")
			.max(50, "Last name too long"),
		organizationName: z.string().optional(),
		acceptTerms: z.boolean().refine((val) => val === true, {
			message: "You must accept the terms and conditions",
		}),
	}),

	signIn: z.object({
		email: CommonSchemas.email,
		password: z.string().min(1, "Password is required"),
	}),

	resetPassword: z.object({
		email: CommonSchemas.email,
	}),

	changePassword: z.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: CommonSchemas.password,
	}),

	refreshToken: z.object({
		refreshToken: z.string().min(1, "Refresh token is required"),
	}),
};

/**
 * Amazon API schemas
 */
export const AmazonSchemas = {
	productSearch: z.object({
		query: z.string().min(1, "Search query is required").max(200),
		marketplace: z.string().optional(),
		category: z.string().optional(),
		...CommonSchemas.pagination.shape,
	}),

	campaignCreate: z
		.object({
			name: z.string().min(1, "Campaign name is required").max(100),
			campaignType: z.enum([
				"SPONSORED_PRODUCTS",
				"SPONSORED_BRANDS",
				"SPONSORED_DISPLAY",
			]),
			targetingType: z.enum(["MANUAL", "AUTO"]),
			state: z.enum(["ENABLED", "PAUSED"]).default("ENABLED"),
			dailyBudget: z.number().min(1, "Daily budget must be at least $1"),
			startDate: z.string().datetime(),
			endDate: z.string().datetime().optional(),
		})
		.refine(
			(data) => {
				if (data.endDate) {
					return new Date(data.startDate) < new Date(data.endDate);
				}
				return true;
			},
			{
				message: "Start date must be before end date",
				path: ["startDate"],
			},
		),

	keywordCreate: z.object({
		campaignId: CommonSchemas.id,
		keywords: z
			.array(
				z.object({
					keywordText: z.string().min(1, "Keyword text is required"),
					matchType: z.enum(["EXACT", "PHRASE", "BROAD"]),
					bid: z.number().min(0.02, "Bid must be at least $0.02"),
				}),
			)
			.min(1, "At least one keyword is required")
			.max(100, "Maximum 100 keywords allowed"),
	}),

	reportRequest: z.object({
		reportType: z.enum(["CAMPAIGNS", "AD_GROUPS", "KEYWORDS", "PRODUCTS"]),
		timeUnit: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
		...CommonSchemas.dateRange.shape,
		metrics: z.array(z.string()).optional(),
	}),
};

/**
 * Organization and user management schemas
 */
export const OrganizationSchemas = {
	create: z.object({
		name: z.string().min(1, "Organization name is required").max(100),
		description: z.string().max(500).optional(),
		website: z.string().url("Invalid website URL").optional(),
		industry: z.string().max(50).optional(),
	}),

	update: z.object({
		name: z
			.string()
			.min(1, "Organization name is required")
			.max(100)
			.optional(),
		description: z.string().max(500).optional(),
		website: z.string().url("Invalid website URL").optional(),
		industry: z.string().max(50).optional(),
	}),

	inviteUser: z.object({
		email: CommonSchemas.email,
		role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
		message: z.string().max(500).optional(),
	}),
};

/**
 * Integration schemas
 */
export const IntegrationSchemas = {
	amazonSP: z.object({
		clientId: z.string().min(1, "Client ID is required"),
		clientSecret: z.string().min(1, "Client secret is required"),
		refreshToken: z.string().min(1, "Refresh token is required"),
		marketplaceIds: z
			.array(z.string())
			.min(1, "At least one marketplace is required"),
		region: z.enum(["NA", "EU", "FE"]),
	}),

	amazonAdvertising: z.object({
		clientId: z.string().min(1, "Client ID is required"),
		clientSecret: z.string().min(1, "Client secret is required"),
		refreshToken: z.string().min(1, "Refresh token is required"),
		profileId: z.string().min(1, "Profile ID is required"),
		region: z.enum(["NA", "EU", "FE"]),
	}),
};

/**
 * Format validation errors
 */
function formatValidationErrors(error: ZodError): ValidationError[] {
	return error.errors.map((err) => ({
		field: err.path.join("."),
		code: err.code,
		message: err.message,
		received: err.code === "invalid_type" ? (err as any).received : undefined,
	}));
}

/**
 * Create validation middleware
 */
export function validate(config: ValidationConfig) {
	return (req: Request, _res: Response, next: NextFunction) => {
		try {
			const errors: ValidationError[] = [];

			// Validate body
			if (config.body) {
				try {
					req.body = config.body.parse(req.body);
				} catch (error) {
					if (error instanceof ZodError) {
						errors.push(...formatValidationErrors(error));
					}
				}
			}

			// Validate query parameters
			if (config.query) {
				try {
					req.query = config.query.parse(req.query);
				} catch (error) {
					if (error instanceof ZodError) {
						errors.push(...formatValidationErrors(error));
					}
				}
			}

			// Validate URL parameters
			if (config.params) {
				try {
					req.params = config.params.parse(req.params);
				} catch (error) {
					if (error instanceof ZodError) {
						errors.push(...formatValidationErrors(error));
					}
				}
			}

			// Validate headers
			if (config.headers) {
				try {
					config.headers.parse(req.headers);
				} catch (error) {
					if (error instanceof ZodError) {
						errors.push(...formatValidationErrors(error));
					}
				}
			}

			// If there are validation errors, throw an API error
			if (errors.length > 0) {
				const errorMessage =
					typeof config.customErrorMessage === "function"
						? config.customErrorMessage(
								new ZodError(
									errors.map((e) => ({
										code: e.code as any,
										path: e.field.split("."),
										message: e.message,
									})),
								),
							)
						: config.customErrorMessage || "Validation failed";

				throw new ApiError("VALIDATION_ERROR", errorMessage, 400, { errors });
			}

			next();
		} catch (error) {
			next(error);
		}
	};
}

/**
 * Validation presets for common endpoints
 */
export const ValidationPresets = {
	// Authentication endpoints
	auth: {
		signUp: validate({ body: AuthSchemas.signUp }),
		signIn: validate({ body: AuthSchemas.signIn }),
		resetPassword: validate({ body: AuthSchemas.resetPassword }),
		changePassword: validate({ body: AuthSchemas.changePassword }),
		refreshToken: validate({ body: AuthSchemas.refreshToken }),
	},

	// Common parameter validation
	params: {
		id: validate({ params: z.object({ id: CommonSchemas.id }) }),
		userId: validate({ params: z.object({ userId: CommonSchemas.id }) }),
		organizationId: validate({
			params: z.object({ organizationId: CommonSchemas.id }),
		}),
	},

	// Query validation
	query: {
		pagination: validate({ query: CommonSchemas.pagination }),
		search: validate({ query: CommonSchemas.search }),
		dateRange: validate({ query: CommonSchemas.dateRange }),
	},

	// Amazon API endpoints
	amazon: {
		productSearch: validate({ query: AmazonSchemas.productSearch }),
		campaignCreate: validate({ body: AmazonSchemas.campaignCreate }),
		keywordCreate: validate({ body: AmazonSchemas.keywordCreate }),
		reportRequest: validate({ body: AmazonSchemas.reportRequest }),
	},

	// Organization management
	organization: {
		create: validate({ body: OrganizationSchemas.create }),
		update: validate({ body: OrganizationSchemas.update }),
		inviteUser: validate({ body: OrganizationSchemas.inviteUser }),
	},

	// Integration management
	integration: {
		amazonSP: validate({ body: IntegrationSchemas.amazonSP }),
		amazonAdvertising: validate({ body: IntegrationSchemas.amazonAdvertising }),
	},
};

/**
 * Sanitization utilities
 */
export const Sanitizers = {
	stripHtml: (str: string): string => {
		return str.replace(/<[^>]*>/g, "");
	},

	normalizeEmail: (email: string): string => {
		return email.toLowerCase().trim();
	},

	normalizeString: (str: string): string => {
		return str.trim().replace(/\s+/g, " ");
	},

	sanitizeFilename: (filename: string): string => {
		return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
	},
};

/**
 * Custom validation helpers
 */
export const ValidationHelpers = {
	createArraySchema: <T>(itemSchema: ZodSchema<T>, min = 1, max = 100) => {
		return z.array(itemSchema).min(min).max(max);
	},

	createOptionalStringSchema: (maxLength = 255) => {
		return z.string().max(maxLength).optional();
	},

	createEnumFromArray: <T extends readonly [string, ...string[]]>(
		values: T,
	) => {
		return z.enum(values);
	},

	createDateSchema: (message = "Invalid date format") => {
		return z.string().datetime(message);
	},
};

export default validate;
