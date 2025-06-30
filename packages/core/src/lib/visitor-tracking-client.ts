/**
 * Visitor Tracking Client
 * Browser-side client for visitor behavior tracking
 */

export interface TrackingConfig {
	apiUrl: string;
	apiKey?: string;
	enableAutoTracking?: boolean;
	trackPageViews?: boolean;
	trackClicks?: boolean;
	trackForms?: boolean;
	trackScrolling?: boolean;
	cookieConsent?: boolean;
	debugMode?: boolean;
}

export interface TrackingEvent {
	type: string;
	properties: Record<string, any>;
	timestamp?: Date;
}

export interface PageViewData {
	url: string;
	path: string;
	title: string;
	referrer?: string;
}

export interface InteractionData {
	type:
		| "click"
		| "form_submit"
		| "download"
		| "video_play"
		| "scroll"
		| "hover"
		| "search"
		| "share";
	element?: string;
	elementId?: string;
	elementClass?: string;
	value?: string;
	coordinates?: { x: number; y: number };
}

export interface LeadData {
	email?: string;
	firstName?: string;
	lastName?: string;
	company?: string;
	phone?: string;
	jobTitle?: string;
	industry?: string;
	formType?: "contact" | "newsletter" | "demo" | "trial" | "download" | "quote";
	customFields?: Record<string, any>;
}

export class VisitorTrackingClient {
	private config: TrackingConfig;
	private sessionId: string;
	private userId?: string;
	private isInitialized = false;
	private eventQueue: TrackingEvent[] = [];
	private lastActivity = Date.now();
	private activityTimer?: NodeJS.Timeout;
	private beforeUnloadHandler?: () => void;

	constructor(config: TrackingConfig) {
		this.config = {
			enableAutoTracking: true,
			trackPageViews: true,
			trackClicks: true,
			trackForms: true,
			trackScrolling: true,
			cookieConsent: true,
			debugMode: false,
			...config,
		};

		this.sessionId = this.generateSessionId();
		this.setupEventListeners();
	}

	// Initialize tracking
	async initialize(userId?: string): Promise<void> {
		if (this.isInitialized) return;

		this.userId = userId;

		try {
			// Check cookie consent
			if (this.config.cookieConsent && !this.hasCookieConsent()) {
				this.log("Cookie consent not given, tracking disabled");
				return;
			}

			// Create session
			await this.createSession();

			// Start auto-tracking if enabled
			if (this.config.enableAutoTracking) {
				this.startAutoTracking();
			}

			// Set up activity monitoring
			this.setupActivityMonitoring();

			// Set up beforeunload handler
			this.setupBeforeUnloadHandler();

			this.isInitialized = true;
			this.log("Visitor tracking initialized");

			// Track initial page view
			if (this.config.trackPageViews) {
				await this.trackPageView();
			}
		} catch (error) {
			console.error("Failed to initialize visitor tracking:", error);
		}
	}

	// Track a page view
	async trackPageView(data?: Partial<PageViewData>): Promise<void> {
		if (!this.isInitialized) {
			this.log("Tracking not initialized");
			return;
		}

		const pageViewData: PageViewData = {
			url: window.location.href,
			path: window.location.pathname,
			title: document.title,
			referrer: document.referrer,
			...data,
		};

		try {
			await this.sendEvent("page_view", pageViewData);
			this.log("Page view tracked:", pageViewData);
		} catch (error) {
			console.error("Failed to track page view:", error);
		}
	}

	// Track an interaction
	async trackInteraction(data: InteractionData): Promise<void> {
		if (!this.isInitialized) {
			this.log("Tracking not initialized");
			return;
		}

		try {
			await this.sendEvent("interaction", {
				...data,
				url: window.location.href,
			});
			this.log("Interaction tracked:", data);
		} catch (error) {
			console.error("Failed to track interaction:", error);
		}
	}

	// Track a lead/form submission
	async trackLead(data: LeadData): Promise<void> {
		if (!this.isInitialized) {
			this.log("Tracking not initialized");
			return;
		}

		try {
			await this.sendEvent("lead", {
				...data,
				source: this.getUtmSource(),
				medium: this.getUtmMedium(),
				campaign: this.getUtmCampaign(),
				formUrl: window.location.href,
			});
			this.log("Lead tracked:", data);
		} catch (error) {
			console.error("Failed to track lead:", error);
		}
	}

	// Track a custom event
	async trackEvent(
		eventName: string,
		properties: Record<string, any> = {},
	): Promise<void> {
		if (!this.isInitialized) {
			this.log("Tracking not initialized");
			return;
		}

		try {
			await this.sendEvent("custom", {
				eventName,
				...properties,
				url: window.location.href,
			});
			this.log("Custom event tracked:", eventName, properties);
		} catch (error) {
			console.error("Failed to track custom event:", error);
		}
	}

	// Identify a user
	async identify(
		userId: string,
		traits: Record<string, any> = {},
	): Promise<void> {
		this.userId = userId;

		try {
			await this.sendEvent("identify", {
				userId,
				...traits,
			});
			this.log("User identified:", userId, traits);
		} catch (error) {
			console.error("Failed to identify user:", error);
		}
	}

	// End the current session
	async endSession(): Promise<void> {
		if (!this.isInitialized) return;

		try {
			await this.apiCall(`/sessions/${this.sessionId}/end`, "POST");
			this.log("Session ended");
		} catch (error) {
			console.error("Failed to end session:", error);
		}
	}

	// Private methods
	private async createSession(): Promise<void> {
		const sessionData = {
			sessionId: this.sessionId,
			userId: this.userId,
			ipAddress: await this.getClientIP(),
			userAgent: navigator.userAgent,
			referrer: document.referrer,
			utm: this.getUtmParams(),
			url: window.location.href,
		};

		await this.apiCall("/sessions", "POST", sessionData);
	}

	private async sendEvent(
		type: string,
		properties: Record<string, any>,
	): Promise<void> {
		const event: TrackingEvent = {
			type,
			properties: {
				...properties,
				sessionId: this.sessionId,
				userId: this.userId,
				timestamp: new Date().toISOString(),
			},
			timestamp: new Date(),
		};

		// Queue event if offline or add to immediate send
		if (navigator.onLine === false) {
			this.eventQueue.push(event);
			return;
		}

		try {
			switch (type) {
				case "page_view":
					await this.apiCall("/page-views", "POST", event.properties);
					break;
				case "interaction":
					await this.apiCall("/interactions", "POST", event.properties);
					break;
				case "lead":
					await this.apiCall("/leads", "POST", event.properties);
					break;
				default:
					await this.apiCall("/events", "POST", event);
			}
		} catch (error) {
			// Queue for retry
			this.eventQueue.push(event);
			throw error;
		}
	}

	private async apiCall(
		endpoint: string,
		method: string,
		data?: any,
	): Promise<any> {
		const url = `${this.config.apiUrl}/visitor-tracking${endpoint}`;
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		if (this.config.apiKey) {
			headers.Authorization = `Bearer ${this.config.apiKey}`;
		}

		const response = await fetch(url, {
			method,
			headers,
			body: data ? JSON.stringify(data) : undefined,
		});

		if (!response.ok) {
			throw new Error(
				`API call failed: ${response.status} ${response.statusText}`,
			);
		}

		return response.json();
	}

	private setupEventListeners(): void {
		// Click tracking
		if (this.config.trackClicks) {
			document.addEventListener("click", this.handleClick.bind(this), true);
		}

		// Form tracking
		if (this.config.trackForms) {
			document.addEventListener(
				"submit",
				this.handleFormSubmit.bind(this),
				true,
			);
		}

		// Scroll tracking
		if (this.config.trackScrolling) {
			let scrollTimeout: NodeJS.Timeout;
			document.addEventListener("scroll", () => {
				clearTimeout(scrollTimeout);
				scrollTimeout = setTimeout(() => {
					this.handleScroll();
				}, 250);
			});
		}

		// Page visibility
		document.addEventListener("visibilitychange", () => {
			if (document.hidden) {
				this.handlePageHide();
			} else {
				this.handlePageShow();
			}
		});

		// Online/offline status
		window.addEventListener("online", this.processEventQueue.bind(this));
	}

	private async handleClick(event: Event): Promise<void> {
		const target = event.target as HTMLElement;

		// Skip if target is not an element
		if (!target || target.nodeType !== 1) return;

		const data: InteractionData = {
			type: "click",
			element: target.tagName.toLowerCase(),
			elementId: target.id,
			elementClass: target.className,
			coordinates: {
				x: (event as MouseEvent).clientX,
				y: (event as MouseEvent).clientY,
			},
		};

		// Add text content for buttons and links
		if (target.tagName === "BUTTON" || target.tagName === "A") {
			data.value = target.textContent?.trim() || "";
		}

		// Check if it's a download link
		if (target.tagName === "A") {
			const href = (target as HTMLAnchorElement).href;
			if (href && this.isDownloadLink(href)) {
				data.type = "download";
				data.value = href;
			}
		}

		await this.trackInteraction(data);
	}

	private async handleFormSubmit(event: Event): Promise<void> {
		const form = event.target as HTMLFormElement;

		const data: InteractionData = {
			type: "form_submit",
			element: "form",
			elementId: form.id,
			elementClass: form.className,
			value: form.action || window.location.href,
		};

		await this.trackInteraction(data);
	}

	private async handleScroll(): Promise<void> {
		const scrollPercent = Math.round(
			(window.scrollY /
				(document.documentElement.scrollHeight - window.innerHeight)) *
				100,
		);

		// Track scroll milestones
		if (scrollPercent >= 25 && !this.hasScrolledTo(25)) {
			await this.trackInteraction({ type: "scroll", value: "25%" });
			this.setScrollMilestone(25);
		} else if (scrollPercent >= 50 && !this.hasScrolledTo(50)) {
			await this.trackInteraction({ type: "scroll", value: "50%" });
			this.setScrollMilestone(50);
		} else if (scrollPercent >= 75 && !this.hasScrolledTo(75)) {
			await this.trackInteraction({ type: "scroll", value: "75%" });
			this.setScrollMilestone(75);
		} else if (scrollPercent >= 90 && !this.hasScrolledTo(90)) {
			await this.trackInteraction({ type: "scroll", value: "90%" });
			this.setScrollMilestone(90);
		}
	}

	private handlePageHide(): void {
		this.lastActivity = Date.now();
		// Flush any pending events
		this.processEventQueue();
	}

	private handlePageShow(): void {
		this.lastActivity = Date.now();
	}

	private startAutoTracking(): void {
		// Track page views on route changes (for SPAs)
		let currentPath = window.location.pathname;

		const checkForRouteChange = () => {
			if (window.location.pathname !== currentPath) {
				currentPath = window.location.pathname;
				this.trackPageView();
			}
		};

		// Poll for route changes (fallback for frameworks without proper history API usage)
		setInterval(checkForRouteChange, 1000);

		// Listen for popstate events
		window.addEventListener("popstate", checkForRouteChange);
	}

	private setupActivityMonitoring(): void {
		// Track user activity for session timeout
		const activityEvents = [
			"mousedown",
			"mousemove",
			"keypress",
			"scroll",
			"touchstart",
		];

		const updateActivity = () => {
			this.lastActivity = Date.now();
		};

		activityEvents.forEach((event) => {
			document.addEventListener(event, updateActivity, true);
		});

		// Check for inactivity every minute
		this.activityTimer = setInterval(() => {
			const inactiveTime = Date.now() - this.lastActivity;
			const inactiveMinutes = inactiveTime / (1000 * 60);

			// Consider session inactive after 30 minutes
			if (inactiveMinutes >= 30) {
				this.endSession();
				clearInterval(this.activityTimer!);
			}
		}, 60000);
	}

	private setupBeforeUnloadHandler(): void {
		this.beforeUnloadHandler = () => {
			// Send any queued events synchronously
			if (this.eventQueue.length > 0) {
				navigator.sendBeacon(
					`${this.config.apiUrl}/visitor-tracking/events/batch`,
					JSON.stringify(this.eventQueue),
				);
			}

			// Mark session as ended
			navigator.sendBeacon(
				`${this.config.apiUrl}/visitor-tracking/sessions/${this.sessionId}/end`,
				"{}",
			);
		};

		window.addEventListener("beforeunload", this.beforeUnloadHandler);
	}

	private async processEventQueue(): Promise<void> {
		if (this.eventQueue.length === 0) return;

		const eventsToSend = [...this.eventQueue];
		this.eventQueue = [];

		try {
			await this.apiCall("/events/batch", "POST", eventsToSend);
			this.log(`Processed ${eventsToSend.length} queued events`);
		} catch (error) {
			// Re-queue events on failure
			this.eventQueue.unshift(...eventsToSend);
			console.error("Failed to process event queue:", error);
		}
	}

	// Utility methods
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private getUtmParams(): Record<string, string> {
		const params = new URLSearchParams(window.location.search);
		return {
			source: params.get("utm_source") || "",
			medium: params.get("utm_medium") || "",
			campaign: params.get("utm_campaign") || "",
			term: params.get("utm_term") || "",
			content: params.get("utm_content") || "",
		};
	}

	private getUtmSource(): string {
		return (
			new URLSearchParams(window.location.search).get("utm_source") || "direct"
		);
	}

	private getUtmMedium(): string {
		return new URLSearchParams(window.location.search).get("utm_medium") || "";
	}

	private getUtmCampaign(): string {
		return (
			new URLSearchParams(window.location.search).get("utm_campaign") || ""
		);
	}

	private async getClientIP(): Promise<string> {
		try {
			const response = await fetch("https://api.ipify.org?format=json");
			const data = await response.json();
			return data.ip;
		} catch {
			return "unknown";
		}
	}

	private hasCookieConsent(): boolean {
		// Check for common cookie consent mechanisms
		return (
			localStorage.getItem("cookie-consent") === "true" ||
			document.cookie.includes("cookie-consent=true") ||
			!this.config.cookieConsent
		);
	}

	private isDownloadLink(href: string): boolean {
		const downloadExtensions = [
			".pdf",
			".doc",
			".docx",
			".xls",
			".xlsx",
			".ppt",
			".pptx",
			".zip",
			".rar",
			".tar",
			".gz",
		];
		return downloadExtensions.some((ext) => href.toLowerCase().includes(ext));
	}

	private hasScrolledTo(percentage: number): boolean {
		const key = `scrolled_${percentage}_${this.sessionId}`;
		return sessionStorage.getItem(key) === "true";
	}

	private setScrollMilestone(percentage: number): void {
		const key = `scrolled_${percentage}_${this.sessionId}`;
		sessionStorage.setItem(key, "true");
	}

	private log(...args: any[]): void {
		if (this.config.debugMode) {
			console.log("[VisitorTracking]", ...args);
		}
	}

	// Public getters
	get isTracking(): boolean {
		return this.isInitialized;
	}

	get currentSessionId(): string {
		return this.sessionId;
	}

	get currentUserId(): string | undefined {
		return this.userId;
	}

	// Cleanup
	destroy(): void {
		if (this.activityTimer) {
			clearInterval(this.activityTimer);
		}

		if (this.beforeUnloadHandler) {
			window.removeEventListener("beforeunload", this.beforeUnloadHandler);
		}

		this.endSession();
		this.isInitialized = false;
	}
}

// Factory function for easy initialization
export function createVisitorTracker(
	config: TrackingConfig,
): VisitorTrackingClient {
	return new VisitorTrackingClient(config);
}

// Global instance for direct use
let globalTracker: VisitorTrackingClient | null = null;

export function initializeTracking(
	config: TrackingConfig,
	userId?: string,
): Promise<void> {
	if (globalTracker) {
		globalTracker.destroy();
	}

	globalTracker = new VisitorTrackingClient(config);
	return globalTracker.initialize(userId);
}

// Convenience functions that use the global tracker
export async function trackPageView(
	data?: Partial<PageViewData>,
): Promise<void> {
	if (!globalTracker) {
		console.warn("Visitor tracking not initialized");
		return;
	}
	return globalTracker.trackPageView(data);
}

export async function trackInteraction(data: InteractionData): Promise<void> {
	if (!globalTracker) {
		console.warn("Visitor tracking not initialized");
		return;
	}
	return globalTracker.trackInteraction(data);
}

export async function trackLead(data: LeadData): Promise<void> {
	if (!globalTracker) {
		console.warn("Visitor tracking not initialized");
		return;
	}
	return globalTracker.trackLead(data);
}

export async function trackEvent(
	eventName: string,
	properties?: Record<string, any>,
): Promise<void> {
	if (!globalTracker) {
		console.warn("Visitor tracking not initialized");
		return;
	}
	return globalTracker.trackEvent(eventName, properties);
}

export async function identifyUser(
	userId: string,
	traits?: Record<string, any>,
): Promise<void> {
	if (!globalTracker) {
		console.warn("Visitor tracking not initialized");
		return;
	}
	return globalTracker.identify(userId, traits);
}

export default VisitorTrackingClient;
