import express from 'express';
import { Client } from 'openid-client';
import { createOnBehalfOfToken } from '../service/auth-service';
import { logger } from '../logger';
import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';

interface SetupOboTestRouteParams {
	app: express.Application;
	sessionStore: SessionStore;
	authClient: Client;
}

export const setupOboTestRoute = (params: SetupOboTestRouteParams): void => {
	const { app, sessionStore, authClient } = params;

	app.get('/obo', asyncRoute(async (req, res) => {
		const appId = req.query.appId as string | undefined;

		if (!appId) {
			res.status(400).send();
			return;
		}

		const userTokenSet = await sessionStore.getUserTokenSet(req.sessionID);

		if (!userTokenSet) {
			res.status(401).send();
			return;
		}

		createOnBehalfOfToken(appId, authClient, userTokenSet.accessToken)
			.then(oboTokenSet => {
				res.send({
					oboTokenSet: oboTokenSet
				});
			}).catch(err => {
				logger.error('OBO failed', err);
				res.status(500).send(JSON.stringify(err));
			});
	}));
};