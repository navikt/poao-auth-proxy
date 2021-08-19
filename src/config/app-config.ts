import { getEnvironmentConfig } from './environment-config';
import { readConfigFile, validateConfig } from './json-config';
import { logger } from '../logger';

const DEFAULT_PORT = 8080;
const DEFAULT_JSON_CONFIG_FILE_PATH = '/app/config/config.js';

export interface AppConfig {
	port: number;
	corsDomain?: string;
}

export function createAppConfig(): AppConfig {
	const environmentConfig = getEnvironmentConfig();

	const jsonConfig = environmentConfig.jsonConfig
		? JSON.parse(environmentConfig.jsonConfig)
		: readConfigFile(environmentConfig.jsonConfigFilePath || DEFAULT_JSON_CONFIG_FILE_PATH);

	validateConfig(jsonConfig);

	return {
		port: jsonConfig?.port || environmentConfig.port || DEFAULT_PORT,
		corsDomain: jsonConfig?.corsDomain || environmentConfig.corsDomain,
	};
}

export function logAppConfig(appConfig: AppConfig): void {
	let logStr = 'App Config\n\n';
	
	logStr += `Port: ${appConfig.port}\n`;

	logStr += `Cors domain: ${appConfig.corsDomain}\n`;

	logger.info(logStr);
}
