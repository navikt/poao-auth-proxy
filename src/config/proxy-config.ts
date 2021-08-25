import { logger } from '../logger';
import { JsonConfig } from './app-config-resolver';

export interface ProxyConfig {
	proxies: Proxy[];
}

export interface Proxy {
	from: string; // Must be a relative path
	to: string;
	appIdentifier: string;
	preserveContextPath?: boolean;
}

export const logProxyConfig = (proxyConfig: ProxyConfig): void => {
	proxyConfig.proxies.forEach(proxy => {
		const { from, to, appIdentifier, preserveContextPath } = proxy;
		logger.info(`Proxy config entry: from=${from} to=${to} appIdentifier=${appIdentifier} preserveContextPath=${preserveContextPath}`);
	});
}

export const resolveProxyConfig = (jsonConfig: JsonConfig | undefined): ProxyConfig => {
	const config = resolveProxyConfigFromJson(jsonConfig);

	if (!config.proxies) {
		config.proxies = [];
	}

	validateProxyConfig(config);

	return config as ProxyConfig;
};

const resolveProxyConfigFromJson = (jsonConfig: JsonConfig | undefined): Partial<ProxyConfig> => {
	if (!jsonConfig?.proxy) return {};
	return jsonConfig.proxy;
};

const validateProxyConfig = (config: Partial<ProxyConfig>): void => {
	if (!config.proxies || config.proxies.length === 0) {
		return;
	}

	config.proxies.forEach((proxy) => {
		if (!proxy.from) {
			throw new Error(`The field 'from' is missing from: ${JSON.stringify(proxy)}`);
		}

		if (!proxy.to) {
			throw new Error(`The field 'to' is missing from: ${JSON.stringify(proxy)}`);
		}

		if (!proxy.appIdentifier) {
			throw new Error(`The field 'appIdentifier' is missing from: ${JSON.stringify(proxy)}`);
		}

		if (!proxy.from.startsWith("/")) {
			throw new Error(`'${proxy.from}' is not a relative path starting with '/'`);
		}

		if (proxy.from.startsWith("/internal")) {
			throw new Error(`'${proxy.from}' cannot start with '/internal'`);
		}
	});
}