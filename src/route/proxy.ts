import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Client } from 'openid-client';
import urlJoin from 'url-join';

import { AppConfig } from '../config/app-config-resolver';
import { SessionStore } from '../session-store/session-store';
import { asyncMiddleware } from '../utils/express-utils';
import { logger } from '../utils/logger';
import { getSecondsUntil } from '../utils/date-utils';
import { createAzureAdAppId, createTokenXAppId } from '../utils/auth-config-utils';
import { getExpiresInSecondWithClockSkew, getAccessToken } from '../utils/auth-token-utils';
import { createAzureAdOnBehalfOfToken, createTokenXOnBehalfOfToken } from '../utils/auth-client-utils';
import { TokenValidator } from '../utils/token-validator';

const PROXY_BASE_PATH = '/proxy';

interface SetupProxyRoutesParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	oboTokenClient: Client;
	tokenValidator: TokenValidator;
}

export const setupProxyRoutes = (params: SetupProxyRoutesParams): void => {
	const { app, appConfig, sessionStore, oboTokenClient, tokenValidator } = params;

	appConfig.proxy.proxies.forEach((proxy) => {
		const proxyFrom = urlJoin(PROXY_BASE_PATH, proxy.fromPath);

		const appId = appConfig.auth.tokenX
			? createTokenXAppId(proxy.toApp)
			: createAzureAdAppId(proxy.toApp);

		app.use(
			proxyFrom,
			asyncMiddleware(async (req, res, next) => {
				logger.info(`Proxyer request ${req.path} til applikasjon ${proxy.toApp.name}`);

				const accessToken = getAccessToken(req);

				const isValid = await tokenValidator.isValid(accessToken);

				if (!isValid) {
					res.sendStatus(401);
					return;
				}

				let oboToken = await sessionStore.getUserOboToken(req.sessionID, appId);

				if (!oboToken) {
					const oboTokenPromise = appConfig.auth.tokenX
						? createTokenXOnBehalfOfToken(
							oboTokenClient,
							appId,
							accessToken!!,
							appConfig.auth.tokenX
						)
						: createAzureAdOnBehalfOfToken(oboTokenClient, appId, accessToken!!);

					oboToken = await oboTokenPromise;

					const expiresInSeconds = getSecondsUntil(oboToken.expiresAt * 1000);
					const expiresInSecondWithClockSkew = getExpiresInSecondWithClockSkew(expiresInSeconds);

					await sessionStore.setUserOboToken(req.sessionID, appId, expiresInSecondWithClockSkew, oboToken);
				}

				req.headers['Authorization'] = `Bearer ${oboToken.accessToken}`;

				next();
			}),
			createProxyMiddleware(proxyFrom, {
				target: proxy.toUrl,
				logLevel: 'debug',
				logProvider: () => logger,
				changeOrigin: true,
				pathRewrite: proxy.preserveFromPath
					? undefined
					: {
							[`^${proxyFrom}`]: '',
					  },
				onError: (error, request, response) => {
					logger.error(`onError, error=${error.message}`);
				},
			})
		);
	});
};
