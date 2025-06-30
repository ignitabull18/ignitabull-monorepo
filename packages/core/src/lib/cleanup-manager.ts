/**
 * Global Cleanup Manager
 * Manages lifecycle and cleanup of singleton services
 */

export interface CleanupTarget {
	name: string;
	cleanup: () => void | Promise<void>;
	priority?: number; // Lower numbers are cleaned up first
}

export class CleanupManager {
	private static instance: CleanupManager;
	private targets: CleanupTarget[] = [];
	private cleanupHandlers: (() => void)[] = [];
	private isShuttingDown = false;

	static getInstance(): CleanupManager {
		if (!CleanupManager.instance) {
			CleanupManager.instance = new CleanupManager();
		}
		return CleanupManager.instance;
	}

	/**
	 * Register a cleanup target
	 */
	register(target: CleanupTarget): void {
		if (this.isShuttingDown) {
			console.warn(
				`Cannot register cleanup target during shutdown: ${target.name}`,
			);
			return;
		}

		// Insert in priority order
		const index = this.targets.findIndex(
			(t) => (t.priority || 100) > (target.priority || 100),
		);
		if (index === -1) {
			this.targets.push(target);
		} else {
			this.targets.splice(index, 0, target);
		}
	}

	/**
	 * Register multiple cleanup targets
	 */
	registerAll(targets: CleanupTarget[]): void {
		targets.forEach((target) => this.register(target));
	}

	/**
	 * Unregister a cleanup target
	 */
	unregister(name: string): void {
		this.targets = this.targets.filter((t) => t.name !== name);
	}

	/**
	 * Add cleanup handler for process events
	 */
	setupProcessHandlers(): void {
		// Handle various shutdown signals
		const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGUSR2"];

		signals.forEach((signal) => {
			const handler = () => {
				console.log(`\nReceived ${signal}, starting graceful shutdown...`);
				this.cleanup()
					.then(() => {
						console.log("Graceful shutdown completed");
						process.exit(0);
					})
					.catch((error) => {
						console.error("Error during shutdown:", error);
						process.exit(1);
					});
			};

			process.on(signal, handler);
			this.cleanupHandlers.push(() => process.removeListener(signal, handler));
		});

		// Handle uncaught errors
		const errorHandler = (error: Error) => {
			console.error("Uncaught error, starting emergency shutdown:", error);
			this.cleanup().finally(() => process.exit(1));
		};

		process.on("uncaughtException", errorHandler);
		process.on("unhandledRejection", errorHandler);

		this.cleanupHandlers.push(() => {
			process.removeListener("uncaughtException", errorHandler);
			process.removeListener("unhandledRejection", errorHandler);
		});
	}

	/**
	 * Perform cleanup of all registered targets
	 */
	async cleanup(): Promise<void> {
		if (this.isShuttingDown) {
			console.warn("Cleanup already in progress");
			return;
		}

		this.isShuttingDown = true;
		console.log(`Starting cleanup of ${this.targets.length} services...`);

		const errors: Array<{ name: string; error: Error }> = [];

		// Clean up in priority order
		for (const target of this.targets) {
			try {
				console.log(`Cleaning up ${target.name}...`);
				const result = target.cleanup();

				// Handle both sync and async cleanup
				if (result instanceof Promise) {
					await result;
				}

				console.log(`✓ ${target.name} cleaned up successfully`);
			} catch (error) {
				console.error(`✗ Failed to cleanup ${target.name}:`, error);
				errors.push({ name: target.name, error: error as Error });
			}
		}

		// Remove process event handlers
		this.cleanupHandlers.forEach((handler) => handler());
		this.cleanupHandlers = [];

		// Clear targets
		this.targets = [];
		this.isShuttingDown = false;

		if (errors.length > 0) {
			throw new Error(
				`Cleanup failed for ${errors.length} services: ${errors.map((e) => e.name).join(", ")}`,
			);
		}
	}

	/**
	 * Get list of registered cleanup targets
	 */
	getTargets(): ReadonlyArray<CleanupTarget> {
		return [...this.targets];
	}

	/**
	 * Reset singleton instance (useful for testing)
	 */
	static resetInstance(): void {
		CleanupManager.instance = undefined as any;
	}
}

// Export singleton instance
export const cleanupManager = CleanupManager.getInstance();

// Convenience function to register common singletons
export function registerCommonSingletons(): void {
	const manager = CleanupManager.getInstance();

	// Register auth manager
	try {
		const { AuthManager } = require("./auth");
		const authInstance = AuthManager.getInstance();
		manager.register({
			name: "AuthManager",
			cleanup: () => authInstance.cleanup(),
			priority: 10,
		});
	} catch (_e) {
		// Module not available
	}

	// Register config manager
	try {
		const { configManager } = require("@ignitabull/config");
		manager.register({
			name: "ConfigManager",
			cleanup: () => configManager.cleanup(),
			priority: 20,
		});
	} catch (_e) {
		// Module not available
	}

	// Register logger factory
	try {
		const { LoggerFactory } = require("@ignitabull/amazon-core/utils/logger");
		const loggerInstance = LoggerFactory.getInstance();
		manager.register({
			name: "LoggerFactory",
			cleanup: async () => await loggerInstance.cleanup(),
			priority: 90, // Clean up loggers late
		});
	} catch (_e) {
		// Module not available
	}

	// Register Amazon config manager
	try {
		const {
			ConfigManager: AmazonConfigManager,
		} = require("@ignitabull/amazon-core/utils/config");
		const configInstance = AmazonConfigManager.getInstance();
		manager.register({
			name: "AmazonConfigManager",
			cleanup: () => configInstance.cleanup(),
			priority: 25,
		});
	} catch (_e) {
		// Module not available
	}
}
