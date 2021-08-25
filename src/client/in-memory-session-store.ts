import { TokenSet } from 'openid-client';
import { LoginState, SessionStore } from './session-store';

const store: {
	loginState: { [key: string]: any;  }
	idProviderSession: { [key: string]: string; },
	userTokens: { [key: string]: any; }
} = {
	loginState: {},
	idProviderSession: {},
	userTokens: {}
};

export const inMemorySessionStore: SessionStore = {
	getLoginState(id: string): Promise<LoginState | undefined> {
		return Promise.resolve(store.loginState[id]);
	},
	setLoginState(id: string, loginState: LoginState): Promise<void> {
		store.loginState[id] = loginState;
		return Promise.resolve();
	},
	destroyLoginState(id: string): Promise<void> {
		store.loginState[id] = undefined;
		return Promise.resolve();
	},


	getLogoutSessionId(oidcSessionId: string): Promise<string | undefined> {
		return Promise.resolve(store.idProviderSession[oidcSessionId]);
	},
	setLogoutSessionId(oidcSessionId: string, sessionId: string): Promise<void> {
		store.idProviderSession[oidcSessionId] = sessionId;
		return Promise.resolve(undefined);
	},


	getUserTokenSet(sessionId: string): Promise<TokenSet | undefined> {
		return Promise.resolve(store.userTokens[sessionId]?.tokenSet);
	},
	setUserTokenSet(sessionId: string, tokenSet: TokenSet): Promise<void> {
		store.userTokens[sessionId] = { tokenSet };
		return Promise.resolve();
	},
	destroyUserTokenSet(sessionId: string): Promise<void> {
		store.userTokens[sessionId] = undefined;
		return Promise.resolve();
	},
};
