import { promisify } from 'util';

import redis from 'redis';

import { SessionStorageConfig } from '../config/session-storage-config';
import { logger } from '../utils/logger';
import { SessionStore } from './session-store';
import { OboToken } from '../utils/auth-token-utils';

const createOboTokenKey = (sessionId: string, appIdentifier: string): string => `oboToken.${sessionId}.${appIdentifier}`;

export const createRedisSessionStore = (sessionStorageConfig: SessionStorageConfig): SessionStore => {
	const client = redis.createClient({
		host: sessionStorageConfig.redisHost,
		port: sessionStorageConfig.redisPort,
		password: sessionStorageConfig.redisPassword,
	});

	const getAsync = promisify(client.get).bind(client);

	const setexAsync = promisify(client.setex).bind(client);

	return {
		getUserOboToken(sessionId: string, appIdentifier: string): Promise<OboToken | undefined> {
			const key = createOboTokenKey(sessionId, appIdentifier);

			return getAsync(key)
				.then((data) => {
					return data ? JSON.parse(data) : undefined;
				})
				.catch(() => {
					logger.error('Failed to getUserOboToken, key=' + key);
					return undefined;
				});
		},
		setUserOboToken(sessionId: string, appIdentifier: string, expiresInSeconds: number, oboToken: OboToken): Promise<void> {
			const key = createOboTokenKey(sessionId, appIdentifier);

			return setexAsync(key, expiresInSeconds, JSON.stringify(oboToken))
				.then(() => {})
				.catch(() => {
					const msg = 'Failed to setUserOboToken, key=' + key;

					logger.error(msg);
					throw new Error(msg);
				});
		},
	};
};
