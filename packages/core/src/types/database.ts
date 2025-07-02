/**
 * Database-related types for the core package
 */

export interface Database {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					email: string;
					first_name?: string;
					last_name?: string;
					avatar_url?: string;
					timezone?: string;
					role?: string;
					current_organization_id?: string;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<
					Database["public"]["Tables"]["users"]["Row"],
					"id" | "created_at" | "updated_at"
				> & {
					id?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
			};
			organizations: {
				Row: {
					id: string;
					name: string;
					slug: string;
					description?: string;
					website?: string;
					industry?: string;
					owner_id: string;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<
					Database["public"]["Tables"]["organizations"]["Row"],
					"id" | "created_at" | "updated_at"
				> & {
					id?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<
					Database["public"]["Tables"]["organizations"]["Insert"]
				>;
			};
			integrations: {
				Row: {
					id: string;
					organization_id: string;
					platform: string;
					name: string;
					credentials: Record<string, any>;
					status: string;
					settings?: Record<string, any>;
					last_sync_at?: string;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<
					Database["public"]["Tables"]["integrations"]["Row"],
					"id" | "created_at" | "updated_at"
				> & {
					id?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["integrations"]["Insert"]>;
			};
		};
		Views: {};
		Functions: {};
		Enums: {};
	};
}

// Type aliases for easier access
export type DatabaseUser = Database["public"]["Tables"]["users"]["Row"];
export type DatabaseOrganization =
	Database["public"]["Tables"]["organizations"]["Row"];

export interface DatabaseSession {
	user: DatabaseUser;
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}
