/**
 * Influencer Marketing Repository
 * Database operations for influencer CRM and campaign management
 */

import { createClient } from "@supabase/supabase-js";
import type {
	CampaignParticipant,
	CampaignStatus,
	ContractStatus,
	CreateInfluencerCampaign,
	CreateInfluencerContract,
	CreateInfluencerOutreach,
	CreateInfluencerProfile,
	InfluencerCampaign,
	InfluencerContract,
	InfluencerMetrics,
	InfluencerOutreach,
	InfluencerProfile,
	InfluencerStatus,
	OutreachStatus,
	PlatformType,
	UpdateInfluencerCampaign,
	UpdateInfluencerContract,
	UpdateInfluencerOutreach,
	UpdateInfluencerProfile,
} from "../../../packages/core/src/types/influencer-marketing";

export class InfluencerRepository {
	private supabase: ReturnType<typeof createClient>;

	constructor() {
		const supabaseUrl = process.env.SUPABASE_URL!;
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
		this.supabase = createClient(supabaseUrl, supabaseKey);
	}

	// Influencer Profile Management
	async createInfluencerProfile(
		data: CreateInfluencerProfile,
	): Promise<InfluencerProfile> {
		const { data: profile, error } = await this.supabase
			.from("influencer_profiles")
			.insert({
				name: data.name,
				handle: data.handle,
				email: data.email,
				phone: data.phone,
				platforms: data.platforms,
				category: data.category,
				tier: data.tier,
				location: data.location,
				demographics: data.demographics,
				rates: data.rates,
				notes: data.notes,
				tags: data.tags,
				status: "prospect",
				discovered_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create influencer profile: ${error.message}`);
		}

		return this.transformInfluencerProfileFromDB(profile);
	}

	async updateInfluencerProfile(
		id: string,
		updates: UpdateInfluencerProfile,
	): Promise<InfluencerProfile | null> {
		const updateData: any = { ...updates };

		// Transform field names for database
		if (updates.lastContactedAt)
			updateData.last_contacted_at = updates.lastContactedAt.toISOString();

		// Remove original camelCase fields
		delete updateData.lastContactedAt;

		const { data: profile, error } = await this.supabase
			.from("influencer_profiles")
			.update({ ...updateData, updated_at: new Date().toISOString() })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Failed to update influencer profile:", error);
			return null;
		}

		return this.transformInfluencerProfileFromDB(profile);
	}

	async getInfluencerProfile(id: string): Promise<InfluencerProfile | null> {
		const { data: profile, error } = await this.supabase
			.from("influencer_profiles")
			.select("*")
			.eq("id", id)
			.single();

		if (error || !profile) {
			return null;
		}

		return this.transformInfluencerProfileFromDB(profile);
	}

	async getInfluencerProfiles(filters?: {
		status?: InfluencerStatus;
		category?: string;
		tier?: string;
		platforms?: PlatformType[];
		tags?: string[];
		search?: string;
		limit?: number;
		offset?: number;
	}): Promise<InfluencerProfile[]> {
		let query = this.supabase.from("influencer_profiles").select("*");

		if (filters?.status) {
			query = query.eq("status", filters.status);
		}

		if (filters?.category) {
			query = query.eq("category", filters.category);
		}

		if (filters?.tier) {
			query = query.eq("tier", filters.tier);
		}

		if (filters?.platforms && filters.platforms.length > 0) {
			// Filter by platforms in JSONB array
			query = query.or(
				filters.platforms
					.map((platform) => `platforms.@>.${JSON.stringify([{ platform }])}`)
					.join(","),
			);
		}

		if (filters?.tags && filters.tags.length > 0) {
			query = query.overlaps("tags", filters.tags);
		}

		if (filters?.search) {
			query = query.or(
				`name.ilike.%${filters.search}%,handle.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
			);
		}

		if (filters?.limit) {
			query = query.limit(filters.limit);
		}

		if (filters?.offset) {
			query = query.range(
				filters.offset,
				filters.offset + (filters.limit || 50) - 1,
			);
		}

		const { data: profiles, error } = await query.order("created_at", {
			ascending: false,
		});

		if (error) {
			throw new Error(`Failed to fetch influencer profiles: ${error.message}`);
		}

		return (profiles || []).map(this.transformInfluencerProfileFromDB);
	}

	async updateInfluencerMetrics(
		id: string,
		metrics: InfluencerMetrics,
	): Promise<void> {
		const { error } = await this.supabase
			.from("influencer_profiles")
			.update({
				metrics,
				updated_at: new Date().toISOString(),
			})
			.eq("id", id);

		if (error) {
			throw new Error(`Failed to update influencer metrics: ${error.message}`);
		}
	}

	// Campaign Management
	async createInfluencerCampaign(
		data: CreateInfluencerCampaign,
	): Promise<InfluencerCampaign> {
		const { data: campaign, error } = await this.supabase
			.from("influencer_campaigns")
			.insert({
				name: data.name,
				description: data.description,
				type: data.type,
				status: "draft",
				objectives: data.objectives,
				budget: data.budget,
				timeline: data.timeline,
				target_audience: data.targetAudience,
				deliverables: data.deliverables,
				notes: data.notes,
				tags: data.tags,
				created_by: "system", // In real app, this would be the user ID
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create influencer campaign: ${error.message}`);
		}

		return this.transformInfluencerCampaignFromDB(campaign);
	}

	async updateInfluencerCampaign(
		id: string,
		updates: UpdateInfluencerCampaign,
	): Promise<InfluencerCampaign | null> {
		const updateData: any = { ...updates };

		// Transform field names for database
		if (updates.targetAudience)
			updateData.target_audience = updates.targetAudience;

		// Remove original camelCase fields
		delete updateData.targetAudience;

		const { data: campaign, error } = await this.supabase
			.from("influencer_campaigns")
			.update({ ...updateData, updated_at: new Date().toISOString() })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Failed to update influencer campaign:", error);
			return null;
		}

		return this.transformInfluencerCampaignFromDB(campaign);
	}

	async getInfluencerCampaign(id: string): Promise<InfluencerCampaign | null> {
		const { data: campaign, error } = await this.supabase
			.from("influencer_campaigns")
			.select("*")
			.eq("id", id)
			.single();

		if (error || !campaign) {
			return null;
		}

		return this.transformInfluencerCampaignFromDB(campaign);
	}

	async getInfluencerCampaigns(filters?: {
		status?: CampaignStatus;
		type?: string;
		createdBy?: string;
		search?: string;
		limit?: number;
		offset?: number;
	}): Promise<InfluencerCampaign[]> {
		let query = this.supabase.from("influencer_campaigns").select("*");

		if (filters?.status) {
			query = query.eq("status", filters.status);
		}

		if (filters?.type) {
			query = query.eq("type", filters.type);
		}

		if (filters?.createdBy) {
			query = query.eq("created_by", filters.createdBy);
		}

		if (filters?.search) {
			query = query.or(
				`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
			);
		}

		if (filters?.limit) {
			query = query.limit(filters.limit);
		}

		if (filters?.offset) {
			query = query.range(
				filters.offset,
				filters.offset + (filters.limit || 50) - 1,
			);
		}

		const { data: campaigns, error } = await query.order("created_at", {
			ascending: false,
		});

		if (error) {
			throw new Error(`Failed to fetch influencer campaigns: ${error.message}`);
		}

		return (campaigns || []).map(this.transformInfluencerCampaignFromDB);
	}

	async addCampaignParticipant(
		campaignId: string,
		influencerId: string,
		agreedRate: number,
	): Promise<CampaignParticipant> {
		const participant: CampaignParticipant = {
			id: crypto.randomUUID(),
			influencerId,
			influencerName: "", // Will be populated from influencer profile
			status: "invited",
			agreedRate,
			deliverables: [],
			performance: {
				totalReach: 0,
				totalImpressions: 0,
				totalEngagements: 0,
				clicks: 0,
				conversions: 0,
				revenue: 0,
				roi: 0,
				engagementRate: 0,
				lastUpdated: new Date(),
			},
			communications: [],
			contractStatus: "pending",
			joinedAt: new Date(),
		};

		// Get current participants
		const { data: campaign } = await this.supabase
			.from("influencer_campaigns")
			.select("participants")
			.eq("id", campaignId)
			.single();

		const participants = campaign?.participants || [];
		participants.push(participant);

		const { error } = await this.supabase
			.from("influencer_campaigns")
			.update({
				participants,
				updated_at: new Date().toISOString(),
			})
			.eq("id", campaignId);

		if (error) {
			throw new Error(`Failed to add campaign participant: ${error.message}`);
		}

		return participant;
	}

	// Outreach Management
	async createInfluencerOutreach(
		data: CreateInfluencerOutreach,
	): Promise<InfluencerOutreach> {
		const { data: outreach, error } = await this.supabase
			.from("influencer_outreach")
			.insert({
				influencer_id: data.influencerId,
				campaign_id: data.campaignId,
				type: data.type,
				status: "draft",
				subject: data.subject,
				message: data.message,
				template: data.template,
				personalizations: data.personalizations,
				scheduled_at: data.scheduledAt?.toISOString(),
				outcome: "no_response",
				metrics: { opens: 0, clicks: 0, replies: 0 },
				created_by: "system", // In real app, this would be the user ID
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create influencer outreach: ${error.message}`);
		}

		return this.transformInfluencerOutreachFromDB(outreach);
	}

	async updateInfluencerOutreach(
		id: string,
		updates: UpdateInfluencerOutreach,
	): Promise<InfluencerOutreach | null> {
		const updateData: any = { ...updates };

		// Transform field names for database
		if (updates.scheduledAt)
			updateData.scheduled_at = updates.scheduledAt.toISOString();
		if (updates.followUpScheduled)
			updateData.follow_up_scheduled = updates.followUpScheduled.toISOString();

		// Remove original camelCase fields
		delete updateData.scheduledAt;
		delete updateData.followUpScheduled;

		const { data: outreach, error } = await this.supabase
			.from("influencer_outreach")
			.update({ ...updateData, updated_at: new Date().toISOString() })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Failed to update influencer outreach:", error);
			return null;
		}

		return this.transformInfluencerOutreachFromDB(outreach);
	}

	async getInfluencerOutreach(filters?: {
		influencerId?: string;
		campaignId?: string;
		status?: OutreachStatus;
		type?: string;
		limit?: number;
		offset?: number;
	}): Promise<InfluencerOutreach[]> {
		let query = this.supabase.from("influencer_outreach").select("*");

		if (filters?.influencerId) {
			query = query.eq("influencer_id", filters.influencerId);
		}

		if (filters?.campaignId) {
			query = query.eq("campaign_id", filters.campaignId);
		}

		if (filters?.status) {
			query = query.eq("status", filters.status);
		}

		if (filters?.type) {
			query = query.eq("type", filters.type);
		}

		if (filters?.limit) {
			query = query.limit(filters.limit);
		}

		if (filters?.offset) {
			query = query.range(
				filters.offset,
				filters.offset + (filters.limit || 50) - 1,
			);
		}

		const { data: outreach, error } = await query.order("created_at", {
			ascending: false,
		});

		if (error) {
			throw new Error(`Failed to fetch influencer outreach: ${error.message}`);
		}

		return (outreach || []).map(this.transformInfluencerOutreachFromDB);
	}

	// Contract Management
	async createInfluencerContract(
		data: CreateInfluencerContract,
	): Promise<InfluencerContract> {
		const { data: contract, error } = await this.supabase
			.from("influencer_contracts")
			.insert({
				influencer_id: data.influencerId,
				campaign_id: data.campaignId,
				type: data.type,
				status: "draft",
				terms: data.terms,
				compensation: data.compensation,
				deliverables: data.deliverables,
				exclusivity: data.exclusivity,
				compliance: data.compliance,
				signatures: [],
				effective_date: data.effectiveDate.toISOString(),
				expiration_date: data.expirationDate?.toISOString(),
				auto_renewal: data.autoRenewal,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create influencer contract: ${error.message}`);
		}

		return this.transformInfluencerContractFromDB(contract);
	}

	async updateInfluencerContract(
		id: string,
		updates: UpdateInfluencerContract,
	): Promise<InfluencerContract | null> {
		const updateData: any = { ...updates };

		// Transform field names for database
		if (updates.effectiveDate)
			updateData.effective_date = updates.effectiveDate.toISOString();
		if (updates.expirationDate)
			updateData.expiration_date = updates.expirationDate.toISOString();
		if (updates.autoRenewal !== undefined)
			updateData.auto_renewal = updates.autoRenewal;

		// Remove original camelCase fields
		delete updateData.effectiveDate;
		delete updateData.expirationDate;
		delete updateData.autoRenewal;

		const { data: contract, error } = await this.supabase
			.from("influencer_contracts")
			.update({ ...updateData, updated_at: new Date().toISOString() })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Failed to update influencer contract:", error);
			return null;
		}

		return this.transformInfluencerContractFromDB(contract);
	}

	async getInfluencerContracts(filters?: {
		influencerId?: string;
		campaignId?: string;
		status?: ContractStatus;
		type?: string;
		limit?: number;
		offset?: number;
	}): Promise<InfluencerContract[]> {
		let query = this.supabase.from("influencer_contracts").select("*");

		if (filters?.influencerId) {
			query = query.eq("influencer_id", filters.influencerId);
		}

		if (filters?.campaignId) {
			query = query.eq("campaign_id", filters.campaignId);
		}

		if (filters?.status) {
			query = query.eq("status", filters.status);
		}

		if (filters?.type) {
			query = query.eq("type", filters.type);
		}

		if (filters?.limit) {
			query = query.limit(filters.limit);
		}

		if (filters?.offset) {
			query = query.range(
				filters.offset,
				filters.offset + (filters.limit || 50) - 1,
			);
		}

		const { data: contracts, error } = await query.order("created_at", {
			ascending: false,
		});

		if (error) {
			throw new Error(`Failed to fetch influencer contracts: ${error.message}`);
		}

		return (contracts || []).map(this.transformInfluencerContractFromDB);
	}

	// Analytics Queries
	async getInfluencerAnalytics(
		_influencerId: string,
		_startDate: Date,
		_endDate: Date,
	): Promise<{
		campaignCount: number;
		totalReach: number;
		totalEngagements: number;
		avgEngagementRate: number;
		totalEarnings: number;
		avgRating: number;
	}> {
		// This would typically involve complex queries across multiple tables
		// For now, returning mock data
		return {
			campaignCount: 5,
			totalReach: 250000,
			totalEngagements: 12500,
			avgEngagementRate: 0.05,
			totalEarnings: 5000,
			avgRating: 4.2,
		};
	}

	async getCampaignAnalytics(_campaignId: string): Promise<{
		participantCount: number;
		totalReach: number;
		totalEngagements: number;
		totalSpent: number;
		completionRate: number;
		avgDeliveryTime: number;
	}> {
		// This would typically involve complex queries
		// For now, returning mock data
		return {
			participantCount: 8,
			totalReach: 400000,
			totalEngagements: 20000,
			totalSpent: 12000,
			completionRate: 0.875,
			avgDeliveryTime: 3.2,
		};
	}

	async getTopPerformingInfluencers(
		_limit,
		_period: { startDate: Date; endDate: Date },
	): Promise<
		Array<{
			influencerId: string;
			name: string;
			handle: string;
			totalReach: number;
			avgEngagementRate: number;
			campaignCount: number;
			totalEarnings: number;
			rating: number;
		}>
	> {
		// This would involve complex analytics queries
		// For now, returning mock data
		return [];
	}

	// Transform functions to convert database fields to TypeScript interfaces
	private transformInfluencerProfileFromDB(data: any): InfluencerProfile {
		return {
			id: data.id,
			name: data.name,
			handle: data.handle,
			email: data.email,
			phone: data.phone,
			platforms: data.platforms || [],
			category: data.category,
			tier: data.tier,
			location: data.location || {},
			demographics: data.demographics || {},
			metrics: data.metrics || {
				totalFollowers: 0,
				totalReach: 0,
				avgEngagementRate: 0,
				avgViews: 0,
				avgLikes: 0,
				avgComments: 0,
				avgShares: 0,
				audienceGrowthRate: 0,
				brandMentions: 0,
				lastUpdated: new Date(),
			},
			rates: data.rates || {
				negotiable: true,
				currency: "USD",
				lastUpdated: new Date(),
			},
			compliance: data.compliance || {
				hasContract: false,
				ftcCompliant: false,
				exclusivityAgreements: [],
				lastComplianceCheck: new Date(),
			},
			notes: data.notes,
			tags: data.tags || [],
			status: data.status,
			discoveredAt: new Date(data.discovered_at),
			lastContactedAt: data.last_contacted_at
				? new Date(data.last_contacted_at)
				: undefined,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}

	private transformInfluencerCampaignFromDB(data: any): InfluencerCampaign {
		return {
			id: data.id,
			name: data.name,
			description: data.description,
			type: data.type,
			status: data.status,
			objectives: data.objectives || [],
			budget: data.budget || {
				total: 0,
				allocated: 0,
				spent: 0,
				currency: "USD",
			},
			timeline: {
				startDate: new Date(data.timeline?.startDate || data.created_at),
				endDate: new Date(data.timeline?.endDate || data.created_at),
				createdAt: new Date(data.created_at),
			},
			targetAudience: data.target_audience || {
				demographics: [],
				interests: [],
				locations: [],
				platforms: [],
			},
			deliverables: data.deliverables || [],
			participants: data.participants || [],
			metrics: data.metrics || {
				totalReach: 0,
				totalImpressions: 0,
				totalEngagements: 0,
				totalClicks: 0,
				totalConversions: 0,
				totalRevenue: 0,
				avgEngagementRate: 0,
				avgCPM: 0,
				avgCPC: 0,
				avgCPA: 0,
				roi: 0,
				participantCount: 0,
				completionRate: 0,
				lastUpdated: new Date(),
			},
			assets: data.assets || [],
			approvalWorkflow: data.approval_workflow || [],
			notes: data.notes,
			tags: data.tags || [],
			createdBy: data.created_by,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}

	private transformInfluencerOutreachFromDB(data: any): InfluencerOutreach {
		return {
			id: data.id,
			influencerId: data.influencer_id,
			campaignId: data.campaign_id,
			type: data.type,
			status: data.status,
			subject: data.subject,
			message: data.message,
			template: data.template,
			personalizations: data.personalizations || {},
			scheduledAt: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
			sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
			openedAt: data.opened_at ? new Date(data.opened_at) : undefined,
			repliedAt: data.replied_at ? new Date(data.replied_at) : undefined,
			response: data.response,
			followUpScheduled: data.follow_up_scheduled
				? new Date(data.follow_up_scheduled)
				: undefined,
			outcome: data.outcome,
			metrics: data.metrics || { opens: 0, clicks: 0, replies: 0 },
			createdBy: data.created_by,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}

	private transformInfluencerContractFromDB(data: any): InfluencerContract {
		return {
			id: data.id,
			influencerId: data.influencer_id,
			campaignId: data.campaign_id,
			type: data.type,
			status: data.status,
			terms: data.terms || {},
			compensation: data.compensation || {},
			deliverables: data.deliverables || [],
			exclusivity: data.exclusivity || [],
			compliance: data.compliance || [],
			signatures: data.signatures || [],
			effectiveDate: new Date(data.effective_date),
			expirationDate: data.expiration_date
				? new Date(data.expiration_date)
				: undefined,
			autoRenewal: data.auto_renewal || false,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}
}

export default InfluencerRepository;
