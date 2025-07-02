/// <reference types="vitest" />

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./test/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json"],
			exclude: [
				"node_modules/**",
				"dist/**",
				"**/*.d.ts",
				"**/*.test.ts",
				"**/*.spec.ts",
			],
		},
	},
	resolve: {
		alias: {
			"@ignitabull/core": path.resolve(__dirname, "./src"),
			"@ignitabull/config": path.resolve(__dirname, "../config/src"),
		},
	},
});
