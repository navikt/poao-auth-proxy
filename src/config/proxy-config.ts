import { logger } from '../logger';

export interface ProxyConfig {
	from: string; // Must be a relative path
	to: string;
	appIdentifier: string;
	preserveContextPath?: boolean;
}

export const logProxyConfig = (proxyConfig: ProxyConfig): void => {
	const { from, to, appIdentifier, preserveContextPath } = proxyConfig;
	logger.info(`Proxy: from=${from} to=${to} appIdentifier=${appIdentifier} preserveContextPath=${preserveContextPath}`);
}

export const validateProxyConfig = (proxyConfig: ProxyConfig): void => {
	if (!proxyConfig.from) {
		throw new Error(`The field 'from' is missing from: ${JSON.stringify(proxyConfig)}`);
	}

	if (!proxyConfig.to) {
		throw new Error(`The field 'to' is missing from: ${JSON.stringify(proxyConfig)}`);
	}

	if (!proxyConfig.appIdentifier) {
		throw new Error(`The field 'appIdentifier' is missing from: ${JSON.stringify(proxyConfig)}`);
	}

	if (!proxyConfig.from.startsWith("/")) {
		throw new Error(`'${proxyConfig.from}' is not a relative path starting with '/'`);
	}

	if (proxyConfig.from.startsWith("/internal")) {
		throw new Error(`'${proxyConfig.from}' cannot start with '/internal'`);
	}
}