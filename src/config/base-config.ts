import { assert, strToNumber } from '../utils';
import { ProxyConfig } from './proxy-config';

const DEFAULT_PORT = 8080;
const DEFAULT_JSON_CONFIG_FILE_PATH = '/app/config/config.js';

export interface BaseConfig {
	port: number;
	applicationName: string;
	applicationUrl: string;
	jsonConfigFilePath: string;
	jsonConfig?: string;
}

export function resolveBaseConfig(): BaseConfig {
	const config: Partial<BaseConfig> = {
		port: strToNumber(process.env.PORT),
		applicationName: process.env.APPLICATION_NAME,
		applicationUrl: process.env.APPLICATION_URL,
		jsonConfigFilePath: process.env.JSON_CONFIG_FILE_PATH,
		jsonConfig: process.env.JSON_CONFIG,
	};

	if (!config.port) {
		config.port = DEFAULT_PORT;
	}

	if (!config.applicationName) {
		config.applicationName = process.env.NAIS_APP_NAME;
	}

	if (!config.jsonConfigFilePath) {
		config.jsonConfigFilePath = DEFAULT_JSON_CONFIG_FILE_PATH;
	}

	validateBaseConfig(config);

	return config as BaseConfig;
}

const validateBaseConfig = (config: Partial<BaseConfig>): void => {
	assert(config.applicationName, `'Application name' is missing`);
	assert(config.applicationUrl, `'Application url' is missing`);
};
