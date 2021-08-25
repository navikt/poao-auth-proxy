import { TokenSet } from 'openid-client';
import redis from 'redis';
import { LoginState, SessionStore } from './session-store';
import { logger } from '../logger';
import { promisify } from 'util';
import { SessionStorageConfig } from '../config/session-storage-config';

const createLoginStateKey = (id: string): string => `loginState.${id}`;

const createUserTokensKey = (sessionId: string): string => `sessionId.${sessionId}`;

const createAuthProviderSessionKey = (authProviderSid: string): string => `authProviderSid.${authProviderSid}`;

export const createRedisSessionStore = (sessionStorageConfig: SessionStorageConfig): SessionStore => {
	const client = redis.createClient({
		host: sessionStorageConfig.redisHost,
		port: sessionStorageConfig.redisPort,
		password: sessionStorageConfig.redisPassword
	});

	client.on('error', (...args: any[]) => logger.error(args));

	const getAsync = promisify(client.get).bind(client);
	const setAsync = promisify(client.set).bind(client) as (key: string, value: string) => Promise<void>;
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
			return setAsync(createLoginStateKey(id), JSON.stringify(loginState))
				.catch(err => {
					logger.error(err);
				});
		},
		destroyLoginState(id: string): Promise<void> {
			return delAsync(createLoginStateKey(id))
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


		getUserTokenSet(sessionId: string): Promise<TokenSet | undefined> {
			return getAsync(createUserTokensKey(sessionId))
				.then(data => {
					return data ? JSON.parse(data) : undefined;
				}).catch(err => {
					logger.error(err);
					return undefined;
				});
		},
		setUserTokenSet(sessionId: string, tokenSet: TokenSet): Promise<void> {
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
	};
}