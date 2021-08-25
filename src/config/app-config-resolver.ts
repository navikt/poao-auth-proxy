import { resolveBaseConfig } from './base-config';
import { logger } from '../logger';
import { logOidcConfig, OidcConfig, resolveOidcConfig } from './oidc-config';
import { CorsConfig, logCorsConfig, resolveCorsConfig } from './cors-config';
import { logProxyConfig, ProxyConfig, resolveProxyConfig } from './proxy-config';
import {
	logSessionCookieConfig,
	resolveSessionCookieConfig,
	SessionCookieConfig
} from './session-cookie-config';
import {
	logSessionStorageConfig,
	resolveSessionStorageConfig,
	SessionStorageConfig,
} from './session-storage-config';
import { existsSync, readFileSync } from "fs";

export interface JsonConfig {
	[key: string]: any;
}

export interface AppConfig {
	port: number;
	applicationUrl: string;
	applicationName: string;
	oidc: OidcConfig;
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
		oidc: resolveOidcConfig(jsonConfig),
		cors: resolveCorsConfig(jsonConfig),
		sessionCookie: resolveSessionCookieConfig(baseConfig.applicationName, jsonConfig),
		sessionStorage: resolveSessionStorageConfig(jsonConfig),
		proxy: resolveProxyConfig(jsonConfig),
	};
}

export function logAppConfig(appConfig: AppConfig): void {
	logger.info(`Config: port=${appConfig.port} applicationName=${appConfig.applicationName} applicationUrl=${appConfig.applicationUrl}`);

	logCorsConfig(appConfig.cors);
	logOidcConfig(appConfig.oidc);

	logSessionCookieConfig(appConfig.sessionCookie);
	logSessionStorageConfig(appConfig.sessionStorage);

	logProxyConfig(appConfig.proxy);
}

function readConfigFile(configFilePath: string): JsonConfig | undefined {
	if (!existsSync(configFilePath)) return undefined;

	const configStr = readFileSync(configFilePath).toString();

	return JSON.parse(configStr);
}
