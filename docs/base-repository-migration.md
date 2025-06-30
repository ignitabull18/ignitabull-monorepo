# BaseRepository Migration Guide

This guide explains how to refactor existing repository classes to use the new `BaseRepository` abstract class.

## Overview

The `BaseRepository` class provides:
- Automatic Supabase client initialization
- Common CRUD operations (create, read, update, delete)
- Pagination support
- Error handling with proper API errors
- Query filtering
- Bulk operations

## Migration Steps

### 1. Extend BaseRepository

**Before:**
```typescript
export class InfluencerRepository {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }
}
```

**After:**
```typescript
import { BaseRepository } from './base'

export class InfluencerProfileRepository extends BaseRepository<InfluencerProfile> {
  constructor() {
    super('influencer_profiles') // Pass table name to parent
  }
}
```

### 2. Replace Common CRUD Methods

**Before:**
```typescript
async createInfluencerProfile(data: CreateInfluencerProfile): Promise<InfluencerProfile> {
  const { data: profile, error } = await this.supabase
    .from('influencer_profiles')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create influencer profile: ${error.message}`)
  }

  return profile
}
```

**After:**
```typescript
async createInfluencerProfile(data: CreateInfluencerProfile): Promise<InfluencerProfile> {
  // Use inherited create method
  const profile = await this.create(data)
  return this.transformInfluencerProfileFromDB(profile)
}
```

### 3. Use Built-in Methods

The BaseRepository provides these methods:

```typescript
// Single record operations
protected create<T>(data: T): Promise<Entity>
protected findById(id: string): Promise<Entity | null>
protected findOne(filters: QueryFilters): Promise<Entity | null>
protected update(id: string, data: Partial<Entity>): Promise<Entity>
protected delete(id: string): Promise<void>

// Multiple record operations
protected createMany<T>(data: T[]): Promise<Entity[]>
protected findMany(filters?: QueryFilters): Promise<Entity[]>
protected updateMany(filters: QueryFilters, data: Partial<Entity>): Promise<Entity[]>
protected deleteMany(filters: QueryFilters): Promise<void>

// Pagination
protected findPaginated(filters?: QueryFilters, options?: PaginationOptions): Promise<PaginatedResult<Entity>>

// Utilities
protected count(filters?: QueryFilters): Promise<number>
protected exists(filters: QueryFilters): Promise<boolean>
protected upsert<T>(data: T | T[], options?: { onConflict?: string }): Promise<Entity[]>
```

### 4. Handle Custom Queries

For queries that don't fit the standard patterns:

```typescript
export class InfluencerProfileRepository extends BaseRepository<InfluencerProfile> {
  async searchInfluencers(query: string): Promise<InfluencerProfile[]> {
    // Access this.supabase for custom queries
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select()
      .or(`name.ilike.%${query}%,handle.ilike.%${query}%`)
      .limit(20)

    if (error) {
      throw new ApiError(`Failed to search influencers: ${error.message}`, 400)
    }

    return data.map(p => this.transformFromDB(p))
  }
}
```

### 5. Organize by Entity

Instead of one large repository class, create separate repositories for each entity:

```typescript
// Before: One large repository
export class InfluencerRepository {
  // Methods for profiles, campaigns, outreach, contracts, etc.
}

// After: Separate repositories
export class InfluencerProfileRepository extends BaseRepository<InfluencerProfile> { }
export class InfluencerCampaignRepository extends BaseRepository<InfluencerCampaign> { }
export class InfluencerOutreachRepository extends BaseRepository<InfluencerOutreach> { }

// Compose them in a main repository
export class InfluencerRepository {
  public profiles: InfluencerProfileRepository
  public campaigns: InfluencerCampaignRepository
  public outreach: InfluencerOutreachRepository

  constructor() {
    this.profiles = new InfluencerProfileRepository()
    this.campaigns = new InfluencerCampaignRepository()
    this.outreach = new InfluencerOutreachRepository()
  }
}
```

### 6. Update Service Layer

Update services to use the new repository structure:

```typescript
// Before
const repo = new InfluencerRepository()
const profile = await repo.createInfluencerProfile(data)

// After
const repo = new InfluencerRepository()
const profile = await repo.profiles.createInfluencerProfile(data)
```

## Complete Example

Here's a complete example of a refactored repository:

```typescript
import { BaseRepository, PaginationOptions, QueryFilters } from './base'
import { Product, CreateProduct, UpdateProduct } from '../types'

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super('products')
  }

  // Simple create using base method
  async createProduct(data: CreateProduct): Promise<Product> {
    return this.create(data)
  }

  // Find with custom filters
  async getActiveProducts(pagination?: PaginationOptions) {
    return this.findPaginated({ status: 'active' }, pagination)
  }

  // Custom search
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select()
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(50)

    if (error) {
      throw new ApiError(`Search failed: ${error.message}`, 400)
    }

    return data
  }

  // Bulk operations
  async deactivateOldProducts(days: number): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    await this.updateMany(
      { updated_at: { lt: cutoffDate.toISOString() } },
      { status: 'inactive' }
    )
  }
}
```

## Benefits

1. **Less Code**: Remove 50-70% of boilerplate code
2. **Consistency**: All repositories follow the same patterns
3. **Error Handling**: Automatic API error wrapping
4. **Type Safety**: Full TypeScript support with generics
5. **Maintainability**: Changes to common operations in one place
6. **Testing**: Easier to mock and test

## Migration Checklist

- [ ] Create BaseRepository class
- [ ] Identify entities that need repositories
- [ ] Create separate repository classes per entity
- [ ] Extend BaseRepository with proper generic type
- [ ] Replace standard CRUD methods with inherited ones
- [ ] Keep custom queries in repository methods
- [ ] Update services to use new repository structure
- [ ] Test all operations
- [ ] Remove old repository code