#!/bin/bash

# Supabase Initialization Script for Phase 1
# This script initializes the local Supabase instance and sets up credentials

set -e

echo "🚀 Initializing Supabase for Ignitabull MVP Phase 1..."
echo ""

# Change to server directory where supabase config is located
cd "$(dirname "$0")/../apps/server"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Start Supabase
echo "📦 Starting Supabase local development stack..."
bunx supabase start

# Get the credentials
echo ""
echo "✅ Supabase started successfully!"
echo ""
echo "📋 Local Supabase credentials:"
echo "=================================="
bunx supabase status

# Extract the credentials
API_URL=$(bunx supabase status --output json | jq -r '.api_url')
ANON_KEY=$(bunx supabase status --output json | jq -r '.anon_key')
SERVICE_ROLE_KEY=$(bunx supabase status --output json | jq -r '.service_role_key')
DB_URL=$(bunx supabase status --output json | jq -r '.db_url')

# Update .env file
ENV_FILE="../../.env"
echo ""
echo "📝 Updating environment variables in $ENV_FILE..."

# Backup existing .env if it exists
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%s)"
fi

# Update the environment variables
if [ -f "$ENV_FILE" ]; then
    # Update existing values
    sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|" "$ENV_FILE"
    sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" "$ENV_FILE"
    sed -i.bak "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" "$ENV_FILE"
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|" "$ENV_FILE"
    sed -i.bak "s|DIRECT_URL=.*|DIRECT_URL=$DB_URL|" "$ENV_FILE"
    
    # Also update Supabase-specific vars
    sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=$API_URL|" "$ENV_FILE"
    sed -i.bak "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" "$ENV_FILE"
    
    # Clean up backup files
    rm -f "$ENV_FILE.bak"
else
    echo "❌ .env file not found. Please create it from .env.example first."
    exit 1
fi

echo "✅ Environment variables updated!"
echo ""
echo "🎯 Next steps:"
echo "1. The database schema has been initialized"
echo "2. You can access Supabase Studio at: http://localhost:54323"
echo "3. The authentication system is ready to be implemented"
echo ""
echo "📚 Phase 1 Tasks:"
echo "   ✅ Task 1.1: Initialize Supabase Project - COMPLETE"
echo "   ✅ Task 1.2: Implement Database Schema - COMPLETE"
echo "   ⏳ Task 1.3: Implement Authentication System - READY TO START"