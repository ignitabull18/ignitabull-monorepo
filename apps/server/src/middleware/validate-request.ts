/**
 * Request Validation Middleware
 * Validates request data using Zod schemas
 */

import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export function validateRequest(schema: z.ZodSchema) {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			schema.parse({
				body: req.body,
				query: req.query,
				params: req.params,
			});
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res.status(400).json({
					error: "Validation failed",
					details: error.errors,
				});
			}
			next(error);
		}
	};
}
