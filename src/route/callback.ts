import express from 'express';
import { Client } from 'openid-client';

import { AppConfig } from '../config/app-config-resolver';
import { createLoginRedirectUrl, safeRedirectUri } from '../service/auth-service';
import { SessionStore } from '../session-store/session-store';
import { CALLBACK_PATH, getTokenSid, tokenSetToOidcTokenSet } from '../utils/auth-utils';
import { asyncRoute } from '../utils/express-utils';
import { logger } from '../utils/logger';
import { LoginProvider } from '../config/auth-config';
import { getNowPlusSeconds, getSecondsUntil } from '../utils/date-utils';

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

						const expiresInSeconds = getSecondsUntil(oidcTokenSet.expiresAt)

						await sessionStore.setLogoutSessionId(oidcSessionId, expiresInSeconds, req.sessionID);
					}

					let oidcTokenSetExpiresInSec: number;

					if (appConfig.auth.enableRefresh) {
						const refreshAllowedWithin = getNowPlusSeconds(appConfig.auth.refreshAllowedWithinSeconds);
						const secondsRefreshAllowed = getSecondsUntil(refreshAllowedWithin.getMilliseconds());

						oidcTokenSetExpiresInSec = secondsRefreshAllowed;

						await sessionStore.setRefreshAllowedWithin(req.sessionID, secondsRefreshAllowed, refreshAllowedWithin);
					} else {
						oidcTokenSetExpiresInSec = getSecondsUntil(oidcTokenSet.expiresAt);
					}

					await sessionStore.setOidcTokenSet(req.sessionID, oidcTokenSetExpiresInSec, oidcTokenSet);


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
