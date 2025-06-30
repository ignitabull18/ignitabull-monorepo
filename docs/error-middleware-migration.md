# Error Middleware Migration Guide

This guide explains how to migrate existing API endpoints to use the new centralized error handling middleware.

## Overview

The new error middleware provides:
- Consistent error responses across all endpoints
- Automatic error logging
- Async error handling
- Built-in validation helpers
- Standard success/error response formats

## Migration Steps

### 1. Import the middleware functions

```typescript
import {
  asyncHandler,
  ValidationError,
  NotFoundError,
  successResponse,
  requireFields,
  requireParams
} from '../../middleware/error-handler'
```

### 2. Wrap route handlers with `asyncHandler`

**Before:**
```typescript
export async function sendWelcome(req: Request, res: Response) {
  try {
    // ... route logic
  } catch (error) {
    console.error('Welcome email API error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
```

**After:**
```typescript
export const sendWelcome = asyncHandler(async (req: Request, res: Response) => {
  // ... route logic
  // Errors are automatically caught and handled
})
```

### 3. Replace manual validation with error throwing

**Before:**
```typescript
if (!email || !isValidEmail(email)) {
  return res.status(400).json({
    error: 'Valid email address is required'
  })
}
```

**After:**
```typescript
if (!email || !isValidEmail(email)) {
  throw new ValidationError('Valid email address is required')
}
```

### 4. Use success response helper

**Before:**
```typescript
res.json({
  success: true,
  message: 'Welcome email sent successfully',
  emailId: result.id
})
```

**After:**
```typescript
successResponse(res, {
  message: 'Welcome email sent successfully',
  emailId: result.id
})
```

### 5. Apply middleware to Express app

In your main server file:

```typescript
import { errorHandler, notFound } from './middleware/error-handler'

// ... routes ...

// 404 handler
app.use(notFound)

// Error handler (must be last)
app.use(errorHandler)
```

## Error Types

Use specific error types for better error handling:

```typescript
// Validation errors (400)
throw new ValidationError('Invalid input')

// Not found errors (404)
throw new NotFoundError('User')

// Unauthorized errors (401)
throw new UnauthorizedError('Invalid credentials')

// Forbidden errors (403)
throw new ForbiddenError('Access denied')

// Conflict errors (409)
throw new ConflictError('Email already exists')

// Rate limit errors (429)
throw new RateLimitError()

// Generic API errors
throw new ApiError('Custom error', 500)
```

## Validation Helpers

Use built-in validation middleware:

```typescript
// In route definition
router.post('/api/users', 
  requireFields('email', 'password', 'firstName'), 
  createUser
)

// For path parameters
router.get('/api/users/:id', 
  requireParams('id'), 
  getUser
)
```

## Pagination Helper

For paginated endpoints:

```typescript
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query)
  
  const { data, total } = await userService.list(pagination)
  
  paginatedResponse(res, data, total, pagination)
})
```

## Complete Example

Here's a complete example of a refactored endpoint:

```typescript
import {
  asyncHandler,
  ValidationError,
  NotFoundError,
  successResponse,
  requireFields
} from '../../middleware/error-handler'
import { userService } from '../../services/user-service'

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body

  // Validation
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format')
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters')
  }

  // Check if user exists
  const existingUser = await userService.findByEmail(email)
  if (existingUser) {
    throw new ConflictError('User with this email already exists')
  }

  // Create user
  const user = await userService.create({
    email,
    password,
    firstName,
    lastName
  })

  successResponse(res, user, { statusCode: 201 })
})
```

## Benefits

1. **Consistency**: All errors follow the same format
2. **Less Code**: No need for try-catch in every handler
3. **Better Logging**: Automatic error logging with context
4. **Type Safety**: Typed error classes
5. **Developer Experience**: Clear error messages in development
6. **Production Ready**: Stack traces hidden in production

## Migration Checklist

- [ ] Import error middleware functions
- [ ] Wrap handlers with `asyncHandler`
- [ ] Replace manual error responses with error throwing
- [ ] Use `successResponse` for successful responses
- [ ] Add validation middleware where needed
- [ ] Apply error middleware to Express app
- [ ] Test error scenarios
- [ ] Remove duplicate error handling code