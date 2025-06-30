-- Update handle_new_user function to add organization_id to user metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    org_name TEXT;
    org_slug TEXT;
BEGIN
    -- Extract organization name from metadata or use default
    org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', NEW.raw_user_meta_data->>'full_name', 'My Organization');
    
    -- Generate a unique slug for the organization
    org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    org_slug := org_slug || '-' || substr(md5(random()::text), 1, 6);
    
    -- Create organization for the new user
    INSERT INTO organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO new_org_id;
    
    -- Create profile with owner role
    INSERT INTO profiles (id, organization_id, email, full_name, role)
    VALUES (
        NEW.id, 
        new_org_id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        'owner'
    );
    
    -- Update user metadata to include organization_id
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('organization_id', new_org_id)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;