import express, { Request } from 'express';
import urlJoin from 'url-join';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from '../logger';
import { AppConfig } from '../config/app-config';
import { getStoredTokenSet } from '../service/session-store-service';
import { createOnBehalfOfToken } from '../service/auth-service';
import { Client } from 'openid-client';
import { createAppIdentifierFromClientId } from '../utils/auth-utils';

const PROXY_BASE_PATH = '/proxy';

// const asyncHandler = fn => (req, res, next) =>
// 	Promise
// 		.resolve(fn(req, res, next))
// 		.catch(next)

export const setupProxyRoutes = (app: express.Application, appConfig: AppConfig, client: Client): void => {
	if (!appConfig.proxies) return;

	appConfig.proxies.forEach(proxy => {
		const proxyFrom = urlJoin(PROXY_BASE_PATH, proxy.from);

		// TODO: Rename AppIdentifier
		const appIdentifier = createAppIdentifierFromClientId(proxy.appIdentifier)

		app.use(proxyFrom, async (req, res, next) => {
			try {
				// TODO: Add authentication
				logger.info('Proxying request');

				const storedTokenSet = getStoredTokenSet(req as Request);
				logger.info('Stored token: ' + JSON.stringify(storedTokenSet)); // TODO: Remove

				let oboTokenSet = await createOnBehalfOfToken(appIdentifier, client, storedTokenSet?.access_token);
				logger.info('OBO token: ' + JSON.stringify(oboTokenSet)); // TODO: Remove

				req.headers['Authorization'] = `Bearer ${oboTokenSet.access_token}`;

				next();
			} catch (error) {
				next(error);
			}
		}, createProxyMiddleware(proxyFrom, {
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