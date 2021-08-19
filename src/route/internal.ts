import express from 'express';

export const setupInternalRoutes = (app: express.Application): void => {
	app.get('/internal/ready', (req, res) => {
		res.send('ready');
	});

	app.get('/internal/alive', (req, res) => {
		res.send('alive');
	});
};