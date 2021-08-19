import { assert } from '../utils';

export enum OidcProvider {
	ID_PORTEN = 'ID_PORTEN',
	AZURE_AD = 'AZURE_AD',
}

export interface OidcConfig {
	discoveryUrl: string;
	clientId: string;
	jwk: string;
}

export const resolveOidcConfig = (oidcProvider: OidcProvider): OidcConfig => {
	if (oidcProvider === OidcProvider.AZURE_AD) {
		return resolveAzureAdOidcConfig();
	} else if (oidcProvider === OidcProvider.ID_PORTEN) {
		return resolveIdPortenOidcConfig();
	}

	throw new Error('Unknown OIDC provider: ' + oidcProvider);
};

export const resolveAzureAdOidcConfig = (): OidcConfig => {
	const clientId = assert(process.env.AZURE_APP_CLIENT_ID, 'AZURE_APP_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.AZURE_APP_WELL_KNOWN_URL, 'AZURE_APP_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.AZURE_APP_JWK, 'AZURE_APP_JWK is missing');

	return { clientId, discoveryUrl, jwk };
};

export const resolveIdPortenOidcConfig = (): OidcConfig => {
	const clientId = assert(process.env.IDPORTEN_CLIENT_ID, 'IDPORTEN_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.IDPORTEN_WELL_KNOWN_URL, 'IDPORTEN_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.IDPORTEN_CLIENT_JWK, 'IDPORTEN_CLIENT_JWK is missing');

	return { clientId, discoveryUrl, jwk };
};