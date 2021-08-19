import { Request } from 'express';
import { MemoryStore, Store } from 'express-session';
import { TokenSet } from 'openid-client';
import { logger } from '../logger';

let sessionStore: Store | undefined;

export const createAndInitSessionStore = (): Store => {
	if (sessionStore) {
		return sessionStore;
	}

	sessionStore = new MemoryStore();

	return sessionStore;
};

export const destroySession = (req: Request) => {
	req.session.destroy((error) => {
		if (error) {
			logger.error('Feil ved destroy av session', error);
		}
	});
};

export const storeLoginNonce = (req: Request, nonce: string): void => {
	req.session.nonce = nonce;
};

export const getStoredLoginNonce = (req: Request): string | undefined => {
	return req.session.nonce;
};

export const storeLoginState = (req: Request, state: string): void => {
	req.session.state = state;
};

export const getStoredLoginState = (req: Request): string | undefined => {
	return req.session.state;
};

export const storeTokenSet = (req: Request, tokenSet: TokenSet): void => {
	req.session.tokenSet = tokenSet;
};

export const getStoredTokenSet = (req: Request): TokenSet | undefined => {
	return req.session.tokenSet;
};

export const storeRedirectUri = (req: Request, redirectUri: string): void => {
	req.session.redirectUri = redirectUri;
};

export const getStoredRedirectUri = (req: Request): string | undefined => {
	return req.session.redirectUri;
};

