import express from 'express';
import { logger } from './logger';

const app: express.Application = express();

async function startServer() {
	logger.info('Starting auth-proxy server...');

	app.listen(8080, () => logger.info('Server started successfully'));
}

startServer()
	.catch(err => {
		logger.error('Failed to start server:', err);
	});
