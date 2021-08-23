import { TokenSet } from 'openid-client';
import { LoginState, SessionStore } from './session-store';

const store: { [key: string]: any; } = {};

export const inMemorySessionStore: SessionStore = {
	getLoginState(id: string): Promise<LoginState | undefined> {
		return Promise.resolve(store[id]);
	},
	setLoginState(id: string, loginState: LoginState): Promise<void> {
		store[id] = loginState;
		return Promise.resolve();
	},
	destroyLoginState(id: string): Promise<void> {
		store[id] = undefined;
		return Promise.resolve();
	},


	getLogoutSessionId(oidcSessionId: string): Promise<string | undefined> {
		return Promise.resolve(store[oidcSessionId]);
	},
	setLogoutSessionId(oidcSessionId: string, sessionId: string): Promise<void> {
		store[oidcSessionId] = sessionId;
		return Promise.resolve(undefined);
	},


	getUserTokenSet(sessionId: string): Promise<TokenSet | undefined> {
		return Promise.resolve(store[sessionId]['tokenSet']);
	},
	setUserTokenSet(sessionId: string, tokenSet: TokenSet): Promise<void> {
		store[sessionId]['tokenSet'] = tokenSet;
		return Promise.resolve();
	},


	destroySessionData(sessionId: string): Promise<void> {
		store[sessionId] = undefined;
		return Promise.resolve();
	},
};
