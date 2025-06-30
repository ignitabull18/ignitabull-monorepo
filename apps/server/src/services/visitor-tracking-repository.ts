/**
 * Visitor Tracking Repository
 * Database operations for visitor tracking and follow-up automation
 */

import { createClient } from "@supabase/supabase-js";
import type {
	CreateFollowUpExecution,
	CreateFollowUpRule,
	CreatePageView,
	CreateVisitorInteraction,
	CreateVisitorLead,
	CreateVisitorSession,
	FollowUpExecution,
	FollowUpRule,
	PageView,
	UpdateVisitorLead,
	UpdateVisitorSession,
	VisitorAnalytics,
	VisitorInsight,
	VisitorInteraction,
	VisitorLead,
	VisitorSegment,
	VisitorSession,
} from "../../../packages/core/src/types/visitor-tracking";

export class VisitorTrackingRepository {
	private supabase: ReturnType<typeof createClient>;

	constructor() {
		const supabaseUrl = process.env.SUPABASE_URL!;
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
		this.supabase = createClient(supabaseUrl, supabaseKey);
	}

	// Session Management
	async createSession(data: CreateVisitorSession): Promise<VisitorSession> {
		const { data: session, error } = await this.supabase
			.from("visitor_sessions")
			.insert(data)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create visitor session: ${error.message}`);
		}

		return session;
	}

	async updateSession(
		sessionId: string,
		updates: UpdateVisitorSession,
	): Promise<VisitorSession | null> {
		const { data: session, error } = await this.supabase
			.from("visitor_sessions")
			.update({ ...updates, updated_at: new Date().toISOString() })
			.eq("session_id", sessionId)
			.select()
			.single();

		if (error) {
			console.error("Failed to update visitor session:", error);
			return null;
		}

		return session;
	}

	async getSession(sessionId: string): Promise<VisitorSession | null> {
		const { data: session, error } = await this.supabase
			.from("visitor_sessions")
			.select("*")
			.eq("session_id", sessionId)
			.single();

		if (error || !session) {
			return null;
		}

		return session;
	}

	async getSessionsInRange(
		startDate: Date,
		endDate: Date,
	): Promise<VisitorSession[]> {
		const { data: sessions, error } = await this.supabase
			.from("visitor_sessions")
			.select("*")
			.gte("start_time", startDate.toISOString())
			.lte("start_time", endDate.toISOString())
			.order("start_time", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch sessions: ${error.message}`);
		}

		return sessions || [];
	}

	async getUserSessions(userId: string, limit = 50): Promise<VisitorSession[]> {
		const { data: sessions, error } = await this.supabase
			.from("visitor_sessions")
			.select("*")
			.eq("user_id", userId)
			.order("start_time", { ascending: false })
			.limit(limit);

		if (error) {
			throw new Error(`Failed to fetch user sessions: ${error.message}`);
		}

		return sessions || [];
	}

	async isReturningVisitor(
		ip: string,
		userId?: string,
		anonymousId?: string,
	): Promise<boolean> {
		let query = this.supabase.from("visitor_sessions").select("id").limit(1);

		if (userId) {
			query = query.eq("user_id", userId);
		} else if (anonymousId) {
			query = query.eq("anonymous_id", anonymousId);
		} else {
			query = query.eq("ip_address", ip);
		}

		const { data, error } = await query;

		if (error) {
			console.error("Failed to check returning visitor:", error);
			return false;
		}

		return (data?.length || 0) > 0;
	}

	// Page View Management
	async createPageView(data: CreatePageView): Promise<PageView> {
		const { data: pageView, error } = await this.supabase
			.from("page_views")
			.insert(data)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create page view: ${error.message}`);
		}

		return pageView;
	}

	async getSessionPageViews(sessionId: string): Promise<PageView[]> {
		const { data: pageViews, error } = await this.supabase
			.from("page_views")
			.select("*")
			.eq("session_id", sessionId)
			.order("timestamp", { ascending: true });

		if (error) {
			throw new Error(`Failed to fetch page views: ${error.message}`);
		}

		return pageViews || [];
	}

	async getPageViewsInRange(
		startDate: Date,
		endDate: Date,
	): Promise<PageView[]> {
		const { data: pageViews, error } = await this.supabase
			.from("page_views")
			.select("*")
			.gte("timestamp", startDate.toISOString())
			.lte("timestamp", endDate.toISOString())
			.order("timestamp", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch page views: ${error.message}`);
		}

		return pageViews || [];
	}

	async updatePageView(
		id: string,
		updates: Partial<PageView>,
	): Promise<PageView | null> {
		const { data: pageView, error } = await this.supabase
			.from("page_views")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Failed to update page view:", error);
			return null;
		}

		return pageView;
	}

	// Interaction Management
	async createInteraction(
		data: CreateVisitorInteraction,
	): Promise<VisitorInteraction> {
		const { data: interaction, error } = await this.supabase
			.from("visitor_interactions")
			.insert(data)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create interaction: ${error.message}`);
		}

		return interaction;
	}

	async getSessionInteractions(
		sessionId: string,
	): Promise<VisitorInteraction[]> {
		const { data: interactions, error } = await this.supabase
			.from("visitor_interactions")
			.select("*")
			.eq("session_id", sessionId)
			.order("timestamp", { ascending: true });

		if (error) {
			throw new Error(`Failed to fetch interactions: ${error.message}`);
		}

		return interactions || [];
	}

	// Lead Management
	async createLead(data: CreateVisitorLead): Promise<VisitorLead> {
		const { data: lead, error } = await this.supabase
			.from("visitor_leads")
			.insert(data)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create lead: ${error.message}`);
		}

		return lead;
	}

	async updateLead(
		leadId: string,
		updates: UpdateVisitorLead,
	): Promise<VisitorLead | null> {
		const { data: lead, error } = await this.supabase
			.from("visitor_leads")
			.update({ ...updates, updated_at: new Date().toISOString() })
			.eq("id", leadId)
			.select()
			.single();

		if (error) {
			console.error("Failed to update lead:", error);
			return null;
		}

		return lead;
	}

	async getLead(leadId: string): Promise<VisitorLead | null> {
		const { data: lead, error } = await this.supabase
			.from("visitor_leads")
			.select("*")
			.eq("id", leadId)
			.single();

		if (error || !lead) {
			return null;
		}

		return lead;
	}

	async getLeadsInRange(
		startDate: Date,
		endDate: Date,
	): Promise<VisitorLead[]> {
		const { data: leads, error } = await this.supabase
			.from("visitor_leads")
			.select("*")
			.gte("created_at", startDate.toISOString())
			.lte("created_at", endDate.toISOString())
			.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch leads: ${error.message}`);
		}

		return leads || [];
	}

	async getLeadsByStatus(status: string): Promise<VisitorLead[]> {
		const { data: leads, error } = await this.supabase
			.from("visitor_leads")
			.select("*")
			.eq("status", status)
			.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch leads by status: ${error.message}`);
		}

		return leads || [];
	}

	async addTagToLead(leadId: string, tag: string): Promise<void> {
		const lead = await this.getLead(leadId);
		if (!lead) throw new Error("Lead not found");

		const currentTags = lead.tags || [];
		if (!currentTags.includes(tag)) {
			currentTags.push(tag);
			await this.updateLead(leadId, { tags: currentTags });
		}
	}

	async updateLeadScore(leadId: string, score: number): Promise<void> {
		await this.updateLead(leadId, { leadScore: score });
	}

	// Follow-up Rules Management
	async createFollowUpRule(data: CreateFollowUpRule): Promise<FollowUpRule> {
		const { data: rule, error } = await this.supabase
			.from("follow_up_rules")
			.insert({
				...data,
				execution_count: 0,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create follow-up rule: ${error.message}`);
		}

		return rule;
	}

	async updateFollowUpRule(
		ruleId: string,
		updates: Partial<FollowUpRule>,
	): Promise<FollowUpRule | null> {
		const { data: rule, error } = await this.supabase
			.from("follow_up_rules")
			.update({ ...updates, updated_at: new Date().toISOString() })
			.eq("id", ruleId)
			.select()
			.single();

		if (error) {
			console.error("Failed to update follow-up rule:", error);
			return null;
		}

		return rule;
	}

	async getFollowUpRules(): Promise<FollowUpRule[]> {
		const { data: rules, error } = await this.supabase
			.from("follow_up_rules")
			.select("*")
			.eq("is_active", true)
			.order("priority", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch follow-up rules: ${error.message}`);
		}

		return rules || [];
	}

	async getFollowUpRule(ruleId: string): Promise<FollowUpRule | null> {
		const { data: rule, error } = await this.supabase
			.from("follow_up_rules")
			.select("*")
			.eq("id", ruleId)
			.single();

		if (error || !rule) {
			return null;
		}

		return rule;
	}

	// Follow-up Execution Management
	async createFollowUpExecution(
		data: CreateFollowUpExecution,
	): Promise<FollowUpExecution> {
		const { data: execution, error } = await this.supabase
			.from("follow_up_executions")
			.insert(data)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create follow-up execution: ${error.message}`);
		}

		return execution;
	}

	async updateFollowUpExecution(
		executionId: string,
		updates: Partial<FollowUpExecution>,
	): Promise<FollowUpExecution | null> {
		const { data: execution, error } = await this.supabase
			.from("follow_up_executions")
			.update(updates)
			.eq("id", executionId)
			.select()
			.single();

		if (error) {
			console.error("Failed to update follow-up execution:", error);
			return null;
		}

		return execution;
	}

	async getFollowUpExecutions(ruleId: string): Promise<FollowUpExecution[]> {
		const { data: executions, error } = await this.supabase
			.from("follow_up_executions")
			.select("*")
			.eq("rule_id", ruleId)
			.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch follow-up executions: ${error.message}`);
		}

		return executions || [];
	}

	// Visitor Segments
	async createVisitorSegment(
		segment: Omit<VisitorSegment, "id" | "visitorCount" | "createdAt">,
	): Promise<VisitorSegment> {
		const { data: newSegment, error } = await this.supabase
			.from("visitor_segments")
			.insert({
				...segment,
				visitor_count: 0,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create visitor segment: ${error.message}`);
		}

		return newSegment;
	}

	async updateVisitorSegment(
		segmentId: string,
		updates: Partial<VisitorSegment>,
	): Promise<VisitorSegment | null> {
		const { data: segment, error } = await this.supabase
			.from("visitor_segments")
			.update({ ...updates, last_updated: new Date().toISOString() })
			.eq("id", segmentId)
			.select()
			.single();

		if (error) {
			console.error("Failed to update visitor segment:", error);
			return null;
		}

		return segment;
	}

	async getVisitorSegments(): Promise<VisitorSegment[]> {
		const { data: segments, error } = await this.supabase
			.from("visitor_segments")
			.select("*")
			.eq("is_active", true)
			.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch visitor segments: ${error.message}`);
		}

		return segments || [];
	}

	// Visitor Insights
	async createVisitorInsight(
		insight: Omit<VisitorInsight, "id" | "createdAt">,
	): Promise<VisitorInsight> {
		const { data: newInsight, error } = await this.supabase
			.from("visitor_insights")
			.insert(insight)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create visitor insight: ${error.message}`);
		}

		return newInsight;
	}

	async getSessionInsights(sessionId: string): Promise<VisitorInsight[]> {
		const { data: insights, error } = await this.supabase
			.from("visitor_insights")
			.select("*")
			.eq("session_id", sessionId)
			.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch session insights: ${error.message}`);
		}

		return insights || [];
	}

	// Analytics Queries
	async getVisitorAnalytics(
		startDate: Date,
		endDate: Date,
	): Promise<VisitorAnalytics> {
		const [sessions, pageViews, leads] = await Promise.all([
			this.getSessionsInRange(startDate, endDate),
			this.getPageViewsInRange(startDate, endDate),
			this.getLeadsInRange(startDate, endDate),
		]);

		const uniqueVisitors = new Set(
			sessions.map((s) => s.userId || s.anonymousId).filter(Boolean),
		).size;

		const averageSessionDuration =
			sessions.reduce((sum, s) => {
				return sum + (s.duration || 0);
			}, 0) / Math.max(sessions.length, 1);

		const bouncedSessions = sessions.filter((s) => s.pageViews <= 1).length;
		const bounceRate = (bouncedSessions / Math.max(sessions.length, 1)) * 100;

		const convertedSessions = sessions.filter((s) =>
			leads.some((l) => l.sessionId === s.sessionId),
		).length;
		const conversionRate =
			(convertedSessions / Math.max(sessions.length, 1)) * 100;

		const leadConversionRate =
			(leads.length / Math.max(sessions.length, 1)) * 100;

		// Calculate top pages
		const pageViewsByPath = pageViews.reduce(
			(acc, pv) => {
				acc[pv.path] = (acc[pv.path] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		const topPages = Object.entries(pageViewsByPath)
			.map(([path, views]) => ({
				path,
				views,
				conversions: leads.filter((l) => {
					const leadPageViews = pageViews.filter(
						(pv) => pv.sessionId === l.sessionId,
					);
					return leadPageViews.some((pv) => pv.path === path);
				}).length,
			}))
			.sort((a, b) => b.views - a.views)
			.slice(0, 10);

		// Calculate top sources
		const sessionsBySource = sessions.reduce(
			(acc, s) => {
				const source = s.utmSource || "direct";
				acc[source] = (acc[source] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		const topSources = Object.entries(sessionsBySource)
			.map(([source, sessionCount]) => ({
				source,
				sessions: sessionCount,
				conversions: leads.filter((l) => {
					const session = sessions.find((s) => s.sessionId === l.sessionId);
					return session && (session.utmSource || "direct") === source;
				}).length,
			}))
			.sort((a, b) => b.sessions - a.sessions)
			.slice(0, 10);

		// Calculate device breakdown
		const deviceCounts = sessions.reduce(
			(acc, s) => {
				acc[s.deviceType] = (acc[s.deviceType] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		const deviceBreakdown = Object.entries(deviceCounts).map(
			([device, count]) => ({
				device,
				percentage: (count / Math.max(sessions.length, 1)) * 100,
			}),
		);

		// Calculate geographic data
		const countryCounts = sessions.reduce(
			(acc, s) => {
				const country = s.country || "Unknown";
				acc[country] = (acc[country] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		const geographicData = Object.entries(countryCounts)
			.map(([country, sessionCount]) => ({ country, sessions: sessionCount }))
			.sort((a, b) => b.sessions - a.sessions)
			.slice(0, 10);

		// Calculate time series data (daily)
		const timeSeriesData = this.generateTimeSeriesData(
			sessions,
			leads,
			startDate,
			endDate,
		);

		return {
			totalSessions: sessions.length,
			uniqueVisitors,
			pageViews: pageViews.length,
			averageSessionDuration: averageSessionDuration / 1000, // Convert to seconds
			bounceRate,
			conversionRate,
			leadConversionRate,
			topPages,
			topSources,
			deviceBreakdown,
			geographicData,
			timeSeriesData,
		};
	}

	private generateTimeSeriesData(
		sessions: VisitorSession[],
		leads: VisitorLead[],
		startDate: Date,
		endDate: Date,
	): Array<{ date: string; sessions: number; conversions: number }> {
		const data: Array<{ date: string; sessions: number; conversions: number }> =
			[];
		const currentDate = new Date(startDate);

		while (currentDate <= endDate) {
			const dateStr = currentDate.toISOString().split("T")[0];
			const nextDate = new Date(currentDate);
			nextDate.setDate(nextDate.getDate() + 1);

			const sessionsOnDate = sessions.filter((s) => {
				const sessionDate = new Date(s.startTime);
				return sessionDate >= currentDate && sessionDate < nextDate;
			}).length;

			const conversionsOnDate = leads.filter((l) => {
				const leadDate = new Date(l.createdAt);
				return leadDate >= currentDate && leadDate < nextDate;
			}).length;

			data.push({
				date: dateStr,
				sessions: sessionsOnDate,
				conversions: conversionsOnDate,
			});

			currentDate.setDate(currentDate.getDate() + 1);
		}

		return data;
	}

	// Utility Methods
	async cleanupOldSessions(retentionDays = 90): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

		const { count, error } = await this.supabase
			.from("visitor_sessions")
			.delete()
			.lt("start_time", cutoffDate.toISOString());

		if (error) {
			throw new Error(`Failed to cleanup old sessions: ${error.message}`);
		}

		return count || 0;
	}

	async getActiveSessionsCount(): Promise<number> {
		const fiveMinutesAgo = new Date();
		fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

		const { count, error } = await this.supabase
			.from("visitor_sessions")
			.select("id", { count: "exact" })
			.gt("last_active_at", fiveMinutesAgo.toISOString())
			.is("end_time", null);

		if (error) {
			throw new Error(`Failed to get active sessions count: ${error.message}`);
		}

		return count || 0;
	}
}

export default VisitorTrackingRepository;
