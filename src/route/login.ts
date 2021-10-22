import express from 'express';
import { Client } from 'openid-client';

import { AppConfig } from '../config/app-config-resolver';
import { LoginProvider } from '../config/auth-config';
import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';
import { logger } from '../utils/logger';
import {
	CALLBACK_PATH,
	createLoginRedirectUrl,
	generateCodeChallenge,
	generateCodeVerifier,
	generateNonce,
	generateState, LOGIN_STATE_TIMEOUT_AFTER_SECONDS,
	safeRedirectUri
} from '../utils/auth-login-utils';
import { EXPIRE_BEFORE_MS, isTokenExpiredOrExpiresSoon } from '../utils/auth-token-utils';
import { createAzureAdAuthorizationUrl, createIdPortenAuthorizationUrl } from '../utils/auth-client-utils';

interface SetupLoginRouteParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	authClient: Client;
}

export const setupLoginRoute = (params: SetupLoginRouteParams): void => {
	const { app, appConfig, sessionStore, authClient } = params;

	app.get(
		'/oauth2/login',
		asyncRoute(async (req, res) => {
			const redirectUri = safeRedirectUri(appConfig.applicationUrl, req.query.redirect as string | undefined);
			const userTokenSet = await sessionStore.getOidcTokenSet(req.sessionID);

			if (!isTokenExpiredOrExpiresSoon(userTokenSet, EXPIRE_BEFORE_MS)) {
				logger.info('User is already logged in, redirecting...');
				res.redirect(redirectUri);
				return;
			}

			const codeVerifier = generateCodeVerifier();
			const codeChallenge = generateCodeChallenge(codeVerifier);
			const nonce = generateNonce();
			const state = generateState();

			await sessionStore.setLoginState(state, LOGIN_STATE_TIMEOUT_AFTER_SECONDS, {
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
				enableRefresh: appConfig.auth.enableRefresh
			};

			const authorizationUrl =
				appConfig.auth.loginProvider === LoginProvider.AZURE_AD
					? createAzureAdAuthorizationUrl(authorizationUrlParams)
					: createIdPortenAuthorizationUrl(authorizationUrlParams);

			logger.info('Starter innlogging av bruker');

			res.redirect(authorizationUrl);
		})
	);
};
