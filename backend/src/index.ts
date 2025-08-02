/**
 * @file index.ts
 * @description This is the main entry point for the SFL-Prompt-Architect backend server.
 * It sets up the Express application, configures middleware, defines API routes,
 * and starts the server.
 *
 * @requires express
 * @requires ./middleware/errorHandler
 * @requires ./config/logger
 * @requires ./api/routes
 * @requires ./config/env
 */

import express, { Request, Response } from 'express';
import errorHandler from './middleware/errorHandler';
import logger from './config/logger';
import apiRoutes from './api/routes';
import config from './config/env';

const app = express();
const port = config.port;

app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('SFL-Prompt-Architect Backend is running!');
});

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});