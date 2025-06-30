import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-provider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Ignitabull - Amazon Business Intelligence Platform",
	description:
		"Comprehensive analytics and optimization platform for Amazon sellers, brands, and agencies.",
	keywords: [
		"Amazon analytics",
		"Amazon PPC",
		"Amazon SEO",
		"product research",
		"competitor analysis",
		"Amazon optimization",
		"e-commerce analytics",
		"Amazon business intelligence",
	],
	authors: [{ name: "Ignitabull Team" }],
	creator: "Ignitabull",
	publisher: "Ignitabull",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
		apple: "/apple-touch-icon.png",
	},
	manifest: "/manifest.json",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://ignitabull.com",
		siteName: "Ignitabull",
		title: "Ignitabull - Amazon Business Intelligence Platform",
		description:
			"Comprehensive analytics and optimization platform for Amazon sellers, brands, and agencies.",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "Ignitabull - Amazon Business Intelligence Platform",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Ignitabull - Amazon Business Intelligence Platform",
		description:
			"Comprehensive analytics and optimization platform for Amazon sellers, brands, and agencies.",
		images: ["/og-image.png"],
		creator: "@ignitabull",
	},
	alternates: {
		canonical: "https://ignitabull.com",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#000000" />

				{/* Preconnect to external domains for performance */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>

				{/* DNS prefetch for better performance */}
				<link rel="dns-prefetch" href="//www.google-analytics.com" />
				<link rel="dns-prefetch" href="//plausible.io" />

				{/* Security headers */}
				<meta httpEquiv="X-Content-Type-Options" content="nosniff" />
				<meta
					httpEquiv="Referrer-Policy"
					content="strict-origin-when-cross-origin"
				/>
				<meta
					httpEquiv="Permissions-Policy"
					content="camera=(), microphone=(), geolocation=()"
				/>
			</head>
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased",
					inter.className,
				)}
			>
				<AuthProvider>{children}</AuthProvider>

				{/* Analytics Scripts */}
				{process.env.NODE_ENV === "production" && (
					<>
						{/* Plausible Analytics */}
						{process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
							<script
								defer
								data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
								src="https://plausible.io/js/script.js"
							/>
						)}

						{/* PostHog Analytics */}
						{process.env.NEXT_PUBLIC_POSTHOG_KEY && (
							<script
								dangerouslySetInnerHTML={{
									__html: `
										!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);var n=t;if("undefined"!=typeof e){n=t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}else n=t[e]=[]}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),e},u.people.toString=function(){return u.toString()+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
										posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}',{api_host:'${process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"}'})
									`,
								}}
							/>
						)}
					</>
				)}
			</body>
		</html>
	);
}
