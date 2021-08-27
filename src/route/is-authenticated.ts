import express from 'express';

import { isTokenValid } from '../service/auth-service';
import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';

interface SetupCallbackRouteParams {
	app: express.Application;
	sessionStore: SessionStore;
}

export const setupIsAuthenticatedRoute = (params: SetupCallbackRouteParams): void => {
	const { app, sessionStore } = params;

	app.get(
		'/is-authenticated',
		asyncRoute(async (req, res) => {
			const userTokenSet = await sessionStore.getOidcTokenSet(req.sessionID);

			res.setHeader('cache-control', 'no-cache');

			res.send({
				isAuthenticated: isTokenValid(userTokenSet),
			});
		})
	);
};
