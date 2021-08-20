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

export const storeNonce = (req: Request, nonce: string): void => {
	req.session.nonce = nonce;
};

export const getStoredNonce = (req: Request): string | undefined => {
	return req.session.nonce;
};

export const storeCodeVerifier = (req: Request, codeVerifier: string): void => {
	req.session.codeVerifier = codeVerifier;
};

export const getStoredCodeVerifier = (req: Request): string | undefined => {
	return req.session.codeVerifier;
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

