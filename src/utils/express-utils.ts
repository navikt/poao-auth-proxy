import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';

export const asyncMiddleware = (middleware: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
	return (req: Request, res: Response, next: NextFunction) =>
		Promise.resolve(middleware(req, res, next))
			.catch((error) => {
				logger.error('Caught error', error);
				next(error);
			});
};

export const asyncRoute = (route: (req: Request, res: Response) => Promise<void>) => {
	return (req: Request, res: Response) =>
		Promise.resolve(route(req, res))
			.catch((error) => {
				logger.error('Caught error', error);
				res.sendStatus(500);
			});
};