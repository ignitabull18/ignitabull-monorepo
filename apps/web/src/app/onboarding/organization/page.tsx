/**
 * Organization Onboarding Page
 * Allows new users to create or join an organization
 */

"use client";

import { validateOrganizationSlug } from "@ignitabull/core/lib/auth";
import {
	ArrowRight,
	Building,
	Globe,
	Mail,
	Plus,
	Search,
	Users,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	FormActions,
	FormInput,
	FormSection,
	FormSelect,
	FormState,
	FormTextarea,
} from "@/components/ui/form-components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, withAuth } from "@/lib/auth-client";

function OrganizationOnboardingPage() {
	const router = useRouter();
	const { user, createOrganization, isLoading } = useAuth();

	const [activeTab, setActiveTab] = useState("create");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string>("");
	const [success, setSuccess] = useState<string>("");

	// Create organization form
	const [createForm, setCreateForm] = useState({
		name: "",
		slug: "",
		description: "",
		website: "",
		industry: "",
	});
	const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

	// Join organization form
	const [joinForm, setJoinForm] = useState({
		organizationCode: "",
		email: "",
	});
	const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});

	const industries = [
		{ label: "E-commerce & Retail", value: "ecommerce" },
		{ label: "Consumer Goods", value: "consumer-goods" },
		{ label: "Fashion & Apparel", value: "fashion" },
		{ label: "Electronics & Technology", value: "electronics" },
		{ label: "Health & Beauty", value: "health-beauty" },
		{ label: "Home & Garden", value: "home-garden" },
		{ label: "Sports & Outdoors", value: "sports" },
		{ label: "Books & Media", value: "books-media" },
		{ label: "Automotive", value: "automotive" },
		{ label: "Business Services", value: "business-services" },
		{ label: "Marketing Agency", value: "marketing-agency" },
		{ label: "Other", value: "other" },
	];

	const generateSlug = (name: string): string => {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.trim()
			.substring(0, 50);
	};

	const handleCreateInputChange = (field: string, value: string) => {
		setCreateForm((prev) => {
			const updated = { ...prev, [field]: value };

			// Auto-generate slug when name changes
			if (field === "name") {
				updated.slug = generateSlug(value);
			}

			return updated;
		});

		// Clear errors
		if (error) setError("");
		if (createErrors[field]) {
			setCreateErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const handleJoinInputChange = (field: string, value: string) => {
		setJoinForm((prev) => ({ ...prev, [field]: value }));

		// Clear errors
		if (error) setError("");
		if (joinErrors[field]) {
			setJoinErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const validateCreateForm = () => {
		const errors: Record<string, string> = {};

		if (!createForm.name.trim()) {
			errors.name = "Organization name is required";
		} else if (createForm.name.length < 2) {
			errors.name = "Organization name must be at least 2 characters";
		}

		if (!createForm.slug.trim()) {
			errors.slug = "Organization slug is required";
		} else if (!validateOrganizationSlug(createForm.slug)) {
			errors.slug =
				"Slug must be 3-50 characters and contain only lowercase letters, numbers, and hyphens";
		}

		setCreateErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const validateJoinForm = () => {
		const errors: Record<string, string> = {};

		if (!joinForm.organizationCode.trim()) {
			errors.organizationCode = "Organization code is required";
		}

		if (!joinForm.email.trim()) {
			errors.email = "Email address is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(joinForm.email)) {
			errors.email = "Please enter a valid email address";
		}

		setJoinErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleCreateSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting || !validateCreateForm()) return;

		setIsSubmitting(true);
		setError("");
		setSuccess("");

		try {
			const { organization, error: createError } = await createOrganization({
				name: createForm.name,
				slug: createForm.slug,
				description: createForm.description || undefined,
				website: createForm.website || undefined,
				industry: createForm.industry || undefined,
			});

			if (createError) {
				setError(createError.message);
				return;
			}

			setSuccess("Organization created successfully!");

			// Redirect to dashboard after a delay
			setTimeout(() => {
				router.push("/dashboard");
			}, 1500);
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
			console.error("Create organization error:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleJoinSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting || !validateJoinForm()) return;

		setIsSubmitting(true);
		setError("");
		setSuccess("");

		try {
			// In a real implementation, you would call an API to join an organization
			// For now, we'll simulate the process
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setSuccess("Join request sent! You will receive an email when approved.");
		} catch (err) {
			setError("Failed to send join request. Please try again.");
			console.error("Join organization error:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isCreateFormValid =
		createForm.name &&
		createForm.slug &&
		Object.keys(createErrors).length === 0;
	const isJoinFormValid =
		joinForm.organizationCode &&
		joinForm.email &&
		Object.keys(joinErrors).length === 0;

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
			<div className="w-full max-w-2xl space-y-8">
				{/* Header */}
				<div className="text-center">
					<div className="mb-8 inline-flex items-center space-x-2">
						<div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
							<Zap className="h-6 w-6 text-primary-foreground" />
						</div>
						<span className="font-bold text-2xl">Ignitabull</span>
					</div>
					<h1 className="font-bold text-3xl tracking-tight">
						Set up your organization
					</h1>
					<p className="mt-2 text-muted-foreground">
						Create a new organization or join an existing one to get started
					</p>
					<div className="mt-4 flex items-center justify-center space-x-2 text-muted-foreground text-sm">
						<span>Welcome back,</span>
						<Badge variant="secondary">
							{user?.first_name} {user?.last_name}
						</Badge>
					</div>
				</div>

				{/* Organization Setup */}
				<Card>
					<CardHeader>
						<CardTitle className="text-center">Organization Setup</CardTitle>
						<CardDescription className="text-center">
							Choose how you'd like to get started with Ignitabull
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<FormState
								type="error"
								title="Setup failed"
								message={error}
								className="mb-6"
							/>
						)}

						{success && (
							<FormState
								type="success"
								title="Success!"
								message={success}
								className="mb-6"
							/>
						)}

						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="space-y-6"
						>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger
									value="create"
									className="flex items-center space-x-2"
								>
									<Plus className="h-4 w-4" />
									<span>Create Organization</span>
								</TabsTrigger>
								<TabsTrigger
									value="join"
									className="flex items-center space-x-2"
								>
									<Users className="h-4 w-4" />
									<span>Join Organization</span>
								</TabsTrigger>
							</TabsList>

							{/* Create Organization Tab */}
							<TabsContent value="create" className="space-y-6">
								<div className="space-y-2 text-center">
									<Building className="mx-auto h-12 w-12 text-primary" />
									<h3 className="font-semibold text-lg">
										Create Your Organization
									</h3>
									<p className="text-muted-foreground text-sm">
										Set up a new organization and invite your team members
									</p>
								</div>

								<form onSubmit={handleCreateSubmit} className="space-y-6">
									<FormSection
										title="Organization Details"
										description="Basic information about your organization"
									>
										<FormInput
											label="Organization Name"
											icon={
												<Building className="h-4 w-4 text-muted-foreground" />
											}
											placeholder="Your Company Name"
											value={createForm.name}
											onChange={(e) =>
												handleCreateInputChange("name", e.target.value)
											}
											error={createErrors.name}
											required
											disabled={isSubmitting}
										/>

										<FormInput
											label="Organization Slug"
											icon={<Globe className="h-4 w-4 text-muted-foreground" />}
											placeholder="your-company-name"
											value={createForm.slug}
											onChange={(e) =>
												handleCreateInputChange("slug", e.target.value)
											}
											error={createErrors.slug}
											description="This will be part of your organization URL (e.g., ignitabull.com/org/your-company-name)"
											required
											disabled={isSubmitting}
										/>

										<FormTextarea
											label="Description"
											placeholder="Brief description of your organization (optional)"
											value={createForm.description}
											onChange={(e) =>
												handleCreateInputChange("description", e.target.value)
											}
											rows={3}
											disabled={isSubmitting}
										/>
									</FormSection>

									<FormSection
										title="Additional Information"
										description="Help us understand your business better"
									>
										<FormInput
											label="Website"
											icon={<Globe className="h-4 w-4 text-muted-foreground" />}
											placeholder="https://yourcompany.com"
											value={createForm.website}
											onChange={(e) =>
												handleCreateInputChange("website", e.target.value)
											}
											disabled={isSubmitting}
										/>

										<FormSelect
											label="Industry"
											placeholder="Select your industry"
											options={industries}
											value={createForm.industry}
											onValueChange={(value) =>
												handleCreateInputChange("industry", value)
											}
										/>
									</FormSection>

									<FormActions>
										<Button
											type="submit"
											className="w-full"
											disabled={!isCreateFormValid || isSubmitting}
										>
											{isSubmitting ? (
												<>
													<div className="mr-2 h-4 w-4 animate-spin rounded-full border-current border-b-2" />
													Creating organization...
												</>
											) : (
												<>
													Create Organization
													<ArrowRight className="ml-2 h-4 w-4" />
												</>
											)}
										</Button>
									</FormActions>
								</form>
							</TabsContent>

							{/* Join Organization Tab */}
							<TabsContent value="join" className="space-y-6">
								<div className="space-y-2 text-center">
									<Users className="mx-auto h-12 w-12 text-primary" />
									<h3 className="font-semibold text-lg">
										Join an Organization
									</h3>
									<p className="text-muted-foreground text-sm">
										Enter the organization code provided by your team
										administrator
									</p>
								</div>

								<form onSubmit={handleJoinSubmit} className="space-y-6">
									<FormSection
										title="Organization Code"
										description="Get this code from your organization administrator"
									>
										<FormInput
											label="Organization Code"
											icon={
												<Search className="h-4 w-4 text-muted-foreground" />
											}
											placeholder="Enter organization code"
											value={joinForm.organizationCode}
											onChange={(e) =>
												handleJoinInputChange(
													"organizationCode",
													e.target.value,
												)
											}
											error={joinErrors.organizationCode}
											required
											disabled={isSubmitting}
										/>

										<FormInput
											label="Your Email"
											type="email"
											icon={<Mail className="h-4 w-4 text-muted-foreground" />}
											placeholder="Your work email address"
											value={joinForm.email}
											onChange={(e) =>
												handleJoinInputChange("email", e.target.value)
											}
											error={joinErrors.email}
											description="This should match the email your administrator has on file"
											required
											disabled={isSubmitting}
										/>
									</FormSection>

									<FormActions>
										<Button
											type="submit"
											className="w-full"
											disabled={!isJoinFormValid || isSubmitting}
										>
											{isSubmitting ? (
												<>
													<div className="mr-2 h-4 w-4 animate-spin rounded-full border-current border-b-2" />
													Sending request...
												</>
											) : (
												<>
													Request to Join
													<ArrowRight className="ml-2 h-4 w-4" />
												</>
											)}
										</Button>
									</FormActions>
								</form>
							</TabsContent>
						</Tabs>

						{/* Skip Option */}
						<div className="mt-8 border-t pt-6 text-center">
							<p className="mb-4 text-muted-foreground text-sm">
								You can also skip this step and set up your organization later
							</p>
							<Button
								variant="outline"
								onClick={() => router.push("/dashboard")}
								disabled={isSubmitting}
							>
								Skip for now
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default withAuth(OrganizationOnboardingPage);
