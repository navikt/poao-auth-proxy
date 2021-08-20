import express from 'express';
import { Client } from 'openid-client';
import { getStoredTokenSet } from '../service/session-store-service';
import { createOnBehalfOfToken } from '../service/auth-service';
import { logger } from '../logger';

export const setupOboTestRoute = (app: express.Application, client: Client): void => {
	app.get('/obo', (req, res) => {
		const appId = req.query.appId as string | undefined;

		if (!appId) {
			res.status(400).send();
			return;
		}

		const tokenSet = getStoredTokenSet(req);

		if (!tokenSet) {
			res.status(401).send();
			return;
		}

		createOnBehalfOfToken(appId, client, tokenSet)
			.then(oboTokenSet => {
				res.send({
					oboTokenSet: oboTokenSet
				});
			}).catch(err => {
				logger.error('OBO failed', err);
				res.status(500).send(JSON.stringify(err));
			});
	});
};