/**
 * Logger Tests
 * Comprehensive test suite for structured logging system
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { advanceTime } from "../../test/utils";
import {
	createRequestLogger,
	getLogger,
	initializeLogger,
	Logger,
	LoggerPresets,
	LogLevel,
	PerformanceTracker,
} from "./logger";

describe("Logger", () => {
	let logger: Logger;
	let consoleSpy: any;

	beforeEach(() => {
		vi.useFakeTimers();
		consoleSpy = {
			log: vi.spyOn(console, "log").mockImplementation(() => {}),
			error: vi.spyOn(console, "error").mockImplementation(() => {}),
			warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
			debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
		};

		logger = new Logger({
			level: LogLevel.DEBUG,
			environment: "test",
			service: "test-service",
			enableConsole: true,
			enableFile: false,
			enableRemote: false,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe("Basic Logging", () => {
		it("should log error messages", () => {
			logger.error("Test error message");

			expect(consoleSpy.error).toHaveBeenCalledOnce();
			const loggedMessage = consoleSpy.error.mock.calls[0][0];
			expect(loggedMessage).toContain("[ERROR]");
			expect(loggedMessage).toContain("Test error message");
			expect(loggedMessage).toContain("[test-service]");
		});

		it("should log warning messages", () => {
			logger.warn("Test warning message");

			expect(consoleSpy.warn).toHaveBeenCalledOnce();
			const loggedMessage = consoleSpy.warn.mock.calls[0][0];
			expect(loggedMessage).toContain("[WARN]");
			expect(loggedMessage).toContain("Test warning message");
		});

		it("should log info messages", () => {
			logger.info("Test info message");

			expect(consoleSpy.log).toHaveBeenCalledOnce();
			const loggedMessage = consoleSpy.log.mock.calls[0][0];
			expect(loggedMessage).toContain("[INFO]");
			expect(loggedMessage).toContain("Test info message");
		});

		it("should log debug messages", () => {
			logger.debug("Test debug message");

			expect(consoleSpy.debug).toHaveBeenCalledOnce();
			const loggedMessage = consoleSpy.debug.mock.calls[0][0];
			expect(loggedMessage).toContain("[DEBUG]");
			expect(loggedMessage).toContain("Test debug message");
		});

		it("should respect log level filtering", () => {
			const warnLogger = new Logger({
				level: LogLevel.WARN,
				environment: "test",
				service: "test-service",
			});

			warnLogger.error("Error message");
			warnLogger.warn("Warning message");
			warnLogger.info("Info message");
			warnLogger.debug("Debug message");

			expect(consoleSpy.error).toHaveBeenCalledOnce();
			expect(consoleSpy.warn).toHaveBeenCalledOnce();
			expect(consoleSpy.log).not.toHaveBeenCalled();
			expect(consoleSpy.debug).not.toHaveBeenCalled();
		});
	});

	describe("Context and Correlation", () => {
		it("should include context in log messages", () => {
			const context = {
				userId: "user123",
				operation: "test-operation",
			};

			logger.info("Test message", context);

			expect(consoleSpy.log).toHaveBeenCalledOnce();
			const loggedMessage = consoleSpy.log.mock.calls[0][0];
			expect(loggedMessage).toContain(
				'Context: {"userId":"user123","operation":"test-operation"}',
			);
		});

		it("should handle correlation IDs", () => {
			const correlationId = Logger.createCorrelationId();
			Logger.setContext(correlationId, {
				userId: "user123",
				service: "test-service",
			});

			logger.info("Test message", { correlationId });

			expect(consoleSpy.log).toHaveBeenCalledOnce();
			const loggedMessage = consoleSpy.log.mock.calls[0][0];
			expect(loggedMessage).toContain(`[${correlationId.slice(0, 8)}]`);
			expect(loggedMessage).toContain('Context: {"userId":"user123"}');
		});

		it("should update correlation context", () => {
			const correlationId = Logger.createCorrelationId();
			Logger.setContext(correlationId, { userId: "user123" });
			Logger.updateContext(correlationId, { operation: "updated" });

			logger.info("Test message", { correlationId });

			const loggedMessage = consoleSpy.log.mock.calls[0][0];
			expect(loggedMessage).toContain('"userId":"user123"');
			expect(loggedMessage).toContain('"operation":"updated"');
		});

		it("should clear correlation context", () => {
			const correlationId = Logger.createCorrelationId();
			Logger.setContext(correlationId, { userId: "user123" });

			const context = Logger.getContext(correlationId);
			expect(context).toBeDefined();
			expect(context?.userId).toBe("user123");

			Logger.clearContext(correlationId);
			const clearedContext = Logger.getContext(correlationId);
			expect(clearedContext).toBeUndefined();
		});
	});

	describe("Error Logging", () => {
		it("should log error objects with stack traces", () => {
			const error = new Error("Test error");
			error.stack = "Error: Test error\n    at test.js:1:1";

			logger.error("Error occurred", error);

			expect(consoleSpy.error).toHaveBeenCalledOnce();
			const loggedMessage = consoleSpy.error.mock.calls[0][0];
			expect(loggedMessage).toContain("Error: Error: Test error");
			expect(loggedMessage).toContain("Error: Test error\n    at test.js:1:1");
		});

		it("should log error objects without stack traces when disabled", () => {
			const noStackLogger = new Logger({
				level: LogLevel.DEBUG,
				environment: "test",
				service: "test-service",
				includeStack: false,
			});

			const error = new Error("Test error");
			error.stack = "Error: Test error\n    at test.js:1:1";

			noStackLogger.error("Error occurred", error);

			expect(consoleSpy.error).toHaveBeenCalledOnce();
			const loggedMessage = consoleSpy.error.mock.calls[0][0];
			expect(loggedMessage).toContain("Error: Error: Test error");
			expect(loggedMessage).not.toContain(
				"Error: Test error\n    at test.js:1:1",
			);
		});

		it("should handle custom error properties", () => {
			const customError = new Error("Custom error") as any;
			customError.code = "CUSTOM_ERROR";
			customError.statusCode = 400;

			logger.error("Custom error occurred", customError);

			expect(consoleSpy.error).toHaveBeenCalledOnce();
		});
	});

	describe("Data Redaction", () => {
		it("should redact sensitive fields", () => {
			const sensitiveData = {
				username: "testuser",
				password: "secret123",
				token: "abc123token",
				publicInfo: "this is safe",
			};

			logger.info("User data", {}, sensitiveData);

			const loggedMessage = consoleSpy.log.mock.calls[0][0];
			expect(loggedMessage).toContain('"password":"[REDACTED]"');
			expect(loggedMessage).toContain('"token":"[REDACTED]"');
			expect(loggedMessage).toContain('"publicInfo":"this is safe"');
			expect(loggedMessage).toContain('"username":"testuser"');
		});

		it("should handle nested object redaction", () => {
			const nestedData = {
				user: {
					name: "John",
					credentials: {
						password: "secret",
						key: "privatekey",
					},
				},
				metadata: {
					token: "authtoken",
				},
			};

			logger.info("Nested data", {}, nestedData);

			const loggedMessage = consoleSpy.log.mock.calls[0][0];
			expect(loggedMessage).toContain('"password":"[REDACTED]"');
			expect(loggedMessage).toContain('"key":"[REDACTED]"');
			expect(loggedMessage).toContain('"token":"[REDACTED]"');
			expect(loggedMessage).toContain('"name":"John"');
		});

		it("should handle array redaction", () => {
			const arrayData = [
				{ name: "item1", secret: "hidden1" },
				{ name: "item2", secret: "hidden2" },
			];

			logger.info("Array data", {}, arrayData);

			const loggedMessage = consoleSpy.log.mock.calls[0][0];
			expect(loggedMessage).toContain('"secret":"[REDACTED]"');
			expect(loggedMessage).toContain('"name":"item1"');
			expect(loggedMessage).toContain('"name":"item2"');
		});
	});

	describe("Performance Tracking", () => {
		it("should create performance tracker", () => {
			const tracker = logger.createPerformanceTracker();
			expect(tracker).toBeInstanceOf(PerformanceTracker);
		});

		it("should track operation duration", () => {
			const tracker = logger.createPerformanceTracker();

			advanceTime(100);
			const duration = tracker.getDuration();

			expect(duration).toBeGreaterThanOrEqual(100);
		});

		it("should track performance marks", () => {
			const tracker = logger.createPerformanceTracker();

			tracker.mark("start");
			advanceTime(50);
			tracker.mark("middle");
			advanceTime(50);

			const middleDuration = tracker.measure("middle");
			expect(middleDuration).toBeGreaterThanOrEqual(50);
		});

		it("should log performance data", () => {
			const tracker = logger.createPerformanceTracker();
			advanceTime(100);

			logger.performance("Operation completed", tracker);

			expect(consoleSpy.log).toHaveBeenCalledOnce();
			const loggedMessage = consoleSpy.log.mock.calls[0][0];
			expect(loggedMessage).toContain("Operation completed");
			expect(loggedMessage).toContain("Duration: 100ms");
		});
	});

	describe("Remote Logging", () => {
		beforeEach(() => {
			global.fetch = vi.fn();
		});

		it("should buffer logs for remote sending", async () => {
			const remoteLogger = new Logger({
				level: LogLevel.INFO,
				environment: "test",
				service: "test-service",
				enableConsole: false,
				enableRemote: true,
				remoteConfig: {
					endpoint: "https://logs.example.com/api/logs",
					batchSize: 2,
				},
			});

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			});

			remoteLogger.info("Message 1");
			remoteLogger.info("Message 2"); // Should trigger flush

			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(global.fetch).toHaveBeenCalledOnce();
			const [url, options] = (global.fetch as any).mock.calls[0];
			expect(url).toBe("https://logs.example.com/api/logs");
			expect(options.method).toBe("POST");

			const body = JSON.parse(options.body);
			expect(body.logs).toHaveLength(2);
		});

		it("should handle remote logging failures gracefully", async () => {
			const remoteLogger = new Logger({
				level: LogLevel.INFO,
				environment: "test",
				service: "test-service",
				enableConsole: true,
				enableRemote: true,
				remoteConfig: {
					endpoint: "https://logs.example.com/api/logs",
					batchSize: 1,
				},
			});

			(global.fetch as any).mockRejectedValue(new Error("Network error"));

			remoteLogger.info("Test message");

			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(consoleSpy.error).toHaveBeenCalledWith(
				"Failed to send logs to remote service:",
				expect.any(Error),
			);
		});
	});

	describe("Logger Presets", () => {
		it("should provide development preset", () => {
			const config = LoggerPresets.development;
			expect(config.level).toBe(LogLevel.DEBUG);
			expect(config.environment).toBe("development");
			expect(config.enableConsole).toBe(true);
			expect(config.includeStack).toBe(true);
		});

		it("should provide production preset", () => {
			const config = LoggerPresets.production;
			expect(config.level).toBe(LogLevel.INFO);
			expect(config.environment).toBe("production");
			expect(config.enableRemote).toBe(true);
			expect(config.includeStack).toBe(false);
			expect(config.redactFields).toContain("password");
		});

		it("should provide testing preset", () => {
			const config = LoggerPresets.testing;
			expect(config.level).toBe(LogLevel.WARN);
			expect(config.environment).toBe("test");
			expect(config.enableConsole).toBe(false);
		});
	});

	describe("Global Logger", () => {
		it("should initialize and get global logger", () => {
			const globalLogger = initializeLogger({
				level: LogLevel.INFO,
				environment: "test",
				service: "global-test",
			});

			expect(globalLogger).toBeInstanceOf(Logger);

			const retrievedLogger = getLogger();
			expect(retrievedLogger).toBe(globalLogger);
		});

		it("should throw error when getting uninitialized logger", () => {
			// Reset global logger by creating a new one
			expect(() => getLogger()).toThrow("Logger not initialized");
		});
	});

	describe("Request Logger", () => {
		beforeEach(() => {
			initializeLogger({
				level: LogLevel.DEBUG,
				environment: "test",
				service: "request-test",
			});
		});

		it("should create request-scoped logger", () => {
			const {
				logger: requestLogger,
				correlationId,
				setContext,
				clearContext,
			} = createRequestLogger();

			expect(requestLogger).toBeInstanceOf(Logger);
			expect(correlationId).toBeDefined();
			expect(typeof setContext).toBe("function");
			expect(typeof clearContext).toBe("function");
		});

		it("should use provided correlation ID", () => {
			const customId = "custom-correlation-id";
			const { correlationId } = createRequestLogger(customId);

			expect(correlationId).toBe(customId);
		});

		it("should manage request context", () => {
			const {
				logger: requestLogger,
				correlationId,
				setContext,
				clearContext,
			} = createRequestLogger();

			setContext({ userId: "user123", operation: "test" });

			requestLogger.info("Test message", { correlationId });

			const loggedMessage = consoleSpy.log.mock.calls[0][0];
			expect(loggedMessage).toContain('"userId":"user123"');
			expect(loggedMessage).toContain('"operation":"test"');

			clearContext();
			const context = Logger.getContext(correlationId);
			expect(context).toBeUndefined();
		});
	});

	describe("Cleanup", () => {
		it("should cleanup resources", () => {
			const cleanupLogger = new Logger({
				level: LogLevel.INFO,
				environment: "test",
				service: "cleanup-test",
				enableRemote: true,
				remoteConfig: {
					endpoint: "https://logs.example.com",
					flushInterval: 1000,
				},
			});

			const clearIntervalSpy = vi.spyOn(global, "clearInterval");

			cleanupLogger.cleanup();

			expect(clearIntervalSpy).toHaveBeenCalled();
		});
	});
});

describe("PerformanceTracker", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should track total duration", () => {
		const tracker = new PerformanceTracker();

		advanceTime(150);
		const duration = tracker.getDuration();

		expect(duration).toBeGreaterThanOrEqual(150);
	});

	it("should manage performance marks", () => {
		const tracker = new PerformanceTracker();

		tracker.mark("operation-start");
		advanceTime(100);
		tracker.mark("operation-middle");
		advanceTime(50);

		const middleDuration = tracker.measure("operation-middle");
		expect(middleDuration).toBeGreaterThanOrEqual(50);
	});

	it("should throw error for non-existent marks", () => {
		const tracker = new PerformanceTracker();

		expect(() => tracker.measure("non-existent")).toThrow(
			"Mark 'non-existent' not found",
		);
	});

	it("should return complete performance result", () => {
		const tracker = new PerformanceTracker();

		advanceTime(200);
		const result = tracker.getResult();

		expect(result.duration).toBeGreaterThanOrEqual(200);
		expect(result.startTime).toBeDefined();
		expect(result.endTime).toBeDefined();
		expect(result.endTime).toBeGreaterThan(result.startTime);
	});
});
