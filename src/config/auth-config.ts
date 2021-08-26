import { assert, strToEnum } from '../utils';
import { logger } from '../utils/logger';
import { JsonConfig } from './app-config-resolver';

export enum LoginProvider {
	ID_PORTEN = 'ID_PORTEN',
	AZURE_AD = 'AZURE_AD',
}

export interface AuthConfig {
	loginProvider: LoginProvider;
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
	const { loginProvider, discoveryUrl, clientId } = config;
	logger.info(`Auth config: authProvider=${loginProvider} discoveryUrl=${discoveryUrl} clientId=${clientId}`);
};

export const resolveOidcConfig = (jsonConfig: JsonConfig | undefined): AuthConfig => {
	const loginProviderFromEnv = resolveLoginProviderFromEnvironment();
	const loginProviderFromJson = resolveLoginProviderFromJson(jsonConfig);

	const loginProvider = loginProviderFromJson || loginProviderFromEnv;

	if (!loginProvider) {
		throw new Error(`'Auth provider' is missing`);
	}

	if (loginProvider === LoginProvider.AZURE_AD) {
		return resolveAzureAdAuthConfig();
	} else if (loginProvider === LoginProvider.ID_PORTEN) {
		const tokenXConfig = resolveTokenXConfig();
		const authConfig = resolveIdPortenAuthConfig();

		return { ...authConfig, tokenX: tokenXConfig };
	} else {
		throw new Error(`Unknown auth provider: ${loginProvider}`);
	}
};

const resolveLoginProviderFromEnvironment = (): LoginProvider | undefined => {
	return strToEnum(process.env.AUTH_LOGIN_PROVIDER, LoginProvider);
};

const resolveLoginProviderFromJson = (jsonConfig: JsonConfig | undefined): LoginProvider | undefined => {
	if (!jsonConfig?.auth) return undefined;

	return strToEnum(jsonConfig.auth.loginProvider, LoginProvider);
};

const resolveAzureAdAuthConfig = (): AuthConfig => {
	const clientId = assert(process.env.AZURE_APP_CLIENT_ID, 'AZURE_APP_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.AZURE_APP_WELL_KNOWN_URL, 'AZURE_APP_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.AZURE_APP_JWK, 'AZURE_APP_JWK is missing');

	return { loginProvider: LoginProvider.AZURE_AD, clientId, discoveryUrl, privateJwk: jwk };
};

const resolveIdPortenAuthConfig = (): AuthConfig => {
	const clientId = assert(process.env.IDPORTEN_CLIENT_ID, 'IDPORTEN_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.IDPORTEN_WELL_KNOWN_URL, 'IDPORTEN_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.IDPORTEN_CLIENT_JWK, 'IDPORTEN_CLIENT_JWK is missing');

	return { loginProvider: LoginProvider.ID_PORTEN, clientId, discoveryUrl, privateJwk: jwk };
};

const resolveTokenXConfig = (): TokenXConfig => {
	const clientId = assert(process.env.TOKEN_X_CLIENT_ID, 'TOKEN_X_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.TOKEN_X_WELL_KNOWN_URL, 'TOKEN_X_WELL_KNOWN_URL is missing');
	const privateJwk = assert(process.env.TOKEN_X_PRIVATE_JWK, 'TOKEN_X_PRIVATE_JWK is missing');

	return { clientId, discoveryUrl, privateJwk };
};
