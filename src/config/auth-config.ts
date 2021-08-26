import { assert, strToEnum } from '../utils';
import { logger } from '../utils/logger';
import { JsonConfig } from './app-config-resolver';

export enum AuthProvider {
	ID_PORTEN = 'ID_PORTEN',
	AZURE_AD = 'AZURE_AD',
}

export interface AuthConfig {
	authProvider: AuthProvider;
	discoveryUrl: string;
	clientId: string;
	privateJwk: string;
	tokenX?: TokenXConfig;
}

export interface TokenXConfig {
	discoveryUrl: string;
	clientId: string;
	privateJwk: string;
}

export const logAuthConfig = (config: AuthConfig): void => {
	const { authProvider, discoveryUrl, clientId } = config;
	logger.info(`Auth config: authProvider=${authProvider} discoveryUrl=${discoveryUrl} clientId=${clientId}`);
}

export const resolveOidcConfig = (jsonConfig: JsonConfig | undefined): AuthConfig => {
	const authProviderFromEnv = resolveAuthProviderFromEnvironment();
	const authProviderFromJson = resolveAuthProviderFromJson(jsonConfig);

	const authProvider = authProviderFromJson || authProviderFromEnv;

	if (!authProvider) {
		throw new Error(`'Auth provider' is missing`);
	}

	if (authProvider === AuthProvider.AZURE_AD) {
		return resolveAzureAdAuthConfig();
	} else if (authProvider === AuthProvider.ID_PORTEN) {
		const tokenXConfig = resolveTokenXConfig();
		const authConfig = resolveIdPortenAuthConfig();

		return { ...authConfig, tokenX: tokenXConfig };
	} else {
		throw new Error(`Unknown auth provider: ${authProvider}`);
	}
};

const resolveAuthProviderFromEnvironment = (): AuthProvider | undefined => {
	return strToEnum(process.env.AUTH_AUTH_PROVIDER, AuthProvider);
};

const resolveAuthProviderFromJson = (jsonConfig: JsonConfig | undefined): AuthProvider | undefined => {
	if (!jsonConfig?.auth) return undefined;

	return strToEnum(jsonConfig.auth.authProvider, AuthProvider);
};

const resolveAzureAdAuthConfig = (): AuthConfig => {
	const clientId = assert(process.env.AZURE_APP_CLIENT_ID, 'AZURE_APP_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.AZURE_APP_WELL_KNOWN_URL, 'AZURE_APP_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.AZURE_APP_JWK, 'AZURE_APP_JWK is missing');

	return { authProvider: AuthProvider.AZURE_AD, clientId, discoveryUrl, privateJwk: jwk };
};

const resolveIdPortenAuthConfig = (): AuthConfig => {
	const clientId = assert(process.env.IDPORTEN_CLIENT_ID, 'IDPORTEN_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.IDPORTEN_WELL_KNOWN_URL, 'IDPORTEN_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.IDPORTEN_CLIENT_JWK, 'IDPORTEN_CLIENT_JWK is missing');

	return { authProvider: AuthProvider.ID_PORTEN, clientId, discoveryUrl, privateJwk: jwk };
};

const resolveTokenXConfig = (): TokenXConfig => {
	const clientId = assert(process.env.TOKEN_X_CLIENT_ID, 'TOKEN_X_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.TOKEN_X_WELL_KNOWN_URL, 'TOKEN_X_WELL_KNOWN_URL is missing');
	const privateJwk = assert(process.env.TOKEN_X_PRIVATE_JWK, 'TOKEN_X_PRIVATE_JWK is missing');

	return { clientId, discoveryUrl, privateJwk };
};