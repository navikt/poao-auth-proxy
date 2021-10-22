import urlJoin from 'url-join';
import { endsWithOneOf } from './url-utils';
import { logger } from './logger';
import { generators } from 'openid-client';

export const CALLBACK_PATH = '/oauth2/callback';

export const ALLOWED_REDIRECT_HOSTNAMES = ['nav.no', 'localhost'];

// The login state can be removed after some time, f.ex if the user stops the login halfway
export const LOGIN_STATE_TIMEOUT_AFTER_SECONDS = 3600; // 1 hour

export const createLoginRedirectUrl = (applicationUrl: string, callbackPath: string): string => {
	return urlJoin(applicationUrl, callbackPath);
};

export const safeRedirectUri = (applicationUrl: string, redirectUri: string | undefined) => {
	if (!redirectUri) {
		return applicationUrl;
	}

	if (!endsWithOneOf(redirectUri, ALLOWED_REDIRECT_HOSTNAMES)) {
		logger.warn(`${redirectUri} is not valid, defaulting to application url: ${applicationUrl}`);
		return applicationUrl;
	}

	return redirectUri;
};

export const generateState = (): string => {
	return generators.state();
};

export const generateNonce = (): string => {
	return generators.nonce();
};

export const generateCodeVerifier = (): string => {
	return generators.codeVerifier();
};

export const generateCodeChallenge = (codeVerifier: string): string => {
	return generators.codeChallenge(codeVerifier);
};