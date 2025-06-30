/**
 * Email Testing Utilities
 * Tools for testing email functionality in development and staging
 */

import {
	getEmail,
	sendAmazonInsightsDigest,
	sendCampaignAlert,
	sendEmailVerification,
	sendLeadNotification,
	sendPasswordResetEmail,
	sendWelcomeEmail,
} from "../lib/email";

export interface EmailTestResult {
	template: string;
	success: boolean;
	emailId?: string;
	error?: string;
	timestamp: string;
}

export class EmailTester {
	private testEmail: string;

	constructor(testEmail = "test@example.com") {
		this.testEmail = testEmail;
	}

	async testAllTemplates(): Promise<EmailTestResult[]> {
		const results: EmailTestResult[] = [];

		console.log("🧪 Starting email template tests...");

		// Test welcome email
		try {
			console.log("Testing welcome email...");
			const result = await sendWelcomeEmail(this.testEmail, {
				firstName: "John",
				organizationName: "Test Company",
				loginUrl: "https://app.ignitabull.com/login",
			});

			results.push({
				template: "welcome",
				success: result.success,
				emailId: result.id,
				error: result.error,
				timestamp: new Date().toISOString(),
			});

			if (result.success) {
				console.log("✅ Welcome email test passed");
			} else {
				console.log("❌ Welcome email test failed:", result.error);
			}
		} catch (error) {
			results.push({
				template: "welcome",
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			});
			console.log("❌ Welcome email test failed:", error);
		}

		// Test password reset email
		try {
			console.log("Testing password reset email...");
			const result = await sendPasswordResetEmail(this.testEmail, {
				firstName: "John",
				resetUrl: "https://app.ignitabull.com/reset-password?token=test123",
				expirationTime: "1 hour",
			});

			results.push({
				template: "password-reset",
				success: result.success,
				emailId: result.id,
				error: result.error,
				timestamp: new Date().toISOString(),
			});

			if (result.success) {
				console.log("✅ Password reset email test passed");
			} else {
				console.log("❌ Password reset email test failed:", result.error);
			}
		} catch (error) {
			results.push({
				template: "password-reset",
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			});
			console.log("❌ Password reset email test failed:", error);
		}

		// Test email verification
		try {
			console.log("Testing email verification...");
			const result = await sendEmailVerification(this.testEmail, {
				firstName: "John",
				verificationUrl:
					"https://app.ignitabull.com/verify-email?token=test123",
			});

			results.push({
				template: "email-verification",
				success: result.success,
				emailId: result.id,
				error: result.error,
				timestamp: new Date().toISOString(),
			});

			if (result.success) {
				console.log("✅ Email verification test passed");
			} else {
				console.log("❌ Email verification test failed:", result.error);
			}
		} catch (error) {
			results.push({
				template: "email-verification",
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			});
			console.log("❌ Email verification test failed:", error);
		}

		// Test lead notification
		try {
			console.log("Testing lead notification...");
			const result = await sendLeadNotification(this.testEmail, {
				leadName: "Jane Smith",
				leadEmail: "jane@testcompany.com",
				leadCompany: "Test Company Inc.",
				leadMessage: "I am interested in your Amazon optimization services.",
				leadSource: "Website Contact Form",
				dashboardUrl: "https://app.ignitabull.com/dashboard",
			});

			results.push({
				template: "lead-notification",
				success: result.success,
				emailId: result.id,
				error: result.error,
				timestamp: new Date().toISOString(),
			});

			if (result.success) {
				console.log("✅ Lead notification test passed");
			} else {
				console.log("❌ Lead notification test failed:", result.error);
			}
		} catch (error) {
			results.push({
				template: "lead-notification",
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			});
			console.log("❌ Lead notification test failed:", error);
		}

		// Test Amazon insights digest
		try {
			console.log("Testing Amazon insights digest...");
			const result = await sendAmazonInsightsDigest(this.testEmail, {
				firstName: "John",
				insights: [
					{
						title: "Low CTR on High-Traffic Keywords",
						description:
							"Your product has 15,000 impressions but only 2.1% CTR",
						priority: "HIGH",
						impact: "+150% clicks potential",
					},
					{
						title: "Competitor Price War Detected",
						description: "2 major competitors reduced prices by 15-20%",
						priority: "CRITICAL",
						impact: "-30% sales risk",
					},
					{
						title: "Listing Quality Below Optimal",
						description:
							"Your listing scores 68/100 with title optimization needed",
						priority: "MEDIUM",
						impact: "+50% conversion rate potential",
					},
				],
				dashboardUrl: "https://app.ignitabull.com/dashboard/amazon/insights",
				period: "this week",
			});

			results.push({
				template: "amazon-insights",
				success: result.success,
				emailId: result.id,
				error: result.error,
				timestamp: new Date().toISOString(),
			});

			if (result.success) {
				console.log("✅ Amazon insights digest test passed");
			} else {
				console.log("❌ Amazon insights digest test failed:", result.error);
			}
		} catch (error) {
			results.push({
				template: "amazon-insights",
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			});
			console.log("❌ Amazon insights digest test failed:", error);
		}

		// Test campaign alert
		try {
			console.log("Testing campaign alert...");
			const result = await sendCampaignAlert(this.testEmail, {
				firstName: "John",
				campaignName: "Google Ads - Search Campaign",
				alertType: "BUDGET_EXCEEDED",
				description:
					"Your campaign has exceeded its daily budget of $100 and has been paused.",
				recommendedAction:
					"Review campaign performance and consider increasing the daily budget if ROI is positive.",
				dashboardUrl: "https://app.ignitabull.com/dashboard/amazon/attribution",
			});

			results.push({
				template: "campaign-alert",
				success: result.success,
				emailId: result.id,
				error: result.error,
				timestamp: new Date().toISOString(),
			});

			if (result.success) {
				console.log("✅ Campaign alert test passed");
			} else {
				console.log("❌ Campaign alert test failed:", result.error);
			}
		} catch (error) {
			results.push({
				template: "campaign-alert",
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			});
			console.log("❌ Campaign alert test failed:", error);
		}

		// Summary
		const successful = results.filter((r) => r.success).length;
		const total = results.length;

		console.log("\n📊 Email Test Summary:");
		console.log(`✅ Successful: ${successful}/${total}`);
		console.log(`❌ Failed: ${total - successful}/${total}`);

		if (successful === total) {
			console.log("🎉 All email tests passed!");
		} else {
			console.log(
				"⚠️  Some email tests failed. Check the logs above for details.",
			);
		}

		return results;
	}

	async testEmailValidation(): Promise<boolean> {
		console.log("🧪 Testing email validation...");

		const emailService = getEmail();

		const validEmails = [
			"test@example.com",
			"user.name@domain.co.uk",
			"user+tag@example.org",
		];

		const invalidEmails = [
			"invalid-email",
			"@domain.com",
			"user@",
			"user name@domain.com",
		];

		let allValid = true;

		// Test valid emails
		for (const email of validEmails) {
			const isValid = emailService.isValidEmail(email);
			if (!isValid) {
				console.log(`❌ Valid email "${email}" was marked as invalid`);
				allValid = false;
			} else {
				console.log(`✅ Valid email "${email}" passed validation`);
			}
		}

		// Test invalid emails
		for (const email of invalidEmails) {
			const isValid = emailService.isValidEmail(email);
			if (isValid) {
				console.log(`❌ Invalid email "${email}" was marked as valid`);
				allValid = false;
			} else {
				console.log(`✅ Invalid email "${email}" failed validation (correct)`);
			}
		}

		if (allValid) {
			console.log("🎉 All email validation tests passed!");
		} else {
			console.log("⚠️  Some email validation tests failed.");
		}

		return allValid;
	}

	async testEmailService(): Promise<{
		serviceHealth: boolean;
		validationTest: boolean;
		templateTests: EmailTestResult[];
	}> {
		console.log("🧪 Running comprehensive email service test...\n");

		// Test service health
		let serviceHealth = false;
		try {
			const _emailService = getEmail();
			serviceHealth = true;
			console.log("✅ Email service initialized successfully");
		} catch (error) {
			console.log("❌ Email service initialization failed:", error);
		}

		// Test email validation
		const validationTest = await this.testEmailValidation();

		console.log(); // Add spacing

		// Test all templates
		const templateTests = await this.testAllTemplates();

		return {
			serviceHealth,
			validationTest,
			templateTests,
		};
	}
}

// CLI test runner
export async function runEmailTests(testEmail?: string) {
	const tester = new EmailTester(testEmail);
	return await tester.testEmailService();
}

// Quick test function for specific template
export async function testTemplate(
	templateName: string,
	testEmail = "test@example.com",
): Promise<EmailTestResult> {
	console.log(`🧪 Testing ${templateName} template...`);

	try {
		let result;

		switch (templateName) {
			case "welcome":
				result = await sendWelcomeEmail(testEmail, {
					firstName: "Test User",
					organizationName: "Test Org",
					loginUrl: "https://app.ignitabull.com/login",
				});
				break;

			case "password-reset":
				result = await sendPasswordResetEmail(testEmail, {
					firstName: "Test User",
					resetUrl: "https://app.ignitabull.com/reset?token=test",
					expirationTime: "1 hour",
				});
				break;

			case "email-verification":
				result = await sendEmailVerification(testEmail, {
					firstName: "Test User",
					verificationUrl: "https://app.ignitabull.com/verify?token=test",
				});
				break;

			case "lead-notification":
				result = await sendLeadNotification(testEmail, {
					leadName: "Test Lead",
					leadEmail: "lead@test.com",
					leadCompany: "Test Company",
					leadMessage: "Test message",
					leadSource: "Test source",
				});
				break;

			default:
				throw new Error(`Unknown template: ${templateName}`);
		}

		if (result.success) {
			console.log(`✅ ${templateName} test passed - Email ID: ${result.id}`);
		} else {
			console.log(`❌ ${templateName} test failed: ${result.error}`);
		}

		return {
			template: templateName,
			success: result.success,
			emailId: result.id,
			error: result.error,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.log(`❌ ${templateName} test failed:`, error);
		return {
			template: templateName,
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString(),
		};
	}
}

export default EmailTester;
