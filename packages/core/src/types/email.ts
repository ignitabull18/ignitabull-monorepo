/**
 * Email Type Definitions
 * Centralized email-related types for the Ignitabull platform
 */

// Base email template structure
export interface EmailTemplate {
	id: string;
	name: string;
	subject: string;
	html: string;
	text?: string;
	// Additional fields for automated follow-up templates
	variables?: string[];
	metadata?: {
		category?: string;
		tags?: string[];
		version?: string;
	};
}

// Extended template for automated follow-ups with backward compatibility
export interface AutomatedEmailTemplate extends EmailTemplate {
	htmlContent: string; // Alias for html
	textContent: string; // Alias for text
	variables: string[]; // Required for automated templates
}

// Email data structure for sending emails
export interface EmailData {
	to: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	subject: string;
	html?: string;
	text?: string;
	from?: string;
	replyTo?: string;
	templateId?: string;
	templateData?: Record<string, any>;
	tags?: Array<{ name: string; value: string }>;
	headers?: Record<string, string>;
	attachments?: Array<{
		filename: string;
		content: Buffer | string;
		type?: string;
		disposition?: "attachment" | "inline";
		contentId?: string;
	}>;
}

// Email result structure
export interface EmailResult {
	id: string;
	success: boolean;
	error?: string;
	metadata?: {
		provider?: string;
		timestamp?: Date;
		messageId?: string;
	};
}

// Email configuration
export interface EmailConfig {
	apiKey: string;
	fromEmail: string;
	fromName?: string;
	replyToEmail?: string;
	environment?: "development" | "staging" | "production";
	provider?: "resend" | "sendgrid" | "ses";
	maxRetries?: number;
	timeout?: number;
}

// Email batch operations
export interface EmailBatch {
	id: string;
	emails: EmailData[];
	status: "pending" | "processing" | "completed" | "failed";
	results?: EmailResult[];
	createdAt: Date;
	completedAt?: Date;
}

// Email tracking
export interface EmailTracking {
	emailId: string;
	recipient: string;
	status:
		| "sent"
		| "delivered"
		| "opened"
		| "clicked"
		| "bounced"
		| "complained";
	timestamp: Date;
	metadata?: {
		ip?: string;
		userAgent?: string;
		link?: string;
	};
}

// Helper function to convert between template formats
export function normalizeEmailTemplate(
	template: AutomatedEmailTemplate,
): EmailTemplate {
	return {
		id: template.id,
		name: template.name,
		subject: template.subject,
		html: template.htmlContent || template.html,
		text: template.textContent || template.text,
		variables: template.variables,
		metadata: template.metadata,
	};
}

// Helper function to check if a template is an automated template
export function isAutomatedTemplate(
	template: EmailTemplate,
): template is AutomatedEmailTemplate {
	return Array.isArray(template.variables) && template.variables.length > 0;
}
