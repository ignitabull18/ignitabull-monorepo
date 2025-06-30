/**
 * Email Utilities and Configuration
 * Centralized email functionality for the server
 */

import { type EmailService, getEmailService } from "../services/email-service";

// Email service singleton
let emailServiceInstance: EmailService | null = null;

export function initializeEmailService() {
	try {
		emailServiceInstance = getEmailService();
		console.log("✅ Email service initialized successfully");
		return emailServiceInstance;
	} catch (error) {
		console.error("❌ Failed to initialize email service:", error);
		throw error;
	}
}

export function getEmail(): EmailService {
	if (!emailServiceInstance) {
		emailServiceInstance = initializeEmailService();
	}
	return emailServiceInstance;
}

// Email sending helpers
export async function sendWelcomeEmail(
	email: string,
	userData: {
		firstName?: string;
		organizationName?: string;
		loginUrl?: string;
	},
) {
	const emailService = getEmail();
	return await emailService.sendWelcomeEmail(email, userData);
}

export async function sendPasswordResetEmail(
	email: string,
	resetData: {
		firstName?: string;
		resetUrl: string;
		expirationTime?: string;
	},
) {
	const emailService = getEmail();
	return await emailService.sendPasswordReset(email, resetData);
}

export async function sendEmailVerification(
	email: string,
	verificationData: {
		firstName?: string;
		verificationUrl: string;
	},
) {
	const emailService = getEmail();
	return await emailService.sendEmailVerification(email, verificationData);
}

export async function sendLeadNotification(
	email: string,
	leadData: {
		leadName: string;
		leadEmail: string;
		leadCompany?: string;
		leadMessage?: string;
		leadSource?: string;
		dashboardUrl?: string;
	},
) {
	const emailService = getEmail();
	return await emailService.sendLeadNotification(email, leadData);
}

export async function sendAmazonInsightsDigest(
	email: string,
	insightsData: {
		firstName?: string;
		insights: Array<{
			title: string;
			description: string;
			priority: string;
			impact: string;
		}>;
		dashboardUrl?: string;
		period?: string;
	},
) {
	const emailService = getEmail();
	return await emailService.sendAmazonInsightsDigest(email, insightsData);
}

export async function sendCampaignAlert(
	email: string,
	alertData: {
		firstName?: string;
		campaignName: string;
		alertType: "BUDGET_EXCEEDED" | "PERFORMANCE_DROP" | "ANOMALY_DETECTED";
		description: string;
		recommendedAction?: string;
		dashboardUrl?: string;
	},
) {
	const emailService = getEmail();
	return await emailService.sendCampaignAlert(email, alertData);
}

// Bulk email operations
export async function sendBulkEmails(
	emails: Array<{
		to: string;
		templateId: string;
		templateData: Record<string, any>;
	}>,
) {
	const emailService = getEmail();
	const emailData = emails.map((email) => ({
		to: email.to,
		templateId: email.templateId,
		templateData: email.templateData,
	}));

	return await emailService.sendBatchEmails(emailData);
}

// Email validation
export function isValidEmail(email: string): boolean {
	const emailService = getEmail();
	return emailService.isValidEmail(email);
}

// Template management
export function getAvailableTemplates() {
	return [
		"welcome",
		"password-reset",
		"email-verification",
		"lead-notification",
		"amazon-insights",
		"campaign-alert",
	];
}

// Email analytics and tracking
export interface EmailMetrics {
	sent: number;
	delivered: number;
	opened: number;
	clicked: number;
	bounced: number;
	complained: number;
}

// This would integrate with Resend's webhook system for tracking
export async function getEmailMetrics(
	_startDate: string,
	_endDate: string,
): Promise<EmailMetrics> {
	// Placeholder for Resend analytics integration
	return {
		sent: 0,
		delivered: 0,
		opened: 0,
		clicked: 0,
		bounced: 0,
		complained: 0,
	};
}

// Email queue management for high-volume sending
export class EmailQueue {
	private queue: Array<{
		email: string;
		templateId: string;
		templateData: Record<string, any>;
		priority: "high" | "normal" | "low";
		scheduledFor?: Date;
	}> = [];

	addToQueue(
		email: string,
		templateId: string,
		templateData: Record<string, any>,
		priority: "high" | "normal" | "low" = "normal",
		scheduledFor?: Date,
	) {
		this.queue.push({
			email,
			templateId,
			templateData,
			priority,
			scheduledFor,
		});

		// Sort by priority (high first) and scheduled time
		this.queue.sort((a, b) => {
			const priorityOrder = { high: 3, normal: 2, low: 1 };
			if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			}

			const aTime = a.scheduledFor?.getTime() || 0;
			const bTime = b.scheduledFor?.getTime() || 0;
			return aTime - bTime;
		});
	}

	async processQueue(batchSize = 10): Promise<void> {
		const now = new Date();
		const readyToSend = this.queue.filter(
			(item) => !item.scheduledFor || item.scheduledFor <= now,
		);

		if (readyToSend.length === 0) {
			return;
		}

		const batch = readyToSend.slice(0, batchSize);
		const emailService = getEmail();

		try {
			const emailData = batch.map((item) => ({
				to: item.email,
				templateId: item.templateId,
				templateData: item.templateData,
			}));

			await emailService.sendBatchEmails(emailData);

			// Remove sent emails from queue
			batch.forEach((sentEmail) => {
				const index = this.queue.indexOf(sentEmail);
				if (index > -1) {
					this.queue.splice(index, 1);
				}
			});

			console.log(`✅ Processed ${batch.length} emails from queue`);
		} catch (error) {
			console.error("❌ Failed to process email queue:", error);
			throw error;
		}
	}

	getQueueStatus() {
		const now = new Date();
		const ready = this.queue.filter(
			(item) => !item.scheduledFor || item.scheduledFor <= now,
		);
		const scheduled = this.queue.filter(
			(item) => item.scheduledFor && item.scheduledFor > now,
		);

		return {
			total: this.queue.length,
			ready: ready.length,
			scheduled: scheduled.length,
			breakdown: {
				high: this.queue.filter((item) => item.priority === "high").length,
				normal: this.queue.filter((item) => item.priority === "normal").length,
				low: this.queue.filter((item) => item.priority === "low").length,
			},
		};
	}
}

// Global email queue instance
export const globalEmailQueue = new EmailQueue();

// Scheduled email processing (would be called by a cron job)
export async function processScheduledEmails() {
	try {
		await globalEmailQueue.processQueue(50); // Process up to 50 emails at once
	} catch (error) {
		console.error("Failed to process scheduled emails:", error);
	}
}

// Email health check
export async function emailHealthCheck(): Promise<{
	status: "healthy" | "degraded" | "unhealthy";
	details: {
		serviceInitialized: boolean;
		queueSize: number;
		lastProcessed?: Date;
		errors?: string[];
	};
}> {
	const details: any = {
		serviceInitialized: false,
		queueSize: globalEmailQueue.getQueueStatus().total,
		errors: [],
	};

	try {
		// Test email service initialization
		const emailService = getEmail();
		details.serviceInitialized = true;

		// Test email validation
		const testValidation = emailService.isValidEmail("test@example.com");
		if (!testValidation) {
			details.errors.push("Email validation not working");
		}

		// Check queue health
		const queueStatus = globalEmailQueue.getQueueStatus();
		if (queueStatus.total > 1000) {
			details.errors.push(
				"Email queue is very large, may indicate processing issues",
			);
		}

		const status =
			details.errors.length === 0
				? "healthy"
				: details.errors.length < 3
					? "degraded"
					: "unhealthy";

		return { status, details };
	} catch (error) {
		details.errors.push(
			`Email service error: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return {
			status: "unhealthy",
			details,
		};
	}
}

export default {
	initialize: initializeEmailService,
	getService: getEmail,
	sendWelcomeEmail,
	sendPasswordResetEmail,
	sendEmailVerification,
	sendLeadNotification,
	sendAmazonInsightsDigest,
	sendCampaignAlert,
	sendBulkEmails,
	isValidEmail,
	getAvailableTemplates,
	getEmailMetrics,
	EmailQueue,
	globalEmailQueue,
	processScheduledEmails,
	emailHealthCheck,
};
