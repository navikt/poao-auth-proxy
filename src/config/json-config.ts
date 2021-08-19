import { existsSync, readFileSync } from 'fs';

export interface JsonConfig {
	port?: number;
	corsDomain?: string;
}

export function readConfigFile(configFilePath: string): JsonConfig | undefined {
	if (!existsSync(configFilePath)) return undefined;

	const configStr = readFileSync(configFilePath).toString();

	return JSON.parse(configStr);
}

export function validateConfig(config: JsonConfig | undefined) {
	if (!config) return;
	// TODO: implement later
}