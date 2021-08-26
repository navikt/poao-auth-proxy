import { existsSync, readFileSync } from 'fs';

import { logger } from '../utils/logger';
import { AuthConfig, logAuthConfig, resolveOidcConfig } from './auth-config';
import { resolveBaseConfig } from './base-config';
import { CorsConfig, logCorsConfig, resolveCorsConfig } from './cors-config';
import { ProxyConfig, logProxyConfig, resolveProxyConfig } from './proxy-config';
import { SessionCookieConfig, logSessionCookieConfig, resolveSessionCookieConfig } from './session-cookie-config';
import { SessionStorageConfig, logSessionStorageConfig, resolveSessionStorageConfig } from './session-storage-config';

export interface JsonConfig {
	[key: string]: any;
}

export interface AppConfig {
	port: number;
	applicationUrl: string;
	applicationName: string;
	auth: AuthConfig;
	cors: CorsConfig;
	sessionCookie: SessionCookieConfig;
	sessionStorage: SessionStorageConfig;
	proxy: ProxyConfig;
}

export function createAppConfig(): AppConfig {
	const baseConfig = resolveBaseConfig();

	const jsonConfig = baseConfig.jsonConfig
		? JSON.parse(baseConfig.jsonConfig)
		: readConfigFile(baseConfig.jsonConfigFilePath);

	return {
		port: baseConfig.port,
		applicationUrl: baseConfig.applicationUrl,
		applicationName: baseConfig.applicationName,
		auth: resolveOidcConfig(jsonConfig),
		cors: resolveCorsConfig(jsonConfig),
		sessionCookie: resolveSessionCookieConfig(baseConfig.applicationName, jsonConfig),
		sessionStorage: resolveSessionStorageConfig(jsonConfig),
		proxy: resolveProxyConfig(jsonConfig),
	};
}

export function logAppConfig(appConfig: AppConfig): void {
	logger.info(
		`Config: port=${appConfig.port} applicationName=${appConfig.applicationName} applicationUrl=${appConfig.applicationUrl}`
	);

	logCorsConfig(appConfig.cors);
	logAuthConfig(appConfig.auth);

	logSessionCookieConfig(appConfig.sessionCookie);
	logSessionStorageConfig(appConfig.sessionStorage);

	logProxyConfig(appConfig.proxy);
}

function readConfigFile(configFilePath: string): JsonConfig | undefined {
	if (!existsSync(configFilePath)) return undefined;

	const configStr = readFileSync(configFilePath).toString();

	return JSON.parse(configStr);
}
