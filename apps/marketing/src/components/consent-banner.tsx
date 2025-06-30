"use client";

import { Settings, X } from "lucide-react";
import { useEffect, useState } from "react";

export function ConsentBanner() {
	const [showBanner, setShowBanner] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [analyticsConsent, setAnalyticsConsent] = useState(false);
	const [marketingConsent, setMarketingConsent] = useState(false);

	useEffect(() => {
		// Check if user has already made a choice
		const hasConsent = localStorage.getItem("consent-given");
		if (!hasConsent) {
			setShowBanner(true);
		} else {
			// Load existing preferences
			setAnalyticsConsent(localStorage.getItem("analytics-consent") === "true");
			setMarketingConsent(localStorage.getItem("marketing-consent") === "true");
		}
	}, []);

	const acceptAll = () => {
		localStorage.setItem("consent-given", "true");
		localStorage.setItem("analytics-consent", "true");
		localStorage.setItem("marketing-consent", "true");
		setAnalyticsConsent(true);
		setMarketingConsent(true);
		setShowBanner(false);

		// Reload to ensure analytics are properly initialized
		window.location.reload();
	};

	const acceptNecessaryOnly = () => {
		localStorage.setItem("consent-given", "true");
		localStorage.setItem("analytics-consent", "false");
		localStorage.setItem("marketing-consent", "false");
		setAnalyticsConsent(false);
		setMarketingConsent(false);
		setShowBanner(false);
	};

	const savePreferences = () => {
		localStorage.setItem("consent-given", "true");
		localStorage.setItem("analytics-consent", analyticsConsent.toString());
		localStorage.setItem("marketing-consent", marketingConsent.toString());
		setShowBanner(false);
		setShowSettings(false);

		// Reload to ensure analytics are properly initialized
		window.location.reload();
	};

	if (!showBanner) {
		return null;
	}

	return (
		<div className="fixed right-0 bottom-0 left-0 z-50 border-gray-200 border-t bg-white shadow-lg">
			<div className="container-width px-4 py-4">
				{!showSettings ? (
					<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
						<div className="flex-1">
							<h3 className="mb-2 font-semibold text-gray-900 text-lg">
								We value your privacy
							</h3>
							<p className="mb-3 text-gray-600 text-sm">
								We use cookies and similar technologies to improve your
								experience on our website. Some are essential for the site to
								function, while others help us understand how you use the site
								and improve our services.
							</p>
							<div className="flex flex-wrap gap-2">
								<span className="inline-block rounded bg-green-100 px-2 py-1 text-green-800 text-xs">
									Essential (Always Active)
								</span>
								<span className="inline-block rounded bg-blue-100 px-2 py-1 text-blue-800 text-xs">
									Analytics & Performance
								</span>
								<span className="inline-block rounded bg-purple-100 px-2 py-1 text-purple-800 text-xs">
									Marketing & Personalization
								</span>
							</div>
						</div>
						<div className="flex min-w-fit flex-col gap-2 sm:flex-row">
							<button
								onClick={() => setShowSettings(true)}
								className="btn-outline flex items-center gap-1 text-sm"
							>
								<Settings className="h-4 w-4" />
								Customize
							</button>
							<button
								onClick={acceptNecessaryOnly}
								className="btn-secondary text-sm"
							>
								Necessary Only
							</button>
							<button onClick={acceptAll} className="btn-primary text-sm">
								Accept All
							</button>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-gray-900 text-lg">
								Privacy Preferences
							</h3>
							<button
								onClick={() => setShowSettings(false)}
								className="rounded p-1 hover:bg-gray-100"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="space-y-4">
							<div className="rounded-lg border border-gray-200 p-4">
								<div className="mb-2 flex items-center justify-between">
									<h4 className="font-medium text-gray-900">
										Essential Cookies
									</h4>
									<span className="font-medium text-green-600 text-sm">
										Always Active
									</span>
								</div>
								<p className="text-gray-600 text-sm">
									These cookies are necessary for the website to function and
									cannot be disabled. They are usually set in response to
									actions you take, such as setting privacy preferences or
									logging in.
								</p>
							</div>

							<div className="rounded-lg border border-gray-200 p-4">
								<div className="mb-2 flex items-center justify-between">
									<h4 className="font-medium text-gray-900">
										Analytics & Performance
									</h4>
									<label className="relative inline-flex cursor-pointer items-center">
										<input
											type="checkbox"
											checked={analyticsConsent}
											onChange={(e) => setAnalyticsConsent(e.target.checked)}
											className="peer sr-only"
										/>
										<div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300" />
									</label>
								</div>
								<p className="text-gray-600 text-sm">
									These cookies help us understand how visitors interact with
									our website by collecting information anonymously. This helps
									us improve our website and your experience.
								</p>
							</div>

							<div className="rounded-lg border border-gray-200 p-4">
								<div className="mb-2 flex items-center justify-between">
									<h4 className="font-medium text-gray-900">
										Marketing & Personalization
									</h4>
									<label className="relative inline-flex cursor-pointer items-center">
										<input
											type="checkbox"
											checked={marketingConsent}
											onChange={(e) => setMarketingConsent(e.target.checked)}
											className="peer sr-only"
										/>
										<div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300" />
									</label>
								</div>
								<p className="text-gray-600 text-sm">
									These cookies enable us to provide personalized content,
									targeted advertisements, and track the effectiveness of our
									marketing campaigns across different platforms.
								</p>
							</div>
						</div>

						<div className="flex justify-end gap-2 border-gray-200 border-t pt-4">
							<button
								onClick={() => setShowSettings(false)}
								className="btn-secondary text-sm"
							>
								Cancel
							</button>
							<button onClick={savePreferences} className="btn-primary text-sm">
								Save Preferences
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
