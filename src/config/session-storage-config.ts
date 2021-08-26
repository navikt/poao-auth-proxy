import merge from 'lodash.merge';
import { logger } from '../utils/logger';
import { strToEnum, strToNumber } from '../utils';
import { JsonConfig } from './app-config-resolver';

export enum StoreType {
	REDIS = 'REDIS',
	IN_MEMORY = 'IN_MEMORY'
}

export interface SessionStorageConfig {
	storeType: StoreType;
	redisHost?: string;
	redisPort: number;
	redisPassword?: string;
}

const DEFAULT_STORE_TYPE = StoreType.IN_MEMORY;

const DEFAULT_REDIS_PORT = 6379;

export const logSessionStorageConfig = (config: SessionStorageConfig): void => {
	const { storeType, redisHost, redisPort } = config;
	logger.info(`Session storage config: storeType=${storeType} redisHost=${redisHost || 'N/A'} redisPort=${redisPort || 'N/A'}`);
}

export const resolveSessionStorageConfig = (jsonConfig: JsonConfig | undefined): SessionStorageConfig => {
	const configFromEnv = resolveSessionStorageConfigFromEnvironment();
	const configFromJson = resolveSessionStorageConfigFromJson(jsonConfig);

	const mergedConfig = merge({}, configFromEnv, configFromJson);

	if (!mergedConfig.storeType) {
		mergedConfig.storeType = DEFAULT_STORE_TYPE;
	}

	if (!mergedConfig.redisPort) {
		mergedConfig.redisPort = DEFAULT_REDIS_PORT;
	}

	validateSessionStorageConfig(mergedConfig);

	return mergedConfig as SessionStorageConfig;
};

const resolveSessionStorageConfigFromEnvironment = (): Partial<SessionStorageConfig> => {
	return {
		storeType: strToEnum(process.env.SESSION_STORAGE_STORE_TYPE, StoreType),
		redisHost: process.env.SESSION_STORAGE_REDIS_HOST,
		redisPort: strToNumber(process.env.SESSION_STORAGE_REDIS_PORT),
		redisPassword: process.env.SESSION_STORAGE_REDIS_PASSWORD
	};
};

const resolveSessionStorageConfigFromJson = (jsonConfig: JsonConfig | undefined): Partial<SessionStorageConfig> => {
	if (!jsonConfig?.sessionStorage) return {};
	return jsonConfig.sessionStorage;
};

const validateSessionStorageConfig = (config: Partial<SessionStorageConfig>): void => {
	const { storeType, redisHost, redisPort } = config;

	if (!storeType) {
		throw new Error(`'Store type' is missing`);
	}

	if (storeType === StoreType.REDIS) {

		if (!redisHost) {
			throw new Error(`'Redis host' is missing`);
		}

		if (!redisPort) {
			throw new Error(`'Redis port' is missing`);
		}

	}

}
