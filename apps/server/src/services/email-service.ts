/**
 * Email Service using Resend with Circuit Breaker Protection
 * Provides email functionality for the Ignitabull platform
 */

import { Resend } from "resend";
import { CircuitBreakerPresets } from "@ignitabull/core";
import { ProtectedServiceBase } from "@ignitabull/core";
import type {
	EmailConfig,
	EmailData,
	EmailResult,
	EmailTemplate,
} from "@ignitabull/core";

export class EmailService extends ProtectedServiceBase {
	private resend: Resend;
	private config: EmailConfig;
	private templates: Map<string, EmailTemplate> = new Map();

	constructor(config: EmailConfig) {
		super("email-service", {
			...CircuitBreakerPresets.email,
			onFallback: () => ({
				success: false,
				message: "Email service temporarily unavailable",
			}),
		});

		this.config = config;
		this.resend = new Resend(config.apiKey);

		// Initialize default templates
		this.initializeTemplates();
	}

	private initializeTemplates() {
		// Welcome email template
		this.templates.set("welcome", {
			id: "welcome",
			name: "Welcome Email",
			subject: "Welcome to Ignitabull! 🚀",
			html: this.getWelcomeEmailTemplate(),
			text: this.getWelcomeEmailText(),
		});

		// Password reset template
		this.templates.set("password-reset", {
			id: "password-reset",
			name: "Password Reset",
			subject: "Reset your Ignitabull password",
			html: this.getPasswordResetTemplate(),
			text: this.getPasswordResetText(),
		});

		// Email verification template
		this.templates.set("email-verification", {
			id: "email-verification",
			name: "Email Verification",
			subject: "Verify your Ignitabull email address",
			html: this.getEmailVerificationTemplate(),
			text: this.getEmailVerificationText(),
		});

		// Lead notification template
		this.templates.set("lead-notification", {
			id: "lead-notification",
			name: "New Lead Notification",
			subject: "New lead from your website",
			html: this.getLeadNotificationTemplate(),
			text: this.getLeadNotificationText(),
		});

		// Amazon insights digest
		this.templates.set("amazon-insights", {
			id: "amazon-insights",
			name: "Amazon Insights Digest",
			subject: "Your weekly Amazon insights are ready",
			html: this.getAmazonInsightsTemplate(),
			text: this.getAmazonInsightsText(),
		});

		// Campaign alert template
		this.templates.set("campaign-alert", {
			id: "campaign-alert",
			name: "Campaign Alert",
			subject: "Campaign Performance Alert",
			html: this.getCampaignAlertTemplate(),
			text: this.getCampaignAlertText(),
		});
	}

	async sendEmail(emailData: EmailData): Promise<EmailResult> {
		return this.executeProtected(async () => {
			const fromAddress =
				emailData.from ||
				`${this.config.fromName || "Ignitabull"} <${this.config.fromEmail}>`;

			// If using a template, merge template data
			let { html, text, subject } = emailData;

			if (emailData.templateId && this.templates.has(emailData.templateId)) {
				const template = this.templates.get(emailData.templateId)!;
				html = this.interpolateTemplate(
					template.html,
					emailData.templateData || {},
				);
				text =
					text ||
					this.interpolateTemplate(
						template.text || "",
						emailData.templateData || {},
					);
				subject =
					subject ||
					this.interpolateTemplate(
						template.subject,
						emailData.templateData || {},
					);
			}

			const emailOptions = {
				from: fromAddress,
				to: emailData.to,
				cc: emailData.cc,
				bcc: emailData.bcc,
				subject,
				html,
				text,
				reply_to: emailData.replyTo || this.config.replyToEmail,
				headers: emailData.headers,
				tags: emailData.tags,
				attachments: emailData.attachments,
			};

			const result = await this.resend.emails.send(emailOptions);

			if (result.error) {
				return {
					id: "",
					success: false,
					error: result.error.message,
				};
			}

			return {
				id: result.data?.id || "",
				success: true,
			};
		});
	}

	async sendWelcomeEmail(
		to: string,
		userData: {
			firstName?: string;
			organizationName?: string;
			loginUrl?: string;
		},
	): Promise<EmailResult> {
		return this.sendEmail({
			to,
			templateId: "welcome",
			templateData: {
				firstName: userData.firstName || "there",
				organizationName: userData.organizationName || "your organization",
				loginUrl: userData.loginUrl || "https://app.ignitabull.com/login",
				currentYear: new Date().getFullYear(),
			},
		});
	}

	async sendPasswordReset(
		to: string,
		resetData: {
			firstName?: string;
			resetUrl: string;
			expirationTime?: string;
		},
	): Promise<EmailResult> {
		return this.sendEmail({
			to,
			templateId: "password-reset",
			templateData: {
				firstName: resetData.firstName || "there",
				resetUrl: resetData.resetUrl,
				expirationTime: resetData.expirationTime || "1 hour",
				supportEmail: this.config.fromEmail,
			},
		});
	}

	async sendEmailVerification(
		to: string,
		verificationData: {
			firstName?: string;
			verificationUrl: string;
		},
	): Promise<EmailResult> {
		return this.sendEmail({
			to,
			templateId: "email-verification",
			templateData: {
				firstName: verificationData.firstName || "there",
				verificationUrl: verificationData.verificationUrl,
			},
		});
	}

	async sendLeadNotification(
		to: string,
		leadData: {
			leadName: string;
			leadEmail: string;
			leadCompany?: string;
			leadMessage?: string;
			leadSource?: string;
			dashboardUrl?: string;
		},
	): Promise<EmailResult> {
		return this.sendEmail({
			to,
			templateId: "lead-notification",
			templateData: {
				leadName: leadData.leadName,
				leadEmail: leadData.leadEmail,
				leadCompany: leadData.leadCompany || "Not provided",
				leadMessage: leadData.leadMessage || "No message provided",
				leadSource: leadData.leadSource || "Website contact form",
				dashboardUrl:
					leadData.dashboardUrl || "https://app.ignitabull.com/dashboard",
				timestamp: new Date().toLocaleString(),
			},
		});
	}

	async sendAmazonInsightsDigest(
		to: string,
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
	): Promise<EmailResult> {
		return this.sendEmail({
			to,
			templateId: "amazon-insights",
			templateData: {
				firstName: insightsData.firstName || "there",
				insights: insightsData.insights,
				insightsCount: insightsData.insights.length,
				highPriorityCount: insightsData.insights.filter(
					(i) => i.priority === "HIGH" || i.priority === "CRITICAL",
				).length,
				dashboardUrl:
					insightsData.dashboardUrl ||
					"https://app.ignitabull.com/dashboard/amazon/insights",
				period: insightsData.period || "this week",
			},
		});
	}

	async sendCampaignAlert(
		to: string,
		alertData: {
			firstName?: string;
			campaignName: string;
			alertType: "BUDGET_EXCEEDED" | "PERFORMANCE_DROP" | "ANOMALY_DETECTED";
			description: string;
			recommendedAction?: string;
			dashboardUrl?: string;
		},
	): Promise<EmailResult> {
		const alertTypeMap = {
			BUDGET_EXCEEDED: "Budget Exceeded",
			PERFORMANCE_DROP: "Performance Drop",
			ANOMALY_DETECTED: "Anomaly Detected",
		};

		return this.sendEmail({
			to,
			templateId: "campaign-alert",
			templateData: {
				firstName: alertData.firstName || "there",
				campaignName: alertData.campaignName,
				alertType: alertTypeMap[alertData.alertType],
				description: alertData.description,
				recommendedAction:
					alertData.recommendedAction ||
					"Please review your campaign settings.",
				dashboardUrl:
					alertData.dashboardUrl || "https://app.ignitabull.com/dashboard",
				timestamp: new Date().toLocaleString(),
			},
		});
	}

	// Batch email sending
	async sendBatchEmails(emails: EmailData[]): Promise<EmailResult[]> {
		const results = await Promise.allSettled(
			emails.map((email) => this.sendEmail(email)),
		);

		return results.map((result, index) => {
			if (result.status === "fulfilled") {
				return result.value;
			}
			return {
				id: "",
				success: false,
				error: `Batch email ${index + 1} failed: ${result.reason}`,
			};
		});
	}

	// Email validation
	isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Template interpolation
	private interpolateTemplate(
		template: string,
		data: Record<string, any>,
	): string {
		return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
			return data[key] !== undefined ? String(data[key]) : match;
		});
	}

	// Template definitions
	private getWelcomeEmailTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Ignitabull</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Welcome to Ignitabull!</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}! 👋</h2>
      <p>Welcome to Ignitabull! We're excited to help {{organizationName}} supercharge your Amazon business with AI-powered insights and automation.</p>
      
      <h3>What you can do now:</h3>
      <ul>
        <li>🔗 Connect your Amazon accounts</li>
        <li>📊 View real-time performance dashboards</li>
        <li>🤖 Get AI-powered optimization recommendations</li>
        <li>📈 Track keyword rankings and competitor activity</li>
        <li>🎯 Optimize your attribution campaigns</li>
      </ul>
      
      <p>Ready to get started?</p>
      <a href="{{loginUrl}}" class="button">Access Your Dashboard</a>
      
      <p>If you have any questions, feel free to reach out to our team. We're here to help you succeed!</p>
      
      <p>Best regards,<br>The Ignitabull Team</p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} Ignitabull. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getWelcomeEmailText(): string {
		return `Welcome to Ignitabull!

Hi {{firstName}}!

Welcome to Ignitabull! We're excited to help {{organizationName}} supercharge your Amazon business with AI-powered insights and automation.

What you can do now:
- Connect your Amazon accounts
- View real-time performance dashboards  
- Get AI-powered optimization recommendations
- Track keyword rankings and competitor activity
- Optimize your attribution campaigns

Ready to get started? Access your dashboard: {{loginUrl}}

If you have any questions, feel free to reach out to our team. We're here to help you succeed!

Best regards,
The Ignitabull Team

© {{currentYear}} Ignitabull. All rights reserved.`;
	}

	private getPasswordResetTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f39c12; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: #f39c12; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p>We received a request to reset your Ignitabull password. If you didn't make this request, you can safely ignore this email.</p>
      
      <p>To reset your password, click the button below:</p>
      <a href="{{resetUrl}}" class="button">Reset My Password</a>
      
      <div class="warning">
        <strong>⚠️ Security Notice:</strong>
        <p>This link will expire in {{expirationTime}}. For security reasons, you'll need to request a new reset link if this one expires.</p>
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">{{resetUrl}}</p>
      
      <p>If you're having trouble, contact us at {{supportEmail}}</p>
      
      <p>Best regards,<br>The Ignitabull Team</p>
    </div>
    <div class="footer">
      <p>This email was sent because a password reset was requested for your account.</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getPasswordResetText(): string {
		return `Password Reset Request

Hi {{firstName}}!

We received a request to reset your Ignitabull password. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link: {{resetUrl}}

Security Notice: This link will expire in {{expirationTime}}. For security reasons, you'll need to request a new reset link if this one expires.

If you're having trouble, contact us at {{supportEmail}}

Best regards,
The Ignitabull Team

This email was sent because a password reset was requested for your account.`;
	}

	private getEmailVerificationTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #27ae60; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Verify Your Email</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p>Thank you for signing up for Ignitabull! To complete your account setup, please verify your email address.</p>
      
      <p>Click the button below to verify your email:</p>
      <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">{{verificationUrl}}</p>
      
      <p>Once verified, you'll have full access to all Ignitabull features!</p>
      
      <p>Best regards,<br>The Ignitabull Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to verify your Ignitabull account.</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getEmailVerificationText(): string {
		return `Verify Your Email Address

Hi {{firstName}}!

Thank you for signing up for Ignitabull! To complete your account setup, please verify your email address.

Verify your email: {{verificationUrl}}

Once verified, you'll have full access to all Ignitabull features!

Best regards,
The Ignitabull Team

This email was sent to verify your Ignitabull account.`;
	}

	private getLeadNotificationTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Notification</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .lead-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Lead Alert!</h1>
    </div>
    <div class="content">
      <h2>You have a new lead!</h2>
      <p>Someone just contacted you through {{leadSource}}. Here are the details:</p>
      
      <div class="lead-info">
        <h3>Lead Information</h3>
        <p><strong>Name:</strong> {{leadName}}</p>
        <p><strong>Email:</strong> {{leadEmail}}</p>
        <p><strong>Company:</strong> {{leadCompany}}</p>
        <p><strong>Message:</strong></p>
        <p style="background: white; padding: 15px; border-radius: 4px;">{{leadMessage}}</p>
        <p><strong>Received:</strong> {{timestamp}}</p>
      </div>
      
      <p>Don't let this lead go cold! Reach out to them as soon as possible.</p>
      <a href="{{dashboardUrl}}" class="button">View in CRM Dashboard</a>
      
      <p>Best regards,<br>Your Ignitabull Team</p>
    </div>
    <div class="footer">
      <p>This is an automated notification from your Ignitabull CRM system.</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getLeadNotificationText(): string {
		return `New Lead Alert!

You have a new lead!

Someone just contacted you through {{leadSource}}. Here are the details:

Lead Information:
- Name: {{leadName}}
- Email: {{leadEmail}}
- Company: {{leadCompany}}
- Message: {{leadMessage}}
- Received: {{timestamp}}

Don't let this lead go cold! Reach out to them as soon as possible.

View in CRM Dashboard: {{dashboardUrl}}

Best regards,
Your Ignitabull Team

This is an automated notification from your Ignitabull CRM system.`;
	}

	private getAmazonInsightsTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Amazon Insights Digest</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff9500; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .insight { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #ff9500; border-radius: 0 6px 6px 0; }
    .priority-high { border-left-color: #e74c3c; }
    .priority-critical { border-left-color: #8e44ad; }
    .button { display: inline-block; background: #ff9500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Amazon Insights Digest</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p>Here's your Amazon performance summary for {{period}}:</p>
      
      <div class="stats">
        <div class="stat">
          <h3>{{insightsCount}}</h3>
          <p>Total Insights</p>
        </div>
        <div class="stat">
          <h3>{{highPriorityCount}}</h3>
          <p>High Priority</p>
        </div>
      </div>
      
      <h3>Key Insights</h3>
      {{#each insights}}
      <div class="insight {{#if (eq priority 'HIGH')}}priority-high{{/if}}{{#if (eq priority 'CRITICAL')}}priority-critical{{/if}}">
        <h4>{{title}}</h4>
        <p>{{description}}</p>
        <p><strong>Impact:</strong> {{impact}}</p>
      </div>
      {{/each}}
      
      <p>Want to see more details and take action on these insights?</p>
      <a href="{{dashboardUrl}}" class="button">View Full Dashboard</a>
      
      <p>Best regards,<br>Your Ignitabull AI Assistant</p>
    </div>
    <div class="footer">
      <p>This digest is automatically generated based on your Amazon data.</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getAmazonInsightsText(): string {
		return `Your Amazon Insights Digest

Hi {{firstName}}!

Here's your Amazon performance summary for {{period}}:

- Total Insights: {{insightsCount}}
- High Priority: {{highPriorityCount}}

Key Insights:
{{#each insights}}
{{title}}
{{description}}
Impact: {{impact}}

{{/each}}

Want to see more details and take action on these insights?
View Full Dashboard: {{dashboardUrl}}

Best regards,
Your Ignitabull AI Assistant

This digest is automatically generated based on your Amazon data.`;
	}

	private getCampaignAlertTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campaign Alert</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Campaign Alert</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p>We've detected an issue with your campaign that requires attention:</p>
      
      <div class="alert">
        <h3>{{alertType}}: {{campaignName}}</h3>
        <p><strong>Description:</strong> {{description}}</p>
        <p><strong>Recommended Action:</strong> {{recommendedAction}}</p>
        <p><strong>Detected At:</strong> {{timestamp}}</p>
      </div>
      
      <p>We recommend taking action as soon as possible to minimize any impact on your campaign performance.</p>
      <a href="{{dashboardUrl}}" class="button">Review Campaign</a>
      
      <p>Best regards,<br>Your Ignitabull Monitoring System</p>
    </div>
    <div class="footer">
      <p>This is an automated alert from your Ignitabull campaign monitoring.</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getCampaignAlertText(): string {
		return `Campaign Alert

Hi {{firstName}}!

We've detected an issue with your campaign that requires attention:

{{alertType}}: {{campaignName}}

Description: {{description}}
Recommended Action: {{recommendedAction}}
Detected At: {{timestamp}}

We recommend taking action as soon as possible to minimize any impact on your campaign performance.

Review Campaign: {{dashboardUrl}}

Best regards,
Your Ignitabull Monitoring System

This is an automated alert from your Ignitabull campaign monitoring.`;
	}
}

// Default email service instance
let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
	if (!emailService) {
		const config: EmailConfig = {
			apiKey: process.env.RESEND_API_KEY || "",
			fromEmail: process.env.FROM_EMAIL || "noreply@ignitabull.com",
			fromName: process.env.FROM_NAME || "Ignitabull",
			replyToEmail: process.env.REPLY_TO_EMAIL || "support@ignitabull.com",
			environment: (process.env.NODE_ENV as any) || "development",
		};

		if (!config.apiKey) {
			throw new Error("RESEND_API_KEY environment variable is required");
		}

		emailService = new EmailService(config);
	}

	return emailService;
}

export default EmailService;
