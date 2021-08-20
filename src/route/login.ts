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
import {
	storeCodeVerifier,
	storeNonce,
	storeRedirectUri
} from '../service/session-store-service';
import { logger } from '../logger';

export const setupLoginRoutes = (app: express.Application, appConfig: AppConfig, authClient: Client): void => {
	app.get('/login', (req, res) => {
		const redirectUri = getRedirectUriFromQuery(appConfig.applicationUrl, req);
		const isAuthenticated = isTokenValid('TODO');

		if (isAuthenticated) {
			res.redirect(redirectUri);
		} else {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = generateCodeChallenge(codeVerifier);
			const nonce = generateNonce();

			storeCodeVerifier(req, codeVerifier);
			storeNonce(req, nonce);
			storeRedirectUri(req, redirectUri);

			const authorizationUrl = createAuthorizationUrl({
				client: authClient,
				redirect_uri: createLoginRedirectUrl(appConfig.applicationUrl, CALLBACK_PATH),
				codeChallenge,
				nonce
			});

			// TODO: Remove later
			logger.info('Redirecting to authorization url: ' + authorizationUrl);

			res.redirect(authorizationUrl);
		}
	})
};