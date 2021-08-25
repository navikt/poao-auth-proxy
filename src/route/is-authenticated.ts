import express from 'express';
import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';
import { isTokenValid } from '../service/auth-service';

interface SetupCallbackRouteParams {
	app: express.Application;
	sessionStore: SessionStore;
}

export const setupIsAuthenticatedRoute = (params: SetupCallbackRouteParams): void => {
	const { app, sessionStore } = params;

	app.get('/is-authenticated', asyncRoute(async (req, res) => {
		const userTokenSet = await sessionStore.getUserTokenSet(req.sessionID);

		res.send({
			isAuthenticated: isTokenValid(userTokenSet)
		});
	}));
};
