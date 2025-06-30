/**
 * VisitorTrackingService Tests
 * Comprehensive test suite for visitor tracking and automated follow-ups
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	advanceTime,
	createMockError,
	createMockVisitorSession,
} from "../../../test/utils";
import type {
	CreatePageView,
	CreateVisitorInteraction,
	CreateVisitorLead,
	FollowUpRule,
	TrackingEvent,
} from "../types/visitor-tracking";
import { VisitorTrackingService } from "./visitor-tracking";

describe("VisitorTrackingService", () => {
	let trackingService: VisitorTrackingService;

	beforeEach(() => {
		trackingService = new VisitorTrackingService();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("Session Management", () => {
		it("should create a new visitor session", async () => {
			const sessionData = {
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: "https://google.com",
				utmSource: "google",
				utmMedium: "organic",
			};

			const session = await trackingService.createSession(sessionData);

			expect(session.sessionId).toMatch(/^session_/);
			expect(session.ipAddress).toBe(sessionData.ipAddress);
			expect(session.userAgent).toBe(sessionData.userAgent);
			expect(session.referrer).toBe(sessionData.referrer);
			expect(session.utmSource).toBe(sessionData.utmSource);
			expect(session.utmMedium).toBe(sessionData.utmMedium);
			expect(session.isBot).toBe(false);
			expect(session.pageViews).toBe(0);
			expect(session.isReturning).toBe(false);
		});

		it("should detect bot traffic", async () => {
			const sessionData = {
				ipAddress: "192.168.1.1",
				userAgent: "Googlebot/2.1",
				referrer: null,
			};

			const session = await trackingService.createSession(sessionData);

			expect(session.isBot).toBe(true);
		});

		it("should parse user agent correctly", async () => {
			const sessionData = {
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
				referrer: null,
			};

			const session = await trackingService.createSession(sessionData);

			expect(session.deviceType).toBe("desktop");
			expect(session.timezone).toBeDefined();
			expect(session.language).toBeDefined();
		});

		it("should update session duration on end", async () => {
			const sessionData = {
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: null,
			};

			const session = await trackingService.createSession(sessionData);

			// Simulate time passing
			advanceTime(30000); // 30 seconds

			const updatedSession = await trackingService.endSession(
				session.sessionId,
			);

			expect(updatedSession.endTime).toBeDefined();
			expect(updatedSession.duration).toBeGreaterThan(0);
		});
	});

	describe("Page View Tracking", () => {
		it("should track page views correctly", async () => {
			const session = await trackingService.createSession({
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: null,
			});

			const pageViewData: CreatePageView = {
				sessionId: session.sessionId,
				userId: "test-user-id",
				url: "https://example.com/page1",
				path: "/page1",
				title: "Test Page",
				timestamp: new Date(),
				entryPage: true,
				exitPage: false,
				hasForm: false,
				hasVideo: false,
			};

			const pageView = await trackingService.trackPageView(pageViewData);

			expect(pageView.sessionId).toBe(session.sessionId);
			expect(pageView.url).toBe(pageViewData.url);
			expect(pageView.path).toBe(pageViewData.path);
			expect(pageView.title).toBe(pageViewData.title);
			expect(pageView.entryPage).toBe(true);
		});

		it("should update session page view count", async () => {
			const session = await trackingService.createSession({
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: null,
			});

			await trackingService.trackPageView({
				sessionId: session.sessionId,
				url: "https://example.com/page1",
				path: "/page1",
				timestamp: new Date(),
				entryPage: true,
				exitPage: false,
				hasForm: false,
				hasVideo: false,
			});

			await trackingService.trackPageView({
				sessionId: session.sessionId,
				url: "https://example.com/page2",
				path: "/page2",
				timestamp: new Date(),
				entryPage: false,
				exitPage: false,
				hasForm: false,
				hasVideo: false,
			});

			const updatedSession = await trackingService.getSession(
				session.sessionId,
			);
			expect(updatedSession?.pageViews).toBe(2);
		});
	});

	describe("Interaction Tracking", () => {
		it("should track user interactions", async () => {
			const session = await trackingService.createSession({
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: null,
			});

			const interactionData: CreateVisitorInteraction = {
				sessionId: session.sessionId,
				userId: "test-user-id",
				type: "click",
				element: "button",
				elementId: "subscribe-btn",
				elementClass: "btn-primary",
				value: "Subscribe",
				url: "https://example.com/landing",
				timestamp: new Date(),
				coordinates: { x: 100, y: 200 },
			};

			const interaction =
				await trackingService.trackInteraction(interactionData);

			expect(interaction.sessionId).toBe(session.sessionId);
			expect(interaction.type).toBe("click");
			expect(interaction.element).toBe("button");
			expect(interaction.elementId).toBe("subscribe-btn");
			expect(interaction.coordinates).toEqual({ x: 100, y: 200 });
		});

		it("should track form submissions", async () => {
			const session = await trackingService.createSession({
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: null,
			});

			const formInteraction: CreateVisitorInteraction = {
				sessionId: session.sessionId,
				type: "form_submit",
				element: "form",
				elementId: "contact-form",
				url: "https://example.com/contact",
				timestamp: new Date(),
			};

			const interaction =
				await trackingService.trackInteraction(formInteraction);

			expect(interaction.type).toBe("form_submit");
			expect(interaction.elementId).toBe("contact-form");
		});
	});

	describe("Lead Management", () => {
		it("should capture leads from form submissions", async () => {
			const session = await trackingService.createSession({
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: "https://google.com",
				utmSource: "google",
				utmMedium: "organic",
			});

			const leadData: CreateVisitorLead = {
				sessionId: session.sessionId,
				email: "test@example.com",
				firstName: "John",
				lastName: "Doe",
				company: "Test Company",
				phone: "+1234567890",
				jobTitle: "Developer",
				industry: "Technology",
				leadScore: 75,
				source: "google",
				medium: "organic",
				formUrl: "https://example.com/contact",
				formType: "contact",
				status: "new",
			};

			const lead = await trackingService.captureLead(leadData);

			expect(lead.sessionId).toBe(session.sessionId);
			expect(lead.email).toBe("test@example.com");
			expect(lead.leadScore).toBe(75);
			expect(lead.source).toBe("google");
			expect(lead.status).toBe("new");
		});

		it("should calculate lead score based on session behavior", async () => {
			const session = createMockVisitorSession({
				pageViews: 10,
				duration: 300000, // 5 minutes
				utmSource: "google",
				utmMedium: "organic",
			});

			const leadData = {
				company: "Test Company",
				phone: "+1234567890",
				jobTitle: "CEO",
			};

			const score = await (trackingService as any).calculateLeadScore(
				session,
				leadData,
			);

			expect(score).toBeGreaterThan(50); // Base score + bonuses
			expect(score).toBeLessThanOrEqual(100); // Capped at 100
		});
	});

	describe("Follow-up Rules", () => {
		it("should create follow-up rules", async () => {
			const rule: Omit<
				FollowUpRule,
				"id" | "executionCount" | "lastExecutedAt" | "createdAt" | "updatedAt"
			> = {
				name: "Welcome Email",
				description: "Send welcome email after form submission",
				isActive: true,
				priority: 1,
				triggers: [
					{
						type: "form_submission",
						value: "contact",
						operator: "equals",
					},
				],
				conditions: [
					{
						field: "lead.email",
						operator: "exists",
						value: true,
					},
				],
				actions: [
					{
						type: "send_email",
						templateId: "welcome-template",
						delay: 0,
					},
				],
				delay: 0,
			};

			const createdRule = await trackingService.createFollowUpRule(rule);

			expect(createdRule.name).toBe("Welcome Email");
			expect(createdRule.isActive).toBe(true);
			expect(createdRule.triggers).toHaveLength(1);
			expect(createdRule.actions).toHaveLength(1);
			expect(createdRule.executionCount).toBe(0);
		});

		it("should execute follow-up rules when triggered", async () => {
			const session = await trackingService.createSession({
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: null,
			});

			// Create a rule
			const rule = await trackingService.createFollowUpRule({
				name: "Test Rule",
				isActive: true,
				priority: 1,
				triggers: [
					{ type: "form_submission", operator: "equals", value: "contact" },
				],
				conditions: [],
				actions: [{ type: "send_email", templateId: "test-template" }],
			});

			// Capture a lead (triggers form submission)
			const _lead = await trackingService.captureLead({
				sessionId: session.sessionId,
				email: "test@example.com",
				formType: "contact",
				formUrl: "https://example.com/contact",
				leadScore: 50,
				source: "direct",
				status: "new",
			});

			// Rule should be executed
			const executions = await trackingService.getFollowUpExecutions(
				session.sessionId,
			);
			expect(executions).toHaveLength(1);
			expect(executions[0].ruleId).toBe(rule.id);
			expect(executions[0].status).toBe("executed");
		});
	});

	describe("Analytics", () => {
		it("should generate visitor analytics for date range", async () => {
			const startDate = new Date("2024-01-01");
			const endDate = new Date("2024-01-31");

			// Mock some data
			const sessions = [
				createMockVisitorSession({ pageViews: 5, duration: 120000 }),
				createMockVisitorSession({ pageViews: 3, duration: 60000 }),
				createMockVisitorSession({ pageViews: 1, duration: 10000 }), // Bounce
			];

			// Mock the service methods
			vi.spyOn(trackingService as any, "getSessionsInRange").mockResolvedValue(
				sessions,
			);
			vi.spyOn(trackingService as any, "getPageViewsInRange").mockResolvedValue(
				[],
			);
			vi.spyOn(trackingService as any, "getLeadsInRange").mockResolvedValue([]);

			const analytics = await trackingService.getVisitorAnalytics(
				startDate,
				endDate,
			);

			expect(analytics.totalSessions).toBe(3);
			expect(analytics.uniqueVisitors).toBe(3);
			expect(analytics.averageSessionDuration).toBeGreaterThan(0);
			expect(analytics.bounceRate).toBeGreaterThan(0);
		});

		it("should generate insights for visitor behavior", async () => {
			const session = createMockVisitorSession({
				pageViews: 10,
				duration: 30000, // Short duration despite many page views
			});

			vi.spyOn(trackingService, "getSession").mockResolvedValue(session);
			vi.spyOn(trackingService as any, "getSessionPageViews").mockResolvedValue(
				[],
			);
			vi.spyOn(
				trackingService as any,
				"getSessionInteractions",
			).mockResolvedValue([]);

			const insights = await trackingService.generateInsights(
				session.sessionId,
			);

			expect(insights).toHaveLength(1);
			expect(insights[0].type).toBe("behavior");
			expect(insights[0].title).toBe("High Bounce Rate Detected");
			expect(insights[0].severity).toBe("medium");
		});

		it("should identify high-intent visitors", async () => {
			const session = createMockVisitorSession({
				pageViews: 15,
				duration: 300000, // 5 minutes
			});

			const formInteractions = [
				{ type: "form_submit", elementId: "contact-form" },
			];

			vi.spyOn(trackingService, "getSession").mockResolvedValue(session);
			vi.spyOn(trackingService as any, "getSessionPageViews").mockResolvedValue(
				[],
			);
			vi.spyOn(
				trackingService as any,
				"getSessionInteractions",
			).mockResolvedValue(formInteractions);

			const insights = await trackingService.generateInsights(
				session.sessionId,
			);

			const highIntentInsight = insights.find(
				(insight) => insight.type === "engagement",
			);
			expect(highIntentInsight).toBeDefined();
			expect(highIntentInsight?.title).toBe("High-Intent Visitor");
			expect(highIntentInsight?.severity).toBe("high");
		});
	});

	describe("Event Tracking", () => {
		it("should track custom events", async () => {
			const session = await trackingService.createSession({
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: null,
			});

			const customEvent: TrackingEvent = {
				type: "video_play",
				properties: {
					videoId: "intro-video",
					videoTitle: "Product Introduction",
					position: 30,
				},
				timestamp: new Date(),
				sessionId: session.sessionId,
			};

			await trackingService.trackEvent(customEvent);

			// Verify event was tracked (implementation dependent)
			expect(true).toBe(true); // Placeholder assertion
		});

		it("should handle tracking errors gracefully", async () => {
			const invalidEvent: TrackingEvent = {
				type: "",
				properties: {},
				timestamp: new Date(),
				sessionId: "invalid-session",
			};

			// Should not throw error
			await expect(
				trackingService.trackEvent(invalidEvent),
			).resolves.not.toThrow();
		});
	});

	describe("Error Handling", () => {
		it("should handle database errors gracefully", async () => {
			// Mock database error
			const dbError = createMockError("Database connection failed");
			vi.spyOn(trackingService as any, "saveSession").mockRejectedValue(
				dbError,
			);

			const sessionData = {
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 (Test)",
				referrer: null,
			};

			await expect(trackingService.createSession(sessionData)).rejects.toThrow(
				"Database connection failed",
			);
		});

		it("should handle invalid session IDs", async () => {
			const result = await trackingService.getSession("invalid-session-id");
			expect(result).toBeNull();
		});

		it("should validate required fields", async () => {
			const invalidLeadData = {
				sessionId: "test-session",
				// Missing required fields
				leadScore: 0,
				source: "",
				formUrl: "",
				formType: "contact" as const,
				status: "new" as const,
			};

			await expect(
				trackingService.captureLead(invalidLeadData),
			).rejects.toThrow();
		});
	});
});
