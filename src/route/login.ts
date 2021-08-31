import express from 'express';
import { Client } from 'openid-client';

import { AppConfig } from '../config/app-config-resolver';
import { LoginProvider } from '../config/auth-config';
import {
	ALLOWED_REDIRECT_HOSTNAMES,
	createAzureAdAuthorizationUrl,
	createIdPortenAuthorizationUrl,
	createLoginRedirectUrl,
	safeRedirectUri,
	isTokenValid,
} from '../service/auth-service';
import { SessionStore } from '../session-store/session-store';
import {
	CALLBACK_PATH,
	generateCodeChallenge,
	generateCodeVerifier,
	generateNonce,
	generateState,
} from '../utils/auth-utils';
import { asyncRoute } from '../utils/express-utils';
import { logger } from '../utils/logger';
import { endsWithOneOf } from '../utils/url-utils';

interface SetupLoginRouteParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	authClient: Client;
}

export const setupLoginRoute = (params: SetupLoginRouteParams): void => {
	const { app, appConfig, sessionStore, authClient } = params;

	app.get(
		'/login',
		asyncRoute(async (req, res) => {
			const redirectUri = safeRedirectUri(appConfig.applicationUrl, req.query.redirect_uri as string | undefined);
			const userTokenSet = await sessionStore.getOidcTokenSet(req.sessionID);

			if (isTokenValid(userTokenSet)) {
				res.redirect(redirectUri);
			} else {
				const codeVerifier = generateCodeVerifier();
				const codeChallenge = generateCodeChallenge(codeVerifier);
				const nonce = generateNonce();
				const state = generateState();

				await sessionStore.setLoginState(state, {
					codeVerifier,
					nonce,
					redirectUri,
					state,
				});

				const authorizationUrlParams = {
					client: authClient,
					clientId: appConfig.auth.clientId,
					redirect_uri: createLoginRedirectUrl(appConfig.applicationUrl, CALLBACK_PATH),
					codeChallenge,
					state,
					nonce,
				};

				const authorizationUrl =
					appConfig.auth.loginProvider === LoginProvider.AZURE_AD
						? createAzureAdAuthorizationUrl(authorizationUrlParams)
						: createIdPortenAuthorizationUrl(authorizationUrlParams);

				// TODO: Remove later
				logger.info('Session id login: ' + req.sessionID);
				logger.info('Redirecting to authorization url: ' + authorizationUrl);

				res.redirect(authorizationUrl);
			}
		})
	);
};
