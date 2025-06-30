import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
	return (
		<section className="section-padding bg-gradient-to-r from-primary-600 to-secondary-600">
			<div className="container-width">
				<div className="text-center text-white">
					<h2 className="mb-6 font-bold font-display text-4xl md:text-5xl">
						Ready to Ignite Your Growth?
					</h2>
					<p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
						Join thousands of e-commerce brands already scaling with Ignitabull.
						Start your free trial today.
					</p>
					<Link
						href="/demo"
						className="btn group inline-flex items-center bg-white px-8 py-4 text-lg text-primary-600 hover:bg-gray-100"
					>
						<span>Start Free Trial</span>
						<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
					</Link>
				</div>
			</div>
		</section>
	);
}
