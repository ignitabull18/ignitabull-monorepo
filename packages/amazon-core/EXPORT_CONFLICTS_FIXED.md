# Module Export Conflict Fixes (TS2308)

## Summary
Fixed all TypeScript TS2308 module export conflict errors by removing duplicate exports and consolidating type definitions.

## Changes Made

### 1. **ServiceUnavailableError Conflict**
- **Issue**: Exported from both `errors/api-errors.ts` and `errors/network-errors.ts`
- **Fix**: Removed from `api-errors.ts`, kept in `network-errors.ts` (more appropriate location)

### 2. **Config Type Conflicts**
- **Issue**: Config interfaces (AdvertisingConfig, AssociatesConfig, SPAPIConfig, BrandAnalyticsConfig, DSPConfig) were defined in both `types/config.ts` and `types/provider.ts`
- **Fix**: 
  - Removed duplicate definitions from `types/provider.ts`
  - Added imports from `types/config.ts` in provider files
  - Removed duplicate definitions from `types/brand-analytics.ts` and `types/dsp.ts`

### 3. **Provider Interface/Class Conflicts**
- **Issue**: Provider interfaces in `types/provider.ts` had same names as implementation classes
- **Fix**: 
  - Removed duplicate interface definitions from provider implementation files
  - Updated imports to use interfaces from `types/provider.ts`
  - Fixed main `index.ts` to use explicit exports and `export type` for type-only exports

### 4. **ValidationUtils Conflict**
- **Issue**: Exported from both `utils/validation.ts` and `errors/validation-errors.ts`
- **Fix**: Renamed the one in `errors/validation-errors.ts` to `ValidationErrorUtils`

### 5. **Common Type Conflicts in types/provider.ts**
- **Issue**: Duplicate definitions of common types (MoneyAmount, ProductImage, Dimensions, Filter, SuccessResponse, CreateCampaignRequest, CreateKeywordRequest)
- **Fix**: 
  - Removed duplicates from `types/provider.ts`
  - Added imports from appropriate type modules

### 6. **AttributionModel Conflict**
- **Issue**: Different types with same name in `types/attribution.ts` (string union) and `types/common.ts` (interface)
- **Fix**: Renamed the interface in `types/common.ts` to `AttributionModelData`

### 7. **SuccessResponse Conflict**
- **Issue**: Different types with same name in `types/common.ts` (interface) and `types/responses.ts` (generic type)
- **Fix**: Renamed the generic type in `types/responses.ts` to `SuccessfulResponse`

## Best Practices Applied

1. **Single Source of Truth**: Each type/interface is now defined in only one location
2. **Logical Organization**: Types are placed in the most appropriate module
3. **Explicit Exports**: Main `index.ts` uses explicit exports instead of wildcard exports to avoid conflicts
4. **Type-Only Exports**: Used `export type` for type-only re-exports to comply with `isolatedModules`
5. **Clear Naming**: Renamed conflicting types to have distinct, descriptive names

## Result
All TS2308 errors have been resolved. The module structure is now cleaner and more maintainable.