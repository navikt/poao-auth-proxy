import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';

import { logger } from './logger';
import { setupInternalRoutes } from './route/internal';
import { createAppConfig, logAppConfig } from './config/app-config';
import { setupLoginRoute } from './route/login';
import { setupCallbackRoute } from './route/callback';
import { createClient, createIssuer } from './service/auth-service';
import { createJWKS } from './utils/auth-utils';
import { setupLogoutRoutes } from './route/logout';
import { setupIsAuthenticatedRoute } from './route/is-authenticated';
import { setupOboTestRoute } from './route/obo';
import { setupProxyRoutes } from './route/proxy';
import { createSessionCookieName } from './utils/cookie-utils';
import { inMemorySessionStore } from './client/in-memory-session-store';

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

	setupLoginRoute({ app, appConfig, sessionStore: inMemorySessionStore, authClient: loginClient });
	setupCallbackRoute({ app, appConfig, sessionStore: inMemorySessionStore, authClient: loginClient });
	setupLogoutRoutes({ app, sessionStore: inMemorySessionStore });

	setupIsAuthenticatedRoute({ app, sessionStore: inMemorySessionStore });
	setupOboTestRoute({ app, sessionStore: inMemorySessionStore, authClient: loginClient });

	setupProxyRoutes({ app, appConfig, sessionStore: inMemorySessionStore, authClient: loginClient });

	app.listen(appConfig.port, () => logger.info('Server started successfully'));
}

startServer().catch((err) => {
	logger.error('Failed to start server:', err);
});
