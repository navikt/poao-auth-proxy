import { assert, strToEnum } from '../utils';
import { logger } from '../logger';
import { JsonConfig } from './app-config-resolver';

export enum AuthProvider {
	ID_PORTEN = 'ID_PORTEN',
	AZURE_AD = 'AZURE_AD',
}

export interface OidcConfig {
	discoveryUrl: string;
	clientId: string;
	jwk: string;
}

export const logOidcConfig = (config: OidcConfig): void => {
	const { discoveryUrl, clientId } = config;
	logger.info(`OIDC config: discoveryUrl=${discoveryUrl} clientId=${clientId}`);
}

export const resolveOidcConfig = (jsonConfig: JsonConfig | undefined): OidcConfig => {
	const authProviderFromEnv = resolveAuthProviderFromEnvironment();
	const authProviderFromJson = resolveAuthProviderFromJson(jsonConfig);

	const authProvider = authProviderFromJson || authProviderFromEnv;

	if (!authProvider) {
		throw new Error(`'Auth provider' is missing`);
	}

	if (authProvider === AuthProvider.AZURE_AD) {
		return resolveAzureAdOidcConfig();
	} else if (authProvider === AuthProvider.ID_PORTEN) {
		return resolveIdPortenOidcConfig();
	} else {
		throw new Error(`Unknown auth provider: ${authProvider}`);
	}
};

const resolveAuthProviderFromEnvironment = (): AuthProvider | undefined => {
	return strToEnum(process.env.OIDC_AUTH_PROVIDER, AuthProvider);
};

const resolveAuthProviderFromJson = (jsonConfig: JsonConfig | undefined): AuthProvider | undefined => {
	if (!jsonConfig?.oidc) return undefined;

	return strToEnum(jsonConfig.oidc.authProvider, AuthProvider);
};

const resolveAzureAdOidcConfig = (): OidcConfig => {
	const clientId = assert(process.env.AZURE_APP_CLIENT_ID, 'AZURE_APP_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.AZURE_APP_WELL_KNOWN_URL, 'AZURE_APP_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.AZURE_APP_JWK, 'AZURE_APP_JWK is missing');

	return { clientId, discoveryUrl, jwk };
};

const resolveIdPortenOidcConfig = (): OidcConfig => {
	const clientId = assert(process.env.IDPORTEN_CLIENT_ID, 'IDPORTEN_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.IDPORTEN_WELL_KNOWN_URL, 'IDPORTEN_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.IDPORTEN_CLIENT_JWK, 'IDPORTEN_CLIENT_JWK is missing');

	return { clientId, discoveryUrl, jwk };
};