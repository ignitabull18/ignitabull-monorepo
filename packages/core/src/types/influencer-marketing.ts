/**
 * Influencer Marketing CRM Types
 * Comprehensive type definitions for influencer relationship management
 */

export interface InfluencerProfile {
	id: string;
	name: string;
	handle: string;
	email?: string;
	phone?: string;
	platforms: SocialPlatform[];
	category: InfluencerCategory;
	tier: InfluencerTier;
	location: {
		country: string;
		city?: string;
		timezone?: string;
	};
	demographics: {
		ageRange?: string;
		gender?: string;
		interests: string[];
	};
	metrics: InfluencerMetrics;
	rates: InfluencerRates;
	compliance: ComplianceInfo;
	notes?: string;
	tags: string[];
	status: InfluencerStatus;
	discoveredAt: Date;
	lastContactedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface SocialPlatform {
	platform: PlatformType;
	handle: string;
	url: string;
	verified: boolean;
	followers: number;
	following: number;
	posts: number;
	engagementRate: number;
	averageLikes: number;
	averageComments: number;
	lastUpdated: Date;
}

export interface InfluencerMetrics {
	totalFollowers: number;
	totalReach: number;
	avgEngagementRate: number;
	avgViews: number;
	avgLikes: number;
	avgComments: number;
	avgShares: number;
	audienceGrowthRate: number;
	brandMentions: number;
	lastUpdated: Date;
}

export interface InfluencerRates {
	postRate?: number;
	storyRate?: number;
	reelRate?: number;
	videoRate?: number;
	packageDeals?: RatePackage[];
	negotiable: boolean;
	currency: string;
	lastUpdated: Date;
}

export interface RatePackage {
	name: string;
	description: string;
	price: number;
	deliverables: string[];
	timeline: string;
}

export interface ComplianceInfo {
	hasContract: boolean;
	contractExpiresAt?: Date;
	ftcCompliant: boolean;
	exclusivityAgreements: string[];
	lastComplianceCheck: Date;
}

export interface InfluencerCampaign {
	id: string;
	name: string;
	description: string;
	type: CampaignType;
	status: CampaignStatus;
	objectives: CampaignObjective[];
	budget: {
		total: number;
		allocated: number;
		spent: number;
		currency: string;
	};
	timeline: {
		startDate: Date;
		endDate: Date;
		createdAt: Date;
	};
	targetAudience: {
		demographics: string[];
		interests: string[];
		locations: string[];
		platforms: PlatformType[];
	};
	deliverables: CampaignDeliverable[];
	participants: CampaignParticipant[];
	metrics: CampaignMetrics;
	assets: CampaignAsset[];
	approvalWorkflow: ApprovalStep[];
	notes?: string;
	tags: string[];
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface CampaignDeliverable {
	id: string;
	type: DeliverableType;
	platform: PlatformType;
	description: string;
	requirements: string[];
	dueDate: Date;
	status: DeliverableStatus;
	submittedAt?: Date;
	approvedAt?: Date;
	rejectedAt?: Date;
	feedback?: string;
}

export interface CampaignParticipant {
	id: string;
	influencerId: string;
	influencerName: string;
	status: ParticipantStatus;
	agreedRate: number;
	deliverables: string[]; // deliverable IDs
	performance: ParticipantPerformance;
	communications: Communication[];
	contractStatus: ContractStatus;
	joinedAt: Date;
	completedAt?: Date;
}

export interface ParticipantPerformance {
	totalReach: number;
	totalImpressions: number;
	totalEngagements: number;
	clicks: number;
	conversions: number;
	revenue: number;
	roi: number;
	engagementRate: number;
	lastUpdated: Date;
}

export interface Communication {
	id: string;
	type: CommunicationType;
	direction: "inbound" | "outbound";
	subject?: string;
	message: string;
	attachments: string[];
	status: CommunicationStatus;
	sentAt: Date;
	readAt?: Date;
	respondedAt?: Date;
}

export interface CampaignMetrics {
	totalReach: number;
	totalImpressions: number;
	totalEngagements: number;
	totalClicks: number;
	totalConversions: number;
	totalRevenue: number;
	avgEngagementRate: number;
	avgCPM: number;
	avgCPC: number;
	avgCPA: number;
	roi: number;
	participantCount: number;
	completionRate: number;
	lastUpdated: Date;
}

export interface CampaignAsset {
	id: string;
	name: string;
	type: AssetType;
	url: string;
	description?: string;
	tags: string[];
	uploadedBy: string;
	uploadedAt: Date;
}

export interface ApprovalStep {
	id: string;
	name: string;
	description: string;
	approver: string;
	required: boolean;
	order: number;
	status: ApprovalStatus;
	submittedAt?: Date;
	reviewedAt?: Date;
	notes?: string;
}

export interface InfluencerOutreach {
	id: string;
	influencerId: string;
	campaignId?: string;
	type: OutreachType;
	status: OutreachStatus;
	subject: string;
	message: string;
	template?: string;
	personalizations: Record<string, string>;
	scheduledAt?: Date;
	sentAt?: Date;
	openedAt?: Date;
	repliedAt?: Date;
	response?: string;
	followUpScheduled?: Date;
	outcome: OutreachOutcome;
	metrics: {
		opens: number;
		clicks: number;
		replies: number;
	};
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface InfluencerRelationship {
	id: string;
	influencerId: string;
	relationshipScore: number;
	tier: RelationshipTier;
	lastInteraction: Date;
	totalCampaigns: number;
	totalSpent: number;
	avgPerformance: number;
	preferredContact: ContactMethod;
	exclusivityStatus: ExclusivityStatus;
	renewalDate?: Date;
	history: RelationshipEvent[];
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface RelationshipEvent {
	id: string;
	type: EventType;
	description: string;
	impact: EventImpact;
	date: Date;
	metadata?: Record<string, any>;
}

export interface InfluencerContract {
	id: string;
	influencerId: string;
	campaignId?: string;
	type: ContractType;
	status: ContractStatus;
	terms: ContractTerms;
	compensation: ContractCompensation;
	deliverables: ContractDeliverable[];
	exclusivity: ExclusivityClause[];
	compliance: ComplianceClause[];
	signatures: ContractSignature[];
	effectiveDate: Date;
	expirationDate?: Date;
	autoRenewal: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ContractTerms {
	duration: string;
	territory: string[];
	platforms: PlatformType[];
	usage: UsageRights;
	cancellation: CancellationTerms;
	liability: LiabilityTerms;
}

export interface ContractCompensation {
	type: CompensationType;
	amount: number;
	currency: string;
	paymentSchedule: PaymentSchedule;
	bonuses: PerformanceBonus[];
	expenses: ExpensePolicy;
}

export interface ContractDeliverable {
	description: string;
	quantity: number;
	timeline: string;
	specifications: string[];
	revisions: number;
}

export interface ExclusivityClause {
	type: ExclusivityType;
	scope: string[];
	duration: string;
	exceptions: string[];
}

export interface ComplianceClause {
	type: ComplianceType;
	requirements: string[];
	penalties: string[];
}

export interface ContractSignature {
	signatory: string;
	role: string;
	signedAt: Date;
	ipAddress: string;
	method: SignatureMethod;
}

export interface InfluencerAnalytics {
	influencerId: string;
	period: {
		startDate: Date;
		endDate: Date;
	};
	performance: {
		totalCampaigns: number;
		totalReach: number;
		totalEngagements: number;
		avgEngagementRate: number;
		totalRevenue: number;
		avgROI: number;
	};
	audience: {
		demographics: DemographicBreakdown;
		interests: InterestBreakdown;
		locations: LocationBreakdown;
	};
	contentPerformance: ContentPerformanceMetrics[];
	growth: GrowthMetrics;
	competitiveAnalysis: CompetitiveInsights;
	recommendations: string[];
	lastUpdated: Date;
}

export interface DemographicBreakdown {
	age: Record<string, number>;
	gender: Record<string, number>;
	income: Record<string, number>;
}

export interface InterestBreakdown {
	categories: Record<string, number>;
	brands: Record<string, number>;
	topics: Record<string, number>;
}

export interface LocationBreakdown {
	countries: Record<string, number>;
	cities: Record<string, number>;
	timezones: Record<string, number>;
}

export interface ContentPerformanceMetrics {
	platform: PlatformType;
	contentType: ContentType;
	avgReach: number;
	avgEngagements: number;
	avgLikes: number;
	avgComments: number;
	avgShares: number;
	topPerformingPosts: string[];
}

export interface GrowthMetrics {
	followerGrowth: TimeSeriesData[];
	engagementGrowth: TimeSeriesData[];
	reachGrowth: TimeSeriesData[];
}

export interface TimeSeriesData {
	date: Date;
	value: number;
	change: number;
	changePercent: number;
}

export interface CompetitiveInsights {
	similarInfluencers: string[];
	marketPosition: string;
	strengths: string[];
	opportunities: string[];
	threats: string[];
}

// Create Types
export interface CreateInfluencerProfile {
	name: string;
	handle: string;
	email?: string;
	phone?: string;
	platforms: Omit<SocialPlatform, "lastUpdated">[];
	category: InfluencerCategory;
	tier: InfluencerTier;
	location: InfluencerProfile["location"];
	demographics: InfluencerProfile["demographics"];
	rates?: Omit<InfluencerRates, "lastUpdated">;
	notes?: string;
	tags: string[];
}

export interface CreateInfluencerCampaign {
	name: string;
	description: string;
	type: CampaignType;
	objectives: CampaignObjective[];
	budget: InfluencerCampaign["budget"];
	timeline: Omit<InfluencerCampaign["timeline"], "createdAt">;
	targetAudience: InfluencerCampaign["targetAudience"];
	deliverables: Omit<
		CampaignDeliverable,
		"id" | "submittedAt" | "approvedAt" | "rejectedAt" | "feedback"
	>[];
	notes?: string;
	tags: string[];
}

export interface CreateInfluencerOutreach {
	influencerId: string;
	campaignId?: string;
	type: OutreachType;
	subject: string;
	message: string;
	template?: string;
	personalizations: Record<string, string>;
	scheduledAt?: Date;
}

export interface CreateInfluencerContract {
	influencerId: string;
	campaignId?: string;
	type: ContractType;
	terms: ContractTerms;
	compensation: ContractCompensation;
	deliverables: ContractDeliverable[];
	exclusivity: ExclusivityClause[];
	compliance: ComplianceClause[];
	effectiveDate: Date;
	expirationDate?: Date;
	autoRenewal: boolean;
}

// Update Types
export interface UpdateInfluencerProfile {
	name?: string;
	handle?: string;
	email?: string;
	phone?: string;
	platforms?: SocialPlatform[];
	category?: InfluencerCategory;
	tier?: InfluencerTier;
	location?: InfluencerProfile["location"];
	demographics?: InfluencerProfile["demographics"];
	metrics?: InfluencerMetrics;
	rates?: InfluencerRates;
	compliance?: ComplianceInfo;
	notes?: string;
	tags?: string[];
	status?: InfluencerStatus;
	lastContactedAt?: Date;
}

export interface UpdateInfluencerCampaign {
	name?: string;
	description?: string;
	status?: CampaignStatus;
	objectives?: CampaignObjective[];
	budget?: InfluencerCampaign["budget"];
	timeline?: Omit<InfluencerCampaign["timeline"], "createdAt">;
	targetAudience?: InfluencerCampaign["targetAudience"];
	notes?: string;
	tags?: string[];
}

export interface UpdateInfluencerOutreach {
	status?: OutreachStatus;
	scheduledAt?: Date;
	response?: string;
	followUpScheduled?: Date;
	outcome?: OutreachOutcome;
}

export interface UpdateInfluencerContract {
	status?: ContractStatus;
	terms?: ContractTerms;
	compensation?: ContractCompensation;
	deliverables?: ContractDeliverable[];
	exclusivity?: ExclusivityClause[];
	compliance?: ComplianceClause[];
	effectiveDate?: Date;
	expirationDate?: Date;
	autoRenewal?: boolean;
}

// Enums and Union Types
export type PlatformType =
	| "instagram"
	| "youtube"
	| "tiktok"
	| "twitter"
	| "facebook"
	| "linkedin"
	| "twitch"
	| "pinterest"
	| "snapchat";

export type InfluencerCategory =
	| "fashion"
	| "beauty"
	| "lifestyle"
	| "fitness"
	| "food"
	| "travel"
	| "tech"
	| "gaming"
	| "parenting"
	| "business"
	| "entertainment"
	| "other";

export type InfluencerTier =
	| "nano"
	| "micro"
	| "mid"
	| "macro"
	| "mega"
	| "celebrity";

export type InfluencerStatus =
	| "prospect"
	| "contacted"
	| "engaged"
	| "partner"
	| "inactive"
	| "blacklisted";

export type CampaignType =
	| "brand_awareness"
	| "product_launch"
	| "sales_driven"
	| "event_promotion"
	| "ugc_collection"
	| "ambassador_program";

export type CampaignStatus =
	| "draft"
	| "planning"
	| "recruiting"
	| "active"
	| "paused"
	| "completed"
	| "cancelled";

export type CampaignObjective =
	| "brand_awareness"
	| "reach"
	| "engagement"
	| "traffic"
	| "conversions"
	| "sales"
	| "app_installs"
	| "video_views";

export type DeliverableType =
	| "instagram_post"
	| "instagram_story"
	| "instagram_reel"
	| "youtube_video"
	| "youtube_short"
	| "tiktok_video"
	| "twitter_post"
	| "facebook_post"
	| "linkedin_post"
	| "blog_post"
	| "product_review"
	| "unboxing"
	| "tutorial"
	| "testimonial";

export type DeliverableStatus =
	| "pending"
	| "in_progress"
	| "submitted"
	| "approved"
	| "rejected"
	| "published";

export type ParticipantStatus =
	| "invited"
	| "accepted"
	| "declined"
	| "active"
	| "completed"
	| "cancelled";

export type CommunicationType =
	| "email"
	| "dm"
	| "phone"
	| "meeting"
	| "contract"
	| "brief"
	| "feedback";

export type CommunicationStatus =
	| "sent"
	| "delivered"
	| "read"
	| "replied"
	| "failed";

export type AssetType =
	| "brief"
	| "creative"
	| "product_image"
	| "logo"
	| "guidelines"
	| "contract"
	| "invoice"
	| "report";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "skipped";

export type OutreachType =
	| "cold_outreach"
	| "campaign_invitation"
	| "follow_up"
	| "negotiation"
	| "renewal"
	| "feedback_request";

export type OutreachStatus =
	| "draft"
	| "scheduled"
	| "sent"
	| "opened"
	| "replied"
	| "bounced"
	| "failed";

export type OutreachOutcome =
	| "no_response"
	| "interested"
	| "declined"
	| "negotiating"
	| "agreed"
	| "requires_follow_up";

export type RelationshipTier =
	| "new"
	| "developing"
	| "established"
	| "strategic"
	| "exclusive";

export type ContactMethod = "email" | "phone" | "dm" | "manager";

export type ExclusivityStatus = "none" | "category" | "brand" | "full";

export type EventType =
	| "campaign_completed"
	| "payment_made"
	| "contract_signed"
	| "dispute_resolved"
	| "performance_bonus"
	| "renewal"
	| "termination";

export type EventImpact = "positive" | "neutral" | "negative";

export type ContractType =
	| "campaign_specific"
	| "ambassador"
	| "exclusivity"
	| "licensing"
	| "affiliate";

export type ContractStatus =
	| "draft"
	| "pending_review"
	| "pending_signature"
	| "active"
	| "completed"
	| "terminated"
	| "expired";

export type CompensationType =
	| "fixed_fee"
	| "performance_based"
	| "hybrid"
	| "product_only"
	| "revenue_share"
	| "equity";

export type PaymentSchedule =
	| "upfront"
	| "milestone"
	| "completion"
	| "monthly"
	| "quarterly";

export type ExclusivityType =
	| "category"
	| "competitor"
	| "platform"
	| "time_based"
	| "geographic";

export type ComplianceType =
	| "ftc_disclosure"
	| "brand_guidelines"
	| "content_approval"
	| "usage_rights"
	| "data_protection";

export type SignatureMethod =
	| "electronic"
	| "digital"
	| "physical"
	| "docusign"
	| "hellosign";

export type ContentType =
	| "post"
	| "story"
	| "reel"
	| "video"
	| "live"
	| "igtv"
	| "short";

export interface UsageRights {
	duration: string;
	territories: string[];
	channels: string[];
	modifications: boolean;
	resale: boolean;
}

export interface CancellationTerms {
	noticePeriod: string;
	penalties: string[];
	refundPolicy: string;
}

export interface LiabilityTerms {
	limitation: number;
	currency: string;
	exclusions: string[];
}

export interface PerformanceBonus {
	metric: string;
	threshold: number;
	bonus: number;
	cap?: number;
}

export interface ExpensePolicy {
	covered: string[];
	preApproval: boolean;
	receiptRequired: boolean;
	maxAmount?: number;
}
