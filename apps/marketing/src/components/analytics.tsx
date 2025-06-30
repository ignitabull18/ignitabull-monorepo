"use client";

import { usePathname } from "next/navigation";
import Plausible from "plausible-tracker";
import posthog from "posthog-js";
import { useEffect } from "react";

// Initialize Plausible
const plausible = Plausible({
	domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "localhost",
	apiHost: process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io",
});

export function Analytics() {
	const _pathname = usePathname();

	useEffect(() => {
		// Initialize PostHog
		if (process.env.NEXT_PUBLIC_POSTHOG_KEY && typeof window !== "undefined") {
			posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
				api_host:
					process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
				loaded: (posthog) => {
					if (process.env.NODE_ENV === "development") posthog.debug();
				},
				capture_pageview: false, // We'll manually track pageviews
				capture_pageleave: true,
				person_profiles: "identified_only", // Privacy-first approach
			});
		}
	}, []);

	useEffect(() => {
		// Track page views with Plausible (always enabled for privacy-first tracking)
		plausible.trackPageview();

		// Track page views with PostHog (only if user has consented)
		if (
			typeof window !== "undefined" &&
			window.localStorage.getItem("analytics-consent") === "true"
		) {
			posthog.capture("$pageview");
		}
	}, []);

	return null;
}

// Custom event tracking functions
export const trackEvent = (
	eventName: string,
	properties?: Record<string, string | number | boolean>,
) => {
	// Always track with Plausible (privacy-first)
	plausible.trackEvent(eventName, { props: properties });

	// Track with PostHog only if consent given
	if (
		typeof window !== "undefined" &&
		window.localStorage.getItem("analytics-consent") === "true"
	) {
		posthog.capture(eventName, properties);
	}
};

// Lead tracking functions
export const trackLead = (leadData: {
	email: string;
	source: string;
	campaign?: string;
	page?: string;
}) => {
	trackEvent("Lead Generated", {
		source: leadData.source,
		campaign: leadData.campaign,
		page: leadData.page || window.location.pathname,
	});

	// Identify user in PostHog if consent given
	if (
		typeof window !== "undefined" &&
		window.localStorage.getItem("analytics-consent") === "true"
	) {
		posthog.identify(leadData.email, {
			email: leadData.email,
			source: leadData.source,
			first_seen: new Date().toISOString(),
		});
	}
};

// Form tracking
export const trackFormStart = (formName: string) => {
	trackEvent("Form Started", { form_name: formName });
};

export const trackFormSubmit = (formName: string, success: boolean) => {
	trackEvent("Form Submitted", {
		form_name: formName,
		success: success,
	});
};

// Button/CTA tracking
export const trackCTAClick = (ctaName: string, location: string) => {
	trackEvent("CTA Clicked", {
		cta_name: ctaName,
		location: location,
	});
};

// Scroll tracking
export const trackScrollDepth = (depth: number) => {
	trackEvent("Scroll Depth", { depth: depth });
};

// Time on page tracking
export const trackTimeOnPage = (seconds: number, page: string) => {
	trackEvent("Time on Page", {
		seconds: seconds,
		page: page,
	});
};
