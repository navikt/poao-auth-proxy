import { TokenSet, generators } from 'openid-client';

import { assert, fromBase64 } from './index';
import { ProxyApp } from '../config/proxy-config';

export const CALLBACK_PATH = '/oauth2/callback';

// The OBO token should be considered expired a bit before the actual expiration.
// This is to prevent problems with clock skew and that the token might expire in-flight.
const OBO_TOKEN_EXPIRE_BEFORE_SECONDS = 15;

export interface JWKS {
	keys: [
		{
			kty: 'oct';
		}
	];
}

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

export const generateState = (): string => {
	return generators.state();
};

export const generateNonce = (): string => {
	return generators.nonce();
};

export const generateCodeVerifier = (): string => {
	return generators.codeVerifier();
};

export const generateCodeChallenge = (codeVerifier: string): string => {
	return generators.codeChallenge(codeVerifier);
};

/**
 * Creates an app identifier that is used when requesting tokens for a given application
 * @param appClientId can either be of type 'e89006c5-7193-4ca3-8e26-d0990d9d981f' or 'dev-gcp.aura.nais-testapp'
 */
export const createAzureAdAppIdFromClientId = (appClientId: string): string => {
	return `api://${appClientId}/.default`;
};

export const createAzureAdAppId = (proxyApp: ProxyApp): string => {
	return `api://${proxyApp.cluster}.${proxyApp.namespace}.${proxyApp.name}/.default`;
};

export const createTokenXAppId = (proxyApp: ProxyApp): string => {
	return `${proxyApp.cluster}:${proxyApp.namespace}:${proxyApp.name}`;
};

export const createJWKS = (jwkJson: string): JWKS => {
	const jwk = JSON.parse(jwkJson);

	// UnhandledPromiseRejectionWarning: JWKInvalid: `x5c` member at index 0 is not a valid base64-encoded DER PKIX certificate
	delete jwk.x5c;

	return {
		keys: [jwk],
	};
};

export const getExpiresInSeconds = (expiresAtEpochMs: number): number => {
	const expiresInMs = expiresAtEpochMs - new Date().getMilliseconds();
	return Math.ceil(expiresInMs / 1000);
};

export const getAdjustedExpireInSeconds = (expiresInSeconds: number): number => {
	return expiresInSeconds - OBO_TOKEN_EXPIRE_BEFORE_SECONDS;
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

export const createScope = (scopes: (string | undefined | null)[]): string => {
	return scopes.filter(s => !!s).join(' ');
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
