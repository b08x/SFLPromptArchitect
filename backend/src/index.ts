import express, { Request, Response } from 'express';
import errorHandler from './middleware/errorHandler';
import logger from './config/logger';

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('SFL-Prompt-Architect Backend is running!');
});

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
