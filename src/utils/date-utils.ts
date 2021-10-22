
export const getSecondsUntil = (epoch: number): number => {
	const msUntil = epoch - Date.now();

	if (msUntil < 0) {
		return 0;
	}

	return Math.ceil(msUntil / 1000);
};

export const getNowPlusSeconds = (seconds: number): Date => {
	const plusMs = seconds * 1000;
	const nowEpoch = Date.now();

	return new Date(nowEpoch + plusMs);
};
