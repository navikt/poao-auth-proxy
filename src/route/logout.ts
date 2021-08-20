import express from 'express';
import { destroySession } from '../service/session-store-service';

export const setupLogoutRoutes = (app: express.Application): void => {
	app.use('/logout', (req, res) => {
		destroySession(req);
		res.sendStatus(204);
	});
};