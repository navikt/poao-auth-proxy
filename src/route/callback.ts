import express from 'express';
import { Client } from 'openid-client';

import { AppConfig } from '../config/app-config-resolver';
import { createLoginRedirectUrl, safeRedirectUri } from '../service/auth-service';
import { SessionStore } from '../session-store/session-store';
import { CALLBACK_PATH, getExpiresInSeconds, getTokenSid, tokenSetToOidcTokenSet } from '../utils/auth-utils';
import { asyncRoute } from '../utils/express-utils';
import { logger } from '../utils/logger';
import { LoginProvider } from '../config/auth-config';

interface SetupCallbackRouteParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	authClient: Client;
}

export const setupCallbackRoute = (params: SetupCallbackRouteParams): void => {
	const { app, appConfig, sessionStore, authClient } = params;

	app.post(
		CALLBACK_PATH,
		asyncRoute(async (req, res) => {
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
				.callback(
					createLoginRedirectUrl(appConfig.applicationUrl, CALLBACK_PATH),
					params,
					{
						code_verifier: loginState.codeVerifier,
						nonce: loginState.nonce,
						state: params.state,
					},
					{
						clientAssertionPayload: {
							aud: authClient.issuer.metadata['token_endpoint'],
						},
					}
				)
				.then(async (tokenSet) => {
					const oidcTokenSet = tokenSetToOidcTokenSet(tokenSet);

					if (appConfig.auth.loginProvider === LoginProvider.ID_PORTEN) {
						const oidcSessionId = getTokenSid(oidcTokenSet.idToken);

						if (!oidcSessionId) {
							throw new Error('"sid"-claim is missing from id_token');
						}

						const expiresInSeconds = getExpiresInSeconds(oidcTokenSet.expiresAt)

						await sessionStore.setLogoutSessionId(oidcSessionId, expiresInSeconds, req.sessionID);
					}

					await sessionStore.setOidcTokenSet(req.sessionID, tokenSetToOidcTokenSet(tokenSet));

					const redirectUri = safeRedirectUri(appConfig.applicationUrl, loginState.redirectUri);

					res.redirect(redirectUri);
				})
				.catch((error) => {
					logger.error('Feil ved callback', error);
					res.status(500).send('An unexpected error happened logging in');
				});
		})
	);
};
