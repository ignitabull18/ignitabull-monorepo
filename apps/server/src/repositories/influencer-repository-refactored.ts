/**
 * Influencer Marketing Repository (Refactored)
 * Example of using BaseRepository for database operations
 */

import type {
	CampaignStatus,
	CreateInfluencerCampaign,
	CreateInfluencerOutreach,
	CreateInfluencerProfile,
	InfluencerCampaign,
	InfluencerOutreach,
	InfluencerProfile,
	InfluencerStatus,
	PlatformType,
	UpdateInfluencerCampaign,
	UpdateInfluencerOutreach,
	UpdateInfluencerProfile,
} from "../../../packages/core/src/types/influencer-marketing";
import {
	BaseRepository,
	type PaginationOptions,
	type QueryFilters,
} from "./base";

// Separate repositories for each entity type
export class InfluencerProfileRepository extends BaseRepository<InfluencerProfile> {
	constructor() {
		super("influencer_profiles");
	}

	async createInfluencerProfile(
		data: CreateInfluencerProfile,
	): Promise<InfluencerProfile> {
		const insertData = {
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
		};

		const profile = await this.create(insertData);
		return this.transformInfluencerProfileFromDB(profile);
	}

	async updateInfluencerProfile(
		id: string,
		updates: UpdateInfluencerProfile,
	): Promise<InfluencerProfile | null> {
		const updateData: any = { ...updates };

		// Transform field names for database
		if (updates.lastContactedAt) {
			updateData.last_contacted_at = updates.lastContactedAt.toISOString();
			delete updateData.lastContactedAt;
		}

		const profile = await this.update(id, updateData);
		return this.transformInfluencerProfileFromDB(profile);
	}

	async getInfluencerProfile(id: string): Promise<InfluencerProfile | null> {
		const profile = await this.findById(id);
		return profile ? this.transformInfluencerProfileFromDB(profile) : null;
	}

	async getInfluencerProfiles(
		filters?: {
			status?: InfluencerStatus;
			category?: string;
			tier?: string;
			platform?: PlatformType;
			tags?: string[];
		},
		pagination?: PaginationOptions,
	) {
		const queryFilters: QueryFilters = {};

		if (filters?.status) queryFilters.status = filters.status;
		if (filters?.category) queryFilters.category = filters.category;
		if (filters?.tier) queryFilters.tier = filters.tier;
		if (filters?.tags && filters.tags.length > 0) {
			// For array contains, we need a custom query
			// This is a limitation we'd need to address in BaseRepository
			queryFilters.tags = filters.tags;
		}

		const result = await this.findPaginated(queryFilters, pagination);

		return {
			...result,
			data: result.data.map((p) => this.transformInfluencerProfileFromDB(p)),
		};
	}

	async searchInfluencers(query: string): Promise<InfluencerProfile[]> {
		// Custom search implementation
		const { data, error } = await this.supabase
			.from(this.tableName)
			.select()
			.or(
				`name.ilike.%${query}%,handle.ilike.%${query}%,email.ilike.%${query}%`,
			)
			.limit(20);

		if (error) {
			throw new Error(`Failed to search influencers: ${error.message}`);
		}

		return data.map((p) => this.transformInfluencerProfileFromDB(p));
	}

	async getInfluencersByPlatform(
		platform: PlatformType,
	): Promise<InfluencerProfile[]> {
		const { data, error } = await this.supabase
			.from(this.tableName)
			.select()
			.contains("platforms", [{ platform }]);

		if (error) {
			throw new Error(
				`Failed to get influencers by platform: ${error.message}`,
			);
		}

		return data.map((p) => this.transformInfluencerProfileFromDB(p));
	}

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
			status: data.status,
			location: data.location,
			demographics: data.demographics,
			rates: data.rates,
			notes: data.notes,
			tags: data.tags || [],
			lastContactedAt: data.last_contacted_at
				? new Date(data.last_contacted_at)
				: undefined,
			discoveredAt: new Date(data.discovered_at),
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}
}

export class InfluencerCampaignRepository extends BaseRepository<InfluencerCampaign> {
	constructor() {
		super("influencer_campaigns");
	}

	async createCampaign(
		data: CreateInfluencerCampaign,
	): Promise<InfluencerCampaign> {
		const insertData = {
			name: data.name,
			brand: data.brand,
			type: data.type,
			status: "draft",
			goals: data.goals,
			requirements: data.requirements,
			budget: data.budget,
			start_date: data.startDate?.toISOString(),
			end_date: data.endDate?.toISOString(),
			hashtags: data.hashtags,
			content_guidelines: data.contentGuidelines,
			compensation: data.compensation,
			deliverables: data.deliverables,
			terms: data.terms,
			notes: data.notes,
		};

		const campaign = await this.create(insertData);
		return this.transformCampaignFromDB(campaign);
	}

	async updateCampaign(
		id: string,
		updates: UpdateInfluencerCampaign,
	): Promise<InfluencerCampaign | null> {
		const updateData: any = { ...updates };

		// Transform date fields
		if (updates.startDate) {
			updateData.start_date = updates.startDate.toISOString();
			delete updateData.startDate;
		}
		if (updates.endDate) {
			updateData.end_date = updates.endDate.toISOString();
			delete updateData.endDate;
		}
		if (updates.contentGuidelines) {
			updateData.content_guidelines = updates.contentGuidelines;
			delete updateData.contentGuidelines;
		}

		const campaign = await this.update(id, updateData);
		return this.transformCampaignFromDB(campaign);
	}

	async getCampaign(id: string): Promise<InfluencerCampaign | null> {
		const campaign = await this.findById(id);
		return campaign ? this.transformCampaignFromDB(campaign) : null;
	}

	async getCampaigns(
		filters?: {
			status?: CampaignStatus;
			brand?: string;
			type?: string;
		},
		pagination?: PaginationOptions,
	) {
		const queryFilters: QueryFilters = {};

		if (filters?.status) queryFilters.status = filters.status;
		if (filters?.brand) queryFilters.brand = filters.brand;
		if (filters?.type) queryFilters.type = filters.type;

		const result = await this.findPaginated(queryFilters, pagination);

		return {
			...result,
			data: result.data.map((c) => this.transformCampaignFromDB(c)),
		};
	}

	private transformCampaignFromDB(data: any): InfluencerCampaign {
		return {
			id: data.id,
			name: data.name,
			brand: data.brand,
			type: data.type,
			status: data.status,
			goals: data.goals || [],
			requirements: data.requirements || [],
			budget: data.budget,
			startDate: data.start_date ? new Date(data.start_date) : undefined,
			endDate: data.end_date ? new Date(data.end_date) : undefined,
			hashtags: data.hashtags || [],
			contentGuidelines: data.content_guidelines,
			compensation: data.compensation,
			deliverables: data.deliverables || [],
			terms: data.terms,
			notes: data.notes,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}
}

export class InfluencerOutreachRepository extends BaseRepository<InfluencerOutreach> {
	constructor() {
		super("influencer_outreach");
	}

	async createOutreach(
		data: CreateInfluencerOutreach,
	): Promise<InfluencerOutreach> {
		const insertData = {
			influencer_id: data.influencerId,
			campaign_id: data.campaignId,
			type: data.type,
			channel: data.channel,
			status: "pending",
			subject: data.subject,
			message: data.message,
			scheduled_at: data.scheduledAt?.toISOString(),
			template_used: data.templateUsed,
			personalization: data.personalization,
			attachments: data.attachments,
			notes: data.notes,
		};

		const outreach = await this.create(insertData);
		return this.transformOutreachFromDB(outreach);
	}

	async updateOutreach(
		id: string,
		updates: UpdateInfluencerOutreach,
	): Promise<InfluencerOutreach | null> {
		const updateData: any = { ...updates };

		// Transform date fields
		if (updates.scheduledAt) {
			updateData.scheduled_at = updates.scheduledAt.toISOString();
			delete updateData.scheduledAt;
		}
		if (updates.sentAt) {
			updateData.sent_at = updates.sentAt.toISOString();
			delete updateData.sentAt;
		}
		if (updates.respondedAt) {
			updateData.responded_at = updates.respondedAt.toISOString();
			delete updateData.respondedAt;
		}
		if (updates.templateUsed !== undefined) {
			updateData.template_used = updates.templateUsed;
			delete updateData.templateUsed;
		}

		const outreach = await this.update(id, updateData);
		return this.transformOutreachFromDB(outreach);
	}

	async getOutreachByInfluencer(
		influencerId: string,
	): Promise<InfluencerOutreach[]> {
		const outreaches = await this.findMany({ influencer_id: influencerId });
		return outreaches.map((o) => this.transformOutreachFromDB(o));
	}

	async getOutreachByCampaign(
		campaignId: string,
	): Promise<InfluencerOutreach[]> {
		const outreaches = await this.findMany({ campaign_id: campaignId });
		return outreaches.map((o) => this.transformOutreachFromDB(o));
	}

	private transformOutreachFromDB(data: any): InfluencerOutreach {
		return {
			id: data.id,
			influencerId: data.influencer_id,
			campaignId: data.campaign_id,
			type: data.type,
			channel: data.channel,
			status: data.status,
			subject: data.subject,
			message: data.message,
			scheduledAt: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
			sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
			respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
			response: data.response,
			templateUsed: data.template_used,
			personalization: data.personalization,
			attachments: data.attachments || [],
			notes: data.notes,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}
}

// Additional repository classes for contracts, relationships, etc. would follow the same pattern

// Main repository that composes all sub-repositories
export class InfluencerRepository {
	public profiles: InfluencerProfileRepository;
	public campaigns: InfluencerCampaignRepository;
	public outreach: InfluencerOutreachRepository;

	constructor() {
		this.profiles = new InfluencerProfileRepository();
		this.campaigns = new InfluencerCampaignRepository();
		this.outreach = new InfluencerOutreachRepository();
	}
}
