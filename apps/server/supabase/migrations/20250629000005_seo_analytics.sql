-- SEO Analytics Database Schema
-- Migration for SEO monitoring and automated insights

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- SEO Metrics Table
CREATE TABLE seo_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  h1_tags TEXT[],
  h2_tags TEXT[],
  h3_tags TEXT[],
  image_count INTEGER DEFAULT 0,
  internal_links INTEGER DEFAULT 0,
  external_links INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- minutes
  load_time INTEGER DEFAULT 0, -- milliseconds
  mobile_score INTEGER DEFAULT 0,
  desktop_score INTEGER DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  accessibility_score INTEGER DEFAULT 0,
  best_practices_score INTEGER DEFAULT 0,
  performance_score INTEGER DEFAULT 0,
  crawl_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified TIMESTAMPTZ,
  canonical TEXT,
  robots TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_card TEXT,
  schema_markup JSONB DEFAULT '[]',
  issues JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keyword Rankings Table
CREATE TABLE keyword_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  position INTEGER NOT NULL,
  previous_position INTEGER,
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  country TEXT DEFAULT 'US',
  device TEXT CHECK (device IN ('desktop', 'mobile')) DEFAULT 'desktop',
  search_engine TEXT CHECK (search_engine IN ('google', 'bing', 'yahoo')) DEFAULT 'google',
  tracking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  position_history JSONB DEFAULT '[]',
  serp_features JSONB DEFAULT '[]',
  competitor_rankings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backlink Profile Table
CREATE TABLE backlink_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL UNIQUE,
  total_backlinks INTEGER DEFAULT 0,
  total_referring_domains INTEGER DEFAULT 0,
  total_dofollow_links INTEGER DEFAULT 0,
  total_nofollow_links INTEGER DEFAULT 0,
  domain_authority INTEGER DEFAULT 0,
  page_authority INTEGER DEFAULT 0,
  spam_score INTEGER DEFAULT 0,
  top_referring_domains JSONB DEFAULT '[]',
  anchor_text_distribution JSONB DEFAULT '[]',
  link_types JSONB DEFAULT '{}',
  new_links JSONB DEFAULT '[]',
  lost_links JSONB DEFAULT '[]',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual Backlinks Table
CREATE TABLE backlinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  anchor_text TEXT,
  link_type TEXT CHECK (link_type IN ('dofollow', 'nofollow')) DEFAULT 'dofollow',
  domain_authority INTEGER DEFAULT 0,
  page_authority INTEGER DEFAULT 0,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  spam_score INTEGER DEFAULT 0,
  country TEXT,
  language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Technical SEO Table
CREATE TABLE technical_seo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL,
  crawl_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_pages INTEGER DEFAULT 0,
  indexable_pages INTEGER DEFAULT 0,
  non_indexable_pages INTEGER DEFAULT 0,
  duplicate_pages INTEGER DEFAULT 0,
  broken_links INTEGER DEFAULT 0,
  redirect_chains INTEGER DEFAULT 0,
  missing_titles INTEGER DEFAULT 0,
  duplicate_titles INTEGER DEFAULT 0,
  missing_descriptions INTEGER DEFAULT 0,
  duplicate_descriptions INTEGER DEFAULT 0,
  missing_h1 INTEGER DEFAULT 0,
  multiple_h1 INTEGER DEFAULT 0,
  large_images INTEGER DEFAULT 0,
  missing_alt_text INTEGER DEFAULT 0,
  slow_pages INTEGER DEFAULT 0,
  mobile_issues INTEGER DEFAULT 0,
  https_issues INTEGER DEFAULT 0,
  sitemap_status JSONB DEFAULT '{}',
  robots_txt_status JSONB DEFAULT '{}',
  core_web_vitals JSONB DEFAULT '{}',
  security_headers JSONB DEFAULT '{}',
  structured_data_issues JSONB DEFAULT '[]',
  crawl_errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content Analysis Table
CREATE TABLE content_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- minutes
  readability_score DECIMAL(5,2) DEFAULT 0,
  keyword_density JSONB DEFAULT '[]',
  topic_relevance DECIMAL(5,2) DEFAULT 0,
  semantic_keywords TEXT[],
  entity_mentions JSONB DEFAULT '[]',
  content_gaps TEXT[],
  competitor_comparison JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')) DEFAULT 'neutral',
  language TEXT DEFAULT 'en',
  publish_date TIMESTAMPTZ,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO Insights Table
CREATE TABLE seo_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('opportunity', 'issue', 'trend', 'alert')) NOT NULL,
  category TEXT CHECK (category IN ('rankings', 'traffic', 'technical', 'content', 'backlinks')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT CHECK (impact IN ('positive', 'negative', 'neutral')) DEFAULT 'neutral',
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  affected_urls TEXT[],
  metrics JSONB DEFAULT '{}',
  recommendations TEXT[],
  estimated_traffic_impact INTEGER DEFAULT 0,
  estimated_ranking_impact INTEGER DEFAULT 0,
  auto_generated BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO Reports Table
CREATE TABLE seo_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL,
  report_type TEXT CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  overall_score INTEGER DEFAULT 0,
  previous_score INTEGER,
  summary JSONB DEFAULT '{}',
  sections JSONB DEFAULT '{}',
  insights JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO Audits Table
CREATE TABLE seo_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL,
  audit_type TEXT CHECK (audit_type IN ('full', 'technical', 'content', 'competitive')) NOT NULL DEFAULT 'full',
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  results JSONB,
  configuration JSONB DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO Opportunities Table
CREATE TABLE seo_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('keyword', 'content', 'technical', 'backlink')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_traffic INTEGER DEFAULT 0,
  estimated_value DECIMAL(10,2) DEFAULT 0,
  difficulty INTEGER DEFAULT 0 CHECK (difficulty >= 0 AND difficulty <= 100),
  time_to_result INTEGER DEFAULT 0, -- days
  requirements TEXT[],
  kpis TEXT[],
  is_tracked BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('new', 'in_progress', 'completed', 'dismissed')) DEFAULT 'new',
  assigned_to TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitor Analysis Table
CREATE TABLE competitor_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL,
  competitor TEXT NOT NULL,
  analysis_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metrics JSONB DEFAULT '{}',
  keyword_gaps JSONB DEFAULT '{}',
  content_gaps JSONB DEFAULT '{}',
  backlink_gaps JSONB DEFAULT '{}',
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],
  threats TEXT[],
  overall_competitive_strength INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_seo_metrics_domain ON seo_metrics(domain);
CREATE INDEX idx_seo_metrics_url ON seo_metrics(url);
CREATE INDEX idx_seo_metrics_crawl_date ON seo_metrics(crawl_date);
CREATE INDEX idx_seo_metrics_seo_score ON seo_metrics(seo_score);
CREATE INDEX idx_seo_metrics_domain_crawl_date ON seo_metrics(domain, crawl_date);

CREATE INDEX idx_keyword_rankings_domain ON keyword_rankings(domain);
CREATE INDEX idx_keyword_rankings_keyword ON keyword_rankings(keyword);
CREATE INDEX idx_keyword_rankings_position ON keyword_rankings(position);
CREATE INDEX idx_keyword_rankings_tracking_date ON keyword_rankings(tracking_date);
CREATE INDEX idx_keyword_rankings_domain_keyword ON keyword_rankings(domain, keyword);
CREATE INDEX idx_keyword_rankings_keyword_tracking_date ON keyword_rankings(keyword, tracking_date);

CREATE INDEX idx_backlink_profiles_domain ON backlink_profiles(domain);
CREATE INDEX idx_backlink_profiles_domain_authority ON backlink_profiles(domain_authority);
CREATE INDEX idx_backlink_profiles_last_updated ON backlink_profiles(last_updated);

CREATE INDEX idx_backlinks_source_domain ON backlinks(source_domain);
CREATE INDEX idx_backlinks_target_domain ON backlinks(target_domain);
CREATE INDEX idx_backlinks_target_url ON backlinks(target_url);
CREATE INDEX idx_backlinks_link_type ON backlinks(link_type);
CREATE INDEX idx_backlinks_is_active ON backlinks(is_active);
CREATE INDEX idx_backlinks_first_seen ON backlinks(first_seen);

CREATE INDEX idx_technical_seo_domain ON technical_seo(domain);
CREATE INDEX idx_technical_seo_crawl_date ON technical_seo(crawl_date);

CREATE INDEX idx_content_analysis_url ON content_analysis(url);
CREATE INDEX idx_content_analysis_word_count ON content_analysis(word_count);
CREATE INDEX idx_content_analysis_readability_score ON content_analysis(readability_score);
CREATE INDEX idx_content_analysis_last_updated ON content_analysis(last_updated);

CREATE INDEX idx_seo_insights_type ON seo_insights(type);
CREATE INDEX idx_seo_insights_category ON seo_insights(category);
CREATE INDEX idx_seo_insights_severity ON seo_insights(severity);
CREATE INDEX idx_seo_insights_is_read ON seo_insights(is_read);
CREATE INDEX idx_seo_insights_is_dismissed ON seo_insights(is_dismissed);
CREATE INDEX idx_seo_insights_created_at ON seo_insights(created_at);

CREATE INDEX idx_seo_reports_domain ON seo_reports(domain);
CREATE INDEX idx_seo_reports_report_type ON seo_reports(report_type);
CREATE INDEX idx_seo_reports_generated_at ON seo_reports(generated_at);

CREATE INDEX idx_seo_audits_domain ON seo_audits(domain);
CREATE INDEX idx_seo_audits_status ON seo_audits(status);
CREATE INDEX idx_seo_audits_audit_type ON seo_audits(audit_type);
CREATE INDEX idx_seo_audits_started_at ON seo_audits(started_at);

CREATE INDEX idx_seo_opportunities_type ON seo_opportunities(type);
CREATE INDEX idx_seo_opportunities_status ON seo_opportunities(status);
CREATE INDEX idx_seo_opportunities_estimated_value ON seo_opportunities(estimated_value);
CREATE INDEX idx_seo_opportunities_assigned_to ON seo_opportunities(assigned_to);
CREATE INDEX idx_seo_opportunities_due_date ON seo_opportunities(due_date);

CREATE INDEX idx_competitor_analysis_domain ON competitor_analysis(domain);
CREATE INDEX idx_competitor_analysis_competitor ON competitor_analysis(competitor);
CREATE INDEX idx_competitor_analysis_analysis_date ON competitor_analysis(analysis_date);

-- GIN indexes for JSONB columns
CREATE INDEX idx_seo_metrics_schema_markup ON seo_metrics USING GIN(schema_markup);
CREATE INDEX idx_seo_metrics_issues ON seo_metrics USING GIN(issues);
CREATE INDEX idx_keyword_rankings_position_history ON keyword_rankings USING GIN(position_history);
CREATE INDEX idx_keyword_rankings_serp_features ON keyword_rankings USING GIN(serp_features);
CREATE INDEX idx_technical_seo_core_web_vitals ON technical_seo USING GIN(core_web_vitals);
CREATE INDEX idx_content_analysis_entity_mentions ON content_analysis USING GIN(entity_mentions);
CREATE INDEX idx_seo_insights_metrics ON seo_insights USING GIN(metrics);

-- Text search indexes
CREATE INDEX idx_seo_metrics_title_trgm ON seo_metrics USING GIN(title gin_trgm_ops);
CREATE INDEX idx_keyword_rankings_keyword_trgm ON keyword_rankings USING GIN(keyword gin_trgm_ops);
CREATE INDEX idx_content_analysis_content_trgm ON content_analysis USING GIN(content gin_trgm_ops);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_seo_metrics_updated_at 
  BEFORE UPDATE ON seo_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keyword_rankings_updated_at 
  BEFORE UPDATE ON keyword_rankings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_insights_updated_at 
  BEFORE UPDATE ON seo_insights 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_audits_updated_at 
  BEFORE UPDATE ON seo_audits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_opportunities_updated_at 
  BEFORE UPDATE ON seo_opportunities 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEO Analytics Functions
CREATE OR REPLACE FUNCTION calculate_domain_seo_score(
  p_domain TEXT
)
RETURNS TABLE (
  overall_score DECIMAL,
  technical_score DECIMAL,
  content_score DECIMAL,
  backlink_score DECIMAL,
  total_pages BIGINT,
  total_issues BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH seo_stats AS (
    SELECT 
      AVG(sm.seo_score) as avg_seo_score,
      COUNT(*) as page_count
    FROM seo_metrics sm
    WHERE sm.domain = p_domain
      AND sm.crawl_date >= NOW() - INTERVAL '30 days'
  ),
  technical_stats AS (
    SELECT 
      CASE 
        WHEN ts.total_pages > 0 THEN
          100 - ((ts.missing_titles + ts.duplicate_titles + ts.missing_h1 + ts.mobile_issues) * 100.0 / ts.total_pages)
        ELSE 0
      END as tech_score
    FROM technical_seo ts
    WHERE ts.domain = p_domain
    ORDER BY ts.crawl_date DESC
    LIMIT 1
  ),
  content_stats AS (
    SELECT 
      AVG(ca.readability_score) as avg_readability
    FROM content_analysis ca
    JOIN seo_metrics sm ON ca.url = sm.url
    WHERE sm.domain = p_domain
      AND ca.last_updated >= NOW() - INTERVAL '30 days'
  ),
  backlink_stats AS (
    SELECT 
      LEAST(bp.domain_authority, 100) as bl_score
    FROM backlink_profiles bp
    WHERE bp.domain = p_domain
  ),
  issue_stats AS (
    SELECT 
      COUNT(*) as total_issues
    FROM seo_insights si
    WHERE si.type = 'issue'
      AND p_domain = ANY(si.affected_urls)
      AND si.created_at >= NOW() - INTERVAL '30 days'
  )
  SELECT 
    COALESCE(ss.avg_seo_score, 0),
    COALESCE(ts.tech_score, 0),
    COALESCE(cs.avg_readability, 0),
    COALESCE(bs.bl_score, 0),
    COALESCE(ss.page_count, 0),
    COALESCE(is_t.total_issues, 0)
  FROM seo_stats ss
  FULL OUTER JOIN technical_stats ts ON TRUE
  FULL OUTER JOIN content_stats cs ON TRUE
  FULL OUTER JOIN backlink_stats bs ON TRUE
  FULL OUTER JOIN issue_stats is_t ON TRUE;
END;
$$ LANGUAGE plpgsql;

-- Keyword Ranking Trend Function
CREATE OR REPLACE FUNCTION get_keyword_ranking_trends(
  p_domain TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  keyword TEXT,
  current_position INTEGER,
  previous_position INTEGER,
  position_change INTEGER,
  trend_direction TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_rankings AS (
    SELECT 
      kr.keyword,
      kr.position,
      kr.tracking_date,
      ROW_NUMBER() OVER (PARTITION BY kr.keyword ORDER BY kr.tracking_date DESC) as rn
    FROM keyword_rankings kr
    WHERE kr.domain = p_domain
      AND kr.tracking_date >= NOW() - INTERVAL '1 day' * p_days
  ),
  current_vs_previous AS (
    SELECT 
      r1.keyword,
      r1.position as current_pos,
      COALESCE(r2.position, r1.position) as previous_pos
    FROM recent_rankings r1
    LEFT JOIN recent_rankings r2 ON r1.keyword = r2.keyword AND r2.rn = 2
    WHERE r1.rn = 1
  )
  SELECT 
    cvp.keyword,
    cvp.current_pos,
    cvp.previous_pos,
    cvp.previous_pos - cvp.current_pos as change,
    CASE 
      WHEN cvp.previous_pos - cvp.current_pos > 0 THEN 'improving'
      WHEN cvp.previous_pos - cvp.current_pos < 0 THEN 'declining'
      ELSE 'stable'
    END as direction
  FROM current_vs_previous cvp
  ORDER BY ABS(cvp.previous_pos - cvp.current_pos) DESC;
END;
$$ LANGUAGE plpgsql;

-- Content Optimization Opportunities Function
CREATE OR REPLACE FUNCTION find_content_opportunities(
  p_domain TEXT
)
RETURNS TABLE (
  url TEXT,
  title TEXT,
  word_count INTEGER,
  readability_score DECIMAL,
  opportunity_type TEXT,
  priority_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.url,
    ca.title,
    ca.word_count,
    ca.readability_score,
    CASE 
      WHEN ca.word_count < 300 THEN 'thin_content'
      WHEN ca.readability_score < 30 THEN 'readability_improvement'
      WHEN sm.seo_score < 70 THEN 'seo_optimization'
      ELSE 'content_expansion'
    END as opp_type,
    CASE 
      WHEN ca.word_count < 300 THEN 90
      WHEN ca.readability_score < 30 THEN 70
      WHEN sm.seo_score < 70 THEN 80
      ELSE 50
    END as priority
  FROM content_analysis ca
  JOIN seo_metrics sm ON ca.url = sm.url
  WHERE sm.domain = p_domain
    AND (ca.word_count < 500 OR ca.readability_score < 50 OR sm.seo_score < 70)
  ORDER BY priority DESC, ca.last_updated DESC;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate SEO insights based on data patterns
CREATE OR REPLACE FUNCTION generate_automated_insights()
RETURNS INTEGER AS $$
DECLARE
  insight_count INTEGER := 0;
  domain_record RECORD;
  metric_record RECORD;
BEGIN
  -- Generate insights for domains with recent crawl data
  FOR domain_record IN 
    SELECT DISTINCT domain 
    FROM seo_metrics 
    WHERE crawl_date >= NOW() - INTERVAL '7 days'
  LOOP
    -- Check for missing titles
    SELECT COUNT(*) INTO metric_record 
    FROM seo_metrics 
    WHERE domain = domain_record.domain 
      AND (title IS NULL OR title = '')
      AND crawl_date >= NOW() - INTERVAL '7 days';
    
    IF metric_record.count > 0 THEN
      INSERT INTO seo_insights (
        type, category, title, description, impact, severity, confidence,
        affected_urls, metrics, recommendations, estimated_traffic_impact,
        auto_generated
      )
      SELECT 
        'issue',
        'technical',
        'Missing Page Titles Detected',
        format('%s pages are missing title tags', metric_record.count),
        'negative',
        CASE WHEN metric_record.count > 10 THEN 'high' ELSE 'medium' END,
        1.0,
        ARRAY[domain_record.domain],
        json_build_object('missing_titles', metric_record.count),
        ARRAY['Add unique, descriptive title tags to all pages', 'Ensure titles are 50-60 characters long'],
        metric_record.count * -5,
        TRUE
      WHERE NOT EXISTS (
        SELECT 1 FROM seo_insights 
        WHERE title = 'Missing Page Titles Detected' 
          AND domain_record.domain = ANY(affected_urls)
          AND created_at >= NOW() - INTERVAL '7 days'
      );
      
      insight_count := insight_count + 1;
    END IF;
    
    -- Check for low SEO scores
    SELECT AVG(seo_score) INTO metric_record 
    FROM seo_metrics 
    WHERE domain = domain_record.domain 
      AND crawl_date >= NOW() - INTERVAL '7 days';
    
    IF metric_record.avg < 70 THEN
      INSERT INTO seo_insights (
        type, category, title, description, impact, severity, confidence,
        affected_urls, metrics, recommendations, estimated_traffic_impact,
        auto_generated
      )
      SELECT 
        'opportunity',
        'technical',
        'SEO Score Below Optimal',
        format('Average SEO score is %.1f, below the recommended 70+', metric_record.avg),
        'positive',
        'medium',
        0.8,
        ARRAY[domain_record.domain],
        json_build_object('average_seo_score', metric_record.avg),
        ARRAY['Optimize page titles and meta descriptions', 'Improve content quality and length', 'Fix technical SEO issues'],
        ROUND((70 - metric_record.avg) * 2),
        TRUE
      WHERE NOT EXISTS (
        SELECT 1 FROM seo_insights 
        WHERE title = 'SEO Score Below Optimal' 
          AND domain_record.domain = ANY(affected_urls)
          AND created_at >= NOW() - INTERVAL '7 days'
      );
      
      insight_count := insight_count + 1;
    END IF;
  END LOOP;
  
  RETURN insight_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE seo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow service role full access
CREATE POLICY "Service role full access" ON seo_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON keyword_rankings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON backlink_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON backlinks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON technical_seo
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON content_analysis
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON seo_insights
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON seo_reports
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON seo_audits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON seo_opportunities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON competitor_analysis
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view SEO data (can be restricted further based on organization)
CREATE POLICY "Users can view SEO data" ON seo_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view SEO data" ON keyword_rankings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view SEO data" ON seo_insights
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view SEO data" ON seo_opportunities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO seo_metrics (
  url, domain, title, meta_description, h1_tags, word_count, seo_score,
  mobile_score, desktop_score, performance_score
) VALUES
(
  'https://ignitabull.com',
  'ignitabull.com',
  'Ignitabull - AI-Powered Amazon Optimization Platform',
  'Supercharge your Amazon business with AI-powered insights, automated optimization, and comprehensive analytics.',
  ARRAY['AI-Powered Amazon Optimization Platform'],
  1250,
  85,
  82,
  90,
  88
),
(
  'https://ignitabull.com/features',
  'ignitabull.com',
  'Features - Amazon Optimization Tools | Ignitabull',
  'Discover powerful features for Amazon sellers: keyword tracking, competitor analysis, automated insights, and more.',
  ARRAY['Amazon Optimization Features'],
  950,
  78,
  85,
  88,
  82
),
(
  'https://ignitabull.com/pricing',
  'ignitabull.com',
  'Pricing Plans for Amazon Sellers | Ignitabull',
  'Choose the perfect plan for your Amazon business. Free trial available with no commitment required.',
  ARRAY['Pricing Plans for Amazon Sellers'],
  680,
  75,
  80,
  85,
  79
);

INSERT INTO keyword_rankings (
  keyword, url, domain, position, search_volume, difficulty, country
) VALUES
('amazon optimization', 'https://ignitabull.com', 'ignitabull.com', 12, 2400, 65, 'US'),
('amazon seller tools', 'https://ignitabull.com/features', 'ignitabull.com', 8, 1800, 58, 'US'),
('amazon analytics platform', 'https://ignitabull.com', 'ignitabull.com', 15, 1200, 72, 'US'),
('amazon keyword tracking', 'https://ignitabull.com/features', 'ignitabull.com', 6, 980, 55, 'US'),
('amazon competitor analysis', 'https://ignitabull.com/features', 'ignitabull.com', 11, 1500, 68, 'US');

INSERT INTO seo_insights (
  type, category, title, description, impact, severity, confidence,
  affected_urls, recommendations, estimated_traffic_impact, auto_generated
) VALUES
(
  'opportunity',
  'content',
  'Content Expansion Opportunity',
  'Several pages have word counts below 800 words, which could limit ranking potential',
  'positive',
  'medium',
  0.75,
  ARRAY['https://ignitabull.com/pricing'],
  ARRAY['Expand content to 1000+ words', 'Add detailed feature comparisons', 'Include customer testimonials'],
  25,
  FALSE
),
(
  'issue',
  'technical',
  'Mobile Performance Needs Improvement',
  'Some pages have mobile performance scores below 85, affecting user experience',
  'negative',
  'medium',
  0.85,
  ARRAY['https://ignitabull.com/features'],
  ARRAY['Optimize images for mobile', 'Minimize JavaScript execution', 'Implement lazy loading'],
  -15,
  TRUE
);

INSERT INTO seo_opportunities (
  type, title, description, estimated_traffic, estimated_value, difficulty,
  time_to_result, requirements, kpis, status
) VALUES
(
  'keyword',
  'Target "Amazon PPC Optimization" Keyword',
  'High-value keyword with 3,200 monthly searches and moderate competition',
  150,
  450.00,
  65,
  45,
  ARRAY['Create dedicated landing page', 'Optimize for target keyword', 'Build relevant backlinks'],
  ARRAY['Organic traffic', 'Keyword ranking', 'Conversion rate'],
  'new'
),
(
  'content',
  'Create Amazon Seller Guide Series',
  'Comprehensive guide series targeting long-tail keywords around Amazon selling',
  200,
  600.00,
  40,
  60,
  ARRAY['Research competitor content', 'Create 5-part guide series', 'Optimize for featured snippets'],
  ARRAY['Organic traffic', 'Time on page', 'Social shares'],
  'new'
);

-- Comments
COMMENT ON TABLE seo_metrics IS 'Comprehensive SEO metrics for individual pages';
COMMENT ON TABLE keyword_rankings IS 'Keyword position tracking and SERP analysis';
COMMENT ON TABLE backlink_profiles IS 'Domain-level backlink profile summaries';
COMMENT ON TABLE backlinks IS 'Individual backlink records with detailed metrics';
COMMENT ON TABLE technical_seo IS 'Technical SEO audit results and issues';
COMMENT ON TABLE content_analysis IS 'Content quality analysis and optimization opportunities';
COMMENT ON TABLE seo_insights IS 'AI-generated and manual SEO insights and recommendations';
COMMENT ON TABLE seo_reports IS 'Periodic SEO performance reports';
COMMENT ON TABLE seo_audits IS 'Comprehensive SEO audit tracking';
COMMENT ON TABLE seo_opportunities IS 'Identified SEO opportunities with ROI estimates';
COMMENT ON TABLE competitor_analysis IS 'Competitive analysis and benchmarking data';

COMMENT ON FUNCTION calculate_domain_seo_score(TEXT) IS 'Calculates overall SEO health score for a domain';
COMMENT ON FUNCTION get_keyword_ranking_trends(TEXT, INTEGER) IS 'Returns keyword ranking trends and changes';
COMMENT ON FUNCTION find_content_opportunities(TEXT) IS 'Identifies content optimization opportunities';
COMMENT ON FUNCTION generate_automated_insights() IS 'Automatically generates SEO insights based on data patterns';
