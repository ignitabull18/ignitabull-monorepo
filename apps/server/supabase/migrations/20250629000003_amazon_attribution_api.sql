-- Amazon Attribution API Schema Extension
-- This migration adds tables for Attribution campaigns, audiences, creatives, conversions, and AI insights

-- Create amazon_attribution_campaigns table
CREATE TABLE amazon_attribution_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Campaign identification
    campaign_id TEXT NOT NULL,
    advertiser_id TEXT NOT NULL,
    advertiser_name TEXT,
    
    -- Campaign details
    campaign_name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN (
        'SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING', 'SOCIAL', 
        'STREAMING_TV', 'AUDIO', 'EMAIL', 'AFFILIATE', 'INFLUENCER'
    )),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED', 'DRAFT')),
    
    -- Budget and schedule
    budget DECIMAL(15,2),
    daily_budget DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    start_date DATE,
    end_date DATE,
    
    -- Targeting and strategy
    targeting_type TEXT NOT NULL,
    bid_strategy TEXT NOT NULL,
    
    -- Performance metrics (cached for quick access)
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend DECIMAL(15,2) DEFAULT 0,
    detail_page_views BIGINT DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    sales DECIMAL(15,2) DEFAULT 0,
    units_ordered INTEGER DEFAULT 0,
    click_through_rate DECIMAL(10,4) DEFAULT 0,
    cost_per_click DECIMAL(10,2) DEFAULT 0,
    return_on_ad_spend DECIMAL(10,2) DEFAULT 0,
    attribution_rate DECIMAL(10,4) DEFAULT 0,
    
    -- Associated products and audiences
    products JSONB DEFAULT '[]', -- Array of ASINs
    audiences JSONB DEFAULT '[]', -- Array of audience IDs
    creatives JSONB DEFAULT '[]', -- Array of creative IDs
    
    -- Campaign metadata
    external_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, campaign_id)
);

-- Create amazon_attribution_audiences table
CREATE TABLE amazon_attribution_audiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Audience identification
    audience_id TEXT NOT NULL,
    audience_name TEXT NOT NULL,
    description TEXT,
    
    -- Audience configuration
    audience_type TEXT NOT NULL CHECK (audience_type IN (
        'DEMOGRAPHIC', 'INTEREST', 'BEHAVIORAL', 'LOOKALIKE', 'CUSTOM', 'RETARGETING'
    )),
    size BIGINT DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')),
    
    -- Targeting criteria (stored as JSONB for flexibility)
    demographics JSONB DEFAULT '{}',
    interests JSONB DEFAULT '[]',
    behaviors JSONB DEFAULT '{}',
    custom_criteria JSONB DEFAULT '[]',
    
    -- Performance metrics
    reach BIGINT DEFAULT 0,
    engagement BIGINT DEFAULT 0,
    click_through_rate DECIMAL(10,4) DEFAULT 0,
    conversion_rate DECIMAL(10,4) DEFAULT 0,
    cost_per_engagement DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, audience_id)
);

-- Create amazon_attribution_creatives table
CREATE TABLE amazon_attribution_creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Creative identification
    creative_id TEXT NOT NULL,
    creative_name TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    
    -- Creative details
    creative_type TEXT NOT NULL CHECK (creative_type IN (
        'BANNER', 'VIDEO', 'NATIVE', 'SEARCH_AD', 'SOCIAL_POST', 
        'EMAIL', 'STREAMING_TV_AD', 'AUDIO_AD'
    )),
    format TEXT NOT NULL CHECK (format IN (
        'DISPLAY_BANNER', 'VIDEO_INSTREAM', 'VIDEO_OUTSTREAM', 'NATIVE_ARTICLE',
        'NATIVE_FEED', 'SEARCH_TEXT', 'SEARCH_SHOPPING', 'SOCIAL_IMAGE',
        'SOCIAL_VIDEO', 'SOCIAL_CAROUSEL', 'EMAIL_HTML', 'EMAIL_TEXT'
    )),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')),
    
    -- Creative assets
    assets JSONB DEFAULT '[]', -- Array of asset objects
    
    -- Targeting and placement
    placements TEXT[],
    devices TEXT[],
    operating_systems TEXT[],
    browsers TEXT[],
    time_slots TEXT[],
    frequency_cap JSONB DEFAULT '{}',
    
    -- Performance metrics
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    click_through_rate DECIMAL(10,4) DEFAULT 0,
    view_through_rate DECIMAL(10,4) DEFAULT 0,
    engagement_rate DECIMAL(10,4) DEFAULT 0,
    cost_per_click DECIMAL(10,2) DEFAULT 0,
    cost_per_impression DECIMAL(10,4) DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0,
    relevance_score DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, creative_id)
);

-- Create amazon_attribution_conversions table
CREATE TABLE amazon_attribution_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Conversion identification
    conversion_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    ad_group_id TEXT,
    creative_id TEXT,
    
    -- Product and customer
    product_asin TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    
    -- Conversion details
    conversion_type TEXT NOT NULL CHECK (conversion_type IN (
        'PURCHASE', 'ADD_TO_CART', 'DETAIL_PAGE_VIEW', 'BRAND_SEARCH',
        'SUBSCRIPTION', 'LEAD_GENERATION', 'APP_INSTALL', 'VIDEO_VIEW', 'ENGAGEMENT'
    )),
    conversion_value DECIMAL(15,2) NOT NULL,
    conversion_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Attribution tracking
    click_date TIMESTAMP WITH TIME ZONE,
    view_date TIMESTAMP WITH TIME ZONE,
    time_lag INTEGER, -- hours between click and conversion
    
    -- Customer journey
    touchpoints JSONB DEFAULT '[]', -- Array of touchpoint objects
    attribution_model TEXT NOT NULL CHECK (attribution_model IN (
        'FIRST_TOUCH', 'LAST_TOUCH', 'LINEAR', 'TIME_DECAY', 
        'POSITION_BASED', 'DATA_DRIVEN', 'ALGORITHMIC'
    )),
    touchpoint_credits JSONB DEFAULT '[]', -- Credit assignment per touchpoint
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, conversion_id)
);

-- Create amazon_attribution_reports table
CREATE TABLE amazon_attribution_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Report metadata
    report_id TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN (
        'CAMPAIGN', 'PRODUCT', 'CREATIVE', 'AUDIENCE', 'CROSS_CHANNEL'
    )),
    advertiser_id TEXT NOT NULL,
    
    -- Report period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    granularity TEXT NOT NULL CHECK (granularity IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    
    -- Aggregated metrics
    total_clicks BIGINT DEFAULT 0,
    total_detail_page_views BIGINT DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_units_ordered INTEGER DEFAULT 0,
    click_through_rate DECIMAL(10,4) DEFAULT 0,
    detail_page_view_rate DECIMAL(10,4) DEFAULT 0,
    purchase_rate DECIMAL(10,4) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    return_on_ad_spend DECIMAL(10,2) DEFAULT 0,
    cost_per_click DECIMAL(10,2),
    cost_per_detail_page_view DECIMAL(10,2),
    cost_per_purchase DECIMAL(10,2),
    
    -- Breakdown data (daily/weekly/monthly)
    breakdown JSONB DEFAULT '[]',
    
    -- Report generation
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, report_id)
);

-- Create amazon_cross_channel_analysis table
CREATE TABLE amazon_cross_channel_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Analysis metadata
    analysis_id TEXT NOT NULL,
    advertiser_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Channel performance data
    channels JSONB DEFAULT '[]', -- Array of channel performance objects
    
    -- Cross-channel metrics
    total_reach BIGINT DEFAULT 0,
    unique_reach BIGINT DEFAULT 0,
    frequency_distribution JSONB DEFAULT '[]',
    channel_overlap JSONB DEFAULT '[]',
    incremental_impact JSONB DEFAULT '[]',
    
    -- Customer journey insights
    average_journey_length DECIMAL(10,2) DEFAULT 0,
    average_time_lag INTEGER DEFAULT 0, -- hours
    common_paths JSONB DEFAULT '[]',
    conversion_funnels JSONB DEFAULT '[]',
    dropoff_points JSONB DEFAULT '[]',
    
    -- Recommendations
    recommendations JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, analysis_id)
);

-- Create amazon_attribution_optimization table
CREATE TABLE amazon_attribution_optimization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Suggestion metadata
    suggestion_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    
    -- Optimization details
    type TEXT NOT NULL CHECK (type IN (
        'BUDGET', 'TARGETING', 'CREATIVE', 'BIDDING', 'FREQUENCY'
    )),
    priority TEXT NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Current performance
    current_metric TEXT NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    
    -- Projected improvement
    projected_metric TEXT NOT NULL,
    projected_improvement DECIMAL(10,2) NOT NULL, -- percentage
    confidence DECIMAL(5,2) NOT NULL, -- 0-100
    
    -- Implementation
    implementation_steps TEXT[],
    effort TEXT NOT NULL CHECK (effort IN ('LOW', 'MEDIUM', 'HIGH')),
    timeline TEXT NOT NULL,
    cost DECIMAL(15,2),
    
    -- Risk assessment
    risks JSONB DEFAULT '[]',
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'APPROVED', 'APPLIED', 'REJECTED', 'EXPIRED'
    )),
    applied_at TIMESTAMP WITH TIME ZONE,
    applied_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Results
    actual_improvement DECIMAL(10,2),
    success_metric DECIMAL(10,2),
    
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, suggestion_id)
);

-- Create amazon_ai_insights table
CREATE TABLE amazon_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Insight metadata
    insight_id TEXT NOT NULL,
    asin TEXT,
    marketplace_id TEXT,
    
    -- Insight classification
    type TEXT NOT NULL CHECK (type IN (
        'OPPORTUNITY', 'RISK', 'TREND', 'ANOMALY', 'RECOMMENDATION', 'PREDICTION'
    )),
    category TEXT NOT NULL CHECK (category IN (
        'SEARCH_PERFORMANCE', 'LISTING_OPTIMIZATION', 'COMPETITOR_ACTIVITY',
        'MARKET_TRENDS', 'PRICING_STRATEGY', 'INVENTORY_MANAGEMENT',
        'ADVERTISING_OPTIMIZATION', 'CUSTOMER_BEHAVIOR'
    )),
    priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    
    -- Insight content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact assessment
    impact_metric TEXT NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    potential_value DECIMAL(15,2) NOT NULL,
    percentage_change DECIMAL(10,2) NOT NULL,
    
    -- Evidence and confidence
    evidence JSONB NOT NULL DEFAULT '{}',
    confidence DECIMAL(5,2) NOT NULL, -- 0-100
    
    -- Recommendations
    recommendations JSONB DEFAULT '[]',
    
    -- Related data
    related_asins TEXT[],
    
    -- Lifecycle
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, insight_id)
);

-- Create amazon_market_opportunities table
CREATE TABLE amazon_market_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Opportunity metadata
    opportunity_id TEXT NOT NULL,
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN (
        'UNTAPPED_KEYWORD', 'EMERGING_CATEGORY', 'SEASONAL_TREND',
        'COMPETITOR_GAP', 'PRICE_OPTIMIZATION', 'BUNDLE_OPPORTUNITY'
    )),
    category TEXT,
    marketplace_id TEXT NOT NULL,
    
    -- Market assessment
    market_size BIGINT NOT NULL,
    competition_level TEXT NOT NULL CHECK (competition_level IN ('LOW', 'MEDIUM', 'HIGH')),
    entry_barrier TEXT NOT NULL CHECK (entry_barrier IN ('LOW', 'MEDIUM', 'HIGH')),
    
    -- Financial projections
    profit_potential DECIMAL(15,2) NOT NULL,
    required_investment DECIMAL(15,2),
    time_to_market TEXT,
    
    -- Risk assessment
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    risk_factors TEXT[],
    
    -- Implementation plan
    action_plan JSONB DEFAULT '[]',
    
    -- Tracking
    status TEXT NOT NULL DEFAULT 'IDENTIFIED' CHECK (status IN (
        'IDENTIFIED', 'EVALUATING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'
    )),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, opportunity_id)
);

-- Create amazon_predictive_analytics table
CREATE TABLE amazon_predictive_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Prediction metadata
    prediction_id TEXT NOT NULL,
    asin TEXT,
    marketplace_id TEXT,
    
    -- Prediction details
    prediction_type TEXT NOT NULL CHECK (prediction_type IN (
        'SALES_FORECAST', 'RANKING_FORECAST', 'TREND_FORECAST', 'DEMAND_FORECAST'
    )),
    timeframe TEXT NOT NULL, -- e.g., "30 days", "3 months"
    model_version TEXT,
    
    -- Predictions array
    predictions JSONB NOT NULL DEFAULT '[]',
    
    -- Model performance
    accuracy DECIMAL(5,2) NOT NULL, -- 0-100
    confidence_intervals JSONB DEFAULT '{}',
    
    -- Contributing factors
    factors JSONB DEFAULT '[]',
    
    -- Generation metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, prediction_id)
);

-- Create amazon_strategic_recommendations table
CREATE TABLE amazon_strategic_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    
    -- Recommendation metadata
    recommendation_id TEXT NOT NULL,
    asin TEXT,
    marketplace_id TEXT,
    
    -- Strategy details
    strategy TEXT NOT NULL,
    objective TEXT NOT NULL,
    current_state JSONB NOT NULL,
    target_state JSONB NOT NULL,
    
    -- Implementation plan
    phases JSONB DEFAULT '[]',
    total_investment DECIMAL(15,2),
    expected_roi DECIMAL(10,2),
    payback_period TEXT,
    
    -- Risk assessment
    risks JSONB DEFAULT '[]',
    
    -- Progress tracking
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Milestones
    milestones JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(integration_id, recommendation_id)
);

-- Create indexes for performance
CREATE INDEX idx_attribution_campaigns_org ON amazon_attribution_campaigns(organization_id);
CREATE INDEX idx_attribution_campaigns_status ON amazon_attribution_campaigns(integration_id, status);
CREATE INDEX idx_attribution_campaigns_type ON amazon_attribution_campaigns(campaign_type);
CREATE INDEX idx_attribution_campaigns_performance ON amazon_attribution_campaigns(return_on_ad_spend DESC) WHERE return_on_ad_spend > 0;

CREATE INDEX idx_attribution_audiences_org ON amazon_attribution_audiences(organization_id);
CREATE INDEX idx_attribution_audiences_type ON amazon_attribution_audiences(audience_type);
CREATE INDEX idx_attribution_audiences_status ON amazon_attribution_audiences(status);

CREATE INDEX idx_attribution_creatives_campaign ON amazon_attribution_creatives(campaign_id);
CREATE INDEX idx_attribution_creatives_type ON amazon_attribution_creatives(creative_type);
CREATE INDEX idx_attribution_creatives_performance ON amazon_attribution_creatives(click_through_rate DESC);

CREATE INDEX idx_attribution_conversions_campaign ON amazon_attribution_conversions(campaign_id);
CREATE INDEX idx_attribution_conversions_asin ON amazon_attribution_conversions(product_asin);
CREATE INDEX idx_attribution_conversions_date ON amazon_attribution_conversions(conversion_date DESC);
CREATE INDEX idx_attribution_conversions_type ON amazon_attribution_conversions(conversion_type);

CREATE INDEX idx_attribution_reports_advertiser ON amazon_attribution_reports(advertiser_id);
CREATE INDEX idx_attribution_reports_date ON amazon_attribution_reports(start_date DESC, end_date DESC);
CREATE INDEX idx_attribution_reports_type ON amazon_attribution_reports(report_type);

CREATE INDEX idx_cross_channel_analysis_advertiser ON amazon_cross_channel_analysis(advertiser_id);
CREATE INDEX idx_cross_channel_analysis_date ON amazon_cross_channel_analysis(start_date DESC);

CREATE INDEX idx_attribution_optimization_campaign ON amazon_attribution_optimization(campaign_id);
CREATE INDEX idx_attribution_optimization_priority ON amazon_attribution_optimization(priority) WHERE status = 'PENDING';
CREATE INDEX idx_attribution_optimization_expires ON amazon_attribution_optimization(expires_at) WHERE status = 'PENDING';

CREATE INDEX idx_ai_insights_asin ON amazon_ai_insights(asin, marketplace_id);
CREATE INDEX idx_ai_insights_type ON amazon_ai_insights(type, category);
CREATE INDEX idx_ai_insights_priority ON amazon_ai_insights(priority) WHERE expires_at > NOW();
CREATE INDEX idx_ai_insights_expires ON amazon_ai_insights(expires_at);

CREATE INDEX idx_market_opportunities_type ON amazon_market_opportunities(opportunity_type);
CREATE INDEX idx_market_opportunities_competition ON amazon_market_opportunities(competition_level);
CREATE INDEX idx_market_opportunities_profit ON amazon_market_opportunities(profit_potential DESC);

CREATE INDEX idx_predictive_analytics_asin ON amazon_predictive_analytics(asin, marketplace_id);
CREATE INDEX idx_predictive_analytics_type ON amazon_predictive_analytics(prediction_type);
CREATE INDEX idx_predictive_analytics_generated ON amazon_predictive_analytics(generated_at DESC);

CREATE INDEX idx_strategic_recommendations_asin ON amazon_strategic_recommendations(asin, marketplace_id);
CREATE INDEX idx_strategic_recommendations_status ON amazon_strategic_recommendations(status);
CREATE INDEX idx_strategic_recommendations_roi ON amazon_strategic_recommendations(expected_roi DESC);

-- Enable Row Level Security
ALTER TABLE amazon_attribution_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_attribution_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_attribution_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_attribution_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_attribution_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_cross_channel_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_attribution_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_market_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_predictive_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_strategic_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organization members can manage attribution campaigns" ON amazon_attribution_campaigns
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage attribution audiences" ON amazon_attribution_audiences
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage attribution creatives" ON amazon_attribution_creatives
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can view attribution conversions" ON amazon_attribution_conversions
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage attribution reports" ON amazon_attribution_reports
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage cross channel analysis" ON amazon_cross_channel_analysis
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage attribution optimization" ON amazon_attribution_optimization
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage AI insights" ON amazon_ai_insights
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage market opportunities" ON amazon_market_opportunities
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage predictive analytics" ON amazon_predictive_analytics
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization members can manage strategic recommendations" ON amazon_strategic_recommendations
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Create triggers for updated_at columns
CREATE TRIGGER update_amazon_attribution_campaigns_updated_at BEFORE UPDATE ON amazon_attribution_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_attribution_audiences_updated_at BEFORE UPDATE ON amazon_attribution_audiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_attribution_creatives_updated_at BEFORE UPDATE ON amazon_attribution_creatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_attribution_optimization_updated_at BEFORE UPDATE ON amazon_attribution_optimization
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_market_opportunities_updated_at BEFORE UPDATE ON amazon_market_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amazon_strategic_recommendations_updated_at BEFORE UPDATE ON amazon_strategic_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate attribution campaign performance
CREATE OR REPLACE FUNCTION update_attribution_campaign_performance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign performance metrics from conversions
    UPDATE amazon_attribution_campaigns 
    SET 
        purchases = (
            SELECT COUNT(*) FROM amazon_attribution_conversions 
            WHERE campaign_id = NEW.campaign_id 
            AND conversion_type = 'PURCHASE'
        ),
        sales = (
            SELECT COALESCE(SUM(conversion_value), 0) FROM amazon_attribution_conversions 
            WHERE campaign_id = NEW.campaign_id 
            AND conversion_type = 'PURCHASE'
        ),
        detail_page_views = (
            SELECT COUNT(*) FROM amazon_attribution_conversions 
            WHERE campaign_id = NEW.campaign_id 
            AND conversion_type = 'DETAIL_PAGE_VIEW'
        ),
        updated_at = NOW()
    WHERE campaign_id = NEW.campaign_id;
    
    -- Calculate ROAS if spend > 0
    UPDATE amazon_attribution_campaigns 
    SET return_on_ad_spend = CASE 
        WHEN spend > 0 THEN sales / spend 
        ELSE 0 
    END
    WHERE campaign_id = NEW.campaign_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update campaign performance when conversions are added
CREATE TRIGGER trigger_update_attribution_performance
    AFTER INSERT OR UPDATE ON amazon_attribution_conversions
    FOR EACH ROW EXECUTE FUNCTION update_attribution_campaign_performance();

-- Create function to clean up expired insights and recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_amazon_data()
RETURNS void AS $$
BEGIN
    -- Delete expired AI insights
    DELETE FROM amazon_ai_insights 
    WHERE expires_at < NOW();
    
    -- Delete expired optimization suggestions
    DELETE FROM amazon_attribution_optimization 
    WHERE expires_at < NOW() AND status = 'PENDING';
    
    -- Update expired suggestions to expired status instead of deleting
    UPDATE amazon_attribution_optimization 
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE expires_at < NOW() AND status != 'EXPIRED';
    
END;
$$ LANGUAGE plpgsql;

-- Create function to generate cross-channel analysis
CREATE OR REPLACE FUNCTION generate_cross_channel_analysis(
    p_advertiser_id TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_campaigns INTEGER,
    total_spend DECIMAL(15,2),
    total_sales DECIMAL(15,2),
    overall_roas DECIMAL(10,2),
    channel_breakdown JSONB
) AS $$
DECLARE
    channel_data JSONB;
BEGIN
    -- Aggregate campaign performance by channel
    SELECT json_agg(
        json_build_object(
            'channel', campaign_type,
            'campaigns', campaign_count,
            'spend', total_spend,
            'sales', total_sales,
            'roas', CASE WHEN total_spend > 0 THEN total_sales / total_spend ELSE 0 END,
            'contribution', CASE WHEN sum_sales > 0 THEN (total_sales / sum_sales) * 100 ELSE 0 END
        )
    ) INTO channel_data
    FROM (
        SELECT 
            campaign_type,
            COUNT(*) as campaign_count,
            SUM(spend) as total_spend,
            SUM(sales) as total_sales,
            SUM(SUM(sales)) OVER () as sum_sales
        FROM amazon_attribution_campaigns aac
        JOIN amazon_attribution_reports aar ON aac.campaign_id = aar.report_id
        WHERE aac.advertiser_id = p_advertiser_id
        AND aar.start_date >= p_start_date
        AND aar.end_date <= p_end_date
        GROUP BY campaign_type
    ) channel_summary;
    
    -- Return aggregated results
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM amazon_attribution_campaigns WHERE advertiser_id = p_advertiser_id),
        (SELECT COALESCE(SUM(spend), 0) FROM amazon_attribution_campaigns WHERE advertiser_id = p_advertiser_id),
        (SELECT COALESCE(SUM(sales), 0) FROM amazon_attribution_campaigns WHERE advertiser_id = p_advertiser_id),
        (SELECT CASE WHEN SUM(spend) > 0 THEN SUM(sales) / SUM(spend) ELSE 0 END FROM amazon_attribution_campaigns WHERE advertiser_id = p_advertiser_id),
        channel_data;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for API performance optimization
CREATE INDEX idx_attribution_campaigns_advertiser_active ON amazon_attribution_campaigns(advertiser_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_attribution_conversions_recent ON amazon_attribution_conversions(conversion_date) WHERE conversion_date >= CURRENT_DATE - INTERVAL '30 days';
CREATE INDEX idx_ai_insights_active ON amazon_ai_insights(asin, category) WHERE expires_at > NOW();

-- Add comments for documentation
COMMENT ON TABLE amazon_attribution_campaigns IS 'Attribution campaigns for tracking off-Amazon marketing efforts';
COMMENT ON TABLE amazon_attribution_audiences IS 'Audience segments for attribution campaigns';
COMMENT ON TABLE amazon_attribution_creatives IS 'Creative assets used in attribution campaigns';
COMMENT ON TABLE amazon_attribution_conversions IS 'Conversion events tracked through attribution';
COMMENT ON TABLE amazon_attribution_reports IS 'Generated attribution reports and analytics';
COMMENT ON TABLE amazon_cross_channel_analysis IS 'Cross-channel performance analysis results';
COMMENT ON TABLE amazon_attribution_optimization IS 'AI-generated optimization suggestions for campaigns';
COMMENT ON TABLE amazon_ai_insights IS 'AI-generated insights for products and campaigns';
COMMENT ON TABLE amazon_market_opportunities IS 'Identified market opportunities and growth potential';
COMMENT ON TABLE amazon_predictive_analytics IS 'Predictive analytics forecasts and models';
COMMENT ON TABLE amazon_strategic_recommendations IS 'Strategic recommendations for business growth';

COMMENT ON FUNCTION generate_cross_channel_analysis IS 'Generate cross-channel analysis for attribution campaigns';
COMMENT ON FUNCTION cleanup_expired_amazon_data IS 'Clean up expired insights and recommendations - run daily';
COMMENT ON FUNCTION update_attribution_campaign_performance IS 'Update campaign performance metrics from conversions';