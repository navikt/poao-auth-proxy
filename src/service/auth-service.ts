import { Client, Issuer, TokenSet } from 'openid-client';
import urlJoin from 'url-join';

import { TokenXConfig } from '../config/auth-config';
import {
	createAzureAdAppIdFromClientId, createNbf,
	createScope,
	JWKS,
	OboToken,
	OidcTokenSet,
	tokenSetToOboToken
} from '../utils/auth-utils';
import { logger } from '../utils/logger';
import { endsWithOneOf } from '../utils/url-utils';

// TODO: Split up into multiple utils files. F.ex auth-client-utils, auth-token-utils ...

export const ALLOWED_REDIRECT_HOSTNAMES = ['nav.no', 'localhost'];

export async function createIssuer(discoveryUrl: string): Promise<Issuer<Client>> {
	return Issuer.discover(discoveryUrl);
}

export function createClient(issuer: Issuer<Client>, clientId: string, jwks: JWKS): Client {
	return new issuer.Client(
		{
			client_id: clientId,
			token_endpoint_auth_method: 'private_key_jwt',
			token_endpoint_auth_signing_alg: 'RS256',
			response_types: ['code'],
		},
		jwks
	);
}

export function createAzureAdAuthorizationUrl(params: {
	client: Client;
	clientId: string;
	redirect_uri: string;
	state: string;
	nonce: string;
	codeChallenge: string;
	enableRefresh: boolean;
}): string {
	const authProxyAppIdentifier = createAzureAdAppIdFromClientId(params.clientId);

	const scope = createScope([
		'openid',
		'profile',
		params.enableRefresh ? 'offline_access' : undefined,
		authProxyAppIdentifier
	]);

	return params.client.authorizationUrl({
		response_mode: 'form_post',
		response_type: 'code',
		code_challenge: params.codeChallenge,
		code_challenge_method: 'S256',
		scope: scope,
		redirect_uri: params.redirect_uri,
		state: params.state,
		nonce: params.nonce,
	});
}

export function createIdPortenAuthorizationUrl(params: {
	client: Client;
	redirect_uri: string;
	state: string;
	nonce: string;
	codeChallenge: string;
	enableRefresh: boolean;
}): string {

	const scope = createScope([
		'openid',
		'profile',
		params.enableRefresh ? 'offline_access' : undefined
	]);

	return params.client.authorizationUrl({
		response_mode: 'form_post',
		response_type: 'code',
		code_challenge: params.codeChallenge,
		code_challenge_method: 'S256',
		scope: scope,
		redirect_uri: params.redirect_uri,
		state: params.state,
		nonce: params.nonce,
	});
}

// Ex: appIdentifier = api://my-cluster.my-namespace.my-app-name/.default
export async function createAzureAdOnBehalfOfToken(
	client: Client,
	appIdentifier: string,
	accessToken: string
): Promise<OboToken> {
	const oboTokenSet = await client.grant(
		{
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
			requested_token_use: 'on_behalf_of',
			scope: appIdentifier,
			assertion: accessToken,
			subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
			subject_token: accessToken,
			audience: appIdentifier,
		},
		{
			clientAssertionPayload: {
				aud: client.issuer.metadata.token_endpoint,
				nbf: createNbf(),
			},
		}
	);

	return tokenSetToOboToken(oboTokenSet);
}

// Its technically not an OBO-token, but for consistency we use the same name as Azure AD.
// appIdentifier=<cluster>:<namespace>:<appname>
export async function createTokenXOnBehalfOfToken(
	client: Client,
	appIdentifier: string,
	accessToken: string,
	tokenXConfig: TokenXConfig
): Promise<OboToken> {
	const oboTokenSet = await client.grant(
		{
			grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
			client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
			scope: appIdentifier,
			subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
			subject_token: accessToken,
			audience: appIdentifier,
		},
		{
			clientAssertionPayload: {
				sub: tokenXConfig.clientId,
				iss: tokenXConfig.clientId,
				aud: client.issuer.metadata.token_endpoint,
				nbf: createNbf(),
			},
		}
	);

	return tokenSetToOboToken(oboTokenSet);
}

export function fetchRefreshedTokenSet(client: Client, refreshToken: string): Promise<TokenSet> {
	return client.refresh(refreshToken, {
		clientAssertionPayload: {
			aud: client.issuer.metadata.token_endpoint,
			nbf: createNbf(),
		}
	});
}

export const isTokenValid = (tokenSet: OidcTokenSet | undefined): boolean => {
	if (!tokenSet) {
		return false;
	}

	// TODO: Use isTokenExpiredOrSoonToBe

	return tokenSet.expiresAt > new Date().getMilliseconds();
};

export const isTokenExpiredOrExpiresSoon = (tokenSet: OidcTokenSet | undefined, howSoonMs: number): boolean => {
	if (!tokenSet) {
		return true;
	}

	return tokenSet.expiresAt < new Date().getMilliseconds() - howSoonMs;
};

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
