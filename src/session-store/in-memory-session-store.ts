import { OboToken, OidcTokenSet, getAdjustedExpireInSeconds, getExpiresInSeconds } from '../utils/auth-utils';
import { LOGIN_STATE_TIMEOUT_AFTER_SECONDS, LoginState, SessionStore } from './session-store';

// NB: This SessionStore implementation is unsafe to use in production

const store: {
	loginState: { [key: string]: any };
	idProviderSession: { [key: string]: string | undefined };
	userTokens: { [key: string]: any };
	oboTokens: { [key: string]: any };
} = {
	loginState: {},
	idProviderSession: {},
	userTokens: {},
	oboTokens: {},
};

export const inMemorySessionStore: SessionStore = {
	getLoginState(id: string): Promise<LoginState | undefined> {
		return Promise.resolve(store.loginState[id]);
	},
	setLoginState(id: string, loginState: LoginState): Promise<void> {
		setTimeout(() => {
			delete store.loginState[id];
		}, LOGIN_STATE_TIMEOUT_AFTER_SECONDS * 1000);

		store.loginState[id] = loginState;

		return Promise.resolve();
	},

	getLogoutSessionId(oidcSessionId: string): Promise<string | undefined> {
		return Promise.resolve(store.idProviderSession[oidcSessionId]);
	},
	setLogoutSessionId(oidcSessionId: string, sessionId: string): Promise<void> {
		store.idProviderSession[oidcSessionId] = sessionId;
		return Promise.resolve(undefined);
	},
	destroyLogoutSessionId(oidcSessionId: string): Promise<void> {
		delete store.idProviderSession[oidcSessionId];
		return Promise.resolve();
	},

	getUserTokenSet(sessionId: string): Promise<OidcTokenSet | undefined> {
		return Promise.resolve(store.userTokens[sessionId]?.tokenSet);
	},
	setUserTokenSet(sessionId: string, tokenSet: OidcTokenSet): Promise<void> {
		store.userTokens[sessionId] = { tokenSet };
		return Promise.resolve();
	},
	destroyUserTokenSet(sessionId: string): Promise<void> {
		delete store.userTokens[sessionId];
		return Promise.resolve();
	},

	getUserOboToken(sessionId: string, appIdentifier: string): Promise<OboToken | undefined> {
		if (!store.oboTokens[sessionId]) {
			return Promise.resolve(undefined);
		}

		return Promise.resolve(store.oboTokens[sessionId][appIdentifier]);
	},
	setUserOboToken(sessionId: string, appIdentifier: string, oboToken: OboToken): Promise<void> {
		if (!store.oboTokens[sessionId]) {
			store.oboTokens[sessionId] = {};
		}

		const expiresInSeconds = getExpiresInSeconds(oboToken.expiresAt);
		const adjustedExpiresInSeconds = getAdjustedExpireInSeconds(expiresInSeconds);

		setTimeout(() => {
			delete store.oboTokens[sessionId][appIdentifier];
		}, adjustedExpiresInSeconds * 1000);

		store.oboTokens[sessionId][appIdentifier] = oboToken;

		return Promise.resolve();
	},
};
