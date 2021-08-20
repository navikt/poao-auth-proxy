import express from 'express';
import { Client } from 'openid-client';
import {
	getStoredCodeVerifier,
	getStoredNonce,
	getStoredRedirectUri,
	storeTokenSet
} from '../service/session-store-service';
import { logger } from '../logger';
import { AppConfig } from '../config/app-config';
import { createLoginRedirectUrl, createUserRedirectUrl } from '../service/auth-service';
import { CALLBACK_PATH } from '../utils/auth-utils';

export const setupCallbackRoutes = (app: express.Application, appConfig: AppConfig, authClient: Client): void => {
	app.get(CALLBACK_PATH, (req, res) => {
		const params = authClient.callbackParams(req);

		// TODO: Remove later
		logger.info('Cookies: ' + JSON.stringify(req.cookies))
		logger.info('Callback params: ' + JSON.stringify(params));
		logger.info('Authorization code: ' + params.code);

		const codeVerifier = getStoredCodeVerifier(req);
		const nonce = getStoredNonce(req);

		// TODO: Remove later
		logger.info('Nonce: ' + nonce);

		authClient
			.callback(createLoginRedirectUrl(appConfig.applicationUrl, CALLBACK_PATH), params, {
					code_verifier: codeVerifier,
					nonce,
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
			.catch((error) => {
				logger.error('Feil ved callback', error)
				res.status(500).send('An unexpected error happened logging in');
			})
			.finally(() => {
				// TODO: Cleanup old stuff from session
			});

	});
};