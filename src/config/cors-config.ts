
export interface CorsConfig {
	origin?: string;
	credentials?: boolean;
	maxAge?: number;
	allowedHeaders?: string | string[];
}

export const defaultCorsConfig: CorsConfig = {
	credentials: true,
	maxAge: 7200, // 2 hours. Chrome caps out at this value
	allowedHeaders: ['Nav-Consumer-Id']
};

