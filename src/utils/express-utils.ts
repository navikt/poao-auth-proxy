import { NextFunction, Request, Response } from 'express';

import { errorHandler } from '../middleware/error-handler';

export const asyncMiddleware = (middleware: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
	return (req: Request, res: Response, next: NextFunction) =>
		Promise.resolve(middleware(req, res, next)).catch((error) => {
			errorHandler(error, req, res, next);
		});
};

export const asyncRoute = (route: (req: Request, res: Response) => Promise<void>) => {
	return (req: Request, res: Response) =>
		Promise.resolve(route(req, res)).catch((error) => {
			errorHandler(error, req, res);
		});
};
