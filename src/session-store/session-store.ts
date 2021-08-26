import { OboToken, OidcTokenSet } from '../utils/auth-utils';

// The login state can be removed after some time, f.ex if the user stops the login halfway
export const LOGIN_STATE_TIMEOUT_AFTER_SECONDS = 3600; // 1 hour

export interface LoginState {
	nonce: string;
	state: string;
	codeVerifier: string;
	redirectUri: string;
}

export interface SessionStore {
	getLoginState: (id: string) => Promise<LoginState | undefined>;
	setLoginState: (id: string, loginState: LoginState) => Promise<void>;

	// Uses external session id from the ID-provider as key to find corresponding session ID from the auth-proxy.
	// Used to find the users session ID for frontchannel logout.
	getLogoutSessionId: (oidcSessionId: string) => Promise<string | undefined>;
	setLogoutSessionId: (oidcSessionId: string, sessionId: string) => Promise<void>;
	destroyLogoutSessionId: (oidcSessionId: string) => Promise<void>;

	getUserTokenSet: (sessionId: string) => Promise<OidcTokenSet | undefined>;
	setUserTokenSet: (sessionId: string, tokenSet: OidcTokenSet) => Promise<void>;
	destroyUserTokenSet: (sessionId: string) => Promise<void>;

	getUserOboToken: (sessionId: string, appIdentifier: string) => Promise<OboToken | undefined>;
	setUserOboToken: (sessionId: string, appIdentifier: string, oboToken: OboToken) => Promise<void>;
}
