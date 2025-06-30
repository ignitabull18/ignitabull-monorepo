"use client";

import {
	BarChart3,
	Bot,
	Mail,
	Shield,
	ShoppingCart,
	Target,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";

const features = [
	{
		icon: BarChart3,
		title: "Unified Analytics Dashboard",
		description:
			"Real-time data from Amazon, Shopify, and all your e-commerce channels in one powerful dashboard.",
		benefits: [
			"Multi-channel aggregation",
			"Customizable widgets",
			"Real-time alerts",
		],
	},
	{
		icon: Bot,
		title: "AI-Powered Intelligence",
		description:
			"Conversational AI assistant with predictive analytics and automated insights for smarter decisions.",
		benefits: [
			"Natural language queries",
			"Predictive forecasting",
			"Anomaly detection",
		],
	},
	{
		icon: Target,
		title: "Advanced SEO & Research",
		description:
			"Automated SEO optimization with Jungle Scout, Keepa, and DataForSEO integrations.",
		benefits: ["Keyword tracking", "Competitor analysis", "Price monitoring"],
	},
	{
		icon: Mail,
		title: "Marketing Automation",
		description:
			"Advanced email campaigns with behavioral triggers, segmentation, and performance tracking.",
		benefits: ["Automated sequences", "Behavioral targeting", "A/B testing"],
	},
	{
		icon: Users,
		title: "CRM & Lead Management",
		description:
			"Complete lead scoring, visitor tracking, and automated follow-up systems.",
		benefits: ["Lead scoring", "Visitor identification", "Automated nurturing"],
	},
	{
		icon: TrendingUp,
		title: "Influencer Marketing",
		description:
			"Discover, manage, and track influencer partnerships with advanced relationship tools.",
		benefits: ["Influencer discovery", "Campaign management", "ROI tracking"],
	},
	{
		icon: ShoppingCart,
		title: "Operations Management",
		description:
			"Streamlined inventory, order management, and customer service across all channels.",
		benefits: ["Inventory sync", "Order tracking", "Customer support"],
	},
	{
		icon: Zap,
		title: "Growth Optimization",
		description:
			"Built-in A/B testing, conversion optimization, and dynamic pricing strategies.",
		benefits: ["A/B testing", "Conversion funnels", "Dynamic pricing"],
	},
	{
		icon: Shield,
		title: "Privacy-First Analytics",
		description:
			"GDPR-compliant tracking with Plausible and PostHog for detailed user insights.",
		benefits: [
			"Cookie-free tracking",
			"GDPR compliance",
			"Behavioral analytics",
		],
	},
];

export function Features() {
	return (
		<section id="features" className="section-padding bg-gray-50">
			<div className="container-width">
				<div className="mb-16 text-center">
					<h2 className="mb-6 font-bold font-display text-4xl text-gray-900 md:text-5xl">
						Everything You Need to <span className="gradient-text">Scale</span>
					</h2>
					<p className="mx-auto max-w-3xl text-gray-600 text-xl">
						Stop juggling 10+ different tools. Ignitabull consolidates your
						entire e-commerce operation into one intelligent platform powered by
						cutting-edge AI.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, _index) => (
						<div
							key={feature.title}
							className="card group transition-shadow duration-300 hover:shadow-lg"
						>
							<div className="mb-4 flex items-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-primary-100 to-secondary-100 transition-transform duration-300 group-hover:scale-110">
									<feature.icon className="h-6 w-6 text-primary-600" />
								</div>
								<h3 className="ml-4 font-semibold text-gray-900 text-xl">
									{feature.title}
								</h3>
							</div>

							<p className="mb-4 text-gray-600">{feature.description}</p>

							<ul className="space-y-2">
								{feature.benefits.map((benefit) => (
									<li
										key={benefit}
										className="flex items-center text-gray-500 text-sm"
									>
										<div className="mr-3 h-1.5 w-1.5 rounded-full bg-primary-500" />
										{benefit}
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="mt-16 text-center">
					<p className="mb-8 text-gray-600 text-lg">
						Ready to see how it all works together?
					</p>
					<a
						href="/demo"
						className="btn-primary group inline-flex items-center px-8 py-4 text-lg"
					>
						<span>Get Your Free Demo</span>
						<TrendingUp className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
					</a>
				</div>
			</div>
		</section>
	);
}
