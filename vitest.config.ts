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
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/**",
				"dist/**",
				"**/*.d.ts",
				"**/*.test.ts",
				"**/*.spec.ts",
				"test/**",
				"coverage/**",
				".next/**",
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},
		testTimeout: 10000,
		hookTimeout: 10000,
	},
	resolve: {
		alias: {
			"@ignitabull/core": path.resolve(__dirname, "./packages/core/src"),
			"@ignitabull/amazon-core": path.resolve(
				__dirname,
				"./packages/amazon-core/src",
			),
			"@ignitabull/config": path.resolve(__dirname, "./packages/config/src"),
		},
	},
});
