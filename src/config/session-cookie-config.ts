import { logger } from '../logger';

export const DEFAULT_SESSION_COOKIE_MAX_AGE = 43200; // 12 hours
export const DEFAULT_SESSION_COOKIE_SECURE = true;
export const DEFAULT_SESSION_COOKIE_HTTP_ONLY = true;

export interface SessionCookieConfig {
	name: string;
	secret: string | string[];
	maxAge?: number;
	secure: boolean;
	httpOnly: boolean;
	sameSite: 'lax' | 'strict';
}

export const logSessionCookieConfig = (config: SessionCookieConfig): void => {
	const { name, maxAge, secure, httpOnly, sameSite } = config;
	logger.info(`Session Cookie: name=${name} maxAge=${maxAge} secure=${secure} httpOnly=${httpOnly} sameSite=${sameSite}`);
}

export const validateSessionCookieConfig = (config: SessionCookieConfig): void => {

}

export const createSessionCookieName = (applicationName: string): string => {
	return `${applicationName}_session`;
};