import { SessionStore } from './session-store';
import { OboToken } from '../utils/auth-token-utils';

// NB: This SessionStore implementation might be unstable. Beware before using this in production

const store: {
	oboTokens: { [key: string]: any };
} = {
	oboTokens: {},
};

export const inMemorySessionStore: SessionStore = {
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
