
export const createSessionCookieName = (applicationName: string): string => {
	return `${applicationName}_session`;
};
