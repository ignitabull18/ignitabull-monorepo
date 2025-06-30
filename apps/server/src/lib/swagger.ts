/**
 * OpenAPI/Swagger Configuration
 * Comprehensive API documentation setup
 */

import type { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// OpenAPI specification
const options: swaggerJsdoc.Options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Ignitabull API",
			version: "1.0.0",
			description:
				"Comprehensive Amazon seller analytics and automation platform API",
			contact: {
				name: "Ignitabull Support",
				email: "support@ignitabull.com",
				url: "https://ignitabull.com/support",
			},
			license: {
				name: "MIT",
				url: "https://opensource.org/licenses/MIT",
			},
			termsOfService: "https://ignitabull.com/terms",
		},
		servers: [
			{
				url: "https://api.ignitabull.com",
				description: "Production server",
			},
			{
				url: "https://staging-api.ignitabull.com",
				description: "Staging server",
			},
			{
				url: "http://localhost:3001",
				description: "Development server",
			},
		],
		components: {
			securitySchemes: {
				BearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: "JWT token obtained from authentication endpoints",
				},
				ApiKeyAuth: {
					type: "apiKey",
					in: "header",
					name: "X-API-Key",
					description: "API key for service-to-service authentication",
				},
			},
			schemas: {
				// Error responses
				Error: {
					type: "object",
					required: ["code", "message"],
					properties: {
						code: {
							type: "string",
							description: "Error code",
						},
						message: {
							type: "string",
							description: "Human-readable error message",
						},
						details: {
							type: "object",
							description: "Additional error details",
						},
						correlationId: {
							type: "string",
							description: "Request correlation ID for debugging",
						},
					},
				},

				// Pagination
				PaginationMeta: {
					type: "object",
					properties: {
						page: {
							type: "integer",
							minimum: 1,
							description: "Current page number",
						},
						limit: {
							type: "integer",
							minimum: 1,
							maximum: 100,
							description: "Number of items per page",
						},
						total: {
							type: "integer",
							description: "Total number of items",
						},
						totalPages: {
							type: "integer",
							description: "Total number of pages",
						},
					},
				},

				// User schemas
				User: {
					type: "object",
					required: ["id", "email", "firstName", "lastName"],
					properties: {
						id: {
							type: "string",
							format: "uuid",
							description: "Unique user identifier",
						},
						email: {
							type: "string",
							format: "email",
							description: "User email address",
						},
						firstName: {
							type: "string",
							description: "User first name",
						},
						lastName: {
							type: "string",
							description: "User last name",
						},
						organizationId: {
							type: "string",
							format: "uuid",
							description: "Associated organization ID",
						},
						role: {
							type: "string",
							enum: ["ADMIN", "MEMBER", "VIEWER"],
							description: "User role within organization",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "User creation timestamp",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
						},
					},
				},

				UserCreateRequest: {
					type: "object",
					required: [
						"email",
						"password",
						"firstName",
						"lastName",
						"acceptTerms",
					],
					properties: {
						email: {
							type: "string",
							format: "email",
							description: "User email address",
						},
						password: {
							type: "string",
							minLength: 8,
							description: "User password (minimum 8 characters)",
						},
						firstName: {
							type: "string",
							minLength: 1,
							maxLength: 50,
							description: "User first name",
						},
						lastName: {
							type: "string",
							minLength: 1,
							maxLength: 50,
							description: "User last name",
						},
						organizationName: {
							type: "string",
							description: "Optional organization name",
						},
						acceptTerms: {
							type: "boolean",
							description: "Must be true to accept terms and conditions",
						},
					},
				},

				// Organization schemas
				Organization: {
					type: "object",
					required: ["id", "name"],
					properties: {
						id: {
							type: "string",
							format: "uuid",
							description: "Unique organization identifier",
						},
						name: {
							type: "string",
							description: "Organization name",
						},
						description: {
							type: "string",
							description: "Organization description",
						},
						website: {
							type: "string",
							format: "uri",
							description: "Organization website URL",
						},
						industry: {
							type: "string",
							description: "Industry category",
						},
						createdAt: {
							type: "string",
							format: "date-time",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
						},
					},
				},

				// Amazon API schemas
				AmazonProduct: {
					type: "object",
					required: ["asin", "title"],
					properties: {
						asin: {
							type: "string",
							description: "Amazon Standard Identification Number",
						},
						title: {
							type: "string",
							description: "Product title",
						},
						brand: {
							type: "string",
							description: "Product brand",
						},
						category: {
							type: "string",
							description: "Product category",
						},
						price: {
							type: "number",
							format: "float",
							description: "Product price",
						},
						currency: {
							type: "string",
							description: "Price currency code",
						},
						availability: {
							type: "string",
							enum: ["IN_STOCK", "OUT_OF_STOCK", "LIMITED"],
							description: "Product availability status",
						},
						imageUrl: {
							type: "string",
							format: "uri",
							description: "Product image URL",
						},
						rating: {
							type: "number",
							format: "float",
							minimum: 0,
							maximum: 5,
							description: "Average customer rating",
						},
						reviewCount: {
							type: "integer",
							description: "Number of customer reviews",
						},
					},
				},

				AmazonCampaign: {
					type: "object",
					required: ["id", "name", "campaignType", "state"],
					properties: {
						id: {
							type: "string",
							description: "Campaign identifier",
						},
						name: {
							type: "string",
							description: "Campaign name",
						},
						campaignType: {
							type: "string",
							enum: [
								"SPONSORED_PRODUCTS",
								"SPONSORED_BRANDS",
								"SPONSORED_DISPLAY",
							],
							description: "Type of advertising campaign",
						},
						targetingType: {
							type: "string",
							enum: ["MANUAL", "AUTO"],
							description: "Campaign targeting method",
						},
						state: {
							type: "string",
							enum: ["ENABLED", "PAUSED", "ARCHIVED"],
							description: "Campaign state",
						},
						dailyBudget: {
							type: "number",
							format: "float",
							description: "Daily budget amount",
						},
						startDate: {
							type: "string",
							format: "date",
							description: "Campaign start date",
						},
						endDate: {
							type: "string",
							format: "date",
							description: "Campaign end date",
						},
					},
				},

				// Analytics schemas
				AnalyticsMetric: {
					type: "object",
					required: ["name", "value"],
					properties: {
						name: {
							type: "string",
							description: "Metric name",
						},
						value: {
							type: "number",
							description: "Metric value",
						},
						unit: {
							type: "string",
							description: "Unit of measurement",
						},
						change: {
							type: "number",
							description: "Change from previous period",
						},
						changePercent: {
							type: "number",
							description: "Percentage change from previous period",
						},
						trend: {
							type: "string",
							enum: ["up", "down", "stable"],
							description: "Trend direction",
						},
					},
				},

				// Health check schema
				HealthCheck: {
					type: "object",
					required: ["status", "timestamp"],
					properties: {
						status: {
							type: "string",
							enum: ["healthy", "degraded", "unhealthy"],
							description: "Overall system health status",
						},
						timestamp: {
							type: "string",
							format: "date-time",
							description: "Health check timestamp",
						},
						uptime: {
							type: "number",
							description: "System uptime in milliseconds",
						},
						version: {
							type: "string",
							description: "Application version",
						},
						environment: {
							type: "string",
							description: "Environment name",
						},
						services: {
							type: "array",
							items: {
								type: "object",
								properties: {
									name: {
										type: "string",
										description: "Service name",
									},
									status: {
										type: "string",
										enum: ["healthy", "degraded", "unhealthy"],
									},
									responseTime: {
										type: "number",
										description: "Response time in milliseconds",
									},
									lastCheck: {
										type: "string",
										format: "date-time",
									},
								},
							},
						},
					},
				},
			},

			responses: {
				UnauthorizedError: {
					description: "Authentication required",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/Error",
							},
							example: {
								code: "UNAUTHORIZED",
								message: "Authentication required",
								correlationId: "req_123456789",
							},
						},
					},
				},

				ForbiddenError: {
					description: "Insufficient permissions",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/Error",
							},
							example: {
								code: "FORBIDDEN",
								message: "Insufficient permissions",
								correlationId: "req_123456789",
							},
						},
					},
				},

				NotFoundError: {
					description: "Resource not found",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/Error",
							},
							example: {
								code: "NOT_FOUND",
								message: "Resource not found",
								correlationId: "req_123456789",
							},
						},
					},
				},

				ValidationError: {
					description: "Validation failed",
					content: {
						"application/json": {
							schema: {
								allOf: [
									{ $ref: "#/components/schemas/Error" },
									{
										type: "object",
										properties: {
											details: {
												type: "object",
												properties: {
													errors: {
														type: "array",
														items: {
															type: "object",
															properties: {
																field: { type: "string" },
																code: { type: "string" },
																message: { type: "string" },
															},
														},
													},
												},
											},
										},
									},
								],
							},
							example: {
								code: "VALIDATION_ERROR",
								message: "Validation failed",
								details: {
									errors: [
										{
											field: "email",
											code: "invalid_format",
											message: "Invalid email format",
										},
									],
								},
								correlationId: "req_123456789",
							},
						},
					},
				},

				RateLimitError: {
					description: "Rate limit exceeded",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/Error",
							},
							example: {
								code: "RATE_LIMIT_EXCEEDED",
								message: "Too many requests, please try again later",
								correlationId: "req_123456789",
							},
						},
					},
					headers: {
						"X-RateLimit-Limit": {
							description: "Request limit per time window",
							schema: { type: "integer" },
						},
						"X-RateLimit-Remaining": {
							description: "Remaining requests in current window",
							schema: { type: "integer" },
						},
						"X-RateLimit-Reset": {
							description: "Time when rate limit resets",
							schema: { type: "integer" },
						},
						"Retry-After": {
							description: "Seconds to wait before retrying",
							schema: { type: "integer" },
						},
					},
				},
			},

			parameters: {
				CorrelationId: {
					name: "X-Correlation-ID",
					in: "header",
					description: "Unique request identifier for tracing",
					schema: {
						type: "string",
						format: "uuid",
					},
				},

				Page: {
					name: "page",
					in: "query",
					description: "Page number for pagination",
					schema: {
						type: "integer",
						minimum: 1,
						default: 1,
					},
				},

				Limit: {
					name: "limit",
					in: "query",
					description: "Number of items per page",
					schema: {
						type: "integer",
						minimum: 1,
						maximum: 100,
						default: 10,
					},
				},

				SortBy: {
					name: "sortBy",
					in: "query",
					description: "Field to sort by",
					schema: {
						type: "string",
					},
				},

				SortOrder: {
					name: "sortOrder",
					in: "query",
					description: "Sort order",
					schema: {
						type: "string",
						enum: ["asc", "desc"],
						default: "desc",
					},
				},
			},
		},

		security: [{ BearerAuth: [] }],

		tags: [
			{
				name: "Authentication",
				description: "User authentication and authorization",
			},
			{
				name: "Users",
				description: "User management operations",
			},
			{
				name: "Organizations",
				description: "Organization management",
			},
			{
				name: "Amazon API",
				description: "Amazon marketplace integration",
			},
			{
				name: "Analytics",
				description: "Analytics and reporting",
			},
			{
				name: "Campaigns",
				description: "Advertising campaign management",
			},
			{
				name: "Health",
				description: "System health and monitoring",
			},
		],
	},
	apis: [
		"./src/routes/*.ts",
		"./src/routes/**/*.ts",
		"./src/controllers/*.ts",
		"./src/controllers/**/*.ts",
	],
};

// Generate OpenAPI specification
const specs = swaggerJsdoc(options);

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info .title { color: #2563eb }
  .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
  .swagger-ui .info .description { font-size: 14px; line-height: 1.6; }
  .swagger-ui .info hgroup.main { margin-bottom: 20px; }
`;

// Swagger UI options
const swaggerUiOptions = {
	customCss,
	customSiteTitle: "Ignitabull API Documentation",
	customfavIcon: "/favicon.ico",
	swaggerOptions: {
		persistAuthorization: true,
		displayRequestDuration: true,
		docExpansion: "list",
		filter: true,
		showRequestHeaders: true,
		tryItOutEnabled: true,
		requestInterceptor: (req: any) => {
			// Add correlation ID to all requests
			if (!req.headers["X-Correlation-ID"]) {
				req.headers["X-Correlation-ID"] =
					`docs_${Math.random().toString(36).substr(2, 9)}`;
			}
			return req;
		},
	},
};

/**
 * Setup Swagger documentation
 */
export function setupSwagger(app: Express): void {
	// Serve OpenAPI spec as JSON
	app.get("/api/docs/openapi.json", (_req, res) => {
		res.setHeader("Content-Type", "application/json");
		res.send(specs);
	});

	// Serve Swagger UI
	app.use(
		"/api/docs",
		swaggerUi.serve,
		swaggerUi.setup(specs, swaggerUiOptions),
	);

	// Redirect /docs to /api/docs
	app.get("/docs", (_req, res) => {
		res.redirect("/api/docs");
	});
}

export { specs as openApiSpec };
export default setupSwagger;
