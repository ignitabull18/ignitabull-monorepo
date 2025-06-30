/**
 * Welcome Email Template
 * React component for welcome email using @react-email/components
 */

import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Section,
	Text,
} from "@react-email/components";

interface WelcomeEmailProps {
	firstName?: string;
	organizationName?: string;
	loginUrl?: string;
}

export default function WelcomeEmail({
	firstName = "there",
	organizationName = "your organization",
	loginUrl = "https://app.ignitabull.com/login",
}: WelcomeEmailProps) {
	return (
		<Html>
			<Head />
			<Body style={main}>
				<Container style={container}>
					<Section style={header}>
						<Heading style={headerHeading}>🚀 Welcome to Ignitabull!</Heading>
					</Section>

					<Section style={content}>
						<Heading as="h2" style={contentHeading}>
							Hi {firstName}! 👋
						</Heading>

						<Text style={paragraph}>
							Welcome to Ignitabull! We're excited to help {organizationName}{" "}
							supercharge your Amazon business with AI-powered insights and
							automation.
						</Text>

						<Text style={subheading}>What you can do now:</Text>
						<Text style={listItem}>🔗 Connect your Amazon accounts</Text>
						<Text style={listItem}>
							📊 View real-time performance dashboards
						</Text>
						<Text style={listItem}>
							🤖 Get AI-powered optimization recommendations
						</Text>
						<Text style={listItem}>
							📈 Track keyword rankings and competitor activity
						</Text>
						<Text style={listItem}>🎯 Optimize your attribution campaigns</Text>

						<Text style={paragraph}>Ready to get started?</Text>

						<Button href={loginUrl} style={button}>
							Access Your Dashboard
						</Button>

						<Text style={paragraph}>
							If you have any questions, feel free to reach out to our team.
							We're here to help you succeed!
						</Text>

						<Text style={signature}>
							Best regards,
							<br />
							The Ignitabull Team
						</Text>
					</Section>

					<Hr style={hr} />

					<Section style={footer}>
						<Text style={footerText}>
							© {new Date().getFullYear()} Ignitabull. All rights reserved.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// Styles
const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
	maxWidth: "600px",
};

const header = {
	background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
	borderRadius: "8px 8px 0 0",
	padding: "30px",
	textAlign: "center" as const,
};

const headerHeading = {
	color: "#ffffff",
	fontSize: "28px",
	fontWeight: "bold",
	margin: "0",
};

const content = {
	padding: "30px",
};

const contentHeading = {
	color: "#333333",
	fontSize: "24px",
	fontWeight: "bold",
	margin: "0 0 20px 0",
};

const paragraph = {
	color: "#333333",
	fontSize: "16px",
	lineHeight: "1.6",
	margin: "0 0 16px 0",
};

const subheading = {
	color: "#333333",
	fontSize: "18px",
	fontWeight: "bold",
	margin: "24px 0 12px 0",
};

const listItem = {
	color: "#333333",
	fontSize: "16px",
	lineHeight: "1.6",
	margin: "0 0 8px 0",
	paddingLeft: "20px",
};

const button = {
	backgroundColor: "#667eea",
	borderRadius: "6px",
	color: "#ffffff",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	padding: "12px 24px",
	margin: "20px 0",
};

const signature = {
	color: "#333333",
	fontSize: "16px",
	lineHeight: "1.6",
	margin: "24px 0 0 0",
};

const hr = {
	borderColor: "#e6ebf1",
	margin: "20px 0",
};

const footer = {
	textAlign: "center" as const,
	padding: "0 30px",
};

const footerText = {
	color: "#8898aa",
	fontSize: "12px",
	lineHeight: "1.6",
	margin: "0",
};
