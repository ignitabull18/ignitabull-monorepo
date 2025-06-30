# Environment Variables Documentation

This document describes all environment variables used in the Ignitabull platform.

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Fill in required values (marked with ⚠️)
3. Optional values can be added as features are enabled

## Environment Files

The monorepo uses different `.env` files for different purposes:

- `.env.example` - Template with all possible variables
- `.env.local` - Your local development values (gitignored)
- `.env.production` - Production values (managed by deployment platform)
- `.env.test` - Test environment values

## Required Variables ⚠️

These variables MUST be set for the application to run:

### Database
- `DATABASE_URL` - PostgreSQL connection URL with connection pooling
- `DIRECT_URL` - Direct PostgreSQL connection URL (for migrations)

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server only)

### AI Services
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Gemini API key for AI features

## Integration Variables

### Amazon Selling Partner API
Required when Amazon integration is enabled:
- `AMAZON_SP_CLIENT_ID` - SP-API application client ID
- `AMAZON_SP_CLIENT_SECRET` - SP-API application client secret
- `AMAZON_SP_REGION` - AWS region (e.g., us-east-1)

Note: Refresh tokens are stored per-integration in the database.

### Shopify
Required when Shopify integration is enabled:
- `SHOPIFY_API_KEY` - Your Shopify app API key
- `SHOPIFY_API_SECRET` - Your Shopify app API secret
- `SHOPIFY_APP_URL` - Your app's URL for OAuth callbacks

## Optional Services

### Neo4j Graph Database
For advanced relationship mapping:
- `NEO4J_URI` - Neo4j connection URI (default: neo4j://localhost:7687)
- `NEO4J_USER` - Neo4j username (default: neo4j)
- `NEO4J_PASSWORD` - Neo4j password
- `ENABLE_NEO4J` - Feature flag (default: false)

### Email Services
For email campaigns and notifications:
- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - Default from email
- `SENDGRID_FROM_NAME` - Default from name

### Payment Processing
For subscription management:
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Monitoring
For error tracking and observability:
- `SENTRY_DSN` - Sentry project DSN
- `SENTRY_AUTH_TOKEN` - For source map uploads
- `OTEL_EXPORTER_OTLP_ENDPOINT` - OpenTelemetry collector endpoint
- `OTEL_SERVICE_NAME` - Service name for tracing

### Analytics
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics 4 measurement ID

## Security Variables

### Encryption
- `JWT_SECRET` - Secret for signing JWTs (generate with `openssl rand -base64 32`)
- `ENCRYPTION_KEY` - 32-character key for encrypting stored credentials

### CORS
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated for multiple)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

## Application Configuration

### URLs
- `NEXT_PUBLIC_APP_URL` - Public application URL
- `NODE_ENV` - Environment (development/production/test)

### Feature Flags
- `ENABLE_NEO4J` - Enable Neo4j features (default: false)
- `ENABLE_INFLUENCER_FEATURES` - Enable influencer marketing (default: false)
- `ENABLE_AI_CHAT` - Enable AI chat assistant (default: true)
- `ENABLE_EMAIL_CAMPAIGNS` - Enable email campaigns (default: true)

## Development Tools

### Local Development
- `NGROK_AUTH_TOKEN` - For testing webhooks locally

### Deployment
- `VERCEL_TOKEN` - For programmatic deployments

## Storage Configuration

### S3-Compatible Storage
For file uploads and assets:
- `S3_ENDPOINT` - S3 endpoint URL
- `S3_ACCESS_KEY` - S3 access key
- `S3_SECRET_KEY` - S3 secret key
- `S3_BUCKET` - Default bucket name
- `S3_REGION` - S3 region

### Redis Cache
For performance optimization:
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)

## Environment-Specific Settings

### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### Staging
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.ignitabull.com
CORS_ORIGIN=https://staging.ignitabull.com
```

### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.ignitabull.com
CORS_ORIGIN=https://app.ignitabull.com
```

## Getting Environment Values

### Supabase
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the project URL and anon/service role keys

### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Enable the Gemini API

### Amazon SP-API
1. Register as a developer in Amazon Seller Central
2. Create an application
3. Note the client ID and secret
4. Users will authorize your app to get refresh tokens

### Shopify
1. Create a Shopify Partner account
2. Create a new app
3. Get API credentials from app settings

### Stripe
1. Sign up for Stripe
2. Get API keys from the dashboard
3. Set up webhook endpoint to get webhook secret

## Security Best Practices

1. **Never commit `.env` files** - They're gitignored for a reason
2. **Use different keys for different environments** - Don't reuse production keys in development
3. **Rotate keys regularly** - Especially after team member changes
4. **Use secret management** - Consider using Vercel env vars, AWS Secrets Manager, etc.
5. **Limit key permissions** - Use the minimum required permissions

## Troubleshooting

### Common Issues

1. **"Missing environment variable" error**
   - Check that all required variables are set
   - Ensure `.env.local` is in the correct directory

2. **"Invalid Supabase URL" error**
   - Verify the URL includes `https://` and `.supabase.co`
   - Check for typos in the project reference

3. **"Authentication failed" errors**
   - Verify API keys are correct
   - Check that keys haven't expired
   - Ensure you're using the right environment's keys

4. **Connection timeouts**
   - Check database URLs are accessible
   - Verify network/firewall settings
   - Ensure services are running (for local development)

### Validation Script

Run this script to validate your environment:

```bash
# From the monorepo root
bun run check-env
```

This will verify:
- All required variables are set
- URLs are properly formatted
- API keys have the expected format
- Database connections work