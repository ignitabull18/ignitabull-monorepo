-- Amazon Advanced APIs Schema Extension
-- This migration adds tables for Brand Analytics, DSP, Search Performance, and advanced campaign management

-- Create amazon_brand_analytics table
CREATE TABLE amazon_brand_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Report metadata
    report_type TEXT NOT NULL CHECK (report_type IN (
        'market_basket', 'search_query_performance', 'repeat_purchase', 
        'demographics', 'traffic_by_page', 'item_comparison', 'alternate_purchase'
    )),
    marketplace_id TEXT NOT NULL,
    report_date DATE NOT NULL,
    
    -- Report data (stored as JSONB for flexibility)
    data JSONB NOT NULL,
    
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Aggregated insights
    insights JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, report_type, marketplace_id, report_date)
);

-- Create amazon_dsp_campaigns table
CREATE TABLE amazon_dsp_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Campaign identification
    campaign_id TEXT NOT NULL,
    advertiser_id TEXT NOT NULL,
    
    -- Campaign details
    name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN (
        'STANDARD_DISPLAY', 'VIDEO', 'AUDIO', 'MOBILE_APP', 'CROSS_DEVICE'
    )),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED')),
    
    -- Budget and bidding
    budget_type TEXT CHECK (budget_type IN ('LIFETIME', 'DAILY')),
    budget_amount DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    bid_strategy TEXT CHECK (bid_strategy IN ('CPC', 'CPM', 'VCPM', 'AUTOMATIC')),
    
    -- Targeting
    targeting JSONB DEFAULT '{}', -- Complex targeting rules
    audiences JSONB DEFAULT '[]', -- Array of audience segments
    
    -- Performance goals
    optimization_goal TEXT CHECK (optimization_goal IN (
        'REACH', 'CONVERSIONS', 'VIEWABILITY', 'BRAND_AWARENESS', 'PURCHASE_RATE'
    )),
    kpi_goal JSONB DEFAULT '{}',
    
    -- Creative assets
    creatives JSONB DEFAULT '[]', -- Array of creative IDs and metadata
    
    -- Schedule
    start_date DATE,
    end_date DATE,
    
    -- External data
    external_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, campaign_id)
);

-- Create amazon_dsp_performance table
CREATE TABLE amazon_dsp_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dsp_campaign_id UUID REFERENCES amazon_dsp_campaigns(id) ON DELETE CASCADE,
    
    -- Time period
    date DATE NOT NULL,
    hour INTEGER, -- Optional hourly data
    
    -- Metrics
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    cost DECIMAL(15,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    viewable_impressions BIGINT DEFAULT 0,
    
    -- Calculated metrics
    ctr DECIMAL(10,4), -- Click-through rate
    cvr DECIMAL(10,4), -- Conversion rate
    cpc DECIMAL(10,2), -- Cost per click
    cpm DECIMAL(10,2), -- Cost per mille
    vcpm DECIMAL(10,2), -- Viewable CPM
    roas DECIMAL(10,2), -- Return on ad spend
    
    -- Additional metrics
    reach BIGINT DEFAULT 0,
    frequency DECIMAL(10,2),
    
    -- Attribution
    attributed_sales_14d DECIMAL(15,2),
    attributed_units_14d INTEGER,
    attributed_conversions_14d INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(dsp_campaign_id, date, hour)
);

-- Create amazon_search_performance table
CREATE TABLE amazon_search_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Product identification
    asin TEXT NOT NULL,
    marketplace_id TEXT NOT NULL,
    
    -- Time period
    date DATE NOT NULL,
    
    -- Search query data
    search_query TEXT NOT NULL,
    
    -- Metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    click_through_rate DECIMAL(10,4),
    conversion_rate DECIMAL(10,4),
    purchase_rate DECIMAL(10,4),
    
    -- Revenue and units
    revenue DECIMAL(15,2),
    units_ordered INTEGER DEFAULT 0,
    average_price DECIMAL(10,2),
    
    -- Search ranking
    search_frequency_rank INTEGER,
    relative_search_volume DECIMAL(10,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, asin, marketplace_id, date, search_query)
);

-- Create amazon_keyword_rankings table
CREATE TABLE amazon_keyword_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Product and keyword
    asin TEXT NOT NULL,
    keyword TEXT NOT NULL,
    marketplace_id TEXT NOT NULL,
    
    -- Ranking data
    current_rank INTEGER,
    previous_rank INTEGER,
    rank_change INTEGER,
    
    -- Visibility flags
    is_organic BOOLEAN DEFAULT true,
    is_sponsored BOOLEAN DEFAULT false,
    
    -- Competition metrics
    competitor_count INTEGER,
    share_of_voice DECIMAL(10,2),
    
    -- Tracking metadata
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, asin, keyword, marketplace_id, tracked_at)
);

-- Create amazon_listing_quality table
CREATE TABLE amazon_listing_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Product identification
    asin TEXT NOT NULL,
    marketplace_id TEXT NOT NULL,
    
    -- Quality scores
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- Component scores (0-100)
    title_score INTEGER,
    bullet_points_score INTEGER,
    description_score INTEGER,
    images_score INTEGER,
    keywords_score INTEGER,
    pricing_score INTEGER,
    reviews_score INTEGER,
    
    -- SEO analysis
    missing_keywords TEXT[],
    keyword_density JSONB DEFAULT '{}',
    content_gaps TEXT[],
    
    -- Competitive comparison
    category_average_score INTEGER,
    top_competitor_score INTEGER,
    market_position INTEGER,
    
    -- Recommendations
    recommendations JSONB DEFAULT '[]',
    
    -- Analysis metadata
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, asin, marketplace_id)
);

-- Create amazon_competitor_tracking table
CREATE TABLE amazon_competitor_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Our product and competitor
    our_asin TEXT NOT NULL,
    competitor_asin TEXT NOT NULL,
    marketplace_id TEXT NOT NULL,
    
    -- Competitor details
    competitor_brand TEXT,
    competitor_title TEXT,
    
    -- Shared keywords analysis
    shared_keywords TEXT[],
    exclusive_keywords TEXT[],
    overlap_score DECIMAL(10,2),
    
    -- Performance comparison
    visibility_score_ours INTEGER,
    visibility_score_theirs INTEGER,
    
    -- Threat assessment
    threat_level TEXT CHECK (threat_level IN ('HIGH', 'MEDIUM', 'LOW')),
    threat_reasons TEXT[],
    
    -- Price comparison
    our_price DECIMAL(10,2),
    their_price DECIMAL(10,2),
    price_difference_percent DECIMAL(10,2),
    
    -- Review comparison
    our_rating DECIMAL(3,2),
    their_rating DECIMAL(3,2),
    our_review_count INTEGER,
    their_review_count INTEGER,
    
    -- Tracking metadata
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, our_asin, competitor_asin, marketplace_id, tracked_at)
);

-- Create amazon_search_anomalies table
CREATE TABLE amazon_search_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Affected product
    asin TEXT NOT NULL,
    marketplace_id TEXT NOT NULL,
    
    -- Anomaly details
    anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
        'TRAFFIC_DROP', 'RANKING_LOSS', 'CTR_DECLINE', 
        'COMPETITOR_SURGE', 'ALGORITHM_UPDATE', 'SEASONAL_SHIFT'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    
    -- Detection details
    detected_date DATE NOT NULL,
    affected_keywords TEXT[],
    
    -- Impact metrics
    impressions_change DECIMAL(10,2),
    clicks_change DECIMAL(10,2),
    revenue_change DECIMAL(10,2),
    ranking_change DECIMAL(10,2),
    
    -- Analysis
    possible_causes TEXT[],
    recommended_actions TEXT[],
    
    -- Resolution tracking
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create amazon_campaign_optimization table
CREATE TABLE amazon_campaign_optimization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Campaign reference
    campaign_id TEXT NOT NULL,
    campaign_type TEXT NOT NULL, -- 'SP', 'SB', 'SD', 'DSP'
    
    -- Optimization details
    optimization_type TEXT NOT NULL CHECK (optimization_type IN (
        'BID_ADJUSTMENT', 'KEYWORD_HARVESTING', 'NEGATIVE_KEYWORDS',
        'BUDGET_REALLOCATION', 'TARGETING_REFINEMENT', 'CREATIVE_REFRESH'
    )),
    
    -- Current state
    current_metrics JSONB NOT NULL,
    
    -- Recommendation
    recommendation JSONB NOT NULL,
    expected_impact JSONB DEFAULT '{}',
    confidence_score DECIMAL(5,2),
    
    -- Implementation
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'APPROVED', 'APPLIED', 'REJECTED', 'REVERTED'
    )),
    applied_at TIMESTAMP WITH TIME ZONE,
    applied_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Results tracking
    actual_impact JSONB DEFAULT '{}',
    success_metric DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create amazon_brand_intelligence_reports table
CREATE TABLE amazon_brand_intelligence_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Report metadata
    brand_name TEXT NOT NULL,
    marketplace_id TEXT NOT NULL,
    report_period TEXT NOT NULL, -- 'WEEKLY', 'MONTHLY', 'QUARTERLY'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Aggregated insights
    market_share DECIMAL(10,2),
    market_share_trend TEXT CHECK (market_share_trend IN ('GROWING', 'STABLE', 'DECLINING')),
    
    -- Competitive insights
    top_competitors JSONB DEFAULT '[]',
    competitive_advantages TEXT[],
    competitive_weaknesses TEXT[],
    
    -- Customer insights
    customer_segments JSONB DEFAULT '[]',
    purchase_patterns JSONB DEFAULT '{}',
    brand_loyalty_score DECIMAL(5,2),
    
    -- Market trends
    trending_keywords TEXT[],
    emerging_categories TEXT[],
    seasonal_patterns JSONB DEFAULT '{}',
    
    -- Strategic recommendations
    growth_opportunities JSONB DEFAULT '[]',
    risk_factors JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    
    -- Report status
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, brand_name, marketplace_id, period_start, period_end)
);

-- Create indexes for performance
CREATE INDEX idx_brand_analytics_org_date ON amazon_brand_analytics(organization_id, report_date DESC);
CREATE INDEX idx_brand_analytics_type ON amazon_brand_analytics(integration_id, report_type);

CREATE INDEX idx_dsp_campaigns_org ON amazon_dsp_campaigns(organization_id);
CREATE INDEX idx_dsp_campaigns_status ON amazon_dsp_campaigns(integration_id, status);

CREATE INDEX idx_dsp_performance_campaign_date ON amazon_dsp_performance(dsp_campaign_id, date DESC);

CREATE INDEX idx_search_performance_asin_date ON amazon_search_performance(asin, date DESC);
CREATE INDEX idx_search_performance_query ON amazon_search_performance(search_query);
CREATE INDEX idx_search_performance_integration ON amazon_search_performance(integration_id, marketplace_id);

CREATE INDEX idx_keyword_rankings_asin ON amazon_keyword_rankings(asin, marketplace_id);
CREATE INDEX idx_keyword_rankings_keyword ON amazon_keyword_rankings(keyword, marketplace_id);
CREATE INDEX idx_keyword_rankings_changes ON amazon_keyword_rankings(rank_change) WHERE rank_change IS NOT NULL;

CREATE INDEX idx_listing_quality_asin ON amazon_listing_quality(asin, marketplace_id);
CREATE INDEX idx_listing_quality_score ON amazon_listing_quality(overall_score);

CREATE INDEX idx_competitor_tracking_asin ON amazon_competitor_tracking(our_asin, marketplace_id);
CREATE INDEX idx_competitor_tracking_threat ON amazon_competitor_tracking(threat_level);

CREATE INDEX idx_search_anomalies_asin ON amazon_search_anomalies(asin, detected_date DESC);
CREATE INDEX idx_search_anomalies_status ON amazon_search_anomalies(status) WHERE status = 'OPEN';

CREATE INDEX idx_campaign_optimization_campaign ON amazon_campaign_optimization(campaign_id, campaign_type);
CREATE INDEX idx_campaign_optimization_status ON amazon_campaign_optimization(status);

CREATE INDEX idx_brand_intelligence_brand ON amazon_brand_intelligence_reports(brand_name, marketplace_id);

-- Enable Row Level Security
ALTER TABLE amazon_brand_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_dsp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_dsp_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_search_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_listing_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_competitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_search_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_campaign_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_brand_intelligence_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using same pattern as existing tables)

-- Brand Analytics
CREATE POLICY "Organization members can view brand analytics" ON amazon_brand_analytics
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage brand analytics" ON amazon_brand_analytics
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- DSP Campaigns
CREATE POLICY "Organization members can view DSP campaigns" ON amazon_dsp_campaigns
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage DSP campaigns" ON amazon_dsp_campaigns
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- DSP Performance (view only)
CREATE POLICY "Organization members can view DSP performance" ON amazon_dsp_performance
    FOR SELECT USING (
        dsp_campaign_id IN (
            SELECT id FROM amazon_dsp_campaigns 
            WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        )
    );

-- Search Performance
CREATE POLICY "Organization members can view search performance" ON amazon_search_performance
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage search performance" ON amazon_search_performance
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Apply similar policies to all other tables
CREATE POLICY "Organization members can manage keyword rankings" ON amazon_keyword_rankings
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage listing quality" ON amazon_listing_quality
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage competitor tracking" ON amazon_competitor_tracking
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage search anomalies" ON amazon_search_anomalies
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage campaign optimizations" ON amazon_campaign_optimization
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage brand intelligence" ON amazon_brand_intelligence_reports
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Create triggers for updated_at columns
CREATE TRIGGER update_amazon_brand_analytics_updated_at BEFORE UPDATE ON amazon_brand_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_dsp_campaigns_updated_at BEFORE UPDATE ON amazon_dsp_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_keyword_rankings_updated_at BEFORE UPDATE ON amazon_keyword_rankings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_listing_quality_updated_at BEFORE UPDATE ON amazon_listing_quality
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_competitor_tracking_updated_at BEFORE UPDATE ON amazon_competitor_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_search_anomalies_updated_at BEFORE UPDATE ON amazon_search_anomalies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_campaign_optimization_updated_at BEFORE UPDATE ON amazon_campaign_optimization
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_brand_intelligence_reports_updated_at BEFORE UPDATE ON amazon_brand_intelligence_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate listing quality score
CREATE OR REPLACE FUNCTION calculate_listing_quality_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate overall score as weighted average of components
    NEW.overall_score := ROUND(
        (
            COALESCE(NEW.title_score, 0) * 0.25 +
            COALESCE(NEW.bullet_points_score, 0) * 0.20 +
            COALESCE(NEW.description_score, 0) * 0.15 +
            COALESCE(NEW.images_score, 0) * 0.20 +
            COALESCE(NEW.keywords_score, 0) * 0.10 +
            COALESCE(NEW.pricing_score, 0) * 0.05 +
            COALESCE(NEW.reviews_score, 0) * 0.05
        )::numeric
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate listing quality score
CREATE TRIGGER trigger_calculate_listing_quality
    BEFORE INSERT OR UPDATE ON amazon_listing_quality
    FOR EACH ROW EXECUTE FUNCTION calculate_listing_quality_score();

-- Create function to detect search anomalies
CREATE OR REPLACE FUNCTION detect_search_anomalies()
RETURNS void AS $$
DECLARE
    anomaly RECORD;
BEGIN
    -- Detect significant ranking drops
    FOR anomaly IN
        SELECT 
            kr.organization_id,
            kr.integration_id,
            kr.asin,
            kr.marketplace_id,
            COUNT(*) as affected_keywords_count,
            ARRAY_AGG(kr.keyword) as affected_keywords,
            AVG(kr.rank_change) as avg_rank_change
        FROM amazon_keyword_rankings kr
        WHERE kr.tracked_at >= CURRENT_DATE - INTERVAL '1 day'
        AND kr.rank_change < -5  -- Dropped more than 5 positions
        GROUP BY kr.organization_id, kr.integration_id, kr.asin, kr.marketplace_id
        HAVING COUNT(*) >= 3  -- At least 3 keywords affected
    LOOP
        INSERT INTO amazon_search_anomalies (
            organization_id, integration_id, asin, marketplace_id,
            anomaly_type, severity, detected_date, affected_keywords,
            ranking_change, possible_causes, recommended_actions
        ) VALUES (
            anomaly.organization_id,
            anomaly.integration_id,
            anomaly.asin,
            anomaly.marketplace_id,
            'RANKING_LOSS',
            CASE 
                WHEN anomaly.affected_keywords_count >= 10 THEN 'CRITICAL'
                WHEN anomaly.affected_keywords_count >= 5 THEN 'HIGH'
                ELSE 'MEDIUM'
            END,
            CURRENT_DATE,
            anomaly.affected_keywords,
            anomaly.avg_rank_change,
            ARRAY['Algorithm update', 'Competitor activity', 'Listing changes', 'Stock issues'],
            ARRAY['Review recent listing changes', 'Check competitor activity', 'Increase advertising', 'Verify inventory levels']
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run anomaly detection (requires pg_cron extension)
-- This is just a placeholder - actual scheduling would be done through the application
COMMENT ON FUNCTION detect_search_anomalies() IS 'Run daily to detect search ranking anomalies';