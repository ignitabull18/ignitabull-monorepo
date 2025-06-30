/**
 * Authentication Middleware
 * Validates JWT tokens and authenticates requests
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
	user?: {
		id: string;
		email: string;
		organizationId?: string;
	};
}

export function authenticate(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Authorization token required" });
		}

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix

		// In a production app, you would verify the JWT token here
		// For this MVP, we'll do a simple check
		if (!token) {
			return res.status(401).json({ error: "Invalid token" });
		}

		// For demo purposes, decode without verification
		// In production, use proper JWT verification with secret
		try {
			const decoded = jwt.decode(token) as any;
			if (decoded?.sub) {
				req.user = {
					id: decoded.sub,
					email: decoded.email,
					organizationId: decoded.user_metadata?.organization_id,
				};
				next();
			} else {
				throw new Error("Invalid token format");
			}
		} catch (_jwtError) {
			return res.status(401).json({ error: "Invalid token" });
		}
	} catch (_error) {
		return res.status(401).json({ error: "Authentication failed" });
	}
}
