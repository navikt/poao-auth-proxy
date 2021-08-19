export interface EnvironmentConfig {
	port?: number;
	jsonConfigFilePath?: string;
	jsonConfig?: string;
	corsDomain?: string;
}

export function getEnvironmentConfig(): EnvironmentConfig {
	const environment = new Environment();

	return {
		port: environment.port,
		jsonConfigFilePath: environment.jsonConfigFilePath,
		jsonConfig: environment.jsonConfig,
		corsDomain: environment.corsDomain,
	};
}

export class Environment {

	get port(): number | undefined {
		const portFromEnv = process.env.PORT;
		const port = portFromEnv ? parseInt(portFromEnv) : NaN;
		return isNaN(port) ? undefined : port;
	}

	get jsonConfigFilePath(): string | undefined {
		return process.env.JSON_CONFIG_FILE_PATH;
	}

	get jsonConfig(): string | undefined {
		return process.env.JSON_CONFIG;
	}

	get corsDomain(): string | undefined {
		return process.env.CORS_DOMAIN;
	}

}
