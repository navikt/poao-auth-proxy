import { OidcProvider } from './oidc-config';
import { assert } from '../utils';

export interface EnvironmentConfig {
	port?: number;
	applicationUrl?: string;
	oidcProvider?: OidcProvider;
	jsonConfigFilePath?: string;
	jsonConfig?: string;
	corsDomain?: string;
	applicationName: string;
}

export function getEnvironmentConfig(): EnvironmentConfig {
	const environment = new Environment();

	return {
		port: environment.port,
		applicationUrl: environment.applicationUrl,
		oidcProvider: environment.oidcProvider,
		jsonConfigFilePath: environment.jsonConfigFilePath,
		jsonConfig: environment.jsonConfig,
		corsDomain: environment.corsDomain,
		applicationName: environment.applicationName
	};
}

export class Environment {

	get port(): number | undefined {
		const portFromEnv = process.env.PORT;
		const port = portFromEnv ? parseInt(portFromEnv) : NaN;
		return isNaN(port) ? undefined : port;
	}

	get applicationUrl(): string | undefined {
		return process.env.APPLICATION_URL;
	}

	get oidcProvider(): OidcProvider | undefined {
		const provider = process.env.OIDC_PROVIDER;

		if (provider && Object.values(OidcProvider).includes(provider as OidcProvider)) {
			return provider as OidcProvider;
		}

		return undefined;
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

	get applicationName(): string {
		return assert(process.env.NAIS_APP_NAME, 'NAIS_APP_NAME is missing');
	}

}
