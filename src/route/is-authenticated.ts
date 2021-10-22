import express, { Response } from 'express';
import { Client } from 'openid-client';

import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';
import { AppConfig } from '../config/app-config-resolver';
import { getSecondsUntil } from '../utils/date-utils';
import { EXPIRE_BEFORE_MS, isTokenExpiredOrExpiresSoon, tokenSetToOidcTokenSet } from '../utils/auth-token-utils';
import { fetchRefreshedTokenSet } from '../utils/auth-client-utils';

interface SetupCallbackRouteParams {
	app: express.Application;
	appConfig: AppConfig;
	authClient: Client;
	sessionStore: SessionStore;
}

export const setupIsAuthenticatedRoute = (params: SetupCallbackRouteParams): void => {
	const { app, authClient, appConfig, sessionStore } = params;

	const refreshEnabled = appConfig.auth.enableRefresh;

	function isAuthenticated(res: Response, authenticated: boolean) {
		res.setHeader('cache-control', 'no-cache');

		res.send({
			isAuthenticated: authenticated,
		});
	}

	app.get(
		'/is-authenticated',
		asyncRoute(async (req, res) => {
			const userTokenSet = await sessionStore.getOidcTokenSet(req.sessionID);

			if (!userTokenSet) {
				return isAuthenticated(res, false);
			}

			if (isTokenExpiredOrExpiresSoon(userTokenSet, EXPIRE_BEFORE_MS)) {
				if (!refreshEnabled || !userTokenSet.refreshToken) {
					return isAuthenticated(res, false);
				}

				const refreshAllowedWithin = await sessionStore.getRefreshAllowedWithin(req.sessionID);

				if (!refreshAllowedWithin || Date.now() >= refreshAllowedWithin.getMilliseconds()) {
					return isAuthenticated(res, false);
				}

				const refreshedTokenSet = await fetchRefreshedTokenSet(authClient, userTokenSet.refreshToken);
				const refreshedOidcTokenSet = tokenSetToOidcTokenSet(refreshedTokenSet);
				const expiresInSeconds = getSecondsUntil(refreshAllowedWithin.getMilliseconds());

				await sessionStore.setOidcTokenSet(req.sessionID, expiresInSeconds, refreshedOidcTokenSet);
			}

			return isAuthenticated(res, true);
		})
	);
};
