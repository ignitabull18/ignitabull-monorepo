/**
 * Visitor Tracking Types
 * TypeScript interfaces for visitor behavior tracking and automated follow-ups
 */

export interface VisitorSession {
	id: string;
	sessionId: string;
	userId?: string;
	anonymousId?: string;
	ipAddress: string;
	userAgent: string;
	referrer?: string;
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	utmTerm?: string;
	utmContent?: string;
	country?: string;
	region?: string;
	city?: string;
	deviceType: "desktop" | "mobile" | "tablet";
	browserName?: string;
	osName?: string;
	isBot: boolean;
	startTime: Date;
	endTime?: Date;
	duration?: number;
	pageViews: number;
	bounceRate?: number;
	isReturning: boolean;
	lastActiveAt: Date;
	timezone?: string;
	language?: string;
	screenResolution?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface PageView {
	id: string;
	sessionId: string;
	userId?: string;
	url: string;
	path: string;
	title?: string;
	referrer?: string;
	timestamp: Date;
	timeOnPage?: number;
	scrollDepth?: number;
	exitPage: boolean;
	entryPage: boolean;
	hasForm: boolean;
	hasVideo: boolean;
	wordCount?: number;
	readingTime?: number;
	socialShares?: number;
	comments?: number;
	conversions?: number;
	metadata?: Record<string, any>;
	createdAt: Date;
}

export interface VisitorInteraction {
	id: string;
	sessionId: string;
	userId?: string;
	type:
		| "click"
		| "form_submit"
		| "download"
		| "video_play"
		| "scroll"
		| "hover"
		| "search"
		| "share"
		| "comment";
	element?: string;
	elementId?: string;
	elementClass?: string;
	value?: string;
	url: string;
	timestamp: Date;
	coordinates?: { x: number; y: number };
	metadata?: Record<string, any>;
	createdAt: Date;
}

export interface VisitorLead {
	id: string;
	sessionId: string;
	userId?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	company?: string;
	phone?: string;
	jobTitle?: string;
	industry?: string;
	leadScore: number;
	source: string;
	medium?: string;
	campaign?: string;
	formUrl: string;
	formType: "contact" | "newsletter" | "demo" | "trial" | "download" | "quote";
	status: "new" | "contacted" | "qualified" | "converted" | "lost";
	assignedTo?: string;
	notes?: string;
	followUpScheduled?: Date;
	lastContactedAt?: Date;
	convertedAt?: Date;
	conversionValue?: number;
	tags?: string[];
	customFields?: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
}

export interface FollowUpRule {
	id: string;
	name: string;
	description?: string;
	isActive: boolean;
	priority: number;
	triggers: FollowUpTrigger[];
	conditions: FollowUpCondition[];
	actions: FollowUpAction[];
	delay?: number; // minutes
	maxExecutions?: number;
	executionCount: number;
	lastExecutedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface FollowUpTrigger {
	type:
		| "page_visit"
		| "time_on_site"
		| "form_submission"
		| "download"
		| "email_open"
		| "email_click"
		| "inactivity"
		| "return_visit";
	value?: string | number;
	operator?:
		| "equals"
		| "contains"
		| "greater_than"
		| "less_than"
		| "starts_with"
		| "ends_with";
	metadata?: Record<string, any>;
}

export interface FollowUpCondition {
	field: string;
	operator:
		| "equals"
		| "not_equals"
		| "contains"
		| "not_contains"
		| "greater_than"
		| "less_than"
		| "in"
		| "not_in"
		| "exists"
		| "not_exists";
	value: any;
	logicalOperator?: "AND" | "OR";
}

export interface FollowUpAction {
	type:
		| "send_email"
		| "create_task"
		| "assign_lead"
		| "add_tag"
		| "update_score"
		| "schedule_call"
		| "send_slack"
		| "webhook";
	templateId?: string;
	emailTemplate?: string;
	subject?: string;
	assignTo?: string;
	taskDescription?: string;
	tag?: string;
	scoreAdjustment?: number;
	webhookUrl?: string;
	slackChannel?: string;
	delay?: number;
	metadata?: Record<string, any>;
}

export interface FollowUpExecution {
	id: string;
	ruleId: string;
	sessionId: string;
	leadId?: string;
	userId?: string;
	status: "pending" | "executed" | "failed" | "cancelled";
	executedAt?: Date;
	error?: string;
	metadata?: Record<string, any>;
	createdAt: Date;
}

export interface VisitorSegment {
	id: string;
	name: string;
	description?: string;
	criteria: SegmentCriteria[];
	visitorCount: number;
	isActive: boolean;
	lastUpdated: Date;
	createdAt: Date;
}

export interface SegmentCriteria {
	field: string;
	operator:
		| "equals"
		| "not_equals"
		| "contains"
		| "not_contains"
		| "greater_than"
		| "less_than"
		| "in"
		| "not_in"
		| "between";
	value: any;
	logicalOperator?: "AND" | "OR";
}

export interface VisitorAnalytics {
	totalSessions: number;
	uniqueVisitors: number;
	pageViews: number;
	averageSessionDuration: number;
	bounceRate: number;
	conversionRate: number;
	leadConversionRate: number;
	topPages: Array<{ path: string; views: number; conversions: number }>;
	topSources: Array<{ source: string; sessions: number; conversions: number }>;
	deviceBreakdown: Array<{ device: string; percentage: number }>;
	geographicData: Array<{ country: string; sessions: number }>;
	timeSeriesData: Array<{
		date: string;
		sessions: number;
		conversions: number;
	}>;
}

export interface TrackingConfiguration {
	enableTracking: boolean;
	trackAnonymous: boolean;
	enableHeatmaps: boolean;
	enableRecordings: boolean;
	cookieConsent: boolean;
	dataRetentionDays: number;
	excludedIPs: string[];
	excludedUserAgents: string[];
	privacyMode: boolean;
	gdprCompliant: boolean;
	ccpaCompliant: boolean;
	customEvents: string[];
	integrations: {
		googleAnalytics?: { trackingId: string; enabled: boolean };
		facebookPixel?: { pixelId: string; enabled: boolean };
		hotjar?: { siteId: string; enabled: boolean };
		mixpanel?: { token: string; enabled: boolean };
		amplitude?: { apiKey: string; enabled: boolean };
	};
}

export interface VisitorInsight {
	id: string;
	sessionId: string;
	type: "behavior" | "engagement" | "conversion" | "retention" | "acquisition";
	title: string;
	description: string;
	severity: "low" | "medium" | "high" | "critical";
	confidence: number;
	impact: string;
	recommendedActions: string[];
	metadata: Record<string, any>;
	createdAt: Date;
}

export interface EmailCampaign {
	id: string;
	name: string;
	type: "welcome" | "follow_up" | "nurture" | "reactivation" | "promotional";
	subject: string;
	templateId: string;
	segmentId?: string;
	status: "draft" | "scheduled" | "sending" | "sent" | "paused";
	scheduledFor?: Date;
	sentAt?: Date;
	recipients: number;
	opened: number;
	clicked: number;
	bounced: number;
	unsubscribed: number;
	openRate: number;
	clickRate: number;
	bounceRate: number;
	unsubscribeRate: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface AutomationWorkflow {
	id: string;
	name: string;
	description?: string;
	isActive: boolean;
	trigger: WorkflowTrigger;
	steps: WorkflowStep[];
	totalExecutions: number;
	successfulExecutions: number;
	failedExecutions: number;
	lastExecutedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface WorkflowTrigger {
	type:
		| "visitor_action"
		| "time_based"
		| "segment_entry"
		| "lead_score"
		| "form_submission";
	configuration: Record<string, any>;
}

export interface WorkflowStep {
	id: string;
	type: "email" | "wait" | "condition" | "action" | "webhook";
	configuration: Record<string, any>;
	order: number;
	isActive: boolean;
}

// Database creation types
export interface CreateVisitorSession
	extends Omit<VisitorSession, "id" | "createdAt" | "updatedAt"> {}
export interface CreatePageView extends Omit<PageView, "id" | "createdAt"> {}
export interface CreateVisitorInteraction
	extends Omit<VisitorInteraction, "id" | "createdAt"> {}
export interface CreateVisitorLead
	extends Omit<VisitorLead, "id" | "createdAt" | "updatedAt"> {}
export interface CreateFollowUpRule
	extends Omit<
		FollowUpRule,
		"id" | "executionCount" | "lastExecutedAt" | "createdAt" | "updatedAt"
	> {}
export interface CreateFollowUpExecution
	extends Omit<FollowUpExecution, "id" | "createdAt"> {}

// Update types
export interface UpdateVisitorSession
	extends Partial<Omit<CreateVisitorSession, "sessionId">> {}
export interface UpdateVisitorLead
	extends Partial<Omit<CreateVisitorLead, "sessionId">> {}
export interface UpdateFollowUpRule
	extends Partial<Omit<CreateFollowUpRule, "name">> {}

export default {
	VisitorSession,
	PageView,
	VisitorInteraction,
	VisitorLead,
	FollowUpRule,
	FollowUpExecution,
	VisitorSegment,
	VisitorAnalytics,
	TrackingConfiguration,
	VisitorInsight,
	EmailCampaign,
	AutomationWorkflow,
};
