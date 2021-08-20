import { Request } from 'express';
import { Issuer, Client } from 'openid-client';
import { logger } from '../logger';
import { JWKS } from '../utils/auth-utils';
import urljoin from 'url-join';

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

export function createAuthorizationUrl(params: { client: Client, redirect_uri: string, nonce: string, codeChallenge: string }): string {
	return params.client.authorizationUrl({
		response_mode: 'query', // TODO: form_post is considered more secure but requires manual use of Redis
		response_type: 'code',
		code_challenge: params.codeChallenge,
		code_challenge_method: 'S256',
		scope: 'openid profile', // TODO: add app scope
		redirect_uri: params.redirect_uri,
		nonce: params.nonce,
	});
}

export const isTokenValid = (token: any): boolean => {
	return false;
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
	return urljoin(applicationUrl, callbackPath);
};

export const getRedirectUriFromQuery = (applicationUrl: string, request: Request) =>
	createUserRedirectUrl(applicationUrl, request.query.redirect_uri as string | undefined);

