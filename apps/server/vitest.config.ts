import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["../../test/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				".next/",
				"coverage/",
				"**/*.test.ts",
				"**/*.spec.ts",
				"vitest.config.ts",
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
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/middleware": path.resolve(__dirname, "./src/middleware"),
			"@/types": path.resolve(__dirname, "./src/types"),
		},
	},
});
