/**
 * Visitor Tracking Service
 * Core service for tracking visitor behavior and managing automated follow-ups
 */

import type {
	CreateFollowUpExecution,
	CreatePageView,
	CreateVisitorInteraction,
	CreateVisitorLead,
	CreateVisitorSession,
	FollowUpAction,
	FollowUpCondition,
	FollowUpExecution,
	FollowUpRule,
	FollowUpTrigger,
	PageView,
	TrackingConfiguration,
	UpdateVisitorLead,
	UpdateVisitorSession,
	VisitorAnalytics,
	VisitorInsight,
	VisitorInteraction,
	VisitorLead,
	VisitorSession,
} from "../types/visitor-tracking";

export interface TrackingEvent {
	type: string;
	properties: Record<string, any>;
	timestamp: Date;
	sessionId: string;
	userId?: string;
	anonymousId?: string;
}

export interface TrackingContext {
	ip: string;
	userAgent: string;
	url: string;
	referrer?: string;
	utm?: {
		source?: string;
		medium?: string;
		campaign?: string;
		term?: string;
		content?: string;
	};
}

export class VisitorTrackingService {
	private config: TrackingConfiguration;
	private sessions: Map<string, VisitorSession> = new Map();
	private rules: FollowUpRule[] = [];
	private isInitialized = false;

	constructor(config: TrackingConfiguration) {
		this.config = config;
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		try {
			// Load follow-up rules from database
			await this.loadFollowUpRules();

			// Initialize tracking scripts
			await this.initializeTrackingScripts();

			// Set up automatic session cleanup
			this.setupSessionCleanup();

			this.isInitialized = true;
			console.log("✅ Visitor tracking service initialized");
		} catch (error) {
			console.error("❌ Failed to initialize visitor tracking:", error);
			throw error;
		}
	}

	// Session Management
	async createSession(
		context: TrackingContext,
		userId?: string,
	): Promise<VisitorSession> {
		const sessionId = this.generateSessionId();
		const anonymousId = userId ? undefined : this.generateAnonymousId();

		const geoData = await this.getGeoLocation(context.ip);
		const deviceInfo = this.parseUserAgent(context.userAgent);

		const sessionData: CreateVisitorSession = {
			sessionId,
			userId,
			anonymousId,
			ipAddress: context.ip,
			userAgent: context.userAgent,
			referrer: context.referrer,
			utmSource: context.utm?.source,
			utmMedium: context.utm?.medium,
			utmCampaign: context.utm?.campaign,
			utmTerm: context.utm?.term,
			utmContent: context.utm?.content,
			country: geoData.country,
			region: geoData.region,
			city: geoData.city,
			deviceType: deviceInfo.deviceType,
			browserName: deviceInfo.browserName,
			osName: deviceInfo.osName,
			isBot: this.detectBot(context.userAgent),
			startTime: new Date(),
			pageViews: 0,
			isReturning: await this.isReturningVisitor(
				context.ip,
				userId,
				anonymousId,
			),
			lastActiveAt: new Date(),
			timezone: deviceInfo.timezone,
			language: deviceInfo.language,
			screenResolution: deviceInfo.screenResolution,
		};

		const session = await this.saveSession(sessionData);
		this.sessions.set(sessionId, session);

		// Trigger session-based follow-up rules
		await this.processFollowUpRules(session);

		return session;
	}

	async updateSession(
		sessionId: string,
		updates: UpdateVisitorSession,
	): Promise<VisitorSession | null> {
		const session = this.sessions.get(sessionId);
		if (!session) return null;

		const updatedSession = { ...session, ...updates, updatedAt: new Date() };
		this.sessions.set(sessionId, updatedSession);

		return await this.saveSession(updatedSession);
	}

	async endSession(sessionId: string): Promise<void> {
		const session = this.sessions.get(sessionId);
		if (!session) return;

		const endTime = new Date();
		const duration = endTime.getTime() - session.startTime.getTime();

		await this.updateSession(sessionId, {
			endTime,
			duration,
			bounceRate: session.pageViews <= 1 ? 100 : 0,
		});

		this.sessions.delete(sessionId);
	}

	// Page View Tracking
	async trackPageView(
		sessionId: string,
		url: string,
		context: TrackingContext,
	): Promise<PageView> {
		const session = this.sessions.get(sessionId);
		if (!session) throw new Error("Session not found");

		const urlObj = new URL(url);
		const pageViewData: CreatePageView = {
			sessionId,
			userId: session.userId,
			url,
			path: urlObj.pathname,
			title: await this.getPageTitle(url),
			referrer: context.referrer,
			timestamp: new Date(),
			exitPage: false,
			entryPage: session.pageViews === 0,
			hasForm: await this.detectFormOnPage(url),
			hasVideo: await this.detectVideoOnPage(url),
		};

		const pageView = await this.savePageView(pageViewData);

		// Update session page view count
		await this.updateSession(sessionId, {
			pageViews: session.pageViews + 1,
			lastActiveAt: new Date(),
		});

		// Process page-based follow-up rules
		await this.processPageViewRules(session, pageView);

		return pageView;
	}

	// Interaction Tracking
	async trackInteraction(
		sessionId: string,
		interaction: Omit<CreateVisitorInteraction, "sessionId" | "userId">,
	): Promise<VisitorInteraction> {
		const session = this.sessions.get(sessionId);
		if (!session) throw new Error("Session not found");

		const interactionData: CreateVisitorInteraction = {
			...interaction,
			sessionId,
			userId: session.userId,
		};

		const savedInteraction = await this.saveInteraction(interactionData);

		// Process interaction-based follow-up rules
		await this.processInteractionRules(session, savedInteraction);

		return savedInteraction;
	}

	// Lead Management
	async createLead(
		sessionId: string,
		leadData: Omit<CreateVisitorLead, "sessionId" | "userId" | "leadScore">,
	): Promise<VisitorLead> {
		const session = this.sessions.get(sessionId);
		if (!session) throw new Error("Session not found");

		const leadScore = await this.calculateLeadScore(session, leadData);

		const lead: CreateVisitorLead = {
			...leadData,
			sessionId,
			userId: session.userId,
			leadScore,
			status: "new",
		};

		const savedLead = await this.saveLead(lead);

		// Process lead-based follow-up rules
		await this.processLeadRules(session, savedLead);

		return savedLead;
	}

	async updateLead(
		leadId: string,
		updates: UpdateVisitorLead,
	): Promise<VisitorLead | null> {
		const lead = await this.getLead(leadId);
		if (!lead) return null;

		const updatedLead = { ...lead, ...updates, updatedAt: new Date() };
		return await this.saveLead(updatedLead);
	}

	// Follow-up Rules Engine
	async processFollowUpRules(
		session: VisitorSession,
		pageView?: PageView,
		interaction?: VisitorInteraction,
		lead?: VisitorLead,
	): Promise<void> {
		for (const rule of this.rules) {
			if (!rule.isActive) continue;

			try {
				const shouldExecute = await this.evaluateRule(
					rule,
					session,
					pageView,
					interaction,
					lead,
				);

				if (shouldExecute) {
					await this.executeRule(rule, session, lead);
				}
			} catch (error) {
				console.error(`Failed to process follow-up rule ${rule.id}:`, error);
			}
		}
	}

	private async evaluateRule(
		rule: FollowUpRule,
		session: VisitorSession,
		pageView?: PageView,
		interaction?: VisitorInteraction,
		lead?: VisitorLead,
	): Promise<boolean> {
		// Check if rule has already been executed for this session
		if (rule.maxExecutions && rule.executionCount >= rule.maxExecutions) {
			return false;
		}

		// Evaluate triggers
		let triggerMet = false;
		for (const trigger of rule.triggers) {
			const triggerResult = await this.evaluateTrigger(
				trigger,
				session,
				pageView,
				interaction,
				lead,
			);
			if (triggerResult) {
				triggerMet = true;
				break;
			}
		}

		if (!triggerMet) return false;

		// Evaluate conditions
		for (const condition of rule.conditions) {
			const conditionResult = await this.evaluateCondition(
				condition,
				session,
				pageView,
				interaction,
				lead,
			);
			if (!conditionResult) return false;
		}

		return true;
	}

	private async evaluateTrigger(
		trigger: FollowUpTrigger,
		session: VisitorSession,
		pageView?: PageView,
		interaction?: VisitorInteraction,
		_lead?: VisitorLead,
	): Promise<boolean> {
		switch (trigger.type) {
			case "page_visit":
				return pageView
					? this.matchesPattern(pageView.path, trigger.value, trigger.operator)
					: false;

			case "time_on_site": {
				const timeOnSite = Date.now() - session.startTime.getTime();
				return this.compareValues(
					timeOnSite / 1000 / 60,
					trigger.value,
					trigger.operator,
				); // minutes
			}

			case "form_submission":
				return interaction ? interaction.type === "form_submit" : false;

			case "inactivity": {
				const inactiveTime = Date.now() - session.lastActiveAt.getTime();
				return this.compareValues(
					inactiveTime / 1000 / 60,
					trigger.value,
					trigger.operator,
				); // minutes
			}

			case "return_visit":
				return session.isReturning;

			default:
				return false;
		}
	}

	private async evaluateCondition(
		condition: FollowUpCondition,
		session: VisitorSession,
		pageView?: PageView,
		interaction?: VisitorInteraction,
		lead?: VisitorLead,
	): Promise<boolean> {
		const value = this.getFieldValue(
			condition.field,
			session,
			pageView,
			interaction,
			lead,
		);
		return this.compareValues(value, condition.value, condition.operator);
	}

	private async executeRule(
		rule: FollowUpRule,
		session: VisitorSession,
		lead?: VisitorLead,
	): Promise<void> {
		const execution: CreateFollowUpExecution = {
			ruleId: rule.id,
			sessionId: session.sessionId,
			leadId: lead?.id,
			userId: session.userId,
			status: "pending",
		};

		try {
			for (const action of rule.actions) {
				await this.executeAction(action, session, lead);
			}

			execution.status = "executed";
			execution.executedAt = new Date();

			// Update rule execution count
			rule.executionCount++;
			rule.lastExecutedAt = new Date();
			await this.saveFollowUpRule(rule);
		} catch (error) {
			execution.status = "failed";
			execution.error =
				error instanceof Error ? error.message : "Unknown error";
		}

		await this.saveFollowUpExecution(execution);
	}

	private async executeAction(
		action: FollowUpAction,
		session: VisitorSession,
		lead?: VisitorLead,
	): Promise<void> {
		switch (action.type) {
			case "send_email":
				if (lead?.email && action.templateId) {
					await this.sendFollowUpEmail(lead.email, action.templateId, {
						firstName: lead.firstName,
						lastName: lead.lastName,
						company: lead.company,
						leadScore: lead.leadScore,
						source: lead.source,
					});
				}
				break;

			case "add_tag":
				if (lead && action.tag) {
					await this.addTagToLead(lead.id, action.tag);
				}
				break;

			case "update_score":
				if (lead && action.scoreAdjustment) {
					await this.updateLeadScore(
						lead.id,
						lead.leadScore + action.scoreAdjustment,
					);
				}
				break;

			case "create_task":
				if (action.taskDescription) {
					await this.createFollowUpTask({
						description: action.taskDescription,
						assignTo: action.assignTo,
						leadId: lead?.id,
						sessionId: session.sessionId,
					});
				}
				break;

			case "webhook":
				if (action.webhookUrl) {
					await this.callWebhook(action.webhookUrl, {
						session,
						lead,
						action: action.type,
					});
				}
				break;
		}
	}

	// Analytics and Insights
	async getVisitorAnalytics(
		startDate: Date,
		endDate: Date,
	): Promise<VisitorAnalytics> {
		const sessions = await this.getSessionsInRange(startDate, endDate);
		const pageViews = await this.getPageViewsInRange(startDate, endDate);
		const leads = await this.getLeadsInRange(startDate, endDate);

		return {
			totalSessions: sessions.length,
			uniqueVisitors: new Set(sessions.map((s) => s.userId || s.anonymousId))
				.size,
			pageViews: pageViews.length,
			averageSessionDuration: this.calculateAverageSessionDuration(sessions),
			bounceRate: this.calculateBounceRate(sessions),
			conversionRate: this.calculateConversionRate(sessions, leads),
			leadConversionRate: (leads.length / sessions.length) * 100,
			topPages: this.getTopPages(pageViews),
			topSources: this.getTopSources(sessions),
			deviceBreakdown: this.getDeviceBreakdown(sessions),
			geographicData: this.getGeographicData(sessions),
			timeSeriesData: this.getTimeSeriesData(
				sessions,
				leads,
				startDate,
				endDate,
			),
		};
	}

	async generateInsights(sessionId: string): Promise<VisitorInsight[]> {
		const session = await this.getSession(sessionId);
		if (!session) return [];

		const insights: VisitorInsight[] = [];
		const _pageViews = await this.getSessionPageViews(sessionId);
		const interactions = await this.getSessionInteractions(sessionId);

		// Analyze behavior patterns
		if (session.pageViews > 5 && session.duration && session.duration < 60000) {
			insights.push({
				id: this.generateId(),
				sessionId,
				type: "behavior",
				title: "High Bounce Rate Detected",
				description:
					"Visitor viewed multiple pages but spent very little time on site",
				severity: "medium",
				confidence: 0.8,
				impact: "May indicate poor user experience or content mismatch",
				recommendedActions: [
					"Review page loading speed",
					"Improve content relevance",
					"Optimize navigation flow",
				],
				metadata: { pageViews: session.pageViews, duration: session.duration },
				createdAt: new Date(),
			});
		}

		// Analyze engagement patterns
		const formSubmissions = interactions.filter(
			(i) => i.type === "form_submit",
		);
		if (formSubmissions.length > 0 && session.pageViews > 10) {
			insights.push({
				id: this.generateId(),
				sessionId,
				type: "engagement",
				title: "High-Intent Visitor",
				description: "Visitor showed strong engagement before form submission",
				severity: "high",
				confidence: 0.9,
				impact: "High likelihood of conversion with proper follow-up",
				recommendedActions: [
					"Prioritize immediate follow-up",
					"Assign to senior sales rep",
					"Send personalized content",
				],
				metadata: {
					formSubmissions: formSubmissions.length,
					pageViews: session.pageViews,
				},
				createdAt: new Date(),
			});
		}

		return insights;
	}

	// Utility Methods
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateAnonymousId(): string {
		return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateId(): string {
		return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private async getGeoLocation(
		_ip: string,
	): Promise<{ country?: string; region?: string; city?: string }> {
		// Implement IP geolocation lookup
		// This would typically use a service like MaxMind or IPinfo
		return { country: "Unknown", region: "Unknown", city: "Unknown" };
	}

	private parseUserAgent(_userAgent: string): {
		deviceType: "desktop" | "mobile" | "tablet";
		browserName: string;
		osName: string;
		timezone: string;
		language: string;
		screenResolution: string;
	} {
		// Parse user agent to extract device, browser, and OS information
		return {
			deviceType: "desktop" as const,
			browserName: "Unknown",
			osName: "Unknown",
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			language: "en",
			screenResolution: "1920x1080",
		};
	}

	private detectBot(userAgent: string): boolean {
		const botPatterns = [
			/bot/i,
			/crawler/i,
			/spider/i,
			/scraper/i,
			/google/i,
			/facebook/i,
			/twitter/i,
			/linkedin/i,
		];
		return botPatterns.some((pattern) => pattern.test(userAgent));
	}

	private async isReturningVisitor(
		_ip: string,
		_userId?: string,
		_anonymousId?: string,
	): Promise<boolean> {
		// Check if this visitor has been seen before
		return false; // Placeholder
	}

	private async getPageTitle(_url: string): Promise<string> {
		// Extract page title from URL or fetch it
		return "Page Title"; // Placeholder
	}

	private async detectFormOnPage(_url: string): Promise<boolean> {
		// Detect if page contains forms
		return false; // Placeholder
	}

	private async detectVideoOnPage(_url: string): Promise<boolean> {
		// Detect if page contains videos
		return false; // Placeholder
	}

	private matchesPattern(
		value: string,
		pattern: string,
		operator = "equals",
	): boolean {
		switch (operator) {
			case "equals":
				return value === pattern;
			case "contains":
				return value.includes(pattern);
			case "starts_with":
				return value.startsWith(pattern);
			case "ends_with":
				return value.endsWith(pattern);
			default:
				return false;
		}
	}

	private compareValues(
		actual: unknown,
		expected: unknown,
		operator = "equals",
	): boolean {
		switch (operator) {
			case "equals":
				return actual === expected;
			case "not_equals":
				return actual !== expected;
			case "greater_than":
				return actual > expected;
			case "less_than":
				return actual < expected;
			case "contains":
				return String(actual).includes(String(expected));
			case "in":
				return Array.isArray(expected) ? expected.includes(actual) : false;
			default:
				return false;
		}
	}

	private getFieldValue(
		field: string,
		session: VisitorSession,
		pageView?: PageView,
		interaction?: VisitorInteraction,
		lead?: VisitorLead,
	): unknown {
		const [entity, property] = field.split(".");

		switch (entity) {
			case "session":
				return session[property as keyof VisitorSession];
			case "pageView":
				return pageView ? pageView[property as keyof PageView] : null;
			case "interaction":
				return interaction
					? interaction[property as keyof VisitorInteraction]
					: null;
			case "lead":
				return lead ? lead[property as keyof VisitorLead] : null;
			default:
				return null;
		}
	}

	private async calculateLeadScore(
		session: VisitorSession,
		leadData: Partial<CreateVisitorLead>,
	): Promise<number> {
		let score = 50; // Base score

		// Adjust based on session behavior
		score += Math.min(session.pageViews * 2, 20); // Up to 20 points for page views

		if (session.duration) {
			score += Math.min((session.duration / 60000) * 5, 30); // Up to 30 points for time on site
		}

		// Adjust based on lead data
		if (leadData.company) score += 10;
		if (leadData.phone) score += 5;
		if (leadData.jobTitle) score += 5;

		// Adjust based on traffic source
		if (session.utmSource === "google") score += 10;
		if (session.utmMedium === "organic") score += 15;

		return Math.min(Math.max(score, 0), 100); // Clamp between 0 and 100
	}

	// Abstract methods that would be implemented by database layer
	private async saveSession(
		session: CreateVisitorSession | VisitorSession,
	): Promise<VisitorSession> {
		// Implementation would save to database
		return session as VisitorSession;
	}

	private async savePageView(pageView: CreatePageView): Promise<PageView> {
		// Implementation would save to database
		return pageView as PageView;
	}

	private async saveInteraction(
		interaction: CreateVisitorInteraction,
	): Promise<VisitorInteraction> {
		// Implementation would save to database
		return interaction as VisitorInteraction;
	}

	private async saveLead(
		lead: CreateVisitorLead | VisitorLead,
	): Promise<VisitorLead> {
		// Implementation would save to database
		return lead as VisitorLead;
	}

	private async saveFollowUpRule(rule: FollowUpRule): Promise<FollowUpRule> {
		// Implementation would save to database
		return rule;
	}

	private async saveFollowUpExecution(
		execution: CreateFollowUpExecution,
	): Promise<FollowUpExecution> {
		// Implementation would save to database
		return execution as FollowUpExecution;
	}

	private async loadFollowUpRules(): Promise<void> {
		// Implementation would load from database
		this.rules = [];
	}

	private async initializeTrackingScripts(): Promise<void> {
		// Initialize third-party tracking scripts
	}

	private setupSessionCleanup(): void {
		// Set up automatic cleanup of expired sessions
	}

	private async processPageViewRules(
		session: VisitorSession,
		pageView: PageView,
	): Promise<void> {
		await this.processFollowUpRules(session, pageView);
	}

	private async processInteractionRules(
		session: VisitorSession,
		interaction: VisitorInteraction,
	): Promise<void> {
		await this.processFollowUpRules(session, undefined, interaction);
	}

	private async processLeadRules(
		session: VisitorSession,
		lead: VisitorLead,
	): Promise<void> {
		await this.processFollowUpRules(session, undefined, undefined, lead);
	}

	private async sendFollowUpEmail(
		_email: string,
		_templateId: string,
		_data: any,
	): Promise<void> {
		// Implementation would use email service
	}

	private async addTagToLead(_leadId: string, _tag: string): Promise<void> {
		// Implementation would update lead tags
	}

	private async updateLeadScore(
		_leadId: string,
		_score: number,
	): Promise<void> {
		// Implementation would update lead score
	}

	private async createFollowUpTask(_task: any): Promise<void> {
		// Implementation would create task in CRM
	}

	private async callWebhook(_url: string, _data: any): Promise<void> {
		// Implementation would make HTTP request
	}

	// Placeholder methods for analytics
	private async getSession(_sessionId: string): Promise<VisitorSession | null> {
		return null;
	}
	private async getLead(_leadId: string): Promise<VisitorLead | null> {
		return null;
	}
	private async getSessionsInRange(
		_startDate: Date,
		_endDate: Date,
	): Promise<VisitorSession[]> {
		return [];
	}
	private async getPageViewsInRange(
		_startDate: Date,
		_endDate: Date,
	): Promise<PageView[]> {
		return [];
	}
	private async getLeadsInRange(
		_startDate: Date,
		_endDate: Date,
	): Promise<VisitorLead[]> {
		return [];
	}
	private async getSessionPageViews(_sessionId: string): Promise<PageView[]> {
		return [];
	}
	private async getSessionInteractions(
		_sessionId: string,
	): Promise<VisitorInteraction[]> {
		return [];
	}

	private calculateAverageSessionDuration(_sessions: VisitorSession[]): number {
		return 0;
	}
	private calculateBounceRate(_sessions: VisitorSession[]): number {
		return 0;
	}
	private calculateConversionRate(
		_sessions: VisitorSession[],
		_leads: VisitorLead[],
	): number {
		return 0;
	}
	private getTopPages(
		_pageViews: PageView[],
	): Array<{ path: string; views: number; conversions: number }> {
		return [];
	}
	private getTopSources(
		_sessions: VisitorSession[],
	): Array<{ source: string; sessions: number; conversions: number }> {
		return [];
	}
	private getDeviceBreakdown(
		_sessions: VisitorSession[],
	): Array<{ device: string; percentage: number }> {
		return [];
	}
	private getGeographicData(
		_sessions: VisitorSession[],
	): Array<{ country: string; sessions: number }> {
		return [];
	}
	private getTimeSeriesData(
		_sessions: VisitorSession[],
		_leads: VisitorLead[],
		_startDate: Date,
		_endDate: Date,
	): Array<{ date: string; sessions: number; conversions: number }> {
		return [];
	}
}

export default VisitorTrackingService;
