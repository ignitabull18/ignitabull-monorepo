/**
 * Email Sending API Routes (Refactored)
 * Example of using the centralized error middleware
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
import {
	asyncHandler,
	successResponse,
	ValidationError,
} from "../../middleware/error-handler";

// Send welcome email
export const sendWelcome = asyncHandler(async (req: Request, res: Response) => {
	const { email, firstName, organizationName, loginUrl } = req.body;

	// Validation
	if (!email || !isValidEmail(email)) {
		throw new ValidationError("Valid email address is required");
	}

	const result = await sendWelcomeEmail(email, {
		firstName,
		organizationName,
		loginUrl,
	});

	if (!result.success) {
		throw new Error(result.error || "Failed to send welcome email");
	}

	successResponse(res, {
		message: "Welcome email sent successfully",
		emailId: result.id,
	});
});

// Send password reset email
export const sendPasswordReset = asyncHandler(
	async (req: Request, res: Response) => {
		const { email, firstName, resetUrl, expirationTime } = req.body;

		// Validation
		if (!email || !isValidEmail(email)) {
			throw new ValidationError("Valid email address is required");
		}

		if (!resetUrl) {
			throw new ValidationError("Reset URL is required");
		}

		const result = await sendPasswordResetEmail(email, {
			firstName,
			resetUrl,
			expirationTime,
		});

		if (!result.success) {
			throw new Error(result.error || "Failed to send password reset email");
		}

		successResponse(res, {
			message: "Password reset email sent successfully",
			emailId: result.id,
		});
	},
);

// Send email verification
export const sendVerification = asyncHandler(
	async (req: Request, res: Response) => {
		const { email, firstName, verificationUrl } = req.body;

		// Validation
		if (!email || !isValidEmail(email)) {
			throw new ValidationError("Valid email address is required");
		}

		if (!verificationUrl) {
			throw new ValidationError("Verification URL is required");
		}

		const result = await sendEmailVerification(email, {
			firstName,
			verificationUrl,
		});

		if (!result.success) {
			throw new Error(result.error || "Failed to send verification email");
		}

		successResponse(res, {
			message: "Verification email sent successfully",
			emailId: result.id,
		});
	},
);

// Send lead notification
export const sendLeadNotify = asyncHandler(
	async (req: Request, res: Response) => {
		const { email, lead } = req.body;

		// Validation
		if (!email || !isValidEmail(email)) {
			throw new ValidationError("Valid email address is required");
		}

		if (!lead) {
			throw new ValidationError("Lead information is required");
		}

		const result = await sendLeadNotification(email, lead);

		if (!result.success) {
			throw new Error(result.error || "Failed to send lead notification");
		}

		successResponse(res, {
			message: "Lead notification sent successfully",
			emailId: result.id,
		});
	},
);

// Send Amazon insights digest
export const sendInsightsDigest = asyncHandler(
	async (req: Request, res: Response) => {
		const { email, insights } = req.body;

		// Validation
		if (!email || !isValidEmail(email)) {
			throw new ValidationError("Valid email address is required");
		}

		if (!insights) {
			throw new ValidationError("Insights data is required");
		}

		const result = await sendAmazonInsightsDigest(email, insights);

		if (!result.success) {
			throw new Error(result.error || "Failed to send insights digest");
		}

		successResponse(res, {
			message: "Insights digest sent successfully",
			emailId: result.id,
		});
	},
);

// Send campaign alert
export const sendAlert = asyncHandler(async (req: Request, res: Response) => {
	const { email, campaign } = req.body;

	// Validation
	if (!email || !isValidEmail(email)) {
		throw new ValidationError("Valid email address is required");
	}

	if (!campaign) {
		throw new ValidationError("Campaign information is required");
	}

	const result = await sendCampaignAlert(email, campaign);

	if (!result.success) {
		throw new Error(result.error || "Failed to send campaign alert");
	}

	successResponse(res, {
		message: "Campaign alert sent successfully",
		emailId: result.id,
	});
});

// Send bulk emails
export const sendBulk = asyncHandler(async (req: Request, res: Response) => {
	const { emails } = req.body;

	// Validation
	if (!emails || !Array.isArray(emails) || emails.length === 0) {
		throw new ValidationError("Email array is required");
	}

	// Validate each email
	const invalidEmails = emails.filter((e) => !e.to || !isValidEmail(e.to));
	if (invalidEmails.length > 0) {
		throw new ValidationError('All emails must have valid "to" addresses', {
			invalidEmails,
		});
	}

	const results = await sendBulkEmails(emails);

	// Check if any failed
	const failures = results.filter((r) => !r.success);
	if (failures.length === results.length) {
		throw new Error("All emails failed to send");
	}

	successResponse(res, {
		message: `Sent ${results.filter((r) => r.success).length} of ${results.length} emails`,
		results,
		summary: {
			total: results.length,
			successful: results.filter((r) => r.success).length,
			failed: failures.length,
		},
	});
});

// Get email queue status
export const getQueueStatus = asyncHandler(
	async (_req: Request, res: Response) => {
		const status = globalEmailQueue.getStatus();

		successResponse(res, status);
	},
);

// Health check
export const healthCheck = asyncHandler(
	async (_req: Request, res: Response) => {
		const health = await emailHealthCheck();

		if (health.status !== "healthy") {
			res.status(503);
		}

		successResponse(res, health);
	},
);
