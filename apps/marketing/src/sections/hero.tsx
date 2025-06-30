"use client";

import { ArrowRight, BarChart3, Play, Target, Zap } from "lucide-react";
import Link from "next/link";
import { trackCTAClick } from "@/components/analytics";

const stats = [
	{ label: "E-commerce Brands", value: "1,000+" },
	{ label: "Revenue Managed", value: "$50M+" },
	{ label: "Time Saved Weekly", value: "20+ hrs" },
	{ label: "ROI Improvement", value: "300%" },
];

const socialProof = [
	{ name: "Amazon", logo: "/logos/amazon.svg" },
	{ name: "Shopify", logo: "/logos/shopify.svg" },
	{ name: "Google", logo: "/logos/google.svg" },
	{ name: "Meta", logo: "/logos/meta.svg" },
];

export function Hero() {
	const handleCTAClick = (cta: string) => {
		trackCTAClick(cta, "hero");
	};

	return (
		<section className="relative flex min-h-screen items-center justify-center overflow-hidden">
			{/* Background */}
			<div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />

			{/* Background Pattern */}
			<div className="absolute inset-0 opacity-40">
				<div className="absolute top-10 left-10 h-20 w-20 rounded-full bg-primary-200 blur-xl" />
				<div className="absolute top-32 right-20 h-32 w-32 rounded-full bg-secondary-200 blur-xl" />
				<div className="absolute bottom-20 left-1/4 h-24 w-24 rounded-full bg-primary-300 blur-xl" />
				<div className="absolute right-10 bottom-32 h-28 w-28 rounded-full bg-secondary-300 blur-xl" />
			</div>

			<div className="container-width section-padding relative">
				<div className="mx-auto max-w-4xl text-center">
					{/* Badge */}
					<div className="mb-8 inline-flex items-center space-x-2 rounded-full border border-primary-200 bg-white/80 px-4 py-2 backdrop-blur-sm">
						<Zap className="h-4 w-4 text-primary-600" />
						<span className="font-medium text-primary-700 text-sm">
							Trusted by 1,000+ E-commerce Brands
						</span>
					</div>

					{/* Headline */}
					<h1 className="mb-6 text-balance font-bold font-display text-5xl text-gray-900 md:text-7xl">
						<span className="gradient-text">Ignite</span> Your
						<br />
						E-commerce Growth
					</h1>

					{/* Subheadline */}
					<p className="mx-auto mb-12 max-w-3xl text-balance text-gray-600 text-xl md:text-2xl">
						The all-in-one platform that unifies Amazon, Shopify, and
						multi-channel operations with <strong>AI-powered insights</strong>,{" "}
						<strong>automated marketing</strong>, and{" "}
						<strong>cutting-edge analytics</strong>.
					</p>

					{/* CTA Buttons */}
					<div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Link
							href="/demo"
							className="btn-primary group px-8 py-4 text-lg"
							onClick={() => handleCTAClick("hero_demo_request")}
						>
							<span>Start Free Trial</span>
							<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
						</Link>
						<button
							className="btn-outline group px-8 py-4 text-lg"
							onClick={() => handleCTAClick("hero_watch_demo")}
						>
							<Play className="mr-2 h-5 w-5" />
							<span>Watch Demo</span>
						</button>
					</div>

					{/* Stats */}
					<div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4">
						{stats.map((stat) => (
							<div key={stat.label} className="text-center">
								<div className="mb-2 font-bold text-3xl text-gray-900 md:text-4xl">
									{stat.value}
								</div>
								<div className="text-gray-600 text-sm">{stat.label}</div>
							</div>
						))}
					</div>

					{/* Social Proof */}
					<div className="space-y-4">
						<p className="font-medium text-gray-500 text-sm uppercase tracking-wide">
							Integrates seamlessly with
						</p>
						<div className="flex items-center justify-center space-x-8 opacity-60">
							{socialProof.map((brand) => (
								<div key={brand.name} className="flex items-center space-x-2">
									<div className="h-8 w-8 rounded bg-gray-400" />
									<span className="font-medium text-gray-600">
										{brand.name}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Feature Pills */}
				<div className="absolute top-20 left-10 hidden lg:block">
					<div className="rounded-lg border border-gray-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
						<div className="flex items-center space-x-2">
							<BarChart3 className="h-4 w-4 text-primary-600" />
							<span className="font-medium text-gray-900 text-sm">
								Real-time Analytics
							</span>
						</div>
					</div>
				</div>

				<div className="absolute top-32 right-20 hidden lg:block">
					<div className="rounded-lg border border-gray-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
						<div className="flex items-center space-x-2">
							<Target className="h-4 w-4 text-secondary-600" />
							<span className="font-medium text-gray-900 text-sm">
								AI-Powered Insights
							</span>
						</div>
					</div>
				</div>

				<div className="absolute bottom-32 left-1/4 hidden lg:block">
					<div className="rounded-lg border border-gray-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
						<div className="flex items-center space-x-2">
							<Zap className="h-4 w-4 text-primary-600" />
							<span className="font-medium text-gray-900 text-sm">
								Automated Marketing
							</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
