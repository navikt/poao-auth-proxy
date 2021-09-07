import express from 'express';
import { Client } from 'openid-client';

import { AppConfig } from '../config/app-config-resolver';
import { createAzureAdOnBehalfOfToken, createTokenXOnBehalfOfToken } from '../service/auth-service';
import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';
import { logger } from '../utils/logger';

interface SetupOboTestRouteParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	oboTokenClient: Client;
}

// TODO: This route is only for debugging and will be removed

export const setupOboTestRoute = (params: SetupOboTestRouteParams): void => {
	const { app, appConfig, sessionStore, oboTokenClient } = params;

	app.get(
		'/obo',
		asyncRoute(async (req, res) => {
			const appId = req.query.appId as string | undefined;

			if (!appId) {
				res.status(400).send();
				return;
			}

			const userTokenSet = await sessionStore.getOidcTokenSet(req.sessionID);

			if (!userTokenSet) {
				res.status(401).send();
				return;
			}

			const oboTokenPromise = appConfig.auth.tokenX
				? createTokenXOnBehalfOfToken(oboTokenClient, appId, userTokenSet.accessToken, appConfig.auth.tokenX)
				: createAzureAdOnBehalfOfToken(oboTokenClient, appId, userTokenSet.accessToken);

			oboTokenPromise
				.then((oboTokenSet) => {
					res.send({
						userTokenSet: userTokenSet,
						oboTokenSet: oboTokenSet,
					});
				})
				.catch((err) => {
					logger.error('OBO failed', err);
					res.status(500).send(JSON.stringify(err));
				});
		})
	);
};
