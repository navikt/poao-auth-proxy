import { readFileSync } from 'fs';
import { logger } from './logger';

const envExtensionPrefix = 'env:';

const fileExtensionPrefix = 'file:';

export const resolveWithExtension = (value: string | undefined): string | undefined => {
	if (value === undefined) {
		return undefined;
	}

	if (value.startsWith(envExtensionPrefix)) {
		return resolveEnvExtension(value);
	} else if (value.startsWith(fileExtensionPrefix)) {
		return resolveFileExtension(value);
	}

	return value;
};

const resolveEnvExtension = (value: string): string | undefined => {
	const envVarName = value.substring(envExtensionPrefix.length);
	return process.env[envVarName];
};

const resolveFileExtension = (value: string): string => {
	const filePath = value.substring(fileExtensionPrefix.length);

	try {
		return readFileSync(filePath).toString();
	} catch (e) {
		logger.error('Failed to value with file extension: ' + value);
		throw new Error('Unable to read env value from file: ' + filePath);
	}
};
