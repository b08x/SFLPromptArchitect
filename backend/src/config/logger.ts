import winston from 'winston';

/**
 * @file Configures the application's logger using Winston.
 * @author Your Name
 */

/**
 * @type {winston.Logger}
 * @description A Winston logger instance for logging application events.
 * In development, it logs to the console and to files. In production, it only logs to the console.
 * @see {@link https://github.com/winstonjs/winston|Winston documentation}
 */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

export default logger;