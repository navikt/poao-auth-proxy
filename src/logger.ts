import winston from 'winston';
const { format } = winston;
const { combine, json, timestamp } = format;

export const logger = winston.createLogger({
	level: 'info',
	transports: [
		new winston.transports.Console({
			format: combine(timestamp(), json()),
		})]
});
