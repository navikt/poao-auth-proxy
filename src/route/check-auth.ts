import express from 'express';
import { getStoredTokenSet } from '../service/session-store-service';

export const setupCheckAuthRoutes = (app: express.Application): void => {
	app.get('/authenticated', (req, res) => {
		// TODO: Only for debugging
		res.send({
			tokenSet: getStoredTokenSet(req)
		});
	});
};
