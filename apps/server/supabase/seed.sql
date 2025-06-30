-- Seed data for development
-- This file is run when you execute `supabase db reset`

-- Insert test organization
INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Demo Brand Co', 'demo-brand-co', 'growth', 'active');

-- Note: Test users should be created through Supabase Auth
-- You can create test users in the Supabase dashboard or via the auth API

-- Insert sample integrations (credentials would be encrypted in real app)
INSERT INTO integrations (organization_id, platform, name, credentials, settings, status)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'shopify', 'Main Store', 
     '{"shop": "demo-store.myshopify.com", "access_token": "encrypted_token"}',
     '{"sync_interval": "hourly", "sync_products": true, "sync_orders": true}',
     'active'),
    ('550e8400-e29b-41d4-a716-446655440000', 'amazon', 'US Marketplace',
     '{"seller_id": "DEMO123", "refresh_token": "encrypted_token"}',
     '{"marketplace_ids": ["ATVPDKIKX0DER"], "sync_interval": "hourly"}',
     'active');

-- Insert sample metrics data for the last 30 days
INSERT INTO metrics (organization_id, integration_id, metric_type, date, value, currency)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    i.id,
    metric_type,
    date_series.date,
    -- Generate random but realistic values
    CASE 
        WHEN metric_type = 'revenue' THEN ROUND((RANDOM() * 5000 + 1000)::numeric, 2)
        WHEN metric_type = 'orders' THEN FLOOR(RANDOM() * 50 + 10)
        WHEN metric_type = 'customers' THEN FLOOR(RANDOM() * 30 + 5)
    END as value,
    'USD'
FROM 
    integrations i,
    UNNEST(ARRAY['revenue', 'orders', 'customers']) as metric_type,
    generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE,
        '1 day'::interval
    ) as date_series(date)
WHERE i.organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- Insert sample products
INSERT INTO products (organization_id, integration_id, external_id, sku, title, description, price, inventory_quantity, status)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    i.id,
    'PROD-' || generate_series,
    'SKU-' || generate_series,
    'Product ' || generate_series,
    'This is a sample product description for product ' || generate_series,
    ROUND((RANDOM() * 100 + 10)::numeric, 2),
    FLOOR(RANDOM() * 100 + 1)::integer,
    CASE WHEN RANDOM() > 0.1 THEN 'active' ELSE 'inactive' END
FROM 
    integrations i,
    generate_series(1, 20)
WHERE 
    i.organization_id = '550e8400-e29b-41d4-a716-446655440000'
    AND i.platform = 'shopify'
LIMIT 20;

-- Insert a sample campaign
INSERT INTO campaigns (organization_id, name, type, status, subject, content, segment_criteria)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000',
     'Welcome Series',
     'email',
     'active',
     'Welcome to {{brand_name}}!',
     '{"html": "<h1>Welcome!</h1><p>Thanks for joining us.</p>", "text": "Welcome! Thanks for joining us."}',
     '{"filters": [{"field": "created_at", "operator": ">=", "value": "30_days_ago"}]}');

-- Note: Campaign events would be generated as campaigns are sent

-- Sample dashboard widgets configuration
-- These would normally be created by users, but we'll add some defaults
INSERT INTO dashboard_widgets (organization_id, widget_type, position, size, config)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'revenue_chart', '{"x": 0, "y": 0}', '{"w": 8, "h": 4}', 
     '{"title": "Revenue Overview", "timeRange": "30d", "chartType": "line"}'),
    ('550e8400-e29b-41d4-a716-446655440000', 'metric_card', '{"x": 8, "y": 0}', '{"w": 4, "h": 2}',
     '{"title": "Total Orders", "metric": "orders", "timeRange": "today"}'),
    ('550e8400-e29b-41d4-a716-446655440000', 'metric_card', '{"x": 8, "y": 2}', '{"w": 4, "h": 2}',
     '{"title": "New Customers", "metric": "customers", "timeRange": "today"}'),
    ('550e8400-e29b-41d4-a716-446655440000', 'inventory_status', '{"x": 0, "y": 4}', '{"w": 6, "h": 4}',
     '{"title": "Inventory Status", "showLowStock": true, "threshold": 10}'),
    ('550e8400-e29b-41d4-a716-446655440000', 'recent_orders', '{"x": 6, "y": 4}', '{"w": 6, "h": 4}',
     '{"title": "Recent Orders", "limit": 10}');

-- Insert sample leads
INSERT INTO leads (organization_id, email, first_name, last_name, company, status, score, source, utm_source, utm_campaign, interests, notes)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'john.doe@ecommercebrand.com', 'John', 'Doe', 'E-commerce Brand Co', 'qualified', 85, 'website', 'google', 'summer-sale', '["amazon-selling", "inventory-management"]', 'Interested in Amazon automation'),
    ('550e8400-e29b-41d4-a716-446655440000', 'sarah.smith@shopowner.com', 'Sarah', 'Smith', 'Shop Owner LLC', 'new', 45, 'social', 'linkedin', 'content-marketing', '["shopify", "marketing"]', 'Found us through LinkedIn post'),
    ('550e8400-e29b-41d4-a716-446655440000', 'mike.johnson@retailstore.com', 'Mike', 'Johnson', 'Retail Store Inc', 'contacted', 65, 'referral', 'partner', 'referral-program', '["multi-channel", "analytics"]', 'Referred by existing customer'),
    ('550e8400-e29b-41d4-a716-446655440000', 'lisa.brown@onlineshop.com', 'Lisa', 'Brown', 'Online Shop', 'converted', 95, 'website', 'google', 'demo-request', '["ai-insights", "automation"]', 'Converted to paid plan after demo');

-- Insert sample lead activities
INSERT INTO lead_activities (lead_id, organization_id, activity_type, title, description, value, metadata, occurred_at)
SELECT 
    l.id,
    l.organization_id,
    activity_type,
    title,
    description,
    value,
    metadata,
    l.created_at + (random() * INTERVAL '30 days')
FROM leads l,
LATERAL (VALUES
    ('page_visit', 'Visited Landing Page', 'Viewed main landing page', 5, '{"url": "/", "duration": 45}'),
    ('form_submission', 'Demo Request', 'Submitted demo request form', 25, '{"form": "demo-request", "utm_source": "google"}'),
    ('email_opened', 'Opened Welcome Email', 'Opened welcome email sequence', 10, '{"email_id": "welcome-001", "timestamp": "2024-01-15T10:30:00Z"}'),
    ('page_visit', 'Viewed Pricing Page', 'Spent time on pricing page', 15, '{"url": "/pricing", "duration": 120}'),
    ('download', 'Downloaded Guide', 'Downloaded Amazon selling guide', 20, '{"resource": "amazon-guide-2024.pdf"}'
) AS activities(activity_type, title, description, value, metadata);

-- Insert sample email sequences
INSERT INTO email_sequences (organization_id, name, description, trigger_type, trigger_conditions)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Welcome Series', 'New lead welcome sequence', 'lead_created', '{}'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Demo Follow-up', 'Follow up after demo request', 'form_submitted', '{"form": "demo-request"}'),
    ('550e8400-e29b-41d4-a716-446655440000', 'High-Intent Nurture', 'Nurture high-scoring leads', 'score_threshold', '{"min_score": 80}');

-- Insert sample email sequence steps
INSERT INTO email_sequence_steps (sequence_id, organization_id, step_order, name, delay_days, subject, content)
SELECT 
    es.id,
    es.organization_id,
    step_order,
    step_name,
    delay_days,
    subject,
    content
FROM email_sequences es,
LATERAL (VALUES
    (1, 'Welcome Email', 0, 'Welcome to Ignitabull!', '{"template": "welcome", "variables": {"firstName": "{{first_name}}"}}'),
    (2, 'Getting Started Guide', 2, 'Here''s how to get started', '{"template": "getting-started", "variables": {"resources": ["guide1", "guide2"]}}'),
    (3, 'Success Stories', 7, 'See how brands like yours succeed', '{"template": "case-studies", "variables": {"industry": "{{company_industry}}"}}')
) AS steps(step_order, step_name, delay_days, subject, content)
WHERE es.name = 'Welcome Series';

-- Insert sample influencer contacts
INSERT INTO influencer_contacts (organization_id, name, email, instagram_handle, follower_count, engagement_rate, category, status, tier, notes)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Emma Fashion', 'emma@fashioninfluencer.com', '@emmafashion', '{"instagram": 150000, "tiktok": 85000}', 4.2, '["fashion", "lifestyle"]', 'partner', 'mid', 'Great engagement rate, reliable partner'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Tech Tyler', 'tyler@techreviews.com', '@techtyler', '{"instagram": 50000, "youtube": 25000}', 6.8, '["technology", "gadgets"]', 'prospect', 'micro', 'Potential partner for tech product launches'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Fitness Fiona', 'fiona@fitnessmotivation.com', '@fitnessfiona', '{"instagram": 320000, "tiktok": 180000}', 3.9, '["fitness", "health", "wellness"]', 'contacted', 'macro', 'High reach, good for health/wellness brands');

-- Insert sample lead scoring rules
INSERT INTO lead_scoring_rules (organization_id, name, description, trigger_type, conditions, score_change, category, active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Demo Request', 'Lead requests a demo', 'activity', '{"activity_type": "form_submission", "form": "demo-request"}', 25, 'engagement', true),
    ('550e8400-e29b-41d4-a716-446655440000', 'Pricing Page Visit', 'Visited pricing page', 'activity', '{"activity_type": "page_visit", "url": "/pricing"}', 15, 'intent', true),
    ('550e8400-e29b-41d4-a716-446655440000', 'Email Opened', 'Opened marketing email', 'activity', '{"activity_type": "email_opened"}', 5, 'engagement', true),
    ('550e8400-e29b-41d4-a716-446655440000', 'Enterprise Company', 'Company has 100+ employees', 'demographic', '{"company_size": "100+"}', 30, 'firmographic', true),
    ('550e8400-e29b-41d4-a716-446655440000', 'Multiple Visits', 'Visited site multiple times', 'behavior', '{"page_views": ">5"}', 10, 'engagement', true);

-- Insert sample visitor sessions
INSERT INTO visitor_sessions (organization_id, visitor_id, session_id, ip_address, user_agent, landing_page, utm_source, utm_campaign, page_views, time_on_site)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'visitor_001', 'session_001', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '/', 'google', 'summer-sale', 5, 480),
    ('550e8400-e29b-41d4-a716-446655440000', 'visitor_002', 'session_002', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '/pricing', 'linkedin', 'content-marketing', 3, 240),
    ('550e8400-e29b-41d4-a716-446655440000', 'visitor_003', 'session_003', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', '/demo', 'facebook', 'retargeting', 2, 120);