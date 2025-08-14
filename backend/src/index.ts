/**
 * @file index.ts
 * @description This is the main entry point for the SFL-Prompt-Architect backend server.
 * It imports the Express application and starts the server.
 *
 * @requires ./app
 * @requires ./config/logger
 * @requires ./config/env
 */

import app from './app';
import logger from './config/logger';
import config from './config/env';

const port = config.port;

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});