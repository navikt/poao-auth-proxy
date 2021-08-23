import { getEnvironmentConfig } from './environment-config-resolver';
import { readConfigFile, validateConfig } from './json-config-resolver';
import { logger } from '../logger';
import { assert } from '../utils';
import { OidcConfig, resolveOidcConfig } from './oidc-config';
import { CorsConfig } from './cors-config';
import { ProxyConfig } from './proxy-config';
import { DEFAULT_SESSION_COOKIE_MAX_AGE, SessionCookieConfig } from './session-cookie-config';
import { SessionStorageConfig } from './session-storage-config';

const DEFAULT_PORT = 8080;
const DEFAULT_JSON_CONFIG_FILE_PATH = '/app/config/config.js';

export interface AppConfig {
	port: number;
	applicationUrl: string;
	applicationName: string;
	oidc: OidcConfig;
	cors: CorsConfig;
	sessionCookie: SessionCookieConfig;
	sessionStorage: SessionStorageConfig;
	proxies: ProxyConfig[];
}

export function createAppConfig(): AppConfig {
	const environmentConfig = getEnvironmentConfig();

	const jsonConfig = environmentConfig.jsonConfig
		? JSON.parse(environmentConfig.jsonConfig)
		: readConfigFile(environmentConfig.jsonConfigFilePath || DEFAULT_JSON_CONFIG_FILE_PATH);

	const oidcProvider = assert(environmentConfig.oidcProvider, 'Missing oidc provider');
	const oidcConfig = resolveOidcConfig(oidcProvider);

	validateConfig(jsonConfig);

	return {
		port: jsonConfig?.port || environmentConfig.port || DEFAULT_PORT,
		oidc: oidcConfig,
		cors: {},
		sessionCookie: {
			name: '',
			secret: '',
			maxAge: DEFAULT_SESSION_COOKIE_MAX_AGE,
			secure: true,
			httpOnly: true,
			sameSite: 'lax'
		},
		sessionStorage: {},
		applicationUrl: assert(environmentConfig.applicationUrl, 'Application url is missing'),
		applicationName: environmentConfig.applicationName,
		proxies: jsonConfig?.proxies || []
	};
}

export function logAppConfig(appConfig: AppConfig): void {
	let logStr = 'App Config\n\n';
	
	logStr += `Port: ${appConfig.port}\n`;

	logStr += `OidcConfig.clientId: ${appConfig.oidc.clientId}`
	logStr += `OidcConfig.discoveryUrl: ${appConfig.oidc.discoveryUrl}`

	logStr += `Cors origin: ${appConfig.cors.origin}\n`;

	logger.info(logStr);
}
