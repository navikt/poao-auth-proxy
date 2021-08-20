import { generators } from 'openid-client';

export const CALLBACK_PATH = '/oauth2/callback';

export interface JWKS {
	keys: [{
		kty: 'oct';
	}],
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
export const createAppIdentifierFromClientId = (appClientId: string): string => {
	return `api://${appClientId}/.default`;
};

export const createJWKS = (jwkJson: string): JWKS => {
	const jwk = JSON.parse(jwkJson);

	// UnhandledPromiseRejectionWarning: JWKInvalid: `x5c` member at index 0 is not a valid base64-encoded DER PKIX certificate
	delete jwk.x5c;

	return {
		keys: [jwk]
	}
}
