import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import urlJoin from 'url-join';

import { logger } from './logger';
import { setupInternalRoutes } from './route/internal';
import { createAppConfig, logAppConfig } from './config/app-config';
import { setupLoginRoutes } from './route/login';
import { setupCallbackRoutes } from './route/callback';
import { createClient, createIssuer } from './service/auth-service';
import { createJWKS } from './utils/auth-utils';
import { setupLogoutRoutes } from './route/logout';
import { setupCheckAuthRoutes } from './route/check-auth';
import { createAndInitSessionStore } from './service/session-store-service';
import { setupOboTestRoute } from './route/obo';
import { setupProxyRoutes } from './route/proxy';
import { createSessionCookieName } from './utils/cookie-utils';

const app: express.Application = express();

async function startServer() {
	logger.info('Starting auth-proxy server...');

	const appConfig = createAppConfig();

	const { discoveryUrl, clientId, jwk } = appConfig.oidcConfig;

	const loginIssuer = await createIssuer(discoveryUrl);

	const loginClient = createClient(loginIssuer, clientId, createJWKS(jwk));

	logAppConfig(appConfig);

	app.set('trust proxy', 1);

	const sessionParser = session({
		store: createAndInitSessionStore(),
		name: createSessionCookieName(appConfig.applicationName),
		secret: 'TODO-add-better-secret',
		resave: false,
		saveUninitialized: true,
		cookie: {
			maxAge: 3599000,
			secure: true,
			httpOnly: true,
			sameSite: 'lax',
		},
	});

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(sessionParser);

	setupInternalRoutes(app);

	setupLoginRoutes(app, appConfig, loginClient);
	setupCallbackRoutes(app, appConfig, loginClient);
	setupLogoutRoutes(app);

	setupCheckAuthRoutes(app);
	setupOboTestRoute(app, loginClient);

	setupProxyRoutes(app, appConfig, loginClient);

	app.listen(appConfig.port, () => logger.info('Server started successfully'));
}

startServer().catch((err) => {
	logger.error('Failed to start server:', err);
});
