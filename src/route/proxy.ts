import express, { Request } from 'express';
import urlJoin from 'url-join';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from '../logger';
import { AppConfig } from '../config/app-config-resolver';
import { createOnBehalfOfToken } from '../service/auth-service';
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
			// TODO: Add authentication
			logger.info('Proxying request');

			const userTokenSet = await sessionStore.getUserTokenSet((req as Request).sessionID);

			logger.info('Stored token: ' + JSON.stringify(userTokenSet)); // TODO: Remove

			let oboTokenSet = await createOnBehalfOfToken(appIdentifier, authClient, userTokenSet?.access_token);
			logger.info('OBO token: ' + JSON.stringify(oboTokenSet)); // TODO: Remove

			req.headers['Authorization'] = `Bearer ${oboTokenSet.access_token}`;

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