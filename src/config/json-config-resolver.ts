import { existsSync, readFileSync } from 'fs';
import { ProxyConfig } from './app-config';

export interface JsonConfigResolver {
	port?: number;
	corsDomain?: string;
	proxies?: ProxyConfig[];
}

export function readConfigFile(configFilePath: string): JsonConfigResolver | undefined {
	if (!existsSync(configFilePath)) return undefined;

	const configStr = readFileSync(configFilePath).toString();

	return JSON.parse(configStr);
}

export function validateConfig(config: JsonConfigResolver | undefined) {
	if (!config) return;


}