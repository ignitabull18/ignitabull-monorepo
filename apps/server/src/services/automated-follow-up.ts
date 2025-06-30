/**
 * Automated Follow-up Service
 * Integrates visitor tracking with email automation for lead nurturing
 */

import type {
	FollowUpExecution,
	FollowUpRule,
	VisitorLead,
	VisitorSession,
} from "../../../packages/core/src/types/visitor-tracking";
import { getEmail } from "../lib/email";
import { type EmailService, sendLeadNotification } from "./email-service";
import VisitorTrackingRepository from "./visitor-tracking-repository";

export interface FollowUpContext {
	session: VisitorSession;
	lead?: VisitorLead;
	previousExecutions: FollowUpExecution[];
	metadata?: Record<string, any>;
}

export interface FollowUpTask {
	id: string;
	type: "email" | "call" | "meeting" | "review";
	title: string;
	description: string;
	assignedTo?: string;
	priority: "low" | "medium" | "high" | "urgent";
	dueDate: Date;
	status: "pending" | "in_progress" | "completed" | "cancelled";
	leadId?: string;
	sessionId: string;
	metadata?: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
}

export class AutomatedFollowUpService {
	private repository: VisitorTrackingRepository;
	private emailService: EmailService;
	private templates: Map<string, EmailTemplate> = new Map();
	private isProcessing = false;

	constructor() {
		this.repository = new VisitorTrackingRepository();
		this.emailService = getEmail();
		this.initializeTemplates();
	}

	// Email Template Management
	private initializeTemplates(): void {
		// Lead nurturing email templates
		this.templates.set("lead-welcome", {
			id: "lead-welcome",
			name: "Lead Welcome Email",
			subject: "Thanks for your interest in Ignitabull!",
			htmlContent: this.getLeadWelcomeTemplate(),
			textContent: this.getLeadWelcomeTextTemplate(),
			variables: ["firstName", "lastName", "company", "leadSource"],
		});

		this.templates.set("demo-follow-up", {
			id: "demo-follow-up",
			name: "Demo Request Follow-up",
			subject: "Ready to see Ignitabull in action?",
			htmlContent: this.getDemoFollowUpTemplate(),
			textContent: this.getDemoFollowUpTextTemplate(),
			variables: ["firstName", "company", "calendlyLink"],
		});

		this.templates.set("abandoned-form", {
			id: "abandoned-form",
			name: "Abandoned Form Recovery",
			subject: "Complete your Ignitabull registration",
			htmlContent: this.getAbandonedFormTemplate(),
			textContent: this.getAbandonedFormTextTemplate(),
			variables: ["firstName", "formUrl", "incentive"],
		});

		this.templates.set("high-value-visitor", {
			id: "high-value-visitor",
			name: "High-Value Visitor Engagement",
			subject: "Personalized Amazon optimization insights for {{company}}",
			htmlContent: this.getHighValueVisitorTemplate(),
			textContent: this.getHighValueVisitorTextTemplate(),
			variables: [
				"firstName",
				"company",
				"pageViews",
				"timeOnSite",
				"insights",
			],
		});

		this.templates.set("trial-reminder", {
			id: "trial-reminder",
			name: "Trial Reminder",
			subject: "Your Ignitabull trial expires soon",
			htmlContent: this.getTrialReminderTemplate(),
			textContent: this.getTrialReminderTextTemplate(),
			variables: ["firstName", "trialEndDate", "upgradeUrl"],
		});

		this.templates.set("reactivation", {
			id: "reactivation",
			name: "User Reactivation",
			subject: "New Amazon features await you at Ignitabull",
			htmlContent: this.getReactivationTemplate(),
			textContent: this.getReactivationTextTemplate(),
			variables: ["firstName", "lastLoginDate", "newFeatures"],
		});
	}

	// Lead Processing
	async processNewLead(lead: VisitorLead): Promise<void> {
		try {
			const session = await this.repository.getSession(lead.sessionId);
			if (!session) {
				throw new Error(`Session ${lead.sessionId} not found`);
			}

			// Send immediate lead notification to sales team
			await this.sendLeadNotificationToSales(lead, session);

			// Process automated follow-up rules
			const rules = await this.repository.getFollowUpRules();
			for (const rule of rules) {
				await this.evaluateAndExecuteRule(rule, { session, lead });
			}

			// Score and segment the lead
			await this.scoreAndSegmentLead(lead, session);

			console.log(`✅ Processed new lead: ${lead.id}`);
		} catch (error) {
			console.error(`❌ Failed to process lead ${lead.id}:`, error);
		}
	}

	async processHighIntentVisitor(session: VisitorSession): Promise<void> {
		try {
			// Check if visitor meets high-intent criteria
			const isHighIntent = await this.isHighIntentVisitor(session);
			if (!isHighIntent) return;

			// Create anonymous lead record for tracking
			const anonymousLead = await this.createAnonymousLead(session);

			// Send personalized engagement email if email is captured
			if (anonymousLead.email) {
				await this.sendHighValueVisitorEmail(anonymousLead, session);
			}

			// Create follow-up task for sales team
			await this.createFollowUpTask({
				type: "review",
				title: "High-intent visitor identified",
				description: `Visitor spent ${Math.round((session.duration || 0) / 60000)} minutes and viewed ${session.pageViews} pages`,
				priority: "high",
				sessionId: session.sessionId,
				leadId: anonymousLead.id,
				dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
				assignedTo: "sales-team",
			});

			console.log(`✅ Processed high-intent visitor: ${session.sessionId}`);
		} catch (error) {
			console.error(
				`❌ Failed to process high-intent visitor ${session.sessionId}:`,
				error,
			);
		}
	}

	async processAbandonedForm(sessionId: string, formData: any): Promise<void> {
		try {
			const session = await this.repository.getSession(sessionId);
			if (!session) return;

			// Wait for some time before sending recovery email
			setTimeout(
				async () => {
					// Check if form was completed in the meantime
					const lead = await this.repository.getLead(formData.leadId);
					if (lead && lead.status !== "new") return;

					// Send abandoned form recovery email
					if (formData.email) {
						await this.sendAbandonedFormEmail(formData, session);
					}

					// Create follow-up task
					await this.createFollowUpTask({
						type: "call",
						title: "Follow up on abandoned form",
						description: `User started ${formData.formType} form but didn't complete it`,
						priority: "medium",
						sessionId: sessionId,
						dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
						assignedTo: "sales-team",
					});
				},
				30 * 60 * 1000,
			); // Wait 30 minutes

			console.log(
				`✅ Scheduled abandoned form follow-up for session: ${sessionId}`,
			);
		} catch (error) {
			console.error(
				`❌ Failed to process abandoned form for session ${sessionId}:`,
				error,
			);
		}
	}

	// Rule Processing
	private async evaluateAndExecuteRule(
		rule: FollowUpRule,
		context: FollowUpContext,
	): Promise<void> {
		if (!rule.isActive) return;

		try {
			// Check if rule should be executed
			const shouldExecute = await this.shouldExecuteRule(rule, context);
			if (!shouldExecute) return;

			// Create execution record
			const execution = await this.repository.createFollowUpExecution({
				ruleId: rule.id,
				sessionId: context.session.sessionId,
				leadId: context.lead?.id,
				userId: context.session.userId,
				status: "pending",
			});

			try {
				// Execute rule actions
				for (const action of rule.actions) {
					await this.executeRuleAction(action, context);
				}

				// Mark execution as successful
				await this.repository.updateFollowUpExecution(execution.id, {
					status: "executed",
					executedAt: new Date(),
				});

				// Update rule execution count
				await this.repository.updateFollowUpRule(rule.id, {
					executionCount: rule.executionCount + 1,
					lastExecutedAt: new Date(),
				});

				console.log(`✅ Executed follow-up rule: ${rule.name}`);
			} catch (error) {
				// Mark execution as failed
				await this.repository.updateFollowUpExecution(execution.id, {
					status: "failed",
					error: error instanceof Error ? error.message : "Unknown error",
				});
				throw error;
			}
		} catch (error) {
			console.error(`❌ Failed to execute rule ${rule.name}:`, error);
		}
	}

	private async shouldExecuteRule(
		rule: FollowUpRule,
		context: FollowUpContext,
	): Promise<boolean> {
		// Check execution limits
		if (rule.maxExecutions && rule.executionCount >= rule.maxExecutions) {
			return false;
		}

		// Check if already executed for this session/lead
		const existingExecutions = await this.repository.getFollowUpExecutions(
			rule.id,
		);
		const alreadyExecuted = existingExecutions.some(
			(exec) =>
				exec.sessionId === context.session.sessionId ||
				(context.lead && exec.leadId === context.lead.id),
		);
		if (alreadyExecuted) return false;

		// Evaluate triggers
		for (const trigger of rule.triggers) {
			const triggerMet = await this.evaluateTrigger(trigger, context);
			if (triggerMet) {
				// Evaluate conditions
				for (const condition of rule.conditions) {
					const conditionMet = await this.evaluateCondition(condition, context);
					if (!conditionMet) return false;
				}
				return true;
			}
		}

		return false;
	}

	private async evaluateTrigger(
		trigger: any,
		context: FollowUpContext,
	): Promise<boolean> {
		const { session, lead } = context;

		switch (trigger.type) {
			case "form_submission":
				return !!lead && lead.formType === trigger.value;

			case "page_visit": {
				const pageViews = await this.repository.getSessionPageViews(
					session.sessionId,
				);
				return pageViews.some((pv) =>
					this.matchesPattern(pv.path, trigger.value),
				);
			}

			case "time_on_site": {
				const timeOnSite = (session.duration || 0) / 1000 / 60; // minutes
				return this.compareValues(timeOnSite, trigger.value, trigger.operator);
			}

			case "lead_score":
				return (
					!!lead &&
					this.compareValues(lead.leadScore, trigger.value, trigger.operator)
				);

			case "inactivity": {
				const inactiveTime =
					(Date.now() - session.lastActiveAt.getTime()) / 1000 / 60; // minutes
				return this.compareValues(
					inactiveTime,
					trigger.value,
					trigger.operator,
				);
			}

			case "return_visit":
				return session.isReturning;

			default:
				return false;
		}
	}

	private async evaluateCondition(
		condition: any,
		context: FollowUpContext,
	): Promise<boolean> {
		const value = this.getFieldValue(condition.field, context);
		return this.compareValues(value, condition.value, condition.operator);
	}

	private async executeRuleAction(
		action: any,
		context: FollowUpContext,
	): Promise<void> {
		const { session, lead } = context;

		switch (action.type) {
			case "send_email":
				if (lead?.email && action.templateId) {
					await this.sendTemplateEmail(
						action.templateId,
						lead,
						session,
						action.metadata,
					);
				}
				break;

			case "create_task":
				await this.createFollowUpTask({
					type: action.taskType || "review",
					title: action.taskTitle || "Follow-up required",
					description: action.taskDescription || "Automated follow-up task",
					priority: action.priority || "medium",
					sessionId: session.sessionId,
					leadId: lead?.id,
					assignedTo: action.assignTo,
					dueDate: new Date(Date.now() + (action.delay || 24) * 60 * 60 * 1000),
				});
				break;

			case "add_tag":
				if (lead && action.tag) {
					await this.repository.addTagToLead(lead.id, action.tag);
				}
				break;

			case "update_score":
				if (lead && action.scoreAdjustment) {
					const newScore = Math.min(
						Math.max(lead.leadScore + action.scoreAdjustment, 0),
						100,
					);
					await this.repository.updateLeadScore(lead.id, newScore);
				}
				break;

			case "webhook":
				if (action.webhookUrl) {
					await this.callWebhook(action.webhookUrl, { session, lead, action });
				}
				break;
		}
	}

	// Email Sending Methods
	private async sendTemplateEmail(
		templateId: string,
		lead: VisitorLead,
		session: VisitorSession,
		metadata?: Record<string, any>,
	): Promise<void> {
		const template = this.templates.get(templateId);
		if (!template) {
			throw new Error(`Email template ${templateId} not found`);
		}

		const variables = {
			firstName: lead.firstName || "there",
			lastName: lead.lastName || "",
			company: lead.company || "your company",
			leadSource: lead.source || "website",
			pageViews: session.pageViews,
			timeOnSite: Math.round((session.duration || 0) / 60000),
			leadScore: lead.leadScore,
			...metadata,
		};

		const subject = this.interpolateTemplate(template.subject, variables);
		const htmlContent = this.interpolateTemplate(
			template.htmlContent,
			variables,
		);
		const textContent = this.interpolateTemplate(
			template.textContent,
			variables,
		);

		await this.emailService.sendEmail({
			to: lead.email!,
			subject,
			html: htmlContent,
			text: textContent,
			tags: [
				{ name: "campaign", value: "follow-up" },
				{ name: "template", value: templateId },
			],
		});
	}

	private async sendLeadNotificationToSales(
		lead: VisitorLead,
		session: VisitorSession,
	): Promise<void> {
		const salesEmail =
			process.env.SALES_NOTIFICATION_EMAIL || "sales@ignitabull.com";

		await sendLeadNotification(salesEmail, {
			leadName: `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
			leadEmail: lead.email || "No email provided",
			leadCompany: lead.company,
			leadMessage: `Lead Score: ${lead.leadScore}\nTime on Site: ${Math.round((session.duration || 0) / 60000)} minutes\nPage Views: ${session.pageViews}\nSource: ${lead.source}`,
			leadSource: lead.source,
			dashboardUrl: `${process.env.APP_URL}/dashboard/leads/${lead.id}`,
		});
	}

	private async sendHighValueVisitorEmail(
		lead: VisitorLead,
		session: VisitorSession,
	): Promise<void> {
		await this.sendTemplateEmail("high-value-visitor", lead, session, {
			insights: [
				"Your competition analysis shows 3 key optimization opportunities",
				"Average 23% increase in conversion rate for similar products",
				"Personalized Amazon PPC strategy recommendations available",
			],
		});
	}

	private async sendAbandonedFormEmail(
		formData: any,
		session: VisitorSession,
	): Promise<void> {
		const lead: VisitorLead = {
			id: "temp",
			sessionId: session.sessionId,
			email: formData.email,
			firstName: formData.firstName,
			company: formData.company,
			leadScore: 60,
			source: "abandoned_form",
			formUrl: formData.formUrl,
			formType: formData.formType,
			status: "new",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await this.sendTemplateEmail("abandoned-form", lead, session, {
			incentive: "15% off your first month",
			formUrl: formData.formUrl,
		});
	}

	// Utility Methods
	private async isHighIntentVisitor(session: VisitorSession): Promise<boolean> {
		const timeThreshold = 5 * 60 * 1000; // 5 minutes
		const pageViewThreshold = 5;

		return (
			(session.duration || 0) >= timeThreshold &&
			session.pageViews >= pageViewThreshold &&
			!session.isBot
		);
	}

	private async createAnonymousLead(
		session: VisitorSession,
	): Promise<VisitorLead> {
		return await this.repository.createLead({
			sessionId: session.sessionId,
			userId: session.userId,
			leadScore: 40, // Base score for high-intent behavior
			source: "high_intent_behavior",
			formUrl: "N/A",
			formType: "contact",
			status: "new",
		});
	}

	private async scoreAndSegmentLead(
		lead: VisitorLead,
		session: VisitorSession,
	): Promise<void> {
		// Additional scoring logic based on behavior
		let additionalScore = 0;

		if (session.pageViews > 10) additionalScore += 10;
		if (session.duration && session.duration > 10 * 60 * 1000)
			additionalScore += 15;
		if (session.utmSource === "google" && session.utmMedium === "cpc")
			additionalScore += 10;
		if (lead.company) additionalScore += 10;

		const newScore = Math.min(lead.leadScore + additionalScore, 100);
		await this.repository.updateLeadScore(lead.id, newScore);

		// Add segments based on score
		const tags = [];
		if (newScore >= 80) tags.push("hot_lead");
		else if (newScore >= 60) tags.push("warm_lead");
		else tags.push("cold_lead");

		if (session.isReturning) tags.push("returning_visitor");
		if (lead.company) tags.push("business_lead");

		for (const tag of tags) {
			await this.repository.addTagToLead(lead.id, tag);
		}
	}

	private async createFollowUpTask(
		task: Omit<FollowUpTask, "id" | "status" | "createdAt" | "updatedAt">,
	): Promise<FollowUpTask> {
		const newTask: FollowUpTask = {
			...task,
			id: this.generateId(),
			status: "pending",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// This would typically save to a tasks table
		console.log("📋 Created follow-up task:", newTask.title);
		return newTask;
	}

	private async callWebhook(url: string, data: any): Promise<void> {
		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"User-Agent": "Ignitabull-FollowUp/1.0",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`Webhook failed with status: ${response.status}`);
			}
		} catch (error) {
			console.error("Failed to call webhook:", error);
			throw error;
		}
	}

	private matchesPattern(value: string, pattern: string): boolean {
		return value.includes(pattern) || new RegExp(pattern).test(value);
	}

	private compareValues(
		actual: any,
		expected: any,
		operator = "equals",
	): boolean {
		switch (operator) {
			case "equals":
				return actual === expected;
			case "not_equals":
				return actual !== expected;
			case "greater_than":
				return actual > expected;
			case "less_than":
				return actual < expected;
			case "greater_equal":
				return actual >= expected;
			case "less_equal":
				return actual <= expected;
			default:
				return false;
		}
	}

	private getFieldValue(field: string, context: FollowUpContext): any {
		const [entity, property] = field.split(".");

		switch (entity) {
			case "session":
				return (context.session as any)[property];
			case "lead":
				return context.lead ? (context.lead as any)[property] : null;
			default:
				return null;
		}
	}

	private interpolateTemplate(
		template: string,
		variables: Record<string, any>,
	): string {
		return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
			return variables[key] !== undefined ? String(variables[key]) : match;
		});
	}

	private generateId(): string {
		return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Email Template Implementations
	private getLeadWelcomeTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Ignitabull</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: white; }
    .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Ignitabull!</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p>Thank you for your interest in Ignitabull! We're excited to help {{company}} optimize your Amazon business with AI-powered insights.</p>
      
      <p>Here's what happens next:</p>
      <ul>
        <li>Our team will review your specific needs</li>
        <li>We'll prepare personalized optimization recommendations</li>
        <li>You'll receive a custom demo tailored to your products</li>
      </ul>
      
      <p>Questions? Reply to this email or schedule a call with our team.</p>
      
      <a href="https://calendly.com/ignitabull/demo" class="button">Schedule Demo</a>
      
      <p>Best regards,<br>The Ignitabull Team</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getLeadWelcomeTextTemplate(): string {
		return `Welcome to Ignitabull!

Hi {{firstName}}!

Thank you for your interest in Ignitabull! We're excited to help {{company}} optimize your Amazon business with AI-powered insights.

Here's what happens next:
- Our team will review your specific needs
- We'll prepare personalized optimization recommendations  
- You'll receive a custom demo tailored to your products

Questions? Reply to this email or schedule a call: https://calendly.com/ignitabull/demo

Best regards,
The Ignitabull Team`;
	}

	private getDemoFollowUpTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ready for your Ignitabull demo?</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #27ae60; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: white; }
    .button { background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
    .highlight { background: #f8f9fa; padding: 20px; border-left: 4px solid #27ae60; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>See Ignitabull in Action</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p>Ready to see how Ignitabull can transform {{company}}'s Amazon performance?</p>
      
      <div class="highlight">
        <h3>What you'll see in the demo:</h3>
        <ul>
          <li>Real-time Amazon performance analytics</li>
          <li>AI-powered optimization recommendations</li>
          <li>Competitor intelligence and market insights</li>
          <li>Automated campaign management</li>
        </ul>
      </div>
      
      <p>The demo takes just 20 minutes and we'll show you exactly how other Amazon sellers have increased their revenue by 30-50%.</p>
      
      <a href="{{calendlyLink}}" class="button">Schedule Your Demo</a>
      
      <p>Best regards,<br>The Ignitabull Team</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getDemoFollowUpTextTemplate(): string {
		return `See Ignitabull in Action

Hi {{firstName}}!

Ready to see how Ignitabull can transform {{company}}'s Amazon performance?

What you'll see in the demo:
- Real-time Amazon performance analytics
- AI-powered optimization recommendations
- Competitor intelligence and market insights
- Automated campaign management

The demo takes just 20 minutes and we'll show you exactly how other Amazon sellers have increased their revenue by 30-50%.

Schedule Your Demo: {{calendlyLink}}

Best regards,
The Ignitabull Team`;
	}

	private getAbandonedFormTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Complete your Ignitabull registration</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f39c12; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: white; }
    .button { background: #f39c12; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
    .incentive { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Don't Miss Out!</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p>We noticed you started signing up for Ignitabull but didn't complete the process. We'd love to help you get started!</p>
      
      <div class="incentive">
        <h3>🎁 Special Offer</h3>
        <p>Complete your registration in the next 24 hours and get <strong>{{incentive}}</strong>!</p>
      </div>
      
      <p>It only takes 2 minutes to finish, and you'll get immediate access to:</p>
      <ul>
        <li>Free Amazon account analysis</li>
        <li>Personalized optimization recommendations</li>
        <li>7-day free trial of all premium features</li>
      </ul>
      
      <a href="{{formUrl}}" class="button">Complete Registration</a>
      
      <p>Questions? Just reply to this email!</p>
      
      <p>Best regards,<br>The Ignitabull Team</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getAbandonedFormTextTemplate(): string {
		return `Don't Miss Out!

Hi {{firstName}}!

We noticed you started signing up for Ignitabull but didn't complete the process. We'd love to help you get started!

🎁 Special Offer: Complete your registration in the next 24 hours and get {{incentive}}!

It only takes 2 minutes to finish, and you'll get immediate access to:
- Free Amazon account analysis
- Personalized optimization recommendations
- 7-day free trial of all premium features

Complete Registration: {{formUrl}}

Questions? Just reply to this email!

Best regards,
The Ignitabull Team`;
	}

	private getHighValueVisitorTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Personalized Amazon insights for {{company}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8e44ad; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: white; }
    .button { background: #8e44ad; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
    .insight { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #8e44ad; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Custom Insights for {{company}}</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p>We noticed you spent {{timeOnSite}} minutes exploring Ignitabull and viewed {{pageViews}} pages. Based on your interest, we've prepared some personalized insights for {{company}}:</p>
      
      <div class="stats">
        <div class="stat">
          <h3>{{pageViews}}</h3>
          <p>Pages Viewed</p>
        </div>
        <div class="stat">
          <h3>{{timeOnSite}}min</h3>
          <p>Time Invested</p>
        </div>
      </div>
      
      <h3>Quick Insights for Your Business:</h3>
      {{#each insights}}
      <div class="insight">
        <p>📊 {{this}}</p>
      </div>
      {{/each}}
      
      <p>Ready to see the full analysis? Let's schedule a personalized demo where we'll show you exactly how to implement these opportunities.</p>
      
      <a href="https://calendly.com/ignitabull/personalized-demo" class="button">Get My Custom Demo</a>
      
      <p>Best regards,<br>The Ignitabull Team</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getHighValueVisitorTextTemplate(): string {
		return `Custom Insights for {{company}}

Hi {{firstName}}!

We noticed you spent {{timeOnSite}} minutes exploring Ignitabull and viewed {{pageViews}} pages. Based on your interest, we've prepared some personalized insights for {{company}}:

Quick Insights for Your Business:
{{#each insights}}
📊 {{this}}
{{/each}}

Ready to see the full analysis? Let's schedule a personalized demo where we'll show you exactly how to implement these opportunities.

Get My Custom Demo: https://calendly.com/ignitabull/personalized-demo

Best regards,
The Ignitabull Team`;
	}

	private getTrialReminderTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Ignitabull trial expires soon</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #e74c3c; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: white; }
    .button { background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
    .urgency { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Don't Lose Your Progress!</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      
      <div class="urgency">
        <h3>⏰ Trial Ending Soon</h3>
        <p>Your Ignitabull trial expires on <strong>{{trialEndDate}}</strong>. Upgrade now to keep all your data and insights!</p>
      </div>
      
      <p>During your trial, you've discovered valuable opportunities to optimize your Amazon business. Don't let that progress go to waste!</p>
      
      <p>Upgrade now and continue to:</p>
      <ul>
        <li>Track your Amazon performance improvements</li>
        <li>Receive AI-powered optimization alerts</li>
        <li>Access advanced competitor intelligence</li>
        <li>Automate your campaign management</li>
      </ul>
      
      <a href="{{upgradeUrl}}" class="button">Upgrade Now</a>
      
      <p>Questions about upgrading? Reply to this email or call us at (555) 123-4567.</p>
      
      <p>Best regards,<br>The Ignitabull Team</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getTrialReminderTextTemplate(): string {
		return `Don't Lose Your Progress!

Hi {{firstName}}!

⏰ Trial Ending Soon: Your Ignitabull trial expires on {{trialEndDate}}. Upgrade now to keep all your data and insights!

During your trial, you've discovered valuable opportunities to optimize your Amazon business. Don't let that progress go to waste!

Upgrade now and continue to:
- Track your Amazon performance improvements
- Receive AI-powered optimization alerts
- Access advanced competitor intelligence
- Automate your campaign management

Upgrade Now: {{upgradeUrl}}

Questions about upgrading? Reply to this email or call us at (555) 123-4567.

Best regards,
The Ignitabull Team`;
	}

	private getReactivationTemplate(): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Amazon features await you</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3498db; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: white; }
    .button { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
    .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #3498db; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>We've Been Busy Building!</h1>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p>We haven't seen you since {{lastLoginDate}}, but we've been hard at work adding exciting new features to Ignitabull!</p>
      
      <h3>🆕 What's New:</h3>
      {{#each newFeatures}}
      <div class="feature">
        <p><strong>{{this.name}}</strong> - {{this.description}}</p>
      </div>
      {{/each}}
      
      <p>These features are designed to help Amazon sellers like you stay ahead of the competition and maximize profits.</p>
      
      <p>Ready to explore what's new?</p>
      
      <a href="https://app.ignitabull.com/login" class="button">Explore New Features</a>
      
      <p>Best regards,<br>The Ignitabull Team</p>
    </div>
  </div>
</body>
</html>`;
	}

	private getReactivationTextTemplate(): string {
		return `We've Been Busy Building!

Hi {{firstName}}!

We haven't seen you since {{lastLoginDate}}, but we've been hard at work adding exciting new features to Ignitabull!

🆕 What's New:
{{#each newFeatures}}
- {{this.name}}: {{this.description}}
{{/each}}

These features are designed to help Amazon sellers like you stay ahead of the competition and maximize profits.

Ready to explore what's new?

Explore New Features: https://app.ignitabull.com/login

Best regards,
The Ignitabull Team`;
	}
}

export default AutomatedFollowUpService;
