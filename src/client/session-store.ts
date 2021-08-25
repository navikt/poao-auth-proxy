import { TokenSet } from 'openid-client';

export interface LoginState {
	nonce: string;
	codeVerifier: string;
	redirectUri: string;
}

export interface SessionStore {
	getLoginState: (id: string) => Promise<LoginState | undefined>;
	setLoginState: (id: string, loginState: LoginState) => Promise<void>;
	destroyLoginState: (id: string) => Promise<void>;

	// Uses external session id from the ID-provider as key to find corresponding session ID from the auth-proxy. Used to find the users session ID for frontchannel logout.
	getLogoutSessionId: (oidcSessionId: string) => Promise<string | undefined>;
	setLogoutSessionId: (oidcSessionId: string, sessionId: string) => Promise<void>;
	// TODO: Destroy logout session id

	getUserTokenSet: (sessionId: string) => Promise<TokenSet | undefined>;
	setUserTokenSet: (sessionId: string, tokenSet: TokenSet) => Promise<void>;
	destroyUserTokenSet: (sessionId: string) => Promise<void>;
}
