/**
 * Logging utilities for Amazon API integrations
 * Following AI SDK logging patterns
 */

import type { LoggerConfig, LogLevel } from "../types/config";

/**
 * Log entry interface
 */
export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	message: string;
	context?: Record<string, any>;
	error?: Error;
	requestId?: string;
	provider?: string;
	endpoint?: string;
	duration?: number;
}

/**
 * Logger interface
 */
export interface Logger {
	trace(message: string, context?: Record<string, any>): void;
	debug(message: string, context?: Record<string, any>): void;
	info(message: string, context?: Record<string, any>): void;
	warn(message: string, context?: Record<string, any>): void;
	error(message: string, error?: Error, context?: Record<string, any>): void;
	fatal(message: string, error?: Error, context?: Record<string, any>): void;
}

/**
 * Log formatter interface
 */
export interface LogFormatter {
	format(entry: LogEntry): string;
}

/**
 * Log transport interface
 */
export interface LogTransport {
	write(entry: LogEntry): Promise<void>;
	close?(): Promise<void>;
}

/**
 * JSON log formatter
 */
export class JSONFormatter implements LogFormatter {
	format(entry: LogEntry): string {
		const output = {
			timestamp: entry.timestamp.toISOString(),
			level: entry.level,
			message: entry.message,
			...entry.context,
			...(entry.error && {
				error: {
					name: entry.error.name,
					message: entry.error.message,
					stack: entry.error.stack,
				},
			}),
			...(entry.requestId && { requestId: entry.requestId }),
			...(entry.provider && { provider: entry.provider }),
			...(entry.endpoint && { endpoint: entry.endpoint }),
			...(entry.duration && { duration: entry.duration }),
		};

		return JSON.stringify(output);
	}
}

/**
 * Human-readable log formatter
 */
export class PrettyFormatter implements LogFormatter {
	private readonly colors = {
		trace: "\x1b[90m", // gray
		debug: "\x1b[36m", // cyan
		info: "\x1b[32m", // green
		warn: "\x1b[33m", // yellow
		error: "\x1b[31m", // red
		fatal: "\x1b[35m", // magenta
		reset: "\x1b[0m",
	};

	format(entry: LogEntry): string {
		const color = this.colors[entry.level] || this.colors.reset;
		const timestamp = entry.timestamp.toISOString();
		const level = entry.level.toUpperCase().padEnd(5);

		let output = `${color}${timestamp} [${level}]${this.colors.reset} ${entry.message}`;

		if (entry.requestId) {
			output += ` (req: ${entry.requestId})`;
		}

		if (entry.provider && entry.endpoint) {
			output += ` [${entry.provider}:${entry.endpoint}]`;
		}

		if (entry.duration) {
			output += ` (${entry.duration}ms)`;
		}

		if (entry.context && Object.keys(entry.context).length > 0) {
			output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
		}

		if (entry.error) {
			output += `\n  Error: ${entry.error.message}`;
			if (entry.error.stack) {
				output += `\n${entry.error.stack}`;
			}
		}

		return output;
	}
}

/**
 * Console transport
 */
export class ConsoleTransport implements LogTransport {
	private readonly config: { useColors?: boolean };

	constructor(config: { useColors?: boolean } = {}) {
		this.config = config;
	}

	async write(entry: LogEntry): Promise<void> {
		const formatter = this.config.useColors
			? new PrettyFormatter()
			: new JSONFormatter();

		const output = formatter.format(entry);

		switch (entry.level) {
			case "error":
			case "fatal":
				console.error(output);
				break;
			case "warn":
				console.warn(output);
				break;
			default:
				console.log(output);
				break;
		}
	}
}

/**
 * File transport
 */
export class FileTransport implements LogTransport {
	private readonly filePath: string;
	private readonly formatter: LogFormatter;
	private writeStream?: any;

	constructor(
		filePath: string,
		options: {
			formatter?: LogFormatter;
			maxSize?: number;
			maxFiles?: number;
		} = {},
	) {
		this.filePath = filePath;
		this.formatter = options.formatter || new JSONFormatter();
	}

	async write(entry: LogEntry): Promise<void> {
		try {
			// Lazy load fs to avoid issues in browser environments
			if (!this.writeStream) {
				const fs = await import("node:fs");
				this.writeStream = fs.createWriteStream(this.filePath, { flags: "a" });
			}

			const output = this.formatter.format(entry);
			this.writeStream.write(`${output}\n`);
		} catch (error) {
			console.error("Failed to write to log file:", error);
		}
	}

	async close(): Promise<void> {
		if (this.writeStream) {
			return new Promise((resolve) => {
				this.writeStream.end(resolve);
			});
		}
	}

	async cleanup(): Promise<void> {
		await this.close();
	}
}

/**
 * HTTP transport for sending logs to external services
 */
export class HTTPTransport implements LogTransport {
	private readonly url: string;
	private readonly headers: Record<string, string>;
	private readonly formatter: LogFormatter;
	private readonly batchSize: number;
	private readonly flushInterval: number;
	private batch: LogEntry[] = [];
	private timer?: NodeJS.Timeout;

	constructor(
		url: string,
		options: {
			headers?: Record<string, string>;
			formatter?: LogFormatter;
			batchSize?: number;
			flushInterval?: number;
		} = {},
	) {
		this.url = url;
		this.headers = options.headers || {};
		this.formatter = options.formatter || new JSONFormatter();
		this.batchSize = options.batchSize || 10;
		this.flushInterval = options.flushInterval || 5000;

		this.startFlushTimer();
	}

	async write(entry: LogEntry): Promise<void> {
		this.batch.push(entry);

		if (this.batch.length >= this.batchSize) {
			await this.flush();
		}
	}

	private async flush(): Promise<void> {
		if (this.batch.length === 0) return;

		const logs = this.batch.splice(0);
		const payload = logs.map((entry) => this.formatter.format(entry));

		try {
			await fetch(this.url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...this.headers,
				},
				body: JSON.stringify({ logs: payload }),
			});
		} catch (error) {
			console.error("Failed to send logs to HTTP endpoint:", error);
			// Re-add failed logs to front of batch for retry
			this.batch.unshift(...logs);
		}
	}

	private startFlushTimer(): void {
		this.timer = setInterval(() => {
			this.flush().catch(console.error);
		}, this.flushInterval);
	}

	async cleanup(): Promise<void> {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = undefined;
		}
		await this.flush();
	}

	async close(): Promise<void> {
		if (this.timer) {
			clearInterval(this.timer);
		}
		await this.flush();
	}
}

/**
 * Amazon API logger implementation
 */
export class AmazonLogger implements Logger {
	private readonly config: LoggerConfig;
	private readonly transports: LogTransport[];
	private readonly context: Record<string, any>;

	constructor(
		config: LoggerConfig,
		transports: LogTransport[] = [],
		context: Record<string, any> = {},
	) {
		this.config = config;
		this.transports =
			transports.length > 0 ? transports : [new ConsoleTransport()];
		this.context = context;
	}

	trace(message: string, context?: Record<string, any>): void {
		this.log("trace", message, context);
	}

	debug(message: string, context?: Record<string, any>): void {
		this.log("debug", message, context);
	}

	info(message: string, context?: Record<string, any>): void {
		this.log("info", message, context);
	}

	warn(message: string, context?: Record<string, any>): void {
		this.log("warn", message, context);
	}

	error(message: string, error?: Error, context?: Record<string, any>): void {
		this.log("error", message, context, error);
	}

	fatal(message: string, error?: Error, context?: Record<string, any>): void {
		this.log("fatal", message, context, error);
	}

	/**
	 * Create child logger with additional context
	 */
	child(additionalContext: Record<string, any>): AmazonLogger {
		return new AmazonLogger(this.config, this.transports, {
			...this.context,
			...additionalContext,
		});
	}

	/**
	 * Log API request
	 */
	logRequest(
		provider: string,
		endpoint: string,
		method: string,
		requestId?: string,
		context?: Record<string, any>,
	): void {
		this.log("info", `${method} ${endpoint}`, {
			...context,
			provider,
			endpoint,
			requestId,
			type: "request",
		});
	}

	/**
	 * Log API response
	 */
	logResponse(
		provider: string,
		endpoint: string,
		statusCode: number,
		duration: number,
		requestId?: string,
		context?: Record<string, any>,
	): void {
		const level = statusCode >= 400 ? "error" : "info";
		this.log(level, `Response ${statusCode}`, {
			...context,
			provider,
			endpoint,
			statusCode,
			duration,
			requestId,
			type: "response",
		});
	}

	/**
	 * Log rate limit event
	 */
	logRateLimit(
		provider: string,
		endpoint: string,
		remaining: number,
		resetTime: Date,
		requestId?: string,
	): void {
		this.log("warn", "Rate limit approaching", {
			provider,
			endpoint,
			remaining,
			resetTime: resetTime.toISOString(),
			requestId,
			type: "rate_limit",
		});
	}

	/**
	 * Log cache event
	 */
	logCache(
		action: "hit" | "miss" | "set" | "clear",
		key: string,
		provider?: string,
		context?: Record<string, any>,
	): void {
		this.log("debug", `Cache ${action}: ${key}`, {
			...context,
			provider,
			cacheAction: action,
			cacheKey: key,
			type: "cache",
		});
	}

	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, any>,
		error?: Error,
	): void {
		// Check if level is enabled
		if (!this.isLevelEnabled(level)) {
			return;
		}

		const entry: LogEntry = {
			timestamp: new Date(),
			level,
			message,
			context: { ...this.context, ...context },
			error,
			requestId: context?.requestId,
			provider: context?.provider,
			endpoint: context?.endpoint,
			duration: context?.duration,
		};

		// Write to all transports
		this.transports.forEach((transport) => {
			transport.write(entry).catch((err) => {
				console.error("Transport write error:", err);
			});
		});
	}

	private isLevelEnabled(level: LogLevel): boolean {
		const levels: Record<LogLevel, number> = {
			trace: 0,
			debug: 1,
			info: 2,
			warn: 3,
			error: 4,
			fatal: 5,
		};

		return levels[level] >= levels[this.config.level];
	}
}

/**
 * Logger factory for creating loggers with common configurations
 */
export class LoggerFactory {
	private static instance: LoggerFactory;
	private readonly transports: Map<string, LogTransport> = new Map();

	static getInstance(): LoggerFactory {
		if (!LoggerFactory.instance) {
			LoggerFactory.instance = new LoggerFactory();
		}
		return LoggerFactory.instance;
	}

	/**
	 * Register a transport
	 */
	registerTransport(name: string, transport: LogTransport): void {
		this.transports.set(name, transport);
	}

	/**
	 * Create logger for a specific provider
	 */
	createLogger(
		provider: string,
		config: LoggerConfig,
		additionalTransports: string[] = [],
	): AmazonLogger {
		const transports: LogTransport[] = [];

		// Add default console transport
		transports.push(
			new ConsoleTransport({
				useColors: process.env.NODE_ENV !== "production",
			}),
		);

		// Add requested transports
		for (const transportName of additionalTransports) {
			const transport = this.transports.get(transportName);
			if (transport) {
				transports.push(transport);
			}
		}

		return new AmazonLogger(config, transports, { provider });
	}

	/**
	 * Cleanup all transports - call on app shutdown
	 */
	async cleanup(): Promise<void> {
		const cleanupPromises: Promise<void>[] = [];

		for (const [_name, transport] of this.transports) {
			if ("cleanup" in transport && typeof transport.cleanup === "function") {
				cleanupPromises.push(transport.cleanup());
			}
		}

		await Promise.all(cleanupPromises);
		this.transports.clear();
	}

	/**
	 * Reset singleton instance (useful for testing)
	 */
	static resetInstance(): void {
		LoggerFactory.instance = undefined as any;
	}

	/**
	 * Create default logger configuration
	 */
	static createDefaultConfig(): LoggerConfig {
		return {
			level: (process.env.LOG_LEVEL as LogLevel) || "info",
			enableConsole: true,
			enableFile: false,
			format: "json",
		};
	}
}

/**
 * Global logger instance
 */
let globalLogger: AmazonLogger;

/**
 * Get or create global logger
 */
export function getLogger(): AmazonLogger {
	if (!globalLogger) {
		const config = LoggerFactory.createDefaultConfig();
		globalLogger = new AmazonLogger(config);
	}
	return globalLogger;
}

/**
 * Set global logger
 */
export function setLogger(logger: AmazonLogger): void {
	globalLogger = logger;
}

/**
 * Create logger for specific provider
 */
export function createProviderLogger(
	provider: string,
	config?: Partial<LoggerConfig>,
): AmazonLogger {
	const fullConfig = {
		...LoggerFactory.createDefaultConfig(),
		...config,
	};

	return LoggerFactory.getInstance().createLogger(provider, fullConfig);
}

/**
 * Log performance metrics
 */
export function logPerformance(
	operation: string,
	duration: number,
	provider?: string,
	context?: Record<string, any>,
): void {
	const logger = getLogger();
	logger.info(`Performance: ${operation}`, {
		...context,
		provider,
		duration,
		type: "performance",
	});
}

/**
 * Log with request context
 */
export function logWithContext(
	level: LogLevel,
	message: string,
	requestId: string,
	provider?: string,
	context?: Record<string, any>,
): void {
	const logger = getLogger();
	logger[level](message, {
		...context,
		requestId,
		provider,
	});
}
