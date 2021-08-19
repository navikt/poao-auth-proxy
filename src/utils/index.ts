
export const assert = <T extends any>(value: T | undefined | null, msg?: string): T => {
	if (value == null) {
		throw new Error(msg || 'Value is missing');
	}

	return value;
};