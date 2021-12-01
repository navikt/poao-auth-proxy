import express from 'express';
import { asyncRoute } from '../utils/express-utils';
import { TokenValidator } from '../utils/token-validator';
import { getAccessToken } from '../utils/auth-token-utils';
import { logger } from '../utils/logger';

interface SetupCallbackRouteParams {
	app: express.Application;
	tokenValidator: TokenValidator;
}

export const setupIsAuthenticatedRoute = (params: SetupCallbackRouteParams): void => {
	const { app, tokenValidator } = params;

	app.get(
		'/is-authenticated',
		asyncRoute(async (req, res) => {
			let isAuthenticated: boolean;

			try {
				isAuthenticated = await tokenValidator.isValid(getAccessToken(req));
			} catch (e) {
				logger.error("Failed to validate token", e)
				isAuthenticated = false;
			}

			res.setHeader('cache-control', 'no-cache');

			res.send({
				isAuthenticated: isAuthenticated,
			});
		})
	);
};
