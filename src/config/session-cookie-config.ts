import { logger } from '../logger';
import merge from 'lodash.merge';
import { strToBoolean, strToEnum, strToNumber } from '../utils';
import { JsonConfig } from './app-config-resolver';

const DEFAULT_SESSION_COOKIE_MAX_AGE = 43200; // 12 hours
const DEFAULT_SESSION_COOKIE_SECURE = true;
const DEFAULT_SESSION_COOKIE_HTTP_ONLY = true;

enum SameSite {
	LAX = 'lax',
	STRICT = 'strict'
}

export interface SessionCookieConfig {
	name: string;
	secret: string | string[];
	maxAge: number;
	secure: boolean;
	httpOnly: boolean;
	sameSite: SameSite;
}

export const logSessionCookieConfig = (config: SessionCookieConfig): void => {
	const { name, maxAge, secure, httpOnly, sameSite } = config;
	logger.info(`Session cookie config: name=${name} maxAge=${maxAge} secure=${secure} httpOnly=${httpOnly} sameSite=${sameSite}`);
}

export const resolveSessionCookieConfig = (applicationName: string, jsonConfig: JsonConfig | undefined): SessionCookieConfig => {
	const configFromEnv = resolveSessionCookieConfigFromEnvironment();
	const configFromJson = resolveSessionCookieConfigFromJson(jsonConfig);

	const mergedConfig = merge({}, configFromEnv, configFromJson);

	if (!mergedConfig.name) {
		mergedConfig.name = createSessionCookieName(applicationName);
	}

	if (mergedConfig.maxAge === undefined) {
		mergedConfig.maxAge = DEFAULT_SESSION_COOKIE_MAX_AGE;
	}

	if (mergedConfig.secure === undefined) {
		mergedConfig.secure = DEFAULT_SESSION_COOKIE_SECURE;
	}

	if (mergedConfig.httpOnly === undefined) {
		mergedConfig.httpOnly = DEFAULT_SESSION_COOKIE_HTTP_ONLY;
	}

	validateSessionCookieConfig(mergedConfig);

	return mergedConfig as SessionCookieConfig;
};

const resolveSessionCookieConfigFromEnvironment = (): Partial<SessionCookieConfig> => {
	return {
		name: process.env.SESSION_COOKIE_NAME,
		secret: process.env.SESSION_COOKIE_SECRET,
		maxAge: strToNumber(process.env.SESSION_COOKIE_MAX_AGE),
		secure: strToBoolean(process.env.SESSION_COOKIE_SECURE),
		httpOnly: strToBoolean(process.env.SESSION_COOKIE_HTTP_ONLY),
		sameSite: strToEnum(process.env.SESSION_COOKIE_SAME_SITE, SameSite),
	};
};

const resolveSessionCookieConfigFromJson = (jsonConfig: JsonConfig | undefined): Partial<SessionCookieConfig> => {
	if (!jsonConfig?.sessionCookie) return {};
	return jsonConfig.sessionCookie;
};

const validateSessionCookieConfig = (config: Partial<SessionCookieConfig>): void => {
	// TODO
}

const createSessionCookieName = (applicationName: string): string => {
	return `${applicationName}_session`;
};