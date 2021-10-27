import { promisify } from 'util';

import redis from 'redis';

import { SessionStorageConfig } from '../config/session-storage-config';
import { logger } from '../utils/logger';
import { LoginState, SessionStore } from './session-store';
import { OboToken, OidcTokenSet } from '../utils/auth-token-utils';

const createLoginStateKey = (id: string): string => `loginState.${id}`;

const createOidcTokenSetKey = (sessionId: string): string => `oidcTokenSet.${sessionId}`;

const createRefreshAllowedWithinEpochKey = (sessionId: string): string => `refreshAllowedWithinEpoch.${sessionId}`;

const createAuthProviderSessionKey = (authProviderSid: string): string => `authProviderSid.${authProviderSid}`;

const createOboTokenKey = (sessionId: string, appIdentifier: string): string => `oboToken.${sessionId}.${appIdentifier}`;

export const createRedisSessionStore = (sessionStorageConfig: SessionStorageConfig): SessionStore => {
	const client = redis.createClient({
		host: sessionStorageConfig.redisHost,
		port: sessionStorageConfig.redisPort,
		password: sessionStorageConfig.redisPassword,
	});

	const getAsync = promisify(client.get).bind(client);

	const setexAsync = promisify(client.setex).bind(client);

	const delAsync = (key: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			client.del(key, (err, reply) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	};

	return {
		getLoginState(id: string): Promise<LoginState | undefined> {
			const key = createLoginStateKey(id);

			return getAsync(key)
				.then((data) => {
					return data ? JSON.parse(data) : undefined;
				})
				.catch(() => {
					logger.error('Failed to getLoginState, key=' + key);
					return undefined;
				});
		},
		setLoginState(id: string, expiresInSeconds: number, loginState: LoginState): Promise<void> {
			const key = createLoginStateKey(id);

			return setexAsync(key, expiresInSeconds, JSON.stringify(loginState))
				.then(() => {})
				.catch(() => {
					const msg = 'Failed to setLoginState, key=' + key;

					logger.error(msg)
					throw new Error(msg);
				});
		},

		getRefreshAllowedWithin(sessionId: string): Promise<Date | undefined> {
			const key = createRefreshAllowedWithinEpochKey(sessionId);

			return getAsync(key)
				.then((data) => {
					return new Date(Number(data)) || undefined;
				})
				.catch(() => {
					logger.error('Failed to getRefreshAllowedWithin, key=' + key);
					return undefined;
				});
		},
		setRefreshAllowedWithin(sessionId: string, expiresInSeconds: number, refreshAllowedWithin: Date): Promise<void> {
			const key = createRefreshAllowedWithinEpochKey(sessionId);

			return setexAsync(key, expiresInSeconds, refreshAllowedWithin.getTime().toString())
				.then(() => {})
				.catch(() => {
					const msg = 'Failed to setRefreshAllowedWithin, key=' + key;

					logger.error(msg);
					throw new Error(msg);
				});
		},
		destroyRefreshAllowedWithin(sessionId: string): Promise<void> {
			const key = createRefreshAllowedWithinEpochKey(sessionId);

			return delAsync(key).catch(() => {
				logger.error('Failed to destroyRefreshAllowedWithin, key=' + key);
			});
		},

		getLogoutSessionId(oidcSessionId: string): Promise<string | undefined> {
			const key = createAuthProviderSessionKey(oidcSessionId);

			return getAsync(key)
				.then((data) => {
					return data || undefined;
				})
				.catch(() => {
					logger.error('Failed to getLogoutSessionId, key=' + key);
					return undefined;
				});
		},
		setLogoutSessionId(oidcSessionId: string, expiresInSeconds: number, sessionId: string): Promise<void> {
			const key = createAuthProviderSessionKey(oidcSessionId);

			return setexAsync(key, expiresInSeconds, sessionId)
				.then(() => {})
				.catch((err) => {
					const msg = 'Failed to setLogoutSessionId, key=' + key;
					logger.error(JSON.stringify(err, ["message", "arguments", "type", "name"]));
					logger.error(msg);
					throw new Error(msg);
				});
		},
		destroyLogoutSessionId(oidcSessionId: string): Promise<void> {
			const key = createAuthProviderSessionKey(oidcSessionId);

			return delAsync(key).catch(() => {
				logger.error('Failed to destroyLogoutSessionId, key=' + key);
			});
		},

		getOidcTokenSet(sessionId: string): Promise<OidcTokenSet | undefined> {
			const key = createOidcTokenSetKey(sessionId);

			return getAsync(key)
				.then((data) => {
					return data ? JSON.parse(data) : undefined;
				})
				.catch(() => {
					logger.error('Failed to getOidcTokenSet, key=' + key);
					return undefined;
				});
		},
		setOidcTokenSet(sessionId: string, expiresInSeconds: number, tokenSet: OidcTokenSet): Promise<void> {
			const key = createOidcTokenSetKey(sessionId);

			return setexAsync(key, expiresInSeconds, JSON.stringify(tokenSet))
				.then(() => {})
				.catch(() => {
					const msg = 'Failed to setOidcTokenSet, key=' + key;

					logger.error(msg);
					throw new Error(msg);
				});
		},
		destroyOidcTokenSet(sessionId: string): Promise<void> {
			const key = createOidcTokenSetKey(sessionId);

			return delAsync(key).catch(() => {
				logger.error('Failed to destroyOidcTokenSet, key=' + key);
			});
		},

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
