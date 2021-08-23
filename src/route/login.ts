import express from 'express';
import { Client } from 'openid-client';
import {
	CALLBACK_PATH,
	generateCodeChallenge,
	generateCodeVerifier,
	generateNonce,
	generateState
} from '../utils/auth-utils';
import { AppConfig } from '../config/app-config';
import {
	createAuthorizationUrl,
	createLoginRedirectUrl,
	getRedirectUriFromQuery,
	isTokenValid
} from '../service/auth-service';
import { logger } from '../logger';
import { SessionStore } from '../client/session-store';
import { asyncRoute } from '../utils/express-utils';

interface SetupLoginRouteParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	authClient: Client;
}

export const setupLoginRoute = (params: SetupLoginRouteParams): void => {
	const { app, appConfig, sessionStore, authClient } = params;

	app.get('/login', asyncRoute(async (req, res) => {
		const redirectUri = getRedirectUriFromQuery(appConfig.applicationUrl, req);
		const userTokenSet = await sessionStore.getUserTokenSet(req.sessionID);
		const isAuthenticated = isTokenValid(userTokenSet);

		if (isAuthenticated) {
			res.redirect(redirectUri);
		} else {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = generateCodeChallenge(codeVerifier);
			const nonce = generateNonce();

			await sessionStore.setLoginState(req.sessionID, {
				codeVerifier,
				nonce,
				redirectUri
			});

			const authorizationUrl = createAuthorizationUrl({
				client: authClient,
				clientId: appConfig.oidcConfig.clientId,
				redirect_uri: createLoginRedirectUrl(appConfig.applicationUrl, CALLBACK_PATH),
				codeChallenge,
				nonce
			});

			// TODO: Remove later
			logger.info('Redirecting to authorization url: ' + authorizationUrl);

			res.redirect(authorizationUrl);
		}
	}));
};