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
			return getAsync(createLoginStateKey(id))
				.then((data) => {
					return data ? JSON.parse(data) : undefined;
				})
				.catch((err) => {
					logger.error(err);
					return undefined;
				});
		},
		setLoginState(id: string, expiresInSeconds: number, loginState: LoginState): Promise<void> {
			return setexAsync(createLoginStateKey(id), expiresInSeconds, JSON.stringify(loginState))
				.then(() => {})
				.catch((err) => {
					logger.error(err);
				});
		},

		getRefreshAllowedWithin(sessionId: string): Promise<Date | undefined> {
			return getAsync(createRefreshAllowedWithinEpochKey(sessionId))
				.then((data) => {
					return new Date(Number(data)) || undefined;
				})
				.catch((err) => {
					logger.error(err);
					return undefined;
				});
		},
		setRefreshAllowedWithin(sessionId: string, expiresInSeconds: number, refreshAllowedWithin: Date): Promise<void> {
			return setexAsync(createRefreshAllowedWithinEpochKey(sessionId), expiresInSeconds, refreshAllowedWithin.getMilliseconds().toString())
				.then(() => {})
				.catch((err) => {
					logger.error(err);
				});
		},
		destroyRefreshAllowedWithin(sessionId: string): Promise<void> {
			return delAsync(createRefreshAllowedWithinEpochKey(sessionId)).catch((err) => {
				logger.error(err);
			});
		},

		getLogoutSessionId(oidcSessionId: string): Promise<string | undefined> {
			return getAsync(createAuthProviderSessionKey(oidcSessionId))
				.then((data) => {
					return data || undefined;
				})
				.catch((err) => {
					logger.error(err);
					return undefined;
				});
		},
		setLogoutSessionId(oidcSessionId: string, expiresInSeconds: number, sessionId: string): Promise<void> {
			return setexAsync(createAuthProviderSessionKey(oidcSessionId), expiresInSeconds, sessionId)
				.then(() => {})
				.catch((err) => {
					logger.error(err);
				});
		},
		destroyLogoutSessionId(oidcSessionId: string): Promise<void> {
			return delAsync(createAuthProviderSessionKey(oidcSessionId)).catch((err) => {
				logger.error(err);
			});
		},

		getOidcTokenSet(sessionId: string): Promise<OidcTokenSet | undefined> {
			return getAsync(createOidcTokenSetKey(sessionId))
				.then((data) => {
					return data ? JSON.parse(data) : undefined;
				})
				.catch((err) => {
					logger.error(err);
					return undefined;
				});
		},
		setOidcTokenSet(sessionId: string, expiresInSeconds: number, tokenSet: OidcTokenSet): Promise<void> {
			return setexAsync(createOidcTokenSetKey(sessionId), expiresInSeconds, JSON.stringify(tokenSet))
				.then(() => {})
				.catch((err) => {
					logger.error(err);
				});
		},
		destroyOidcTokenSet(sessionId: string): Promise<void> {
			return delAsync(createOidcTokenSetKey(sessionId)).catch((err) => {
				logger.error(err);
			});
		},

		getUserOboToken(sessionId: string, appIdentifier: string): Promise<OboToken | undefined> {
			return getAsync(createOboTokenKey(sessionId, appIdentifier))
				.then((data) => {
					return data ? JSON.parse(data) : undefined;
				})
				.catch((err) => {
					logger.error(err);
					return undefined;
				});
		},
		setUserOboToken(sessionId: string, appIdentifier: string, expiresInSeconds: number, oboToken: OboToken): Promise<void> {
			return setexAsync(createOboTokenKey(sessionId, appIdentifier), expiresInSeconds, JSON.stringify(oboToken))
				.then(() => {})
				.catch((err) => {
					logger.error(err);
				});
		},
	};
};
