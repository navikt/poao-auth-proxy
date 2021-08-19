import express from 'express';
import session from 'express-session';

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

const app: express.Application = express();

async function startServer() {
	logger.info('Starting auth-proxy server...');

	const sessionParser = session({
		store: createAndInitSessionStore(),
		name: 'poao-auth-proxy',
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

	app.use(sessionParser);

	const appConfig = createAppConfig();

	const { discoveryUrl, clientId, jwk } = appConfig.oidcConfig;

	const loginIssuer = await createIssuer(discoveryUrl);

	const loginClient = createClient(loginIssuer, clientId, createJWKS(jwk));

	logAppConfig(appConfig);

	app.set('trust proxy', 1);

	setupInternalRoutes(app);

	setupLoginRoutes(app, appConfig, loginClient);
	setupCallbackRoutes(app, appConfig, loginClient);
	setupLogoutRoutes(app);
	setupCheckAuthRoutes(app);

	app.listen(appConfig.port, () => logger.info('Server started successfully'));
}

startServer().catch((err) => {
	logger.error('Failed to start server:', err);
});
