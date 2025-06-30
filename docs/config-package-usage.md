# Configuration Package Usage Guide

The `@ignitabull/config` package provides centralized, type-safe configuration management for the entire Ignitabull platform.

## Overview

Features:
- 🔒 Type-safe configuration with Zod schemas
- ✅ Automatic validation on startup
- 🎯 Centralized environment variable management
- 🔐 Automatic redaction of sensitive values
- 🚀 Zero runtime overhead after initial validation
- 📝 Environment template generation

## Installation

```bash
# From within a workspace package
bun add @ignitabull/config
```

## Basic Usage

### 1. Import and Initialize

```typescript
import { configManager, getConfig } from '@ignitabull/config'

// Load and validate configuration (typically done once at startup)
const config = configManager.load()

// Or use the convenience function
const config = getConfig()
```

### 2. Access Configuration Sections

```typescript
import { 
  getServerConfig,
  getDatabaseConfig,
  getEmailConfig,
  getAmazonConfig,
  getFeatureFlags,
  isFeatureEnabled
} from '@ignitabull/config'

// Get specific configuration sections
const serverConfig = getServerConfig()
console.log(`Server running on port: ${serverConfig.PORT}`)

const dbConfig = getDatabaseConfig()
const supabaseClient = createClient(dbConfig.SUPABASE_URL, dbConfig.SUPABASE_ANON_KEY)

// Check feature flags
if (isFeatureEnabled('FEATURE_AI_INSIGHTS')) {
  // AI insights feature is enabled
}
```

### 3. Environment-specific Logic

```typescript
import { isProduction, isDevelopment } from '@ignitabull/config'

if (isProduction()) {
  // Production-specific logic
  console.log('Running in production mode')
}

if (isDevelopment()) {
  // Development-specific logic
  console.log('Running in development mode')
}
```

## Configuration Schema

The configuration is organized into the following sections:

### Server Configuration
```typescript
interface ServerConfig {
  NODE_ENV: 'development' | 'staging' | 'production' | 'test'
  PORT: number
  CORS_ORIGIN: string
  RATE_LIMIT_WINDOW_MS: string
  RATE_LIMIT_MAX_REQUESTS: string
  API_KEY?: string
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug'
}
```

### Database Configuration
```typescript
interface DatabaseConfig {
  // Supabase
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  
  // Neo4j (optional)
  NEO4J_URI?: string
  NEO4J_USERNAME?: string
  NEO4J_PASSWORD?: string
  ENABLE_NEO4J?: boolean
}
```

### Email Configuration
```typescript
interface EmailConfig {
  RESEND_API_KEY: string
  EMAIL_FROM_ADDRESS: string
  EMAIL_FROM_NAME: string
  EMAIL_REPLY_TO?: string
  EMAIL_PROVIDER: 'resend' | 'sendgrid' | 'ses'
}
```

### Feature Flags
```typescript
interface FeatureFlags {
  FEATURE_NEO4J: boolean
  FEATURE_AI_INSIGHTS: boolean
  FEATURE_VISITOR_TRACKING: boolean
  FEATURE_EMAIL_AUTOMATION: boolean
  // ... more flags
}
```

## Advanced Usage

### Custom Validation

```typescript
import { configManager, EmailConfigSchema } from '@ignitabull/config'

// Validate partial configuration
try {
  const emailConfig = configManager.validatePartial(EmailConfigSchema, {
    RESEND_API_KEY: 'key',
    EMAIL_FROM_ADDRESS: 'noreply@example.com'
  })
} catch (error) {
  // Handle validation error
}
```

### Redacted Configuration (for logging)

```typescript
import { configManager } from '@ignitabull/config'

// Get configuration with sensitive values redacted
const redactedConfig = configManager.getRedacted()
console.log('Configuration:', redactedConfig)
// Sensitive values will show as '[REDACTED]'
```

### Environment Utilities

```typescript
import { loadEnv, validateEnv, getEnv, getBoolEnv, getNumberEnv } from '@ignitabull/config'

// Load environment variables with options
loadEnv({
  envDir: '/path/to/env/files',
  override: true // Override existing values
})

// Validate required environment variables
validateEnv(['DATABASE_URL', 'API_KEY', 'SECRET_KEY'])

// Get environment variables with type conversion
const apiUrl = getEnv('API_URL', 'http://localhost:3000')
const isDebug = getBoolEnv('DEBUG', false)
const timeout = getNumberEnv('TIMEOUT', 5000)
```

## Migration Guide

### Before (Direct env access):
```typescript
// ❌ Old way - scattered throughout codebase
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseKey)
```

### After (Using config package):
```typescript
// ✅ New way - centralized and validated
import { getDatabaseConfig } from '@ignitabull/config'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getDatabaseConfig()
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
```

## Error Handling

The config package will throw a `ConfigurationError` if validation fails:

```typescript
import { ConfigurationError } from '@ignitabull/config'

try {
  const config = configManager.load()
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Configuration validation failed:')
    error.errors.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`)
    })
    process.exit(1)
  }
  throw error
}
```

## Environment Template

Generate a template .env file:

```typescript
import { generateEnvTemplate } from '@ignitabull/config'
import { ConfigSchema } from '@ignitabull/config'

const template = generateEnvTemplate(ConfigSchema)
fs.writeFileSync('.env.example', template)
```

## Best Practices

1. **Load Once**: Load configuration once at application startup
2. **Fail Fast**: Let the app crash on invalid configuration rather than continuing
3. **Use Type Imports**: Import types for better tree-shaking
4. **Feature Flags**: Use feature flags for gradual rollouts
5. **Redact Sensitive Data**: Always use redacted config for logging

## Testing

For testing, you can reset and reload configuration:

```typescript
import { configManager } from '@ignitabull/config'

beforeEach(() => {
  // Reset configuration
  configManager.reset()
  
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.SUPABASE_URL = 'http://localhost:54321'
  // ... other test values
  
  // Reload configuration
  configManager.load()
})
```