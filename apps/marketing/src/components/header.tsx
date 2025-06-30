"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trackCTAClick } from "./analytics";

const navigation = [
	{ name: "Features", href: "#features" },
	{ name: "Benefits", href: "#benefits" },
	{ name: "Pricing", href: "#pricing" },
	{
		name: "Resources",
		href: "#",
		dropdown: [
			{ name: "Blog", href: "/blog" },
			{ name: "Case Studies", href: "/case-studies" },
			{ name: "Documentation", href: "/docs" },
			{ name: "Help Center", href: "/help" },
		],
	},
];

export function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleCTAClick = (cta: string) => {
		trackCTAClick(cta, "header");
	};

	return (
		<header
			className={`fixed top-0 z-50 w-full transition-all duration-300 ${
				isScrolled ? "bg-white/95 shadow-sm backdrop-blur-sm" : "bg-transparent"
			}`}
		>
			<div className="container-width">
				<div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
					{/* Logo */}
					<div className="flex items-center">
						<Link href="/" className="flex items-center space-x-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600">
								<span className="font-bold text-lg text-white">I</span>
							</div>
							<span className="font-bold font-display text-gray-900 text-xl">
								Ignitabull
							</span>
						</Link>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden items-center space-x-8 md:flex">
						{navigation.map((item) => (
							<div key={item.name} className="relative">
								{item.dropdown ? (
									<div
										className="relative"
										onMouseEnter={() => setActiveDropdown(item.name)}
										onMouseLeave={() => setActiveDropdown(null)}
									>
										<button className="flex items-center space-x-1 text-gray-700 transition-colors hover:text-primary-600">
											<span>{item.name}</span>
											<ChevronDown className="h-4 w-4" />
										</button>
										{activeDropdown === item.name && (
											<div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
												{item.dropdown.map((subItem) => (
													<Link
														key={subItem.name}
														href={subItem.href}
														className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-50 hover:text-primary-600"
													>
														{subItem.name}
													</Link>
												))}
											</div>
										)}
									</div>
								) : (
									<Link
										href={item.href}
										className="text-gray-700 transition-colors hover:text-primary-600"
									>
										{item.name}
									</Link>
								)}
							</div>
						))}
					</nav>

					{/* Desktop CTA Buttons */}
					<div className="hidden items-center space-x-4 md:flex">
						<Link
							href="/login"
							className="text-gray-700 transition-colors hover:text-primary-600"
							onClick={() => handleCTAClick("login")}
						>
							Sign In
						</Link>
						<Link
							href="/demo"
							className="btn-primary"
							onClick={() => handleCTAClick("demo_request")}
						>
							Request Demo
						</Link>
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden">
						<button
							onClick={() => setIsOpen(!isOpen)}
							className="text-gray-700 transition-colors hover:text-primary-600"
						>
							{isOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Navigation */}
			{isOpen && (
				<div className="border-gray-200 border-t bg-white md:hidden">
					<nav className="space-y-4 px-4 py-4">
						{navigation.map((item) => (
							<div key={item.name}>
								{item.dropdown ? (
									<div>
										<div className="font-medium text-gray-700">{item.name}</div>
										<div className="mt-2 ml-4 space-y-2">
											{item.dropdown.map((subItem) => (
												<Link
													key={subItem.name}
													href={subItem.href}
													className="block text-gray-600 hover:text-primary-600"
													onClick={() => setIsOpen(false)}
												>
													{subItem.name}
												</Link>
											))}
										</div>
									</div>
								) : (
									<Link
										href={item.href}
										className="block text-gray-700 transition-colors hover:text-primary-600"
										onClick={() => setIsOpen(false)}
									>
										{item.name}
									</Link>
								)}
							</div>
						))}
						<div className="space-y-2 border-gray-200 border-t pt-4">
							<Link
								href="/login"
								className="block text-gray-700 hover:text-primary-600"
								onClick={() => {
									setIsOpen(false);
									handleCTAClick("login");
								}}
							>
								Sign In
							</Link>
							<Link
								href="/demo"
								className="btn-primary block text-center"
								onClick={() => {
									setIsOpen(false);
									handleCTAClick("demo_request");
								}}
							>
								Request Demo
							</Link>
						</div>
					</nav>
				</div>
			)}
		</header>
	);
}
