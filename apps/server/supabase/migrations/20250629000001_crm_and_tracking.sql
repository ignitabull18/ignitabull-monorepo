-- CRM and Lead Management Schema
-- This migration adds comprehensive CRM functionality for lead management,
-- visitor tracking, and automated marketing workflows

-- Create leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    phone TEXT,
    website TEXT,
    
    -- Lead qualification data
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost')),
    score INTEGER DEFAULT 0,
    grade TEXT CHECK (grade IN ('hot', 'warm', 'cold')),
    
    -- Source tracking
    source TEXT, -- 'website', 'social', 'referral', 'direct', etc.
    source_details JSONB DEFAULT '{}', -- Additional source metadata
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    
    -- Lead data
    interests JSONB DEFAULT '[]', -- Array of interests/tags
    custom_fields JSONB DEFAULT '{}', -- Flexible custom data
    notes TEXT,
    
    -- Assignment and ownership
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Timestamps
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Constraints
    UNIQUE(organization_id, email)
);

-- Create lead activities table for tracking all interactions
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'page_visit', 'form_submission', 'email_opened', 'email_clicked', 
        'download', 'video_watched', 'call', 'meeting', 'note', 'email_sent',
        'social_interaction', 'chat_message', 'demo_request', 'purchase'
    )),
    title TEXT NOT NULL,
    description TEXT,
    
    -- Activity metadata
    metadata JSONB DEFAULT '{}', -- Flexible data like page URL, email subject, etc.
    value DECIMAL(10,2), -- For scoring purposes
    
    -- User who performed the activity (for manual activities)
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create visitor tracking table for anonymous users
CREATE TABLE visitor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Visitor identification
    visitor_id TEXT NOT NULL, -- Anonymous ID (fingerprint/cookie)
    session_id TEXT NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- Link when identified
    
    -- Session data
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    landing_page TEXT,
    pages_visited JSONB DEFAULT '[]', -- Array of page visits
    
    -- Tracking data
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    
    -- Geolocation (if available)
    country TEXT,
    region TEXT,
    city TEXT,
    
    -- Session metrics
    page_views INTEGER DEFAULT 0,
    time_on_site INTEGER DEFAULT 0, -- seconds
    bounce BOOLEAN DEFAULT true,
    
    -- Timestamps
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(organization_id, visitor_id, session_id)
);

-- Create page visits table for detailed tracking
CREATE TABLE page_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_session_id UUID REFERENCES visitor_sessions(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Page data
    url TEXT NOT NULL,
    title TEXT,
    path TEXT,
    query_params JSONB DEFAULT '{}',
    
    -- Visit metrics
    time_on_page INTEGER DEFAULT 0, -- seconds
    scroll_depth DECIMAL(5,2), -- percentage
    
    -- Interaction data
    clicks JSONB DEFAULT '[]', -- Array of click events
    form_interactions JSONB DEFAULT '[]', -- Array of form interactions
    
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create email sequences table for automated marketing
CREATE TABLE email_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'lead_created', 'form_submitted', 'page_visited', 'manual', 
        'score_threshold', 'time_based', 'behavior_based'
    )),
    trigger_conditions JSONB DEFAULT '{}', -- Conditions for triggering
    
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    priority INTEGER DEFAULT 100,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create email sequence steps
CREATE TABLE email_sequence_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    step_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    
    -- Timing
    delay_days INTEGER DEFAULT 0,
    delay_hours INTEGER DEFAULT 0,
    send_time TIME, -- Specific time to send (optional)
    
    -- Email content
    subject TEXT NOT NULL,
    template_id TEXT, -- Reference to React Email template
    content JSONB NOT NULL, -- Email content and variables
    
    -- Conditions
    conditions JSONB DEFAULT '{}', -- Conditions for sending this step
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(sequence_id, step_order)
);

-- Create sequence enrollments to track who's in what sequence
CREATE TABLE sequence_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    current_step INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'unsubscribed')),
    
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMP WITH TIME ZONE,
    next_email_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(sequence_id, lead_id)
);

-- Create influencer contacts table
CREATE TABLE influencer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    
    -- Social profiles
    instagram_handle TEXT,
    tiktok_handle TEXT,
    youtube_channel TEXT,
    twitter_handle TEXT,
    website TEXT,
    
    -- Influencer metrics
    follower_count JSONB DEFAULT '{}', -- Platform: count mapping
    engagement_rate DECIMAL(5,2),
    average_views INTEGER,
    
    -- Business details
    category TEXT[], -- Array of categories
    content_types TEXT[], -- 'video', 'photo', 'story', 'reel', etc.
    pricing JSONB DEFAULT '{}', -- Pricing for different content types
    
    -- Relationship status
    status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN (
        'prospect', 'contacted', 'negotiating', 'partner', 'inactive'
    )),
    tier TEXT CHECK (tier IN ('micro', 'mid', 'macro', 'mega')),
    
    -- Campaign history
    campaigns_completed INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    
    -- Notes and tags
    notes TEXT,
    tags TEXT[],
    
    -- Assignment
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create influencer campaigns table
CREATE TABLE influencer_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES influencer_contacts(id) ON DELETE CASCADE,
    
    campaign_name TEXT NOT NULL,
    description TEXT,
    
    -- Campaign details
    content_type TEXT NOT NULL, -- 'post', 'story', 'video', 'reel'
    deliverables JSONB NOT NULL, -- What they need to deliver
    brief JSONB DEFAULT '{}', -- Campaign brief and requirements
    
    -- Pricing and terms
    agreed_rate DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    payment_terms TEXT,
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    content_due_date DATE,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'negotiating', 'confirmed', 'in_progress', 
        'content_submitted', 'approved', 'posted', 'completed', 'cancelled'
    )),
    
    -- Performance tracking
    reach INTEGER,
    impressions INTEGER,
    engagement INTEGER,
    clicks INTEGER,
    conversions INTEGER,
    roi DECIMAL(10,2),
    
    -- Contract and deliverables
    contract_signed BOOLEAN DEFAULT false,
    content_approved BOOLEAN DEFAULT false,
    payment_completed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create lead scoring rules table
CREATE TABLE lead_scoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Rule configuration
    trigger_type TEXT NOT NULL, -- 'activity', 'demographic', 'firmographic'
    conditions JSONB NOT NULL, -- Conditions for the rule
    score_change INTEGER NOT NULL, -- Points to add/subtract
    
    -- Rule metadata
    category TEXT, -- Group rules by category
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create lead score history for audit trail
CREATE TABLE lead_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    scoring_rule_id UUID REFERENCES lead_scoring_rules(id) ON DELETE SET NULL,
    
    score_change INTEGER NOT NULL,
    previous_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_leads_org_email ON leads(organization_id, email);
CREATE INDEX idx_leads_status ON leads(organization_id, status);
CREATE INDEX idx_leads_score ON leads(organization_id, score DESC);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_source ON leads(organization_id, source);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id, occurred_at DESC);
CREATE INDEX idx_lead_activities_type ON lead_activities(organization_id, activity_type);

CREATE INDEX idx_visitor_sessions_visitor ON visitor_sessions(organization_id, visitor_id);
CREATE INDEX idx_visitor_sessions_lead ON visitor_sessions(lead_id);

CREATE INDEX idx_page_visits_session ON page_visits(visitor_session_id, visited_at DESC);
CREATE INDEX idx_page_visits_url ON page_visits(organization_id, url);

CREATE INDEX idx_sequence_enrollments_lead ON sequence_enrollments(lead_id);
CREATE INDEX idx_sequence_enrollments_next_email ON sequence_enrollments(next_email_at) WHERE status = 'active';

CREATE INDEX idx_influencer_contacts_org ON influencer_contacts(organization_id);
CREATE INDEX idx_influencer_contacts_status ON influencer_contacts(organization_id, status);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_score_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Leads: Organization members can manage leads
CREATE POLICY "Organization members can view leads" ON leads
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can create leads" ON leads
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can update leads" ON leads
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Lead activities: Organization members can manage activities
CREATE POLICY "Organization members can view lead activities" ON lead_activities
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can create lead activities" ON lead_activities
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Visitor sessions: Organization members can view visitor data
CREATE POLICY "Organization members can view visitor sessions" ON visitor_sessions
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage visitor sessions" ON visitor_sessions
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Email sequences: Organization members can manage sequences
CREATE POLICY "Organization members can manage email sequences" ON email_sequences
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Influencer contacts: Organization members can manage influencers
CREATE POLICY "Organization members can manage influencer contacts" ON influencer_contacts
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Apply RLS policies to all other tables (similar pattern)
CREATE POLICY "Organization members can view page visits" ON page_visits
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage sequence steps" ON email_sequence_steps
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage enrollments" ON sequence_enrollments
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage influencer campaigns" ON influencer_campaigns
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage scoring rules" ON lead_scoring_rules
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can view score history" ON lead_score_history
    FOR SELECT USING (
        lead_id IN (
            SELECT id FROM leads 
            WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        )
    );

-- Create triggers for updated_at columns
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitor_sessions_updated_at BEFORE UPDATE ON visitor_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON email_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sequence_steps_updated_at BEFORE UPDATE ON email_sequence_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_enrollments_updated_at BEFORE UPDATE ON sequence_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencer_contacts_updated_at BEFORE UPDATE ON influencer_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencer_campaigns_updated_at BEFORE UPDATE ON influencer_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_scoring_rules_updated_at BEFORE UPDATE ON lead_scoring_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update lead score when activities are added
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads 
    SET 
        score = score + COALESCE(NEW.value, 0),
        last_activity_at = NEW.occurred_at
    WHERE id = NEW.lead_id;
    
    -- Insert score history record
    INSERT INTO lead_score_history (lead_id, score_change, previous_score, new_score, reason)
    SELECT 
        NEW.lead_id,
        COALESCE(NEW.value, 0),
        l.score - COALESCE(NEW.value, 0),
        l.score,
        'Activity: ' || NEW.activity_type
    FROM leads l WHERE l.id = NEW.lead_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update lead score when activities are added
CREATE TRIGGER trigger_update_lead_score
    AFTER INSERT ON lead_activities
    FOR EACH ROW EXECUTE FUNCTION update_lead_score();

-- Create function to update visitor session metrics
CREATE OR REPLACE FUNCTION update_visitor_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE visitor_sessions 
    SET 
        page_views = page_views + 1,
        bounce = false,
        last_seen_at = NEW.visited_at,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.visitor_session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session metrics when page visits are added
CREATE TRIGGER trigger_update_session_metrics
    AFTER INSERT ON page_visits
    FOR EACH ROW EXECUTE FUNCTION update_visitor_session_metrics();