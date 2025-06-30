/**
 * Async Handler Middleware
 * Wraps async route handlers to catch errors
 */

import type { NextFunction, Request, Response } from "express";

export function asyncHandler(
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}
