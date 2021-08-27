import express from 'express';

import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';
import { logger } from '../utils/logger';

interface SetupLogoutRoutesParams {
	app: express.Application;
	sessionStore: SessionStore;
}

export const setupLogoutRoutes = (params: SetupLogoutRoutesParams): void => {
	const { app, sessionStore } = params;

	app.use(
		'/oauth2/logout',
		asyncRoute(async (req, res) => {
			const sid = req.query.sid as string | undefined;

			if (sid) {
				// Frontchannel logout initiated from ID-porten
				logger.info('Starting frontchannel logout for sid:' + sid);

				const sessionId = await sessionStore.getLogoutSessionId(sid);

				if (sessionId) {
					await sessionStore.destroyOidcTokenSet(sessionId);
				}

				await sessionStore.destroyLogoutSessionId(sid);
			} else {
				// User initiated logout

				await sessionStore.destroyOidcTokenSet(req.sessionID);

				req.session.destroy((error) => {
					if (error) {
						logger.error('Error occurred while destroying session', error);
					}
				});
			}

			res.sendStatus(204);
		})
	);
};
