/**
 * Test utilities and helpers
 */
/**
 * Create mock user for testing
 */
export declare function createMockUser(overrides?: any): any;
/**
 * Create mock auth session for testing
 */
export declare function createMockSession(userOverrides?: any): any;
/**
 * Create mock organization
 */
export declare function createMockOrganization(overrides?: {}): {
    id: string;
    name: string;
    slug: string;
    description: string;
    website: string;
    industry: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
};
/**
 * Create mock visitor session
 */
export declare function createMockVisitorSession(overrides?: {}): {
    id: string;
    sessionId: string;
    userId: string;
    anonymousId: string;
    ipAddress: string;
    userAgent: string;
    referrer: string;
    utmSource: string;
    utmMedium: string;
    country: string;
    region: string;
    city: string;
    deviceType: "desktop";
    browserName: string;
    osName: string;
    isBot: boolean;
    startTime: Date;
    endTime: null;
    duration: null;
    pageViews: number;
    bounceRate: number;
    isReturning: boolean;
    lastActiveAt: Date;
    timezone: string;
    language: string;
    screenResolution: string;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Create mock API response
 */
export declare function createMockApiResponse<T>(data: T, status?: number): {
    data: T;
    status: number;
    headers: {
        "content-type": string;
    };
    error: null;
};
/**
 * Create mock fetch response
 */
export declare function createMockFetchResponse<T>(data: T, status?: number): Promise<Response>;
/**
 * Mock timer helpers
 */
export declare function advanceTime(ms: number): void;
export declare function runAllTimers(): void;
/**
 * Database mock helpers
 */
export declare function createMockSupabaseResponse<T>(data: T[], error?: null): {
    data: T[];
    error: null;
    count: number;
    status: number;
    statusText: string;
};
export declare function createMockSupabaseSingleResponse<T>(data: T, error?: null): {
    data: T;
    error: null;
    status: number;
    statusText: string;
};
/**
 * Wait for async operations
 */
export declare function waitFor(ms: number): Promise<unknown>;
/**
 * Mock console methods for specific tests
 */
export declare function mockConsole(): {
    restore: () => void;
    error: any;
    warn: any;
    log: any;
};
/**
 * Create error for testing
 */
export declare function createMockError(message?: string, code?: string): Error;
//# sourceMappingURL=utils.d.ts.map