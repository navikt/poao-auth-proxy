import express from 'express';
import { Client } from 'openid-client';
import {
	getStoredLoginNonce,
	getStoredLoginState,
	getStoredRedirectUri,
	storeTokenSet
} from '../service/session-store-service';
import { logger } from '../logger';
import { AppConfig } from '../config/app-config';
import { createUserRedirectUrl } from '../service/auth-service';

export const setupCallbackRoutes = (app: express.Application, appConfig: AppConfig, authClient: Client): void => {
	app.post('/oauth2/callback', (req, res) => {
		const authorizationCode = req.query.code as string | undefined;
		const params = authClient.callbackParams(req);

		// TODO: Remove later
		logger.info('Callback params: ' + params);

		const state = getStoredLoginState(req);
		const nonce = getStoredLoginNonce(req);

		authClient
			.callback('/oauth2/callback', params, {
					code_verifier: authorizationCode,
					nonce,
					state
				}, {
					clientAssertionPayload: {
						aud: authClient.issuer.metadata['token_endpoint']
					}
				}
			)
			.then((tokenSet) => {
					storeTokenSet(req, tokenSet);

					// TODO: Remove later
					logger.info('Storing token with type in session: ' + tokenSet.token_type);

					const storedRedirectUri = getStoredRedirectUri(req);
					const redirectUri = createUserRedirectUrl(appConfig.applicationUrl, storedRedirectUri);

					res.redirect(redirectUri);
				})
			.catch((error) => logger.error('Feil ved callback', error))
			.finally(() => {
				// TODO: Cleanup old stuff from session
			});

	});
};