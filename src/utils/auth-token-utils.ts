import { TokenSet } from 'openid-client';
import { assert, fromBase64 } from './index';

// The tokens should be considered expired a bit before the actual expiration.
// This is to prevent problems with clock skew and that the token might expire in-flight.
export const EXPIRE_BEFORE_SECONDS = 15;
export const EXPIRE_BEFORE_MS = EXPIRE_BEFORE_SECONDS * 1000;

export interface OidcTokenSet {
	tokenType: string; // Always "Bearer"
	scope: string; // Scopes (permissions) that the access_token has
	expiresAt: number; // Epoch ms timestamp for expiration
	accessToken: string;
	idToken: string;
	refreshToken?: string;
}

export interface OboToken {
	tokenType: string; // Always "Bearer"
	scope: string; // Scopes (permissions) that the OBO token has
	expiresAt: number; // Epoch ms timestamp for expiration
	accessToken: string; // The OBO token
}

export const getExpiresInSecondWithClockSkew = (expiresInSeconds: number): number => {
	return expiresInSeconds - EXPIRE_BEFORE_SECONDS;
};

export const isTokenExpiredOrExpiresSoon = (tokenSet: OidcTokenSet | undefined, howSoonMs: number): boolean => {
	if (!tokenSet) {
		return true;
	}

	return tokenSet.expiresAt < new Date().getTime() - howSoonMs;
};

export const getTokenSid = (jwtTokenStr: string): string | undefined => {
	const tokenBody = getTokenBodyObject(jwtTokenStr);
	return tokenBody.sid;
}

const getTokenBodyObject = (jwtTokenStr: string): { [key: string]: any } => {
	const tokenParts = jwtTokenStr.split('.');

	// All signed JWT tokens should have 3 parts
	if (tokenParts.length !== 3) {
		throw new Error('Invalid token');
	}

	const bodyPartJson = fromBase64(tokenParts[1]);

	return JSON.parse(bodyPartJson);
}


export const createNbf = (): number => {
	return Math.floor(Date.now() / 1000);
};

export const tokenSetToOboToken = (tokenSet: TokenSet): OboToken => {
	return {
		tokenType: assert(tokenSet.token_type, 'Missing token_type'),
		scope: assert(tokenSet.scope, 'Missing scope'),
		expiresAt: assert(tokenSet.expires_at, 'Missing expires_at'),
		accessToken: assert(tokenSet.access_token, 'Missing access_token'),
	};
};

export const tokenSetToOidcTokenSet = (tokenSet: TokenSet): OidcTokenSet => {
	return {
		tokenType: assert(tokenSet.token_type, 'Missing token_type'),
		scope: assert(tokenSet.scope, 'Missing scope'),
		expiresAt: assert(tokenSet.expires_at, 'Missing expires_at'),
		accessToken: assert(tokenSet.access_token, 'Missing access_token'),
		idToken: assert(tokenSet.id_token, 'Missing id_token'),
		refreshToken: tokenSet.refresh_token
	};
};