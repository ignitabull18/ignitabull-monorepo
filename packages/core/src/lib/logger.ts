/**
 * Structured Logging with Correlation IDs
 * Enterprise-grade logging system with request correlation
 */

import { randomUUID } from "node:crypto";

export enum LogLevel {
	ERROR = "error",
	WARN = "warn",
	INFO = "info",
	DEBUG = "debug",
	TRACE = "trace",
}

export interface LogContext {
	correlationId?: string;
	userId?: string;
	organizationId?: string;
	requestId?: string;
	sessionId?: string;
	operation?: string;
	service?: string;
	component?: string;
	[key: string]: any;
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context: LogContext;
	data?: any;
	error?: {
		name: string;
		message: string;
		stack?: string;
		code?: string;
		statusCode?: number;
	};
	performance?: {
		duration: number;
		startTime: number;
		endTime: number;
	};
	metadata: {
		environment: string;
		version?: string;
		hostname: string;
		pid: number;
	};
}

export interface LoggerConfig {
	level: LogLevel;
	environment: string;
	service: string;
	version?: string;
	enableConsole?: boolean;
	enableFile?: boolean;
	enableRemote?: boolean;
	fileConfig?: {
		filename: string;
		maxSize: number;
		maxFiles: number;
	};
	remoteConfig?: {
		endpoint: string;
		apiKey?: string;
		batchSize?: number;
		flushInterval?: number;
	};
	redactFields?: string[];
	includeStack?: boolean;
}

/**
 * Correlation ID context storage
 */
class CorrelationContext {
	private static storage = new Map<string, LogContext>();

	static set(correlationId: string, context: LogContext): void {
		CorrelationContext.storage.set(correlationId, {
			...context,
			correlationId,
		});
	}

	static get(correlationId: string): LogContext | undefined {
		return CorrelationContext.storage.get(correlationId);
	}

	static update(correlationId: string, updates: Partial<LogContext>): void {
		const existing = CorrelationContext.storage.get(correlationId) || {};
		CorrelationContext.storage.set(correlationId, { ...existing, ...updates });
	}

	static delete(correlationId: string): void {
		CorrelationContext.storage.delete(correlationId);
	}

	static clear(): void {
		CorrelationContext.storage.clear();
	}
}

/**
 * Performance tracking utility
 */
export class PerformanceTracker {
	private startTime: number;
	private marks = new Map<string, number>();

	constructor() {
		this.startTime = Date.now();
	}

	mark(label: string): void {
		this.marks.set(label, Date.now());
	}

	measure(label: string): number {
		const markTime = this.marks.get(label);
		if (!markTime) {
			throw new Error(`Mark '${label}' not found`);
		}
		return Date.now() - markTime;
	}

	getDuration(): number {
		return Date.now() - this.startTime;
	}

	getResult() {
		const endTime = Date.now();
		return {
			duration: endTime - this.startTime,
			startTime: this.startTime,
			endTime,
		};
	}
}

/**
 * Logger class with correlation support
 */
export class Logger {
	private config: LoggerConfig;
	private logBuffer: LogEntry[] = [];
	private flushTimer?: NodeJS.Timeout;

	constructor(config: LoggerConfig) {
		this.config = {
			enableConsole: true,
			enableFile: false,
			enableRemote: false,
			includeStack: true,
			redactFields: ["password", "token", "key", "secret", "authorization"],
			...config,
		};

		if (this.config.enableRemote && this.config.remoteConfig) {
			this.startFlushTimer();
		}
	}

	/**
	 * Create correlation ID
	 */
	static createCorrelationId(): string {
		return randomUUID();
	}

	/**
	 * Set correlation context
	 */
	static setContext(correlationId: string, context: LogContext): void {
		CorrelationContext.set(correlationId, context);
	}

	/**
	 * Get correlation context
	 */
	static getContext(correlationId: string): LogContext | undefined {
		return CorrelationContext.get(correlationId);
	}

	/**
	 * Update correlation context
	 */
	static updateContext(
		correlationId: string,
		updates: Partial<LogContext>,
	): void {
		CorrelationContext.update(correlationId, updates);
	}

	/**
	 * Clear correlation context
	 */
	static clearContext(correlationId: string): void {
		CorrelationContext.delete(correlationId);
	}

	/**
	 * Create performance tracker
	 */
	createPerformanceTracker(): PerformanceTracker {
		return new PerformanceTracker();
	}

	/**
	 * Log error
	 */
	error(
		message: string,
		error?: Error,
		context?: LogContext,
		data?: any,
	): void {
		this.log(LogLevel.ERROR, message, context, data, error);
	}

	/**
	 * Log warning
	 */
	warn(message: string, context?: LogContext, data?: any): void {
		this.log(LogLevel.WARN, message, context, data);
	}

	/**
	 * Log info
	 */
	info(message: string, context?: LogContext, data?: any): void {
		this.log(LogLevel.INFO, message, context, data);
	}

	/**
	 * Log debug
	 */
	debug(message: string, context?: LogContext, data?: any): void {
		this.log(LogLevel.DEBUG, message, context, data);
	}

	/**
	 * Log trace
	 */
	trace(message: string, context?: LogContext, data?: any): void {
		this.log(LogLevel.TRACE, message, context, data);
	}

	/**
	 * Log with performance tracking
	 */
	performance(
		message: string,
		tracker: PerformanceTracker,
		context?: LogContext,
		data?: any,
	): void {
		this.log(
			LogLevel.INFO,
			message,
			context,
			data,
			undefined,
			tracker.getResult(),
		);
	}

	/**
	 * Core logging method
	 */
	private log(
		level: LogLevel,
		message: string,
		context?: LogContext,
		data?: any,
		error?: Error,
		performance?: any,
	): void {
		// Check if we should log at this level
		if (!this.shouldLog(level)) {
			return;
		}

		// Get correlation context if correlationId is provided
		let mergedContext = context || {};
		if (context?.correlationId) {
			const storedContext = CorrelationContext.get(context.correlationId);
			if (storedContext) {
				mergedContext = { ...storedContext, ...context };
			}
		}

		// Create log entry
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context: mergedContext,
			data: this.redactSensitiveData(data),
			metadata: {
				environment: this.config.environment,
				version: this.config.version,
				hostname: this.getHostname(),
				pid: process.pid,
			},
		};

		// Add error information
		if (error) {
			entry.error = {
				name: error.name,
				message: error.message,
				code: (error as any).code,
				statusCode: (error as any).statusCode,
			};

			if (this.config.includeStack && error.stack) {
				entry.error.stack = error.stack;
			}
		}

		// Add performance information
		if (performance) {
			entry.performance = performance;
		}

		// Output log entry
		this.output(entry);
	}

	/**
	 * Check if we should log at this level
	 */
	private shouldLog(level: LogLevel): boolean {
		const levels = [
			LogLevel.ERROR,
			LogLevel.WARN,
			LogLevel.INFO,
			LogLevel.DEBUG,
			LogLevel.TRACE,
		];
		const currentLevelIndex = levels.indexOf(this.config.level);
		const messageLevelIndex = levels.indexOf(level);

		return messageLevelIndex <= currentLevelIndex;
	}

	/**
	 * Output log entry to configured destinations
	 */
	private output(entry: LogEntry): void {
		if (this.config.enableConsole) {
			this.outputToConsole(entry);
		}

		if (this.config.enableFile) {
			this.outputToFile(entry);
		}

		if (this.config.enableRemote) {
			this.bufferForRemote(entry);
		}
	}

	/**
	 * Output to console
	 */
	private outputToConsole(entry: LogEntry): void {
		const formatted = this.formatForConsole(entry);

		switch (entry.level) {
			case LogLevel.ERROR:
				console.error(formatted);
				break;
			case LogLevel.WARN:
				console.warn(formatted);
				break;
			case LogLevel.DEBUG:
			case LogLevel.TRACE:
				console.debug(formatted);
				break;
			default:
				console.log(formatted);
		}
	}

	/**
	 * Format log entry for console output
	 */
	private formatForConsole(entry: LogEntry): string {
		const parts = [
			entry.timestamp,
			`[${entry.level.toUpperCase()}]`,
			entry.context.correlationId
				? `[${entry.context.correlationId.slice(0, 8)}]`
				: "",
			entry.context.service
				? `[${entry.context.service}]`
				: `[${this.config.service}]`,
			entry.message,
		].filter(Boolean);

		let formatted = parts.join(" ");

		// Add context data
		if (Object.keys(entry.context).length > 0) {
			const contextWithoutDefaults = { ...entry.context };
			delete contextWithoutDefaults.correlationId;
			delete contextWithoutDefaults.service;

			if (Object.keys(contextWithoutDefaults).length > 0) {
				formatted += ` | Context: ${JSON.stringify(contextWithoutDefaults)}`;
			}
		}

		// Add additional data
		if (entry.data) {
			formatted += ` | Data: ${JSON.stringify(entry.data)}`;
		}

		// Add performance info
		if (entry.performance) {
			formatted += ` | Duration: ${entry.performance.duration}ms`;
		}

		// Add error info
		if (entry.error) {
			formatted += ` | Error: ${entry.error.name}: ${entry.error.message}`;
			if (entry.error.stack && this.config.includeStack) {
				formatted += `\n${entry.error.stack}`;
			}
		}

		return formatted;
	}

	/**
	 * Output to file (placeholder)
	 */
	private outputToFile(_entry: LogEntry): void {
		// File logging would be implemented here
		// Could use rotating file streams, etc.
	}

	/**
	 * Buffer for remote logging
	 */
	private bufferForRemote(entry: LogEntry): void {
		this.logBuffer.push(entry);

		const batchSize = this.config.remoteConfig?.batchSize || 100;
		if (this.logBuffer.length >= batchSize) {
			this.flushRemoteLogs();
		}
	}

	/**
	 * Flush logs to remote service
	 */
	private async flushRemoteLogs(): Promise<void> {
		if (this.logBuffer.length === 0 || !this.config.remoteConfig) {
			return;
		}

		const logs = [...this.logBuffer];
		this.logBuffer = [];

		try {
			const response = await fetch(this.config.remoteConfig.endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(this.config.remoteConfig.apiKey && {
						Authorization: `Bearer ${this.config.remoteConfig.apiKey}`,
					}),
				},
				body: JSON.stringify({ logs }),
			});

			if (!response.ok) {
				throw new Error(`Remote logging failed: ${response.status}`);
			}
		} catch (error) {
			// Fallback to console for remote logging errors
			console.error("Failed to send logs to remote service:", error);
			// Re-add logs to buffer for retry
			this.logBuffer.unshift(...logs);
		}
	}

	/**
	 * Start flush timer for remote logging
	 */
	private startFlushTimer(): void {
		const interval = this.config.remoteConfig?.flushInterval || 30000; // 30 seconds

		this.flushTimer = setInterval(() => {
			this.flushRemoteLogs();
		}, interval);
	}

	/**
	 * Redact sensitive data
	 */
	private redactSensitiveData(data: any): any {
		if (!data || !this.config.redactFields) {
			return data;
		}

		if (typeof data !== "object") {
			return data;
		}

		const redacted = Array.isArray(data) ? [...data] : { ...data };

		for (const field of this.config.redactFields) {
			if (field in redacted) {
				redacted[field] = "[REDACTED]";
			}
		}

		// Recursively redact nested objects
		for (const key in redacted) {
			if (typeof redacted[key] === "object" && redacted[key] !== null) {
				redacted[key] = this.redactSensitiveData(redacted[key]);
			}
		}

		return redacted;
	}

	/**
	 * Get hostname
	 */
	private getHostname(): string {
		try {
			return require("node:os").hostname();
		} catch {
			return "unknown";
		}
	}

	/**
	 * Cleanup resources
	 */
	cleanup(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
		}

		// Flush any remaining logs
		this.flushRemoteLogs();

		// Clear correlation context
		CorrelationContext.clear();
	}
}

/**
 * Default logger presets
 */
export const LoggerPresets = {
	development: {
		level: LogLevel.DEBUG,
		environment: "development",
		enableConsole: true,
		enableFile: false,
		enableRemote: false,
		includeStack: true,
	},

	production: {
		level: LogLevel.INFO,
		environment: "production",
		enableConsole: true,
		enableFile: true,
		enableRemote: true,
		includeStack: false,
		redactFields: [
			"password",
			"token",
			"key",
			"secret",
			"authorization",
			"cookie",
		],
	},

	testing: {
		level: LogLevel.WARN,
		environment: "test",
		enableConsole: false,
		enableFile: false,
		enableRemote: false,
		includeStack: false,
	},
};

/**
 * Global logger instance
 */
let globalLogger: Logger | undefined;

/**
 * Initialize global logger
 */
export function initializeLogger(config: LoggerConfig): Logger {
	globalLogger = new Logger(config);
	return globalLogger;
}

/**
 * Get global logger
 */
export function getLogger(): Logger {
	if (!globalLogger) {
		throw new Error("Logger not initialized. Call initializeLogger() first.");
	}
	return globalLogger;
}

/**
 * Create request-scoped logger with correlation ID
 */
export function createRequestLogger(correlationId?: string): {
	logger: Logger;
	correlationId: string;
	setContext: (context: Partial<LogContext>) => void;
	clearContext: () => void;
} {
	const logger = getLogger();
	const id = correlationId || Logger.createCorrelationId();

	return {
		logger,
		correlationId: id,
		setContext: (context: Partial<LogContext>) => {
			Logger.setContext(id, { correlationId: id, ...context });
		},
		clearContext: () => {
			Logger.clearContext(id);
		},
	};
}

export default Logger;
