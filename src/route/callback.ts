import express from 'express';
import { Client } from 'openid-client';
import { logger } from '../logger';
import { AppConfig } from '../config/app-config-resolver';
import { createLoginRedirectUrl, createUserRedirectUrl } from '../service/auth-service';
import { CALLBACK_PATH } from '../utils/auth-utils';
import { asyncRoute } from '../utils/express-utils';
import { SessionStore } from '../client/session-store';

interface SetupCallbackRouteParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	authClient: Client;
}

export const setupCallbackRoute = (params: SetupCallbackRouteParams): void => {
	const { app, appConfig, sessionStore, authClient } = params;

	app.get(CALLBACK_PATH, asyncRoute(async (req, res) => {
		const params = authClient.callbackParams(req);

		// TODO: Remove later
		logger.info('SessionId: ' + req.session.id)
		logger.info('Callback params: ' + JSON.stringify(params));
		logger.info('Authorization code: ' + params.code);

		const loginState = await sessionStore.getLoginState(req.sessionID);

		if (!loginState) {
			logger.error('Fant ikke login state i callback');
			res.sendStatus(500);
			return;
		}

		authClient
			.callback(createLoginRedirectUrl(appConfig.applicationUrl, CALLBACK_PATH), params, {
					code_verifier: loginState.codeVerifier,
					nonce: loginState.nonce,
				}, {
					clientAssertionPayload: {
						aud: authClient.issuer.metadata['token_endpoint']
					}
				}
			)
			.then((tokenSet) => {
					// TODO: Store sid with session Id

					sessionStore.setUserTokenSet(req.sessionID, tokenSet);

					const redirectUri = createUserRedirectUrl(appConfig.applicationUrl, loginState.redirectUri);

					res.redirect(redirectUri);
				})
			.catch((error) => {
				logger.error('Feil ved callback', error)
				res.status(500).send('An unexpected error happened logging in');
			})
			.finally(() => {
				sessionStore.destroyLoginState(req.sessionID);
			});
	}));
};