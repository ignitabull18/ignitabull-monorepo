/**
 * Database-related types for the core package
 */

export interface Database {
	// Add database interface properties as needed
}

export interface DatabaseUser {
	id: string;
	email: string;
	first_name?: string;
	last_name?: string;
	avatar_url?: string;
	timezone?: string;
	current_organization_id?: string;
	created_at: string;
	updated_at: string;
}

export interface DatabaseSession {
	user: DatabaseUser;
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

export interface DatabaseOrganization {
	id: string;
	name: string;
	slug: string;
	description?: string;
	website?: string;
	industry?: string;
	owner_id: string;
	created_at: string;
	updated_at: string;
}