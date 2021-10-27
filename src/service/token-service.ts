import { Client } from 'openid-client';
import {
	EXPIRE_BEFORE_MS,
	isTokenExpiredOrExpiresSoon,
	OidcTokenSet,
	tokenSetToOidcTokenSet
} from '../utils/auth-token-utils';
import { fetchRefreshedTokenSet } from '../utils/auth-client-utils';
import { getSecondsUntil } from '../utils/date-utils';
import { SessionStore } from '../session-store/session-store';
import { logger } from '../utils/logger';

export async function getOidcTokenSetAndRefreshIfNecessary(
	sessionStore: SessionStore,
	sessionId: string,
	refreshEnabled: boolean,
	refreshClient: Client
): Promise<OidcTokenSet | undefined> {
	let userTokenSet = await sessionStore.getOidcTokenSet(sessionId);

	if (!userTokenSet) {
		logger.info('Could not find token set. session_id=' + sessionId);
		return undefined;
	}

	if (isTokenExpiredOrExpiresSoon(userTokenSet, EXPIRE_BEFORE_MS)) {
		if (!refreshEnabled) {
			logger.info('Token set is about to expire and refresh is not enabled. session_id=' + sessionId);
			return undefined;
		}

		if (!userTokenSet.refreshToken) {
			logger.error('Refresh token is missing from token set. session_id=' + sessionId);
			throw new Error('Refresh token is missing from token set');
		}

		const refreshAllowedWithin = await sessionStore.getRefreshAllowedWithin(sessionId);

		if (!refreshAllowedWithin || Date.now() >= refreshAllowedWithin.getTime()) {
			logger.info('Refresh is no longer allowed. Refresh only allowed before ' + refreshAllowedWithin?.toISOString());
			return undefined;
		}

		const refreshedTokenSet = await fetchRefreshedTokenSet(refreshClient, userTokenSet.refreshToken);
		userTokenSet = tokenSetToOidcTokenSet(refreshedTokenSet);

		logger.info('Refreshed token. session_id=' + sessionId);

		const expiresInSeconds = getSecondsUntil(refreshAllowedWithin.getTime());
		await sessionStore.setOidcTokenSet(sessionId, expiresInSeconds, userTokenSet);
	}

	return userTokenSet;
}
