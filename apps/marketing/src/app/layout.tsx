import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/analytics";
import { ConsentBanner } from "@/components/consent-banner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Ignitabull - All-in-One E-commerce Growth Platform",
	description:
		"Unify your Amazon, Shopify, and e-commerce operations with AI-powered insights, automated marketing, and advanced analytics.",
	keywords: [
		"e-commerce",
		"amazon",
		"shopify",
		"analytics",
		"automation",
		"marketing",
		"ai",
	],
	authors: [{ name: "Ignitabull" }],
	creator: "Ignitabull",
	publisher: "Ignitabull",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://ignitabull.com",
		title: "Ignitabull - All-in-One E-commerce Growth Platform",
		description:
			"Unify your Amazon, Shopify, and e-commerce operations with AI-powered insights, automated marketing, and advanced analytics.",
		siteName: "Ignitabull",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "Ignitabull - E-commerce Growth Platform",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Ignitabull - All-in-One E-commerce Growth Platform",
		description:
			"Unify your Amazon, Shopify, and e-commerce operations with AI-powered insights.",
		images: ["/og-image.jpg"],
		creator: "@ignitabull",
	},
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
	verification: {
		google: "your-google-verification-code",
	},
	alternates: {
		canonical: "https://ignitabull.com",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="scroll-smooth">
			<head>
				<link rel="icon" href="/favicon.ico" />
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/favicon-16x16.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "SoftwareApplication",
							name: "Ignitabull",
							description: "All-in-One E-commerce Growth Platform",
							url: "https://ignitabull.com",
							applicationCategory: "BusinessApplication",
							operatingSystem: "Web",
							offers: {
								"@type": "Offer",
								price: "299",
								priceCurrency: "USD",
								priceValidUntil: "2025-12-31",
							},
							aggregateRating: {
								"@type": "AggregateRating",
								ratingValue: "4.8",
								reviewCount: "127",
							},
						}),
					}}
				/>
			</head>
			<body className={`${inter.className} antialiased`}>
				{children}
				<Analytics />
				<ConsentBanner />
			</body>
		</html>
	);
}
