import { Request } from 'express';
import { Client, Issuer } from 'openid-client';
import { logger } from '../logger';
import { createAppIdentifierFromClientId, JWKS, OboToken, OidcTokenSet, tokenSetToOboToken } from '../utils/auth-utils';
import urlJoin from 'url-join';

export async function createIssuer(discoveryUrl: string): Promise<Issuer<Client>> {
	return Issuer.discover(discoveryUrl);
}

export function createClient(issuer: Issuer<Client>, clientId: string, jwks: JWKS): Client {
	return new issuer.Client({
		client_id: clientId,
		token_endpoint_auth_method: 'private_key_jwt',
		token_endpoint_auth_signing_alg: 'RS256',
		response_types: ['code']
	}, jwks);
}

export function createAuthorizationUrl(params: { client: Client, clientId: string, redirect_uri: string, nonce: string, codeChallenge: string }): string {
	// (Ved idporten-integrasjon må authorzation-kallet inneholde parameteren resource for at tokenet skal inneholde aud)
	// På JSON-format. Feks {"resource": "nav.no"}
	const authProxyAppIdentifier = createAppIdentifierFromClientId(params.clientId);

	return params.client.authorizationUrl({
		response_mode: 'query', // TODO: form_post is considered more secure but requires manual use of Redis
		response_type: 'code',
		code_challenge: params.codeChallenge,
		code_challenge_method: 'S256',
		scope: `openid profile ${authProxyAppIdentifier}`,
		redirect_uri: params.redirect_uri,
		nonce: params.nonce,
	});
}

// Ex: appIdentifier = api://my-cluster.my-namespace.my-app-name/.default
export async function createOnBehalfOfToken(appIdentifier: string, client: Client, accessToken: string): Promise<OboToken> {
	const oboTokenSet = await client.grant({
		grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
		client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
		requested_token_use: 'on_behalf_of',
		scope: appIdentifier,
		assertion: accessToken,
		subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
		subject_token: accessToken,
		audience: appIdentifier,
	}, {
		clientAssertionPayload: {
			aud: client.issuer.metadata.token_endpoint,
			nbf: Math.floor(Date.now() / 1000),
		}
	});

	return tokenSetToOboToken(oboTokenSet);
}

export const isTokenValid = (tokenSet: OidcTokenSet | undefined): boolean => {
	if (!tokenSet) {
		return false;
	}

	// TODO: check expiration etc
	return true;
};

export const createUserRedirectUrl = (applicationUrl: string, redirectUrl: string | undefined): string => {
	if (!redirectUrl) {
		return applicationUrl;
	} else if (redirectUrl.startsWith(applicationUrl)) {
		return redirectUrl;
	} else {
		logger.warning(`Ikke white listed redirect_uri '${redirectUrl}'`);
		return `${applicationUrl}?error=redirect_uri_rejected`;
	}
};

export const createLoginRedirectUrl = (applicationUrl: string, callbackPath: string): string => {
	return urlJoin(applicationUrl, callbackPath);
};

export const getRedirectUriFromQuery = (applicationUrl: string, request: Request) =>
	createUserRedirectUrl(applicationUrl, request.query.redirect_uri as string | undefined);

