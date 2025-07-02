/**
 * Amazon Core Package
 * Comprehensive Amazon API integration following AI SDK patterns
 */

// Error classes and utilities
export {
	AdvertisingAPIError,
	AdvertisingAPIInvalidProfileError,
	AdvertisingAPIPermissionError,
	// API errors
	AmazonAPIError,
	AmazonAuthError,
	AmazonConfigError,
	// Base errors
	AmazonError,
	AmazonErrorFactory,
	// Network errors
	AmazonNetworkError,
	AmazonServiceError,
	// Validation errors
	AmazonValidationError,
	APIErrorFactory,
	AssociatesAPIError,
	AssociatesAPIInvalidPartnerError,
	AssociatesAPIRevenueError,
	AssociatesAPITPSError,
	CampaignNotFoundError,
	ConnectionRefusedError,
	ConnectionTimeoutError,
	DNSError,
	ErrorUtils,
	GenericAPIError,
	HTTPError,
	InvalidASINError,
	InvalidCurrencyCodeError,
	InvalidDateRangeError,
	InvalidEnumValueError,
	InvalidFormatError,
	InvalidMarketplaceError,
	InvalidMarketplaceIdError,
	isAmazonAPIError,
	isAmazonAuthError,
	isAmazonConfigError,
	isAmazonError,
	MultipleValidationError,
	NetworkErrorFactory,
	NetworkUtils,
	OrderNotFoundError,
	ProductNotFoundError,
	RateLimitError,
	RequestTooLargeError,
	RequiredFieldError,
	ServiceUnavailableError,
	SPAPIError,
	SPAPIQuotaExceededError,
	SPAPIRateLimitError,
	SSLError,
	ValidationErrorUtils,
	ValueRangeError,
} from "./errors";
// Provider interfaces (re-exported from types)
export type {
	APIResponse,
	AttributionProvider,
	BaseAmazonProvider,
	IAdvertisingProvider,
	IAssociatesProvider,
	IBrandAnalyticsProvider,
	IDSPProvider,
	ISPAPIProvider,
	RequestOptions,
	SearchPerformanceProvider,
} from "./providers";
// Provider implementations
export {
	// Provider implementations
	AdvertisingProvider,
	AssociatesProvider,
	AttributionProviderImpl,
	BrandAnalyticsProvider,
	createSearchPerformanceProvider,
	DSPProvider,
	SPAPIProvider,
} from "./providers";

// Services
export * from "./services";

// Types
export * from "./types";
// Utility types
export type {
	Cache,
	FieldValidator,
	Logger,
	RetryStrategy,
	ValidationResult,
} from "./utils";
// Utilities
export {
	AdvertisingAuthProvider,
	AssociatesAuthProvider,
	// Logger
	createProviderLogger,
	ExponentialBackoffStrategy,
	LinearBackoffStrategy,
	// Cache
	MemoryCache,
	// Rate limiter
	RateLimiter,
	// Validation
	RequestValidator,
	// Retry
	RetryExecutor,
	// Auth
	SPAPIAuthProvider,
	ValidationUtils,
} from "./utils";
