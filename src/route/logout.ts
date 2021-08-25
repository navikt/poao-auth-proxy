import express from 'express';
import { logger } from '../logger';
import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';

interface SetupLogoutRoutesParams {
	app: express.Application;
	sessionStore: SessionStore;
}

export const setupLogoutRoutes = (params: SetupLogoutRoutesParams): void => {
	const { app, sessionStore } = params;

	app.use('/logout', asyncRoute( async (req, res) => {
		// TODO: frontchannel logout

		await sessionStore.destroyUserTokenSet(req.sessionID);

		req.session.destroy((error) => {
			if (error) {
				logger.error('Feil ved destroy av session', error);
			}
		});

		// TODO: redirect

		res.sendStatus(204);
	}));
};