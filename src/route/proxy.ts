import express, { Request } from 'express';
import urlJoin from 'url-join';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from '../logger';
import { AppConfig } from '../config/app-config-resolver';
import { createOnBehalfOfToken, isTokenValid } from '../service/auth-service';
import { Client } from 'openid-client';
import { createAppIdentifierFromClientId } from '../utils/auth-utils';
import { asyncMiddleware } from '../utils/express-utils';
import { SessionStore } from '../session-store/session-store';

const PROXY_BASE_PATH = '/proxy';

interface SetupProxyRoutesParams {
	app: express.Application;
	appConfig: AppConfig;
	sessionStore: SessionStore;
	authClient: Client;
}

export const setupProxyRoutes = (params: SetupProxyRoutesParams): void => {
	const { app, appConfig, sessionStore, authClient } = params;

	appConfig.proxy.proxies.forEach(proxy => {
		const proxyFrom = urlJoin(PROXY_BASE_PATH, proxy.from);

		// TODO: Rename AppIdentifier
		const appIdentifier = createAppIdentifierFromClientId(proxy.appIdentifier)

		app.use(proxyFrom, asyncMiddleware(async (req, res, next) => {
			const userTokenSet = await sessionStore.getUserTokenSet(req.sessionID);

			if (!userTokenSet || !isTokenValid(userTokenSet)) {
				res.sendStatus(401);
				return;
			}

			let oboToken = await sessionStore.getUserOboToken(req.sessionID, appIdentifier);

			logger.info('Cached obo token: ' + oboToken ? JSON.stringify(oboToken) : undefined);

			if (!oboToken) {
				oboToken = await createOnBehalfOfToken(appIdentifier, authClient, userTokenSet.accessToken);
				logger.info('New obo: ' + JSON.stringify(oboToken));
				await sessionStore.setUserOboToken(req.sessionID, appIdentifier, oboToken);
			}

			req.headers['Authorization'] = `Bearer ${oboToken.accessToken}`;

			next();
		}), createProxyMiddleware(proxyFrom, {
			target: proxy.to,
			logLevel: 'debug',
			logProvider: () => logger,
			changeOrigin: true,
			pathRewrite: proxy.preserveContextPath ? undefined : {
				[`^${proxyFrom}`]: ''
			},
			onError: (error, request, response) => {
				logger.error(`onError, error=${error.message}`);
			}
		}));
	});
};