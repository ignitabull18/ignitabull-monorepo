/**
 * Dashboard Form Components
 * Reusable form components with consistent styling and validation patterns
 */

"use client";

import {
	AlertCircle,
	CheckCircle2,
	DollarSign,
	Globe,
	Hash,
	HelpCircle,
	Mail,
	Phone,
} from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FormFieldProps {
	label: string;
	description?: string;
	error?: string;
	required?: boolean;
	tooltip?: string;
	children: ReactNode;
	className?: string;
}

export function FormField({
	label,
	description,
	error,
	required = false,
	tooltip,
	children,
	className,
}: FormFieldProps) {
	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center gap-2">
				<Label
					className={cn(
						"font-medium text-sm",
						required && "after:ml-1 after:text-destructive after:content-['*']",
					)}
				>
					{label}
				</Label>
				{tooltip && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent>
								<p className="max-w-xs">{tooltip}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>

			{children}

			{description && !error && (
				<p className="text-muted-foreground text-sm">{description}</p>
			)}

			{error && (
				<div className="flex items-center gap-2 text-destructive text-sm">
					<AlertCircle className="h-4 w-4" />
					{error}
				</div>
			)}
		</div>
	);
}

// Input variants with icons and validation
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	description?: string;
	error?: string;
	required?: boolean;
	tooltip?: string;
	icon?: ReactNode;
	suffix?: ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
	(
		{
			label,
			description,
			error,
			required,
			tooltip,
			icon,
			suffix,
			className,
			...props
		},
		ref,
	) => {
		return (
			<FormField
				label={label}
				description={description}
				error={error}
				required={required}
				tooltip={tooltip}
			>
				<div className="relative">
					{icon && (
						<div className="-translate-y-1/2 absolute top-1/2 left-3">
							{icon}
						</div>
					)}
					<Input
						ref={ref}
						className={cn(
							icon && "pl-10",
							suffix && "pr-10",
							error && "border-destructive focus-visible:ring-destructive",
							className,
						)}
						{...props}
					/>
					{suffix && (
						<div className="-translate-y-1/2 absolute top-1/2 right-3">
							{suffix}
						</div>
					)}
				</div>
			</FormField>
		);
	},
);
FormInput.displayName = "FormInput";

// Specialized input types
export function EmailInput({
	...props
}: Omit<FormInputProps, "type" | "icon">) {
	return (
		<FormInput
			type="email"
			icon={<Mail className="h-4 w-4 text-muted-foreground" />}
			{...props}
		/>
	);
}

export function PhoneInput({
	...props
}: Omit<FormInputProps, "type" | "icon">) {
	return (
		<FormInput
			type="tel"
			icon={<Phone className="h-4 w-4 text-muted-foreground" />}
			{...props}
		/>
	);
}

export function UrlInput({ ...props }: Omit<FormInputProps, "type" | "icon">) {
	return (
		<FormInput
			type="url"
			icon={<Globe className="h-4 w-4 text-muted-foreground" />}
			{...props}
		/>
	);
}

export function NumberInput({
	...props
}: Omit<FormInputProps, "type" | "icon">) {
	return (
		<FormInput
			type="number"
			icon={<Hash className="h-4 w-4 text-muted-foreground" />}
			{...props}
		/>
	);
}

export function CurrencyInput({
	currency = "USD",
	...props
}: Omit<FormInputProps, "type" | "icon"> & { currency?: string }) {
	return (
		<FormInput
			type="number"
			step="0.01"
			icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
			suffix={<span className="text-muted-foreground text-sm">{currency}</span>}
			{...props}
		/>
	);
}

// Textarea component
interface FormTextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label: string;
	description?: string;
	error?: string;
	required?: boolean;
	tooltip?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
	(
		{ label, description, error, required, tooltip, className, ...props },
		ref,
	) => {
		return (
			<FormField
				label={label}
				description={description}
				error={error}
				required={required}
				tooltip={tooltip}
			>
				<Textarea
					ref={ref}
					className={cn(
						error && "border-destructive focus-visible:ring-destructive",
						className,
					)}
					{...props}
				/>
			</FormField>
		);
	},
);
FormTextarea.displayName = "FormTextarea";

// Select component
interface FormSelectProps {
	label: string;
	description?: string;
	error?: string;
	required?: boolean;
	tooltip?: string;
	placeholder?: string;
	options: { label: string; value: string; disabled?: boolean }[];
	value?: string;
	onValueChange?: (value: string) => void;
	className?: string;
}

export function FormSelect({
	label,
	description,
	error,
	required,
	tooltip,
	placeholder,
	options,
	value,
	onValueChange,
	className,
}: FormSelectProps) {
	return (
		<FormField
			label={label}
			description={description}
			error={error}
			required={required}
			tooltip={tooltip}
		>
			<Select value={value} onValueChange={onValueChange}>
				<SelectTrigger
					className={cn(
						error && "border-destructive focus:ring-destructive",
						className,
					)}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem
							key={option.value}
							value={option.value}
							disabled={option.disabled}
						>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</FormField>
	);
}

// Checkbox component
interface FormCheckboxProps {
	label: string;
	description?: string;
	error?: string;
	tooltip?: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	className?: string;
}

export function FormCheckbox({
	label,
	description,
	error,
	tooltip,
	checked,
	onCheckedChange,
	className,
}: FormCheckboxProps) {
	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center space-x-2">
				<Checkbox
					id={label}
					checked={checked}
					onCheckedChange={onCheckedChange}
					className={error ? "border-destructive" : ""}
				/>
				<div className="flex items-center gap-2">
					<Label
						htmlFor={label}
						className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						{label}
					</Label>
					{tooltip && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-xs">{tooltip}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			</div>

			{description && !error && (
				<p className="pl-6 text-muted-foreground text-sm">{description}</p>
			)}

			{error && (
				<div className="flex items-center gap-2 pl-6 text-destructive text-sm">
					<AlertCircle className="h-4 w-4" />
					{error}
				</div>
			)}
		</div>
	);
}

// Switch component
interface FormSwitchProps {
	label: string;
	description?: string;
	error?: string;
	tooltip?: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	className?: string;
}

export function FormSwitch({
	label,
	description,
	error,
	tooltip,
	checked,
	onCheckedChange,
	className,
}: FormSwitchProps) {
	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Label className="font-medium text-sm">{label}</Label>
					{tooltip && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-xs">{tooltip}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
				<Switch checked={checked} onCheckedChange={onCheckedChange} />
			</div>

			{description && !error && (
				<p className="text-muted-foreground text-sm">{description}</p>
			)}

			{error && (
				<div className="flex items-center gap-2 text-destructive text-sm">
					<AlertCircle className="h-4 w-4" />
					{error}
				</div>
			)}
		</div>
	);
}

// Form sections and layout
interface FormSectionProps {
	title: string;
	description?: string;
	children: ReactNode;
	className?: string;
}

export function FormSection({
	title,
	description,
	children,
	className,
}: FormSectionProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent className="space-y-6">{children}</CardContent>
		</Card>
	);
}

// Form actions
interface FormActionsProps {
	children: ReactNode;
	className?: string;
}

export function FormActions({ children, className }: FormActionsProps) {
	return (
		<div
			className={cn("flex items-center justify-end space-x-2 pt-6", className)}
		>
			{children}
		</div>
	);
}

// Success/Error states
interface FormStateProps {
	type: "success" | "error" | "warning";
	title: string;
	message: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
}

export function FormState({
	type,
	title,
	message,
	action,
	className,
}: FormStateProps) {
	const icons = {
		success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
		error: <AlertCircle className="h-5 w-5 text-red-600" />,
		warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
	};

	const variants = {
		success: "border-green-200 bg-green-50",
		error: "border-red-200 bg-red-50",
		warning: "border-yellow-200 bg-yellow-50",
	};

	return (
		<div className={cn("rounded-lg border p-4", variants[type], className)}>
			<div className="flex items-start space-x-3">
				{icons[type]}
				<div className="flex-1">
					<h3 className="font-medium text-sm">{title}</h3>
					<p className="mt-1 text-muted-foreground text-sm">{message}</p>
					{action && (
						<Button
							variant="outline"
							size="sm"
							onClick={action.onClick}
							className="mt-3"
						>
							{action.label}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
