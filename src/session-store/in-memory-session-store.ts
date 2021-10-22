import { LoginState, SessionStore } from './session-store';
import { getSecondsUntil } from '../utils/date-utils';
import { getExpiresInSecondWithClockSkew, OboToken, OidcTokenSet } from '../utils/auth-token-utils';

// NB: This SessionStore implementation is unsafe to use in production

const store: {
	loginState: { [key: string]: any };
	idProviderSession: { [key: string]: string | undefined };
	userTokens: { [key: string]: any };
	oboTokens: { [key: string]: any };
	refreshAllowedWithin: { [key: string]: Date | undefined }
} = {
	loginState: {},
	idProviderSession: {},
	userTokens: {},
	oboTokens: {},
	refreshAllowedWithin: {}
};

export const inMemorySessionStore: SessionStore = {
	getLoginState(id: string): Promise<LoginState | undefined> {
		return Promise.resolve(store.loginState[id]);
	},
	setLoginState(id: string, expiresInSeconds: number, loginState: LoginState): Promise<void> {
		store.loginState[id] = loginState;

		setTimeout(() => {
			delete store.loginState[id];
		}, expiresInSeconds * 1000);

		return Promise.resolve();
	},

	getRefreshAllowedWithin(sessionId: string): Promise<Date | undefined> {
		return Promise.resolve(store.refreshAllowedWithin[sessionId]);
	},
	setRefreshAllowedWithin(sessionId: string, expiresInSeconds: number, refreshAllowedWithin: Date): Promise<void> {
		store.refreshAllowedWithin[sessionId] = refreshAllowedWithin;

		setTimeout(() => {
			delete store.refreshAllowedWithin[sessionId];
		}, expiresInSeconds * 1000);

		return Promise.resolve();
	},
	destroyRefreshAllowedWithin(sessionId: string): Promise<void> {
		delete store.refreshAllowedWithin[sessionId];
		return Promise.resolve();
	},

	getLogoutSessionId(oidcSessionId: string): Promise<string | undefined> {
		return Promise.resolve(store.idProviderSession[oidcSessionId]);
	},
	setLogoutSessionId(oidcSessionId: string, expiresInSeconds: number, sessionId: string): Promise<void> {
		store.idProviderSession[oidcSessionId] = sessionId;

		setTimeout(() => {
			delete store.idProviderSession[oidcSessionId];
		}, expiresInSeconds * 1000);

		return Promise.resolve(undefined);
	},
	destroyLogoutSessionId(oidcSessionId: string): Promise<void> {
		delete store.idProviderSession[oidcSessionId];
		return Promise.resolve();
	},

	getOidcTokenSet(sessionId: string): Promise<OidcTokenSet | undefined> {
		return Promise.resolve(store.userTokens[sessionId]?.tokenSet);
	},
	setOidcTokenSet(sessionId: string, expiresInSeconds: number, tokenSet: OidcTokenSet): Promise<void> {
		store.userTokens[sessionId] = { tokenSet };

		setTimeout(() => {
			delete store.userTokens[sessionId];
		}, expiresInSeconds * 1000);

		return Promise.resolve();
	},
	destroyOidcTokenSet(sessionId: string): Promise<void> {
		delete store.userTokens[sessionId];
		return Promise.resolve();
	},

	getUserOboToken(sessionId: string, appIdentifier: string): Promise<OboToken | undefined> {
		if (!store.oboTokens[sessionId]) {
			return Promise.resolve(undefined);
		}

		return Promise.resolve(store.oboTokens[sessionId][appIdentifier]);
	},
	setUserOboToken(sessionId: string, appIdentifier: string, expiresInSeconds: number, oboToken: OboToken): Promise<void> {
		if (!store.oboTokens[sessionId]) {
			store.oboTokens[sessionId] = {};
		}

		store.oboTokens[sessionId][appIdentifier] = oboToken;

		setTimeout(() => {
			delete store.oboTokens[sessionId][appIdentifier];
		}, expiresInSeconds * 1000);

		return Promise.resolve();
	},
};
