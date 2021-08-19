import { generators } from 'openid-client';

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

export const createJWKS = (jwkJson: string): JWKS => {
	const jwk = JSON.parse(jwkJson);

	// UnhandledPromiseRejectionWarning: JWKInvalid: `x5c` member at index 0 is not a valid base64-encoded DER PKIX certificate
	delete jwk.x5c;

	return {
		keys: [jwk]
	}
}
