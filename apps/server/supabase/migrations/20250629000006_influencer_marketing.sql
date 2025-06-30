-- Influencer Marketing CRM Database Schema
-- Migration for comprehensive influencer relationship and campaign management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Influencer Profiles Table
CREATE TABLE influencer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  platforms JSONB DEFAULT '[]',
  category TEXT CHECK (category IN (
    'fashion', 'beauty', 'lifestyle', 'fitness', 'food', 'travel', 
    'tech', 'gaming', 'parenting', 'business', 'entertainment', 'other'
  )),
  tier TEXT CHECK (tier IN ('nano', 'micro', 'mid', 'macro', 'mega', 'celebrity')),
  location JSONB DEFAULT '{}',
  demographics JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  rates JSONB DEFAULT '{}',
  compliance JSONB DEFAULT '{}',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('prospect', 'contacted', 'engaged', 'partner', 'inactive', 'blacklisted')) DEFAULT 'prospect',
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencer Campaigns Table
CREATE TABLE influencer_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'brand_awareness', 'product_launch', 'sales_driven', 
    'event_promotion', 'ugc_collection', 'ambassador_program'
  )) NOT NULL,
  status TEXT CHECK (status IN (
    'draft', 'planning', 'recruiting', 'active', 'paused', 'completed', 'cancelled'
  )) DEFAULT 'draft',
  objectives TEXT[] DEFAULT '{}',
  budget JSONB DEFAULT '{}',
  timeline JSONB DEFAULT '{}',
  target_audience JSONB DEFAULT '{}',
  deliverables JSONB DEFAULT '[]',
  participants JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  assets JSONB DEFAULT '[]',
  approval_workflow JSONB DEFAULT '[]',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencer Outreach Table
CREATE TABLE influencer_outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES influencer_campaigns(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN (
    'cold_outreach', 'campaign_invitation', 'follow_up', 
    'negotiation', 'renewal', 'feedback_request'
  )) NOT NULL,
  status TEXT CHECK (status IN (
    'draft', 'scheduled', 'sent', 'opened', 'replied', 'bounced', 'failed'
  )) DEFAULT 'draft',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  template TEXT,
  personalizations JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  response TEXT,
  follow_up_scheduled TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN (
    'no_response', 'interested', 'declined', 'negotiating', 'agreed', 'requires_follow_up'
  )) DEFAULT 'no_response',
  metrics JSONB DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencer Contracts Table
CREATE TABLE influencer_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES influencer_campaigns(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN (
    'campaign_specific', 'ambassador', 'exclusivity', 'licensing', 'affiliate'
  )) NOT NULL,
  status TEXT CHECK (status IN (
    'draft', 'pending_review', 'pending_signature', 'active', 'completed', 'terminated', 'expired'
  )) DEFAULT 'draft',
  terms JSONB DEFAULT '{}',
  compensation JSONB DEFAULT '{}',
  deliverables JSONB DEFAULT '[]',
  exclusivity JSONB DEFAULT '[]',
  compliance JSONB DEFAULT '[]',
  signatures JSONB DEFAULT '[]',
  effective_date TIMESTAMPTZ NOT NULL,
  expiration_date TIMESTAMPTZ,
  auto_renewal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencer Relationships Table
CREATE TABLE influencer_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  relationship_score INTEGER DEFAULT 0 CHECK (relationship_score >= 0 AND relationship_score <= 100),
  tier TEXT CHECK (tier IN ('new', 'developing', 'established', 'strategic', 'exclusive')) DEFAULT 'new',
  last_interaction TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_campaigns INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  avg_performance DECIMAL(5,2) DEFAULT 0,
  preferred_contact TEXT CHECK (preferred_contact IN ('email', 'phone', 'dm', 'manager')),
  exclusivity_status TEXT CHECK (exclusivity_status IN ('none', 'category', 'brand', 'full')) DEFAULT 'none',
  renewal_date TIMESTAMPTZ,
  history JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(influencer_id)
);

-- Outreach Templates Table
CREATE TABLE outreach_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  success_rate DECIMAL(5,2) DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign Performance Table
CREATE TABLE campaign_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES influencer_campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  metrics JSONB DEFAULT '{}',
  url TEXT,
  screenshot_url TEXT,
  engagement_data JSONB DEFAULT '{}',
  audience_data JSONB DEFAULT '{}',
  conversion_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencer Analytics Table
CREATE TABLE influencer_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  platform TEXT NOT NULL,
  followers_start INTEGER DEFAULT 0,
  followers_end INTEGER DEFAULT 0,
  follower_growth DECIMAL(5,2) DEFAULT 0,
  avg_engagement_rate DECIMAL(5,3) DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_engagements INTEGER DEFAULT 0,
  audience_demographics JSONB DEFAULT '{}',
  content_performance JSONB DEFAULT '{}',
  brand_mentions INTEGER DEFAULT 0,
  collaboration_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitor Tracking Table
CREATE TABLE competitor_influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_brand TEXT NOT NULL,
  influencer_id UUID REFERENCES influencer_profiles(id) ON DELETE SET NULL,
  influencer_handle TEXT NOT NULL,
  platform TEXT NOT NULL,
  collaboration_type TEXT,
  collaboration_date TIMESTAMPTZ,
  campaign_details JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  estimated_cost DECIMAL(10,2),
  notes TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content Library Table
CREATE TABLE content_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES influencer_campaigns(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN (
    'image', 'video', 'story', 'reel', 'post', 'live', 'ugc'
  )) NOT NULL,
  platform TEXT NOT NULL,
  title TEXT,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER,
  duration INTEGER, -- seconds for videos
  dimensions JSONB, -- width/height for images/videos
  tags TEXT[] DEFAULT '{}',
  usage_rights JSONB DEFAULT '{}',
  approval_status TEXT CHECK (approval_status IN (
    'pending', 'approved', 'rejected', 'revision_requested'
  )) DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_influencer_profiles_handle ON influencer_profiles(handle);
CREATE INDEX idx_influencer_profiles_category ON influencer_profiles(category);
CREATE INDEX idx_influencer_profiles_tier ON influencer_profiles(tier);
CREATE INDEX idx_influencer_profiles_status ON influencer_profiles(status);
CREATE INDEX idx_influencer_profiles_tags ON influencer_profiles USING GIN(tags);
CREATE INDEX idx_influencer_profiles_platforms ON influencer_profiles USING GIN(platforms);
CREATE INDEX idx_influencer_profiles_discovered_at ON influencer_profiles(discovered_at);

CREATE INDEX idx_influencer_campaigns_status ON influencer_campaigns(status);
CREATE INDEX idx_influencer_campaigns_type ON influencer_campaigns(type);
CREATE INDEX idx_influencer_campaigns_created_by ON influencer_campaigns(created_by);
CREATE INDEX idx_influencer_campaigns_tags ON influencer_campaigns USING GIN(tags);
CREATE INDEX idx_influencer_campaigns_created_at ON influencer_campaigns(created_at);

CREATE INDEX idx_influencer_outreach_influencer_id ON influencer_outreach(influencer_id);
CREATE INDEX idx_influencer_outreach_campaign_id ON influencer_outreach(campaign_id);
CREATE INDEX idx_influencer_outreach_status ON influencer_outreach(status);
CREATE INDEX idx_influencer_outreach_type ON influencer_outreach(type);
CREATE INDEX idx_influencer_outreach_outcome ON influencer_outreach(outcome);
CREATE INDEX idx_influencer_outreach_sent_at ON influencer_outreach(sent_at);

CREATE INDEX idx_influencer_contracts_influencer_id ON influencer_contracts(influencer_id);
CREATE INDEX idx_influencer_contracts_campaign_id ON influencer_contracts(campaign_id);
CREATE INDEX idx_influencer_contracts_status ON influencer_contracts(status);
CREATE INDEX idx_influencer_contracts_type ON influencer_contracts(type);
CREATE INDEX idx_influencer_contracts_effective_date ON influencer_contracts(effective_date);
CREATE INDEX idx_influencer_contracts_expiration_date ON influencer_contracts(expiration_date);

CREATE INDEX idx_influencer_relationships_influencer_id ON influencer_relationships(influencer_id);
CREATE INDEX idx_influencer_relationships_tier ON influencer_relationships(tier);
CREATE INDEX idx_influencer_relationships_score ON influencer_relationships(relationship_score);
CREATE INDEX idx_influencer_relationships_last_interaction ON influencer_relationships(last_interaction);

CREATE INDEX idx_campaign_performance_campaign_id ON campaign_performance(campaign_id);
CREATE INDEX idx_campaign_performance_influencer_id ON campaign_performance(influencer_id);
CREATE INDEX idx_campaign_performance_platform ON campaign_performance(platform);
CREATE INDEX idx_campaign_performance_published_at ON campaign_performance(published_at);

CREATE INDEX idx_influencer_analytics_influencer_id ON influencer_analytics(influencer_id);
CREATE INDEX idx_influencer_analytics_platform ON influencer_analytics(platform);
CREATE INDEX idx_influencer_analytics_period ON influencer_analytics(period_start, period_end);

CREATE INDEX idx_competitor_influencers_competitor_brand ON competitor_influencers(competitor_brand);
CREATE INDEX idx_competitor_influencers_influencer_id ON competitor_influencers(influencer_id);
CREATE INDEX idx_competitor_influencers_platform ON competitor_influencers(platform);
CREATE INDEX idx_competitor_influencers_collaboration_date ON competitor_influencers(collaboration_date);

CREATE INDEX idx_content_library_campaign_id ON content_library(campaign_id);
CREATE INDEX idx_content_library_influencer_id ON content_library(influencer_id);
CREATE INDEX idx_content_library_content_type ON content_library(content_type);
CREATE INDEX idx_content_library_platform ON content_library(platform);
CREATE INDEX idx_content_library_approval_status ON content_library(approval_status);
CREATE INDEX idx_content_library_tags ON content_library USING GIN(tags);

-- Text search indexes
CREATE INDEX idx_influencer_profiles_name_trgm ON influencer_profiles USING GIN(name gin_trgm_ops);
CREATE INDEX idx_influencer_profiles_handle_trgm ON influencer_profiles USING GIN(handle gin_trgm_ops);
CREATE INDEX idx_influencer_campaigns_name_trgm ON influencer_campaigns USING GIN(name gin_trgm_ops);
CREATE INDEX idx_outreach_templates_name_trgm ON outreach_templates USING GIN(name gin_trgm_ops);

-- JSONB indexes for better performance
CREATE INDEX idx_influencer_profiles_metrics ON influencer_profiles USING GIN(metrics);
CREATE INDEX idx_influencer_profiles_demographics ON influencer_profiles USING GIN(demographics);
CREATE INDEX idx_influencer_campaigns_budget ON influencer_campaigns USING GIN(budget);
CREATE INDEX idx_influencer_campaigns_target_audience ON influencer_campaigns USING GIN(target_audience);
CREATE INDEX idx_campaign_performance_metrics ON campaign_performance USING GIN(metrics);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_influencer_profiles_updated_at 
  BEFORE UPDATE ON influencer_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencer_campaigns_updated_at 
  BEFORE UPDATE ON influencer_campaigns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencer_outreach_updated_at 
  BEFORE UPDATE ON influencer_outreach 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencer_contracts_updated_at 
  BEFORE UPDATE ON influencer_contracts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencer_relationships_updated_at 
  BEFORE UPDATE ON influencer_relationships 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_templates_updated_at 
  BEFORE UPDATE ON outreach_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_performance_updated_at 
  BEFORE UPDATE ON campaign_performance 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Influencer Marketing Analytics Functions

-- Calculate influencer performance score
CREATE OR REPLACE FUNCTION calculate_influencer_performance_score(
  p_influencer_id UUID,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  performance_score DECIMAL,
  engagement_score DECIMAL,
  reliability_score DECIMAL,
  growth_score DECIMAL,
  collaboration_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH performance_data AS (
    SELECT 
      COALESCE(AVG((cp.metrics->>'engagement_rate')::DECIMAL), 0) as avg_engagement,
      COUNT(DISTINCT cp.campaign_id) as campaign_count,
      COUNT(*) as total_posts
    FROM campaign_performance cp
    WHERE cp.influencer_id = p_influencer_id
      AND cp.published_at >= NOW() - INTERVAL '1 day' * p_days
  ),
  growth_data AS (
    SELECT 
      COALESCE(AVG(ia.follower_growth), 0) as avg_growth
    FROM influencer_analytics ia
    WHERE ia.influencer_id = p_influencer_id
      AND ia.period_start >= NOW() - INTERVAL '1 day' * p_days
  ),
  relationship_data AS (
    SELECT 
      ir.relationship_score,
      ir.total_campaigns,
      ir.avg_performance
    FROM influencer_relationships ir
    WHERE ir.influencer_id = p_influencer_id
  )
  SELECT 
    LEAST(100, GREATEST(0, 
      (pd.avg_engagement * 40) + 
      (LEAST(pd.campaign_count * 10, 30)) +
      (LEAST(gd.avg_growth * 20, 20)) +
      (rd.relationship_score * 0.1)
    )),
    LEAST(100, pd.avg_engagement * 100),
    LEAST(100, rd.relationship_score),
    LEAST(100, GREATEST(0, gd.avg_growth * 100)),
    LEAST(100, GREATEST(0, rd.total_campaigns * 10))
  FROM performance_data pd
  CROSS JOIN growth_data gd
  CROSS JOIN relationship_data rd;
END;
$$ LANGUAGE plpgsql;

-- Calculate campaign ROI
CREATE OR REPLACE FUNCTION calculate_campaign_roi(
  p_campaign_id UUID
)
RETURNS TABLE (
  total_reach INTEGER,
  total_engagements INTEGER,
  total_cost DECIMAL,
  estimated_revenue DECIMAL,
  roi_percentage DECIMAL,
  cost_per_engagement DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH campaign_data AS (
    SELECT 
      (ic.budget->>'total')::DECIMAL as budget_total,
      (ic.budget->>'spent')::DECIMAL as budget_spent
    FROM influencer_campaigns ic
    WHERE ic.id = p_campaign_id
  ),
  performance_data AS (
    SELECT 
      COALESCE(SUM((cp.metrics->>'reach')::INTEGER), 0) as total_reach,
      COALESCE(SUM((cp.metrics->>'engagements')::INTEGER), 0) as total_engagements,
      COALESCE(SUM((cp.conversion_data->>'revenue')::DECIMAL), 0) as estimated_revenue
    FROM campaign_performance cp
    WHERE cp.campaign_id = p_campaign_id
  )
  SELECT 
    pd.total_reach,
    pd.total_engagements,
    cd.budget_spent,
    pd.estimated_revenue,
    CASE 
      WHEN cd.budget_spent > 0 THEN ((pd.estimated_revenue - cd.budget_spent) / cd.budget_spent) * 100
      ELSE 0
    END,
    CASE 
      WHEN pd.total_engagements > 0 THEN cd.budget_spent / pd.total_engagements
      ELSE 0
    END
  FROM campaign_data cd
  CROSS JOIN performance_data pd;
END;
$$ LANGUAGE plpgsql;

-- Get influencer discovery recommendations
CREATE OR REPLACE FUNCTION get_influencer_recommendations(
  p_category TEXT,
  p_min_followers INTEGER DEFAULT 1000,
  p_max_followers INTEGER DEFAULT 1000000,
  p_min_engagement DECIMAL DEFAULT 0.02,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  influencer_id UUID,
  name TEXT,
  handle TEXT,
  followers INTEGER,
  engagement_rate DECIMAL,
  recommendation_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ip.id,
    ip.name,
    ip.handle,
    (ip.metrics->>'totalFollowers')::INTEGER,
    (ip.metrics->>'avgEngagementRate')::DECIMAL,
    -- Simple scoring algorithm
    (
      CASE WHEN (ip.metrics->>'avgEngagementRate')::DECIMAL >= p_min_engagement THEN 40 ELSE 0 END +
      CASE WHEN ip.status = 'prospect' THEN 30 ELSE 10 END +
      CASE WHEN ip.compliance->>'ftcCompliant' = 'true' THEN 20 ELSE 0 END +
      CASE WHEN array_length(ip.tags, 1) > 2 THEN 10 ELSE 5 END
    )::DECIMAL
  FROM influencer_profiles ip
  WHERE ip.category = p_category
    AND (ip.metrics->>'totalFollowers')::INTEGER BETWEEN p_min_followers AND p_max_followers
    AND (ip.metrics->>'avgEngagementRate')::DECIMAL >= p_min_engagement
    AND ip.status IN ('prospect', 'contacted', 'engaged')
  ORDER BY 6 DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Auto-update relationship scores based on interactions
CREATE OR REPLACE FUNCTION update_relationship_scores()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  influencer_record RECORD;
BEGIN
  FOR influencer_record IN 
    SELECT DISTINCT influencer_id 
    FROM influencer_outreach 
    WHERE updated_at >= NOW() - INTERVAL '1 day'
  LOOP
    INSERT INTO influencer_relationships (influencer_id, relationship_score, last_interaction)
    VALUES (
      influencer_record.influencer_id,
      50, -- Base score
      NOW()
    )
    ON CONFLICT (influencer_id) DO UPDATE SET
      relationship_score = LEAST(100, GREATEST(0, 
        influencer_relationships.relationship_score + 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM influencer_outreach 
            WHERE influencer_id = influencer_record.influencer_id 
              AND outcome = 'agreed' 
              AND updated_at >= NOW() - INTERVAL '7 days'
          ) THEN 10
          WHEN EXISTS (
            SELECT 1 FROM influencer_outreach 
            WHERE influencer_id = influencer_record.influencer_id 
              AND outcome = 'interested' 
              AND updated_at >= NOW() - INTERVAL '7 days'
          ) THEN 5
          WHEN EXISTS (
            SELECT 1 FROM influencer_outreach 
            WHERE influencer_id = influencer_record.influencer_id 
              AND outcome = 'declined' 
              AND updated_at >= NOW() - INTERVAL '7 days'
          ) THEN -5
          ELSE 1
        END
      )),
      last_interaction = NOW(),
      updated_at = NOW();
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow service role full access
CREATE POLICY "Service role full access" ON influencer_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON influencer_campaigns
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON influencer_outreach
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON influencer_contracts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON influencer_relationships
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON outreach_templates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON campaign_performance
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON influencer_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON competitor_influencers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON content_library
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view data
CREATE POLICY "Users can view influencer data" ON influencer_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view campaign data" ON influencer_campaigns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view outreach data" ON influencer_outreach
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view contract data" ON influencer_contracts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO outreach_templates (name, type, subject, content, variables, created_by) VALUES
(
  'Cold Outreach - Beauty Brand',
  'cold_outreach',
  'Partnership Opportunity with {brand_name}',
  'Hi {influencer_name},

I hope this message finds you well! I''ve been following your content on {platform} and absolutely love your style and engagement with your {follower_count} followers.

I''m reaching out from {brand_name} because we think you''d be a perfect fit for our upcoming campaign. We''re looking for authentic voices in the beauty space to showcase our new product line.

What we''re offering:
• Competitive compensation of ${compensation}
• Free products to keep
• Long-term partnership opportunities
• Creative freedom in content creation

Your engagement rate of {engagement_rate}% shows you have an incredibly engaged audience, which is exactly what we''re looking for.

Would you be interested in learning more about this opportunity? I''d love to send over more details and discuss how we can work together.

Best regards,
Marketing Team',
  ARRAY['{influencer_name}', '{platform}', '{follower_count}', '{brand_name}', '{compensation}', '{engagement_rate}'],
  'system'
),
(
  'Campaign Invitation',
  'campaign_invitation',
  'Exclusive Campaign Invitation: {campaign_name}',
  'Hello {influencer_name},

We have an exciting opportunity we''d love to share with you for our {campaign_name} campaign.

Campaign Details:
• Duration: 2 weeks
• Compensation: ${compensation}
• Deliverables: {deliverables}
• Timeline: Starting next week

Based on your previous performance and alignment with our brand values, we believe you''d be perfect for this campaign.

Are you available and interested? Please let me know by tomorrow if possible.

Looking forward to collaborating again!

Best,
Campaign Manager',
  ARRAY['{influencer_name}', '{campaign_name}', '{compensation}', '{deliverables}'],
  'system'
);

INSERT INTO influencer_profiles (
  name, handle, email, category, tier, platforms, location, demographics, 
  metrics, rates, compliance, tags, status
) VALUES
(
  'Sarah Johnson',
  '@sarahjohnson_beauty',
  'sarah@example.com',
  'beauty',
  'micro',
  '[
    {
      "platform": "instagram",
      "handle": "@sarahjohnson_beauty",
      "url": "https://instagram.com/sarahjohnson_beauty",
      "verified": true,
      "followers": 45000,
      "following": 1200,
      "posts": 450,
      "engagementRate": 0.048,
      "averageLikes": 2160,
      "averageComments": 180,
      "lastUpdated": "2025-06-29T00:00:00Z"
    }
  ]'::jsonb,
  '{"country": "US", "city": "Los Angeles", "timezone": "PST"}'::jsonb,
  '{"ageRange": "25-34", "gender": "female", "interests": ["skincare", "makeup", "lifestyle"]}'::jsonb,
  '{
    "totalFollowers": 45000,
    "totalReach": 135000,
    "avgEngagementRate": 0.048,
    "avgViews": 25000,
    "avgLikes": 2160,
    "avgComments": 180,
    "avgShares": 45,
    "audienceGrowthRate": 0.055,
    "brandMentions": 8,
    "lastUpdated": "2025-06-29T00:00:00Z"
  }'::jsonb,
  '{
    "postRate": 450,
    "storyRate": 150,
    "reelRate": 650,
    "negotiable": true,
    "currency": "USD",
    "lastUpdated": "2025-06-29T00:00:00Z"
  }'::jsonb,
  '{
    "hasContract": false,
    "ftcCompliant": true,
    "exclusivityAgreements": [],
    "lastComplianceCheck": "2025-06-29T00:00:00Z"
  }'::jsonb,
  ARRAY['beauty', 'skincare', 'lifestyle', 'micro-influencer'],
  'prospect'
),
(
  'Mike Chen',
  '@mikechen_tech',
  'mike@example.com',
  'tech',
  'mid',
  '[
    {
      "platform": "youtube",
      "handle": "@mikechentech",
      "url": "https://youtube.com/@mikechentech",
      "verified": true,
      "followers": 125000,
      "following": 500,
      "posts": 280,
      "engagementRate": 0.042,
      "averageLikes": 5250,
      "averageComments": 420,
      "lastUpdated": "2025-06-29T00:00:00Z"
    },
    {
      "platform": "tiktok",
      "handle": "@mikechentech",
      "url": "https://tiktok.com/@mikechentech",
      "verified": false,
      "followers": 85000,
      "following": 300,
      "posts": 180,
      "engagementRate": 0.065,
      "averageLikes": 5525,
      "averageComments": 350,
      "lastUpdated": "2025-06-29T00:00:00Z"
    }
  ]'::jsonb,
  '{"country": "CA", "city": "Toronto", "timezone": "EST"}'::jsonb,
  '{"ageRange": "28-35", "gender": "male", "interests": ["technology", "gadgets", "productivity"]}'::jsonb,
  '{
    "totalFollowers": 210000,
    "totalReach": 630000,
    "avgEngagementRate": 0.052,
    "avgViews": 85000,
    "avgLikes": 10775,
    "avgComments": 770,
    "avgShares": 125,
    "audienceGrowthRate": 0.038,
    "brandMentions": 15,
    "lastUpdated": "2025-06-29T00:00:00Z"
  }'::jsonb,
  '{
    "postRate": 1200,
    "storyRate": 400,
    "videoRate": 2500,
    "negotiable": true,
    "currency": "CAD",
    "lastUpdated": "2025-06-29T00:00:00Z"
  }'::jsonb,
  '{
    "hasContract": true,
    "contractExpiresAt": "2025-12-31T00:00:00Z",
    "ftcCompliant": true,
    "exclusivityAgreements": ["tech-reviews"],
    "lastComplianceCheck": "2025-06-29T00:00:00Z"
  }'::jsonb,
  ARRAY['tech', 'reviews', 'gadgets', 'mid-tier'],
  'partner'
);

INSERT INTO influencer_campaigns (
  name, description, type, status, objectives, budget, timeline, target_audience,
  deliverables, tags, created_by
) VALUES
(
  'Summer Skincare Launch',
  'Launch campaign for our new summer skincare line targeting young professionals',
  'product_launch',
  'active',
  ARRAY['brand_awareness', 'sales', 'engagement'],
  '{
    "total": 15000,
    "allocated": 12000,
    "spent": 8500,
    "currency": "USD"
  }'::jsonb,
  '{
    "startDate": "2025-07-01T00:00:00Z",
    "endDate": "2025-07-31T00:00:00Z"
  }'::jsonb,
  '{
    "demographics": ["25-35", "female", "working-professional"],
    "interests": ["skincare", "beauty", "wellness"],
    "locations": ["US", "CA"],
    "platforms": ["instagram", "tiktok"]
  }'::jsonb,
  '[
    {
      "type": "instagram_post",
      "platform": "instagram",
      "description": "Product showcase post with before/after",
      "requirements": ["FTC disclosure", "product tagging", "brand hashtags"],
      "dueDate": "2025-07-05T00:00:00Z",
      "status": "pending"
    },
    {
      "type": "instagram_story",
      "platform": "instagram", 
      "description": "Behind-the-scenes product application",
      "requirements": ["Natural lighting", "authentic application"],
      "dueDate": "2025-07-03T00:00:00Z",
      "status": "pending"
    }
  ]'::jsonb,
  ARRAY['skincare', 'summer', 'product-launch'],
  'system'
);

-- Insert relationship records for sample influencers
INSERT INTO influencer_relationships (influencer_id, relationship_score, tier, total_campaigns, total_spent, avg_performance)
SELECT 
  id,
  CASE 
    WHEN status = 'partner' THEN 85
    WHEN status = 'engaged' THEN 65
    WHEN status = 'contacted' THEN 45
    ELSE 25
  END,
  CASE 
    WHEN status = 'partner' THEN 'established'
    WHEN status = 'engaged' THEN 'developing'
    ELSE 'new'
  END,
  CASE WHEN status = 'partner' THEN 3 ELSE 0 END,
  CASE WHEN status = 'partner' THEN 7500.00 ELSE 0.00 END,
  CASE WHEN status = 'partner' THEN 4.2 ELSE 0.0 END
FROM influencer_profiles;

-- Comments
COMMENT ON TABLE influencer_profiles IS 'Comprehensive influencer profiles and contact information';
COMMENT ON TABLE influencer_campaigns IS 'Influencer marketing campaigns and their management';
COMMENT ON TABLE influencer_outreach IS 'Outreach communications and follow-up tracking';
COMMENT ON TABLE influencer_contracts IS 'Legal contracts and agreements with influencers';
COMMENT ON TABLE influencer_relationships IS 'Relationship scoring and management data';
COMMENT ON TABLE outreach_templates IS 'Reusable templates for influencer outreach';
COMMENT ON TABLE campaign_performance IS 'Individual post and campaign performance metrics';
COMMENT ON TABLE influencer_analytics IS 'Historical analytics and growth tracking';
COMMENT ON TABLE competitor_influencers IS 'Competitive intelligence on influencer partnerships';
COMMENT ON TABLE content_library IS 'User-generated content and approval workflow';

COMMENT ON FUNCTION calculate_influencer_performance_score(UUID, INTEGER) IS 'Calculates comprehensive performance score for influencers';
COMMENT ON FUNCTION calculate_campaign_roi(UUID) IS 'Calculates ROI and performance metrics for campaigns';
COMMENT ON FUNCTION get_influencer_recommendations(TEXT, INTEGER, INTEGER, DECIMAL, INTEGER) IS 'Returns recommended influencers based on criteria';
COMMENT ON FUNCTION update_relationship_scores() IS 'Automatically updates relationship scores based on recent interactions';