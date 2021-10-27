import express from 'express';
import { Client } from 'openid-client';

import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';
import { AppConfig } from '../config/app-config-resolver';
import { getOidcTokenSetAndRefreshIfNecessary } from '../service/token-service';

interface SetupCallbackRouteParams {
	app: express.Application;
	appConfig: AppConfig;
	authClient: Client;
	sessionStore: SessionStore;
}

export const setupIsAuthenticatedRoute = (params: SetupCallbackRouteParams): void => {
	const { app, authClient, appConfig, sessionStore } = params;

	app.get(
		'/is-authenticated',
		asyncRoute(async (req, res) => {
			let isAuthenticated: boolean;

			try {
				const tokenSet = await getOidcTokenSetAndRefreshIfNecessary(
					sessionStore, req.sessionID, appConfig.auth.enableRefresh, authClient
				);

				isAuthenticated = !!tokenSet;
			} catch (e) {
				isAuthenticated = false;
			}

			res.setHeader('cache-control', 'no-cache');

			res.send({
				isAuthenticated: isAuthenticated,
			});
		})
	);
};
