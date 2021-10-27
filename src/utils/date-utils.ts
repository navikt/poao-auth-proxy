
export type EpochSecond = number;

export type EpochMs = number;

export const getSecondsUntil = (epochMs: EpochMs): number => {
	const msUntil = epochMs - Date.now();

	if (msUntil < 0) {
		return 0;
	}

	return Math.ceil(msUntil / 1000);
};

export const getNowPlusSeconds = (seconds: number): Date => {
	const plusMs = seconds * 1000;
	const nowEpochMs = Date.now();

	return new Date(nowEpochMs + plusMs);
};
