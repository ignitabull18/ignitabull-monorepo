/**
 * Email Sending API Routes
 * Handles email sending requests for various use cases
 */

import type { Request, Response } from "express";
import {
	emailHealthCheck,
	globalEmailQueue,
	isValidEmail,
	sendAmazonInsightsDigest,
	sendBulkEmails,
	sendCampaignAlert,
	sendEmailVerification,
	sendLeadNotification,
	sendPasswordResetEmail,
	sendWelcomeEmail,
} from "../../lib/email";

// Send welcome email
export async function sendWelcome(req: Request, res: Response) {
	try {
		const { email, firstName, organizationName, loginUrl } = req.body;

		if (!email || !isValidEmail(email)) {
			return res.status(400).json({
				error: "Valid email address is required",
			});
		}

		const result = await sendWelcomeEmail(email, {
			firstName,
			organizationName,
			loginUrl,
		});

		if (result.success) {
			res.json({
				success: true,
				message: "Welcome email sent successfully",
				emailId: result.id,
			});
		} else {
			res.status(500).json({
				error: "Failed to send welcome email",
				details: result.error,
			});
		}
	} catch (error) {
		console.error("Welcome email API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Send password reset email
export async function sendPasswordReset(req: Request, res: Response) {
	try {
		const { email, firstName, resetUrl, expirationTime } = req.body;

		if (!email || !isValidEmail(email)) {
			return res.status(400).json({
				error: "Valid email address is required",
			});
		}

		if (!resetUrl) {
			return res.status(400).json({
				error: "Reset URL is required",
			});
		}

		const result = await sendPasswordResetEmail(email, {
			firstName,
			resetUrl,
			expirationTime,
		});

		if (result.success) {
			res.json({
				success: true,
				message: "Password reset email sent successfully",
				emailId: result.id,
			});
		} else {
			res.status(500).json({
				error: "Failed to send password reset email",
				details: result.error,
			});
		}
	} catch (error) {
		console.error("Password reset email API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Send email verification
export async function sendVerification(req: Request, res: Response) {
	try {
		const { email, firstName, verificationUrl } = req.body;

		if (!email || !isValidEmail(email)) {
			return res.status(400).json({
				error: "Valid email address is required",
			});
		}

		if (!verificationUrl) {
			return res.status(400).json({
				error: "Verification URL is required",
			});
		}

		const result = await sendEmailVerification(email, {
			firstName,
			verificationUrl,
		});

		if (result.success) {
			res.json({
				success: true,
				message: "Verification email sent successfully",
				emailId: result.id,
			});
		} else {
			res.status(500).json({
				error: "Failed to send verification email",
				details: result.error,
			});
		}
	} catch (error) {
		console.error("Verification email API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Send lead notification
export async function sendLeadAlert(req: Request, res: Response) {
	try {
		const {
			notificationEmail,
			leadName,
			leadEmail,
			leadCompany,
			leadMessage,
			leadSource,
			dashboardUrl,
		} = req.body;

		if (!notificationEmail || !isValidEmail(notificationEmail)) {
			return res.status(400).json({
				error: "Valid notification email address is required",
			});
		}

		if (!leadName || !leadEmail) {
			return res.status(400).json({
				error: "Lead name and email are required",
			});
		}

		const result = await sendLeadNotification(notificationEmail, {
			leadName,
			leadEmail,
			leadCompany,
			leadMessage,
			leadSource,
			dashboardUrl,
		});

		if (result.success) {
			res.json({
				success: true,
				message: "Lead notification sent successfully",
				emailId: result.id,
			});
		} else {
			res.status(500).json({
				error: "Failed to send lead notification",
				details: result.error,
			});
		}
	} catch (error) {
		console.error("Lead notification API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Send Amazon insights digest
export async function sendInsightsDigest(req: Request, res: Response) {
	try {
		const { email, firstName, insights, dashboardUrl, period } = req.body;

		if (!email || !isValidEmail(email)) {
			return res.status(400).json({
				error: "Valid email address is required",
			});
		}

		if (!insights || !Array.isArray(insights)) {
			return res.status(400).json({
				error: "Insights array is required",
			});
		}

		const result = await sendAmazonInsightsDigest(email, {
			firstName,
			insights,
			dashboardUrl,
			period,
		});

		if (result.success) {
			res.json({
				success: true,
				message: "Insights digest sent successfully",
				emailId: result.id,
			});
		} else {
			res.status(500).json({
				error: "Failed to send insights digest",
				details: result.error,
			});
		}
	} catch (error) {
		console.error("Insights digest API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Send campaign alert
export async function sendAlert(req: Request, res: Response) {
	try {
		const {
			email,
			firstName,
			campaignName,
			alertType,
			description,
			recommendedAction,
			dashboardUrl,
		} = req.body;

		if (!email || !isValidEmail(email)) {
			return res.status(400).json({
				error: "Valid email address is required",
			});
		}

		if (!campaignName || !alertType || !description) {
			return res.status(400).json({
				error: "Campaign name, alert type, and description are required",
			});
		}

		const validAlertTypes = [
			"BUDGET_EXCEEDED",
			"PERFORMANCE_DROP",
			"ANOMALY_DETECTED",
		];
		if (!validAlertTypes.includes(alertType)) {
			return res.status(400).json({
				error: `Invalid alert type. Must be one of: ${validAlertTypes.join(", ")}`,
			});
		}

		const result = await sendCampaignAlert(email, {
			firstName,
			campaignName,
			alertType,
			description,
			recommendedAction,
			dashboardUrl,
		});

		if (result.success) {
			res.json({
				success: true,
				message: "Campaign alert sent successfully",
				emailId: result.id,
			});
		} else {
			res.status(500).json({
				error: "Failed to send campaign alert",
				details: result.error,
			});
		}
	} catch (error) {
		console.error("Campaign alert API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Send bulk emails
export async function sendBulk(req: Request, res: Response) {
	try {
		const { emails } = req.body;

		if (!emails || !Array.isArray(emails)) {
			return res.status(400).json({
				error: "Emails array is required",
			});
		}

		if (emails.length === 0) {
			return res.status(400).json({
				error: "At least one email is required",
			});
		}

		if (emails.length > 100) {
			return res.status(400).json({
				error: "Maximum 100 emails allowed per batch",
			});
		}

		// Validate all emails
		for (const emailData of emails) {
			if (!emailData.to || !isValidEmail(emailData.to)) {
				return res.status(400).json({
					error: `Invalid email address: ${emailData.to}`,
				});
			}
			if (!emailData.templateId) {
				return res.status(400).json({
					error: "Template ID is required for all emails",
				});
			}
		}

		const results = await sendBulkEmails(emails);

		const successCount = results.filter((r) => r.success).length;
		const failureCount = results.filter((r) => !r.success).length;

		res.json({
			success: true,
			message: "Bulk email sending completed",
			summary: {
				total: emails.length,
				successful: successCount,
				failed: failureCount,
			},
			results: results.map((result, index) => ({
				index,
				email: emails[index].to,
				success: result.success,
				emailId: result.id,
				error: result.error,
			})),
		});
	} catch (error) {
		console.error("Bulk email API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Queue email for later sending
export async function queueEmail(req: Request, res: Response) {
	try {
		const {
			email,
			templateId,
			templateData,
			priority = "normal",
			scheduledFor,
		} = req.body;

		if (!email || !isValidEmail(email)) {
			return res.status(400).json({
				error: "Valid email address is required",
			});
		}

		if (!templateId) {
			return res.status(400).json({
				error: "Template ID is required",
			});
		}

		const validPriorities = ["high", "normal", "low"];
		if (!validPriorities.includes(priority)) {
			return res.status(400).json({
				error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
			});
		}

		const scheduledDate = scheduledFor ? new Date(scheduledFor) : undefined;
		if (scheduledDate && scheduledDate <= new Date()) {
			return res.status(400).json({
				error: "Scheduled time must be in the future",
			});
		}

		globalEmailQueue.addToQueue(
			email,
			templateId,
			templateData || {},
			priority,
			scheduledDate,
		);

		res.json({
			success: true,
			message: "Email queued successfully",
			queueStatus: globalEmailQueue.getQueueStatus(),
		});
	} catch (error) {
		console.error("Queue email API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Get queue status
export async function getQueueStatus(_req: Request, res: Response) {
	try {
		const status = globalEmailQueue.getQueueStatus();

		res.json({
			success: true,
			data: status,
		});
	} catch (error) {
		console.error("Queue status API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Process email queue manually
export async function processQueue(req: Request, res: Response) {
	try {
		const { batchSize = 10 } = req.body;

		if (batchSize < 1 || batchSize > 100) {
			return res.status(400).json({
				error: "Batch size must be between 1 and 100",
			});
		}

		const beforeStatus = globalEmailQueue.getQueueStatus();
		await globalEmailQueue.processQueue(batchSize);
		const afterStatus = globalEmailQueue.getQueueStatus();

		res.json({
			success: true,
			message: "Email queue processed successfully",
			processed: beforeStatus.ready - afterStatus.ready,
			queueStatus: afterStatus,
		});
	} catch (error) {
		console.error("Process queue API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// Email health check
export async function healthCheck(_req: Request, res: Response) {
	try {
		const health = await emailHealthCheck();

		const statusCode =
			health.status === "healthy"
				? 200
				: health.status === "degraded"
					? 206
					: 500;

		res.status(statusCode).json({
			success: health.status !== "unhealthy",
			status: health.status,
			details: health.details,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Email health check API error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
