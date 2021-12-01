import bodyParser from 'body-parser';
import corsMiddleware from 'cors';
import express from 'express';
import session from 'express-session';

import { AppConfig, createAppConfig, logAppConfig } from './config/app-config-resolver';
import { StoreType } from './config/session-storage-config';
import { setupInternalRoutes } from './route/internal';
import { setupIsAuthenticatedRoute } from './route/is-authenticated';
import { setupProxyRoutes } from './route/proxy';
import { inMemorySessionStore } from './session-store/in-memory-session-store';
import { createRedisSessionStore } from './session-store/redis-session-store';
import { createJWKS } from './utils/auth-config-utils';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { createClient, createIssuer } from './utils/auth-client-utils';
import { createTokenValidator } from './utils/token-validator';

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
		saveUninitialized: true,
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
	app.use(errorHandler);

	const tokenValidator = await createTokenValidator(auth.discoveryUrl, auth.clientId);

	let oboTokenClient;

	if (auth.tokenX) {
		const tokenXIssuer = await createIssuer(auth.tokenX.discoveryUrl);

		oboTokenClient = createClient(tokenXIssuer, auth.tokenX.clientId, createJWKS(auth.tokenX.privateJwk));
	} else {
		const authIssuer = await createIssuer(auth.discoveryUrl);

		oboTokenClient = createClient(authIssuer, auth.clientId, createJWKS(auth.privateJwk))
	}

	const sessionStore =
		sessionStorage.storeType === StoreType.IN_MEMORY
			? inMemorySessionStore
			: createRedisSessionStore(appConfig.sessionStorage);

	setupInternalRoutes(app);

	setupIsAuthenticatedRoute({ app, tokenValidator });

	setupProxyRoutes({ app, appConfig, sessionStore, oboTokenClient, tokenValidator });

	app.listen(appConfig.port, () => logger.info('Server started successfully'));
}

startServer(appConfig).catch((err) => {
	logger.error('Failed to start server:', err);
});
