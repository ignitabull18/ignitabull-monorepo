/**
 * Validation utilities for Amazon API integrations
 * Following AI SDK validation patterns
 */

import { AmazonValidationError } from "../errors/base";

/**
 * Validation result interface
 */
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

/**
 * Validation error details
 */
export interface ValidationError {
	field: string;
	message: string;
	code: string;
	value?: any;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
	field: string;
	message: string;
	code: string;
	value?: any;
}

/**
 * Validator function type
 */
export type ValidatorFunction<T> = (
	value: T,
	context?: any,
) => ValidationResult;

/**
 * Field validator interface
 */
export interface FieldValidator {
	required?: boolean;
	type?: "string" | "number" | "boolean" | "array" | "object" | "date";
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
	pattern?: RegExp;
	enum?: any[];
	custom?: ValidatorFunction<any>;
}

/**
 * Schema validator
 */
export class SchemaValidator {
	private readonly schema: Record<string, FieldValidator>;

	constructor(schema: Record<string, FieldValidator>) {
		this.schema = schema;
	}

	/**
	 * Validate an object against the schema
	 */
	validate(data: Record<string, any>): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Check required fields
		for (const [field, validator] of Object.entries(this.schema)) {
			const value = data[field];

			// Required field validation
			if (
				validator.required &&
				(value === undefined || value === null || value === "")
			) {
				errors.push({
					field,
					message: `${field} is required`,
					code: "REQUIRED_FIELD_MISSING",
					value,
				});
				continue;
			}

			// Skip validation if field is not present and not required
			if (value === undefined || value === null) {
				continue;
			}

			// Type validation
			if (validator.type) {
				const typeError = this.validateType(field, value, validator.type);
				if (typeError) {
					errors.push(typeError);
					continue;
				}
			}

			// Length validation for strings and arrays
			if (typeof value === "string" || Array.isArray(value)) {
				const lengthErrors = this.validateLength(field, value, validator);
				errors.push(...lengthErrors);
			}

			// Numeric range validation
			if (typeof value === "number") {
				const rangeErrors = this.validateRange(field, value, validator);
				errors.push(...rangeErrors);
			}

			// Pattern validation for strings
			if (typeof value === "string" && validator.pattern) {
				const patternError = this.validatePattern(
					field,
					value,
					validator.pattern,
				);
				if (patternError) {
					errors.push(patternError);
				}
			}

			// Enum validation
			if (validator.enum) {
				const enumError = this.validateEnum(field, value, validator.enum);
				if (enumError) {
					errors.push(enumError);
				}
			}

			// Custom validation
			if (validator.custom) {
				const customResult = validator.custom(value, data);
				errors.push(...customResult.errors);
				warnings.push(...customResult.warnings);
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	private validateType(
		field: string,
		value: any,
		expectedType: string,
	): ValidationError | null {
		const actualType = Array.isArray(value) ? "array" : typeof value;

		if (expectedType === "date") {
			if (!(value instanceof Date) && !this.isValidDateString(value)) {
				return {
					field,
					message: `${field} must be a valid date`,
					code: "INVALID_TYPE",
					value,
				};
			}
		} else if (actualType !== expectedType) {
			return {
				field,
				message: `${field} must be of type ${expectedType}`,
				code: "INVALID_TYPE",
				value,
			};
		}

		return null;
	}

	private validateLength(
		field: string,
		value: string | any[],
		validator: FieldValidator,
	): ValidationError[] {
		const errors: ValidationError[] = [];
		const length = value.length;

		if (validator.minLength !== undefined && length < validator.minLength) {
			errors.push({
				field,
				message: `${field} must be at least ${validator.minLength} characters long`,
				code: "MIN_LENGTH_VIOLATION",
				value,
			});
		}

		if (validator.maxLength !== undefined && length > validator.maxLength) {
			errors.push({
				field,
				message: `${field} must be at most ${validator.maxLength} characters long`,
				code: "MAX_LENGTH_VIOLATION",
				value,
			});
		}

		return errors;
	}

	private validateRange(
		field: string,
		value: number,
		validator: FieldValidator,
	): ValidationError[] {
		const errors: ValidationError[] = [];

		if (validator.min !== undefined && value < validator.min) {
			errors.push({
				field,
				message: `${field} must be at least ${validator.min}`,
				code: "MIN_VALUE_VIOLATION",
				value,
			});
		}

		if (validator.max !== undefined && value > validator.max) {
			errors.push({
				field,
				message: `${field} must be at most ${validator.max}`,
				code: "MAX_VALUE_VIOLATION",
				value,
			});
		}

		return errors;
	}

	private validatePattern(
		field: string,
		value: string,
		pattern: RegExp,
	): ValidationError | null {
		if (!pattern.test(value)) {
			return {
				field,
				message: `${field} does not match the required pattern`,
				code: "PATTERN_MISMATCH",
				value,
			};
		}
		return null;
	}

	private validateEnum(
		field: string,
		value: any,
		enumValues: any[],
	): ValidationError | null {
		if (!enumValues.includes(value)) {
			return {
				field,
				message: `${field} must be one of: ${enumValues.join(", ")}`,
				code: "ENUM_VIOLATION",
				value,
			};
		}
		return null;
	}

	private isValidDateString(value: any): boolean {
		if (typeof value !== "string") return false;
		const date = new Date(value);
		return !Number.isNaN(date.getTime());
	}
}

/**
 * Common validation patterns
 */
export class ValidationPatterns {
	static readonly EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	static readonly URL = /^https?:\/\/.+/;
	static readonly UUID =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	static readonly ASIN = /^[A-Z0-9]{10}$/;
	static readonly SKU = /^[A-Za-z0-9_-]{1,40}$/;
	static readonly COUNTRY_CODE = /^[A-Z]{2}$/;
	static readonly CURRENCY_CODE = /^[A-Z]{3}$/;
	static readonly MARKETPLACE_ID = /^[A-Z0-9]{13,14}$/;
	static readonly SELLER_ID = /^[A-Z0-9]{13,14}$/;
}

/**
 * Amazon-specific validators
 */
export class AmazonValidators {
	/**
	 * Validate ASIN (Amazon Standard Identification Number)
	 */
	static validateASIN(asin: string): ValidationResult {
		const errors: ValidationError[] = [];

		if (!asin) {
			errors.push({
				field: "asin",
				message: "ASIN is required",
				code: "REQUIRED_FIELD_MISSING",
				value: asin,
			});
		} else if (!ValidationPatterns.ASIN.test(asin)) {
			errors.push({
				field: "asin",
				message: "ASIN must be a 10-character alphanumeric string",
				code: "INVALID_ASIN_FORMAT",
				value: asin,
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings: [],
		};
	}

	/**
	 * Validate SKU (Stock Keeping Unit)
	 */
	static validateSKU(sku: string): ValidationResult {
		const errors: ValidationError[] = [];

		if (!sku) {
			errors.push({
				field: "sku",
				message: "SKU is required",
				code: "REQUIRED_FIELD_MISSING",
				value: sku,
			});
		} else if (!ValidationPatterns.SKU.test(sku)) {
			errors.push({
				field: "sku",
				message:
					"SKU must be 1-40 characters, alphanumeric with hyphens and underscores",
				code: "INVALID_SKU_FORMAT",
				value: sku,
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings: [],
		};
	}

	/**
	 * Validate marketplace ID
	 */
	static validateMarketplaceId(marketplaceId: string): ValidationResult {
		const errors: ValidationError[] = [];

		if (!marketplaceId) {
			errors.push({
				field: "marketplaceId",
				message: "Marketplace ID is required",
				code: "REQUIRED_FIELD_MISSING",
				value: marketplaceId,
			});
		} else if (!ValidationPatterns.MARKETPLACE_ID.test(marketplaceId)) {
			errors.push({
				field: "marketplaceId",
				message: "Marketplace ID must be a 13-14 character alphanumeric string",
				code: "INVALID_MARKETPLACE_ID_FORMAT",
				value: marketplaceId,
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings: [],
		};
	}

	/**
	 * Validate seller ID
	 */
	static validateSellerId(sellerId: string): ValidationResult {
		const errors: ValidationError[] = [];

		if (!sellerId) {
			errors.push({
				field: "sellerId",
				message: "Seller ID is required",
				code: "REQUIRED_FIELD_MISSING",
				value: sellerId,
			});
		} else if (!ValidationPatterns.SELLER_ID.test(sellerId)) {
			errors.push({
				field: "sellerId",
				message: "Seller ID must be a 13-14 character alphanumeric string",
				code: "INVALID_SELLER_ID_FORMAT",
				value: sellerId,
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings: [],
		};
	}

	/**
	 * Validate date range
	 */
	static validateDateRange(startDate: Date, endDate: Date): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		if (startDate >= endDate) {
			errors.push({
				field: "dateRange",
				message: "Start date must be before end date",
				code: "INVALID_DATE_RANGE",
				value: { startDate, endDate },
			});
		}

		const now = new Date();
		if (startDate > now) {
			warnings.push({
				field: "startDate",
				message: "Start date is in the future",
				code: "FUTURE_START_DATE",
				value: startDate,
			});
		}

		// Check if date range is too large (Amazon APIs often have limits)
		const daysDiff = Math.ceil(
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		if (daysDiff > 90) {
			warnings.push({
				field: "dateRange",
				message: "Date range exceeds 90 days, may hit API limits",
				code: "LARGE_DATE_RANGE",
				value: { startDate, endDate, days: daysDiff },
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Validate pagination parameters
	 */
	static validatePagination(page?: number, limit?: number): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		if (page !== undefined) {
			if (page < 1) {
				errors.push({
					field: "page",
					message: "Page must be a positive integer",
					code: "INVALID_PAGE_NUMBER",
					value: page,
				});
			}

			if (page > 1000) {
				warnings.push({
					field: "page",
					message: "Large page numbers may hit API limits",
					code: "LARGE_PAGE_NUMBER",
					value: page,
				});
			}
		}

		if (limit !== undefined) {
			if (limit < 1) {
				errors.push({
					field: "limit",
					message: "Limit must be a positive integer",
					code: "INVALID_LIMIT",
					value: limit,
				});
			}

			if (limit > 100) {
				warnings.push({
					field: "limit",
					message: "Large limit values may hit API limits",
					code: "LARGE_LIMIT",
					value: limit,
				});
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}
}

/**
 * Request validator for Amazon API calls
 */
export class RequestValidator {
	/**
	 * Validate SP-API request parameters
	 */
	static validateSPAPIRequest(
		endpoint: string,
		params: Record<string, any>,
	): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Common validations based on endpoint
		if (endpoint.includes("orders") && params.MarketplaceIds) {
			for (const marketplaceId of params.MarketplaceIds) {
				const result = AmazonValidators.validateMarketplaceId(marketplaceId);
				errors.push(...result.errors);
				warnings.push(...result.warnings);
			}
		}

		if (endpoint.includes("catalog") && params.asin) {
			const result = AmazonValidators.validateASIN(params.asin);
			errors.push(...result.errors);
			warnings.push(...result.warnings);
		}

		if (params.CreatedAfter && params.CreatedBefore) {
			const startDate = new Date(params.CreatedAfter);
			const endDate = new Date(params.CreatedBefore);
			const result = AmazonValidators.validateDateRange(startDate, endDate);
			errors.push(...result.errors);
			warnings.push(...result.warnings);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Validate Advertising API request parameters
	 */
	static validateAdvertisingRequest(
		_endpoint: string,
		params: Record<string, any>,
	): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Validate common advertising parameters
		if (params.startDate && params.endDate) {
			const startDate = new Date(params.startDate);
			const endDate = new Date(params.endDate);
			const result = AmazonValidators.validateDateRange(startDate, endDate);
			errors.push(...result.errors);
			warnings.push(...result.warnings);
		}

		if (params.pageSize !== undefined) {
			const result = AmazonValidators.validatePagination(
				undefined,
				params.pageSize,
			);
			errors.push(...result.errors);
			warnings.push(...result.warnings);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Validate Associates API request parameters
	 */
	static validateAssociatesRequest(
		operation: string,
		params: Record<string, any>,
	): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		if (operation === "GetItems" && params.ItemIds) {
			for (const itemId of params.ItemIds) {
				const result = AmazonValidators.validateASIN(itemId);
				errors.push(...result.errors);
				warnings.push(...result.warnings);
			}
		}

		if (params.ItemCount && params.ItemCount > 10) {
			warnings.push({
				field: "ItemCount",
				message: "Associates API has a limit of 10 items per request",
				code: "ITEM_COUNT_LIMIT",
				value: params.ItemCount,
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}
}

/**
 * Validation utilities
 */
export class ValidationUtils {
	/**
	 * Throw validation error if result is invalid
	 */
	static throwIfInvalid(result: ValidationResult, context?: string): void {
		if (!result.isValid) {
			const message = context
				? `Validation failed for ${context}: ${result.errors.map((e) => e.message).join(", ")}`
				: `Validation failed: ${result.errors.map((e) => e.message).join(", ")}`;

			throw new AmazonValidationError(message, {
				validationErrors: result.errors,
				validationWarnings: result.warnings,
			});
		}
	}

	/**
	 * Log validation warnings
	 */
	static logWarnings(result: ValidationResult, logger?: any): void {
		if (result.warnings.length > 0) {
			const message = `Validation warnings: ${result.warnings.map((w) => w.message).join(", ")}`;
			if (logger) {
				logger.warn(message, { validationWarnings: result.warnings });
			} else {
				console.warn(message);
			}
		}
	}

	/**
	 * Combine multiple validation results
	 */
	static combine(...results: ValidationResult[]): ValidationResult {
		const allErrors: ValidationError[] = [];
		const allWarnings: ValidationWarning[] = [];

		for (const result of results) {
			allErrors.push(...result.errors);
			allWarnings.push(...result.warnings);
		}

		return {
			isValid: allErrors.length === 0,
			errors: allErrors,
			warnings: allWarnings,
		};
	}

	/**
	 * Create a validation schema for common Amazon API parameters
	 */
	static createAmazonSchema(): Record<string, FieldValidator> {
		return {
			asin: {
				type: "string",
				pattern: ValidationPatterns.ASIN,
				custom: (value) => AmazonValidators.validateASIN(value),
			},
			sku: {
				type: "string",
				pattern: ValidationPatterns.SKU,
				custom: (value) => AmazonValidators.validateSKU(value),
			},
			marketplaceId: {
				type: "string",
				pattern: ValidationPatterns.MARKETPLACE_ID,
				custom: (value) => AmazonValidators.validateMarketplaceId(value),
			},
			sellerId: {
				type: "string",
				pattern: ValidationPatterns.SELLER_ID,
				custom: (value) => AmazonValidators.validateSellerId(value),
			},
			page: {
				type: "number",
				min: 1,
			},
			limit: {
				type: "number",
				min: 1,
				max: 100,
			},
		};
	}
}
