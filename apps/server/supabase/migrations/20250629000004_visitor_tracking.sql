-- Visitor Tracking and Follow-up Database Schema
-- Migration for automated visitor tracking and follow-up system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Visitor Sessions Table
CREATE TABLE visitor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')) NOT NULL DEFAULT 'desktop',
  browser_name TEXT,
  os_name TEXT,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration INTEGER, -- milliseconds
  page_views INTEGER NOT NULL DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  is_returning BOOLEAN NOT NULL DEFAULT FALSE,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  timezone TEXT,
  language TEXT,
  screen_resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Page Views Table
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL REFERENCES visitor_sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  title TEXT,
  referrer TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_on_page INTEGER, -- milliseconds
  scroll_depth INTEGER, -- percentage
  exit_page BOOLEAN NOT NULL DEFAULT FALSE,
  entry_page BOOLEAN NOT NULL DEFAULT FALSE,
  has_form BOOLEAN NOT NULL DEFAULT FALSE,
  has_video BOOLEAN NOT NULL DEFAULT FALSE,
  word_count INTEGER,
  reading_time INTEGER, -- seconds
  social_shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visitor Interactions Table
CREATE TABLE visitor_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL REFERENCES visitor_sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('click', 'form_submit', 'download', 'video_play', 'scroll', 'hover', 'search', 'share', 'comment')) NOT NULL,
  element TEXT,
  element_id TEXT,
  element_class TEXT,
  value TEXT,
  url TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  coordinates JSONB, -- {x: number, y: number}
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visitor Leads Table
CREATE TABLE visitor_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL REFERENCES visitor_sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  phone TEXT,
  job_title TEXT,
  industry TEXT,
  lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  source TEXT NOT NULL,
  medium TEXT,
  campaign TEXT,
  form_url TEXT NOT NULL,
  form_type TEXT CHECK (form_type IN ('contact', 'newsletter', 'demo', 'trial', 'download', 'quote')) NOT NULL DEFAULT 'contact',
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')) NOT NULL DEFAULT 'new',
  assigned_to TEXT,
  notes TEXT,
  follow_up_scheduled TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  conversion_value DECIMAL(10,2),
  tags TEXT[],
  custom_fields JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-up Rules Table
CREATE TABLE follow_up_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 1,
  triggers JSONB NOT NULL, -- Array of trigger objects
  conditions JSONB NOT NULL DEFAULT '[]', -- Array of condition objects
  actions JSONB NOT NULL, -- Array of action objects
  delay INTEGER DEFAULT 0, -- minutes
  max_executions INTEGER,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-up Executions Table
CREATE TABLE follow_up_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES follow_up_rules(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES visitor_sessions(session_id) ON DELETE CASCADE,
  lead_id UUID REFERENCES visitor_leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')) NOT NULL DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visitor Segments Table
CREATE TABLE visitor_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Array of criteria objects
  visitor_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visitor Insights Table
CREATE TABLE visitor_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL REFERENCES visitor_sessions(session_id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('behavior', 'engagement', 'conversion', 'retention', 'acquisition')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL DEFAULT 'medium',
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  impact TEXT NOT NULL,
  recommended_actions TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Campaigns Table
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('welcome', 'follow_up', 'nurture', 'reactivation', 'promotional')) NOT NULL,
  subject TEXT NOT NULL,
  template_id TEXT NOT NULL,
  segment_id UUID REFERENCES visitor_segments(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused')) NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipients INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  bounced INTEGER DEFAULT 0,
  unsubscribed INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  unsubscribe_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automation Workflows Table
CREATE TABLE automation_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  trigger JSONB NOT NULL, -- Single trigger object
  steps JSONB NOT NULL, -- Array of step objects
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-up Tasks Table
CREATE TABLE follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('email', 'call', 'meeting', 'review')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
  lead_id UUID REFERENCES visitor_leads(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES visitor_sessions(session_id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_visitor_sessions_session_id ON visitor_sessions(session_id);
CREATE INDEX idx_visitor_sessions_user_id ON visitor_sessions(user_id);
CREATE INDEX idx_visitor_sessions_anonymous_id ON visitor_sessions(anonymous_id);
CREATE INDEX idx_visitor_sessions_ip_address ON visitor_sessions(ip_address);
CREATE INDEX idx_visitor_sessions_start_time ON visitor_sessions(start_time);
CREATE INDEX idx_visitor_sessions_last_active ON visitor_sessions(last_active_at);
CREATE INDEX idx_visitor_sessions_device_type ON visitor_sessions(device_type);
CREATE INDEX idx_visitor_sessions_utm_source ON visitor_sessions(utm_source);
CREATE INDEX idx_visitor_sessions_country ON visitor_sessions(country);

CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_user_id ON page_views(user_id);
CREATE INDEX idx_page_views_path ON page_views(path);
CREATE INDEX idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX idx_page_views_entry_page ON page_views(entry_page);
CREATE INDEX idx_page_views_exit_page ON page_views(exit_page);

CREATE INDEX idx_visitor_interactions_session_id ON visitor_interactions(session_id);
CREATE INDEX idx_visitor_interactions_type ON visitor_interactions(type);
CREATE INDEX idx_visitor_interactions_timestamp ON visitor_interactions(timestamp);

CREATE INDEX idx_visitor_leads_session_id ON visitor_leads(session_id);
CREATE INDEX idx_visitor_leads_email ON visitor_leads(email);
CREATE INDEX idx_visitor_leads_status ON visitor_leads(status);
CREATE INDEX idx_visitor_leads_lead_score ON visitor_leads(lead_score);
CREATE INDEX idx_visitor_leads_source ON visitor_leads(source);
CREATE INDEX idx_visitor_leads_created_at ON visitor_leads(created_at);
CREATE INDEX idx_visitor_leads_assigned_to ON visitor_leads(assigned_to);

CREATE INDEX idx_follow_up_rules_is_active ON follow_up_rules(is_active);
CREATE INDEX idx_follow_up_rules_priority ON follow_up_rules(priority);

CREATE INDEX idx_follow_up_executions_rule_id ON follow_up_executions(rule_id);
CREATE INDEX idx_follow_up_executions_session_id ON follow_up_executions(session_id);
CREATE INDEX idx_follow_up_executions_lead_id ON follow_up_executions(lead_id);
CREATE INDEX idx_follow_up_executions_status ON follow_up_executions(status);
CREATE INDEX idx_follow_up_executions_created_at ON follow_up_executions(created_at);

CREATE INDEX idx_visitor_insights_session_id ON visitor_insights(session_id);
CREATE INDEX idx_visitor_insights_type ON visitor_insights(type);
CREATE INDEX idx_visitor_insights_severity ON visitor_insights(severity);

CREATE INDEX idx_follow_up_tasks_assigned_to ON follow_up_tasks(assigned_to);
CREATE INDEX idx_follow_up_tasks_status ON follow_up_tasks(status);
CREATE INDEX idx_follow_up_tasks_priority ON follow_up_tasks(priority);
CREATE INDEX idx_follow_up_tasks_due_date ON follow_up_tasks(due_date);
CREATE INDEX idx_follow_up_tasks_lead_id ON follow_up_tasks(lead_id);

-- GIN indexes for JSONB columns
CREATE INDEX idx_follow_up_rules_triggers ON follow_up_rules USING GIN(triggers);
CREATE INDEX idx_follow_up_rules_conditions ON follow_up_rules USING GIN(conditions);
CREATE INDEX idx_follow_up_rules_actions ON follow_up_rules USING GIN(actions);
CREATE INDEX idx_visitor_leads_custom_fields ON visitor_leads USING GIN(custom_fields);
CREATE INDEX idx_page_views_metadata ON page_views USING GIN(metadata);
CREATE INDEX idx_visitor_interactions_metadata ON visitor_interactions USING GIN(metadata);

-- Text search indexes
CREATE INDEX idx_visitor_leads_company_trgm ON visitor_leads USING GIN(company gin_trgm_ops);
CREATE INDEX idx_visitor_leads_name_trgm ON visitor_leads USING GIN((first_name || ' ' || last_name) gin_trgm_ops);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_visitor_sessions_updated_at 
  BEFORE UPDATE ON visitor_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitor_leads_updated_at 
  BEFORE UPDATE ON visitor_leads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_rules_updated_at 
  BEFORE UPDATE ON follow_up_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at 
  BEFORE UPDATE ON email_campaigns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at 
  BEFORE UPDATE ON automation_workflows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_tasks_updated_at 
  BEFORE UPDATE ON follow_up_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Analytics Functions
CREATE OR REPLACE FUNCTION calculate_session_analytics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_sessions BIGINT,
  unique_visitors BIGINT,
  total_page_views BIGINT,
  avg_session_duration DECIMAL,
  bounce_rate DECIMAL,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH session_stats AS (
    SELECT 
      COUNT(*) as sessions,
      COUNT(DISTINCT COALESCE(user_id::TEXT, anonymous_id)) as visitors,
      SUM(page_views) as page_views,
      AVG(duration) as avg_duration,
      COUNT(CASE WHEN page_views <= 1 THEN 1 END)::DECIMAL / COUNT(*) * 100 as bounce_pct
    FROM visitor_sessions
    WHERE start_time BETWEEN start_date AND end_date
      AND is_bot = FALSE
  ),
  conversion_stats AS (
    SELECT COUNT(DISTINCT vs.session_id)::DECIMAL / COUNT(DISTINCT vs.session_id) * 100 as conv_rate
    FROM visitor_sessions vs
    LEFT JOIN visitor_leads vl ON vs.session_id = vl.session_id
    WHERE vs.start_time BETWEEN start_date AND end_date
      AND vs.is_bot = FALSE
  )
  SELECT 
    ss.sessions,
    ss.visitors,
    ss.page_views,
    ss.avg_duration / 1000, -- Convert to seconds
    ss.bounce_pct,
    cs.conv_rate
  FROM session_stats ss, conversion_stats cs;
END;
$$ LANGUAGE plpgsql;

-- Lead Scoring Function
CREATE OR REPLACE FUNCTION calculate_lead_score(
  p_session_id TEXT,
  p_form_type TEXT DEFAULT 'contact',
  p_company TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 50;
  session_score INTEGER := 0;
  form_score INTEGER := 0;
  company_score INTEGER := 0;
  source_score INTEGER := 0;
  final_score INTEGER;
  session_data RECORD;
BEGIN
  -- Get session data
  SELECT page_views, duration, utm_source, utm_medium, is_returning
  INTO session_data
  FROM visitor_sessions
  WHERE session_id = p_session_id;
  
  IF NOT FOUND THEN
    RETURN base_score;
  END IF;
  
  -- Score based on session behavior
  session_score := LEAST(session_data.page_views * 2, 20); -- Up to 20 points
  
  IF session_data.duration IS NOT NULL THEN
    session_score := session_score + LEAST(session_data.duration / 60000 * 5, 30); -- Up to 30 points for time
  END IF;
  
  -- Score based on form type
  CASE p_form_type
    WHEN 'demo' THEN form_score := 20;
    WHEN 'trial' THEN form_score := 15;
    WHEN 'contact' THEN form_score := 10;
    WHEN 'newsletter' THEN form_score := 5;
    ELSE form_score := 5;
  END CASE;
  
  -- Score based on company presence
  IF p_company IS NOT NULL AND LENGTH(p_company) > 0 THEN
    company_score := 10;
  END IF;
  
  -- Score based on traffic source
  CASE session_data.utm_source
    WHEN 'google' THEN 
      CASE session_data.utm_medium
        WHEN 'cpc' THEN source_score := 15;
        WHEN 'organic' THEN source_score := 20;
        ELSE source_score := 10;
      END CASE;
    WHEN 'linkedin' THEN source_score := 15;
    WHEN 'direct' THEN source_score := 10;
    ELSE source_score := 5;
  END CASE;
  
  -- Bonus for returning visitors
  IF session_data.is_returning THEN
    source_score := source_score + 5;
  END IF;
  
  final_score := base_score + session_score + form_score + company_score + source_score;
  
  -- Clamp between 0 and 100
  RETURN LEAST(GREATEST(final_score, 0), 100);
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow service role full access
CREATE POLICY "Service role full access" ON visitor_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON page_views
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON visitor_interactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON visitor_leads
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON follow_up_rules
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON follow_up_executions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON visitor_segments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON visitor_insights
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON email_campaigns
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON automation_workflows
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON follow_up_tasks
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view their own data
CREATE POLICY "Users can view own sessions" ON visitor_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own page views" ON page_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON visitor_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own leads" ON visitor_leads
  FOR SELECT USING (auth.uid() = user_id);

-- Insert sample follow-up rules
INSERT INTO follow_up_rules (name, description, triggers, conditions, actions, priority) VALUES
(
  'Welcome New Leads',
  'Send welcome email to new form submissions',
  '[{"type": "form_submission", "value": "contact"}]',
  '[]',
  '[{"type": "send_email", "templateId": "lead-welcome", "delay": 5}]',
  10
),
(
  'High-Intent Visitor Follow-up',
  'Follow up with visitors who spend more than 5 minutes on site',
  '[{"type": "time_on_site", "value": 5, "operator": "greater_than"}]',
  '[{"field": "session.page_views", "operator": "greater_than", "value": 3}]',
  '[{"type": "send_email", "templateId": "high-value-visitor"}, {"type": "create_task", "taskDescription": "Follow up with high-intent visitor", "priority": "high"}]',
  8
),
(
  'Demo Request Follow-up',
  'Send demo scheduling email for demo requests',
  '[{"type": "form_submission", "value": "demo"}]',
  '[]',
  '[{"type": "send_email", "templateId": "demo-follow-up", "delay": 30}]',
  9
),
(
  'Abandoned Form Recovery',
  'Re-engage visitors who started but didn\'t complete forms',
  '[{"type": "inactivity", "value": 30, "operator": "greater_than"}]',
  '[{"field": "session.page_views", "operator": "greater_than", "value": 1}]',
  '[{"type": "send_email", "templateId": "abandoned-form", "delay": 60}]',
  6
);

-- Insert sample visitor segments
INSERT INTO visitor_segments (name, description, criteria) VALUES
(
  'High-Intent Visitors',
  'Visitors with high engagement and lead potential',
  '[{"field": "page_views", "operator": "greater_than", "value": 5}, {"field": "duration", "operator": "greater_than", "value": 300000}]'
),
(
  'Returning Visitors',
  'Visitors who have returned to the site',
  '[{"field": "is_returning", "operator": "equals", "value": true}]'
),
(
  'Mobile Users',
  'Visitors using mobile devices',
  '[{"field": "device_type", "operator": "equals", "value": "mobile"}]'
),
(
  'Organic Traffic',
  'Visitors from organic search results',
  '[{"field": "utm_medium", "operator": "equals", "value": "organic"}]'
);

-- Comments
COMMENT ON TABLE visitor_sessions IS 'Tracks individual visitor sessions with comprehensive behavioral data';
COMMENT ON TABLE page_views IS 'Records each page view within a session with engagement metrics';
COMMENT ON TABLE visitor_interactions IS 'Captures specific user interactions like clicks, form submissions, downloads';
COMMENT ON TABLE visitor_leads IS 'Stores lead information captured from forms and visitor behavior';
COMMENT ON TABLE follow_up_rules IS 'Defines automated follow-up rules and conditions';
COMMENT ON TABLE follow_up_executions IS 'Tracks execution of follow-up rules for monitoring and analytics';
COMMENT ON TABLE visitor_segments IS 'Defines visitor segments for targeted marketing campaigns';
COMMENT ON TABLE visitor_insights IS 'Stores AI-generated insights about visitor behavior patterns';
COMMENT ON TABLE email_campaigns IS 'Manages email marketing campaigns and their performance metrics';
COMMENT ON TABLE automation_workflows IS 'Defines complex multi-step automation workflows';
COMMENT ON TABLE follow_up_tasks IS 'Tracks manual follow-up tasks assigned to team members';

COMMENT ON FUNCTION calculate_session_analytics(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Calculates comprehensive session analytics for a given time period';
COMMENT ON FUNCTION calculate_lead_score(TEXT, TEXT, TEXT) IS 'Calculates lead score based on session behavior and form data';
