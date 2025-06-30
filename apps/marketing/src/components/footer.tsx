import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import Link from "next/link";

const navigation = {
	product: [
		{ name: "Features", href: "#features" },
		{ name: "Pricing", href: "#pricing" },
		{ name: "Integrations", href: "/integrations" },
		{ name: "API", href: "/api" },
	],
	company: [
		{ name: "About", href: "/about" },
		{ name: "Blog", href: "/blog" },
		{ name: "Careers", href: "/careers" },
		{ name: "Contact", href: "/contact" },
	],
	resources: [
		{ name: "Documentation", href: "/docs" },
		{ name: "Help Center", href: "/help" },
		{ name: "Case Studies", href: "/case-studies" },
		{ name: "Community", href: "/community" },
	],
	legal: [
		{ name: "Privacy Policy", href: "/privacy" },
		{ name: "Terms of Service", href: "/terms" },
		{ name: "Cookie Policy", href: "/cookies" },
		{ name: "GDPR", href: "/gdpr" },
	],
};

const social = [
	{ name: "Twitter", href: "#", icon: Twitter },
	{ name: "LinkedIn", href: "#", icon: Linkedin },
	{ name: "GitHub", href: "#", icon: Github },
];

export function Footer() {
	return (
		<footer className="bg-gray-900 text-white">
			<div className="container-width px-4 py-16 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
					{/* Brand */}
					<div className="lg:col-span-2">
						<Link href="/" className="mb-4 flex items-center space-x-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600">
								<span className="font-bold text-lg text-white">I</span>
							</div>
							<span className="font-bold font-display text-xl">Ignitabull</span>
						</Link>
						<p className="mb-6 max-w-md text-gray-400">
							The all-in-one e-commerce growth platform that unifies your
							Amazon, Shopify, and multi-channel operations with AI-powered
							insights.
						</p>
						<div className="flex space-x-4">
							{social.map((item) => (
								<a
									key={item.name}
									href={item.href}
									className="text-gray-400 transition-colors hover:text-white"
								>
									<span className="sr-only">{item.name}</span>
									<item.icon className="h-5 w-5" />
								</a>
							))}
						</div>
					</div>

					{/* Product */}
					<div>
						<h3 className="mb-4 font-semibold text-sm text-white uppercase tracking-wider">
							Product
						</h3>
						<ul className="space-y-2">
							{navigation.product.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className="text-gray-400 transition-colors hover:text-white"
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Company */}
					<div>
						<h3 className="mb-4 font-semibold text-sm text-white uppercase tracking-wider">
							Company
						</h3>
						<ul className="space-y-2">
							{navigation.company.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className="text-gray-400 transition-colors hover:text-white"
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Resources */}
					<div>
						<h3 className="mb-4 font-semibold text-sm text-white uppercase tracking-wider">
							Resources
						</h3>
						<ul className="space-y-2">
							{navigation.resources.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className="text-gray-400 transition-colors hover:text-white"
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Legal */}
					<div>
						<h3 className="mb-4 font-semibold text-sm text-white uppercase tracking-wider">
							Legal
						</h3>
						<ul className="space-y-2">
							{navigation.legal.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className="text-gray-400 transition-colors hover:text-white"
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Newsletter */}
				<div className="mt-12 border-gray-800 border-t pt-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between">
						<div className="mb-4 md:mb-0">
							<h3 className="mb-2 font-semibold text-lg">Stay updated</h3>
							<p className="text-gray-400">
								Get the latest e-commerce insights and platform updates.
							</p>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row md:min-w-80">
							<input
								type="email"
								placeholder="Enter your email"
								className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
							/>
							<button className="btn-primary flex items-center justify-center">
								<Mail className="mr-2 h-4 w-4" />
								Subscribe
							</button>
						</div>
					</div>
				</div>

				{/* Bottom */}
				<div className="mt-8 border-gray-800 border-t pt-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between">
						<p className="text-gray-400 text-sm">
							© 2025 Ignitabull. All rights reserved.
						</p>
						<p className="mt-2 text-gray-400 text-sm md:mt-0">
							Made with ❤️ for e-commerce entrepreneurs
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
