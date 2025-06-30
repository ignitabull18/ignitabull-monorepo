import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/sections/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				primary: {
					50: "#fef7ee",
					100: "#fdedd6",
					500: "#f97316",
					600: "#ea580c",
					700: "#c2410c",
					900: "#9a3412",
				},
				secondary: {
					50: "#f0f9ff",
					100: "#e0f2fe",
					500: "#0ea5e9",
					600: "#0284c7",
					700: "#0369a1",
					900: "#0c4a6e",
				},
				gray: {
					50: "#f9fafb",
					100: "#f3f4f6",
					200: "#e5e7eb",
					300: "#d1d5db",
					400: "#9ca3af",
					500: "#6b7280",
					600: "#4b5563",
					700: "#374151",
					800: "#1f2937",
					900: "#111827",
				},
			},
			fontFamily: {
				sans: ["Inter", "system-ui", "sans-serif"],
				display: ["Cal Sans", "Inter", "system-ui", "sans-serif"],
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: "none",
						color: "#374151",
						p: {
							marginTop: "1.25em",
							marginBottom: "1.25em",
						},
					},
				},
			},
		},
	},
	plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};

export default config;
