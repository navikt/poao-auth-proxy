import redis from 'redis';
import { LOGIN_STATE_TIMEOUT_AFTER_SECONDS, LoginState, SessionStore } from './session-store';
import { logger } from '../logger';
import { promisify } from 'util';
import { SessionStorageConfig } from '../config/session-storage-config';
import { getAdjustedExpireInSeconds, getExpiresInSeconds, OboToken, OidcTokenSet } from '../utils/auth-utils';

const createLoginStateKey = (id: string): string => `loginState.${id}`;

const createUserTokensKey = (sessionId: string): string => `sessionId.${sessionId}`;

const createAuthProviderSessionKey = (authProviderSid: string): string => `authProviderSid.${authProviderSid}`;

const createOboTokenKey = (sessionId: string, appIdentifier: string): string => `oboToken.${sessionId}.${appIdentifier}`;

export const createRedisSessionStore = (sessionStorageConfig: SessionStorageConfig): SessionStore => {
	const client = redis.createClient({
		host: sessionStorageConfig.redisHost,
		port: sessionStorageConfig.redisPort,
		password: sessionStorageConfig.redisPassword
	});

	const getAsync = promisify(client.get).bind(client);
	const setAsync = promisify(client.set).bind(client) as (key: string, value: string) => Promise<void>;
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
	}

	return {
		getLoginState(id: string): Promise<LoginState | undefined> {
			return getAsync(createLoginStateKey(id))
				.then(data => {
					return data ? JSON.parse(data) : undefined;
				}).catch(err => {
					logger.error(err);
					return undefined;
				});
		},
		setLoginState(id: string, loginState: LoginState): Promise<void> {
			return setexAsync(createLoginStateKey(id), LOGIN_STATE_TIMEOUT_AFTER_SECONDS, JSON.stringify(loginState))
				.then(() => {})
				.catch(err => {
					logger.error(err);
				});
		},


		getLogoutSessionId(oidcSessionId: string): Promise<string | undefined> {
			return getAsync(createAuthProviderSessionKey(oidcSessionId))
				.then(data => {
					return data || undefined;
				}).catch(err => {
					logger.error(err);
					return undefined;
				});
		},
		setLogoutSessionId(oidcSessionId: string, sessionId: string): Promise<void> {
			return setAsync(createAuthProviderSessionKey(oidcSessionId), sessionId)
				.catch(err => {
					logger.error(err);
				});
		},
		destroyLogoutSessionId(oidcSessionId: string): Promise<void> {
			return delAsync(createAuthProviderSessionKey(oidcSessionId))
				.catch(err => {
					logger.error(err);
				});
		},

		getUserTokenSet(sessionId: string): Promise<OidcTokenSet | undefined> {
			return getAsync(createUserTokensKey(sessionId))
				.then(data => {
					return data ? JSON.parse(data) : undefined;
				}).catch(err => {
					logger.error(err);
					return undefined;
				});
		},
		setUserTokenSet(sessionId: string, tokenSet: OidcTokenSet): Promise<void> {
			return setAsync(createUserTokensKey(sessionId), JSON.stringify(tokenSet))
				.catch(err => {
					logger.error(err);
				});
		},
		destroyUserTokenSet(sessionId: string): Promise<void> {
			return delAsync(createUserTokensKey(sessionId))
				.catch(err => {
					logger.error(err);
				});
		},

		getUserOboToken(sessionId: string, appIdentifier: string): Promise<OboToken | undefined> {
			return getAsync(createOboTokenKey(sessionId, appIdentifier))
				.then(data => {
					return data ? JSON.parse(data) : undefined;
				}).catch(err => {
					logger.error(err);
					return undefined;
				});
		},
		setUserOboToken(sessionId: string, appIdentifier: string, oboToken: OboToken): Promise<void> {
			const expiresInSeconds = getExpiresInSeconds(oboToken.expiresAt);
			const adjustedExpiresInSeconds = getAdjustedExpireInSeconds(expiresInSeconds);

			return setexAsync(createOboTokenKey(sessionId, appIdentifier),adjustedExpiresInSeconds, JSON.stringify(oboToken))
				.then(() => {})
				.catch(err => {
					logger.error(err);
				});
		}
	};
}