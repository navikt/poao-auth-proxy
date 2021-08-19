import express from 'express';

import { logger } from './logger';
import { setupInternalRoutes } from './routes/internal';

const app: express.Application = express();

async function startServer() {
	logger.info('Starting auth-proxy server...');

	setupInternalRoutes(app);

	app.listen(8080, () => logger.info('Server started successfully'));
}

startServer().catch((err) => {
	logger.error('Failed to start server:', err);
});
