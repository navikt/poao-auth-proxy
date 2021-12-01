import { OboToken } from '../utils/auth-token-utils';

export interface SessionStore {
	getUserOboToken: (sessionId: string, appIdentifier: string) => Promise<OboToken | undefined>;
	setUserOboToken: (sessionId: string, appIdentifier: string, expiresInSeconds: number, oboToken: OboToken) => Promise<void>;
}
