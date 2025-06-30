# Cleanup Manager Usage Guide

The Cleanup Manager provides a centralized way to manage the lifecycle and cleanup of singleton services in the Ignitabull platform.

## Overview

Many services in the application use the singleton pattern and manage resources that need to be properly cleaned up:
- Database connections
- Cache instances with timers
- Event listeners
- File handles
- Network connections

## Basic Usage

### 1. Import and Setup

```typescript
import { cleanupManager, registerCommonSingletons } from '@ignitabull/core'

// Register common singletons automatically
registerCommonSingletons()

// Setup process handlers for graceful shutdown
cleanupManager.setupProcessHandlers()
```

### 2. Register Custom Services

```typescript
import { cleanupManager } from '@ignitabull/core'

// Register a service with cleanup
cleanupManager.register({
  name: 'MyCustomService',
  cleanup: async () => {
    // Cleanup logic here
    await myService.disconnect()
    myService.clearCache()
  },
  priority: 50 // Optional: lower numbers cleanup first
})
```

### 3. Manual Cleanup

```typescript
// Perform cleanup manually (usually not needed if process handlers are setup)
process.on('beforeExit', async () => {
  try {
    await cleanupManager.cleanup()
    console.log('Cleanup completed successfully')
  } catch (error) {
    console.error('Cleanup failed:', error)
  }
})
```

## Priority System

Services are cleaned up in priority order (lower numbers first):

- **10-20**: Core authentication and session management
- **20-30**: Configuration management
- **30-50**: Database connections
- **50-70**: Cache and in-memory stores
- **70-90**: External API connections
- **90-100**: Logging and monitoring

## Registered Services

The following singleton services are automatically registered when using `registerCommonSingletons()`:

### Core Package
- **AuthManager** (priority: 10) - Clears event handlers and session data
- **ConfigManager** (priority: 20) - Clears configuration cache

### Amazon Core Package
- **LoggerFactory** (priority: 90) - Closes file streams and flushes HTTP logs
- **AmazonConfigManager** (priority: 25) - Clears API configurations
- **MemoryCache** instances - Clears intervals and cached data

## Adding Cleanup to Your Service

### 1. Singleton with Cleanup

```typescript
export class MyService {
  private static instance: MyService
  private connections: Connection[] = []
  private intervals: NodeJS.Timeout[] = []

  static getInstance(): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService()
    }
    return MyService.instance
  }

  // Your service methods...

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []

    // Close connections
    await Promise.all(
      this.connections.map(conn => conn.close())
    )
    this.connections = []

    // Clear any other resources
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    MyService.instance = undefined as any
  }
}
```

### 2. Register with Cleanup Manager

```typescript
import { cleanupManager } from '@ignitabull/core'
import { MyService } from './my-service'

// In your app initialization
const myService = MyService.getInstance()

cleanupManager.register({
  name: 'MyService',
  cleanup: () => myService.cleanup(),
  priority: 60
})
```

## Testing

For testing, you can reset singletons:

```typescript
import { CleanupManager } from '@ignitabull/core'

beforeEach(() => {
  // Reset cleanup manager
  CleanupManager.resetInstance()
  
  // Reset other singletons
  AuthManager.resetInstance()
  ConfigManager.resetInstance()
})

afterEach(async () => {
  // Cleanup any registered services
  await cleanupManager.cleanup()
})
```

## Best Practices

1. **Always implement cleanup**: If your service manages resources, implement a cleanup method
2. **Use appropriate priorities**: Register services with logical cleanup order
3. **Handle errors gracefully**: Cleanup methods should not throw - log errors instead
4. **Make cleanup idempotent**: Calling cleanup multiple times should be safe
5. **Test cleanup**: Include cleanup testing in your test suites

## Example: Complete Application Setup

```typescript
import { cleanupManager, registerCommonSingletons } from '@ignitabull/core'
import { Neo4jService } from '@ignitabull/core'
import { AmazonService } from '@ignitabull/amazon-core'

async function startApp() {
  // Register common singletons
  registerCommonSingletons()

  // Initialize services
  const neo4j = Neo4jService.getInstance()
  const amazon = new AmazonService(config)

  // Register custom services
  cleanupManager.register({
    name: 'Neo4jService',
    cleanup: () => neo4j.close(),
    priority: 30
  })

  cleanupManager.register({
    name: 'AmazonService',
    cleanup: async () => {
      // Custom cleanup for Amazon service
      await amazon.shutdown()
    },
    priority: 70
  })

  // Setup process handlers
  cleanupManager.setupProcessHandlers()

  // Start your application
  console.log('Application started with cleanup manager')
}

startApp().catch(console.error)
```

## Troubleshooting

### Service not cleaning up
- Check that the service is registered with cleanup manager
- Verify the cleanup method is implemented correctly
- Check priority order - dependencies should cleanup after dependents

### Cleanup hanging
- Add timeouts to async cleanup operations
- Log progress in cleanup methods
- Use `cleanupManager.getTargets()` to see registered services

### Memory leaks
- Ensure all timers/intervals are cleared
- Remove all event listeners
- Clear all cache entries
- Close all connections