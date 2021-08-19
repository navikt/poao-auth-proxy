import { Request } from 'express';
import { Issuer, Client } from 'openid-client';
import { logger } from '../logger';
import { JWKS } from '../utils/auth-utils';

export async function createIssuer(discoveryUrl: string): Promise<Issuer<Client>> {
	return Issuer.discover(discoveryUrl);
}

export function createClient(issuer: Issuer<Client>, clientId: string, jwks: JWKS): Client {
	return new issuer.Client({
		client_id: clientId,
		token_endpoint_auth_method: 'private_key_jwt',
		token_endpoint_auth_signing_alg: 'RS256',
	}, jwks);
}

export function createAuthorizationUrl(params: { client: Client, redirect_uri: string, nonce: string, state: string }): string {
	return params.client.authorizationUrl({
		response_mode: 'form_post',
		response_type: 'code',
		scope: 'openid profile',
		redirect_uri: params.redirect_uri,
		nonce: params.nonce,
		state: params.state
	});
}

export const isTokenValid = (token: any): boolean => {
	return false;
};

export const createRedirectUrl = (applicationUrl: string, redirectUrl: string | undefined): string => {
	if (!redirectUrl) {
		return applicationUrl;
	} else if (redirectUrl.startsWith(applicationUrl)) {
		return redirectUrl;
	} else {
		logger.warning(`Ikke white listed redirect_uri '${redirectUrl}'`);
		return `${applicationUrl}?error=redirect_uri_rejected`;
	}
};

export const getRedirectUriFromQuery = (applicationUrl: string, request: Request) =>
	createRedirectUrl(applicationUrl, request.query.redirect_uri as string | undefined);

