import { logger } from '../logger';
import merge from 'lodash.merge';
import { csvStrToStrArray, strToBoolean, strToNumber } from '../utils';
import { JsonConfig } from './app-config-resolver';

export const DEFAULT_CORS_MAX_AGE = 7200; // 2 hours. Chrome caps out at this value
export const DEFAULT_CORS_CREDENTIALS = true;
export const DEFAULT_CORS_ALLOWED_HEADERS = ['Nav-Consumer-Id'];

export interface CorsConfig {
	origin?: string;
	credentials: boolean;
	maxAge: number;
	allowedHeaders: string | string[];
}

export const logCorsConfig = (config: CorsConfig): void => {
	const { origin, credentials, allowedHeaders, maxAge } = config;
	logger.info(`Cors config: origin=${origin} credentials=${credentials} maxAge=${maxAge} allowedHeaders=${allowedHeaders}`);
}

export const resolveCorsConfig = (jsonConfig: JsonConfig): CorsConfig => {
	const configFromEnv = resolveCorsConfigFromEnvironment();
	const configFromJson = resolveCorsConfigFromJson(jsonConfig);

	const mergedConfig = merge({}, configFromEnv, configFromJson);

	if (mergedConfig.maxAge === undefined) {
		mergedConfig.maxAge = DEFAULT_CORS_MAX_AGE;
	}

	if (mergedConfig.credentials === undefined) {
		mergedConfig.credentials = DEFAULT_CORS_CREDENTIALS;
	}

	if (mergedConfig.allowedHeaders === undefined) {
		mergedConfig.allowedHeaders = DEFAULT_CORS_ALLOWED_HEADERS;
	}

	validateCorsConfig(mergedConfig);

	return mergedConfig as CorsConfig;
};

const resolveCorsConfigFromEnvironment = (): Partial<CorsConfig> => {
	return {
		origin: process.env.CORS_ORIGIN,
		credentials: strToBoolean(process.env.CORS_CREDENTIALS),
		maxAge: strToNumber(process.env.CORS_MAX_AGE),
		allowedHeaders: csvStrToStrArray(process.env.CORS_ALLOWED_HEADERS)
	};
};

const resolveCorsConfigFromJson = (jsonConfig: JsonConfig): Partial<CorsConfig> => {
	if (!jsonConfig.cors) return {};

	const allowedHeaders = csvStrToStrArray(jsonConfig.cors.allowedHeaders);

	return {
		...jsonConfig.cors,
		allowedHeaders
	};
};

const validateCorsConfig = (config: Partial<CorsConfig>): void => {
	// TODO
}

