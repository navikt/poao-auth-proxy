import merge from 'lodash.merge';

import { assert, strToBoolean, strToEnum } from '../utils';
import { logger } from '../utils/logger';
import { JsonConfig } from './app-config-resolver';

const DEFAULT_AUTH_ENABLE_REFRESH = false;

export enum LoginProvider {
	ID_PORTEN = 'ID_PORTEN',
	AZURE_AD = 'AZURE_AD',
}

export interface AuthConfig {
	loginProvider: LoginProvider;
	discoveryUrl: string;
	clientId: string;
	privateJwk: string;
	enableRefresh: boolean;
	tokenX?: TokenXConfig;
}

interface LoginProviderConfig {
	discoveryUrl: string;
	clientId: string;
	privateJwk: string;
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

export const resolveAuthConfig = (jsonConfig: JsonConfig | undefined): AuthConfig => {
	const authConfigFromEnv = resolveAuthConfigFromEnvironment();
	const authConfigFromJson = resolveAuthConfigFromJson(jsonConfig);

	let authConfig: Partial<AuthConfig> = merge({}, authConfigFromEnv, authConfigFromJson);

	if (authConfig.enableRefresh == null) {
		authConfig.enableRefresh = DEFAULT_AUTH_ENABLE_REFRESH;
	}

	if (authConfig.loginProvider === LoginProvider.AZURE_AD) {
		const loginProviderConfig = resolveAzureAdLoginProviderConfig();

		authConfig = merge({ loginProvider: LoginProvider.AZURE_AD }, authConfig, loginProviderConfig);
	} else if (authConfig.loginProvider === LoginProvider.ID_PORTEN) {
		const loginProviderConfig = resolveIdPortenLoginProviderConfig();
		const tokenXConfig = resolveTokenXConfig();

		authConfig = merge({ loginProvider: LoginProvider.ID_PORTEN, tokenX: tokenXConfig }, authConfig, loginProviderConfig)
	}

	return validateAuthConfig(authConfig);
};

const resolveAuthConfigFromEnvironment = (): Partial<AuthConfig> => {
	return {
		loginProvider: strToEnum(process.env.AUTH_LOGIN_PROVIDER, LoginProvider),
		enableRefresh: strToBoolean(process.env.AUTH_ENABLE_REFRESH)
	};
};

const resolveAuthConfigFromJson = (jsonConfig: JsonConfig | undefined): Partial<AuthConfig> => {
	if (!jsonConfig?.auth) return {};

	return {
		loginProvider: strToEnum(jsonConfig.loginProvider, LoginProvider),
		enableRefresh: strToBoolean(jsonConfig.enableRefresh)
	};
};

const resolveAzureAdLoginProviderConfig = (): LoginProviderConfig => {
	const clientId = assert(process.env.AZURE_APP_CLIENT_ID, 'AZURE_APP_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.AZURE_APP_WELL_KNOWN_URL, 'AZURE_APP_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.AZURE_APP_JWK, 'AZURE_APP_JWK is missing');

	return { clientId, discoveryUrl, privateJwk: jwk };
};

const resolveIdPortenLoginProviderConfig = (): LoginProviderConfig => {
	const clientId = assert(process.env.IDPORTEN_CLIENT_ID, 'IDPORTEN_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.IDPORTEN_WELL_KNOWN_URL, 'IDPORTEN_WELL_KNOWN_URL is missing');
	const jwk = assert(process.env.IDPORTEN_CLIENT_JWK, 'IDPORTEN_CLIENT_JWK is missing');

	return { clientId, discoveryUrl, privateJwk: jwk };
};

const resolveTokenXConfig = (): TokenXConfig => {
	const clientId = assert(process.env.TOKEN_X_CLIENT_ID, 'TOKEN_X_CLIENT_ID is missing');
	const discoveryUrl = assert(process.env.TOKEN_X_WELL_KNOWN_URL, 'TOKEN_X_WELL_KNOWN_URL is missing');
	const privateJwk = assert(process.env.TOKEN_X_PRIVATE_JWK, 'TOKEN_X_PRIVATE_JWK is missing');

	return { clientId, discoveryUrl, privateJwk };
};

const validateAuthConfig = (config: Partial<AuthConfig>): AuthConfig => {
	assert(config.loginProvider, `Auth 'loginProvider' is missing`);

	assert(config.discoveryUrl, `Auth 'discoveryUrl' is missing`);
	assert(config.clientId, `Auth 'clientId' is missing`);
	assert(config.privateJwk, `Auth 'privateJwk' is missing`);

	assert(config.enableRefresh, `Auth 'enableRefresh' is missing`);

	if (config.loginProvider === LoginProvider.ID_PORTEN) {
		assert(config.tokenX, `Auth 'tokenX' is missing`);
	}

	return config as AuthConfig;
};