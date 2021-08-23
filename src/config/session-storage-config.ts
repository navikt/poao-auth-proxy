import { logger } from '../logger';

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

export class SessionStorageEnvironmentConfig {

	get storeType(): StoreType | undefined {
		// TODO: this logic is duplicated, move to environment-utils.ts?
		const storeType = process.env.STORE_TYPE;

		if (storeType && Object.values(StoreType).includes(storeType as StoreType)) {
			return storeType as StoreType;
		}

		return undefined;
	}

	get redisHost(): string | undefined {
		return process.env.REDIS_HOST;
	}

	get redisPort(): string | undefined {
		return process.env.REDIS_PORT;
	}

	get redisPassword(): string | undefined {
		return process.env.REDIS_PASSWORD;
	}

}



export const logSessionStorageConfig = (config: SessionStorageConfig): void => {
	const { storeType, redisHost, redisPort } = config;
	logger.info(`Session Storage: storeType=${storeType} redisHost=${redisHost || 'N/A'} redisPort=${redisPort || 'N/A'}`);
}

export const validateSessionCookieConfig = (config: SessionStorageConfig): void => {
	const { storeType, redisHost, redisPort, redisPassword } = config;

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
