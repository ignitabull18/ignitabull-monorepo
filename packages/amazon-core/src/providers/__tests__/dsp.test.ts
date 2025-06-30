/**
 * Amazon DSP Provider tests
 */

import {
	beforeEach,
	describe,
	expect,
	it,
	type MockedFunction,
	vi,
} from "vitest";
import type {
	CreateDSPCampaignRequest,
	DSPCampaign,
	DSPConfig,
	DSPReportRequest,
} from "../../types/dsp";
import { DSPProvider } from "../dsp";

// Mock the auth provider
vi.mock("../../utils/auth", () => ({
	AdvertisingAuthProvider: vi.fn().mockImplementation(() => ({
		validateCredentials: vi.fn().mockResolvedValue(true),
		getAuthHeaders: vi.fn().mockResolvedValue({
			Authorization: "Bearer mock-token",
			"Amazon-Advertising-API-ClientId": "mock-client-id",
		}),
	})),
}));

// Mock fetch
global.fetch = vi.fn();

describe("DSPProvider", () => {
	let provider: DSPProvider;
	let mockConfig: DSPConfig;

	beforeEach(() => {
		vi.clearAllMocks();

		mockConfig = {
			clientId: "test-client-id",
			clientSecret: "test-client-secret",
			refreshToken: "test-refresh-token",
			advertiserId: "test-advertiser-id",
			region: "us-east-1",
			marketplace: "ATVPDKIKX0DER",
			sandbox: true,
		};

		provider = new DSPProvider(mockConfig);
	});

	describe("initialization", () => {
		it("should initialize successfully with valid config", async () => {
			await expect(provider.initialize()).resolves.not.toThrow();
		});

		it("should have correct provider metadata", () => {
			expect(provider.providerId).toBe("dsp");
			expect(provider.name).toBe("Amazon DSP API");
			expect(provider.version).toBe("3.0");
		});

		it("should handle initialization failure", async () => {
			const invalidProvider = new DSPProvider({
				...mockConfig,
				clientId: "",
			});

			await expect(invalidProvider.initialize()).rejects.toThrow();
		});
	});

	describe("health check", () => {
		it("should return healthy status when API is accessible", async () => {
			// Mock successful campaigns response
			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify({ campaigns: [], totalCount: 0 }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			await provider.initialize();
			const health = await provider.healthCheck();

			expect(health.status).toBe("healthy");
			expect(health.message).toBeUndefined();
		});

		it("should return unhealthy status when API is not accessible", async () => {
			(global.fetch as MockedFunction<typeof fetch>).mockRejectedValueOnce(
				new Error("Network error"),
			);

			await provider.initialize();
			const health = await provider.healthCheck();

			expect(health.status).toBe("unhealthy");
			expect(health.message).toBe("Network error");
		});
	});

	describe("campaign management", () => {
		beforeEach(async () => {
			await provider.initialize();
		});

		it("should get campaigns successfully", async () => {
			const mockCampaigns = {
				campaigns: [
					{
						campaignId: "camp-123",
						name: "Test Campaign",
						advertiserId: "test-advertiser-id",
						type: "DISPLAY",
						status: "ACTIVE",
						bidStrategy: "AUTO",
						optimizationGoal: "REACH",
						budget: {
							type: "DAILY",
							amount: 100,
							currency: "USD",
						},
						schedule: {
							startDate: "2024-01-01",
							timezone: "UTC",
						},
						createdDate: "2024-01-01T00:00:00Z",
						lastModifiedDate: "2024-01-01T00:00:00Z",
					},
				],
				totalCount: 1,
			};

			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify(mockCampaigns), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.getCampaigns();

			expect(result).toEqual(mockCampaigns);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/dsp/campaigns"),
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						Authorization: "Bearer mock-token",
					}),
				}),
			);
		});

		it("should get single campaign by ID", async () => {
			const mockCampaign: DSPCampaign = {
				campaignId: "camp-123",
				name: "Test Campaign",
				advertiserId: "test-advertiser-id",
				type: "DISPLAY",
				status: "ACTIVE",
				bidStrategy: "AUTO",
				optimizationGoal: "REACH",
				budget: {
					type: "DAILY",
					amount: 100,
					currency: "USD",
				},
				schedule: {
					startDate: "2024-01-01",
					timezone: "UTC",
				},
				targeting: {},
				createdDate: "2024-01-01T00:00:00Z",
				lastModifiedDate: "2024-01-01T00:00:00Z",
			};

			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify(mockCampaign), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.getCampaign("camp-123");

			expect(result).toEqual(mockCampaign);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/dsp/campaigns/camp-123"),
				expect.objectContaining({ method: "GET" }),
			);
		});

		it("should create campaign successfully", async () => {
			const createRequest: CreateDSPCampaignRequest = {
				name: "New Test Campaign",
				type: "DISPLAY",
				bidStrategy: "AUTO",
				optimizationGoal: "REACH",
				budget: {
					type: "DAILY",
					amount: 100,
					currency: "USD",
				},
				schedule: {
					startDate: "2024-01-01",
					timezone: "UTC",
				},
			};

			const mockCreatedCampaign: DSPCampaign = {
				campaignId: "camp-456",
				...createRequest,
				advertiserId: "test-advertiser-id",
				status: "ACTIVE",
				targeting: {},
				createdDate: "2024-01-01T00:00:00Z",
				lastModifiedDate: "2024-01-01T00:00:00Z",
			};

			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify(mockCreatedCampaign), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.createCampaign(createRequest);

			expect(result).toEqual(mockCreatedCampaign);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/dsp/campaigns"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(createRequest),
				}),
			);
		});

		it("should validate campaign creation request", async () => {
			const invalidRequest = {
				name: "", // Invalid: empty name
				type: "DISPLAY",
			} as CreateDSPCampaignRequest;

			await expect(provider.createCampaign(invalidRequest)).rejects.toThrow(
				"Name, type, budget, and schedule are required",
			);
		});

		it("should archive campaign", async () => {
			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.archiveCampaign("camp-123");

			expect(result.success).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/dsp/campaigns/camp-123"),
				expect.objectContaining({ method: "DELETE" }),
			);
		});
	});

	describe("line item management", () => {
		beforeEach(async () => {
			await provider.initialize();
		});

		it("should get line items successfully", async () => {
			const mockLineItems = {
				lineItems: [
					{
						lineItemId: "li-123",
						campaignId: "camp-123",
						name: "Test Line Item",
						status: "ACTIVE",
						type: "STANDARD",
						budget: { amount: 50, currency: "USD" },
						bidding: { strategy: "AUTO" },
						inventory: { supply: ["AMAZON_O_AND_O"] },
						createdDate: "2024-01-01T00:00:00Z",
						lastModifiedDate: "2024-01-01T00:00:00Z",
					},
				],
				totalCount: 1,
			};

			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify(mockLineItems), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.getLineItems();

			expect(result).toEqual(mockLineItems);
		});
	});

	describe("creative management", () => {
		beforeEach(async () => {
			await provider.initialize();
		});

		it("should get creatives successfully", async () => {
			const mockCreatives = {
				creatives: [
					{
						creativeId: "cr-123",
						name: "Test Creative",
						advertiserId: "test-advertiser-id",
						type: "DISPLAY_BANNER",
						format: "BANNER",
						status: "ACTIVE",
						dimensions: { width: 728, height: 90 },
						assets: [
							{
								type: "IMAGE",
								url: "https://example.com/banner.jpg",
								mimeType: "image/jpeg",
							},
						],
						createdDate: "2024-01-01T00:00:00Z",
						lastModifiedDate: "2024-01-01T00:00:00Z",
					},
				],
				totalCount: 1,
			};

			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify(mockCreatives), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.getCreatives();

			expect(result).toEqual(mockCreatives);
		});
	});

	describe("audience management", () => {
		beforeEach(async () => {
			await provider.initialize();
		});

		it("should get audiences successfully", async () => {
			const mockAudiences = {
				audiences: [
					{
						audienceId: "aud-123",
						name: "Test Audience",
						advertiserId: "test-advertiser-id",
						type: "CUSTOM",
						status: "ACTIVE",
						size: 10000,
						definition: { rules: [] },
						createdDate: "2024-01-01T00:00:00Z",
						lastModifiedDate: "2024-01-01T00:00:00Z",
					},
				],
				totalCount: 1,
			};

			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify(mockAudiences), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.getAudiences();

			expect(result).toEqual(mockAudiences);
		});
	});

	describe("reporting", () => {
		beforeEach(async () => {
			await provider.initialize();
		});

		it("should request report successfully", async () => {
			const reportRequest: DSPReportRequest = {
				reportType: "CAMPAIGN_PERFORMANCE",
				startDate: "2024-01-01",
				endDate: "2024-01-31",
				dimensions: ["CAMPAIGN"],
				metrics: ["IMPRESSIONS", "CLICKS", "SPEND"],
			};

			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify({ reportId: "report-123" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.requestReport(reportRequest);

			expect(result.reportId).toBe("report-123");
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/dsp/reports"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(reportRequest),
				}),
			);
		});

		it("should validate report request", async () => {
			const invalidRequest = {
				reportType: "CAMPAIGN_PERFORMANCE",
				startDate: "2024-01-01",
				// Missing required fields
			} as DSPReportRequest;

			await expect(provider.requestReport(invalidRequest)).rejects.toThrow(
				"Report type, date range, dimensions, and metrics are required",
			);
		});

		it("should get report status", async () => {
			const mockReport = {
				reportId: "report-123",
				status: "SUCCESS",
				downloadUrl: "https://example.com/report.csv",
				requestedDate: "2024-01-01T00:00:00Z",
				completedDate: "2024-01-01T01:00:00Z",
			};

			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response(JSON.stringify(mockReport), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const result = await provider.getReport("report-123");

			expect(result).toEqual(mockReport);
		});
	});

	describe("performance analytics", () => {
		beforeEach(async () => {
			await provider.initialize();
		});

		it("should get campaign performance metrics", async () => {
			// Mock report request
			(global.fetch as MockedFunction<typeof fetch>)
				.mockResolvedValueOnce(
					new Response(JSON.stringify({ reportId: "report-123" }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				)
				// Mock report status check
				.mockResolvedValueOnce(
					new Response(
						JSON.stringify({
							reportId: "report-123",
							status: "SUCCESS",
							reportData: {
								headers: [
									"impressions",
									"clicks",
									"spend",
									"ctr",
									"cpc",
									"cpm",
								],
								rows: [[1000, 50, 25.5, 5.0, 0.51, 25.5]],
								totalRows: 1,
							},
						}),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					),
				);

			const result = await provider.getCampaignPerformance(
				"camp-123",
				"2024-01-01",
				"2024-01-31",
			);

			expect(result.impressions).toBe(1000);
			expect(result.clicks).toBe(50);
			expect(result.spend).toBe(25.5);
			expect(result.ctr).toBe(5.0);
			expect(result.cpc).toBe(0.51);
			expect(result.cpm).toBe(25.5);
		});
	});

	describe("error handling", () => {
		beforeEach(async () => {
			await provider.initialize();
		});

		it("should handle rate limit errors", async () => {
			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response("Rate limit exceeded", {
					status: 429,
					headers: { "retry-after": "60" },
				}),
			);

			await expect(provider.getCampaigns()).rejects.toThrow(
				"Rate limit exceeded",
			);
		});

		it("should handle API errors", async () => {
			(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce(
				new Response("Bad Request", {
					status: 400,
				}),
			);

			await expect(provider.getCampaigns()).rejects.toThrow(
				"DSP API request failed",
			);
		});

		it("should handle network errors", async () => {
			(global.fetch as MockedFunction<typeof fetch>).mockRejectedValueOnce(
				new Error("Network error"),
			);

			await expect(provider.getCampaigns()).rejects.toThrow();
		});
	});

	describe("rate limiting", () => {
		beforeEach(async () => {
			await provider.initialize();
		});

		it("should get rate limit status", async () => {
			const rateLimit = await provider.getRateLimit();

			expect(rateLimit).toHaveProperty("remaining");
			expect(rateLimit).toHaveProperty("resetTime");
			expect(rateLimit.remaining).toBeGreaterThanOrEqual(0);
			expect(rateLimit.resetTime).toBeInstanceOf(Date);
		});
	});
});
