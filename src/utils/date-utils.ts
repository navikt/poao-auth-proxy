
export type EpochSecond = number;

export type EpochMs = number;

export const getSecondsUntil = (epochMs: EpochMs): number => {
	const msUntil = epochMs - Date.now();

	if (msUntil < 0) {
		return 0;
	}

	return Math.ceil(msUntil / 1000);
};
