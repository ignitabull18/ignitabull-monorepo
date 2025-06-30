import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Benefits } from "@/sections/benefits";
import { CTA } from "@/sections/cta";
import { Features } from "@/sections/features";
import { Hero } from "@/sections/hero";
import { Pricing } from "@/sections/pricing";
import { Testimonials } from "@/sections/testimonials";

export const metadata: Metadata = {
	title: "Ignitabull - Ignite Your E-commerce Growth",
	description:
		"The all-in-one platform that unifies Amazon, Shopify, and multi-channel e-commerce operations with AI-powered insights, automated marketing, and cutting-edge analytics.",
	openGraph: {
		title: "Ignitabull - Ignite Your E-commerce Growth",
		description:
			"The all-in-one platform that unifies Amazon, Shopify, and multi-channel e-commerce operations with AI-powered insights.",
		url: "https://ignitabull.com",
		images: ["/og-home.jpg"],
	},
};

export default function HomePage() {
	return (
		<div className="min-h-screen bg-white">
			<Header />
			<main>
				<Hero />
				<Features />
				<Benefits />
				<Testimonials />
				<Pricing />
				<CTA />
			</main>
			<Footer />
		</div>
	);
}
