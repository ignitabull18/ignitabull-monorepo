/**
 * Validation error classes for Amazon API integrations
 */

import { AmazonError } from "./base";

/**
 * Base validation error
 */
export class AmazonValidationError extends AmazonError {
	readonly field?: string;
	readonly value?: unknown;
	readonly constraint?: string;

	constructor(
		message: string,
		options: {
			field?: string;
			value?: unknown;
			constraint?: string;
			cause?: unknown;
		} = {},
	) {
		super(message, {
			code: "AMAZON_VALIDATION_ERROR",
			cause: options.cause,
			retryable: false,
		});

		this.field = options.field;
		this.value = options.value;
		this.constraint = options.constraint;
	}

	toJSON() {
		return {
			...super.toJSON(),
			field: this.field,
			value: this.value,
			constraint: this.constraint,
		};
	}
}

/**
 * Required field validation error
 */
export class RequiredFieldError extends AmazonValidationError {
	constructor(field: string) {
		super(`Required field is missing: ${field}`, {
			field,
			constraint: "required",
		});
	}
}

/**
 * Invalid format validation error
 */
export class InvalidFormatError extends AmazonValidationError {
	constructor(field: string, value: unknown, expectedFormat: string) {
		super(`Invalid format for field ${field}: expected ${expectedFormat}`, {
			field,
			value,
			constraint: `format:${expectedFormat}`,
		});
	}
}

/**
 * Value out of range validation error
 */
export class ValueRangeError extends AmazonValidationError {
	readonly min?: number;
	readonly max?: number;

	constructor(
		field: string,
		value: unknown,
		options: { min?: number; max?: number } = {},
	) {
		const rangeText =
			options.min !== undefined && options.max !== undefined
				? `between ${options.min} and ${options.max}`
				: options.min !== undefined
					? `at least ${options.min}`
					: options.max !== undefined
						? `at most ${options.max}`
						: "within valid range";

		super(`Value for field ${field} must be ${rangeText}`, {
			field,
			value,
			constraint: "range",
		});

		this.min = options.min;
		this.max = options.max;
	}
}

/**
 * Invalid enum value validation error
 */
export class InvalidEnumValueError extends AmazonValidationError {
	readonly allowedValues: string[];

	constructor(field: string, value: unknown, allowedValues: string[]) {
		super(
			`Invalid value for field ${field}: must be one of [${allowedValues.join(", ")}]`,
			{
				field,
				value,
				constraint: "enum",
			},
		);
		this.allowedValues = allowedValues;
	}
}

/**
 * Invalid ASIN format error
 */
export class InvalidASINError extends AmazonValidationError {
	constructor(asin: string) {
		super(`Invalid ASIN format: ${asin}`, {
			field: "asin",
			value: asin,
			constraint: "asin_format",
		});
	}
}

/**
 * Invalid marketplace ID error
 */
export class InvalidMarketplaceIdError extends AmazonValidationError {
	constructor(marketplaceId: string) {
		super(`Invalid marketplace ID: ${marketplaceId}`, {
			field: "marketplaceId",
			value: marketplaceId,
			constraint: "marketplace_format",
		});
	}
}

/**
 * Invalid currency code error
 */
export class InvalidCurrencyCodeError extends AmazonValidationError {
	constructor(currencyCode: string) {
		super(`Invalid currency code: ${currencyCode}`, {
			field: "currencyCode",
			value: currencyCode,
			constraint: "currency_format",
		});
	}
}

/**
 * Invalid date range error
 */
export class InvalidDateRangeError extends AmazonValidationError {
	constructor(startDate: Date, endDate: Date) {
		super(
			`Invalid date range: start date (${startDate.toISOString()}) must be before end date (${endDate.toISOString()})`,
			{
				field: "dateRange",
				value: { startDate, endDate },
				constraint: "date_range",
			},
		);
	}
}

/**
 * Multiple validation errors
 */
export class MultipleValidationError extends AmazonError {
	readonly errors: AmazonValidationError[];

	constructor(errors: AmazonValidationError[]) {
		const message = `Multiple validation errors: ${errors.map((e) => e.message).join("; ")}`;
		super(message, {
			code: "MULTIPLE_VALIDATION_ERRORS",
			retryable: false,
		});
		this.errors = errors;
	}

	toJSON() {
		return {
			...super.toJSON(),
			errors: this.errors.map((e) => e.toJSON()),
		};
	}
}

/**
 * Validation utilities
 */
export class ValidationUtils {
	/**
	 * Validate ASIN format
	 */
	static validateASIN(asin: string): void {
		if (!asin || typeof asin !== "string") {
			throw new RequiredFieldError("asin");
		}

		// ASIN is 10 characters, alphanumeric
		const asinRegex = /^[A-Z0-9]{10}$/;
		if (!asinRegex.test(asin)) {
			throw new InvalidASINError(asin);
		}
	}

	/**
	 * Validate marketplace ID format
	 */
	static validateMarketplaceId(marketplaceId: string): void {
		if (!marketplaceId || typeof marketplaceId !== "string") {
			throw new RequiredFieldError("marketplaceId");
		}

		// Amazon marketplace IDs are 14 characters, alphanumeric
		const marketplaceRegex = /^[A-Z0-9]{14}$/;
		if (!marketplaceRegex.test(marketplaceId)) {
			throw new InvalidMarketplaceIdError(marketplaceId);
		}
	}

	/**
	 * Validate currency code (ISO 4217)
	 */
	static validateCurrencyCode(currencyCode: string): void {
		if (!currencyCode || typeof currencyCode !== "string") {
			throw new RequiredFieldError("currencyCode");
		}

		// ISO 4217 currency codes are 3 uppercase letters
		const currencyRegex = /^[A-Z]{3}$/;
		if (!currencyRegex.test(currencyCode)) {
			throw new InvalidCurrencyCodeError(currencyCode);
		}
	}

	/**
	 * Validate date range
	 */
	static validateDateRange(startDate: Date, endDate: Date): void {
		if (!startDate || !endDate) {
			throw new RequiredFieldError("dateRange");
		}

		if (startDate >= endDate) {
			throw new InvalidDateRangeError(startDate, endDate);
		}
	}

	/**
	 * Validate required field
	 */
	static validateRequired<T>(
		value: T | null | undefined,
		fieldName: string,
	): T {
		if (value === null || value === undefined || value === "") {
			throw new RequiredFieldError(fieldName);
		}
		return value;
	}

	/**
	 * Validate enum value
	 */
	static validateEnum<T extends string>(
		value: string,
		allowedValues: readonly T[],
		fieldName: string,
	): T {
		if (!allowedValues.includes(value as T)) {
			throw new InvalidEnumValueError(fieldName, value, [...allowedValues]);
		}
		return value as T;
	}

	/**
	 * Validate number range
	 */
	static validateRange(
		value: number,
		fieldName: string,
		options: { min?: number; max?: number } = {},
	): number {
		if (options.min !== undefined && value < options.min) {
			throw new ValueRangeError(fieldName, value, options);
		}
		if (options.max !== undefined && value > options.max) {
			throw new ValueRangeError(fieldName, value, options);
		}
		return value;
	}

	/**
	 * Validate string format with regex
	 */
	static validateFormat(
		value: string,
		regex: RegExp,
		fieldName: string,
		formatName: string,
	): string {
		if (!regex.test(value)) {
			throw new InvalidFormatError(fieldName, value, formatName);
		}
		return value;
	}

	/**
	 * Collect multiple validation errors and throw if any exist
	 */
	static collectErrors(validations: (() => void)[]): void {
		const errors: AmazonValidationError[] = [];

		for (const validation of validations) {
			try {
				validation();
			} catch (error) {
				if (error instanceof AmazonValidationError) {
					errors.push(error);
				} else {
					throw error; // Re-throw non-validation errors
				}
			}
		}

		if (errors.length === 1) {
			throw errors[0];
		}
		if (errors.length > 1) {
			throw new MultipleValidationError(errors);
		}
	}
}

/**
 * Decorator for validation
 */
export function validate<T extends any[], R>(
	validationFn: (...args: T) => void,
) {
	return (
		_target: any,
		_propertyKey: string,
		descriptor: PropertyDescriptor,
	) => {
		const originalMethod = descriptor.value;

		descriptor.value = function (...args: T): R {
			validationFn(...args);
			return originalMethod.apply(this, args);
		};

		return descriptor;
	};
}
