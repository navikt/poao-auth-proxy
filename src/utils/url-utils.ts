import { URL } from 'url';

/**
 * Checks if the URL hostname ends with one of the hostnames
 * Ex: url=https://example.test.com hostnames=['test.com'] => true
 * @param url the url to check
 * @param hostnames list of hostnames to validate the url against
 */
export const endsWithOneOf = (url: string, hostnames: string[]): boolean => {
	const urlHostname = new URL(url).hostname;

	for (let i = 0; i < hostnames.length; i++) {
		const hostname = hostnames[i];

		if (urlHostname.endsWith(hostname)) {
			return true;
		}
	}

	return false;
};