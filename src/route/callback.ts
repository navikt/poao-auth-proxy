import express from 'express';
import { Client } from 'openid-client';

import { AppConfig } from '../config/app-config-resolver';
import { SessionStore } from '../session-store/session-store';
import { asyncRoute } from '../utils/express-utils';
import { logger } from '../utils/logger';
import { LoginProvider } from '../config/auth-config';
import { getNowPlusSeconds, getSecondsUntil } from '../utils/date-utils';
import { CALLBACK_PATH, createLoginRedirectUrl, safeRedirectUri } from '../utils/auth-login-utils';
import { getTokenSid, tokenSetToOidcTokenSet } from '../utils/auth-token-utils';

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

			if (!params.state) {
				logger.error('State is missing from callback');
				res.sendStatus(400);
				return;
			}

			const loginState = await sessionStore.getLoginState(params.state);

			if (!loginState) {
				logger.error('Fant ikke lagret login state i /callback for id: ' + params.state);
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
					const tokenSetExpiresInSeconds = getSecondsUntil(oidcTokenSet.expiresAt * 1000)

					if (appConfig.auth.loginProvider === LoginProvider.ID_PORTEN) {
						if (!oidcTokenSet.idToken) {
							throw new Error('id_token is missing from token set');
						}

						const oidcSessionId = getTokenSid(oidcTokenSet.idToken);

						if (!oidcSessionId) {
							throw new Error('"sid"-claim is missing from id_token');
						}

						await sessionStore.setLogoutSessionId(oidcSessionId, tokenSetExpiresInSeconds, req.sessionID);
					}

					let oidcTokenSetExpiresInSec: number;

					if (appConfig.auth.enableRefresh) {
						const refreshAllowedWithin = getNowPlusSeconds(appConfig.auth.refreshAllowedWithinSeconds);
						const secondsRefreshAllowed = getSecondsUntil(refreshAllowedWithin.getTime());

						oidcTokenSetExpiresInSec = secondsRefreshAllowed;

						await sessionStore.setRefreshAllowedWithin(req.sessionID, secondsRefreshAllowed, refreshAllowedWithin);
					} else {
						oidcTokenSetExpiresInSec = tokenSetExpiresInSeconds;
					}

					await sessionStore.setOidcTokenSet(req.sessionID, oidcTokenSetExpiresInSec, oidcTokenSet);


					const redirectUri = safeRedirectUri(appConfig.applicationUrl, loginState.redirectUri);

					res.redirect(redirectUri);
				})
				.catch((error) => {
					logger.error('Feil ved callback', error);
					res.status(500).send('An unexpected error happened during login');
				});
		})
	);
};
