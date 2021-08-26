import express from 'express';
import { Client } from 'openid-client';
import { logger } from '../logger';
import { AppConfig } from '../config/app-config-resolver';
import { createLoginRedirectUrl, createUserRedirectUrl } from '../service/auth-service';
import { CALLBACK_PATH, tokenSetToOidcTokenSet } from '../utils/auth-utils';
import { asyncRoute } from '../utils/express-utils';
import { SessionStore } from '../session-store/session-store';

interface SetupCallbackRouteParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	authClient: Client;
}

export const setupCallbackRoute = (params: SetupCallbackRouteParams): void => {
	const { app, appConfig, sessionStore, authClient } = params;

	app.post(CALLBACK_PATH, asyncRoute(async (req, res) => {
		const params = authClient.callbackParams(req);

		// TODO: Remove later
		logger.info('SessionId: ' + req.sessionID);
		logger.info('Callback params: ' + JSON.stringify(params));

		if (!params.state) {
			logger.error('State is missing from callback');
			res.sendStatus(400);
			return;
		}

		const loginState = await sessionStore.getLoginState(params.state);

		if (!loginState) {
			logger.error('Fant ikke login state i callback');
			res.sendStatus(500);
			return;
		}

		authClient
			.callback(createLoginRedirectUrl(appConfig.applicationUrl, CALLBACK_PATH), params, {
					code_verifier: loginState.codeVerifier,
					nonce: loginState.nonce,
					state: params.state
				}, {
					clientAssertionPayload: {
						aud: authClient.issuer.metadata['token_endpoint']
					}
				}
			)
			.then(async (tokenSet) => {
					// TODO: Store sid with session Id for ID_PORTEN

					await sessionStore.setUserTokenSet(req.sessionID, tokenSetToOidcTokenSet(tokenSet));

					const redirectUri = createUserRedirectUrl(appConfig.applicationUrl, loginState.redirectUri);

					res.redirect(redirectUri);
				})
			.catch((error) => {
				logger.error('Feil ved callback', error)
				res.status(500).send('An unexpected error happened logging in');
			});
	}));
};