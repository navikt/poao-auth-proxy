import bodyParser from 'body-parser';
import corsMiddleware from 'cors';
import express from 'express';
import session from 'express-session';

import { AppConfig, createAppConfig, logAppConfig } from './config/app-config-resolver';
import { StoreType } from './config/session-storage-config';
import { setupCallbackRoute } from './route/callback';
import { setupInternalRoutes } from './route/internal';
import { setupIsAuthenticatedRoute } from './route/is-authenticated';
import { setupLoginRoute } from './route/login';
import { setupLogoutRoutes } from './route/logout';
import { setupOboTestRoute } from './route/obo';
import { setupProxyRoutes } from './route/proxy';
import { createClient, createIssuer } from './service/auth-service';
import { inMemorySessionStore } from './session-store/in-memory-session-store';
import { createRedisSessionStore } from './session-store/redis-session-store';
import { createJWKS } from './utils/auth-utils';
import { logger } from './utils/logger';

const app: express.Application = express();

const appConfig = createAppConfig();

async function startServer(appConfig: AppConfig) {
	logger.info('Starting auth-proxy server...');

	logAppConfig(appConfig);

	const { auth, cors, sessionCookie, sessionStorage } = appConfig;

	app.set('trust proxy', 1);

	const sessionParser = session({
		name: sessionCookie.name,
		secret: sessionCookie.secret,
		resave: false,
		saveUninitialized: false,
		proxy: true,
		cookie: {
			maxAge: sessionCookie.maxAge,
			secure: sessionCookie.secure,
			httpOnly: sessionCookie.httpOnly,
			sameSite: sessionCookie.sameSite,
			domain: sessionCookie.domain,
		},
	});

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(sessionParser);
	app.use(
		corsMiddleware({
			origin: cors.origin,
			credentials: cors.credentials,
			maxAge: cors.maxAge,
			allowedHeaders: cors.allowedHeaders,
		})
	);

	const authIssuer = await createIssuer(auth.discoveryUrl);
	const authClient = createClient(authIssuer, auth.clientId, createJWKS(auth.privateJwk));
	let oboTokenClient = authClient;

	if (auth.tokenX) {
		const tokenXIssuer = await createIssuer(auth.tokenX.discoveryUrl);

		oboTokenClient = createClient(tokenXIssuer, auth.tokenX.clientId, createJWKS(auth.tokenX.privateJwk));
	}

	const sessionStore =
		sessionStorage.storeType === StoreType.IN_MEMORY
			? inMemorySessionStore
			: createRedisSessionStore(appConfig.sessionStorage);

	setupInternalRoutes(app);

	setupLoginRoute({ app, appConfig, sessionStore, authClient });
	setupCallbackRoute({ app, appConfig, sessionStore, authClient });
	setupLogoutRoutes({ app, sessionStore });

	setupIsAuthenticatedRoute({ app, sessionStore });
	setupOboTestRoute({ app, appConfig, sessionStore, oboTokenClient });

	setupProxyRoutes({ app, appConfig, sessionStore, oboTokenClient });

	app.listen(appConfig.port, () => logger.info('Server started successfully'));
}

startServer(appConfig).catch((err) => {
	logger.error('Failed to start server:', err);
});
