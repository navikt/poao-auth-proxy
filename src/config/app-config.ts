import { getEnvironmentConfig } from './environment-config';
import { readConfigFile, validateConfig } from './json-config';
import { logger } from '../logger';
import { assert } from '../utils';
import { OidcConfig, resolveOidcConfig } from './oidc-config';

const DEFAULT_PORT = 8080;
const DEFAULT_JSON_CONFIG_FILE_PATH = '/app/config/config.js';

export interface AppConfig {
	port: number;
	oidcConfig: OidcConfig;
	corsDomain?: string;
	applicationUrl: string;
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
		oidcConfig: oidcConfig,
		applicationUrl: assert(environmentConfig.applicationUrl, 'Application url is missing'),
		corsDomain: jsonConfig?.corsDomain || environmentConfig.corsDomain,
	};
}

export function logAppConfig(appConfig: AppConfig): void {
	let logStr = 'App Config\n\n';
	
	logStr += `Port: ${appConfig.port}\n`;

	logStr += `OidcConfig.clientId: ${appConfig.oidcConfig.clientId}`
	logStr += `OidcConfig.discoveryUrl: ${appConfig.oidcConfig.discoveryUrl}`

	logStr += `Cors domain: ${appConfig.corsDomain}\n`;

	logger.info(logStr);
}
