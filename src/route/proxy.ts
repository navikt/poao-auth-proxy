import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Client } from 'openid-client';
import urlJoin from 'url-join';

import { AppConfig } from '../config/app-config-resolver';
import { createAzureAdOnBehalfOfToken, createTokenXOnBehalfOfToken, isTokenValid } from '../service/auth-service';
import { SessionStore } from '../session-store/session-store';
import { createAzureAdAppId, createTokenXAppId } from '../utils/auth-utils';
import { asyncMiddleware } from '../utils/express-utils';
import { logger } from '../utils/logger';

const PROXY_BASE_PATH = '/proxy';

interface SetupProxyRoutesParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	oboTokenClient: Client;
}

export const setupProxyRoutes = (params: SetupProxyRoutesParams): void => {
	const { app, appConfig, sessionStore, oboTokenClient } = params;

	appConfig.proxy.proxies.forEach((proxy) => {
		const proxyFrom = urlJoin(PROXY_BASE_PATH, proxy.fromPath);

		const appId = appConfig.auth.tokenX
			? createTokenXAppId(proxy.toApp)
			: createAzureAdAppId(proxy.toApp);

		app.use(
			proxyFrom,
			asyncMiddleware(async (req, res, next) => {
				logger.info(`Proxyer request ${req.path} til applikasjon ${proxy.toApp.name}`);

				const userTokenSet = await sessionStore.getOidcTokenSet(req.sessionID);

				if (!userTokenSet || !isTokenValid(userTokenSet)) {
					res.sendStatus(401);
					return;
				}

				let oboToken = await sessionStore.getUserOboToken(req.sessionID, appId);

				if (!oboToken) {
					const oboTokenPromise = appConfig.auth.tokenX
						? createTokenXOnBehalfOfToken(
								oboTokenClient,
								appId,
								userTokenSet.accessToken,
								appConfig.auth.tokenX
						  )
						: createAzureAdOnBehalfOfToken(oboTokenClient, appId, userTokenSet.accessToken);

					oboToken = await oboTokenPromise;

					await sessionStore.setUserOboToken(req.sessionID, appId, oboToken);
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
