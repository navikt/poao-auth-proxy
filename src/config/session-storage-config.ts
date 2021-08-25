import merge from 'lodash.merge';
import { logger } from '../logger';
import { strToEnum } from '../utils';
import { JsonConfig } from './app-config-resolver';

export enum StoreType {
	REDIS = 'REDIS',
	IN_MEMORY = 'IN_MEMORY'
}

export interface SessionStorageConfig {
	storeType: StoreType;
	redisHost?: string;
	redisPort?: string;
	redisPassword?: string;
}

const DEFAULT_STORE_TYPE = StoreType.IN_MEMORY;

export const logSessionStorageConfig = (config: SessionStorageConfig): void => {
	const { storeType, redisHost, redisPort } = config;
	logger.info(`Session storage config: storeType=${storeType} redisHost=${redisHost || 'N/A'} redisPort=${redisPort || 'N/A'}`);
}

export const resolveSessionStorageConfig = (jsonConfig: JsonConfig): SessionStorageConfig => {
	const configFromEnv = resolveSessionStorageConfigFromEnvironment();
	const configFromJson = resolveSessionStorageConfigFromJson(jsonConfig);

	const mergedConfig = merge({}, configFromEnv, configFromJson);

	if (!mergedConfig.storeType) {
		mergedConfig.storeType = DEFAULT_STORE_TYPE;
	}

	validateSessionStorageConfig(mergedConfig);

	return mergedConfig as SessionStorageConfig;
};

const resolveSessionStorageConfigFromEnvironment = (): Partial<SessionStorageConfig> => {
	return {
		storeType: strToEnum(process.env.SESSION_STORAGE_STORE_TYPE, StoreType),
		redisHost: process.env.SESSION_STORAGE_REDIS_HOST,
		redisPort: process.env.SESSION_STORAGE_REDIS_PORT,
		redisPassword: process.env.SESSION_STORAGE_REDIS_PORT
	};
};

const resolveSessionStorageConfigFromJson = (jsonConfig: JsonConfig): Partial<SessionStorageConfig> => {
	return jsonConfig.sessionStorage;
};

const validateSessionStorageConfig = (config: Partial<SessionStorageConfig>): void => {
	const { storeType, redisHost, redisPort, redisPassword } = config;

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

		if (!redisPassword) {
			throw new Error(`'Redis password' is missing`);
		}

	}

}
