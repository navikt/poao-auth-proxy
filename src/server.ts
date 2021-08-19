import express from 'express';

import { logger } from './logger';
import { setupInternalRoutes } from './routes/internal';
import { createAppConfig, logAppConfig } from './config/app-config';

const app: express.Application = express();

async function startServer() {
	logger.info('Starting auth-proxy server...');

	const appConfig = createAppConfig();

	logAppConfig(appConfig);

	setupInternalRoutes(app);

	app.listen(appConfig.port, () => logger.info('Server started successfully'));
}

startServer().catch((err) => {
	logger.error('Failed to start server:', err);
});
