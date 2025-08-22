/**
 * @file app.ts
 * @description Express application setup for the SFL-Prompt-Studio backend.
 * This file configures the Express app without starting the server,
 * making it suitable for testing and modular usage.
 */

import express, { Request, Response } from 'express';
import errorHandler from './middleware/errorHandler';
import tempAuthMiddleware from './middleware/tempAuth';
import apiRoutes from './api/routes';

const app = express();

app.use(express.json());
// Temporary authentication middleware - replace with real auth
app.use('/api', tempAuthMiddleware);
app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('SFL Prompt Studio Backend is running!');
});

app.use(errorHandler);

export default app;