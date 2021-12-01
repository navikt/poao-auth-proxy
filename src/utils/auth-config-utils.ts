import { ProxyApp } from '../config/proxy-config';

export interface JWKS {
	keys: [
		{
			kty: 'oct';
		}
	];
}

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

