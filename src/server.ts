import corsMiddleware from 'cors';
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
import { inMemorySessionStore } from './client/in-memory-session-store';
import { StoreType } from './config/session-storage-config';

const app: express.Application = express();

async function startServer() {
	logger.info('Starting auth-proxy server...');

	const appConfig = createAppConfig();

	logAppConfig(appConfig);

	const { oidc, cors, sessionCookie, sessionStorage } = appConfig;

	app.set('trust proxy', 1);

	const sessionParser = session({
		name: sessionCookie.name,
		secret: sessionCookie.secret,
		resave: false,
		saveUninitialized: true,
		cookie: {
			maxAge: sessionCookie.maxAge,
			secure: sessionCookie.secure,
			httpOnly: sessionCookie.httpOnly,
			sameSite: sessionCookie.sameSite,
		},
	});

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(sessionParser);
	app.use(corsMiddleware({
		origin: cors.origin,
		credentials: cors.credentials,
		maxAge: cors.maxAge,
		allowedHeaders: cors.allowedHeaders
	}));

	const authIssuer = await createIssuer(oidc.discoveryUrl);
	const authClient = createClient(authIssuer, oidc.clientId, createJWKS(oidc.jwk));

	const sessionStore = sessionStorage.storeType === StoreType.IN_MEMORY
		? inMemorySessionStore
		: inMemorySessionStore; // TODO: Replace with redis

	setupInternalRoutes(app);

	setupLoginRoute({ app, appConfig, sessionStore, authClient });
	setupCallbackRoute({ app, appConfig, sessionStore, authClient });
	setupLogoutRoutes({ app, sessionStore });

	setupIsAuthenticatedRoute({ app, sessionStore });
	setupOboTestRoute({ app, sessionStore, authClient });

	setupProxyRoutes({ app, appConfig, sessionStore, authClient });

	app.listen(appConfig.port, () => logger.info('Server started successfully'));
}

startServer().catch((err) => {
	logger.error('Failed to start server:', err);
});
